# 网络请求重试和降级机制

## 概述

本系统为LuckyMart TJ应用提供了完整的网络请求优化解决方案，包括智能重试机制、请求降级策略、网络状态监控、离线支持等功能，确保应用在各种网络环境下都能提供良好的用户体验。

## 核心功能

### 1. 智能重试机制 (network-retry.ts)

- **指数退避算法**: 1s, 2s, 4s, 8s重试延迟
- **网络质量感知**: 根据网络状况自动调整重试策略
- **超时控制**: 防止请求长时间挂起
- **随机抖动**: 避免大量请求同时重试
- **可配置重试策略**: 支持固定间隔、线性、指数退避

```typescript
import { useRetry } from '@/utils/network-retry';

function MyComponent() {
  const { executeWithRetry, isRetrying } = useRetry();
  
  const fetchData = async () => {
    await executeWithRetry(async () => {
      const response = await fetch('/api/data');
      return response.json();
    }, {
      maxRetries: 3,
      baseDelay: 1000,
      timeout: 30000
    });
  };
  
  return <button onClick={fetchData} disabled={isRetrying}>
    {isRetrying ? '加载中...' : '获取数据'}
  </button>;
}
```

### 2. 请求降级策略 (request-degradation.ts)

- **多种降级策略**: 缓存优先、网络优先、过期缓存+后台刷新、离线降级
- **智能缓存管理**: 自动清理过期缓存，控制缓存大小
- **网络质量适应**: 根据网络状况选择最优策略
- **离线数据支持**: 提供离线模式的基础数据访问

```typescript
import { useRequestDegradation, DEGRADATION_PRESETS } from '@/utils/request-degradation';

function ProductList() {
  const { executeWithDegradation } = useRequestDegradation();
  
  useEffect(() => {
    const fetchProducts = async () => {
      await executeWithDegradation(
        'products-list',
        async () => {
          const response = await fetch('/api/products');
          return response.json();
        },
        DEGRADATION_PRESETS.PRODUCTS
      );
    };
    
    fetchProducts();
  }, []);
  
  // 组件渲染...
}
```

### 3. 网络状态监控 (use-network-status.ts)

- **实时网络状态**: 监控在线/离线状态、网络质量
- **性能指标**: 延迟、吞吐量、成功率统计
- **历史记录**: 记录网络事件和变化历史
- **Connection API支持**: 利用浏览器原生网络API

```typescript
import { useNetworkStatus } from '@/hooks/use-network-status';

function NetworkMonitor() {
  const { 
    networkStatus, 
    refreshNetworkStatus, 
    testNetworkLatency 
  } = useNetworkStatus();
  
  return (
    <div>
      <p>网络状态: {networkStatus.isOnline ? '在线' : '离线'}</p>
      <p>网络质量: {networkStatus.networkQuality}</p>
      <button onClick={refreshNetworkStatus}>刷新状态</button>
    </div>
  );
}
```

### 4. 网络状态指示器 (NetworkStatusIndicator.tsx)

- **可视化网络状态**: 直观的网络质量显示
- **多语言支持**: 支持中文、英文、俄语、塔吉克语
- **详细信息**: 点击显示网络诊断信息
- **可自定义样式**: 多种变体和位置选项

```typescript
import NetworkStatusIndicator from '@/components/NetworkStatusIndicator';

function MyApp() {
  return (
    <div>
      {/* 其他组件 */}
      <NetworkStatusIndicator 
        position="top-right"
        variant="full"
        showDetails={true}
      />
    </div>
  );
}
```

### 5. 离线降级组件 (OfflineFallback.tsx)

- **离线状态处理**: 优雅处理网络断开情况
- **自动重试**: 网络恢复时自动重试失败请求
- **降级内容**: 提供离线模式下的替代内容
- **诊断信息**: 显示网络诊断和重试状态

```typescript
import OfflineFallback from '@/components/OfflineFallback';

function MyPage() {
  return (
    <OfflineFallback
      showRetryButton={true}
      showRefreshButton={true}
      enableAutoRetry={true}
    >
      <div>
        {/* 页面内容 */}
        <ProductList />
      </div>
    </OfflineFallback>
  );
}
```

### 6. 请求队列管理 (request-queue.ts)

- **优先级队列**: 支持不同优先级的请求队列
- **并发控制**: 限制同时处理的请求数量
- **批量处理**: 支持批量请求处理
- **网络感知**: 网络差时自动暂停队列
- **依赖管理**: 支持请求间的依赖关系

```typescript
import { useRequestQueue, QueuePriority } from '@/utils/request-queue';

function FormSubmitComponent() {
  const { add, stats } = useRequestQueue();
  
  const submitForm = async (formData) => {
    add(async () => {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      return response.json();
    }, {
      priority: QueuePriority.CRITICAL,
      onSuccess: (result) => {
        console.log('提交成功:', result);
      }
    });
  };
  
  return <form onSubmit={submitForm}>{/* 表单内容 */}</form>;
}
```

## 多语言支持

系统完全支持多语言，包括：

### 支持语言
- 中文 (zh-CN)
- 英文 (en-US)
- 俄语 (ru-RU)
- 塔吉克语 (tg-TJ)

### 翻译内容
- 网络状态提示
- 错误信息
- 重试提示
- 离线提示
- 网络诊断信息

```typescript
// 使用翻译
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <div>{t('network.quality.good', '网络质量良好')}</div>;
}
```

## 性能监控和优化

### 1. 网络请求统计
- 响应时间统计
- 成功率/失败率分析
- 吞吐量监控
- 用户网络环境分析

### 2. 自动优化
- 根据历史数据调整重试策略
- 智能缓存策略
- 网络质量自适应
- 请求优先级动态调整

### 3. 调试工具
- 网络事件日志
- 请求队列监控
- 缓存使用统计
- 性能指标可视化

## 最佳实践

### 1. API调用最佳实践
```typescript
// 使用重试机制包装API调用
const fetchUserData = async () => {
  return await executeWithRetry(async () => {
    const response = await fetch('/api/user/profile');
    if (!response.ok) throw new Error('获取用户数据失败');
    return response.json();
  }, {
    maxRetries: 3,
    baseDelay: 1000,
    timeout: 10000
  });
};
```

### 2. 图片加载优化
```typescript
// 根据网络质量调整图片质量
const optimizedImageUrl = useMemo(() => {
  if (networkQuality === 'poor') {
    return `${imageUrl}?q=60&w=400`;
  }
  return `${imageUrl}?q=90&w=1200`;
}, [imageUrl, networkQuality]);
```

### 3. 表单提交可靠性
```typescript
// 使用队列确保表单提交不丢失
const submitForm = async (formData) => {
  const id = add(async () => {
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    return response.json();
  }, {
    priority: QueuePriority.CRITICAL,
    maxAttempts: 5,
    onSuccess: (result) => {
      // 处理成功结果
    },
    onError: (error) => {
      // 处理错误
    }
  });
};
```

### 4. 实时数据降级
```typescript
// 网络质量好时使用实时数据，差时降级到缓存
const fetchRealtimeData = async () => {
  if (networkQuality === 'excellent' && isOnline) {
    return await executeWithDegradation(
      'realtime-data',
      () => fetch('/api/live-data'),
      { strategy: 'network_first' }
    );
  }
  
  return await executeWithDegradation(
    'cached-data',
    () => fetch('/api/cached-data'),
    { strategy: 'cache_first' }
  );
};
```

## 配置选项

### 重试配置
```typescript
const retryConfig = {
  maxRetries: 3,           // 最大重试次数
  baseDelay: 1000,         // 基础延迟(ms)
  maxDelay: 8000,          // 最大延迟(ms)
  backoffFactor: 2,        // 退避因子
  jitter: true,            // 启用随机抖动
  timeout: 30000,          // 请求超时(ms)
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};
```

### 降级策略配置
```typescript
const degradationConfig = {
  strategy: 'stale_while_revalidate',  // 策略类型
  cacheTimeout: 300000,                // 缓存超时(ms)
  priority: 'medium',                  // 优先级
  staleWhileRevalidate: true,          // 启用过期缓存策略
  fallbackEnabled: true                // 启用降级
};
```

### 队列配置
```typescript
const queueConfig = {
  maxConcurrent: 3,                    // 最大并发数
  maxQueueSize: 1000,                  // 最大队列大小
  defaultRetryDelay: 1000,             // 默认重试延迟
  timeout: 30000,                      // 默认超时时间
  pauseOnNetworkPoor: true             // 网络差时暂停
};
```

## 预设配置

### 产品数据 (PRODUCTS)
```typescript
const PRODUCTS = {
  strategy: DegradationStrategy.STALE_WHILE_REVALIDATE,
  cacheTimeout: 2 * 60 * 1000, // 2分钟缓存
  priority: 'medium',
  staleWhileRevalidate: true,
  fallbackEnabled: true
};
```

### 用户信息 (USER_INFO)
```typescript
const USER_INFO = {
  strategy: DegradationStrategy.NETWORK_FIRST,
  cacheTimeout: 5 * 60 * 1000, // 5分钟缓存
  priority: 'high',
  fallbackEnabled: true
};
```

### 实时数据 (REALTIME)
```typescript
const REALTIME = {
  strategy: DegradationStrategy.NETWORK_FIRST,
  cacheTimeout: 0, // 不缓存
  priority: 'high',
  fallbackEnabled: false
};
```

## 错误处理

### 网络错误类型
- `NetworkError`: 网络连接错误
- `TimeoutError`: 请求超时
- `ServerError`: 服务器错误 (5xx)
- `RateLimitError`: 请求频率限制 (429)
- `OfflineError`: 离线状态错误

### 错误恢复策略
1. **网络错误**: 自动重试，指数退避
2. **服务器错误**: 重试有限次数，然后降级
3. **频率限制**: 等待后重试
4. **离线错误**: 等待网络恢复后重试

## 监控和调试

### 网络诊断信息
```typescript
const diagnostics = getNetworkDiagnostics();
console.log('网络诊断:', {
  当前状态: diagnostics.currentStatus,
  建议: diagnostics.recommendations,
  性能指标: diagnostics.performance
});
```

### 请求队列监控
```typescript
const { stats, getItems } = useRequestQueue();
console.log('队列统计:', stats);
console.log('队列项:', getItems({ status: QueueItemStatus.PROCESSING }));
```

### 网络事件日志
```typescript
const { networkHistory, logNetworkEvent } = useNetworkStatus();

// 记录自定义网络事件
logNetworkEvent({
  type: 'quality-change',
  networkQuality: NetworkQuality.POOR,
  details: { reason: 'high_latency' }
});
```

## 集成指南

### 1. 现有API集成
```typescript
// 替换现有的fetch调用
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    return await executeWithRetry(() => originalFetch(...args));
  } catch (error) {
    console.error('请求失败:', error);
    throw error;
  }
};
```

### 2. 组件集成
```typescript
// 在应用根组件中包装
function App() {
  return (
    <OfflineFallback showRetryButton={true}>
      <NetworkStatusIndicator position="top-right" />
      <MyAppContent />
    </OfflineFallback>
  );
}
```

### 3. 路由集成
```typescript
// 在页面组件中使用降级策略
function ProductPage() {
  const { executeWithDegradation } = useRequestDegradation();
  
  useEffect(() => {
    executeWithDegradation(
      `product-${productId}`,
      () => fetch(`/api/products/${productId}`),
      DEGRADATION_PRESETS.PRODUCTS
    );
  }, [productId]);
  
  return <ProductDetails />;
}
```

## 性能考虑

### 1. 内存使用
- 缓存定期清理，避免内存泄漏
- 队列大小限制，防止内存溢出
- 事件历史记录自动截断

### 2. CPU使用
- 网络质量检查频率控制
- 定时器优化，避免频繁执行
- 批处理减少重复计算

### 3. 网络流量
- 缓存优先减少重复请求
- 图片质量自适应
- 批处理合并请求

## 故障排除

### 常见问题

1. **重试次数过多**
   - 检查网络环境
   - 调整重试配置
   - 检查服务器状态

2. **缓存命中率低**
   - 调整缓存策略
   - 检查缓存键生成
   - 清理过期缓存

3. **队列阻塞**
   - 检查优先级设置
   - 调整并发数
   - 取消长时间等待的请求

4. **离线功能异常**
   - 检查Service Worker
   - 验证缓存策略
   - 测试网络恢复逻辑

### 调试命令

```typescript
// 启用调试模式
localStorage.setItem('network-debug', 'true');

// 查看网络统计
console.log(retryManager.getNetworkQuality());
console.log(degradationManager.getCacheStats());

// 清空缓存
degradationManager.clearCache();
retryManager.resetRetryCounts();
```

## 总结

本网络优化系统提供了完整的网络请求解决方案，包括：

- ✅ 智能重试机制
- ✅ 请求降级策略  
- ✅ 网络状态监控
- ✅ 离线支持
- ✅ 多语言支持
- ✅ 性能优化
- ✅ 调试工具

通过合理使用这些功能，可以在弱网环境下显著提升用户体验，确保应用的可靠性和稳定性。

更多详细信息和示例，请参考 `/examples/network-usage-examples.tsx` 文件。