const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { scopeToHospital, requirePermission, scopeToDoctor } = require('../../middleware/rbac.middleware');
const ctrl = require('./appointments.controller');

const router = Router();
router.use(authenticate, scopeToHospital);

router.get('/',          requirePermission('PATIENT_VIEW_QUEUE', 'PATIENT_VIEW_OWN'), ctrl.list);
router.get('/today',     requirePermission('PATIENT_VIEW_QUEUE', 'PATIENT_VIEW_OWN'), ctrl.getTodaySchedule);
router.post('/',         requirePermission('PATIENT_CREATE'), ctrl.create);
router.patch('/:id',     requirePermission('PATIENT_UPDATE_OWN', 'HOSPITAL_MANAGE'), scopeToDoctor, ctrl.updateStatus);

module.exports = router;
