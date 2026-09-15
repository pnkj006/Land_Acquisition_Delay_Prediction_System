/**
 * @fileoverview Joi validation schemas for the Projects module.
 */
const Joi = require('joi');

const PROJECT_TYPES = ['HIGHWAY', 'RAILWAY', 'IRRIGATION', 'POWER', 'INDUSTRIAL', 'OTHER'];
const RISK_LEVELS = ['HIGH', 'MEDIUM', 'LOW'];
const RESPONSIVENESS_LEVELS = ['HIGH', 'MEDIUM', 'LOW'];
const DELAY_STATUSES = ['DELAYED', 'ON_TIME'];

// ─────────────────────────────
// CREATE
// ─────────────────────────────
exports.projectCreateSchema = Joi.object({
  project_id: Joi.string().trim().min(1).max(100).required(),
  project_type: Joi.string().valid(...PROJECT_TYPES),
  land_area_hectares: Joi.number().positive(),
  number_of_affected_families: Joi.number().integer().min(0),
  compensation_status: Joi.string().max(100),
  approval_timeline_days: Joi.number().integer().min(0),
  legal_disputes_count: Joi.number().integer().min(0).default(0),
  possession_status: Joi.string().max(100),
  rehabilitation_progress_pct: Joi.number().min(0).max(100),
  stakeholder_responsiveness: Joi.string().valid(...RESPONSIVENESS_LEVELS),
  historical_performance_score: Joi.number().min(0).max(1),
  administrator_id: Joi.number().integer(),
  project_manager_id: Joi.number().integer(),
  manager: Joi.string().max(150),
  location: Joi.string().max(255),
  state: Joi.string().max(100),
  district: Joi.string().max(100),
  altitude_m: Joi.number(),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  delay_status: Joi.string().valid(...DELAY_STATUSES),
  delay_days: Joi.number().integer().min(0),
  risk_score: Joi.number().min(0).max(1),
});

// ─────────────────────────────
// UPDATE (all optional, at least one required)
// ─────────────────────────────
exports.projectUpdateSchema = Joi.object({
  project_type: Joi.string().valid(...PROJECT_TYPES),
  land_area_hectares: Joi.number().positive(),
  number_of_affected_families: Joi.number().integer().min(0),
  compensation_status: Joi.string().max(100),
  approval_timeline_days: Joi.number().integer().min(0),
  legal_disputes_count: Joi.number().integer().min(0),
  possession_status: Joi.string().max(100),
  rehabilitation_progress_pct: Joi.number().min(0).max(100),
  stakeholder_responsiveness: Joi.string().valid(...RESPONSIVENESS_LEVELS),
  historical_performance_score: Joi.number().min(0).max(1),
  administrator_id: Joi.number().integer(),
  manager: Joi.string().max(150),
  location: Joi.string().max(255),
  state: Joi.string().max(100),
  district: Joi.string().max(100),
  altitude_m: Joi.number(),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  delay_status: Joi.string().valid(...DELAY_STATUSES),
  delay_days: Joi.number().integer().min(0),
  risk_score: Joi.number().min(0).max(1),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required to update' });

// ─────────────────────────────
// ASSIGN MANAGER
// ─────────────────────────────
exports.assignManagerSchema = Joi.object({
  project_manager_id: Joi.number().integer().required(),
});

// ─────────────────────────────
// LIST QUERY PARAMS
// ─────────────────────────────
exports.projectListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().max(255).allow(''),
  state: Joi.string().max(100),
  district: Joi.string().max(100),
  projectType: Joi.string().valid(...PROJECT_TYPES),
  riskLevel: Joi.string().valid(...RISK_LEVELS),
  managerId: Joi.string(), // accepted as string from query, parsed in service
  sortBy: Joi.string().valid(
    'riskScore', 'created_at', 'updated_at', 'delay_days', 'project_id'
  ),
  sortOrder: Joi.string().valid('asc', 'desc'),
});