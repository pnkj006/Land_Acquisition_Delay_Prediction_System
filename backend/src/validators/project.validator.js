/**
 * @fileoverview express-validator chains for the Projects module.
 * Used as: router.post('/', ...projectCreateValidators, validate, controller.createProject)
 */
const { body, query } = require('express-validator');

const PROJECT_TYPES = ['HIGHWAY', 'RAILWAY', 'IRRIGATION', 'POWER', 'INDUSTRIAL', 'OTHER'];
const RISK_LEVELS = ['HIGH', 'MEDIUM', 'LOW'];
const RESPONSIVENESS_LEVELS = ['HIGH', 'MEDIUM', 'LOW'];
const DELAY_STATUSES = ['DELAYED', 'ON_TIME'];
const SORT_FIELDS = ['riskScore', 'created_at', 'updated_at', 'delay_days', 'project_id'];

// ─────────────────────────────
// CREATE
// ─────────────────────────────
exports.projectCreateValidators = [
  body('project_id').trim().notEmpty().withMessage('project_id is required').isLength({ max: 100 }),
  body('project_type').optional().isIn(PROJECT_TYPES).withMessage('Invalid project_type'),
  body('land_area_hectares').optional().isFloat({ min: 0 }),
  body('number_of_affected_families').optional().isInt({ min: 0 }),
  body('compensation_status').optional().isString().isLength({ max: 100 }),
  body('approval_timeline_days').optional().isInt({ min: 0 }),
  body('legal_disputes_count').optional().isInt({ min: 0 }),
  body('possession_status').optional().isString().isLength({ max: 100 }),
  body('rehabilitation_progress_pct').optional().isFloat({ min: 0, max: 100 }),
  body('stakeholder_responsiveness').optional().isIn(RESPONSIVENESS_LEVELS),
  body('historical_performance_score').optional().isFloat({ min: 0, max: 1 }),
  body('administrator_id').optional().isInt(),
  body('project_manager_id').optional().isInt(),
  body('manager').optional().isString().isLength({ max: 150 }),
  body('location').optional().isString().isLength({ max: 255 }),
  body('state').optional().isString().isLength({ max: 100 }),
  body('district').optional().isString().isLength({ max: 100 }),
  body('altitude_m').optional().isFloat(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('delay_status').optional().isIn(DELAY_STATUSES),
  body('delay_days').optional().isInt({ min: 0 }),
  body('risk_score').optional().isFloat({ min: 0, max: 1 }),
];

// ─────────────────────────────
// UPDATE
// ─────────────────────────────
exports.projectUpdateValidators = [
  body('project_type').optional().isIn(PROJECT_TYPES),
  body('land_area_hectares').optional().isFloat({ min: 0 }),
  body('number_of_affected_families').optional().isInt({ min: 0 }),
  body('compensation_status').optional().isString().isLength({ max: 100 }),
  body('approval_timeline_days').optional().isInt({ min: 0 }),
  body('legal_disputes_count').optional().isInt({ min: 0 }),
  body('possession_status').optional().isString().isLength({ max: 100 }),
  body('rehabilitation_progress_pct').optional().isFloat({ min: 0, max: 100 }),
  body('stakeholder_responsiveness').optional().isIn(RESPONSIVENESS_LEVELS),
  body('historical_performance_score').optional().isFloat({ min: 0, max: 1 }),
  body('administrator_id').optional().isInt(),
  body('manager').optional().isString().isLength({ max: 150 }),
  body('location').optional().isString().isLength({ max: 255 }),
  body('state').optional().isString().isLength({ max: 100 }),
  body('district').optional().isString().isLength({ max: 100 }),
  body('altitude_m').optional().isFloat(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('delay_status').optional().isIn(DELAY_STATUSES),
  body('delay_days').optional().isInt({ min: 0 }),
  body('risk_score').optional().isFloat({ min: 0, max: 1 }),
  body().custom((value, { req }) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new Error('At least one field is required to update');
    }
    return true;
  }),
];

// ─────────────────────────────
// ASSIGN MANAGER
// ─────────────────────────────
exports.assignManagerValidators = [
  body('project_manager_id').isInt().withMessage('project_manager_id is required and must be an integer'),
];

// ─────────────────────────────
// LIST QUERY PARAMS
// ─────────────────────────────
exports.projectListQueryValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString().isLength({ max: 255 }),
  query('state').optional().isString().isLength({ max: 100 }),
  query('district').optional().isString().isLength({ max: 100 }),
  query('projectType').optional().isIn(PROJECT_TYPES),
  query('riskLevel').optional().isIn(RISK_LEVELS),
  query('managerId').optional().isString(),
  query('sortBy').optional().isIn(SORT_FIELDS),
  query('sortOrder').optional().isIn(['asc', 'desc']),
];