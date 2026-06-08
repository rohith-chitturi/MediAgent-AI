const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { scopeToHospital } = require('../../middleware/rbac.middleware');
const ctrl = require('./appointments.controller');

const router = Router();
router.use(authenticate, scopeToHospital);

router.get('/',          ctrl.list);
router.get('/today',     ctrl.getTodaySchedule);
router.post('/',         ctrl.create);
router.patch('/:id',     ctrl.updateStatus);

module.exports = router;
