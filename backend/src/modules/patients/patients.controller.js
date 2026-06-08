const { body, validationResult } = require('express-validator');
const svc = require('./patients.service');
const { success, created, paginated, parsePagination, httpError } = require('../../utils/response');

const validate = (rules) => [...rules, (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(422).json({ success: false, errors: errs.array() });
  next();
}];

const registerValidation = validate([
  body('name').notEmpty().withMessage('Name is required'),
  body('age').isInt({ min: 0, max: 150 }).withMessage('Valid age required'),
  body('gender').isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Valid gender required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('symptoms').notEmpty().withMessage('Symptoms are required'),
]);

const list = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { status, priority, search } = req.query;
    const { patients, total } = await svc.list({
      hospitalId: req.hospitalId, status, priority, search, skip, limit,
    });
    paginated(res, { data: patients, total, page, limit });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const patient = await svc.getById(req.params.id, req.hospitalId);
    success(res, patient);
  } catch (err) { next(err); }
};

const register = async (req, res, next) => {
  try {
    const patient = await svc.register(req.body, req.hospitalId);
    created(res, patient);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const patient = await svc.update(req.params.id, req.hospitalId, req.body);
    success(res, patient);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id, req.hospitalId);
    success(res, { message: 'Patient deleted.' });
  } catch (err) { next(err); }
};

const assignDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.body;
    if (!doctorId) throw httpError('doctorId is required.', 400);
    const patient = await svc.assignDoctor(req.params.id, doctorId, req.hospitalId);
    success(res, patient);
  } catch (err) { next(err); }
};

module.exports = { list, getById, register, update, remove, assignDoctor, registerValidation };
