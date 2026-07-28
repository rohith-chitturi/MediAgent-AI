const prisma = require('../config/db');
const logger = require('./logger');

/**
 * Enterprise Audit & Compliance Logger
 * Append-only tamper-resistant governance logging
 */
async function logAudit(params) {
  const {
    hospitalId,
    userId,
    agentName,
    action,
    entity,
    entityId,
    before,
    after,
    correlationId,
    outcome = 'SUCCESS',
    ipAddress,
    userAgent
  } = params;

  try {
    const auditRecord = await prisma.auditLog.create({
      data: {
        hospitalId,
        userId,
        agentName,
        action,
        entity,
        entityId: String(entityId || 'N/A'),
        before: before ? JSON.parse(JSON.stringify(before)) : undefined,
        after: after ? JSON.parse(JSON.stringify(after)) : undefined,
        correlationId,
        outcome,
        ipAddress,
        userAgent,
        retentionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year default retention
      }
    });

    return auditRecord;
  } catch (err) {
    logger.error(`[AuditLogger] Failed to write audit log: ${err.message}`);
    return null;
  }
}

module.exports = {
  logAudit
};
