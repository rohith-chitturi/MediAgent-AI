const { Router } = require('express');
const ctrl = require('./predictive.controller');
const { requirePermission } = require('../../middleware/rbac.middleware');
const { authenticate } = require('../../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/forecast', requirePermission('AGENT_VIEW'), ctrl.getForecast);
router.post('/run', requirePermission('AGENT_VIEW'), ctrl.triggerForecastRun);

module.exports = router;
