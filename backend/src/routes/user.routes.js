/**
 * @description Routes for user management.
 * §6, §7 of the RBAC V7 plan.
 */
const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createUserValidator, updateUserValidator } = require('../validators/user.validator');
const userController = require('../controllers/user.controller');
const permissionController = require('../controllers/permission.controller');

router.use(authenticate);

// GET /users — users:read
router.get('/', authorize('users', 'read'), userController.listUsers);

// POST /users — users:write
router.post(
  '/', 
  authorize('users', 'write'), 
  createUserValidator, 
  validate, 
  userController.createUser
);

// PATCH /users/:userId — users:write
router.patch(
  '/:userId', 
  authorize('users', 'write'), 
  updateUserValidator, 
  validate, 
  userController.updateUser
);

// DELETE /users/:userId — users:delete
router.delete(
  '/:userId', 
  authorize('users', 'delete'), 
  userController.deleteUser
);

// GET /users/:id/permissions — users:read
router.get(
  '/:id/permissions',
  authorize('users', 'read'),
  permissionController.getPermissions
);

// PUT /users/:id/permissions — users:write
router.put(
  '/:id/permissions',
  authorize('users', 'write'),
  permissionController.setPermissions
);

module.exports = router;
