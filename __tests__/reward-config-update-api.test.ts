import { NextRequest } from 'next/server';
import { PUT as updateRewardConfig } from '@/app/api/admin/reward-config/[config_key]/route';
/**
 * 奖励配置更新API测试
 * 测试PUT /api/admin/reward-config/{config_key}
 */


// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: jest.fn(),
}));

// Mock数据库
jest.mock('@/lib/prisma', () => ({
  prisma: {
    rewardConfig: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    rewardConfigHistory: {
      create: jest.fn(),
    },
  },
}));

// Mock缓存管理器
jest.mock('@/lib/cache-manager', () => ({
  cacheManager: {
    config: {
      delete: jest.fn(),
    },
  },
}));

// Mock奖励配置管理器
jest.mock('@/lib/reward-config-manager', () => ({
  rewardConfigManager: {
    updateRewardConfig: jest.fn(),
    getAllRewardConfigs: jest.fn(),
    clearExpiredCache: jest.fn(),
  },
}));

// Mock管理员认证中间件
jest.mock('@/lib/admin-auth-middleware', () => ({
  requireAdminPermission: jest.fn((resource: string, action: string) => {
    return (handler: Function) => {
      return async (request: any, params: any) => {
        // 模拟管理员认证通过
        const mockAdmin = {
          id: 1,
          username: 'admin',
          role: 'super_admin',
          permissions: [`${resource}:${action}`]
        };
        return handler(request, params, mockAdmin);
      };
    };
  }),
}));

describe('奖励配置更新API', () => {
  let mockRequest: Partial<NextRequest>;
  let mockParams: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 准备测试数据
    const testBaseURL = process.env.TEST_API_BASE_URL || '${API_BASE_URL}';
    mockRequest = {
      method: 'PUT',
      url: `${testBaseURL}/api/admin/reward-config/register_referrer_l1`,
      headers: new Map([
        ['content-type', 'application/json'],
        ['user-agent', 'TestAgent/1.0'],
        ['x-forwarded-for', '127.0.0.1']
      ]),
      json: jest.fn().mockResolvedValue({
        reward_amount: 10.5,
        is_active: true,
        updated_by: 'admin_test'
      })
    };

    mockParams = {
      config_key: 'register_referrer_l1'
    };

    // 设置默认的模拟返回值
    const { prisma } = require('@/lib/prisma');
    const { rewardConfigManager } = require('@/lib/reward-config-manager');
    
    prisma.rewardConfig.findUnique.mockResolvedValue({
      id: 1,
      config_key: 'register_referrer_l1',
      config_name: '注册推荐者1级奖励',
      reward_amount: 5.0,
      is_active: true,
      updated_at: new Date(),
      updated_by: 'admin'
    });

    rewardConfigManager.getAllRewardConfigs.mockResolvedValue([
      {
        config_key: 'register_referrer_l1',
        config_name: '注册推荐者1级奖励',
        reward_amount: 5.0,
        is_active: true,
        updated_at: new Date(),
        updated_by: 'admin'
      }
    ]);

    rewardConfigManager.updateRewardConfig.mockResolvedValue({
      id: 1,
      config_key: 'register_referrer_l1',
      config_name: '注册推荐者1级奖励',
      reward_amount: 10.5,
      is_active: true,
      updated_at: new Date(),
      updated_by: 'admin_test'
    });
  });

  describe('参数验证', () => {
    test('应该验证奖励金额不能为负数', async () => {
      mockRequest.json = jest.fn().mockResolvedValue({
        reward_amount: -1,
        is_active: true,
        updated_by: 'admin_test'
      });

      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('奖励金额不能小于0');
    });

    test('应该验证奖励金额小数位数不超过1位', async () => {
      mockRequest.json = jest.fn().mockResolvedValue({
        reward_amount: 10.123,
        is_active: true,
        updated_by: 'admin_test'
      });

      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('奖励金额最多支持1位小数');
    });

    test('应该验证奖励金额不超过最大值', async () => {
      mockRequest.json = jest.fn().mockResolvedValue({
        reward_amount: 2000000,
        is_active: true,
        updated_by: 'admin_test'
      });

      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('奖励金额不能超过1000000');
    });

    test('应该验证is_active必须是布尔值', async () => {
      mockRequest.json = jest.fn().mockResolvedValue({
        reward_amount: 10.0,
        is_active: 'invalid',
        updated_by: 'admin_test'
      });

      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('is_active必须是布尔值');
    });

    test('应该验证updated_by不能为空', async () => {
      mockRequest.json = jest.fn().mockResolvedValue({
        reward_amount: 10.0,
        is_active: true,
        updated_by: ''
      });

      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('更新人不能为空');
    });

    test('应该验证缺少必填字段', async () => {
      mockRequest.json = jest.fn().mockResolvedValue({
        reward_amount: 10.0,
        // 缺少is_active和updated_by
      });

      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('缺少必填字段');
    });

    test('应该验证配置键不能为空', async () => {
      const emptyParams = { config_key: '' };
      
      mockRequest.json = jest.fn().mockResolvedValue({
        reward_amount: 10.0,
        is_active: true,
        updated_by: 'admin_test'
      });

      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: emptyParams }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('配置键名不能为空');
    });
  });

  describe('业务逻辑', () => {
    test('应该成功更新奖励配置金额', async () => {
      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.reward_amount).toBe(10.5);
      expect(data.data.updated_by).toBe('admin_test');
    });

    test('应该处理不存在的配置键', async () => {
      const { rewardConfigManager } = require('@/lib/reward-config-manager');
      rewardConfigManager.getAllRewardConfigs.mockResolvedValue([]);

      const notFoundParams = { config_key: 'nonexistent_key' };
      
      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: notFoundParams }
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('配置键不存在');
    });

    test('应该成功切换配置激活状态', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.rewardConfig.findUnique.mockResolvedValue({
        id: 1,
        config_key: 'register_referrer_l1',
        config_name: '注册推荐者1级奖励',
        reward_amount: 5.0,
        is_active: true,
        updated_at: new Date(),
        updated_by: 'admin'
      });

      mockRequest.json = jest.fn().mockResolvedValue({
        reward_amount: 5.0,
        is_active: false,
        updated_by: 'admin_test'
      });

      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // 验证数据库更新被调用
      expect(prisma.rewardConfig.update).toHaveBeenCalled();
      expect(prisma.rewardConfigHistory.create).toHaveBeenCalled();
    });

    test('应该记录到审计表', async () => {
      const { rewardConfigManager } = require('@/lib/reward-config-manager');
      
      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(200);
      
      // 验证updateRewardConfig被调用，带有审计信息
      expect(rewardConfigManager.updateRewardConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          configKey: 'register_referrer_l1',
          newValue: 10.5,
          updatedBy: 'admin_test',
          ipAddress: '127.0.0.1',
          userAgent: 'TestAgent/1.0'
        })
      );
    });

    test('应该清除缓存', async () => {
      const { cacheManager } = require('@/lib/cache-manager');
      const { rewardConfigManager } = require('@/lib/reward-config-manager');
      
      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(200);
      
      // 验证缓存清除被调用
      expect(cacheManager.config.delete).toHaveBeenCalledWith(
        expect.stringContaining('reward:config:single:')
      );
      expect(rewardConfigManager.clearExpiredCache).toHaveBeenCalled();
    });
  });

  describe('边界情况', () => {
    test('应该处理最小值0', async () => {
      mockRequest.json = jest.fn().mockResolvedValue({
        reward_amount: 0,
        is_active: true,
        updated_by: 'admin_test'
      });

      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('应该处理最大值1000000', async () => {
      mockRequest.json = jest.fn().mockResolvedValue({
        reward_amount: 1000000.0,
        is_active: true,
        updated_by: 'admin_test'
      });

      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('应该处理1位小数', async () => {
      mockRequest.json = jest.fn().mockResolvedValue({
        reward_amount: 10.5,
        is_active: true,
        updated_by: 'admin_test'
      });

      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('应该处理很长的更新人名称', async () => {
      const longName = 'a'.repeat(100);
      mockRequest.json = jest.fn().mockResolvedValue({
        reward_amount: 10.0,
        is_active: true,
        updated_by: longName
      });

      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('应该拒绝超过长度限制的更新人名称', async () => {
      const tooLongName = 'a'.repeat(101);
      mockRequest.json = jest.fn().mockResolvedValue({
        reward_amount: 10.0,
        is_active: true,
        updated_by: tooLongName
      });

      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('更新人名称不能超过100个字符');
    });
  });

  describe('错误处理', () => {
    test('应该处理数据库异常', async () => {
      const { rewardConfigManager } = require('@/lib/reward-config-manager');
      rewardConfigManager.updateRewardConfig.mockRejectedValue(
        new Error('数据库连接失败')
      );

      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('更新配置失败');
    });

    test('应该处理JSON解析异常', async () => {
      mockRequest.json : jest.fn().mockRejectedValue(
        new Error('JSON解析失败')
      );

      const response = await updateRewardConfig(;
        mockRequest as NextRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('服务器内部错误');
    });
  });
});
