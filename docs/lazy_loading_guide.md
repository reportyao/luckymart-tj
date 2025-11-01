# 懒加载策略使用指南

## 🚀 快速开始

### 1. 基础集成

在 `app/layout.tsx` 中添加懒加载策略提供者：

```tsx
import { LazyLoadingStrategyProvider } from '@/components/lazy/LazyLoadingStrategy';
import { WeakNetworkProvider } from '@/components/lazy/WeakNetworkAdapter';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LazyLoadingStrategyProvider>
          <WeakNetworkProvider>
            {children}
          </WeakNetworkProvider>
        </LazyLoadingStrategyProvider>
      </body>
    </html>
  );
}
```

### 2. 图片懒加载

使用优化的图片组件：

```tsx
import { OptimizedLazyImage } from '@/components/lazy';

function ProductCard({ imageUrl, title }) {
  return (
    <div>
      <OptimizedLazyImage
        src={imageUrl}
        alt={title}
        width={300}
        height={200}
        placeholder="blur"
        quality={85}
      />
      <h3>{title}</h3>
    </div>
  );
}
```

### 3. API数据懒加载

```tsx
import { ApiLazyLoadingContainer } from '@/components/lazy';

function ProductList() {
  const config = {
    endpoint: '/api/products',
    pagination: {
      enabled: true,
      pageSize: 20,
      initialPage: 1
    },
    prefetch: {
      enabled: true,
      threshold: 80
    }
  };

  return (
    <ApiLazyLoadingContainer config={config}>
      {(data, state) => (
        <div className="grid grid-cols-3 gap-4">
          {data.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </ApiLazyLoadingContainer>
  );
}
```

### 4. 虚拟滚动

```tsx
import { EnhancedVirtualScroll } from '@/components/lazy';

function VirtualList({ items }) {
  return (
    <EnhancedVirtualScroll
      config={{
        items,
        containerHeight: 600,
        renderItem: (item, index) => (
          <div className="p-4 border-b">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ),
        enablePullToRefresh: true,
        selectionMode: true
      }}
    />
  );
}
```

## 📋 常用配置

### 懒加载策略配置

```tsx
const strategy = {
  image: {
    enabled: true,
    quality: 'medium',        // 'low' | 'medium' | 'high'
    placeholder: 'blur',       // 'blur' | 'empty' | 'skeleton'
    progressive: true,         // 渐进式加载
    webpSupport: true,         // WebP格式支持
    lazyLoadThreshold: 50      // 预加载阈值(px)
  },
  component: {
    enabled: true,
    prefetch: true,            // 预加载组件
    priority: 'secondary',     // 'core' | 'secondary' | 'tertiary'
    bundleSplitting: true,     // 代码分割
    cacheSize: 50              // 缓存大小
  },
  data: {
    enabled: true,
    cacheStrategy: 'both',     // 'memory' | 'indexeddb' | 'both'
    prefetchThreshold: 80,     // 预加载阈值(%)
    paginationSize: 20,        // 分页大小
    incrementalLoading: true   // 增量加载
  }
};
```

### 弱网适配配置

```tsx
const weakNetworkConfig = {
  networkTest: {
    enabled: true,
    interval: 30000,           // 检测间隔(ms)
    timeout: 5000,             // 测试超时(ms)
    endpoints: ['/favicon.ico', '/api/health']
  },
  dataOptimization: {
    compression: true,          // 数据压缩
    imageCompression: true,     // 图片压缩
    qualityReduction: 20        // 质量降低百分比
  },
  requestStrategy: {
    timeoutReduction: 0.3,      // 超时时间减少比例
    maxRetries: 2,              // 最大重试次数
    batchRequests: true,        // 批量请求
    requestQueue: true          // 请求队列
  }
};
```

## 🔧 Hook 使用

### useLazyLoading

```tsx
import { useLazyLoading } from '@/components/lazy';

function MyComponent() {
  const { strategy, networkQuality, updateStrategy } = useLazyLoading();
  
  // 动态调整策略
  const handleQualityChange = () => {
    updateStrategy({
      image: { ...strategy.image, quality: 'high' }
    });
  };
  
  return (
    <div>
      <p>网络质量: {networkQuality}</p>
      <button onClick={handleQualityChange}>提升图片质量</button>
    </div>
  );
}
```

### useWeakNetwork

```tsx
import { useWeakNetwork } from '@/components/lazy';

function NetworkAwareComponent() {
  const { state, shouldDisableFeature } = useWeakNetwork();
  
  // 根据网络状态决定功能
  const isHighQualityEnabled = !shouldDisableFeature('high-quality-images');
  const isPreloadEnabled = !shouldDisableFeature('prefetch');
  
  return (
    <div>
      <img 
        src="/image.jpg" 
        quality={isHighQualityEnabled ? 100 : 60}
      />
      {isPreloadEnabled && <PreloadComponent />}
    </div>
  );
}
```

## 📊 性能监控

### 内置监控

系统会自动监控以下指标：

- **图片加载**: 加载时间、缓存命中率
- **API请求**: 响应时间、成功率、重试次数
- **虚拟滚动**: 渲染性能、内存使用
- **网络状态**: 质量变化、连接类型

### 自定义监控

```tsx
import { useEnhancedApi, RequestPriority } from '@/utils/request-manager';

function useApiWithMonitoring(endpoint: string) {
  const { execute } = useEnhancedApi(
    () => fetch(endpoint).then(res => res.json()),
    {
      priority: RequestPriority.HIGH,
      monitoring: {
        trackPerformance: true,
        trackBusinessMetrics: true,
        metricName: 'api_endpoint_performance'
      }
    }
  );
  
  return execute;
}
```

## 🛠️ 调试工具

### 演示页面

访问 `/lazy-loading-demo` 查看完整演示

### 测试页面

访问 `/test-lazy-loading` 进行功能测试

### 状态指示器

系统会在左下角显示网络状态和数据使用情况

## ⚠️ 注意事项

### 1. 图片优化
- 确保图片服务支持 WebP 格式
- 合理设置图片尺寸和质量
- 使用适当的占位符类型

### 2. 数据缓存
- 合理设置缓存 TTL
- 避免缓存过大的数据
- 定期清理过期缓存

### 3. 虚拟滚动
- 正确计算项目高度
- 设置合适的过扫描数量
- 处理动态高度变化

### 4. 网络适配
- 测试不同网络环境下的表现
- 合理设置超时和重试参数
- 提供离线模式支持

## 🔗 相关资源

- [完整策略文档](./lazy_loading_strategy.md)
- [完成报告](./lazy_loading_completion_report.md)
- [API参考](./lazy_loading_index.md)
- [示例代码](./examples/)

---

如有问题，请查看详细文档或联系开发团队。