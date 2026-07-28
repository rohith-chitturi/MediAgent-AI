const prisma = require('../../config/db');
const { logAudit } = require('../../utils/auditLogger');
const logger = require('../../utils/logger');

/**
 * Audit & Governance Compliance Controller
 */

// GET /api/audit (List audit logs with filtering & pagination)
const listAuditLogs = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;
    const {
      limit = 25,
      page = 1,
      action,
      entity,
      agentName,
      userId,
      correlationId,
      outcome,
      startDate,
      endDate,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(req.user.role === 'SUPER_ADMIN' ? {} : { hospitalId }),
      ...(action ? { action } : {}),
      ...(entity ? { entity } : {}),
      ...(agentName ? { agentName } : {}),
      ...(userId ? { userId } : {}),
      ...(correlationId ? { correlationId: { contains: correlationId, mode: 'insensitive' } } : {}),
      ...(outcome ? { outcome } : {}),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate) } : {})
        }
      } : {}),
      ...(search ? {
        OR: [
          { action: { contains: search, mode: 'insensitive' } },
          { entity: { contains: search, mode: 'insensitive' } },
          { correlationId: { contains: search, mode: 'insensitive' } },
          { agentName: { contains: search, mode: 'insensitive' } }
        ]
      } : {})
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          user: { select: { id: true, name: true, email: true, role: { select: { name: true } } } }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    // Log audit read event for HIPAA compliance
    logAudit({
      hospitalId,
      userId: req.user.id,
      action: 'READ_AUDIT_TRAIL',
      entity: 'AUDIT_LOG',
      entityId: 'BATCH',
      after: { filter: req.query },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: { data: logs, total, page: parseInt(page) }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/audit/analytics (Compliance Dashboard Metrics)
const getComplianceAnalytics = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalToday,
      aiDecisionsToday,
      humanOverridesToday,
      failedWorkflowsToday,
      voiceInteractionsToday,
      sensitiveAccessToday
    ] = await Promise.all([
      prisma.auditLog.count({
        where: { hospitalId, createdAt: { gte: startOfDay } }
      }),
      prisma.agentAction.count({
        where: { hospitalId, createdAt: { gte: startOfDay } }
      }),
      prisma.approvalRequest.count({
        where: { hospitalId, status: 'REJECTED', createdAt: { gte: startOfDay } }
      }),
      prisma.agentRun.count({
        where: { hospitalId, workflowStatus: 'FAILED', startedAt: { gte: startOfDay } }
      }),
      prisma.callLog.count({
        where: { hospitalId, initiatedAt: { gte: startOfDay } }
      }),
      prisma.auditLog.count({
        where: {
          hospitalId,
          action: { in: ['READ_PATIENT_RECORD', 'EXPORT_AUDIT_TRAIL'] },
          createdAt: { gte: startOfDay }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalToday,
        aiDecisionsToday,
        humanOverridesToday,
        failedWorkflowsToday,
        voiceInteractionsToday,
        sensitiveAccessToday
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/audit/export (Export CSV Audit Trail Report)
const exportAuditLogsCSV = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;

    const logs = await prisma.auditLog.findMany({
      where: { hospitalId },
      orderBy: { createdAt: 'desc' },
      take: 1000,
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    // Generate CSV String
    let csv = 'Event ID,Timestamp,Hospital ID,User,Agent Name,Action,Entity,Entity ID,Correlation ID,Outcome,IP Address\n';
    
    logs.forEach(log => {
      const userStr = log.user ? `${log.user.name} (${log.user.email})` : 'SYSTEM/AI';
      const row = [
        log.id,
        log.createdAt.toISOString(),
        log.hospitalId || 'N/A',
        `"${userStr}"`,
        log.agentName || 'N/A',
        log.action,
        log.entity,
        log.entityId,
        log.correlationId || 'N/A',
        log.outcome,
        log.ipAddress || '127.0.0.1'
      ].join(',');
      csv += row + '\n';
    });

    // Audit the export action
    logAudit({
      hospitalId,
      userId: req.user.id,
      action: 'EXPORT_AUDIT_TRAIL',
      entity: 'AUDIT_LOG',
      entityId: 'CSV_EXPORT',
      after: { recordCount: logs.length },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit_trail_${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};

// POST /api/internal/audit (Internal API for FastAPI agent calls)
const createAuditInternal = async (req, res, next) => {
  try {
    const auditRecord = await logAudit(req.body);
    res.json({ success: true, data: auditRecord });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listAuditLogs,
  getComplianceAnalytics,
  exportAuditLogsCSV,
  createAuditInternal
};
