const svc = require('./doctors.service');
const { success, paginated, parsePagination } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { departmentId, isAvailable, search } = req.query;
    const { doctors, total } = await svc.list({
      hospitalId: req.hospitalId,
      departmentId,
      isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
      search, skip, limit,
    });
    paginated(res, { data: doctors, total, page, limit });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const doctor = await svc.getById(req.params.id, req.hospitalId);
    success(res, doctor);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const doctor = await svc.create(req.body, req.hospitalId);
    success(res, doctor, 201);
  } catch (err) { next(err); }
};

const toggleAvailability = async (req, res, next) => {
  try {
    const doctor = await svc.toggleAvailability(req.params.id, req.hospitalId);
    success(res, doctor);
  } catch (err) { next(err); }
};

const getDepartments = async (req, res, next) => {
  try {
    const depts = await svc.getDepartments(req.hospitalId);
    success(res, depts);
  } catch (err) { next(err); }
};

const getWorkloadStats = async (req, res, next) => {
  try {
    const stats = await svc.getWorkloadStats(req.hospitalId);
    success(res, stats);
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, toggleAvailability, getDepartments, getWorkloadStats };
