const prisma = require('../../config/db');

const getStats = async (hospitalId) => {
  const [
    totalPatients,
    activePatients,
    criticalPatients,
    waitingPatients,
    availableDoctors,
    totalDoctors,
    availableBeds,
    totalBeds,
    occupiedBeds,
    icuBeds,
    totalResources,
    lowStockResources,
    todayAppointments,
    recentAgentActions,
  ] = await Promise.all([
    prisma.patient.count({ where: { hospitalId, isDeleted: false } }),
    prisma.patient.count({ where: { hospitalId, isDeleted: false, status: { in: ['WAITING', 'TRIAGED', 'ADMITTED'] } } }),
    prisma.patient.count({ where: { hospitalId, isDeleted: false, priority: 'CRITICAL', status: { not: 'DISCHARGED' } } }),
    prisma.patient.count({ where: { hospitalId, isDeleted: false, status: 'WAITING' } }),
    prisma.doctor.count({ where: { user: { hospitalId }, isAvailable: true } }),
    prisma.doctor.count({ where: { user: { hospitalId } } }),
    prisma.bed.count({ where: { hospitalId, status: 'AVAILABLE' } }),
    prisma.bed.count({ where: { hospitalId } }),
    prisma.bed.count({ where: { hospitalId, status: 'OCCUPIED' } }),
    prisma.bed.count({ where: { hospitalId, type: 'ICU', status: 'OCCUPIED' } }),
    prisma.resource.count({ where: { hospitalId } }),
    prisma.resource.count({ where: { hospitalId, quantity: { lte: 0 } } }), // crude — we compare in service
    (() => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end   = new Date(); end.setHours(23, 59, 59, 999);
      return prisma.appointment.count({
        where: { scheduledAt: { gte: start, lte: end }, status: 'SCHEDULED', doctor: { user: { hospitalId } } },
      });
    })(),
    prisma.agentAction.findMany({
      where: { hospitalId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, agentName: true, actionType: true, targetType: true, targetId: true,
        decisionSummary: true, confidenceLevel: true, recommendedAction: true,
        status: true, createdAt: true,
      },
    }),
  ]);

  // Low stock resources
  const allResources = await prisma.resource.findMany({ where: { hospitalId } });
  const lowStock = allResources.filter((r) => r.quantity <= r.threshold).length;
  const criticalStock = allResources.filter((r) => r.quantity <= Math.floor(r.threshold / 2)).length;

  // Priority breakdown
  const priorityBreakdown = await prisma.patient.groupBy({
    by: ['priority'],
    where: { hospitalId, isDeleted: false, status: { not: 'DISCHARGED' } },
    _count: true,
  });

  return {
    patients: {
      total: totalPatients, active: activePatients,
      critical: criticalPatients, waiting: waitingPatients,
    },
    doctors: {
      total: totalDoctors, available: availableDoctors,
      busy: totalDoctors - availableDoctors,
    },
    beds: {
      total: totalBeds, available: availableBeds,
      occupied: occupiedBeds, icuOccupied: icuBeds,
      occupancyRate: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    },
    resources: { total: totalResources, lowStock, criticalStock },
    appointments: { today: todayAppointments },
    priorityBreakdown: Object.fromEntries(priorityBreakdown.map((p) => [p.priority, p._count])),
    recentAgentActions,
  };
};

const getAgentActivity = async (hospitalId, { agentName, limit = 20, skip = 0 }) => {
  const where = { hospitalId, ...(agentName && { agentName }) };
  const [actions, total] = await Promise.all([
    prisma.agentAction.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.agentAction.count({ where }),
  ]);
  return { actions, total };
};

const getNotifications = async (hospitalId, userId, { unreadOnly, skip, limit }) => {
  const where = {
    hospitalId,
    ...(userId     && { OR: [{ userId }, { userId: null }] }),
    ...(unreadOnly && { isRead: false }),
  };
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ]);
  return { notifications, total };
};

const markAsRead = async (id, hospitalId, userId) => {
  const where = {
    id,
    hospitalId,
    ...(userId && { OR: [{ userId }, { userId: null }] })
  };
  return prisma.notification.updateMany({
    where,
    data: { isRead: true },
  });
};

const markAllAsRead = async (hospitalId, userId) => {
  const where = {
    hospitalId,
    isRead: false,
    ...(userId && { OR: [{ userId }, { userId: null }] })
  };
  return prisma.notification.updateMany({
    where,
    data: { isRead: true },
  });
};

module.exports = { getStats, getAgentActivity, getNotifications, markAsRead, markAllAsRead };
