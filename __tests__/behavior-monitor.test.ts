/**
 * 行为监控系统的单元测试
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { behaviorMonitor, DetectionResult } from '../lib/anti-fraud/behavior-monitor';

// 模拟PrismaClient
const mockPrisma = {
  $queryRaw: jest.fn(),
  fraudDetectionLogs: {
    create: jest.fn(),
    findFirst: jest.fn(),
    groupBy: jest.fn()
  },
  users: {
    update: jest.fn(),
    findMany: jest.fn()
  },
  deviceBlacklist: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn()
  },
  deviceFingerprints: {
    findMany: jest.fn()
  },
  referralRelationships: {
    findMany: jest.fn()
  },
  transactions: {
    findMany: jest.fn()
  }
};

// 替换PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma)
}));

// 模拟logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// 模拟monitoring
jest.mock('../monitoring', () => ({
  monitoring: {
    recordMetric: jest.fn(),
    recordError: jest.fn()
  }
}));

describe('BehaviorMonitor', () => {
  let monitor: any;

  beforeAll(() => {
    monitor = behaviorMonitor;
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('detectAbnormalInviteSpeed', () => {
    it('应该检测到24小时内邀请超过20人的用户', async () => {
      // 模拟数据
      const mockInviteStats = [
        { referrer_user_id: 'user1', invite_count: 25 },
        { referrer_user_id: 'user2', invite_count: 30 }
      ];
      
      mockPrisma.$queryRaw.mockResolvedValue(mockInviteStats);
      mockPrisma.fraudDetectionLogs.findFirst.mockResolvedValue(null);
      
      const results = await monitor.detectAbnormalInviteSpeed();
      
      expect(results).toHaveLength(2);
      expect(results[0].type).toBe('abnormal_invite_speed');
      expect(results[0].riskScore).toBe(85);
      expect(results[0].action).toBe('manual_review');
      expect(results[0].details.inviteCount).toBe(25);
      expect(mockPrisma.users.update).toHaveBeenCalledTimes(2);
    });

    it('应该跳过已经在审核中的用户', async () => {
      const mockInviteStats = [
        { referrer_user_id: 'user1', invite_count: 25 }
      ];
      
      mockPrisma.$queryRaw.mockResolvedValue(mockInviteStats);
      mockPrisma.fraudDetectionLogs.findFirst.mockResolvedValue({ id: 1 }); // 存在审核记录
      
      const results = await monitor.detectAbnormalInviteSpeed();
      
      expect(results).toHaveLength(0);
      expect(mockPrisma.users.update).not.toHaveBeenCalled();
    });
  });

  describe('detectSuspiciousDevices', () => {
    it('应该检测到绑定4个或更多账号的设备', async () => {
      const mockDeviceStats = [
        { device_id: 'device1', account_count: 5 }
      ];
      
      mockPrisma.$queryRaw.mockResolvedValue(mockDeviceStats);
      mockPrisma.deviceBlacklist.findUnique.mockResolvedValue(null);
      
      const mockDeviceUsers = [
        { userId: 'user1', User: { username: 'user1', telegramId: 12345 } },
        { userId: 'user2', User: { username: 'user2', telegramId: 67890 } }
      ];
      
      mockPrisma.deviceFingerprints.findMany.mockResolvedValue(mockDeviceUsers);
      
      const results = await monitor.detectSuspiciousDevices();
      
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('suspicious_device');
      expect(results[0].riskScore).toBe(75);
      expect(results[0].action).toBe('require_verification');
      expect(results[0].details.accountCount).toBe(5);
    });

    it('应该跳过已经在黑名单中的设备', async () => {
      const mockDeviceStats = [
        { device_id: 'device1', account_count: 5 }
      ];
      
      mockPrisma.$queryRaw.mockResolvedValue(mockDeviceStats);
      mockPrisma.deviceBlacklist.findUnique.mockResolvedValue({ deviceId: 'device1' }); // 已在黑名单
      
      const results = await monitor.detectSuspiciousDevices();
      
      expect(results).toHaveLength(0);
      expect(mockPrisma.deviceFingerprints.findMany).not.toHaveBeenCalled();
    });
  });

  describe('detectBatchRegistration', () => {
    it('应该检测到24小时内同一IP注册超过10个账号', async () => {
      const mockIpStats = [
        { ip_address: '192.168.1.100', registration_count: 15 }
      ];
      
      mockPrisma.$queryRaw.mockResolvedValue(mockIpStats);
      mockPrisma.deviceBlacklist.findFirst.mockResolvedValue(null);
      
      const results = await monitor.detectBatchRegistration();
      
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('batch_registration');
      expect(results[0].riskScore).toBe(90);
      expect(results[0].action).toBe('block');
      expect(results[0].details.registrationCount).toBe(15);
    });
  });

  describe('detectMutualReferralWashTrading', () => {
    it('应该检测到互相推荐的用户进行相似金额充值', async () => {
      const mockMutualPairs = [
        { user_a_id: 'user1', user_b_id: 'user2' }
      ];
      
      mockPrisma.$queryRaw.mockResolvedValue(mockMutualPairs);
      
      const now = new Date();
      const mockTransactions = [
        {
          id: 1,
          userId: 'user1',
          type: 'recharge',
          amount: '100.00',
          createdAt: now
        },
        {
          id: 2,
          userId: 'user2',
          type: 'recharge',
          amount: '105.00', // 相似金额（5%差异）
          createdAt: new Date(now.getTime() + 1000) // 1秒后
        }
      ];
      
      mockPrisma.transactions.findMany.mockResolvedValue(mockTransactions);
      
      const results = await monitor.detectMutualReferralWashTrading();
      
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('mutual_referral_wash_trading');
      expect(results[0].riskScore).toBe(95);
      expect(results[0].action).toBe('manual_review');
    });
  });

  describe('filterZombieAccounts', () => {
    it('应该检测到可信度评分低且无活跃行为的僵尸号', async () => {
      const mockZombieAccounts = [
        {
          id: 'user1',
          telegramId: 12345,
          username: 'zombie_user',
          trustScore: 15,
          isSuspicious: false
        }
      ];
      
      mockPrisma.users.findMany.mockResolvedValue(mockZombieAccounts);
      
      const mockActivity = [
        { transaction_count: 0, last_activity: null }
      ];
      
      mockPrisma.$queryRaw.mockResolvedValue(mockActivity);
      
      const results = await monitor.filterZombieAccounts();
      
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('zombie_account');
      expect(results[0].riskScore).toBe(70);
      expect(results[0].action).toBe('flag');
    });
  });

  describe('cleanupExpiredBlacklist', () => {
    it('应该清理过期的黑名单条目', async () => {
      mockPrisma.deviceBlacklist.deleteMany.mockResolvedValue({ count: 5 });
      
      const cleanedCount = await monitor.cleanupExpiredBlacklist();
      
      expect(cleanedCount).toBe(5);
      expect(mockPrisma.deviceBlacklist.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            not: null,
            lt: expect.any(Date)
          }
        }
      });
    });
  });

  describe('runAllDetections', () => {
    it('应该成功运行所有检测并返回统计', async () => {
      // 模拟各种检测的结果
      const mockResults = {
        abnormalInviteSpeed: [{ type: 'abnormal_invite_speed' }],
        suspiciousDevices: [{ type: 'suspicious_device' }],
        batchRegistration: [],
        mutualReferralWashTrading: [],
        zombieAccounts: [{ type: 'zombie_account' }]
      };
      
      // 模拟各个检测函数
      jest.spyOn(monitor, 'detectAbnormalInviteSpeed').mockResolvedValue(mockResults.abnormalInviteSpeed);
      jest.spyOn(monitor, 'detectSuspiciousDevices').mockResolvedValue(mockResults.suspiciousDevices);
      jest.spyOn(monitor, 'detectBatchRegistration').mockResolvedValue(mockResults.batchRegistration);
      jest.spyOn(monitor, 'detectMutualReferralWashTrading').mockResolvedValue(mockResults.mutualReferralWashTrading);
      jest.spyOn(monitor, 'filterZombieAccounts').mockResolvedValue(mockResults.zombieAccounts);
      
      const results = await monitor.runAllDetections();
      
      expect(results).toEqual(mockResults);
      expect(monitor.detectAbnormalInviteSpeed).toHaveBeenCalled();
      expect(monitor.detectSuspiciousDevices).toHaveBeenCalled();
      expect(monitor.detectBatchRegistration).toHaveBeenCalled();
      expect(monitor.detectMutualReferralWashTrading).toHaveBeenCalled();
      expect(monitor.filterZombieAccounts).toHaveBeenCalled();
    });
  });
});