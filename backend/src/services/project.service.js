/**
 * @fileoverview Project Service
 * Handles CRUD, filtering, pagination, and role-based scoping for projects.
 */
const prisma = require('../config/database');
const logger = require('../config/logger');
const auditService = require('./audit.service');

/**
 * Resolves a :projectId route param to a Prisma `where` clause.
 * Accepts either the numeric primary key `id` or the business `project_id` string.
 */
function resolveProjectWhere(projectIdParam) {
  const asNumber = Number(projectIdParam);
  if (Number.isInteger(asNumber) && String(asNumber) === String(projectIdParam)) {
    return { id: asNumber };
  }
  return { project_id: projectIdParam };
}

/**
 * Builds the Prisma `where` clause for a project list query,
 * applying role-based scoping and all supported filters.
 */
function buildListWhere(user, filters) {
  const where = {};

  // Role-based scoping: PMs only ever see their own assigned projects
  if (user.role === 'PROJECT_MANAGER') {
    where.project_manager_id = user.id;
  }

  if (filters.search) {
    where.OR = [
      { project_id: { contains: filters.search, mode: 'insensitive' } },
      { location: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.state) where.state = filters.state;
  if (filters.district) where.district = filters.district;
  if (filters.projectType) where.project_type = filters.projectType;
  if (filters.managerId) where.project_manager_id = parseInt(filters.managerId, 10);

  // riskLevel filters on the *current* risk score range, since risk_level
  // itself lives on risk_predictions, not projects. We approximate via
  // the denormalized risk_score column on projects (kept in sync by
  // whoever owns ML integration writing predictions back).
  if (filters.riskLevel === 'HIGH') where.risk_score = { gte: 0.7 };
  else if (filters.riskLevel === 'MEDIUM') where.risk_score = { gte: 0.4, lt: 0.7 };
  else if (filters.riskLevel === 'LOW') where.risk_score = { lt: 0.4 };

  return where;
}

function buildOrderBy(sortBy, sortOrder) {
  const order = sortOrder === 'asc' ? 'asc' : 'desc';
  const fieldMap = {
    riskScore: 'risk_score',
    created_at: 'created_at',
    updated_at: 'updated_at',
    delay_days: 'delay_days',
    project_id: 'project_id',
  };
  const field = fieldMap[sortBy] || 'created_at';
  return { [field]: order };
}

/**
 * listProjects(user, filters, page, limit, skip)
 * Returns { items, total }
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
      include: {
        project_manager: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return { items, total };
};

/**
 * getProjectById(projectIdParam, user)
 * Throws 404 if not found, 403 if a PM tries to access a project not theirs.
 */
exports.getProjectById = async (projectIdParam, user) => {
  const where = resolveProjectWhere(projectIdParam);

  const project = await prisma.project.findUnique({
    where,
    include: {
      project_manager: { select: { id: true, name: true, email: true } },
      administrator: { select: { id: true, name: true, email: true } },
    },
  });

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
};

/**
 * createProject(data, actorUserId)
 * Throws 409 if project_id already exists.
 */
exports.createProject = async (data, actorUserId) => {
  const existing = await prisma.project.findUnique({
    where: { project_id: data.project_id },
  });

  if (existing) {
    const err = new Error('A project with this project_id already exists');
    err.statusCode = 409;
    err.code = 'PROJECT_ALREADY_EXISTS';
    throw err;
  }

  const project = await prisma.project.create({ data });

  await auditService.log(actorUserId, 'CREATE_PROJECT', project.id, {
    project_id: project.project_id,
  });

  logger.info(`Project created: ${project.project_id}`);
  return project;
};

/**
 * updateProject(projectIdParam, data, actorUserId)
 */
exports.updateProject = async (projectIdParam, data, actorUserId) => {
  const where = resolveProjectWhere(projectIdParam);

  const existing = await prisma.project.findUnique({ where });
  if (!existing) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    err.code = 'PROJECT_NOT_FOUND';
    throw err;
  }

  const updated = await prisma.project.update({ where, data });

  await auditService.log(actorUserId, 'UPDATE_PROJECT', updated.id, {
    project_id: updated.project_id,
    changedFields: Object.keys(data),
  });

  logger.info(`Project updated: ${updated.project_id}`);
  return updated;
};

/**
 * deleteProject(projectIdParam, actorUserId)
 */
exports.deleteProject = async (projectIdParam, actorUserId) => {
  const where = resolveProjectWhere(projectIdParam);

  const existing = await prisma.project.findUnique({ where });
  if (!existing) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    err.code = 'PROJECT_NOT_FOUND';
    throw err;
  }

  await prisma.project.delete({ where });

  await auditService.log(actorUserId, 'DELETE_PROJECT', existing.id, {
    project_id: existing.project_id,
  });

  logger.info(`Project deleted: ${existing.project_id}`);
  return { id: existing.id, project_id: existing.project_id };
};

/**
 * assignManager(projectIdParam, project_manager_id, actorUserId)
 * Validates the target user exists and actually has the PROJECT_MANAGER role.
 */
exports.assignManager = async (projectIdParam, project_manager_id, actorUserId) => {
  const where = resolveProjectWhere(projectIdParam);

  const project = await prisma.project.findUnique({ where });
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    err.code = 'PROJECT_NOT_FOUND';
    throw err;
  }

  const manager = await prisma.user.findUnique({ where: { id: project_manager_id } });
  if (!manager) {
    const err = new Error('Specified manager user does not exist');
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  if (manager.role !== 'PROJECT_MANAGER') {
    const err = new Error('Specified user is not a Project Manager');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const updated = await prisma.project.update({
    where,
    data: {
      project_manager_id: manager.id,
      manager: manager.name,
    },
  });

  await auditService.log(actorUserId, 'ASSIGN_MANAGER', updated.id, {
    project_id: updated.project_id,
    assigned_manager_id: manager.id,
    assigned_manager_name: manager.name,
  });

  logger.info(`Manager assigned to ${updated.project_id}: ${manager.name}`);
  return updated;
};