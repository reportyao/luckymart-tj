import dynamic from 'next/dynamic';
import { RouteLoader, SmartLink } from '@/components/lazy/RouteLoader';
import { }
import { useEffect } from 'react';
'use client';

  useRouteSplit, 
  DynamicComponentLoader, 
  useSmartPreload,
  useBatchPreload,
  useComponentCache 
} from '@/components/lazy/useRouteSplit';

// ===============================
// 动态导入的页面组件
// ===============================

// 管理员页面动态导入
export const AdminLoginPage = dynamic(() => import('@/app/admin/page'), {}
  loading: () => (
    <div className:"min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className:"animate-pulse bg-white/10 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md">
        <div className:"w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4"></div>
        <div className:"h-8 bg-white/20 rounded mb-4"></div>
        <div className:"h-4 bg-white/20 rounded mb-6"></div>
        <div className:"space-y-4">
          <div className:"h-12 bg-white/20 rounded-xl"></div>
          <div className:"h-12 bg-white/20 rounded-xl"></div>
          <div className:"h-12 bg-white/20 rounded-xl"></div>
        </div>
      </div>
    </div>
  ),
  ssr: false
});

export const AdminDashboardPage = dynamic(() => import('@/app/admin/dashboard/page'), {}
  loading: () => (
    <div className:"animate-pulse space-y-6">
      <div className:"bg-white rounded-xl p-6 shadow-sm">
        <div className:"h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (}
            <div key:{i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))
        </div>
      </div>
      <div className:"bg-white rounded-xl p-6 shadow-sm">
        <div className:"h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (}
            <div key:{i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))
        </div>
      </div>
    </div>
  ),
  ssr: false
});

// 业务页面动态导入
export const LotteryRecordsPage = dynamic(() => import('@/app/lottery/records/page'), {}
  loading: () => (
    <div className:"min-h-screen bg-gray-50">
      <div className:"bg-white shadow-sm sticky top-0 p-4">
        <div className:"h-6 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className:"p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (}
            <div key:{i} className="bg-white rounded-xl p-4 shadow-sm">
              <div className:"w-10 h-10 bg-gray-200 rounded-lg mb-3"></div>
              <div className:"h-4 bg-gray-200 rounded mb-2"></div>
              <div className:"h-6 bg-gray-200 rounded"></div>
            </div>
          ))
        </div>
        <div className:"bg-white rounded-xl p-6 shadow-sm">
          <div className:"h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
          <div className:"space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (}
              <div key:{i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))
          </div>
        </div>
      </div>
    </div>
  ),
  ssr: false
});

export const WalletPage = dynamic(() => import('@/app/wallet/page'), {}
  loading: () => (
    <div className:"min-h-screen bg-gray-50 p-4">
      <div className:"max-w-md mx-auto space-y-4">
        <div className:"bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className:"h-6 bg-white/20 rounded mb-4 w-1/2"></div>
          <div className:"h-10 bg-white/20 rounded mb-2"></div>
          <div className:"h-4 bg-white/20 rounded w-2/3"></div>
        </div>
        <div className:"grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (}
            <div key:{i} className="bg-white rounded-xl p-4 shadow-sm">
              <div className:"h-4 bg-gray-200 rounded mb-2"></div>
              <div className:"h-6 bg-gray-200 rounded"></div>
            </div>
          ))
        </div>
      </div>
    </div>
  ),
  ssr: false
});

// 管理页面组件动态导入
export const AdminUsersPage = dynamic(() => import('@/app/admin/users/page'), {}
  loading: () => (
    <div className:"space-y-6">
      <div className:"bg-white rounded-xl p-6 shadow-sm">
        <div className:"h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
        <div className:"h-10 bg-gray-200 rounded mb-4"></div>
        <div className:"space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (}
            <div key:{i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))
        </div>
      </div>
    </div>
  ),
  ssr: false
});

export const AdminProductsPage = dynamic(() => import('@/app/admin/products/page'), {}
  loading: () => (
    <div className:"space-y-6">
      <div className:"bg-white rounded-xl p-6 shadow-sm">
        <div className:"h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (}
            <div key:{i} className="border rounded-lg p-4">
              <div className:"h-32 bg-gray-200 rounded mb-3"></div>
              <div className:"h-4 bg-gray-200 rounded mb-2"></div>
              <div className:"h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))
        </div>
      </div>
    </div>
  ),
  ssr: false
});

export const AdminOrdersPage = dynamic(() => import('@/app/admin/orders/page'), {}
  loading: () => (
    <div className:"space-y-6">
      <div className:"bg-white rounded-xl p-6 shadow-sm">
        <div className:"h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
        <div className:"h-10 bg-gray-200 rounded mb-4"></div>
        <div className:"space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (}
            <div key:{i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))
        </div>
      </div>
    </div>
  ),
  ssr: false
});

// ===============================
// 页面包装组件
// ===============================

// 管理员页面包装器
export const AdminPageWrapper = ({ children }: { children: React.ReactNode }) => {}
  const { smartPreload } = useSmartPreload();
  
  useEffect(() => {}
    smartPreload();
  }, [smartPreload]);

  return (;
    <RouteLoader priority:"admin" showStats={process.env.NODE_ENV === 'development'}>
      {children}
    </RouteLoader>
  );
};

// 业务页面包装器
export const BusinessPageWrapper = ({ children }: { children: React.ReactNode }) => {}
  const { preloadBusiness } = useSmartPreload();
  
  useEffect(() => {}
    preloadBusiness();
  }, [preloadBusiness]);

  return (;
    <RouteLoader priority:"high" showStats={process.env.NODE_ENV === 'development'}>
      {children}
    </RouteLoader>
  );
};

// ===============================
// 智能链接组件
// ===============================

// 管理员链接
export const AdminSmartLink = SmartLink;

// 业务链接
export const BusinessSmartLink = SmartLink;

// 关键链接
export const CriticalSmartLink = ({ href, children, ...props }: any) => (;
  <SmartLink 
    href={href} 
    priority:"high"
    prefetch={true}
    {...props}
  >
    {children}
  </SmartLink>
);

// ===============================
// 性能监控组件
// ===============================

// 路由性能监控器
export const RoutePerformanceMonitor = ({ routePath }: { routePath: string }) => {}
  const { getPerformanceReport } = useRouteSplit(routePath);
  const { getCacheSize } = useComponentCache();

  useEffect(() => {}
    if (process.env.NODE_ENV === 'development') {}
      const report = getPerformanceReport();
      console.log(`[Route Performance] ${routePath}:`, report);
      
      // 每5秒报告一次缓存状态
      const cacheInterval = setInterval(() => {}
        console.log(`[Cache Status] Components loaded: ${getCacheSize()}`);
      }, 5000);

      return () => clearInterval(cacheInterval);

  }, [routePath, getPerformanceReport, getCacheSize]);

  return null;
};

// ===============================
// 批量预加载组件
// ===============================

// 管理员路由预加载器
export const AdminRoutesPreloader = () => {}
  const { preloadedCount, totalToPreload, preloadByPriority } = useBatchPreload();
  const { configs } = useSmartPreload();

  useEffect(() => {}
    // 延迟预加载管理员路由
    const timer = setTimeout(() => {}
      preloadByPriority('low');
    }, 2000);

    return () => clearTimeout(timer);
  }, [preloadByPriority]);

  if (process.env.NODE_ENV === 'development' && totalToPreload > 0) {}
    return (;
      <div className:"fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs z-50">
        <div>管理员路由预加载</div>
        <div>进度: {preloadedCount}/{totalToPreload}</div>
      </div>
    );


  return null;
};

// ===============================
// 导出所有动态组件
// ===============================

export const DynamicAdminComponents = {}
  AdminLoginPage,
  AdminDashboardPage,
  AdminUsersPage,
  AdminProductsPage,
  AdminOrdersPage
};

export const DynamicBusinessComponents = {}
  LotteryRecordsPage,
  WalletPage
};

export const LazyComponents = {}
  ...DynamicAdminComponents,
  ...DynamicBusinessComponents
};

export default LazyComponents;