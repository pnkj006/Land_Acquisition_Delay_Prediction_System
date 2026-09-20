/**
 * @fileoverview Analytics service — scoped by user's accessible projects.
 */
const prisma = require('../config/database');
const logger = require('../config/logger');
const { projectScopeWhere } = require('../utils/scope');

const getRiskDistribution = async (user) => {
  const scopeWhere = projectScopeWhere(user);
  const projects = await prisma.project.findMany({
    where: scopeWhere,
    include: {
      risk_predictions: {
        orderBy: { predicted_at: 'desc' },
        take: 1,
      },
    },
  });

  const riskCountMap = { HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 };

  for (const project of projects) {
    let riskLevel = 'NONE';
    if (project.risk_predictions.length > 0) {
      riskLevel = project.risk_predictions[0].risk_level;
    }
    if (riskCountMap[riskLevel] !== undefined) {
      riskCountMap[riskLevel]++;
    }
  }

  return [
    { risk_level: 'HIGH', count: riskCountMap['HIGH'] },
    { risk_level: 'MEDIUM', count: riskCountMap['MEDIUM'] },
    { risk_level: 'LOW', count: riskCountMap['LOW'] },
    { risk_level: 'NONE', count: riskCountMap['NONE'] },
  ];
};

const getStateRisk = async (user) => {
  return { stub: true, message: 'state column analytics not yet implemented', data: [] };
};

const getDistrictRisk = async (user, stateFilter) => {
  return { stub: true, message: 'district column analytics not yet implemented', data: [] };
};

const getProgressAnalytics = async (user) => {
  const scopeWhere = projectScopeWhere(user);
  const projects = await prisma.project.findMany({
    where: scopeWhere,
    select: {
      project_id: true,
      location: true,
      rehabilitation_progress_pct: true,
      project_type: true,
    },
  });

  let totalPct = 0;
  let count = 0;
  let min = 100;
  let max = 0;

  for (const p of projects) {
    const pct = p.rehabilitation_progress_pct;
    if (pct != null) {
      totalPct += pct;
      count++;
      if (pct < min) min = pct;
      if (pct > max) max = pct;
    }
  }

  const avg = count > 0 ? totalPct / count : 0;
  if (count === 0) min = 0;

  return { projects, summary: { avg, min, max } };
};

const getRiskTrend = async (user) => {
  const scopeWhere = projectScopeWhere(user);
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Get project IDs in scope first
  const scopedProjects = await prisma.project.findMany({
    where: scopeWhere,
    select: { id: true },
  });
  const projectIds = scopedProjects.map((p) => p.id);

  const predictions = await prisma.riskPrediction.findMany({
    where: {
      predicted_at: { gte: ninetyDaysAgo },
      ...(projectIds.length > 0 ? { project_id: { in: projectIds } } : { id: -1 }),
    },
    orderBy: { predicted_at: 'asc' },
  });

  const dailyData = {};
  for (const pred of predictions) {
    const dateStr = pred.predicted_at.toISOString().split('T')[0];
    if (!dailyData[dateStr]) {
      dailyData[dateStr] = { totalScore: 0, count: 0, high_count: 0, medium_count: 0, low_count: 0 };
    }
    dailyData[dateStr].totalScore += pred.risk_score;
    dailyData[dateStr].count++;
    if (pred.risk_level === 'HIGH') dailyData[dateStr].high_count++;
    else if (pred.risk_level === 'MEDIUM') dailyData[dateStr].medium_count++;
    else if (pred.risk_level === 'LOW') dailyData[dateStr].low_count++;
  }

  const result = Object.keys(dailyData).map((dateStr) => ({
    date: dateStr,
    avg_risk_score: dailyData[dateStr].totalScore / dailyData[dateStr].count,
    high_count: dailyData[dateStr].high_count,
    medium_count: dailyData[dateStr].medium_count,
    low_count: dailyData[dateStr].low_count,
  }));
  result.sort((a, b) => new Date(a.date) - new Date(b.date));

  return result;
};

module.exports = { getRiskDistribution, getStateRisk, getDistrictRisk, getProgressAnalytics, getRiskTrend };
