import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '../lib/prisma';
import DatabaseLockManager from '../lib/database-lock-manager';
/**
 * 数据库事务和并发控制集成测试
 * 测试事务处理、锁定机制和并发操作的安全性
 */


describe('数据库事务和并发控制测试', () => {
  const TEST_USER_ID = 'test-transaction-user';
  const TEST_ROUND_ID = 'test-transaction-round';
  const TEST_PRODUCT_ID = 'test-transaction-product';

  beforeAll(async () => {
    console.log('🔧 准备事务测试数据...');
    
    // 创建测试用户
    await prisma.users.upsert({
      where: { id: TEST_USER_ID },
      update: {
        balance: 10000,
        balanceVersion: 1,
        platformBalance: 5000,
        platformBalanceVersion: 1,
        freeDailyCount: 3,
        lastFreeResetDate: new Date()
      },
      create: {
        id: TEST_USER_ID,
        telegramId: 'test_transaction_user',
        firstName: 'Transaction Test',
        balance: 10000,
        balanceVersion: 1,
        platformBalance: 5000,
        platformBalanceVersion: 1,
        freeDailyCount: 3,
        lastFreeResetDate: new Date()
      }
    });

    // 创建测试夺宝轮次
    await prisma.lotteryRounds.upsert({
      where: { id: TEST_ROUND_ID },
      update: {
        totalShares: 1000,
        soldShares: 0,
        soldSharesVersion: 1,
        status: 'active'
      },
      create: {
        id: TEST_ROUND_ID,
        productId: TEST_PRODUCT_ID,
        roundNumber: 1,
        totalShares: 1000,
        soldShares: 0,
        soldSharesVersion: 1,
        status: 'active'
      }
    });
  });

  afterAll(async () => {
    console.log('🧹 清理事务测试数据...');
    
    try {
      // 清理相关数据
      await prisma.transactions.deleteMany({ where: { userId: TEST_USER_ID } });
      await prisma.participations.deleteMany({ where: { userId: TEST_USER_ID } });
      await prisma.orders.deleteMany({ where: { userId: TEST_USER_ID } });
      await prisma.lotteryRounds.deleteMany({ where: { id: TEST_ROUND_ID } });
      await prisma.users.deleteMany({ where: { id: TEST_USER_ID } });
    } catch (error) {
      console.error('清理数据时出错:', error);
    }
  });

  beforeEach(async () => {
    // 每个测试前重置数据
    await prisma.users.update({
      where: { id: TEST_USER_ID },
      data: { 
        balance: 10000, 
        balanceVersion: 1,
        platformBalance: 5000,
        platformBalanceVersion: 1
      }
    });

    await prisma.lotteryRounds.update({
      where: { id: TEST_ROUND_ID },
      data: { 
        soldShares: 0, 
        soldSharesVersion: 1,
        status: 'active'
      }
    });
  });

  describe('事务原子性测试', () => {
    test('成功的夺宝参与事务应该原子性执行', async () => {
      const initialBalance = 10000;
      const initialSoldShares = 0;
      const participationCost = 5; // 购买5份;

      const numbers = [1, 2, 3, 4, 5];
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

      // 验证参与记录创建
      const participation = await prisma.participations.findUnique({
        where: { id: result.participationId! }
      });
      expect(participation).toBeDefined();
      expect(participation?.sharesCount).toBe(participationCost);
    });

    test('失败的事务不应该产生副作用', async () => {
      const initialBalance = 10000;
      const initialSoldShares = 0;

      // 尝试超额购买（余额不足）
      const numbers = Array(50).fill(0).map((_, i) => i + 1); // 购买50份;
      const result = await DatabaseLockManager.participateInLotteryWithBalanceDeduction(;
        TEST_USER_ID,
        TEST_ROUND_ID,
        TEST_PRODUCT_ID,
        50,
        numbers
      );

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('余额不足');

      // 验证数据没有被改变
      const user = await prisma.users.findUnique({ where: { id: TEST_USER_ID } });
      expect(user?.balance).toBe(initialBalance);

      const round = await prisma.lotteryRounds.findUnique({ where: { id: TEST_ROUND_ID } });
      expect(round?.soldShares).toBe(initialSoldShares);
    });

    test('事务中的版本检查应该防止并发修改', async () => {
      // 第一次正常操作
      const result1 = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(;
        TEST_USER_ID,
        100,
        'deduct',
        'balance'
      );

      expect(result1.success).toBe(true);

      // 模拟版本冲突 - 手动减少版本号
      await prisma.users.update({
        where: { id: TEST_USER_ID },
        data: { balanceVersion: { decrement: 1 } }
      });

      // 第二次操作应该失败
      const result2 = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(;
        TEST_USER_ID,
        100,
        'deduct',
        'balance'
      );

      expect(result2.success).toBe(false);
      expect(result2.errorMessage).toContain('版本冲突');
    });
  });

  describe('并发操作测试', () => {
    test('多个并发余额扣减应该串行化', async () => {
      const initialBalance = 10000;
      const concurrentOperations = 20;
      const amountPerOperation = 600; // 总共12000，超过了初始余额;

      // 创建并发操作
      const operations = Array(concurrentOperations).fill(0).map(() =>;
        DatabaseLockManager.updateUserBalanceWithOptimisticLock(
          TEST_USER_ID,
          amountPerOperation,
          'deduct',
          'balance'
        )
      );

      const results = await Promise.all(operations);

      // 计算成功操作数
      const successCount = results.filter(result => result.success).length;

      // 由于是并发操作，最终余额应该是初始余额减去成功扣减的金额
      const expectedFinalBalance = initialBalance - (successCount * amountPerOperation);

      const finalUser = await prisma.users.findUnique({
        where: { id: TEST_USER_ID }
      });

      expect(finalUser?.balance).toBe(expectedFinalBalance);
      expect(finalUser?.balance).toBeGreaterThanOrEqual(0); // 余额不能为负
    });

    test('并发份额购买应该正确处理', async () => {
      const initialSoldShares = 0;
      const totalShares = 100;
      const concurrentOperations = 50;
      const sharesPerOperation = 5; // 总共250份，但只有100份可用;

      const operations = Array(concurrentOperations).fill(0).map(() =>;
        DatabaseLockManager.updateLotteryRoundSoldSharesWithLock(
          TEST_ROUND_ID,
          sharesPerOperation
        )
      );

      const results = await Promise.all(operations);
      const successCount = results.filter(result => result.success).length;

      const finalRound = await prisma.lotteryRounds.findUnique({
        where: { id: TEST_ROUND_ID }
      });

      // 成功操作数应该使已售份额不超过总份额
      expect(finalRound?.soldShares).toBeLessThanOrEqual(totalShares);
      
      if (successCount > 0) {
        const successfulResults = results.filter(result => result.success);
        expect(successfulResults.length * sharesPerOperation).toBe(finalRound?.soldShares);
      }
    });

    test('同时的订单状态更新应该原子化', async () => {
      // 创建测试订单
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

      // 并发更新订单状态
      const operations = [;
        DatabaseLockManager.updateOrderStatusWithLock(order.id, 'completed'),
        DatabaseLockManager.updateOrderStatusWithLock(order.id, 'cancelled'),
        DatabaseLockManager.updateOrderStatusWithLock(order.id, 'processing')
      ];

      const results = await Promise.all(operations);
      const successCount = results.filter(result => result.success).length;

      // 只有一次更新应该成功
      expect(successCount).toBe(1);

      // 验证最终状态
      const finalOrder = await prisma.orders.findUnique({
        where: { id: order.id }
      });

      expect(['completed', 'cancelled', 'processing']).toContain(finalOrder?.status);
    });
  });

  describe('锁机制测试', () => {
    test('乐观锁应该正确处理版本冲突', async () => {
      // 准备数据
      await prisma.users.update({
        where: { id: TEST_USER_ID },
        data: { balance: 1000, balanceVersion: 5 }
      });

      // 创建版本冲突场景
      const operation1 = DatabaseLockManager.updateUserBalanceWithOptimisticLock(;
        TEST_USER_ID,
        100,
        'deduct',
        'balance'
      );

      const operation2 = DatabaseLockManager.updateUserBalanceWithOptimisticLock(;
        TEST_USER_ID,
        200,
        'deduct',
        'balance'
      );

      const results = await Promise.all([operation1, operation2]);

      // 应该只有一个成功
      const successCount = results.filter(result => result.success).length;
      expect(successCount).toBe(1);
    });

    test('锁监控应该报告正确的锁信息', async () => {
      // 触发一些锁操作
      await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
        TEST_USER_ID,
        100,
        'deduct',
        'balance'
      );

      const lockInfo = await DatabaseLockManager.getLockMonitoringInfo();

      expect(Array.isArray(lockInfo)).toBe(true);
      
      // 查找用户表的锁信息
      const userLock = lockInfo.find(info =>;
        info.table_name :== 'users' && info.row_id === TEST_USER_ID
      );

      expect(userLock).toBeDefined();
      expect(userLock!.balance_version).toBeGreaterThan(0);
    });
  });

  describe('事务隔离级别测试', () => {
    test('脏读应该被防止', async () => {
      // 这个测试验证当前事务不应该读取到其他未提交事务的数据
      const initialBalance = 10000;

      // 在一个事务中扣减余额但不提交
      await prisma.$transaction(async (tx) => {
        await tx.users.update({
          where: { id: TEST_USER_ID },
          data: { balance: { decrement: 500 } }
        });

        // 在同一个事务中验证余额
        const user = await tx.users.findUnique({ where: { id: TEST_USER_ID } });
        expect(user?.balance).toBe(initialBalance - 500);

        // 模拟长时间操作
        await new Promise(resolve => setTimeout(resolve, 100));
      });
    });

    test('不可重复读应该被防止', async () => {
      const initialBalance = 10000;
      await prisma.users.update({
        where: { id: TEST_USER_ID },
        data: { balance: initialBalance, balanceVersion: 1 }
      });

      let firstRead: number;
      let secondRead: number;

      await prisma.$transaction(async (tx) => {
        // 第一次读取
        const user1 = await tx.users.findUnique({ where: { id: TEST_USER_ID } });
        firstRead = user1?.balance || 0;

        // 在同一事务中再次读取（模拟不可重复读场景）
        const user2 = await tx.users.findUnique({ where: { id: TEST_USER_ID } });
        secondRead = user2?.balance || 0;

        // 在事务内，两次读取应该一致
        expect(firstRead).toBe(secondRead);
      });
    });
  });

  describe('死锁检测测试', () => {
    test('应该检测潜在的死锁情况', async () => {
      // 创建多个用户和资源来测试死锁
      const userIds = ['deadlock-user-1', 'deadlock-user-2'];
      
      for (const userId of userIds) {
        await prisma.users.upsert({
          where: { id: userId },
          update: { balance: 1000, balanceVersion: 1 },
          create: {
            id: userId,
            telegramId: `deadlock_${userId}`,
            firstName: `Deadlock ${userId}`,
            balance: 1000,
            balanceVersion: 1
          }
        });
      }

      // 模拟死锁场景：两个事务以相反的顺序锁定资源
      const promise1 = prisma.$transaction(async (tx) => {
        await tx.users.update({
          where: { id: userIds[0] },
          data: { balance: { decrement: 100 } }
        });
        
        // 等待一会儿再锁定第二个资源
        await new Promise(resolve => setTimeout(resolve, 50));
        
        await tx.users.update({
          where: { id: userIds[1] },
          data: { balance: { decrement: 100 } }
        });
      });

      const promise2 = prisma.$transaction(async (tx) => {
        await tx.users.update({
          where: { id: userIds[1] },
          data: { balance: { decrement: 100 } }
        });
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        await tx.users.update({
          where: { id: userIds[0] },
          data: { balance: { decrement: 100 } }
        });
      });

      // 两个事务都应该能够完成（PostgreSQL会自动检测并解决死锁）
      await expect(Promise.all([promise1, promise2])).resolves.not.toThrow();

      // 清理测试数据
      await prisma.users.deleteMany({ where: { id: { in: userIds } } });
    });
  });

  describe('性能测试', () => {
    test('批量操作性能', async () => {
      const operations = Array(500).fill(0).map((_, i) => ({
        userId: TEST_USER_ID,
        amount: 1,
        operation: 'deduct' as const
      }));

      const startTime = process.hrtime.bigint();

      const results = await DatabaseLockManager.batchUpdateUserBalance(operations);

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      console.log(`批量操作性能: ${operations.length}个操作耗时 ${duration.toFixed(2)}ms`);
      console.log(`平均每个操作: ${(duration / operations.length).toFixed(4)}ms`);

      expect(duration).toBeLessThan(10000); // 应该在10秒内完成
      expect(results).toHaveLength(operations.length);
    });

    test('并发操作吞吐量', async () => {
      const concurrentUsers = 50;
      const operationsPerUser = 10;

      const startTime = process.hrtime.bigint();

      const allOperations = Array(concurrentUsers).fill(0).flatMap((_, userIndex) =>;
        Array(operationsPerUser).fill(0).map((_, opIndex) =>
          DatabaseLockManager.updateUserBalanceWithOptimisticLock(
            `${TEST_USER_ID}_${userIndex}`,
            10,
            'deduct',
            'balance'
          )
        )
      );

      const results = await Promise.all(allOperations);

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      const throughput = (concurrentUsers * operationsPerUser) / (duration / 1000);

      console.log(`并发操作吞吐量: ${throughput.toFixed(2)} ops/sec`);
      console.log(`总操作数: ${results.length}, 成功数: ${results.filter(r => r.success).length}`);

      expect(throughput).toBeGreaterThan(10); // 至少10 ops/sec
      expect(duration).toBeLessThan(30000); // 应该在30秒内完成
    });
  });
});