/**
 * @fileoverview Status Routes
 * Mounted at the same base as project.routes.js ('/api/v1/projects'),
 * so paths here are relative to that: '/:projectId/status'.
 */
const express = require('express');
const router = express.Router();

const controller = require('../controllers/status.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { statusUpdateValidators } = require('../validators/status.validator');
const { requireRole } = require('../middlewares/role.middleware');
router.use(authenticate);

// GET /projects/:projectId/status — both roles (PM ownership checked in the service)
router.get('/:projectId/status', controller.getCurrentStatus);

// PATCH /projects/:projectId/status — only PM

router.patch(
  '/:projectId/status',
  requireRole('PROJECT_MANAGER'),
  statusUpdateValidators,
  validate,
  controller.updateStatus
);

module.exports = router;