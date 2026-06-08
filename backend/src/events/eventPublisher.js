const redis = require('../config/redis');
const logger = require('../utils/logger');
const { CHANNELS } = require('./eventTypes');

/**
 * Publishes a hospital event to the Redis pub/sub channel.
 * The Python FastAPI AI agent service subscribes and reacts.
 *
 * @param {string} eventType - Event type constant from eventTypes.js
 * @param {string} hospitalId - Scopes the event to a specific hospital
 * @param {object} payload   - Event data
 */
const publishEvent = async (eventType, hospitalId, payload = {}) => {
  try {
    const message = JSON.stringify({
      eventType,
      hospitalId,
      payload,
      timestamp: new Date().toISOString(),
    });

    await redis.publish(CHANNELS.HOSPITAL_EVENTS, message);
    logger.debug(`📡 Event published: ${eventType} [hospital: ${hospitalId}]`);
  } catch (err) {
    // Non-fatal: log but don't crash the main request
    logger.error(`Failed to publish event ${eventType}:`, err);
  }
};

module.exports = { publishEvent };
