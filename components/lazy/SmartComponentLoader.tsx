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
  preloadDelay?: number;    // 预加载延迟
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
  const [isVisible, setIsVisible] = useState(false);

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
    if (!config.strategy.lazy || Component || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1, 
        rootMargin: '100px' 
      }
    );

    // 观察当前组件容器
    const element = document.querySelector('[data-smart-component]');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [config.strategy.lazy, Component, isLoading]);

  // 鼠标悬停时预加载
  useEffect(() => {
    if (!config.strategy.prefetch || Component || isLoading) return;

    const element = document.querySelector('[data-smart-component]');
    if (!element) return;

    const handleMouseEnter = () => {
      if (!isVisible && !shouldLoad) {
        setShouldLoad(true);
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [config.strategy.prefetch, Component, isLoading, isVisible, shouldLoad]);

  // 渲染加载状态
  if (isLoading && !Component) {
    if (config.loadingComponent) {
      const LoadingComponent = config.loadingComponent;
      return <LoadingComponent {...props} />;
    }
    return (
      <div 
        data-smart-component
        className="animate-pulse bg-gray-200 rounded-lg h-32 flex items-center justify-center"
      >
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
      <div 
        data-smart-component
        className="bg-red-50 border border-red-200 rounded-lg p-4"
      >
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
    return (
      <div data-smart-component>
        <Component {...props} />
      </div>
    );
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

  ProfileCard: {
    importFn: () => import('@/components/ProfileCard'),
    strategy: STRATEGY_CONFIGS.immediate,
    loadingComponent: () => (
      <div className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
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
  },

  // 用户相关组件
  UserProfile: {
    importFn: () => import('@/components/UserProfile'),
    strategy: STRATEGY_CONFIGS.prefetch,
    loadingComponent: () => (
      <div className="animate-pulse bg-gray-200 h-80 rounded-lg"></div>
    )
  },

  // 营销相关组件
  MarketingBanner: {
    importFn: () => import('@/components/MarketingBanner'),
    strategy: STRATEGY_CONFIGS.lazy,
    loadingComponent: () => (
      <div className="animate-pulse bg-gray-200 h-40 rounded-lg"></div>
    )
  }
};

// 组件懒加载Hook
export const useComponentLazyLoader = () => {
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(new Set());

  const preloadComponent = useCallback(async (importFn: () => Promise<any>) => {
    try {
      await importFn();
      setLoadedComponents(prev => new Set(prev).add(importFn.toString()));
    } catch (error) {
      console.warn('Failed to preload component:', error);
    }
  }, []);

  const isComponentLoaded = useCallback((importFn: () => Promise<any>) => {
    return loadedComponents.has(importFn.toString());
  }, [loadedComponents]);

  return {
    preloadComponent,
    isComponentLoaded,
    loadedComponents: Array.from(loadedComponents)
  };
};