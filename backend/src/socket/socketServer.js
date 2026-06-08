const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../utils/logger');

let io;

/**
 * Initialises Socket.io server with JWT auth and per-hospital rooms.
 * @param {import('http').Server} httpServer
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT middleware for Socket.io handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, hospitalId, role } = socket.user;
    logger.info(`🔌 Socket connected: user ${userId} | hospital ${hospitalId}`);

    // Join hospital-scoped room
    socket.join(`hospital:${hospitalId}`);

    // Super admin joins all-hospitals room
    if (role === 'SUPER_ADMIN') {
      socket.join('super:all');
    }

    socket.on('disconnect', () => {
      logger.debug(`🔌 Socket disconnected: user ${userId}`);
    });
  });

  logger.info('✅  Socket.io server initialized');
  return io;
};

/**
 * Emit an event to all clients in a hospital room.
 * @param {string} hospitalId
 * @param {string} event
 * @param {object} data
 */
const emitToHospital = (hospitalId, event, data) => {
  if (!io) return;
  io.to(`hospital:${hospitalId}`).emit(event, data);
};

/**
 * Emit an event to all super admin connections.
 */
const emitToSuperAdmins = (event, data) => {
  if (!io) return;
  io.to('super:all').emit(event, data);
};

const getIO = () => io;

module.exports = { initSocket, emitToHospital, emitToSuperAdmins, getIO };
