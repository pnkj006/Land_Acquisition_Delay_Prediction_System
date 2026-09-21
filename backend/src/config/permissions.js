/**
 * @fileoverview RBAC Permission Configuration
 * Single source of truth for roles, scope, defaults, allowlist, and presets.
 * §4 of the RBAC V7 plan.
 */

// ─── Scope map ────────────────────────────────────────────────────────────────
const roleDefaultScope = {
  ADMIN: 'all',
  PROJECT_MANAGER: 'own',
  SENIOR_OFFICIAL: 'all',
  STAFF: 'own',
};

// ─── Role defaults ────────────────────────────────────────────────────────────
// Map of role → Set of "resource:action" strings that are granted by default.
const roleDefaults = {
  ADMIN: new Set([
    'users:read', 'users:write', 'users:delete',
    'projects:read', 'projects:write',
    'assignments:read', 'assignments:write', 'assignments:delete',
    'stages_events:read',
    'predictions:read',
    'rerun_prediction:write',
    'recommendations:read',
    'alerts:read', 'alerts:write',
    'audit_logs:read',
  ]),
  PROJECT_MANAGER: new Set([
    'projects:read', 'projects:write',
    'stages_events:read', 'stages_events:write',
    'predictions:read',
    'rerun_prediction:write',
    'recommendations:read', 'recommendations:write',
    'alerts:read', 'alerts:write',
  ]),
  SENIOR_OFFICIAL: new Set([
    'projects:read',
    'stages_events:read',
    'predictions:read',
    'recommendations:read',
    'alerts:read',
  ]),
  STAFF: new Set([
    'projects:read',
    'stages_events:read',
    'predictions:read',
    'recommendations:read',
    'alerts:read',
  ]),
};

// ─── Per-role grant allowlist ─────────────────────────────────────────────────
// Only the listed pairs may be granted via UserPermission rows.
const allowlist = {
  ADMIN: new Set(), // Admins cannot be granted extra permissions
  PROJECT_MANAGER: new Set(),
  SENIOR_OFFICIAL: new Set(['rerun_prediction:write', 'audit_logs:read']),
  STAFF: new Set([
    'stages_events:write',
    'recommendations:write',
    'alerts:write',
  ]),
};

// ─── Presets ──────────────────────────────────────────────────────────────────
// Served to the UI by GET /users/:id/permissions.
const presets = [
  {
    name: 'Land Officer',
    requiredRole: 'STAFF',
    grants: ['stages_events:write'],
  },
  {
    name: 'Analyst',
    requiredRole: 'SENIOR_OFFICIAL',
    grants: ['rerun_prediction:write'],
  },
  {
    name: 'Auditor',
    requiredRole: 'SENIOR_OFFICIAL',
    grants: ['audit_logs:read'],
  },
];

// ─── getEffectivePermissions ─────────────────────────────────────────────────
/**
 * Computes the effective permission set for a user.
 * This is the ONLY place permissions are merged — both `authorize` and
 * `GET /auth/me` must call this function.
 *
 * @param {Object} user - Prisma user with `permissions` array included
 * @returns {{ scope: string, permissions: Set<string> }}
 */
function getEffectivePermissions(user) {
  const scope = roleDefaultScope[user.role] || 'own';

  // Start with role defaults
  const perms = new Set(roleDefaults[user.role] || []);

  // Add grantable UserPermission rows (silently ignore non-allowlisted ones)
  const allowed = allowlist[user.role] || new Set();
  for (const up of user.permissions || []) {
    const key = `${up.resource}:${up.action}`;
    if (allowed.has(key)) {
      perms.add(key);
    }
    // Silently ignore stale or non-allowlisted rows
  }

  // Every X:write in the set implies X:read
  for (const perm of [...perms]) {
    if (perm.endsWith(':write')) {
      perms.add(perm.replace(':write', ':read'));
    }
  }

  return { scope, permissions: perms };
}

module.exports = {
  roleDefaultScope,
  roleDefaults,
  allowlist,
  presets,
  getEffectivePermissions,
};
