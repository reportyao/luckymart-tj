// request-queue.ts - 请求队列管理
import { NetworkQuality, NetworkRetryManager } from './network-retry';

// 队列项状态
export enum QueueItemStatus {
  PENDING = 'pending',
  RETRYING = 'retrying',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 队列项优先级
export enum QueuePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

// 队列项接口
export interface QueueItem<T = any> {
  id: string;
  operation: () => Promise<T>;
  priority: QueuePriority;
  status: QueueItemStatus;
  createdAt: number;
  scheduledAt?: number;
  startedAt?: number;
  completedAt?: number;
  attempts: number;
  maxAttempts: number;
  retryDelay: number;
  timeout?: number;
  dependencies?: string[]; // 依赖的队列项ID
  metadata?: Record<string, any>;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  abortController?: AbortController;
}

// 队列配置
export interface QueueConfig {
  maxConcurrent?: number;        // 最大并发数
  maxQueueSize?: number;         // 最大队列大小
  defaultRetryDelay?: number;    // 默认重试延迟
  maxRetryAttempts?: number;     // 最大重试次数
  timeout?: number;              // 默认超时时间
  enableBatchProcessing?: boolean; // 启用批处理
  batchSize?: number;            // 批处理大小
  batchInterval?: number;        // 批处理间隔
  pauseOnNetworkPoor?: boolean;  // 网络差时暂停
  maxRetriesPerItem?: number;    // 单项最大重试次数
  cleanupInterval?: number;      // 清理间隔
}

// 队列统计信息
export interface QueueStats {
  totalItems: number;
  pendingItems: number;
  processingItems: number;
  completedItems: number;
  failedItems: number;
  cancelledItems: number;
  averageWaitTime: number;
  averageProcessTime: number;
  throughput: number; // 每分钟处理的项数
  successRate: number;
  errorRate: number;
}

// 网络感知队列管理器
export class NetworkAwareRequestQueue {
  private static instance: NetworkAwareRequestQueue;
  private queue: QueueItem[] = [];
  private processing = new Map<string, QueueItem>();
  private stats: QueueStats;
  private config: Required<QueueConfig>;
  private networkRetryManager: NetworkRetryManager;
  
  private processingTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private batchTimer?: NodeJS.Timeout;
  private isPaused = false;
  private isDestroyed = false;

  private constructor(config: QueueConfig = {}) {
    this.networkRetryManager = NetworkRetryManager.getInstance();
    this.config = {
      maxConcurrent: 3,
      maxQueueSize: 1000,
      defaultRetryDelay: 1000,
      maxRetryAttempts: 3,
      timeout: 30000,
      enableBatchProcessing: false,
      batchSize: 5,
      batchInterval: 1000,
      pauseOnNetworkPoor: true,
      maxRetriesPerItem: 3,
      cleanupInterval: 60000, // 1分钟
      ...config
    };

    this.stats = this.initializeStats();
    this.startProcessing();
    this.startCleanup();
    this.setupNetworkMonitoring();
  }

  public static getInstance(config?: QueueConfig): NetworkAwareRequestQueue {
    if (!NetworkAwareRequestQueue.instance) {
      NetworkAwareRequestQueue.instance = new NetworkAwareRequestQueue(config);
    }
    return NetworkAwareRequestQueue.instance;
  }

  // 初始化统计信息
  private initializeStats(): QueueStats {
    return {
      totalItems: 0,
      pendingItems: 0,
      processingItems: 0,
      completedItems: 0,
      failedItems: 0,
      cancelledItems: 0,
      averageWaitTime: 0,
      averageProcessTime: 0,
      throughput: 0,
      successRate: 100,
      errorRate: 0
    };
  }

  // 设置网络监控
  private setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      if (this.config.pauseOnNetworkPoor) {
        this.resume();
      }
    });

    window.addEventListener('offline', () => {
      if (this.config.pauseOnNetworkPoor) {
        this.pause();
      }
    });
  }

  // 添加队列项
  public add<T>(
    operation: () => Promise<T>,
    options: {
      priority?: QueuePriority;
      timeout?: number;
      maxAttempts?: number;
      retryDelay?: number;
      metadata?: Record<string, any>;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
      onProgress?: (progress: number) => void;
    } = {}
  ): string {
    if (this.isDestroyed) {
      throw new Error('队列已被销毁');
    }

    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error('队列已满');
    }

    const id = this.generateId();
    const item: QueueItem = {
      id,
      operation,
      priority: options.priority || QueuePriority.NORMAL,
      status: QueueItemStatus.PENDING,
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: options.maxAttempts || this.config.maxRetryAttempts,
      retryDelay: options.retryDelay || this.config.defaultRetryDelay,
      timeout: options.timeout || this.config.timeout,
      metadata: options.metadata,
      onSuccess: options.onSuccess,
      onError: options.onError,
      onProgress: options.onProgress,
      abortController: new AbortController()
    };

    this.queue.push(item);
    this.stats.totalItems++;
    this.stats.pendingItems++;

    // 按优先级排序
    this.queue.sort((a, b) => b.priority - a.priority);

    return id;
  }

  // 批量添加
  public addBatch<T>(
    operations: Array<{
      operation: () => Promise<T>;
      options?: {
        priority?: QueuePriority;
        timeout?: number;
        maxAttempts?: number;
        retryDelay?: number;
        metadata?: Record<string, any>;
        onSuccess?: (result: T) => void;
        onError?: (error: Error) => void;
        onProgress?: (progress: number) => void;
      };
    }>
  ): string[] {
    return operations.map(({ operation, options }) => this.add(operation, options));
  }

  // 移除队列项
  public remove(id: string): boolean {
    const index = this.queue.findIndex(item => item.id === id);
    if (index === -1) return false;

    const item = this.queue[index];
    if (item.status === QueueItemStatus.PROCESSING || item.status === QueueItemStatus.RETRYING) {
      return false;
    }

    this.queue.splice(index, 1);
    this.stats.pendingItems--;
    return true;
  }

  // 取消队列项
  public cancel(id: string): boolean {
    const item = this.queue.find(i => i.id === id);
    if (!item) return false;

    item.status = QueueItemStatus.CANCELLED;
    item.abortController?.abort();
    
    if (this.processing.has(id)) {
      this.processing.delete(id);
      this.stats.processingItems--;
    }

    // 从队列中移除
    this.queue = this.queue.filter(i => i.id !== id);
    this.stats.cancelledItems++;
    return true;
  }

  // 暂停队列
  public pause() {
    this.isPaused = true;
    console.log('队列已暂停');
  }

  // 恢复队列
  public resume() {
    this.isPaused = false;
    console.log('队列已恢复');
  }

  // 清空队列
  public clear() {
    this.queue.forEach(item => {
      item.abortController?.abort();
    });
    this.queue = [];
    this.stats.pendingItems = 0;
  }

  // 开始处理队列
  private startProcessing() {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }

    this.processingTimer = setInterval(() => {
      if (!this.isPaused && !this.isDestroyed) {
        this.processNext();
      }
    }, 100);
  }

  // 处理下一个队列项
  private async processNext() {
    if (this.isPaused || this.processing.size >= this.config.maxConcurrent) {
      return;
    }

    const availableSlots = this.config.maxConcurrent - this.processing.size;
    const itemsToProcess = this.queue
      .filter(item => item.status === QueueItemStatus.PENDING)
      .slice(0, availableSlots);

    for (const item of itemsToProcess) {
      await this.processItem(item);
    }
  }

  // 处理单个队列项
  private async processItem(item: QueueItem) {
    if (item.status !== QueueItemStatus.PENDING) return;

    // 检查依赖
    if (item.dependencies && !this.checkDependencies(item.dependencies)) {
      return;
    }

    // 移动到处理中
    this.removeFromQueue(item.id);
    item.status = QueueItemStatus.PROCESSING;
    item.startedAt = Date.now();
    this.processing.set(item.id, item);
    this.stats.pendingItems--;
    this.stats.processingItems++;

    try {
      // 网络感知重试执行
      const result = await this.networkRetryManager.executeWithRetry(async () => {
        return await this.executeWithTimeout(item);
      }, {
        maxRetries: item.maxAttempts,
        baseDelay: item.retryDelay,
        timeout: item.timeout,
        onRetry: (attempt) => {
          item.status = QueueItemStatus.RETRYING;
          item.onProgress?.((attempt / item.maxAttempts) * 100);
        }
      });

      // 成功完成
      item.status = QueueItemStatus.COMPLETED;
      item.completedAt = Date.now();
      item.onSuccess?.(result);
      this.stats.completedItems++;
      this.stats.processingItems--;

    } catch (error) {
      // 处理失败
      item.attempts++;
      item.status = QueueItemStatus.FAILED;
      item.completedAt = Date.now();
      
      const errorMsg = error instanceof Error ? error : new Error(String(error));
      item.onError?.(errorMsg);
      this.stats.failedItems++;
      this.stats.processingItems--;

      // 如果可以重试，重新加入队列
      if (item.attempts < item.maxAttempts) {
        item.status = QueueItemStatus.PENDING;
        item.scheduledAt = Date.now() + item.retryDelay;
        this.queue.push(item);
        this.stats.pendingItems++;
      }
    } finally {
      this.processing.delete(item.id);
    }
  }

  // 带超时的执行
  private async executeWithTimeout<T>(item: QueueItem): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        item.abortController?.abort();
        reject(new Error(`队列项超时: ${item.timeout}ms`));
      }, item.timeout);

      item.operation()
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeoutId));
    });
  }

  // 检查依赖项
  private checkDependencies(dependencies: string[]): boolean {
    for (const depId of dependencies) {
      const depItem = [...this.queue, ...this.processing.values()].find(item => item.id === depId);
      if (!depItem || depItem.status !== QueueItemStatus.COMPLETED) {
        return false;
      }
    }
    return true;
  }

  // 从队列中移除项
  private removeFromQueue(id: string) {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  // 生成唯一ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 启动清理定时器
  private startCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  // 清理完成的项
  private cleanup() {
    const now = Date.now();
    
    // 清理超时的失败项
    this.queue = this.queue.filter(item => {
      if (item.status === QueueItemStatus.FAILED && item.attempts >= item.maxAttempts) {
        const age = now - (item.completedAt || item.createdAt);
        return age < 300000; // 保留5分钟
      }
      return true;
    });

    // 更新统计信息
    this.updateStats();
  }

  // 更新统计信息
  private updateStats() {
    const completed = this.stats.completedItems + this.stats.failedItems + this.stats.cancelledItems;
    if (completed > 0) {
      this.stats.successRate = (this.stats.completedItems / completed) * 100;
      this.stats.errorRate = (this.stats.failedItems / completed) * 100;
    }

    // 计算吞吐量（简化版本）
    const recentItems = [...this.queue, ...this.processing.values()]
      .filter(item => item.completedAt && Date.now() - item.completedAt < 60000);
    this.stats.throughput = recentItems.length;
  }

  // 获取队列状态
  public getStatus() {
    return {
      ...this.stats,
      isPaused: this.isPaused,
      isProcessing: this.processing.size > 0,
      queueSize: this.queue.length,
      processingCount: this.processing.size
    };
  }

  // 获取队列项
  public getItems(filter?: {
    status?: QueueItemStatus;
    priority?: QueuePriority;
    metadata?: Record<string, any>;
  }) {
    let items = [...this.queue, ...this.processing.values()];

    if (filter?.status) {
      items = items.filter(item => item.status === filter.status);
    }

    if (filter?.priority) {
      items = items.filter(item => item.priority === filter.priority);
    }

    if (filter?.metadata) {
      items = items.filter(item => {
        return Object.entries(filter.metadata!).every(([key, value]) => 
          item.metadata?.[key] === value
        );
      });
    }

    return items;
  }

  // 获取统计信息
  public getStats(): QueueStats {
    return { ...this.stats };
  }

  // 销毁队列
  public destroy() {
    this.isDestroyed = true;
    
    // 清理定时器
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    // 取消所有正在处理的项
    this.processing.forEach(item => {
      item.abortController?.abort();
    });

    // 清空队列
    this.clear();
    
    this.processing.clear();
  }
}

// React Hook for request queue
import { useState, useCallback, useRef, useEffect } from 'react';

export function useRequestQueue(config?: QueueConfig) {
  const [stats, setStats] = useState<QueueStats>(() => 
    NetworkAwareRequestQueue.getInstance(config).getStats()
  );
  const queueRef = useRef(NetworkAwareRequestQueue.getInstance(config));
  const [isPaused, setIsPaused] = useState(false);

  // 定期更新统计信息
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(queueRef.current.getStats());
      setIsPaused(queueRef.current.getStatus().isPaused);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const add = useCallback(<T>(
    operation: () => Promise<T>,
    options?: {
      priority?: QueuePriority;
      timeout?: number;
      maxAttempts?: number;
      retryDelay?: number;
      metadata?: Record<string, any>;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
      onProgress?: (progress: number) => void;
    }
  ): string => {
    return queueRef.current.add(operation, options);
  }, []);

  const addBatch = useCallback(<T>(
    operations: Array<{
      operation: () => Promise<T>;
      options?: {
        priority?: QueuePriority;
        timeout?: number;
        maxAttempts?: number;
        retryDelay?: number;
        metadata?: Record<string, any>;
        onSuccess?: (result: T) => void;
        onError?: (error: Error) => void;
        onProgress?: (progress: number) => void;
      };
    }>
  ): string[] => {
    return queueRef.current.addBatch(operations);
  }, []);

  const remove = useCallback((id: string): boolean => {
    return queueRef.current.remove(id);
  }, []);

  const cancel = useCallback((id: string): boolean => {
    return queueRef.current.cancel(id);
  }, []);

  const pause = useCallback(() => {
    queueRef.current.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    queueRef.current.resume();
    setIsPaused(false);
  }, []);

  const clear = useCallback(() => {
    queueRef.current.clear();
  }, []);

  const getStatus = useCallback(() => {
    return queueRef.current.getStatus();
  }, []);

  const getItems = useCallback((filter?: {
    status?: QueueItemStatus;
    priority?: QueuePriority;
    metadata?: Record<string, any>;
  }) => {
    return queueRef.current.getItems(filter);
  }, []);

  return {
    // 状态
    stats,
    isPaused,
    
    // 方法
    add,
    addBatch,
    remove,
    cancel,
    pause,
    resume,
    clear,
    getStatus,
    getItems
  };
}

// 便捷的预设配置
export const QUEUE_PRESETS = {
  // 高优先级快速处理
  HIGH_PRIORITY: {
    maxConcurrent: 5,
    defaultRetryDelay: 500,
    maxRetryAttempts: 2,
    timeout: 10000
  },

  // 正常优先级
  NORMAL: {
    maxConcurrent: 3,
    defaultRetryDelay: 1000,
    maxRetryAttempts: 3,
    timeout: 30000
  },

  // 低优先级后台处理
  LOW_PRIORITY: {
    maxConcurrent: 1,
    defaultRetryDelay: 5000,
    maxRetryAttempts: 5,
    timeout: 60000
  },

  // 批处理配置
  BATCH: {
    enableBatchProcessing: true,
    batchSize: 10,
    batchInterval: 2000,
    maxConcurrent: 2
  }
};

// 单例导出
export const requestQueue = NetworkAwareRequestQueue.getInstance();

export default NetworkAwareRequestQueue;