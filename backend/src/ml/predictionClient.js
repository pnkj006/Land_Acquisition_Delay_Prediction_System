/**
 * @fileoverview ML Prediction Client.
 */

const logger = require('../config/logger');
const axios = require('axios');
const prisma = require('../config/database');

/**
 * Convert backend ProjectType enum values
 * to the category values expected by the ML model.
 */
function mapProjectType(value) {
  if (!value) return value;

  const mapping = {
    HIGHWAY: 'Highway',
    RAILWAY: 'Railway',
    IRRIGATION: 'Irrigation',
    POWER: 'Power',
    INDUSTRIAL: 'Industrial',
    OTHER: 'Other',
  };

  return mapping[value] || value;
}

/**
 * Convert backend StakeholderResponsiveness enum values
 * to the category values expected by the ML model.
 */
function mapStakeholderResponsiveness(value) {
  if (!value) return value;

  const mapping = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
  };

  return mapping[value] || value;
}

/**
 * Trigger ML prediction for a project.
 */
exports.triggerRiskPrediction = async (projectId) => {
  logger.info(`Triggering risk prediction for project ${projectId}`);

  try {
    // 1. Get project data from PostgreSQL
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // 2. Prepare payload for ML service
    const payload = {
      // Numerical features
      land_area_hectares: project.land_area_hectares,
      number_of_affected_families: project.number_of_affected_families,
      approval_timeline_days: project.approval_timeline_days,
      legal_disputes_count: project.legal_disputes_count,
      rehabilitation_progress_pct: project.rehabilitation_progress_pct,
      historical_performance_score: project.historical_performance_score,
      altitude_m: project.altitude_m,
      latitude: project.latitude,
      longitude: project.longitude,

      // Categorical features
      project_type: mapProjectType(project.project_type),
      compensation_status: project.compensation_status,
      possession_status: project.possession_status,
      stakeholder_responsiveness: mapStakeholderResponsiveness(
        project.stakeholder_responsiveness
      ),
    };

    logger.info(
      `Sending project ${project.project_id} data to ML service`
    );

    // 3. Call FastAPI ML service
    const mlApiUrl =
      process.env.ML_API_URL || 'http://localhost:8000';

    const response = await axios.post(
      `${mlApiUrl}/predict`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': process.env.X_INTERNAL_TOKEN,
        },
      }
    );
    const prediction = response.data;

const savedPrediction = await prisma.riskPrediction.create({
  data: {
    project_id: projectId,
    prediction: prediction.prediction,
    probability: prediction.probability,
    risk_score: prediction.risk_score,
    risk_level: prediction.risk_level,
    threshold: prediction.threshold,
    risk_factors: prediction.risk_factors,
    model_version: 'v1',
    status: 'DONE',
    started_at: new Date(),
    finished_at: new Date(),
  },
});

return savedPrediction;

    // 4. Return ML prediction result
    logger.info(
      `Prediction received successfully for project ${project.project_id}`
    );

    return response.data;
  } catch (error) {
    logger.error(
      `Prediction failed for project ${projectId}:`,
      error.response?.data || error.message
    );

    throw error;
  }
};