const prisma = require('../../config/db');
const { publishEvent } = require('../../events/eventPublisher');
const { EVENTS } = require('../../events/eventTypes');
const { httpError } = require('../../utils/response');

const triggerBedAssignedAgent = (hospitalId, bed) => {
  const agentServiceUrl = process.env.AI_AGENT_SERVICE_URL || 'http://localhost:8000';
  fetch(`${agentServiceUrl}/agents/run/background`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-agent-key': process.env.AI_AGENT_API_KEY || 'internal-key',
    },
    body: JSON.stringify({
      event_type: 'bed.assigned',
      hospital_id: hospitalId,
      assigned_bed: bed,
      resource_trigger: 'bed_assigned',
    }),
  }).catch((err) => {
    console.error('[AgentTrigger] Failed to call bed assigned agent service:', err.message);
  });
};

const list = async ({ hospitalId, type, status, ward, skip, limit }) => {
  const where = {
    hospitalId,
    ...(type   && { type }),
    ...(status && { status }),
    ...(ward   && { ward: { contains: ward, mode: 'insensitive' } }),
  };

  const [beds, total] = await Promise.all([
    prisma.bed.findMany({
      where, skip, take: limit,
      orderBy: [{ type: 'asc' }, { number: 'asc' }],
      include: {
        assignment: {
          include: {
            patient: { select: { id: true, name: true, priority: true, status: true } },
          },
        },
      },
    }),
    prisma.bed.count({ where }),
  ]);

  return { beds, total };
};

const getSummary = async (hospitalId) => {
  const [total, available, icu, emergency, general] = await Promise.all([
    prisma.bed.count({ where: { hospitalId } }),
    prisma.bed.count({ where: { hospitalId, status: 'AVAILABLE' } }),
    prisma.bed.groupBy({
      by: ['status'], where: { hospitalId, type: 'ICU' }, _count: true,
    }),
    prisma.bed.groupBy({
      by: ['status'], where: { hospitalId, type: 'EMERGENCY' }, _count: true,
    }),
    prisma.bed.groupBy({
      by: ['status'], where: { hospitalId, type: 'GENERAL' }, _count: true,
    }),
  ]);

  const byType = { ICU: icu, EMERGENCY: emergency, GENERAL: general };
  return { total, available, occupied: total - available, byType };
};

const assign = async (bedId, patientId, assignedBy, hospitalId) => {
  const bed = await prisma.bed.findFirst({ where: { id: bedId, hospitalId } });
  if (!bed)                          throw httpError('Bed not found.', 404);
  if (bed.status !== 'AVAILABLE')    throw httpError('Bed is not available.', 409);

  const existingAssign = await prisma.bedAssignment.findUnique({ where: { patientId } });
  if (existingAssign) throw httpError('Patient already has a bed assigned.', 409);

  const [assignment] = await prisma.$transaction([
    prisma.bedAssignment.create({ data: { bedId, patientId, assignedBy } }),
    prisma.bed.update({ where: { id: bedId }, data: { status: 'OCCUPIED' } }),
    prisma.patient.update({ where: { id: patientId }, data: { status: 'ADMITTED' } }),
  ]);

  await publishEvent(EVENTS.BED_ASSIGNED, hospitalId, { bedId, patientId, hospitalId });

  // Trigger the AI agent to verify resources for this bed type
  triggerBedAssignedAgent(hospitalId, bed);

  return assignment;
};

const release = async (bedId, hospitalId) => {
  // Fetch bed with its current assignment
  const bed = await prisma.bed.findFirst({
    where: { id: bedId, hospitalId },
    include: {
      assignment: { include: { patient: { select: { id: true } } } },
    },
  });
  if (!bed) throw httpError('Bed not found.', 404);

  // If already available — nothing to release
  if (bed.status === 'AVAILABLE') {
    throw httpError('Bed is already available — no active occupancy to release.', 409);
  }

  const ops = [
    // Always mark bed as available
    prisma.bed.update({ where: { id: bedId }, data: { status: 'AVAILABLE' } }),
  ];

  if (bed.assignment) {
    // Mark the patient as WAITING again if they were ADMITTED
    if (bed.assignment.patient?.id) {
      ops.push(
        prisma.patient.update({
          where: { id: bed.assignment.patient.id },
          data: { status: 'WAITING' },
        }),
      );
    }
    // Delete the assignment record so the bed can be re-assigned
    ops.push(prisma.bedAssignment.delete({ where: { bedId } }));
  }

  await prisma.$transaction(ops);

  await publishEvent(EVENTS.BED_RELEASED, hospitalId, { bedId, hospitalId });
  return { message: 'Bed released successfully.' };
};

module.exports = { list, getSummary, assign, release };
