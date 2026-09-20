/**
 * @fileoverview Alert Routes
 * §6 of the RBAC V7 plan.
 */
const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const { auditRequest } = require('../middlewares/audit.middleware');

router.use(authenticate);

// GET /alerts — alerts:read, silently scope-filtered in service
router.get(
  '/',
  authorize('alerts', 'read'),
  alertController.getAlerts
);

// PATCH /alerts/read-all — alerts:write, scope filter in updateMany
router.patch(
  '/read-all',
  authorize('alerts', 'write'),
  auditRequest('alerts_read_all'),
  alertController.markAllRead
);

// PATCH /alerts/:alertId/read — alerts:write, scope-checked in service
router.patch(
  '/:alertId/read',
  authorize('alerts', 'write'),
  auditRequest('alert_read'),
  alertController.markRead
);

module.exports = router;
