/**
 * @fileoverview Map service — scoped by user's accessible projects.
 */
const prisma = require('../config/database');
const logger = require('../config/logger');
const { projectScopeWhere } = require('../utils/scope');

const getMapData = async (user, filters = {}) => {
  const { riskLevel } = filters;
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

  const mapData = [];

  for (const project of projects) {
    if (project.latitude == null || project.longitude == null) {
      continue; // skip projects without coordinates
    }

    const latestPrediction =
      project.risk_predictions.length > 0 ? project.risk_predictions[0] : null;
    const projectRiskLevel = latestPrediction ? latestPrediction.risk_level : 'NONE';

    if (riskLevel && riskLevel !== projectRiskLevel) {
      continue;
    }

    mapData.push({
      project_id: project.project_id,
      internal_id: project.id,
      latitude: project.latitude,
      longitude: project.longitude,
      location: project.location,
      risk_score: latestPrediction ? latestPrediction.risk_score : null,
      risk_level: projectRiskLevel !== 'NONE' ? projectRiskLevel : null,
      current_stage: project.current_stage || null,
    });
  }

  // Sort by risk severity (HIGH -> MEDIUM -> LOW -> NONE) then id ASC
  const riskWeight = { HIGH: 1, MEDIUM: 2, LOW: 3, NONE: 4 };
  mapData.sort((a, b) => {
    const wA = riskWeight[a.risk_level || 'NONE'];
    const wB = riskWeight[b.risk_level || 'NONE'];
    if (wA !== wB) return wA - wB;
    return a.internal_id - b.internal_id;
  });

  const MAX_POINTS = 1000;
  const truncated = mapData.length > MAX_POINTS;
  const data = mapData.slice(0, MAX_POINTS);

  return { data, total: mapData.length, truncated };
};

module.exports = { getMapData };
