const cron = require('node-cron');
const prisma = require('../config/db');
const io = require('../sockets/io.js');
const axios = require('axios');

// Runs every minute to check for pending approvals older than 10 minutes
const startApprovalTimeoutJob = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      const pendingApprovals = await prisma.approvalRequest.findMany({
        where: {
          status: 'PENDING',
          createdAt: {
            lt: tenMinutesAgo
          }
        }
      });

      for (const req of pendingApprovals) {
        console.log(`[Cron] Escalating ApprovalRequest ${req.id} due to 10m timeout.`);
        
        // Mark as ESCALATED
        await prisma.approvalRequest.update({
          where: { id: req.id },
          data: {
            status: 'TIMEOUT',
            resolvedAt: new Date(),
            comment: 'System automatically escalated due to 10-minute timeout'
          }
        });

        // Notify dashboard of the timeout/escalation
        const ioInstance = io.getIO();
        ioInstance.to(req.hospitalId).emit('agent:approval_timeout', {
          requestId: req.id,
          runId: req.runId,
          patientId: req.patientId,
          message: 'A critical approval timed out and has been escalated.'
        });

        // Create high-priority notification for Admin
        await prisma.notification.create({
          data: {
            hospitalId: req.hospitalId,
            title: 'Approval Timeout Escalation',
            message: `Approval for run ${req.runId} timed out after 10 minutes. Action required.`,
            type: 'CRITICAL'
          }
        });

        // Auto-resume workflow via Python API with ESCALATE action
        const pyUrl = `http://localhost:${process.env.PYTHON_PORT || 8000}/agents/run/${req.runId}/resume`;
        await axios.post(pyUrl, {
          action: 'ESCALATE',
          comment: 'System Timeout Escalation',
          userId: 'system'
        }, {
          headers: { 'x-agent-key': process.env.AI_AGENT_API_KEY || 'internal-key' }
        }).catch(err => {
          console.error(`[Cron] Failed to resume workflow ${req.runId}:`, err.message);
        });
      }
    } catch (error) {
      console.error('[Cron] Error processing approval timeouts:', error);
    }
  });
  console.log('🕒 Approval Timeout Job Scheduled (* * * * *)');
};

module.exports = startApprovalTimeoutJob;
