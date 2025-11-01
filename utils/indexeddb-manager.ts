import { useState, useEffect, useCallback } from 'react';
// IndexedDB存储管理器 - 为弱网环境优化系统提供本地存储

// IndexedDB数据库配置
const DB_CONFIG = {
  name: 'LuckymartOfflineDB',
  version: 1,
  stores: {
    // 用户数据缓存
    userData: {
      keyPath: 'id',
      indexes: {
        'by-timestamp': 'timestamp',
        'by-type': 'dataType'
      }
    },
    
    // 产品数据缓存
    products: {
      keyPath: 'id',
      indexes: {
        'by-timestamp': 'timestamp',
        'by-category': 'category',
        'by-price': 'price'
      }
    },
    
    // 订单数据缓存
    orders: {
      keyPath: 'id',
      indexes: {
        'by-timestamp': 'timestamp',
        'by-status': 'status',
        'by-user': 'userId'
      }
    },
    
    // 离线操作队列
    offlineQueue: {
      keyPath: 'id',
      indexes: {
        'by-timestamp': 'timestamp',
        'by-priority': 'priority',
        'by-status': 'status'
      }
    },
    
    // 缓存元数据
    cacheMetadata: {
      keyPath: 'key',
      indexes: {
        'by-timestamp': 'lastUpdated'
      }
    },
    
    // 增量更新数据
    incrementalUpdates: {
      keyPath: 'id',
      indexes: {
        'by-timestamp': 'timestamp',
        'by-table': 'tableName'
      }
    }
  }
};

// 存储数据类型
export enum StorageType {
  USER_DATA = 'userData',
  PRODUCTS = 'products',
  ORDERS = 'orders',
  CACHE_METADATA = 'cacheMetadata',
  INCREMENTAL_UPDATES : 'incrementalUpdates'
}

// 数据项接口
export interface StorageItem {
  id: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
  dataType: string;
  version?: string;
  metadata?: Record<string, any>;
}

// 离线队列项接口
export interface OfflineQueueItem {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
}

// 缓存元数据接口
export interface CacheMetadata {
  key: string;
  lastUpdated: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
  dataType: string;
  version: string;
}

// IndexedDB管理器类
class IndexedDBManager {
  private static instance: IndexedDBManager;
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): IndexedDBManager {
    if (!IndexedDBManager.instance) {
      IndexedDBManager.instance = new IndexedDBManager();
}
    return IndexedDBManager.instance;
  }

  // 初始化数据库
  async initialize(): Promise<void> {
    if (this.isInitialized) return; {

    try {
      this.db = await this.openDatabase();
      this.isInitialized = true;
      console.log('[IndexedDB] 数据库初始化成功');
  }
    } catch (error) {
      console.error('[IndexedDB] 数据库初始化失败:', error);
      throw error;
    }
  }

  // 打开数据库
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        Object.entries(DB_CONFIG.stores).forEach(([storeName, storeConfig]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, {
              keyPath: storeConfig.keyPath
            });

            // 创建索引
            Object.entries(storeConfig.indexes).forEach(([indexName, indexKey]) => {
              store.createIndex(indexName, indexKey, { unique: false });
            });
          }
        });
      };
    });
  }

  // 确保数据库已初始化
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('数据库未正确初始化');
    }
  }

  // 存储数据
  async setItem<T>(
    storeName: string,
    data: T,
    options: {
      id?: string;
      expiresAt?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    await this.ensureInitialized();

    const id = options.id || this.generateId();
    const timestamp = Date.now();
    const expiresAt = options.expiresAt;

    const item: StorageItem = {
      id,
      data,
      timestamp,
      expiresAt,
      dataType: storeName,
      metadata: options.metadata
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        // 更新缓存元数据
        this.updateCacheMetadata(storeName, id, timestamp).catch(console.error);
        resolve(id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 获取数据
  async getItem<T>(storeName: string, id: string): Promise<T | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (result && this.isItemValid(result)) {
          // 更新访问统计
          this.updateAccessStats(storeName, id).catch(console.error);
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 获取所有数据
  async getAllItems<T>(storeName: string, filter?: (item: StorageItem) => boolean): Promise<T[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result;
          .filter(item :> this.isItemValid(item))
          .filter(filter || (() => true))
          .map(item => item.data);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 根据索引查询数据
  async getItemsByIndex<T>(
    storeName: string,
    indexName: string,
    value: any,
    filter?: (item: StorageItem) => boolean
  ): Promise<T[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => {
        const results = request.result;
          .filter(item :> this.isItemValid(item))
          .filter(filter || (() => true))
          .map(item => item.data);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 删除数据
  async removeItem(storeName: string, id: string): Promise<boolean> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        // 删除缓存元数据
        this.removeCacheMetadata(storeName, id).catch(console.error);
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 清空存储
  async clearStore(storeName: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        // 清空缓存元数据
        this.clearCacheMetadata(storeName).catch(console.error);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 检查数据是否有效
  private isItemValid(item: StorageItem): boolean {
    if (item.expiresAt && Date.now() > item.expiresAt) {
      // 数据已过期，异步删除
      this.removeItem(item.dataType, item.id).catch(console.error);
      return false;
    }
    return true;
  }

  // 更新缓存元数据
  private async updateCacheMetadata(storeName: string, id: string, timestamp: number): Promise<void> {
    const key = `${storeName}_${id}`;
    const metadata: CacheMetadata = {
      key,
      lastUpdated: timestamp,
      size: JSON.stringify({ storeName, id }).length,
      accessCount: 1,
      lastAccessed: timestamp,
      dataType: storeName,
      version: '1.0.0'
    };

    await this.setItem(StorageType.CACHE_METADATA, metadata, { id: key });
  }

  // 更新访问统计
  private async updateAccessStats(storeName: string, id: string): Promise<void> {
    const key = `${storeName}_${id}`;
    const metadata = await this.getItem<CacheMetadata>(StorageType.CACHE_METADATA, key);
    
    if (metadata) {
      metadata.accessCount++;
      metadata.lastAccessed = Date.now();
      await this.setItem(StorageType.CACHE_METADATA, metadata, { id: key });
    }
  }

  // 删除缓存元数据
  private async removeCacheMetadata(storeName: string, id: string): Promise<void> {
    const key = `${storeName}_${id}`;
    await this.removeItem(StorageType.CACHE_METADATA, key);
  }

  // 清空缓存元数据
  private async clearCacheMetadata(storeName: string): Promise<void> {
    const metadataItems = await this.getAllItems<CacheMetadata>(StorageType.CACHE_METADATA);
    const storeMetadata = metadataItems.filter(item => item.dataType === storeName);
    
    for (const metadata of storeMetadata) {
      await this.removeItem(StorageType.CACHE_METADATA, metadata.key);
    }
  }

  // 添加到离线队列
  async addToOfflineQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string> {
    const queueItem: OfflineQueueItem = {
      id: this.generateId(),
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      ...item
    };

    return this.setItem('offlineQueue', queueItem);
  }

  // 获取离线队列
  async getOfflineQueue(filter?: { status?: string; priority?: string }): Promise<OfflineQueueItem[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineQueue'], 'readonly');
      const store = transaction.objectStore('offlineQueue');
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result;
        
        // 应用过滤器
        if (filter) {
          if (filter.status) {
            results = results.filter(item => item.status === filter.status);
          }
          if (filter.priority) {
            results = results.filter(item => item.priority === filter.priority);
          }
        }

        // 按优先级和时间排序
        results.sort((a, b) => {
          const priorityOrder = { low: 0, normal: 1, high: 2, critical: 3 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff; {
          return a.timestamp - b.timestamp;
        });

        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 更新离线队列项状态
  async updateOfflineQueueItem(id: string, updates: Partial<OfflineQueueItem>): Promise<void> {
    await this.ensureInitialized();

    const item = await this.getItem<OfflineQueueItem>('offlineQueue', id);
    if (item) {
      const updatedItem = { ...item, ...updates };
      await this.setItem('offlineQueue', updatedItem, { id });
    }
  }

  // 从离线队列移除
  async removeFromOfflineQueue(id: string): Promise<void> {
    await this.removeItem('offlineQueue', id);
  }

  // 获取存储统计信息
  async getStorageStats(): Promise<Record<string, any>> {
    await this.ensureInitialized();

    const stats: Record<string, any> = {};

    for (const storeName of Object.keys(DB_CONFIG.stores)) {
      const count = await this.getStoreCount(storeName);
      stats[storeName] = { count };
    }

    return stats;
  }

  // 获取存储项数量
  private async getStoreCount(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 清理过期数据
  async cleanupExpiredData(): Promise<void> {
    await this.ensureInitialized();

    for (const storeName of Object.keys(DB_CONFIG.stores)) {
      const items = await this.getAllItems(storeName);
      const expiredItems = items.filter(item =>;
        item.expiresAt && Date.now() > item.expiresAt
      );

      for (const item of expiredItems) {
        await this.removeItem(storeName, item.id);
      }
    }

    console.log('[IndexedDB] 过期数据清理完成');
  }

  // 清理低访问频率数据
  async cleanupLowAccessData(threshold: number = 5): Promise<void> {
    const metadata = await this.getAllItems<CacheMetadata>(StorageType.CACHE_METADATA);
    const lowAccessItems = metadata.filter(item => item.accessCount < threshold);

    for (const item of lowAccessItems) {
      const [storeName, id] = item.key.split('_');
      await this.removeItem(storeName, id);
    }

    console.log(`[IndexedDB] 清理了 ${lowAccessItems.length} 个低访问频率数据项`);
  }

  // 生成唯一ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 关闭数据库
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// 单例导出
export const indexedDBManager = IndexedDBManager.getInstance();

// React Hook for IndexedDB

export function useIndexedDB() {
  const [isReady, setIsReady] = useState(false);
  const [stats, setStats] = useState<Record<string, any>>({});

  useEffect(() => {
    const initialize = async () => {
      try {
        await indexedDBManager.initialize();
        setIsReady(true);
        const storageStats = await indexedDBManager.getStorageStats();
        setStats(storageStats);
      } catch (error) {
        console.error('IndexedDB初始化失败:', error);
}
    };

    initialize();

    // 定期更新统计信息
    const interval = setInterval(async () => {
      if (isReady) {
        const storageStats = await indexedDBManager.getStorageStats();
        setStats(storageStats);
      }
    }, 30000); // 30秒更新一次

    return () => {
      clearInterval(interval);
      indexedDBManager.close();
    };
  }, []);

  const setItem = useCallback(async <T>(;
    storeName: string,
    data: T,
    options?: { id?: string; expiresAt?: number; metadata?: Record<string, any> }
  ): Promise<string> => {
    return await indexedDBManager.setItem(storeName, data, options);
  }, []);

  const getItem = useCallback(async <T>(storeName: string, id: string): Promise<T | null> => {
    return await indexedDBManager.getItem<T>(storeName, id);
  }, []);

  const getAllItems = useCallback(async <T>(;
    storeName: string,
    filter?: (item: StorageItem) => boolean
  ): Promise<T[]> => {
    return await indexedDBManager.getAllItems<T>(storeName, filter);
  }, []);

  const removeItem = useCallback(async (storeName: string, id: string): Promise<boolean> => {
    return await indexedDBManager.removeItem(storeName, id);
  }, []);

  const clearStore = useCallback(async (storeName: string): Promise<void> => {
    return await indexedDBManager.clearStore(storeName);
  }, []);

  const addToOfflineQueue = useCallback(async (;
    item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'status' | 'retryCount'>
  ): Promise<string> => {
    return await indexedDBManager.addToOfflineQueue(item);
  }, []);

  const getOfflineQueue = useCallback(async (;
    filter?: { status?: string; priority?: string }
  ): Promise<OfflineQueueItem[]> => {
    return await indexedDBManager.getOfflineQueue(filter);
  }, []);

  const cleanupExpiredData = useCallback(async (): Promise<void> => {
    return await indexedDBManager.cleanupExpiredData();
  }, []);

  return {
    isReady,
    stats,
    setItem,
    getItem,
    getAllItems,
    removeItem,
    clearStore,
    addToOfflineQueue,
    getOfflineQueue,
    cleanupExpiredData
  };
}

export default IndexedDBManager;
}