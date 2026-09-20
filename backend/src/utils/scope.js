/**
 * @fileoverview Scope helpers for project-level access control.
 *
 * Rules (§5.4 of the RBAC V7 plan):
 * - scope is determined solely by the base role (ADMIN/SENIOR_OFFICIAL = 'all',
 *   PROJECT_MANAGER/STAFF = 'own').
 * - "own" = projects the user is assigned to via project_assignments.
 * - Uses Prisma relation filters, never lists of IDs.
 * - assertProjectInScope: non-existent and out-of-scope both return the same 404.
 */
const prisma = require('../config/database');

/**
 * Returns a Prisma `where` fragment that scopes projects to the user.
 * For 'all' scope: returns {} (no restriction).
 * For 'own' scope: returns a relation filter on project_assignments.
 *
 * @param {Object} user - req.user (must have .id and .role)
 * @returns {Object} Prisma where clause fragment
 */
function projectScopeWhere(user) {
  // ADMIN and SENIOR_OFFICIAL have full scope
  if (user.role === 'ADMIN' || user.role === 'SENIOR_OFFICIAL') {
    return {};
  }
  // PROJECT_MANAGER and STAFF: own scope via assignments
  return {
    project_assignments: {
      some: { user_id: user.id },
    },
  };
}

/**
 * Returns a Prisma `where` fragment that scopes child records (e.g., alerts,
 * recommendations) by their project relation.
 *
 * @param {Object} user - req.user
 * @param {string} relationPath - dot-separated path to the project, e.g. 'project' or 'prediction.project'
 * @returns {Object} Prisma where clause fragment
 */
function childScopeWhere(user, relationPath) {
  const scopeWhere = projectScopeWhere(user);
  if (Object.keys(scopeWhere).length === 0) return {}; // all-scope

  // Build nested object: 'project' → { project: scopeWhere }
  // 'prediction.project' → { prediction: { project: scopeWhere } }
  const parts = relationPath.split('.').reverse();
  let result = scopeWhere;
  for (const part of parts) {
    result = { [part]: result };
  }
  return result;
}

/**
 * Asserts that the project exists AND is accessible by the user.
 * Non-existent and out-of-scope produce identical 404s (information hiding).
 *
 * @param {Object} user - req.user
 * @param {number} projectId - internal numeric project id
 * @throws Error with statusCode 404 if not found or out of scope
 * @returns {Promise<Object>} the project record
 */
async function assertProjectInScope(user, projectId) {
  const scopeWhere = projectScopeWhere(user);
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...scopeWhere },
  });

  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    err.code = 'PROJECT_NOT_FOUND';
    throw err;
  }

  return project;
}

module.exports = { projectScopeWhere, childScopeWhere, assertProjectInScope };
