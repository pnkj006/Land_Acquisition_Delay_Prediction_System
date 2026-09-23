/**
 * @fileoverview Config routes.
 */
const router = require('express').Router();
const { sendSuccess } = require('../utils/response');
const { ALLOW_PUBLIC_SIGNUP } = require('../config/env');

// Public route: This is intentionally public as the login page needs configuration
// (like allowPublicSignup) before the user is authenticated.
router.get('/', (req, res) => {
  return sendSuccess(res, {
    allowPublicSignup: ALLOW_PUBLIC_SIGNUP,
  }, 'Config retrieved successfully');
});

module.exports = router;
