'use client';

// NetworkStatusIndicator.tsx - 网络状态指示器组件
import React, { useState, useMemo } from 'react';
import { useNetworkIndicator, useNetworkStatus } from '@/hooks/use-network-status';
import { NetworkQuality } from '@/utils/network-retry';
import { useTranslation } from 'react-i18next';

interface NetworkStatusIndicatorProps {
  variant?: 'icon' | 'text' | 'full'; // 显示变体
  showDetails?: boolean; // 是否显示详细信息
  showTooltip?: boolean; // 是否显示工具提示
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'; // 位置
  className?: string; // 自定义样式
  refreshable?: boolean; // 是否可刷新
  onRefresh?: () => void; // 刷新回调
  size?: 'small' | 'medium' | 'large'; // 尺寸
  animated?: boolean; // 是否显示动画
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  variant = 'icon',
  showDetails = false,
  showTooltip = true,
  position = 'top-right',
  className = '',
  refreshable = false,
  onRefresh,
  size = 'medium',
  animated = true
}) => {
  const { t } = useTranslation();
  const { indicator, networkStatus, isOnline, networkQuality } = useNetworkIndicator();
  const { refreshNetworkStatus, getNetworkDiagnostics } = useNetworkStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  // 尺寸样式
  const sizeStyles = {
    small: {
      container: 'w-6 h-6',
      icon: 'text-xs',
      text: 'text-xs'
    },
    medium: {
      container: 'w-8 h-8',
      icon: 'text-sm',
      text: 'text-sm'
    },
    large: {
      container: 'w-10 h-10',
      icon: 'text-base',
      text: 'text-base'
    }
  };

  // 位置样式
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  // 颜色样式
  const colorStyles = {
    green: 'bg-green-500 hover:bg-green-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    red: 'bg-red-500 hover:bg-red-600',
    gray: 'bg-gray-500 hover:bg-gray-600'
  };

  // 网络质量图标
  const getNetworkIcon = (quality: NetworkQuality, isOnline: boolean) => {
    if (!isOnline) return '📵';
    
    switch (quality) {
      case NetworkQuality.EXCELLENT:
        return '📶';
      case NetworkQuality.GOOD:
        return '📶';
      case NetworkQuality.FAIR:
        return '📶';
      case NetworkQuality.POOR:
        return '📶';
      default:
        return '📶';
    }
  };

  // 处理刷新
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshNetworkStatus();
      onRefresh?.();
    } catch (error) {
      console.error('网络状态刷新失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 获取详细状态信息
  const getDetailedStatus = () => {
    const diagnostics = getNetworkDiagnostics();
    
    return {
      isOnline: networkStatus.isOnline,
      quality: networkQuality,
      connectionType: networkStatus.connectionType || t('network.unknown', '未知'),
      downlink: networkStatus.downlink ? `${networkStatus.downlink} Mbps` : t('network.unknown', '未知'),
      rtt: networkStatus.rtt ? `${networkStatus.rtt}ms` : t('network.unknown', '未知'),
      saveData: networkStatus.saveData ? t('network.enabled', '已启用') : t('network.disabled', '已禁用'),
      lastOnlineTime: networkStatus.lastOnlineTime ? 
        new Date(networkStatus.lastOnlineTime).toLocaleTimeString() : 
        t('network.never', '从未'),
      recommendations: diagnostics.recommendations
    };
  };

  // 渲染工具提示内容
  const renderTooltip = () => {
    const detailedStatus = getDetailedStatus();
    
    return (
      <div className="bg-gray-800 text-white p-3 luckymart-rounded-lg luckymart-shadow-lg text-xs min-w-48">
        <div className="space-y-1">
          <div className="luckymart-layout-flex justify-between">
            <span>{t('network.status', '网络状态')}:</span>
            <span className={`font-semibold ${
              detailedStatus.isOnline ? 'text-green-400' : 'text-red-400'
            }`}>
              {detailedStatus.isOnline ? t('network.online', '在线') : t('network.offline', '离线')}
            </span>
          </div>
          
          {detailedStatus.isOnline && (
            <>
              <div className="luckymart-layout-flex justify-between">
                <span>{t('network.quality', '网络质量')}:</span>
                <span className={`font-semibold ${
                  networkQuality === NetworkQuality.EXCELLENT ? 'text-green-400' :
                  networkQuality === NetworkQuality.GOOD ? 'text-blue-400' :
                  networkQuality === NetworkQuality.FAIR ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {t(`network.quality.${networkQuality}`, networkQuality)}
                </span>
              </div>
              
              {detailedStatus.connectionType !== t('network.unknown', '未知') && (
                <div className="luckymart-layout-flex justify-between">
                  <span>{t('network.type', '网络类型')}:</span>
                  <span className="text-gray-300">{detailedStatus.connectionType}</span>
                </div>
              )}
              
              {detailedStatus.downlink !== t('network.unknown', '未知') && (
                <div className="luckymart-layout-flex justify-between">
                  <span>{t('network.downlink', '下行带宽')}:</span>
                  <span className="text-gray-300">{detailedStatus.downlink}</span>
                </div>
              )}
            </>
          )}
          
          {detailedStatus.recommendations.length > 0 && (
            <div className="border-t border-gray-600 pt-1">
              <div className="font-semibold text-yellow-400">{t('network.recommendations', '建议')}:</div>
              <ul className="text-gray-300 ml-2">
                {detailedStatus.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染详情面板
  const renderDetailsPanel = () => {
    const detailedStatus = getDetailedStatus();
    
    return (
      <div className="luckymart-bg-white luckymart-border luckymart-border-light luckymart-rounded-lg luckymart-shadow-lg luckymart-padding-md luckymart-text-sm">
        <div className="luckymart-spacing-md">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between">
            <h3 className="font-semibold text-gray-800">{t('network.details', '网络详情')}</h3>
            <button
              onClick={() => setShowDetailsPanel(false)}
              className="luckymart-text-secondary hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">{t('network.status', '状态')}:</span>
              <div className={`font-semibold ${
                detailedStatus.isOnline ? 'text-green-600' : 'text-red-600'
              }`}>
                {detailedStatus.isOnline ? t('network.online', '在线') : t('network.offline', '离线')}
              </div>
            </div>
            
            {detailedStatus.isOnline && (
              <>
                <div>
                  <span className="text-gray-600">{t('network.quality', '质量')}:</span>
                  <div className={`font-semibold ${
                    networkQuality === NetworkQuality.EXCELLENT ? 'text-green-600' :
                    networkQuality === NetworkQuality.GOOD ? 'text-blue-600' :
                    networkQuality === NetworkQuality.FAIR ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {t(`network.quality.${networkQuality}`, networkQuality)}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-600">{t('network.type', '类型')}:</span>
                  <div className="text-gray-800">{detailedStatus.connectionType}</div>
                </div>
                
                <div>
                  <span className="text-gray-600">{t('network.downlink', '带宽')}:</span>
                  <div className="text-gray-800">{detailedStatus.downlink}</div>
                </div>
                
                <div>
                  <span className="text-gray-600">{t('network.rtt', '延迟')}:</span>
                  <div className="text-gray-800">{detailedStatus.rtt}</div>
                </div>
                
                <div>
                  <span className="text-gray-600">{t('network.saveData', '数据节省')}:</span>
                  <div className="text-gray-800">{detailedStatus.saveData}</div>
                </div>
              </>
            )}
            
            <div>
              <span className="text-gray-600">{t('network.lastOnline', '最后在线')}:</span>
              <div className="text-gray-800">{detailedStatus.lastOnlineTime}</div>
            </div>
          </div>
          
          {detailedStatus.recommendations.length > 0 && (
            <div className="border-t pt-3">
              <span className="text-gray-600 font-semibold">{t('network.recommendations', '建议')}:</span>
              <ul className="text-gray-700 mt-1 ml-4">
                {detailedStatus.recommendations.map((rec, index) => (
                  <li key={index} className="list-disc">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
          
          {refreshable && (
            <div className="border-t pt-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full luckymart-bg-primary text-white py-2 px-4 luckymart-rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefreshing ? t('network.refreshing', '刷新中...') : t('network.refresh', '刷新状态')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 基础指示器
  const renderIndicator = () => {
    const baseClasses = `
      ${sizeStyles[size].container} 
      ${colorStyles[indicator.color]}
      ${animated ? 'transition-all duration-300' : ''}
      ${className}
      rounded-full 
      flex items-center justify-center 
      cursor-pointer 
      shadow-lg
      hover:shadow-xl
      relative
    `;

    switch (variant) {
      case 'icon':
        return (
          <div className={baseClasses} title={indicator.text}>
            <span className={`${sizeStyles[size].icon} ${animated ? 'animate-pulse' : ''}`}>
              {getNetworkIcon(networkQuality, isOnline)}
            </span>
          </div>
        );

      case 'text':
        return (
          <div className={`${baseClasses} px-3`}>
            <span className={`${sizeStyles[size].text} text-white font-medium`}>
              {indicator.text}
            </span>
          </div>
        );

      case 'full':
        return (
          <div className={`${baseClasses} px-3 space-x-2`}>
            <span className={`${sizeStyles[size].icon}`}>
              {getNetworkIcon(networkQuality, isOnline)}
            </span>
            <span className={`${sizeStyles[size].text} text-white font-medium`}>
              {indicator.text}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  // 主要渲染
  return (
    <div className={`fixed z-50 ${positionStyles[position]}`}>
      {/* 详情面板 */}
      {showDetailsPanel && (
        <div className={`absolute ${position.includes('bottom') ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
          {renderDetailsPanel()}
        </div>
      )}
      
      {/* 工具提示 */}
      {showTooltip && !showDetailsPanel && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {renderTooltip()}
        </div>
      )}
      
      {/* 主指示器 */}
      <div className="group">
        {renderIndicator()}
        
        {/* 点击处理 */}
        {(showDetails || refreshable) && (
          <div
            onClick={() => {
              if (showDetails) {
                setShowDetailsPanel(!showDetailsPanel);
              } else if (refreshable && onRefresh) {
                handleRefresh();
              }
            }}
            className="absolute inset-0 cursor-pointer"
          />
        )}
      </div>
    </div>
  );
};

export default NetworkStatusIndicator;