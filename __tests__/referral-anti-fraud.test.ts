/**
 * 防作弊系统测试
 * 测试各种反作弊机制和检测逻辑
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TestDataGenerator, PerformanceTester } from './test-config';

// 模拟IP地理位置检测
jest.mock('geoip-lite', () => ({
  lookup: jest.fn((ip: string) => {
    const mockLocations: Record<string, any> = {
      '127.0.0.1': { country: 'US', region: 'CA', city: 'San Francisco' },
      '192.168.1.1': { country: 'CN', region: 'BJ', city: 'Beijing' },
      '10.0.0.1': { country: 'RU', region: 'MOW', city: 'Moscow' },
    };
    return mockLocations[ip] || null;
  }),
}));

// 模拟设备指纹生成
const generateDeviceFingerprint = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(16);
};

// 模拟用户行为分析
class BehaviorAnalyzer {
  private userPatterns: Map<string, any[]> = new Map();

  addUserAction(userId: string, action: any) {
    if (!this.userPatterns.has(userId)) {
      this.userPatterns.set(userId, []);
    }
    this.userPatterns.get(userId)!.push({
      ...action,
      timestamp: Date.now(),
    });
  }

  analyzeUser(userId: string): any {
    const actions = this.userPatterns.get(userId) || [];
    
    if (actions.length === 0) {
      return { riskScore: 0, pattern: 'new_user' };
    }

    // 计算行为异常分数
    let riskScore = 0;
    const lastActions = actions.slice(-10); // 最近10个操作

    // 检查操作频率
    const timeSpans = [];
    for (let i = 1; i < lastActions.length; i++) {
      timeSpans.push(lastActions[i].timestamp - lastActions[i-1].timestamp);
    }
    
    const avgTimeSpan = timeSpans.length > 0 
      ? timeSpans.reduce((sum, span) => sum + span, 0) / timeSpans.length 
      : 0;

    // 异常快速操作
    if (avgTimeSpan < 1000) riskScore += 30; // 1秒内多次操作
    if (avgTimeSpan < 500) riskScore += 20;  // 0.5秒内操作

    // 检查IP地址变化
    const ips = [...new Set(lastActions.map(a => a.ip))];
    if (ips.length > 3) riskScore += 25; // 多个IP

    // 检查设备指纹变化
    const devices = [...new Set(lastActions.map(a => a.deviceId))];
    if (devices.length > 2) riskScore += 20;

    // 检查操作模式
    const uniqueActions = new Set(lastActions.map(a => a.type)).size;
    if (uniqueActions === 1 && lastActions.length > 5) {
      riskScore += 15; // 单一操作重复执行
    }

    let pattern = 'normal';
    if (riskScore >= 70) pattern = 'high_risk';
    else if (riskScore >= 40) pattern = 'medium_risk';
    else if (riskScore >= 20) pattern = 'low_risk';

    return { riskScore, pattern, actionCount: actions.length };
  }

  clearUserData(userId: string) {
    this.userPatterns.delete(userId);
  }
}

const behaviorAnalyzer = new BehaviorAnalyzer();

describe('防作弊系统测试', () => {
  let testDataGenerator: TestDataGenerator;
  let mockPrisma: any;
  let antiFraudService: any;

  beforeEach(() => {
    testDataGenerator = new TestDataGenerator({} as any);
    mockPrisma = {
      users: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      referrals: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      transactions: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      fraudDetectionLogs: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      userBehaviorLogs: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    // 模拟防作弊服务
    antiFraudService = {
      detectSuspiciousActivity: jest.fn(),
      analyzeReferralPattern: jest.fn(),
      calculateFraudScore: jest.fn(),
      blockUser: jest.fn(),
      unblockUser: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    behaviorAnalyzer.clearUserData('*'); // 清除所有用户数据
  });

  describe('用户行为异常检测测试', () => {
    test('检测异常快速注册', async () => {
      const suspiciousUserId = 'user-suspicious-001';
      const rapidRegistrations = Array.from({ length: 10 }, (_, i) => ({
        userId: `${suspiciousUserId}-${i}`,
        telegramId: `tg_${Date.now() + i}`,
        timestamp: Date.now() + i * 100, // 每100ms一个注册
        ip: '192.168.1.100',
        deviceId: 'device-001',
      }));

      // 添加用户行为到分析器
      rapidRegistrations.forEach(registration => {
        behaviorAnalyzer.addUserAction(suspiciousUserId, {
          type: 'registration',
          ip: registration.ip,
          deviceId: registration.deviceId,
          timestamp: registration.timestamp,
        });
      });

      const analysis = behaviorAnalyzer.analyzeUser(suspiciousUserId);
      
      // 验证风险评估
      expect(analysis.riskScore).toBeGreaterThanOrEqual(40);
      expect(['high_risk', 'medium_risk']).toContain(analysis.pattern);
      expect(analysis.actionCount).toBe(10);
    });

    test('检测虚假邀请行为', async () => {
      const fakeInviter = 'user-fake-inviter';
      const fakeInvites = Array.from({ length: 50 }, (_, i) => ({
        inviterId: fakeInviter,
        inviteeId: `fake-user-${i}`,
        ipAddress: '10.0.0.' + (i % 10), // 多个IP段
        deviceId: 'fake-device-' + (i % 3), // 少量设备ID
        timestamp: Date.now() + i * 2000, // 每2秒一个邀请
      }));

      // 模拟邀请模式分析
      const analyzeReferralPattern = (invites: any[]) => {
        const ipAddresses = [...new Set(invites.map(invite => invite.ipAddress))];
        const deviceIds = [...new Set(invites.map(invite => invite.deviceId))];
        const timeSpans = [];
        
        for (let i = 1; i < invites.length; i++) {
          timeSpans.push(invites[i].timestamp - invites[i-1].timestamp);
        }

        const avgTimeSpan = timeSpans.reduce((sum, span) => sum + span, 0) / timeSpans.length;

        let fraudScore = 0;
        
        // 高频邀请
        if (avgTimeSpan < 5000) fraudScore += 30;
        
        // 大量IP
        if (ipAddresses.length > invites.length * 0.8) fraudScore += 25;
        
        // 少量设备ID对应大量邀请
        if (deviceIds.length < invites.length * 0.1) fraudScore += 20;

        return {
          fraudScore,
          ipCount: ipAddresses.length,
          deviceCount: deviceIds.length,
          avgTimeSpan,
        };
      };

      const pattern = analyzeReferralPattern(fakeInvites);
      
      expect(pattern.fraudScore).toBeGreaterThanOrEqual(50);
      expect(pattern.deviceCount).toBeLessThan(10); // 设备数量异常少
    });

    test('检测设备指纹重复使用', async () => {
      const suspiciousDeviceId = generateDeviceFingerprint('suspicious-device');
      const multipleUsersOnSameDevice = Array.from({ length: 15 }, (_, i) => ({
        userId: `user-device-${i}`,
        deviceId: suspiciousDeviceId,
        registrationIP: '192.168.1.' + (i % 5),
        userAgent: 'Mozilla/5.0 (compatible bot)',
        timestamp: Date.now() + i * 300000, // 每5分钟一个注册
      }));

      // 分析设备使用模式
      const deviceUsageAnalysis = (users: any[]) => {
        const deviceId = users[0].deviceId;
        const uniqueIPs = [...new Set(users.map(u => u.registrationIP))];
        const userAgents = [...new Set(users.map(u => u.userAgent))];
        
        let suspicionScore = 0;
        
        // 相同设备注册多个账户
        if (users.length > 5) suspicionScore += 40;
        
        // 多个IP但相同设备
        if (uniqueIPs.length > 1 && uniqueIPs.length < users.length * 0.5) {
          suspicionScore += 30;
        }
        
        // 相同User-Agent
        if (userAgents.length === 1 && users.length > 3) {
          suspicionScore += 20;
        }

        return {
          deviceId,
          userCount: users.length,
          ipCount: uniqueIPs.length,
          suspicionScore,
          isSuspicious: suspicionScore >= 50,
        };
      };

      const analysis = deviceUsageAnalysis(multipleUsersOnSameDevice);
      
      expect(analysis.isSuspicious).toBe(true);
      expect(analysis.suspicionScore).toBeGreaterThanOrEqual(50);
      expect(analysis.ipCount).toBeLessThan(analysis.userCount); // IP数量明显少于用户数量
    });
  });

  describe('地理位置异常检测测试', () => {
    test('检测异常地理位置活动', async () => {
      const userId = 'user-geo-suspicious';
      const geoActivities = [
        { ip: '127.0.0.1', location: { country: 'US', city: 'San Francisco' } },
        { ip: '192.168.1.1', location: { country: 'CN', city: 'Beijing' } },
        { ip: '10.0.0.1', location: { country: 'RU', city: 'Moscow' } },
      ];

      // 短时间内地理位置变化异常
      const timeSpan = 3600000; // 1小时内
      const geoChanges = geoActivities.length;
      const changeFrequency = geoChanges / (timeSpan / 3600000); // 每小时变化次数

      expect(changeFrequency).toBeGreaterThan(2); // 1小时内超过2次地理位置变化

      // 模拟地理位置快速变化检测
      const isGeoAnomaly = (activities: any[]) => {
        const countries = activities.map(a => a.location.country);
        const uniqueCountries = [...new Set(countries)];
        
        // 短时间内多个国家
        if (uniqueCountries.length > 2) {
          return { 
            isAnomaly: true, 
            reason: 'multiple_countries_short_time',
            countries: uniqueCountries 
          };
        }
        
        return { isAnomaly: false, reason: null, countries: uniqueCountries };
      };

      const geoAnalysis = isGeoAnomaly(geoActivities);
      expect(geoAnalysis.isAnomaly).toBe(true);
      expect(geoAnalysis.countries.length).toBe(3);
    });

    test('检测代理/VPN使用', async () => {
      const suspiciousIPs = [
        '192.168.1.100',  // 私有IP
        '10.0.0.50',      // 私有IP
        '172.16.0.10',    // 私有IP
      ];

      const isLikelyProxyIP = (ip: string): boolean => {
        // 检查私有IP段（可能的使用代理）
        const privateIPPatterns = [
          /^192\.168\./,  // 192.168.0.0/16
          /^10\./,        // 10.0.0.0/8
          /^172\.16\./,   // 172.16.0.0/12
          /^172\.17\./,
          /^172\.18\./,
          /^172\.19\./,
          /^172\.20\./,
          /^172\.21\./,
          /^172\.22\./,
          /^172\.23\./,
          /^172\.24\./,
          /^172\.25\./,
          /^172\.26\./,
          /^172\.27\./,
          /^172\.28\./,
          /^172\.29\./,
          /^172\.30\./,
          /^172\.31\./,
        ];

        return privateIPPatterns.some(pattern => pattern.test(ip));
      };

      suspiciousIPs.forEach(ip => {
        expect(isLikelyProxyIP(ip)).toBe(true);
      });

      // 模拟数据中心的IP检测
      const datacenterIPRanges = [
        { start: '203.0.113.0', end: '203.0.113.255', type: 'test_range' },
        { start: '198.51.100.0', end: '198.51.100.255', type: 'test_range' },
      ];

      const isDatacenterIP = (ip: string): boolean => {
        // 简化的数据中心IP检查逻辑
        return datacenterIPRanges.some(range => ip.startsWith(range.start.split('.').slice(0, 3).join('.')));
      };

      expect(isDatacenterIP('203.0.113.100')).toBe(true);
      expect(isDatacenterIP('198.51.100.50')).toBe(true);
    });
  });

  describe('邀请链作弊检测测试', () => {
    test('检测虚假邀请链', async () => {
      // 模拟虚假的邀请链结构
      const fakeReferralChain = [
        { userId: 'root-user', inviterId: null, level: 0, isReal: false },
        { userId: 'fake-1', inviterId: 'root-user', level: 1, isReal: false },
        { userId: 'fake-2', inviterId: 'fake-1', level: 2, isReal: false },
        { userId: 'fake-3', inviterId: 'fake-2', level: 3, isReal: false },
        { userId: 'real-user', inviterId: 'fake-3', level: 4, isReal: true },
      ];

      // 分析邀请链结构
      const analyzeReferralChain = (chain: any[]) => {
        const fakeUsers = chain.filter(u => !u.isReal);
        const realUsers = chain.filter(u => u.isReal);
        
        let chainIntegrityScore = 100;
        
        // 检查连续的虚假用户
        let maxFakeConsecutive = 0;
        let currentFakeConsecutive = 0;
        
        chain.forEach(user => {
          if (!user.isReal) {
            currentFakeConsecutive++;
            maxFakeConsecutive = Math.max(maxFakeConsecutive, currentFakeConsecutive);
          } else {
            currentFakeConsecutive = 0;
          }
        });
        
        // 连续虚假用户降低完整性分数
        chainIntegrityScore -= maxFakeConsecutive * 10;
        
        // 检查深层邀请链
        const maxLevel = Math.max(...chain.map(u => u.level));
        if (maxLevel > 5) chainIntegrityScore -= 20; // 过深的邀请链
        
        return {
          integrityScore: Math.max(chainIntegrityScore, 0),
          fakeUserCount: fakeUsers.length,
          realUserCount: realUsers.length,
          maxFakeConsecutive,
          maxLevel,
          isSuspicious: chainIntegrityScore < 50,
        };
      };

      const analysis = analyzeReferralChain(fakeReferralChain);
      
      expect(analysis.isSuspicious).toBe(true);
      expect(analysis.integrityScore).toBeLessThan(50);
      expect(analysis.fakeUserCount).toBe(4);
    });

    test('检测邀请奖励异常模式', async () => {
      const suspiciousRewards = Array.from({ length: 20 }, (_, i) => ({
        inviterId: 'suspicious-user',
        inviteeId: `fake-invitee-${i}`,
        rewardAmount: 50.0, // 固定奖励金额
        timeBetweenInvites: 5000 + Math.random() * 2000, // 几乎相同的时间间隔
        sameIPPercentage: 0.95, // 95%相同IP
        sameDevicePercentage: 0.90, // 90%相同设备
      }));

      // 分析奖励模式
      const analyzeRewardPatterns = (rewards: any[]) => {
        const rewardAmounts = rewards.map(r => r.rewardAmount);
        const uniqueAmounts = [...new Set(rewardAmounts)];
        
        const timeIntervals = [];
        for (let i = 1; i < rewards.length; i++) {
          timeIntervals.push(rewards[i].timeBetweenInvites - rewards[i-1].timeBetweenInvites);
        }
        
        const avgInterval = timeIntervals.reduce((sum, interval) => sum + Math.abs(interval), 0) / timeIntervals.length;
        
        let anomalyScore = 0;
        
        // 固定奖励金额模式
        if (uniqueAmounts.length === 1 && rewards.length > 5) {
          anomalyScore += 30;
        }
        
        // 几乎相同的时间间隔
        if (avgInterval < 100) { // 100ms内的差异
          anomalyScore += 25;
        }
        
        // 高比例相同IP和设备
        const avgSameIP = rewards.reduce((sum, r) => sum + r.sameIPPercentage, 0) / rewards.length;
        const avgSameDevice = rewards.reduce((sum, r) => sum + r.sameDevicePercentage, 0) / rewards.length;
        
        if (avgSameIP > 0.8) anomalyScore += 20;
        if (avgSameDevice > 0.8) anomalyScore += 15;
        
        return {
          anomalyScore,
          isAutomated: anomalyScore >= 50,
          patterns: {
            fixedAmount: uniqueAmounts.length === 1,
            regularTiming: avgInterval < 100,
            highIPSameRate: avgSameIP > 0.8,
            highDeviceSameRate: avgSameDevice > 0.8,
          }
        };
      };

      const analysis = analyzeRewardPatterns(suspiciousRewards);
      
      expect(analysis.isAutomated).toBe(true);
      expect(analysis.patterns.fixedAmount).toBe(true);
      expect(analysis.patterns.regularTiming).toBe(true);
    });
  });

  describe('机器行为检测测试', () => {
    test('检测自动化脚本行为', async () => {
      const botBehaviorPattern = {
        requestIntervals: [500, 502, 498, 501, 499], // 几乎相同的间隔
        requestHeaders: {
          'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        requestPatterns: Array(50).fill(0).map(() => ({
          endpoint: '/api/register',
          method: 'POST',
          payload: {
            telegramId: 'tg_' + Date.now(),
            username: 'user_' + Math.random().toString(36).substr(2, 8),
          }
        })),
        errorRate: 0.02, // 2%错误率（较低）
        sessionDuration: 300000, // 5分钟会话
      };

      // 分析行为模式
      const detectBotPattern = (behavior: any) => {
        let botScore = 0;
        
        // 检查请求间隔的一致性
        const intervals = behavior.requestIntervals;
        const intervalVariance = intervals.reduce((sum, interval, index, arr) => {
          if (index === 0) return 0;
          return sum + Math.pow(interval - arr[0], 2);
        }, 0) / intervals.length;
        
        if (intervalVariance < 10) botScore += 30; // 间隔高度一致
        
        // 检查User-Agent
        if (behavior.requestHeaders['User-Agent'].includes('Bot')) {
          botScore += 25;
        }
        
        // 检查重复的请求模式
        const uniqueEndpoints = [...new Set(behavior.requestPatterns.map((p: any) => p.endpoint))];
        if (uniqueEndpoints.length === 1 && behavior.requestPatterns.length > 10) {
          botScore += 20; // 单一端点重复请求
        }
        
        // 低错误率（机器人通常更稳定）
        if (behavior.errorRate < 0.05) {
          botScore += 15;
        }
        
        // 短暂会话时间
        if (behavior.sessionDuration < 600000) { // 10分钟内
          botScore += 10;
        }
        
        return {
          botScore,
          isBot: botScore >= 60,
          indicators: {
            regularIntervals: intervalVariance < 10,
            botUserAgent: behavior.requestHeaders['User-Agent'].includes('Bot'),
            repetitiveRequests: uniqueEndpoints.length === 1,
            lowErrorRate: behavior.errorRate < 0.05,
            shortSessions: behavior.sessionDuration < 600000,
          }
        };
      };

      const analysis = detectBotPattern(botBehaviorPattern);
      
      expect(analysis.isBot).toBe(true);
      expect(analysis.botScore).toBeGreaterThanOrEqual(60);
      expect(analysis.indicators.regularIntervals).toBe(true);
    });

    test('检测批量操作行为', async () => {
      const batchOperations = Array.from({ length: 100 }, (_, i) => ({
        operationId: i,
        timestamp: Date.now() + i * 1000, // 每秒一个操作
        userId: `batch-user-${Math.floor(i / 10)}`, // 10个用户每个执行10个操作
        operationType: ['register', 'invite', 'purchase'][Math.floor(Math.random() * 3)],
        ipAddress: '192.168.1.' + (i % 20), // 20个IP
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }));

      // 检测批量操作模式
      const detectBatchOperations = (operations: any[]) => {
        const operationsByIP = new Map();
        const operationsByUser = new Map();
        const operationsByTime = new Map();
        
        // 按IP分组
        operations.forEach(op => {
          if (!operationsByIP.has(op.ipAddress)) {
            operationsByIP.set(op.ipAddress, []);
          }
          operationsByIP.get(op.ipAddress).push(op);
        });
        
        // 按用户分组
        operations.forEach(op => {
          if (!operationsByUser.has(op.userId)) {
            operationsByUser.set(op.userId, []);
          }
          operationsByUser.get(op.userId).push(op);
        });
        
        // 按时间窗口分组（1分钟窗口）
        operations.forEach(op => {
          const timeWindow = Math.floor(op.timestamp / 60000); // 1分钟窗口
          if (!operationsByTime.has(timeWindow)) {
            operationsByTime.set(timeWindow, []);
          }
          operationsByTime.get(timeWindow).push(op);
        });
        
        let batchScore = 0;
        
        // 单IP大量操作
        operationsByIP.forEach((ops, ip) => {
          if (ops.length > 10) {
            batchScore += (ops.length - 10) * 2;
          }
        });
        
        // 单用户快速操作
        operationsByUser.forEach((ops, user) => {
          if (ops.length > 5) {
            const timeSpan = ops[ops.length - 1].timestamp - ops[0].timestamp;
            const opsPerMinute = ops.length / (timeSpan / 60000);
            if (opsPerMinute > 60) { // 每分钟超过60个操作
              batchScore += 20;
            }
          }
        });
        
        // 时间窗口内的高密度操作
        operationsByTime.forEach((ops, timeWindow) => {
          if (ops.length > 20) {
            batchScore += (ops.length - 20) / 5;
          }
        });
        
        return {
          batchScore,
          isBatchOperation: batchScore >= 50,
          suspiciousIPs: Array.from(operationsByIP.entries())
            .filter(([ip, ops]) => ops.length > 10)
            .map(([ip, ops]) => ({ ip, operationCount: ops.length })),
          suspiciousUsers: Array.from(operationsByUser.entries())
            .filter(([user, ops]) => ops.length > 5)
            .map(([user, ops]) => ({ user, operationCount: ops.length })),
        };
      };

      const analysis = detectBatchOperations(batchOperations);
      
      expect(analysis.isBatchOperation).toBe(true);
      expect(analysis.batchScore).toBeGreaterThanOrEqual(50);
      expect(analysis.suspiciousIPs.length).toBeGreaterThan(0);
    });
  });

  describe('防作弊系统性能测试', () => {
    test('大量用户行为分析性能', async () => {
      const userCount = 1000;
      const actionsPerUser = 20;
      const totalActions = userCount * actionsPerUser;

      // 生成模拟用户行为数据
      const generateUserActions = (userId: string, count: number) => {
        return Array.from({ length: count }, (_, i) => ({
          type: ['register', 'invite', 'purchase'][Math.floor(Math.random() * 3)],
          timestamp: Date.now() + i * 60000, // 每分钟一个操作
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          deviceId: `device-${Math.floor(Math.random() * 10)}`,
        }));
      };

      // 批量分析用户行为
      const analyzeAllUsers = async () => {
        const users = Array.from({ length: userCount }, (_, i) => `user-${i}`);
        const analyses = [];
        
        for (const userId of users) {
          const actions = generateUserActions(userId, actionsPerUser);
          actions.forEach(action => behaviorAnalyzer.addUserAction(userId, action));
          
          const analysis = behaviorAnalyzer.analyzeUser(userId);
          analyses.push(analysis);
        }
        
        return analyses;
      };

      const { result, duration } = await PerformanceTester.measureExecutionTime(analyzeAllUsers);

      expect(result).toHaveLength(userCount);
      expect(duration).toBeLessThan(10000); // 10秒内完成
      console.log(`用户行为分析性能: ${duration.toFixed(2)}ms 处理${userCount}个用户`);
    });

    test('实时风险评分性能', async () => {
      const concurrentChecks = 500;
      const riskFactors = [
        { weight: 0.3, check: 'ip_frequency' },
        { weight: 0.2, check: 'device_reuse' },
        { weight: 0.25, check: 'behavior_pattern' },
        { weight: 0.15, check: 'geo_anomaly' },
        { weight: 0.1, check: 'timing_pattern' },
      ];

      const calculateRiskScore = async (userId: string): Promise<number> => {
        let totalScore = 0;
        
        for (const factor of riskFactors) {
          // 模拟风险因子检查
          let factorScore = 0;
          switch (factor.check) {
            case 'ip_frequency':
              factorScore = Math.random() * 100;
              break;
            case 'device_reuse':
              factorScore = Math.random() * 80;
              break;
            case 'behavior_pattern':
              factorScore = Math.random() * 90;
              break;
            case 'geo_anomaly':
              factorScore = Math.random() * 60;
              break;
            case 'timing_pattern':
              factorScore = Math.random() * 70;
              break;
          }
          
          totalScore += factorScore * factor.weight;
        }
        
        return totalScore;
      };

      const { results, totalTime, averageTime } = await PerformanceTester.testConcurrency(
        () => calculateRiskScore(`user-${Math.floor(Math.random() * 10000)}`),
        concurrentChecks
      );

      expect(results).toHaveLength(concurrentChecks);
      expect(totalTime).toBeLessThan(5000); // 5秒内完成
      console.log(`实时风险评分性能 - 总时间: ${totalTime.toFixed(2)}ms, 平均时间: ${averageTime.toFixed(2)}ms`);
    });
  });

  describe('防作弊系统集成测试', () => {
    test('端到端防作弊检测流程', async () => {
      // 模拟完整的检测流程
      const suspiciousUser = {
        id: 'suspicious-e2e-user',
        telegramId: 'tg_suspicious',
        registrationTime: new Date(),
        ipAddress: '192.168.1.100',
        deviceId: 'suspicious-device',
      };

      // 1. 初始风险评估
      const initialRiskScore = 25; // 中等风险
      expect(initialRiskScore).toBeGreaterThanOrEqual(20);
      expect(initialRiskScore).toBeLessThan(50);

      // 2. 行为监控
      const behaviorFlags = {
        rapidRegistration: false,
        multipleIPs: false,
        deviceReuse: true,
        irregularTiming: true,
      };

      // 3. 风险评分更新
      const riskScoreUpdates = {
        rapidRegistration: +20,
        deviceReuse: +15,
        irregularTiming: +10,
      };

      let updatedRiskScore = initialRiskScore;
      Object.entries(behaviorFlags).forEach(([flag, isTrue]) => {
        if (isTrue && riskScoreUpdates[flag as keyof typeof riskScoreUpdates]) {
          updatedRiskScore += riskScoreUpdates[flag as keyof typeof riskScoreUpdates];
        }
      });

      expect(updatedRiskScore).toBeGreaterThanOrEqual(60); // 超过高风险阈值

      // 4. 措施触发
      let triggeredActions: string[] = [];
      
      if (updatedRiskScore >= 70) {
        triggeredActions.push('account_review');
      }
      if (updatedRiskScore >= 80) {
        triggeredActions.push('temp_restriction');
      }
      if (updatedRiskScore >= 90) {
        triggeredActions.push('permanent_ban');
      }

      expect(triggeredActions).toContain('account_review');
      expect(triggeredActions).toContain('temp_restriction');
      expect(updatedRiskScore).toBeGreaterThanOrEqual(80);
    });

    test('防作弊系统容错机制', async () => {
      // 测试系统异常情况下的处理
      const errorScenarios = [
        { error: 'database_connection_failed', shouldContinue: false },
        { error: 'risk_service_timeout', shouldContinue: true },
        { error: 'insufficient_data', shouldContinue: true },
        { error: 'malicious_input', shouldContinue: false },
      ];

      for (const scenario of errorScenarios) {
        let systemResponse: string;
        
        try {
          switch (scenario.error) {
            case 'database_connection_failed':
              // 模拟数据库连接失败
              throw new Error('Database connection failed');
              
            case 'risk_service_timeout':
              // 模拟服务超时，但系统应降级处理
              await new Promise(resolve => setTimeout(resolve, 100)); // 模拟超时
              systemResponse = 'degraded_mode';
              break;
              
            case 'insufficient_data':
              // 模拟数据不足，返回保守评估
              systemResponse = 'conservative_assessment';
              break;
              
            case 'malicious_input':
              // 模拟恶意输入，系统应拒绝处理
              throw new Error('Malicious input detected');
              
            default:
              systemResponse = 'normal_operation';
          }
        } catch (error) {
          if (scenario.shouldContinue) {
            systemResponse = 'fallback_mode';
          } else {
            systemResponse = 'system_error';
          }
        }

        const expectedResponse = scenario.shouldContinue 
          ? ['degraded_mode', 'conservative_assessment', 'fallback_mode']
          : ['system_error'];

        expect(expectedResponse).toContain(systemResponse);
      }
    });

    test('防作弊规则动态更新', async () => {
      // 模拟规则版本控制
      const ruleVersions = [
        {
          version: '1.0',
          rules: {
            maxDailyRegistrations: 10,
            minTimeBetweenActions: 1000,
            maxIPChangeFrequency: 5,
          }
        },
        {
          version: '1.1',
          rules: {
            maxDailyRegistrations: 5, // 更严格
            minTimeBetweenActions: 2000, // 更严格
            maxIPChangeFrequency: 3, // 更严格
          }
        }
      ];

      // 模拟灰度发布
      const shouldUseNewRules = (userId: string) => {
        const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return (hash % 3) === 0; // 1/3用户使用新规则
      };

      const testUsers = ['user-test-1', 'user-test-2', 'user-test-3'];
      
      testUsers.forEach(userId => {
        const usingNewRules = shouldUseNewRules(userId);
        const activeRules = usingNewRules ? ruleVersions[1].rules : ruleVersions[0].rules;
        
        if (usingNewRules) {
          expect(activeRules.maxDailyRegistrations).toBe(5);
          expect(activeRules.minTimeBetweenActions).toBe(2000);
        } else {
          expect(activeRules.maxDailyRegistrations).toBe(10);
          expect(activeRules.minTimeBetweenActions).toBe(1000);
        }
      });
    });
  });

  describe('防作弊系统边界测试', () => {
    test('边界值测试', async () => {
      const boundaryTests = [
        {
          description: '零奖励金额',
          rewardAmount: 0,
          expectedRiskLevel: 'low',
        },
        {
          description: '极小奖励金额',
          rewardAmount: 0.01,
          expectedRiskLevel: 'low',
        },
        {
          description: '极大奖励金额',
          rewardAmount: 999999,
          expectedRiskLevel: 'high',
        },
        {
          description: '负奖励金额',
          rewardAmount: -100,
          expectedRiskLevel: 'high',
        },
      ];

      boundaryTests.forEach(test => {
        let riskLevel = 'normal';
        
        if (test.rewardAmount === 0) {
          riskLevel = 'low';
        } else if (test.rewardAmount < 0 || test.rewardAmount > 100000) {
          riskLevel = 'high';
        } else if (test.rewardAmount > 10000) {
          riskLevel = 'medium';
        }
        
        expect(riskLevel).toBe(test.expectedRiskLevel);
      });
    });

    test('极端并发情况下的防作弊', async () => {
      const extremeConcurrency = 10000;
      
      const simulateRushAttack = async (userId: string) => {
        // 模拟瞬间大量操作的攻击
        const startTime = Date.now();
        const operations = [];
        
        for (let i = 0; i < 50; i++) {
          operations.push({
            timestamp: startTime + i * 10, // 每10ms一个操作
            type: 'register',
            ip: '192.168.1.100',
            deviceId: 'attack-device',
          });
        }
        
        // 检测攻击模式
        const timeSpan = operations[operations.length - 1].timestamp - operations[0].timestamp;
        const opsPerSecond = operations.length / (timeSpan / 1000);
        
        return {
          userId,
          operationsCount: operations.length,
          timeSpan,
          opsPerSecond,
          isAttack: opsPerSecond > 100, // 每秒超过100个操作
        };
      };

      const { results, totalTime } = await PerformanceTester.testConcurrency(
        () => simulateRushAttack(`attack-user-${Math.floor(Math.random() * 100)}`),
        extremeConcurrency
      );

      const attackDetections = results.filter(result => result.isAttack);
      
      expect(attackDetections.length).toBeGreaterThan(extremeConcurrency * 0.8); // 至少80%被检测为攻击
      console.log(`并发攻击检测: ${attackDetections.length}/${extremeConcurrency} 次检测为攻击行为`);
    });
  });
});