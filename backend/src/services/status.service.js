/**
 * @fileoverview Status Service
 * Uses assertProjectInScope for scope enforcement.
 * §5.4 of the RBAC V7 plan.
 */
const prisma = require('../config/database');
const logger = require('../config/logger');
const { assertProjectInScope } = require('../utils/scope');
const { resolveProjectWhere } = require('../utils/resolveProject');
const { triggerRiskPrediction } = require('../ml/predictionClient');

const STATUS_FIELDS = [
  'compensation_status',
  'approval_timeline_days',
  'legal_disputes_count',
  'possession_status',
  'rehabilitation_progress_pct',
  'stakeholder_responsiveness',
  // Note: 'stage' maps to 'current_stage' in Project model
];

/**
 * Resolves and scope-checks a project.
 * Non-existent and out-of-scope both return the same 404.
 */
async function getScopedProject(projectIdParam, user) {
  const where = resolveProjectWhere(projectIdParam);

  // First resolve to get the numeric ID
  const found = await prisma.project.findFirst({ where });
  if (!found) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    err.code = 'PROJECT_NOT_FOUND';
    throw err;
  }

  // Then scope-check (produces identical 404 if out of scope)
  return assertProjectInScope(user, found.id);
}

/**
 * getCurrentStatus(projectIdParam, user)
 */
exports.getCurrentStatus = async (projectIdParam, user) => {
  const project = await getScopedProject(projectIdParam, user);

  const status = {};
  for (const field of STATUS_FIELDS) {
    status[field] = project[field];
  }
  status.stage = project.current_stage; // Include stage

  return {
    projectId: project.project_id,
    status,
    updatedAt: project.updated_at,
  };
};

/**
 * updateStatus(projectIdParam, data, user)
 */
exports.updateStatus = async (projectIdParam, data, user) => {
  const project = await getScopedProject(projectIdParam, user);

  // Snapshot current values BEFORE overwriting
  await prisma.projectStatusHistory.create({
    data: {
      project_id: project.id,
      stage: project.current_stage,
      compensation_status: project.compensation_status,
      approval_timeline_days: project.approval_timeline_days,
      legal_disputes_count: project.legal_disputes_count,
      possession_status: project.possession_status,
      rehabilitation_progress_pct: project.rehabilitation_progress_pct,
      stakeholder_responsiveness: project.stakeholder_responsiveness,
      recorded_by: user.id,
    },
  });

  const updateData = {};
  for (const field of STATUS_FIELDS) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }
  if (data.stage !== undefined) updateData.current_stage = data.stage;

  const updatedProject = await prisma.project.update({
    where: { id: project.id },
    data: updateData,
  });

  // Trigger ML pipeline (non-blocking)
  triggerRiskPrediction(project.id).catch((err) =>
    logger.error(`triggerRiskPrediction failed for project ${project.id}`, err)
  );

  logger.info(`Status updated for project ${project.project_id} by user ${user.id}`);

  const status = {};
  for (const field of STATUS_FIELDS) {
    status[field] = updatedProject[field];
  }
  status.stage = updatedProject.current_stage;

  return {
    projectId: updatedProject.project_id,
    status,
    updatedAt: updatedProject.updated_at,
  };
};
