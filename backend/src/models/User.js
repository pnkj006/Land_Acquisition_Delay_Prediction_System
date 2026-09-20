/**
 * @description Field reference constants for the `users` Prisma model.
 * Import these to avoid magic strings when selecting/filtering user fields.
 */
const UserFields = {
  id: 'id',
  name: 'name',
  email: 'email',
  password_hash: 'password_hash',
  role: 'role',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
};

const UserRole = {
  ADMIN: 'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  SENIOR_OFFICIAL: 'SENIOR_OFFICIAL',
  STAFF: 'STAFF',
};

const USER_SELECT_SAFE = {
  id: true,
  name: true,
  email: true,
  role: true,
  is_active: true,
  created_at: true,
  updated_at: true,
};

module.exports = { UserFields, UserRole, USER_SELECT_SAFE };
