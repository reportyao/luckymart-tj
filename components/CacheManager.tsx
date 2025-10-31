// CacheManager.tsx - 缓存管理组件
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useIndexedDB } from '@/utils/indexeddb-manager';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { NetworkQuality } from '@/utils/network-retry';

interface CacheManagerProps {
  className?: string;
  showDetails?: boolean;
  autoCleanup?: boolean;
  cleanupInterval?: number; // 清理间隔（毫秒）
  maxCacheSize?: number; // 最大缓存大小
  onCacheUpdate?: (stats: CacheStats) => void;
}

// 缓存统计信息
export interface CacheStats {
  totalItems: number;
  totalSize: number; // 字节
  stores: Record<string, {
    count: number;
    size: number;
    lastUpdated?: number;
  }>;
  expiredItems: number;
  lowAccessItems: number;
  offlineQueueSize: number;
  networkQuality: NetworkQuality;
  isOnline: boolean;
}

// 缓存清理选项
interface CleanupOptions {
  expiredOnly?: boolean;
  lowAccessOnly?: boolean;
  specificStore?: string;
  force?: boolean;
}

const CacheManager: React.FC<CacheManagerProps> = ({
  className = '',
  showDetails = false,
  autoCleanup = true,
  cleanupInterval = 5 * 60 * 1000, // 5分钟
  maxCacheSize = 50 * 1024 * 1024, // 50MB
  onCacheUpdate
}) => {
  const { t } = useTranslation();
  const { 
    isReady, 
    stats, 
    cleanupExpiredData,
    clearStore,
    getOfflineQueue 
  } = useIndexedDB();
  const { networkQuality, isOnline } = useNetworkStatus();
  
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupTimer, setCleanupTimer] = useState<NodeJS.Timeout>();
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null);

  // 计算缓存统计信息
  const calculateCacheStats = useCallback(async (): Promise<CacheStats> => {
    if (!isReady) {
      return {
        totalItems: 0,
        totalSize: 0,
        stores: {},
        expiredItems: 0,
        lowAccessItems: 0,
        offlineQueueSize: 0,
        networkQuality,
        isOnline
      };
    }

    try {
      // 获取所有存储的统计信息
      const storageStats = await getOfflineQueue(); // 使用离线队列作为示例
      
      // 模拟计算（实际项目中需要更精确的计算）
      const totalItems = Object.values(stats).reduce((sum, store) => sum + store.count, 0);
      const estimatedSize = totalItems * 1024; // 假设每项平均1KB
      
      return {
        totalItems,
        totalSize: estimatedSize,
        stores: stats,
        expiredItems: 0, // 需要实际计算过期项数量
        lowAccessItems: 0, // 需要实际计算低访问项数量
        offlineQueueSize: storageStats.length,
        networkQuality,
        isOnline
      };
    } catch (error) {
      console.error('计算缓存统计失败:', error);
      return {
        totalItems: 0,
        totalSize: 0,
        stores: {},
        expiredItems: 0,
        lowAccessItems: 0,
        offlineQueueSize: 0,
        networkQuality,
        isOnline
      };
    }
  }, [isReady, stats, networkQuality, isOnline, getOfflineQueue]);

  // 更新缓存统计
  const updateCacheStats = useCallback(async () => {
    if (!isReady) return;

    setIsLoading(true);
    try {
      const newStats = await calculateCacheStats();
      setCacheStats(newStats);
      onCacheUpdate?.(newStats);
    } catch (error) {
      console.error('更新缓存统计失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isReady, calculateCacheStats, onCacheUpdate]);

  // 执行缓存清理
  const executeCleanup = useCallback(async (options: CleanupOptions = {}) => {
    if (isCleaning) return;

    setIsCleaning(true);
    try {
      console.log('[CacheManager] 开始清理缓存:', options);

      const startTime = Date.now();
      
      if (options.expiredOnly || (!options.lowAccessOnly && !options.specificStore)) {
        // 清理过期数据
        await cleanupExpiredData();
      }

      if (options.specificStore) {
        // 清理特定存储
        await clearStore(options.specificStore);
      }

      const duration = Date.now() - startTime;
      setLastCleanup(new Date());
      
      console.log(`[CacheManager] 缓存清理完成，耗时 ${duration}ms`);
      
      // 更新统计信息
      await updateCacheStats();
      
    } catch (error) {
      console.error('缓存清理失败:', error);
    } finally {
      setIsCleaning(false);
    }
  }, [isCleaning, cleanupExpiredData, clearStore, updateCacheStats]);

  // 自动清理缓存
  const scheduleAutoCleanup = useCallback(() => {
    if (!autoCleanup || cleanupTimer) return;

    const timer = setInterval(() => {
      // 只有在网络质量好时才执行自动清理
      if (networkQuality === NetworkQuality.GOOD || networkQuality === NetworkQuality.EXCELLENT) {
        executeCleanup({ expiredOnly: true });
      }
    }, cleanupInterval);

    setCleanupTimer(timer);
  }, [autoCleanup, cleanupInterval, networkQuality, executeCleanup]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString();
  };

  // 渲染缓存统计详情
  const renderCacheDetails = () => {
    if (!cacheStats || !showDetails) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
        <h4 className="font-semibold text-gray-800 mb-3">
          {t('cacheManager.details', '缓存详情')}
        </h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">{t('cacheManager.totalItems', '总项数')}:</span>
            <span className="ml-2 font-mono">{cacheStats.totalItems}</span>
          </div>
          
          <div>
            <span className="text-gray-600">{t('cacheManager.totalSize', '总大小')}:</span>
            <span className="ml-2 font-mono">{formatFileSize(cacheStats.totalSize)}</span>
          </div>
          
          <div>
            <span className="text-gray-600">{t('cacheManager.expiredItems', '过期项数')}:</span>
            <span className="ml-2 font-mono text-orange-600">{cacheStats.expiredItems}</span>
          </div>
          
          <div>
            <span className="text-gray-600">{t('cacheManager.lowAccessItems', '低访问项数')}:</span>
            <span className="ml-2 font-mono text-red-600">{cacheStats.lowAccessItems}</span>
          </div>
          
          <div>
            <span className="text-gray-600">{t('cacheManager.offlineQueue', '离线队列')}:</span>
            <span className="ml-2 font-mono">{cacheStats.offlineQueueSize}</span>
          </div>
          
          <div>
            <span className="text-gray-600">{t('cacheManager.lastCleanup', '上次清理')}:</span>
            <span className="ml-2 font-mono text-xs">
              {lastCleanup ? formatTime(lastCleanup.getTime()) : '-'}
            </span>
          </div>
        </div>

        {/* 存储详情 */}
        <div className="mt-4">
          <h5 className="font-medium text-gray-700 mb-2">
            {t('cacheManager.storageDetails', '存储详情')}
          </h5>
          <div className="space-y-2">
            {Object.entries(cacheStats.stores).map(([storeName, storeStats]) => (
              <div key={storeName} className="flex justify-between text-xs bg-white p-2 rounded border">
                <span className="font-mono text-gray-600">{storeName}</span>
                <span className="font-mono">{storeStats.count} 项</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 渲染网络状态指示器
  const renderNetworkIndicator = () => {
    if (!cacheStats) return null;

    const getNetworkIcon = () => {
      if (!cacheStats.isOnline) return '📵';
      switch (cacheStats.networkQuality) {
        case NetworkQuality.EXCELLENT: return '🟢';
        case NetworkQuality.GOOD: return '🔵';
        case NetworkQuality.FAIR: return '🟡';
        case NetworkQuality.POOR: return '🔴';
        default: return '⚪';
      }
    };

    const getNetworkText = () => {
      if (!cacheStats.isOnline) {
        return t('cacheManager.network.offline', '离线');
      }
      return t(`cacheManager.network.${cacheStats.networkQuality}`, cacheStats.networkQuality);
    };

    return (
      <div className="flex items-center gap-2 text-sm">
        <span>{getNetworkIcon()}</span>
        <span className={
          !cacheStats.isOnline ? 'text-red-600' :
          cacheStats.networkQuality === NetworkQuality.POOR ? 'text-red-600' :
          cacheStats.networkQuality === NetworkQuality.FAIR ? 'text-yellow-600' :
          'text-green-600'
        }>
          {getNetworkText()}
        </span>
      </div>
    );
  };

  // 初始化和清理
  useEffect(() => {
    if (isReady) {
      updateCacheStats();
    }
  }, [isReady, updateCacheStats]);

  useEffect(() => {
    if (isReady && autoCleanup) {
      scheduleAutoCleanup();
    }

    return () => {
      if (cleanupTimer) {
        clearInterval(cleanupTimer);
      }
    };
  }, [isReady, autoCleanup, scheduleAutoCleanup, cleanupTimer]);

  // 定期更新统计信息
  useEffect(() => {
    if (!isReady) return;

    const interval = setInterval(updateCacheStats, 30000); // 30秒更新一次
    return () => clearInterval(interval);
  }, [isReady, updateCacheStats]);

  if (!isReady) {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">{t('cacheManager.initializing', '初始化缓存管理器...')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 缓存概览 */}
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {t('cacheManager.title', '缓存管理')}
          </h3>
          
          {/* 网络状态 */}
          {renderNetworkIndicator()}
        </div>

        {/* 缓存统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-600">{t('cacheManager.totalItems', '总项数')}</div>
            <div className="text-xl font-bold text-blue-800">
              {cacheStats?.totalItems || 0}
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-600">{t('cacheManager.totalSize', '总大小')}</div>
            <div className="text-xl font-bold text-green-800">
              {formatFileSize(cacheStats?.totalSize || 0)}
            </div>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-sm text-yellow-600">{t('cacheManager.expiredItems', '过期项')}</div>
            <div className="text-xl font-bold text-yellow-800">
              {cacheStats?.expiredItems || 0}
            </div>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm text-purple-600">{t('cacheManager.offlineQueue', '离线队列')}</div>
            <div className="text-xl font-bold text-purple-800">
              {cacheStats?.offlineQueueSize || 0}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => executeCleanup({ expiredOnly: true })}
            disabled={isCleaning}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCleaning ? 
              t('cacheManager.cleaning', '清理中...') : 
              t('cacheManager.cleanExpired', '清理过期')
            }
          </button>
          
          <button
            onClick={() => executeCleanup({ force: true })}
            disabled={isCleaning}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('cacheManager.clearAll', '清空缓存')}
          </button>
          
          <button
            onClick={updateCacheStats}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 
              t('cacheManager.refreshing', '刷新中...') : 
              t('cacheManager.refresh', '刷新')
            }
          </button>
        </div>

        {/* 清理状态 */}
        {lastCleanup && (
          <div className="mt-3 text-xs text-gray-500">
            {t('cacheManager.lastCleanupTime', '上次清理时间')}: {lastCleanup.toLocaleString()}
          </div>
        )}
      </div>

      {/* 缓存详情 */}
      {renderCacheDetails()}
    </div>
  );
};

export default CacheManager;