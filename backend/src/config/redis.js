const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  // In dev without Redis, stop retrying after first failure to avoid log spam
  retryStrategy: (times) => {
    if (env.NODE_ENV === 'development' && times > 1) return null; // stop retrying
    return Math.min(times * 200, 3000);
  },
  lazyConnect: true,
  enableOfflineQueue: false,
});

redis.on('connect', () => logger.info('✅  Redis connected'));
redis.on('error', () => {}); // Silenced — connection warning shown at startup

module.exports = redis;
