/**
 * @description Express validators for auth routes.
 */
const { body } = require('express-validator');

const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
];

module.exports = { loginValidator };
