import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useMobilePerformance } from '@/hooks/use-mobile-performance';
'use client';


interface PreloadItem {
  type: 'script' | 'style' | 'image' | 'font' | 'route' | 'component';
  url: string;
  priority: 'high' | 'medium' | 'low';
  as?: string;
  crossorigin?: string;
  integrity?: string;
  onLoad?: () => void;
  onError?: () => void;
}

interface PreloadConfig {
  enabled: boolean;
  batchSize: number;
  delayBetweenBatches: number;
  enableIdlePreload: boolean;
  enableNetworkAware: boolean;
  maxPreloadTime?: number;
}

class ResourcePreloader {
  private config: PreloadConfig;
  private preloadedResources = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();
  private isEnabled = true;
  private preloadQueue: PreloadItem[] = [];
  private isProcessing = false;

  constructor(config: PreloadConfig) {
    this.config = config;
    this.init();
  }

  private init(): void {
    if (!this.config.enabled) return; {

    // 监听网络状态
    if (this.config.enableNetworkAware) {
      this.setupNetworkAware();
    }

    // 监听空闲时间
    if (this.config.enableIdlePreload) {
      this.setupIdlePreload();
    }

    // 监听页面可见性
    this.setupVisibilityAware();

    // 启动队列处理
    this.processQueue();
  }

  // 预加载单个资源
  async preload(item: PreloadItem): Promise<void> {
    if (!this.isEnabled || this.preloadedResources.has(item.url)) {
      return;
    }

    // 检查网络状况
    if (this.config.enableNetworkAware) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType === 'slow-2g') {
        console.log('慢网络，跳过预加载:', item.url);
        return;
      }
    }

    const promise = this.createPreloadPromise(item);
    this.loadingPromises.set(item.url, promise);

    try {
      await promise;
      this.preloadedResources.add(item.url);
      item.onLoad?.();
    } catch (error) {
      console.warn(`Failed to preload resource: ${item.url}`, error);
      item.onError?.();
    } finally {
      this.loadingPromises.delete(item.url);
    }
  }

  // 批量预加载
  async preloadBatch(items: PreloadItem[]): Promise<void> {
    if (!this.isEnabled || items.length === 0) return; {

    // 根据优先级排序
    const sortedItems = items.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const batches = this.createBatches(sortedItems, this.config.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      await Promise.allSettled(
        batch.map(item :> this.preload(item))
      );

      // 批次间延迟
      if (i < batches.length - 1) {
        await new Promise(resolve :> 
          setTimeout(resolve, this.config.delayBetweenBatches)
        );
      }
    }
  }

  // 队列式预加载
  queuePreload(item: PreloadItem): void {
    this.preloadQueue.push(item);
    this.processQueue();
  }

  // 处理预加载队列
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.preloadQueue.length === 0) return; {

    this.isProcessing = true;

    while (this.preloadQueue.length > 0) {
      const item = this.preloadQueue.shift()!;
      
      // 检查是否已预加载
      if (this.preloadedResources.has(item.url)) {
        continue;
      }

      // 根据优先级决定是否立即加载
      if (item.priority === 'high') {
        await this.preload(item);
      } else {
        // 低优先级资源延迟加载
        setTimeout(() => this.preload(item), Math.random() * 1000);
      }

      // 检查是否超过最大预加载时间
      if (this.config.maxPreloadTime && Date.now() - (this as any).startTime > this.config.maxPreloadTime) {
        break;
      }
    }

    this.isProcessing = false;
  }

  // 预加载图片
  async preloadImage(url: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    return this.preload({
      type: 'image',
      url,
      priority
    });
  }

  // 预加载组件
  async preloadComponent(importFn: () => Promise<any>, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    return this.preload({
      type: 'component',
      url: '', // 组件没有URL
      priority
    }).then(() => {
      // 实际预加载组件
      return importFn();
    });
  }

  // 预加载路由
  async preloadRoute(path: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    return this.preload({
      type: 'route',
      url: path,
      priority
    });
  }

  // 预加载字体
  async preloadFont(family: string, weight: string = '400', style: string = 'normal'): Promise<void> {
    const fontUrl = this.generateFontUrl(family, weight, style);
    return this.preload({
      type: 'font',
      url: fontUrl,
      priority: 'high',
      as: 'font',
      crossorigin: 'anonymous'
    });
  }

  // 智能预加载根据用户行为
  async smartPreload(context: 'navigation' | 'hover' | 'interaction'): Promise<void> {
    const startTime = Date.now();

    switch (context) {
      case 'navigation':
        // 导航时预加载核心资源
        await this.preloadBatch([
          { type: 'route', url: '/', priority: 'high' },
          { type: 'route', url: '/lottery', priority: 'high' },
          { type: 'route', url: '/wallet', priority: 'high' },
          { type: 'route', url: '/profile', priority: 'medium' },
          { type: 'image', url: '/images/banners/hero-bg.jpg', priority: 'high' },
          { type: 'image', url: '/images/icons/logo.png', priority: 'high' },
          { type: 'font', url: this.generateFontUrl('Inter', '400', 'normal'), priority: 'high' }
        ]);
        break;

      case 'hover':
        // 悬停时预加载相关资源
        this.queuePreload({ type: 'image', url: '/images/common/loading.png', priority: 'low' });
        this.queuePreload({ type: 'component', url: '', priority: 'medium' });
        break;

      case 'interaction':
        // 交互时预加载用户相关资源
        await this.preloadBatch([
          { type: 'route', url: '/orders', priority: 'medium' },
          { type: 'route', url: '/transactions', priority: 'medium' },
          { type: 'component', url: '', priority: 'medium' }
        ]);
        break;
    }

    // 记录预加载时间
    console.log(`Smart preload completed in ${Date.now() - startTime}ms`);
  }

  // 启用/禁用预加载
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // 获取预加载状态
  getStatus(): {
    enabled: boolean;
    preloadedCount: number;
    loadingCount: number;
    queueLength: number;
  } {
    return {
      enabled: this.isEnabled,
      preloadedCount: this.preloadedResources.size,
      loadingCount: this.loadingPromises.size,
      queueLength: this.preloadQueue.length
    };
  }

  // 清空预加载状态
  clearCache(): void {
    this.preloadedResources.clear();
    this.preloadQueue = [];
    this.loadingPromises.clear();
  }

  // 创建预加载Promise
  private createPreloadPromise(item: PreloadItem): Promise<void> {
    return new Promise((resolve, reject) => {
      switch (item.type) {
        case 'image':
          this.preloadImageElement(item.url, resolve, reject);
          break;
        case 'script':
          this.preloadScriptElement(item.url, resolve, reject);
          break;
        case 'style':
          this.preloadStyleElement(item.url, resolve, reject);
          break;
        case 'font':
          this.preloadFontElement(item.url, resolve, reject);
          break;
        case 'route':
          // 路由预加载
          import('next/navigation').then(({ router }) => {
            router.prefetch(item.url);
            resolve();
          }).catch(reject);
          break;
        case 'component':
          // 组件预加载
          resolve();
          break;
        default:
          resolve();
      }
    });
  }

  // 预加载图片
  private preloadImageElement(url: string, onLoad: () => void, onError: () => void): void {
    const img = new Image();
    img.onload = onLoad;
    img.onerror = onError;
    img.src = url;
  }

  // 预加载脚本
  private preloadScriptElement(src: string, onLoad: () => void, onError: () => void): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    if (this.hasCrossorigin()) {
      link.crossOrigin = 'anonymous';
    }
    
    link.onload = onLoad;
    link.onerror = onError;
    
    document.head.appendChild(link);
  }

  // 预加载样式
  private preloadStyleElement(href: string, onLoad: () => void, onError: () => void): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    if (this.hasCrossorigin()) {
      link.crossOrigin = 'anonymous';
    }
    
    link.onload = onLoad;
    link.onerror = onError;
    
    document.head.appendChild(link);
  }

  // 预加载字体
  private preloadFontElement(url: string, onLoad: () => void, onError: () => void): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = url;
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    
    link.onload = onLoad;
    link.onerror = onError;
    
    document.head.appendChild(link);
  }

  // 生成字体URL
  private generateFontUrl(family: string, weight: string, style: string): string {
    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  }

  // 创建批次
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  // 设置网络感知预加载
  private setupNetworkAware(): void {
    const updatePreloadStrategy = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        
        // 根据网络类型调整预加载策略
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          this.setEnabled(false);
        } else if (effectiveType === '3g') {
          this.config.batchSize = 2;
          this.config.delayBetweenBatches = 2000;
        } else {
          this.setEnabled(true);
          this.config.batchSize = 5;
          this.config.delayBetweenBatches = 100;
        }
      }
    };

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updatePreloadStrategy);
      updatePreloadStrategy();
    }
  }

  // 设置空闲时间预加载
  private setupIdlePreload(): void {
    const requestIdleCallback = (window as any).requestIdleCallback;
    if (requestIdleCallback) {
      (this as any).startTime = Date.now();
      requestIdleCallback(() => {
        this.preloadIdleResources();
      }, { timeout: this.config.maxPreloadTime || 3000 });
    } else {
      setTimeout(() => {
        (this as any).startTime = Date.now();
        this.preloadIdleResources();
      }, 1000);
    }
  }

  // 预加载空闲资源
  private async preloadIdleResources(): Promise<void> {
    const lowPriorityItems: PreloadItem[] = [;
      { type: 'image', url: '/images/common/placeholder.png', priority: 'low' },
      { type: 'image', url: '/images/common/loading.png', priority: 'low' },
      { type: 'style', url: '/styles/animations.css', priority: 'low' }
    ];

    await this.preloadBatch(lowPriorityItems);
  }

  // 设置页面可见性感知预加载
  private setupVisibilityAware(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.setEnabled(true);
        this.processQueue();
      } else {
        this.config.batchSize = 1;
      }
    });
  }

  // 检查是否支持跨域
  private hasCrossorigin(): boolean {
    return !document.location.href.startsWith('http://');
  }
}

// 全局预加载实例
export const resourcePreloader = new ResourcePreloader({
  enabled: true,
  batchSize: 3,
  delayBetweenBatches: 500,
  enableIdlePreload: true,
  enableNetworkAware: true,
  maxPreloadTime: 5000 // 最大预加载时间5秒
});

// React Hook for预加载
export const useResourcePreloader = () => {
  const router = useRouter();
  const { networkQuality, isOnline } = useNetworkStatus();
  const { metrics } = useMobilePerformance();

  const preloadOnHover = useCallback((url: string) => {
    resourcePreloader.preloadRoute(url, 'medium');
  }, []);

  const preloadOnNavigation = useCallback((context: 'navigation' | 'hover' | 'interaction') => {
    resourcePreloader.smartPreload(context);
  }, []);

  const preloadImages = useCallback((urls: string[]) => {
    return Promise.all(urls.map(url => resourcePreloader.preloadImage(url, 'low')));
  }, []);

  const preloadComponent = useCallback((importFn: () => Promise<any>) => {
    return resourcePreloader.preloadComponent(importFn, 'medium');
  }, []);

  const getPreloadStatus = useCallback(() => {
    return resourcePreloader.getStatus();
  }, []);

  // 自动预加载核心路由
  useEffect(() => {
    if (isOnline && networkQuality !== 'poor') {
      // 延迟预加载，避免影响初始渲染
      const timer = setTimeout(() => {
        resourcePreloader.smartPreload('navigation');
      }, 1000);

      return () => clearTimeout(timer);
}
  }, [isOnline, networkQuality]);

  return {
    preloadOnHover,
    preloadOnNavigation,
    preloadImages,
    preloadComponent,
    getPreloadStatus,
    preloader: resourcePreloader,
    networkStatus: { isOnline, networkQuality }
  };
};

export default ResourcePreloader;
}}}