const { Router } = require('express');
const ctrl = require('./audit.controller');
const { requirePermission } = require('../../middleware/rbac.middleware');
const authenticateJwt = require('../../middleware/auth.middleware');

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('AGENT_VIEW'), ctrl.listAuditLogs);
router.get('/analytics', requirePermission('AGENT_VIEW'), ctrl.getComplianceAnalytics);
router.get('/export', requirePermission('AGENT_VIEW'), ctrl.exportAuditLogsCSV);

module.exports = router;
