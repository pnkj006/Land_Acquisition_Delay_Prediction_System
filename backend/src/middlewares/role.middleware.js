/**
 * @fileoverview Restricts a route to specific roles.
 * Usage: router.get('/admin-only', authenticate, requireRole('ADMIN'), handler)
 */
exports.requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    const err = new Error('You do not have permission to perform this action');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    return next(err);
  }
  next();
};