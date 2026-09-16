/**
 * @fileoverview express-validator chains for the Status module.
 */
const { body } = require('express-validator');

const RESPONSIVENESS_LEVELS = ['HIGH', 'MEDIUM', 'LOW'];

exports.statusUpdateValidators = [
  body('compensation_status').optional().isString().isLength({ max: 100 }),
  body('approval_timeline_days').optional().isInt({ min: 0 }),
  body('legal_disputes_count').optional().isInt({ min: 0 }),
  body('possession_status').optional().isString().isLength({ max: 100 }),
  body('rehabilitation_progress_pct').optional().isFloat({ min: 0, max: 100 }),
  body('stakeholder_responsiveness').optional().isIn(RESPONSIVENESS_LEVELS),
  body().custom((value, { req }) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new Error('At least one status field is required to update');
    }
    return true;
  }),
];