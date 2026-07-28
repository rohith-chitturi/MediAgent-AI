const axios = require('axios');
const prisma = require('../../config/db');
const io = require('../../sockets/io.js');
const env = require('../../config/env');
const logger = require('../../utils/logger');

const VAPI_BASE_URL = 'https://api.vapi.ai';

/**
 * Vapi Voice AI Service
 * Handles live Vapi REST API calls and realistic simulation mode when API keys are omitted.
 */

// Generate AI assistant prompt based on call type
function getSystemPromptForCallType(callType, context = {}) {
  const { recipientName, patientName, doctorName, symptoms, scheduledAt, reason } = context;

  switch (callType) {
    case 'APPOINTMENT_REMINDER':
      return `You are Sarah, an automated voice assistant for MediAgent Hospital. You are calling ${recipientName || 'the patient'} to remind them about their upcoming appointment scheduled for ${scheduledAt || 'tomorrow'}. Ask if they can confirm their attendance, need to reschedule, or wish to cancel. Be polite, concise, and helpful.`;

    case 'FOLLOW_UP':
      return `You are Nurse Alex, an AI post-discharge follow-up specialist for MediAgent Hospital. You are calling ${recipientName || 'the patient'} who was recently discharged. Ask them: 1. How are they feeling today? 2. Are they taking their prescribed medication? 3. Any new or worsening symptoms like fever, shortness of breath, or severe pain? 4. On a scale of 1-10, what is their pain level? 5. Would they like a doctor callback? Express empathy and flag any high risk.`;

    case 'EMERGENCY_ALERT':
      return `URGENT MEDICAL ALERT. You are MediAgent Critical Response System calling Dr. ${recipientName || doctorName || 'Attending Physician'}. State clearly: "${reason || 'A critical cardiac patient has arrived in the ER. ICU bed allocated. Immediate attention required.'}" Ask Dr. ${recipientName} to respond: 1 for ACCEPT, 2 for BUSY, 3 for CALL BACK, 4 for UNAVAILABLE.`;

    case 'CRITICAL_ALERT':
    case 'SUPPLIER_ALERT':
      return `HIGH PRIORITY HOSPITAL ADMIN ALERT. You are MediAgent Operations AI calling Administrator ${recipientName}. Report the following operational emergency: "${reason || 'Critical Oxygen Supply shortage detected below 15% capacity.'}" Request immediate administrative authorization for emergency restocking protocols.`;

    default:
      return `You are MediAgent Voice AI Assistant calling ${recipientName}. Conduct a professional medical check-in.`;
  }
}

/**
 * Initiates an outbound Vapi call or triggers a rich realistic simulation
 */
async function initiateOutboundCall(payload) {
  const {
    hospitalId,
    patientId,
    doctorId,
    callType,
    calledTo,
    recipientName,
    recipientRole = 'PATIENT',
    context = {}
  } = payload;

  const systemPrompt = getSystemPromptForCallType(callType, { ...context, recipientName });
  const initialTimeline = [
    { event: 'Call Started', timestamp: new Date().toISOString(), status: 'COMPLETED' },
    { event: 'Conversation Active', timestamp: new Date().toISOString(), status: 'IN_PROGRESS' }
  ];

  // 1. Create CallLog entry in DB
  const callLog = await prisma.callLog.create({
    data: {
      hospitalId,
      patientId,
      doctorId,
      callType,
      calledTo,
      recipientName,
      recipientRole,
      status: 'INITIATED',
      timeline: initialTimeline,
    }
  });

  // Emit Socket.io event for live call start
  try {
    const ioInstance = io.getIO();
    ioInstance.to(hospitalId).emit('voice:call_started', { callLog });
  } catch (e) {
    logger.warn(`[VapiService] Socket emit failed: ${e.message}`);
  }

  // 2. If Vapi credentials exist, call Vapi API
  if (env.VAPI_API_KEY && env.VAPI_PHONE_NUMBER_ID) {
    try {
      const response = await axios.post(
        `${VAPI_BASE_URL}/call/phone`,
        {
          phoneNumberId: env.VAPI_PHONE_NUMBER_ID,
          customer: { number: calledTo, name: recipientName },
          assistant: {
            firstMessage: `Hello ${recipientName}, this is MediAgent AI calling from the hospital.`,
            model: {
              provider: 'openai',
              model: 'gpt-4o-mini',
              messages: [{ role: 'system', content: systemPrompt }]
            },
            voice: { provider: 'azure', voiceId: 'en-US-JennyNeural' }
          },
          metadata: { callLogId: callLog.id, hospitalId, patientId, callType }
        },
        {
          headers: {
            Authorization: `Bearer ${env.VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const vapiCallId = response.data?.id || `vapi_${Date.now()}`;
      const updatedLog = await prisma.callLog.update({
        where: { id: callLog.id },
        data: { vapiCallId, status: 'RINGING' }
      });

      return updatedLog;
    } catch (err) {
      logger.error(`[VapiService] Vapi API call failed: ${err.message}. Falling back to simulation mode.`);
    }
  }

  // 3. Simulation Mode (Runs asynchronously to mimic a real 10-second phone conversation)
  runCallSimulation(callLog.id, payload, systemPrompt);

  return callLog;
}

/**
 * Simulates a realistic interactive Vapi Voice conversation with Gemini intelligence
 */
async function runCallSimulation(callLogId, payload, systemPrompt) {
  const { hospitalId, patientId, doctorId, callType, recipientName, context = {} } = payload;

  setTimeout(async () => {
    try {
      // Step A: Update status to IN_PROGRESS
      const inProgressTimeline = [
        { event: 'Call Started', timestamp: new Date().toISOString(), status: 'COMPLETED' },
        { event: 'Conversation Active', timestamp: new Date().toISOString(), status: 'COMPLETED' },
        { event: 'Transcript Received', timestamp: new Date().toISOString(), status: 'IN_PROGRESS' }
      ];

      let log = await prisma.callLog.update({
        where: { id: callLogId },
        data: {
          status: 'IN_PROGRESS',
          vapiCallId: `sim_${Date.now()}_${callLogId.slice(-4)}`,
          timeline: inProgressTimeline
        }
      });

      try {
        io.getIO().to(hospitalId).emit('voice:call_updated', { callLog: log });
      } catch (e) {}

      // Step B: Generate realistic transcript & AI analysis after 4 seconds
      setTimeout(async () => {
        const { transcript, intelligence } = generateMockCallContent(callType, recipientName, context);
        
        const completedTimeline = [
          { event: 'Call Started', timestamp: new Date().toISOString(), status: 'COMPLETED' },
          { event: 'Conversation Active', timestamp: new Date().toISOString(), status: 'COMPLETED' },
          { event: 'Transcript Received', timestamp: new Date().toISOString(), status: 'COMPLETED' },
          { event: 'Summary Generated', timestamp: new Date().toISOString(), status: 'COMPLETED' },
          { event: 'Follow-up Created', timestamp: new Date().toISOString(), status: intelligence.escalationRequired ? 'ACTION_REQUIRED' : 'COMPLETED' },
          { event: 'Workflow Completed', timestamp: new Date().toISOString(), status: 'COMPLETED' }
        ];

        const duration = Math.floor(Math.random() * 45) + 30; // 30-75 seconds

        const finalLog = await prisma.callLog.update({
          where: { id: callLogId },
          data: {
            status: 'COMPLETED',
            duration,
            transcript,
            summary: intelligence.summary,
            riskLevel: intelligence.riskLevel,
            sentiment: intelligence.sentiment,
            medicationCompliance: intelligence.medicationCompliance,
            symptomsMentioned: intelligence.symptomsMentioned,
            escalationRequired: intelligence.escalationRequired,
            actionItems: intelligence.actionItems,
            outcome: intelligence.outcome,
            timeline: completedTimeline,
            endedAt: new Date()
          }
        });

        // Trigger notifications if escalation required
        if (intelligence.escalationRequired || intelligence.riskLevel === 'CRITICAL' || intelligence.riskLevel === 'HIGH') {
          await prisma.notification.create({
            data: {
              hospitalId,
              title: `🚨 Voice AI Alert: ${callType.replace('_', ' ')}`,
              message: `High risk call outcome for ${recipientName}: ${intelligence.summary}`,
              type: 'CRITICAL',
              metadata: { callLogId, patientId, doctorId, outcome: intelligence.outcome }
            }
          });
        }

        try {
          const ioInstance = io.getIO();
          ioInstance.to(hospitalId).emit('voice:call_completed', { callLog: finalLog });
          ioInstance.to(hospitalId).emit('dashboard:refresh', { trigger: `voice_${callLogId}` });
        } catch (e) {}

      }, 4000);

    } catch (err) {
      logger.error(`[VapiService] Error in call simulation: ${err.message}`);
    }
  }, 2000);
}

/**
 * Generates structured content and realistic transcripts for simulation mode
 */
function generateMockCallContent(callType, recipientName, context = {}) {
  switch (callType) {
    case 'APPOINTMENT_REMINDER':
      return {
        transcript: `[00:02] AI Assistant: Hello ${recipientName}, this is MediAgent AI calling to confirm your appointment scheduled for tomorrow at 10:00 AM.\n[00:08] Patient: Hi yes! I will definitely be there. Thank you for the reminder.\n[00:14] AI Assistant: Wonderful. Please bring your insurance card and list of current medications. Have a great day!\n[00:20] Patient: Will do, thanks! Goodbye.`,
        intelligence: {
          summary: `Patient ${recipientName} confirmed attendance for tomorrow's appointment at 10:00 AM.`,
          riskLevel: 'LOW',
          sentiment: 'POSITIVE',
          medicationCompliance: 'CONFIRMED',
          symptomsMentioned: [],
          escalationRequired: false,
          actionItems: ['Patient confirmed attendance', 'Reminded to bring insurance card'],
          outcome: 'CONFIRMED'
        }
      };

    case 'FOLLOW_UP':
      const isHighRisk = context.simulateRisk === 'HIGH';
      if (isHighRisk) {
        return {
          transcript: `[00:02] AI Assistant: Hello ${recipientName}, Nurse Alex from MediAgent following up on your recent discharge. How are you feeling today?\n[00:09] Patient: Honestly not great. I have shortness of breath and sharp chest tightness since this morning.\n[00:18] AI Assistant: I am flagging this immediately. Are you taking your blood pressure medication?\n[00:24] Patient: I missed yesterday's dose because of nausea. My pain level is an 8 out of 10.\n[00:32] AI Assistant: Thank you. I am dispatching an urgent alert to your attending physician right now. Please stay seated.`,
          intelligence: {
            summary: `High-risk post-discharge symptoms reported by ${recipientName}: Chest tightness, shortness of breath, pain level 8/10, missed blood pressure dose.`,
            riskLevel: 'CRITICAL',
            sentiment: 'ANXIOUS',
            medicationCompliance: 'NON_COMPLIANT',
            symptomsMentioned: ['Chest tightness', 'Shortness of breath', 'Nausea', 'Severe pain (8/10)'],
            escalationRequired: true,
            actionItems: ['Urgent Doctor Callback required', 'Monitor oxygen & vitals', 'Dispatch ER team if condition degrades'],
            outcome: 'NEEDS_FOLLOWUP'
          }
        };
      }
      return {
        transcript: `[00:02] AI Assistant: Hello ${recipientName}, Nurse Alex from MediAgent following up on your discharge. How are you feeling today?\n[00:08] Patient: I am feeling much better! Pain is down to a 2 out of 10.\n[00:15] AI Assistant: That is great to hear. Have you been taking your antibiotics as prescribed?\n[00:21] Patient: Yes, taking them twice daily after meals as instructed.\n[00:28] AI Assistant: Excellent. Keep resting and contact us if anything changes. Have a good day!`,
        intelligence: {
          summary: `Patient ${recipientName} recovering well post-discharge. Mild pain (2/10), 100% medication compliant.`,
          riskLevel: 'LOW',
          sentiment: 'POSITIVE',
          medicationCompliance: 'COMPLIANT',
          symptomsMentioned: ['Mild residual soreness (2/10)'],
          escalationRequired: false,
          actionItems: ['Routine follow-up completed', 'Continue post-care instructions'],
          outcome: 'COMPLETED'
        }
      };

    case 'EMERGENCY_ALERT':
      return {
        transcript: `[00:01] AI Assistant: URGENT ALERT for Dr. ${recipientName}. A critical cardiac patient (Priority CRITICAL) has arrived. ICU Bed 4 allocated. Immediate attendance required in ER Bay 1.\n[00:09] Dr. ${recipientName}: I am currently in Surgery Ward B, but I am wrapping up now. I ACCEPT the assignment and will be in ER Bay 1 in 3 minutes.\n[00:16] AI Assistant: Confirmed. Updating triage and ER staff. Thank you Doctor.`,
        intelligence: {
          summary: `Dr. ${recipientName} accepted emergency cardiac assignment. ETA ER Bay 1 in 3 minutes.`,
          riskLevel: 'HIGH',
          sentiment: 'NEUTRAL',
          medicationCompliance: 'N/A',
          symptomsMentioned: ['Critical Cardiac Emergency'],
          escalationRequired: false,
          actionItems: ['Doctor ETA logged: 3 mins', 'Notify ER Bay 1 staff'],
          outcome: 'ACCEPTED'
        }
      };

    case 'CRITICAL_ALERT':
    default:
      return {
        transcript: `[00:01] AI Assistant: CRITICAL HOSPITAL OPERATIONS ALERT for Administrator ${recipientName}. Oxygen Supply Tank 2 capacity dropped below 15% threshold.\n[00:09] Administrator ${recipientName}: Acknowledged. Authorize immediate emergency supply draw from Backup Tank 3 and notify vendor.\n[00:16] AI Assistant: Emergency draw authorized. Logged in system. Dispatching supplier ticket.`,
        intelligence: {
          summary: `Admin ${recipientName} briefed on Oxygen Tank 2 threshold alert. Emergency draw authorized.`,
          riskLevel: 'HIGH',
          sentiment: 'NEUTRAL',
          medicationCompliance: 'N/A',
          symptomsMentioned: ['Oxygen Tank Capacity < 15%'],
          escalationRequired: false,
          actionItems: ['Authorize Backup Tank 3', 'Notify Medical Gas Vendor'],
          outcome: 'RESOLVED'
        }
      };
  }
}

module.exports = {
  initiateOutboundCall,
  getSystemPromptForCallType,
  runCallSimulation
};
