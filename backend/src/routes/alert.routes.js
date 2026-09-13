/**
 * @fileoverview Alert Routes
 */
const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { auditLog } = require('../middlewares/audit.middleware');

router.use(authenticate);

router.get('/', requireRole('ADMIN', 'PROJECT_MANAGER'), alertController.getAlerts);

router.patch('/read-all', 
  requireRole('ADMIN', 'PROJECT_MANAGER'), 
  auditLog('MARK_ALL_ALERTS_READ'), 
  alertController.markAllRead
);

router.patch('/:alertId/read', 
  requireRole('ADMIN', 'PROJECT_MANAGER'), 
  auditLog('MARK_ALERT_READ'), 
  alertController.markRead
);

module.exports = router;
