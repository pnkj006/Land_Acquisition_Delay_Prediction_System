/**
 * @fileoverview Assignment Controller
 */
const assignmentService = require('../services/assignment.service');
const { sendSuccess, sendError } = require('../utils/response');
const { assertProjectInScope } = require('../utils/scope');

/**
 * GET /projects/:projectId/assignments
 */
exports.getAssignments = async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);

    if (!Number.isInteger(projectId)) {
      return sendError(
        res,
        'Invalid project ID',
        'INVALID_PARAM',
        400
      );
    }

    await assertProjectInScope(req.user, projectId);

    const projectManager =
      await assignmentService.getProjectAssignments(projectId);

    return sendSuccess(res, projectManager);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /projects/:projectId/assignments
 *
 * Body:
 * {
 *   userIds: [12]
 * }
 *
 * Empty array removes the current PM:
 *
 * {
 *   userIds: []
 * }
 */
exports.setAssignments = async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);

    if (!Number.isInteger(projectId)) {
      return sendError(
        res,
        'Invalid project ID',
        'INVALID_PARAM',
        400
      );
    }

    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return sendError(
        res,
        'userIds must be an array',
        'INVALID_PARAM',
        400
      );
    }

    const result =
      await assignmentService.setProjectAssignments(
        req.user,
        projectId,
        userIds
      );

    return sendSuccess(
      res,
      result,
      'Project Manager assignment updated'
    );
  } catch (error) {
    next(error);
  }
};