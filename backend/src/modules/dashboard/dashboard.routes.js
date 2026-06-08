const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { scopeToHospital } = require('../../middleware/rbac.middleware');
const ctrl = require('./dashboard.controller');

const router = Router();
router.use(authenticate, scopeToHospital);

router.get('/stats',         ctrl.getStats);
router.get('/agent-activity',ctrl.getAgentActivity);
router.get('/notifications', ctrl.getNotifications);

module.exports = router;
