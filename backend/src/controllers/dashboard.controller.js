/**
 * @fileoverview Dashboard controller — single merged endpoint.
 */
const dashboardService = require('../services/dashboard.service');
const { sendSuccess } = require('../utils/response');
const logger = require('../config/logger');

exports.getDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboard(req.user);
    return sendSuccess(res, data, 'Dashboard fetched successfully');
  } catch (error) {
    logger.error(`Error in getDashboard: ${error.message}`);
    return next(error);
  }
};
