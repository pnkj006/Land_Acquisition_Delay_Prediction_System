/**
 * @fileoverview Verifies the JWT bearer token and attaches
 * { id, role } to req.user.
 */
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Authentication token missing');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    return next(err);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    next(err);
  }
};