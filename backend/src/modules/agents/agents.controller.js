const prisma = require('../../config/db');
const { emitToHospital } = require('../../socket/socketServer');
const { publishEvent } = require('../../events/eventPublisher');
const { EVENTS } = require('../../events/eventTypes');
const logger = require('../../utils/logger');

// ─── POST /api/internal/agent-action ─────────────────────────
const logAgentAction = async (req, res, next) => {
  try {
    const {
      hospitalId, runId, agentRunId, agentName, actionType,
      targetType, targetId, decisionSummary, confidenceLevel,
      recommendedAction, status,
    } = req.body;

    const action = await prisma.agentAction.create({
      data: {
        hospitalId,
        agentRunId:       agentRunId ?? null,
        displayRunId:     runId ?? null,
        agentName,
        actionType,
        targetType:       targetType ?? null,
        targetId:         targetId ?? null,
        payload:          {},
        decisionSummary:  decisionSummary ?? null,
        confidenceLevel:  confidenceLevel ?? null,
        recommendedAction: recommendedAction ?? null,
        status:           status ?? 'COMPLETED',
      },
    });

    // Real-time push to hospital room
    emitToHospital(hospitalId, 'agent:action', {
      id:               action.id,
      agentName,
      actionType,
      decisionSummary,
      confidenceLevel,
      recommendedAction,
      displayRunId:     runId,
      createdAt:        action.createdAt,
    });

    res.json({ success: true, data: action });
  } catch (err) { next(err); }
};

// ─── POST /api/internal/agent-runs ───────────────────────────
const createAgentRun = async (req, res, next) => {
  try {
    const { id, displayRunId, hospitalId, patientId } = req.body;
    const run = await prisma.agentRun.create({
      data: { id, displayRunId, hospitalId, patientId, workflowStatus: 'RUNNING' },
    });
    res.json({ success: true, data: run });
  } catch (err) { next(err); }
};

// ─── PATCH /api/internal/agent-runs/:id ──────────────────────
const updateAgentRun = async (req, res, next) => {
  try {
    const { workflowStatus, completedAt, durationMs } = req.body;
    const run = await prisma.agentRun.update({
      where: { id: req.params.id },
      data: {
        workflowStatus,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
        durationMs:  durationMs ?? null,
      },
    });

    // Push run_complete event for dashboard
    emitToHospital(run.hospitalId, 'agent:run_status', {
      id:            run.id,
      displayRunId:  run.displayRunId,
      workflowStatus: run.workflowStatus,
      durationMs:    run.durationMs,
    });

    res.json({ success: true, data: run });
  } catch (err) { next(err); }
};

// ─── GET /api/internal/agent-runs ─────────────────────────────
const listAgentRuns = async (req, res, next) => {
  try {
    const { hospitalId, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [runs, total, stats] = await Promise.all([
      prisma.agentRun.findMany({
        where: { hospitalId },
        orderBy: { startedAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: { actions: { select: { agentName: true, confidenceLevel: true, status: true } } },
      }),
      prisma.agentRun.count({ where: { hospitalId } }),
      // Aggregate stats
      prisma.agentRun.groupBy({
        by: ['workflowStatus'],
        where: { hospitalId },
        _count: true,
      }),
    ]);

    const statusCounts = stats.reduce((acc, s) => {
      acc[s.workflowStatus] = s._count;
      return acc;
    }, { RUNNING: 0, COMPLETED: 0, FAILED: 0, PARTIAL: 0 });

    res.json({ success: true, data: { runs, total, page: parseInt(page), statusCounts } });
  } catch (err) { next(err); }
};

// ─── POST /api/internal/notifications ────────────────────────
const createNotification = async (req, res, next) => {
  try {
    const { hospitalId, title, message, type, channel, metadata } = req.body;
    const notif = await prisma.notification.create({
      data: { hospitalId, title, message, type, channel: channel ?? 'DASHBOARD', metadata: metadata ?? {} },
    });
    emitToHospital(hospitalId, 'notification:new', notif);
    res.json({ success: true, data: notif });
  } catch (err) { next(err); }
};

// ─── POST /api/internal/emit ──────────────────────────────────
const emitEvent = async (req, res, next) => {
  try {
    const { hospitalId, event, data } = req.body;
    emitToHospital(hospitalId, event, data);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ─── PATCH /api/internal/patients/:id ────────────────────────
const updatePatientInternal = async (req, res, next) => {
  try {
    const { priority, triageNotes, status, doctorId } = req.body;
    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        ...(priority    && { priority }),
        ...(triageNotes && { triageNotes }),
        ...(status      && { status }),
        ...(doctorId    && { doctorId }),
      },
    });
    res.json({ success: true, data: patient });
  } catch (err) { next(err); }
};

// ─── PATCH /api/internal/patients/:id/assign-doctor ──────────
const assignDoctorInternal = async (req, res, next) => {
  try {
    const { doctorId } = req.body;
    
    // Fetch patient first to get hospitalId (assuming patient exists)
    const existingPatient = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!existingPatient) return res.status(404).json({ success: false, message: 'Patient not found' });
    const hospitalId = existingPatient.hospitalId;

    const [patient, doctor] = await prisma.$transaction([
      prisma.patient.update({ where: { id: req.params.id }, data: { doctorId, status: 'TRIAGED' } }),
      prisma.doctor.update({ where: { id: doctorId }, data: { currentLoad: { increment: 1 } } }),
    ]);

    await publishEvent(EVENTS.DOCTOR_ASSIGNED, hospitalId, { patientId: req.params.id, doctorId, hospitalId });
    
    if (doctor.currentLoad >= doctor.maxWorkload) {
      await publishEvent(EVENTS.DOCTOR_OVERLOADED, hospitalId, { doctorId, hospitalId });
    }

    res.json({ success: true, data: patient });
  } catch (err) { next(err); }
};

// ─── POST /api/internal/beds/:id/assign ──────────────────────
const assignBedInternal = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    const bed = await prisma.bed.findUnique({ where: { id: req.params.id } });
    if (!bed || bed.status !== 'AVAILABLE') {
      return res.status(409).json({ success: false, message: 'Bed not available.' });
    }
    const existing = await prisma.bedAssignment.findUnique({ where: { patientId } });
    if (existing) return res.status(409).json({ success: false, message: 'Patient already has a bed.' });

    await prisma.$transaction([
      prisma.bedAssignment.create({ data: { bedId: req.params.id, patientId, assignedBy: 'BedAllocationAgent' } }),
      prisma.bed.update({ where: { id: req.params.id }, data: { status: 'OCCUPIED' } }),
      prisma.patient.update({ where: { id: patientId }, data: { status: 'ADMITTED' } }),
    ]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ─── GET /api/internal/beds ───────────────────────────────────
const listBedsInternal = async (req, res, next) => {
  try {
    const { hospitalId, status, limit = 50 } = req.query;
    const beds = await prisma.bed.findMany({
      where: { hospitalId, ...(status && { status }) },
      take: parseInt(limit),
      orderBy: [{ type: 'asc' }, { number: 'asc' }],
    });
    res.json({ success: true, data: { data: beds } });
  } catch (err) { next(err); }
};

// ─── GET /api/internal/doctors ────────────────────────────────
const listDoctorsInternal = async (req, res, next) => {
  try {
    const { hospitalId, isAvailable, limit = 50 } = req.query;
    const doctors = await prisma.doctor.findMany({
      where: {
        user: { hospitalId },
        ...(isAvailable !== undefined && { isAvailable: isAvailable === 'true' }),
      },
      take: parseInt(limit),
      include: {
        user:       { select: { name: true } },
        department: { select: { name: true } },
      },
    });
    res.json({ success: true, data: { data: doctors } });
  } catch (err) { next(err); }
};

// ─── GET /api/internal/resources/low-stock ────────────────────
const listLowStockInternal = async (req, res, next) => {
  try {
    const { hospitalId } = req.query;
    const resources = await prisma.resource.findMany({
      where: { hospitalId, quantity: { lte: prisma.resource.fields.threshold } },
    });
    // Manual filter since Prisma can't compare two fields natively in findMany
    const all = await prisma.resource.findMany({ where: { hospitalId } });
    const low = all.filter((r) => r.quantity <= r.threshold);
    res.json({ success: true, data: { data: low } });
  } catch (err) { next(err); }
};

module.exports = {
  logAgentAction, createAgentRun, updateAgentRun, listAgentRuns,
  createNotification, emitEvent,
  updatePatientInternal, assignDoctorInternal,
  assignBedInternal, listBedsInternal, listDoctorsInternal,
  listLowStockInternal,
};
