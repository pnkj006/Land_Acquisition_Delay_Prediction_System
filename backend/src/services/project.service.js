/**
 * @fileoverview Project Service
 * Handles CRUD, filtering, pagination, and RBAC scope-based filtering.
 * §4, §5.4, §7.6 of the RBAC V7 plan.
 */
const prisma = require('../config/database');
const logger = require('../config/logger');
const { projectScopeWhere, assertProjectInScope } = require('../utils/scope');
const { resolveProjectWhere } = require('../utils/resolveProject');
const { triggerRiskPrediction } = require('../ml/predictionClient');

/**
 * Builds the Prisma `where` clause for a project list query,
 * applying RBAC scope and all supported filters.
 */
function buildListWhere(user, filters) {
  const where = projectScopeWhere(user);

  if (filters.search) {
    where.OR = [
      { project_id: { contains: filters.search, mode: 'insensitive' } },
      { location: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.state) where.state = filters.state;
  if (filters.district) where.district = filters.district;
  if (filters.projectType) where.project_type = filters.projectType;

  if (filters.riskLevel === 'HIGH') {
    where.risk_score = { gte: 0.7 };
  } else if (filters.riskLevel === 'MEDIUM') {
    where.risk_score = { gte: 0.4, lt: 0.7 };
  } else if (filters.riskLevel === 'LOW') {
    where.risk_score = { lt: 0.4 };
  }

  if (filters.stage) where.current_stage = filters.stage;

  return where;
}

function buildOrderBy(sortBy, sortOrder) {
  const order = sortOrder === 'asc' ? 'asc' : 'desc';

  const fieldMap = {
    riskScore: 'risk_score',
    risk_score: 'risk_score',
    created_at: 'created_at',
    updated_at: 'updated_at',
    delay_days: 'delay_days',
    project_id: 'project_id',
    current_stage: 'current_stage',
  };

  const field = fieldMap[sortBy] || 'created_at';

  return { [field]: order };
}

/**
 * listProjects(user, filters, page, limit, skip)
 * Returns { items, total } — silently scope-filtered.
 */
exports.listProjects = async (user, filters, page, limit, skip) => {
  const where = buildListWhere(user, filters);
  const orderBy = buildOrderBy(filters.sortBy, filters.sortOrder);

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.project.count({ where }),
  ]);

  return { items, total };
};

/**
 * getProjectById(projectIdParam, user)
 * 404 if not found or out of scope.
 */
exports.getProjectById = async (projectIdParam, user) => {
  const where = resolveProjectWhere(projectIdParam);
  const scopeWhere = projectScopeWhere(user);

  const project = await prisma.project.findFirst({
    where: { ...where, ...scopeWhere },
  });

  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    err.code = 'PROJECT_NOT_FOUND';
    throw err;
  }

  return project;
};

/**
 * createProject(data, actor)
 * Requires scope 'all' (enforced by authorize at route level).
 * Throws 409 if project_id already exists.
 */
exports.createProject = async (data, actor) => {
  const projectId = data.project_id
    ? data.project_id.trim().toUpperCase()
    : data.project_id;

  const existing = await prisma.project.findUnique({
    where: { project_id: projectId },
  });

  if (existing) {
    const err = new Error('A project with this project_id already exists');
    err.statusCode = 409;
    err.code = 'PROJECT_ALREADY_EXISTS';
    throw err;
  }

  // Strip fields that no longer exist post-migration-2 from body
  const { administrator_id, project_manager_id, ...rest } = data;

  const project = await prisma.project.create({
    data: {
      ...rest,
      project_id: projectId,
    },
  });

  logger.info(`Project created: ${project.project_id} by user ${actor.id}`);

  return project;
};

/**
 * updateProject(projectIdParam, data, user)
 * Scope-checked first — 404 if not found or out of scope.
 *
 * After the project is successfully updated, a fresh ML prediction
 * is generated using the new project values.
 */
exports.updateProject = async (projectIdParam, data, user) => {
  const where = resolveProjectWhere(projectIdParam);

  // Find project respecting scope
  const scopeWhere = projectScopeWhere(user);

  const existing = await prisma.project.findFirst({
    where: { ...where, ...scopeWhere },
  });

  if (!existing) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    err.code = 'PROJECT_NOT_FOUND';
    throw err;
  }

  // Strip removed fields from the update body
  const updateData = data;

  // Update project first
  const updated = await prisma.project.update({
    where: { id: existing.id },
    data: updateData,
  });

  logger.info(`Project updated: ${updated.project_id} by user ${user.id}`);

  // Run ML prediction using the newly updated project values
  const prediction = await triggerRiskPrediction(updated.id);

  logger.info(
    `Risk prediction refreshed for project ${updated.project_id}`
  );

  return {
    ...updated,
    prediction,
  };
};