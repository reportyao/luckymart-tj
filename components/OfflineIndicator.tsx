'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, Download, Clock } from 'lucide-react';

interface OfflineQueueItem {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
      triggerBackgroundSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 检查离线队列
    checkOfflineQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkOfflineQueue = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // 请求Service Worker检查离线队列
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          const { type, data } = event.data;
          
          if (type === 'CACHE_STATUS') {
            const { status } = data;
            // 分析离线队列状态
            const offlineCache = status['luckymart-offline-v1.0.0'];
            if (offlineCache) {
              // 转换为queue格式（简化版）
              const queue: OfflineQueueItem[] = offlineCache.urls
                .filter((url: string) => url.includes('/api/'))
                .map((url: string, index: number) => ({
                  id: `offline-${index}`,
                  url,
                  method: 'GET',
                  headers: {},
                  timestamp: Date.now() - (index * 1000),
                  retries: 0,
                  maxRetries: 3
                }));
              
              setOfflineQueue(queue);
            }
          }
        };
        
        // 发送消息请求缓存状态
        registration.active?.postMessage(
          { type: 'GET_CACHE_STATUS' },
          [messageChannel.port2]
        );
        
      } catch (error) {
        console.error('检查离线队列失败:', error);
      }
    }
  };

  const triggerBackgroundSync = useCallback(async () => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        setIsSyncing(true);
        setSyncProgress(0);
        
        const registration = await navigator.serviceWorker.ready;
        
        // 注册后台同步
        const syncRegistration = await registration.sync.register('background-sync');
        
        // 模拟进度更新
        const progressInterval = setInterval(() => {
          setSyncProgress(prev => Math.min(prev + 10, 90));
        }, 200);
        
        // 监听同步完成
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SYNC_COMPLETE') {
            clearInterval(progressInterval);
            setSyncProgress(100);
            setIsSyncing(false);
            setTimeout(() => setSyncProgress(0), 1000);
            checkOfflineQueue();
          }
        });
        
      } catch (error) {
        console.error('触发后台同步失败:', error);
        setIsSyncing(false);
        setSyncProgress(0);
      }
    } else {
      // 不支持Background Sync，手动同步
      await manualSync();
    }
  }, []);

  const manualSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    
    const queue = [...offlineQueue];
    let completed = 0;
    
    for (const item of queue) {
      try {
        await syncOfflineItem(item);
        completed++;
        setSyncProgress((completed / queue.length) * 100);
      } catch (error) {
        console.error('同步离线项失败:', item.id, error);
      }
    }
    
    setIsSyncing(false);
    setSyncProgress(100);
    setTimeout(() => setSyncProgress(0), 1000);
    checkOfflineQueue();
  };

  const syncOfflineItem = async (item: OfflineQueueItem) => {
    const response = await fetch(item.url, {
      method: item.method,
      headers: {
        ...item.headers,
        'Content-Type': 'application/json'
      },
      body: item.body ? JSON.stringify(item.body) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`同步失败: ${response.status}`);
    }
    
    return response.json();
  };

  const addToOfflineQueue = useCallback(async (url: string, options: RequestInit) => {
    if (isOnline) return;
    
    const queueItem: OfflineQueueItem = {
      id: `offline-${Date.now()}`,
      url,
      method: options.method || 'GET',
      headers: options.headers as Record<string, string> || {},
      body: options.body ? JSON.parse(options.body as string) : undefined,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3
    };
    
    setOfflineQueue(prev => [...prev, queueItem]);
    
    // 通知Service Worker添加离线项
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({
          type: 'ADD_TO_OFFLINE_QUEUE',
          payload: queueItem
        });
      } catch (error) {
        console.error('添加离线队列失败:', error);
      }
    }
  }, [isOnline]);

  const clearOfflineQueue = useCallback(async () => {
    setOfflineQueue([]);
    
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({
          type: 'CLEAR_OFFLINE_QUEUE'
        });
      } catch (error) {
        console.error('清除离线队列失败:', error);
      }
    }
  }, []);

  const retrySync = useCallback(() => {
    triggerBackgroundSync();
  }, [triggerBackgroundSync]);

  if (!showOfflineBanner && !isSyncing && offlineQueue.length === 0) {
    return null;
  }

  return (
    <>
      {/* 离线横幅 */}
      {showOfflineBanner && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-2 px-4 z-50">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center">
              <WifiOff className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">
                网络连接已断开，某些功能可能受限
              </span>
            </div>
            <button
              onClick={() => setShowOfflineBanner(false)}
              className="text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 同步状态栏 */}
      {(isSyncing || syncProgress > 0) && (
        <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-w-sm mx-auto">
          <div className="p-4">
            <div className="flex items-center mb-3">
              <RefreshCw className={`w-5 h-5 text-indigo-600 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  {isSyncing ? '正在同步数据...' : '数据同步完成'}
                </h3>
                {offlineQueue.length > 0 && (
                  <p className="text-xs text-gray-500">
                    待同步 {offlineQueue.length} 项
                  </p>
                )}
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-gray-500">
                {Math.round(syncProgress)}%
              </span>
              
              {!isSyncing && (
                <button
                  onClick={clearOfflineQueue}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  完成
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 离线队列管理按钮 */}
      {offlineQueue.length > 0 && !isSyncing && !showOfflineBanner && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-full shadow-lg border border-gray-200 p-3">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Clock className="w-5 h-5 text-gray-600" />
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {offlineQueue.length}
                </div>
              </div>
              
              <button
                onClick={retrySync}
                className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors"
                title="同步数据"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <button
                onClick={clearOfflineQueue}
                className="text-gray-600 hover:text-gray-800"
                title="清除队列"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 状态指示器 */}
      <div className={`fixed bottom-4 left-4 flex items-center px-3 py-1 rounded-full text-xs font-medium z-40 ${
        isOnline 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3 mr-1" />
            在线
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 mr-1" />
            离线
          </>
        )}
      </div>

      {/* 离线提示模态框 */}
      {showOfflineBanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="text-center">
              <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                网络连接中断
              </h3>
              <p className="text-gray-600 mb-6">
                您正在使用离线模式，已缓存的内容仍可访问。当网络恢复时，离线的操作将自动同步。
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={retrySync}
                  disabled={isSyncing}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? '正在同步...' : '立即同步'}
                </button>
                
                <button
                  onClick={() => setShowOfflineBanner(false)}
                  className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  继续使用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}