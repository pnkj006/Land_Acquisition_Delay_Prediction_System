/**
 * @fileoverview Status Service
 * Handles reading current project status and the officer status-update flow:
 * snapshot current values to history -> apply new values -> trigger ML prediction.
 */
const prisma = require('../config/database');
const logger = require('../config/logger');
const auditService = require('./audit.service');
const { resolveProjectWhere } = require('../utils/resolveProject');
const { triggerRiskPrediction } = require('../ml/predictionClient');

const STATUS_FIELDS = [
  'compensation_status',
  'approval_timeline_days',
  'legal_disputes_count',
  'possession_status',
  'rehabilitation_progress_pct',
  'stakeholder_responsiveness',
];

/**
 * Fetches a project and enforces PM ownership scoping.
 * Shared by both getCurrentStatus and updateStatus.
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
 * getCurrentStatus(projectIdParam, user)
 * Current status lives directly on the Project record itself
 * (compensation_status, approval_timeline_days, etc.) — this just
 * returns that slice of fields.
 */
exports.getCurrentStatus = async (projectIdParam, user) => {
  const project = await getScopedProject(projectIdParam, user);

  const status = {};
  for (const field of STATUS_FIELDS) {
    status[field] = project[field];
  }

  return {
    projectId: project.project_id,
    status,
    updatedAt: project.updated_at,
  };
};

/**
 * updateStatus(projectIdParam, data, user)
 * 1. Load project, enforce ownership
 * 2. Snapshot the CURRENT (pre-update) values into project_status_history
 * 3. Apply the new values to the project
 * 4. Trigger the ML prediction pipeline (stub — not this module's responsibility)
 * 5. Audit log
 */
exports.updateStatus = async (projectIdParam, data, user) => {
  const project = await getScopedProject(projectIdParam, user);

  // Snapshot current values BEFORE overwriting, so history reflects
  // what the status actually was up to this point.
  await prisma.projectStatusHistory.create({
    data: {
      project_id: project.id,
      compensation_status: project.compensation_status,
      approval_timeline_days: project.approval_timeline_days,
      legal_disputes_count: project.legal_disputes_count,
      possession_status: project.possession_status,
      rehabilitation_progress_pct: project.rehabilitation_progress_pct,
      stakeholder_responsiveness: project.stakeholder_responsiveness,
      recorded_by: user.id,
    },
  });

  // Apply only the fields actually provided in the request
  const updateData = {};
  for (const field of STATUS_FIELDS) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  const updatedProject = await prisma.project.update({
    where: { id: project.id },
    data: updateData,
  });

  await auditService.log(user.id, 'UPDATE_PROJECT_STATUS', project.id, {
    project_id: project.project_id,
    changedFields: Object.keys(updateData),
  });

  // Hand off to ML integration — not built by this module.
  // Intentionally not awaited-and-blocking on failure: a slow/broken
  // ML service shouldn't prevent the status update itself from succeeding.
  triggerRiskPrediction(project.id).catch((err) =>
    logger.error(`triggerRiskPrediction failed for project ${project.id}`, err)
  );

  logger.info(`Status updated for project ${project.project_id} by user ${user.id}`);

  const status = {};
  for (const field of STATUS_FIELDS) {
    status[field] = updatedProject[field];
  }

  return {
    projectId: updatedProject.project_id,
    status,
    updatedAt: updatedProject.updated_at,
  };
};