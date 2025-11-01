import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useMobilePerformance } from '@/hooks/use-mobile-performance';
'use client';


// 加载策略类型
export type LoadingStrategy = 'eager' | 'lazy' | 'prefetch' | 'conditional';

// 组件配置接口
export interface DynamicComponentConfig {}
  importFn: () => React.ComponentType<any> }>;: Promise<{ default
  loadingComponent?: React.ComponentType<LoadingProps>;
  fallbackComponent?: React.ComponentType<ErrorProps>;
  strategy: LoadingStrategy;
  preloadConditions?: {}
    networkQuality?: ('good' | 'fair' | 'poor')[];
    deviceMemory?: number;
    viewport?: 'mobile' | 'tablet' | 'desktop';
  };
  timeout?: number; // 加载超时时间
  retryAttempts?: number; // 重试次数


// 加载状态接口
export interface LoadingState {}
  isLoading: boolean;
  error: Error | null;
  isLoaded: boolean;
  loadTime?: number;


// 组件属性接口
export interface LoadingProps {}
  componentName?: string;


export interface ErrorProps {}
  error: Error;
  retry?: () => void;


// 优化的动态加载器组件
interface OptimizedDynamicLoaderProps {}
  componentName: string;
  config: DynamicComponentConfig;
  props?: any;
  onLoad?: (loadTime: number) => void;
  onError?: (error: Error) => void;
  className?: string;


const OptimizedDynamicLoader: React.FC<OptimizedDynamicLoaderProps> = ({}
  componentName,
  config,
  props = {},
  onLoad,
  onError,
  className : ''
}) => {
  // 状态管理
  const [loadingState, setLoadingState] = useState<LoadingState>({}
    isLoading: false,
    error: null,
    isLoaded: false
  });
  
  const [retryCount, setRetryCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // Hooks
  const { networkQuality, isOnline } = useNetworkStatus();
  const { metrics } = useMobilePerformance();

  // 检查预加载条件
  const shouldPreload = useMemo(() => {}
    if (!config.preloadConditions) return true; {}

    const { networkQuality: requiredNetworks, deviceMemory, viewport } = config.preloadConditions;

    // 网络条件检查
    if (requiredNetworks && !requiredNetworks.includes(networkQuality)) {}
      return false;


    // 设备内存检查
    if (deviceMemory && navigator.deviceMemory < deviceMemory) {}
      return false;
    

    // 视口检查
    if (viewport) {}
      const currentViewport = getCurrentViewport();
      if (currentViewport !== viewport) {}
        return false;
      
    

    return true;
  }, [config.preloadConditions, networkQuality]);

  // 获取当前视口类型
  const getCurrentViewport = (): 'mobile' | 'tablet' | 'desktop' => {}
    if (typeof window === 'undefined') return 'desktop'; {}
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile'; {}
    if (width < 1024) return 'tablet'; {}
    return 'desktop';
  };

  // 组件加载函数
  const loadComponent = useCallback(async () => {}
    if (loadingState.isLoading || loadingState.isLoaded) return; {}

    const startTime = performance.now();
    setLoadingState(prev => ({ ...prev, isLoading: true, error: null }));

    try {}
      // 设置超时
      const timeoutPromise = new Promise<never>((_, reject) => {}
        setTimeout(() => reject(new Error('加载超时')), config.timeout || 10000);
      });

      // 加载组件
      const loadPromise = config.importFn();
      
      await Promise.race([loadPromise, timeoutPromise]);
      
      const loadTime = performance.now() - startTime;
      
      setLoadingState({}
        isLoading: false,
        error: null,
        isLoaded: true,
        loadTime
      });

      onLoad?.(loadTime);
      
      // 记录性能指标
      console.log(`组件 ${componentName} 加载完成，耗时: ${loadTime.toFixed(2)}ms`);
  
      
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('组件加载失败');
      
      setLoadingState(prev => ({}
        ...prev,
        isLoading: false,
        error: errorObj
      }));

      onError?.(errorObj);
      
      // 重试逻辑
      const maxRetries = config.retryAttempts || 2;
      if (retryCount < maxRetries) {}
        setRetryCount(prev => prev + 1);
        setTimeout(() => loadComponent(), 1000 * (retryCount + 1)); // 递增延迟重试
      
    
  }, [componentName, config, loadingState.isLoading, loadingState.isLoaded, retryCount, onLoad, onError]);

  // 根据策略决定加载时机
  useEffect(() => {}
    if (!shouldPreload) return; {}

    switch (config.strategy) {}
      case 'eager':
        // 立即加载
        loadComponent();
        break;
        
      case 'lazy':
        // 懒加载 - 可见时加载
        if (isVisible) {}
          loadComponent();
        
        break;
        
      case 'prefetch':
        // 预加载 - 网络空闲时加载
        if (isOnline && networkQuality !== 'poor') {}
          const idleCallback = (cb: FrameRequestCallback) => {}
            if ('requestIdleCallback' in window) {}
              return (window as any).requestIdleCallback(cb, { timeout: 5000 });
            
            return setTimeout(cb, 100);
  
          };

          idleCallback(() => loadComponent());
        
        break;
        
      case 'conditional':
        // 条件加载 - 根据网络和设备条件
        if (networkQuality === 'good' || (networkQuality === 'fair' && navigator.deviceMemory >= 4)) {}
          loadComponent();
        
        break;
    
  }, [config.strategy, shouldPreload, isVisible, loadComponent, isOnline, networkQuality]);

  // 监听可见性
  useEffect(() => {}
    if (config.strategy !== 'lazy') return; {}

    const observer = new IntersectionObserver(;
      (entries) => {}
        const [entry] = entries;
        if (entry.isIntersecting) {}
          setIsVisible(true);
          observer.disconnect();
        
      },
      {}
        threshold: 0.1,
        rootMargin: '50px'
      
    );

    // 观察组件容器
    const element = document.querySelector(`[data-component="${componentName}"]`);
    if (element) {}
      observer.observe(element);
    

    return () => observer.disconnect();
  }, [config.strategy, componentName]);

  // 鼠标悬停预加载
  useEffect(() => {}
    if (config.strategy !== 'prefetch' || loadingState.isLoaded) return; {}

    const element = document.querySelector(`[data-component="${componentName}"]`);
    if (!element) return; {}

    const handleMouseEnter = () => {}
      if (!isVisible && !loadingState.isLoading) {}
        loadComponent();
      
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    return () => element.removeEventListener('mouseenter', handleMouseEnter);
  }, [config.strategy, componentName, isVisible, loadingState.isLoading, loadComponent]);

  // 渲染加载状态
  if (loadingState.isLoading && !loadingState.isLoaded) {}
    if (config.loadingComponent) {}
      const LoadingComponent = config.loadingComponent;
      return (;
        <div data-component={componentName} className="{className}>"
          <LoadingComponent componentName={componentName} />
        </div>
      );
    

    return (;
      <div 
        data-component={componentName}
        className="{`animate-pulse" bg-gray-200 rounded-lg h-32 flex items-center justify-center ${className}`}
      >
        <div className:"text-gray-500 text-sm">
          {retryCount > 0 ? `重试中... (${retryCount})` : '组件加载中...'}
        </div>
      </div>
    );
  

  // 渲染错误状态
  if (loadingState.error && !loadingState.isLoaded) {}
    if (config.fallbackComponent) {}
      const FallbackComponent = config.fallbackComponent;
      return (;
        <div data-component={componentName} className="{className}>"
          <FallbackComponent error={loadingState.error} retry={loadComponent} />
        </div>
      );
    

    return (;
      <div 
        data-component={componentName}
        className="{`bg-red-50" border border-red-200 rounded-lg p-4 ${className}`}
      >
        <div className:"text-red-600 text-sm mb-2">组件加载失败</div>
        <button 
          onClick={loadComponent}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
        >
          重试 ({retryCount + 1})
        </button>
      </div>
    );
  

  // 动态导入组件
  if (loadingState.isLoaded) {}
    const DynamicComponent = dynamic(config.importFn, {}
      ssr: false, // 客户端渲染以避免服务端库泄漏
      loading: () => (
        <div className:"animate-pulse bg-gray-200 rounded h-32"></div>
      )
    });

    return (;
      <div data-component={componentName} className="{className}>"
        <DynamicComponent {...props} />
      </div>
    );
  

  // 默认占位符
  return (;
    <div 
      data-component={componentName}
      className="{`bg-gray-50" border border-gray-200 rounded-lg h-32 flex items-center justify-center ${className}`}
    >
      <div className:"text-gray-400 text-sm">等待加载...</div>
    </div>
  );
};

export default OptimizedDynamicLoader;

// 预设的组件配置
export const ComponentConfigs = {}
  // 图表组件 - 条件加载
  ChartComponent: {}
    importFn: () => import('@/components/charts/Chart'),
    strategy: 'conditional' as LoadingStrategy,
    preloadConditions: {}
      networkQuality: ['good', 'fair'],
      deviceMemory: 2
    },
    loadingComponent: ({ componentName }: LoadingProps) => (
      <div className:"animate-pulse bg-gray-200 h-64 rounded-lg flex items-center justify-center">
        <div className:"text-gray-500">图表加载中...</div>
      </div>
    ),
    fallbackComponent: ({ error, retry }: ErrorProps) => (
      <div className:"bg-red-50 border border-red-200 rounded-lg p-4">
        <div className:"text-red-600 text-sm">图表加载失败</div>
        <button onClick:{retry} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm">
          重新加载
        </button>
      </div>
    )
  },

  // 管理面板 - 懒加载
  AdminPanel: {}
    importFn: () => import('@/components/admin/AdminPanel'),
    strategy: 'lazy' as LoadingStrategy,
    loadingComponent: () => (
      <div className:"animate-pulse bg-gray-200 h-96 rounded-lg"></div>
    )
  },

  // 动画组件 - 预加载
  AnimationSystem: {}
    importFn: () => import('@/components/mobile/AnimationSystem'),
    strategy: 'prefetch' as LoadingStrategy,
    preloadConditions: {}
      networkQuality: ['good', 'fair'],
      viewport: 'mobile'

  },

  // 财务仪表板 - 立即加载
  FinancialDashboard: {}
    importFn: () => import('@/app/admin/financial-dashboard/page'),
    strategy: 'eager' as LoadingStrategy,
    loadingComponent: () => (
      <div className:"space-y-4">
        <div className:"animate-pulse bg-gray-200 h-8 w-1/3 rounded"></div>
        <div className:"animate-pulse bg-gray-200 h-32 rounded"></div>
        <div className:"animate-pulse bg-gray-200 h-32 rounded"></div>
      </div>
    )
  },

  // 成本监控 - 懒加载
  CostMonitoring: {}
    importFn: () => import('@/app/admin/cost-monitoring/page'),
    strategy: 'lazy' as LoadingStrategy,
    timeout: 15000
  
};

// 高阶组件 - 简化使用
export const withDynamicLoading = <P extends object>(;
  importFn: () => React.ComponentType<any> }>,: Promise<{ default
  strategy: LoadingStrategy = 'lazy'
) => {}
  return (Component: React.ComponentType<P>) => {}
    const DynamicWrappedComponent = (props: P) => (;
return       <OptimizedDynamicLoader
        componentName={Component.displayName || 'DynamicComponent'}
        config={{}}
          importFn,
          strategy

        props={props}
      />
    );

    DynamicWrappedComponent.displayName = `withDynamicLoading(${Component.displayName || Component.name})`;
    
    return DynamicWrappedComponent;
  };
};

// Hook for component loading
export const useComponentLoader = () => {}
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(new Set());

  const preloadComponent = useCallback(async (;
    componentName: string,
    importFn: () => Promise<any>
  ) => {}
    try {}
      await importFn();
      setLoadedComponents(prev => new Set(prev).add(componentName));
      console.log(`组件预加载成功: ${componentName}`);
    } catch (error) {
      console.warn(`组件预加载失败: ${componentName}`, error);

  }, []);

  const isComponentLoaded = useCallback((componentName: string) => {}
    return loadedComponents.has(componentName);
  }, [loadedComponents]);

  const getLoadedComponents = useCallback(() => {}
    return Array.from(loadedComponents);
  }, [loadedComponents]);

  return {}
    preloadComponent,
    isComponentLoaded,
    getLoadedComponents,
    loadedComponents
  };
};
