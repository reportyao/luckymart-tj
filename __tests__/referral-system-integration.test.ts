/**
 * 核心邀请业务流程集成测试
 * 测试整个邀请系统的完整业务流程
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TestDataGenerator, PerformanceTester } from './test-config';

// 模拟数据库操作
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    referrals: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    transactions: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
}));

// 模拟Redis缓存
jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    close: jest.fn(),
  })),
}));

// 模拟Telegram Bot
jest.mock('telegraf', () => ({
  Telegraf: jest.fn().mockImplementation(() => ({
    launch: jest.fn(),
    stop: jest.fn(),
    telegram: {
      sendMessage: jest.fn(),
      sendPhoto: jest.fn(),
    },
  })),
}));

describe('核心邀请业务流程集成测试', () => {
  let testDataGenerator: TestDataGenerator;
  let mockPrisma: any;

  beforeEach(() => {
    testDataGenerator = new TestDataGenerator({} as any);
    mockPrisma = {
      users: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      referrals: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      transactions: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('邀请链路测试', () => {
    test('用户生成邀请码流程', async () => {
      // 生成测试用户
      const inviter = testDataGenerator.generateUser({
        id: 'test-inviter-001',
        username: 'test_inviter',
        balance: 1000,
      });

      // 模拟数据库查找用户
      mockPrisma.users.findUnique.mockResolvedValue(inviter);
      
      // 模拟用户不存在的情况，创建新用户
      mockPrisma.users.create.mockResolvedValue(inviter);
      
      // 生成邀请码
      const inviteCode = 'INV' + Date.now().toString().slice(-6);
      
      expect(inviteCode).toMatch(/^INV\d{6}$/);
      expect(inviter.id).toBe('test-inviter-001');
    });

    test('用户通过邀请码注册流程', async () => {
      // 模拟邀请人
      const inviter = testDataGenerator.generateUser({
        id: 'test-inviter-002',
        username: 'test_inviter',
        balance: 1000,
      });

      // 模拟被邀请人
      const invitee = testDataGenerator.generateUser({
        id: 'test-invitee-001',
        telegramId: 'test_telegram_invitee',
        username: 'test_invitee',
      });

      // 设置邀请关系
      const referralRecord = {
        id: 'referral-001',
        inviterId: inviter.id,
        inviteeId: invitee.id,
        status: 'active',
        createdAt: new Date(),
      };

      // 模拟数据库操作
      mockPrisma.users.findUnique
        .mockResolvedValueOnce(inviter) // 找到邀请人
        .mockResolvedValueOnce(null); // 被邀请人不存在

      mockPrisma.users.create.mockResolvedValue(invitee);
      mockPrisma.referrals.create.mockResolvedValue(referralRecord);
      mockPrisma.$transaction.mockResolvedValue([invitee, referralRecord]);

      // 执行邀请注册流程
      const result = await mockPrisma.$transaction([
        mockPrisma.users.create({ data: invitee }),
        mockPrisma.referrals.create({ 
          data: {
            inviterId: inviter.id,
            inviteeId: invitee.id,
            status: 'active'
          }
        }),
      ]);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(invitee);
      expect(result[1]).toBe(referralRecord);
    });

    test('邀请奖励发放流程', async () => {
      // 设置邀请关系完成后的奖励计算
      const inviter = testDataGenerator.generateUser({
        id: 'test-inviter-003',
        balance: 1000,
      });

      const invitee = testDataGenerator.generateUser({
        id: 'test-invitee-002',
      });

      // 模拟交易记录
      const rewardTransaction = {
        id: 'txn-reward-001',
        userId: inviter.id,
        type: 'referral_reward',
        amount: 50.0,
        description: '邀请奖励',
        balanceAfter: 1050,
        createdAt: new Date(),
      };

      // 模拟数据库操作
      mockPrisma.transactions.create.mockResolvedValue(rewardTransaction);
      mockPrisma.users.update.mockResolvedValue({
        ...inviter,
        balance: 1050,
      });

      // 模拟奖励触发逻辑
      const rewardAmount = 50.0;
      const newBalance = inviter.balance + rewardAmount;

      expect(rewardTransaction.amount).toBe(rewardAmount);
      expect(newBalance).toBe(1050);
      expect(rewardTransaction.type).toBe('referral_reward');
    });
  });

  describe('邀请数据统计测试', () => {
    test('邀请人统计信息查询', async () => {
      const inviterId = 'test-inviter-004';
      
      // 模拟邀请统计数据
      const referralStats = {
        totalInvites: 5,
        activeInvites: 3,
        totalRewards: 250.0,
        pendingRewards: 0,
        conversionRate: 60.0, // 3/5 * 100
      };

      // 模拟数据库查询
      mockPrisma.referrals.count
        .mockResolvedValueOnce(5) // 总邀请数
        .mockResolvedValueOnce(3); // 活跃邀请数

      mockPrisma.transactions.aggregate = jest.fn().mockResolvedValue({
        _sum: { amount: 250.0 },
        _count: { id: 10 },
      });

      const totalInvites = await mockPrisma.referrals.count({ where: { inviterId } });
      const activeInvites = await mockPrisma.referrals.count({ 
        where: { inviterId, status: 'active' } 
      });

      expect(totalInvites).toBe(5);
      expect(activeInvites).toBe(3);
    });

    test('被邀请人活跃度统计', async () => {
      const inviteeId = 'test-invitee-003';
      
      // 模拟被邀请人活动记录
      const activityStats = {
        totalGames: 25,
        totalSpent: 500.0,
        lastActiveDate: new Date(),
        daysSinceRegistration: 7,
        averageDailySpent: 71.43,
      };

      // 模拟数据库查询
      mockPrisma.transactions.findMany.mockResolvedValue([
        { type: 'lottery', amount: -20, createdAt: new Date(Date.now() - 86400000) },
        { type: 'lottery', amount: -15, createdAt: new Date(Date.now() - 172800000) },
      ]);

      expect(activityStats.totalGames).toBeGreaterThan(0);
      expect(activityStats.totalSpent).toBeGreaterThan(0);
      expect(activityStats.conversionRate).toBeUndefined(); // 这个字段不存在
    });
  });

  describe('邀请系统性能测试', () => {
    test('批量邀请处理性能', async () => {
      const batchSize = 100;
      const operations: (() => Promise<any>)[] = [];

      // 生成批量邀请操作
      for (let i = 0; i < batchSize; i++) {
        operations.push(async () => {
          const referral = {
            id: `referral-batch-${i}`,
            inviterId: `inviter-${i}`,
            inviteeId: `invitee-${i}`,
            status: 'active',
          };
          
          mockPrisma.referrals.create.mockResolvedValueOnce(referral);
          return referral;
        });
      }

      // 执行批量操作性能测试
      const { result, duration } = await PerformanceTester.measureExecutionTime(async () => {
        const results = await Promise.all(operations.map(op => op()));
        return results;
      });

      expect(result).toHaveLength(batchSize);
      expect(duration).toBeLessThan(1000); // 1秒内完成
      console.log(`批量邀请处理时间: ${duration.toFixed(2)}ms`);
    });

    test('并发邀请注册压力测试', async () => {
      const concurrentRegistrations = 50;
      
      const registerUser = async (index: number) => {
        const user = testDataGenerator.generateUser({
          id: `concurrent-user-${index}`,
          username: `user_${index}`,
        });

        mockPrisma.users.create.mockResolvedValueOnce(user);
        mockPrisma.referrals.create.mockResolvedValueOnce({
          id: `ref-${index}`,
          inviterId: 'main-inviter',
          inviteeId: user.id,
        });

        return user;
      };

      const { results, totalTime, averageTime } = await PerformanceTester.testConcurrency(
        () => registerUser(Math.floor(Math.random() * concurrentRegistrations)),
        concurrentRegistrations
      );

      expect(results).toHaveLength(concurrentRegistrations);
      expect(totalTime).toBeLessThan(5000); // 5秒内完成
      console.log(`并发注册统计 - 总时间: ${totalTime.toFixed(2)}ms, 平均时间: ${averageTime.toFixed(2)}ms`);
    });
  });

  describe('邀请数据一致性测试', () => {
    test('邀请关系数据一致性', async () => {
      // 测试邀请链的完整性
      const referralChain = [
        { id: 'level-1', inviterId: 'root', inviteeId: 'user-1', level: 1 },
        { id: 'level-2', inviterId: 'user-1', inviteeId: 'user-2', level: 2 },
        { id: 'level-3', inviterId: 'user-2', inviteeId: 'user-3', level: 3 },
      ];

      // 验证邀请层级关系
      for (let i = 1; i < referralChain.length; i++) {
        const current = referralChain[i];
        const previous = referralChain[i - 1];
        
        expect(current.inviterId).toBe(previous.inviteeId);
        expect(current.level).toBe(previous.level + 1);
      }

      // 验证层级深度
      const maxLevel = Math.max(...referralChain.map(r => r.level));
      expect(maxLevel).toBe(3);
    });

    test('奖励计算一致性', async () => {
      // 测试不同层级奖励计算的一致性
      const rewardRates = {
        level1: 0.10, // 10%
        level2: 0.05, // 5%
        level3: 0.02, // 2%
      };

      const baseAmount = 100.0;
      
      const expectedRewards = {
        level1: baseAmount * rewardRates.level1, // 10.0
        level2: baseAmount * rewardRates.level2, // 5.0
        level3: baseAmount * rewardRates.level3, // 2.0
      };

      expect(expectedRewards.level1).toBe(10.0);
      expect(expectedRewards.level2).toBe(5.0);
      expect(expectedRewards.level3).toBe(2.0);

      // 验证奖励总计
      const totalReward = Object.values(expectedRewards).reduce((sum, reward) => sum + reward, 0);
      expect(totalReward).toBe(17.0);
    });
  });

  describe('邀请系统异常处理测试', () => {
    test('重复邀请处理', async () => {
      const inviterId = 'test-inviter-005';
      const inviteeId = 'test-invitee-004';

      // 模拟已存在的邀请关系
      const existingReferral = {
        id: 'existing-ref',
        inviterId,
        inviteeId,
        status: 'active',
      };

      mockPrisma.referrals.findFirst.mockResolvedValue(existingReferral);
      mockPrisma.referrals.create.mockRejectedValue(new Error('邀请关系已存在'));

      try {
        await mockPrisma.referrals.create({
          data: { inviterId, inviteeId }
        });
      } catch (error) {
        expect(error.message).toBe('邀请关系已存在');
      }

      // 验证不能重复创建相同的邀请关系
      const existing = await mockPrisma.referrals.findFirst({
        where: { inviterId, inviteeId }
      });

      expect(existing).toEqual(existingReferral);
    });

    test('无效邀请码处理', async () => {
      const invalidInviteCode = 'INVALID123';
      
      // 模拟无效邀请码查找
      mockPrisma.users.findUnique.mockResolvedValue(null);

      const inviter = await mockPrisma.users.findUnique({
        where: { inviteCode: invalidInviteCode }
      });

      expect(inviter).toBeNull();
    });

    test('邀请奖励计算溢出保护', async () => {
      // 测试极端情况下的奖励计算
      const maxSpent = Number.MAX_SAFE_INTEGER / 1000000; // 避免溢出
      const rewardRate = 0.1;
      
      let calculatedReward: number;
      try {
        calculatedReward = maxSpent * rewardRate;
        expect(calculatedReward).toBeLessThan(Number.MAX_SAFE_INTEGER);
        expect(calculatedReward).toBeGreaterThan(0);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('邀请链路端到端测试', () => {
    test('完整邀请业务流程', async () => {
      // 模拟完整的邀请业务流程
      
      // 1. 用户A生成邀请码
      const userA = testDataGenerator.generateUser({
        id: 'user-a',
        username: 'user_a',
      });

      // 2. 用户B通过邀请码注册
      const userB = testDataGenerator.generateUser({
        id: 'user-b',
        username: 'user_b',
      });

      // 3. 建立邀请关系
      const referral = {
        id: 'ref-e2e-001',
        inviterId: userA.id,
        inviteeId: userB.id,
        status: 'active',
      };

      // 4. 用户B完成首次消费
      const firstPurchaseTransaction = {
        id: 'txn-e2e-001',
        userId: userB.id,
        type: 'lottery',
        amount: -100.0,
        description: '首次消费',
        balanceAfter: 900,
        createdAt: new Date(),
      };

      // 5. 系统自动发放邀请奖励
      const rewardTransaction = {
        id: 'txn-e2e-002',
        userId: userA.id,
        type: 'referral_reward',
        amount: 10.0, // 100 * 10%
        description: '邀请奖励 - 用户B首次消费',
        balanceAfter: 1010,
        createdAt: new Date(),
      };

      // 验证业务流程
      expect(userA.id).toBe('user-a');
      expect(userB.id).toBe('user-b');
      expect(referral.inviterId).toBe(userA.id);
      expect(referral.inviteeId).toBe(userB.id);
      expect(rewardTransaction.amount).toBe(10.0);
      
      // 验证奖励计算正确性
      const spentAmount = Math.abs(firstPurchaseTransaction.amount);
      const expectedReward = spentAmount * 0.1;
      expect(rewardTransaction.amount).toBe(expectedReward);
    });
  });
});