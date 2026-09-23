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
  keyGenerator: (req) => {
    let ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    ip = ip.replace(/^::ffff:/, '');
    if (ip === '::1') ip = '127.0.0.1';
    return ip;
  },
  validate: { trustProxy: false, xForwardedForHeader: false, default: false }
});

module.exports = limiter;
