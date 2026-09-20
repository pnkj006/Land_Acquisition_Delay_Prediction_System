/**
 * @fileoverview Assignment Service
 * Manages ProjectAssignment rows.
 * §7.4 of the RBAC V7 plan.
 */
const prisma = require('../config/database');
const { logInTx } = require('./audit.service');

/**
 * getProjectAssignments(projectId)
 * Returns the list of users assigned to a project.
 */
async function getProjectAssignments(projectId) {
  const assignments = await prisma.projectAssignment.findMany({
    where: { project_id: projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          is_active: true,
        },
      },
    },
    orderBy: { user_id: 'asc' },
  });

  return assignments.map(a => a.user);
}

/**
 * setProjectAssignments(actor, projectId, userIds)
 * Full replace of assigned users.
 * actor: req.user
 */
async function setProjectAssignments(actor, projectId, userIds) {
  // Validate project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  // Deduplicate userIds
  const uniqueUserIds = [...new Set(userIds)];

  // Validate users exist and are valid roles (PM or STAFF)
  if (uniqueUserIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: { id: true, role: true, is_active: true },
    });

    if (users.length !== uniqueUserIds.length) {
      const err = new Error('One or more users not found');
      err.statusCode = 400;
      throw err;
    }

    for (const user of users) {
      if (!user.is_active) {
        const err = new Error(`User ${user.id} is inactive and cannot be assigned`);
        err.statusCode = 400;
        throw err;
      }
      // Only PM and STAFF can be assigned. ADMIN and SENIOR_OFFICIAL have global scope.
      if (user.role === 'ADMIN' || user.role === 'SENIOR_OFFICIAL') {
        const err = new Error(`User ${user.id} has role ${user.role} and cannot be assigned to specific projects`);
        err.statusCode = 400;
        throw err;
      }
    }
  }

  // Get current assignments for diff
  const currentAssignments = await prisma.projectAssignment.findMany({
    where: { project_id: projectId },
    select: { user_id: true },
  });
  
  const before = currentAssignments.map(a => a.user_id).sort((a, b) => a - b);
  const after = [...uniqueUserIds].sort((a, b) => a - b);

  if (JSON.stringify(before) === JSON.stringify(after)) {
    return { changed: false, before, after };
  }

  // Apply in transaction
  await prisma.$transaction(async (tx) => {
    // Delete all
    await tx.projectAssignment.deleteMany({
      where: { project_id: projectId },
    });

    // Create new
    if (after.length > 0) {
      await tx.projectAssignment.createMany({
        data: after.map(userId => ({
          project_id: projectId,
          user_id: userId,
        })),
      });
    }

    // Log
    await logInTx(tx, actor, 'assignments_updated', 'projects', projectId, { before, after });
  });

  return { changed: true, before, after };
}

module.exports = { getProjectAssignments, setProjectAssignments };
