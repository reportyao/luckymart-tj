import { createMockRequest, createMockResponse } from './test-utils';
/**
 * 推荐奖励触发API测试
 * 测试POST /api/referral/trigger-reward端点
 */


// 模拟依赖模块
jest.mock('@/lib/prisma', () => ({
  prisma: {
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
  },
}));

jest.mock('@/lib/reward-config-manager', () => ({
  loadRewardConfig: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  getLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    logRequest: jest.fn(),
  }),
}));

jest.mock('@/lib/monitoring', () => ({
  getMonitor: () => ({
    recordRequest: jest.fn(),
    recordResponseTime: jest.fn(),
    increment: jest.fn(),
  }),
}));

jest.mock('@/lib/middleware', () => ({
  withErrorHandling: (fn: any) => fn,
}));

jest.mock('@/lib/responses', () => ({
  respond: {
    success: jest.fn().mockReturnValue({
      toJSON: () => ({ success: true, data: {} }),
    }),
    customError: jest.fn().mockReturnValue({
      toJSON: () => ({ success: false, error: {} }),
    }),
  },
}));

describe('POST /api/referral/trigger-reward', () => {
  const mockPrisma = require('@/lib/prisma').prisma;
  const mockLoadRewardConfig = require('@/lib/reward-config-manager').loadRewardConfig;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('参数验证', () => {
    test('应该验证缺少user_id参数', async () => {
      const { POST } = await import('@/app/api/referral/trigger-reward/route');
      
      const req = createMockRequest({
        event_type: 'first_lottery',
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    test('应该验证缺少event_type参数', async () => {
      const { POST } = await import('@/app/api/referral/trigger-reward/route');
      
      const req = createMockRequest({
        user_id: 'test-user-id',
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    test('应该验证无效的event_type', async () => {
      const { POST } = await import('@/app/api/referral/trigger-reward/route');
      
      const req = createMockRequest({
        user_id: 'test-user-id',
        event_type: 'invalid_event',
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    test('应该接受有效的event_type值', async () => {
      const validEventTypes = ['first_lottery', 'first_purchase'];
      
      for (const eventType of validEventTypes) {
        const { POST } = await import('@/app/api/referral/trigger-reward/route');
        
        const req = createMockRequest({
          user_id: 'test-user-id',
          event_type: eventType,
        });

        const response = await POST(req);
        // 这里期望不会出现参数验证错误（尽管可能因为其他原因失败）
        expect(response.status).not.toBe(400);
      }
    });
  });

  describe('业务逻辑', () => {
    test('应该处理首次抽奖奖励触发', async () => {
      // 设置模拟数据
      mockPrisma.users.findUnique.mockResolvedValue({
        id: 'test-user-id',
        has_first_lottery: false,
        has_first_purchase: null,
        telegramId: '123456789',
        firstName: 'Test User',
      });

      mockPrisma.referralRelationships.findMany.mockResolvedValue([
        { referrer_user_id: 'referrer-1', referral_level: 1 },
        { referrer_user_id: 'referrer-2', referral_level: 2 },
      ]);

      mockLoadRewardConfig.mockResolvedValue([
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
      ]);

      mockPrisma.rewardTransactions.create.mockImplementation((data) => ({
        id: BigInt(1),
        ...data,
        created_at: new Date(),
      }));

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const { POST } = await import('@/app/api/referral/trigger-reward/route');
      
      const req = createMockRequest({
        user_id: 'test-user-id',
        event_type: 'first_lottery',
        event_data: {
          lottery_round_id: 'round-123',
          amount: 100,
        },
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
    });

    test('应该处理首次购买奖励触发', async () => {
      // 设置模拟数据
      mockPrisma.users.findUnique.mockResolvedValue({
        id: 'test-user-id',
        has_first_lottery: true,
        has_first_purchase: false,
        telegramId: '123456789',
        firstName: 'Test User',
      });

      mockPrisma.referralRelationships.findMany.mockResolvedValue([
        { referrer_user_id: 'referrer-1', referral_level: 1 },
      ]);

      mockLoadRewardConfig.mockResolvedValue([
        {
          id: 1,
          config_key: 'first_purchase_referrer_l1',
          config_name: '首次充值推荐者1级奖励',
          reward_amount: 10.0,
          is_active: true,
        },
      ]);

      mockPrisma.rewardTransactions.create.mockImplementation((data) => ({
        id: BigInt(1),
        ...data,
        created_at: new Date(),
      }));

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const { POST } = await import('@/app/api/referral/trigger-reward/route');
      
      const req = createMockRequest({
        user_id: 'test-user-id',
        event_type: 'first_purchase',
        event_data: {
          order_id: 'order-123',
          amount: 500,
        },
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
    });

    test('应该拒绝重复触发', async () => {
      // 设置用户已经触发过首次抽奖
      mockPrisma.users.findUnique.mockResolvedValue({
        id: 'test-user-id',
        has_first_lottery: true, // 已经触发过
        has_first_purchase: null,
      });

      const { POST } = await import('@/app/api/referral/trigger-reward/route');
      
      const req = createMockRequest({
        user_id: 'test-user-id',
        event_type: 'first_lottery',
      });

      const response = await POST(req);
      expect(response.status).toBe(409); // Conflict
    });

    test('应该处理不存在的用户', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      const { POST } = await import('@/app/api/referral/trigger-reward/route');
      
      const req = createMockRequest({
        user_id: 'non-existent-user',
        event_type: 'first_lottery',
      });

      const response = await POST(req);
      expect(response.status).toBe(404);
    });
  });

  describe('奖励发放', () => {
    test('应该为被推荐人发放奖励', async () => {
      const userRewardAmount = 3.0;
      
      mockPrisma.users.findUnique.mockResolvedValue({
        id: 'test-user-id',
        has_first_lottery: false,
        has_first_purchase: null,
      });

      mockPrisma.referralRelationships.findMany.mockResolvedValue([]);

      mockLoadRewardConfig.mockResolvedValue([
        {
          id: 1,
          config_key: 'first_play_referee',
          config_name: '首次抽奖被推荐者奖励',
          reward_amount: userRewardAmount,
          is_active: true,
        },
      ]);

      mockPrisma.rewardTransactions.create.mockImplementation((data) => ({
        id: BigInt(1),
        ...data,
        created_at: new Date(),
      }));

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const { POST } = await import('@/app/api/referral/trigger-reward/route');
      
      const req = createMockRequest({
        user_id: 'test-user-id',
        event_type: 'first_lottery',
      });

      await POST(req);

      // 验证被推荐人奖励交易记录创建
      expect(mockPrisma.rewardTransactions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-id',
          reward_type: 'referral_first_lottery',
          amount: userRewardAmount,
        })
      );

      // 验证用户余额更新
      expect(mockPrisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-user-id' },
          data: {
            coin_balance: { increment: userRewardAmount },
            has_first_lottery: true,
          },
        })
      );
    });

    test('应该为推荐人发放奖励', async () => {
      const referrerRewardAmount = 5.0;
      const referrerUserId = 'referrer-1';
      
      mockPrisma.users.findUnique.mockResolvedValue({
        id: 'test-user-id',
        has_first_lottery: false,
        has_first_purchase: null,
      });

      mockPrisma.referralRelationships.findMany.mockResolvedValue([
        { referrer_user_id: referrerUserId, referral_level: 1 },
      ]);

      mockLoadRewardConfig.mockResolvedValue([
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
          reward_amount: referrerRewardAmount,
          is_active: true,
        },
      ]);

      mockPrisma.rewardTransactions.create.mockImplementation((data) => ({
        id: BigInt(1),
        ...data,
        created_at: new Date(),
      }));

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const { POST } = await import('@/app/api/referral/trigger-reward/route');
      
      const req = createMockRequest({
        user_id: 'test-user-id',
        event_type: 'first_lottery',
      });

      await POST(req);

      // 验证推荐人奖励交易记录创建
      expect(mockPrisma.rewardTransactions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: referrerUserId,
          reward_type: 'referral_first_lottery_referrer',
          amount: referrerRewardAmount,
          source_user_id: 'test-user-id',
          referral_level: 1,
        })
      );
    });
  });

  describe('Telegram通知', () => {
    test('应该发送Telegram通知', async () => {
      // 模拟fetch函数
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      mockPrisma.users.findUnique.mockResolvedValue({
        id: 'test-user-id',
        has_first_lottery: false,
        has_first_purchase: null,
        telegramId: '123456789',
        firstName: 'Test User',
      });

      mockPrisma.referralRelationships.findMany.mockResolvedValue([]);

      mockLoadRewardConfig.mockResolvedValue([
        {
          id: 1,
          config_key: 'first_play_referee',
          config_name: '首次抽奖被推荐者奖励',
          reward_amount: 3.0,
          is_active: true,
        },
      ]);

      mockPrisma.rewardTransactions.create.mockImplementation((data) => ({
        id: BigInt(1),
        ...data,
        created_at: new Date(),
      }));

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const { POST } = await import('@/app/api/referral/trigger-reward/route');
      
      const req = createMockRequest({
        user_id: 'test-user-id',
        event_type: 'first_lottery',
      });

      await POST(req);

      // 验证Telegram API调用
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bot undefined/sendMessage',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: '123456789',
            text: expect.stringContaining('🎰'),
            parse_mode: 'Markdown',
          }),
        })
      );
    });
  });

  describe('错误处理', () => {
    test('应该处理数据库错误', async () => {
      mockPrisma.users.findUnique.mockRejectedValue(new Error('数据库连接失败'));

      const { POST } = await import('@/app/api/referral/trigger-reward/route');
      
      const req = createMockRequest({
        user_id: 'test-user-id',
        event_type: 'first_lottery',
      });

      const response = await POST(req);
      expect(response.status).toBe(500);
    });

    test('应该处理无效的配置', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        id: 'test-user-id',
        has_first_lottery: false,
        has_first_purchase: null,
      });

      mockPrisma.referralRelationships.findMany.mockResolvedValue([]);

      // 返回空的奖励配置
      mockLoadRewardConfig.mockResolvedValue([]);

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const { POST } = await import('@/app/api/referral/trigger-reward/route');
      
      const req = createMockRequest({
        user_id: 'test-user-id',
        event_type: 'first_lottery',
      });

      const response = await POST(req);
      expect(response.status).toBe(200); // 应该成功但不发放奖励
    });
  });
});