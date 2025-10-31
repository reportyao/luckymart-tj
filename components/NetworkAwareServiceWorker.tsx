// NetworkAwareServiceWorker.tsx - 弱网环境优化的Service Worker组件
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useIndexedDB } from '@/utils/indexeddb-manager';

interface NetworkAwareServiceWorkerProps {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
  onNeedRefresh?: () => void;
  onNetworkChange?: (isOnline: boolean, quality: string) => void;
  className?: string;
}

// SW状态
interface SWState {
  registration: ServiceWorkerRegistration | null;
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isOfflineReady: boolean;
  error: string | null;
  cacheStats: {
    totalSize: number;
    itemCount: number;
    lastSync: number | null;
  };
}

// 注册Service Worker
export async function registerNetworkAwareSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker不被支持');
    return null;
  }

  try {
    // 检查是否在开发环境
    if (process.env.NODE_ENV === 'development') {
      console.log('开发环境，跳过Service Worker注册');
      return null;
    }

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('弱网优化Service Worker注册成功:', registration);

    // 设置更新处理器
    registration.addEventListener('updatefound', () => {
      console.log('发现Service Worker更新');
      const newWorker = registration.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('新版本Service Worker已安装');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker注册失败:', error);
    return null;
  }
}

// 发送消息给Service Worker
export async function sendSWMessage(message: any): Promise<any> {
  if (!navigator.serviceWorker.controller) {
    throw new Error('Service Worker未激活');
  }

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(event.data.error);
      } else {
        resolve(event.data);
      }
    };

    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
  });
}

// 触发后台同步
export async function triggerBackgroundSync(): Promise<void> {
  try {
    await sendSWMessage({ type: 'TRIGGER_SYNC' });
    console.log('后台同步已触发');
  } catch (error) {
    console.warn('触发后台同步失败:', error);
  }
}

const NetworkAwareServiceWorker: React.FC<NetworkAwareServiceWorkerProps> = ({
  onUpdate,
  onOfflineReady,
  onNeedRefresh,
  onNetworkChange,
  className = ''
}) => {
  const { t } = useTranslation();
  const { isOnline, networkQuality, networkStatus } = useNetworkStatus();
  const { getOfflineQueue, getStorageStats } = useIndexedDB();
  
  const [swState, setSwState] = useState<SWState>({
    registration: null,
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdateAvailable: false,
    isOfflineReady: false,
    error: null,
    cacheStats: {
      totalSize: 0,
      itemCount: 0,
      lastSync: null
    }
  });

  // 注册Service Worker
  const registerSW = useCallback(async () => {
    try {
      setSwState(prev => ({ ...prev, error: null }));
      
      const registration = await registerNetworkAwareSW();
      
      if (registration) {
        setSwState(prev => ({
          ...prev,
          registration,
          isRegistered: true,
          isUpdateAvailable: false
        }));

        onUpdate?.(registration);

        // 监听更新事件
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // 有新的worker等待激活
                  setSwState(prev => ({ ...prev, isUpdateAvailable: true }));
                  onNeedRefresh?.();
                } else {
                  // 首次安装完成
                  setSwState(prev => ({ ...prev, isOfflineReady: true }));
                  onOfflineReady?.();
                }
              }
            });
          }
        });

        // 更新缓存统计
        await updateCacheStats();
      }
    } catch (error) {
      console.error('SW注册失败:', error);
      setSwState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '注册失败'
      }));
    }
  }, [onUpdate, onOfflineReady, onNeedRefresh]);

  // 立即更新应用
  const applyUpdate = useCallback(async () => {
    if (swState.registration?.waiting) {
      swState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      // 重新加载页面以应用新版本
      window.location.reload();
    }
  }, [swState.registration]);

  // 更新缓存统计
  const updateCacheStats = useCallback(async () => {
    try {
      const storageStats = await getStorageStats();
      const offlineItems = await getOfflineQueue();
      
      setSwState(prev => ({
        ...prev,
        cacheStats: {
          totalSize: Object.values(storageStats).reduce((sum, store: any) => sum + (store.size || 0), 0),
          itemCount: Object.values(storageStats).reduce((sum, store: any) => sum + store.count, 0),
          lastSync: Date.now()
        },
        isOfflineReady: offlineItems.length > 0
      }));
    } catch (error) {
      console.warn('更新缓存统计失败:', error);
    }
  }, [getStorageStats, getOfflineQueue]);

  // 监听网络状态变化
  useEffect(() => {
    if (isOnline && swState.registration) {
      // 网络恢复时，触发后台同步
      triggerBackgroundSync();
      updateCacheStats();
    }
    
    // 通知网络状态变化
    onNetworkChange?.(isOnline, networkQuality);
  }, [isOnline, networkQuality, swState.registration, updateCacheStats, onNetworkChange]);

  // 获取缓存状态
  const getCacheStatus = useCallback(async () => {
    try {
      const status = await sendSWMessage({ type: 'GET_CACHE_STATUS' });
      return status;
    } catch (error) {
      console.warn('获取缓存状态失败:', error);
      return null;
    }
  }, []);

  // 清空缓存
  const clearCache = useCallback(async () => {
    try {
      await sendSWMessage({ type: 'CLEAR_CACHE' });
      await updateCacheStats();
      console.log('缓存已清空');
    } catch (error) {
      console.error('清空缓存失败:', error);
    }
  }, [updateCacheStats]);

  // 初始化注册
  useEffect(() => {
    if (swState.isSupported) {
      registerSW();
    } else {
      setSwState(prev => ({
        ...prev,
        error: 'Service Worker不被支持'
      }));
    }
  }, [swState.isSupported, registerSW]);

  // 监听消息事件
  useEffect(() => {
    if (!swState.isRegistered) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'CACHE_STATUS':
          console.log('缓存状态:', payload);
          break;
          
        case 'OFFLINE_QUEUE_UPDATED':
          updateCacheStats();
          break;
          
        case 'BACKGROUND_SYNC_COMPLETED':
          console.log('后台同步完成:', payload);
          updateCacheStats();
          break;
          
        case 'CACHE_UPDATED':
          updateCacheStats();
          break;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [swState.isRegistered, updateCacheStats]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString();
  };

  // 获取网络质量图标
  const getNetworkIcon = () => {
    if (!isOnline) return '📵';
    switch (networkQuality) {
      case 'excellent': return '🟢';
      case 'good': return '🔵';
      case 'fair': return '🟡';
      case 'poor': return '🔴';
      default: return '⚪';
    }
  };

  // 如果不支持Service Worker，不渲染任何内容
  if (!swState.isSupported) {
    return null;
  }

  return (
    <div className={`network-aware-sw ${className}`}>
      {/* 开发调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-sm z-50">
          <div className="space-y-2">
            <div className="font-semibold text-yellow-400">🔧 弱网优化系统</div>
            
            {/* 网络状态 */}
            <div className="grid grid-cols-2 gap-2">
              <div>网络:</div>
              <div className="flex items-center gap-1">
                {getNetworkIcon()}
                <span>{isOnline ? '在线' : '离线'}</span>
              </div>
              
              <div>质量:</div>
              <div className="text-right">{networkQuality}</div>
              
              <div>SW:</div>
              <div className="text-right">{swState.isRegistered ? '✅' : '❌'}</div>
              
              <div>离线:</div>
              <div className="text-right">{swState.isOfflineReady ? '✅' : '❌'}</div>
            </div>

            {/* 缓存统计 */}
            <div className="border-t border-gray-700 pt-2">
              <div className="font-medium">缓存统计:</div>
              <div className="text-xs space-y-1">
                <div>项数: {swState.cacheStats.itemCount}</div>
                <div>大小: {formatFileSize(swState.cacheStats.totalSize)}</div>
                <div>上次同步: {formatTime(swState.cacheStats.lastSync)}</div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-2 border-t border-gray-700 pt-2">
              {swState.isUpdateAvailable && (
                <button
                  onClick={applyUpdate}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                >
                  更新SW
                </button>
              )}
              
              <button
                onClick={() => triggerBackgroundSync()}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                后台同步
              </button>
              
              <button
                onClick={clearCache}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                清空缓存
              </button>
              
              <button
                onClick={updateCacheStats}
                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
              >
                刷新统计
              </button>
            </div>

            {/* 错误信息 */}
            {swState.error && (
              <div className="text-red-400 border-t border-gray-700 pt-2">
                错误: {swState.error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 更新提示 */}
      {swState.isUpdateAvailable && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg max-w-sm z-40">
          <div className="flex items-start space-x-3">
            <span className="text-xl">🔄</span>
            <div className="flex-1">
              <h4 className="font-semibold">应用已更新</h4>
              <p className="text-sm mt-1 opacity-90">
                新版本已准备就绪，请刷新页面以获取最新功能。
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={applyUpdate}
                  className="px-3 py-1 bg-white text-blue-500 rounded text-sm font-medium hover:bg-gray-100"
                >
                  立即更新
                </button>
                <button
                  onClick={() => setSwState(prev => ({ ...prev, isUpdateAvailable: false }))}
                  className="px-3 py-1 border border-white text-white rounded text-sm hover:bg-blue-600"
                >
                  稍后
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 离线就绪提示 */}
      {swState.isOfflineReady && !swState.isUpdateAvailable && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-30">
          <div className="flex items-center space-x-2">
            <span>✅</span>
            <span className="text-sm">离线功能已就绪</span>
          </div>
        </div>
      )}

      {/* 网络状态变更提示 */}
      {!isOnline && (
        <div className="fixed top-20 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-30 animate-pulse">
          <div className="flex items-center space-x-2">
            <span>📵</span>
            <span className="text-sm">网络连接已断开</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkAwareServiceWorker;

// 导出工具函数
export {
  registerNetworkAwareSW,
  sendSWMessage,
  triggerBackgroundSync
};