const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { scopeToHospital } = require('../../middleware/rbac.middleware');
const ctrl = require('./patients.controller');

const router = Router();
router.use(authenticate, scopeToHospital);

router.get('/',         ctrl.list);
router.get('/:id',      ctrl.getById);
router.post('/',        ctrl.registerValidation, ctrl.register);
router.patch('/:id',    ctrl.update);
router.delete('/:id',   ctrl.remove);
router.post('/:id/assign-doctor', ctrl.assignDoctor);

module.exports = router;
