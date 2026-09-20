/**
 * @fileoverview Status Routes
 * Mounted at '/api/v1/projects', so paths here are relative to that.
 * §6 of the RBAC V7 plan.
 */
const express = require('express');
const router = express.Router();

const controller = require('../controllers/status.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const { auditRequest } = require('../middlewares/audit.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { statusUpdateValidators } = require('../validators/status.validator');

router.use(authenticate);

// GET /projects/:projectId/status — stages_events:read, scope enforced in service
router.get(
  '/:projectId/status',
  authorize('stages_events', 'read'),
  controller.getCurrentStatus
);

// PATCH /projects/:projectId/status — stages_events:write, scope enforced in service
router.patch(
  '/:projectId/status',
  authorize('stages_events', 'write'),
  statusUpdateValidators,
  validate,
  auditRequest('status_updated'),
  controller.updateStatus
);

module.exports = router;
