const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { scopeToHospital, scopeToDoctor, requirePermission } = require('../../middleware/rbac.middleware');
const ctrl = require('./patients.controller');

const router = Router();
router.use(authenticate, scopeToHospital);

router.get('/',         requirePermission('PATIENT_VIEW_QUEUE'), ctrl.list);
router.get('/:id',      requirePermission('PATIENT_VIEW_QUEUE'), ctrl.getById);
router.post('/',        requirePermission('PATIENT_CREATE'), ctrl.registerValidation, ctrl.register);
router.patch('/:id',    requirePermission('PATIENT_UPDATE_OWN'), scopeToDoctor, ctrl.update);
router.delete('/:id',   requirePermission('HOSPITAL_MANAGE'), ctrl.remove);
router.post('/:id/assign-doctor', requirePermission('HOSPITAL_MANAGE'), ctrl.assignDoctor);

module.exports = router;
