/**
 * @fileoverview Risk Controller
 */
const riskService = require('../services/risk.service');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { getPagination } = require('../utils/pagination');

/**
 * GET /projects/:projectId/risk
 */
exports.getCurrentRisk = async (req, res, next) => {
  try {
    const result = await riskService.getCurrentRisk(req.params.projectId, req.user);
    return sendSuccess(res, result, 'Current risk prediction retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /projects/:projectId/risk/history
 */
exports.getRiskHistory = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { items, total } = await riskService.getRiskHistory(
      req.params.projectId, req.user, page, limit, skip
    );
    return sendPaginated(res, items, page, limit, total, 'Risk history retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /projects/:projectId/risk/stages
 */
exports.getStageRisks = async (req, res, next) => {
  try {
    const result = await riskService.getStageRisks(req.params.projectId, req.user);
    return sendSuccess(res, result, 'Stage-wise risk retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /projects/:projectId/risk/factors
 */
exports.getRiskFactors = async (req, res, next) => {
  try {
    const result = await riskService.getRiskFactors(req.params.projectId, req.user);
    return sendSuccess(res, result, 'Risk factors retrieved successfully');
  } catch (err) {
    next(err);
  }
};