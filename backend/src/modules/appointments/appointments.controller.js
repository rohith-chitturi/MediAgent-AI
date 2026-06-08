const svc = require('./appointments.service');
const { success, created, paginated, parsePagination } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { doctorId, patientId, status } = req.query;
    const { appointments, total } = await svc.list({
      hospitalId: req.hospitalId, doctorId, patientId, status, skip, limit,
    });
    paginated(res, { data: appointments, total, page, limit });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const appt = await svc.create(req.body, req.hospitalId);
    created(res, appt);
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const appt = await svc.updateStatus(req.params.id, req.hospitalId, req.body.status);
    success(res, appt);
  } catch (err) { next(err); }
};

const getTodaySchedule = async (req, res, next) => {
  try {
    const schedule = await svc.getTodaySchedule(req.hospitalId);
    success(res, schedule);
  } catch (err) { next(err); }
};

module.exports = { list, create, updateStatus, getTodaySchedule };
