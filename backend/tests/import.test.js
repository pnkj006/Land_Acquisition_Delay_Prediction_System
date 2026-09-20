/**
 * @fileoverview Import Tests
 */
const request = require('supertest');
const express = require('express');
const { parseCSV } = require('../src/utils/csvParser');

jest.mock('../src/config/database', () => ({
  project: { upsert: jest.fn() },
  importHistory: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() }
}));

jest.mock('../src/utils/csvParser', () => ({
  parseCSV: jest.fn()
}));

jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// Mock middlewares
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
    return res.status(401).json({ error: 'Unauthorized' });
  }
}));

jest.mock('../src/middlewares/role.middleware', () => ({
  requireRole: (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  }
}));

jest.mock('../src/middlewares/upload.middleware', () => ({
  uploadSingle: (fieldName) => (req, res, next) => {
    // Simulate multer
    if (req.body.noFile) {
      // Simulate no file uploaded condition if needed
    } else {
      req.file = {
        buffer: Buffer.from('test'),
        originalname: 'test.csv'
      };
    }
    next();
  }
}));

jest.mock('../src/middlewares/audit.middleware', () => ({
  auditLog: (action) => (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (!req.body) req.body = {};
  next();
});
// Need to set a route mock for noFile test, but upload.middleware mock assigns req.file unconditionally
// Let's modify app setup slightly for testing:
app.use((req, res, next) => {
  if (req.headers['x-no-file']) {
    req.body.noFile = true;
    req.file = undefined; // override
  }
  next();
});
app.use('/api/v1/imports', require('../src/routes/import.routes'));
app.use(require('../src/middlewares/error.middleware'));

describe('Import Routes', () => {
  const prisma = require('../src/config/database');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/v1/imports/projects - ADMIN with valid CSV: returns 201', async () => {
    parseCSV.mockResolvedValue([
      { project_id: 'PRJ1', land_area_hectares: '10.5' },
      { project_id: 'PRJ2', land_area_hectares: '20' }
    ]);
    prisma.project.upsert.mockResolvedValue({});
    prisma.importHistory.create.mockResolvedValue({ id: 1, successful_rows: 2 });

    const res = await request(app)
      .post('/api/v1/imports/projects')
      .set('Authorization', 'Bearer VALID_ADMIN')
      .attach('file', Buffer.from('csv content'), 'test.csv');

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      importId: 1,
      totalRows: 2,
      successfulRows: 2,
      failedRows: 0,
      errors: []
    });
  });

  it('POST /api/v1/imports/projects - ADMIN with CSV containing invalid rows', async () => {
    parseCSV.mockResolvedValue([
      { project_id: 'PRJ1' }, // valid
      {} // invalid (missing project_id)
    ]);
    prisma.project.upsert.mockResolvedValue({});
    prisma.importHistory.create.mockResolvedValue({ id: 2 });

    const res = await request(app)
      .post('/api/v1/imports/projects')
      .set('Authorization', 'Bearer VALID_ADMIN')
      .attach('file', Buffer.from('csv content'), 'test.csv');

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      importId: 2,
      totalRows: 2,
      successfulRows: 1,
      failedRows: 1
    });
    expect(res.body.data.errors.length).toBe(1);
  });

  it('POST /api/v1/imports/projects - ADMIN with no file: returns 400', async () => {
    // override upload mock behavior
    const res = await request(app)
      .post('/api/v1/imports/projects')
      .set('Authorization', 'Bearer VALID_ADMIN')
      .set('x-no-file', 'true');

    expect(res.status).toBe(400);
  });

  it('POST /api/v1/imports/projects - PROJECT_MANAGER: returns 403', async () => {
    const res = await request(app)
      .post('/api/v1/imports/projects')
      .set('Authorization', 'Bearer VALID_PM')
      .attach('file', Buffer.from('csv content'), 'test.csv');

    expect(res.status).toBe(403);
  });

  it('POST /api/v1/imports/projects - unauthenticated: returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/imports/projects')
      .attach('file', Buffer.from('csv content'), 'test.csv');

    expect(res.status).toBe(401);
  });

  it('GET /api/v1/imports - ADMIN: returns 200 with paginated list', async () => {
    prisma.importHistory.findMany.mockResolvedValue([{ id: 1 }]);
    prisma.importHistory.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/v1/imports')
      .set('Authorization', 'Bearer VALID_ADMIN');

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
  });

  it('GET /api/v1/imports - PROJECT_MANAGER: returns 403', async () => {
    const res = await request(app)
      .get('/api/v1/imports')
      .set('Authorization', 'Bearer VALID_PM');

    expect(res.status).toBe(403);
  });
});
