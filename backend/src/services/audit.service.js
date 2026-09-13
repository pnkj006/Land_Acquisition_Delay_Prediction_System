/**
 * @fileoverview Audit Service
 */
const prisma = require('../config/database');

exports.log = async (userId, action, projectId = null, details = null) => {
  return await prisma.auditLog.create({
    data: {
      user_id: userId,
      action: action,
      project_id: projectId,
      details: details
    }
  });
};

exports.getAuditLogs = async (filters = {}, page = 1, limit = 10, skip = 0) => {
  const where = {};
  
  if (filters.userId) {
    where.user_id = parseInt(filters.userId);
  }
  if (filters.projectId) {
    where.project_id = parseInt(filters.projectId);
  }
  if (filters.action) {
    where.action = filters.action;
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { created_at: 'desc' }
    }),
    prisma.auditLog.count({ where })
  ]);

  return { items, total };
};
