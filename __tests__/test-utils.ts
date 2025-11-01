import { NextRequest } from 'next/server';
/**
 * 测试工具函数
 * 为API测试提供模拟请求和响应工具
 */


/**
 * 创建模拟的NextRequest对象
 */
export function createMockRequest(body: any, options: Partial<NextRequest> = {}): NextRequest {
  const mockRequest = {
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    json: async () => Promise.resolve(body),
    ...options,
  } as unknown as NextRequest;

  return mockRequest;
}

/**
 * 创建模拟的NextResponse对象
 */
export function createMockResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    headers: new Headers(),
  };
}

/**
 * 模拟数据库操作
 */
export function mockDatabase() {
  return {
    users: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    rewardTransactions: {
      create: jest.fn(),
    },
    referralRelationships: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

/**
 * 模拟奖励配置
 */
export const mockRewardConfigs = {
  first_lottery: [
    {
      id: 1,
      config_key: 'first_play_referee',
      config_name: '首次抽奖被推荐者奖励',
      reward_amount: 3.0,
      is_active: true,
    },
    {
      id: 2,
      config_key: 'first_play_referrer_l1',
      config_name: '首次抽奖推荐者1级奖励',
      reward_amount: 5.0,
      is_active: true,
    },
    {
      id: 3,
      config_key: 'first_play_referrer_l2',
      config_name: '首次抽奖推荐者2级奖励',
      reward_amount: 3.0,
      is_active: true,
    },
    {
      id: 4,
      config_key: 'first_play_referrer_l3',
      config_name: '首次抽奖推荐者3级奖励',
      reward_amount: 2.0,
      is_active: true,
    },
  ],
  first_purchase: [
    {
      id: 5,
      config_key: 'first_purchase_referrer_l1',
      config_name: '首次充值推荐者1级奖励',
      reward_amount: 10.0,
      is_active: true,
    },
    {
      id: 6,
      config_key: 'first_purchase_referrer_l2',
      config_name: '首次充值推荐者2级奖励',
      reward_amount: 5.0,
      is_active: true,
    },
    {
      id: 7,
      config_key: 'first_purchase_referrer_l3',
      config_name: '首次充值推荐者3级奖励',
      reward_amount: 2.0,
      is_active: true,
    },
  ],
};

/**
 * 模拟用户数据
 */
export const mockUsers = {
  regular_user: {
    id: 'user-123',
    telegramId: '123456789',
    firstName: 'Test User',
    has_first_lottery: false,
    has_first_purchase: false,
  },
  lottery_user: {
    id: 'user-456',
    telegramId: '987654321',
    firstName: 'Lottery User',
    has_first_lottery: true,
    has_first_purchase: false,
  },
  purchase_user: {
    id: 'user-789',
    telegramId: '555666777',
    firstName: 'Purchase User',
    has_first_lottery: true,
    has_first_purchase: true,
  },
};

/**
 * 模拟推荐关系
 */
export const mockReferralRelationships = [;
  {
    referrer_user_id: 'referrer-1',
    referral_level: 1,
  },
  {
    referrer_user_id: 'referrer-2',
    referral_level: 2,
  },
  {
    referrer_user_id: 'referrer-3',
    referral_level: 3,
  },
];

/**
 * 断言工具函数
 */
export const assertions = {
  /**
   * 验证响应状态码
   */
  expectStatus(response: any, statusCode: number) {
    expect(response.status).toBe(statusCode);
  },

  /**
   * 验证响应结构
   */
  expectSuccessResponse(response: any) {
    const data = response._opts?.body ? JSON.parse(response._opts.body) : {};
    
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.trigger_info).toBeDefined();
    expect(data.data.rewards).toBeDefined();
  },

  /**
   * 验证错误响应结构
   */
  expectErrorResponse(response: any, errorCode?: string) {
    const data = response._opts?.body ? JSON.parse(response._opts.body) : {};
    
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    if (errorCode) {
      expect(data.error.code).toBe(errorCode);
}
  },

  /**
   * 验证奖励数据
   */
  expectRewards(response: any, expectedUserRewards: number, expectedReferrerRewards: number) {
    const data = response._opts?.body ? JSON.parse(response._opts.body) : {};
    
    expect(data.data.rewards.user_rewards).toHaveLength(expectedUserRewards);
    expect(data.data.rewards.referrer_rewards).toHaveLength(expectedReferrerRewards);
  },
};

/**
 * 性能测试工具
 */
export async function measurePerformance(testFn: () => Promise<any>): Promise<number> {
  const start = Date.now();
  await testFn();
  const end = Date.now();
  return end - start;
}

/**
 * 并发测试工具
 */
export async function runConcurrentTests(
  testFn: (index: number) => Promise<any>,
  concurrency: number = 5
): Promise<void> {
  const promises = Array.from({ length: concurrency }, (_, i) => testFn(i));
  await Promise.all(promises);
}

/**
 * 数据库重置工具
 */
export function resetDatabase() {
  const { prisma } = require('@/lib/prisma');
  
  // 重置所有模拟函数
  jest.clearAllMocks();
  
  // 重置模块缓存
  jest.resetModules();
  
  return prisma;
}

/**
 * 环境变量设置工具
 */
export function setTestEnvironment() {
  process.env.NODE_ENV = 'test';
  process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379';
  process.env.TEST_API_BASE_URL = process.env.TEST_API_BASE_URL || '${API_BASE_URL}';
  process.env.MINI_APP_URL = process.env.TEST_MINI_APP_URL || '${API_BASE_URL}';
}

/**
 * 清理测试环境
 */
export function cleanupTestEnvironment() {
  delete process.env.NODE_ENV;
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.DATABASE_URL;
  delete process.env.REDIS_URL;
  delete process.env.TEST_API_BASE_URL;
  delete process.env.MINI_APP_URL;
}