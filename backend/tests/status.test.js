/**
 * @fileoverview Tests for Status API
 */
const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => ({
  project: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  projectStatusHistory: {
    create: jest.fn(),
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

jest.mock('../src/ml/predictionClient', () => ({
  triggerRiskPrediction: jest.fn().mockResolvedValue(null),
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
app.use('/api/v1/projects', require('../src/routes/status.routes'));
app.use(require('../src/middlewares/error.middleware'));
const prisma = require('../src/config/database');
const { triggerRiskPrediction } = require('../src/ml/predictionClient');

describe('Status API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/projects/:projectId/status', () => {
    it('returns current status', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 1,
        project_id: 'PRJ-001',
        project_manager_id: 2,
        compensation_status: 'PENDING',
        approval_timeline_days: 180,
        legal_disputes_count: 1,
        possession_status: 'NOT_STARTED',
        rehabilitation_progress_pct: 10.0,
        stakeholder_responsiveness: 'MEDIUM',
        updated_at: new Date(),
      });

      const res = await request(app)
        .get('/api/v1/projects/PRJ-001/status')
        .set('Authorization', 'Bearer VALID_PM');

      expect(res.status).toBe(200);
      expect(res.body.data.status.compensation_status).toBe('PENDING');
      expect(res.body.data.status.legal_disputes_count).toBe(1);
    });

    it('returns 403 when PM requests status of a project not assigned to them', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 1, project_id: 'PRJ-001', project_manager_id: 99 });

      const res = await request(app)
        .get('/api/v1/projects/PRJ-001/status')
        .set('Authorization', 'Bearer VALID_PM');

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/projects/:projectId/status', () => {
    it('rejects update by ADMIN with 403', async () => {
      const res = await request(app)
        .patch('/api/v1/projects/PRJ-001/status')
        .set('Authorization', 'Bearer VALID_ADMIN')
        .send({ legal_disputes_count: 5 });

      expect(res.status).toBe(403);
    });

    it('rejects empty body with 400', async () => {
      const res = await request(app)
        .patch('/api/v1/projects/PRJ-001/status')
        .set('Authorization', 'Bearer VALID_PM')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('updates status as PROJECT_MANAGER and snapshots history', async () => {
      const currentProject = {
        id: 1,
        project_id: 'PRJ-001',
        project_manager_id: 2,
        compensation_status: 'PENDING',
        approval_timeline_days: 180,
        legal_disputes_count: 1,
        possession_status: 'NOT_STARTED',
        rehabilitation_progress_pct: 10.0,
        stakeholder_responsiveness: 'MEDIUM',
      };
      prisma.project.findFirst = jest.fn().mockResolvedValue(currentProject);
      prisma.projectStatusHistory.create.mockResolvedValue({ id: 1 });
      prisma.project.update.mockResolvedValue({
        ...currentProject,
        compensation_status: 'PARTIAL',
        legal_disputes_count: 3,
        updated_at: new Date(),
      });

      const res = await request(app)
        .patch('/api/v1/projects/PRJ-001/status')
        .set('Authorization', 'Bearer VALID_PM')
        .send({ compensation_status: 'PARTIAL', legal_disputes_count: 3 });

      expect(res.status).toBe(200);
      expect(res.body.data.status.compensation_status).toBe('PARTIAL');
      expect(res.body.data.status.legal_disputes_count).toBe(3);

      // Confirm history snapshot used the OLD (pre-update) values
      expect(prisma.projectStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            project_id: 1,
            compensation_status: 'PENDING',
            legal_disputes_count: 1,
            recorded_by: 2,
          }),
        })
      );

      // Confirm the ML trigger fired
      expect(triggerRiskPrediction).toHaveBeenCalledWith(1);
    });
  });
});