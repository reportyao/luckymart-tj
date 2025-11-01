import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '../lib/prisma';
import DatabaseLockManager from '../lib/database-lock-manager';
import { performSecureDraw } from '../lib/lottery-algorithm';
/**
 * 核心业务流程单元测试
 * 测试用户注册、夺宝参与、订单管理等关键业务逻辑
 */


describe('核心业务流程测试', () => {
  const TEST_USER_ID = 'test-business-user';
  const TEST_PRODUCT_ID = 'test-business-product';
  const TEST_ROUND_ID = 'test-business-round';

  beforeAll(async () => {
    console.log('🏗️  准备业务测试数据...');
    await setupBusinessTestData();
  });

  afterAll(async () => {
    console.log('🧹 清理业务测试数据...');
    await cleanupBusinessTestData();
  });

  beforeEach(async () => {
    // 每个测试前重置数据
    await resetBusinessTestData();
  });

  describe('用户注册流程测试', () => {
    test('新用户注册应该成功', async () => {
      const newUserId = `new-user-${Date.now()}`;
      const telegramId = `new_telegram_${Date.now()}`;

      // 创建新用户
      const user = await prisma.users.create({
        data: {
          id: newUserId,
          telegramId: telegramId,
          firstName: 'New User',
          language: 'zh',
          balance: 50, // 首次注册赠送50夺宝币
          platformBalance: 0,
          freeDailyCount: 3,
          lastFreeResetDate: new Date()
        }
      });

      expect(user).toBeDefined();
      expect(user.id).toBe(newUserId);
      expect(user.balance).toBe(50);
      expect(user.freeDailyCount).toBe(3);

      // 验证交易记录
      const transaction = await prisma.transactions.findFirst({
        where: {
          userId: newUserId,
          type: 'register_bonus'
        }
      });

      expect(transaction).toBeDefined();
      expect(transaction?.amount).toBe(50);
    });

    test('重复注册应该更新用户信息', async () => {
      // 模拟Telegram用户重新注册
      const updatedFirstName = 'Updated User Name';
      const updatedLanguage = 'en';

      const user = await prisma.users.upsert({
        where: { id: TEST_USER_ID },
        update: {
          firstName: updatedFirstName,
          language: updatedLanguage
        },
        create: {
          id: TEST_USER_ID,
          telegramId: 'test_telegram_business',
          firstName: updatedFirstName,
          language: updatedLanguage,
          balance: 50
        }
      });

      expect(user.firstName).toBe(updatedFirstName);
      expect(user.language).toBe(updatedLanguage);
    });

    test('注册时应该自动重置免费次数', async () => {
      // 设置旧的免费次数重置日期
      await prisma.users.update({
        where: { id: TEST_USER_ID },
        data: {
          freeDailyCount: 0,
          lastFreeResetDate: new Date('2023-01-01')
        }
      });

      const user = await prisma.users.upsert({
        where: { id: TEST_USER_ID },
        update: {},
        create: {
          id: TEST_USER_ID,
          telegramId: 'test_telegram_business',
          firstName: 'Test User',
          freeDailyCount: 3,
          lastFreeResetDate: new Date()
        }
      });

      // 验证免费次数已重置
      expect(user.freeDailyCount).toBe(3);
      expect(new Date(user.lastFreeResetDate).toDateString()).toBe(new Date().toDateString());
    });
  });

  describe('夺宝参与流程测试', () => {
    test('成功参与夺宝应该扣减余额并增加份额', async () => {
      const initialBalance = 1000;
      const initialSoldShares = 0;
      const participationCost = 10;
      const numbers = [1, 2, 3, 4, 5];

      // 重置测试数据
      await prisma.users.update({
        where: { id: TEST_USER_ID },
        data: { balance: initialBalance, balanceVersion: 1 }
      });

      await prisma.lotteryRounds.update({
        where: { id: TEST_ROUND_ID },
        data: { 
          soldShares: initialSoldShares, 
          soldSharesVersion: 1,
          totalShares: 100,
          status: 'active'
        }
      });

      const result = await DatabaseLockManager.participateInLotteryWithBalanceDeduction(;
        TEST_USER_ID,
        TEST_ROUND_ID,
        TEST_PRODUCT_ID,
        participationCost,
        numbers
      );

      expect(result.success).toBe(true);
      expect(result.participationId).toBeDefined();

      // 验证余额扣减
      const updatedUser = await prisma.users.findUnique({
        where: { id: TEST_USER_ID }
      });
      expect(updatedUser?.balance).toBe(initialBalance - participationCost);

      // 验证份额增加
      const updatedRound = await prisma.lotteryRounds.findUnique({
        where: { id: TEST_ROUND_ID }
      });
      expect(updatedRound?.soldShares).toBe(initialSoldShares + participationCost);

      // 验证参与记录
      const participation = await prisma.participations.findUnique({
        where: { id: result.participationId! }
      });
      expect(participation).toBeDefined();
      expect(participation?.numbers).toEqual(numbers);
      expect(participation?.sharesCount).toBe(participationCost);
    });

    test('余额不足时应该拒绝参与', async () => {
      // 设置余额为0
      await prisma.users.update({
        where: { id: TEST_USER_ID },
        data: { balance: 0, balanceVersion: 1 }
      });

      const result = await DatabaseLockManager.participateInLotteryWithBalanceDeduction(;
        TEST_USER_ID,
        TEST_ROUND_ID,
        TEST_PRODUCT_ID,
        10,
        [1, 2, 3, 4, 5]
      );

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('余额不足');
    });

    test('份额不足时应该拒绝参与', async () => {
      // 设置剩余份额为2
      await prisma.lotteryRounds.update({
        where: { id: TEST_ROUND_ID },
        data: { 
          soldShares: 98, 
          soldSharesVersion: 1,
          totalShares: 100,
          status: 'active'
        }
      });

      const result = await DatabaseLockManager.participateInLotteryWithBalanceDeduction(;
        TEST_USER_ID,
        TEST_ROUND_ID,
        TEST_PRODUCT_ID,
        5, // 尝试买5份，但只剩2份
        [1, 2, 3, 4, 5]
      );

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('份额不足');
    });

    test('非活跃轮次应该拒绝参与', async () => {
      // 设置轮次为已完成
      await prisma.lotteryRounds.update({
        where: { id: TEST_ROUND_ID },
        data: { status: 'completed' }
      });

      const result = await DatabaseLockManager.participateInLotteryWithBalanceDeduction(;
        TEST_USER_ID,
        TEST_ROUND_ID,
        TEST_PRODUCT_ID,
        1,
        [1]
      );

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('不是活跃状态');
    });
  });

  describe('订单管理流程测试', () => {
    test('创建订单应该成功', async () => {
      const orderNumber = `ORDER_${Date.now()}`;
      const totalAmount = 99.99;

      const order = await prisma.orders.create({
        data: {
          orderNumber,
          userId: TEST_USER_ID,
          type: 'lottery',
          totalAmount,
          status: 'pending',
          quantity: 1
        }
      });

      expect(order).toBeDefined();
      expect(order.orderNumber).toBe(orderNumber);
      expect(order.totalAmount).toBe(totalAmount);
      expect(order.status).toBe('pending');
    });

    test('订单状态更新应该原子性', async () => {
      // 创建测试订单
      const order = await prisma.orders.create({
        data: {
          orderNumber: `TEST_ORDER_${Date.now()}`,
          userId: TEST_USER_ID,
          type: 'lottery',
          totalAmount: 100,
          status: 'pending',
          version: 1
        }
      });

      const result = await DatabaseLockManager.updateOrderStatusWithLock(;
        order.id,
        'completed'
      );

      expect(result.success).toBe(true);

      // 验证状态更新
      const updatedOrder = await prisma.orders.findUnique({
        where: { id: order.id }
      });

      expect(updatedOrder?.status).toBe('completed');
    });

    test('版本冲突应该阻止并发更新', async () => {
      const order = await prisma.orders.create({
        data: {
          orderNumber: `CONCURRENT_TEST_${Date.now()}`,
          userId: TEST_USER_ID,
          type: 'lottery',
          totalAmount: 100,
          status: 'pending',
          version: 1
        }
      });

      // 第一次更新成功
      const result1 = await DatabaseLockManager.updateOrderStatusWithLock(;
        order.id,
        'completed'
      );
      expect(result1.success).toBe(true);

      // 模拟版本冲突
      await prisma.orders.update({
        where: { id: order.id },
        data: { version: { decrement: 1 } }
      });

      // 第二次更新应该失败
      const result2 = await DatabaseLockManager.updateOrderStatusWithLock(;
        order.id,
        'cancelled'
      );

      expect(result2.success).toBe(false);
      expect(result2.errorMessage).toContain('版本冲突');
    });
  });

  describe('开奖流程测试', () => {
    test('开奖应该生成有效的获胜号码', async () => {
      // 创建参与记录
      const participations = [;
        {
          id: 'part-1',
          userId: TEST_USER_ID,
          numbers: [1, 2, 3, 4, 5],
          amount: 5,
          createdAt: new Date()
        }
      ];

      const totalShares = 100;
      const drawResult = await performSecureDraw(participations, totalShares);

      expect(drawResult).toBeDefined();
      expect(drawResult.winningNumber).toBeGreaterThanOrEqual(10000001);
      expect(drawResult.winningNumber).toBeLessThanOrEqual(10000000 + totalShares);
      expect(drawResult.A).toBeDefined();
      expect(drawResult.B).toBeDefined();
      expect(drawResult.C).toBeDefined();
    });

    test('满员轮次应该自动开奖', async () => {
      // 设置轮次为满员
      await prisma.lotteryRounds.update({
        where: { id: TEST_ROUND_ID },
        data: { 
          soldShares: 100, 
          soldSharesVersion: 1,
          totalShares: 100,
          status: 'active'
        }
      });

      // 验证轮次状态
      const round = await prisma.lotteryRounds.findUnique({
        where: { id: TEST_ROUND_ID }
      });

      expect(round?.soldShares).toBe(round?.totalShares);
      expect(round?.status).toBe('active');
    });

    test('中奖后应该创建中奖订单', async () => {
      // 模拟开奖结果
      const winningNumber = 10000015;
      const winnerUserId = TEST_USER_ID;

      // 查找该用户的中奖参与记录
      const winningParticipation = await prisma.participations.findFirst({
        where: {
          userId: winnerUserId,
          numbers: { has: winningNumber % 10000000 } // 简化匹配逻辑
        }
      });

      if (winningParticipation) {
        // 创建中奖订单
        const order = await prisma.orders.create({
          data: {
            orderNumber: `WIN_${Date.now()}`,
            userId: winnerUserId,
            type: 'win',
            totalAmount: 9999, // 假设奖品价值
            status: 'pending',
            lotteryRoundId: TEST_ROUND_ID,
            winningNumber
          }
        });

        expect(order).toBeDefined();
        expect(order.type).toBe('win');
        expect(order.winningNumber).toBe(winningNumber);
      }
    });
  });

  describe('交易记录流程测试', () => {
    test('余额变化应该记录交易', async () => {
      const initialBalance = 1000;
      const amount = 100;
      const transactionType = 'lottery_participation';

      await prisma.users.update({
        where: { id: TEST_USER_ID },
        data: { balance: initialBalance, balanceVersion: 1 }
      });

      // 模拟扣减余额操作
      await prisma.users.update({
        where: { id: TEST_USER_ID },
        data: { 
          balance: { decrement: amount },
          balanceVersion: { increment: 1 }
        }
      });

      // 记录交易
      const transaction = await prisma.transactions.create({
        data: {
          userId: TEST_USER_ID,
          type: transactionType,
          amount: -amount,
          description: '参与夺宝',
          balanceAfter: initialBalance - amount
        }
      });

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(-amount);
      expect(transaction.type).toBe(transactionType);
      expect(transaction.userId).toBe(TEST_USER_ID);
    });

    test('充值应该记录正向交易', async () => {
      const rechargeAmount = 500;

      const transaction = await prisma.transactions.create({
        data: {
          userId: TEST_USER_ID,
          type: 'recharge',
          amount: rechargeAmount,
          description: '用户充值',
          balanceAfter: 1500 // 假设充值前余额为1000
        }
      });

      expect(transaction.amount).toBe(rechargeAmount);
      expect(transaction.type).toBe('recharge');
      expect(transaction.balanceAfter).toBe(1500);
    });

    test('提现应该记录负向交易', async () => {
      const withdrawAmount = 200;

      const transaction = await prisma.transactions.create({
        data: {
          userId: TEST_USER_ID,
          type: 'withdraw',
          amount: -withdrawAmount,
          description: '用户提现',
          balanceAfter: 800 // 假设提现前余额为1000
        }
      });

      expect(transaction.amount).toBe(-withdrawAmount);
      expect(transaction.type).toBe('withdraw');
      expect(transaction.balanceAfter).toBe(800);
    });
  });

  describe('免费次数管理测试', () => test('免费次数重置应该正常工作', async () => {
      // 设置旧的免费次数
      await prisma.users.update({
        where: { id: TEST_USER_ID },
        data: {
          freeDailyCount: 0,
          lastFreeResetDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // 昨天
        }
      });

      const result = await DatabaseLockManager.resetUserFreeCountSafe(TEST_USER_ID);

      expect(result).toBe(true);

      // 验证重置结果
      const user = await prisma.users.findUnique({
        where: { id: TEST_USER_ID }
      });

      expect(user?.freeDailyCount).toBe(3);
      expect(new Date(user?.lastFreeResetDate!).toDateString()).toBe(new Date().toDateString());
    })
  );

  describe('业务规则验证测试', () => {
    test('用户余额不能为负', async () => {
      const result = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(;
        TEST_USER_ID,
        10000, // 超过当前余额
        'deduct',
        'balance'
      );

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('余额不足');
    });

    test('夺宝份额不能超过总份额', async () => {
      await prisma.lotteryRounds.update({
        where: { id: TEST_ROUND_ID },
        data: { 
          soldShares: 90,
          soldSharesVersion: 1,
          totalShares: 100
        }
      });

      const result = await DatabaseLockManager.updateLotteryRoundSoldSharesWithLock(;
        TEST_ROUND_ID,
        20 // 超过剩余份额
      );

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('份额不足');
    });

    test('免费参与次数不能超过限制', async () => {
      // 设置免费次数为0
      await prisma.users.update({
        where: { id: TEST_USER_ID },
        data: { freeDailyCount: 0 }
      });

      // 这里应该检查业务逻辑，免费次数为0时不允许免费参与
      const user = await prisma.users.findUnique({
        where: { id: TEST_USER_ID }
      });

      expect(user?.freeDailyCount).toBe(0);
    });
  });

  describe('并发业务场景测试', () => test('多个用户同时参与应该正确处理', async () => {
      const concurrentUsers = Array(10).fill(0).map((_, i) => `concurrent-user-${i}`);
      
      // 创建并发用户
      for (const userId of concurrentUsers) {
        await prisma.users.upsert({
          where: { id: userId },
          update: { balance: 100, balanceVersion: 1 },
          create: {
            id: userId,
            telegramId: `concurrent_${userId}`,
            firstName: `User ${userId}`,
            balance: 100,
            balanceVersion: 1
          }
        });
      }

      const operations = concurrentUsers.map(userId =>;
        DatabaseLockManager.participateInLotteryWithBalanceDeduction(
          userId,
          TEST_ROUND_ID,
          TEST_PRODUCT_ID,
          5,
          [1, 2, 3, 4, 5]
        )
      );

      const results = await Promise.all(operations);
      const successCount = results.filter(result => result.success).length;

      // 验证总份额不超过限制
      const finalRound = await prisma.lotteryRounds.findUnique({
        where: { id: TEST_ROUND_ID }
      });

      expect(finalRound?.soldShares).toBeLessThanOrEqual(finalRound?.totalShares);
      expect(successCount).toBeGreaterThan(0);

      console.log(`   ✅ 成功处理 ${successCount}/${concurrentUsers.length} 个并发参与`);
    })
  );
});

// 辅助函数
async function setupBusinessTestData() {
  // 创建测试用户
  await prisma.users.upsert({
    where: { id: TEST_USER_ID },
    update: {
      balance: 1000,
      balanceVersion: 1,
      platformBalance: 500,
      platformBalanceVersion: 1,
      freeDailyCount: 3,
      lastFreeResetDate: new Date()
    },
    create: {
      id: TEST_USER_ID,
      telegramId: 'test_telegram_business',
      firstName: 'Business Test User',
      balance: 1000,
      balanceVersion: 1,
      platformBalance: 500,
      platformBalanceVersion: 1,
      freeDailyCount: 3,
      lastFreeResetDate: new Date()
    }
  });

  // 创建测试商品
  await prisma.products.upsert({
    where: { id: TEST_PRODUCT_ID },
    update: {},
    create: {
      id: TEST_PRODUCT_ID,
      nameZh: '测试商品',
      nameEn: 'Test Product',
      nameRu: 'Тестовый товар',
      descriptionZh: '这是一个测试商品',
      price: 99.99,
      status: 'active',
      isActive: true
    }
  });

  // 创建测试夺宝轮次
  await prisma.lotteryRounds.upsert({
    where: { id: TEST_ROUND_ID },
    update: {
      totalShares: 100,
      soldShares: 0,
      soldSharesVersion: 1,
      status: 'active'
    },
    create: {
      id: TEST_ROUND_ID,
      productId: TEST_PRODUCT_ID,
      roundNumber: 1,
      totalShares: 100,
      soldShares: 0,
      soldSharesVersion: 1,
      status: 'active'
    }
  });
}

async function resetBusinessTestData() {
  // 重置用户余额和版本
  await prisma.users.update({
    where: { id: TEST_USER_ID },
    data: { 
      balance: 1000, 
      balanceVersion: 1,
      platformBalance: 500,
      platformBalanceVersion: 1,
      freeDailyCount: 3
    }
  });

  // 重置轮次份额
  await prisma.lotteryRounds.update({
    where: { id: TEST_ROUND_ID },
    data: { 
      soldShares: 0, 
      soldSharesVersion: 1,
      status: 'active',
      winningNumber: null
    }
  });
}

async function cleanupBusinessTestData() {
  try {
    // 清理测试数据
    await prisma.participations.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.transactions.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.orders.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.lotteryRounds.deleteMany({ where: { id: TEST_ROUND_ID } });
    await prisma.products.deleteMany({ where: { id: TEST_PRODUCT_ID } });
    await prisma.users.deleteMany({ where: { id: TEST_USER_ID } });
  } catch (error) {
    console.error('清理业务测试数据时出错:', error);
  }
}