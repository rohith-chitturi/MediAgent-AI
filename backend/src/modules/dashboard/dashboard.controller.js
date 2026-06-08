const svc = require('./dashboard.service');
const { success, paginated, parsePagination } = require('../../utils/response');

const getStats = async (req, res, next) => {
  try {
    const stats = await svc.getStats(req.hospitalId);
    success(res, stats);
  } catch (err) { next(err); }
};

const getAgentActivity = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { agentName } = req.query;
    const { actions, total } = await svc.getAgentActivity(req.hospitalId, { agentName, limit, skip });
    paginated(res, { data: actions, total, page, limit });
  } catch (err) { next(err); }
};

const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const unreadOnly = req.query.unreadOnly === 'true';
    const { notifications, total } = await svc.getNotifications(
      req.hospitalId, req.user.userId, { unreadOnly, skip, limit }
    );
    paginated(res, { data: notifications, total, page, limit });
  } catch (err) { next(err); }
};

module.exports = { getStats, getAgentActivity, getNotifications };
