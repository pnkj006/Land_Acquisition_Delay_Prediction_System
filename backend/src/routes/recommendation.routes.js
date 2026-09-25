/**
 * @fileoverview Recommendation Routes
 */

const express = require('express')

const router = express.Router()

const recommendationController =
  require('../controllers/recommendation.controller')

const {
  authenticate,
} = require('../middlewares/auth.middleware')

const {
  authorize,
} = require('../middlewares/rbac.middleware')

const {
  auditRequest,
} = require('../middlewares/audit.middleware')

router.use(authenticate)

/**
 * GET /recommendations
 *
 * Get active recommendations.
 */
router.get(
  '/recommendations',
  authorize(
    'recommendations',
    'read'
  ),
  recommendationController.getAllRecommendations
)

/**
 * GET /projects/:projectId/recommendations
 *
 * Get active recommendations for one project.
 */
router.get(
  '/projects/:projectId/recommendations',
  authorize(
    'recommendations',
    'read'
  ),
  recommendationController.getRecommendations
)

/**
 * PATCH /recommendations/:recommendationId
 *
 * Update recommendation status.
 */
router.patch(
  '/recommendations/:recommendationId',
  authorize(
    'recommendations',
    'write'
  ),
  auditRequest(
    'recommendation_updated'
  ),
  recommendationController.updateRecommendationStatus
)

/**
 * POST /projects/:projectId/recommendations/generate
 *
 * Generate Gemini recommendations.
 */
router.post(
  '/projects/:projectId/recommendations/generate',
  authorize(
    'recommendations',
    'write'
  ),
  auditRequest(
    'recommendations_generated'
  ),
  recommendationController.generateRecommendations
)

module.exports = router