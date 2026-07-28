const http = require('http');
const createApp = require('./app');
const { initSocket } = require('./socket/socketServer');
const prisma = require('./config/db');
const redis = require('./config/redis');
const env = require('./config/env');
const logger = require('./utils/logger');

const PORT = parseInt(env.PORT, 10) || 5000;

const startServer = async () => {
  try {
    // Test DB connection
    await prisma.$connect();
    logger.info('✅  PostgreSQL connected (Neon)');

    // Connect Redis — optional in dev, non-fatal if unavailable
    try {
      await redis.connect();
      logger.info('✅  Redis connected');
    } catch (redisErr) {
      logger.warn('⚠️   Redis unavailable — event pub/sub and queues disabled. Start Redis for full agent functionality.');
    }

    // Create HTTP server
    const app = createApp();
    const httpServer = http.createServer(app);

    // Attach Socket.io
    initSocket(httpServer);
    
    // Start Cron Jobs
    require('./jobs/approvalTimeout.job')();
    require('./jobs/predictiveForecast.job')();

    // Listen
    httpServer.listen(PORT, () => {
      logger.info(`🚀  MediAgent AI Backend running on http://localhost:${PORT}`);
      logger.info(`🌐  Frontend: ${env.FRONTEND_URL}`);
      logger.info(`🤖  AI Agents: ${env.AI_AGENT_SERVICE_URL}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);
      httpServer.close(async () => {
        await prisma.$disconnect();
        try { redis.disconnect(); } catch {}
        logger.info('Server closed. Goodbye.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
