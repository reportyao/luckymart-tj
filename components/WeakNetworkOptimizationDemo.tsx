// WeakNetworkOptimizationDemo.tsx - 弱网环境优化系统使用示例
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import NetworkStatusIndicator from '@/components/NetworkStatusIndicator';
import OfflineFallback from '@/components/OfflineFallback';
import RetryButton from '@/components/RetryButton';
import CacheManager from '@/components/CacheManager';
import NetworkAwareServiceWorker from '@/components/NetworkAwareServiceWorker';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useAPIOptimizer } from '@/utils/api-optimizer';
import { useRequestQueue, QueuePriority } from '@/utils/request-queue';
import { NetworkQuality } from '@/utils/network-retry';

const WeakNetworkOptimizationDemo: React.FC = () => {
  const { t } = useTranslation();
  const { isOnline, networkQuality, networkStatus } = useNetworkStatus();
  const { fetchOptimized, recordChange, forceSync, isOptimizing } = useAPIOptimizer();
  const { add, stats, isPaused } = useRequestQueue();
  
  const [demoData, setDemoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 模拟API数据获取
  const fetchDemoData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchOptimized('/api/demo/products', {
        useCache: true,
        cacheTimeout: 2 * 60 * 1000, // 2分钟缓存
        enableIncremental: true,
        fallbackData: {
          products: [
            { id: 1, name: '缓存产品1', price: 100 },
            { id: 2, name: '缓存产品2', price: 200 }
          ],
          source: 'fallback'
        }
      });

      setDemoData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [fetchOptimized]);

  // 添加离线操作
  const addOfflineOperation = useCallback(async (type: string, data: any) => {
    try {
      await add(
        async () => {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000));
          return { success: true, data };
        },
        {
          priority: type === 'payment' ? QueuePriority.CRITICAL : QueuePriority.NORMAL,
          metadata: { type, data },
          onSuccess: (result) => {
            console.log('操作成功:', result);
            // 记录变更
            recordChange({
              tableName: 'demo_operations',
              recordId: `demo_${Date.now()}`,
              operation: 'create',
              newData: data,
              userId: 'demo_user',
              clientId: 'demo_client',
              version: 1
            });
          }
        }
      );
    } catch (err) {
      console.error('添加离线操作失败:', err);
    }
  }, [add, recordChange]);

  // 手动触发后台同步
  const handleForceSync = useCallback(async () => {
    try {
      await forceSync();
      console.log('后台同步已触发');
    } catch (err) {
      console.error('触发同步失败:', err);
    }
  }, [forceSync]);

  // 自动获取数据
  useEffect(() => {
    fetchDemoData();
  }, [fetchDemoData]);

  // 网络状态变化时的处理
  useEffect(() => {
    if (isOnline) {
      console.log('网络已恢复，开始同步数据');
      handleForceSync();
    } else {
      console.log('网络已断开，启用离线模式');
    }
  }, [isOnline, handleForceSync]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Service Worker 管理组件 */}
      <NetworkAwareServiceWorker
        onUpdate={(registration) => console.log('SW 更新:', registration)}
        onOfflineReady={() => console.log('离线功能已就绪')}
        onNeedRefresh={() => console.log('需要刷新应用')}
        onNetworkChange={(online, quality) => {
          console.log(`网络变化: ${online ? '在线' : '离线'}, 质量: ${quality}`);
        }}
      />

      {/* 网络状态指示器 */}
      <div className="fixed top-4 right-4 z-50">
        <NetworkStatusIndicator
          variant="full"
          showDetails={true}
          showTooltip={true}
          position="top-right"
          refreshable={true}
          onRefresh={fetchDemoData}
        />
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 标题部分 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            LuckyMart TJ 弱网环境优化系统
          </h1>
          <p className="text-lg text-gray-600">
            演示完整的离线优先解决方案
          </p>
          
          {/* 网络状态概览 */}
          <div className="mt-6 flex justify-center gap-4">
            <div className={`px-4 py-2 rounded-lg ${
              isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isOnline ? '🟢 在线' : '🔴 离线'}
            </div>
            <div className={`px-4 py-2 rounded-lg ${
              networkQuality === NetworkQuality.EXCELLENT ? 'bg-green-100 text-green-800' :
              networkQuality === NetworkQuality.GOOD ? 'bg-blue-100 text-blue-800' :
              networkQuality === NetworkQuality.FAIR ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              网络质量: {networkQuality}
            </div>
            <div className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg">
              请求队列: {stats.pendingItems || 0} 项待处理
            </div>
          </div>
        </div>

        {/* 主要功能区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 数据获取演示 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📊 智能数据获取
            </h2>
            
            <OfflineFallback
              showRetryButton={true}
              showRefreshButton={true}
              enableAutoRetry={true}
              maxRetries={3}
              onRetry={fetchDemoData}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">数据来源:</span>
                  <span className="text-sm font-medium">
                    {demoData?.source || '未知'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">响应时间:</span>
                  <span className="text-sm font-medium">
                    {demoData?.responseTime ? `${Math.round(demoData.responseTime)}ms` : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">缓存命中:</span>
                  <span className="text-sm font-medium">
                    {demoData?.cacheHit ? '✅ 是' : '❌ 否'}
                  </span>
                </div>

                <button
                  onClick={fetchDemoData}
                  disabled={isLoading}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '加载中...' : '重新获取数据'}
                </button>

                {demoData?.data?.products && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">产品列表 (缓存数据):</h4>
                    <div className="space-y-2">
                      {demoData.data.products.map((product: any) => (
                        <div key={product.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                          <span>{product.name}</span>
                          <span>¥{product.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </OfflineFallback>
          </div>

          {/* 离线操作演示 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📱 离线操作队列
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">队列状态:</span>
                  <div className={`font-medium ${isPaused ? 'text-red-600' : 'text-green-600'}`}>
                    {isPaused '已暂停' : '运行中'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">待处理:</span>
                  <div className="font-medium">{stats.pendingItems || 0}</div>
                </div>
                <div>
                  <span className="text-gray-600">处理中:</span>
                  <div className="font-medium">{stats.processingItems || 0}</div>
                </div>
                <div>
                  <span className="text-gray-600">成功率:</span>
                  <div className="font-medium">{Math.round(stats.successRate || 0)}%</div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => addOfflineOperation('purchase', {
                    productId: 1,
                    quantity: 2,
                    timestamp: Date.now()
                  })}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
                >
                  添加购买操作 (高优先级)
                </button>
                
                <button
                  onClick={() => addOfflineOperation('view', {
                    productId: 2,
                    action: 'view',
                    timestamp: Date.now()
                  })}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                >
                  添加浏览记录 (普通优先级)
                </button>
                
                <button
                  onClick={() => addOfflineOperation('sync', {
                    type: 'background_sync',
                    timestamp: Date.now()
                  })}
                  className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
                >
                  添加后台同步 (低优先级)
                </button>
              </div>

              <RetryButton
                onRetry={handleForceSync}
                variant="outline"
                maxRetries={3}
                autoRetry={false}
                showNetworkStatus={true}
              >
                强制同步
              </RetryButton>
            </div>
          </div>

          {/* 缓存管理演示 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              💾 缓存管理系统
            </h2>
            
            <CacheManager
              showDetails={true}
              autoCleanup={true}
              cleanupInterval={2 * 60 * 1000} // 2分钟清理间隔
              maxCacheSize={50 * 1024 * 1024} // 50MB
              onCacheUpdate={(stats) => {
                console.log('缓存统计更新:', stats);
              }}
            />
          </div>

          {/* 网络诊断演示 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🔍 网络诊断
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">连接状态:</span>
                  <span className={`font-medium ${
                    isOnline ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isOnline ? '已连接' : '未连接'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">网络质量:</span>
                  <span className="font-medium">{networkQuality}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">连接类型:</span>
                  <span className="font-medium">
                    {networkStatus.connectionType || '未知'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">下行带宽:</span>
                  <span className="font-medium">
                    {networkStatus.downlink ? `${networkStatus.downlink} Mbps` : '未知'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">往返延迟:</span>
                  <span className="font-medium">
                    {networkStatus.rtt ? `${networkStatus.rtt}ms` : '未知'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">数据节省模式:</span>
                  <span className="font-medium">
                    {networkStatus.saveData ? '已启用' : '未启用'}
                  </span>
                </div>
                
                {networkStatus.lastOfflineTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">最后离线:</span>
                    <span className="font-medium">
                      {new Date(networkStatus.lastOfflineTime).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {/* 网络事件历史 */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">最近网络事件:</h4>
                <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                  {networkStatus && (
                    <div className="text-gray-600">
                      {isOnline ? '🟢 在线事件' : '🔴 离线事件'} - 
                      {new Date().toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 错误信息显示 */}
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-xl">⚠️</span>
              <div>
                <h3 className="font-medium text-red-800">操作失败</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <RetryButton
                  onRetry={() => {
                    setError(null);
                    fetchDemoData();
                  }}
                  variant="outline"
                  className="mt-2"
                >
                  重试
                </RetryButton>
              </div>
            </div>
          </div>
        )}

        {/* 功能说明 */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            💡 系统特性说明
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-blue-700 mb-2">🔄 智能缓存</h4>
              <ul className="text-blue-600 space-y-1">
                <li>• Service Worker 双重缓存</li>
                <li>• IndexedDB 结构化存储</li>
                <li>• 过期自动清理</li>
                <li>• LRU 淘汰策略</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-700 mb-2">🌐 网络优化</h4>
              <ul className="text-blue-600 space-y-1">
                <li>• 实时网络质量检测</li>
                <li>• 智能重试策略</li>
                <li>• 请求优先级队列</li>
                <li>• 增量数据同步</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-700 mb-2">📱 离线支持</h4>
              <ul className="text-blue-600 space-y-1">
                <li>• 离线页面降级</li>
                <li>• 离线操作队列</li>
                <li>• 后台同步机制</li>
                <li>• 数据冲突解决</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-700 mb-2">⚡ 性能优化</h4>
              <ul className="text-blue-600 space-y-1">
                <li>• 网络感知调整</li>
                <li>• 批处理优化</li>
                <li>• 压缩传输</li>
                <li>• 懒加载策略</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeakNetworkOptimizationDemo;