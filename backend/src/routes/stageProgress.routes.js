const express = require('express');
const router = express.Router();

const controller = require('../controllers/stageProgress.controller');

const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const { auditRequest } = require('../middlewares/audit.middleware');
const { validate } = require('../middlewares/validation.middleware');

const {
  stageProgressUpdateValidators,
} = require('../validators/stateProgress.validator');

router.use(authenticate);

// GET /projects/:projectId/stage-progress
router.get(
  '/:projectId/stage-progress',
  authorize('stages_events', 'read'),
  controller.getStageProgress
);

// PATCH /projects/:projectId/stage-progress
router.patch(
  '/:projectId/stage-progress',
  authorize('stages_events', 'write'),
  stageProgressUpdateValidators,
  validate,
  auditRequest('stage_progress_updated'),
  controller.updateStageProgress
);

module.exports = router;