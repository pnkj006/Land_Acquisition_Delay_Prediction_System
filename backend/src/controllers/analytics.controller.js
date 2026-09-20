/**
 * @fileoverview Analytics controller — passes req.user for scope filtering.
 */
const analyticsService = require('../services/analytics.service');
const { sendSuccess } = require('../utils/response');
const logger = require('../config/logger');

exports.riskDistribution = async (req, res, next) => {
  try {
    const data = await analyticsService.getRiskDistribution(req.user);
    return sendSuccess(res, data, 'Risk distribution fetched successfully');
  } catch (error) {
    logger.error(`Error in riskDistribution: ${error.message}`);
    return next(error);
  }
};

exports.stateRisk = async (req, res, next) => {
  try {
    const data = await analyticsService.getStateRisk(req.user);
    return sendSuccess(res, data, 'State risk data fetched successfully');
  } catch (error) {
    logger.error(`Error in stateRisk: ${error.message}`);
    return next(error);
  }
};

exports.districtRisk = async (req, res, next) => {
  try {
    const data = await analyticsService.getDistrictRisk(req.user, req.query.state);
    return sendSuccess(res, data, 'District risk data fetched successfully');
  } catch (error) {
    logger.error(`Error in districtRisk: ${error.message}`);
    return next(error);
  }
};

exports.progress = async (req, res, next) => {
  try {
    const data = await analyticsService.getProgressAnalytics(req.user);
    return sendSuccess(res, data, 'Progress analytics fetched successfully');
  } catch (error) {
    logger.error(`Error in progress: ${error.message}`);
    return next(error);
  }
};

exports.riskTrend = async (req, res, next) => {
  try {
    const data = await analyticsService.getRiskTrend(req.user);
    return sendSuccess(res, data, 'Risk trend fetched successfully');
  } catch (error) {
    logger.error(`Error in riskTrend: ${error.message}`);
    return next(error);
  }
};
