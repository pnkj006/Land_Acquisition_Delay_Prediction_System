/**
 * @fileoverview Status Controller
 */
const statusService = require('../services/status.service');
const { sendSuccess } = require('../utils/response');

/**
 * GET /projects/:projectId/status
 */
exports.getCurrentStatus = async (req, res, next) => {
  try {
    const result = await statusService.getCurrentStatus(req.params.projectId, req.user);
    return sendSuccess(res, result, 'Current status retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /projects/:projectId/status
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const result = await statusService.updateStatus(req.params.projectId, req.body, req.user);
    return sendSuccess(res, result, 'Status updated successfully');
  } catch (err) {
    next(err);
  }
};