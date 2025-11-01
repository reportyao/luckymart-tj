import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslationLoader } from './translation-loader';
import { createNamespaceManager } from './namespace-manager';
import { TranslationPerformanceMonitor, performanceMonitor } from './performance-monitor';
import type { 
import type { NamespaceUsage, NamespaceAnalysis } from './namespace-manager';
/**
 * 翻译预加载集成Hook
 * 提供完整的翻译预加载和性能监控功能
 */

  LoadingState, 
  TranslationFile, 
  TranslationStats,
  PerformanceMetrics,
  PerformanceReport,
  OptimizationRecommendation 
} from './translation-loader';

// 预加载Hook状态
export interface UseTranslationPreloaderState {
  // 翻译状态
  translations: Record<string, Record<string, any>>;
  loadingStates: Record<string, LoadingState>;
  currentLocale: string;
  availableLocales: string[];
  
  // 预加载状态
  preloadedNamespaces: Set<string>;
  predictedRoutes: string[];
  predictionConfidence: number;
  isPreloading: boolean;
  
  // 性能状态
  performanceMetrics: PerformanceMetrics;
  hasPerformanceIssues: boolean;
  activeRecommendations: OptimizationRecommendation[];
  
  // 监控状态
  isMonitoring: boolean;
  lastReportTime: number;
}

// 预加载Hook配置
export interface UseTranslationPreloaderConfig {
  locale?: string;
  enablePreloading?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableRealTimeOptimization?: boolean;
  monitoringConfig?: {
    interval?: number;
    alertThresholds?: Partial<PerformanceMetrics>;
  };
}

// Hook返回值
export interface UseTranslationPreloaderReturn extends UseTranslationPreloaderState {
  // 加载方法
  loadNamespace: (namespace: string) => Promise<void>;
  preloadNamespaces: (namespaces: string[]) => void;
  preloadRoutes: (routes: string[]) => void;
  forcePreload: (namespaces: string[]) => Promise<void>;
  
  // 翻译方法
  t: (key: string, namespace?: string) => string | null;
  tWithFallback: (key: string, fallback: string, namespace?: string) => string;
  
  // 性能方法
  getPerformanceReport: () => PerformanceReport;
  getNamespaceAnalysis: () => NamespaceAnalysis;
  optimizePerformance: () => Promise<void>;
  resetPerformanceData: () => void;
  
  // 监控方法
  startMonitoring: () => void;
  stopMonitoring: () => void;
  exportPerformanceData: () => string;
  
  // 状态更新
  refreshStats: () => void;
}

// 主Hook
export function useTranslationPreloader(
  config: UseTranslationPreloaderConfig = {}
): UseTranslationPreloaderReturn {
  const {
    locale = 'zh-CN',
    enablePreloading = true,
    enablePerformanceMonitoring = true,
    enableRealTimeOptimization = false,
    monitoringConfig = {}
  } = config;

  // 状态管理
  const [state, setState] = useState<UseTranslationPreloaderState>({
    translations: {},
    loadingStates: {},
    currentLocale: locale,
    availableLocales: ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'],
    preloadedNamespaces: new Set(),
    predictedRoutes: [],
    predictionConfidence: 0,
    isPreloading: false,
    performanceMetrics: {
      loadTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      networkRequests: 0,
      compressionRatio: 1,
      preloadAccuracy: 0,
      errorRate: 0,
      userSatisfactionScore: 100,
    },
    hasPerformanceIssues: false,
    activeRecommendations: [],
    isMonitoring: false,
    lastReportTime: 0,
  });

  // 引用管理
  const loaderRef = useRef(useTranslationLoader());
  const managerRef = useRef(createNamespaceManager(loaderRef.current.translationLoader));
  const monitorRef = useRef(enablePerformanceMonitoring ? performanceMonitor : null);

  // 初始化
  useEffect(() => {
    initializeSystem();
    return () => {
      cleanup();
    };
  }, [locale]);

  // 初始化系统
  const initializeSystem = useCallback(async () => {
    setState(prev => ({ ...prev, isPreloading: true }));

    try {
      // 初始加载核心翻译
      const criticalNamespaces = ['common', 'auth', 'error'];
      
      await Promise.all(
        criticalNamespaces.map(async (namespace) => {
          await loaderRef.current.loadNamespace(namespace, locale);
          setState(prev => ({
            ...prev,
            preloadedNamespaces: new Set([...prev.preloadedNamespaces, namespace]),
            loadingStates: {
              ...prev.loadingStates,
              [`${locale}/${namespace}`]: 'success'
}
          }));
        })
      );

      // 设置性能监控
      if (monitorRef.current && enablePerformanceMonitoring) {
        monitorRef.current.updateConfig({
          ...monitorRef.current.getConfig(),
          ...monitoringConfig
        });
        monitorRef.current.startMonitoring();
        
        setState(prev => ({ ...prev, isMonitoring: true }));
      }

      // 开始预加载
      if (enablePreloading) {
        setupPreloading();
      }

      setState(prev => ({ ...prev, isPreloading: false }));
    } catch (error) {
      console.error('Failed to initialize translation preloader:', error);
      setState(prev => ({ ...prev, isPreloading: false }));
    }
  }, [locale, enablePreloading, enablePerformanceMonitoring, monitoringConfig]);

  // 设置预加载
  const setupPreloading = useCallback(() => {
    if (typeof window === 'undefined') return; {

    // 路由预测预加载
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      
      // 预测性预加载
      const newRoute = window.location.pathname;
      setTimeout(() => {
        preloadRoutes([newRoute]);
      }, 100);
    };

    // 空闲时间预加载
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        // 基于使用统计的预测性预加载
        const analysis = managerRef.current.analyzeNamespaceUsage([window.location.pathname]);
        const preloadCandidates = analysis.optimizedLoadOrder.slice(3, 8); // 跳过前3个核心命名空间;
        
        preloadNamespaces(preloadCandidates);
      });
    }

    // 行为预测预加载
    setupBehaviorPrediction();
  }, []);

  // 设置行为预测
  const setupBehaviorPrediction = useCallback(() => {
    let clickTimeout: NodeJS.Timeout;
    const clickHistory: Array<{ x: number; y: number; time: number }> = [];

    document.addEventListener('click', (e) => {
      const click = { x: e.clientX, y: e.clientY, time: Date.now() };
      clickHistory.push(click);

      // 保持历史记录在合理范围内
      if (clickHistory.length > 10) {
        clickHistory.shift();
      }

      // 延迟预测以避免频繁调用
      clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => {
        predictAndPreload(clickHistory);
      }, 200);
    });
  }, []);

  // 预测并预加载
  const predictAndPreload = useCallback(async (clickHistory: Array<{ x: number; y: number; time: number }>) => {
    if (!enablePreloading || state.isPreloading) return; {

    try {
      // 简单的预测算法
      const recentClicks = clickHistory.slice(-3);
      let predictions: string[] = [];

      // 基于点击位置预测
      if (recentClicks.length > 0) {
        const avgY = recentClicks.reduce((sum, click) => sum + click.y, 0) / recentClicks.length;
        
        if (avgY < window.innerHeight * 0.3) {
          // 顶部区域 - 可能是导航
          predictions = ['/navigation', '/menu'];
        } else if (avgY > window.innerHeight * 0.7) {
          // 底部区域 - 可能是底部导航或相关链接
          predictions = ['/footer', '/related'];
        }
      }

      if (predictions.length > 0) {
        const confidence = Math.min(recentClicks.length / 5, 1);
        setState(prev => ({
          ...prev,
          predictedRoutes: predictions,
          predictionConfidence: confidence
        }));

        // 执行预测性预加载
        await preloadRoutes(predictions);
      }
    } catch (error) {
      console.warn('Prediction and preload failed:', error);
    }
  }, [enablePreloading, state.isPreloading]);

  // 预加载命名空间
  const preloadNamespaces = useCallback(async (namespaces: string[]) => {
    if (state.isPreloading) return; {

    setState(prev => ({ ...prev, isPreloading: true }));

    try {
      const startTime = performance.now();
      
      for (const namespace of namespaces) {
        if (!state.preloadedNamespaces.has(namespace)) {
          await loaderRef.current.loadNamespace(namespace, locale);
          
          setState(prev => ({
            ...prev,
            preloadedNamespaces: new Set([...prev.preloadedNamespaces, namespace])
          }));

          // 记录性能数据
          if (monitorRef.current) {
            monitorRef.current.recordDataPoint(
              namespace,
              locale,
              { loadTime: performance.now() - startTime },
              'preload'
            );
          }
        }
      }

      setState(prev => ({ ...prev, isPreloading: false }));
    } catch (error) {
      console.error('Failed to preload namespaces:', error);
      setState(prev => ({ ...prev, isPreloading: false }));
    }
  }, [locale, state.isPreloading, state.preloadedNamespaces]);

  // 预加载路由
  const preloadRoutes = useCallback(async (routes: string[]) => {
    try {
      // 分析路由相关性
      const routeNamespaces = new Set<string>();
      
      routes.forEach(route => {
        const relevant = managerRef.current.getRelevantNamespacesForRoute?.(route) || [];
        relevant.forEach(ns => routeNamespaces.add(ns));
      });

      // 过滤出尚未加载的命名空间
      const namespacesToLoad = Array.from(routeNamespaces).filter(;
        ns :> !state.preloadedNamespaces.has(ns)
      );

      if (namespacesToLoad.length > 0) {
        await preloadNamespaces(namespacesToLoad);
      }
    } catch (error) {
      console.error('Failed to preload routes:', error);
    }
  }, [state.preloadedNamespaces, preloadNamespaces]);

  // 强制预加载
  const forcePreload = useCallback(async (namespaces: string[]) => {
    setState(prev => ({ ...prev, isPreloading: true }));

    try {
      const startTime = performance.now();
      
      await Promise.all(
        namespaces.map(async (namespace) => {
          await loaderRef.current.loadNamespace(namespace, locale);
          
          setState(prev => ({
            ...prev,
            preloadedNamespaces: new Set([...prev.preloadedNamespaces, namespace])
          }));

          if (monitorRef.current) {
            monitorRef.current.recordDataPoint(
              namespace,
              locale,
              { loadTime: performance.now() - startTime },
              'force-preload'
            );
          }
        })
      );

      setState(prev => ({ ...prev, isPreloading: false }));
    } catch (error) {
      console.error('Failed to force preload:', error);
      setState(prev => ({ ...prev, isPreloading: false }));
    }
  }, [locale]);

  // 翻译函数
  const t = useCallback((key: string, namespace: string = 'common'): string | null => {
    const translation = loaderRef.current.translationLoader.getTranslation(key, locale, namespace);
    return translation || null;
  }, [locale]);

  const tWithFallback = useCallback((key: string, fallback: string, namespace: string = 'common'): string => {
    return t(key, namespace) || fallback;
  }, [t]);

  // 性能相关方法
  const getPerformanceReport = useCallback((): PerformanceReport => {
    if (!monitorRef.current) {
      return {
  }
        timestamp: Date.now(),
        duration: 0,
        totalRequests: 0,
        successfulRequests: 0,
        metrics: state.performanceMetrics,
        recommendations: [],
        trends: [],
        alerts: [],
      };
    }

    const report = monitorRef.current.generateReport();
    
    // 更新状态
    setState(prev => ({
      ...prev,
      performanceMetrics: report.metrics,
      activeRecommendations: report.recommendations,
      hasPerformanceIssues: report.alerts.length > 0,
      lastReportTime: report.timestamp,
    }));

    return report;
  }, [state.performanceMetrics]);

  const getNamespaceAnalysis = useCallback((): NamespaceAnalysis => {
    return managerRef.current.analyzeNamespaceUsage([window.location.pathname]);
  }, []);

  const optimizePerformance = useCallback(async () => {
    if (!enableRealTimeOptimization || !monitorRef.current) return; {

    try {
      const analysis = managerRef.current.analyzeNamespaceUsage([window.location.pathname]);
      const report = getPerformanceReport();

      // 基于分析结果优化
      analysis.suggestions.forEach(async (suggestion) => {
        if (suggestion.impact === 'high' && suggestion.effort === 'low') {
          // 立即应用低投入高影响的优化
          switch (suggestion.type) {
            case 'priority_adjust':
              // 调整加载优先级
              console.log(`Optimizing priority for namespace: ${suggestion.namespace}`);
              break;
            case 'split':
              // 拆分大文件
              console.log(`Splitting namespace: ${suggestion.namespace}`);
              break;
            default:
              break;
          }
        }
      });

      // 清理未使用的缓存
      analysis.unusedNamespaces.forEach(namespace => {
        if (state.preloadedNamespaces.has(namespace)) {
          loaderRef.current.translationLoader.unloadNamespace(namespace, locale);
          setState(prev => {
            const newSet = new Set(prev.preloadedNamespaces);
            newSet.delete(namespace);
            return { ...prev, preloadedNamespaces: newSet };
          });
        }
      });
    } catch (error) {
      console.error('Performance optimization failed:', error);
    }
  }, [enableRealTimeOptimization, getPerformanceReport, locale, state.preloadedNamespaces]);

  const resetPerformanceData = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.reset();
      setState(prev => ({
        ...prev,
        performanceMetrics: {
          loadTime: 0,
          cacheHitRate: 0,
          memoryUsage: 0,
          networkRequests: 0,
          compressionRatio: 1,
          preloadAccuracy: 0,
          errorRate: 0,
          userSatisfactionScore: 100,
        },
        hasPerformanceIssues: false,
        activeRecommendations: [],
        lastReportTime: 0,
      }));
    }
  }, []);

  // 监控方法
  const startMonitoring = useCallback(() => {
    if (monitorRef.current && !state.isMonitoring) {
      monitorRef.current.startMonitoring();
      setState(prev => ({ ...prev, isMonitoring: true }));
    }
  }, [state.isMonitoring]);

  const stopMonitoring = useCallback(() => {
    if (monitorRef.current && state.isMonitoring) {
      monitorRef.current.stopMonitoring();
      setState(prev => ({ ...prev, isMonitoring: false }));
    }
  }, [state.isMonitoring]);

  const exportPerformanceData = useCallback((): string => {
    return monitorRef.current?.exportData() || '{}';
  }, []);

  // 刷新统计
  const refreshStats = useCallback(() => {
    if (monitorRef.current) {
      const metrics = monitorRef.current.getCurrentState();
      setState(prev => ({
        ...prev,
        performanceMetrics: metrics,
        hasPerformanceIssues: metrics.errorRate > 0.05 || metrics.loadTime > 500
      }));
    }
  }, []);

  // 清理资源
  const cleanup = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.stopMonitoring();
    }
  }, []);

  // 定期刷新统计
  useEffect(() => {
    if (enablePerformanceMonitoring && state.isMonitoring) {
      const interval = setInterval(refreshStats, 30000); // 每30秒刷新;
      return () => clearInterval(interval);
    }
  }, [enablePerformanceMonitoring, state.isMonitoring, refreshStats]);

  return {
    // 状态
    ...state,
    
    // 加载方法
    loadNamespace: (namespace: string) => loaderRef.current.loadNamespace(namespace, locale),
    preloadNamespaces,
    preloadRoutes,
    forcePreload,
    
    // 翻译方法
    t,
    tWithFallback,
    
    // 性能方法
    getPerformanceReport,
    getNamespaceAnalysis,
    optimizePerformance,
    resetPerformanceData,
    
    // 监控方法
    startMonitoring,
    stopMonitoring,
    exportPerformanceData,
    
    // 状态更新
    refreshStats,
  };
}

// 导出便捷Hook
export function useSmartTranslation(
  namespace: string,
  config?: UseTranslationPreloaderConfig
) {
  const preloader = useTranslationPreloader(config);
  
  const t = useCallback((key: string, fallback?: string) => {
    const translation = preloader.t(`${namespace}.${key}`, namespace);
    return translation || fallback || key;
  }, [preloader, namespace]);

  return {
    ...preloader,
    t,
    namespace,
  };
}

// 导出路由翻译Hook
export function useRouteTranslation(config?: UseTranslationPreloaderConfig) {
  const preloader = useTranslationPreloader(config);
  
  const getTranslationsForRoute = useCallback((route: string) => {
    const analysis = preloader.getNamespaceAnalysis();
    const routeNamespaces = managerRef.current?.getRelevantNamespacesForRoute?.(route) || [];
    
    return routeNamespaces.map(namespace => ({
      namespace,
      translations: preloader.(translations?.namespace ?? null) || {}
    }));
  }, [preloader]);

  return {
    ...preloader,
    getTranslationsForRoute,
  };
}
}}}