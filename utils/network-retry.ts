// network-retry.ts - 智能重试机制
import { ApiClient, handleApiError } from '@/lib/api-client';
import { useTranslation } from 'react-i18next';

// 重试策略配置
export interface RetryConfig {
  maxRetries?: number;        // 最大重试次数
  baseDelay?: number;         // 基础延迟时间(ms)
  maxDelay?: number;          // 最大延迟时间(ms)
  backoffFactor?: number;     // 退避因子
  jitter?: boolean;           // 是否启用随机抖动
  retryableStatusCodes?: number[]; // 可重试的HTTP状态码
  timeout?: number;           // 请求超时时间(ms)
  onRetry?: (attempt: number, error: Error) => void; // 重试回调
}

// 网络质量等级
export enum NetworkQuality {
  POOR = 'poor',
  FAIR = 'fair',
  GOOD = 'good',
  EXCELLENT = 'excellent'
}

// 重试策略类型
export enum RetryStrategy {
  FIXED = 'fixed',           // 固定间隔
  EXPONENTIAL = 'exponential', // 指数退避
  LINEAR = 'linear'          // 线性退避
}

// 默认重试配置
export const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  backoffFactor: 2,
  jitter: true,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  timeout: 30000,
  onRetry: undefined
};

// 智能重试管理器
export class NetworkRetryManager {
  private static instance: NetworkRetryManager;
  private retryConfigs: Map<string, RetryConfig> = new Map();
  private retryCounts: Map<string, number> = new Map();
  private networkQuality: NetworkQuality = NetworkQuality.EXCELLENT;
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    this.setupNetworkMonitoring();
  }

  public static getInstance(): NetworkRetryManager {
    if (!NetworkRetryManager.instance) {
      NetworkRetryManager.instance = new NetworkRetryManager();
    }
    return NetworkRetryManager.instance;
  }

  // 设置网络监控
  private setupNetworkMonitoring() {
    // 监控在线状态
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.resetRetryCounts();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // 监控网络质量（简单实现）
    this.monitorNetworkQuality();
  }

  // 监控网络质量
  private async monitorNetworkQuality() {
    const testUrls = [
      'https://www.google.com/favicon.ico',
      'https://www.cloudflare.com/favicon.ico'
    ];

    const checkConnection = async (url: string): Promise<number> => {
      const start = performance.now();
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        const duration = performance.now() - start;
        return duration;
      } catch {
        return Infinity;
      }
    };

    setInterval(async () => {
      try {
        const durations = await Promise.all(testUrls.map(checkConnection));
        const avgDuration = durations.filter(d => d !== Infinity).reduce((a, b) => a + b, 0) / durations.filter(d => d !== Infinity).length;

        if (avgDuration < 100) {
          this.networkQuality = NetworkQuality.EXCELLENT;
        } else if (avgDuration < 300) {
          this.networkQuality = NetworkQuality.GOOD;
        } else if (avgDuration < 800) {
          this.networkQuality = NetworkQuality.FAIR;
        } else {
          this.networkQuality = NetworkQuality.POOR;
        }
      } catch {
        this.networkQuality = NetworkQuality.POOR;
      }
    }, 30000); // 每30秒检查一次
  }

  // 根据网络质量调整重试策略
  private adjustConfigForNetworkQuality(config: RetryConfig): RetryConfig {
    const qualityMultiplier = {
      [NetworkQuality.EXCELLENT]: 1,
      [NetworkQuality.GOOD]: 1.2,
      [NetworkQuality.FAIR]: 1.5,
      [NetworkQuality.POOR]: 2
    };

    return {
      ...config,
      maxRetries: Math.max(1, Math.floor((config.maxRetries || 3) * qualityMultiplier[this.networkQuality])),
      baseDelay: Math.min((config.baseDelay || 1000) * qualityMultiplier[this.networkQuality], config.maxDelay || 8000)
    };
  }

  // 计算重试延迟时间
  private calculateDelay(attempt: number, config: RetryConfig, strategy: RetryStrategy = RetryStrategy.EXPONENTIAL): number {
    const adjustedConfig = this.adjustConfigForNetworkQuality(config);
    const baseDelay = adjustedConfig.baseDelay;
    const maxDelay = adjustedConfig.maxDelay;
    const backoffFactor = adjustedConfig.backoffFactor || 2;

    let delay: number;

    switch (strategy) {
      case RetryStrategy.FIXED:
        delay = baseDelay;
        break;
      case RetryStrategy.LINEAR:
        delay = baseDelay * attempt;
        break;
      case RetryStrategy.EXPONENTIAL:
      default:
        delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
        break;
    }

    // 添加随机抖动，避免同时重试
    if (adjustedConfig.jitter) {
      const jitter = Math.random() * 0.1 * delay; // 10%的随机抖动
      delay += jitter;
    }

    return Math.min(delay, maxDelay);
  }

  // 判断错误是否可重试
  private isRetryableError(error: any, config: RetryConfig): boolean {
    // 网络连接错误
    if (!this.isOnline) return true;

    // HTTP状态码错误
    if (error.status && config.retryableStatusCodes?.includes(error.status)) {
      return true;
    }

    // 特定错误类型
    const retryableErrors = [
      'NetworkError',
      'TypeError', // 网络错误通常表现为TypeError
      'ECONNABORTED',
      'ETIMEDOUT',
      'ENOTFOUND'
    ];

    return retryableErrors.some(errorType => 
      error.name?.includes(errorType) || error.message?.includes(errorType)
    );
  }

  // 智能重试执行
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {},
    key?: string
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    const operationKey = key || 'default';
    
    // 检查重试次数限制
    const currentRetries = this.retryCounts.get(operationKey) || 0;
    if (currentRetries >= finalConfig.maxRetries) {
      throw new Error('达到最大重试次数');
    }

    try {
      // 执行操作
      const result = await this.executeWithTimeout(operation, finalConfig.timeout);
      
      // 成功后重置重试计数
      if (currentRetries > 0) {
        this.retryCounts.delete(operationKey);
      }
      
      return result;
    } catch (error) {
      // 更新重试计数
      this.retryCounts.set(operationKey, currentRetries + 1);

      // 判断是否应该重试
      if (this.isRetryableError(error, finalConfig)) {
        const nextAttempt = currentRetries + 1;
        const delay = this.calculateDelay(nextAttempt, finalConfig);

        // 调用重试回调
        if (finalConfig.onRetry) {
          finalConfig.onRetry(nextAttempt, error as Error);
        }

        // 等待后重试
        await this.sleep(delay);
        return this.executeWithRetry(operation, finalConfig, operationKey);
      }

      // 不可重试的错误直接抛出
      throw error;
    }
  }

  // 带超时的执行
  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`操作超时: ${timeout}ms`));
      }, timeout);

      operation()
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeoutId));
    });
  }

  // 睡眠工具函数
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 重置重试计数
  public resetRetryCounts() {
    this.retryCounts.clear();
  }

  // 获取当前网络质量
  public getNetworkQuality(): NetworkQuality {
    return this.networkQuality;
  }

  // 检查在线状态
  public isNetworkOnline(): boolean {
    return this.isOnline;
  }

  // 配置重试策略
  public setRetryConfig(key: string, config: RetryConfig) {
    this.retryConfigs.set(key, config);
  }

  // 获取重试配置
  public getRetryConfig(key: string): RetryConfig | undefined {
    return this.retryConfigs.get(key);
  }
}

// 便捷的国际化错误处理
export const createLocalizedRetryHandler = (t: ReturnType<typeof useTranslation>['t']) => {
  const retryManager = NetworkRetryManager.getInstance();

  return {
    executeWithRetry: async <T>(
      operation: () => Promise<T>,
      options: {
        config?: RetryConfig;
        key?: string;
        strategy?: RetryStrategy;
        errorMessage?: string;
      } = {}
    ): Promise<T> => {
      const { config, key, strategy, errorMessage } = options;
      
      try {
        return await retryManager.executeWithRetry(operation, {
          ...config,
          onRetry: (attempt, error) => {
            console.warn(`重试第 ${attempt} 次:`, error.message);
            // 可以在这里添加用户提示
          }
        }, key);
      } catch (error) {
        // 本地化错误信息
        const localizedError = this.getLocalizedError(error as Error, t);
        throw new Error(localizedError);
      }
    },

    getLocalizedError: (error: Error, t: any): string => {
      if (!navigator.onLine) {
        return t('network.offline', '网络连接已断开，请检查网络设置');
      }

      if (error.message.includes('超时')) {
        return t('network.timeout', '请求超时，请稍后重试');
      }

      if (error.message.includes('达到最大重试次数')) {
        return t('network.maxRetries', '网络不稳定，请稍后再试');
      }

      return handleApiError(error);
    },

    getNetworkStatus: () => {
      return {
        isOnline: retryManager.isNetworkOnline(),
        quality: retryManager.getNetworkQuality(),
        retryCount: retryManager['retryCounts'].size
      };
    }
  };
};

// 批量重试操作
export class BatchRetryManager {
  private retryManager = NetworkRetryManager.getInstance();
  private maxConcurrency = 3; // 最大并发数

  // 批量重试执行
  async executeBatch<T>(
    operations: Array<{
      key: string;
      operation: () => Promise<T>;
      config?: RetryConfig;
    }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ results: T[]; errors: any[] }> {
    const results: T[] = [];
    const errors: any[] = [];
    let completed = 0;

    // 分批处理，控制并发
    for (let i = 0; i < operations.length; i += this.maxConcurrency) {
      const batch = operations.slice(i, i + this.maxConcurrency);
      
      const batchPromises = batch.map(async (item, index) => {
        try {
          const result = await this.retryManager.executeWithRetry(item.operation, item.config, item.key);
          results.push(result);
        } catch (error) {
          errors.push({ key: item.key, error });
          results.push(null as any);
        } finally {
          completed++;
          onProgress?.(completed, operations.length);
        }
      });

      await Promise.allSettled(batchPromises);
    }

    return { results, errors };
  }

  // 设置并发数
  setMaxConcurrency(concurrency: number) {
    this.maxConcurrency = Math.max(1, concurrency);
  }
}

// 单例导出
export const retryManager = NetworkRetryManager.getInstance();
export const batchRetryManager = new BatchRetryManager();

// React Hook for retry
import { useState, useCallback } from 'react';

export function useRetry() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    config?: RetryConfig
  ): Promise<T> => {
    setIsRetrying(true);
    setRetryCount(0);

    try {
      const result = await retryManager.executeWithRetry(operation, config);
      return result;
    } finally {
      setIsRetrying(false);
      setRetryCount(0);
    }
  }, []);

  return {
    executeWithRetry,
    isRetrying,
    retryCount,
    networkQuality: retryManager.getNetworkQuality(),
    isOnline: retryManager.isNetworkOnline()
  };
}