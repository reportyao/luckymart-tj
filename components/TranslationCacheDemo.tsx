'use client';

import React, { useEffect, useState } from 'react';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';
import { translationCache, type CacheStatus, type PreloadResult } from '@/utils/translation-cache';
import { useLanguage } from '@/src/i18n/useLanguageCompat';

/**
 * 翻译缓存演示组件属性
 */
interface TranslationCacheDemoProps {
  /** 自定义CSS类名 */
  className?: string;
  /** 是否显示详细调试信息 */
  debug?: boolean;
  /** 自动预加载开关 */
  autoPreload?: boolean;
  /** 预加载完成的回调 */
  onPreloadComplete?: (result: PreloadResult) => void;
}

// Hook用于管理翻译缓存
function useTranslationCache(autoPreload: boolean = false) {
  const { language } = useLanguage();
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState<PreloadResult | null>(null);

  // 更新在线状态
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // 获取缓存状态
  const refreshCacheStatus = async () => {
    try {
      const status = await translationCache.getCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      console.error('Failed to refresh cache status:', error);
    }
  };

  // 预加载当前语言
  const preloadCurrentLanguage = async () => {
    try {
      const result = await translationCache.preloadTranslations([language]);
      setPreloadProgress(result);
      await refreshCacheStatus();
      return result;
    } catch (error) {
      console.error('Failed to preload translations:', error);
      throw error;
    }
  };

  // 清除所有缓存
  const clearAllCache = async () => {
    try {
      const result = await translationCache.clearCache();
      await refreshCacheStatus();
      setPreloadProgress(null);
      return result;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  };

  // 检查特定翻译是否已缓存
  const isTranslationCached = async (lang: string, namespace: string = 'common') => {
    try {
      return await translationCache.isTranslationCached(lang as any, namespace);
    } catch (error) {
      console.error('Failed to check translation cache:', error);
      return false;
    }
  };

  return {
    cacheStatus,
    isOnline,
    preloadProgress,
    refreshCacheStatus,
    preloadCurrentLanguage,
    clearAllCache,
    isTranslationCached
  };
}

// 离线状态指示器组件
function OfflineIndicator({ isOnline }: { isOnline: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      isOnline 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      <span>{isOnline ? '在线' : '离线'}</span>
    </div>
  );
}

// 缓存统计组件
function CacheStats({ status }: { status: CacheStatus | null }) {
  if (!status) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getLanguageStats = () => {
    const langStats: Record<string, number> = {};
    
    status.cacheKeys.forEach(key => {
      const langMatch = key.match(/translations:([^:]+):/);
      if (langMatch) {
        const lang = langMatch[1];
        langStats[lang] = (langStats[lang] || 0) + 1;
      }
    });
    
    return langStats;
  };

  const langStats = getLanguageStats();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 luckymart-text-sm">
      <div className="p-3 bg-blue-50 luckymart-rounded-lg">
        <div className="text-blue-600 luckymart-font-medium">总文件数</div>
        <div className="text-2xl luckymart-font-bold text-blue-800">{status.totalFiles}</div>
      </div>
      <div className="p-3 bg-green-50 luckymart-rounded-lg">
        <div className="text-green-600 luckymart-font-medium">缓存大小</div>
        <div className="text-2xl luckymart-font-bold text-green-800">{formatBytes(status.size)}</div>
      </div>
      <div className="p-3 bg-purple-50 luckymart-rounded-lg">
        <div className="text-purple-600 luckymart-font-medium">支持语言</div>
        <div className="text-2xl luckymart-font-bold text-purple-800">{Object.keys(langStats).length}</div>
      </div>
      <div className="p-3 bg-orange-50 luckymart-rounded-lg">
        <div className="text-orange-600 luckymart-font-medium">缓存版本</div>
        <div className="text-2xl luckymart-font-bold text-orange-800">{status.version}</div>
      </div>
    </div>
  );
}

// 缓存健康状态组件
function CacheHealthStatus() {
  const [health, setHealth] = useState<{
    status: 'healthy' | 'warning' | 'error';
    message: string;
    details?: any;
  } | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthStatus = await translationCache.getCacheHealth();
        setHealth(healthStatus);
      } catch (error) {
        console.error('Failed to check cache health:', error);
        setHealth({
          status: 'error',
          message: '无法检查缓存健康状态'
        });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // 每30秒检查一次

    return () => clearInterval(interval);
  }, []);

  if (!health) return null;

  const statusColors = {
    healthy: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <div className={`p-4 rounded-lg border ${statusColors[health.status]}`}>
      <div className="luckymart-layout-flex luckymart-layout-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${
          health.status === 'healthy' ? 'bg-green-500' :
          health.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
        }`}></div>
        <span className="luckymart-font-medium">缓存健康状态: {health.status}</span>
      </div>
      <p className="luckymart-text-sm">{health.message}</p>
      {health.details && (
        <details className="mt-2">
          <summary className="cursor-pointer luckymart-text-sm underline">查看详情</summary>
          <pre className="mt-2 text-xs bg-black bg-opacity-10 luckymart-padding-sm luckymart-rounded overflow-auto">
            {JSON.stringify(health.details, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

// 主要示例组件
const TranslationCacheDemo: React.FC<TranslationCacheDemoProps> = ({
  className = '',
  debug = false,
  autoPreload = false,
  onPreloadComplete
}) => {
  const {
    cacheStatus,
    isOnline,
    preloadProgress,
    refreshCacheStatus,
    preloadCurrentLanguage,
    clearAllCache
  } = useTranslationCache();

  const [activeTab, setActiveTab] = useState<'overview' | 'controls' | 'demo'>('overview');

  return (
    <div className={`translation-cache-demo max-w-4xl mx-auto p-6 space-y-6 ${className}`}>
      {/* 页面标题 */}
      <div className="luckymart-layout-flex luckymart-layout-center justify-between">
        <h1 className="text-3xl luckymart-font-bold text-gray-900">
          离线翻译缓存演示
        </h1>
        <OfflineIndicator isOnline={isOnline} />
      </div>

      {/* 标签页导航 */}
      <div className="luckymart-layout-flex space-x-1 luckymart-bg-gray-light p-1 luckymart-rounded-lg">
        {[
          { id: 'overview', label: '概览', icon: '📊' },
          { id: 'controls', label: '控制面板', icon: '⚙️' },
          { id: 'demo', label: '功能演示', icon: '🚀' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 概览页面 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-6">
            {/* 缓存统计 */}
            {cacheStatus && (
              <div className="luckymart-padding-lg luckymart-bg-white luckymart-rounded-lg luckymart-border">
                <h2 className="luckymart-text-xl font-semibold luckymart-spacing-md">缓存统计</h2>
                <CacheStats status={cacheStatus} />
              </div>
            )}

            {/* 健康状态 */}
            <CacheHealthStatus />

            {/* Service Worker注册组件 */}
            <div className="luckymart-padding-lg luckymart-bg-white luckymart-rounded-lg luckymart-border">
              <h2 className="luckymart-text-xl font-semibold luckymart-spacing-md">Service Worker状态</h2>
              <ServiceWorkerRegistration 
                showControls={false}
                showStatus={true}
                autoPreload={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* 控制面板页面 */}
      {activeTab === 'controls' && (
        <div className="space-y-6">
          <div className="luckymart-padding-lg luckymart-bg-white luckymart-rounded-lg luckymart-border">
            <h2 className="luckymart-text-xl font-semibold luckymart-spacing-md">缓存控制面板</h2>
            <ServiceWorkerRegistration 
              showControls={true}
              showStatus={true}
              autoPreload={false}
            />
          </div>

          {/* 预加载结果 */}
          {preloadProgress && (
            <div className="luckymart-padding-lg luckymart-bg-white luckymart-rounded-lg luckymart-border">
              <h3 className="luckymart-text-lg font-semibold mb-3">最新预加载结果</h3>
              <div className="luckymart-spacing-sm">
                <div className="luckymart-text-sm text-gray-600">
                  总计: {preloadProgress.total} 个文件 | 
                  成功: {preloadProgress.success.length} | 
                  失败: {preloadProgress.failed.length}
                </div>
                
                {preloadProgress.success.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-green-600">
                      成功文件 ({preloadProgress.success.length})
                    </summary>
                    <div className="mt-2 text-xs space-y-1 max-h-32 overflow-y-auto">
                      {preloadProgress.success.map((file, index) => (
                        <div key={index} className="text-green-600">✓ {file}</div>
                      ))}
                    </div>
                  </details>
                )}
                
                {preloadProgress.failed.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-red-600">
                      失败文件 ({preloadProgress.failed.length})
                    </summary>
                    <div className="mt-2 text-xs space-y-1 max-h-32 overflow-y-auto">
                      {preloadProgress.failed.map((file, index) => (
                        <div key={index} className="text-red-600">✗ {file}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 功能演示页面 */}
      {activeTab === 'demo' && (
        <div className="space-y-6">
          <div className="luckymart-padding-lg luckymart-bg-white luckymart-rounded-lg luckymart-border">
            <h2 className="luckymart-text-xl font-semibold luckymart-spacing-md">功能演示</h2>
            <TranslationCacheDemoContent />
          </div>
        </div>
      )}
    </div>
  );
}

// 演示内容组件
function TranslationCacheDemoContent() {
  const { refreshCacheStatus, preloadCurrentLanguage, clearAllCache } = useTranslationCache();
  const [testResults, setTestResults] = useState<any[]>([]);

  const runDemo = async () => {
    const results = [];
    
    try {
      // 测试1: 检查缓存状态
      results.push({
        test: '检查缓存状态',
        status: 'running',
        timestamp: new Date().toISOString()
      });
      
      const status = await translationCache.getCacheStatus();
      results[results.length - 1] = {
        ...results[results.length - 1],
        status: 'success',
        result: status ? `找到 ${status.totalFiles} 个缓存文件` : '缓存为空'
      };

      // 测试2: 验证特定翻译文件
      results.push({
        test: '验证中文通用翻译',
        status: 'running',
        timestamp: new Date().toISOString()
      });
      
      const isCached = await translationCache.isTranslationCached('zh-CN', 'common');
      results[results.length - 1] = {
        ...results[results.length - 1],
        status: isCached ? 'success' : 'warning',
        result: isCached ? '中文通用翻译已缓存' : '中文通用翻译未缓存'
      };

      // 测试3: 预加载当前语言
      results.push({
        test: '预加载当前语言翻译',
        status: 'running',
        timestamp: new Date().toISOString()
      });
      
      const preloadResult = await preloadCurrentLanguage();
      results[results.length - 1] = {
        ...results[results.length - 1],
        status: preloadResult.failed.length === 0 ? 'success' : 'warning',
        result: `成功: ${preloadResult.success.length}, 失败: ${preloadResult.failed.length}`
      };

      // 刷新状态
      await refreshCacheStatus();
      
      setTestResults(results);
    } catch (error) {
      results.push({
        test: '测试执行',
        status: 'error',
        timestamp: new Date().toISOString(),
        result: error instanceof Error ? error.message : '未知错误'
      });
      setTestResults(results);
    }
  };

  const clearDemo = async () => {
    try {
      await clearAllCache();
      setTestResults([]);
    } catch (error) {
      console.error('清除演示数据失败:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="luckymart-layout-flex gap-3">
        <button
          onClick={runDemo}
          className="px-4 py-2 bg-blue-600 text-white luckymart-rounded-lg hover:bg-blue-700"
        >
          运行演示
        </button>
        <button
          onClick={clearDemo}
          className="px-4 py-2 bg-gray-600 text-white luckymart-rounded-lg hover:bg-gray-700"
        >
          清除结果
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="luckymart-spacing-md">
          <h3 className="luckymart-font-medium">测试结果</h3>
          {testResults.map((result, index) => (
            <div key={index} className="p-3 luckymart-border luckymart-rounded-lg">
              <div className="luckymart-layout-flex luckymart-layout-center justify-between">
                <span className="luckymart-font-medium">{result.test}</span>
                <div className="luckymart-layout-flex luckymart-layout-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    result.status === 'success' ? 'bg-green-500' :
                    result.status === 'warning' ? 'bg-yellow-500' :
                    result.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="luckymart-text-sm luckymart-text-secondary">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div className="mt-2 luckymart-text-sm text-gray-600">
                {result.result}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="luckymart-text-sm luckymart-text-secondary">
        <p>• 点击"运行演示"来测试各项缓存功能</p>
        <p>• 演示会检查缓存状态、验证翻译文件并执行预加载</p>
        <p>• 结果会显示每个测试的详细状态和结果</p>
      </div>
    </div>
  );
}