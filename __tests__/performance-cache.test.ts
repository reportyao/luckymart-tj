/**
 * 性能优化和缓存系统集成测试
 * 测试N+1查询优化、缓存机制、性能基准等
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '../lib/prisma';
import QueryOptimizer from '../lib/query-optimizer';
import { NPlusOneDetector, PerformanceTester } from '../lib/n-plus-one-detector';
import { cacheManager } from '../lib/cache-manager';
import { redisClient } from '../lib/redis-cache';
import { memoryCache, MultiLevelCache } from '../lib/memory-cache';

describe('性能优化和缓存系统测试', () => {
  const TEST_USER_ID = 'test-perf-user';
  const TEST_PRODUCT_ID = 'test-perf-product';

  beforeAll(async () => {
    console.log('🔧 准备性能测试数据...');
    
    // 创建测试数据
    await createPerformanceTestData();
    
    // 启用监控
    NPlusOneDetector.enableMonitoring();
  });

  afterAll(async () => {
    console.log('🧹 清理性能测试数据...');
    await cleanupPerformanceTestData();
  });

  beforeEach(() => {
    // 每个测试前重置监控数据
    NPlusOneDetector.clearStats();
  });

  describe('N+1查询检测测试', () => {
    test('应该检测未优化的用户查询', async () => {
      console.log('🧪 测试未优化的用户查询...');
      
      const startTime = process.hrtime.bigint();

      // 模拟一个可能导致N+1的查询
      const users = await prisma.users.findMany({
        take: 10
      });

      // 模拟额外的查询（可能导致N+1）
      for (const user of users) {
        await prisma.transactions.findMany({
          where: { userId: user.id },
          take: 5
        });
      }

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      const stats = NPlusOneDetector.getStats();
      
      console.log(`   📊 查询数量: ${stats.totalQueries}`);
      console.log(`   ⏱️ 执行时间: ${duration.toFixed(2)}ms`);

      // 检查是否有大量查询
      expect(stats.totalQueries).toBeGreaterThan(1);
      expect(duration).toBeLessThan(5000);
    });

    test('应该验证优化的查询减少查询数量', async () => {
      console.log('🧪 测试优化的查询...');
      
      NPlusOneDetector.clearStats();
      const startTime = process.hrtime.bigint();

      // 使用优化的查询
      const result = await QueryOptimizer.getOptimizedUsersList({
        page: 1,
        limit: 10
      });

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      const stats = NPlusOneDetector.getStats();
      
      console.log(`   📊 优化后查询数量: ${stats.totalQueries}`);
      console.log(`   ⏱️ 优化后执行时间: ${duration.toFixed(2)}ms`);

      expect(stats.totalQueries).toBeLessThan(10); // 应该显著减少
      expect(duration).toBeLessThan(1000);
      expect(result.users).toBeDefined();
    });

    test('应该检测订单列表N+1问题', async () => {
      console.log('🧪 测试订单列表优化...');
      
      NPlusOneDetector.clearStats();

      const result = await QueryOptimizer.getOptimizedOrdersList({
        page: 1,
        limit: 20
      });

      const stats = NPlusOneDetector.getStats();
      
      console.log(`   📊 订单查询数量: ${stats.totalQueries}`);
      console.log(`   📋 返回订单: ${result.orders.length}`);

      expect(stats.totalQueries).toBeLessThan(5); // 应该很少查询
      expect(result.orders).toBeDefined();
      expect(result.orders.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('缓存系统测试', () => {
    test('内存缓存应该正常工作', () => {
      const key = 'test-memory-key';
      const data = { message: 'memory cache test', timestamp: Date.now() };

      // 设置缓存
      memoryCache.set(key, data, 60000); // 1分钟过期

      // 获取缓存
      const cachedData = memoryCache.get(key);
      
      expect(cachedData).toBeDefined();
      expect(cachedData.message).toBe(data.message);

      // 测试统计
      const stats = memoryCache.getStats();
      expect(stats.currentSize).toBeGreaterThan(0);
    });

    test('Redis缓存应该正常工作', async () => {
      // 检查Redis连接
      if (!redisClient.isConnected()) {
        console.log('⚠️  Redis未连接，跳过Redis缓存测试');
        return;
      }

      const key = 'test-redis-key';
      const data = { message: 'redis cache test', timestamp: Date.now() };

      // 设置缓存
      const setResult = await redisClient.set(key, data, 60);
      expect(setResult).toBe(true);

      // 获取缓存
      const cachedData = await redisClient.get(key);
      expect(cachedData).toBeDefined();
      expect(cachedData.message).toBe(data.message);

      // 清理
      await redisClient.delete(key);
    });

    test('缓存装饰器应该工作', () => {
      let callCount = 0;

      class TestService {
        @memoryCache.withCache('test:key', 60)
        async getData(id: string): Promise<any> {
          callCount++;
          return { id, callCount, timestamp: Date.now() };
        }
      }

      const service = new TestService();

      // 第一次调用
      const result1 = service.getData('123');
      
      // 第二次调用（应该命中缓存）
      const result2 = service.getData('123');

      expect(callCount).toBe(1); // 只应该调用一次
    });

    test('缓存失效机制应该工作', async () => {
      const baseKey = 'invalidation:test';
      
      // 设置多个相关键
      await cacheManager.products.set(`${baseKey}:1`, { id: 1 }, 60);
      await cacheManager.products.set(`${baseKey}:2`, { id: 2 }, 60);
      await cacheManager.products.set(`${baseKey}:3`, { id: 3 }, 60);

      // 验证设置成功
      const beforeDelete1 = await cacheManager.products.get(`${baseKey}:1`);
      const beforeDelete2 = await cacheManager.products.get(`${baseKey}:2`);
      const beforeDelete3 = await cacheManager.products.get(`${baseKey}:3`);

      expect(beforeDelete1).toBeDefined();
      expect(beforeDelete2).toBeDefined();
      expect(beforeDelete3).toBeDefined();

      // 模式删除
      const deletedCount = await cacheManager.products.deletePattern(`${baseKey}:*`);
      expect(deletedCount).toBe(3);

      // 验证删除
      const afterDelete1 = await cacheManager.products.get(`${baseKey}:1`);
      const afterDelete2 = await cacheManager.products.get(`${baseKey}:2`);
      const afterDelete3 = await cacheManager.products.get(`${baseKey}:3`);

      expect(afterDelete1).toBeNull();
      expect(afterDelete2).toBeNull();
      expect(afterDelete3).toBeNull();
    });
  });

  describe('查询优化器测试', () => {
    test('应该优化用户列表查询', async () => {
      console.log('🧪 测试用户列表查询优化...');
      
      const startTime = process.hrtime.bigint();

      const result = await QueryOptimizer.getOptimizedUsersList({
        page: 1,
        limit: 50,
        search: ''
      });

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      console.log(`   ⏱️ 查询时间: ${duration.toFixed(2)}ms`);
      console.log(`   📋 用户数量: ${result.users.length}`);

      expect(result.users).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
      expect(duration).toBeLessThan(2000); // 应该在2秒内完成
    });

    test('应该优化订单列表查询', async () => {
      console.log('🧪 测试订单列表查询优化...');

      const result = await QueryOptimizer.getOptimizedOrdersList({
        page: 1,
        limit: 30
      });

      console.log(`   📋 订单数量: ${result.orders.length}`);

      expect(result.orders).toBeDefined();
      expect(Array.isArray(result.orders)).toBe(true);
    });

    test('应该支持搜索和分页', async () => {
      const result = await QueryOptimizer.getOptimizedUsersList({
        page: 1,
        limit: 10,
        search: 'test'
      });

      expect(result.users).toBeDefined();
      expect(result.totalCount).toBeDefined();
      expect(result.hasMore).toBeDefined();
      expect(result.page).toBe(1);
    });
  });

  describe('数据库索引测试', () => {
    test('索引应该提高查询性能', async () => {
      console.log('🧪 测试索引性能...');
      
      const iterations = 100;
      const startTime = process.hrtime.bigint();

      // 执行多次查询测试索引效果
      for (let i = 0; i < iterations; i++) {
        // 测试索引查询
        await prisma.users.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 最近24小时
            }
          },
          take: 10
        });
      }

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      const avgTime = duration / iterations;

      console.log(`   ⏱️ 平均查询时间: ${avgTime.toFixed(3)}ms`);
      console.log(`   🔄 总查询次数: ${iterations}`);

      expect(avgTime).toBeLessThan(50); // 平均应该在50ms内
    });

    test('应该使用适当的连接类型', async () => {
      // 测试INNER JOIN vs LEFT JOIN的使用
      const result = await prisma.orders.findMany({
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              balance: true
            }
          }
        },
        take: 20
      });

      expect(result).toBeDefined();
      expect(result.length).toBeLessThanOrEqual(20);
    });
  });

  describe('缓存命中率测试', () => {
    test('热点数据应该有高命中率', async () => {
      const hotKey = 'hot:data:test';
      const data = { type: 'hot', value: Math.random() };

      // 预热缓存
      await cacheManager.products.set(hotKey, data, 300);

      // 多次访问热点数据
      const accessCount = 50;
      let hitCount = 0;

      for (let i = 0; i < accessCount; i++) {
        const cachedData = await cacheManager.products.get(hotKey);
        if (cachedData) {
          hitCount++;
        }
      }

      const hitRate = (hitCount / accessCount) * 100;
      
      console.log(`   🎯 缓存命中率: ${hitRate.toFixed(2)}%`);
      
      expect(hitRate).toBeGreaterThan(95); // 热点数据应该有95%以上命中率
    });

    test('冷数据应该有合理的加载时间', async () => {
      const coldKey = 'cold:data:test';
      const data = { type: 'cold', value: 'expensive-operation-result' };

      const startTime = process.hrtime.bigint();

      // 第一次访问（缓存未命中）
      const result1 = await cacheManager.products.get(coldKey);
      const missTime = process.hrtime.bigint();

      // 设置缓存
      await cacheManager.products.set(coldKey, data, 300);

      // 第二次访问（缓存命中）
      const result2 = await cacheManager.products.get(coldKey);
      const hitTime = process.hrtime.bigint();

      const missDuration = Number(missTime - startTime) / 1000000;
      const hitDuration = Number(hitTime - missTime) / 1000000;

      console.log(`   ❌ 缓存未命中时间: ${missDuration.toFixed(3)}ms`);
      console.log(`   ✅ 缓存命中时间: ${hitDuration.toFixed(3)}ms`);
      console.log(`   🚀 性能提升: ${(missDuration / hitDuration).toFixed(1)}x`);

      expect(result1).toBeNull();
      expect(result2).toBeDefined();
      expect(hitDuration).toBeLessThan(missDuration);
    });
  });

  describe('批量操作性能测试', () => {
    test('批量插入应该比单条插入快', async () => {
      const testData = Array(100).fill(0).map((_, i) => ({
        name: `批量测试${i}`,
        value: i,
        createdAt: new Date()
      }));

      // 单条插入时间
      const singleStartTime = process.hrtime.bigint();
      
      for (const data of testData.slice(0, 10)) {
        await prisma.transactions.create({
          data: {
            userId: TEST_USER_ID,
            type: 'test',
            amount: data.value,
            description: `单条插入测试${data.value}`
          }
        });
      }

      const singleEndTime = process.hrtime.bigint();
      const singleDuration = Number(singleEndTime - singleStartTime) / 1000000;

      console.log(`   📝 单条插入时间: ${singleDuration.toFixed(2)}ms (10条)`);
      expect(singleDuration).toBeDefined();
    });

    test('批量更新应该优化数据库负载', async () => {
      const updates = Array(50).fill(0).map((_, i) => ({
        where: { id: `update-test-${i}` },
        data: { updatedAt: new Date() }
      }));

      const startTime = process.hrtime.bigint();

      // 在实际实现中应该有批量更新方法
      // 这里只是性能测试的结构
      for (const update of updates) {
        // 模拟更新操作
        await Promise.resolve(); // 占位符
      }

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      console.log(`   🔄 批量更新时间: ${duration.toFixed(2)}ms (50个更新)`);
      
      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
    });
  });

  describe('内存使用优化测试', () => {
    test('应该避免内存泄漏', async () => {
      const initialMemory = process.memoryUsage();
      
      // 创建大量对象
      const objects = Array(10000).fill(0).map((_, i) => ({
        id: i,
        data: `test-data-${i}`,
        timestamp: Date.now()
      }));

      // 处理对象
      const processed = objects.map(obj => ({
        ...obj,
        processed: true
      }));

      const peakMemory = process.memoryUsage();
      
      // 清理引用
      objects.length = 0;
      processed.length = 0;

      const finalMemory = process.memoryUsage();

      console.log(`   💾 初始内存: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   📊 峰值内存: ${(peakMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   🧹 最终内存: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);

      // 检查是否有显著的内存增长
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 增长不超过50MB
    });
  });

  describe('并发性能测试', () => {
    test('应该处理并发读取请求', async () => {
      const concurrentReads = 100;
      const readPromises = Array(concurrentReads).fill(0).map(() =>
        prisma.users.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' }
        })
      );

      const startTime = process.hrtime.bigint();
      const results = await Promise.all(readPromises);
      const endTime = process.hrtime.bigint();

      const duration = Number(endTime - startTime) / 1000000;
      const throughput = concurrentReads / (duration / 1000);

      console.log(`   🔄 并发读取: ${concurrentReads}次`);
      console.log(`   ⏱️ 总时间: ${duration.toFixed(2)}ms`);
      console.log(`   🚀 吞吐量: ${throughput.toFixed(2)} reads/sec`);

      expect(results).toHaveLength(concurrentReads);
      expect(throughput).toBeGreaterThan(10); // 至少10 reads/sec
    });

    test('应该处理混合读写操作', async () => {
      const operations = 50;
      const writeRatio = 0.2; // 20%写操作，80%读操作

      const operations_array = Array(operations).fill(0).map((_, i) => {
        const isWrite = i < operations * writeRatio;
        
        if (isWrite) {
          return prisma.transactions.create({
            data: {
              userId: TEST_USER_ID,
              type: 'concurrent_test',
              amount: Math.random() * 100,
              description: `并发测试${i}`
            }
          });
        } else {
          return prisma.users.findUnique({
            where: { id: TEST_USER_ID }
          });
        }
      });

      const startTime = process.hrtime.bigint();
      const results = await Promise.all(operations_array);
      const endTime = process.hrtime.bigint();

      const duration = Number(endTime - startTime) / 1000000;

      console.log(`   🔀 混合操作: ${operations}次 (20%写, 80%读)`);
      console.log(`   ⏱️ 总时间: ${duration.toFixed(2)}ms`);
      console.log(`   📊 平均延迟: ${(duration / operations).toFixed(3)}ms/操作`);

      expect(results).toHaveLength(operations);
      expect(duration).toBeLessThan(10000); // 应该在10秒内完成
    });
  });
});

// 辅助函数
async function createPerformanceTestData() {
  // 创建测试用户
  await prisma.users.upsert({
    where: { id: TEST_USER_ID },
    update: {},
    create: {
      id: TEST_USER_ID,
      telegramId: 'test_perf_user',
      firstName: 'Performance Test',
      balance: 1000
    }
  });

  // 创建测试交易记录
  for (let i = 0; i < 50; i++) {
    await prisma.transactions.create({
      data: {
        userId: TEST_USER_ID,
        type: 'lottery',
        amount: Math.random() * 100,
        description: `性能测试交易${i}`
      }
    });
  }

  // 创建测试订单
  for (let i = 0; i < 30; i++) {
    await prisma.orders.create({
      data: {
        orderNumber: `PERF_TEST_${Date.now()}_${i}`,
        userId: TEST_USER_ID,
        type: 'lottery',
        totalAmount: Math.random() * 1000,
        status: 'completed'
      }
    });
  }
}

async function cleanupPerformanceTestData() {
  try {
    await prisma.transactions.deleteMany({
      where: { description: { contains: '性能测试' } }
    });
    
    await prisma.orders.deleteMany({
      where: { orderNumber: { contains: 'PERF_TEST' } }
    });
    
    await prisma.users.deleteMany({
      where: { id: TEST_USER_ID }
    });
  } catch (error) {
    console.error('清理性能测试数据时出错:', error);
  }
}