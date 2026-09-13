/**
 * @fileoverview Recommendation Routes
 */
const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/projects/:projectId/recommendations', 
  authenticate, 
  requireRole('ADMIN', 'PROJECT_MANAGER'), 
  recommendationController.getRecommendations
);

router.patch('/recommendations/:recommendationId', 
  authenticate, 
  requireRole('ADMIN', 'PROJECT_MANAGER'), 
  recommendationController.updateRecommendationStatus
);

module.exports = router;
