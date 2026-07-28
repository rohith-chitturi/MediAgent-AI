const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Route imports
const authRoutes         = require('./modules/auth/auth.routes');
const patientsRoutes     = require('./modules/patients/patients.routes');
const doctorsRoutes      = require('./modules/doctors/doctors.routes');
const bedsRoutes         = require('./modules/beds/beds.routes');
const resourcesRoutes    = require('./modules/resources/resources.routes');
const appointmentsRoutes = require('./modules/appointments/appointments.routes');
const dashboardRoutes    = require('./modules/dashboard/dashboard.routes');
const agentActivityRoutes= require('./modules/agent-activity/agentActivity.routes');
const internalRoutes     = require('./modules/agents/agents.routes');
const voiceRoutes        = require('./modules/voice/voice.routes');
const memoryRoutes       = require('./modules/memory/memory.routes');
const predictiveRoutes   = require('./modules/predictive/predictive.routes');

const createApp = () => {
  const app = express();

  // ─── Security ───────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: [env.FRONTEND_URL, 'http://localhost:5174', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ─── Parsing ────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ─── Logging ────────────────────────────────────────────────
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
      skip: () => env.NODE_ENV === 'test',
    })
  );

  // ─── Health Check ────────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'MediAgent AI Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // ─── API Routes ──────────────────────────────────────────────
  app.use('/api/auth',         authRoutes);
  app.use('/api/patients',     patientsRoutes);
  app.use('/api/doctors',      doctorsRoutes);
  app.use('/api/beds',         bedsRoutes);
  app.use('/api/resources',    resourcesRoutes);
  app.use('/api/appointments', appointmentsRoutes);
  app.use('/api/dashboard',    dashboardRoutes);
  app.use('/api/agent-activity',agentActivityRoutes);
  app.use('/api/voice',         voiceRoutes);
  app.use('/api/memory',        memoryRoutes);
  app.use('/api/predictive',    predictiveRoutes);
  app.use('/api/internal',     internalRoutes);   // FastAPI agent callbacks

  // ─── Error Handling ──────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
