const { Router } = require('express');
const ctrl = require('./predictive.controller');
const { requirePermission } = require('../../middleware/rbac.middleware');
const authenticateJwt = require('../../middleware/auth.middleware');

const router = Router();

router.use(authenticateJwt);

router.get('/forecast', requirePermission('AGENT_VIEW'), ctrl.getForecast);
router.post('/run', requirePermission('AGENT_VIEW'), ctrl.triggerForecastRun);

module.exports = router;
