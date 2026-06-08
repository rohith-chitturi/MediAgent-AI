const logger = require('../utils/logger');

/**
 * Global error handler middleware.
 * Must be the last middleware registered in app.js.
 */
const errorHandler = (err, req, res, next) => {
  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists.',
      field: err.meta?.target,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found.',
    });
  }

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: err.errors,
    });
  }

  // Default
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error.';

  logger.error(`[${req.method}] ${req.path} → ${statusCode}: ${message}`, {
    stack: err.stack,
    body: req.body,
  });

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error.' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 handler for unknown routes.
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found.`,
  });
};

module.exports = { errorHandler, notFound };
