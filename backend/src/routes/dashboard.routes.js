/**
 * @fileoverview Dashboard routes — single merged GET /dashboard.
 * §6 of the RBAC V7 plan (separate /admin and /project-manager endpoints removed).
 */
const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

const router = express.Router();

// GET /dashboard — projects:read; service applies scope filter
router.get(
  '/',
  authenticate,
  authorize('projects', 'read'),
  dashboardController.getDashboard
);

module.exports = router;
