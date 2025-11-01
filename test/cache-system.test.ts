import { cacheManager, withCache, invalidateCache } from '../lib/cache-manager';
import { redisClient } from '../lib/redis-cache';
import { cacheMonitor } from '../lib/cache-monitor';
import { memoryCache, MultiLevelCache } from '../lib/memory-cache';
/**
 * 缓存系统功能测试
 * 运行命令: npm run test:cache 或 npx tsx test/cache-system.test.ts
 */


// 测试配置
const TEST_CONFIG = {
  cacheKeys: {
    test: 'cache:test:basic',
    user: (id: string) => `cache:test:user:${id}`,
    product: (id: string) => `cache:test:product:${id}`
  },
  testData: {
    user: {
      id: 'user_123',
      name: '测试用户',
      email: 'test@example.com',
      createdAt: new Date()
    },
    product: {
      id: 'product_456',
      name: '测试商品',
      price: 99.99,
      category: 'electronics',
      stock: 100
    }
  }
};

// 测试结果统计
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

class CacheSystemTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<{ total: number; passed: number; failed: number }> {
    console.log('🧪 开始缓存系统功能测试...\n');

    const tests = [;
      { name: '基础缓存操作', fn: () => this.testBasicCacheOperations() },
      { name: '内存缓存功能', fn: () => this.testMemoryCache() },
      { name: 'Redis缓存功能', fn: () => this.testRedisCache() },
      { name: '缓存策略测试', fn: () => this.testCacheStrategies() },
      { name: '批量操作测试', fn: () => this.testBatchOperations() },
      { name: '缓存命中率测试', fn: () => this.testCacheHitRate() },
      { name: '缓存装饰器测试', fn: () => this.testCacheDecorators() },
      { name: '缓存失效测试', fn: () => this.testCacheInvalidation() },
      { name: '性能测试', fn: () => this.testPerformance() },
      { name: '监控功能测试', fn: () => this.testMonitoring() }
    ];

    for (const test of tests) {
      await this.runTest(test.name, test.fn);
    }

    return this.printResults();
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        passed: true,
        duration
      });
      
      console.log(`✅ ${name} - 通过 (${duration}ms)`);
  }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      
      console.log(`❌ ${name} - 失败 (${duration}ms)`);
      console.log(`   错误: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  private async testBasicCacheOperations(): Promise<void> {
    const cache = cacheManager.products;
    const key = TEST_CONFIG.cacheKeys.test;
    const data = { message: 'Hello Cache!', timestamp: Date.now() };

    // 测试设置
    const setResult = await cache.set(key, data, 60);
    if (!setResult) throw new Error('缓存设置失败'); {

    // 测试获取
    const cachedData = await cache.get(key);
    if (!cachedData || cachedData.message !== data.message) {
      throw new Error('缓存获取失败或数据不匹配');
    }

    // 测试存在性检查
    const exists = await cache.has(key);
    if (!exists) throw new Error('缓存存在性检查失败'); {

    // 测试删除
    const deleteResult = await cache.delete(key);
    if (!deleteResult) throw new Error('缓存删除失败'); {

    // 验证删除结果
    const afterDelete = await cache.get(key);
    if (afterDelete !== null) throw new Error('缓存删除后仍能获取'); {
  }

  private async testMemoryCache(): Promise<void> {
    const key = TEST_CONFIG.cacheKeys.test + ':memory';
    const data = { message: 'Memory Cache Test', value: 123 };

    // 测试设置
    memoryCache.set(key, data, 60000); // 1分钟

    // 测试获取
    const cachedData = memoryCache.get(key);
    if (!cachedData || cachedData.message !== data.message) {
      throw new Error('内存缓存获取失败');
    }

    // 测试统计
    const stats = memoryCache.getStats();
    if (stats.currentSize === 0) {
      throw new Error('内存缓存统计异常');
    }

    // 测试清理
    memoryCache.delete(key);
    const afterDelete = memoryCache.get(key);
    if (afterDelete !== null) {
      throw new Error('内存缓存删除失败');
    }
  }

  private async testRedisCache(): Promise<void> {
    // 检查Redis连接
    if (!redisClient.isConnected()) {
      console.log('⚠️  Redis未连接，跳过Redis缓存测试');
      return;
    }

    const key = TEST_CONFIG.cacheKeys.test + ':redis';
    const data = { message: 'Redis Cache Test', timestamp: Date.now() };

    // 测试设置
    const setResult = await redisClient.set(key, data, 60);
    if (!setResult) throw new Error('Redis缓存设置失败'); {

    // 测试获取
    const cachedData = await redisClient.get(key);
    if (!cachedData || cachedData.message !== data.message) {
      throw new Error('Redis缓存获取失败');
    }

    // 测试统计
    const stats = redisClient.getStats();
    if (stats.totalOperations === 0) {
      throw new Error('Redis统计异常');
    }

    // 测试删除
    await redisClient.delete(key);
    const afterDelete = await redisClient.get(key);
    if (afterDelete !== null) {
      throw new Error('Redis缓存删除失败');
    }
  }

  private async testCacheStrategies(): Promise<void> {
    const testData = { strategy: 'test', data: 'strategy_data' };

    // 测试不同的缓存策略
    const strategies = [;
      { name: 'memory_first', manager: cacheManager.users },
      { name: 'write_through', manager: cacheManager.products },
      { name: 'redis_first', manager: cacheManager.config }
    ];

    for (const strategy of strategies) {
      const key = `strategy:${strategy.name}:${Date.now()}`;
      
      const setResult = await strategy.manager.set(key, testData, 30);
      if (!setResult) throw new Error(`${strategy.name} 策略设置失败`); {

      const getResult = await strategy.manager.get(key);
      if (!getResult || getResult.strategy !== testData.strategy) {
        throw new Error(`${strategy.name} 策略获取失败`);
      }
    }
  }

  private async testBatchOperations(): Promise<void> {
    const cache = cacheManager.products;
    const batchData = [;
      { key: 'batch:1', data: { id: 1, name: 'Item 1' }, ttl: 60 },
      { key: 'batch:2', data: { id: 2, name: 'Item 2' }, ttl: 60 },
      { key: 'batch:3', data: { id: 3, name: 'Item 3' }, ttl: 60 }
    ];

    // 批量设置
    const setResult = await cache.setMany(batchData);
    if (!setResult) throw new Error('批量设置失败'); {

    // 批量获取
    const keys = batchData.map(item => item.key);
    const getResult = await cache.getMany(keys);
    
    if (Object.keys(getResult).length !== batchData.length) {
      throw new Error('批量获取数量不匹配');
    }

    // 验证数据
    for (const item of batchData) {
      if (!getResult[item.key] || getResult[item.key].id !== item.data.id) {
        throw new Error(`批量获取数据不匹配: ${item.key}`);
      }
    }

    // 清理测试数据
    for (const key of keys) {
      await cache.delete(key);
    }
  }

  private async testCacheHitRate(): Promise<void> {
    const cache = cacheManager.stats;
    const key = 'hitrate:test';
    const data = { test: 'hitrate', value: Math.random() };

    // 清空统计
    cache.resetStats();

    // 第一次获取 (未命中)
    await cache.get(key);
    
    // 设置数据
    await cache.set(key, data, 60);
    
    // 多次获取 (应该命中)
    for (let i = 0; i < 5; i++) {
      await cache.get(key);
    }

    const stats = cache.getStats();
    if (stats.hitRate < 80) { // 期望命中率大于80% {
      console.log(`⚠️  缓存命中率较低: ${stats.hitRate.toFixed(2)}%`);
    }
  }

  private async testCacheDecorators(): Promise<void> {
    let methodCallCount = 0;
    const testKey = 'decorator:test';

    class TestService {
      @withCache((param: string) => `decorator:${testKey}:${param}`, 60)
      async getData(param: string): Promise<any> {
        methodCallCount++;
        return { param, callCount: methodCallCount, timestamp: Date.now() };
      }

      @invalidateCache((param: string) => `decorator:${testKey}:${param}`)
      async updateData(param: string, data: any): Promise<any> {
        return { param, ...data, updated: true };
      }
    }

    const service = new TestService();

    // 第一次调用
    const result1 = await service.getData('test');
    if (result1.callCount !== 1) throw new Error('装饰器第一次调用计数错误'); {

    // 第二次调用 (应该命中缓存)
    const result2 = await service.getData('test');
    if (result2.callCount !== 1) throw new Error('装饰器缓存未命中'); {
    if (result1.param !== result2.param) throw new Error('装饰器缓存数据不匹配'); {

    // 触发失效
    await service.updateData('test', { modified: true });

    // 再次调用 (应该重新执行)
    const result3 = await service.getData('test');
    if (result3.callCount !== 2) throw new Error('装饰器失效后调用计数错误'); {
  }

  private async testCacheInvalidation(): Promise<void> {
    const cache = cacheManager.products;
    const baseKey = 'invalidation:test';
    
    // 设置多个相关键
    await cache.set(`${baseKey}:1`, { id: 1 }, 60);
    await cache.set(`${baseKey}:2`, { id: 2 }, 60);
    await cache.set(`${baseKey}:3`, { id: 3 }, 60);

    // 验证设置成功
    const beforeInvalidate1 = await cache.get(`${baseKey}:1`);
    const beforeInvalidate2 = await cache.get(`${baseKey}:2`);
    const beforeInvalidate3 = await cache.get(`${baseKey}:3`);

    if (!beforeInvalidate1 || !beforeInvalidate2 || !beforeInvalidate3) {
      throw new Error('失效前数据检查失败');
    }

    // 模式删除
    const deletedCount = await cache.deletePattern(`${baseKey}:*`);
    if (deletedCount !== 3) {
      throw new Error(`模式删除数量不匹配，期望3，实际${deletedCount}`);
    }

    // 验证删除结果
    const afterInvalidate1 = await cache.get(`${baseKey}:1`);
    const afterInvalidate2 = await cache.get(`${baseKey}:2`);
    const afterInvalidate3 = await cache.get(`${baseKey}:3`);

    if (afterInvalidate1 || afterInvalidate2 || afterInvalidate3) {
      throw new Error('模式删除后仍有数据残留');
    }
  }

  private async testPerformance(): Promise<void> {
    const cache = cacheManager.stats;
    const iterations = 100;
    const testData = { performance: 'test', data: 'x'.repeat(1000) }; // 1KB数据;

    console.log(`\n📊 性能测试 - ${iterations}次操作...`);

    // 测试写入性能
    const writeStart = Date.now();
    for (let i = 0; i < iterations; i++) {
      await cache.set(`perf:test:write:${i}`, testData, 60);
    }
    const writeDuration = Date.now() - writeStart;
    const writeOpsPerSec = (iterations / writeDuration * 1000).toFixed(2);

    // 测试读取性能
    const readStart = Date.now();
    for (let i = 0; i < iterations; i++) {
      await cache.get(`perf:test:write:${i}`);
    }
    const readDuration = Date.now() - readStart;
    const readOpsPerSec = (iterations / readDuration * 1000).toFixed(2);

    console.log(`   写入性能: ${writeOpsPerSec} ops/sec`);
    console.log(`   读取性能: ${readOpsPerSec} ops/sec`);

    // 清理测试数据
    for (let i = 0; i < iterations; i++) {
      await cache.delete(`perf:test:write:${i}`);
    }

    // 性能断言 (可以根据实际情况调整)
    if (parseFloat(writeOpsPerSec) < 100) {
      console.log(`⚠️  写入性能可能偏低: ${writeOpsPerSec} ops/sec`);
    }
    if (parseFloat(readOpsPerSec) < 500) {
      console.log(`⚠️  读取性能可能偏低: ${readOpsPerSec} ops/sec`);
    }
  }

  private async testMonitoring(): Promise<void> {
    console.log('\n📈 监控功能测试...');

    // 测试指标收集
    const metrics = await cacheMonitor.collectMetrics();
    if (!metrics) {
      throw new Error('监控指标收集失败');
    }

    console.log('   ✅ 指标收集成功');
    console.log(`   📊 当前缓存命中率: ${metrics.redis.hitRate.toFixed(2)}%`);
    console.log(`   🔧 总操作数: ${metrics.redis.totalOperations}`);

    // 测试操作记录
    cacheMonitor.recordOperation('test_operation', 50, true);
    const recentMetrics = cacheMonitor.getMetricsHistory(1000); // 最近1秒;
    if (recentMetrics.length === 0) {
      throw new Error('监控历史数据获取失败');
    }

    console.log('   ✅ 操作记录成功');
    console.log('   ✅ 监控功能正常');
  }

  private printResults(): { total: number; passed: number; failed: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;

    console.log('\n📋 测试结果统计:');
    console.log(`   总计: ${total}`);
    console.log(`   通过: ${passed} ✅`);
    console.log(`   失败: ${failed} ❌`);

    if (failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.results
        .filter(r :> !r.passed)
        .forEach(r => {
          console.log(`   - ${r.name}: ${r.error}`);
        });
    }

    console.log('\n' + '='.repeat(50));

    if (failed === 0) {
      console.log('🎉 所有测试通过！缓存系统运行正常。');
    } else {
      console.log(`⚠️  有 ${failed} 个测试失败，请检查相关功能。`);
    }

    return { total, passed, failed };
  }
}

// 主测试函数
async function main() {
  try {
    const tester = new CacheSystemTester();
    const results = await tester.runAllTests();
    
    process.exit(results.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

export { CacheSystemTester };
export default CacheSystemTester;
}}}}}}}}}}}