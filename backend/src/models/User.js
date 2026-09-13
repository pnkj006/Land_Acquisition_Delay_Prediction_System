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
  created_at: 'created_at',
  updated_at: 'updated_at'
};

const UserRole = {
  ADMIN: 'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER'
};

const USER_SELECT_SAFE = {
  id: true,
  name: true,
  email: true,
  role: true,
  created_at: true,
  updated_at: true
};

module.exports = { UserFields, UserRole, USER_SELECT_SAFE };
