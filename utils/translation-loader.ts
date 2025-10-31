/**
 * 翻译文件渐进式加载器
 * 实现按需和渐进式翻译文件加载，支持预加载、缓存和压缩
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 加载状态类型
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// 翻译命名空间配置
export interface NamespaceConfig {
  name: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  routePattern?: string;
  dependencies?: string[];
  size?: number;
  lastUsed?: number;
}

// 翻译文件信息
export interface TranslationFile {
  locale: string;
  namespace: string;
  content: Record<string, any>;
  size: number;
  loadedAt: number;
  version: string;
}

// 加载策略配置
export interface LoadingStrategy {
  initialNamespaces: string[];
  preloadRules: {
    routeBased: boolean;
    timeBased: boolean;
    behaviorBased: boolean;
  };
  cacheStrategy: {
    maxCacheSize: number;
    cacheTimeout: number;
    compressionEnabled: boolean;
  };
  performance: {
    enableGzip: boolean;
    enableBrotli: boolean;
    batchLoadSize: number;
  };
}

// 翻译上下文
interface TranslationContextValue {
  translations: Record<string, Record<string, any>>;
  loadingStates: Record<string, LoadingState>;
  currentLocale: string;
  availableLocales: string[];
  loadNamespace: (namespace: string, locale?: string) => Promise<void>;
  preloadNamespaces: (namespaces: string[], locale?: string) => void;
  unloadNamespace: (namespace: string) => void;
  getTranslationStats: () => TranslationStats;
}

// 翻译统计信息
export interface TranslationStats {
  totalNamespaces: number;
  loadedNamespaces: number;
  totalSize: number;
  cacheHitRate: number;
  averageLoadTime: number;
  lastCleanup: number;
}

// 默认配置
const DEFAULT_LOADING_STRATEGY: LoadingStrategy = {
  initialNamespaces: ['common', 'auth'],
  preloadRules: {
    routeBased: true,
    timeBased: true,
    behaviorBased: true,
  },
  cacheStrategy: {
    maxCacheSize: 10 * 1024 * 1024, // 10MB
    cacheTimeout: 30 * 60 * 1000, // 30分钟
    compressionEnabled: true,
  },
  performance: {
    enableGzip: true,
    enableBrotli: true,
    batchLoadSize: 3,
  },
};

// 命名空间配置
const NAMESPACE_CONFIGS: NamespaceConfig[] = [
  { name: 'common', priority: 'critical', size: 15 * 1024 },
  { name: 'auth', priority: 'critical', size: 12 * 1024 },
  { name: 'error', priority: 'critical', size: 8 * 1024 },
  { name: 'admin', priority: 'high', routePattern: '/admin*', size: 25 * 1024 },
  { name: 'lottery', priority: 'high', size: 30 * 1024 },
  { name: 'referral', priority: 'normal', size: 20 * 1024 },
  { name: 'wallet', priority: 'normal', size: 18 * 1024 },
  { name: 'bot', priority: 'low', size: 16 * 1024 },
  { name: 'task', priority: 'low', size: 14 * 1024 },
];

// 内存缓存
class TranslationCache {
  private cache = new Map<string, TranslationFile>();
  private accessOrder: string[] = [];
  private totalSize = 0;

  constructor(private maxSize: number) {}

  get(key: string): TranslationFile | null {
    const file = this.cache.get(key);
    if (file) {
      this.updateAccessOrder(key);
    }
    return file || null;
  }

  set(key: string, file: TranslationFile): void {
    // 如果已存在，更新访问顺序
    if (this.cache.has(key)) {
      this.updateAccessOrder(key);
    } else {
      // 检查是否需要清理缓存
      while (this.totalSize + file.size > this.maxSize && this.accessOrder.length > 0) {
        this.evictLeastRecentlyUsed();
      }
      this.accessOrder.push(key);
    }
    
    this.cache.set(key, file);
    this.totalSize += file.size;
  }

  delete(key: string): void {
    if (this.cache.has(key)) {
      const file = this.cache.get(key);
      if (file) {
        this.totalSize -= file.size;
      }
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.totalSize = 0;
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }
  }

  private evictLeastRecentlyUsed(): void {
    const lruKey = this.accessOrder.shift();
    if (lruKey) {
      this.delete(lruKey);
    }
  }

  getStats() {
    return {
      size: this.totalSize,
      count: this.cache.size,
      hitRate: this.calculateHitRate(),
    };
  }

  private calculateHitRate(): number {
    // 简化实现，实际应该基于访问统计
    return this.cache.size / (this.cache.size + 1);
  }
}

// HTTP客户端
class TranslationHttpClient {
  private compressionEnabled = true;

  constructor(private baseUrl: string = '/locales') {
    this.detectCompressionSupport();
  }

  private detectCompressionSupport(): void {
    const acceptEncoding = navigator.headers?.get?.('accept-encoding') || '';
    this.compressionEnabled = acceptEncoding.includes('gzip') || acceptEncoding.includes('br');
  }

  async loadTranslation(locale: string, namespace: string): Promise<TranslationFile> {
    const url = this.buildUrl(locale, namespace);
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, {
        headers: this.compressionEnabled ? {
          'Accept-Encoding': 'gzip, br',
        } : {},
        cache: 'force-cache',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.json();
      const size = Number(response.headers.get('content-length') || 0);
      const loadTime = performance.now() - startTime;

      return {
        locale,
        namespace,
        content,
        size,
        loadedAt: Date.now(),
        version: response.headers.get('etag') || '1.0',
      };
    } catch (error) {
      throw new Error(`Failed to load translation ${locale}/${namespace}: ${error}`);
    }
  }

  private buildUrl(locale: string, namespace: string): string {
    return `${this.baseUrl}/${locale}/${namespace}.json`;
  }

  async batchLoadTranslations(
    requests: Array<{ locale: string; namespace: string }>
  ): Promise<TranslationFile[]> {
    const results: TranslationFile[] = [];
    const batchSize = 3; // 并发限制
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(req => 
        this.loadTranslation(req.locale, req.namespace).catch(err => {
          console.warn(`Failed to load ${req.locale}/${req.namespace}:`, err);
          return null;
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(Boolean) as TranslationFile[]);
    }
    
    return results;
  }
}

// 主翻译加载器类
export class TranslationLoader {
  private cache: TranslationCache;
  private httpClient: TranslationHttpClient;
  private loadingStates = new Map<string, LoadingState>();
  private pendingLoads = new Map<string, Promise<TranslationFile>>();
  private observer: IntersectionObserver | null = null;
  private preloadedNamespaces = new Set<string>();

  constructor(
    private config: LoadingStrategy = DEFAULT_LOADING_STRATEGY
  ) {
    this.cache = new TranslationCache(config.cacheStrategy.maxCacheSize);
    this.httpClient = new TranslationHttpClient();
    this.initializePerformanceMonitoring();
  }

  // 加载命名空间
  async loadNamespace(namespace: string, locale: string = 'zh-CN'): Promise<void> {
    const key = `${locale}/${namespace}`;
    
    // 检查是否正在加载
    if (this.loadingStates.get(key) === 'loading') {
      await this.pendingLoads.get(key);
      return;
    }

    // 检查缓存
    const cached = this.cache.get(key);
    if (cached) {
      this.updateLoadingState(key, 'success');
      this.preloadedNamespaces.add(namespace);
      return;
    }

    this.updateLoadingState(key, 'loading');

    try {
      const file = await this.httpClient.loadTranslation(locale, namespace);
      this.cache.set(key, file);
      this.updateLoadingState(key, 'success');
      this.preloadedNamespaces.add(namespace);
      
      // 清理过期的缓存
      this.cleanupCache();
    } catch (error) {
      this.updateLoadingState(key, 'error');
      throw error;
    }
  }

  // 预加载命名空间
  preloadNamespaces(namespaces: string[], locale: string = 'zh-CN'): void {
    const criticalNamespaces = this.getCriticalNamespaces();
    
    namespaces.forEach(namespace => {
      if (!this.preloadedNamespaces.has(namespace) && !criticalNamespaces.includes(namespace)) {
        // 在空闲时预加载
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            this.loadNamespace(namespace, locale).catch(console.warn);
          });
        } else {
          setTimeout(() => {
            this.loadNamespace(namespace, locale).catch(console.warn);
          }, 100);
        }
      }
    });
  }

  // 路由预加载
  setupRouteBasedPreloading(): void {
    if (!this.config.preloadRules.routeBased) return;

    // 使用 Intersection Observer 预加载可见区域的翻译
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const namespaces = this.getNamespacesFromRoute(entry.target.getAttribute('data-route') || '');
          this.preloadNamespaces(namespaces);
        }
      });
    }, {
      rootMargin: '100px',
    });
  }

  // 行为预测预加载
  setupBehaviorBasedPreloading(): void {
    if (!this.config.preloadRules.behaviorBased) return;

    let mousePosition = { x: 0, y: 0 };
    let clickHistory: Array<{ x: number; y: number; time: number }> = [];

    document.addEventListener('mousemove', (e) => {
      mousePosition = { x: e.clientX, y: e.clientY };
    });

    document.addEventListener('click', (e) => {
      clickHistory.push({ x: e.clientX, y: e.clientY, time: Date.now() });
      
      // 保留最近的点击历史
      if (clickHistory.length > 10) {
        clickHistory.shift();
      }

      // 基于点击模式预测下一步操作
      this.predictAndPreload(clickHistory);
    });
  }

  // 获取翻译
  getTranslation(key: string, locale: string, namespace: string): string | null {
    const cacheKey = `${locale}/${namespace}`;
    const file = this.cache.get(cacheKey);
    
    if (!file) return null;

    const keys = key.split('.');
    let value: any = file.content;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return typeof value === 'string' ? value : null;
  }

  // 卸载命名空间
  unloadNamespace(namespace: string, locale: string = 'zh-CN'): void {
    const key = `${locale}/${namespace}`;
    this.cache.delete(key);
    this.preloadedNamespaces.delete(namespace);
    this.loadingStates.delete(key);
  }

  // 获取统计信息
  getStats(): TranslationStats {
    const cacheStats = this.cache.getStats();
    
    return {
      totalNamespaces: NAMESPACE_CONFIGS.length,
      loadedNamespaces: this.preloadedNamespaces.size,
      totalSize: cacheStats.size,
      cacheHitRate: cacheStats.hitRate,
      averageLoadTime: 0, // 简化实现
      lastCleanup: Date.now(),
    };
  }

  // 私有方法
  private updateLoadingState(key: string, state: LoadingState): void {
    this.loadingStates.set(key, state);
  }

  private getCriticalNamespaces(): string[] {
    return NAMESPACE_CONFIGS
      .filter(config => config.priority === 'critical')
      .map(config => config.name);
  }

  private getNamespacesFromRoute(route: string): string[] {
    const matchedConfigs = NAMESPACE_CONFIGS.filter(config => {
      if (!config.routePattern) return false;
      const pattern = new RegExp(config.routePattern.replace('*', '.*'));
      return pattern.test(route);
    });
    
    return matchedConfigs.map(config => config.name);
  }

  private predictAndPreload(clickHistory: Array<{ x: number; y: number; time: number }>): void {
    // 简单的行为预测算法
    // 基于点击位置和历史预测用户可能访问的页面
    if (clickHistory.length < 3) return;

    const recentClicks = clickHistory.slice(-3);
    const avgPosition = recentClicks.reduce(
      (acc, click) => ({ x: acc.x + click.x, y: acc.y + click.y }),
      { x: 0, y: 0 }
    );
    avgPosition.x /= recentClicks.length;
    avgPosition.y /= recentClicks.length;

    // 基于位置预测可能的操作
    if (avgPosition.y < window.innerHeight * 0.3) {
      // 页面顶部，可能预加载导航相关翻译
      this.preloadNamespaces(['navigation', 'menu']);
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    // 清理过期的缓存项
    for (const [key, file] of this.cache) {
      if (now - file.loadedAt > this.config.cacheStrategy.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  private initializePerformanceMonitoring(): void {
    // 监控翻译加载性能
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource' && entry.name.includes('/locales/')) {
            console.log(`Translation loaded: ${entry.name}, duration: ${entry.duration}ms`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
    }
  }
}

// React Hook
export function useTranslationLoader() {
  const [translations, setTranslations] = useState<Record<string, Record<string, any>>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});
  const [currentLocale, setCurrentLocale] = useState('zh-CN');
  const [loader] = useState(() => new TranslationLoader());

  useEffect(() => {
    // 初始加载核心翻译
    const criticalNamespaces = ['common', 'auth', 'error'];
    criticalNamespaces.forEach(async (namespace) => {
      try {
        await loader.loadNamespace(namespace, currentLocale);
        setLoadingStates(prev => ({ ...prev, [`${currentLocale}/${namespace}`]: 'success' }));
      } catch (error) {
        setLoadingStates(prev => ({ ...prev, [`${currentLocale}/${namespace}`]: 'error' }));
      }
    });
  }, [currentLocale, loader]);

  return {
    translations,
    loadingStates,
    currentLocale,
    availableLocales: ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'],
    loadNamespace: loader.loadNamespace.bind(loader),
    preloadNamespaces: loader.preloadNamespaces.bind(loader),
    unloadNamespace: loader.unloadNamespace.bind(loader),
    getTranslationStats: loader.getStats.bind(loader),
  };
}

// 导出单例实例
export const translationLoader = new TranslationLoader();