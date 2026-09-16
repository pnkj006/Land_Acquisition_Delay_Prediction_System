/**
 * @fileoverview Placeholder for the ML integration owner.
 * status.service.js calls triggerRiskPrediction() after a status update.
 * The real implementation (calling the Python ML service, storing the
 * resulting risk_predictions / stage_risks / recommendations rows) is
 * NOT part of this module — whoever owns ML integration fills this in.
 */
const logger = require('../config/logger');

exports.triggerRiskPrediction = async (projectId) => {
  logger.info(`[STUB] triggerRiskPrediction called for project ${projectId} — ML integration not yet implemented`);
  // TODO (ML integration owner): build features, call ML service,
  // store RiskPrediction + StageRisk + Recommendation rows here.
  return null;
};