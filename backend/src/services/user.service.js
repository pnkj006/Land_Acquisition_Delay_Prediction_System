/**
 * @description Service for user management.
 */
const prisma = require('../config/database');
const logger = require('../config/logger');
const { hashPassword } = require('../utils/password');
const { USER_SELECT_SAFE } = require('../models/User');

/**
 * listUsers(filters, page, limit, skip)
 * filters: { role?, search? } — search matches name OR email (case-insensitive)
 * Returns { items: User[], total: number }
 */
async function listUsers(filters, page, limit, skip) {
  try {
    const where = {};
    if (filters.role) {
      where.role = filters.role;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_SELECT_SAFE,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return { items, total };
  } catch (error) {
    logger.error(`listUsers error: ${error.message}`);
    throw error;
  }
}

/**
 * createUser(data)
 * data: { name, email, password, role }
 * - Check email uniqueness → throw 409 if taken
 * - Hash password
 * - Create user, return USER_SELECT_SAFE fields
 */
async function createUser(data) {
  try {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      const err = new Error('Email already taken');
      err.statusCode = 409;
      throw err;
    }

    const hashedPassword = await hashPassword(data.password);
    
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password_hash: hashedPassword,
        role: data.role
      },
      select: USER_SELECT_SAFE
    });

    logger.info(`User created: ${user.id}`);
    return user;
  } catch (error) {
    logger.error(`createUser error: ${error.message}`);
    throw error;
  }
}

/**
 * updateUser(userId, data)
 * data: { name?, email?, role? }
 * - Find user → 404 if missing
 * - If email changing, check uniqueness → 409 if taken
 * - Update and return USER_SELECT_SAFE fields
 */
async function updateUser(userId, data) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) {
        const err = new Error('Email already taken');
        err.statusCode = 409;
        throw err;
      }
    }

    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: USER_SELECT_SAFE
    });

    logger.info(`User updated: ${updatedUser.id}`);
    return updatedUser;
  } catch (error) {
    logger.error(`updateUser error: ${error.message}`);
    throw error;
  }
}

/**
 * deleteUser(userId)
 * - Find user → 404 if missing
 * - Delete and return { id: userId }
 */
async function deleteUser(userId) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.user.delete({ where: { id: userId } });
    logger.info(`User deleted: ${userId}`);
    return { id: userId };
  } catch (error) {
    logger.error(`deleteUser error: ${error.message}`);
    throw error;
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
