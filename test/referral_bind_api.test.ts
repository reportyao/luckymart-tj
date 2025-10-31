/**
 * 推荐绑定API测试
 * 测试POST /api/referral/bind的所有功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../lib/prisma';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// Mock依赖
jest.mock('../lib/prisma', () => ({
  prisma: {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn()
    },
    deviceFingerprints: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
      count: jest.fn()
    },
    deviceBlacklist: {
      findUnique: jest.fn(),
      delete: jest.fn()
    },
    fraudDetectionLogs: {
      create: jest.fn()
    },
    referralRelationships: {
      createMany: jest.fn()
    },
    rewardTransactions: {
      create: jest.fn()
    },
    rewardConfig: {
      findMany: jest.fn()
    },
    $transaction: jest.fn()
  }
}));

// 测试数据
const mockUserTelegramId = '123456789';
const mockReferralCode = 'USER1234_AB12CD';
const mockDeviceFingerprint = 'device_fp_abc123';
const mockIpAddress = '192.168.1.100';

const mockRefereeUser = {
  id: 'user-referee-id',
  telegramId: mockUserTelegramId,
  firstName: '测试用户',
  referred_by_user_id: null
};

const mockReferrerUser = {
  id: 'user-referrer-id',
  telegramId: '987654321',
  firstName: '推荐人',
  referral_code: mockReferralCode
};

const mockRewardConfigs = [
  {
    config_key: 'register_referee',
    config_name: '注册被推荐者奖励',
    reward_amount: 2.0,
    is_active: true
  },
  {
    config_key: 'register_referrer_l1',
    config_name: '注册推荐者1级奖励',
    reward_amount: 5.0,
    is_active: true
  }
];

describe('推荐绑定API测试', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 创建模拟请求
    mockRequest = {
      json: jest.fn(),
      method: 'POST',
      headers: new Headers(),
      url: '/api/referral/bind'
    } as any;
  });

  test('成功绑定推荐关系', async () => {
    // 准备测试数据
    const requestBody = {
      user_telegram_id: mockUserTelegramId,
      referral_code: mockReferralCode,
      device_fingerprint: mockDeviceFingerprint,
      ip_address: mockIpAddress
    };

    mockRequest.json = jest.fn().mockResolvedValue(requestBody);

    // Mock数据库操作
    (prisma.users.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockRefereeUser) // 查找被推荐用户
      .mockResolvedValueOnce(mockReferrerUser); // 查找推荐用户

    (prisma.deviceBlacklist.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.deviceFingerprints.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.deviceFingerprints.count as jest.Mock).mockResolvedValue(1);

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback(prisma);
    });

    // Mock推荐关系创建
    (prisma.users.update as jest.Mock).mockResolvedValue({
      ...mockRefereeUser,
      referred_by_user_id: mockReferrerUser.id
    });

    (prisma.referralRelationships.createMany as jest.Mock).mockResolvedValue({ count: 1 });

    // Mock奖励发放
    (prisma.rewardTransactions.create as jest.Mock)
      .mockResolvedValueOnce({
        id: 1n,
        user_id: mockRefereeUser.id,
        reward_type: 'referral_register',
        amount: 2.0,
        config_snapshot: { config_key: 'register_referee' }
      })
      .mockResolvedValueOnce({
        id: 2n,
        user_id: mockReferrerUser.id,
        reward_type: 'referral_register',
        amount: 5.0,
        referral_level: 1,
        config_snapshot: { config_key: 'register_referrer_l1' }
      });

    (prisma.users.update as jest.Mock)
      .mockResolvedValueOnce(mockRefereeUser)
      .mockResolvedValueOnce(mockReferrerUser);

    // Mock加载奖励配置
    (prisma.rewardConfig.findMany as jest.Mock).mockResolvedValue(mockRewardConfigs);

    // Mock Telegram通知
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    // 执行测试
    const response = await POST(mockRequest);
    const responseData = await response.json();

    // 验证结果
    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.bind_info).toBeDefined();
    expect(responseData.data.rewards).toBeDefined();
    expect(responseData.data.message).toBe('推荐关系绑定成功，奖励已发放');

    // 验证数据库调用
    expect(prisma.users.findUnique).toHaveBeenCalledTimes(2);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.users.update).toHaveBeenCalledWith(
      { id: mockRefereeUser.id },
      { referred_by_user_id: mockReferrerUser.id }
    );
    expect(prisma.referralRelationships.createMany).toHaveBeenCalled();
    expect(prisma.rewardTransactions.create).toHaveBeenCalledTimes(2);
  });

  test('用户不存在', async () => {
    const requestBody = {
      user_telegram_id: 'nonexistent_user',
      referral_code: mockReferralCode,
      device_fingerprint: mockDeviceFingerprint,
      ip_address: mockIpAddress
    };

    mockRequest.json = jest.fn().mockResolvedValue(requestBody);

    (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(404);
    expect(responseData.success).toBe(false);
    expect(responseData.error.message).toContain('用户不存在');
  });

  test('推荐码无效', async () => {
    const requestBody = {
      user_telegram_id: mockUserTelegramId,
      referral_code: 'invalid_code',
      device_fingerprint: mockDeviceFingerprint,
      ip_address: mockIpAddress
    };

    mockRequest.json = jest.fn().mockResolvedValue(requestBody);

    (prisma.users.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockRefereeUser)
      .mockResolvedValueOnce(null);

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(404);
    expect(responseData.success).toBe(false);
    expect(responseData.error.message).toContain('推荐码无效');
  });

  test('用户已有推荐人', async () => {
    const requestBody = {
      user_telegram_id: mockUserTelegramId,
      referral_code: mockReferralCode,
      device_fingerprint: mockDeviceFingerprint,
      ip_address: mockIpAddress
    };

    mockRequest.json = jest.fn().mockResolvedValue(requestBody);

    const userWithReferrer = { ...mockRefereeUser, referred_by_user_id: 'existing-referrer-id' };
    (prisma.users.findUnique as jest.Mock)
      .mockResolvedValueOnce(userWithReferrer)
      .mockResolvedValueOnce(mockReferrerUser);

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(409);
    expect(responseData.success).toBe(false);
    expect(responseData.error.message).toContain('已有推荐人');
  });

  test('自我推荐拦截', async () => {
    const requestBody = {
      user_telegram_id: mockReferrerUser.telegramId, // 使用推荐人的telegram_id
      referral_code: mockReferralCode,
      device_fingerprint: mockDeviceFingerprint,
      ip_address: mockIpAddress
    };

    mockRequest.json = jest.fn().mockResolvedValue(requestBody);

    const sameTelegramUser = {
      ...mockRefereeUser,
      telegramId: mockReferrerUser.telegramId
    };

    (prisma.users.findUnique as jest.Mock)
      .mockResolvedValueOnce(sameTelegramUser)
      .mockResolvedValueOnce(mockReferrerUser);

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback(prisma);
    });

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error.message).toContain('不能自己推荐自己');
  });

  test('设备黑名单拦截', async () => {
    const requestBody = {
      user_telegram_id: mockUserTelegramId,
      referral_code: mockReferralCode,
      device_fingerprint: 'blacklisted_device',
      ip_address: mockIpAddress
    };

    mockRequest.json = jest.fn().mockResolvedValue(requestBody);

    (prisma.users.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockRefereeUser)
      .mockResolvedValueOnce(mockReferrerUser);

    // 模拟设备在黑名单中
    (prisma.deviceBlacklist.findUnique as jest.Mock).mockResolvedValue({
      device_id: 'blacklisted_device',
      reason: '设备被举报作弊',
      expires_at: new Date(Date.now() + 86400000) // 未来时间，未过期
    });

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback(prisma);
    });

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error.message).toContain('设备已被拉黑');
  });

  test('设备重复使用拦截', async () => {
    const requestBody = {
      user_telegram_id: mockUserTelegramId,
      referral_code: mockReferralCode,
      device_fingerprint: mockDeviceFingerprint,
      ip_address: mockIpAddress
    };

    mockRequest.json = jest.fn().mockResolvedValue(requestBody);

    (prisma.users.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockRefereeUser)
      .mockResolvedValueOnce(mockReferrerUser);

    (prisma.deviceBlacklist.findUnique as jest.Mock).mockResolvedValue(null);
    
    // 模拟设备已被其他用户使用
    (prisma.deviceFingerprints.findFirst as jest.Mock).mockResolvedValue({
      device_id: mockDeviceFingerprint,
      user_id: 'other-user-id',
      created_at: new Date()
    });

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback(prisma);
    });

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error.message).toContain('设备已被其他用户使用');
  });

  test('缺少必需参数', async () => {
    const requestBody = {
      user_telegram_id: mockUserTelegramId,
      referral_code: mockReferralCode
      // 缺少 device_fingerprint 和 ip_address
    };

    mockRequest.json = jest.fn().mockResolvedValue(requestBody);

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error.message).toContain('缺少必需参数');
  });
});

// 手动导入并测试实际的API路由
import { POST } from '../app/api/referral/bind/route';

describe('推荐绑定API完整流程测试', () => {
  test('完整成功流程测试', async () => {
    const testData = {
      user_telegram_id: '111111111',
      referral_code: 'TEST1234_ABCD12',
      device_fingerprint: 'test_device_123',
      ip_address: '127.0.0.1'
    };

    // 创建真实的测试请求
    const request = new Request('${API_BASE_URL}/api/referral/bind', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    // Mock所有数据库操作
    const mockPrisma = {
      users: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn()
      },
      deviceFingerprints: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        create: jest.fn(),
        count: jest.fn()
      },
      deviceBlacklist: {
        findUnique: jest.fn(),
        delete: jest.fn()
      },
      fraudDetectionLogs: {
        create: jest.fn()
      },
      referralRelationships: {
        createMany: jest.fn()
      },
      rewardTransactions: {
        create: jest.fn()
      },
      rewardConfig: {
        findMany: jest.fn()
      },
      $transaction: jest.fn()
    };

    // 重置模块mock
    jest.clearAllMocks();
    jest.mock('../lib/prisma', () => mockPrisma);
    
    // 执行测试的逻辑应该在这里实现...
    console.log('完整流程测试准备就绪');
  });
});