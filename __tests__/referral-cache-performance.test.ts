/**
 * 推荐系统缓存性能测试
 * 测试Redis缓存和各种缓存策略的性能表现
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { TestDataGenerator, PerformanceTester, testConfig } from './test-config';
import { createClient } from 'redis';

// 模拟缓存客户端（实际测试中需要真实的Redis连接）
class MockCacheClient {
  private store: Map<string, any> = new Map();
  private ttl: Map<string, number> = new Map();

  async get(key: string): Promise<string | null> {
    const expiration = this.ttl.get(key);
    if (expiration && Date.now() > expiration) {
      this.store.delete(key);
      this.ttl.delete(key);
      return null;
    }
    return this.store.get(key) || null;
  }

  async set(key: string, value: string, options?: { EX: number }): Promise<'OK'> {
    this.store.set(key, value);
    if (options?.EX) {
      this.ttl.set(key, Date.now() + (options.EX * 1000));
    }
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    this.ttl.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    const value = await this.get(key);
    return value !== null ? 1 : 0;
  }

  async flushall(): Promise<'OK'> {
    this.store.clear();
    this.ttl.clear();
    return 'OK';
  }
}

describe('推荐系统缓存性能测试', () => {
  let prisma: PrismaClient;
  let testDataGenerator: TestDataGenerator;
  let cache: MockCacheClient;
  let redisClient: any;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testConfig.database.url
        }
      }
    });
    testDataGenerator = new TestDataGenerator(prisma);
    
    // 初始化缓存客户端（测试环境中使用模拟客户端）
    cache = new MockCacheClient();
    
    // 尝试连接真实Redis（如果可用）
    try {
      redisClient = createClient({ url: testConfig.redis.url });
      await redisClient.connect();
    } catch (error) {
      console.log('Redis连接失败，使用模拟缓存客户端进行测试');
      redisClient = cache;
    }
    
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (redisClient !== cache) {
      await redisClient.disconnect();
    }
  });

  beforeEach(async () => {
    await cache.flushall();
    await prisma.referralRelationships.deleteMany({
      where: { referrerUserId: { startsWith: 'cache-test-' } }
    });
    await prisma.users.deleteMany({
      where: { id: { startsWith: 'cache-test-' } }
    });
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cache.flushall();
  });

  describe('缓存命中率测试', () => {
    test('推荐关系缓存命中率', async () => {
      const userId = 'cache-test-user-1';
      const cacheKey = `referral:user:${userId}`;
      
      // 首次查询 - 缓存未命中
      const cacheMissStart = process.hrtime.bigint();
      const directQuery = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          referrerRelationships: true,
          refereeRelationships: true
        }
      });
      const cacheMissTime = Number(process.hrtime.bigint() - cacheMissStart) / 1000000;

      // 存储到缓存
      await cache.set(cacheKey, JSON.stringify(directQuery), { EX: 3600 });

      // 第二次查询 - 缓存命中
      const cacheHitStart = process.hrtime.bigint();
      const cachedData = await cache.get(cacheKey);
      const cachedQuery = cachedData ? JSON.parse(cachedData) : null;
      const cacheHitTime = Number(process.hrtime.bigint() - cacheHitStart) / 1000000;

      expect(cachedQuery).not.toBeNull();
      expect(cacheMissTime).toBeGreaterThan(cacheHitTime);

      const hitRatio = (cacheMissTime - cacheHitTime) / cacheMissTime;
      console.log(`缓存命中率提升: ${(hitRatio * 100).toFixed(2)}%`);
      console.log(`缓存未命中耗时: ${cacheMissTime.toFixed(2)}ms`);
      console.log(`缓存命中耗时: ${cacheHitTime.toFixed(2)}ms`);
    });

    test('推荐统计缓存性能', async () => {
      const cacheKey = 'referral:stats:global';
      const queryCount = 100;

      // 创建测试数据
      const users = Array(50).fill(0).map((_, i) =>
        testDataGenerator.generateUser({
          id: `cache-test-stats-${i}`,
          telegramId: `stats_${i}`,
        })
      );

      await prisma.users.createMany({ data: users });

      // 创建推荐关系
      const relationships = Array(100).fill(0).map((_, i) => ({
        referrerUserId: `cache-test-stats-${i % 50}`,
        refereeUserId: `cache-test-stats-${(i + 1) % 50}`,
        referralLevel: (i % 3) + 1,
      }));

      await prisma.referralRelationships.createMany({ data: relationships });

      // 测试多次查询统计
      const queryTimes: number[] = [];
      
      for (let i = 0; i < queryCount; i++) {
        const startTime = process.hrtime.bigint();
        
        const stats = await cache.get(cacheKey);
        if (!stats) {
          // 缓存未命中，查询数据库
          const dbStats = await prisma.referralRelationships.groupBy({
            by: ['referralLevel'],
            _count: { _all: true }
          });
          
          // 存储到缓存
          await cache.set(cacheKey, JSON.stringify(dbStats), { EX: 300 });
        }
        
        const queryTime = Number(process.hrtime.bigint() - startTime) / 1000000;
        queryTimes.push(queryTime);
      }

      const avgQueryTime = queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length;
      const minQueryTime = Math.min(...queryTimes);
      const maxQueryTime = Math.max(...queryTimes);

      console.log(`推荐统计查询性能:`);
      console.log(`平均耗时: ${avgQueryTime.toFixed(2)}ms`);
      console.log(`最小耗时: ${minQueryTime.toFixed(2)}ms`);
      console.log(`最大耗时: ${maxQueryTime.toFixed(2)}ms`);

      // 缓存优化后，平均查询时间应该显著降低
      expect(avgQueryTime).toBeLessThan(10); // 平均查询时间应小于10ms
    });
  });

  describe('缓存TTL策略测试', () => {
    test('不同TTL设置的缓存效果', async () => {
      const userId = 'cache-test-ttl-user';
      const testCases = [
        { ttl: 60, description: '1分钟缓存' },
        { ttl: 300, description: '5分钟缓存' },
        { ttl: 3600, description: '1小时缓存' },
      ];

      for (const testCase of testCases) {
        const cacheKey = `referral:user:${userId}:ttl${testCase.ttl}`;
        
        // 存储数据到缓存
        const testData = { userId, referralCount: 5, level: 1 };
        await cache.set(cacheKey, JSON.stringify(testData), { EX: testCase.ttl });

        // 立即检查缓存
        const immediateData = await cache.get(cacheKey);
        expect(immediateData).not.toBeNull();

        // 等待一段时间后检查缓存
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms
        
        const afterWaitData = await cache.get(cacheKey);
        expect(afterWaitData).not.toBeNull();

        console.log(`${testCase.description} - 数据仍可访问`);
      }
    });

    test('缓存过期自动清理', async () => {
      const cacheKey = 'cache-test-expire';
      const shortTTL = 1; // 1秒

      // 存储数据
      await cache.set(cacheKey, 'test-data', { EX: shortTTL });

      // 立即检查 - 应该存在
      const immediateData = await cache.get(cacheKey);
      expect(immediateData).toBe('test-data');

      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 1100));

      // 检查是否已过期
      const expiredData = await cache.get(cacheKey);
      expect(expiredData).toBeNull();

      console.log('缓存过期自动清理测试通过');
    });
  });

  describe('缓存并发性能', () => {
    test('高并发缓存读写', async () => {
      const concurrentOperations = 1000;
      const cacheKey = 'cache-test-concurrent';
      
      // 并发写入测试
      const writeOperations = Array(concurrentOperations).fill(0).map((_, i) => 
        cache.set(`${cacheKey}:write:${i}`, `data-${i}`, { EX: 60 })
      );

      const writeStart = process.hrtime.bigint();
      await Promise.all(writeOperations);
      const writeTime = Number(process.hrtime.bigint() - writeStart) / 1000000;

      // 并发读取测试
      const readOperations = Array(concurrentOperations).fill(0).map((_, i) => 
        cache.get(`${cacheKey}:write:${i}`)
      );

      const readStart = process.hrtime.bigint();
      const readResults = await Promise.all(readOperations);
      const readTime = Number(process.hrtime.bigint() - readStart) / 1000000;

      // 验证结果
      const successCount = readResults.filter(result => result !== null).length;
      const successRate = (successCount / concurrentOperations) * 100;

      console.log(`并发性能测试结果:`);
      console.log(`写入操作: ${concurrentOperations}次，耗时: ${writeTime.toFixed(2)}ms`);
      console.log(`读取操作: ${concurrentOperations}次，耗时: ${readTime.toFixed(2)}ms`);
      console.log(`成功率: ${successRate.toFixed(2)}%`);

      expect(successRate).toBeGreaterThan(99); // 成功率应大于99%
      expect(writeTime).toBeLessThan(5000); // 写入应在5秒内完成
      expect(readTime).toBeLessThan(1000); // 读取应在1秒内完成
    });

    test('缓存击穿测试', async () => {
      const cacheKey = 'cache-test-thundering-herd';
      const concurrentRequests = 500;

      // 模拟缓存击穿场景 - 同时请求一个不存在的key
      const requests = Array(concurrentRequests).fill(0).map(async () => {
        const cached = await cache.get(cacheKey);
        if (cached === null) {
          // 模拟数据库查询
          const data = { id: 'thundering-herd-test', value: Date.now() };
          
          // 使用分布式锁防止缓存击穿
          const lockKey = `lock:${cacheKey}`;
          const lockAcquired = await cache.set(lockKey, 'locked', { EX: 10, NX: true });
          
          if (lockAcquired === 'OK') {
            try {
              await new Promise(resolve => setTimeout(resolve, 50)); // 模拟数据库查询延迟
              await cache.set(cacheKey, JSON.stringify(data), { EX: 300 });
              return data;
            } finally {
              await cache.del(lockKey);
            }
          }
        }
        return cached ? JSON.parse(cached) : null;
      });

      const startTime = process.hrtime.bigint();
      const results = await Promise.all(requests);
      const totalTime = Number(process.hrtime.bigint() - startTime) / 1000000;

      // 验证结果
      const uniqueResults = results.filter((result, index, self) => 
        index === self.findIndex(r => r && r.id === result.id)
      );

      console.log(`缓存击穿测试结果:`);
      console.log(`并发请求: ${concurrentRequests}次`);
      console.log(`总耗时: ${totalTime.toFixed(2)}ms`);
      console.log(`唯一结果数: ${uniqueResults.length}`);
      console.log(`缓存击穿防护有效: ${uniqueResults.length === 1 ? '是' : '否'}`);

      expect(uniqueResults.length).toBe(1); // 应该只有一个唯一结果
      expect(totalTime).toBeLessThan(3000); // 总耗时应在3秒内
    });
  });

  describe('缓存内存使用测试', () => {
    test('大量数据缓存内存占用', async () => {
      const dataSize = 10000;
      const startMemory = PerformanceTester.getMemoryUsage();
      
      // 批量存储数据
      const data: any[] = [];
      for (let i = 0; i < dataSize; i++) {
        const key = `memory-test-${i}`;
        const value = {
          id: i,
          userId: `cache-test-user-${i}`,
          referrals: Array(10).fill(0).map((_, j) => ({
            level: j + 1,
            count: Math.floor(Math.random() * 100)
          })),
          timestamp: Date.now()
        };
        
        await cache.set(key, JSON.stringify(value), { EX: 3600 });
        data.push(value);
      }

      const peakMemory = PerformanceTester.getMemoryUsage();
      const memoryIncrease = peakMemory.heapUsed - startMemory.heapUsed;

      console.log(`内存使用情况:`);
      console.log(`初始内存: ${startMemory.heapUsed}MB`);
      console.log(`峰值内存: ${peakMemory.heapUsed}MB`);
      console.log(`内存增长: ${memoryIncrease.toFixed(2)}MB`);
      console.log(`平均每条数据占用: ${(memoryIncrease * 1024 / dataSize).toFixed(2)}KB`);

      // 内存增长应该在合理范围内（每个数据项小于1KB）
      expect(memoryIncrease).toBeLessThan(50); // 内存增长应小于50MB
    });

    test('缓存淘汰策略验证', async () => {
      const maxCacheSize = 1000;
      let currentSize = 0;

      // 模拟LRU缓存实现
      const lruCache = new Map<string, any>();

      const setWithLimit = async (key: string, value: any, ttl: number = 3600) => {
        if (lruCache.size >= maxCacheSize) {
          // 删除最久未使用的项
          const firstKey = lruCache.keys().next().value;
          lruCache.delete(firstKey);
        }
        
        lruCache.set(key, { value, expiry: Date.now() + (ttl * 1000) });
      };

      // 填充缓存超过限制
      for (let i = 0; i < maxCacheSize + 100; i++) {
        await setWithLimit(`lru-test-${i}`, `data-${i}`);
      }

      // 验证缓存大小被限制
      expect(lruCache.size).toBeLessThanOrEqual(maxCacheSize);
      
      console.log(`LRU缓存测试: 设置${maxCacheSize + 100}项，实际缓存${lruCache.size}项`);
    });
  });

  describe('缓存预热测试', () => {
    test('系统启动时缓存预热', async () => {
      // 模拟系统启动时的缓存预热过程
      const preloadData = {
        globalStats: { totalReferrals: 1000, activeUsers: 500 },
        topReferrers: Array(20).fill(0).map((_, i) => ({
          userId: `top-referrer-${i}`,
          referralCount: 100 - i
        })),
        systemConfigs: {
          maxReferralDepth: 3,
          rewardRates: { l1: 0.05, l2: 0.03, l3: 0.02 }
        }
      };

      const preloadStart = process.hrtime.bigint();
      
      // 预热缓存
      await Promise.all([
        cache.set('referral:stats:global', JSON.stringify(preloadData.globalStats), { EX: 3600 }),
        cache.set('referral:top:referrers', JSON.stringify(preloadData.topReferrers), { EX: 1800 }),
        cache.set('referral:config:system', JSON.stringify(preloadData.systemConfigs), { EX: 7200 }),
      ]);

      const preloadTime = Number(process.hrtime.bigint() - preloadStart) / 1000000;

      // 验证预热数据
      const globalStats = await cache.get('referral:stats:global');
      const topReferrers = await cache.get('referral:top:referrers');
      const configs = await cache.get('referral:config:system');

      expect(globalStats).not.toBeNull();
      expect(topReferrers).not.toBeNull();
      expect(configs).not.toBeNull();

      console.log(`缓存预热完成，耗时: ${preloadTime.toFixed(2)}ms`);
      console.log(`预热数据: 统计信息、推荐排行榜、系统配置`);
      
      expect(preloadTime).toBeLessThan(1000); // 预热应在1秒内完成
    });
  });

  describe('缓存降级测试', () => {
    test('缓存失效时的降级策略', async () => {
      const userId = 'cache-test-fallback-user';
      const cacheKey = `referral:user:${userId}`;

      // 模拟缓存失效场景
      const getUserWithFallback = async (userId: string) => {
        const cached = await cache.get(cacheKey);
        
        if (cached) {
          return { 
            source: 'cache', 
            data: JSON.parse(cached),
            responseTime: 1
          };
        }

        // 缓存失效，查询数据库
        const startTime = process.hrtime.bigint();
        const dbData = await prisma.users.findUnique({
          where: { id: userId },
          include: { referrerRelationships: true }
        });
        const responseTime = Number(process.hrtime.bigint() - startTime) / 1000000;

        if (dbData) {
          // 将数据重新放入缓存（短时间缓存）
          await cache.set(cacheKey, JSON.stringify(dbData), { EX: 60 });
        }

        return { 
          source: 'database', 
          data: dbData,
          responseTime 
        };
      };

      // 首次查询 - 应该从数据库获取
      const firstResult = await getUserWithFallback(userId);
      expect(firstResult.source).toBe('database');
      expect(firstResult.data).toBeNull(); // 用户不存在

      // 创建测试用户
      await prisma.users.create({
        data: testDataGenerator.generateUser({
          id: userId,
          telegramId: 'cache_fallback_test',
        })
      });

      // 第二次查询 - 应该从缓存获取
      const secondResult = await getUserWithFallback(userId);
      expect(secondResult.source).toBe('cache');
      expect(secondResult.data).not.toBeNull();

      console.log(`缓存降级测试:`);
      console.log(`数据库查询耗时: ${firstResult.responseTime.toFixed(2)}ms`);
      console.log(`缓存查询耗时: ${secondResult.responseTime.toFixed(2)}ms`);
      console.log(`性能提升: ${((firstResult.responseTime - secondResult.responseTime) / firstResult.responseTime * 100).toFixed(2)}%`);
    });
  });
});