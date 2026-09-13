/**
 * @fileoverview Dashboard controller
 */
const dashboardService = require('../services/dashboard.service');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../config/logger');

exports.getProjectManagerDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getProjectManagerDashboard(req.user.id);
    return sendSuccess(res, data, 'Project Manager dashboard fetched successfully');
  } catch (error) {
    logger.error(`Error in getProjectManagerDashboard: ${error.message}`);
    return next(error);
  }
};

exports.getAdminDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getAdminDashboard();
    return sendSuccess(res, data, 'Admin dashboard fetched successfully');
  } catch (error) {
    logger.error(`Error in getAdminDashboard: ${error.message}`);
    return next(error);
  }
};
