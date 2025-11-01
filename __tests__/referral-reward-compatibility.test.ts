import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTokenPair, verifyAccessToken } from '@/lib/auth';
import { rewardTrigger } from '@/lib/reward-trigger-manager';
import { FraudChecker } from '@/lib/anti-fraud/fraud-checker';
import { validateReferralCodeFormat } from '@/lib/auth';
/**
 * 邀请奖励触发机制 API兼容性测试
 * 验证更新后的API与现有功能的兼容性
 */


// 模拟 NextRequest
class MockNextRequest extends Request {
  public cookies: Map<string, string> = new Map();
  public headers: Headers = new Headers();

  constructor(url: string, options: RequestInit = {}) {
    super(url, options);
    
    // 模拟 headers
    if (options.headers) {
      const headers = new Headers(options.headers as any);
      this.headers = headers;
    }
  }

  getHeader(name: string): string | null {
    return this.headers.get(name);
  }

  setCookie(name: string, value: string): void {
    this.cookies.set(name, value);
  }

  getCookie(name: string): string | undefined {
    return this.cookies.get(name);
  }
}

describe('邀请奖励触发机制 API兼容性测试', () => {
  let testUser1: any;
  let testUser2: any;
  let testUser3: any;
  let authTokens: any;
  let testReferralCode: string;

  beforeAll(async () => {
    console.log('开始设置测试数据...');

    // 创建测试用户
    testUser1 = await prisma.users.create({
      data: {
        telegramId: 'test_user_1_' + Date.now(),
        firstName: 'Test User 1',
        username: 'testuser1',
        language: 'zh',
        trust_score: 50,
        is_suspicious: false
      }
    });

    testUser2 = await prisma.users.create({
      data: {
        telegramId: 'test_user_2_' + Date.now(),
        firstName: 'Test User 2',
        username: 'testuser2',
        language: 'zh',
        trust_score: 50,
        is_suspicious: false
      }
    });

    testUser3 = await prisma.users.create({
      data: {
        telegramId: 'test_user_3_' + Date.now(),
        firstName: 'Test User 3',
        username: 'testuser3',
        language: 'zh',
        trust_score: 50,
        is_suspicious: false
      }
    });

    // 生成认证token
    authTokens = generateTokenPair(testUser1.id, testUser1.telegramId);

    // 生成测试邀请码
    testReferralCode = 'LM12345678';

    console.log('测试数据设置完成');
  });

  afterAll(async () => {
    console.log('清理测试数据...');
    
    try {
      // 清理测试数据
      await prisma.referralRelationships.deleteMany({
        where: {
          OR: [
            { referee_user_id: { in: [testUser1.id, testUser2.id, testUser3.id] } },
            { referrer_user_id: { in: [testUser1.id, testUser2.id, testUser3.id] } }
          ]
        }
      });

      await prisma.rewardTransaction.deleteMany({
        where: {
          OR: [
            { user_id: { in: [testUser1.id, testUser2.id, testUser3.id] } },
            { source_user_id: { in: [testUser1.id, testUser2.id, testUser3.id] } }
          ]
        }
      });

      await prisma.users.deleteMany({
        where: {
          id: { in: [testUser1.id, testUser2.id, testUser3.id] }
        }
      });

      console.log('测试数据清理完成');
  }
    } catch (error) {
      console.warn('清理测试数据时出错:', error);
    }
  });

  describe('认证中间件兼容性测试', () => {
    test('应该能够验证现有的JWT token', () => {
      const accessToken = authTokens.accessToken;
      const verified = verifyAccessToken(accessToken);
      
      expect(verified).toBeTruthy();
      expect(verified?.userId).toBe(testUser1.id);
      expect(verified?.telegramId).toBe(testUser1.telegramId);
      expect(verified?.tokenType).toBe('access');
    });

    test('应该能够验证邀请码格式', () => {
      const validCodes = ['LM12345678', 'LMABCDEFGH', 'LM98765432'];
      const invalidCodes = ['INVALID', 'LM123', '12345678', 'LM123456789'];

      validCodes.forEach(code => {
        const validation = validateReferralCodeFormat(code);
        expect(validation.isValid).toBe(true);
      });

      invalidCodes.forEach(code => {
        const validation = validateReferralCodeFormat(code);
        expect(validation.isValid).toBe(false);
      });
    });

    test('应该能够生成邀请令牌', () => {
      const { generateReferralToken, verifyReferralToken } = require('@/lib/auth');
      
      const referralToken = generateReferralToken(testUser1.id, testUser2.id);
      const verified = verifyReferralToken(referralToken);
      
      expect(verified).toBeTruthy();
      expect(verified?.userId).toBe(testUser1.id);
      expect(verified?.referrerId).toBe(testUser2.id);
      expect(verified?.tokenType).toBe('referral');
    });
  });

  describe('奖励触发器测试', () => {
    test('应该能够触发用户注册奖励', async () => {
      // 设置推荐关系
      await prisma.users.update({
        where: { id: testUser2.id },
        data: { referred_by_user_id: testUser1.id }
      });

      const result = await rewardTrigger.triggerReward({
        type: 'USER_REGISTRATION',
        userId: testUser2.id,
        timestamp: new Date()
      });

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result?.totalRewards).toBeGreaterThan(0);
    });

    test('应该能够触发订单完成奖励', async () => {
      // 创建测试订单
      const order = await prisma.orders.create({
        data: {
          orderNumber: 'TEST_' + Date.now(),
          userId: testUser2.id,
          type: 'purchase',
          totalAmount: 100,
          paymentStatus: 'paid',
          fulfillmentStatus: 'completed',
          status: 'completed'
        }
      });

      const result = await rewardTrigger.triggerReward({
        type: 'ORDER_COMPLETION',
        userId: testUser2.id,
        data: {
          orderId: order.id,
          orderAmount: 100
        },
        timestamp: new Date()
      });

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });

    test('应该能够触发充值奖励', async () => {
      // 创建测试充值订单
      const rechargeOrder = await prisma.orders.create({
        data: {
          orderNumber: 'RECHARGE_' + Date.now(),
          userId: testUser2.id,
          type: 'recharge',
          totalAmount: 50,
          paymentStatus: 'paid',
          fulfillmentStatus: 'completed',
          status: 'completed'
        }
      });

      const result = await rewardTrigger.triggerReward({
        type: 'RECHARGE_COMPLETION',
        userId: testUser2.id,
        data: {
          orderId: rechargeOrder.id,
          rechargeAmount: 50
        },
        timestamp: new Date()
      });

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });
  });

  describe('防作弊系统测试', () => {
    test('应该能够执行推荐关系检查', async () => {
      const checkResult = await FraudChecker.checkReferral(;
        testUser1.id,
        testUser2.id
      );

      expect(checkResult).toBeDefined();
      expect(checkResult.isValid).toBe(true);
    });

    test('应该能够检测自我推荐', async () => {
      const checkResult = await FraudChecker.checkReferral(;
        testUser1.id,
        testUser1.id
      );

      expect(checkResult.isValid).toBe(false);
      expect(checkResult.reason).toContain('不能自己推荐自己');
    });

    test('应该能够执行用户风险评估', async () => {
      const riskAssessment = await FraudChecker.getUserRiskAssessment(testUser1.id);
      
      expect(riskAssessment).toBeDefined();
      expect(riskAssessment.overallRisk).toBeGreaterThanOrEqual(0);
      expect(riskAssessment.overallRisk).toBeLessThanOrEqual(100);
      expect(['allow', 'monitor', 'block']).toContain(riskAssessment.recommendation);
    });
  });

  describe('数据库操作兼容性测试', () => {
    test('应该能够创建推荐关系', async () => {
      await prisma.referralRelationships.create({
        data: {
          referee_user_id: testUser3.id,
          referrer_user_id: testUser2.id,
          referral_level: 1
        }
      });

      const relationship = await prisma.referralRelationships.findFirst({
        where: {
          referee_user_id: testUser3.id,
          referrer_user_id: testUser2.id
        }
      });

      expect(relationship).toBeDefined();
      expect(relationship?.referral_level).toBe(1);
    });

    test('应该能够创建奖励交易记录', async () => {
      await prisma.rewardTransaction.create({
        data: {
          user_id: testUser1.id,
          reward_type: 'referral_register',
          amount: 10,
          description: '测试奖励',
          config_snapshot: { test: true }
        }
      });

      const transaction = await prisma.rewardTransaction.findFirst({
        where: {
          user_id: testUser1.id,
          reward_type: 'referral_register'
        }
      });

      expect(transaction).toBeDefined();
      expect(transaction?.amount).toBe(10);
    });

    test('应该能够记录防作弊日志', async () => {
      await prisma.fraudDetectionLogs.create({
        data: {
          user_id: testUser1.id,
          detection_type: 'test_check',
          risk_score: 50,
          details: { test: true },
          action_taken: 'monitor'
        }
      });

      const log = await prisma.fraudDetectionLogs.findFirst({
        where: {
          user_id: testUser1.id,
          detection_type: 'test_check'
        }
      });

      expect(log).toBeDefined();
      expect(log?.risk_score).toBe(50);
    });
  });

  describe('向后兼容性测试', () => {
    test('旧的JWT token格式应该仍然有效', () => {
      const oldToken = generateTokenPair(testUser1.id, testUser1.telegramId);
      const verified = verifyAccessToken(oldToken.accessToken);
      
      expect(verified).toBeTruthy();
      expect(verified?.userId).toBe(testUser1.id);
    });

    test('现有的用户创建流程应该不受影响', async () => {
      // 测试不包含邀请码的用户创建
      const newUser = await prisma.users.create({
        data: {
          telegramId: 'compat_test_' + Date.now(),
          firstName: 'Compatibility Test',
          language: 'zh'
        }
      });

      expect(newUser).toBeDefined();
      expect(newUser.referred_by_user_id).toBeNull();

      // 清理
      await prisma.users.delete({ where: { id: newUser.id } });
    });

    test('现有的订单处理应该不受影响', async () => {
      const order = await prisma.orders.create({
        data: {
          orderNumber: 'COMPAT_' + Date.now(),
          userId: testUser1.id,
          type: 'purchase',
          totalAmount: 25,
          paymentStatus: 'pending',
          fulfillmentStatus: 'pending',
          status: 'pending'
        }
      });

      expect(order).toBeDefined();
      expect(order.paymentStatus).toBe('pending');

      // 更新订单状态
      const updatedOrder = await prisma.orders.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          fulfillmentStatus: 'completed',
          status: 'completed'
        }
      });

      expect(updatedOrder.paymentStatus).toBe('paid');
      expect(updatedOrder.fulfillmentStatus).toBe('completed');
    });
  });

  describe('性能测试', () => {
    test('奖励触发器应该能在合理时间内完成', async () => {
      const startTime = Date.now();
      
      await rewardTrigger.triggerReward({
        type: 'USER_REGISTRATION',
        userId: testUser3.id,
        timestamp: new Date()
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
    });

    test('防作弊检查应该能在合理时间内完成', async () => {
      const startTime = Date.now();
      
      await FraudChecker.performComprehensiveCheck(testUser1.id);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // 应该在2秒内完成
    });
  });

  describe('错误处理测试', () => {
    test('无效的奖励触发事件应该返回错误', async () => {
      const result = await rewardTrigger.triggerReward({
        type: 'INVALID_EVENT' as any,
        userId: testUser1.id,
        timestamp: new Date()
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('不存在的用户应该返回适当的错误', async () => {
      const result = await rewardTrigger.triggerReward({
        type: 'USER_REGISTRATION',
        userId: 'non-existent-user-id',
        timestamp: new Date()
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('用户不存在');
    });
  });
});