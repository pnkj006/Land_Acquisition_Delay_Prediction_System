/**
 * @fileoverview Analytics routes
 */
const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = express.Router();

// Apply auth to all analytics routes
router.use(authenticate, requireRole('ADMIN', 'PROJECT_MANAGER'));

router.get('/risk-distribution', analyticsController.riskDistribution);
router.get('/state-risk', analyticsController.stateRisk);
router.get('/district-risk', analyticsController.districtRisk);
router.get('/progress', analyticsController.progress);
router.get('/risk-trend', analyticsController.riskTrend);

module.exports = router;
