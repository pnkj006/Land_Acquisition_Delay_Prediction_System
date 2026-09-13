/**
 * @fileoverview Audit Routes
 */
const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/', 
  authenticate, 
  requireRole('ADMIN'), 
  auditController.getAuditLogs
);

module.exports = router;
