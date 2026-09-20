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
    findFirst: jest.fn(),
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
  log: jest.fn().mockResolvedValue({}),
  logInTx: jest.fn().mockResolvedValue({}),
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

jest.mock('../src/middlewares/rbac.middleware', () => ({
  authorize: (resource, action) => (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'Forbidden', error: { code: 'FORBIDDEN' } });
    }
    if (action === 'write' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden', error: { code: 'FORBIDDEN' } });
    }
    if (action === 'delete' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden', error: { code: 'FORBIDDEN' } });
    }
    next();
  },
}));

jest.mock('../src/utils/scope', () => ({
  projectScopeWhere: (user) => {
    if (user.role === 'ADMIN') return {};
    return { assignments: { some: { user_id: user.id } } };
  },
  assertProjectInScope: (user, projectId) => {
    if (user.role === 'ADMIN') return { id: projectId };
    // Simulate PM not having access to PRJ-999
    if (projectId === 999) {
      const err = new Error('Not found');
      err.statusCode = 404;
      throw err;
    }
    return { id: projectId };
  }
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
      
      // Mock transaction
      prisma.$transaction = jest.fn(async (cb) => cb(prisma));

      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', 'Bearer VALID_ADMIN')
        .send({ project_id: 'PRJ-001', project_type: 'HIGHWAY' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('rejects creation by PROJECT_MANAGER with 403', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', 'Bearer VALID_PM')
        .send({ project_id: 'PRJ-002' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/projects/:projectId', () => {
    it('returns project by project_id as ADMIN', async () => {
      prisma.project.findFirst.mockResolvedValue({
        id: 1,
        project_id: 'PRJ-001',
      });

      const res = await request(app)
        .get('/api/v1/projects/PRJ-001')
        .set('Authorization', 'Bearer VALID_ADMIN');

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/projects (role-based scoping)', () => {
    it('scopes results using scope util when called by a PM', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', 'Bearer VALID_PM');

      expect(res.status).toBe(200);
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignments: { some: { user_id: 2 } } }),
        })
      );
    });
  });
});
