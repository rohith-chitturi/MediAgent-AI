const prisma = require('../../config/db');

// GET /api/agent-activity/runs
const listAgentRuns = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const hospitalId = req.user.hospitalId;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [runs, total] = await Promise.all([
      prisma.agentRun.findMany({
        where: { hospitalId },
        orderBy: { startedAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          actions: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }),
      prisma.agentRun.count({ where: { hospitalId } })
    ]);

    res.json({ success: true, data: { data: runs, total, page: parseInt(page) } });
  } catch (err) {
    next(err);
  }
};

module.exports = { listAgentRuns };
