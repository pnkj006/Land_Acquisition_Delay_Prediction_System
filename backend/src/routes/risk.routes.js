/**
 * @fileoverview Risk Routes
 * Mounted at the same base as project.routes.js ('/api/v1/projects'),
 * so paths here are relative to that: '/:projectId/risk...'.
 * All routes are read-only, both roles allowed (PM ownership checked in service).
 */
const express = require('express');
const router = express.Router();

const controller = require('../controllers/risk.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { riskHistoryQueryValidators } = require('../validators/risk.validator');

router.use(authenticate);

// GET /projects/:projectId/risk
router.get('/:projectId/risk', controller.getCurrentRisk);

// GET /projects/:projectId/risk/history
router.get(
  '/:projectId/risk/history',
  riskHistoryQueryValidators,
  validate,
  controller.getRiskHistory
);

// GET /projects/:projectId/risk/stages
router.get('/:projectId/risk/stages', controller.getStageRisks);

// GET /projects/:projectId/risk/factors
router.get('/:projectId/risk/factors', controller.getRiskFactors);

module.exports = router;