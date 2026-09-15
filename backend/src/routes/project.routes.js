/**
 * @fileoverview Project Routes
 */
const express = require('express');
const router = express.Router();

const controller = require('../controllers/project.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  projectCreateValidators,
  projectUpdateValidators,
  assignManagerValidators,
  projectListQueryValidators,
} = require('../validators/project.validator');

// All project routes require authentication
router.use(authenticate);

// GET /projects — both roles (PM scoped to own projects in the service)
router.get('/', projectListQueryValidators, validate, controller.listProjects);

// POST /projects — ADMIN only
router.post(
  '/',
  requireRole('ADMIN'),
  projectCreateValidators,
  validate,
  controller.createProject
);

// GET /projects/:projectId — both roles (PM ownership checked in the service)
router.get('/:projectId', controller.getProject);

// PATCH /projects/:projectId — ADMIN only
router.patch(
  '/:projectId',
  requireRole('ADMIN'),
  projectUpdateValidators,
  validate,
  controller.updateProject
);

// DELETE /projects/:projectId — ADMIN only
router.delete('/:projectId', requireRole('ADMIN'), controller.deleteProject);

// PATCH /projects/:projectId/assign-manager — ADMIN only
router.patch(
  '/:projectId/assign-manager',
  requireRole('ADMIN'),
  assignManagerValidators,
  validate,
  controller.assignManager
);

module.exports = router;