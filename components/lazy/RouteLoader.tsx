'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useResourcePreloader } from '@/utils/resource-preloader';

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

// 动态导入组件映射
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

// 路由预加载Hook
export const useRoutePreloading = () => {
  const router = useRouter();
  const { preloadImages } = useResourcePreloader();

  // 预加载核心页面
  const preloadCoreRoutes = React.useCallback(() => {
    PRELOAD_CONFIGS.core.forEach(route => {
      router.prefetch(route);
    });
    
    // 预加载核心图片资源
    preloadImages([
      '/images/banners/hero-bg.jpg',
      '/images/icons/logo.png',
      '/images/icons/lottery-icon.png',
      '/images/icons/wallet-icon.png'
    ]);
  }, [router, preloadImages]);

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

  // 智能预加载
  const smartPreload = React.useCallback((context: 'navigation' | 'hover' | 'interaction') => {
    switch (context) {
      case 'navigation':
        preloadCoreRoutes();
        break;
      case 'hover':
        setTimeout(() => preloadSecondaryRoutes(), 500);
        break;
      case 'interaction':
        // 预加载用户相关页面
        ['/orders', '/transactions', '/profile'].forEach(route => {
          router.prefetch(route);
        });
        break;
    }
  }, [router, preloadCoreRoutes, preloadSecondaryRoutes]);

  // 预加载特定路由
  const preloadRoute = React.useCallback((route: string) => {
    router.prefetch(route);
  }, [router]);

  // 获取预加载状态
  const getPreloadStatus = React.useCallback(() => {
    return {
      coreRoutes: PRELOAD_CONFIGS.core.length,
      secondaryRoutes: PRELOAD_CONFIGS.secondary.length,
      adminRoutes: PRELOAD_CONFIGS.admin.length
    };
  }, []);

  return {
    preloadCoreRoutes,
    preloadSecondaryRoutes,
    preloadAdminRoutes,
    smartPreload,
    preloadRoute,
    getPreloadStatus,
    configs: PRELOAD_CONFIGS
  };
};

// 路由加载组件
interface RouteLoaderProps {
  children: React.ReactNode;
  priority?: 'core' | 'secondary' | 'admin';
  fallback?: React.ReactNode;
  showStats?: boolean;
}

export const RouteLoader: React.FC<RouteLoaderProps> = ({
  children,
  priority = 'secondary',
  fallback = <div className="animate-pulse bg-gray-200 rounded-lg h-32 flex items-center justify-center">
    <div className="text-gray-500">加载中...</div>
  </div>,
  showStats = false
}) => {
  const { 
    preloadCoreRoutes, 
    preloadSecondaryRoutes, 
    preloadAdminRoutes, 
    smartPreload 
  } = useRoutePreloading();
  const [stats, setStats] = React.useState({
    startTime: 0,
    preloadedRoutes: 0
  });

  React.useEffect(() => {
    const startTime = Date.now();
    
    switch (priority) {
      case 'core':
        preloadCoreRoutes();
        smartPreload('navigation');
        break;
      case 'secondary':
        setTimeout(() => preloadSecondaryRoutes(), 1000);
        break;
      case 'admin':
        setTimeout(() => preloadAdminRoutes(), 3000);
        break;
    }

    setStats(prev => ({ ...prev, startTime }));
  }, [priority, preloadCoreRoutes, preloadSecondaryRoutes, preloadAdminRoutes, smartPreload]);

  // 开发环境下显示预加载统计
  React.useEffect(() => {
    if (showStats && process.env.NODE_ENV === 'development') {
      const timer = setInterval(() => {
        setStats(prev => ({
          ...prev,
          preloadedRoutes: document.querySelectorAll('[data-prefetched="true"]').length
        }));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showStats]);

  return (
    <>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
      
      {/* 预加载统计信息 */}
      {showStats && process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs z-50">
          <div className="font-semibold mb-1">路由预加载统计</div>
          <div>优先级: {priority}</div>
          <div>预加载路由数: {stats.preloadedRoutes}</div>
          <div>耗时: {Date.now() - stats.startTime}ms</div>
        </div>
      )}
    </>
  );
};

// 智能链接组件 - 带有预加载功能的Link
interface SmartLinkProps {
  href: string;
  children: React.ReactNode;
  prefetch?: boolean;
  priority?: 'high' | 'medium' | 'low';
  className?: string;
  onMouseEnter?: () => void;
  onClick?: () => void;
}

export const SmartLink: React.FC<SmartLinkProps> = ({
  href,
  children,
  prefetch = true,
  priority = 'medium',
  className = '',
  onMouseEnter,
  onClick
}) => {
  const router = useRouter();
  const [isPrefetched, setIsPrefetched] = React.useState(false);

  const handleMouseEnter = React.useCallback(() => {
    if (prefetch && !isPrefetched) {
      router.prefetch(href);
      setIsPrefetched(true);
    }
    onMouseEnter?.();
  }, [href, prefetch, isPrefetched, router, onMouseEnter]);

  const handleClick = React.useCallback(() => {
    onClick?.();
  }, [onClick]);

  // 添加预加载标记
  React.useEffect(() => {
    if (isPrefetched && process.env.NODE_ENV === 'development') {
      const element = document.querySelector(`[href="${href}"]`);
      if (element) {
        (element as any).setAttribute('data-prefetched', 'true');
      }
    }
  }, [href, isPrefetched]);

  return (
    <Link 
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
};

// 默认加载组件
export const DefaultLoadingComponent: React.FC<{ type?: string }> = ({ type = 'default' }) => {
  const loadingVariants = {
    default: <div className="animate-pulse bg-gray-200 rounded-lg h-32" />,
    card: <div className="animate-pulse bg-white rounded-lg p-4 border">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>,
    list: <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 h-16 rounded"></div>
      ))}
    </div>,
    image: <div className="animate-pulse bg-gray-200 aspect-square rounded-lg"></div>
  };

  return <>{loadingVariants[type as keyof typeof loadingVariants] || loadingVariants.default}</>;
};

export default RouteLoader;

// 导入Link组件
import Link from 'next/link';