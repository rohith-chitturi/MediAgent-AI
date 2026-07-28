const { Router } = require('express');
const ctrl = require('./memory.controller');
const { requirePermission } = require('../../middleware/rbac.middleware');
const authenticateJwt = require('../../middleware/auth.middleware');

const router = Router();

// Protected RBAC routes for frontend
router.use(authenticateJwt);

router.get('/', requirePermission('AGENT_VIEW'), ctrl.listMemories);
router.get('/analytics', requirePermission('AGENT_VIEW'), ctrl.getMemoryAnalytics);

module.exports = router;
