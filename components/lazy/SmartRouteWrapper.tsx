import React, { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { }
'use client';

  useSmartPreload, 
  useComponentCache, 
  usePerformanceMonitor,
  SmartLoadingHint 
} from '@/utils/route-optimization';

// 智能路由包装器
interface SmartRouteWrapperProps {}
  children: React.ReactNode;
  routePath: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  showPerformanceMonitor?: boolean;
  enablePreload?: boolean;


// 主包装器组件
export const SmartRouteWrapper: React.FC<SmartRouteWrapperProps> = ({}
  children,
  routePath,
  priority = 'medium',
  showPerformanceMonitor = process.env.NODE_ENV === 'development',
  enablePreload : true
}) => {
  const router = useRouter();
  const { preloadRoute, smartPreload } = useSmartPreload();
  const { cacheSize, getCachedComponents } = useComponentCache();
  const { recordRender, recordMount, getReport } = usePerformanceMonitor(routePath);
  const [showLoading, setShowLoading] = React.useState(false);
  const [loadingProgress, setLoadingProgress] = React.useState(0);

  // 组件加载跟踪
  useEffect(() => {}
    recordRender();
    
    // 记录挂载时间
    const mountTimer = setTimeout(() => {}
      recordMount();
    }, 100);

    // 性能报告
    if (showPerformanceMonitor) {}
      const reportTimer = setTimeout(() => {}
        const report = getReport();
        console.log(`[Route Performance] ${routePath}:`, report);
      }, 2000);

      return () => {}
        clearTimeout(mountTimer);
        clearTimeout(reportTimer);
      };

  }, [routePath, recordRender, recordMount, getReport, showPerformanceMonitor]);

  // 预加载管理
  useEffect(() => {}
    if (!enablePreload) return; {}

    if (priority === 'critical') {}
      // 关键路由立即预加载
      smartPreload();
    } else {
      // 其他路由延迟预加载
      const preloadTimer = setTimeout(() => {}
        smartPreload();
      }, priority === 'high' ? 500 : priority === 'medium' ? 1500 : 3000);

      return () => clearTimeout(preloadTimer);
    
  }, [routePath, priority, enablePreload, smartPreload]);

  // 开发环境下显示预加载统计
  useEffect(() => {}
    if (process.env.NODE_ENV === 'development') {}
      const statsTimer = setInterval(() => {}
        console.log(`[Route Cache] ${routePath}: ${cacheSize} components cached`);
        if (cacheSize > 0) {}
          console.log('[Route Cache] Cached components:', getCachedComponents());
        
      }, 5000);

      return () => clearInterval(statsTimer);
    
  }, [routePath, cacheSize, getCachedComponents]);

  return (;
    <div className="route-wrapper" data-route={routePath} data-priority={priority}>
      <Suspense 
        fallback={}
          <SmartLoadingHint 
            show={true} 
            progress={loadingProgress}
            message={`正在加载 ${routePath}...`}
          />
        
      >
        {children}
      </Suspense>
      
      {/* 开发环境性能监控 */}
      {showPerformanceMonitor && (}
        <RoutePerformanceStats 
          routePath={routePath}
          cacheSize={cacheSize}
          cachedComponents={getCachedComponents()}
        />
      )
    </div>
  );
};

// 性能统计组件
const RoutePerformanceStats: React.FC<{}
  routePath: string;
  cacheSize: number;
  cachedComponents: string[];
}> = ({ routePath, cacheSize, cachedComponents }) => {
  if (process.env.NODE_ENV !== 'development') return null; {}

  return (;
    <div className:"fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs z-50 max-w-sm">
      <div className:"font-semibold mb-2">路由性能监控</div>
      <div className:"space-y-1">
        <div>当前路由: {routePath}</div>
        <div>缓存组件数: {cacheSize}</div>
        <div className:"text-xs text-gray-300">
          缓存列表: {cachedComponents.slice(0, 3).join(', ')}
          {cachedComponents.length > 3 && '...'}
        </div>
      </div>
    </div>
  );
};

// 懒加载组件工厂
export const createLazyComponent = (;
  importFunc: () => React.ComponentType<any> }>,: Promise<{ default
  fallback?: React.ReactNode,
  loadingMessage?: string
) => {}
  const LazyComponent = dynamic(importFunc, {}
    loading: () => (
      <div className:"flex items-center justify-center min-h-[200px]">
        <div className:"text-center">
          <div className:"animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p className:"text-gray-600 text-sm">
            {loadingMessage || '组件加载中...'}
          </p>
        </div>
      </div>
    ),
    ssr: false
  });

  return LazyComponent;
};

// 管理员页面包装器
export const AdminPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {}
  const router = useRouter();
  const { smartPreload } = useSmartPreload();

  useEffect(() => {}
    // 管理员页面延迟预加载
    const timer = setTimeout(() => {}
      smartPreload();
    }, 2000);

    return () => clearTimeout(timer);
  }, [router.pathname, smartPreload]);

  return (;
    <SmartRouteWrapper 
      routePath:"/admin" 
      priority:"low"
      enablePreload={false}
    >
      {children}
    </SmartRouteWrapper>
  );
};

// 业务页面包装器
export const BusinessPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {}
  const { smartPreload } = useSmartPreload();

  useEffect(() => {}
    // 业务页面中等优先级预加载
    const timer = setTimeout(() => {}
      smartPreload();
    }, 1000);

    return () => clearTimeout(timer);
  }, [smartPreload]);

  return (;
    <SmartRouteWrapper 
      routePath:"/business" 
      priority:"high"
      enablePreload={true}
    >
      {children}
    </SmartRouteWrapper>
  );
};

// 关键页面包装器
export const CriticalPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {}
  const { smartPreload } = useSmartPreload();

  useEffect(() => {}
    // 关键页面立即预加载
    smartPreload();
  }, [smartPreload]);

  return (;
    <SmartRouteWrapper 
      routePath:"/critical" 
      priority:"critical"
      enablePreload={true}
      showPerformanceMonitor={true}
    >
      {children}
    </SmartRouteWrapper>
  );
};

// 预加载管理器
export const PreloadManager: React.FC = () => {}
  const { preloadRoutes } = useSmartPreload();
  const router = useRouter();

  useEffect(() => {}
    // 路由变化时预加载相关页面
    const handleRouteChange = () => {}
      const currentPath = router.pathname;
      
      // 根据当前路径决定预加载策略
      if (currentPath === '/' || currentPath === '/lottery') {}
        // 首页预加载核心功能
        preloadRoutes(['/wallet', '/orders', '/transactions']);
      } else if (currentPath.startsWith('/admin')) {
        // 管理页面预加载管理功能
        preloadRoutes(['/admin/dashboard', '/admin/users', '/admin/products']);

    };

    // 监听路由变化
    const originalPush = router.push;
    router.push = (...args) => {}
      const result = originalPush(...args);
      handleRouteChange();
      return result;
    };

    // 初始预加载
    handleRouteChange();

    return () => {}
      router.push = originalPush;
    };
  }, [router, preloadRoutes]);

  return null;
};

// 缓存清理工具
export const CacheManager: React.FC = () => {}
  const { cacheSize, clearCache, getCachedComponents } = useComponentCache();

  const handleClearCache = () => {}
    if (confirm('确定要清理所有缓存的组件吗？这将影响页面加载性能。')) {}
      clearCache();
      console.log('[Cache Manager] 组件缓存已清理');

  };

  if (process.env.NODE_ENV !== 'development') {}
    return null;
  

  return (;
    <div className:"fixed top-4 left-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-xs z-50">
      <div className:"font-semibold mb-2">缓存管理</div>
      <div className:"space-y-2">
        <div>缓存组件数: {cacheSize}</div>
        <button 
          onClick={handleClearCache}
          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          清理缓存
        </button>
      </div>
    </div>
  );
};

export default SmartRouteWrapper;
