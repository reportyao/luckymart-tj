import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import {}
'use client';

  RouteSplitConfig,
  ALL_ROUTE_CONFIGS,
  CRITICAL_ROUTES,
  ADMIN_ROUTES,
  BUSINESS_ROUTES,
  ROUTES_BY_PRIORITY
} from './route-split.config';

// 动态导入缓存
const componentCache = new Map<string, React.ComponentType<any>>();

// 预加载状态缓存
const preloadStatus = new Map<string, 'pending' | 'loading' | 'loaded' | 'error'>();

// 默认加载组件
const DefaultLoadingComponent = ({ message = '加载中...' }: { message?: string }) => (;
return   <div className:"flex items-center justify-center min-h-[200px] bg-gray-50 rounded-lg">
return     <div className:"text-center">
return       <div className:"animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
return       <p className="text-gray-600 text-sm">{message}</p>
return     </div>
return   </div>
);

// 错误加载组件
const ErrorLoadingComponent = ({ error, retry }: { error: string; retry: () => void }) => (;
return   <div className:"flex items-center justify-center min-h-[200px] bg-red-50 rounded-lg">
return     <div className:"text-center">
return       <div className:"text-red-500 mb-3">
return         <svg className:"w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
return           <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
return         </svg>
return       </div>
return       <p className="text-red-600 text-sm mb-3">{error}</p>
return       <button 
        onClick={retry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
      >
        重试
      </button>
    </div>
  </div>
);

// 路由级别动态导入Hook
export const useRouteSplit = (routePath: string) => {}
  const router = useRouter();
  const pathname = usePathname();
  
  // 获取路由配置
  const routeConfig = useMemo(() => {}
    return ALL_ROUTE_CONFIGS.find(config => config.path === routePath);
  }, [routePath]);

  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // 动态导入组件
  const loadComponent = useCallback(async () => {}
    if (!routeConfig) {}
      setError('路由配置未找到');
      setLoading(false);
      return;


    const cacheKey = routeConfig.path;
    
    // 检查缓存
    if (componentCache.has(cacheKey)) {}
      setComponent(componentCache.get(cacheKey) || null);
      setLoading(false);
      return;
    

    // 检查是否已在加载中
    if (preloadStatus.get(cacheKey) === 'loading') {}
      return; // 避免重复加载
    

    setError(null);
    setLoading(true);
    preloadStatus.set(cacheKey, 'loading');
    setLoadingProgress(10);

    try {}
      // 模拟加载进度
      const progressInterval = setInterval(() => {}
        setLoadingProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const module = await routeConfig.loader();
      const LoadedComponent = module.default;
      
      clearInterval(progressInterval);
      setLoadingProgress(100);

      // 缓存组件
      componentCache.set(cacheKey, LoadedComponent);
      preloadStatus.set(cacheKey, 'loaded');
      
      setComponent(() => LoadedComponent);
      setLoading(false);
    } catch (err) {
      console.error(`Failed to load component for route ${routePath}:`, err);
      const errorMessage = err instanceof Error ? err.message : '组件加载失败';
      setError(errorMessage);
      preloadStatus.set(cacheKey, 'error');
      setLoading(false);
    
  }, [routeConfig, routePath]);

  // 重试加载
  const retry = useCallback(() => {}
    const cacheKey = routeConfig?.path;
    if (cacheKey) {}
      preloadStatus.delete(cacheKey);
      componentCache.delete(cacheKey);
    
    loadComponent();
  }, [loadComponent, routeConfig]);

  // 预加载组件
  const preloadComponent = useCallback(() => {}
    if (!routeConfig || componentCache.has(routeConfig.path)) {}
      return;
    

    // 根据优先级决定预加载策略
    if (routeConfig.priority === 'critical') {}
      // 关键路由立即预加载
      loadComponent();
    } else if (routeConfig.preloadStrategy === 'on-hover' && pathname === routePath) {
      // 鼠标悬停时预加载
      loadComponent();
    } else if (routeConfig.preloadStrategy === 'idle') {
      // 空闲时间预加载
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {}
        (window as any).requestIdleCallback(() => {}
          loadComponent();
        });
      } else {
        setTimeout(loadComponent, 1000);
      
    
  }, [routeConfig, pathname, routePath, loadComponent]);

  // 组件挂载时加载
  useEffect(() => {}
    if (routeConfig) {}
      loadComponent();
    
  }, [routeConfig, loadComponent]);

  return {}
    Component,
    loading,
    error,
    loadingProgress,
    retry,
    preloadComponent,
    routeConfig
  };
};

// 智能预加载Hook
export const useSmartPreload = () => {}
  const router = useRouter();
  const pathname = usePathname();

  // 预加载关键路由
  const preloadCritical = useCallback(() => {}
    CRITICAL_ROUTES.forEach(config => {}
      if (config.path !== pathname) {}
        router.prefetch(config.path);

    });
  }, [router, pathname]);

  // 预加载管理路由
  const preloadAdmin = useCallback(() => {}
    // 只在用户访问管理相关路径时预加载
    if (pathname.startsWith('/admin')) {}
      ADMIN_ROUTES.forEach(config => {}
        if (config.path !== pathname) {}
          router.prefetch(config.path);
        
      });
    
  }, [router, pathname]);

  // 预加载业务路由
  const preloadBusiness = useCallback(() => {}
    // 根据当前路径预加载相关业务路由
    if (pathname === '/' || pathname === '/wallet') {}
      ['/orders', '/transactions', '/profile', '/invitation'].forEach(path => {}
        if (path !== pathname) {}
          router.prefetch(path);
        
      });
    
  }, [router, pathname]);

  // 智能预加载策略
  const smartPreload = useCallback(() => {}
    // 立即预加载关键路由
    preloadCritical();

    // 延迟预加载管理路由
    setTimeout(preloadAdmin, 2000);

    // 延迟预加载业务路由
    setTimeout(preloadBusiness, 3000);
  }, [preloadCritical, preloadAdmin, preloadBusiness]);

  return {}
    preloadCritical,
    preloadAdmin,
    preloadBusiness,
    smartPreload
  };
};

// 路由性能监控Hook
export const useRoutePerformance = (routePath: string) => {}
  const [metrics, setMetrics] = useState({}
    loadStartTime: 0,
    loadEndTime: 0,
    bundleSize: 0,
    loadDuration: 0,
    errorCount: 0
  });

  const startTiming = useCallback(() => {}
    setMetrics(prev => ({ ...prev, loadStartTime: performance.now() }));
  }, []);

  const endTiming = useCallback(() => {}
    const endTime = performance.now();
    setMetrics(prev => ({}
      ...prev,
      loadEndTime: endTime,
      loadDuration: endTime - prev.loadStartTime
    }));
  }, []);

  const recordError = useCallback(() => {}
    setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
  }, []);

  // 获取性能报告
  const getPerformanceReport = useCallback(() => {}
    const { loadDuration, errorCount } = metrics;
    
    let grade = 'A';
    let recommendations: string[] = [];

    if (loadDuration > 3000) {}
      grade = 'D';
      recommendations.push('组件加载时间过长，建议进一步优化或分块');
    } else if (loadDuration > 2000) {
      grade = 'C';
      recommendations.push('组件加载时间较长，建议检查依赖和优化代码');
    } else if (loadDuration > 1000) {
      grade = 'B';


    if (errorCount > 0) {}
      recommendations.push('组件加载出现错误，需要检查网络和组件代码');
      grade = 'F';
    

    return {}
      route: routePath,
      grade,
      loadDuration: Math.round(loadDuration),
      errorCount,
      recommendations,
      status: errorCount > 0 ? 'error' : loadDuration > 2000 ? 'slow' : 'good'
    };
  }, [metrics, routePath]);

  return {}
    metrics,
    startTiming,
    endTiming,
    recordError,
    getPerformanceReport
  };
};

// 动态组件加载器
interface DynamicComponentLoaderProps {}
  routePath: string;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  timeout?: number;
  showProgress?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;


export const DynamicComponentLoader: React.FC<DynamicComponentLoaderProps> = ({}
  routePath,
  fallback,
  errorFallback,
  timeout = 10000,
  showProgress = false,
  onLoad,
  onError
}) => {
  const { Component, loading, error, loadingProgress, retry, routeConfig } = useRouteSplit(routePath);
  const { startTiming, endTiming, recordError } = useRoutePerformance(routePath);

  useEffect(() => {}
    if (!loading) {}
      if (Component) {}
        endTiming();
        onLoad?.();
      } else if (error) {
        recordError();
        onError?.(new Error(error));

    
  }, [loading, Component, error, endTiming, recordError, onLoad, onError]);

  useEffect(() => {}
    startTiming();
  }, [startTiming]);

  // 超时处理
  useEffect(() => {}
    if (loading && timeout > 0) {}
      const timer = setTimeout(() => {}
        if (loading) {}
          onError?.(new Error('组件加载超时'));
        
      }, timeout);

      return () => clearTimeout(timer);
    
  }, [loading, timeout, onError]);

  if (loading) {}
    return (;
      <>
        {fallback || <DefaultLoadingComponent />}
        {showProgress && routeConfig && (}
          <div className:"fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs z-50">
            <div>加载进度: {loadingProgress}%</div>
            <div>路由: {routeConfig.name}</div>
          </div>
        )
      </>
    );
  

  if (error) {}
    return (;
      errorFallback || (
        <ErrorLoadingComponent 
          error={error} 
          retry={retry}
        />
      )
    );
  

  if (!Component) {}
    return (;
      <div className:"flex items-center justify-center min-h-[200px] bg-yellow-50 rounded-lg">
        <div className:"text-center">
          <p className:"text-yellow-600">组件未找到</p>
          <button 
            onClick={retry}
            className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
          >
            重试
          </button>
        </div>
      </div>
    );
  

  return <Component />;
};

// 批量预加载组件
export const useBatchPreload = () => {}
  const [preloadedCount, setPreloadedCount] = useState(0);
  const [totalToPreload, setTotalToPreload] = useState(0);

  const preloadBatch = useCallback(async (routeConfigs: RouteSplitConfig[]) => {}
    setTotalToPreload(routeConfigs.length);
    let completed = 0;

    const promises = routeConfigs.map(async (config) => {}
      const cacheKey = config.path;
      
      if (componentCache.has(cacheKey)) {}
        completed++;
        setPreloadedCount(completed);
        return;

      

      try {}
        await config.loader();
        completed++;
        setPreloadedCount(completed);
      } catch (error) {
        console.warn(`Failed to preload ${config.path}:`, error);
        completed++;
        setPreloadedCount(completed);
      
    });

    await Promise.allSettled(promises);
  }, []);

  const preloadByPriority = useCallback(async (priority: 'critical' | 'high' | 'medium' | 'low') => {}
    const routes = ROUTES_BY_PRIORITY[priority];
    await preloadBatch(routes);
  }, [preloadBatch]);

  return {}
    preloadedCount,
    totalToPreload,
    preloadBatch,
    preloadByPriority
  };
};

// 组件缓存管理
export const useComponentCache = () => {}
  const clearCache = useCallback(() => {}
    componentCache.clear();
    preloadStatus.clear();
  }, []);

  const getCacheSize = useCallback(() => {}
    return componentCache.size;
  }, []);

  const getCachedComponents = useCallback(() => {}
    return Array.from(componentCache.keys());
  }, []);

  return {}
    clearCache,
    getCacheSize,
    getCachedComponents,
    cacheSize: componentCache.size
  };
};

export default useRouteSplit;