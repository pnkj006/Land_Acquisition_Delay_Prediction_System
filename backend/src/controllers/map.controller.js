/**
 * @fileoverview Map controller
 */
const mapService = require('../services/map.service');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../config/logger');

exports.getMapData = async (req, res, next) => {
  try {
    const { riskLevel, state, district } = req.query;
    const data = await mapService.getMapData({ riskLevel, state, district });
    return sendSuccess(res, data, 'Map data fetched successfully');
  } catch (error) {
    logger.error(`Error in getMapData: ${error.message}`);
    return next(error);
  }
};
