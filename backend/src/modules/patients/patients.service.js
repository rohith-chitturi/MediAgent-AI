const prisma = require('../../config/db');
const { publishEvent } = require('../../events/eventPublisher');
const { EVENTS } = require('../../events/eventTypes');
const { httpError } = require('../../utils/response');

const list = async ({ hospitalId, status, priority, search, skip, limit }) => {
  const where = {
    hospitalId,
    isDeleted: false,
    ...(status   && { status }),
    ...(priority && { priority }),
    ...(search   && {
      OR: [
        { name:  { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ],
    }),
  };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where, skip, take: limit,
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        bedAssignment: { include: { bed: { select: { number: true, type: true, ward: true } } } },
      },
    }),
    prisma.patient.count({ where }),
  ]);

  return { patients, total };
};

const getById = async (id, hospitalId) => {
  const patient = await prisma.patient.findFirst({
    where: { id, hospitalId, isDeleted: false },
    include: {
      doctor: { include: { user: { select: { name: true } }, department: { select: { name: true } } } },
      bedAssignment: { include: { bed: true } },
      appointments: { orderBy: { scheduledAt: 'desc' }, take: 5 },
      callLogs: { orderBy: { initiatedAt: 'desc' }, take: 5 },
    },
  });
  if (!patient) throw httpError('Patient not found.', 404);
  return patient;
};

const register = async (data, hospitalId) => {
  const patient = await prisma.patient.create({
    data: { ...data, hospitalId },
    include: { doctor: { include: { user: { select: { name: true } } } } },
  });

  // Fire-and-forget: trigger AI agent workflow via FastAPI
  // Non-blocking — patient registration succeeds immediately
  const agentServiceUrl = process.env.AI_AGENT_SERVICE_URL || 'http://localhost:8000';
  fetch(`${agentServiceUrl}/agents/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-agent-key': process.env.AI_AGENT_API_KEY || 'internal-key',
    },
    body: JSON.stringify({
      event_type:  'patient.registered',
      hospital_id: hospitalId,
      patient: {
        id:          patient.id,
        name:        patient.name,
        age:         patient.age,
        gender:      patient.gender,
        symptoms:    patient.symptoms,
        priority:    patient.priority,
        status:      patient.status,
        hospital_id: hospitalId,
      },
    }),
  }).catch((err) => {
    // Log but don't fail patient registration if agent service is down
    console.error('[AgentTrigger] Failed to call agent service:', err.message);
  });

  return patient;
};

const update = async (id, hospitalId, data) => {
  await getById(id, hospitalId); // ensure exists
  const patient = await prisma.patient.update({
    where: { id },
    data,
    include: { doctor: { include: { user: { select: { name: true } } } } },
  });

  if (data.status === 'ADMITTED') {
    await publishEvent(EVENTS.PATIENT_ADMITTED, hospitalId, { id, hospitalId });
  }
  if (data.status === 'DISCHARGED') {
    await publishEvent(EVENTS.PATIENT_DISCHARGED, hospitalId, { id, hospitalId });
  }

  return patient;
};

const remove = async (id, hospitalId) => {
  await getById(id, hospitalId);
  await prisma.patient.update({ where: { id }, data: { isDeleted: true } });
};

const assignDoctor = async (patientId, doctorId, hospitalId) => {
  await getById(patientId, hospitalId);
  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: { doctorId, status: 'TRIAGED' },
  });
  const doctor = await prisma.doctor.update({ where: { id: doctorId }, data: { currentLoad: { increment: 1 } } });
  await publishEvent(EVENTS.DOCTOR_ASSIGNED, hospitalId, { patientId, doctorId, hospitalId });
  
  if (doctor.currentLoad >= doctor.maxWorkload) {
    await publishEvent(EVENTS.DOCTOR_OVERLOADED, hospitalId, { doctorId, hospitalId });
  }

  return patient;
};

module.exports = { list, getById, register, update, remove, assignDoctor };
