/**
 * @fileoverview Tests for Risk API
 */
const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => ({
  project: {
    findUnique: jest.fn(),
  },
  riskPrediction: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
}));

jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
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
app.use('/api/v1/projects', require('../src/routes/risk.routes'));
app.use(require('../src/middlewares/error.middleware'));
const prisma = require('../src/config/database');

describe('Risk API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.project.findUnique.mockResolvedValue({ id: 1, project_id: 'PRJ-001', project_manager_id: 2 });
  });

  describe('GET /api/v1/projects/:projectId/risk', () => {
    it('returns the latest prediction', async () => {
      prisma.riskPrediction.findFirst.mockResolvedValue({
        risk_score: 0.75,
        risk_level: 'HIGH',
        delay_probability: 0.8,
        model_version: 'test-v0',
        predicted_at: new Date(),
      });

      const res = await request(app)
        .get('/api/v1/projects/PRJ-001/risk')
        .set('Authorization', 'Bearer VALID_ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.data.riskScore).toBe(0.75);
      expect(res.body.data.riskLevel).toBe('HIGH');
    });

    it('returns 404 when no prediction exists yet', async () => {
      prisma.riskPrediction.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/projects/PRJ-001/risk')
        .set('Authorization', 'Bearer VALID_ADMIN');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RISK_PREDICTION_NOT_FOUND');
    });

    it('returns 403 when PM requests risk for a project not assigned to them', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 1, project_id: 'PRJ-001', project_manager_id: 99 });

      const res = await request(app)
        .get('/api/v1/projects/PRJ-001/risk')
        .set('Authorization', 'Bearer VALID_PM');

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/projects/:projectId/risk/stages', () => {
    it('returns stage-wise breakdown', async () => {
      prisma.riskPrediction.findFirst.mockResolvedValue({
        predicted_at: new Date(),
        stage_risks: [
          { stage: 'NOTIFICATION', risk: 0.2 },
          { stage: 'LAND_ACQUISITION', risk: 0.7 },
        ],
      });

      const res = await request(app)
        .get('/api/v1/projects/PRJ-001/risk/stages')
        .set('Authorization', 'Bearer VALID_PM');

      expect(res.status).toBe(200);
      expect(res.body.data.stages.length).toBe(2);
      expect(res.body.data.stages[0]).toEqual({ stage: 'NOTIFICATION', risk: 0.2 });
    });
  });

  describe('GET /api/v1/projects/:projectId/risk/factors', () => {
    it('returns the top_factors array', async () => {
      prisma.riskPrediction.findFirst.mockResolvedValue({
        predicted_at: new Date(),
        top_factors: ['Legal dispute surge', 'Slow compensation'],
      });

      const res = await request(app)
        .get('/api/v1/projects/PRJ-001/risk/factors')
        .set('Authorization', 'Bearer VALID_PM');

      expect(res.status).toBe(200);
      expect(res.body.data.factors).toEqual(['Legal dispute surge', 'Slow compensation']);
    });

    it('returns an empty array when top_factors is null', async () => {
      prisma.riskPrediction.findFirst.mockResolvedValue({
        predicted_at: new Date(),
        top_factors: null,
      });

      const res = await request(app)
        .get('/api/v1/projects/PRJ-001/risk/factors')
        .set('Authorization', 'Bearer VALID_PM');

      expect(res.status).toBe(200);
      expect(res.body.data.factors).toEqual([]);
    });
  });

  describe('GET /api/v1/projects/:projectId/risk/history', () => {
    it('returns paginated history', async () => {
      prisma.riskPrediction.findMany.mockResolvedValue([{ id: 1, risk_score: 0.75 }]);
      prisma.riskPrediction.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/projects/PRJ-001/risk/history')
        .set('Authorization', 'Bearer VALID_ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.pagination.total).toBe(1);
    });
  });
});