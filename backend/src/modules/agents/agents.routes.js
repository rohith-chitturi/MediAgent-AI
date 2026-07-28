const { Router } = require('express');
const ctrl = require('./agents.controller');
const activityCtrl = require('../agent-activity/agentActivity.controller');
const memoryCtrl = require('../memory/memory.controller');

// Internal agent key middleware — FastAPI calls these, not the browser
const agentKeyAuth = (req, res, next) => {
  const key = req.headers['x-agent-key'];
  const expected = process.env.AI_AGENT_API_KEY || 'internal-key';
  if (key !== expected) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

const router = Router();
router.use(agentKeyAuth);

// AgentRun lifecycle
router.post('/agent-runs',          ctrl.createAgentRun);
router.patch('/agent-runs/:id',     ctrl.updateAgentRun);
router.get('/agent-runs',           ctrl.listAgentRuns);

// AgentAction log & Memory
router.post('/agent-action',        ctrl.logAgentAction);
router.post('/agent-activity/approval-request', activityCtrl.createApprovalRequest);
router.post('/agent-memory',        memoryCtrl.createMemoryInternal);
router.post('/agent-memory/query',  memoryCtrl.queryMemoriesInternal);
router.post('/agent-memory/:id/touch', memoryCtrl.touchMemoryInternal);

// Notifications + Socket.io
router.post('/notifications',       ctrl.createNotification);
router.post('/emit',                ctrl.emitEvent);

// Patient / Bed / Doctor internal updates
router.patch('/patients/:id',                   ctrl.updatePatientInternal);
router.patch('/patients/:id/assign-doctor',     ctrl.assignDoctorInternal);
router.post('/beds/:id/assign',                 ctrl.assignBedInternal);
router.get('/beds',                             ctrl.listBedsInternal);
router.get('/doctors',                          ctrl.listDoctorsInternal);
router.get('/resources/low-stock',              ctrl.listLowStockInternal);

module.exports = router;
