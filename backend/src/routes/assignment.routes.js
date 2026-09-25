const express = require('express');
const router = express.Router();

const assignmentController = require('../controllers/assignment.controller');
const { authenticate } = require('../middleware/auth');
const { isRbacGuard, authorize } = require('../middleware/rbac');

router.use(authenticate);
router.use(isRbacGuard);

// Get users currently assigned to a project
router.get(
  '/projects/:projectId/assignments',
  authorize('projects', 'read'),
  assignmentController.getAssignments
);

// Replace project assignments
router.put(
  '/projects/:projectId/assignments',
  authorize('projects', 'update'),
  assignmentController.setAssignments
);

module.exports = router;