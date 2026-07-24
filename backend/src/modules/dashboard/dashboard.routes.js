const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { scopeToHospital, requirePermission } = require('../../middleware/rbac.middleware');
const ctrl = require('./dashboard.controller');

const router = Router();
router.use(authenticate, scopeToHospital);

router.get('/stats',         requirePermission('PLATFORM_VIEW'), ctrl.getStats);
router.get('/agent-activity',requirePermission('AGENT_VIEW'), ctrl.getAgentActivity);
router.get('/notifications', requirePermission('PLATFORM_VIEW'), ctrl.getNotifications);
router.patch('/notifications/read-all', requirePermission('PLATFORM_VIEW'), ctrl.markAllAsRead);
router.patch('/notifications/:id/read', requirePermission('PLATFORM_VIEW'), ctrl.markAsRead);

module.exports = router;
