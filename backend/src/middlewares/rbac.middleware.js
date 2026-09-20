/**
 * @fileoverview RBAC guard middleware.
 * Provides `authorize(resource, action, opts)` and `authorizeAll(pairs, opts)`.
 *
 * Every function returned has `.isRbacGuard = true` so the route-coverage
 * meta-test (§12.9) can verify every route is guarded.
 *
 * §5.2–§5.3 of the RBAC V7 plan.
 */
const { getEffectivePermissions } = require('../config/permissions');

/**
 * authorize(resource, action, opts?)
 * opts.requireScope — if 'all', rejects users whose base scope is 'own'
 *
 * Returns a middleware with `.isRbacGuard = true`.
 */
function authorize(resource, action, opts = {}) {
  const middleware = (req, res, next) => {
    if (!req.user) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      return next(err);
    }

    // Compute and cache effective permissions on req
    if (!req.effectivePerms) {
      req.effectivePerms = getEffectivePermissions(req.user);
    }

    const { scope, permissions } = req.effectivePerms;

    // Check permission
    const key = `${resource}:${action}`;
    if (!permissions.has(key)) {
      const err = new Error(`Permission denied: ${key}`);
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      return next(err);
    }

    // Check scope requirement
    if (opts.requireScope === 'all' && scope !== 'all') {
      const err = new Error(`This action requires global scope access`);
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      return next(err);
    }

    // Expose scope for downstream service layer
    req.permissionScope = scope;

    next();
  };

  middleware.isRbacGuard = true;
  return middleware;
}

/**
 * authorizeAll(pairs, opts?)
 * pairs: Array of [resource, action] tuples — ALL must pass.
 * opts.requireScope — if 'all', rejects users whose scope is 'own'
 *
 * Returns a middleware with `.isRbacGuard = true`.
 */
function authorizeAll(pairs, opts = {}) {
  const middleware = (req, res, next) => {
    if (!req.user) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      return next(err);
    }

    // Compute and cache
    if (!req.effectivePerms) {
      req.effectivePerms = getEffectivePermissions(req.user);
    }

    const { scope, permissions } = req.effectivePerms;

    // Every pair must pass
    for (const [resource, action] of pairs) {
      const key = `${resource}:${action}`;
      if (!permissions.has(key)) {
        const err = new Error(`Permission denied: ${key}`);
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        return next(err);
      }
    }

    // Check scope requirement
    if (opts.requireScope === 'all' && scope !== 'all') {
      const err = new Error(`This action requires global scope access`);
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      return next(err);
    }

    req.permissionScope = scope;

    next();
  };

  middleware.isRbacGuard = true;
  return middleware;
}

module.exports = { authorize, authorizeAll };
