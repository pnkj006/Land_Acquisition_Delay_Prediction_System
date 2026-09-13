/**
 * @fileoverview Import Routes
 */
const express = require('express');
const router = express.Router();
const importController = require('../controllers/import.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { uploadSingle } = require('../middlewares/upload.middleware');
const { auditLog } = require('../middlewares/audit.middleware');

router.post('/projects', 
  authenticate, 
  requireRole('ADMIN'), 
  uploadSingle('file'), 
  auditLog('IMPORT_PROJECTS'), 
  importController.importProjects
);

router.get('/', 
  authenticate, 
  requireRole('ADMIN'), 
  importController.listImports
);

module.exports = router;
