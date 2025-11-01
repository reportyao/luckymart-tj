import { 
import { invalidateCache } from '../lib/cache-manager';
import { QueryCacheMonitor, defaultQueryMonitoringConfig } from '../lib/query-cache-monitor';
import { NextRequest, NextResponse } from 'next/server';
import { 
// 查询缓存使用示例
  QueryCacheManager, 
  queryCache, 
  withQueryCache,
  QueryType 
} from '../lib/query-cache-manager';


// 示例1: 基本使用
async function basicUsageExample() {
  const cache = queryCache.products;

  // 执行查询并缓存结果
  const products = await cache.executeQuery(;
    'SELECT * FROM products WHERE category = ?',
    { category: 'electronics' },
    async () => {
      // 模拟数据库查询
      return await fetchProductsFromDatabase('electronics');
    },
    {
      ttl: 600, // 10分钟缓存
      queryType: QueryType.READ
    }
  );

  return products;
}

// 示例2: 批量查询
async function batchQueryExample() {
  const cache = queryCache.general;

  const queries = [;
    {
      query: 'getUserProfile',
      parameters: { userId: '123' },
      executor: () => getUserProfile('123'),
      options: { ttl: 1800 }
    },
    {
      query: 'getUserOrders',
      parameters: { userId: '123', status: 'pending' },
      executor: () => getUserOrders('123', 'pending'),
      options: { ttl: 300 }
    },
    {
      query: 'getUserPreferences',
      parameters: { userId: '123' },
      executor: () => getUserPreferences('123'),
      options: { ttl: 3600 }
    }
  ];

  const results = await cache.executeBatchQueries(queries);
  return results;
}

// 示例3: 装饰器使用
class ProductService {
  @withQueryCache('products', 600)
  async getProducts(category: string, limit: number = 10) {
    console.log('执行数据库查询...');
    return await this.fetchProducts(category, limit);
  }

  @withQueryCache('products', 300)
  async getProduct(id: string) {
    console.log('执行数据库查询...');
    return await this.fetchProduct(id);
  }

  @invalidateCache(['products:*', 'categories:*'])
  async updateProduct(id: string, data: any) {
    console.log('更新产品并清理缓存...');
    return await this.saveProduct(id, data);
  }

  private async fetchProducts(category: string, limit: number) {
    // 模拟数据库查询
    return [];
  }

  private async fetchProduct(id: string) {
    // 模拟数据库查询
    return { id, name: 'Product' };
  }

  private async saveProduct(id: string, data: any) {
    // 模拟保存操作
    return { id, ...data };
  }
}

// 示例4: 高级配置
function advancedConfigExample() {
  const customCache = QueryCacheManager.getInstance('custom', {
    namespace: 'custom_namespace',
    defaultTTL: 1200,
    maxCacheSize: 2000,
    enableQueryAnalysis: true,
    cacheKeyStrategy: 'context_aware' as any,
    invalidationStrategy: 'event_based' as any,
    enableCaching: true
  });

  return customCache;
}

// 示例5: 缓存监控
async function monitoringExample() {
  const cache = queryCache.general;
  
  // 创建监控器
  const monitor = new QueryCacheMonitor(defaultQueryMonitoringConfig, cache);
  
  // 启动监控
  monitor.startMonitoring();
  
  // 添加告警回调
  monitor.addAlertCallback((alert) => {
    console.log('缓存告警:', alert.message);
    
    if (alert.severity === 'critical') {
      // 发送紧急通知
      sendEmergencyNotification(alert);
    }
  });
  
  // 获取当前状态
  const status = monitor.getCurrentStatus();
  console.log('缓存状态:', status);
  
  // 生成性能报告
  const report = monitor.generatePerformanceReport();
  console.log('性能报告:', report);
  
  return { monitor, status, report };
}

// 示例6: API路由缓存
  CacheableAPI, 
  InvalidateCache, 
  cacheMiddlewares 
} from '../lib/query-cache-middleware';

// GET /api/products - 缓存产品列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';
  const limit = parseInt(searchParams.get('limit') || '10');

  const cache = queryCache.products;
  
  try {
    const products = await cache.executeQuery(;
      'getProducts',
      { category, limit },
      async () => {
        // 实际数据库查询
        const response = await fetch(`${process.env.API_BASE_URL}/products?category=${category}&limit=${limit}`);
        return await response.json();
      },
      {
        ttl: 600,
        queryType: QueryType.READ,
        source: 'api'
}
    );

    return NextResponse.json(products);
  }
  } catch (error) {
    console.error('获取产品失败:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/products - 创建产品并清理缓存
export async function POST(request: NextRequest) {
  try {
    const productData = await request.json();
    
    const cache = queryCache.products;
    
    // 创建产品
    const newProduct = await createProduct(productData);
    
    // 清理相关缓存
    await cache.invalidateRelatedCaches('', 'products:*');
    await cache.invalidateRelatedCaches('', 'categories:*');
    
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('创建产品失败:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
}

// 示例7: 缓存预热
async function cacheWarmupExample() {
  const cache = queryCache.products;
  
  const warmupQueries = [;
    {
      query: 'getPopularProducts',
      parameters: { limit: 20 },
      executor: () => getPopularProducts(20),
      ttl: 1800
    },
    {
      query: 'getCategories',
      parameters: {},
      executor: () => getCategories(),
      ttl: 3600
    },
    {
      query: 'getProductStats',
      parameters: { period: 'last_7_days' },
      executor: () => getProductStats('last_7_days'),
      ttl: 7200
    }
  ];
  
  await cache.warmupCache(warmupQueries);
  console.log('缓存预热完成');
}

// 示例8: 性能优化示例
async function performanceOptimizationExample() {
  const cache = queryCache.analytics;
  
  // 1. 使用批量查询减少网络开销
  const batchQueries = [;
    { query: 'daily_stats', parameters: { date: '2023-12-01' } },
    { query: 'daily_stats', parameters: { date: '2023-12-02' } },
    { query: 'daily_stats', parameters: { date: '2023-12-03' } }
  ];
  
  const results = await cache.executeBatchQueries(;
    batchQueries.map(q => ({
      ...q,
      executor: () => getDailyStats(q.parameters.date),
      options: { ttl: 3600 }
    }))
  );
  
  // 2. 分析缓存效果
  const stats = cache.getStatistics();
  console.log('缓存统计:', {
    命中率: `${stats.hitRate.toFixed(1)}%`,
    平均响应时间: `${stats.avgCacheHitTime}ms`,
    总查询数: stats.totalQueries,
    缓存命中数: stats.cacheHits
  });
  
  // 3. 根据性能数据调整策略
  if (stats.hitRate < 70) {
    console.log('命中率较低，建议：');
    console.log('- 增加TTL时间');
    console.log('- 优化缓存键设计');
    console.log('- 预热热点数据');
  }
  
  return results;
}

// 示例9: 错误处理和降级
async function errorHandlingExample() {
  const cache = queryCache.general;
  
  try {
    const result = await cache.executeQuery(;
      'getCriticalData',
      { id: 'critical_1' },
      async () => {
        try {
          // 尝试从主数据源获取
          return await fetchFromPrimarySource('critical_1');
        } catch (primaryError) {
          console.log('主数据源失败，尝试缓存数据...');
          
          // 主数据源失败时尝试缓存
          const cached = await cache.getFromMemory('fallback:getCriticalData:critical_1');
          if (cached) {
            return cached;
          }
          
          // 如果缓存也没有，抛出错误或返回默认值
          throw new Error('无法获取关键数据');
        }
      },
      {
        ttl: 300,
        queryType: QueryType.READ
      }
    );
    
    return result;
  } catch (error) {
    console.error('查询执行失败:', error);
    
    // 返回默认数据或错误信息
    return { error: 'Data unavailable', fallback: true };
  }
}

// 示例10: 监控和分析
async function analyticsExample() {
  const cache = queryCache.general;
  const monitor = new QueryCacheMonitor(defaultQueryMonitoringConfig, cache);
  
  // 定期分析缓存性能
  setInterval(async () => {
    const status = monitor.getCurrentStatus();
    const report = monitor.generatePerformanceReport();
    
    // 记录关键指标
    console.log('=== 缓存性能报告 ===');
    console.log(`状态: ${status.status} (健康度: ${status.health})`);
    console.log(`命中率: ${status.metrics?.hitRate.toFixed(1)}%`);
    console.log(`响应时间: ${status.metrics?.avgResponseTime.toFixed(0)}ms`);
    console.log(`活跃告警: ${status.activeAlerts}`);
    
    // 检查是否需要优化
    if (status.criticalIssues.length > 0) {
      console.log('发现关键问题:', status.criticalIssues);
      
      // 发送告警
      await sendOptimizationAlert(status.criticalIssues, report);
    }
  }, 5 * 60 * 1000); // 每5分钟分析一次
  
  monitor.startMonitoring();
}

// 辅助函数
async function fetchProductsFromDatabase(category: string) {
  // 模拟数据库查询
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    category,
    price: Math.random() * 100
  }));
}

async function getUserProfile(userId: string) {
  return { id: userId, name: 'User', email: 'user@example.com' };
}

async function getUserOrders(userId: string, status: string) {
  return [{ id: 1, userId, status, total: 100 }];
}

async function getUserPreferences(userId: string) {
  return { theme: 'dark', language: 'en' };
}

async function createProduct(data: any) {
  return { id: Date.now(), ...data, createdAt: new Date() };
}

async function getPopularProducts(limit: number) {
  return Array.from({ length: limit }, (_, i) => ({
    id: i + 1,
    name: `Popular Product ${i + 1}`,
    popularity: Math.random() * 100
  }));
}

async function getCategories() {
  return [{ id: 1, name: 'Electronics' }, { id: 2, name: 'Books' }];
}

async function getProductStats(period: string) {
  return { period, views: 1000, sales: 100 };
}

async function fetchFromPrimarySource(id: string) {
  // 模拟主数据源查询
  throw new Error('Primary source unavailable');
}

async function getDailyStats(date: string) {
  return { date, views: Math.floor(Math.random() * 1000), sales: Math.floor(Math.random() * 100) };
}

async function sendEmergencyNotification(alert: any) {
  console.log('发送紧急通知:', alert.message);
  // 这里可以实现邮件、短信、webhook等通知方式
}

async function sendOptimizationAlert(issues: string[], report: any) {
  console.log('发送优化建议:', issues);
  // 这里可以实现优化建议的发送逻辑
}

// 导出所有示例
export const examples = {
  basicUsage: basicUsageExample,
  batchQuery: batchQueryExample,
  decoratorUsage: ProductService,
  advancedConfig: advancedConfigExample,
  monitoring: monitoringExample,
  cacheWarmup: cacheWarmupExample,
  performanceOptimization: performanceOptimizationExample,
  errorHandling: errorHandlingExample,
  analytics: analyticsExample
};

export default examples;