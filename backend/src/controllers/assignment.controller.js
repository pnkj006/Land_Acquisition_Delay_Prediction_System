/**
 * @fileoverview Assignment Controller
 */
const assignmentService = require('../services/assignment.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAssignments = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return sendError(res, 'Invalid project ID', 'INVALID_PARAM', 400);
    }
    
    const { assertProjectInScope } = require('../utils/scope');
    await assertProjectInScope(req.user, projectId);

    const users = await assignmentService.getProjectAssignments(projectId);
    return sendSuccess(res, users);
  } catch (error) {
    next(error);
  }
};

exports.setAssignments = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return sendError(res, 'Invalid project ID', 'INVALID_PARAM', 400);
    }

    const { userIds } = req.body;
    if (!Array.isArray(userIds)) {
      return sendError(res, 'userIds must be an array', 'INVALID_PARAM', 400);
    }

    const result = await assignmentService.setProjectAssignments(req.user, projectId, userIds);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
