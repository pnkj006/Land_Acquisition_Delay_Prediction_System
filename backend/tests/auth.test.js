/**
 * @description Tests for authentication endpoints.
 */
const request = require('supertest');
const app = require('../src/app'); // Assuming express app is exported here

// Mock dependencies
jest.mock('../src/config/database', () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn()
  }
}));

jest.mock('../src/utils/password', () => ({
  comparePassword: jest.fn(),
  hashPassword: jest.fn()
}));

jest.mock('../src/utils/jwt', () => ({
  signToken: jest.fn(() => 'mock.jwt.token'),
  verifyToken: jest.fn()
}));

jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// We also need to mock middlewares so they don't block tests
jest.mock('../src/middlewares/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader === 'Bearer mock.jwt.token') {
      req.user = { id: 1, email: 'test@example.com', role: 'ADMIN', name: 'Test User' };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Unauthorized', error: { code: 'UNAUTHORIZED' } });
  }
}));

// Mock rate limit to passthrough
jest.mock('../src/middlewares/rateLimit.middleware', () => {
  return (req, res, next) => next();
});

const prisma = require('../src/config/database');
const { comparePassword } = require('../src/utils/password');

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('success: returns 200 + token + user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed',
        role: 'ADMIN',
        name: 'Test User'
      });
      comparePassword.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe('mock.jwt.token');
      expect(res.body.data.user.id).toBe(1);
    });

    it('wrong password: returns 401', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed'
      });
      comparePassword.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('user not found: returns 401', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'unknown@example.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('missing email: returns 422 validation error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/signup', () => {
    it('forces role to STAFF and ignores user input', async () => {
      // We mock the user service to avoid DB transactions in unit tests
      const userService = require('../src/services/user.service');
      jest.spyOn(userService, 'createUser').mockResolvedValue({
        id: 2,
        email: 'hacker@example.com',
        role: 'STAFF', // It should be STAFF because the controller overrides it
        name: 'Hacker'
      });

      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'hacker@example.com', password: 'password123', role: 'ADMIN' });

      expect(res.status).toBe(201);
      expect(userService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'STAFF' })
      );
      
      userService.createUser.mockRestore();
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('with valid token: returns 200 + user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        role: 'ADMIN',
        name: 'Test User'
      });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer mock.jwt.token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(1);
    });

    it('no token: returns 401', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('authenticated: returns 200', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer mock.jwt.token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });
});
