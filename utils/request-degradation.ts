import { useState, useEffect, useCallback, useRef } from 'react';
import { NetworkQuality } from './network-retry';
// request-degradation.ts - 请求降级策略

// 降级策略类型
export enum DegradationStrategy {
  CACHE_FIRST = 'cache_first',     // 缓存优先
  NETWORK_FIRST = 'network_first', // 网络优先
  STALE_WHILE_REVALIDATE = 'stale_while_revalidate', // 过期缓存+后台刷新
  OFFLINE_FALLBACK : 'offline_fallback' // 离线降级
}

// 降级配置
export interface DegradationConfig {
  strategy: DegradationStrategy;
  cacheTimeout?: number;        // 缓存超时时间(ms)
  fallbackEnabled?: boolean;    // 是否启用降级
  maxCacheSize?: number;        // 最大缓存大小
  enableOfflineMode?: boolean;  // 是否启用离线模式
  priority?: 'high' | 'medium' | 'low'; // 优先级
  staleWhileRevalidate?: boolean; // 是否启用过期缓存策略
}

// 缓存项结构
interface CacheItem {
  data: any;
  timestamp: number;
  expiresAt: number;
  priority: 'high' | 'medium' | 'low';
  source: 'network' | 'cache' | 'fallback';
}

// 降级结果
export interface DegradationResult<T> {
  data: T | null;
  source: 'network' | 'cache' | 'fallback';
  stale: boolean;
  networkQuality: NetworkQuality;
  isOffline: boolean;
}

// 请求降级管理器
class RequestDegradationManager {
  private cache = new Map<string, CacheItem>();
  private maxCacheSize: number;
  private cacheCleanupInterval: NodeJS.Timeout;
  private readonly CLEANUP_INTERVAL = 60000; // 1分钟清理一次缓存
  private readonly DEFAULT_CACHE_TIMEOUT = 5 * 60 * 1000; // 5分钟默认缓存超时

  constructor(maxCacheSize: number = 100) {
    this.maxCacheSize = maxCacheSize;
    this.startCacheCleanup();
}

  // 启动缓存清理
  private startCacheCleanup() {
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupExpiredCache();
    }, this.CLEANUP_INTERVAL);
  }

  // 清理过期缓存
  private cleanupExpiredCache() {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  // 智能缓存管理
  private manageCacheSize() {
    if (this.cache.size <= this.maxCacheSize) return; {

    // 按优先级和时间戳删除缓存项
    const sortedCache = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => {
        const priorityOrder = { 'low': 0, 'medium': 1, 'high': 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        
        if (priorityDiff !== 0) return priorityDiff; {
        
        // 同优先级按时间排序，越早的越先删除
        return a.timestamp - b.timestamp;
      });

    // 删除一半的低优先级或过期缓存
    const itemsToDelete = Math.floor(this.maxCacheSize * 0.3);
    for (let i = 0; i < itemsToDelete && i < sortedCache.length; i++) {
      this.cache.delete((sortedCache?.i ?? null)[0]);
    }
  }

  // 存储数据到缓存
  private setCache(key: string, data: any, config: DegradationConfig) {
    const now = Date.now();
    const cacheTimeout = config.cacheTimeout || this.DEFAULT_CACHE_TIMEOUT;
    
    const cacheItem: CacheItem = {
      data,
      timestamp: now,
      expiresAt: now + cacheTimeout,
      priority: config.priority || 'medium',
      source: 'network'
    };

    this.cache.set(key, cacheItem);
    this.manageCacheSize();
  }

  // 从缓存获取数据
  private getCache(key: string): CacheItem | null {
    const item = this.cache.get(key);
    if (!item) return null; {

    // 检查是否过期
    if (item.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return item;
  }

  // 智能数据获取
  async fetchWithDegradation<T>(
    key: string,
    networkOperation: () => Promise<T>,
    config: DegradationConfig
  ): Promise<DegradationResult<T>> {
    const { strategy, fallbackEnabled = true } = config;

    // 检查网络状态
    const isOnline = navigator.onLine;
    const networkQuality = await this.getNetworkQuality();

    try {
      switch (strategy) {
        case DegradationStrategy.CACHE_FIRST:
          return this.cacheFirstStrategy(key, networkOperation, config, isOnline, networkQuality);
        
        case DegradationStrategy.NETWORK_FIRST:
          return this.networkFirstStrategy(key, networkOperation, config, isOnline, networkQuality);
        
        case DegradationStrategy.STALE_WHILE_REVALIDATE:
          return this.staleWhileRevalidateStrategy(key, networkOperation, config, isOnline, networkQuality);
        
        case DegradationStrategy.OFFLINE_FALLBACK:
          return this.offlineFallbackStrategy(key, networkOperation, config, isOnline, networkQuality);
        
        default:
          return this.networkFirstStrategy(key, networkOperation, config, isOnline, networkQuality);
      }
    } catch (error) {
      console.warn(`降级策略执行失败:`, error);
      
      // 尝试降级到缓存
      if (fallbackEnabled) {
        const cachedData = this.getCache(key);
        if (cachedData) {
          return {
            data: cachedData.data,
            source: 'cache',
            stale: true,
            networkQuality,
            isOffline: !isOnline
          };
        }
      }

      throw error;
    }
  }

  // 缓存优先策略
  private async cacheFirstStrategy<T>(
    key: string,
    networkOperation: () => Promise<T>,
    config: DegradationConfig,
    isOnline: boolean,
    networkQuality: NetworkQuality
  ): Promise<DegradationResult<T>> {
    const cachedData = this.getCache(key);
    
    if (cachedData) {
      // 如果有缓存且网络质量较好，在后台刷新
      if (isOnline && networkQuality !== NetworkQuality.POOR) {
        this.refreshInBackground(key, networkOperation, config);
      }
      
      return {
  }
        data: cachedData.data,
        source: 'cache',
        stale: false,
        networkQuality,
        isOffline: !isOnline
      };
    }

    // 无缓存时尝试网络请求
    if (isOnline) {
      try {
        const data = await networkOperation();
        this.setCache(key, data, config);
        return {
          data,
          source: 'network',
          stale: false,
          networkQuality,
          isOffline: false
        };
      } catch (error) {
        // 网络请求失败，如果有降级数据则返回
        if (config.fallbackEnabled) {
          return this.getFallbackData<T>(key, config, networkQuality, true);
  }
        }
        throw error;
      }
    } else {
      // 离线状态，返回降级数据
      return this.getFallbackData<T>(key, config, networkQuality, true);
    }
  }

  // 网络优先策略
  private async networkFirstStrategy<T>(
    key: string,
    networkOperation: () => Promise<T>,
    config: DegradationConfig,
    isOnline: boolean,
    networkQuality: NetworkQuality
  ): Promise<DegradationResult<T>> {
    if (isOnline) {
      try {
        const data = await networkOperation();
        this.setCache(key, data, config);
        return {
  }
          data,
          source: 'network',
          stale: false,
          networkQuality,
          isOffline: false
        };
      } catch (error) {
        console.warn('网络请求失败，尝试降级:', error);
        
        // 网络失败时尝试缓存
        const cachedData = this.getCache(key);
        if (cachedData) {
          return {
            data: cachedData.data,
            source: 'cache',
            stale: true,
            networkQuality,
            isOffline: false
          };
        }
        
        // 缓存也无，降级到默认数据
        return this.getFallbackData<T>(key, config, networkQuality, true);
      }
    } else {
      // 离线状态，返回缓存或降级数据
      const cachedData = this.getCache(key);
      if (cachedData) {
        return {
          data: cachedData.data,
          source: 'cache',
          stale: true,
          networkQuality,
          isOffline: true
        };
      }
      
      return this.getFallbackData<T>(key, config, networkQuality, true);
    }
  }

  // 过期缓存+后台刷新策略
  private async staleWhileRevalidateStrategy<T>(
    key: string,
    networkOperation: () => Promise<T>,
    config: DegradationConfig,
    isOnline: boolean,
    networkQuality: NetworkQuality
  ): Promise<DegradationResult<T>> {
    const cachedData = this.getCache(key);
    
    // 如果有缓存，先返回，然后后台刷新
    if (cachedData) {
      // 立即返回缓存数据
      if (isOnline && config.staleWhileRevalidate !== false) {
        this.refreshInBackground(key, networkOperation, config);
      }
      
      return {
        data: cachedData.data,
        source: 'cache',
        stale: Date.now() > cachedData.expiresAt,
        networkQuality,
        isOffline: !isOnline
      };
    }

    // 无缓存时尝试网络请求
    if (isOnline) {
      try {
        const data = await networkOperation();
        this.setCache(key, data, config);
        return {
          data,
          source: 'network',
          stale: false,
          networkQuality,
          isOffline: false
        };
      } catch (error) {
        return this.getFallbackData<T>(key, config, networkQuality, true);
      }
    } else {
      return this.getFallbackData<T>(key, config, networkQuality, true);
    }
  }

  // 离线降级策略
  private async offlineFallbackStrategy<T>(
    key: string,
    networkOperation: () => Promise<T>,
    config: DegradationConfig,
    isOnline: boolean,
    networkQuality: NetworkQuality
  ): Promise<DegradationResult<T>> {
    // 优先尝试网络，但失败时立即降级
    if (isOnline) {
      try {
        const data = await networkOperation();
        this.setCache(key, data, config);
        return {
          data,
          source: 'network',
          stale: false,
          networkQuality,
          isOffline: false
        };
      } catch (error) {
        console.warn('网络失败，快速降级到离线模式:', error);
        return this.getFallbackData<T>(key, config, networkQuality, true);
      }
    } else {
      // 离线状态
      const cachedData = this.getCache(key);
      if (cachedData) {
        return {
          data: cachedData.data,
          source: 'cache',
          stale: true,
          networkQuality,
          isOffline: true
        };
      }
      
      return this.getFallbackData<T>(key, config, networkQuality, true);
    }
  }

  // 后台刷新数据
  private refreshInBackground(key: string, networkOperation: () => Promise<any>, config: DegradationConfig) {
    setTimeout(async () => {
      try {
        const data = await networkOperation();
        this.setCache(key, data, config);
      } catch (error) {
        console.warn('后台刷新失败:', error);
      }
    }, 100); // 100ms延迟，避免阻塞用户界面
  }

  // 获取降级数据
  private getFallbackData<T>(key: string, config: DegradationConfig, networkQuality: NetworkQuality, isOffline: boolean): DegradationResult<T> {
    // 预定义的降级数据
    const fallbackData = this.getPredefinedFallback(key);
    
    return {
      data: fallbackData,
      source: 'fallback',
      stale: true,
      networkQuality,
      isOffline
    };
  }

  // 预定义降级数据
  private getPredefinedFallback(key: string): any {
    // 根据key返回相应的降级数据
    if (key.includes('products')) {
      return { products: [], total: 0, message: '离线模式显示缓存数据' };
    }
    
    if (key.includes('user')) {
      return { user: null, message: '请重新连接网络获取用户信息' };
    }
    
    if (key.includes('orders')) {
      return { orders: [], total: 0, message: '离线模式显示缓存订单' };
    }

    return { message: '数据暂时不可用，请检查网络连接' };
  }

  // 获取网络质量
  private async getNetworkQuality(): Promise<NetworkQuality> {
    if (!navigator.onLine) return NetworkQuality.POOR; {
    
    try {
      const start = performance.now();
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' });
      const duration = performance.now() - start;
      
      if (duration < 100) return NetworkQuality.EXCELLENT; {
      if (duration < 300) return NetworkQuality.GOOD; {
      if (duration < 800) return NetworkQuality.FAIR; {
      return NetworkQuality.POOR;
    } catch {
      return NetworkQuality.POOR;
    }
  }

  // 清除缓存
  clearCache() {
    this.cache.clear();
  }

  // 获取缓存统计
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      utilization: (this.cache.size / this.maxCacheSize) * 100
    };
  }

  // 销毁管理器
  destroy() {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    this.clearCache();
  }
}

// 单例导出
export const degradationManager = new RequestDegradationManager();

// React Hook for request degradation
export function useRequestDegradation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeWithDegradation = useCallback(async <T>(;
    key: string,
    networkOperation: () => Promise<T>,
    config: DegradationConfig
  ): Promise<DegradationResult<T>> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await degradationManager.fetchWithDegradation(key, networkOperation, config);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '请求失败';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
}
  }, []);

  const clearCache = useCallback(() => {
    degradationManager.clearCache();
  }, []);

  return {
    executeWithDegradation,
    clearCache,
    isLoading,
    error,
    cacheStats: degradationManager.getCacheStats()
  };
}

// 降级策略配置预设
export const DEGRADATION_PRESETS = {
  // 产品列表：缓存优先，网络质量好时后台刷新
  PRODUCTS: {
    strategy: DegradationStrategy.STALE_WHILE_REVALIDATE,
    cacheTimeout: 2 * 60 * 1000, // 2分钟缓存
    priority: 'medium' as const,
    staleWhileRevalidate: true,
    fallbackEnabled: true
  },

  // 用户信息：网络优先，失败时降级到缓存
  USER_INFO: {
    strategy: DegradationStrategy.NETWORK_FIRST,
    cacheTimeout: 5 * 60 * 1000, // 5分钟缓存
    priority: 'high' as const,
    fallbackEnabled: true
  },

  // 订单列表：过期缓存+后台刷新
  ORDERS: {
    strategy: DegradationStrategy.STALE_WHILE_REVALIDATE,
    cacheTimeout: 10 * 60 * 1000, // 10分钟缓存
    priority: 'high' as const,
    staleWhileRevalidate: true,
    fallbackEnabled: true
  },

  // 实时数据：网络优先，不使用缓存
  REALTIME: {
    strategy: DegradationStrategy.NETWORK_FIRST,
    cacheTimeout: 0, // 不缓存
    priority: 'high' as const,
    fallbackEnabled: false
  },

  // 静态资源：缓存优先
  STATIC: {
    strategy: DegradationStrategy.CACHE_FIRST,
    cacheTimeout: 60 * 60 * 1000, // 1小时缓存
    priority: 'low' as const,
    fallbackEnabled: true
}
};

// 自动选择降级策略
export function selectOptimalStrategy(
  dataType: keyof typeof DEGRADATION_PRESETS,
  networkQuality: NetworkQuality,
  isOffline: boolean
): DegradationConfig {
  const preset = DEGRADATION_PRESETS[dataType];
  
  if (isOffline) {
    return {
      ...preset,
      strategy: DegradationStrategy.CACHE_FIRST
    };
}

  if (networkQuality === NetworkQuality.POOR) {
    return {
      ...preset,
      strategy: DegradationStrategy.CACHE_FIRST
    };
  }

  if (networkQuality === NetworkQuality.EXCELLENT) {
    return {
      ...preset,
      strategy: DegradationStrategy.NETWORK_FIRST
    };
  }

  return preset;
}
}}}}