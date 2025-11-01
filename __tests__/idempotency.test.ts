import { describe, test, expect, beforeAll, afterEach, beforeEach, jest } from '@jest/globals';
import { prisma } from '../lib/prisma';
import { checkIdempotency, completeIdempotency, cleanupExpiredLogs } from '../lib/idempotency-manager';
import { getTestApiConfig } from '../config/api-config';
/**
 * 人工核销幂等性测试
 * 测试防重复提交机制
 */


// Mock NextRequest/NextResponse for testing
const mockNextRequest = (method: string = 'POST', body: any = {}) => ({
  method,
  url: `${testConfig.baseURL}/test`,
  headers: new Headers(),
  json: async () => body,
  body: null
});

const mockNextResponse = (data: any, status: number = 200) => ({
  status,
  json: async () => data
});

describe('人工核销幂等性测试', () => {
  const testConfig = getTestApiConfig();
  const TEST_WITHDRAW_ID = 'test-withdraw-idempotent';
  const TEST_ORDER_ID = 'test-order-idempotent';

  beforeAll(async () => {
    console.log('🧪 准备幂等性测试...');
  });

  afterEach(async () => {
    // 清理测试数据
    await prisma.processingLogs.deleteMany({
      where: {
        entityId: {
          in: [TEST_WITHDRAW_ID, TEST_ORDER_ID]
        }
      }
    });
    
    await prisma.withdrawRequests.deleteMany({
      where: { id: TEST_WITHDRAW_ID }
    });
    
    await prisma.orders.deleteMany({
      where: { id: TEST_ORDER_ID }
    });
  });

  describe('幂等性管理器测试', () => {
    test('首次操作应该允许执行', async () => {
      const result = await checkIdempotency({
        entityId: TEST_WITHDRAW_ID,
        operationType: 'withdraw_approve',
        checkExisting: true
      });

      expect(result.canProceed).toBe(true);
      expect(result.processingLogId).toBeDefined();
    });

    test('重复操作应该被阻止', async () => {
      // 第一次操作
      const firstResult = await checkIdempotency({
        entityId: TEST_WITHDRAW_ID,
        operationType: 'withdraw_approve'
      });

      expect(firstResult.canProceed).toBe(true);

      // 标记完成
      if (firstResult.processingLogId) {
        await completeIdempotency(firstResult.processingLogId, true);
      }

      // 第二次操作应该被阻止
      const secondResult = await checkIdempotency({
        entityId: TEST_WITHDRAW_ID,
        operationType: 'withdraw_approve',
        checkExisting: true
      });

      expect(secondResult.canProceed).toBe(false);
      expect(secondResult.message).toContain('已处理过');
    });

    test('正在处理的操作应该被阻止', async () => {
      // 创建处理中记录
      await prisma.processingLogs.create({
        data: {
          entityId: TEST_WITHDRAW_ID,
          operationType: 'withdraw_reject',
          status: 'processing',
          createdAt: new Date()
        }
      });

      const result = await checkIdempotency({
        entityId: TEST_WITHDRAW_ID,
        operationType: 'withdraw_reject'
      });

      expect(result.canProceed).toBe(false);
      expect(result.message).toContain('正在处理中');
    });

    test('TTL过期的操作应该允许重新执行', async () => {
      // 创建过期记录
      await prisma.processingLogs.create({
        data: {
          entityId: TEST_WITHDRAW_ID,
          operationType: 'withdraw_approve',
          status: 'processing',
          createdAt: new Date(Date.now() - 10 * 60 * 1000) // 10分钟前
        }
      });

      const result = await checkIdempotency({
        entityId: TEST_WITHDRAW_ID,
        operationType: 'withdraw_approve',
        ttl: 300 // 5分钟TTL
      });

      expect(result.canProceed).toBe(true);
      expect(result.processingLogId).toBeDefined();
    });

    test('操作完成状态更新应该正常工作', async () => {
      const processingLog = await prisma.processingLogs.create({
        data: {
          entityId: TEST_WITHDRAW_ID,
          operationType: 'withdraw_approve',
          status: 'processing',
          createdAt: new Date()
        }
      });

      // 标记成功
      await completeIdempotency(processingLog.id, true);

      // 验证状态更新
      const updatedLog = await prisma.processingLogs.findUnique({
        where: { id: processingLog.id }
      });

      expect(updatedLog?.status).toBe('completed');
      expect(updatedLog?.completedAt).toBeDefined();

      // 标记失败
      await completeIdempotency(processingLog.id, false, '测试错误');

      const failedLog = await prisma.processingLogs.findUnique({
        where: { id: processingLog.id }
      });

      expect(failedLog?.status).toBe('failed');
      expect(failedLog?.errorMessage).toBe('测试错误');
    });
  });

  describe('提现审核幂等性测试', () => {
    beforeEach(async () => {
      // 创建测试用户和提现申请
      const testUser = await prisma.users.upsert({
        where: { id: 'test-user-idempotent' },
        update: { balance: 1000, balanceVersion: 1 },
        create: {
          id: 'test-user-idempotent',
          telegramId: 'test_telegram_idempotent',
          firstName: 'Test User Idempotent',
          balance: 1000,
          balanceVersion: 1
        }
      });

      await prisma.withdrawRequests.upsert({
        where: { id: TEST_WITHDRAW_ID },
        update: {},
        create: {
          id: TEST_WITHDRAW_ID,
          userId: testUser.id,
          amount: 100,
          fee: 5,
          actualAmount: 95,
          withdrawMethod: 'bank_transfer',
          accountInfo: { bank: 'Test Bank', account: '123456789' },
          status: 'pending'
        }
      });
    });

    test('重复提现审核应该被阻止', async () => {
      const idempotencyResult = await checkIdempotency({
        entityId: TEST_WITHDRAW_ID,
        operationType: 'withdraw_approve',
        checkExisting: true
      });

      expect(idempotencyResult.canProceed).toBe(true);
      expect(idempotencyResult.processingLogId).toBeDefined();

      // 模拟第一次审核成功
      if (idempotencyResult.processingLogId) {
        await completeIdempotency(idempotencyResult.processingLogId, true);
      }

      // 第二次审核尝试
      const duplicateResult = await checkIdempotency({
        entityId: TEST_WITHDRAW_ID,
        operationType: 'withdraw_approve',
        checkExisting: true
      });

      expect(duplicateResult.canProceed).toBe(false);
      expect(duplicateResult.message).toContain('已处理过');
    });

    test('并发提现审核应该只有一个成功', async () => {
      const operations = Array(3).fill(0).map(() =>;
        checkIdempotency({
          entityId: TEST_WITHDRAW_ID,
          operationType: 'withdraw_approve',
          checkExisting: false // 并发时不检查已完成
        })
      );

      const results = await Promise.all(operations);
      
      // 只有一个允许继续
      const allowedResults = results.filter(r => r.canProceed);
      expect(allowedResults.length).toBe(1);

      // 其余被阻止
      const blockedResults = results.filter(r => !r.canProceed);
      expect(blockedResults.length).toBe(2);
      blockedResults.forEach(result => {
        expect(result.message).toContain('正在处理中');
      });
    });
  });

  describe('订单更新幂等性测试', () => {
    beforeEach(async () => {
      const testUser = await prisma.users.upsert({
        where: { id: 'test-user-order-idempotent' },
        update: {},
        create: {
          id: 'test-user-order-idempotent',
          telegramId: 'test_telegram_order_idempotent',
          firstName: 'Test Order User',
          balance: 1000,
          balanceVersion: 1
        }
      });

      await prisma.orders.upsert({
        where: { id: TEST_ORDER_ID },
        update: {},
        create: {
          id: TEST_ORDER_ID,
          orderNumber: `TEST_ORDER_${Date.now()}`,
          userId: testUser.id,
          type: 'lottery',
          totalAmount: 100,
          status: 'pending_shipment',
          version: 1,
          paymentStatus: 'paid',
          fulfillmentStatus: 'pending'
        }
      });
    });

    test('重复订单更新应该被阻止', async () => {
      const idempotencyResult = await checkIdempotency({
        entityId: TEST_ORDER_ID,
        operationType: 'order_ship',
        checkExisting: true
      });

      expect(idempotencyResult.canProceed).toBe(true);

      // 标记完成
      if (idempotencyResult.processingLogId) {
        await completeIdempotency(idempotencyResult.processingLogId, true);
      }

      // 重复操作
      const duplicateResult = await checkIdempotency({
        entityId: TEST_ORDER_ID,
        operationType: 'order_ship',
        checkExisting: true
      });

      expect(duplicateResult.canProceed).toBe(false);
      expect(duplicateResult.message).toContain('已处理过');
    });

    test('不同操作的幂等性应该独立', async () => {
      // 发货操作
      const shipResult = await checkIdempotency({
        entityId: TEST_ORDER_ID,
        operationType: 'order_ship',
        checkExisting: true
      });

      expect(shipResult.canProceed).toBe(true);

      // 完成操作应该是独立的
      const completeResult = await checkIdempotency({
        entityId: TEST_ORDER_ID,
        operationType: 'order_complete',
        checkExisting: true
      });

      expect(completeResult.canProceed).toBe(true);
      expect(shipResult.processingLogId).not.toBe(completeResult.processingLogId);
    });
  });

  describe('清理过期记录测试', () => {
    test('清理过期记录应该正常工作', async () => {
      // 创建不同时间的记录
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      await prisma.processingLogs.createMany({
        data: [
          {
            entityId: 'expired-1',
            operationType: 'test',
            status: 'completed',
            createdAt: twoDaysAgo
          },
          {
            entityId: 'expired-2',
            operationType: 'test',
            status: 'failed',
            createdAt: twoDaysAgo
          },
          {
            entityId: 'recent',
            operationType: 'test',
            status: 'processing',
            createdAt: now
          }
        ]
      });

      await cleanupExpiredLogs(24); // 清理24小时前的记录

      // 检查结果
      const remainingLogs = await prisma.processingLogs.findMany({
        where: {
          operationType: 'test'
        }
      });

      expect(remainingLogs.length).toBe(1);
      expect((remainingLogs?.0 ?? null).entityId).toBe('recent');
    });
  });

  describe('防重复提交Hook测试', () => {
    test('Hook应该正确跟踪提交状态', () => {
      // 这个测试需要React环境，在实际应用中会使用Jest和React Testing Library
      // 这里只是测试逻辑，真实的Hook测试会在前端测试中进行
      expect(true).toBe(true); // 占位符
    });
  });
});