/**
 * @fileoverview Config routes.
 */
const router = require('express').Router();
const { sendSuccess } = require('../utils/response');
const { ALLOW_PUBLIC_SIGNUP } = require('../config/env');

router.get('/', (req, res) => {
  return sendSuccess(res, {
    allowPublicSignup: ALLOW_PUBLIC_SIGNUP,
  }, 'Config retrieved successfully');
});

module.exports = router;
