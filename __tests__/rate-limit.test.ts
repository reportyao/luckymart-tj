import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import Redis from 'ioredis';
import { RateLimitManager, RATE_LIMIT_PRESETS, createCompositeIdentifier } from '@/lib/rate-limit';
import { rateLimitMonitor } from '@/lib/rate-limit-monitor';
import { getLogger } from '@/lib/logger';
/**
 * 速率限制系统测试
 * 验证不同限流策略和API保护的有效性
 */


// Mock Redis
jest.mock('ioredis');
jest.mock('@/lib/redis-cache', () => ({
  redisClient: {
    isConnected: jest.fn().mockReturnValue(true),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    eval: jest.fn(),
    zremrangebyscore: jest.fn(),
    zcard: jest.fn(),
    zadd: jest.fn(),
    expire: jest.fn(),
    incr: jest.fn(),
    keys: jest.fn(),
    disconnect: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG')
  }
}));

describe('Rate Limit System Tests', () => {
  let redis: Redis;
  let manager: RateLimitManager;
  const mockRedis = redisClient as any;

  beforeAll(() => {
    redis = new Redis({
      host: 'localhost',
      port: 6379
    });
    manager = new RateLimitManager(redis, RATE_LIMIT_PRESETS.GENERAL_API);
  });

  afterAll(async () => {
    if (redis) {
      await redis.disconnect();
    }
  });

  describe('Rate Limit Strategies', () => {
    test('sliding window should work correctly', async () => {
      const config = { ...RATE_LIMIT_PRESETS.GENERAL_API };
      config.strategy = 'sliding_window';
      config.windowMs = 60000; // 1 minute
      config.maxRequests = 3;
      
      const testManager = new RateLimitManager(redis, config);
      const identifier = 'test_sliding_user';
      const endpoint = '/api/test';

      // First request should succeed
      let result = await testManager.check(identifier, endpoint);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);

      // Second request should succeed
      result = await testManager.check(identifier, endpoint);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);

      // Third request should succeed
      result = await testManager.check(identifier, endpoint);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);

      // Fourth request should be blocked
      result = await testManager.check(identifier, endpoint);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    test('fixed window should work correctly', async () => {
      const config = { ...RATE_LIMIT_PRESETS.GENERAL_API };
      config.strategy = 'fixed_window';
      config.windowMs = 60000; // 1 minute
      config.maxRequests = 2;
      
      const testManager = new RateLimitManager(redis, config);
      const identifier = 'test_fixed_user';
      const endpoint = '/api/test';

      // First request should succeed
      let result = await testManager.check(identifier, endpoint);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);

      // Second request should succeed
      result = await testManager.check(identifier, endpoint);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);

      // Third request should be blocked
      result = await testManager.check(identifier, endpoint);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    test('token bucket should work correctly', async () => {
      const config = { ...RATE_LIMIT_PRESETS.GENERAL_API };
      config.strategy = 'token_bucket';
      config.windowMs = 60000; // 1 minute
      config.maxRequests = 2;
      
      const testManager = new RateLimitManager(redis, config);
      const identifier = 'test_bucket_user';
      const endpoint = '/api/test';

      // Mock Redis eval to return token bucket simulation
      mockRedis.eval.mockResolvedValue([1, 1, Date.now()]); // allowed, remaining tokens, reset time

      let result = await testManager.check(identifier, endpoint);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);

      // Second token should be consumed
      mockRedis.eval.mockResolvedValue([1, 0, Date.now()]);
      result = await testManager.check(identifier, endpoint);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);

      // Third request should be blocked (no tokens)
      mockRedis.eval.mockResolvedValue([0, 0, Date.now()]);
      result = await testManager.check(identifier, endpoint);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    test('leaky bucket should work correctly', async () => {
      const config = { ...RATE_LIMIT_PRESETS.GENERAL_API };
      config.strategy = 'leaky_bucket';
      config.windowMs = 60000; // 1 minute
      config.maxRequests = 2;
      
      const testManager = new RateLimitManager(redis, config);
      const identifier = 'test_leaky_user';
      const endpoint = '/api/test';

      // Mock Redis eval to return leaky bucket simulation
      mockRedis.eval.mockResolvedValue([1, 1, Date.now()]); // allowed, remaining capacity, reset time

      let result = await testManager.check(identifier, endpoint);
      expect(result.allowed).toBe(true);

      result = await testManager.check(identifier, endpoint);
      expect(result.allowed).toBe(true);

      // Bucket should be full, block next request
      mockRedis.eval.mockResolvedValue([0, 0, Date.now()]);
      result = await testManager.check(identifier, endpoint);
      expect(result.allowed).toBe(false);
    });
  });

  describe('Payment API Rate Limits', () => {
    test('recharge API should have strict limits', async () => {
      const config = RATE_LIMIT_PRESETS.RECHARGE;
      const testManager = new RateLimitManager(redis, config);
      const identifier = 'recharge_user_123';
      const endpoint = '/api/payment/recharge';

      // Should allow first few requests
      for (let i = 0; i < 5; i++) {
        const result = await testManager.check(identifier, endpoint);
        if (i < 5) {
          expect(result.allowed).toBe(true);
        }
      }

      // Should block excessive requests
      const blockedResult = await testManager.check(identifier, endpoint);
      expect(blockedResult.allowed).toBe(false);
    });

    test('withdraw API should have very strict limits', async () => {
      const config = RATE_LIMIT_PRESETS.WITHDRAW_CRITICAL;
      const testManager = new RateLimitManager(redis, config);
      const identifier = 'withdraw_user_123';
      const endpoint = '/api/withdraw/create';

      // Should allow very limited requests
      const result1 = await testManager.check(identifier, endpoint);
      expect(result1.allowed).toBe(true);

      const result2 = await testManager.check(identifier, endpoint);
      expect(result2.allowed).toBe(true);

      const result3 = await testManager.check(identifier, endpoint);
      expect(result3.allowed).toBe(true);

      // Should block additional requests
      const blockedResult = await testManager.check(identifier, endpoint);
      expect(blockedResult.allowed).toBe(false);
    });

    test('payment critical API should have minimum limits', async () => {
      const config = RATE_LIMIT_PRESETS.PAYMENT_CRITICAL;
      const testManager = new RateLimitManager(redis, config);
      const identifier = 'payment_user_123';
      const endpoint = '/api/payment/critical';

      // Should allow minimum requests
      const result1 = await testManager.check(identifier, endpoint);
      expect(result1.allowed).toBe(true);

      const result2 = await testManager.check(identifier, endpoint);
      expect(result2.allowed).toBe(true);

      const result3 = await testManager.check(identifier, endpoint);
      expect(result3.allowed).toBe(true);

      // Should immediately block additional requests
      const blockedResult = await testManager.check(identifier, endpoint);
      expect(blockedResult.allowed).toBe(false);
    });
  });

  describe('Composite Identifiers', () => {
    test('should create composite identifier correctly', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header) => {
            const headers = {
              'x-real-ip': '192.168.1.100',
              'user-agent': 'Mozilla/5.0 Test Browser',
              'accept-language': 'en-US,en;q=0.9',
              'accept-encoding': 'gzip, deflate, br'
            };
            return headers[header.toLowerCase()];
          })
        }
      } as any;

      // Test with IP only
      let identifier = createCompositeIdentifier(mockRequest, {
        useIP: true,
        useUserId: false,
        useDeviceFingerprint: false
      });
      expect(identifier).toContain('ip:192.168.1.100');

      // Test with IP and user
      identifier = createCompositeIdentifier(mockRequest, {
        useIP: true,
        useUserId: true,
        userId: 'user123',
        useDeviceFingerprint: false
      });
      expect(identifier).toContain('ip:192.168.1.100');
      expect(identifier).toContain('user:user123');

      // Test with all components
      identifier = createCompositeIdentifier(mockRequest, {
        useIP: true,
        useUserId: true,
        useDeviceFingerprint: true,
        userId: 'user123'
      });
      expect(identifier).toContain('ip:192.168.1.100');
      expect(identifier).toContain('user:user123');
      expect(identifier).toContain('device:');
    });
  });

  describe('Rate Limit Monitor', () => {
    test('should record metrics correctly', () => {
      const metric = {
        timestamp: Date.now(),
        endpoint: '/api/test',
        identifier: 'user123',
        hits: 5,
        blocked: true,
        strategy: 'sliding_window',
        windowMs: 60000,
        limit: 10,
        remaining: 0,
        resetTime: Date.now() + 60000,
        responseTime: 150
      };

      rateLimitMonitor.recordMetric(metric);
      
      const status = rateLimitMonitor.getMonitoringStatus();
      expect(status.totalChecks).toBeGreaterThan(0);
    });

    test('should handle alert rules', () => {
      const alertRule = {
        id: 'test_alert',
        name: 'Test Alert',
        condition: {
          metric: 'block_rate',
          operator: 'gt',
          value: 50
        },
        threshold: 1,
        timeframe: 60000,
        severity: 'high' as const,
        enabled: true,
        cooldown: 300000,
        notificationChannels: []
      };

      rateLimitMonitor.addAlertRule(alertRule);
      
      const status = rateLimitMonitor.getMonitoringStatus();
      expect(status.isActive).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    test('should handle high frequency requests efficiently', async () => {
      const config = { ...RATE_LIMIT_PRESETS.GENERAL_API };
      config.windowMs = 1000; // 1 second
      config.maxRequests = 100;
      
      const testManager = new RateLimitManager(redis, config);
      const identifier = 'perf_test_user';
      const endpoint = '/api/performance';

      const startTime = Date.now();
      const requests = 100;

      // Send multiple concurrent requests
      const promises = Array.from({ length: requests }, () =>;
        testManager.check(identifier, endpoint)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // Should complete quickly
      expect(endTime - startTime).toBeLessThan(5000); // Less than 5 seconds

      // Should allow first 100 requests
      const allowedCount = results.filter(r => r.allowed).length;
      expect(allowedCount).toBe(100);

      // Should block additional requests
      const blockedResult = await testManager.check(identifier, endpoint);
      expect(blockedResult.allowed).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle Redis connection failures gracefully', async () => {
      // Mock Redis to simulate connection failure
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await manager.check('test_user', '/api/test');
      
      // Should allow request to pass through on Redis failure
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(manager['config'].maxRequests);
    });

    test('should handle malformed requests', async () => {
      const identifier = ''; // Empty identifier;
      const endpoint = '';   // Empty endpoint;

      const result = await manager.check(identifier, endpoint);
      
      // Should handle gracefully
      expect(result.allowed).toBe(true); // Should still allow (fail open)
    });
  });
});

describe('Integration Tests', () => {
  test('should demonstrate complete rate limiting workflow', async () => {
    const logger = getLogger();
    
    // 1. Configure rate limits for different endpoints
    const paymentConfig = RATE_LIMIT_PRESETS.PAYMENT_CRITICAL;
    const rechargeConfig = RATE_LIMIT_PRESETS.RECHARGE;
    
    // 2. Create managers with different strategies
    const paymentManager = new RateLimitManager(redis, paymentConfig);
    const rechargeManager = new RateLimitManager(redis, rechargeConfig);
    
    // 3. Register with monitor
    rateLimitMonitor.registerManager('payment', paymentManager);
    rateLimitMonitor.registerManager('recharge', rechargeManager);
    
    // 4. Simulate payment attempts
    const paymentIdentifier = 'payment_user_456';
    for (let i = 0; i < 10; i++) {
      const result = await paymentManager.check(paymentIdentifier, '/api/payment/test');
      if (!result.allowed) {
        logger.info('Payment rate limit triggered', {
          attempt: i + 1,
          identifier: paymentIdentifier,
          remaining: result.remaining
        });
        break;
      }
    }
    
    // 5. Simulate recharge attempts
    const rechargeIdentifier = 'recharge_user_789';
    for (let i = 0; i < 10; i++) {
      const result = await rechargeManager.check(rechargeIdentifier, '/api/recharge/test');
      if (!result.allowed) {
        logger.info('Recharge rate limit triggered', {
          attempt: i + 1,
          identifier: rechargeIdentifier,
          remaining: result.remaining
        });
        break;
      }
    }
    
    // 6. Check monitoring status
    const status = rateLimitMonitor.getMonitoringStatus();
    logger.info('Rate limit monitoring status', status);
    
    expect(status.totalChecks).toBeGreaterThan(0);
    expect(status.blockRate).toBeGreaterThanOrEqual(0);
  });
});

// 测试数据生成工具
export function generateTestMetrics(count: number) {
  const metrics = [];
  const endpoints = ['/api/payment/recharge', '/api/withdraw/create', '/api/lottery/participate'];
  const strategies = ['sliding_window', 'fixed_window', 'token_bucket', 'leaky_bucket'];
  
  for (let i = 0; i < count; i++) {
    metrics.push({
      timestamp: Date.now() - Math.random() * 3600000, // Random time within last hour
      endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
      identifier: `user_${Math.floor(Math.random() * 100)}`,
      hits: Math.floor(Math.random() * 50) + 1,
      blocked: Math.random() > 0.8, // 20% blocked rate
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      windowMs: [60000, 300000, 3600000][Math.floor(Math.random() * 3)],
      limit: [3, 5, 10, 60][Math.floor(Math.random() * 4)],
      remaining: Math.floor(Math.random() * 10),
      resetTime: Date.now() + Math.random() * 3600000,
      responseTime: Math.random() * 1000
    });
}
  
  return metrics;
}