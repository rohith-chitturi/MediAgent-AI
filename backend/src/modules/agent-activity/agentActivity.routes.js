const { Router } = require('express');
const ctrl = require('./agentActivity.controller');
const { authenticate, scopeToHospital } = require('../../middleware/auth.service');
const { requirePermission } = require('../../middleware/rbac.middleware');

const router = Router();

router.use(authenticate);
router.use(scopeToHospital);

// Required permission to view Agent Runs
router.get('/runs', requirePermission('AGENT_RUN_VIEW'), ctrl.listAgentRuns);

module.exports = router;
