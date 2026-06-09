const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { scopeToHospital, requirePermission } = require('../../middleware/rbac.middleware');
const ctrl = require('./resources.controller');

const router = Router();
router.use(authenticate, scopeToHospital, requirePermission('RESOURCE_MANAGE'));

router.get('/',                  ctrl.list);
router.get('/low-stock',         ctrl.getLowStock);
router.post('/',                 ctrl.create);
router.patch('/:id',             ctrl.update);
router.post('/:id/restock',      ctrl.restock);

module.exports = router;
