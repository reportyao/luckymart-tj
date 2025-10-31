import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { POST, OPTIONS } from '@/app/api/admin/reward-config/batch-update/route';
import { rewardConfigManager } from '@/lib/reward-config-manager';

// 模拟依赖模块
vi.mock('@/lib/admin-auth-middleware', () => ({
  requireAdminPermission: vi.fn((_resource: string, _action: string) => {
    return (handler: Function) => handler;
  }),
}));

vi.mock('@/lib/logger', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }))
}));

vi.mock('@/lib/cache-manager', () => ({
  cacheManager: {
    config: {
      delete: vi.fn()
    }
  }
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (callback) => {
      const mockTx = {
        rewardConfig: {
          findMany: vi.fn(),
          update: vi.fn()
        },
        rewardConfigHistory: {
          create: vi.fn()
        }
      };
      return callback(mockTx);
    })
  }
}));

vi.mock('@/lib/reward-config-manager', () => ({
  rewardConfigManager: {
    clearExpiredCache: vi.fn()
  }
}));

describe('POST /api/admin/reward-config/batch-update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该成功批量更新奖励配置', async () => {
    const mockConfig = {
      id: 1,
      config_key: 'test_key',
      reward_amount: 10.0,
      is_active: true
    };

    const mockUpdatedConfig = {
      ...mockConfig,
      reward_amount: 15.0,
      updated_by: 'admin_user'
    };

    const mockTx = {
      rewardConfig: {
        findMany: vi.fn().mockResolvedValue([mockConfig]),
        update: vi.fn().mockResolvedValue(mockUpdatedConfig)
      },
      rewardConfigHistory: {
        create: vi.fn().mockResolvedValue({})
      }
    };

    // @ts-ignore
    vi.mocked(require('@/lib/prisma').prisma.$transaction)
      .mockImplementationOnce(async (callback) => callback(mockTx));

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: {
        updates: [
          {
            config_key: 'test_key',
            reward_amount: 15.0
          }
        ],
        updated_by: 'admin_user'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.summary.successful).toBe(1);
    expect(data.data.summary.failed).toBe(0);
    expect(data.data.updates[0].success).toBe(true);
    expect(data.data.updates[0].config_key).toBe('test_key');
    expect(data.data.updates[0].new_value).toBe(15.0);
  });

  it('应该处理部分失败的批量更新', async () => {
    const mockConfigs = [
      { id: 1, config_key: 'valid_key', reward_amount: 10.0, is_active: true },
      { id: 2, config_key: 'another_key', reward_amount: 20.0, is_active: true }
    ];

    const mockTx = {
      rewardConfig: {
        findMany: vi.fn().mockResolvedValue(mockConfigs),
        update: vi.fn()
          .mockResolvedValueOnce({ ...mockConfigs[0], reward_amount: 15.0 })
          .mockRejectedValueOnce(new Error('更新失败'))
      },
      rewardConfigHistory: {
        create: vi.fn().mockResolvedValue({})
      }
    };

    // @ts-ignore
    vi.mocked(require('@/lib/prisma').prisma.$transaction)
      .mockImplementationOnce(async (callback) => callback(mockTx));

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: {
        updates: [
          { config_key: 'valid_key', reward_amount: 15.0 },
          { config_key: 'another_key', reward_amount: 25.0 }
        ],
        updated_by: 'admin_user'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.summary.successful).toBe(1);
    expect(data.data.summary.failed).toBe(1);
    expect(data.data.updates[0].success).toBe(true);
    expect(data.data.updates[1].success).toBe(false);
    expect(data.data.updates[1].error).toBe('更新失败');
  });

  it('应该验证请求参数错误', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: {
        // 缺少updates字段
        updated_by: 'admin_user'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('缺少必填字段');
  });

  it('应该验证奖励金额格式错误', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: {
        updates: [
          {
            config_key: 'test_key',
            reward_amount: -5 // 负数应该被拒绝
          }
        ],
        updated_by: 'admin_user'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('不能小于');
  });

  it('应该处理空数组', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: {
        updates: [],
        updated_by: 'admin_user'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('不能为空');
  });

  it('应该处理超出最大批量大小的请求', async () => {
    const updates = Array.from({ length: 51 }, (_, i) => ({
      config_key: `key_${i}`,
      reward_amount: 10.0 + i
    }));

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: {
        updates,
        updated_by: 'admin_user'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('最多支持');
  });

  it('应该处理重复的config_key', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: {
        updates: [
          { config_key: 'duplicate_key', reward_amount: 15.0 },
          { config_key: 'duplicate_key', reward_amount: 20.0 }
        ],
        updated_by: 'admin_user'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('重复的config_key');
  });

  it('应该正确处理配置值未变更的情况', async () => {
    const mockConfig = {
      id: 1,
      config_key: 'test_key',
      reward_amount: 10.0,
      is_active: true
    };

    const mockTx = {
      rewardConfig: {
        findMany: vi.fn().mockResolvedValue([mockConfig]),
        update: vi.fn()
      },
      rewardConfigHistory: {
        create: vi.fn().mockResolvedValue({})
      }
    };

    // @ts-ignore
    vi.mocked(require('@/lib/prisma').prisma.$transaction)
      .mockImplementationOnce(async (callback) => callback(mockTx));

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: {
        updates: [
          {
            config_key: 'test_key',
            reward_amount: 10.0 // 相同值
          }
        ],
        updated_by: 'admin_user'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.summary.successful).toBe(1);
    // 验证没有调用update方法（值未变更）
    expect(mockTx.rewardConfig.update).not.toHaveBeenCalled();
    expect(data.data.updates[0].error).toBe('值未变更');
  });

  it('应该处理小数位数验证', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: {
        updates: [
          {
            config_key: 'test_key',
            reward_amount: 10.123 // 超过1位小数
          }
        ],
        updated_by: 'admin_user'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('最多支持');
  });
});

describe('OPTIONS /api/admin/reward-config/batch-update', () => {
  it('应该处理OPTIONS预检请求', async () => {
    const { req, res } = createMocks({
      method: 'OPTIONS'
    });

    const response = await OPTIONS(req);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
  });
});