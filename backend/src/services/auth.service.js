/**
 * @description Service for authentication logic.
 */
const prisma = require('../config/database');
const logger = require('../config/logger');
const { signToken } = require('../utils/jwt');
const { comparePassword } = require('../utils/password');
const { USER_SELECT_SAFE } = require('../models/User');

/**
 * login(email, password)
 * - Find user by email (include password_hash)
 * - If not found → throw Error with message 'Invalid credentials' and status 401
 * - Compare password → if mismatch → throw same error
 * - Sign JWT with payload { id, email, role, name }
 * - Return { token, user: (safe user object without password_hash) }
 */
async function login(email, password) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    logger.info(`User logged in: ${user.id}`);
    return { token, user: safeUser };
  } catch (error) {
    logger.error(`Login error for email ${email}: ${error.message}`);
    throw error;
  }
}

/**
 * getMe(userId)
 * - Find user by id selecting USER_SELECT_SAFE fields
 * - If not found → throw Error with message 'User not found' and status 404
 * - Return the user
 */
async function getMe(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT_SAFE
    });

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    return user;
  } catch (error) {
    logger.error(`getMe error for user ${userId}: ${error.message}`);
    throw error;
  }
}

module.exports = { login, getMe };
