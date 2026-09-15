/**
 * @fileoverview Runs after express-validator field validators
 * (e.g. body('email').isEmail()) to check accumulated errors.
 * Usage: router.post('/login', someFieldValidators, validate, controller.login)
 */
const { validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const err = new Error(errors.array().map((e) => e.msg).join(', '));
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    return next(err);
  }

  next();
};