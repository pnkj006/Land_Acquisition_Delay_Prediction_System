/**
 * @fileoverview Runs after express-validator field validators
 * (e.g. body('email').isEmail()) to check accumulated errors.
 * Usage: router.post('/login', someFieldValidators, validate, controller.login)
 */
const { validationResult } = require('express-validator');

// Helper to convert snake_case string to camelCase
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

exports.validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = {};
    errors.array().forEach(e => {
      // Map field name to camelCase (e.g. project_id -> projectId)
      const field = toCamelCase(e.path || e.param || '');
      if (field) {
        if (!details[field]) details[field] = [];
        details[field].push(e.msg);
      }
    });

    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    err.details = details;
    return next(err);
  }

  next();
};