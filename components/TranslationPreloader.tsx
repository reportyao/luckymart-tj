/**
 * 翻译预加载组件
 * 基于用户行为和路由的智能预加载系统
 */

import React, { useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { NamespaceManager, createNamespaceManager } from '../utils/namespace-manager';
import { translationLoader } from '../utils/translation-loader';

// 预加载配置
export interface PreloaderConfig {
  enableRoutePrediction: boolean;
  enableBehaviorPrediction: boolean;
  enableIntersectionObserver: boolean;
  preloadDelay: number;
  batchSize: number;
  maxConcurrentLoads: number;
  enableAnalytics: boolean;
}

// 预测结果
export interface PredictionResult {
  routes: string[];
  confidence: number;
  reasons: string[];
  timestamp: number;
}

// 预加载状态
export interface PreloadState {
  isPreloading: boolean;
  loadedNamespaces: Set<string>;
  predictedRoutes: string[];
  confidence: number;
  lastPreload: number;
}

// 默认配置
const DEFAULT_CONFIG: PreloaderConfig = {
  enableRoutePrediction: true,
  enableBehaviorPrediction: true,
  enableIntersectionObserver: true,
  preloadDelay: 100,
  batchSize: 3,
  maxConcurrentLoads: 3,
  enableAnalytics: true,
};

// 预加载分析器
class PreloadAnalyzer {
  private clickHistory: Array<{ x: number; y: number; time: number; element: string }> = [];
  private hoverHistory: Array<{ element: string; time: number; duration: number }> = [];
  private routeHistory: Array<{ route: string; time: number }> = [];
  private scrollBehavior: { direction: 'up' | 'down'; speed: number; position: number } = {
    direction: 'down',
    speed: 0,
    position: 0
  };

  constructor(private config: PreloaderConfig) {}

  // 分析用户行为
  analyzeBehavior(): PredictionResult {
    const routePredictions = this.predictRoutes();
    const behaviorPredictions = this.predictFromBehavior();
    
    const allPredictions = [...routePredictions, ...behaviorPredictions];
    const confidence = this.calculateConfidence(allPredictions);
    
    return {
      routes: allPredictions,
      confidence,
      reasons: this.getPredictionReasons(allPredictions),
      timestamp: Date.now()
    };
  }

  // 记录点击事件
  recordClick(x: number, y: number, element: string): void {
    const click = { x, y, time: Date.now(), element };
    this.clickHistory.push(click);
    
    // 保持历史记录在合理范围内
    if (this.clickHistory.length > 50) {
      this.clickHistory.shift();
    }

    // 记录元素相关预测
    this.predictFromClick(click);
  }

  // 记录悬停事件
  recordHover(element: string, duration: number): void {
    this.hoverHistory.push({
      element,
      time: Date.now(),
      duration
    });

    // 保持历史记录
    if (this.hoverHistory.length > 30) {
      this.hoverHistory.shift();
    }
  }

  // 记录路由变化
  recordRouteChange(route: string): void {
    this.routeHistory.push({ route, time: Date.now() });
    
    if (this.routeHistory.length > 20) {
      this.routeHistory.shift();
    }
  }

  // 记录滚动行为
  recordScroll(position: number): void {
    const now = Date.now();
    const timeDiff = now - this.scrollBehavior.position;
    
    if (timeDiff > 0) {
      const direction = position > this.scrollBehavior.position ? 'down' : 'up';
      const speed = Math.abs(position - this.scrollBehavior.position) / timeDiff;
      
      this.scrollBehavior = { direction, speed, position: now };
    }
  }

  // 预测路由
  private predictRoutes(): string[] {
    const predictions: string[] = [];
    const recentRoutes = this.routeHistory.slice(-5);
    
    if (recentRoutes.length < 2) return predictions;

    // 分析路由模式
    const routePatterns = this.analyzeRoutePatterns(recentRoutes);
    predictions.push(...routePatterns);

    return [...new Set(predictions)];
  }

  // 基于行为预测
  private predictFromBehavior(): string[] {
    const predictions: string[] = [];
    
    // 基于滚动方向预测
    if (this.scrollBehavior.direction === 'down' && this.scrollBehavior.speed > 0.5) {
      predictions.push('/load-more', '/next-page');
    }

    // 基于悬停模式预测
    const frequentElements = this.getFrequentHoverElements();
    predictions.push(...this.elementsToRoutes(frequentElements));

    return [...new Set(predictions)];
  }

  // 基于点击预测
  private predictFromClick(click: { x: number; y: number; time: number; element: string }): void {
    // 分析点击位置和元素
    const recentClicks = this.clickHistory.slice(-3);
    if (this.hasClickPattern(recentClicks)) {
      this.predictNavigationFromClicks(recentClicks);
    }
  }

  // 分析路由模式
  private analyzeRoutePatterns(recentRoutes: Array<{ route: string; time: number }>): string[] {
    const patterns: string[] = [];
    
    // 检查是否存在线性路径
    const routes = recentRoutes.map(r => r.route);
    if (this.isLinearPath(routes)) {
      const nextInSequence = this.getNextInSequence(routes);
      if (nextInSequence) {
        patterns.push(nextInSequence);
      }
    }

    return patterns;
  }

  // 获取高频悬停元素
  private getFrequentHoverElements(): string[] {
    const elementCounts = new Map<string, number>();
    
    this.hoverHistory.forEach(hover => {
      elementCounts.set(hover.element, (elementCounts.get(hover.element) || 0) + 1);
    });

    return Array.from(elementCounts.entries())
      .filter(([_, count]) => count > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([element]) => element);
  }

  // 元素到路由的映射
  private elementsToRoutes(elements: string[]): string[] {
    const elementToRoute: Record<string, string[]> = {
      'nav-item-home': ['/'],
      'nav-item-orders': ['/orders'],
      'nav-item-profile': ['/profile'],
      'nav-item-wallet': ['/wallet', '/transactions'],
      'nav-item-referral': ['/referral'],
      'menu-item-lottery': ['/lottery'],
      'menu-item-settings': ['/settings']
    };

    const routes: string[] = [];
    elements.forEach(element => {
      const mapped = elementToRoute[element];
      if (mapped) {
        routes.push(...mapped);
      }
    });

    return routes;
  }

  // 检查点击模式
  private hasClickPattern(clicks: Array<{ x: number; y: number; element: string }>): boolean {
    if (clicks.length < 3) return false;

    // 检查是否存在导航模式
    const navigationElements = clicks.filter(c => 
      c.element.includes('nav') || c.element.includes('menu')
    );

    return navigationElements.length >= 2;
  }

  // 从点击中预测导航
  private predictNavigationFromClicks(clicks: Array<{ x: number; y: number; element: string }>): void {
    // 实现基于点击序列的导航预测
    const lastClick = clicks[clicks.length - 1];
    
    // 如果点击的是导航相关元素，预测相关路由
    if (lastClick.element.includes('nav-')) {
      // 基于点击的导航元素预测相关页面
    }
  }

  // 检查是否为线性路径
  private isLinearPath(routes: string[]): boolean {
    if (routes.length < 3) return false;

    // 简化的线性路径检测
    const sortedRoutes = [...routes].sort();
    return routes.join(',') === sortedRoutes.join(',');
  }

  // 获取序列中的下一个路由
  private getNextInSequence(routes: string[]): string | null {
    // 简化的序列预测
    const knownSequences = [
      ['/orders', '/profile', '/settings'],
      ['/lottery', '/wallet', '/transactions']
    ];

    for (const sequence of knownSequences) {
      const index = sequence.findIndex(seq => 
        routes.every(route => route !== seq)
      );
      if (index === routes.length - 1) {
        return sequence[index + 1] || null;
      }
    }

    return null;
  }

  // 计算预测置信度
  private calculateConfidence(predictions: string[]): number {
    let confidence = 0;

    // 基于历史数据置信度
    const historyWeight = Math.min(this.routeHistory.length / 10, 1) * 0.4;
    confidence += historyWeight;

    // 基于行为模式置信度
    const behaviorWeight = Math.min(this.clickHistory.length / 20, 1) * 0.3;
    confidence += behaviorWeight;

    // 基于预测数量置信度
    const predictionWeight = Math.min(predictions.length / 5, 1) * 0.3;
    confidence += predictionWeight;

    return Math.round(confidence * 100);
  }

  // 获取预测原因
  private getPredictionReasons(predictions: string[]): string[] {
    const reasons: string[] = [];

    if (this.routeHistory.length > 0) {
      reasons.push('基于访问历史');
    }

    if (this.clickHistory.length > 5) {
      reasons.push('基于点击行为');
    }

    if (this.hoverHistory.length > 3) {
      reasons.push('基于悬停模式');
    }

    if (predictions.length > 0) {
      reasons.push('智能算法预测');
    }

    return reasons;
  }

  // 获取分析结果
  getAnalytics(): {
    clickCount: number;
    hoverCount: number;
    routeCount: number;
    averageConfidence: number;
    topPredictions: string[];
  } {
    return {
      clickCount: this.clickHistory.length,
      hoverCount: this.hoverHistory.length,
      routeCount: this.routeHistory.length,
      averageConfidence: this.calculateConfidence([]),
      topPredictions: this.predictRoutes()
    };
  }

  // 清理历史数据
  cleanup(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    this.clickHistory = this.clickHistory.filter(c => c.time > oneHourAgo);
    this.hoverHistory = this.hoverHistory.filter(h => h.time > oneHourAgo);
    this.routeHistory = this.routeHistory.filter(r => r.time > oneHourAgo);
  }
}

// 主预加载组件
interface TranslationPreloaderProps {
  children: ReactNode;
  locale?: string;
  config?: Partial<PreloaderConfig>;
  onPredictionUpdate?: (prediction: PredictionResult) => void;
  onPreloadComplete?: (stats: {
    loadedNamespaces: string[];
    loadTime: number;
    confidence: number;
  }) => void;
}

// 预加载上下文
interface PreloaderContextValue {
  state: PreloadState;
  analyzer: PreloadAnalyzer;
  manager: NamespaceManager;
  predictAndPreload: () => Promise<void>;
  forcePreload: (namespaces: string[]) => Promise<void>;
  getStats: () => any;
}

// 创建上下文
const PreloaderContext = React.createContext<PreloaderContextValue | null>(null);

// 预加载Hook
export function useTranslationPreloader() {
  const context = useContext(PreloaderContext);
  if (!context) {
    throw new Error('useTranslationPreloader must be used within TranslationPreloader');
  }
  return context;
}

// 主组件
export function TranslationPreloader({
  children,
  locale = 'zh-CN',
  config: userConfig = {},
  onPredictionUpdate,
  onPreloadComplete
}: TranslationPreloaderProps) {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const [state, setState] = useState<PreloadState>({
    isPreloading: false,
    loadedNamespaces: new Set(),
    predictedRoutes: [],
    confidence: 0,
    lastPreload: 0
  });

  const analyzerRef = useRef<PreloadAnalyzer>();
  const managerRef = useRef<NamespaceManager>();
  const intersectionObserverRef = useRef<IntersectionObserver>();

  // 初始化
  useEffect(() => {
    analyzerRef.current = new PreloadAnalyzer(config);
    managerRef.current = createNamespaceManager(translationLoader);

    if (config.enableIntersectionObserver) {
      setupIntersectionObserver();
    }

    if (config.enableBehaviorPrediction) {
      setupBehaviorTracking();
    }

    // 初始预加载
    initialPreload();

    return () => {
      cleanup();
    };
  }, []);

  // 初始预加载
  const initialPreload = useCallback(async () => {
    if (!managerRef.current) return;

    try {
      setState(prev => ({ ...prev, isPreloading: true }));
      
      // 预加载关键路径命名空间
      const criticalNamespaces = managerRef.current.getCriticalPath();
      const loadOrder = managerRef.current.getOptimizedLoadOrder(locale);
      
      const startTime = performance.now();
      
      for (const namespace of criticalNamespaces) {
        await translationLoader.loadNamespace(namespace, locale);
        setState(prev => ({
          ...prev,
          loadedNamespaces: new Set([...prev.loadedNamespaces, namespace])
        }));
      }

      const loadTime = performance.now() - startTime;
      
      setState(prev => ({ 
        ...prev, 
        isPreloading: false,
        lastPreload: Date.now()
      }));

      onPreloadComplete?.({
        loadedNamespaces: criticalNamespaces,
        loadTime,
        confidence: 100
      });
    } catch (error) {
      console.error('Initial preload failed:', error);
      setState(prev => ({ ...prev, isPreloading: false }));
    }
  }, [locale, onPreloadComplete]);

  // 智能预测和预加载
  const predictAndPreload = useCallback(async () => {
    if (!analyzerRef.current || !managerRef.current || state.isPreloading) return;

    try {
      const prediction = analyzerRef.current.analyzeBehavior();
      
      setState(prev => ({
        ...prev,
        predictedRoutes: prediction.routes,
        confidence: prediction.confidence
      }));

      onPredictionUpdate?.(prediction);

      if (prediction.confidence > 60 && prediction.routes.length > 0) {
        // 基于预测进行预加载
        for (const route of prediction.routes) {
          await managerRef.current.preloadBasedOnRoute(route, locale);
        }

        // 清理旧数据
        analyzerRef.current.cleanup();
      }
    } catch (error) {
      console.error('Prediction and preload failed:', error);
    }
  }, [state.isPreloading, locale, onPredictionUpdate]);

  // 强制预加载
  const forcePreload = useCallback(async (namespaces: string[]) => {
    if (!managerRef.current) return;

    try {
      setState(prev => ({ ...prev, isPreloading: true }));
      
      const startTime = performance.now();
      
      for (const namespace of namespaces) {
        await translationLoader.loadNamespace(namespace, locale);
        setState(prev => ({
          ...prev,
          loadedNamespaces: new Set([...prev.loadedNamespaces, namespace])
        }));
      }

      const loadTime = performance.now() - startTime;
      
      setState(prev => ({ 
        ...prev, 
        isPreloading: false,
        lastPreload: Date.now()
      }));

      onPreloadComplete?.({
        loadedNamespaces: namespaces,
        loadTime,
        confidence: 100
      });
    } catch (error) {
      console.error('Force preload failed:', error);
      setState(prev => ({ ...prev, isPreloading: false }));
    }
  }, [locale, onPreloadComplete]);

  // 设置交叉观察器
  const setupIntersectionObserver = () => {
    if (typeof window === 'undefined') return;

    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const route = entry.target.getAttribute('data-route');
            if (route && managerRef.current) {
              managerRef.current.preloadBasedOnRoute(route, locale);
            }
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0.1
      }
    );

    // 观察所有带有data-route属性的元素
    setTimeout(() => {
      const routeElements = document.querySelectorAll('[data-route]');
      routeElements.forEach(element => {
        intersectionObserverRef.current?.observe(element);
      });
    }, 1000);
  };

  // 设置行为跟踪
  const setupBehaviorTracking = () => {
    if (typeof document === 'undefined') return;

    let hoverTimer: NodeJS.Timeout;

    // 记录点击
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      analyzerRef.current?.recordClick(e.clientX, e.clientY, target.tagName.toLowerCase());
      
      // 延迟执行预测以避免频繁调用
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(predictAndPreload, 300);
    });

    // 记录悬停
    document.addEventListener('mouseenter', (e) => {
      const target = e.target as HTMLElement;
      const startTime = Date.now();
      
      const handleLeave = () => {
        const duration = Date.now() - startTime;
        analyzerRef.current?.recordHover(target.tagName.toLowerCase(), duration);
        target.removeEventListener('mouseleave', handleLeave);
      };
      
      target.addEventListener('mouseleave', handleLeave);
    }, true);

    // 记录滚动
    document.addEventListener('scroll', (e) => {
      const position = window.pageYOffset;
      analyzerRef.current?.recordScroll(position);
    }, { passive: true });

    // 记录路由变化
    window.addEventListener('popstate', () => {
      const route = window.location.pathname;
      analyzerRef.current?.recordRouteChange(route);
    });
  };

  // 清理资源
  const cleanup = () => {
    intersectionObserverRef.current?.disconnect();
    analyzerRef.current?.cleanup();
  };

  // 获取统计信息
  const getStats = useCallback(() => {
    return {
      state,
      analytics: analyzerRef.current?.getAnalytics(),
      usageStats: managerRef.current?.getUsageStats(),
      translationStats: translationLoader.getStats()
    };
  }, [state]);

  const contextValue: PreloaderContextValue = {
    state,
    analyzer: analyzerRef.current!,
    manager: managerRef.current!,
    predictAndPreload,
    forcePreload,
    getStats
  };

  return (
    <PreloaderContext.Provider value={contextValue}>
      {children}
      
      {/* 预加载状态指示器 (开发模式) */}
      {process.env.NODE_ENV === 'development' && (
        <PreloadIndicator 
          isPreloading={state.isPreloading}
          confidence={state.confidence}
          loadedCount={state.loadedNamespaces.size}
          predictedRoutes={state.predictedRoutes}
        />
      )}
    </PreloaderContext.Provider>
  );
}

// 预加载状态指示器组件
interface PreloadIndicatorProps {
  isPreloading: boolean;
  confidence: number;
  loadedCount: number;
  predictedRoutes: string[];
}

function PreloadIndicator({ 
  isPreloading, 
  confidence, 
  loadedCount, 
  predictedRoutes 
}: PreloadIndicatorProps) {
  if (typeof window === 'undefined') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      <div>🔄 预加载: {isPreloading ? '进行中' : '空闲'}</div>
      <div>📊 置信度: {confidence}%</div>
      <div>📦 已加载: {loadedCount} 个命名空间</div>
      {predictedRoutes.length > 0 && (
        <div>🎯 预测路由: {predictedRoutes.slice(0, 3).join(', ')}</div>
      )}
    </div>
  );
}

export default TranslationPreloader;