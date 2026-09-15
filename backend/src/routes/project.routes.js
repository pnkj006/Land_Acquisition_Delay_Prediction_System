/**
 * @fileoverview Project Routes
 */
const express = require('express');
const router = express.Router();

const controller = require('../controllers/project.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const {
  projectCreateSchema,
  projectUpdateSchema,
  assignManagerSchema,
  projectListQuerySchema,
} = require('../validators/project.validator');

// All project routes require authentication
router.use(authMiddleware);

// GET /projects — both roles (PM scoped to own projects in the service)
router.get(
  '/',
  validate(projectListQuerySchema, { source: 'query' }),
  controller.listProjects
);

// POST /projects — ADMIN only
router.post(
  '/',
  roleMiddleware('ADMIN'),
  validate(projectCreateSchema),
  controller.createProject
);

// GET /projects/:projectId — both roles (PM ownership checked in the service)
router.get('/:projectId', controller.getProject);

// PATCH /projects/:projectId — ADMIN only
router.patch(
  '/:projectId',
  roleMiddleware('ADMIN'),
  validate(projectUpdateSchema),
  controller.updateProject
);

// DELETE /projects/:projectId — ADMIN only
router.delete('/:projectId', roleMiddleware('ADMIN'), controller.deleteProject);

// PATCH /projects/:projectId/assign-manager — ADMIN only
router.patch(
  '/:projectId/assign-manager',
  roleMiddleware('ADMIN'),
  validate(assignManagerSchema),
  controller.assignManager
);

module.exports = router;