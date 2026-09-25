/**
 * @fileoverview Assignment Service
 * Manages ProjectAssignment rows.
 *
 * Project assignment rules:
 * - Only active PROJECT_MANAGER users can be assigned.
 * - One project can have only one Project Manager.
 * - Reassignment replaces the previous Project Manager.
 */
const prisma = require('../config/database');
const { logInTx } = require('./audit.service');

/**
 * Get the Project Manager assigned to a project.
 *
 * Returns:
 *   user object
 * or
 *   null
 */
async function getProjectAssignments(projectId) {
  const assignment = await prisma.projectAssignment.findFirst({
    where: {
      project_id: projectId,
      user: {
        role: 'PROJECT_MANAGER',
      },
    },
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
  });

  return assignment ? assignment.user : null;
}

/**
 * Assign exactly one Project Manager to a project.
 *
 * userIds:
 *   []       -> remove current PM
 *   [userId] -> assign that PM
 */
async function setProjectAssignments(actor, projectId, userIds) {
  // --------------------------------------------------
  // 1. Validate project
  // --------------------------------------------------
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    err.code = 'PROJECT_NOT_FOUND';
    throw err;
  }

  // --------------------------------------------------
  // 2. Only one PM is allowed
  // --------------------------------------------------
  if (userIds.length > 1) {
    const err = new Error(
      'Only one Project Manager can be assigned to a project'
    );

    err.statusCode = 400;
    err.code = 'MULTIPLE_PROJECT_MANAGERS';

    throw err;
  }

  // --------------------------------------------------
  // 3. Normalize user ID
  // --------------------------------------------------
  const uniqueUserIds = [...new Set(userIds)];

  // --------------------------------------------------
  // 4. Validate selected PM
  // --------------------------------------------------
  if (uniqueUserIds.length === 1) {
    const userId = Number(uniqueUserIds[0]);

    if (!Number.isInteger(userId)) {
      const err = new Error('Invalid Project Manager ID');
      err.statusCode = 400;
      err.code = 'INVALID_USER_ID';
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
      },
    });

    if (!user) {
      const err = new Error('Project Manager not found');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    if (!user.is_active) {
      const err = new Error(
        'This Project Manager is inactive and cannot be assigned'
      );

      err.statusCode = 400;
      err.code = 'USER_INACTIVE';

      throw err;
    }

    if (user.role !== 'PROJECT_MANAGER') {
      const err = new Error(
        'Selected user is not a Project Manager'
      );

      err.statusCode = 400;
      err.code = 'INVALID_ASSIGNMENT_ROLE';

      throw err;
    }
  }

  // --------------------------------------------------
  // 5. Get current assignment
  // --------------------------------------------------
  const currentAssignment =
    await prisma.projectAssignment.findFirst({
      where: {
        project_id: projectId,
        user: {
          role: 'PROJECT_MANAGER',
        },
      },
      select: {
        user_id: true,
      },
    });

  const before = currentAssignment
    ? [currentAssignment.user_id]
    : [];

  const after = uniqueUserIds;

  // --------------------------------------------------
  // 6. No change
  // --------------------------------------------------
  if (
    before.length === after.length &&
    before.every((id) => after.includes(id))
  ) {
    return {
      changed: false,
      projectId,
      before,
      after,
    };
  }

  // --------------------------------------------------
  // 7. Replace assignment inside transaction
  // --------------------------------------------------
  await prisma.$transaction(async (tx) => {
    // Remove existing PM assignment
    await tx.projectAssignment.deleteMany({
      where: {
        project_id: projectId,
      },
    });

    // Add new PM
    if (after.length === 1) {
      await tx.projectAssignment.create({
        data: {
          project_id: projectId,
          user_id: after[0],
        },
      });
    }

    // Audit
    await logInTx(
      tx,
      actor,
      'project_manager_assigned',
      'projects',
      projectId,
      {
        before,
        after,
      }
    );
  });

  return {
    changed: true,
    projectId,
    before,
    after,
  };
}

module.exports = {
  getProjectAssignments,
  setProjectAssignments,
};