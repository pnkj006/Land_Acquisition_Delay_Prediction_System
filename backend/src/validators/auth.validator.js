/**
 * @description Express validators for auth routes.
 */
const { body } = require('express-validator');

const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
];

const signupValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').optional().isString().trim().notEmpty().withMessage('Name must be a valid string')
];

module.exports = { loginValidator, signupValidator };
