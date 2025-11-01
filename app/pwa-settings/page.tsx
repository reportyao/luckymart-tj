'use client';

import { useState, useEffect } from 'react';
import { Settings, Smartphone, Bell, Wifi, Download, Trash2, RefreshCw } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import NotificationManager from '@/components/NotificationManager';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

function PWASettingsPage() {
  const {
    isInstallable,
    isInstalled,
    triggerInstall,
    isUpdateAvailable,
    updateInfo,
    checkForUpdates,
    triggerUpdate,
    getCacheStatus,
    clearCache
  } = usePWA();

  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNotificationManager, setShowNotificationManager] = useState(false);

  // 加载缓存状态
  useEffect(() => {
    loadCacheStatus();
  }, []);

  const loadCacheStatus = async () => {
    try {
      const status = await getCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      console.error('获取缓存状态失败:', error);
    }
  };

  const handleInstall = async () => {
    const result = await triggerInstall();
    if (result) {
      alert('安装成功！');
    } else {
      alert('安装失败或已取消');
    }
  };

  const handleUpdate = async () => {
    const result = await triggerUpdate();
    if (result) {
      alert('更新已开始，请稍等片刻');
    } else {
      alert('无可用更新');
    }
  };

  const handleClearCache = async () => {
    if (confirm('确定要清除所有缓存吗？这可能会影响离线功能。')) {
      setIsLoading(true);
      const result = await clearCache();
      setIsLoading(false);
      
      if (result) {
        alert('缓存已清除');
        setCacheStatus(null);
      } else {
        alert('清除缓存失败');
      }
    }
  };

  const formatCacheSize = (size: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let currentSize = size;
    
    while (currentSize >= 1024 && unitIndex < units.length - 1) {
      currentSize /= 1024;
      unitIndex++;
    }
    
    return `${currentSize.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Settings className="w-8 h-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">PWA设置</h1>
          </div>
          <p className="text-gray-600">
            管理您的渐进式网页应用（PWA）设置，包括安装、更新、缓存和通知
          </p>
        </div>

        {/* 应用安装状态 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Download className="w-6 h-6 text-indigo-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">应用安装</h2>
            </div>
            
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                isInstalled ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <span className="text-sm text-gray-600">
                {isInstalled ? '已安装' : '未安装'}
              </span>
            </div>
          </div>

          {!isInstalled && (
            <div className="mb-4">
              <p className="text-gray-600 mb-4">
                安装应用后可获得更好的用户体验和原生应用般的功能
              </p>
              <button
                onClick={handleInstall}
                disabled={!isInstallable}
                className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isInstallable ? '安装应用' : '安装不可用'}
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <Smartphone className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  应用已安装到您的设备
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 应用更新 */}
        {isUpdateAvailable && updateInfo && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <RefreshCw className="w-6 h-6 text-orange-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">应用更新</h2>
              </div>
              
              <div className="text-sm text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                有新版本
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                版本 {updateInfo.version}
              </h3>
              <p className="text-gray-600 mb-3">
                {updateInfo.description}
              </p>
              
              {updateInfo.features && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">更新内容:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {updateInfo.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>大小: {formatCacheSize(updateInfo.size * 1024 * 1024)}</span>
                <span>发布日期: {new Date(updateInfo.releaseDate).toLocaleDateString()}</span>
              </div>
            </div>

            <button
              onClick={handleUpdate}
              className="bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
            >
              立即更新
            </button>
          </div>
        )}

        {/* 缓存管理 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Wifi className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">缓存管理</h2>
            </div>
            
            <button
              onClick={loadCacheStatus}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              刷新
            </button>
          </div>

          {cacheStatus ? (
            <div className="space-y-4">
              {Object.entries(cacheStatus).map(([cacheName, cacheData]: [string, any]) => (
                <div key={cacheName} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{cacheName}</h3>
                    <span className="text-sm text-gray-500">
                      {cacheData.count} 个文件
                    </span>
                  </div>
                  
                  {cacheData.urls && cacheData.urls.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-600 cursor-pointer">
                        查看文件列表
                      </summary>
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        {cacheData.urls.map((url: string, index: number) => (
                          <div key={index} className="text-xs text-gray-500 truncate">
                            {url}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
              
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleClearCache}
                  disabled={isLoading}
                  className="flex items-center text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {isLoading ? '清除中...' : '清除所有缓存'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Wifi className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>暂无缓存数据</p>
              <button
                onClick={loadCacheStatus}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                检查缓存状态
              </button>
            </div>
          )}
        </div>

        {/* 通知管理 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Bell className="w-6 h-6 text-purple-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">推送通知</h2>
            </div>
            
            <button
              onClick={() => setShowNotificationManager(!showNotificationManager)}
              className="text-purple-600 hover:text-purple-700 text-sm"
            >
              {showNotificationManager ? '收起' : '展开'}
            </button>
          </div>

          {showNotificationManager ? (
            <NotificationManager />
          ) : (
            <p className="text-gray-600">
              管理推送通知设置，包括权限管理和通知偏好
            </p>
          )}
        </div>

        {/* Service Worker状态 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Worker状态</h2>
          <ServiceWorkerRegistration 
            showControls={true}
            showStatus={true}
            autoPreload={false}
          />
        </div>

        {/* PWA功能说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">PWA功能说明</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
              <div>
                <strong>离线访问:</strong> 可以在没有网络的情况下浏览已缓存的内容
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
              <div>
                <strong>安装到设备:</strong> 像原生应用一样安装到主屏幕
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
              <div>
                <strong>推送通知:</strong> 接收重要更新和活动通知
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
              <div>
                <strong>自动更新:</strong> 应用会自动在后台更新到最新版本
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
              <div>
                <strong>快速启动:</strong> 启动速度接近原生应用
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}