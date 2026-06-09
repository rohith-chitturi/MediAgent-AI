const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { scopeToHospital, requirePermission } = require('../../middleware/rbac.middleware');
const ctrl = require('./doctors.controller');

const router = Router();
router.use(authenticate, scopeToHospital);

router.get('/',             requirePermission('PATIENT_VIEW_QUEUE'), ctrl.list);
router.get('/workload',     requirePermission('PATIENT_VIEW_QUEUE'), ctrl.getWorkloadStats);
router.get('/departments',  requirePermission('PATIENT_VIEW_QUEUE'), ctrl.getDepartments);
router.get('/:id',          requirePermission('PATIENT_VIEW_QUEUE'), ctrl.getById);
router.patch('/:id/toggle-availability', requirePermission('HOSPITAL_MANAGE'), ctrl.toggleAvailability);

module.exports = router;
