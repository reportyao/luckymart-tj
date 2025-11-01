import { NetworkQuality } from './network-retry';
import { useIndexedDB } from './indexeddb-manager';
import { useState, useEffect, useCallback } from 'react';
// api-optimizer.ts - API优化和增量更新机制

// 增量更新配置
export interface IncrementalUpdateConfig {
  enabled: boolean;
  syncInterval: number; // 同步间隔（毫秒）
  maxRetries: number; // 最大重试次数
  batchSize: number; // 批处理大小
  conflictResolution: 'client-wins' | 'server-wins' | 'merge';
  priority: 'low' | 'normal' | 'high';
}

// 增量更新项
export interface IncrementalUpdateItem {
  id: string;
  tableName: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  version: number;
  conflict?: boolean;
  resolved?: boolean;
}

// 变更记录
export interface ChangeRecord {
  id: string;
  tableName: string;
  recordId: string;
  operation: 'create' | 'update' | 'delete';
  oldData?: any;
  newData?: any;
  timestamp: number;
  userId: string;
  clientId: string;
  version: number;
}

// API优化结果
export interface APIOptimizationResult<T> {
  data: T;
  source: 'network' | 'cache' | 'incremental' | 'fallback';
  cacheHit: boolean;
  networkQuality: NetworkQuality;
  responseTime: number;
  dataVersion: number;
  lastUpdated: number;
}

// API优化器类
class APIOptimizer {
  private static instance: APIOptimizer;
  private config: Required<IncrementalUpdateConfig>;
  private changeQueue: ChangeRecord[] = [];
  private isSyncing = false;
  private syncTimer?: NodeJS.Timeout;

  private constructor() {
    this.config = {
      enabled: true,
      syncInterval: 30000, // 30秒
      maxRetries: 3,
      batchSize: 10,
      conflictResolution: 'merge',
      priority: 'normal'
    };

    this.startPeriodicSync();
}

  public static getInstance(): APIOptimizer {
    if (!APIOptimizer.instance) {
      APIOptimizer.instance = new APIOptimizer();
    }
    return APIOptimizer.instance;
  }

  // 配置增量更新
  configure(config: Partial<IncrementalUpdateConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enabled) {
      this.startPeriodicSync();
    } else {
      this.stopPeriodicSync();
    }
  }

  // 启动定期同步
  private startPeriodicSync(): void {
    this.stopPeriodicSync();
    
    this.syncTimer = setInterval(async () => {
      if (!this.isSyncing && this.changeQueue.length > 0) {
        await this.syncChanges();
      }
    }, this.config.syncInterval);
  }

  // 停止定期同步
  private stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  // 记录变更
  recordChange(change: Omit<ChangeRecord, 'id' | 'timestamp'>): string {
    const changeRecord: ChangeRecord = {
      ...change,
      id: this.generateId(),
      timestamp: Date.now()
    };

    this.changeQueue.push(changeRecord);
    
    // 如果是高优先级变更，立即同步
    if (this.config.priority === 'high') {
      this.syncChanges().catch(console.error);
    }

    return changeRecord.id;
  }

  // 同步变更到服务器
  async syncChanges(): Promise<void> {
    if (this.isSyncing || this.changeQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    const changesToSync = [...this.changeQueue];
    this.changeQueue = [];

    try {
      console.log(`[APIOptimizer] 开始同步 ${changesToSync.length} 个变更`);

      for (let i = 0; i < changesToSync.length; i += this.config.batchSize) {
        const batch = changesToSync.slice(i, i + this.config.batchSize);
        await this.syncBatch(batch);
        
        // 批处理间隔，避免服务器压力过大
        if (i + this.config.batchSize < changesToSync.length) {
          await this.sleep(1000);
        }
      }

      console.log('[APIOptimizer] 变更同步完成');
    } catch (error) {
      console.error('[APIOptimizer] 变更同步失败:', error);
      
      // 将失败的变更重新加入队列
      this.changeQueue.unshift(...changesToSync);
    } finally {
      this.isSyncing = false;
    }
  }

  // 同步批处理
  private async syncBatch(changes: ChangeRecord[]): Promise<void> {
    const retryConfig = {
      maxRetries: this.config.maxRetries,
      baseDelay: 1000,
      backoffFactor: 2
    };

    for (const change of changes) {
      let attempt = 0;
      let success = false;

      while (attempt < retryConfig.maxRetries && !success) {
        try {
          await this.syncSingleChange(change);
          success = true;
        } catch (error) {
          attempt++;
          if (attempt >= retryConfig.maxRetries) {
            throw error;
  }
          }
          
          const delay = retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt - 1);
          await this.sleep(delay);
        }
      }
    }
  }

  // 同步单个变更
  private async syncSingleChange(change: ChangeRecord): Promise<void> {
    const endpoint = this.getSyncEndpoint(change.tableName);
    const method = this.getSyncMethod(change.operation);

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': this.getClientId(),
        'X-Change-Id': change.id
      },
      body: JSON.stringify({
        operation: change.operation,
        recordId: change.recordId,
        data: change.newData,
        oldData: change.oldData,
        timestamp: change.timestamp,
        version: change.version
      })
    });

    if (!response.ok) {
      throw new Error(`同步失败: ${response.status} ${response.statusText}`);
    }
  }

  // 获取同步端点
  private getSyncEndpoint(tableName: string): string {
    return `/api/incremental-sync/${tableName}`;
  }

  // 获取同步方法
  private getSyncMethod(operation: string): string {
    switch (operation) {
      case 'create': return 'POST';
      case 'update': return 'PUT';
      case 'delete': return 'DELETE';
      default: return 'POST';
    }
  }

  // 智能获取数据
  async fetchWithIncrementalSync<T>(
    endpoint: string,
    options: {
      useCache?: boolean;
      cacheTimeout?: number;
      enableIncremental?: boolean;
      networkQuality?: NetworkQuality;
      fallbackData?: T;
    } = {}
  ): Promise<APIOptimizationResult<T>> {
    const startTime = performance.now();
    const {
      useCache = true,
      cacheTimeout = 5 * 60 * 1000, // 5分钟
      enableIncremental = true,
      networkQuality = NetworkQuality.GOOD,
      fallbackData
    } = options;

    try {
      // 1. 尝试从缓存获取数据
      if (useCache) {
        const cachedData = await this.getCachedData<T>(endpoint, cacheTimeout);
        if (cachedData) {
          // 如果有增量更新，尝试获取增量数据
          if (enableIncremental) {
            const incrementalData = await this.getIncrementalUpdates(endpoint, cachedData.version);
            if (incrementalData && incrementalData.length > 0) {
              const mergedData = this.mergeIncrementalData(cachedData.data, incrementalData);
              const responseTime = performance.now() - startTime;
              
              return {
                data: mergedData,
                source: 'incremental',
                cacheHit: true,
                networkQuality,
                responseTime,
                dataVersion: cachedData.version + incrementalData.length,
                lastUpdated: Date.now()
              };
            }
          }

          const responseTime = performance.now() - startTime;
          return {
  }
            data: cachedData.data,
            source: 'cache',
            cacheHit: true,
            networkQuality,
            responseTime,
            dataVersion: cachedData.version,
            lastUpdated: cachedData.timestamp
          };
        }
      }

      // 2. 网络请求
      if (navigator.onLine) {
        const response = await this.fetchWithRetry(endpoint);
        const responseTime = performance.now() - startTime;

        if (response.ok) {
          const data = await response.json();
          
          // 缓存数据
          if (useCache) {
            await this.cacheData(endpoint, data, cacheTimeout);
          }

          return {
            data,
            source: 'network',
            cacheHit: false,
            networkQuality,
            responseTime,
            dataVersion: data.version || 1,
            lastUpdated: Date.now()
          };
        }
      }

      // 3. 降级到离线数据
      if (fallbackData) {
        const responseTime = performance.now() - startTime;
        return {
          data: fallbackData,
          source: 'fallback',
          cacheHit: false,
          networkQuality,
          responseTime,
          dataVersion: 0,
          lastUpdated: Date.now()
        };
      }

      throw new Error('无法获取数据：网络不可用且无缓存数据');

    } catch (error) {
      console.error('[APIOptimizer] 获取数据失败:', error);
      
      // 降级到缓存或默认数据
      const cachedData = await this.getCachedData<T>(endpoint, Infinity);
      if (cachedData) {
        const responseTime = performance.now() - startTime;
        return {
          data: cachedData.data,
          source: 'cache',
          cacheHit: true,
          networkQuality: NetworkQuality.POOR,
          responseTime,
          dataVersion: cachedData.version,
          lastUpdated: cachedData.timestamp
        };
      }

      if (fallbackData) {
        const responseTime = performance.now() - startTime;
        return {
          data: fallbackData,
          source: 'fallback',
          cacheHit: false,
          networkQuality: NetworkQuality.POOR,
          responseTime,
          dataVersion: 0,
          lastUpdated: Date.now()
        };
      }

      throw error;
    }
  }

  // 带重试的网络请求
  private async fetchWithRetry(endpoint: string): Promise<Response> {
    const maxRetries = 3;
    const baseDelay = 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(endpoint, {
          cache: 'no-cache',
          signal: AbortSignal.timeout(10000) // 10秒超时
        });

        if (response.ok) {
          return response;
        }

        if (response.status >= 500 && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await this.sleep(delay);
          continue;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    throw new Error('所有重试均失败');
  }

  // 获取缓存数据
  private async getCachedData<T>(endpoint: string, timeout: number): Promise<any> {
    const { getItem } = useIndexedDB();
    const cacheKey = `api_cache_${this.hashEndpoint(endpoint)}`;
    const cached = await getItem<any>('cacheMetadata', cacheKey);
    
    if (!cached) return null; {

    // 检查是否过期
    if (Date.now() - cached.timestamp > timeout) {
      return null;
    }

    return cached;
  }

  // 缓存数据
  private async cacheData(endpoint: string, data: any, timeout: number): Promise<void> {
    const { setItem } = useIndexedDB();
    const cacheKey = `api_cache_${this.hashEndpoint(endpoint)}`;
    
    await setItem('cacheMetadata', {
      ...data,
      timestamp: Date.now(),
      expiresAt: Date.now() + timeout,
      endpoint
    }, {
      id: cacheKey
    });
  }

  // 获取增量更新
  private async getIncrementalUpdates(endpoint: string, lastVersion: number): Promise<IncrementalUpdateItem[]> {
    try {
      const response = await fetch(`${endpoint}?since=${lastVersion}`, {
        cache: 'no-cache'
      });

      if (response.ok) {
        return await response.json();
      }

      return [];
    } catch (error) {
      console.warn('获取增量更新失败:', error);
      return [];
    }
  }

  // 合并增量数据
  private mergeIncrementalData(baseData: any, incrementalUpdates: IncrementalUpdateItem[]): any {
    let mergedData = { ...baseData };

    for (const update of incrementalUpdates) {
      switch (update.operation) {
        case 'create':
        case 'update':
          mergedData[update.tableName] = mergedData[update.tableName] || [];
          const index = mergedData[update.tableName].findIndex((item: any) => item.id === update.data.id);
          if (index >= 0) {
            mergedData[update.tableName][index] = { ...mergedData[update.tableName][index], ...update.data };
          } else {
            mergedData[update.tableName].push(update.data);
          }
          break;

        case 'delete':
          if (mergedData[update.tableName]) {
            mergedData[update.tableName] = mergedData[update.tableName].filter(
              (item: any) => item.id !== update.data.id
            );
          }
          break;
      }
    }

    return mergedData;
  }

  // 生成唯一ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取客户端ID
  private getClientId(): string {
    let clientId = localStorage.getItem('client_id');
    if (!clientId) {
      clientId = this.generateId();
      localStorage.setItem('client_id', clientId);
    }
    return clientId;
  }

  // 端点哈希
  private hashEndpoint(endpoint: string): string {
    let hash = 0;
    for (let i = 0; i < endpoint.length; i++) {
      const char = endpoint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  // 延迟工具
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 清理资源
  destroy(): void {
    this.stopPeriodicSync();
    this.changeQueue = [];
  }
}

// React Hook for API Optimization

export function useAPIOptimizer(config?: Partial<IncrementalUpdateConfig>) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const optimizer = APIOptimizer.getInstance();

  useEffect(() => {
    if (config) {
      optimizer.configure(config);
}

    return () => {
      optimizer.destroy();
    };
  }, [config, optimizer]);

  const fetchOptimized = useCallback(async <T>(;
    endpoint: string,
    options?: Parameters<typeof optimizer.fetchWithIncrementalSync>[1]
  ): Promise<APIOptimizationResult<T>> => {
    setIsOptimizing(true);
    try {
      return await optimizer.fetchWithIncrementalSync(endpoint, options);
    } finally {
      setIsOptimizing(false);
    }
  }, [optimizer]);

  const recordChange = useCallback((change: Parameters<typeof optimizer.recordChange>[0]) => {
    return optimizer.recordChange(change);
  }, [optimizer]);

  const forceSync = useCallback(async () => {
    await optimizer.syncChanges();
  }, [optimizer]);

  return {
    fetchOptimized,
    recordChange,
    forceSync,
    isOptimizing
  };
}

// 单例导出
export const apiOptimizer = APIOptimizer.getInstance();

export default APIOptimizer;