/**
 * @fileoverview Alert Service
 */
const prisma = require('../config/database');
const logger = require('../config/logger');

exports.getAlerts = async (userId, role, filters = {}, page = 1, limit = 10, skip = 0) => {
  const where = {};
  
  if (role === 'PROJECT_MANAGER') {
    const projects = await prisma.project.findMany({
      where: { project_manager_id: userId },
      select: { id: true }
    });
    const projectIds = projects.map(p => p.id);
    where.project_id = { in: projectIds };
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
        project: { select: { project_id: true, location: true } }
      },
      orderBy: { created_at: 'desc' }
    }),
    prisma.alert.count({ where })
  ]);

  return { items, total };
};

exports.markRead = async (alertId, userId, role) => {
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: { project: true }
  });

  if (!alert) {
    const error = new Error('Alert not found');
    error.statusCode = 404;
    throw error;
  }

  if (role === 'PROJECT_MANAGER' && alert.project.project_manager_id !== userId) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }

  return await prisma.alert.update({
    where: { id: alertId },
    data: { is_read: true }
  });
};

exports.markAllRead = async (userId, role) => {
  let where = { is_read: false };
  
  if (role === 'PROJECT_MANAGER') {
    const projects = await prisma.project.findMany({
      where: { project_manager_id: userId },
      select: { id: true }
    });
    const projectIds = projects.map(p => p.id);
    where.project_id = { in: projectIds };
  }

  const result = await prisma.alert.updateMany({
    where,
    data: { is_read: true }
  });

  return { count: result.count };
};
