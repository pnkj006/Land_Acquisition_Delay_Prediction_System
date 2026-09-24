/**
 * @fileoverview express-validator chains for Stage Progress module.
 */
const { body } = require('express-validator');

const PROJECT_STAGES = [
  'NOTIFICATION',
  'APPROVAL',
  'LAND_ACQUISITION',
  'COMPENSATION',
  'REHABILITATION',
  'POSSESSION',
];

exports.stageProgressUpdateValidators = [
  body('stage')
    .exists()
    .withMessage('Stage is required')
    .isIn(PROJECT_STAGES)
    .withMessage('Invalid project stage'),

  body('progressPct')
    .exists()
    .withMessage('Progress percentage is required')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Progress percentage must be between 0 and 100'),

  body().custom((value, { req }) => {
    const allowedFields = ['stage', 'progressPct'];
    const receivedFields = Object.keys(req.body || {});

    const hasUnknownField = receivedFields.some(
      (field) => !allowedFields.includes(field)
    );

    if (hasUnknownField) {
      throw new Error('Only stage and progressPct are allowed');
    }

    return true;
  }),
];