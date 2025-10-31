// 翻译缓存管理工具
// Translation Cache Management Utility

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/src/i18n/config';

// 缓存状态接口
export interface CacheStatus {
  version: string;
  totalFiles: number;
  size: number;
  supportedLanguages: string[];
  lastCleanup: number;
  cacheKeys: string[];
  error?: string;
}

// 预加载结果接口
export interface PreloadResult {
  success: string[];
  failed: string[];
  total: number;
  error?: string;
}

// 清除缓存结果接口
export interface ClearCacheResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Service Worker消息类型
type SWMessageType = 'SKIP_WAITING' | 'GET_CACHE_STATUS' | 'CLEAR_CACHE' | 'PRELOAD_TRANSLATIONS';

// Service Worker消息接口
interface SWMessage {
  type: SWMessageType;
  data?: any;
}

// Service Worker响应接口
interface SWResponse {
  success?: boolean;
  error?: string;
  message?: string;
  [key: string]: any;
}

class TranslationCacheManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private messageChannel: MessageChannel | null = null;
  private isSupported: boolean = false;
  private currentLanguage: SupportedLanguage = 'tg-TJ';

  constructor() {
    this.isSupported = this.checkServiceWorkerSupport();
    this.currentLanguage = this.getCurrentLanguage();
  }

  // 检查Service Worker支持
  private checkServiceWorkerSupport(): boolean {
    return typeof window !== 'undefined' && 
           'serviceWorker' in navigator && 
           'caches' in window;
  }

  // 获取当前语言
  private getCurrentLanguage(): SupportedLanguage {
    if (typeof window === 'undefined') return 'tg-TJ';
    
    // 从localStorage获取保存的语言
    const savedLang = localStorage.getItem('i18nextLng');
    if (savedLang && savedLang in SUPPORTED_LANGUAGES) {
      return savedLang as SupportedLanguage;
    }
    
    // 从navigator获取浏览器语言
    const navLang = navigator.language;
    if (navLang.startsWith('zh')) return 'zh-CN';
    if (navLang.startsWith('en')) return 'en-US';
    if (navLang.startsWith('ru')) return 'ru-RU';
    
    // 默认返回塔吉克语
    return 'tg-TJ';
  }

  // 初始化Service Worker
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('[TranslationCache] Service Worker不支持');
      return false;
    }

    try {
      // 注册Service Worker
      this.swRegistration = await navigator.serviceWorker.register('/sw-translations.js', {
        scope: '/'
      });

      // 等待Service Worker激活
      await this.waitForActivation();

      console.log('[TranslationCache] Service Worker注册成功');
      return true;
    } catch (error) {
      console.error('[TranslationCache] Service Worker注册失败:', error);
      return false;
    }
  }

  // 等待Service Worker激活
  private async waitForActivation(): Promise<void> {
    if (!this.swRegistration) return;

    // 如果Service Worker已经激活，直接返回
    if (this.swRegistration.active) return;

    // 等待激活
    return new Promise((resolve) => {
      const checkState = () => {
        if (this.swRegistration?.active) {
          resolve();
        } else {
          setTimeout(checkState, 100);
        }
      };
      checkState();
    });
  }

  // 发送消息到Service Worker
  private async sendMessage(message: SWMessage): Promise<SWResponse> {
    if (!this.swRegistration?.active) {
      throw new Error('Service Worker未激活');
    }

    return new Promise((resolve, reject) => {
      // 创建消息通道
      this.messageChannel = new MessageChannel();
      
      const timeout = setTimeout(() => {
        reject(new Error('Service Worker消息超时'));
      }, 5000);

      this.messageChannel.port1.onmessage = (event) => {
        clearTimeout(timeout);
        resolve(event.data);
      };

      this.swRegistration.active.postMessage(message, [this.messageChannel.port2]);
    });
  }

  // 获取缓存状态
  async getCacheStatus(): Promise<CacheStatus | null> {
    if (!this.isSupported || !this.swRegistration?.active) {
      return null;
    }

    try {
      const response = await this.sendMessage({ type: 'GET_CACHE_STATUS' });
      return response as CacheStatus;
    } catch (error) {
      console.error('[TranslationCache] 获取缓存状态失败:', error);
      return null;
    }
  }

  // 清除所有缓存
  async clearCache(): Promise<ClearCacheResult> {
    if (!this.isSupported || !this.swRegistration?.active) {
      return {
        success: false,
        error: 'Service Worker不支持或未激活'
      };
    }

    try {
      const response = await this.sendMessage({ type: 'CLEAR_CACHE' });
      return response as ClearCacheResult;
    } catch (error) {
      console.error('[TranslationCache] 清除缓存失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '清除缓存时发生未知错误'
      };
    }
  }

  // 预加载翻译文件
  async preloadTranslations(languages?: SupportedLanguage[]): Promise<PreloadResult> {
    if (!this.isSupported || !this.swRegistration?.active) {
      return {
        success: [],
        failed: [],
        total: 0,
        error: 'Service Worker不支持或未激活'
      };
    }

    try {
      const langs = languages || Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[];
      const response = await this.sendMessage({ 
        type: 'PRELOAD_TRANSLATIONS', 
        data: { languages: langs }
      });
      return response as PreloadResult;
    } catch (error) {
      console.error('[TranslationCache] 预加载翻译文件失败:', error);
      return {
        success: [],
        failed: [],
        total: 0,
        error: error instanceof Error ? error.message : '预加载时发生未知错误'
      };
    }
  }

  // 检查翻译文件是否已缓存
  async isTranslationCached(language: SupportedLanguage, namespace: string = 'common'): Promise<boolean> {
    if (!this.isSupported) return false;

    const status = await this.getCacheStatus();
    if (!status) return false;

    const cacheKey = `translations:${language}:${namespace}:1.0.0`;
    return status.cacheKeys.some(key => key.includes(cacheKey));
  }

  // 获取缓存大小（人类可读格式）
  formatCacheSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 获取缓存统计信息
  async getCacheStats(): Promise<{
    totalFiles: number;
    size: string;
    languages: Record<SupportedLanguage, number>;
    lastCleanup: string;
    isSupported: boolean;
  } | null> {
    const status = await this.getCacheStatus();
    if (!status) return null;

    // 按语言统计文件数量
    const languages = {} as Record<SupportedLanguage, number>;
    Object.keys(SUPPORTED_LANGUAGES).forEach(lang => {
      languages[lang as SupportedLanguage] = status.cacheKeys.filter(key => 
        key.includes(`translations:${lang}:`)
      ).length;
    });

    return {
      totalFiles: status.totalFiles,
      size: this.formatCacheSize(status.size),
      languages,
      lastCleanup: new Date(status.lastCleanup).toLocaleString(),
      isSupported: this.isSupported
    };
  }

  // 智能预加载策略
  async smartPreload(): Promise<PreloadResult> {
    const stats = await this.getCacheStats();
    
    // 如果缓存为空，预加载所有文件
    if (!stats || stats.totalFiles === 0) {
      return this.preloadTranslations();
    }

    // 如果缓存大小超过80%，不进行预加载
    const cacheSizeInBytes = this.parseCacheSize(stats.size);
    if (cacheSizeInBytes > 40 * 1024 * 1024) { // 40MB
      console.log('[TranslationCache] 缓存大小超过40MB，跳过预加载');
      return {
        success: [],
        failed: [],
        total: 0,
        error: '缓存大小超过限制'
      };
    }

    // 只预加载当前语言的文件
    return this.preloadTranslations([this.currentLanguage]);
  }

  // 解析缓存大小字符串
  private parseCacheSize(sizeStr: string): number {
    const match = sizeStr.match(/^([\d.]+)\s*(\w+)$/);
    if (!match) return 0;

    const [, value, unit] = match;
    const num = parseFloat(value);
    
    switch (unit.toUpperCase()) {
      case 'KB': return num * 1024;
      case 'MB': return num * 1024 * 1024;
      case 'GB': return num * 1024 * 1024 * 1024;
      default: return num;
    }
  }

  // 监听Service Worker更新
  onServiceWorkerUpdate(callback: (registration: ServiceWorkerRegistration) => void): () => void {
    if (!this.swRegistration) return () => {};

    const onUpdate = () => {
      callback(this.swRegistration!);
    };

    this.swRegistration.addEventListener('updatefound', onUpdate);
    
    return () => {
      this.swRegistration?.removeEventListener('updatefound', onUpdate);
    };
  }

  // 更新当前语言
  updateCurrentLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
  }

  // 检查离线状态
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  // 获取支持的翻译文件URL列表
  getTranslationUrls(language: SupportedLanguage, namespace?: string): string[] {
    const namespaces = namespace ? [namespace] : ['common', 'auth', 'lottery', 'wallet', 'referral', 'task', 'error', 'admin'];
    
    return namespaces.map(ns => `/locales/${language}/${ns}.json`);
  }

  // 预检翻译文件可访问性
  async validateTranslationFiles(language: SupportedLanguage, namespace?: string): Promise<{
    accessible: string[];
    inaccessible: string[];
  }> {
    const urls = this.getTranslationUrls(language, namespace);
    const accessible: string[] = [];
    const inaccessible: string[] = [];

    await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) {
            accessible.push(url);
          } else {
            inaccessible.push(url);
          }
        } catch {
          inaccessible.push(url);
        }
      })
    );

    return { accessible, inaccessible };
  }

  // 获取缓存健康状态
  async getCacheHealth(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    message: string;
    details?: any;
  }> {
    if (!this.isSupported) {
      return {
        status: 'error',
        message: 'Service Worker不支持'
      };
    }

    const stats = await this.getCacheStats();
    if (!stats) {
      return {
        status: 'error',
        message: '无法获取缓存状态'
      };
    }

    // 检查缓存大小
    const sizeBytes = this.parseCacheSize(stats.size);
    if (sizeBytes > 45 * 1024 * 1024) { // 45MB
      return {
        status: 'warning',
        message: '缓存大小接近限制',
        details: { size: stats.size }
      };
    }

    // 检查文件数量
    if (stats.totalFiles < 16) { // 期望的最小文件数
      return {
        status: 'warning',
        message: '缓存文件数量不足，可能影响离线功能',
        details: { totalFiles: stats.totalFiles }
      };
    }

    return {
      status: 'healthy',
      message: '缓存状态正常',
      details: stats
    };
  }
}

// 创建单例实例
export const translationCache = new TranslationCacheManager();

// 导出类型
export type {
  CacheStatus,
  PreloadResult,
  ClearCacheResult,
  SWMessage,
  SWResponse
};

// 导出便捷方法
export const cacheManager = {
  // 初始化缓存
  async init() {
    return translationCache.initialize();
  },

  // 获取状态
  async status() {
    return translationCache.getCacheStatus();
  },

  // 清除缓存
  async clear() {
    return translationCache.clearCache();
  },

  // 预加载
  async preload(languages?: SupportedLanguage[]) {
    return translationCache.preloadTranslations(languages);
  },

  // 智能预加载
  async smartPreload() {
    return translationCache.smartPreload();
  },

  // 检查是否缓存
  async isCached(language: SupportedLanguage, namespace: string = 'common') {
    return translationCache.isTranslationCached(language, namespace);
  },

  // 获取统计
  async stats() {
    return translationCache.getCacheStats();
  },

  // 获取健康状态
  async health() {
    return translationCache.getCacheHealth();
  }
};