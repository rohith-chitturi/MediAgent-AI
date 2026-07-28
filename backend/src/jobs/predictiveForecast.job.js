const cron = require('node-cron');
const prisma = require('../config/db');
const predictiveCtrl = require('../modules/predictive/predictive.controller');
const logger = require('../utils/logger');

/**
 * Scheduled Cron Job for Predictive Analytics Agent
 * Runs every 15 minutes to recalculate hospital telemetry & generate proactive forecasts
 */
const startPredictiveCronJob = () => {
  cron.schedule('*/15 * * * *', async () => {
    try {
      logger.info('🔮 [Cron] Running Scheduled Predictive Analytics Sweep...');

      const hospitals = await prisma.hospital.findMany({ where: { isActive: true } });

      for (const hospital of hospitals) {
        const telemetry = await predictiveCtrl.gatherHospitalTelemetry(hospital.id);
        await predictiveCtrl.generatePredictiveForecast(hospital.id, telemetry);
      }

      logger.info('✅ [Cron] Predictive Analytics Sweep Complete.');
    } catch (err) {
      logger.error(`❌ [Cron] Predictive Analytics Job error: ${err.message}`);
    }
  });

  logger.info('🔮 Scheduled Predictive Analytics Job Active (Every 15 mins)');
};

module.exports = startPredictiveCronJob;
