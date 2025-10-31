import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin/permission-manager';
import { prisma } from '@/lib/prisma';
import { getTestApiConfig } from '@/config/api-config';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    adminUsers: {
      findUnique: jest.fn(),
    },
    adminPermissions: {
      findMany: jest.fn(),
    },
  },
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

describe('AdminPermissionManager', () => {
  const testConfig = getTestApiConfig();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAdminAccess', () => {
    test('should validate admin access with valid token', async () => {
      const mockAdmin = {
        id: 'admin-1',
        username: 'admin',
        role: 'super_admin' as const,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      };

      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ adminId: 'admin-1' });
      (prisma.adminUsers.findUnique as jest.Mock).mockResolvedValue(mockAdmin);

      const mockRequest = new NextRequest(`${testConfig.baseURL}/api/admin/users`, {
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      const result = await AdminPermissionManager.validateAdminAccess(mockRequest);

      expect(result).toEqual({
        isValid: true,
        admin: mockAdmin,
      });
    });

    test('should reject access without token', async () => {
      const mockRequest = new NextRequest(`${testConfig.baseURL}/api/admin/users`);

      const result = await AdminPermissionManager.validateAdminAccess(mockRequest);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('未提供认证令牌');
    });

    test('should reject access with invalid token', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const mockRequest = new NextRequest(`${testConfig.baseURL}/api/admin/users`, {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      const result = await AdminPermissionManager.validateAdminAccess(mockRequest);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('无效');
    });

    test('should reject access for inactive admin', async () => {
      const mockAdmin = {
        id: 'admin-1',
        username: 'admin',
        role: 'admin' as const,
        status: 'inactive' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      };

      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ adminId: 'admin-1' });
      (prisma.adminUsers.findUnique as jest.Mock).mockResolvedValue(mockAdmin);

      const mockRequest = new NextRequest(`${testConfig.baseURL}/api/admin/users`, {
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      const result = await AdminPermissionManager.validateAdminAccess(mockRequest);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('账户已被禁用');
    });
  });

  describe('checkPermission', () => {
    test('super_admin should have all permissions', async () => {
      const mockAdmin = {
        id: 'admin-1',
        username: 'admin',
        role: 'super_admin' as const,
        status: 'active' as const,
      };

      const result = await AdminPermissionManager.checkPermission(
        mockAdmin as any,
        AdminPermissions.USERS_READ
      );

      expect(result).toBe(true);
    });

    test('regular admin should check specific permissions', async () => {
      const mockAdmin = {
        id: 'admin-1',
        username: 'admin',
        role: 'admin' as const,
        status: 'active' as const,
      };

      const mockPermissions = [
        {
          id: 'perm-1',
          adminId: 'admin-1',
          resource: 'users',
          action: 'read',
          granted: true,
        },
      ];

      (prisma.adminPermissions.findMany as jest.Mock).mockResolvedValue(mockPermissions);

      const result = await AdminPermissionManager.checkPermission(
        mockAdmin as any,
        AdminPermissions.USERS_READ
      );

      expect(result).toBe(true);
    });

    test('should deny permission if not granted', async () => {
      const mockAdmin = {
        id: 'admin-1',
        username: 'admin',
        role: 'admin' as const,
        status: 'active' as const,
      };

      (prisma.adminPermissions.findMany as jest.Mock).mockResolvedValue([]);

      const result = await AdminPermissionManager.checkPermission(
        mockAdmin as any,
        AdminPermissions.PRODUCTS_DELETE
      );

      expect(result).toBe(false);
    });
  });

  describe('createPermissionMiddleware', () => {
    test('should create middleware that validates permission', async () => {
      const mockAdmin = {
        id: 'admin-1',
        username: 'admin',
        role: 'super_admin' as const,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      };

      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ adminId: 'admin-1' });
      (prisma.adminUsers.findUnique as jest.Mock).mockResolvedValue(mockAdmin);

      const middleware = AdminPermissionManager.createPermissionMiddleware(
        AdminPermissions.USERS_READ
      );

      const mockRequest = new NextRequest(`${testConfig.baseURL}/api/admin/users`, {
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const result = await middleware(mockRequest, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(mockAdmin);
      expect(result).toBeDefined();
    });

    test('should return 401 for unauthenticated requests', async () => {
      const middleware = AdminPermissionManager.createPermissionMiddleware(
        AdminPermissions.USERS_READ
      );

      const mockRequest = new NextRequest(`${testConfig.baseURL}/api/admin/users`);
      const mockHandler = jest.fn();

      const result = await middleware(mockRequest, mockHandler);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.status).toBe(401);
    });

    test('should return 403 for unauthorized requests', async () => {
      const mockAdmin = {
        id: 'admin-1',
        username: 'admin',
        role: 'admin' as const,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      };

      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ adminId: 'admin-1' });
      (prisma.adminUsers.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (prisma.adminPermissions.findMany as jest.Mock).mockResolvedValue([]);

      const middleware = AdminPermissionManager.createPermissionMiddleware(
        AdminPermissions.PRODUCTS_DELETE
      );

      const mockRequest = new NextRequest(`${testConfig.baseURL}/api/admin/products`, {
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      const mockHandler = jest.fn();

      const result = await middleware(mockRequest, mockHandler);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.status).toBe(403);
    });
  });

  describe('Permission Constants', () => {
    test('should have all permission types defined', () => {
      expect(AdminPermissions.USERS_READ).toBeDefined();
      expect(AdminPermissions.USERS_WRITE).toBeDefined();
      expect(AdminPermissions.PRODUCTS_READ).toBeDefined();
      expect(AdminPermissions.PRODUCTS_WRITE).toBeDefined();
      expect(AdminPermissions.PRODUCTS_DELETE).toBeDefined();
      expect(AdminPermissions.ORDERS_READ).toBeDefined();
      expect(AdminPermissions.ORDERS_WRITE).toBeDefined();
      expect(AdminPermissions.WITHDRAWALS_READ).toBeDefined();
      expect(AdminPermissions.WITHDRAWALS_WRITE).toBeDefined();
      expect(AdminPermissions.STATS_READ).toBeDefined();
      expect(AdminPermissions.SETTINGS_READ).toBeDefined();
      expect(AdminPermissions.SETTINGS_WRITE).toBeDefined();
    });

    test('permissions should have correct structure', () => {
      expect(AdminPermissions.USERS_READ).toHaveProperty('resource');
      expect(AdminPermissions.USERS_READ).toHaveProperty('action');
      expect(AdminPermissions.USERS_READ.resource).toBe('users');
      expect(AdminPermissions.USERS_READ.action).toBe('read');
    });
  });
});
