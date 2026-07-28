const prisma = require('../../config/db');
const vapiService = require('./vapi.service');
const io = require('../../sockets/io.js');
const logger = require('../../utils/logger');
const axios = require('axios');

/**
 * Voice Controller
 */

// GET /api/voice/calls
const listCallLogs = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;
    const { limit = 20, page = 1, callType, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      hospitalId,
      ...(callType ? { callType } : {}),
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { recipientName: { contains: search, mode: 'insensitive' } },
          { calledTo: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { transcript: { contains: search, mode: 'insensitive' } }
        ]
      } : {})
    };

    const [calls, total] = await Promise.all([
      prisma.callLog.findMany({
        where,
        orderBy: { initiatedAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          patient: { select: { id: true, name: true, phone: true, priority: true } }
        }
      }),
      prisma.callLog.count({ where })
    ]);

    // Calculate aggregated metrics
    const stats = await getCallStats(hospitalId);

    res.json({
      success: true,
      data: {
        data: calls,
        total,
        page: parseInt(page),
        stats
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/voice/calls/:id
const getCallLogDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const call = await prisma.callLog.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, name: true, age: true, gender: true, symptoms: true, priority: true } }
      }
    });

    if (!call) {
      return res.status(404).json({ success: false, message: 'Call log not found' });
    }

    res.json({ success: true, data: call });
  } catch (err) {
    next(err);
  }
};

// POST /api/voice/trigger
const triggerOutboundCall = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;
    const {
      patientId,
      doctorId,
      callType = 'FOLLOW_UP',
      calledTo,
      recipientName,
      recipientRole = 'PATIENT',
      context = {}
    } = req.body;

    let targetPhone = calledTo;
    let targetName = recipientName;

    // Resolve patient if patientId provided
    if (patientId && (!targetPhone || !targetName)) {
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (patient) {
        targetPhone = targetPhone || patient.phone || '+15550192834';
        targetName = targetName || patient.name;
      }
    }

    // Resolve doctor if doctorId provided
    if (doctorId && (!targetPhone || !targetName)) {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        include: { user: true }
      });
      if (doctor) {
        targetPhone = targetPhone || doctor.user.phone || '+15550199999';
        targetName = targetName || `Dr. ${doctor.user.name}`;
      }
    }

    if (!targetPhone || !targetName) {
      return res.status(400).json({
        success: false,
        message: 'Recipient name and phone number (calledTo) are required.'
      });
    }

    const callLog = await vapiService.initiateOutboundCall({
      hospitalId,
      patientId,
      doctorId,
      callType,
      calledTo: targetPhone,
      recipientName: targetName,
      recipientRole,
      context
    });

    res.status(201).json({
      success: true,
      message: `Outbound ${callType} call initiated to ${targetName}`,
      data: callLog
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/voice/webhook (Live Vapi Webhook)
const handleVapiWebhook = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.json({ success: true, received: true });

    const callLogId = message.call?.metadata?.callLogId;
    const vapiCallId = message.call?.id;

    logger.info(`[VoiceWebhook] Event: ${message.type} for call ${vapiCallId}`);

    if (callLogId) {
      if (message.type === 'call.started') {
        await prisma.callLog.update({
          where: { id: callLogId },
          data: {
            status: 'IN_PROGRESS',
            timeline: {
              push: { event: 'Conversation Active', timestamp: new Date().toISOString(), status: 'COMPLETED' }
            }
          }
        });
      } else if (message.type === 'end-of-call-report' || message.type === 'call.ended') {
        const transcript = message.transcript || message.call?.artifact?.transcript || '';
        const summary = message.analysis?.summary || 'Call completed successfully.';
        const duration = message.call?.durationSeconds ? Math.round(message.call.durationSeconds) : 45;

        // Perform Gemini structured analysis on transcript
        const analysis = await analyzeTranscriptWithGemini(transcript, summary);

        const updatedCall = await prisma.callLog.update({
          where: { id: callLogId },
          data: {
            status: 'COMPLETED',
            duration,
            transcript,
            summary: analysis.summary || summary,
            riskLevel: analysis.riskLevel || 'LOW',
            sentiment: analysis.sentiment || 'NEUTRAL',
            medicationCompliance: analysis.medicationCompliance || 'COMPLIANT',
            symptomsMentioned: analysis.symptomsMentioned || [],
            escalationRequired: analysis.escalationRequired || false,
            actionItems: analysis.actionItems || [],
            outcome: analysis.outcome || 'COMPLETED',
            endedAt: new Date()
          }
        });

        // Socket emit
        const hospitalId = message.call?.metadata?.hospitalId;
        if (hospitalId) {
          try {
            const ioInstance = io.getIO();
            ioInstance.to(hospitalId).emit('voice:call_completed', { callLog: updatedCall });
          } catch (e) {}
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    logger.error(`[VoiceWebhook] Error: ${err.message}`);
    res.json({ success: true }); // Always 200 for Vapi
  }
};

/**
 * Calculates aggregated Voice Metrics for Dashboard
 */
async function getCallStats(hospitalId) {
  const [total, active, completed, missed, escalations, followups] = await Promise.all([
    prisma.callLog.count({ where: { hospitalId } }),
    prisma.callLog.count({ where: { hospitalId, status: { in: ['INITIATED', 'RINGING', 'IN_PROGRESS'] } } }),
    prisma.callLog.count({ where: { hospitalId, status: 'COMPLETED' } }),
    prisma.callLog.count({ where: { hospitalId, status: { in: ['FAILED', 'NO_ANSWER'] } } }),
    prisma.callLog.count({ where: { hospitalId, escalationRequired: true } }),
    prisma.callLog.count({ where: { hospitalId, callType: 'FOLLOW_UP', status: 'COMPLETED' } })
  ]);

  const avgDurationResult = await prisma.callLog.aggregate({
    where: { hospitalId, status: 'COMPLETED' },
    _avg: { duration: true }
  });

  const successRate = total > 0 ? Math.round((completed / total) * 100) : 100;
  const avgDuration = Math.round(avgDurationResult._avg.duration || 42);

  return {
    total,
    active,
    completed,
    missed,
    escalations,
    followups,
    successRate,
    avgDuration
  };
}

/**
 * Fallback Gemini analyzer for live webhooks
 */
async function analyzeTranscriptWithGemini(transcript, fallbackSummary) {
  try {
    const pyUrl = `http://localhost:${process.env.PYTHON_PORT || 8000}/agents/voice/analyze`;
    const res = await axios.post(pyUrl, { transcript }, {
      headers: { 'x-agent-key': process.env.AI_AGENT_API_KEY || 'internal-key' },
      timeout: 4000
    });
    return res.data;
  } catch (e) {
    return {
      summary: fallbackSummary,
      riskLevel: 'LOW',
      sentiment: 'NEUTRAL',
      medicationCompliance: 'N/A',
      symptomsMentioned: [],
      escalationRequired: false,
      actionItems: ['Review transcript'],
      outcome: 'COMPLETED'
    };
  }
}

module.exports = {
  listCallLogs,
  getCallLogDetails,
  triggerOutboundCall,
  handleVapiWebhook
};
