/**
 * @fileoverview Audit Service
 *
 * Provides:
 *   logInTx(tx, actor, action, resource, resourceId, details)
 *     — writes one audit row INSIDE a Prisma transaction.
 *       Used by all RBAC mutation endpoints (§9).
 *
 *   log(userId, action, projectId, details)
 *     — backward-compat wrapper used by opt-in auditRequest() middleware
 *       and legacy service code still being migrated.
 *
 *   getAuditLogs(filters, page, limit, skip)
 *     — paginated read for GET /audit-logs.
 *
 * §9 of the RBAC V7 plan.
 */
const prisma = require('../config/database');

/**
 * logInTx — write one audit row inside an existing Prisma transaction.
 *
 * @param {Object} tx       - Prisma transaction client (from prisma.$transaction)
 * @param {Object} actor    - req.user — { id, role, ... }
 * @param {string} action   - one of the action names in §9
 * @param {string} resource - resource name, e.g. 'users', 'projects'
 * @param {number|null} resourceId - target record's id
 * @param {Object|null} details - sanitised details (no passwords, no CSV content)
 */
async function logInTx(tx, actor, action, resource, resourceId = null, details = null) {
  return tx.auditLog.create({
    data: {
      user_id: actor ? actor.id : null,
      role: actor ? actor.role : null,
      action,
      resource,
      resource_id: resourceId,
      details,
    },
  });
}

/**
 * log — best-effort audit write (outside a transaction).
 * Used by the opt-in auditRequest() middleware and legacy service calls.
 *
 * @param {number|null} userId
 * @param {string} action
 * @param {number|null} projectId  (legacy field — maps to resource_id)
 * @param {Object|null} details
 */
async function log(userId, action, projectId = null, details = null) {
  return prisma.auditLog.create({
    data: {
      user_id: userId,
      action,
      project_id: projectId,   // legacy column
      resource_id: projectId,  // new column — same value for backward compat
      details,
    },
  });
}

/**
 * getAuditLogs — paginated list for GET /audit-logs (admin-scoped, no write/delete).
 */
async function getAuditLogs(filters = {}, page = 1, limit = 10, skip = 0) {
  const where = {};

  if (filters.userId) {
    where.user_id = parseInt(filters.userId, 10);
  }
  if (filters.action) {
    where.action = filters.action;
  }
  if (filters.resource) {
    where.resource = filters.resource;
  }
  if (filters.resourceId) {
    where.resource_id = parseInt(filters.resourceId, 10);
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total };
}

module.exports = { logInTx, log, getAuditLogs };
