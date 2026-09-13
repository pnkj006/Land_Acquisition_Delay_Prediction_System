/**
 * @description Routes for user management.
 */
const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { auditLog } = require('../middlewares/audit.middleware');
const { createUserValidator, updateUserValidator } = require('../validators/user.validator');
const userController = require('../controllers/user.controller');
const { UserRole } = require('../models/User');

// GET /users → ADMIN only
router.get('/', authenticate, requireRole(UserRole.ADMIN), userController.listUsers);

// POST /users → ADMIN only
router.post(
  '/', 
  authenticate, 
  requireRole(UserRole.ADMIN), 
  createUserValidator, 
  validate, 
  userController.createUser, 
  auditLog('CREATE_USER')
);

// PATCH /users/:userId → ADMIN and PROJECT_MANAGER
// Note: Additional logic to prevent PMs from updating others might be needed in the controller/service
router.patch(
  '/:userId', 
  authenticate, 
  requireRole(UserRole.ADMIN, UserRole.PROJECT_MANAGER), 
  updateUserValidator, 
  validate, 
  userController.updateUser,
  auditLog('UPDATE_USER')
);

// DELETE /users/:userId → ADMIN only
router.delete(
  '/:userId', 
  authenticate, 
  requireRole(UserRole.ADMIN), 
  userController.deleteUser,
  auditLog('DELETE_USER')
);

module.exports = router;
