/**
 * @fileoverview Verifies the JWT bearer token, loads the full user from the DB
 * (with permissions), and attaches it to req.user.
 *
 * - Only the JWT `id` field is trusted; role and grants always come from the DB.
 * - Missing user or is_active === false → 401.
 *
 * §5.1 of the RBAC V7 plan.
 */
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const prisma = require('../config/database');
const permissionCache = require('../utils/permissionCache');

exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Authentication token missing');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    return next(err);
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    return next(err);
  }

  try {
    let user;
    const cached = permissionCache.get(decoded.id);

    if (cached) {
      if (!cached.isActive) {
        const err = new Error('Account deactivated');
        err.statusCode = 401;
        err.code = 'UNAUTHORIZED';
        return next(err);
      }
      user = cached.user;
    } else {
      // Load user fresh from DB — role and grants always from DB, never from JWT
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { permissions: true },
      });

      if (!user || user.is_active === false) {
        const err = new Error('Invalid or expired token');
        err.statusCode = 401;
        err.code = 'UNAUTHORIZED';
        return next(err);
      }
      
      permissionCache.set(decoded.id, user);
    }

    // Attach full user
    req.user = user;
    next();
  } catch (error) {
    const err = new Error('Authentication error');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    next(err);
  }
};
