/**
 * @fileoverview Audit Routes
 */
const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

router.get('/', 
  authenticate, 
  authorize('audit_logs', 'read'), 
  auditController.getAuditLogs
);

module.exports = router;
