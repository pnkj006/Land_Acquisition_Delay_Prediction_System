/**
 * @fileoverview Centralized error handler.
 * Converts any thrown error (with optional .statusCode) into
 * the standard { success: false, message, error } envelope.
 */
const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
  // Prevent SyntaxError from body-parser echoing request body snippets
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    err.message = 'Malformed JSON';
    err.code = 'BAD_REQUEST';
    err.statusCode = 400;
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${err.message}`); // Do not log 'err' object which might contain body snippets
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong',
    error: {
      code,
      details: err.details || null,
    },
  });
};