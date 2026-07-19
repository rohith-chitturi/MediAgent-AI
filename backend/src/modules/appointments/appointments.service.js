const prisma = require('../../config/db');
const { httpError } = require('../../utils/response');
const { publishEvent } = require('../../events/eventPublisher');
const { EVENTS } = require('../../events/eventTypes');

const list = async ({ hospitalId, doctorId, patientId, status, skip, limit }) => {
  const where = {
    ...(doctorId  && { doctorId }),
    ...(patientId && { patientId }),
    ...(status    && { status }),
    doctor: { user: { hospitalId } },
  };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where, skip, take: limit,
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { id: true, name: true, phone: true, priority: true } },
        doctor:  { include: { user: { select: { name: true } }, department: { select: { name: true } } } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return { appointments, total };
};

const create = async ({ patientId, doctorId, scheduledAt, notes }, hospitalId) => {
  // Parse and validate the date
  const apptDate = new Date(scheduledAt);
  if (isNaN(apptDate.getTime())) {
    throw httpError('Invalid scheduledAt date — please provide a valid ISO date string.', 400);
  }
  if (apptDate.getTime() < Date.now()) {
    throw httpError('Appointments cannot be scheduled in the past.', 400);
  }

  // Verify doctor belongs to this hospital
  const doctor = await prisma.doctor.findFirst({ where: { id: doctorId, user: { hospitalId } } });
  if (!doctor) throw httpError('Doctor not found.', 404);

  // Verify patient belongs to this hospital
  const patient = await prisma.patient.findFirst({ where: { id: patientId, hospitalId, isDeleted: false } });
  if (!patient) throw httpError('Patient not found.', 404);

  // Check slot conflict (±30 min window)
  const windowStart = new Date(apptDate.getTime() - 30 * 60_000);
  const windowEnd   = new Date(apptDate.getTime() + 30 * 60_000);
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      status: 'SCHEDULED',
      scheduledAt: { gte: windowStart, lte: windowEnd },
    },
  });
  if (conflict) throw httpError('Doctor has a conflicting appointment within 30 minutes.', 409);

  const appointment = await prisma.appointment.create({
    data: { patientId, doctorId, scheduledAt: apptDate, notes },
    include: {
      patient: { select: { name: true, phone: true } },
      doctor:  { include: { user: { select: { name: true } }, department: { select: { name: true } } } },
    },
  });

  await publishEvent(EVENTS.APPOINTMENT_SCHEDULED, hospitalId, appointment);
  return appointment;
};

const updateStatus = async (id, hospitalId, status) => {
  const appt = await prisma.appointment.findFirst({
    where: { id, doctor: { user: { hospitalId } } },
  });
  if (!appt) throw httpError('Appointment not found.', 404);
  return prisma.appointment.update({ where: { id }, data: { status } });
};

const getTodaySchedule = async (hospitalId) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  return prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: start, lte: end },
      status: 'SCHEDULED',
      doctor: { user: { hospitalId } },
    },
    orderBy: { scheduledAt: 'asc' },
    include: {
      patient: { select: { name: true, phone: true } },
      doctor:  { include: { user: { select: { name: true } } } },
    },
  });
};

module.exports = { list, create, updateStatus, getTodaySchedule };
