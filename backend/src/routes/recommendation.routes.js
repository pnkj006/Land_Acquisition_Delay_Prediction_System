/**
 * @fileoverview Recommendation Routes
 * §6 of the RBAC V7 plan.
 * Mounted at app root level in app.js.
 */
const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const { auditRequest } = require('../middlewares/audit.middleware');

router.use(authenticate);

// GET /recommendations — recommendations:read, scope in service
router.get(
  '/recommendations',
  authorize('recommendations', 'read'),
  recommendationController.getAllRecommendations
);

// GET /projects/:projectId/recommendations — recommendations:read, scope in service
router.get(
  '/projects/:projectId/recommendations',
  authorize('recommendations', 'read'),
  recommendationController.getRecommendations
);

// PATCH /recommendations/:recommendationId — recommendations:write, scope through project
router.patch(
  '/recommendations/:recommendationId',
  authorize('recommendations', 'write'),
  auditRequest('recommendation_updated'),
  recommendationController.updateRecommendationStatus
);
router.post(
  '/projects/:projectId/recommendations/generate',
  authorize('recommendations', 'write'),
  auditRequest('recommendations_generated'),
  recommendationController.generateRecommendations
)

module.exports = router;
