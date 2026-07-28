const prisma = require('../../config/db');
const axios = require('axios');
const io = require('../../sockets/io.js');

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

// POST /api/internal/agent-activity/approval-request (Internal from Python)
const createApprovalRequest = async (req, res, next) => {
  try {
    const { hospitalId, runId, patientId, approvalType, reason, decisionBefore } = req.body;
    const reqDoc = await prisma.approvalRequest.create({
      data: {
        hospitalId,
        runId,
        patientId,
        approvalType,
        requestedByAgent: 'TriageAgent',
        decisionBefore,
        comment: reason, // We'll store reason in comment for pending status
      }
    });
    
    // Emit via Socket.io
    const ioInstance = io.getIO();
    ioInstance.to(hospitalId).emit('agent:approval_required', {
      requestId: reqDoc.id,
      runId,
      patientId,
      reason,
      waitingSince: reqDoc.createdAt
    });
    
    res.json({ success: true, data: reqDoc });
  } catch (err) {
    next(err);
  }
};

// GET /api/agent-activity/approvals
const listApprovalRequests = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;
    const requests = await prisma.approvalRequest.findMany({
      where: { hospitalId },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { name: true, priority: true } },
        run: { select: { displayRunId: true } },
        resolver: { select: { name: true } }
      }
    });
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};

// POST /api/agent-activity/runs/:id/review
const reviewApprovalRequest = async (req, res, next) => {
  try {
    const runId = req.params.id; // Using runId for now, could be requestId
    const { action, comment, overrideConfig } = req.body;
    const userId = req.user.id;
    
    const approvalReq = await prisma.approvalRequest.findFirst({
      where: { runId, status: 'PENDING' }
    });
    
    if (approvalReq) {
      await prisma.approvalRequest.update({
        where: { id: approvalReq.id },
        data: {
          status: action,
          approvedBy: userId,
          comment,
          resolvedAt: new Date()
        }
      });
    }

    // Proxy to Python API
    const pyUrl = `http://localhost:${process.env.PYTHON_PORT || 8000}/agents/run/${runId}/resume`;
    await axios.post(pyUrl, {
      action,
      comment,
      userId,
      overrideConfig
    }, {
      headers: { 'x-agent-key': process.env.AI_AGENT_API_KEY || 'internal-key' }
    });

    res.json({ success: true, message: `Approval handled: ${action}` });
  } catch (err) {
    next(err);
  }
};

module.exports = { listAgentRuns, createApprovalRequest, listApprovalRequests, reviewApprovalRequest };
