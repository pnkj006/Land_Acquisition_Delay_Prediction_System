/**
 * @fileoverview Permission Controller
 */
const permissionService = require('../services/permission.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getPermissions = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return sendError(res, 'Invalid user ID', 'INVALID_PARAM', 400);
    }

    const data = await permissionService.getUserPermissions(userId);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

exports.setPermissions = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return sendError(res, 'Invalid user ID', 'INVALID_PARAM', 400);
    }

    const { grants } = req.body;
    if (!Array.isArray(grants)) {
      return sendError(res, 'grants must be an array', 'INVALID_PARAM', 400);
    }

    const result = await permissionService.setUserPermissions(req.user, userId, grants);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
