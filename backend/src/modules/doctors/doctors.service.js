const bcrypt = require('bcryptjs');
const prisma = require('../../config/db');
const { httpError } = require('../../utils/response');

const list = async ({ hospitalId, departmentId, isAvailable, search, skip, limit }) => {
  const where = {
    user: { hospitalId, isActive: true },
    ...(departmentId !== undefined && { departmentId }),
    ...(isAvailable  !== undefined && { isAvailable }),
    ...(search && {
      user: {
        hospitalId,
        OR: [{ name: { contains: search, mode: 'insensitive' } }],
      },
    }),
  };

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where, skip, take: limit,
      orderBy: { currentLoad: 'asc' },
      include: {
        user:       { select: { id: true, name: true, email: true, phone: true } },
        department: { select: { id: true, name: true } },
        patients: {
          where: { isDeleted: false, status: { in: ['WAITING', 'TRIAGED', 'ADMITTED'] } },
          select: { id: true, name: true, priority: true },
          take: 5,
        },
      },
    }),
    prisma.doctor.count({ where }),
  ]);

  return { doctors, total };
};

const getById = async (id, hospitalId) => {
  const doctor = await prisma.doctor.findFirst({
    where: { id, user: { hospitalId } },
    include: {
      user:       { select: { id: true, name: true, email: true, phone: true } },
      department: { select: { id: true, name: true } },
      patients: {
        where: { isDeleted: false, status: { in: ['WAITING', 'TRIAGED', 'ADMITTED'] } },
        select: { id: true, name: true, priority: true, status: true },
      },
      appointments: { orderBy: { scheduledAt: 'desc' }, take: 10 },
    },
  });
  if (!doctor) throw httpError('Doctor not found.', 404);
  return doctor;
};

const toggleAvailability = async (id, hospitalId) => {
  const doctor = await getById(id, hospitalId);
  return prisma.doctor.update({
    where: { id },
    data: { isAvailable: !doctor.isAvailable },
    include: { user: { select: { name: true } }, department: { select: { name: true } } },
  });
};

const getDepartments = async (hospitalId) =>
  prisma.department.findMany({
    where: { hospitalId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { doctors: true } } },
  });

const getWorkloadStats = async (hospitalId) => {
  const doctors = await prisma.doctor.findMany({
    where: { user: { hospitalId } },
    select: {
      id: true, specialization: true, isAvailable: true,
      currentLoad: true, maxWorkload: true,
      user: { select: { name: true } },
      department: { select: { name: true } },
    },
  });
  return doctors.map((d) => ({
    ...d,
    loadPercent: Math.round((d.currentLoad / d.maxWorkload) * 100),
    isOverloaded: d.currentLoad >= d.maxWorkload,
  }));
};

const create = async (data, hospitalId) => {
  const { name, email, phone, password, specialization, departmentId, maxWorkload, isAvailable } = data;
  
  if (!name || !email || !password || !specialization || !departmentId) {
    throw httpError('Missing required fields (name, email, password, specialization, departmentId).', 400);
  }

  const role = await prisma.role.findUnique({ where: { name: 'DOCTOR' } });
  if (!role) throw httpError('Doctor role not found in system.', 500);

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw httpError('Email already registered.', 409);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      hospitalId,
      roleId: role.id,
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      doctor: {
        create: {
          departmentId,
          specialization,
          maxWorkload: maxWorkload ?? 10,
          isAvailable: isAvailable ?? true,
        },
      },
    },
    include: {
      doctor: {
        include: { department: { select: { name: true } } }
      }
    }
  });

  return user.doctor;
};

module.exports = { list, getById, create, toggleAvailability, getDepartments, getWorkloadStats };
