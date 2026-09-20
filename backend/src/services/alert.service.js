/**
 * @fileoverview Alert Service
 * Scoped by project via project_assignments, not by user_id on Alert.
 * §5.4, §7 of the RBAC V7 plan.
 *
 * Note: Alert.user_id column is kept but NOT used for scoping (§2 preflight).
 */
const prisma = require('../config/database');
const logger = require('../config/logger');
const { projectScopeWhere, assertProjectInScope } = require('../utils/scope');

/**
 * getAlerts(user, filters, page, limit, skip)
 * Silently scope-filters alerts by the user's accessible projects.
 */
exports.getAlerts = async (user, filters = {}, page = 1, limit = 10, skip = 0) => {
  const scopeWhere = projectScopeWhere(user);
  const where = {};

  // Scope through project relation
  if (Object.keys(scopeWhere).length > 0) {
    where.project = scopeWhere;
  }

  if (filters.severity) {
    where.severity = filters.severity;
  }
  if (filters.isRead !== undefined) {
    where.is_read = filters.isRead === 'true' || filters.isRead === true;
  }

  const [items, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      skip,
      take: limit,
      include: {
        project: { select: { project_id: true, location: true } },
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.alert.count({ where }),
  ]);

  return { items, total };
};

/**
 * markRead(alertId, user)
 * Out-of-scope or non-existent → 404 (identical, per §5.5).
 */
exports.markRead = async (alertId, user) => {
  const scopeWhere = projectScopeWhere(user);

  // Find alert with scope filter through project
  const alert = await prisma.alert.findFirst({
    where: {
      id: alertId,
      ...(Object.keys(scopeWhere).length > 0 ? { project: scopeWhere } : {}),
    },
  });

  if (!alert) {
    const error = new Error('Alert not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return prisma.alert.update({
    where: { id: alertId },
    data: { is_read: true },
  });
};

/**
 * markAllRead(user)
 * updateMany with scope filter on project.
 */
exports.markAllRead = async (user) => {
  const scopeWhere = projectScopeWhere(user);
  const where = { is_read: false };

  if (Object.keys(scopeWhere).length > 0) {
    where.project = scopeWhere;
  }

  const result = await prisma.alert.updateMany({
    where,
    data: { is_read: true },
  });

  return { count: result.count };
};
