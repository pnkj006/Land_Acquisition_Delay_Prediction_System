/**
 * @description Express validators for user routes.
 */
const { body } = require('express-validator');
const { UserRole } = require('../models/User');

const createUserValidator = [
  body('name').notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('role').isIn(Object.values(UserRole)).withMessage('Invalid role')
];

const updateUserValidator = [
  body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('role').optional().isIn(Object.values(UserRole)).withMessage('Invalid role'),
  body('is_active').optional().isBoolean({ strict: true }).withMessage('is_active must be a boolean'),
  body().custom(value => {
    if (value.name === undefined && value.email === undefined && value.role === undefined && value.is_active === undefined) {
      throw new Error('At least one field (name, email, role, is_active) must be provided for update');
    }
    return true;
  })
];

module.exports = { createUserValidator, updateUserValidator };
