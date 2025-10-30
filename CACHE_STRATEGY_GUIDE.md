# 缓存策略实施指南

本项目实现了完整的Redis缓存策略，包括多级缓存、缓存监控、告警机制等核心功能。

## 🚀 快速开始

### 1. 环境准备

#### 安装依赖
```bash
cd luckymart-tj
npm install ioredis @types/ioredis
```

#### 配置环境变量
```bash
cp .env.cache.example .env.local
# 编辑 .env.local 文件，设置Redis连接信息
```

#### Redis安装与配置
```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis

# 配置Redis
sudo nano /etc/redis/redis.conf
# 设置密码和保护模式
```

### 2. 初始化缓存系统

```typescript
import { initializeCacheSystem } from './lib/cache-init';

// 初始化缓存系统
const cacheManager = await initializeCacheSystem({
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'your_password',
    db: 0
  },
  monitoring: {
    enabled: true,
    interval: 60000
  }
});
```

### 3. 使用缓存策略

```typescript
import { cacheStrategies, withCache } from './lib/caching-strategy';

// 使用产品缓存策略
const hotProducts = await cacheStrategies.products.getHotProducts(10);
const product = await cacheStrategies.products.getProductDetail('product_123');

// 使用缓存装饰器
class ProductService {
  @withCache((id: string) => `products:detail:${id}`, 600)
  async getProduct(id: string) {
    // 数据库查询逻辑
    return await db.products.findUnique({ where: { id } });
  }
}
```

## 📊 核心功能

### 多级缓存策略

#### 1. 内存缓存 (Memory Cache)
- **用途**: 存储高频访问的临时数据
- **特点**: 快速、容量有限、无持久化
- **默认配置**: 100个条目，5分钟TTL

#### 2. Redis缓存 (Redis Cache)
- **用途**: 存储需要共享和持久化的数据
- **特点**: 容量大、支持持久化、支持集群
- **默认配置**: 无限制条目，可配置TTL

#### 3. 缓存策略
- **MEMORY_ONLY**: 仅使用内存缓存
- **REDIS_ONLY**: 仅使用Redis缓存
- **MEMORY_FIRST**: 内存优先，失败则Redis
- **REDIS_FIRST**: Redis优先，失败则内存
- **WRITE_THROUGH**: 同时写入内存和Redis
- **WRITE_BACK**: 先写内存，延迟同步到Redis

### 缓存管理器

```typescript
import { CacheManager } from './lib/cache-manager';

// 创建自定义缓存管理器
const customCache = CacheManager.getInstance('custom', {
  strategy: CacheStrategy.WRITE_THROUGH,
  ttl: 300,
  enableStats: true
});

// 使用缓存
await customCache.set('key', 'value', 300);
const value = await customCache.get('key');
```

### 业务缓存策略

#### 产品缓存策略
```typescript
import { ProductCacheStrategy } from './lib/caching-strategy';

const productStrategy = new ProductCacheStrategy();

// 获取热门商品 (缓存5分钟)
const hotProducts = await productStrategy.getHotProducts(20);

// 获取产品详情 (缓存10分钟)
const product = await productStrategy.getProductDetail('product_123');

// 搜索产品 (缓存2分钟)
const results = await productStrategy.searchProducts('手机', 1, 20);
```

#### 用户缓存策略
```typescript
import { UserCacheStrategy } from './lib/caching-strategy';

const userStrategy = new UserCacheStrategy();

// 获取用户资料 (缓存30分钟)
const profile = await userStrategy.getUserProfile('user_123');

// 获取购物车 (缓存5分钟)
const cart = await userStrategy.getUserCart('user_123');
```

#### 配置缓存策略
```typescript
import { ConfigCacheStrategy } from './lib/caching-strategy';

const configStrategy = new ConfigCacheStrategy();

// 获取应用配置 (缓存1小时)
const appConfig = await configStrategy.getAppConfig();

// 刷新配置
await configStrategy.refreshConfig('app');
```

### 缓存监控与告警

#### 启动监控
```typescript
import { startCacheMonitoring } from './lib/cache-monitor';

await startCacheMonitoring();
```

#### 获取监控指标
```typescript
import { cacheMonitor } from './lib/cache-monitor';

// 获取历史指标
const metrics = cacheMonitor.getMetricsHistory(60 * 60 * 1000); // 最近1小时

// 获取告警列表
const alerts = cacheMonitor.getAlerts(false); // 未解决的告警
```

#### 监控指标包括
- 缓存命中率
- 错误率
- 响应时间
- 内存使用量
- Redis连接状态
- 系统资源使用

### API集成示例

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { ProductAPIHandler } from './lib/api-cache-examples';

// 产品列表API
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await ProductAPIHandler.getProductList(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

## 🔧 高级配置

### 自定义缓存策略

```typescript
import { CacheManager, CacheStrategy } from './lib/cache-manager';

const myCache = CacheManager.getInstance('my_app', {
  strategy: CacheStrategy.MEMORY_FIRST,
  ttl: 600, // 10分钟
  enableStats: true,
  fallbackOnError: true,
  preload: true,
  preloadKeys: ['config:app', 'products:hot:10']
});
```

### 批量操作

```typescript
// 批量设置
await cacheManager.setMany([
  { key: 'user:1', data: userData, ttl: 1800 },
  { key: 'user:2', data: userData2, ttl: 1800 },
  { key: 'user:3', data: userData3, ttl: 1800 }
]);

// 批量获取
const users = await cacheManager.getMany(['user:1', 'user:2', 'user:3']);
```

### 模式删除

```typescript
// 删除所有产品相关缓存
await cacheManager.deletePattern('products:*');

// 删除指定用户的所有缓存
await cacheManager.deletePattern(`user:${userId}:*`);
```

### 缓存失效机制

```typescript
import { invalidateCache } from './lib/cache-manager';

class ProductService {
  @invalidateCache('products:*')
  async updateProduct(id: string, data: any) {
    // 更新数据库后自动失效相关缓存
    return await db.products.update({ where: { id }, data });
  }
}
```

## 📈 性能优化

### 缓存键设计原则

```typescript
// 使用层级结构
cacheKeyBuilder.products.list(1, 20, 'electronics')
// 结果: products:list:1:20:electronics

// 包含业务含义
cacheKeyBuilder.user.orders('user123', 2)
// 结果: user:orders:user123:2

// 版本控制
cacheKeyBuilder.config.app() + ':v2'
// 结果: config:app:v2
```

### TTL策略

- **热点数据**: 5-30分钟
- **用户数据**: 15-60分钟
- **配置数据**: 1-24小时
- **统计数据**: 5-30分钟
- **静态数据**: 24-168小时

### 监控指标目标

- **缓存命中率**: > 80%
- **错误率**: < 5%
- **响应时间**: < 100ms
- **内存使用**: < 512MB

## 🚨 故障处理

### 连接失败处理

缓存系统支持自动故障转移：
1. Redis连接失败时自动使用内存缓存
2. 内存缓存满时自动清理最少使用的数据
3. 错误率过高时触发告警

### 缓存穿透防护

```typescript
// 使用布隆过滤器或空值缓存
const cacheKey = `product:${productId}`;
let product = await cache.get(cacheKey);

if (product === null) {
  product = await db.products.findUnique({ where: { id: productId } });
  
  // 即使数据库中不存在也缓存一个空值，防止穿透
  if (product) {
    await cache.set(cacheKey, product, ttl);
  } else {
    await cache.set(cacheKey, null, 60); // 缓存空值1分钟
  }
}
```

### 缓存雪崩防护

```typescript
// 使用随机过期时间，避免同时失效
const ttl = baseTtl + Math.random() * baseTtl * 0.1;

// 分批预热缓存
const preloadBatch = (items: any[], batchSize: number) => {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    setTimeout(() => preloadBatchItems(batch), i);
  }
};
```

## 📝 最佳实践

### 1. 缓存使用原则
- 只缓存不频繁变化的数据
- 设置合理的TTL时间
- 避免缓存过大对象
- 定期清理过期缓存

### 2. 键命名规范
- 使用层级结构
- 包含版本信息
- 避免特殊字符
- 控制键长度

### 3. 性能考虑
- 使用批量操作
- 避免频繁的增删改
- 合理设置缓存容量
- 监控缓存指标

### 4. 安全考虑
- 设置Redis访问密码
- 限制网络访问
- 监控异常访问
- 定期更新密钥

## 🔄 部署与运维

### 启动缓存系统

```bash
# 开发环境
npm run cache:dev

# 生产环境
npm run cache:start

# 查看状态
npm run cache:status

# 停止系统
npm run cache:stop
```

### 监控面板

访问 `/api/cache/metrics` 获取实时指标数据，或集成到现有的监控系统中。

### 日志配置

```typescript
import { logger } from './lib/logger';

// 设置日志级别
logger.level = process.env.LOG_LEVEL || 'info';

// 缓存操作日志
logger.info('缓存操作', { operation: 'get', key, hitRate: 0.85 });
```

## 📚 API参考

### CacheManager API

```typescript
class CacheManager {
  static getInstance(name: string, config?: CacheConfig): CacheManager
  
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, data: T, ttl?: number): Promise<boolean>
  async delete(key: string): Promise<boolean>
  async getMany<T>(keys: string[]): Promise<Record<string, T>>
  async setMany(items: Array<{key: string, data: any, ttl?: number}>): Promise<boolean>
  async deletePattern(pattern: string): Promise<number>
  getStats(): CacheManagerStats
}
```

### CacheMonitor API

```typescript
class CacheMonitor {
  start(): void
  stop(): void
  recordOperation(operation: string, duration: number, success: boolean): void
  getMetricsHistory(duration: number): CacheMetrics[]
  getAlerts(resolved?: boolean): CacheAlert[]
  resolveAlert(alertId: string): boolean
}
```

### 缓存策略类

```typescript
// 产品缓存
class ProductCacheStrategy {
  getHotProducts(limit?: number): Promise<any[]>
  getProductDetail(id: string): Promise<any>
  getProductList(page?: number, limit?: number, category?: string): Promise<any>
  updateProduct(id: string, data: any): Promise<any>
}

// 用户缓存
class UserCacheStrategy {
  getUserProfile(userId: string): Promise<any>
  getUserCart(userId: string): Promise<any>
  updateUserBalance(userId: string, amount: number, type: 'increase' | 'decrease'): Promise<any>
}
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 🆘 故障排除

### 常见问题

**Q: Redis连接失败**
A: 检查Redis服务状态、连接配置、网络连通性

**Q: 缓存命中率低**
A: 检查TTL设置、缓存键设计、数据访问模式

**Q: 内存使用过高**
A: 调整缓存容量设置、优化缓存策略、定期清理

**Q: 响应时间过长**
A: 检查网络延迟、Redis性能、缓存配置

### 调试工具

```bash
# 检查Redis状态
redis-cli ping

# 查看Redis内存使用
redis-cli info memory

# 查看缓存键
redis-cli keys "luckymart:*"

# 清空所有缓存
redis-cli flushall
```

如需更多帮助，请查看日志文件或联系技术支持。