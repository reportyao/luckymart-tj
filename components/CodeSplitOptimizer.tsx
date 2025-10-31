/**
 * 代码分割优化器组件
 * 实现动态导入、智能懒加载和渐进式加载策略
 */

import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useMobilePerformance } from '../hooks/use-mobile-performance';

interface CodeSplitConfig {
  component: string;
  threshold?: number; // 触发懒加载的阈值
  fallback?: React.ReactNode;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

interface PerformanceData {
  loadTime: number;
  bundleSize: number;
  cacheHitRate: number;
}

// 预定义的组件配置
const COMPONENT_CONFIGS: Record<string, CodeSplitConfig> = {
  // Admin组件 - 低优先级，页面访问时加载
  AdminDashboard: {
    component: 'admin/dashboard',
    threshold: 0.8, // 80%概率触发预加载
    fallback: <div className="luckymart-animation-pulse bg-gray-200 h-64 luckymart-rounded-lg" />,
    priority: 'low'
  },
  
  // 产品相关组件 - 中等优先级
  ProductCarousel: {
    component: 'product/carousel',
    threshold: 0.6,
    fallback: <div className="luckymart-animation-pulse bg-gray-200 h-48 luckymart-rounded-lg" />,
    priority: 'medium'
  },
  
  ProductImageCarousel: {
    component: 'product/image-carousel',
    threshold: 0.5,
    fallback: <div className="luckymart-animation-pulse bg-gray-200 h-56 luckymart-rounded-lg" />,
    priority: 'medium'
  },
  
  // 多语言组件 - 高优先级，但可延迟加载
  LanguageSwitcher: {
    component: 'i18n/language-switcher',
    threshold: 0.9,
    fallback: <div className="luckymart-size-lg luckymart-size-lg bg-gray-200 rounded-full luckymart-animation-pulse" />,
    priority: 'high'
  },
  
  // 性能图表 - 低优先级
  PerformanceCharts: {
    component: 'charts/performance',
    threshold: 0.3, // 仅在明确需要时加载
    fallback: <div className="luckymart-animation-pulse bg-gray-200 h-80 luckymart-rounded-lg" />,
    priority: 'low'
  },
  
  // 机器人通知 - 后台加载
  BotNotifications: {
    component: 'bot/notifications',
    threshold: 0.1,
    fallback: null,
    priority: 'low'
  },
  
  // Instagram海报生成器 - 低优先级
  InstagramPoster: {
    component: 'social/instagram-poster',
    threshold: 0.2,
    fallback: <div className="luckymart-animation-pulse bg-gray-200 h-64 luckymart-rounded-lg" />,
    priority: 'low'
  }
};

// 动态加载组件的映射
const DYNAMIC_COMPONENTS = {
  AdminDashboard: dynamic(() => import('../app/admin/dashboard/page').then(mod => mod.default), {
    loading: () => <div className="luckymart-animation-pulse bg-gray-200 h-64 luckymart-rounded-lg" />
  }),
  
  ProductCarousel: dynamic(() => import('../components/ProductCarousel').then(mod => mod.default), {
    loading: () => <div className="luckymart-animation-pulse bg-gray-200 h-48 luckymart-rounded-lg" />
  }),
  
  ProductImageCarousel: dynamic(() => import('../components/ProductImageCarousel').then(mod => mod.default), {
    loading: () => <div className="luckymart-animation-pulse bg-gray-200 h-56 luckymart-rounded-lg" />
  }),
  
  LanguageSwitcher: dynamic(() => import('../components/LanguageSwitcher').then(mod => mod.default), {
    loading: () => <div className="luckymart-size-lg luckymart-size-lg bg-gray-200 rounded-full luckymart-animation-pulse" />
  }),
  
  PerformanceCharts: dynamic(() => import('../components/Charts').then(mod => mod.default), {
    loading: () => <div className="luckymart-animation-pulse bg-gray-200 h-80 luckymart-rounded-lg" />
  }),
  
  InstagramPoster: dynamic(() => import('../components/InstagramPoster').then(mod => mod.default), {
    loading: () => <div className="luckymart-animation-pulse bg-gray-200 h-64 luckymart-rounded-lg" />
  })
};

interface CodeSplitOptimizerProps {
  /** 子组件 */
  children?: React.ReactNode;
}

export const CodeSplitOptimizer: React.FC<CodeSplitOptimizerProps> = ({ children }) => {
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(new Set());
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);
  
  const { metrics, getPerformanceReport } = useMobilePerformance({
    enableMemoryMonitoring: true,
    enableNetworkMonitoring: true
  });

  // 智能预加载组件
  const preloadComponent = useCallback(async (componentName: string) => {
    if (loadedComponents.has(componentName)) return;
    
    const config = COMPONENT_CONFIGS[componentName];
    if (!config) return;

    try {
      // 模拟预加载
      const startTime = performance.now();
      
      // 根据优先级决定是否真正预加载
      if (shouldPreloadComponent(config, metrics)) {
        await import(`../${config.component}`);
        const loadTime = performance.now() - startTime;
        
        setLoadedComponents(prev => new Set(prev).add(componentName));
        
        // 记录性能数据
        setPerformanceData(prev => ({
          loadTime: (prev?.loadTime || 0) + loadTime,
          bundleSize: (prev?.bundleSize || 0) + estimateComponentSize(componentName),
          cacheHitRate: calculateCacheHitRate()
        }));
      }
    } catch (error) {
      console.warn(`预加载组件 ${componentName} 失败:`, error);
    }
  }, [loadedComponents, metrics]);

  // 判断是否应该预加载组件
  const shouldPreloadComponent = (config: CodeSplitConfig, metrics: any): boolean => {
    if (!optimizationEnabled) return false;
    
    // 根据连接速度调整策略
    const connectionSpeed = metrics?.connectionSpeed || 'medium';
    const priority = config.priority || 'medium';
    
    switch (priority) {
      case 'high':
        return connectionSpeed !== 'slow';
      case 'medium':
        return connectionSpeed === 'fast' || Math.random() < config.threshold!;
      case 'low':
        return connectionSpeed === 'fast' && Math.random() < (config.threshold! * 0.5);
      default:
        return false;
    }
  };

  // 估算组件大小
  const estimateComponentSize = (componentName: string): number => {
    const sizeMap: Record<string, number> = {
      AdminDashboard: 150000, // 150KB
      ProductCarousel: 80000,  // 80KB
      ProductImageCarousel: 120000, // 120KB
      LanguageSwitcher: 45000, // 45KB
      PerformanceCharts: 200000, // 200KB
      InstagramPoster: 180000, // 180KB
      BotNotifications: 90000   // 90KB
    };
    
    return sizeMap[componentName] || 100000; // 默认100KB
  };

  // 计算缓存命中率
  const calculateCacheHitRate = (): number => {
    // 简化计算，实际应该从网络请求数据中获取
    return 0.75; // 75%缓存命中率
  };

  // 基于用户行为预测性预加载
  const predictivePreloading = useCallback(() => {
    const path = window.location.pathname;
    
    // 根据路径预测可能需要的组件
    if (path.includes('/admin')) {
      preloadComponent('AdminDashboard');
    }
    
    if (path.includes('/product')) {
      preloadComponent('ProductCarousel');
      preloadComponent('ProductImageCarousel');
    }
    
    if (path.includes('/performance')) {
      preloadComponent('PerformanceCharts');
    }
    
    if (path.includes('/referral') || path.includes('/social')) {
      preloadComponent('InstagramPoster');
    }
  }, [preloadComponent]);

  // 基于滚动位置的懒加载
  const intersectionObserverLazyLoad = useCallback(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const componentName = entry.target.getAttribute('data-component');
          if (componentName && !loadedComponents.has(componentName)) {
            preloadComponent(componentName);
          }
        }
      });
    }, {
      rootMargin: '50px' // 提前50px开始加载
    });

    // 观察所有标记了data-component的元素
    document.querySelectorAll('[data-component]').forEach(el => {
      observer.observe(el);
    });

    return observer;
  }, [preloadComponent, loadedComponents]);

  // 监听页面切换进行预加载
  useEffect(() => {
    if (!optimizationEnabled) return;

    const handlePageShow = () => {
      setTimeout(predictivePreloading, 100); // 延迟100ms执行预测性预加载
    };

    const handlePopState = () => {
      setTimeout(predictivePreloading, 100);
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);
    
    // 初始预测性预加载
    predictivePreloading();

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [optimizationEnabled, predictivePreloading]);

  // 设置懒加载观察器
  useEffect(() => {
    if (!optimizationEnabled) return;

    const observer = intersectionObserverLazyLoad();
    return () => observer.disconnect();
  }, [optimizationEnabled, intersectionObserverLazyLoad]);

  return (
    <div className="code-split-optimizer">
      {children}
      
      {/* 性能监控面板 (开发模式下显示) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white luckymart-padding-md luckymart-rounded-lg luckymart-text-sm z-50">
          <div className="mb-2">
            <strong>代码分割状态:</strong>
          </div>
          <div>已加载组件: {loadedComponents.size}</div>
          <div>优化启用: {optimizationEnabled ? '是' : '否'}</div>
          {performanceData && (
            <>
              <div>总加载时间: {performanceData.loadTime.toFixed(2)}ms</div>
              <div>总组件大小: {(performanceData.bundleSize / 1024).toFixed(1)}KB</div>
              <div>缓存命中率: {(performanceData.cacheHitRate * 100).toFixed(1)}%</div>
            </>
          )}
          <button
            className="mt-2 px-2 py-1 bg-blue-600 luckymart-rounded text-xs"
            onClick={() => setOptimizationEnabled(!optimizationEnabled)}
          >
            {optimizationEnabled ? '禁用优化' : '启用优化'}
          </button>
        </div>
      )}
    </div>
  );
};

// 懒加载组件的高阶组件
export const LazyComponent: React.FC<{
  componentName: keyof typeof DYNAMIC_COMPONENTS;
  fallback?: React.ReactNode;
  props?: any;
}> = ({ componentName, fallback, props = {} }) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // 检查组件是否应该被加载
  useEffect(() => {
    const checkLoadCondition = () => {
      const config = COMPONENT_CONFIGS[componentName];
      const connectionSpeed = navigator.connection?.effectiveType || '4g';
      
      // 基于连接速度和组件优先级决定加载时机
      const shouldLoadNow = connectionSpeed !== 'slow-2g' && 
                           (config.priority === 'high' || Math.random() < (config.threshold || 0.5));
      
      setShouldLoad(shouldLoadNow);
      setIsLoaded(shouldLoadNow);
    };

    const timer = setTimeout(checkLoadCondition, 100);
    return () => clearTimeout(timer);
  }, [componentName]);

  if (!shouldLoad) {
    return fallback || <div className="luckymart-animation-pulse bg-gray-200 h-32 luckymart-rounded-lg" />;
  }

  const DynamicComponent = DYNAMIC_COMPONENTS[componentName];
  
  return (
    <Suspense fallback={fallback || <div className="luckymart-animation-pulse bg-gray-200 h-32 luckymart-rounded-lg" />}>
      <DynamicComponent {...props} />
    </Suspense>
  );
};

// 预加载管理器
export class PreloadManager {
  private static instance: PreloadManager;
  private preloadedComponents = new Set<string>();
  private preloadingQueue: string[] = [];

  static getInstance(): PreloadManager {
    if (!PreloadManager.instance) {
      PreloadManager.instance = new PreloadManager();
    }
    return PreloadManager.instance;
  }

  async preloadComponent(componentName: string): Promise<void> {
    if (this.preloadedComponents.has(componentName)) return;
    
    const config = COMPONENT_CONFIGS[componentName];
    if (!config) return;

    try {
      this.preloadingQueue.push(componentName);
      
      // 模拟异步预加载
      await new Promise(resolve => setTimeout(resolve, 50));
      
      this.preloadedComponents.add(componentName);
      this.preloadingQueue = this.preloadingQueue.filter(name => name !== componentName);
      
      console.log(`组件预加载完成: ${componentName}`);
    } catch (error) {
      console.warn(`组件预加载失败: ${componentName}`, error);
      this.preloadingQueue = this.preloadingQueue.filter(name => name !== componentName);
    }
  }

  getPreloadedComponents(): string[] {
    return Array.from(this.preloadedComponents);
  }

  isComponentPreloaded(componentName: string): boolean {
    return this.preloadedComponents.has(componentName);
  }

  clearPreloaded(): void {
    this.preloadedComponents.clear();
    this.preloadingQueue = [];
  }
}

// 导出预加载管理器的单例实例
export const preloadManager = PreloadManager.getInstance();

export default CodeSplitOptimizer;