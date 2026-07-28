const { Router } = require('express');
const ctrl = require('./voice.controller');
const { requirePermission } = require('../../middleware/rbac.middleware');
const authenticateJwt = require('../../middleware/auth.middleware');

const router = Router();

// Public Webhook for live Vapi call updates
router.post('/webhook', ctrl.handleVapiWebhook);

// Protected RBAC endpoints
router.use(authenticateJwt);

router.get('/calls', requirePermission('AGENT_VIEW'), ctrl.listCallLogs);
router.get('/calls/:id', requirePermission('AGENT_VIEW'), ctrl.getCallLogDetails);
router.post('/trigger', requirePermission('AGENT_VIEW'), ctrl.triggerOutboundCall);

module.exports = router;
