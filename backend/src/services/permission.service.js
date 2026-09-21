/**
 * @fileoverview Permission Service
 * Manages UserPermission rows (grants) via full-replace PUT.
 * §7.2 of the RBAC V7 plan.
 */
const prisma = require('../config/database');
const { allowlist, roleDefaults, presets, getEffectivePermissions } = require('../config/permissions');
const { logInTx } = require('./audit.service');

/**
 * getUserPermissions(targetUserId)
 * Returns the permission payload for GET /users/:id/permissions.
 * Includes: role, defaults, grantable, grants, effective, presets.
 */
async function getUserPermissions(targetUserId) {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { permissions: true },
  });

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // Role defaults
  const defaults = [...(roleDefaults[user.role] || [])].sort();

  // Grantable for this role
  const grantable = [...(allowlist[user.role] || [])].sort();

  // Current grants (only allowlisted ones)
  const grants = user.permissions
    .map((p) => `${p.resource}:${p.action}`)
    .filter((k) => (allowlist[user.role] || new Set()).has(k))
    .sort();

  // Effective permissions
  const { scope, permissions } = getEffectivePermissions(user);
  const effective = [...permissions].sort();

  // Relevant presets for this role
  const rolePresets = presets.filter((p) => p.requiredRole === user.role);

  return {
    role: user.role,
    scope,
    defaults,
    grantable,
    grants,
    effective,
    presets: rolePresets,
  };
}

/**
 * setUserPermissions(actor, targetUserId, newGrants)
 * Full replace of grants. Validates then applies diff in a transaction.
 * @param {Object} actor - req.user
 * @param {number} targetUserId
 * @param {Array<{resource, action}>} newGrants
 * @returns {{ changed: boolean, before: string[], after: string[] }}
 */
async function setUserPermissions(actor, targetUserId, newGrants) {
  // Load target user
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { permissions: true },
  });

  if (!target) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // 400: ADMIN cannot receive grants
  if (target.role === 'ADMIN') {
    const err = new Error('Grants cannot be assigned to ADMIN users');
    err.statusCode = 400;
    throw err;
  }

  // Hard block: permissions that manage users or permissions can never be granted via this endpoint.
  // These are ADMIN-role defaults and must not be delegatable.
  const NEVER_GRANTABLE = new Set(['users:write', 'users:delete', 'users:read', 'assignments:write', 'assignments:delete']);
  for (const g of newGrants) {
    const key = `${g.resource}:${g.action}`;
    if (NEVER_GRANTABLE.has(key)) {
      const err = new Error(`Permission ${key} cannot be granted via this endpoint`);
      err.statusCode = 400;
      throw err;
    }
  }

  const allowed = allowlist[target.role] || new Set();
  const defaults = roleDefaults[target.role] || new Set();

  // Validate each incoming grant
  const seen = new Set();
  for (const g of newGrants) {
    const key = `${g.resource}:${g.action}`;

    // Unknown resource:action combination
    if (!allowed.has(key) && !defaults.has(key)) {
      const err = new Error(`Unknown or non-grantable permission: ${key}`);
      err.statusCode = 400;
      throw err;
    }

    // Not in allowlist
    if (!allowed.has(key)) {
      const err = new Error(`Permission ${key} is not grantable for role ${target.role}`);
      err.statusCode = 400;
      throw err;
    }

    // Duplicates a role default
    if (defaults.has(key)) {
      const err = new Error(`Permission ${key} is already a default for role ${target.role}`);
      err.statusCode = 400;
      throw err;
    }

    // Duplicates within the request body
    if (seen.has(key)) {
      const err = new Error(`Duplicate permission in request: ${key}`);
      err.statusCode = 400;
      throw err;
    }
    seen.add(key);
  }

  // Compute before/after sorted lists
  const before = target.permissions
    .map((p) => `${p.resource}:${p.action}`)
    .filter((k) => allowed.has(k))
    .sort();
  const after = [...seen].sort();

  // No-op: if equal, return without writing anything
  if (JSON.stringify(before) === JSON.stringify(after)) {
    return { changed: false, before, after };
  }

  // Apply diff in transaction with audit row
  await prisma.$transaction(async (tx) => {
    // Delete all existing grants for this user
    await tx.userPermission.deleteMany({ where: { user_id: targetUserId } });

    // Insert new grants
    if (after.length > 0) {
      await tx.userPermission.createMany({
        data: after.map((key) => {
          const [resource, action] = key.split(':');
          return { user_id: targetUserId, resource, action };
        }),
      });
    }

    await logInTx(tx, actor, 'permissions_updated', 'users', targetUserId, { before, after });
  });

  return { changed: true, before, after };
}

module.exports = { getUserPermissions, setUserPermissions };
