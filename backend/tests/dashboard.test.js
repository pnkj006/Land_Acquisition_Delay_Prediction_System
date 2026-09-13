/**
 * @fileoverview Tests for Dashboard API
 */
const request = require('supertest');
const express = require('express');

// Mock middlewares
jest.mock('../src/middlewares/auth.middleware', () => {
  return {
    authenticate: (req, res, next) => {
      if (req.headers.authorization === 'Bearer valid_pm_token') {
        req.user = { id: 1, email: 'pm@test.com', name: 'PM User', role: 'PROJECT_MANAGER' };
        return next();
      }
      if (req.headers.authorization === 'Bearer valid_admin_token') {
        req.user = { id: 2, email: 'admin@test.com', name: 'Admin User', role: 'ADMIN' };
        return next();
      }
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  };
});

jest.mock('../src/middlewares/role.middleware', () => {
  return {
    requireRole: (...allowedRoles) => {
      return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
          return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        next();
      };
    }
  };
});

// Mock database
jest.mock('../src/config/database', () => ({
  project: { findMany: jest.fn(), count: jest.fn() },
  alert: { findMany: jest.fn(), count: jest.fn() },
  user: { count: jest.fn() },
  riskPrediction: { findMany: jest.fn() }
}));

// Mock logger
jest.mock('../src/config/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }));

// Setup app
const dashboardRoutes = require('../src/routes/dashboard.routes');
const app = express();
app.use(express.json());
app.use('/api/v1/dashboard', dashboardRoutes);

const prisma = require('../src/config/database');

describe('Dashboard API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/dashboard/project-manager', () => {
    it('should return 200 with dashboard data for PM', async () => {
      prisma.project.findMany.mockResolvedValue([
        { id: 101, project_manager_id: 1, risk_predictions: [{ risk_level: 'HIGH', risk_score: 85 }], alerts: [{ is_read: false }] }
      ]);
      prisma.alert.findMany.mockResolvedValue([
        { id: 1, message: 'Alert 1' }
      ]);

      const res = await request(app)
        .get('/api/v1/dashboard/project-manager')
        .set('Authorization', 'Bearer valid_pm_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.riskDistribution).toBeDefined();
      expect(res.body.data.recentAlerts).toBeDefined();
      expect(res.body.data.highRiskProjectList).toBeDefined();
    });

    it('should return 403 for ADMIN trying to access PM dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/project-manager')
        .set('Authorization', 'Bearer valid_admin_token');

      expect(res.status).toBe(403);
    });

    it('should return 401 if no auth provided', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/project-manager');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/dashboard/admin', () => {
    it('should return 200 with dashboard data for ADMIN', async () => {
      prisma.project.findMany.mockResolvedValue([
        { id: 101, risk_predictions: [{ risk_level: 'HIGH', risk_score: 85 }], alerts: [] },
        { id: 102, risk_predictions: [{ risk_level: 'LOW', risk_score: 20 }], alerts: [] }
      ]);
      prisma.user.count.mockResolvedValue(5);
      prisma.alert.findMany.mockResolvedValue([
        { id: 1, message: 'Global Alert' }
      ]);

      const res = await request(app)
        .get('/api/v1/dashboard/admin')
        .set('Authorization', 'Bearer valid_admin_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.riskDistribution).toBeDefined();
      expect(res.body.data.recentAlerts).toBeDefined();
      expect(res.body.data.attentionProjects).toBeDefined();
      expect(res.body.data.summary.totalUsers).toBe(5);
    });

    it('should return 403 for PM trying to access ADMIN dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/admin')
        .set('Authorization', 'Bearer valid_pm_token');

      expect(res.status).toBe(403);
    });
  });
});
