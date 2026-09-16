/**
 * @description Controller for auth endpoints.
 */
const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return sendSuccess(res, result, 'Login successful');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, 'AUTH_ERROR', err.statusCode);
    next(err);
  }
}

async function logout(req, res, next) {
  // TODO: implement token blacklist (Redis/DB) for production
  // For now, soft logout — client must discard the token
  return sendSuccess(res, null, 'Logged out successfully');
}

async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    return sendSuccess(res, { user }, 'User retrieved');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, 'USER_NOT_FOUND', err.statusCode);
    next(err);
  }
}

async function signup(req, res, next) {
  try {
    const data = req.body;
    // Default role to USER if not provided (or handle based on your system's defaults)
    const result = await authService.signup(data);
    return sendSuccess(res, result, 'Signup successful', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, 'SIGNUP_ERROR', err.statusCode);
    next(err);
  }
}

module.exports = { login, logout, me, signup };
