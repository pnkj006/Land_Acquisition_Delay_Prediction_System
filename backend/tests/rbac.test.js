/**
 * @fileoverview RBAC Tests
 * Tests the permission logic directly
 */
const { getUserPermissions, setUserPermissions } = require('../src/services/permission.service');

// Mock dependencies
jest.mock('../src/config/database', () => ({
  user: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(async (cb) => cb(jest.requireMock('../src/config/database'))),
  userPermission: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  }
}));

jest.mock('../src/services/audit.service', () => ({
  log: jest.fn().mockResolvedValue({}),
  logInTx: jest.fn().mockResolvedValue({}),
}));

const prisma = require('../src/config/database');
const { authorize } = require('../src/middlewares/rbac.middleware');
const fs = require('fs');
const path = require('path');

describe('RBAC Permission Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPermissions', () => {
    it('returns 404 if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(getUserPermissions(99)).rejects.toThrow('User not found');
    });

    it('returns permissions for PM', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 2,
        role: 'PROJECT_MANAGER',
        permissions: [{ resource: 'projects', action: 'write' }]
      });

      const res = await getUserPermissions(2);
      expect(res.role).toBe('PROJECT_MANAGER');
      expect(res.defaults).toContain('projects:read'); // Based on config/permissions.js defaults
      expect(res.effective).toContain('projects:read');
    });
  });

  describe('setUserPermissions', () => {
    it('prevents assigning grants to ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        role: 'ADMIN',
        permissions: []
      });

      await expect(setUserPermissions({ id: 2, role: 'ADMIN' }, 1, [{ resource: 'projects', action: 'write' }]))
        .rejects.toThrow('Grants cannot be assigned to ADMIN users');
    });

    it('rejects unknown or non-grantable permission', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 2,
        role: 'PROJECT_MANAGER',
        permissions: []
      });

      await expect(setUserPermissions({ id: 1, role: 'ADMIN' }, 2, [{ resource: 'unknown', action: 'read' }]))
        .rejects.toThrow(/Unknown or non-grantable permission/);
    });
  });

  describe('Parity Test between /auth/me and authorize (stale grant)', () => {
    it('authorize blocks access if the fresh user fetched by middleware lacks permission', () => {
      const req = {
        user: { id: 1, role: 'PROJECT_MANAGER', permissions: [] }
      };
      const res = {};
      const next = jest.fn();
      
      const middleware = authorize('csv_import', 'write');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });
  });

  describe('Route Coverage Meta-test (Live Stack)', () => {
    it('verifies all mounted routes have authenticate and an RBAC guard, or are explicitly whitelisted', () => {
      const app = require('../src/app');
      const unguarded = [];
      const whitelisted = ['/api/v1/health', '/api/v1/auth/login', '/api/v1/auth/signup', '/api/v1/config'];

      const traverseStack = (stack, basePath = '') => {
        for (const layer of stack) {
          if (layer.route) {
            const path = basePath + layer.route.path;
            const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
            
            if (whitelisted.includes(path)) continue;

            const hasGuard = layer.route.stack.some(m => m.handle && m.handle.isRbacGuard === true);
            const hasAuth = layer.route.stack.some(m => m.handle && m.handle.name === 'authenticate');
            
            if (!hasGuard || !hasAuth) {
              unguarded.push(`${methods} ${path}`);
            }
          } else if (layer.name === 'router' && layer.handle.stack) {
            let nextPath = basePath;
            if (layer.regexp.source !== '^\\\\/?(?=\\\\/|$)') {
              const match = layer.regexp.toString().match(new RegExp('\\\\/(api\\\\/v1\\\\/[a-zA-Z0-9_-]+)'));
              if (match) {
                nextPath = '/' + match[1].replace(/\\\\\\//g, '/');
              }
            }
            traverseStack(layer.handle.stack, nextPath);
          }
        }
      };

      if (app._router && app._router.stack) traverseStack(app._router.stack);
      expect(unguarded).toEqual([]);
    });
  });
});
