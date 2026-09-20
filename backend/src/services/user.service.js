/**
 * @description Service for user management.
 * All mutations use logInTx.
 * §7.5 of the RBAC V7 plan.
 */
const prisma = require('../config/database');
const logger = require('../config/logger');
const { hashPassword } = require('../utils/password');
const { USER_SELECT_SAFE } = require('../models/User');
const { logInTx } = require('./audit.service');
const { allowlist } = require('../config/permissions');

/**
 * listUsers(filters, page, limit, skip)
 * filters: { role?, search?, is_active? } — search matches name OR email (case-insensitive)
 * Returns { items: User[], total: number }
 */
async function listUsers(filters, page, limit, skip) {
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
  if (filters.is_active !== undefined) {
    where.is_active = filters.is_active === 'true' || filters.is_active === true;
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
}

/**
 * createUser(data, actor)
 * data: { name, email, password, role }
 */
async function createUser(data, actor) {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    const err = new Error('Email already taken');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await hashPassword(data.password);
  
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password_hash: hashedPassword,
        role: data.role,
        is_active: true,
      },
      select: USER_SELECT_SAFE
    });

    await logInTx(tx, actor, 'user_created', 'users', user.id, {
      name: user.name,
      email: user.email,
      role: user.role
    });

    return user;
  });
}

/**
 * updateUser(userId, data, actor)
 * data: { name?, email?, role?, is_active? }
 */
async function updateUser(userId, data, actor) {
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    include: { permissions: true }
  });
  
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

  // Safety checks
  if (data.is_active === false && actor.id === userId) {
    const err = new Error('You cannot deactivate your own account');
    err.statusCode = 400;
    throw err;
  }
  
  if (data.role && data.role !== 'ADMIN' && user.role === 'ADMIN') {
    // Check if this is the last active admin
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN', is_active: true }
    });
    if (adminCount <= 1) {
      const err = new Error('Cannot change role of the last active administrator');
      err.statusCode = 400;
      throw err;
    }
  }

  if (data.is_active === false && user.role === 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN', is_active: true }
    });
    if (adminCount <= 1) {
      const err = new Error('Cannot deactivate the last active administrator');
      err.statusCode = 400;
      throw err;
    }
  }

  return prisma.$transaction(async (tx) => {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: updateData,
      select: USER_SELECT_SAFE
    });

    // If role changed, cleanup invalid permissions and assignments
    const details = { ...updateData };
    
    if (data.role && data.role !== user.role) {
      actionName = 'role_changed';
      const allowed = allowlist[data.role] || new Set();
      const invalidPerms = user.permissions.filter(p => !allowed.has(`${p.resource}:${p.action}`));
      
      if (invalidPerms.length > 0) {
        details.removed_grants = invalidPerms.map(p => `${p.resource}:${p.action}`);
        await tx.userPermission.deleteMany({
          where: { id: { in: invalidPerms.map(p => p.id) } }
        });
      }

      if (data.role === 'ADMIN' || data.role === 'SENIOR_OFFICIAL') {
        const assignments = await tx.projectAssignment.findMany({
          where: { user_id: userId },
          select: { project_id: true }
        });
        if (assignments.length > 0) {
          details.removed_assignment_ids = assignments.map(a => a.project_id);
          await tx.projectAssignment.deleteMany({
            where: { user_id: userId }
          });
        }
      }
    }

    await logInTx(tx, actor, actionName, 'users', updatedUser.id, details);

    return updatedUser;
  });
}

/**
 * deleteUser(userId, actor)
 * In most systems we soft delete (is_active=false), but this does hard delete if requested.
 */
async function deleteUser(userId, actor) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  if (actor.id === userId) {
    const err = new Error('You cannot delete your own account');
    err.statusCode = 400;
    throw err;
  }

  if (user.role === 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN', is_active: true }
    });
    if (adminCount <= 1) {
      const err = new Error('Cannot delete the last administrator');
      err.statusCode = 400;
      throw err;
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.user.delete({ where: { id: userId } });
    await logInTx(tx, actor, 'user_deleted', 'users', userId, { email: user.email });
    return { id: userId };
  });
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
