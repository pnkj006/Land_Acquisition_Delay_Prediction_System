/**
 * @fileoverview Dashboard routes
 */
const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = express.Router();

router.get('/project-manager', authenticate, requireRole('PROJECT_MANAGER'), dashboardController.getProjectManagerDashboard);
router.get('/admin', authenticate, requireRole('ADMIN'), dashboardController.getAdminDashboard);

module.exports = router;
