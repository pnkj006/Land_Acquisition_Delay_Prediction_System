/**
 * @fileoverview Tests for Project API
 */
const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => ({
  project: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}));

jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('../src/services/audit.service', () => ({
  log: jest.fn(),
}));

jest.mock('../src/middlewares/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    if (req.headers.authorization === 'Bearer VALID_ADMIN') {
      req.user = { id: 1, role: 'ADMIN' };
      return next();
    }
    if (req.headers.authorization === 'Bearer VALID_PM') {
      req.user = { id: 2, role: 'PROJECT_MANAGER' };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Unauthorized', error: { code: 'UNAUTHORIZED' } });
  },
}));

jest.mock('../src/middlewares/role.middleware', () => ({
  requireRole: (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden', error: { code: 'FORBIDDEN' } });
    }
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/v1/projects', require('../src/routes/project.routes'));
app.use(require('../src/middlewares/error.middleware'));
const prisma = require('../src/config/database');

describe('Project API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/projects', () => {
    it('creates a project as ADMIN', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      prisma.project.create.mockResolvedValue({ id: 1, project_id: 'PRJ-001', project_type: 'HIGHWAY' });

      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', 'Bearer VALID_ADMIN')
        .send({ project_id: 'PRJ-001', project_type: 'HIGHWAY' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project_id).toBe('PRJ-001');
    });

    it('rejects creation by PROJECT_MANAGER with 403', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', 'Bearer VALID_PM')
        .send({ project_id: 'PRJ-002' });

      expect(res.status).toBe(403);
    });

    it('rejects duplicate project_id with 409', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 1, project_id: 'PRJ-001' });

      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', 'Bearer VALID_ADMIN')
        .send({ project_id: 'PRJ-001' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PROJECT_ALREADY_EXISTS');
    });

    it('rejects request with no token with 401', async () => {
      const res = await request(app).post('/api/v1/projects').send({ project_id: 'PRJ-003' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/projects/:projectId', () => {
    it('returns project by project_id as ADMIN', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 1,
        project_id: 'PRJ-001',
        project_manager_id: 2,
      });

      const res = await request(app)
        .get('/api/v1/projects/PRJ-001')
        .set('Authorization', 'Bearer VALID_ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.data.project_id).toBe('PRJ-001');
    });

    it('returns 404 for a non-existent project', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/projects/DOES-NOT-EXIST')
        .set('Authorization', 'Bearer VALID_ADMIN');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('returns 403 when PM requests a project not assigned to them', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 1,
        project_id: 'PRJ-001',
        project_manager_id: 99, // not this PM
      });

      const res = await request(app)
        .get('/api/v1/projects/PRJ-001')
        .set('Authorization', 'Bearer VALID_PM');

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/projects/:projectId/assign-manager', () => {
    it('assigns a PM as ADMIN', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 1, project_id: 'PRJ-001' });
      prisma.user.findUnique.mockResolvedValue({ id: 2, name: 'Test PM', role: 'PROJECT_MANAGER' });
      prisma.project.update.mockResolvedValue({ id: 1, project_id: 'PRJ-001', project_manager_id: 2 });

      const res = await request(app)
        .patch('/api/v1/projects/PRJ-001/assign-manager')
        .set('Authorization', 'Bearer VALID_ADMIN')
        .send({ project_manager_id: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.project_manager_id).toBe(2);
    });

    it('rejects assigning a non-PM user with 400', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 1, project_id: 'PRJ-001' });
      prisma.user.findUnique.mockResolvedValue({ id: 1, name: 'Test Admin', role: 'ADMIN' });

      const res = await request(app)
        .patch('/api/v1/projects/PRJ-001/assign-manager')
        .set('Authorization', 'Bearer VALID_ADMIN')
        .send({ project_manager_id: 1 });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/projects (role-based scoping)', () => {
    it('scopes results to project_manager_id when called by a PM', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', 'Bearer VALID_PM');

      expect(res.status).toBe(200);
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ project_manager_id: 2 }),
        })
      );
    });
  });

  describe('PATCH /api/v1/projects/:projectId', () => {
    it('updates project as ADMIN', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 1, project_id: 'PRJ-001' });
      prisma.project.update.mockResolvedValue({ id: 1, project_id: 'PRJ-001', location: 'Updated' });

      const res = await request(app)
        .patch('/api/v1/projects/PRJ-001')
        .set('Authorization', 'Bearer VALID_ADMIN')
        .send({ location: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.data.location).toBe('Updated');
    });

    it('rejects update by PROJECT_MANAGER with 403', async () => {
      const res = await request(app)
        .patch('/api/v1/projects/PRJ-001')
        .set('Authorization', 'Bearer VALID_PM')
        .send({ location: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/projects/:projectId', () => {
    it('rejects deletion by PROJECT_MANAGER with 403', async () => {
      const res = await request(app)
        .delete('/api/v1/projects/PRJ-001')
        .set('Authorization', 'Bearer VALID_PM');

      expect(res.status).toBe(403);
    });

    it('deletes project as ADMIN', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 1, project_id: 'PRJ-001' });
      prisma.project.delete.mockResolvedValue({ id: 1, project_id: 'PRJ-001' });

      const res = await request(app)
        .delete('/api/v1/projects/PRJ-001')
        .set('Authorization', 'Bearer VALID_ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.data.project_id).toBe('PRJ-001');
    });
  });
});