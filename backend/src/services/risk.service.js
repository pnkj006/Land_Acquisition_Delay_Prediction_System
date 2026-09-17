/**
 * @fileoverview Risk Service
 * Pure reads over risk_predictions, stage_risks, and the top_factors
 * JSON field. Prediction writing is owned by ML integration, not this module.
 */
const prisma = require('../config/database');
const { resolveProjectWhere } = require('../utils/resolveProject');

/**
 * Loads the project and enforces PM ownership scoping.
 * Shared by all four risk read operations below.
 */
async function getScopedProject(projectIdParam, user) {
  const where = resolveProjectWhere(projectIdParam);
  const project = await prisma.project.findUnique({ where });

  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    err.code = 'PROJECT_NOT_FOUND';
    throw err;
  }

  if (user.role === 'PROJECT_MANAGER' && project.project_manager_id !== user.id) {
    const err = new Error('You do not have access to this project');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  return project;
}

/**
 * getCurrentRisk(projectIdParam, user)
 * Returns the single most recent risk_predictions row for this project.
 */
exports.getCurrentRisk = async (projectIdParam, user) => {
  const project = await getScopedProject(projectIdParam, user);

  const latest = await prisma.riskPrediction.findFirst({
    where: { project_id: project.id },
    orderBy: { predicted_at: 'desc' },
  });

  if (!latest) {
    const err = new Error('No risk prediction available for this project yet');
    err.statusCode = 404;
    err.code = 'RISK_PREDICTION_NOT_FOUND';
    throw err;
  }

  return {
    projectId: project.project_id,
    riskScore: latest.risk_score,
    riskLevel: latest.risk_level,
    delayProbability: latest.delay_probability,
    modelVersion: latest.model_version,
    predictedAt: latest.predicted_at,
  };
};

/**
 * getRiskHistory(projectIdParam, user, page, limit, skip)
 * Returns { items, total } of past predictions, newest first.
 */
exports.getRiskHistory = async (projectIdParam, user, page, limit, skip) => {
  const project = await getScopedProject(projectIdParam, user);

  const [items, total] = await Promise.all([
    prisma.riskPrediction.findMany({
      where: { project_id: project.id },
      orderBy: { predicted_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.riskPrediction.count({ where: { project_id: project.id } }),
  ]);

  return { items, total };
};

/**
 * getStageRisks(projectIdParam, user)
 * Returns the stage-wise breakdown for the LATEST prediction only —
 * older predictions' stage data is available via /risk/history if needed.
 */
exports.getStageRisks = async (projectIdParam, user) => {
  const project = await getScopedProject(projectIdParam, user);

  const latest = await prisma.riskPrediction.findFirst({
    where: { project_id: project.id },
    orderBy: { predicted_at: 'desc' },
    include: { stage_risks: true },
  });

  if (!latest) {
    const err = new Error('No risk prediction available for this project yet');
    err.statusCode = 404;
    err.code = 'RISK_PREDICTION_NOT_FOUND';
    throw err;
  }

  return {
    projectId: project.project_id,
    predictedAt: latest.predicted_at,
    stages: latest.stage_risks.map((s) => ({
      stage: s.stage,
      risk: s.risk,
    })),
  };
};

/**
 * getRiskFactors(projectIdParam, user)
 * Returns the top_factors JSON array off the LATEST prediction.
 */
exports.getRiskFactors = async (projectIdParam, user) => {
  const project = await getScopedProject(projectIdParam, user);

  const latest = await prisma.riskPrediction.findFirst({
    where: { project_id: project.id },
    orderBy: { predicted_at: 'desc' },
  });

  if (!latest) {
    const err = new Error('No risk prediction available for this project yet');
    err.statusCode = 404;
    err.code = 'RISK_PREDICTION_NOT_FOUND';
    throw err;
  }

  return {
    projectId: project.project_id,
    predictedAt: latest.predicted_at,
    factors: latest.top_factors || [],
  };
};