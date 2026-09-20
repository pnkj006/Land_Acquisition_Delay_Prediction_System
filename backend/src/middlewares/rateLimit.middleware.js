/**
 * @fileoverview Basic rate limiter for sensitive routes (e.g. login).
 * Limits each IP to a fixed number of requests per time window.
 */
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      error: { code: 'RATE_LIMIT_EXCEEDED', details: null },
    });
  },
});

module.exports = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  return limiter(req, res, next);
};
