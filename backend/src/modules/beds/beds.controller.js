const svc = require('./beds.service');
const { success, paginated, parsePagination, httpError } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { type, status, ward } = req.query;
    const { beds, total } = await svc.list({ hospitalId: req.hospitalId, type, status, ward, skip, limit });
    paginated(res, { data: beds, total, page, limit });
  } catch (err) { next(err); }
};

const getSummary = async (req, res, next) => {
  try {
    const summary = await svc.getSummary(req.hospitalId);
    success(res, summary);
  } catch (err) { next(err); }
};

const assign = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    if (!patientId) throw httpError('patientId is required.', 400);
    const assignment = await svc.assign(req.params.id, patientId, req.user.userId, req.hospitalId);
    success(res, assignment);
  } catch (err) { next(err); }
};

const release = async (req, res, next) => {
  try {
    await svc.release(req.params.id, req.hospitalId);
    success(res, { message: 'Bed released successfully.' });
  } catch (err) { next(err); }
};

module.exports = { list, getSummary, assign, release };
