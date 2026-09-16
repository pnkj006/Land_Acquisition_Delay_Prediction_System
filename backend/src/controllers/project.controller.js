/**
 * @fileoverview Project Controller
 * Thin layer: extracts request data, calls the service, formats the response.
 * All business logic and error-throwing lives in project.service.js.
 */

const projectService = require('../services/project.service');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { getPagination } = require('../utils/pagination');

/**
 * GET /projects
 */
exports.listProjects = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const filters = {
      search: req.query.search,
      state: req.query.state,
      district: req.query.district,
      projectType: req.query.projectType,
      riskLevel: req.query.riskLevel,
      managerId: req.query.managerId,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };

    const { items, total } = await projectService.listProjects(
      req.user,
      filters,
      page,
      limit,
      skip
    );

    return sendPaginated(
      res,
      items,
      page,
      limit,
      total,
      'Projects retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /projects/:projectId
 */
exports.getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(
      req.params.projectId,
      req.user
    );

    return sendSuccess(
      res,
      project,
      'Project retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /projects
 */
exports.createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(
      req.body,
      req.user.id
    );

    return sendSuccess(
      res,
      project,
      'Project created successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /projects/:projectId
 */
exports.updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(
      req.params.projectId,
      req.body,
      req.user.id
    );

    return sendSuccess(
      res,
      project,
      'Project updated successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /projects/:projectId
 */
exports.deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(
      req.params.projectId,
      req.user.id
    );

    return sendSuccess(
      res,
      result,
      'Project deleted successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /projects/:projectId/assign-manager
 */
exports.assignManager = async (req, res, next) => {
  try {
    const project = await projectService.assignManager(
      req.params.projectId,
      req.body.project_manager_id,
      req.user.id
    );

    return sendSuccess(
      res,
      project,
      'Manager assigned successfully'
    );
  } catch (err) {
    next(err);
  }
};