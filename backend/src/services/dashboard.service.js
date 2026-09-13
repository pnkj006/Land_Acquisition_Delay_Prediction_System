/**
 * @fileoverview Dashboard service to handle project manager and admin dashboard logic
 */
const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Get dashboard metrics for a Project Manager
 * @param {number} userId - The user ID of the Project Manager
 */
const getProjectManagerDashboard = async (userId) => {
  logger.info(`Fetching project manager dashboard for user ${userId}`);
  
  // Fetch all projects managed by this user
  const projects = await prisma.project.findMany({
    where: { project_manager_id: userId },
    include: {
      risk_predictions: {
        orderBy: { predicted_at: 'desc' },
        take: 1
      },
      alerts: {
        where: { is_read: false }
      }
    }
  });

  let totalProjects = projects.length;
  let highRiskProjectsCount = 0;
  let unreadAlertsCount = 0;
  let totalRiskScore = 0;
  let riskScoreCount = 0;

  const riskCountMap = {
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    NONE: 0
  };

  const highRiskProjectList = [];

  for (const project of projects) {
    unreadAlertsCount += project.alerts.length;
    
    let riskLevel = 'NONE';
    const latestPrediction = project.risk_predictions.length > 0 ? project.risk_predictions[0] : null;
    
    if (latestPrediction) {
      riskLevel = latestPrediction.risk_level;
      totalRiskScore += latestPrediction.risk_score;
      riskScoreCount++;
      
      if (riskLevel === 'HIGH') {
        highRiskProjectsCount++;
        highRiskProjectList.push(project);
      }
    }
    
    if (riskCountMap[riskLevel] !== undefined) {
      riskCountMap[riskLevel]++;
    }
  }

  // Sort high risk projects by risk score descending
  highRiskProjectList.sort((a, b) => {
    const scoreA = a.risk_predictions[0]?.risk_score || 0;
    const scoreB = b.risk_predictions[0]?.risk_score || 0;
    return scoreB - scoreA;
  });

  const avgRiskScore = riskScoreCount > 0 ? totalRiskScore / riskScoreCount : 0;

  // Get recent alerts across user's projects
  const projectIds = projects.map(p => p.id);
  const recentAlerts = await prisma.alert.findMany({
    where: { project_id: { in: projectIds } },
    orderBy: { created_at: 'desc' },
    take: 5
  });

  return {
    summary: {
      totalProjects,
      highRiskProjects: highRiskProjectsCount,
      unreadAlerts: unreadAlertsCount,
      avgRiskScore
    },
    riskDistribution: [
      { risk_level: 'HIGH', count: riskCountMap['HIGH'] },
      { risk_level: 'MEDIUM', count: riskCountMap['MEDIUM'] },
      { risk_level: 'LOW', count: riskCountMap['LOW'] },
      { risk_level: 'NONE', count: riskCountMap['NONE'] }
    ],
    recentAlerts,
    highRiskProjectList: highRiskProjectList.slice(0, 5) // Top 5
  };
};

/**
 * Get dashboard metrics for an Admin
 */
const getAdminDashboard = async () => {
  logger.info(`Fetching admin dashboard`);
  
  const projects = await prisma.project.findMany({
    include: {
      risk_predictions: {
        orderBy: { predicted_at: 'desc' },
        take: 1
      },
      alerts: {
        where: { is_read: false }
      }
    }
  });

  let totalProjects = projects.length;
  let unreadAlertsCount = 0;

  const riskCountMap = {
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    NONE: 0
  };

  const attentionProjectsRaw = [];

  for (const project of projects) {
    unreadAlertsCount += project.alerts.length;
    
    let riskLevel = 'NONE';
    const latestPrediction = project.risk_predictions.length > 0 ? project.risk_predictions[0] : null;
    
    if (latestPrediction) {
      riskLevel = latestPrediction.risk_level;
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

  const totalUsers = await prisma.user.count();

  const recentAlerts = await prisma.alert.findMany({
    orderBy: { created_at: 'desc' },
    take: 10
  });

  return {
    summary: {
      totalProjects,
      highRiskProjects: riskCountMap['HIGH'],
      mediumRiskProjects: riskCountMap['MEDIUM'],
      lowRiskProjects: riskCountMap['LOW'],
      unreadAlerts: unreadAlertsCount,
      totalUsers
    },
    riskDistribution: [
      { risk_level: 'HIGH', count: riskCountMap['HIGH'] },
      { risk_level: 'MEDIUM', count: riskCountMap['MEDIUM'] },
      { risk_level: 'LOW', count: riskCountMap['LOW'] },
      { risk_level: 'NONE', count: riskCountMap['NONE'] }
    ],
    recentAlerts,
    attentionProjects: attentionProjectsRaw.slice(0, 10)
  };
};

module.exports = {
  getProjectManagerDashboard,
  getAdminDashboard
};
