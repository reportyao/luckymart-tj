'use client';

import React, { useEffect, useState } from 'react';
import { translationCache, type CacheStatus, type PreloadResult, type ClearCacheResult } from '@/utils/translation-cache';
import { useLanguage } from '@/src/i18n/useLanguageCompat';

// 缓存状态指示器组件
interface CacheStatusIndicatorProps {
  status: CacheStatus | null;
  onRefresh?: () => void;
}

function CacheStatusIndicator({ status, onRefresh }: CacheStatusIndicatorProps) {
  if (!status) {
    return (
      <div className="luckymart-layout-flex luckymart-layout-center gap-2 luckymart-text-secondary">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="luckymart-text-sm">缓存未初始化</span>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="luckymart-layout-flex luckymart-layout-center gap-4 luckymart-text-sm">
      <div className="luckymart-layout-flex luckymart-layout-center gap-2">
        <div className="w-2 h-2 luckymart-bg-success rounded-full"></div>
        <span>缓存已启用</span>
      </div>
      <span>{status.totalFiles} 个文件</span>
      <span>{formatSize(status.size)}</span>
      <button
        onClick={onRefresh}
        className="text-blue-600 hover:text-blue-800 underline"
      >
        刷新
      </button>
    </div>
  );
}

// 预加载进度组件
interface PreloadProgressProps {
  result: PreloadResult | null;
  isLoading: boolean;
  onStartPreload: () => void;
  onClearCache: () => void;
}

function PreloadProgress({ result, isLoading, onStartPreload, onClearCache }: PreloadProgressProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="luckymart-spacing-md">
      <div className="luckymart-layout-flex gap-3">
        <button
          onClick={onStartPreload}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white luckymart-rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '预加载中...' : '预加载翻译'}
        </button>
        <button
          onClick={onClearCache}
          disabled={isLoading}
          className="px-4 py-2 bg-red-600 text-white luckymart-rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          清除缓存
        </button>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 bg-gray-600 text-white luckymart-rounded-lg hover:bg-gray-700"
        >
          {showDetails ? '隐藏详情' : '显示详情'}
        </button>
      </div>

      {isLoading && (
        <div className="luckymart-layout-flex luckymart-layout-center gap-2 text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full luckymart-animation-spin"></div>
          <span>正在预加载翻译文件...</span>
        </div>
      )}

      {result && (
        <div className="luckymart-spacing-sm">
          <div className="luckymart-text-sm text-gray-600">
            总文件数: {result.total} | 
            成功: {result.success.length} | 
            失败: {result.failed.length}
          </div>
          
          {showDetails && (
            <div className="grid grid-cols-2 gap-4 text-xs">
              {result.success.length > 0 && (
                <div>
                  <div className="luckymart-font-medium text-green-600 mb-1">成功的文件:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.success.map((file, index) => (
                      <div key={index} className="text-green-600">✓ {file}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {result.failed.length > 0 && (
                <div>
                  <div className="luckymart-font-medium text-red-600 mb-1">失败的文件:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.failed.map((file, index) => (
                      <div key={index} className="text-red-600">✗ {file}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Service Worker状态组件
interface SWStatusProps {
  isSupported: boolean;
  isRegistered: boolean;
  onUpdate: () => void;
}

function SWStatus({ isSupported, isRegistered, onUpdate }: SWStatusProps) {
  if (!isSupported) {
    return (
      <div className="luckymart-padding-md bg-yellow-50 luckymart-border border-yellow-200 luckymart-rounded-lg">
        <div className="luckymart-layout-flex luckymart-layout-center gap-2 text-yellow-800">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span>您的浏览器不支持Service Worker，无法使用离线缓存功能</span>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="luckymart-padding-md bg-blue-50 luckymart-border border-blue-200 luckymart-rounded-lg">
        <div className="luckymart-layout-flex luckymart-layout-center gap-2 text-blue-800">
          <div className="w-2 h-2 luckymart-bg-primary rounded-full"></div>
          <span>Service Worker正在注册中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="luckymart-padding-md bg-green-50 luckymart-border border-green-200 luckymart-rounded-lg">
      <div className="luckymart-layout-flex luckymart-layout-center justify-between">
        <div className="luckymart-layout-flex luckymart-layout-center gap-2 text-green-800">
          <div className="w-2 h-2 luckymart-bg-success rounded-full"></div>
          <span>Service Worker已就绪，离线缓存已启用</span>
        </div>
        <button
          onClick={onUpdate}
          className="text-xs px-2 py-1 bg-green-600 text-white luckymart-rounded hover:bg-green-700"
        >
          检查更新
        </button>
      </div>
    </div>
  );
}

// 主要组件
interface ServiceWorkerRegistrationProps {
  showControls?: boolean;
  showStatus?: boolean;
  autoPreload?: boolean;
  compact?: boolean;
}

export function ServiceWorkerRegistration({
  showControls = true,
  showStatus = true,
  autoPreload = true,
  compact = false
}: ServiceWorkerRegistrationProps) {
  const { language } = useLanguage();
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [preloadResult, setPreloadResult] = useState<PreloadResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化Service Worker
  useEffect(() => {
    let mounted = true;

    const initSW = async () => {
      try {
        const supported = typeof window !== 'undefined' && 
                         'serviceWorker' in navigator && 
                         'caches' in window;
        
        if (!mounted) return;
        setIsSupported(supported);

        if (!supported) return;

        // 注册Service Worker
        const success = await translationCache.initialize();
        if (!mounted) return;
        
        setIsRegistered(success);

        if (success) {
          // 获取初始缓存状态
          const status = await translationCache.getCacheStatus();
          if (mounted) {
            setCacheStatus(status);
          }

          // 智能预加载
          if (autoPreload) {
            await handleSmartPreload();
          }
        }
      } catch (err) {
        console.error('[ServiceWorkerRegistration] 初始化失败:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : '初始化失败');
        }
      }
    };

    initSW();

    return () => {
      mounted = false;
    };
  }, []);

  // 监听语言变化，更新缓存管理器的当前语言
  useEffect(() => {
    translationCache.updateCurrentLanguage(language);
  }, [language]);

  // 智能预加载
  const handleSmartPreload = async () => {
    if (!isSupported || !isRegistered) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await translationCache.smartPreload();
      setPreloadResult(result);
      
      // 刷新缓存状态
      const newStatus = await translationCache.getCacheStatus();
      setCacheStatus(newStatus);
    } catch (err) {
      console.error('[ServiceWorkerRegistration] 智能预加载失败:', err);
      setError(err instanceof Error ? err.message : '预加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 手动预加载
  const handlePreload = async () => {
    if (!isSupported || !isRegistered) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await translationCache.preloadTranslations([language]);
      setPreloadResult(result);
      
      // 刷新缓存状态
      const newStatus = await translationCache.getCacheStatus();
      setCacheStatus(newStatus);
    } catch (err) {
      console.error('[ServiceWorkerRegistration] 预加载失败:', err);
      setError(err instanceof Error ? err.message : '预加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 清除缓存
  const handleClearCache = async () => {
    if (!isSupported || !isRegistered) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result: ClearCacheResult = await translationCache.clearCache();
      
      if (result.success) {
        setCacheStatus(null);
        setPreloadResult(null);
      } else {
        setError(result.error || '清除缓存失败');
      }
    } catch (err) {
      console.error('[ServiceWorkerRegistration] 清除缓存失败:', err);
      setError(err instanceof Error ? err.message : '清除缓存失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新缓存状态
  const handleRefreshStatus = async () => {
    if (!isSupported || !isRegistered) return;
    
    try {
      const status = await translationCache.getCacheStatus();
      setCacheStatus(status);
    } catch (err) {
      console.error('[ServiceWorkerRegistration] 刷新状态失败:', err);
    }
  };

  // 紧凑模式渲染
  if (compact) {
    return (
      <div className="luckymart-layout-flex luckymart-layout-center gap-4 text-xs">
        <CacheStatusIndicator status={cacheStatus} onRefresh={handleRefreshStatus} />
        {showControls && (
          <div className="luckymart-layout-flex gap-2">
            <button
              onClick={handleSmartPreload}
              disabled={isLoading || !isRegistered}
              className="px-2 py-1 bg-blue-600 text-white luckymart-rounded disabled:opacity-50"
            >
              缓存
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 luckymart-padding-md bg-gray-50 luckymart-rounded-lg luckymart-border">
      <div className="luckymart-layout-flex luckymart-layout-center justify-between">
        <h3 className="luckymart-text-lg font-semibold">翻译缓存管理</h3>
        <div className="luckymart-text-sm luckymart-text-secondary">
          当前语言: {language}
        </div>
      </div>

      {/* Service Worker状态 */}
      {showStatus && (
        <SWStatus
          isSupported={isSupported}
          isRegistered={isRegistered}
          onUpdate={handleRefreshStatus}
        />
      )}

      {/* 错误信息 */}
      {error && (
        <div className="p-3 bg-red-50 luckymart-border border-red-200 luckymart-rounded-lg">
          <div className="text-red-800 luckymart-text-sm">
            <strong>错误:</strong> {error}
          </div>
        </div>
      )}

      {/* 缓存状态 */}
      {showStatus && cacheStatus && (
        <div className="p-3 luckymart-bg-white luckymart-border luckymart-rounded-lg">
          <h4 className="luckymart-font-medium mb-2">缓存状态</h4>
          <CacheStatusIndicator status={cacheStatus} onRefresh={handleRefreshStatus} />
        </div>
      )}

      {/* 控制面板 */}
      {showControls && isSupported && isRegistered && (
        <div className="p-3 luckymart-bg-white luckymart-border luckymart-rounded-lg">
          <h4 className="luckymart-font-medium mb-3">缓存操作</h4>
          <PreloadProgress
            result={preloadResult}
            isLoading={isLoading}
            onStartPreload={handlePreload}
            onClearCache={handleClearCache}
          />
        </div>
      )}

      {/* 帮助信息 */}
      <div className="text-xs luckymart-text-secondary space-y-1">
        <p>• Service Worker提供离线翻译缓存功能</p>
        <p>• 首次访问时会自动下载并缓存翻译文件</p>
        <p>• 支持版本控制和智能更新机制</p>
        <p>• 缓存大小限制为50MB，采用LRU清理策略</p>
      </div>
    </div>
  );
}