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
    
    // Note: Project existence is usually verified by the scope middleware or higher up,
    // but assignmentService will also just return [] if no assignments.
    // If we wanted to ensure the project exists and is in scope, we would call assertProjectInScope here.
    // Assuming admin-only or scoped earlier. 

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
