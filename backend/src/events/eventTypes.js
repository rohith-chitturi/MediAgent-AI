// Event type constants for Redis pub/sub channels.
// Node backend publishes → Python FastAPI subscribes.

const EVENTS = {
  // Patient lifecycle
  PATIENT_REGISTERED: 'patient.registered',
  PATIENT_TRIAGED: 'patient.triaged',
  PATIENT_ADMITTED: 'patient.admitted',
  PATIENT_DISCHARGED: 'patient.discharged',

  // Bed lifecycle
  BED_ASSIGNED: 'bed.assigned',
  BED_RELEASED: 'bed.released',

  // Doctor
  DOCTOR_ASSIGNED: 'doctor.assigned',
  DOCTOR_OVERLOADED: 'doctor.overloaded',

  // Resources
  RESOURCE_UPDATED: 'resource.updated',
  RESOURCE_LOW: 'resource.low',
  RESOURCE_CRITICAL: 'resource.critical',

  // Appointments
  APPOINTMENT_SCHEDULED: 'appointment.scheduled',
  APPOINTMENT_REMINDER: 'appointment.reminder',

  // System
  AGENT_ACTION_COMPLETED: 'agent.action.completed',
  HOSPITAL_STATE_CHANGED: 'hospital.state.changed',
};

// Redis pub/sub channel names
const CHANNELS = {
  HOSPITAL_EVENTS: 'mediagent:hospital:events',
  AGENT_BROADCAST: 'mediagent:agent:broadcast',
};

module.exports = { EVENTS, CHANNELS };
