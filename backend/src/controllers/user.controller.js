/**
 * @description Controller for user management endpoints.
 */
const userService = require('../services/user.service');
const { getPagination } = require('../utils/pagination');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

async function listUsers(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filters = {
      role: req.query.role,
      search: req.query.search,
      is_active: req.query.is_active
    };
    
    const { items, total } = await userService.listUsers(filters, page, limit, skip);
    return sendPaginated(res, items, page, limit, total, 'Users retrieved');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, 'USER_ERROR', err.statusCode);
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req.body, req.user);
    return sendSuccess(res, user, 'User created', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, 'USER_ERROR', err.statusCode);
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return sendError(res, 'Invalid user ID', 'VALIDATION_ERROR', 400);
    }
    const user = await userService.updateUser(userId, req.body, req.user);
    return sendSuccess(res, user, 'User updated', 200);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, 'USER_ERROR', err.statusCode);
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return sendError(res, 'Invalid user ID', 'VALIDATION_ERROR', 400);
    }
    const result = await userService.deleteUser(userId, req.user);
    return sendSuccess(res, result, 'User deleted', 200);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, 'USER_ERROR', err.statusCode);
    next(err);
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
