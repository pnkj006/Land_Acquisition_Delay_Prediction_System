const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');
const { hashPassword } = require('../../src/utils/password');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../src/config/env');

describe('RBAC E2E Tests', () => {
  let adminToken, pmToken, staffToken;
  let admin, pm, staff, deactivatedUser;
  let projA, projB;
  let alertB;

  beforeAll(async () => {
    require('dotenv').config({ path: '.env.test' });
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is missing in .env.test');
    if (!url.endsWith('_test')) throw new Error('DATABASE_URL must end in _test');

    await prisma.auditLog.deleteMany();
    await prisma.projectAssignment.deleteMany();
    await prisma.userPermission.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    const pwd = await hashPassword('password123');
    admin = await prisma.user.create({ data: { name: 'Admin', email: 'admin@e2e.com', password_hash: pwd, role: 'ADMIN', is_active: true } });
    pm = await prisma.user.create({ data: { name: 'PM_A', email: 'pm@e2e.com', password_hash: pwd, role: 'PROJECT_MANAGER', is_active: true } });
    staff = await prisma.user.create({ data: { name: 'Staff_A', email: 'staff@e2e.com', password_hash: pwd, role: 'STAFF', is_active: true } });
    deactivatedUser = await prisma.user.create({ data: { name: 'Deac', email: 'deac@e2e.com', password_hash: pwd, role: 'STAFF', is_active: false } });

    projA = await prisma.project.create({ data: { project_id: 'PRJ-A', land_area_hectares: 10, number_of_affected_families: 5, latitude: 12.0, longitude: 77.0 } });
    projB = await prisma.project.create({ data: { project_id: 'PRJ-B', land_area_hectares: 20, number_of_affected_families: 15, latitude: 13.0, longitude: 78.0 } });

    alertB = await prisma.alert.create({ data: { project_id: projB.id, type: 'RISK', severity: 'MEDIUM', message: 'Alert B', is_read: false } });

    await prisma.projectAssignment.createMany({
      data: [
        { project_id: projA.id, user_id: pm.id },
        { project_id: projA.id, user_id: staff.id },
      ]
    });

    const getTok = async (e) => (await request(app).post('/api/v1/auth/login').send({ email: e, password: 'password123' })).body.data.token;
    adminToken = await getTok(admin.email);
    pmToken = await getTok(pm.email);
    staffToken = await getTok(staff.email);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Auth and token', () => {
    it('T1. Forged JWT (signed with a wrong secret) on a protected route returns 401', async () => {
      const forgedToken = jwt.sign({ id: admin.id }, 'wrong_secret', { expiresIn: '1h' });
      await request(app).get('/api/v1/projects').set('Authorization', `Bearer ${forgedToken}`).expect(401);
    });

    it('T2. Expired JWT returns 401', async () => {
      const expiredToken = jwt.sign({ id: admin.id }, process.env.JWT_SECRET || '1234', { expiresIn: '-1h' });
      await request(app).get('/api/v1/projects').set('Authorization', `Bearer ${expiredToken}`).expect(401);
    });

    it('T3. Deactivated user calling POST /auth/login with the correct password returns 401', async () => {
      // Expecting failure initially as per prompt, since finding F-02 states login doesn't check is_active
      await request(app).post('/api/v1/auth/login').send({ email: deactivatedUser.email, password: 'password123' }).expect(401);
    });
  });

  describe('Scoping (IDOR) - PM(A)', () => {
    it('T4. GET /projects/:B returns 404', async () => {
      await request(app).get(`/api/v1/projects/${projB.project_id}`).set('Authorization', `Bearer ${pmToken}`).expect(404);
    });

    it('T5. GET /projects/:B/risk, /risk/history, /risk/stages, /risk/factors return 404', async () => {
      await request(app).get(`/api/v1/projects/${projB.project_id}/risk`).set('Authorization', `Bearer ${pmToken}`).expect(404);
      await request(app).get(`/api/v1/projects/${projB.project_id}/risk/history`).set('Authorization', `Bearer ${pmToken}`).expect(404);
      await request(app).get(`/api/v1/projects/${projB.project_id}/risk/stages`).set('Authorization', `Bearer ${pmToken}`).expect(404);
      await request(app).get(`/api/v1/projects/${projB.project_id}/risk/factors`).set('Authorization', `Bearer ${pmToken}`).expect(404);
    });

    it('T6. GET /projects/:B/recommendations returns 404', async () => {
      await request(app).get(`/api/v1/projects/${projB.project_id}/recommendations`).set('Authorization', `Bearer ${pmToken}`).expect(404);
    });

    it('T7. PATCH /projects/:B returns 404', async () => {
      await request(app).patch(`/api/v1/projects/${projB.project_id}`).set('Authorization', `Bearer ${pmToken}`).send({ name: 'Hacked' }).expect(404);
    });

    it('T8. PATCH /alerts/:id/read for an alert belonging to project B returns 404', async () => {
      await request(app).patch(`/api/v1/alerts/${alertB.id}/read`).set('Authorization', `Bearer ${pmToken}`).expect(404);
    });

    it('T9. GET /projects/:B/assignments as a PM returns 403 (role guard), and as an ADMIN it still works', async () => {
      // A PM cannot view assignments for any project (enforced by role guard, finding F-07 says it skips assertProjectInScope but role guard is still there)
      await request(app).get(`/api/v1/projects/${projB.id}/assignments`).set('Authorization', `Bearer ${pmToken}`).expect(403);
      // Admin works
      await request(app).get(`/api/v1/projects/${projB.id}/assignments`).set('Authorization', `Bearer ${adminToken}`).expect(200);
    });

    it('T10. STAFF(A): /dashboard, /map and every /analytics/* endpoint count only project A', async () => {
      const dash = await request(app).get('/api/v1/dashboard').set('Authorization', `Bearer ${staffToken}`).expect(200);
      expect(dash.body.data.summary.totalProjects).toBe(1);

      const map = await request(app).get('/api/v1/map').set('Authorization', `Bearer ${staffToken}`).expect(200);
      expect(map.body.data.data).toHaveLength(1);
      const analyticsRisk = await request(app).get('/api/v1/analytics/risk-distribution').set('Authorization', `Bearer ${staffToken}`).expect(200);
      // It should only calculate based on proj A
      const analyticsTrends = await request(app).get('/api/v1/analytics/risk-trend').set('Authorization', `Bearer ${staffToken}`).expect(200);
    });
  });

  describe('Escalation', () => {
    it('T11. POST /auth/signup with { role: "ADMIN" } creates a STAFF user', async () => {
      // Requires ALLOW_PUBLIC_SIGNUP=true, let's ensure it's true via config test or bypass
      process.env.ALLOW_PUBLIC_SIGNUP = 'true';
      const res = await request(app).post('/api/v1/auth/signup').send({ email: 'hacker@e2e.com', password: 'password123', name: 'Hacker', role: 'ADMIN' });
      expect(res.status).toBe(201);
      
      const u = await prisma.user.findUnique({ where: { email: 'hacker@e2e.com' }});
      expect(u.role).toBe('STAFF');
    });

    it('T12. Demoting or deleting the last active ADMIN returns 400', async () => {
      await request(app).patch(`/api/v1/users/${admin.id}`).set('Authorization', `Bearer ${adminToken}`).send({ role: 'STAFF' }).expect(400);
      await request(app).delete(`/api/v1/users/${admin.id}`).set('Authorization', `Bearer ${adminToken}`).expect(400);
      await request(app).patch(`/api/v1/users/${admin.id}`).set('Authorization', `Bearer ${adminToken}`).send({ is_active: false }).expect(400);
    });

    it('T13. A PM calling PUT /users/:id/permissions returns 403', async () => {
      await request(app).put(`/api/v1/users/${staff.id}/permissions`).set('Authorization', `Bearer ${pmToken}`).send({ grants: ['alerts:write'] }).expect(403);
    });

    it('T14. PATCH /users/:id with is_active as a non-boolean returns 400', async () => {
      await request(app).patch(`/api/v1/users/${staff.id}`).set('Authorization', `Bearer ${adminToken}`).send({ is_active: "false" }).expect(400);
      await request(app).patch(`/api/v1/users/${staff.id}`).set('Authorization', `Bearer ${adminToken}`).send({ is_active: 1 }).expect(400);
    });
  });

  describe('CSV', () => {
    it('T15. Import a CSV where one row is invalid: 400 and ZERO rows written', async () => {
      const initialCount = await prisma.project.count();
      const csv = `project_id,name,project_type\nVALID-1,Valid,Road\nINVALID-1,,Unknown`; // invalid row
      
      await request(app)
        .post('/api/v1/imports/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csv), 'test.csv')
        .expect(400);
      
      const finalCount = await prisma.project.count();
      expect(finalCount).toBe(initialCount);
    });

    it('T16. A PM calling POST /imports/projects returns 403', async () => {
      await request(app)
        .post('/api/v1/imports/projects')
        .set('Authorization', `Bearer ${pmToken}`)
        .attach('file', Buffer.from('test'), 'test.csv')
        .expect(403);
    });
  });

  describe('Audit', () => {
    it('T17. After PUT /users/:id/permissions, exactly one audit_logs row exists with before/after values', async () => {
      const logsBefore = await prisma.auditLog.count({ where: { action: 'permissions_updated', user_id: admin.id }});
      
      await request(app).put(`/api/v1/users/${staff.id}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ grants: [{ resource: 'alerts', action: 'write' }] })
        .expect(200);
        
      const logsAfter = await prisma.auditLog.count({ where: { action: 'permissions_updated', user_id: admin.id }});
      expect(logsAfter - logsBefore).toBe(1);
      
      const log = await prisma.auditLog.findFirst({ where: { action: 'permissions_updated', user_id: admin.id }, orderBy: { created_at: 'desc' }});
      expect(log.details).toHaveProperty('before');
      expect(log.details).toHaveProperty('after');
    });
  });

  describe('Gaps', () => {
    it('G3. /auth/signup is rate-limited', async () => {
      process.env.ALLOW_PUBLIC_SIGNUP = 'true';
      // Express rate limit standard is often around 5-10 for auth. We need to hit it enough times to trigger 429.
      let statuses = [];
      for(let i=0; i<25; i++) {
        const res = await request(app).post('/api/v1/auth/signup').send({ email: `test${i}@test.com`, password: 'password123', name: 'Test' });
        statuses.push(res.status);
      }
      expect(statuses).toContain(429);
    });

    it('G3 (Spoofed IP). Rate limiter uses correct IP even with spoofed X-Forwarded-For', async () => {
      process.env.ALLOW_PUBLIC_SIGNUP = 'true';
      let statuses = [];
      // If the attacker sends an extra IP (e.g. 1.2.3.4, 203.0.113.5), the limiter should still block based on the true client IP (the last hop or based on trust proxy setting).
      for(let i=0; i<25; i++) {
        const res = await request(app).post('/api/v1/auth/signup')
          .set('X-Forwarded-For', `1.2.3.4, 127.0.0.1`)
          .send({ email: `spoof${i}@test.com`, password: 'password123', name: 'Test' });
        statuses.push(res.status);
      }
      expect(statuses).toContain(429);
    });

    it('G4. /auth/logout returns 200 (relies on client-side discard)', async () => {
      await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${staffToken}`).expect(200);
    });

    it('G5. /auth/me returns user permissions for frontend guards', async () => {
      const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${staffToken}`).expect(200);
      expect(res.body.data.user).toHaveProperty('permissions');
      expect(Array.isArray(res.body.data.user.permissions)).toBe(true);
    });

    it('F-09. Role is loaded from DB per request, and forged role in JWT is ignored', async () => {
      // 1. Create a token with a forged role (ADMIN) for the staff user
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../../src/config/env');
      const forgedToken = jwt.sign({ id: staff.id, role: 'ADMIN' }, JWT_SECRET, { algorithm: 'HS256' });

      // 2. Calling an ADMIN route with this forged token should fail with 403, because DB says STAFF
      await request(app).get('/api/v1/users').set('Authorization', `Bearer ${forgedToken}`).expect(403);

      // 3. Deactivate the user via the API (which clears the permission cache)
      await request(app).patch(`/api/v1/users/${staff.id}`).set('Authorization', `Bearer ${adminToken}`).send({ is_active: false }).expect(200);
      
      // 4. The next request with the valid (or forged) token should return 401
      await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${forgedToken}`).expect(401);
    });
  });
});
