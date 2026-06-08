const { body, validationResult } = require('express-validator');
const svc = require('./resources.service');
const { success, created, paginated, parsePagination, httpError } = require('../../utils/response');

const validate = (rules) => [...rules, (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(422).json({ success: false, errors: errs.array() });
  next();
}];

const list = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { type, lowStock } = req.query;
    const { resources, total } = await svc.list({
      hospitalId: req.hospitalId, type,
      lowStock: lowStock === 'true', skip, limit,
    });
    paginated(res, { data: resources, total, page, limit });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const resource = await svc.create(req.body, req.hospitalId);
    created(res, resource);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const resource = await svc.update(req.params.id, req.hospitalId, req.body);
    success(res, resource);
  } catch (err) { next(err); }
};

const restock = async (req, res, next) => {
  try {
    const { quantity, notes } = req.body;
    if (!quantity || quantity < 1) throw httpError('Valid quantity required.', 400);
    const resource = await svc.restock(req.params.id, req.hospitalId, quantity, notes);
    success(res, resource);
  } catch (err) { next(err); }
};

const getLowStock = async (req, res, next) => {
  try {
    const resources = await svc.getLowStock(req.hospitalId);
    success(res, resources);
  } catch (err) { next(err); }
};

module.exports = { list, create, update, restock, getLowStock };
