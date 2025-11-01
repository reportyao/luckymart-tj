'use client';

// CodeSplitOptimizerTools - 代码分割优化工具
import React, { ComponentType } from 'react';

// 高阶组件：创建懒加载组件
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    loading?: React.ComponentType;
    fallback?: React.ComponentType;
    ssr?: boolean;
  } = {}
) {
  const LazyComponent = React.lazy(importFn);
  
  return (props: React.ComponentProps<T>) => {
    const LoadingComponent = options.loading || (() => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    ));
    
    return (
      <React.Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };
}

// 路由预加载 Hook
export const useRoutePreloader = () => {
  const preloadRoute = React.useCallback((routePath: string) => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = routePath;
      document.head.appendChild(link);
    }
  }, []);
  
  return { preloadRoute };
};

// 智能预加载 Hook
export const useSmartPreloader = () => {
  const { preloadRoute } = useRoutePreloader();
  
  const smartPreload = React.useCallback((
    routes: string[], 
    conditions: {
      networkType?: string[];
      deviceType?: 'mobile' | 'desktop';
      userAgent?: string;
    } = {}
  ) => {
    if (conditions.networkType && typeof navigator !== 'undefined') {
      const connection = (navigator as any).connection;
      if (connection && !conditions.networkType.includes(connection.effectiveType)) {
        return; // 网络类型不满足条件，跳过预加载
      }
    }
    
    if (conditions.deviceType) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if ((conditions.deviceType === 'mobile' && !isMobile) || 
          (conditions.deviceType === 'desktop' && isMobile)) {
        return; // 设备类型不满足条件，跳过预加载
      }
    }
    
    routes.forEach(route => preloadRoute(route));
  }, [preloadRoute]);
  
  return { smartPreload };
};

// 动态导入组件
export const DynamicImport: React.FC<{
  importFn: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ComponentType;
  children: React.ReactNode;
}> = ({ importFn, fallback: Fallback, children }) => {
  const [Component, setComponent] = React.useState<ComponentType<any> | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    importFn()
      .then(({ default: ImportedComponent }) => {
        setComponent(() => ImportedComponent);
      })
      .catch((err) => {
        setError(err);
        console.error('Dynamic import failed:', err);
      });
  }, [importFn]);
  
  if (error) {
    return <div className="text-red-500 p-4">加载失败: {error.message}</div>;
  }
  
  if (!Component) {
    return Fallback || <div className="animate-pulse bg-gray-200 h-32 rounded"></div>;
  }
  
  return <Component>{children}</Component>;
};

// 懒加载路由组件
export const LazyRoute: React.FC<{
  path: string;
  component: () => Promise<{ default: ComponentType<any> }>;
  exact?: boolean;
}> = ({ component: Component, ...props }) => {
  return (
    <DynamicImport 
      importFn={Component} 
      fallback={<div className="animate-pulse bg-gray-200 h-32 rounded"></div>}
    >
      <Component {...props} />
    </DynamicImport>
  );
};

// 预加载策略
export type PreloadStrategy = {
  immediate: boolean;        // 立即加载
  lazy: boolean;            // 懒加载
  prefetch: boolean;        // 预加载
  priority: number;         // 优先级
};

// 预加载管理器 Hook
export const usePreloadManager = () => {
  const [preloadedRoutes, setPreloadedRoutes] = React.useState<Set<string>>(new Set());
  
  const preloadRoute = React.useCallback((routePath: string) => {
    if (typeof window !== 'undefined' && !preloadedRoutes.has(routePath)) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = routePath;
      document.head.appendChild(link);
      
      setPreloadedRoutes(prev => new Set([...prev, routePath]));
    }
  }, [preloadedRoutes]);
  
  const preloadMultiple = React.useCallback((routes: string[]) => {
    routes.forEach(preloadRoute);
  }, [preloadRoute]);
  
  const clearPreloaded = React.useCallback(() => {
    setPreloadedRoutes(new Set());
  }, []);
  
  return {
    preloadedRoutes: Array.from(preloadedRoutes),
    preloadRoute,
    preloadMultiple,
    clearPreloaded
  };
};

// 默认导出所有工具
export default {
  createLazyComponent,
  useRoutePreloader,
  useSmartPreloader,
  DynamicImport,
  LazyRoute,
  PreloadStrategy,
  usePreloadManager
};