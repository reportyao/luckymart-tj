import { 
import { QueryCacheMonitor, defaultQueryMonitoringConfig } from '../lib/query-cache-monitor';
// 查询缓存系统测试
  QueryCacheManager, 
  queryCache, 
  QueryType,
  withQueryCache,
  invalidateCache 
} from '../lib/query-cache-manager';


describe('QueryCacheManager', () => {
  let cacheManager: QueryCacheManager;

  beforeEach(() => {
    // 创建测试用的缓存管理器
    cacheManager = QueryCacheManager.getInstance('test', {
      namespace: 'test',
      defaultTTL: 60, // 1分钟TTL用于测试
      maxCacheSize: 100,
      enableQueryAnalysis: true,
      cacheKeyStrategy: 'detailed' as any,
      invalidationStrategy: 'time_based' as any,
      enableCaching: true
    });
  });

  afterEach(async () => {
    // 清理测试数据
    await cacheManager.clear();
  });

  describe('基础功能测试', () => {
    test('应该能够执行查询并缓存结果', async () => {
      const query = 'SELECT * FROM users WHERE id = ?';
      const parameters = { id: '123' };
      
      let callCount = 0;
      const mockExecutor = async () => {
        callCount++;
        return { id: '123', name: 'Test User' };
      };

      // 第一次调用
      const result1 = await cacheManager.executeQuery(query, parameters, mockExecutor);
      expect(result1).toEqual({ id: '123', name: 'Test User' });
      expect(callCount).toBe(1);

      // 第二次调用应该使用缓存
      const result2 = await cacheManager.executeQuery(query, parameters, mockExecutor);
      expect(result2).toEqual({ id: '123', name: 'Test User' });
      expect(callCount).toBe(1); // 没有增加调用次数

      // 验证缓存统计
      const stats = cacheManager.getStatistics();
      expect(stats.totalQueries).toBe(2);
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(1);
      expect(stats.hitRate).toBe(50);
    });

    test('应该支持强制刷新', async () => {
      const query = 'SELECT * FROM products WHERE category = ?';
      const parameters = { category: 'electronics' };
      
      let callCount = 0;
      const mockExecutor = async () => {
        callCount++;
        return { category: 'electronics', count: callCount };
      };

      // 第一次调用
      const result1 = await cacheManager.executeQuery(query, parameters, mockExecutor);
      expect(result1.count).toBe(1);

      // 第二次调用（使用缓存）
      const result2 = await cacheManager.executeQuery(query, parameters, mockExecutor);
      expect(result2.count).toBe(1);

      // 第三次调用（强制刷新）
      const result3 = await cacheManager.executeQuery(query, parameters, mockExecutor, { forceRefresh: true });
      expect(result3.count).toBe(2);
      expect(callCount).toBe(2);
    });

    test('应该支持不同查询类型', async () => {
      const readQuery = 'SELECT * FROM users WHERE id = ?';
      const writeQuery = 'INSERT INTO users (name) VALUES (?)';
      
      const readExecutor = async () => ({ id: '123', name: 'Read User' });
      const writeExecutor = async () => ({ id: '456', name: 'Write User' });

      // 读取查询
      const readResult = await cacheManager.executeQuery(readQuery, { id: '123' }, readExecutor, {
        queryType: QueryType.READ
      });
      expect(readResult).toEqual({ id: '123', name: 'Read User' });

      // 写入查询
      const writeResult = await cacheManager.executeQuery(writeQuery, { name: 'Write User' }, writeExecutor, {
        queryType: QueryType.WRITE
      });
      expect(writeResult).toEqual({ id: '456', name: 'Write User' });
    });
  });

  describe('批量查询测试', () => {
    test('应该能够批量执行查询', async () => {
      const queries = [;
        {
          query: 'getUserProfile',
          parameters: { userId: '123' },
          executor: () => Promise.resolve({ id: '123', name: 'User 123' }),
          options: { ttl: 60 }
        },
        {
          query: 'getUserOrders',
          parameters: { userId: '123' },
          executor: () => Promise.resolve([{ id: 1, userId: '123' }]),
          options: { ttl: 60 }
        },
        {
          query: 'getUserPreferences',
          parameters: { userId: '123' },
          executor: () => Promise.resolve({ theme: 'dark' }),
          options: { ttl: 60 }
        }
      ];

      const results = await cacheManager.executeBatchQueries(queries);
      
      expect(Object.keys(results)).toHaveLength(3);
      expect(results).toHaveProperty('query:detail::getUserProfile:{userId:123}');
      expect(results).toHaveProperty('query:detail::getUserOrders:{userId:123}');
      expect(results).toHaveProperty('query:detail::getUserPreferences:{userId:123}');
    });

    test('应该处理批量查询中的部分缓存命中', async () => {
      let callCount = 0;
      const mockExecutor = (id: string) => async () => {
        callCount++;
        return { id, name: `User ${id}`, callCount };
      };

      const queries = [;
        {
          query: 'getUser',
          parameters: { userId: '123' },
          executor: mockExecutor('123'),
          options: { ttl: 60 }
        },
        {
          query: 'getUser',
          parameters: { userId: '456' },
          executor: mockExecutor('456'),
          options: { ttl: 60 }
        }
      ];

      // 第一次批量执行
      const results1 = await cacheManager.executeBatchQueries(queries);
      expect(callCount).toBe(2);

      // 第二次批量执行
      const results2 = await cacheManager.executeBatchQueries(queries);
      expect(callCount).toBe(2); // 应该全部命中缓存
    });
  });

  describe('缓存失效测试', () => {
    test('应该能够精确失效缓存', async () => {
      const query = 'SELECT * FROM products WHERE id = ?';
      const parameters = { id: '123' };

      const executor = async () => ({ id: '123', name: 'Product 123', price: 100 });
      
      // 填充缓存
      await cacheManager.executeQuery(query, parameters, executor);
      let stats = cacheManager.getStatistics();
      expect(stats.cachedQueries).toBe(1);

      // 失效缓存
      await cacheManager.invalidateRelatedCaches('query:detail::SELECT * FROM products WHERE id = ?:{id:123}');
      
      stats = cacheManager.getStatistics();
      expect(stats.cachedQueries).toBe(0);
    });

    test('应该支持模式失效', async () => {
      const queries = [;
        { query: 'getProduct', parameters: { id: '1' } },
        { query: 'getProduct', parameters: { id: '2' } },
        { query: 'getUser', parameters: { id: '1' } }
      ];

      const executor = async (data: any) => Promise.resolve(data);

      // 填充所有缓存
      for (const q of queries) {
        await cacheManager.executeQuery(q.query, q.parameters, () => executor(q.parameters));
      }

      let stats = cacheManager.getStatistics();
      expect(stats.cachedQueries).toBe(3);

      // 使用模式失效产品缓存
      await cacheManager.invalidateRelatedCaches('', 'query:detail::getProduct*');
      
      stats = cacheManager.getStatistics();
      expect(stats.cachedQueries).toBe(1); // 只剩下用户缓存
    });
  });

  describe('缓存统计测试', () => {
    test('应该正确计算命中率', async () => {
      const queries = [;
        { query: 'q1', parameters: { id: '1' } },
        { query: 'q2', parameters: { id: '2' } },
        { query: 'q1', parameters: { id: '1' } }, // 重复查询
        { query: 'q3', parameters: { id: '3' } }
      ];

      for (const q of queries) {
        await cacheManager.executeQuery(q.query, q.parameters, () => Promise.resolve({ result: true }));
      }

      const stats = cacheManager.getStatistics();
      expect(stats.totalQueries).toBe(4);
      expect(stats.cacheHits).toBe(1); // 只有一次重复命中
      expect(stats.cacheMisses).toBe(3);
      expect(stats.hitRate).toBe(25);
    });

    test('应该跟踪执行时间', async () => {
      const slowExecutor = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { result: 'slow_query' };
      };

      const startTime = Date.now();
      const result = await cacheManager.executeQuery('slow_query', {}, slowExecutor);
      const executionTime = Date.now() - startTime;

      expect(result).toEqual({ result: 'slow_query' });
      expect(executionTime).toBeGreaterThanOrEqual(100);
    });
  });
});

describe('QueryCacheDecorator', () => {
  test('应该能够使用装饰器缓存方法', async () => {
    class TestService {
      @withQueryCache('test', 60)
      async getData(id: string) {
        return { id, timestamp: Date.now() };
      }

      @invalidateCache(['test:*'])
      async updateData(id: string, data: any) {
        return { id, ...data, updated: true };
      }
    }

    const service = new TestService();

    // 第一次调用
    const result1 = await service.getData('123');
    expect(result1.id).toBe('123');

    // 第二次调用应该使用缓存
    const result2 = await service.getData('123');
    expect(result2.id).toBe('123');

    // 更新操作会清理缓存
    await service.updateData('123', { name: 'updated' });
    
    // 下次调用应该重新执行
    const result3 = await service.getData('123');
    expect(result3.updated).toBe(true);
  });
});

describe('QueryCacheMonitor', () => {
  let monitor: any;

  beforeEach(() => {
    const cacheManager = QueryCacheManager.getInstance('monitor_test', {
      namespace: 'monitor_test',
      defaultTTL: 60,
      maxCacheSize: 100,
      enableQueryAnalysis: true,
      cacheKeyStrategy: 'detailed' as any,
      invalidationStrategy: 'time_based' as any,
      enableCaching: true
    });

    monitor = new QueryCacheMonitor(defaultQueryMonitoringConfig, cacheManager);
  });

  test('应该能够收集性能指标', async () => {
    const cacheManager = queryCache.general;
    
    // 执行一些查询操作
    await cacheManager.executeQuery('test_query', {}, () => Promise.resolve({ result: 'test' }));
    
    const metrics = monitor.collectMetrics();
    
    expect(metrics.timestamp).toBeDefined();
    expect(metrics.cacheHits).toBeGreaterThanOrEqual(0);
    expect(metrics.cacheMisses).toBeGreaterThanOrEqual(0);
    expect(metrics.hitRate).toBeGreaterThanOrEqual(0);
  });

  test('应该能够检测异常', async () => {
    // 模拟高错误率情况
    const mockMetrics = [;
      { timestamp: Date.now() - 4000, cacheHits: 10, cacheMisses: 90, hitRate: 10, errorCount: 50 },
      { timestamp: Date.now() - 3000, cacheHits: 8, cacheMisses: 92, hitRate: 8, errorCount: 60 },
      { timestamp: Date.now() - 2000, cacheHits: 5, cacheMisses: 95, hitRate: 5, errorCount: 70 },
      { timestamp: Date.now() - 1000, cacheHits: 3, cacheMisses: 97, hitRate: 3, errorCount: 80 }
    ];

    // 手动添加模拟数据
    (monitor as any).performanceMetrics = mockMetrics;
    
    const anomalies = monitor.detectAnomalies();
    
    // 应该检测到命中率异常
    const hitRateAnomaly = anomalies.find(a => a.anomalyType === 'hit_rate');
    expect(hitRateAnomaly?.isAnomaly).toBe(true);
    expect(hitRateAnomaly?.severity).toBe('critical');
  });

  test('应该能够生成性能报告', async () => {
    const report = monitor.generatePerformanceReport();
    
    expect(report.generatedAt).toBeDefined();
    expect(report.period).toBeDefined();
    expect(report.summary).toBeDefined();
    expect(report.recommendations).toBeDefined();
    expect(report.optimizationSuggestions).toBeDefined();
  });

  test('应该能够告警', async () => {
    const alerts: any[] = [];
    
    monitor.addAlertCallback((alert: any) => {
      alerts.push(alert);
    });

    // 模拟触发告警的情况
    (monitor as any).performanceMetrics : [
      {
        timestamp: Date.now(),
        hitRate: 30, // 低于阈值
        avgResponseTime: 100,
        memoryUsage: 100 * 1024 * 1024,
        errorCount: 10,
        totalOperations: 100,
        cacheEfficiency: 30,
        queryComplexity: 2,
        dataFreshness: 10
      }
    ];

    monitor.checkAlerts();
    
    expect(alerts.length).toBeGreaterThan(0);
  });
});

describe('集成测试', () => {
  test('完整的缓存流程应该正常工作', async () => {
    const cache = queryCache.general;
    const monitor = new QueryCacheMonitor(defaultQueryMonitoringConfig, cache);

    // 1. 启动监控
    monitor.startMonitoring();

    // 2. 执行一系列操作
    await cache.executeQuery('user_profile', { userId: '123' }, () => 
      Promise.resolve({ id: '123', name: 'Test User' })
    );

    await cache.executeQuery('user_orders', { userId: '123' }, () => 
      Promise.resolve([{ id: 1, total: 100 }])
    );

    // 3. 再次执行相同查询（应该命中缓存）
    await cache.executeQuery('user_profile', { userId: '123' }, () => 
      Promise.resolve({ id: '123', name: 'Test User' })
    );

    // 4. 失效缓存
    await cache.invalidateRelatedCaches('', 'user_profile:*');

    // 5. 验证状态
    const status = monitor.getCurrentStatus();
    expect(status.metrics).toBeDefined();
    expect(status.health).toBeGreaterThan(0);

    // 6. 生成报告
    const report = monitor.generatePerformanceReport();
    expect(report.topSlowQueries).toBeDefined();

    // 7. 停止监控
    monitor.stopMonitoring();
  });
});

describe('性能测试', () => {
  test('缓存应该显著提高性能', async () => {
    const cache = queryCache.general;
    
    // 模拟慢查询
    const slowExecutor = async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return { result: 'slow_data' };
    };

    // 测试未缓存性能
    const startTime1 = Date.now();
    const result1 = await cache.executeQuery('slow_query', {}, slowExecutor, { forceRefresh: true });
    const timeWithoutCache = Date.now() - startTime1;

    // 测试缓存性能
    const startTime2 = Date.now();
    const result2 = await cache.executeQuery('slow_query', {}, slowExecutor);
    const timeWithCache = Date.now() - startTime2;

    // 缓存应该显著更快
    expect(timeWithCache).toBeLessThan(timeWithoutCache / 10); // 至少快10倍
    expect(result1).toEqual(result2);
  });

  test('应该能够处理大量并发请求', async () => {
    const cache = queryCache.general;
    
    const concurrentQueries = Array.from({ length: 100 }, (_, i) =>;
      cache.executeQuery(
        'concurrent_query', 
        { id: i }, 
        () => Promise.resolve({ id: i, data: `data_${i}` })
      )
    );

    const results = await Promise.all(concurrentQueries);
    
    expect(results).toHaveLength(100);
    expect((results?.0 ?? null)).toEqual({ id: 0, data: 'data_0' });
    expect((results?.99 ?? null)).toEqual({ id: 99, data: 'data_99' });
  });
});

describe('错误处理测试', () => {
  test('应该能够处理执行器错误', async () => {
    const cache = queryCache.general;
    
    const errorExecutor = async () => {
      throw new Error('Database connection failed');
    };

    await expect(
      cache.executeQuery('error_query', {}, errorExecutor)
    ).rejects.toThrow('Database connection failed');
  });

  test('应该在缓存错误时降级', async () => {
    const cache = QueryCacheManager.getInstance('fallback_test', {
      namespace: 'fallback_test',
      defaultTTL: 60,
      maxCacheSize: 10, // 小容量，模拟内存不足
      enableQueryAnalysis: true,
      cacheKeyStrategy: 'simple' as any,
      invalidationStrategy: 'time_based' as any,
      enableCaching: true
    });

    // 填充缓存到满
    for (let i = 0; i < 20; i++) {
      await cache.executeQuery(`query_${i}`, {}, () => Promise.resolve({ data: i }));
    }

    // 应该仍然能够执行查询，即使缓存有问题
    const result = await cache.executeQuery('new_query', {}, () => Promise.resolve({ data: 'fallback' }));
    expect(result).toEqual({ data: 'fallback' });
  });
});