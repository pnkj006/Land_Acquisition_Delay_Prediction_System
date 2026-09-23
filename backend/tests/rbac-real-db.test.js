/**
 * @fileoverview Real Database Tests for RBAC
 * Tests the permission logic directly against the PostgreSQL database using Prisma.
 * Ensures the actual queries (especially in transactions) succeed.
 */
const prisma = require('../src/config/database');
const { getUserPermissions, setUserPermissions } = require('../src/services/permission.service');

describe('RBAC Real DB Integration Tests', () => {
  let testUser;
  let adminUser;

  beforeAll(async () => {
    require('dotenv').config({ path: '.env.test' });
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is missing in .env.test');
    }
    const dbUrl = new URL(url);
    const dbName = dbUrl.pathname.slice(1);
    if (!dbName.endsWith('_test')) {
      throw new Error(`Refusing to run E2E tests: DATABASE_URL name must end in _test. Got: ${dbName}`);
    }

    // Create a temporary test user
    const email = `test_rbac_${Date.now()}@example.com`;
    testUser = await prisma.user.create({
      data: {
        name: 'RBAC Test User',
        email,
        password_hash: 'hashed',
        role: 'STAFF',
        is_active: true
      }
    });

    const adminEmail = `admin_rbac_${Date.now()}@example.com`;
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin Test User',
        email: adminEmail,
        password_hash: 'hashed',
        role: 'ADMIN',
        is_active: true
      }
    });
  });

  afterAll(async () => {
    if (testUser) {
      await prisma.userPermission.deleteMany({ where: { user_id: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    if (adminUser) {
      await prisma.user.delete({ where: { id: adminUser.id } });
    }
    await prisma.$disconnect();
  });

  it('getUserPermissions on new STAFF user returns defaults', async () => {
    const perms = await getUserPermissions(testUser.id);
    expect(perms.role).toBe('STAFF');
    // Staff defaults generally include projects:read, depending on config
    expect(Array.isArray(perms.defaults)).toBe(true);
    expect(perms.grants.length).toBe(0);
  });

  it('setUserPermissions successfully grants a permission in a transaction', async () => {
    // Admin actor
    const actor = { id: adminUser.id, email: adminUser.email, role: 'ADMIN' }; // mock actor just for audit
    
    // We assume 'stages_events:write' is grantable for STAFF in config/permissions.js
    // If it is, this succeeds. We will try assigning a valid grant.
    const result = await setUserPermissions(actor, testUser.id, [{ resource: 'stages_events', action: 'write' }]);
    
    expect(result.changed).toBe(true);
    expect(result.after).toContain('stages_events:write');

    // Verify it saved to DB
    const dbUser = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: { permissions: true }
    });
    const hasPerm = dbUser.permissions.some(p => p.resource === 'stages_events' && p.action === 'write');
    expect(hasPerm).toBe(true);
  });
});
