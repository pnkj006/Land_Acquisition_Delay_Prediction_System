/**
 * @fileoverview Analytics routes
 * §6 of the RBAC V7 plan.
 */
const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

const router = express.Router();

// All analytics routes require predictions:read
router.use(authenticate, authorize('predictions', 'read'));

router.get('/risk-distribution', analyticsController.riskDistribution);
router.get('/state-risk', analyticsController.stateRisk);
router.get('/district-risk', analyticsController.districtRisk);
router.get('/progress', analyticsController.progress);
router.get('/risk-trend', analyticsController.riskTrend);

module.exports = router;
