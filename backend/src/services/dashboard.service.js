/**
 * @fileoverview Dashboard service — single merged endpoint for all roles.
 * §6 of the RBAC V7 plan.
 */
const prisma = require('../config/database');
const logger = require('../config/logger');
const { projectScopeWhere } = require('../utils/scope');

/**
 * getDashboard(user)
 * Returns scoped counts, risk distribution, recent alerts, and attention projects.
 */
const getDashboard = async (user) => {
  logger.info(`Fetching dashboard for user ${user.id} (${user.role})`);

  const scopeWhere = projectScopeWhere(user);

  const projects = await prisma.project.findMany({
    where: scopeWhere,
    include: {
      risk_predictions: {
        orderBy: { predicted_at: 'desc' },
        take: 1,
      },
      alerts: {
        where: { is_read: false },
      },
    },
  });

  let totalProjects = projects.length;
  let unreadAlertsCount = 0;
  let totalRiskScore = 0;
  let riskScoreCount = 0;

  const riskCountMap = { HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 };
  const attentionProjectsRaw = [];

  for (const project of projects) {
    unreadAlertsCount += project.alerts.length;

    let riskLevel = 'NONE';
    const latestPrediction =
      project.risk_predictions.length > 0 ? project.risk_predictions[0] : null;

    if (latestPrediction) {
      riskLevel = latestPrediction.risk_level;
      totalRiskScore += latestPrediction.risk_score;
      riskScoreCount++;
      attentionProjectsRaw.push(project);
    }

    if (riskCountMap[riskLevel] !== undefined) {
      riskCountMap[riskLevel]++;
    }
  }

  attentionProjectsRaw.sort((a, b) => {
    const scoreA = a.risk_predictions[0]?.risk_score || 0;
    const scoreB = b.risk_predictions[0]?.risk_score || 0;
    return scoreB - scoreA;
  });

  const avgRiskScore = riskScoreCount > 0 ? totalRiskScore / riskScoreCount : 0;

  // Recent alerts from in-scope projects
  const projectIds = projects.map((p) => p.id);
  const recentAlerts = await prisma.alert.findMany({
    where: projectIds.length > 0 ? { project_id: { in: projectIds } } : { id: -1 },
    orderBy: { created_at: 'desc' },
    take: 10,
  });

  // Admin-only: total user count
  const totalUsers =
    user.role === 'ADMIN' ? await prisma.user.count() : undefined;

  return {
    summary: {
      totalProjects,
      highRiskProjects: riskCountMap['HIGH'],
      mediumRiskProjects: riskCountMap['MEDIUM'],
      lowRiskProjects: riskCountMap['LOW'],
      unreadAlerts: unreadAlertsCount,
      avgRiskScore,
      ...(totalUsers !== undefined ? { totalUsers } : {}),
    },
    riskDistribution: [
      { risk_level: 'HIGH', count: riskCountMap['HIGH'] },
      { risk_level: 'MEDIUM', count: riskCountMap['MEDIUM'] },
      { risk_level: 'LOW', count: riskCountMap['LOW'] },
      { risk_level: 'NONE', count: riskCountMap['NONE'] },
    ],
    recentAlerts,
    attentionProjects: attentionProjectsRaw.slice(0, 10),
  };
};

module.exports = { getDashboard };
