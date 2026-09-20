/**
 * @fileoverview Risk Routes
 * Mounted at '/api/v1/projects', so paths here are relative to that.
 * §6 of the RBAC V7 plan.
 */
const express = require('express');
const router = express.Router();

const controller = require('../controllers/risk.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const { auditRequest } = require('../middlewares/audit.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { riskHistoryQueryValidators } = require('../validators/risk.validator');

router.use(authenticate);

// GET /projects/:projectId/risk
router.get(
  '/:projectId/risk',
  authorize('predictions', 'read'),
  controller.getCurrentRisk
);

// GET /projects/:projectId/risk/history
router.get(
  '/:projectId/risk/history',
  authorize('predictions', 'read'),
  riskHistoryQueryValidators,
  validate,
  controller.getRiskHistory
);

// GET /projects/:projectId/risk/stages
router.get(
  '/:projectId/risk/stages',
  authorize('predictions', 'read'),
  controller.getStageRisks
);

// GET /projects/:projectId/risk/factors
router.get(
  '/:projectId/risk/factors',
  authorize('predictions', 'read'),
  controller.getRiskFactors
);

// POST /projects/:projectId/risk/rerun — rerun_prediction:write
// Scope check happens in service BEFORE calling FastAPI
router.post(
  '/:projectId/risk/rerun',
  authorize('rerun_prediction', 'write'),
  auditRequest('rerun_prediction'),
  controller.rerunPrediction
);

module.exports = router;
