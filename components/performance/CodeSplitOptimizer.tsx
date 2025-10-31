import React, { Suspense, lazy, ComponentType, ReactNode } from 'react';
import { SkeletonCard } from './SkeletonCard';
import { cn } from '@/lib/utils';

// 预加载管理
class PreloadManager {
  private static instance: PreloadManager;
  private preloadedModules = new Set<string>();
  private preloadQueue: string[] = [];
  private isPreloading = false;

  static getInstance(): PreloadManager {
    if (!PreloadManager.instance) {
      PreloadManager.instance = new PreloadManager();
    }
    return PreloadManager.instance;
  }

  async preload(modulePath: string): Promise<void> {
    if (this.preloadedModules.has(modulePath)) {
      return;
    }

    try {
      await import(modulePath);
      this.preloadedModules.add(modulePath);
    } catch (error) {
      console.warn(`Failed to preload module: ${modulePath}`, error);
    }
  }

  async preloadBatch(modulePaths: string[]): Promise<void> {
    if (this.isPreloading) {
      this.preloadQueue.push(...modulePaths);
      return;
    }

    this.isPreloading = true;
    
    try {
      await Promise.all(
        modulePaths.map(path => this.preload(path))
      );
    } finally {
      this.isPreloading = false;
      
      // 处理队列中的预加载任务
      if (this.preloadQueue.length > 0) {
        const queue = [...this.preloadQueue];
        this.preloadQueue = [];
        this.preloadBatch(queue);
      }
    }
  }

  isPreloaded(modulePath: string): boolean {
    return this.preloadedModules.has(modulePath);
  }

  clearCache(): void {
    this.preloadedModules.clear();
    this.preloadQueue = [];
  }
}

const preloadManager = PreloadManager.getInstance();

// 懒加载组件包装器
interface LazyComponentOptions {
  fallback?: ReactNode;
  preload?: boolean;
  preloadOnVisible?: boolean;
  preloadDelay?: number;
  retryCount?: number;
}

// 高阶组件：创建懒加载组件
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
) {
  const {
    fallback = <SkeletonCard variant="list" />,
    preload = false,
    preloadOnVisible = false,
    preloadDelay = 1000,
    retryCount = 2
  } = options;

  const LazyComponent = lazy(importFn);

  const ComponentWrapper: React.FC<React.ComponentProps<T>> = (props) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [retry, setRetry] = React.useState(0);

    React.useEffect(() => {
      if (preload) {
        preloadManager.preload(importFn.toString());
      }
    }, [preload]);

    React.useEffect(() => {
      if (preloadOnVisible) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              setIsVisible(true);
              observer.disconnect();
            }
          },
          { threshold: 0.1 }
        );

        const element = document.querySelector('[data-lazy-component]');
        if (element) {
          observer.observe(element);
        }

        return () => observer.disconnect();
      } else {
        setIsVisible(true);
      }
    }, [preloadOnVisible]);

    React.useEffect(() => {
      if (preload && preloadDelay > 0) {
        const timer = setTimeout(() => {
          preloadManager.preload(importFn.toString());
        }, preloadDelay);

        return () => clearTimeout(timer);
      }
    }, [preload, preloadDelay, importFn]);

    const handleError = React.useCallback(() => {
      if (retry < retryCount) {
        setRetry(prev => prev + 1);
      }
    }, [retry, retryCount]);

    if (!isVisible) {
      return <div data-lazy-component>{fallback}</div>;
    }

    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };

  // 添加预加载方法
  (ComponentWrapper as any).preload = () => preloadManager.preload(importFn.toString());
  (ComponentWrapper as any).preloadBatch = (paths: string[]) => preloadManager.preloadBatch(paths);

  return ComponentWrapper;
}

// 路由预加载Hook
export const useRoutePreloader = () => {
  const preloadRoutes = React.useCallback(async (routes: string[]) => {
    const routeModules = routes.map(route => `./pages${route}`);
    await preloadManager.preloadBatch(routeModules);
  }, []);

  const preloadRoute = React.useCallback(async (route: string) => {
    await preloadManager.preload(`./pages${route}`);
  }, []);

  const preloadCurrentRoute = React.useCallback(() => {
    const currentRoute = window.location.pathname;
    preloadRoute(currentRoute);
  }, [preloadRoute]);

  return { preloadRoutes, preloadRoute, preloadCurrentRoute };
};

// 智能预加载Hook
export const useSmartPreloader = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [connectionType, setConnectionType] = React.useState<string>('unknown');

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  React.useEffect(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      setConnectionType(connection.effectiveType || 'unknown');
    }
  }, []);

  const shouldPreload = React.useCallback(() => {
    // 网络条件好或者在WiFi环境下才预加载
    return isOnline && (connectionType === '4g' || connectionType === 'wifi' || connectionType === 'ethernet');
  }, [isOnline, connectionType]);

  const smartPreload = React.useCallback(async (modules: string[]) => {
    if (!shouldPreload()) return;

    // 根据网络条件调整预加载策略
    const batchSize = connectionType === '4g' ? 3 : connectionType === '3g' ? 1 : 0;
    
    if (batchSize === 0) return;

    for (let i = 0; i < modules.length; i += batchSize) {
      const batch = modules.slice(i, i + batchSize);
      await preloadManager.preloadBatch(batch);
      
      // 避免阻塞主线程
      if (i + batchSize < modules.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }, [shouldPreload, connectionType]);

  return {
    isOnline,
    connectionType,
    shouldPreload: shouldPreload(),
    smartPreload
  };
};

// 动态导入组件
export const DynamicImport: React.FC<{
  importFn: () => Promise<any>;
  fallback?: ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}> = ({ importFn, fallback, onLoad, onError, className }) => {
  const [component, setComponent] = React.useState<ReactNode>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isCancelled = false;

    const loadComponent = async () => {
      try {
        const module = await importFn();
        if (!isCancelled) {
          setComponent(module.default || module);
          onLoad?.();
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err as Error);
          onError?.(err as Error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      isCancelled = true;
    };
  }, [importFn, onLoad, onError]);

  if (isLoading) {
    return <div className={className}>{fallback || <SkeletonCard variant="list" />}</div>;
  }

  if (error) {
    return (
      <div className={cn('p-4 text-center text-red-600', className)}>
        <p>组件加载失败</p>
        <button 
          onClick={() => window.location.reload()} 
          className="luckymart-text-sm text-blue-600 hover:text-blue-800 mt-2"
        >
          重新加载
        </button>
      </div>
    );
  }

  return <div className={className}>{component}</div>;
};

// 预加载策略配置
export interface PreloadStrategy {
  priority: 'critical' | 'high' | 'medium' | 'low';
  trigger: 'immediate' | 'idle' | 'visible' | 'interaction';
  delay?: number;
  conditions?: {
    networkType?: string[];
    deviceType?: 'mobile' | 'desktop';
    minMemory?: number;
  };
}

// 预加载管理器Hook
export const usePreloadManager = () => {
  const { isOnline, connectionType, shouldPreload } = useSmartPreloader();
  
  const registerPreload = React.useCallback((
    modulePath: string, 
    strategy: PreloadStrategy
  ) => {
    if (!shouldPreload) return;

    const shouldLoad = checkStrategyConditions(strategy);
    if (!shouldLoad) return;

    switch (strategy.trigger) {
      case 'immediate':
        preloadManager.preload(modulePath);
        break;
        
      case 'idle':
        requestIdleCallback(() => preloadManager.preload(modulePath));
        break;
        
      case 'visible':
        // 通过Intersection Observer触发
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            preloadManager.preload(modulePath);
            observer.disconnect();
          }
        });
        
        const element = document.querySelector('[data-preload-trigger]');
        if (element) {
          observer.observe(element);
        }
        break;
        
      case 'interaction':
        // 用户交互时预加载
        const handleInteraction = () => {
          preloadManager.preload(modulePath);
          document.removeEventListener('click', handleInteraction);
        };
        document.addEventListener('click', handleInteraction);
        break;
    }
  }, [shouldPreload]);

  const clearCache = React.useCallback(() => {
    preloadManager.clearCache();
  }, []);

  return { registerPreload, clearCache, isOnline, connectionType };
};

const checkStrategyConditions = (strategy: PreloadStrategy): boolean => {
  const { conditions } = strategy;
  if (!conditions) return true;

  const connection = (navigator as any).connection;
  
  if (conditions.networkType && connection) {
    if (!conditions.networkType.includes(connection.effectiveType)) {
      return false;
    }
  }
  
  if (conditions.deviceType) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isDesktop = !isMobile;
    
    if (conditions.deviceType === 'mobile' && !isMobile) return false;
    if (conditions.deviceType === 'desktop' && !isDesktop) return false;
  }
  
  if (conditions.minMemory && (navigator as any).deviceMemory) {
    if ((navigator as any).deviceMemory < conditions.minMemory) {
      return false;
    }
  }
  
  return true;
};

// 懒加载路由组件
export const LazyRoute: React.FC<{
  component: string;
  fallback?: ReactNode;
  strategy?: PreloadStrategy;
}> = ({ component, fallback, strategy }) => {
  const LazyComponent = createLazyComponent(
    () => import(`../pages${component}`),
    { 
      fallback,
      preload: strategy?.trigger === 'immediate'
    }
  );

  return <LazyComponent />;
};

// 代码分割优化配置
export const CodeSplitConfig = {
  // 关键路径预加载
  criticalPaths: [
    '/',
    '/products',
    '/cart',
    '/profile'
  ],
  
  // 高优先级预加载
  highPriorityModules: [
    './components/common/Header',
    './components/common/Footer',
    './utils/helpers'
  ],
  
  // 条件预加载配置
  conditionalPreload: {
    mobile: ['./components/mobile/MobileNav'],
    desktop: ['./components/desktop/DesktopNav'],
    slowNetwork: [], // 慢网络环境下不预加载
    fastNetwork: ['./components/charts/Chart', './components/modals/Modal']
  }
};

export { 
  createLazyComponent,
  useRoutePreloader,
  useSmartPreloader,
  DynamicImport,
  LazyRoute
} from './CodeSplitOptimizerTools';

// 重命名导出，避免与主组件冲突
export const CodeSplitOptimizerTools = {
  createLazyComponent,
  useRoutePreloader,
  useSmartPreloader,
  DynamicImport,
  LazyRoute
};

export { 
  createLazyComponent,
  useRoutePreloader,
  useSmartPreloader,
  DynamicImport,
  LazyRoute,
  PreloadStrategy,
  usePreloadManager
};