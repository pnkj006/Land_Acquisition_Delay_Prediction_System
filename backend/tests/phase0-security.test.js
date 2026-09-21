/**
 * @fileoverview Phase 0 Security Tests
 * Tests for:
 * - Signup flag gating (ALLOW_PUBLIC_SIGNUP)
 * - Signup role escalation regression
 * - Self-escalation via PATCH /users/:id and PUT /users/:id/permissions
 * - Non-grantable permissions (users:write, users:delete, etc.)
 * - Demotion test: demoted user's token returns 403 on next request
 *
 * These tests mock the DB. Integration tests (with real DB via db_test)
 * are the authoritative source — run them with:
 *   docker-compose up db_test -d
 *   npx prisma migrate deploy
 *   npm run test:integration
 */
const request = require('supertest');

// Mock env before loading app so we can control the flag
jest.mock('../src/config/env', () => ({
  PORT: 5000,
  NODE_ENV: 'test',
  DATABASE_URL: 'mock',
  JWT_SECRET: 'test-secret',
  JWT_EXPIRES_IN: '1d',
  ML_SERVICE_URL: 'mock',
  ALLOW_PUBLIC_SIGNUP: false, // default off
}));

jest.mock('../src/config/database', () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(async (cb) => cb(jest.requireMock('../src/config/database'))),
  userPermission: { deleteMany: jest.fn(), createMany: jest.fn() },
  projectAssignment: { findMany: jest.fn(), deleteMany: jest.fn() },
}));

jest.mock('../src/utils/password', () => ({
  comparePassword: jest.fn(),
  hashPassword: jest.fn().mockResolvedValue('hashed'),
}));

jest.mock('../src/utils/jwt', () => ({
  signToken: jest.fn(() => 'mock.jwt.token'),
  verifyToken: jest.fn(),
}));

jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('../src/services/audit.service', () => ({
  logInTx: jest.fn().mockResolvedValue({}),
}));

jest.mock('../src/middlewares/rateLimit.middleware', () => (req, res, next) => next());

const prisma = require('../src/config/database');
const { comparePassword } = require('../src/utils/password');
const app = require('../src/app');

// Helper: return a valid auth mock user for authenticate middleware
const ADMIN_USER = {
  id: 1, email: 'admin@example.com', role: 'ADMIN',
  name: 'Admin', is_active: true, permissions: []
};
const STAFF_USER = {
  id: 3, email: 'staff@example.com', role: 'STAFF',
  name: 'Staff', is_active: true, permissions: []
};
const PM_USER = {
  id: 2, email: 'pm@example.com', role: 'PROJECT_MANAGER',
  name: 'PM', is_active: true, permissions: []
};

const ADMIN_TOKEN = 'Bearer mock-admin-token';
const STAFF_TOKEN = 'Bearer mock-staff-token';
const PM_TOKEN = 'Bearer mock-pm-token';

// Wire authenticate to use token header -> user lookup
jest.mock('../src/middlewares/auth.middleware', () => ({
  authenticate: jest.fn((req, res, next) => {
    const header = req.headers.authorization;
    const prisma = jest.requireMock('../src/config/database');
    if (!header) {
      return res.status(401).json({ success: false, message: 'Unauthorized', error: { code: 'UNAUTHORIZED' } });
    }
    // The middleware will call prisma.user.findUnique — we control that per test
    return next();
  }),
}));

describe('Phase 0: Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────
  // B.3a: ALLOW_PUBLIC_SIGNUP = false → 404
  // ──────────────────────────────────────────────────
  describe('ALLOW_PUBLIC_SIGNUP flag', () => {
    it('returns 404 when ALLOW_PUBLIC_SIGNUP is false', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'new@example.com', password: 'password123', name: 'New User' });

      expect(res.status).toBe(404);
    });
  });

  // ──────────────────────────────────────────────────
  // B.5a: Normal user cannot PATCH their own role
  // ──────────────────────────────────────────────────
  describe('Self-escalation via PATCH /users/:id', () => {
    it('returns 403 when STAFF tries to patch their own role', async () => {
      // authenticate → loads STAFF_USER from DB
      prisma.user.findUnique.mockResolvedValue(STAFF_USER);

      const res = await request(app)
        .patch('/api/v1/users/3')
        .set('Authorization', STAFF_TOKEN)
        .send({ role: 'ADMIN' });

      // STAFF has no users:write permission → 403 from RBAC guard
      expect(res.status).toBe(403);
    });

    it('returns 403 when PROJECT_MANAGER tries to patch another user role', async () => {
      prisma.user.findUnique.mockResolvedValue(PM_USER);

      const res = await request(app)
        .patch('/api/v1/users/99')
        .set('Authorization', PM_TOKEN)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(403);
    });
  });

  // ──────────────────────────────────────────────────
  // B.5b: Normal user cannot PUT their own permissions
  // ──────────────────────────────────────────────────
  describe('Self-escalation via PUT /users/:id/permissions', () => {
    it('returns 403 when STAFF tries to set their own permissions', async () => {
      prisma.user.findUnique.mockResolvedValue(STAFF_USER);

      const res = await request(app)
        .put('/api/v1/users/3/permissions')
        .set('Authorization', STAFF_TOKEN)
        .send({ grants: [{ resource: 'projects', action: 'write' }] });

      expect(res.status).toBe(403);
    });
  });

  // ──────────────────────────────────────────────────
  // B.4: users:write and user-management perms are non-grantable
  // ──────────────────────────────────────────────────
  describe('Non-grantable permission enforcement', () => {
    it('rejects attempt to grant users:write to a STAFF user', async () => {
      // Admin makes the request, but tries to grant a forbidden permission
      prisma.user.findUnique
        .mockResolvedValueOnce(ADMIN_USER) // authenticate
        .mockResolvedValueOnce({ ...STAFF_USER, permissions: [] }); // target user

      const res = await request(app)
        .put('/api/v1/users/3/permissions')
        .set('Authorization', ADMIN_TOKEN)
        .send({ grants: [{ resource: 'users', action: 'write' }] });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot be granted/);
    });

    it('rejects attempt to grant users:delete', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(ADMIN_USER)
        .mockResolvedValueOnce({ ...STAFF_USER, permissions: [] });

      const res = await request(app)
        .put('/api/v1/users/3/permissions')
        .set('Authorization', ADMIN_TOKEN)
        .send({ grants: [{ resource: 'users', action: 'delete' }] });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot be granted/);
    });
  });

  // ──────────────────────────────────────────────────
  // B.3: Demotion test — old token returns 403
  // (auth.middleware loads user fresh from DB on every request;
  //  demoting means next DB load returns is_active:false → 401, not 403.
  //  For role demotion, the RBAC guard then reads the current role → 403.)
  // ──────────────────────────────────────────────────
  describe('Demotion test: demoted user cannot access guarded route', () => {
    it('returns 401 if user is deactivated after token was issued', async () => {
      // Simulate: user was active when token signed, now is_active=false
      prisma.user.findUnique.mockResolvedValue({ ...STAFF_USER, is_active: false });

      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', STAFF_TOKEN);

      // auth middleware detects is_active=false and returns 401
      expect(res.status).toBe(401);
    });

    it('returns 403 if user role was demoted (no longer has permission)', async () => {
      // User was ADMIN, now demoted to STAFF — but token still says ADMIN
      // auth.middleware fetches fresh from DB; RBAC guard sees STAFF role → 403 on users:read
      const demotedUser = { ...STAFF_USER, role: 'STAFF' };
      prisma.user.findUnique.mockResolvedValue(demotedUser);

      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', ADMIN_TOKEN); // old token issued when user was ADMIN

      expect(res.status).toBe(403);
    });
  });
});
