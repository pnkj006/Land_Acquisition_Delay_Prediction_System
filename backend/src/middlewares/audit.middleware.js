/**
 * @fileoverview Route-level audit logging.
 * Usage: router.patch('/:id', auditLog('ACTION_NAME'), controller.handler)
 * Logs AFTER the response is sent, and only if the request succeeded
 * (status < 400) — a failed action shouldn't be recorded as if it happened.
 */
const auditService = require('../services/audit.service');
const logger = require('../config/logger');

exports.auditLog = (action) => (req, res, next) => {
  res.on('finish', () => {
    if (!req.user || res.statusCode >= 400) return;

    const rawProjectId = req.params.projectId ?? req.params.id ?? null;
    const projectId = rawProjectId && !isNaN(Number(rawProjectId)) ? Number(rawProjectId) : null;

    auditService
      .log(req.user.id, action, projectId, {
        params: req.params,
        body: req.body,
      })
      .catch((err) => logger.error(`Audit log failed for action ${action}`, err));
  });

  next();
};