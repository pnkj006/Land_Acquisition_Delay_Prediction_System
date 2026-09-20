/**
 * @fileoverview Opt-in request-level audit logging.
 *
 * Usage: router.patch('/:id', authenticate, authorize(...), auditRequest('ACTION_NAME'), handler)
 *
 * Fires AFTER the response is sent (best-effort, not transactional).
 * Only records rows when the response status < 400.
 *
 * This middleware is applied only to these non-RBAC routes (§9):
 *   POST /projects, PATCH /projects/:id, PATCH /projects/:id/status,
 *   POST /projects/:id/risk/rerun, PATCH /recommendations/:id,
 *   PATCH /alerts/read-all, PATCH /alerts/:id/read
 *
 * RBAC mutations (permissions, assignments, role change, user CRUD, CSV imports)
 * write their audit rows via logInTx inside their own transactions — they must
 * NOT also use auditRequest() to avoid double rows.
 */
const auditService = require('../services/audit.service');
const logger = require('../config/logger');

/**
 * auditRequest(action) — returns an opt-in best-effort audit middleware.
 */
exports.auditRequest = (action) => (req, res, next) => {
  res.on('finish', () => {
    if (!req.user || res.statusCode >= 400) return;

    const rawId = req.params.projectId ?? req.params.id ?? null;
    const resourceId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : null;

    auditService
      .log(req.user.id, action, resourceId, {
        params: req.params,
      })
      .catch((err) => logger.error(`auditRequest failed for action ${action}`, err));
  });

  next();
};

// Backward compat alias (existing callers used auditLog)
exports.auditLog = exports.auditRequest;
