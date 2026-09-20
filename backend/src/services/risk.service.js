/**
 * @fileoverview Risk Service
 * Pure reads over risk_predictions, stage_risks, and top_factors.
 * Uses assertProjectInScope for scope enforcement.
 * §5.4 of the RBAC V7 plan.
 */
const prisma = require('../config/database');
const { assertProjectInScope } = require('../utils/scope');
const { resolveProjectWhere } = require('../utils/resolveProject');
const { triggerRiskPrediction } = require('../ml/predictionClient');
const logger = require('../config/logger');

/**
 * Resolves and scope-checks a project.
 * Non-existent and out-of-scope both return the same 404.
 */
async function getScopedProject(projectIdParam, user) {
  const where = resolveProjectWhere(projectIdParam);
  const found = await prisma.project.findFirst({ where });
  if (!found) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    err.code = 'PROJECT_NOT_FOUND';
    throw err;
  }
  return assertProjectInScope(user, found.id);
}

/**
 * getCurrentRisk(projectIdParam, user)
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

/**
 * rerunPrediction(projectIdParam, user)
 * Scope check BEFORE calling FastAPI (§7.7).
 */
exports.rerunPrediction = async (projectIdParam, user) => {
  const project = await getScopedProject(projectIdParam, user);

  logger.info(`Rerun prediction requested for project ${project.project_id} by user ${user.id}`);

  // Trigger ML pipeline — scope already verified
  const result = await triggerRiskPrediction(project.id);

  return { projectId: project.project_id, status: 'queued', result };
};
