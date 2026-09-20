/**
 * @fileoverview Project Routes
 * §6 of the RBAC V7 plan.
 */
const express = require('express');
const router = express.Router();

const controller = require('../controllers/project.controller');
const assignmentController = require('../controllers/assignment.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const { auditRequest } = require('../middlewares/audit.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  projectCreateValidators,
  projectUpdateValidators,
  projectListQueryValidators,
} = require('../validators/project.validator');

// All project routes require authentication
router.use(authenticate);

// GET /projects — all roles with projects:read (silently scope-filtered)
router.get(
  '/',
  authorize('projects', 'read'),
  projectListQueryValidators,
  validate,
  controller.listProjects
);

// POST /projects — requires projects:write AND global scope (ADMIN only in practice)
router.post(
  '/',
  authorize('projects', 'write', { requireScope: 'all' }),
  projectCreateValidators,
  validate,
  auditRequest('project_created'),
  controller.createProject
);

// GET /projects/:projectId — scope-checked in service
router.get(
  '/:projectId',
  authorize('projects', 'read'),
  controller.getProject
);

// PATCH /projects/:projectId — scope-checked in service
router.patch(
  '/:projectId',
  authorize('projects', 'write'),
  projectUpdateValidators,
  validate,
  auditRequest('project_updated'),
  controller.updateProject
);

// GET /projects/:id/assignments — assignments:read
router.get(
  '/:projectId/assignments',
  authorize('assignments', 'read'),
  assignmentController.getAssignments
);

// PUT /projects/:id/assignments — assignments:write (admin only in practice)
router.put(
  '/:projectId/assignments',
  authorize('assignments', 'write'),
  assignmentController.setAssignments
);

module.exports = router;
