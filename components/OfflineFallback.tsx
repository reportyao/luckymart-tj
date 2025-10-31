'use client';

// OfflineFallback.tsx - 离线降级组件
import React, { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useTranslation } from 'react-i18next';

interface OfflineFallbackProps {
  children: React.ReactNode; // 主要内容
  fallback?: React.ReactNode; // 离线时的降级内容
  loading?: React.ReactNode; // 加载状态内容
  showRetryButton?: boolean; // 是否显示重试按钮
  showRefreshButton?: boolean; // 是否显示刷新按钮
  onRetry?: () => void; // 重试回调
  onRefresh?: () => void; // 刷新回调
  maxRetries?: number; // 最大重试次数
  retryDelay?: number; // 重试延迟(ms)
  enableAutoRetry?: boolean; // 是否启用自动重试
  className?: string; // 自定义样式
  fallbackClassName?: string; // 降级内容样式
  loadingClassName?: string; // 加载内容样式
  position?: 'overlay' | 'inline' | 'fullscreen'; // 显示位置
  animation?: boolean; // 是否启用动画
}

// 重试状态
interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastRetryTime?: number;
  error?: string;
}

// 离线检测结果
interface OfflineDetectionResult {
  isOffline: boolean;
  networkQuality: string;
  offlineDuration: number;
  canRetry: boolean;
}

const OfflineFallback: React.FC<OfflineFallbackProps> = ({
  children,
  fallback,
  loading,
  showRetryButton = true,
  showRefreshButton = true,
  onRetry,
  onRefresh,
  maxRetries = 3,
  retryDelay = 2000,
  enableAutoRetry = false,
  className = '',
  fallbackClassName = '',
  loadingClassName = '',
  position = 'inline',
  animation = true
}) => {
  const { t } = useTranslation();
  const { 
    isOnline, 
    networkQuality, 
    networkStatus, 
    refreshNetworkStatus,
    getNetworkDiagnostics 
  } = useNetworkStatus();

  // 状态管理
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0
  });

  const [offlineDetection, setOfflineDetection] = useState<OfflineDetectionResult>({
    isOffline: !isOnline,
    networkQuality: networkQuality,
    offlineDuration: 0,
    canRetry: true
  });

  const [showDetails, setShowDetails] = useState(false);

  // 监听网络状态变化
  useEffect(() => {
    const currentOffline = !isOnline;
    const offlineDuration = currentOffline && networkStatus.lastOfflineTime 
      ? Date.now() - networkStatus.lastOfflineTime 
      : 0;

    setOfflineDetection(prev => ({
      ...prev,
      isOffline: currentOffline,
      networkQuality,
      offlineDuration,
      canRetry: retryState.retryCount < maxRetries && offlineDuration < 300000 // 5分钟内的离线可以重试
    }));

    // 如果网络恢复，重置重试状态
    if (isOnline && retryState.retryCount > 0) {
      setRetryState({
        isRetrying: false,
        retryCount: 0
      });
    }
  }, [isOnline, networkQuality, networkStatus, retryState.retryCount, maxRetries]);

  // 自动重试逻辑
  useEffect(() => {
    if (
      enableAutoRetry && 
      !isOnline && 
      !retryState.isRetrying && 
      offlineDetection.canRetry &&
      retryState.retryCount < maxRetries
    ) {
      const timer = setTimeout(() => {
        handleRetry();
      }, retryDelay);

      return () => clearTimeout(timer);
    }
  }, [enableAutoRetry, isOnline, retryState.isRetrying, offlineDetection.canRetry, retryState.retryCount, maxRetries, retryDelay]);

  // 手动重试
  const handleRetry = useCallback(async () => {
    if (retryState.isRetrying || !offlineDetection.canRetry) return;

    setRetryState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
      lastRetryTime: Date.now()
    }));

    try {
      await refreshNetworkStatus();
      onRetry?.();
    } catch (error) {
      setRetryState(prev => ({
        ...prev,
        isRetrying: false,
        error: error instanceof Error ? error.message : '重试失败'
      }));
    }
  }, [retryState.isRetrying, offlineDetection.canRetry, refreshNetworkStatus, onRetry]);

  // 手动刷新
  const handleRefresh = useCallback(async () => {
    try {
      await refreshNetworkStatus();
      onRefresh?.();
    } catch (error) {
      console.error('刷新失败:', error);
    }
  }, [refreshNetworkStatus, onRefresh]);

  // 格式化离线时长
  const formatOfflineDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    if (minutes > 0) {
      return t('offline.duration.minutes', '{{count}}分钟', { count: minutes });
    }
    return t('offline.duration.seconds', '{{count}}秒', { count: seconds });
  };

  // 获取网络状态描述
  const getNetworkStatusDescription = (): string => {
    if (!isOnline) {
      const duration = formatOfflineDuration(offlineDetection.offlineDuration);
      return t('offline.message', '网络连接已断开 ({{duration}})', { duration });
    }

    switch (networkQuality) {
      case 'excellent':
        return t('network.quality.excellent', '网络质量极佳');
      case 'good':
        return t('network.quality.good', '网络质量良好');
      case 'fair':
        return t('network.quality.fair', '网络质量一般');
      case 'poor':
        return t('network.quality.poor', '网络质量较差');
      default:
        return t('network.quality.unknown', '网络质量未知');
    }
  };

  // 获取离线降级内容
  const renderOfflineFallback = () => {
    if (fallback) {
      return fallback;
    }

    const diagnostics = getNetworkDiagnostics();
    
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${fallbackClassName}`}>
        <div className="space-y-4">
          {/* 图标和状态 */}
          <div className="luckymart-layout-flex justify-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full luckymart-layout-flex luckymart-layout-center justify-center">
              <span className="text-3xl">📱</span>
            </div>
          </div>
          
          {/* 状态信息 */}
          <div>
            <h3 className="luckymart-text-lg font-semibold text-gray-800 mb-2">
              {t('offline.title', '网络连接异常')}
            </h3>
            <p className="text-gray-600 mb-1">
              {getNetworkStatusDescription()}
            </p>
            {!isOnline && offlineDetection.offlineDuration > 0 && (
              <p className="luckymart-text-sm luckymart-text-secondary">
                {t('offline.duration', '离线时长: {{duration}}', { 
                  duration: formatOfflineDuration(offlineDetection.offlineDuration) 
                })}
              </p>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="luckymart-spacing-sm">
            {showRetryButton && offlineDetection.canRetry && (
              <button
                onClick={handleRetry}
                disabled={retryState.isRetrying}
                className="w-full luckymart-bg-primary text-white py-2 px-4 luckymart-rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {retryState.isRetrying ? 
                  t('offline.retrying', '重试中...') : 
                  t('offline.retry', '重试连接')
                }
              </button>
            )}
            
            {showRefreshButton && (
              <button
                onClick={handleRefresh}
                className="w-full bg-gray-500 text-white py-2 px-4 luckymart-rounded hover:bg-gray-600 transition-colors"
              >
                {t('offline.refresh', '刷新页面')}
              </button>
            )}
          </div>

          {/* 错误信息 */}
          {retryState.error && (
            <div className="text-red-600 luckymart-text-sm">
              {retryState.error}
            </div>
          )}

          {/* 详情切换 */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="luckymart-text-primary luckymart-text-sm hover:text-blue-700 underline"
          >
            {showDetails ? 
              t('offline.hideDetails', '隐藏详情') : 
              t('offline.showDetails', '显示详情')
            }
          </button>

          {/* 详细信息 */}
          {showDetails && (
            <div className="luckymart-spacing-md luckymart-padding-md luckymart-bg-gray-light luckymart-rounded text-left luckymart-text-sm">
              <h4 className="font-semibold mb-2">{t('offline.diagnostics', '网络诊断')}</h4>
              <ul className="space-y-1 text-gray-600">
                <li>{t('offline.status', '状态')}: {!isOnline ? t('offline.disconnected', '未连接') : t('offline.connected', '已连接')}</li>
                <li>{t('offline.quality', '网络质量')}: {networkQuality}</li>
                <li>{t('offline.retryCount', '重试次数')}: {retryState.retryCount}/{maxRetries}</li>
                {diagnostics.connectionInfo && (
                  <li>{t('offline.connectionType', '连接类型')}: {diagnostics.connectionInfo.effectiveType}</li>
                )}
              </ul>
              
              {diagnostics.recommendations.length > 0 && (
                <div className="mt-2">
                  <span className="font-semibold">{t('offline.recommendations', '建议')}:</span>
                  <ul className="list-disc list-inside mt-1">
                    {diagnostics.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 获取加载内容
  const renderLoading = () => {
    if (loading) {
      return loading;
    }

    return (
      <div className={`flex items-center justify-center p-8 ${loadingClassName}`}>
        <div className="luckymart-layout-flex flex-col luckymart-layout-center luckymart-spacing-md">
          <div className={`w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full ${
            animation ? 'animate-spin' : ''
          }`}></div>
          <span className="text-gray-600">
            {t('offline.loading', '加载中...')}
          </span>
        </div>
      </div>
    );
  };

  // 主要渲染逻辑
  if (position === 'fullscreen') {
    return (
      <div className={`fixed inset-0 z-50 ${className}`}>
        {!isOnline && !retryState.isRetrying ? renderOfflineFallback() : children}
        {retryState.isRetrying && renderLoading()}
      </div>
    );
  }

  if (position === 'overlay') {
    return (
      <div className={`relative ${className}`}>
        {children}
        {!isOnline && !retryState.isRetrying && (
          <div className={`absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center ${animation ? 'transition-opacity duration-300' : ''}`}>
            {renderOfflineFallback()}
          </div>
        )}
        {retryState.isRetrying && renderLoading()}
      </div>
    );
  }

  // inline 模式（默认）
  return (
    <div className={className}>
      {!isOnline && !retryState.isRetrying ? renderOfflineFallback() : children}
      {retryState.isRetrying && renderLoading()}
    </div>
  );
};

export default OfflineFallback;