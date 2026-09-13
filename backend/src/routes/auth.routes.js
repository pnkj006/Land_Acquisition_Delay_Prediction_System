/**
 * @description Routes for authentication.
 */
const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const rateLimit = require('../middlewares/rateLimit.middleware'); // rateLimit assumed to export a single ready-to-use middleware; adjust if it's a factory
const { loginValidator } = require('../validators/auth.validator');
const authController = require('../controllers/auth.controller');

// POST /auth/login — public, rate-limited
router.post('/login', rateLimit, loginValidator, validate, authController.login);

// POST /auth/logout — requires auth
router.post('/logout', authenticate, authController.logout);

// GET /auth/me — requires auth
router.get('/me', authenticate, authController.me);

module.exports = router;
