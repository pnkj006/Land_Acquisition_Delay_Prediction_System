/**
 * @fileoverview Import Routes
 * §6 of the RBAC V7 plan.
 */
const express = require('express');
const router = express.Router();
const importController = require('../controllers/import.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize, authorizeAll } = require('../middlewares/rbac.middleware');
const { uploadSingle } = require('../middlewares/upload.middleware');

router.post('/projects', 
  authenticate, 
  authorize('projects', 'write', { requireScope: 'all' }), 
  uploadSingle('file'), 
  importController.importProjects
);

router.get('/', 
  authenticate, 
  authorize('projects', 'read', { requireScope: 'all' }), 
  importController.listImports
);

module.exports = router;
