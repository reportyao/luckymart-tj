/**
 * 数据库锁机制测试文件
 * 用于验证乐观锁/悲观锁功能的正确性
 * 创建时间: 2025-10-31
 */

import DatabaseLockManager from '@/lib/database-lock-manager';
import { prisma } from '@/lib/prisma';

// 测试配置
const TEST_USER_ID = 'test-user-12345';
const TEST_ROUND_ID = 'test-round-12345';
const TEST_PRODUCT_ID = 'test-product-12345';

describe('数据库锁机制测试', () => {
  
  beforeAll(async () => {
    // 准备测试数据
    console.log('准备测试数据...');
    
    // 创建测试用户
    await prisma.users.upsert({
      where: { id: TEST_USER_ID },
      update: {
        balance: 1000,
        balanceVersion: 1,
        platformBalance: 500,
        platformBalanceVersion: 1
      },
      create: {
        id: TEST_USER_ID,
        telegramId: 'test_telegram_12345',
        firstName: 'Test',
        balance: 1000,
        balanceVersion: 1,
        platformBalance: 500,
        platformBalanceVersion: 1
      }
    });
    
    // 创建测试夺宝期次
    await prisma.lotteryRounds.upsert({
      where: { id: TEST_ROUND_ID },
      update: {
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
    
    console.log('测试数据准备完成');
  });
  
  afterAll(async () => {
    // 清理测试数据
    console.log('清理测试数据...');
    
    try {
      await prisma.transactions.deleteMany({
        where: { userId: TEST_USER_ID }
      });
      
      await prisma.participations.deleteMany({
        where: { userId: TEST_USER_ID }
      });
      
      await prisma.lotteryRounds.deleteMany({
        where: { id: TEST_ROUND_ID }
      });
      
      await prisma.users.deleteMany({
        where: { id: TEST_USER_ID }
      });
      
      console.log('测试数据清理完成');
    } catch (error) {
      console.error('清理测试数据时发生错误:', error);
    }
  });
  
  describe('乐观锁测试', () => {
    
    test('应该能够成功扣减用户余额', async () => {
      const result = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
        TEST_USER_ID,
        100,
        'deduct',
        'balance'
      );
      
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(900);
      expect(result.errorMessage).toBeUndefined();
    });
    
    test('应该能够成功增加用户余额', async () => {
      const result = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
        TEST_USER_ID,
        50,
        'add',
        'balance'
      );
      
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(950);
      expect(result.errorMessage).toBeUndefined();
    });
    
    test('应该在余额不足时拒绝扣减', async () => {
      const result = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
        TEST_USER_ID,
        2000, // 超过当前余额
        'deduct',
        'balance'
      );
      
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('余额不足');
    });
    
    test('应该能够处理版本冲突', async () => {
      // 第一次扣减
      const result1 = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
        TEST_USER_ID,
        100,
        'deduct',
        'balance'
      );
      
      expect(result1.success).toBe(true);
      
      // 模拟版本冲突 - 手动更新版本号
      await prisma.users.update({
        where: { id: TEST_USER_ID },
        data: { balanceVersion: { decrement: 1 } } // 减少版本号模拟冲突
      });
      
      // 第二次扣减应该失败
      const result2 = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
        TEST_USER_ID,
        100,
        'deduct',
        'balance'
      );
      
      expect(result2.success).toBe(false);
      expect(result2.errorMessage).toContain('版本冲突');
    });
    
    test('应该能够处理平台余额操作', async () => {
      const result = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
        TEST_USER_ID,
        50,
        'add',
        'platform_balance'
      );
      
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(550); // 500 + 50
    });
  });
  
  describe('份额更新测试', () => {
    
    test('应该能够成功增加已售份额', async () => {
      const result = await DatabaseLockManager.updateLotteryRoundSoldSharesWithLock(
        TEST_ROUND_ID,
        10
      );
      
      expect(result.success).toBe(true);
      expect(result.newSoldShares).toBe(10);
      expect(result.remainingShares).toBe(90);
    });
    
    test('应该拒绝超额购买', async () => {
      const result = await DatabaseLockManager.updateLotteryRoundSoldSharesWithLock(
        TEST_ROUND_ID,
        200 // 超过总份额
      );
      
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('份额不足');
    });
    
    test('应该拒绝非活跃期次的购买', async () => {
      // 先将期次设为非活跃
      await prisma.lotteryRounds.update({
        where: { id: TEST_ROUND_ID },
        data: { status: 'completed' }
      });
      
      const result = await DatabaseLockManager.updateLotteryRoundSoldSharesWithLock(
        TEST_ROUND_ID,
        5
      );
      
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('不是活跃状态');
      
      // 恢复状态
      await prisma.lotteryRounds.update({
        where: { id: TEST_ROUND_ID },
        data: { status: 'active' }
      });
    });
  });
  
  describe('夺宝参与测试', () => {
    
    test('应该能够成功参与夺宝', async () => {
      const numbers = [1, 2, 3, 4, 5];
      
      const result = await DatabaseLockManager.participateInLotteryWithBalanceDeduction(
        TEST_USER_ID,
        TEST_ROUND_ID,
        TEST_PRODUCT_ID,
        3,
        numbers
      );
      
      expect(result.success).toBe(true);
      expect(result.participationId).toBeDefined();
      
      // 验证参与记录是否创建
      const participation = await prisma.participations.findFirst({
        where: {
          id: result.participationId,
          userId: TEST_USER_ID,
          roundId: TEST_ROUND_ID
        }
      });
      
      expect(participation).toBeDefined();
      expect(participation!.sharesCount).toBe(3);
      expect(participation!.numbers).toEqual(numbers);
    });
    
    test('应该在余额不足时拒绝参与', async () => {
      // 先将用户余额设为0
      await prisma.users.update({
        where: { id: TEST_USER_ID },
        data: { balance: 0, balanceVersion: 1 }
      });
      
      const numbers = [6, 7, 8, 9, 10];
      
      const result = await DatabaseLockManager.participateInLotteryWithBalanceDeduction(
        TEST_USER_ID,
        TEST_ROUND_ID,
        TEST_PRODUCT_ID,
        5,
        numbers
      );
      
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('余额不足');
    });
    
    test('应该在份额不足时拒绝参与', async () => {
      // 先恢复余额
      await prisma.users.update({
        where: { id: TEST_USER_ID },
        data: { balance: 1000, balanceVersion: 1 }
      });
      
      // 将夺宝期次设为接近售完
      await prisma.lotteryRounds.update({
        where: { id: TEST_ROUND_ID },
        data: { 
          soldShares: 95, // 只剩5个份额
          soldSharesVersion: 1
        }
      });
      
      const numbers = [11, 12, 13, 14, 15];
      
      const result = await DatabaseLockManager.participateInLotteryWithBalanceDeduction(
        TEST_USER_ID,
        TEST_ROUND_ID,
        TEST_PRODUCT_ID,
        10, // 要买10个份额，但只剩5个
        numbers
      );
      
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('份额不足');
    });
  });
  
  describe('订单状态更新测试', () => {
    
    let testOrderId: string;
    
    beforeAll(async () => {
      // 创建测试订单
      const order = await prisma.orders.create({
        data: {
          orderNumber: 'TEST_ORDER_12345',
          userId: TEST_USER_ID,
          type: 'lottery',
          totalAmount: 100,
          status: 'pending',
          version: 1
        }
      });
      
      testOrderId = order.id;
    });
    
    test('应该能够成功更新订单状态', async () => {
      const result = await DatabaseLockManager.updateOrderStatusWithLock(
        testOrderId,
        'completed'
      );
      
      expect(result.success).toBe(true);
      
      // 验证状态是否更新
      const order = await prisma.orders.findUnique({
        where: { id: testOrderId }
      });
      
      expect(order!.status).toBe('completed');
    });
    
    test('应该能够处理版本冲突', async () => {
      // 手动减少版本号模拟冲突
      await prisma.orders.update({
        where: { id: testOrderId },
        data: { version: { decrement: 1 } }
      });
      
      const result = await DatabaseLockManager.updateOrderStatusWithLock(
        testOrderId,
        'cancelled'
      );
      
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('版本冲突');
    });
  });
  
  describe('重置免费次数测试', () => {
    
    test('应该能够重置每日免费次数', async () => {
      // 先设置一个旧的日期
      await prisma.users.update({
        where: { id: TEST_USER_ID },
        data: {
          freeDailyCount: 0,
          lastFreeResetDate: new Date('2023-01-01')
        }
      });
      
      const result = await DatabaseLockManager.resetUserFreeCountSafe(TEST_USER_ID);
      
      expect(result).toBe(true);
      
      // 验证是否重置
      const user = await prisma.users.findUnique({
        where: { id: TEST_USER_ID }
      });
      
      expect(user!.freeDailyCount).toBe(3);
      expect(new Date(user!.lastFreeResetDate).toDateString()).toBe(new Date().toDateString());
    });
    
    test('应该在同一天拒绝重复重置', async () => {
      const result = await DatabaseLockManager.resetUserFreeCountSafe(TEST_USER_ID);
      
      expect(result).toBe(false); // 应该是 false，因为今天已经重置过了
    });
  });
  
  describe('批量操作测试', () => {
    
    test('应该能够批量操作用户余额', async () => {
      const operations = [
        { userId: TEST_USER_ID, amount: 100, operation: 'deduct' as const },
        { userId: TEST_USER_ID, amount: 50, operation: 'add' as const },
        { userId: TEST_USER_ID, amount: 200, operation: 'deduct' as const }
      ];
      
      const results = await DatabaseLockManager.batchUpdateUserBalance(operations);
      
      expect(results).toHaveLength(3);
      
      // 第一个操作应该成功
      expect(results[0].result.success).toBe(true);
      expect(results[0].result.newBalance).toBeGreaterThan(0);
      
      // 所有操作都应该有结果
      results.forEach(result => {
        expect(result.userId).toBe(TEST_USER_ID);
        expect(result.result).toBeDefined();
      });
    });
  });
  
  describe('预检查测试', () => {
    
    test('应该能够预检查余额充足性', async () => {
      const balanceInfo = await DatabaseLockManager.checkUserBalanceSufficient(
        TEST_USER_ID,
        100
      );
      
      expect(balanceInfo.sufficient).toBe(true);
      expect(balanceInfo.currentBalance).toBeGreaterThanOrEqual(100);
      expect(balanceInfo.version).toBeGreaterThan(0);
    });
    
    test('应该能够预检查夺宝份额', async () => {
      const shareInfo = await DatabaseLockManager.checkLotteryRoundRemainingShares(
        TEST_ROUND_ID
      );
      
      expect(shareInfo.status).toBe('active');
      expect(shareInfo.remainingShares).toBeGreaterThanOrEqual(0);
      expect(shareInfo.totalShares).toBe(100);
      expect(shareInfo.soldShares).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('监控功能测试', () => {
    
    test('应该能够获取锁状态监控信息', async () => {
      const lockInfo = await DatabaseLockManager.getLockMonitoringInfo();
      
      expect(Array.isArray(lockInfo)).toBe(true);
      
      // 应该包含测试数据
      const userLockInfo = lockInfo.find(info => 
        info.table_name === 'users' && info.row_id === TEST_USER_ID
      );
      
      expect(userLockInfo).toBeDefined();
      expect(userLockInfo!.balance_version).toBeGreaterThan(0);
    });
  });
  
  describe('边界条件测试', () => {
    
    test('应该处理无效的用户ID', async () => {
      const result = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
        'invalid-uuid',
        100,
        'deduct'
      );
      
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('用户不存在');
    });
    
    test('应该处理负数金额', async () => {
      const result = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
        TEST_USER_ID,
        -100,
        'deduct'
      );
      
      expect(result.success).toBe(true);
      expect(result.newBalance).toBeGreaterThan(0); // 应该是增加余额（负负得正）
    });
    
    test('应该处理无效的操作类型', async () => {
      const result = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
        TEST_USER_ID,
        100,
        'invalid_operation' as any
      );
      
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('无效的操作类型');
    });
  });
});

// 并发测试
describe('并发操作测试', () => {
  
  beforeAll(async () => {
    // 准备高并发测试数据
    await prisma.users.update({
      where: { id: TEST_USER_ID },
      data: { balance: 1000, balanceVersion: 1 }
    });
    
    await prisma.lotteryRounds.update({
      where: { id: TEST_ROUND_ID },
      data: { 
        soldShares: 0, 
        soldSharesVersion: 1,
        totalShares: 10 // 减少总份额以便测试并发
      }
    });
  });
  
  test('应该只有一个并发余额扣减成功', async () => {
    const concurrentOperations = Array(10).fill(0).map(() => 
      DatabaseLockManager.updateUserBalanceWithOptimisticLock(
        TEST_USER_ID,
        150, // 每次扣减150，10次总共1500，但用户只有1000
        'deduct'
      )
    );
    
    const results = await Promise.all(concurrentOperations);
    
    // 应该只有一个或零个操作成功
    const successCount = results.filter(result => result.success).length;
    expect(successCount).toBeLessThanOrEqual(1); // 最多一个成功
    
    // 如果有成功的，记录成功的结果
    const successfulResults = results.filter(result => result.success);
    if (successfulResults.length > 0) {
      console.log('并发余额扣减测试 - 成功操作数:', successCount);
      console.log('最终余额:', successfulResults[0].newBalance);
    }
  });
  
  test('应该只有一个并发份额购买成功', async () => {
    const concurrentOperations = Array(15).fill(0).map(() => 
      DatabaseLockManager.updateLotteryRoundSoldSharesWithLock(
        TEST_ROUND_ID,
        1 // 每次买1个份额，总共15个，但只有10个可用
      )
    );
    
    const results = await Promise.all(concurrentOperations);
    
    // 应该最多只有一个操作成功
    const successCount = results.filter(result => result.success).length;
    expect(successCount).toBeLessThanOrEqual(1);
    
    if (successCount > 0) {
      console.log('并发份额购买测试 - 成功操作数:', successCount);
      const successResult = results.find(result => result.success);
      console.log('已售份额:', successResult!.newSoldShares);
    }
  });
});

// 性能测试
describe('性能测试', () => {
  
  test('批量操作性能测试', async () => {
    const startTime = Date.now();
    
    const operations = Array(100).fill(0).map((_, index) => ({
      userId: TEST_USER_ID,
      amount: 1,
      operation: 'deduct' as const
    }));
    
    const results = await DatabaseLockManager.batchUpdateUserBalance(operations);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`批量操作性能测试: ${operations.length} 个操作耗时 ${duration}ms`);
    console.log(`平均每个操作: ${duration / operations.length}ms`);
    
    expect(duration).toBeLessThan(10000); // 应该在10秒内完成
    expect(results).toHaveLength(operations.length);
  });
});

export {}; // 确保这是一个模块文件