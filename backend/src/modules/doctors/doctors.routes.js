const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { scopeToHospital } = require('../../middleware/rbac.middleware');
const ctrl = require('./doctors.controller');

const router = Router();
router.use(authenticate, scopeToHospital);

router.get('/',             ctrl.list);
router.get('/workload',     ctrl.getWorkloadStats);
router.get('/departments',  ctrl.getDepartments);
router.get('/:id',          ctrl.getById);
router.patch('/:id/toggle-availability', ctrl.toggleAvailability);

module.exports = router;
