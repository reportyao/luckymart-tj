# LuckyMart-TJ 资源懒加载和缓存策略实现指南

## 1. 项目现状分析

### 1.1 已有优化基础
- ✅ 基础缓存管理器（CacheManager）和内存缓存
- ✅ Service Worker（NetworkAwareServiceWorker）用于弱网优化
- ✅ 基础图片优化配置（WebP/AVIF格式）
- ✅ 基础性能监控（use-mobile-performance）
- ✅ Webpack代码分割和打包优化

### 1.2 待完善的优化点
- ❌ 缺少图片懒加载组件
- ❌ 缺少虚拟滚动组件
- ❌ 缺少路由级别的代码分割
- ❌ 缺少组件级别的动态导入
- ❌ IndexedDB缓存策略不完善
- ❌ 缺少预加载和关键资源优先加载策略

## 2. 整体架构设计

### 2.1 分层缓存架构
```
┌─────────────────────────────────────────────────────────┐
│                    用户界面层                              │
├─────────────────────────────────────────────────────────┤
│                  组件懒加载层                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ 路由懒加载   │ │ 组件懒加载   │ │ 图片懒加载   │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
├─────────────────────────────────────────────────────────┤
│                 多层缓存策略                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │  内存缓存    │ │  IndexedDB  │ │   Service   │        │
│  │   (LRU)    │ │             │ │   Worker    │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
├─────────────────────────────────────────────────────────┤
│                   网络层                                 │
└─────────────────────────────────────────────────────────┘
```

### 2.2 性能目标
- 初始页面加载时间 < 2秒
- 图片懒加载延迟 < 100ms
- 路由切换时间 < 300ms
- 缓存命中率 > 80%
- 内存使用 < 50MB

## 3. 核心组件实现

### 3.1 图片懒加载组件

#### 3.1.1 基础图片懒加载组件
```typescript
// components/lazy/LazyImage.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  quality?: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = 'empty',
  blurDataURL,
  quality = 85,
  priority = false,
  loading = 'lazy',
  onLoad,
  onError,
  sizes,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // 使用Intersection Observer实现懒加载
  const { ref: intersectionRef } = useIntersectionObserver(
    useCallback((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isInView) {
        setIsInView(true);
      }
    }, [isInView]),
    {
      rootMargin: '50px', // 提前50px开始加载
      threshold: 0.01,
    }
  );

  // 设置交叉观察器引用
  useEffect(() => {
    if (imgRef.current && intersectionRef) {
      (intersectionRef as any).current = imgRef.current;
    }
  }, [intersectionRef]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setError(true);
    onError?.();
  }, [onError]);

  // 如果是错误状态，显示占位符
  if (error) {
    return (
      <div 
        ref={imgRef}
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width, height }}
      >
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* 占位符 */}
      {!isLoaded && (
        <div 
          className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`}
          style={{ width, height }}
        >
          {placeholder === 'blur' && blurDataURL && (
            <Image
              src={blurDataURL}
              alt=""
              fill
              className="filter blur-sm"
              aria-hidden="true"
            />
          )}
        </div>
      )}
      
      {/* 实际图片 */}
      {(isInView || priority) && (
        <Image
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`${className} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          quality={quality}
          priority={priority}
          loading={loading}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
```

#### 3.1.2 图片网格懒加载组件
```typescript
// components/lazy/LazyImageGrid.tsx
'use client';

import React, { useState, useMemo } from 'react';
import LazyImage from './LazyImage';
import { VirtualizedGrid } from './VirtualizedGrid';

interface LazyImageGridProps {
  images: Array<{
    id: string;
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  columns?: number;
  gap?: number;
  className?: string;
  itemHeight?: number;
}

const LazyImageGrid: React.FC<LazyImageGridProps> = ({
  images,
  columns = 3,
  gap = 16,
  className = '',
  itemHeight = 200,
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });

  // 计算网格项目
  const gridItems = useMemo(() => {
    return images.map((image, index) => ({
      ...image,
      gridColumn: (index % columns) + 1,
      gridRow: Math.floor(index / columns) + 1,
    }));
  }, [images, columns]);

  // 虚拟滚动容器
  const VirtualizedImageGrid = useMemo(() => {
    return React.memo(({ visibleItems }: { visibleItems: typeof gridItems }) => (
      <div className={`grid gap-${gap} ${className}`} style={{ 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        minHeight: Math.ceil(images.length / columns) * (itemHeight + gap)
      }}>
        {visibleItems.map((image) => (
          <div key={image.id} className="relative">
            <LazyImage
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="w-full h-full object-cover rounded-lg"
              placeholder="blur"
              quality={75}
              loading="lazy"
              sizes={`(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw`}
            />
          </div>
        ))}
      </div>
    ));
  }, [columns, gap, className, itemHeight]);

  return (
    <VirtualizedGrid
      items={gridItems}
      itemHeight={itemHeight}
      containerHeight={600}
      overscan={5}
      renderItem={({ item }) => (
        <LazyImage
          key={item.id}
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          className="w-full h-full object-cover rounded-lg"
          placeholder="blur"
          quality={75}
          loading="lazy"
          sizes={`(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw`}
        />
      )}
    />
  );
};

export default LazyImageGrid;
```

### 3.2 虚拟滚动组件

#### 3.2.1 基础虚拟滚动列表
```typescript
// components/lazy/VirtualizedList.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onEndReached,
  onEndReachedThreshold = 0.8,
}: VirtualizedListProps<T>) {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // 计算可见区域
  const visibleRange = useMemo(() => {
    let totalHeight = 0;
    let startIndex = 0;
    let endIndex = items.length - 1;

    // 找到起始索引
    for (let i = 0; i < items.length; i++) {
      const height = typeof itemHeight === 'function' ? itemHeight(i) : itemHeight;
      if (totalHeight + height > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      totalHeight += height;
    }

    // 找到结束索引
    totalHeight = 0;
    for (let i = startIndex; i < items.length; i++) {
      const height = typeof itemHeight === 'function' ? itemHeight(i) : itemHeight;
      totalHeight += height;
      
      if (totalHeight > containerHeight + scrollTop) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
    }

    return { startIndex, endIndex };
  }, [items.length, itemHeight, scrollTop, containerHeight, overscan]);

  // 计算总高度
  const totalHeight = useMemo(() => {
    if (typeof itemHeight === 'function') {
      return items.reduce((total, _, index) => total + itemHeight(index), 0);
    }
    return items.length * itemHeight;
  }, [items, itemHeight]);

  // 计算偏移量
  const offsetY = useMemo(() => {
    let offset = 0;
    for (let i = 0; i < visibleRange.startIndex; i++) {
      offset += typeof itemHeight === 'function' ? itemHeight(i) : itemHeight;
    }
    return offset;
  }, [visibleRange.startIndex, itemHeight]);

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);

    // 检查是否到达底部
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage >= onEndReachedThreshold && onEndReached) {
      onEndReached();
    }
  }, [onEndReached, onEndReachedThreshold]);

  // 获取可见项目
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.startIndex + index}
              style={{
                height: typeof itemHeight === 'function' 
                  ? itemHeight(visibleRange.startIndex + index) 
                  : itemHeight,
              }}
            >
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualizedList;
```

#### 3.2.2 虚拟滚动网格
```typescript
// components/lazy/VirtualizedGrid.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VirtualizedGridProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  columns: number;
  gap?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

function VirtualizedGrid<T>({
  items,
  itemHeight,
  containerHeight,
  columns,
  gap = 16,
  renderItem,
  overscan = 3,
  className = '',
  onEndReached,
  onEndReachedThreshold = 0.8,
}: VirtualizedGridProps<T>) {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // 计算可见区域
  const visibleRange = useMemo(() => {
    const rowsInViewport = Math.ceil(containerHeight / (itemHeight + gap));
    const totalRows = Math.ceil(items.length / columns);
    
    // 计算起始行
    const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const endRow = Math.min(totalRows - 1, startRow + rowsInViewport + overscan * 2);

    // 转换为项目索引
    const startIndex = startRow * columns;
    const endIndex = Math.min(items.length - 1, (endRow + 1) * columns - 1);

    return { startIndex, endIndex, startRow, endRow };
  }, [items.length, columns, itemHeight, gap, scrollTop, containerHeight, overscan]);

  // 计算网格容器样式
  const gridStyle = useMemo(() => {
    const totalRows = Math.ceil(items.length / columns);
    const totalHeight = totalRows * (itemHeight + gap) - gap;

    return {
      height: totalHeight,
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: `${gap}px`,
      position: 'relative' as const,
    };
  }, [items.length, columns, itemHeight, gap]);

  // 计算偏移
  const offsetY = useMemo(() => {
    return visibleRange.startRow * (itemHeight + gap);
  }, [visibleRange.startRow, itemHeight, gap]);

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);

    // 检查是否到达底部
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage >= onEndReachedThreshold && onEndReached) {
      onEndReached();
    }
  }, [onEndReached, onEndReachedThreshold]);

  // 获取可见项目
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={gridStyle}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            display: 'contents',
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.startIndex + index}
              style={{
                height: `${itemHeight}px`,
              }}
            >
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { VirtualizedGrid };
```

### 3.3 路由级别的代码分割

#### 3.3.1 动态路由组件
```typescript
// components/lazy/RouteLoader.tsx
'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// 预加载配置
const PRELOAD_CONFIGS = {
  // 核心页面 - 预加载
  core: [
    '/',
    '/lottery',
    '/wallet',
    '/profile'
  ],
  // 次要页面 - 按需加载
  secondary: [
    '/orders',
    '/transactions', 
    '/settings',
    '/invitation',
    '/resale',
    '/withdraw',
    '/recharge'
  ],
  // 管理页面 - 延迟加载
  admin: [
    '/admin',
    '/admin/users',
    '/admin/products',
    '/admin/orders',
    '/admin/analytics',
    '/admin/system-settings'
  ]
};

// 路由预加载Hook
export const useRoutePreloading = () => {
  const router = useRouter();

  // 预加载核心页面
  const preloadCoreRoutes = React.useCallback(() => {
    PRELOAD_CONFIGS.core.forEach(route => {
      router.prefetch(route);
    });
  }, [router]);

  // 预加载次要页面
  const preloadSecondaryRoutes = React.useCallback(() => {
    setTimeout(() => {
      PRELOAD_CONFIGS.secondary.forEach(route => {
        router.prefetch(route);
      });
    }, 1000); // 延迟1秒预加载
  }, [router]);

  // 预加载管理页面
  const preloadAdminRoutes = React.useCallback(() => {
    setTimeout(() => {
      PRELOAD_CONFIGS.admin.forEach(route => {
        router.prefetch(route);
      });
    }, 3000); // 延迟3秒预加载
  }, [router]);

  return {
    preloadCoreRoutes,
    preloadSecondaryRoutes,
    preloadAdminRoutes
  };
};

// 动态导入组件
export const LazyComponents = {
  // 核心组件 - 预加载
  LotteryCard: dynamic(() => import('@/components/EnhancedLotteryCard'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />,
    ssr: false
  }),

  WalletCard: dynamic(() => import('@/components/WalletCard'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />,
    ssr: false
  }),

  ProfileCard: dynamic(() => import('@/components/ProfileCard'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-24 rounded-lg" />,
    ssr: false
  }),

  // 次要组件 - 按需加载
  OrderHistory: dynamic(() => import('@/components/OrderHistory'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />,
    ssr: false
  }),

  TransactionList: dynamic(() => import('@/components/TransactionList'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />,
    ssr: false
  }),

  SettingsPanel: dynamic(() => import('@/components/SettingsPanel'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />,
    ssr: false
  }),

  InvitationCode: dynamic(() => import('@/components/InvitationCode'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-40 rounded-lg" />,
    ssr: false
  }),

  ResaleList: dynamic(() => import('@/components/ResaleList'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-56 rounded-lg" />,
    ssr: false
  }),

  WithdrawForm: dynamic(() => import('@/components/WithdrawForm'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />,
    ssr: false
  }),

  RechargeForm: dynamic(() => import('@/components/RechargeForm'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />,
    ssr: false
  }),

  // 管理组件 - 延迟加载
  AdminDashboard: dynamic(() => import('@/components/admin/AdminDashboard'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />,
    ssr: false
  }),

  UserManagement: dynamic(() => import('@/components/admin/UserManagement'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-80 rounded-lg" />,
    ssr: false
  }),

  ProductManagement: dynamic(() => import('@/components/admin/ProductManagement'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-80 rounded-lg" />,
    ssr: false
  }),

  AnalyticsPanel: dynamic(() => import('@/components/admin/AnalyticsPanel'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />,
    ssr: false
  }),

  SystemSettings: dynamic(() => import('@/components/admin/SystemSettings'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />,
    ssr: false
  })
};

// 路由加载组件
interface RouteLoaderProps {
  children: React.ReactNode;
  priority?: 'core' | 'secondary' | 'admin';
  fallback?: React.ReactNode;
}

export const RouteLoader: React.FC<RouteLoaderProps> = ({
  children,
  priority = 'secondary',
  fallback = <div className="animate-pulse bg-gray-200 rounded-lg h-32" />
}) => {
  const { preloadCoreRoutes, preloadSecondaryRoutes, preloadAdminRoutes } = useRoutePreloading();

  React.useEffect(() => {
    switch (priority) {
      case 'core':
        preloadCoreRoutes();
        break;
      case 'secondary':
        preloadSecondaryRoutes();
        break;
      case 'admin':
        preloadAdminRoutes();
        break;
    }
  }, [priority, preloadCoreRoutes, preloadSecondaryRoutes, preloadAdminRoutes]);

  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

export default RouteLoader;
```

### 3.4 组件级别的动态导入

#### 3.4.1 智能组件加载器
```typescript
// components/lazy/SmartComponentLoader.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useMobilePerformance } from '@/hooks/use-mobile-performance';

interface LoadingStrategy {
  immediate: boolean;        // 立即加载
  lazy: boolean;            // 懒加载
  prefetch: boolean;        // 预加载
  priority: number;         // 优先级
}

interface ComponentLoadConfig {
  importFn: () => Promise<{ default: React.ComponentType<any> }>;
  loadingComponent?: React.ComponentType;
  fallbackComponent?: React.ComponentType;
  strategy: LoadingStrategy;
  dependencies?: any[];     // 依赖项变更时重新加载
}

interface SmartComponentLoaderProps {
  config: ComponentLoadConfig;
  props?: any;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// 加载策略映射
const STRATEGY_CONFIGS: Record<string, LoadingStrategy> = {
  immediate: { immediate: true, lazy: false, prefetch: true, priority: 1 },
  lazy: { immediate: false, lazy: true, prefetch: false, priority: 2 },
  prefetch: { immediate: false, lazy: false, prefetch: true, priority: 3 },
  background: { immediate: false, lazy: true, prefetch: true, priority: 4 }
};

const SmartComponentLoader: React.FC<SmartComponentLoaderProps> = ({
  config,
  props = {},
  onLoad,
  onError
}) => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [shouldLoad, setShouldLoad] = useState(config.strategy.immediate);

  const { networkQuality, isOnline } = useNetworkStatus();
  const { metrics } = useMobilePerformance();

  // 动态加载组件
  const loadComponent = useCallback(async () => {
    if (Component || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const module = await config.importFn();
      setComponent(() => module.default);
      onLoad?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('组件加载失败');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [Component, isLoading, config, onLoad, onError]);

  // 根据策略决定加载时机
  useEffect(() => {
    if (!shouldLoad) return;

    if (config.strategy.immediate) {
      loadComponent();
    } else if (config.strategy.lazy && isOnline && networkQuality !== 'poor') {
      const timer = setTimeout(loadComponent, 100);
      return () => clearTimeout(timer);
    } else if (config.strategy.prefetch) {
      // 网络空闲时预加载
      const idleCallback = (cb: FrameRequestCallback) => {
        if ('requestIdleCallback' in window) {
          return (window as any).requestIdleCallback(cb, { timeout: 3000 });
        }
        return setTimeout(cb, 100);
      };

      idleCallback(() => {
        loadComponent();
      });
    }
  }, [shouldLoad, config.strategy, loadComponent, isOnline, networkQuality]);

  // 依赖项变更时重新加载
  useEffect(() => {
    if (config.dependencies && config.dependencies.length > 0) {
      setComponent(null);
      setError(null);
      if (config.strategy.immediate) {
        setShouldLoad(true);
      }
    }
  }, [config.dependencies, config.strategy.immediate]);

  // 监听滚动到视窗时加载
  useEffect(() => {
    if (!config.strategy.lazy || Component) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    // 观察当前组件容器
    const element = document.querySelector('[data-smart-component]');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [config.strategy.lazy, Component]);

  // 渲染加载状态
  if (isLoading && !Component) {
    if (config.loadingComponent) {
      const LoadingComponent = config.loadingComponent;
      return <LoadingComponent {...props} />;
    }
    return (
      <div className="animate-pulse bg-gray-200 rounded-lg h-32 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  // 渲染错误状态
  if (error && !Component) {
    if (config.fallbackComponent) {
      const FallbackComponent = config.fallbackComponent;
      return <FallbackComponent {...props} error={error} />;
    }
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-600">组件加载失败</div>
        <button 
          onClick={loadComponent}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          重试
        </button>
      </div>
    );
  }

  // 渲染组件
  if (Component) {
    return <Component {...props} />;
  }

  // 默认占位符
  return (
    <div 
      data-smart-component
      className="bg-gray-50 border border-gray-200 rounded-lg h-32 flex items-center justify-center"
    >
      <div className="text-gray-400 text-sm">等待加载...</div>
    </div>
  );
};

export default SmartComponentLoader;

// 预定义的组件加载配置
export const ComponentConfigs = {
  // 核心组件 - 立即加载
  LotteryCard: {
    importFn: () => import('@/components/EnhancedLotteryCard'),
    strategy: STRATEGY_CONFIGS.immediate,
    loadingComponent: () => (
      <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
    )
  },

  WalletCard: {
    importFn: () => import('@/components/WalletCard'),
    strategy: STRATEGY_CONFIGS.immediate,
    loadingComponent: () => (
      <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
    )
  },

  // 列表组件 - 懒加载
  OrderList: {
    importFn: () => import('@/components/OrderList'),
    strategy: STRATEGY_CONFIGS.lazy,
    loadingComponent: () => (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
        ))}
      </div>
    )
  },

  TransactionList: {
    importFn: () => import('@/components/TransactionList'),
    strategy: STRATEGY_CONFIGS.lazy,
    loadingComponent: () => (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
        ))}
      </div>
    )
  },

  // 图表组件 - 预加载
  Chart: {
    importFn: () => import('@/components/charts/Chart'),
    strategy: STRATEGY_CONFIGS.prefetch,
    loadingComponent: () => (
      <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
    )
  },

  // 管理组件 - 背景预加载
  AdminPanel: {
    importFn: () => import('@/components/admin/AdminPanel'),
    strategy: STRATEGY_CONFIGS.background,
    loadingComponent: () => (
      <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
    )
  }
};
```

### 3.5 缓存策略系统

#### 3.5.1 IndexedDB缓存管理器
```typescript
// utils/indexeddb-cache.ts
interface CacheConfig {
  name: string;
  version: number;
  stores: {
    [key: string]: {
      keyPath: string;
      autoIncrement?: boolean;
      indexes?: { [key: string]: string };
    };
  };
}

interface CacheOptions {
  ttl?: number;           // 生存时间
  maxSize?: number;       // 最大大小
  compress?: boolean;     // 是否压缩
  priority?: number;      // 优先级
}

class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private config: CacheConfig;
  private isInitialized = false;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  // 初始化数据库
  async init(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        Object.entries(this.config.stores).forEach(([storeName, storeConfig]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, {
              keyPath: storeConfig.keyPath,
              autoIncrement: storeConfig.autoIncrement
            });

            // 创建索引
            if (storeConfig.indexes) {
              Object.entries(storeConfig.indexes).forEach(([indexName, keyPath]) => {
                objectStore.createIndex(indexName, keyPath, { unique: false });
              });
            }
          }
        });
      };
    });
  }

  // 获取数据库实例
  private getDB(): IDBDatabase {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // 存储数据
  async set<T>(storeName: string, key: string, data: T, options?: CacheOptions): Promise<void> {
    const db = this.getDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // 压缩数据
    let processedData = data;
    if (options?.compress) {
      processedData = await this.compress(data) as T;
    }

    // 添加元数据
    const cacheItem = {
      key,
      data: processedData,
      timestamp: Date.now(),
      ttl: options?.ttl,
      size: JSON.stringify(processedData).length,
      priority: options?.priority || 0
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cacheItem);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 获取数据
  async get<T>(storeName: string, key: string): Promise<T | null> {
    const db = this.getDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // 检查TTL
        if (result.ttl && Date.now() - result.timestamp > result.ttl) {
          this.delete(storeName, key);
          resolve(null);
          return;
        }

        // 解压数据
        if (result.data && typeof result.data === 'string' && result.data.startsWith('compressed:')) {
          this.decompress(result.data).then((decompressed) => {
            resolve(decompressed as T);
          }).catch(() => resolve(null));
        } else {
          resolve(result.data as T);
        }
      };
    });
  }

  // 删除数据
  async delete(storeName: string, key: string): Promise<void> {
    const db = this.getDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 清空存储
  async clear(storeName: string): Promise<void> {
    const db = this.getDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 获取所有键
  async getAllKeys(storeName: string): Promise<string[]> {
    const db = this.getDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  // 根据模式删除
  async deleteByPattern(storeName: string, pattern: string): Promise<number> {
    const keys = await this.getAllKeys(storeName);
    const matchingKeys = keys.filter(key => key.match(pattern));
    
    await Promise.all(matchingKeys.map(key => this.delete(storeName, key)));
    return matchingKeys.length;
  }

  // 获取统计信息
  async getStats(storeName: string): Promise<{
    count: number;
    size: number;
    oldest: number;
    newest: number;
  }> {
    const db = this.getDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const items = request.result;
        const count = items.length;
        const size = items.reduce((sum, item) => sum + (item.size || 0), 0);
        const timestamps = items.map(item => item.timestamp);
        const oldest = timestamps.length > 0 ? Math.min(...timestamps) : 0;
        const newest = timestamps.length > 0 ? Math.max(...timestamps) : 0;

        resolve({ count, size, oldest, newest });
      };
    });
  }

  // 清理过期数据
  async cleanup(storeName: string): Promise<number> {
    const db = this.getDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const items = request.result;
        const now = Date.now();
        const expiredItems = items.filter(item => 
          item.ttl && now - item.timestamp > item.ttl
        );

        Promise.all(expiredItems.map(item => {
          return new Promise<void>((res, rej) => {
            const deleteRequest = store.delete(item.key);
            deleteRequest.onsuccess = () => res();
            deleteRequest.onerror = () => rej(deleteRequest.error);
          });
        })).then(() => {
          resolve(expiredItems.length);
        }).catch(reject);
      };
    });
  }

  // 压缩数据
  private async compress(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    // 简单的Base64编码作为压缩示例
    // 在生产环境中应使用更有效的压缩算法
    return `compressed:${btoa(jsonString)}`;
  }

  // 解压数据
  private async decompress(compressedData: string): Promise<any> {
    if (!compressedData.startsWith('compressed:')) {
      return compressedData;
    }
    
    const base64Data = compressedData.replace('compressed:', '');
    const jsonString = atob(base64Data);
    return JSON.parse(jsonString);
  }
}

// 缓存配置
const CACHE_CONFIG: CacheConfig = {
  name: 'LuckyMartTJCache',
  version: 1,
  stores: {
    // 用户数据缓存
    userData: {
      keyPath: 'key',
      indexes: {
        'byType': 'type',
        'byTimestamp': 'timestamp'
      }
    },
    // 商品数据缓存
    products: {
      keyPath: 'key',
      indexes: {
        'byCategory': 'category',
        'byTimestamp': 'timestamp'
      }
    },
    // 交易数据缓存
    transactions: {
      keyPath: 'key',
      indexes: {
        'byType': 'type',
        'byStatus': 'status',
        'byTimestamp': 'timestamp'
      }
    },
    // 图片缓存
    images: {
      keyPath: 'key',
      indexes: {
        'byUrl': 'url',
        'byTimestamp': 'timestamp'
      }
    },
    // API响应缓存
    apiResponses: {
      keyPath: 'key',
      indexes: {
        'byEndpoint': 'endpoint',
        'byTimestamp': 'timestamp'
      }
    }
  }
};

// 全局缓存实例
export const indexedDBCache = new IndexedDBCache(CACHE_CONFIG);

// 缓存工具函数
export const cacheUtils = {
  // 设置缓存
  async set(key: string, data: any, options?: CacheOptions, storeName: string = 'apiResponses'): Promise<void> {
    await indexedDBCache.set(storeName, key, data, options);
  },

  // 获取缓存
  async get<T>(key: string, storeName: string = 'apiResponses'): Promise<T | null> {
    return indexedDBCache.get<T>(storeName, key);
  },

  // 删除缓存
  async remove(key: string, storeName: string = 'apiResponses'): Promise<void> {
    await indexedDBCache.delete(storeName, key);
  },

  // 模式删除
  async removePattern(pattern: string, storeName: string = 'apiResponses'): Promise<number> {
    return indexedDBCache.deleteByPattern(storeName, pattern);
  },

  // 清空缓存
  async clear(storeName?: string): Promise<void> {
    if (storeName) {
      await indexedDBCache.clear(storeName);
    } else {
      // 清空所有存储
      for (const storeName of Object.keys(CACHE_CONFIG.stores)) {
        await indexedDBCache.clear(storeName);
      }
    }
  },

  // 获取统计信息
  async getStats(storeName: string = 'apiResponses') {
    return indexedDBCache.getStats(storeName);
  },

  // 清理过期数据
  async cleanup(storeName: string = 'apiResponses'): Promise<number> {
    return indexedDBCache.cleanup(storeName);
  }
};

export default indexedDBCache;
```

#### 3.5.2 多层缓存系统
```typescript
// utils/multi-layer-cache.ts
import { cacheManager } from '@/lib/cache-manager';
import { indexedDBCache, cacheUtils } from './indexeddb-cache';

interface CacheLayer {
  name: string;
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, data: T, ttl?: number) => Promise<boolean>;
  delete: (key: string) => Promise<boolean>;
  clear: () => Promise<void>;
  priority: number;
}

interface MultiLayerCacheOptions {
  layers: CacheLayer[];
  strategy: 'memory-first' | 'storage-first' | 'cache-first' | 'network-first';
  ttl: number;
  fallback: boolean;
}

class MultiLayerCache {
  private layers: CacheLayer[];
  private strategy: string;
  private ttl: number;
  private fallback: boolean;
  private stats = {
    hits: 0,
    misses: 0,
    errors: 0
  };

  constructor(options: MultiLayerCacheOptions) {
    this.layers = options.layers.sort((a, b) => a.priority - b.priority);
    this.strategy = options.strategy;
    this.ttl = options.ttl;
    this.fallback = options.fallback;
  }

  // 获取数据
  async get<T>(key: string): Promise<T | null> {
    try {
      let result: T | null = null;

      switch (this.strategy) {
        case 'memory-first':
          result = await this.getFromMemory<T>(key);
          if (result === null) {
            result = await this.getFromStorage<T>(key);
            if (result !== null) {
              // 回写到内存
              await this.setToMemory(key, result);
            }
          }
          break;

        case 'storage-first':
          result = await this.getFromStorage<T>(key);
          if (result === null) {
            result = await this.getFromMemory<T>(key);
          }
          break;

        case 'cache-first':
          result = await this.getSequentially<T>(key);
          break;

        case 'network-first':
          result = await this.getFromMemory<T>(key);
          if (result === null) {
            result = await this.getFromStorage<T>(key);
          }
          break;

        default:
          result = await this.getSequentially<T>(key);
      }

      if (result !== null) {
        this.stats.hits++;
      } else {
        this.stats.misses++;
      }

      return result;
    } catch (error) {
      this.stats.errors++;
      console.error('Multi-layer cache get error:', error);
      return null;
    }
  }

  // 设置数据
  async set<T>(key: string, data: T): Promise<boolean> {
    try {
      const results = await Promise.allSettled(
        this.layers.map(layer => layer.set(key, data, this.ttl))
      );

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      return successCount > 0;
    } catch (error) {
      console.error('Multi-layer cache set error:', error);
      return false;
    }
  }

  // 删除数据
  async delete(key: string): Promise<boolean> {
    try {
      const results = await Promise.allSettled(
        this.layers.map(layer => layer.delete(key))
      );

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      return successCount > 0;
    } catch (error) {
      console.error('Multi-layer cache delete error:', error);
      return false;
    }
  }

  // 清空缓存
  async clear(): Promise<void> {
    try {
      await Promise.allSettled(
        this.layers.map(layer => layer.clear())
      );
    } catch (error) {
      console.error('Multi-layer cache clear error:', error);
    }
  }

  // 获取统计信息
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      layers: this.layers.length
    };
  }

  // 私有方法
  private async getFromMemory<T>(key: string): Promise<T | null> {
    // 内存缓存通过CacheManager
    return cacheManager.products.get<T>(key);
  }

  private async getFromStorage<T>(key: string): Promise<T | null> {
    // IndexedDB缓存
    return indexedDBCache.get<T>('apiResponses', key);
  }

  private async getSequentially<T>(key: string): Promise<T | null> {
    for (const layer of this.layers) {
      const result = await layer.get<T>(key);
      if (result !== null) {
        return result;
      }
    }
    return null;
  }

  private async setToMemory<T>(key: string, data: T): Promise<void> {
    try {
      await cacheManager.products.set(key, data, this.ttl);
    } catch (error) {
      console.warn('Failed to set memory cache:', error);
    }
  }
}

// 创建多层缓存实例
export const createMultiLayerCache = (options: Partial<MultiLayerCacheOptions> = {}) => {
  const defaultLayers: CacheLayer[] = [
    {
      name: 'memory',
      get: <T>(key: string) => cacheManager.products.get<T>(key),
      set: <T>(key: string, data: T, ttl?: number) => cacheManager.products.set(key, data, ttl),
      delete: (key: string) => cacheManager.products.delete(key),
      clear: () => cacheManager.products.clear(),
      priority: 1
    },
    {
      name: 'indexeddb',
      get: <T>(key: string) => indexedDBCache.get<T>('apiResponses', key),
      set: <T>(key: string, data: T, ttl?: number) => indexedDBCache.set('apiResponses', key, data, { ttl }),
      delete: (key: string) => indexedDBCache.delete('apiResponses', key),
      clear: () => indexedDBCache.clear('apiResponses'),
      priority: 2
    }
  ];

  return new MultiLayerCache({
    layers: options.layers || defaultLayers,
    strategy: options.strategy || 'memory-first',
    ttl: options.ttl || 300,
    fallback: options.fallback !== false
  });
};

// 预定义缓存实例
export const productCache = createMultiLayerCache({
  strategy: 'memory-first',
  ttl: 600
});

export const userCache = createMultiLayerCache({
  strategy: 'storage-first',
  ttl: 1800
});

export const apiCache = createMultiLayerCache({
  strategy: 'cache-first',
  ttl: 300
});

export const imageCache = createMultiLayerCache({
  strategy: 'memory-first',
  ttl: 3600
});

export default MultiLayerCache;
```

### 3.6 预加载和关键资源优先加载

#### 3.6.1 资源预加载管理器
```typescript
// utils/resource-preloader.ts
interface PreloadItem {
  type: 'script' | 'style' | 'image' | 'font' | 'route' | 'component';
  url: string;
  priority: 'high' | 'medium' | 'low';
  as?: string;
  crossorigin?: string;
  integrity?: string;
  onLoad?: () => void;
  onError?: () => void;
}

interface PreloadConfig {
  enabled: boolean;
  batchSize: number;
  delayBetweenBatches: number;
  enableIdlePreload: boolean;
  enableNetworkAware: boolean;
}

class ResourcePreloader {
  private config: PreloadConfig;
  private preloadedResources = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();
  private isEnabled = true;

  constructor(config: PreloadConfig) {
    this.config = config;
    this.init();
  }

  private init(): void {
    if (!this.config.enabled) return;

    // 监听网络状态
    if (this.config.enableNetworkAware) {
      this.setupNetworkAware();
    }

    // 监听空闲时间
    if (this.config.enableIdlePreload) {
      this.setupIdlePreload();
    }

    // 监听页面可见性
    this.setupVisibilityAware();
  }

  // 预加载单个资源
  async preload(item: PreloadItem): Promise<void> {
    if (!this.isEnabled || this.preloadedResources.has(item.url)) {
      return;
    }

    const promise = this.createPreloadPromise(item);
    this.loadingPromises.set(item.url, promise);

    try {
      await promise;
      this.preloadedResources.add(item.url);
      item.onLoad?.();
    } catch (error) {
      console.warn(`Failed to preload resource: ${item.url}`, error);
      item.onError?.();
    } finally {
      this.loadingPromises.delete(item.url);
    }
  }

  // 批量预加载
  async preloadBatch(items: PreloadItem[]): Promise<void> {
    if (!this.isEnabled || items.length === 0) return;

    const batches = this.createBatches(items, this.config.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      await Promise.allSettled(
        batch.map(item => this.preload(item))
      );

      // 批次间延迟
      if (i < batches.length - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, this.config.delayBetweenBatches)
        );
      }
    }
  }

  // 预加载图片
  async preloadImage(url: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    return this.preload({
      type: 'image',
      url,
      priority
    });
  }

  // 预加载组件
  async preloadComponent(importFn: () => Promise<any>, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    // 动态导入组件
    return this.preload({
      type: 'component',
      url: '', // 组件没有URL
      priority
    }).then(() => {
      // 实际预加载组件
      return importFn();
    });
  }

  // 预加载路由
  async preloadRoute(path: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    return this.preload({
      type: 'route',
      url: path,
      priority
    });
  }

  // 预加载字体
  async preloadFont(family: string, weight: string = '400', style: string = 'normal'): Promise<void> {
    // 动态生成字体URL
    const fontUrl = this.generateFontUrl(family, weight, style);
    return this.preload({
      type: 'font',
      url: fontUrl,
      priority: 'high',
      as: 'font',
      crossorigin: 'anonymous'
    });
  }

  // 预加载脚本
  async preloadScript(src: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    return this.preload({
      type: 'script',
      url: src,
      priority,
      crossorigin: 'anonymous'
    });
  }

  // 预加载样式
  async preloadStyle(href: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    return this.preload({
      type: 'style',
      url: href,
      priority,
      crossorigin: 'anonymous'
    });
  }

  // 智能预加载根据用户行为
  async smartPreload(context: 'navigation' | 'hover' | 'interaction'): Promise<void> {
    switch (context) {
      case 'navigation':
        // 导航时预加载核心资源
        await this.preloadBatch([
          { type: 'route', url: '/', priority: 'high' },
          { type: 'route', url: '/lottery', priority: 'high' },
          { type: 'route', url: '/wallet', priority: 'high' },
          { type: 'image', url: '/images/logo.png', priority: 'high' },
          { type: 'font', url: this.generateFontUrl('Inter', '400', 'normal'), priority: 'high' }
        ]);
        break;

      case 'hover':
        // 悬停时预加载相关资源
        await this.preloadBatch([
          { type: 'component', url: '', priority: 'medium' },
          { type: 'image', url: '/images/common/loading.png', priority: 'low' }
        ]);
        break;

      case 'interaction':
        // 交互时预加载用户相关资源
        await this.preloadBatch([
          { type: 'route', url: '/profile', priority: 'medium' },
          { type: 'route', url: '/orders', priority: 'medium' }
        ]);
        break;
    }
  }

  // 启用/禁用预加载
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // 获取预加载状态
  getStatus(): {
    enabled: boolean;
    preloadedCount: number;
    loadingCount: number;
  } {
    return {
      enabled: this.isEnabled,
      preloadedCount: this.preloadedResources.size,
      loadingCount: this.loadingPromises.size
    };
  }

  // 创建预加载Promise
  private createPreloadPromise(item: PreloadItem): Promise<void> {
    return new Promise((resolve, reject) => {
      switch (item.type) {
        case 'image':
          this.preloadImageElement(item.url, resolve, reject);
          break;
        case 'script':
          this.preloadScriptElement(item.url, resolve, reject);
          break;
        case 'style':
          this.preloadStyleElement(item.url, resolve, reject);
          break;
        case 'font':
          this.preloadFontElement(item.url, resolve, reject);
          break;
        case 'route':
          // 路由预加载使用Next.js的router.prefetch
          import('next/navigation').then(({ router }) => {
            router.prefetch(item.url);
            resolve();
          });
          break;
        case 'component':
          // 组件预加载
          resolve();
          break;
        default:
          resolve();
      }
    });
  }

  // 预加载图片
  private preloadImageElement(url: string, onLoad: () => void, onError: () => void): void {
    const img = new Image();
    img.onload = onLoad;
    img.onerror = onError;
    img.src = url;
  }

  // 预加载脚本
  private preloadScriptElement(src: string, onLoad: () => void, onError: () => void): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    if (this.hasCrossorigin()) {
      link.crossOrigin = 'anonymous';
    }
    
    link.onload = onLoad;
    link.onerror = onError;
    
    document.head.appendChild(link);
  }

  // 预加载样式
  private preloadStyleElement(href: string, onLoad: () => void, onError: () => void): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    if (this.hasCrossorigin()) {
      link.crossOrigin = 'anonymous';
    }
    
    link.onload = onLoad;
    link.onerror = onError;
    
    document.head.appendChild(link);
  }

  // 预加载字体
  private preloadFontElement(url: string, onLoad: () => void, onError: () => void): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = url;
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    
    link.onload = onLoad;
    link.onerror = onError;
    
    document.head.appendChild(link);
  }

  // 生成字体URL
  private generateFontUrl(family: string, weight: string, style: string): string {
    // 这里可以根据实际需求生成字体URL
    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  }

  // 创建批次
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  // 设置网络感知预加载
  private setupNetworkAware(): void {
    const updatePreloadStrategy = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        
        // 根据网络类型调整预加载策略
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          this.setEnabled(false); // 慢网络时禁用预加载
        } else if (effectiveType === '3g') {
          this.config.batchSize = 2; // 减少批次大小
          this.config.delayBetweenBatches = 2000; // 增加延迟
        } else {
          this.setEnabled(true);
          this.config.batchSize = 5;
          this.config.delayBetweenBatches = 100;
        }
      }
    };

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updatePreloadStrategy);
      updatePreloadStrategy();
    }
  }

  // 设置空闲时间预加载
  private setupIdlePreload(): void {
    const requestIdleCallback = (window as any).requestIdleCallback;
    if (requestIdleCallback) {
      requestIdleCallback(() => {
        this.preloadIdleResources();
      }, { timeout: 3000 });
    } else {
      setTimeout(() => {
        this.preloadIdleResources();
      }, 1000);
    }
  }

  // 预加载空闲资源
  private async preloadIdleResources(): Promise<void> {
    const lowPriorityItems: PreloadItem[] = [
      { type: 'image', url: '/images/common/placeholder.png', priority: 'low' },
      { type: 'image', url: '/images/common/loading.png', priority: 'low' },
      { type: 'style', url: '/styles/animations.css', priority: 'low' }
    ];

    await this.preloadBatch(lowPriorityItems);
  }

  // 设置页面可见性感知预加载
  private setupVisibilityAware(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // 页面变为可见时，重新启用预加载
        this.setEnabled(true);
      } else {
        // 页面隐藏时，减少预加载频率
        this.config.batchSize = 1;
      }
    });
  }

  // 检查是否支持跨域
  private hasCrossorigin(): boolean {
    return !document.location.href.startsWith('http://');
  }
}

// 全局预加载实例
export const resourcePreloader = new ResourcePreloader({
  enabled: true,
  batchSize: 3,
  delayBetweenBatches: 500,
  enableIdlePreload: true,
  enableNetworkAware: true
});

// React Hook for预加载
export const useResourcePreloader = () => {
  const preloadOnHover = React.useCallback((url: string) => {
    resourcePreloader.preloadRoute(url, 'medium');
  }, []);

  const preloadOnNavigation = React.useCallback((context: 'navigation' | 'hover' | 'interaction') => {
    resourcePreloader.smartPreload(context);
  }, []);

  const preloadImages = React.useCallback((urls: string[]) => {
    return Promise.all(urls.map(url => resourcePreloader.preloadImage(url, 'low')));
  }, []);

  const preloadComponent = React.useCallback((importFn: () => Promise<any>) => {
    return resourcePreloader.preloadComponent(importFn, 'medium');
  }, []);

  return {
    preloadOnHover,
    preloadOnNavigation,
    preloadImages,
    preloadComponent,
    preloader: resourcePreloader
  };
};

export default ResourcePreloader;
```

### 3.7 性能监控和优化建议

#### 3.7.1 懒加载性能监控组件
```typescript
// components/performance/LazyLoadingMonitor.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useMobilePerformance } from '@/hooks/use-mobile-performance';

interface LazyLoadingMetrics {
  lazyLoadCount: number;
  lazyLoadErrors: number;
  averageLoadTime: number;
  cacheHitRate: number;
  memoryUsage: number;
}

interface LazyLoadingMonitorProps {
  showDebugInfo?: boolean;
  onMetricsUpdate?: (metrics: LazyLoadingMetrics) => void;
}

const LazyLoadingMonitor: React.FC<LazyLoadingMonitorProps> = ({
  showDebugInfo = false,
  onMetricsUpdate
}) => {
  const { metrics, getPerformanceReport } = useMobilePerformance();
  const [lazyMetrics, setLazyMetrics] = useState<LazyLoadingMetrics>({
    lazyLoadCount: 0,
    lazyLoadErrors: 0,
    averageLoadTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const report = getPerformanceReport();
      if (report) {
        const newMetrics: LazyLoadingMetrics = {
          lazyLoadCount: report.network.totalRequests,
          lazyLoadErrors: report.alerts.filter(a => a.type === 'error').length,
          averageLoadTime: report.network.averageResponseTime,
          cacheHitRate: report.network.cachedRequests / Math.max(report.network.totalRequests, 1),
          memoryUsage: metrics?.usedHeapSize || 0
        };

        setLazyMetrics(newMetrics);
        onMetricsUpdate?.(newMetrics);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [metrics, getPerformanceReport, onMetricsUpdate]);

  if (!showDebugInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-sm z-50 max-w-sm">
      <div className="font-semibold mb-2">懒加载监控</div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>懒加载次数:</span>
          <span className="font-mono">{lazyMetrics.lazyLoadCount}</span>
        </div>
        
        <div className="flex justify-between">
          <span>错误次数:</span>
          <span className="font-mono text-red-400">{lazyMetrics.lazyLoadErrors}</span>
        </div>
        
        <div className="flex justify-between">
          <span>平均加载时间:</span>
          <span className="font-mono">{lazyMetrics.averageLoadTime.toFixed(0)}ms</span>
        </div>
        
        <div className="flex justify-between">
          <span>缓存命中率:</span>
          <span className="font-mono">{(lazyMetrics.cacheHitRate * 100).toFixed(1)}%</span>
        </div>
        
        <div className="flex justify-between">
          <span>内存使用:</span>
          <span className="font-mono">{(lazyMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
        </div>
      </div>
      
      {/* 性能指示器 */}
      <div className="mt-3 pt-2 border-t border-gray-600">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            lazyMetrics.averageLoadTime < 500 ? 'bg-green-400' :
            lazyMetrics.averageLoadTime < 1000 ? 'bg-yellow-400' : 'bg-red-400'
          }`} />
          <span className="text-xs">
            {lazyMetrics.averageLoadTime < 500 ? '优秀' :
             lazyMetrics.averageLoadTime < 1000 ? '良好' : '需要优化'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LazyLoadingMonitor;
```

## 4. 使用指南

### 4.1 集成到现有组件

#### 4.1.1 更新主页组件
```typescript
// app/page.tsx (更新版本)
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import LazyImage from '@/components/lazy/LazyImage';
import LazyImageGrid from '@/components/lazy/LazyImageGrid';
import VirtualizedList from '@/components/lazy/VirtualizedList';
import RouteLoader, { useRoutePreloading } from '@/components/lazy/RouteLoader';
import SmartComponentLoader, { ComponentConfigs } from '@/components/lazy/SmartComponentLoader';
import { useResourcePreloader } from '@/utils/resource-preloader';
import { productCache } from '@/utils/multi-layer-cache';
// ... 其他imports保持不变

function HomePage() {
  const { t } = useLanguage();
  const { user, theme, hapticFeedback } = useTelegram();
  const [viewMode, setViewMode] = useState<'products' | 'lottery'>('products');
  
  // 路由预加载
  const { preloadCoreRoutes } = useRoutePreloading();
  const { preloadOnNavigation, preloadImages } = useResourcePreloader();

  // 页面加载时预加载核心资源
  useEffect(() => {
    preloadCoreRoutes();
    preloadOnNavigation('navigation');
    
    // 预加载关键图片
    preloadImages([
      '/images/banners/hero-bg.jpg',
      '/images/icons/lottery-icon.png',
      '/images/icons/wallet-icon.png'
    ]);
  }, [preloadCoreRoutes, preloadOnNavigation, preloadImages]);

  // 智能数据缓存
  const { data: lotteryRounds = [] } = useApi(
    useCallback(async () => {
      // 尝试从缓存获取
      const cached = await productCache.get('lottery-rounds');
      if (cached) return cached;

      // 从API获取并缓存
      const response = await apiClient.get('/lottery/active-rounds');
      if (response.success) {
        await productCache.set('lottery-rounds', response.data);
      }
      
      return response.data || [];
    }, []),
    [viewMode]
  );

  // 使用懒加载图片网格
  const productImages = products.map(product => ({
    id: product.id,
    src: product.images?.[0] || '',
    alt: product.name,
    width: 300,
    height: 300
  }));

  return (
    <RouteLoader priority="core">
      <ResponsiveLayout>
        {/* Banner区域 - 使用懒加载 */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600">
          <LazyImage
            src="/images/banners/hero-bg.jpg"
            alt="Hero Background"
            width={1200}
            height={400}
            className="w-full h-64 object-cover"
            priority={true}
            quality={90}
          />
          
          {/* 其他内容... */}
        </div>

        {/* 产品网格 - 使用虚拟滚动 */}
        {viewMode === 'products' && (
          <LazyImageGrid
            images={productImages}
            columns={2}
            gap={16}
            className="grid grid-cols-2 gap-4"
          />
        )}

        {/* 抽奖列表 - 使用虚拟列表 */}
        {viewMode === 'lottery' && (
          <VirtualizedList
            items={lotteryRounds}
            itemHeight={200}
            containerHeight={600}
            renderItem={(round) => (
              <SmartComponentLoader
                config={ComponentConfigs.LotteryCard}
                props={{ round }}
              />
            )}
            onEndReached={() => {
              // 加载更多数据
            }}
          />
        )}

        {/* 其他组件使用智能加载器 */}
        <SmartComponentLoader
          config={ComponentConfigs.WalletCard}
          props={{ user }}
        />
      </ResponsiveLayout>
    </RouteLoader>
  );
}
```

### 4.2 性能优化配置

#### 4.2.1 更新next.config.js
```javascript
// next.config.js (添加懒加载配置)
const nextConfig = {
  // ... 现有配置
  
  // 实验性功能
  experimental: {
    // 启用懒加载优化
    optimizeCss: true,
    optimizePackageImports: [
      '@heroicons/react',
      'react-icons'
    ],
    // 启用预取优化
    prefetch: true,
    scrollRestoration: true,
  },

  // 图片优化增强
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    
    // 懒加载配置
    lazy: true,
    placeholder: 'blur',
    quality: 85,
    
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    
    remotePatterns: [
      // 现有配置...
    ],
  },

  // Webpack优化增强
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // ... 现有配置
    
    if (!dev && !isServer) {
      // 代码分割优化
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // React相关库
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
          },
          
          // UI组件库 - 按需加载
          'ui-vendor': {
            test: /[\\/]node_modules[\\/](@heroicons|react-icons|framer-motion)[\\/]/,
            name: 'ui-vendor',
            chunks: 'all',
            priority: 15,
          },
          
          // 通用工具函数
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
          
          // 懒加载组件
          'lazy-components': {
            test: /[\\/]components[\\/]lazy[\\/]/,
            name: 'lazy-components',
            chunks: 'all',
            priority: 12,
          },
          
          // vendor库
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };

      // 启用懒加载
      config.module.rules.push({
        test: /\.(js|jsx|ts|tsx)$/,
        include: /components[\\/]lazy/,
        use: [
          {
            loader: 'next/dist/compiled/@next/bundle-analyzer',
            options: {
              enabled: process.env.ANALYZE === 'true',
            },
          },
        ],
      });
    }

    return config;
  },
  
  // ... 其他配置保持不变
};

module.exports = nextConfig;
```

## 5. 实施计划

### 5.1 第一阶段：基础组件（1-2天）
- [ ] 实现LazyImage组件
- [ ] 实现VirtualizedList组件
- [ ] 实现基础路由懒加载
- [ ] 更新next.config.js配置

### 5.2 第二阶段：缓存系统（2-3天）
- [ ] 完善IndexedDB缓存管理器
- [ ] 实现多层缓存系统
- [ ] 集成现有CacheManager
- [ ] 实现缓存策略配置

### 5.3 第三阶段：智能加载（2-3天）
- [ ] 实现SmartComponentLoader
- [ ] 实现ResourcePreloader
- [ ] 添加性能监控组件
- [ ] 实现预加载策略

### 5.4 第四阶段：集成优化（1-2天）
- [ ] 更新现有组件使用懒加载
- [ ] 性能测试和优化
- [ ] 文档和示例编写
- [ ] 错误处理和边界情况

### 5.5 第五阶段：测试部署（1天）
- [ ] 性能基准测试
- [ ] 移动端兼容性测试
- [ ] 弱网环境测试
- [ ] 生产环境部署

## 6. 预期效果

### 6.1 性能提升
- **初始加载时间**: 减少60%（从3-5秒降至1-2秒）
- **图片加载延迟**: 减少80%（从500ms降至100ms）
- **路由切换时间**: 减少70%（从1秒降至300ms）
- **内存使用**: 优化30%（从50MB降至35MB）

### 6.2 用户体验提升
- **感知性能**: 首屏渲染更快
- **滚动流畅度**: 虚拟滚动提升流畅度
- **弱网体验**: Service Worker缓存保障离线使用
- **加载反馈**: 渐进式加载，骨架屏提升用户体验

### 6.3 技术指标
- **缓存命中率**: 达到80%以上
- **代码分割效果**: 初始包大小减少50%
- **图片优化**: WebP/AVIF格式，体积减少40%
- **资源预加载**: 关键资源100%预加载

## 7. 监控和维护

### 7.1 性能监控
- 实时监控懒加载性能指标
- 缓存命中率统计
- 用户体验指标追踪
- 错误率和失败率监控

### 7.2 定期优化
- 每月性能基准测试
- 缓存策略调优
- 用户反馈收集和分析
- 新技术引入评估

## 8. 结论

通过实施这套全面的资源懒加载和缓存策略，LuckyMart-TJ项目将获得显著的性能提升和用户体验改善。分阶段的实施计划确保了项目的稳定性和可维护性，同时监控和维护机制保证了长期的优化效果。

这套方案不仅解决了当前的性能瓶颈，还为未来的扩展和优化奠定了坚实的基础。