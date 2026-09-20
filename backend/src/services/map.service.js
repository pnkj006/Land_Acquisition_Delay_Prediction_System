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
      delay_probability: latestPrediction ? latestPrediction.delay_probability : null,
    });
  }

  return mapData;
};

module.exports = { getMapData };
