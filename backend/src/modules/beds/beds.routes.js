const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { scopeToHospital } = require('../../middleware/rbac.middleware');
const ctrl = require('./beds.controller');

const router = Router();
router.use(authenticate, scopeToHospital);

router.get('/',            ctrl.list);
router.get('/summary',     ctrl.getSummary);
router.post('/:id/assign', ctrl.assign);
router.post('/:id/release',ctrl.release);

module.exports = router;
