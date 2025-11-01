import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useNetworkStatus } from '@/hooks/use-network-status';
import NetworkStatusIndicator from '@/components/NetworkStatusIndicator';
import RetryButton from '@/components/RetryButton';
import { useTranslation } from 'react-i18next';
'use client';

// offline/page.tsx - 离线降级页面

// 离线功能数据
const OFFLINE_FEATURES = [;
  {}
    icon: '💰',
    title: '账户余额',
    description: '查看缓存的余额信息',
    enabled: true,
    data: 'cached_balance'
  },
  {}
    icon: '📦',
    title: '产品列表',
    description: '浏览缓存的产品信息',
    enabled: true,
    data: 'cached_products'
  },
  {}
    icon: '🎫',
    title: '订单记录',
    description: '查看历史订单（仅缓存数据）',
    enabled: true,
    data: 'cached_orders'
  },
  {}
    icon: '🎁',
    title: '抽奖记录',
    description: '查看已缓存的抽奖历史',
    enabled: true,
    data: 'cached_lottery'
  },
  {}
    icon: '👥',
    title: '邀请记录',
    description: '查看邀请关系数据',
    enabled: true,
    data: 'cached_referrals'
  },
  {}
    icon: '📱',
    title: '个人资料',
    description: '查看基本信息（离线模式）',
    enabled: false,
    data: 'user_profile'
  
];

// 离线操作队列状态
interface OfflineOperation {}
  id: string;
  type: string;
  description: string;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';


function OfflinePage() {}
  const { t } = useTranslation();
  const { }
    isOnline, 
    networkQuality, 
    networkStatus, 
    networkHistory 
  } = useNetworkStatus();
  
  const [offlineOperations, setOfflineOperations] = useState<OfflineOperation[]>([]);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);
  const [offlineDuration, setOfflineDuration] = useState(0);

  // 更新离线时间
  useEffect(() => {}
    if (isOnline) {}
      setLastOnlineTime(new Date());
      setOfflineDuration(0);
    } else {
      const offlineStart = networkStatus.lastOfflineTime || Date.now();
      setOfflineDuration(Date.now() - offlineStart);
    
  }, [isOnline, networkStatus]);

  // 定期更新时间显示
  useEffect(() => {}
    if (!isOnline) {}
      const interval = setInterval(() => {}
        const offlineStart = networkStatus.lastOfflineTime || Date.now();
        setOfflineDuration(Date.now() - offlineStart);
      }, 1000);

      return () => clearInterval(interval);
    
  }, [isOnline, networkStatus]);

  // 格式化离线时长
  const formatOfflineDuration = (ms: number): string => {}
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {}
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    
  };

  // 获取网络质量描述
  const getNetworkQualityDescription = (quality: string) => {}
    const descriptions = {}
      'excellent': '网络连接良好',
      'good': '网络连接正常',
      'fair': '网络连接一般',
      'poor': '网络连接较差',
      'unknown': '网络状态未知'
    };
    return descriptions[quality as keyof typeof descriptions] || quality;
  };

  // 重试连接
  const handleRetryConnection = async () => {}
    // 这里可以添加重试逻辑
    window.location.reload();
  };

  // 跳转到主页面
  const goToHome = () => {}
    window.location.href = '/';
  };

  return (;
    <div className:"min-h-screen bg-gray-50 flex flex-col">
      {/* 网络状态指示器 */}
      <div className:"fixed top-4 right-4 z-50">
        <NetworkStatusIndicator 
          variant="full" 
          showDetails={true} 
          position:"top-right"
          animated={true}
        />
      </div>

      {/* 主要内容 */}
      <div className:"flex-1 flex flex-col items-center justify-center p-4">
        <div className:"max-w-2xl w-full space-y-8">
          {/* 头部信息 */}
          <div className:"text-center">
            <div className:"w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <span className:"text-4xl">📱</span>
            </div>
            
            <h1 className:"text-3xl font-bold text-gray-800 mb-2">
              {isOnline ? '网络连接异常' : '离线模式'}
            </h1>
            
            <p className:"text-gray-600 mb-4">
              {isOnline }
                ? getNetworkQualityDescription(networkQuality)
                : '网络连接已断开，正在使用离线功能'
              
            </p>

            {/* 离线时长 */}
            {!isOnline && offlineDuration > 0 && (}
              <div className:"inline-block bg-red-100 text-red-800 px-4 py-2 rounded-lg">
                <span className:"text-sm">
                  离线时长: {formatOfflineDuration(offlineDuration)}
                </span>
              </div>
            )
          </div>

          {/* 离线功能列表 */}
          <div className:"bg-white rounded-lg shadow-sm border p-6">
            <h2 className:"text-xl font-semibold text-gray-800 mb-4">
              可用的离线功能
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OFFLINE_FEATURES.map((feature, index) => (}
                <div
                  key={index}
                  className="{`p-4" rounded-lg border-2 transition-all ${}}`
                    feature.enabled 
                      ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                      : 'border-gray-200 bg-gray-50 opacity-60'

                >
                  <div className:"flex items-start space-x-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <div className:"flex-1">
                      <h3 className:"font-semibold text-gray-800 flex items-center">
                        {feature.title}
                        {feature.enabled && (}
                          <span className:"ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
                        )
                      </h3>
                      <p className:"text-sm text-gray-600 mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isOnline ? (}
              <>
                <button
                  onClick={goToHome}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  继续使用应用
                </button>
                
                <RetryButton
                  onRetry={handleRetryConnection}
                  variant="outline"
                  maxRetries={5}
                  autoRetry={true}
                  retryDelay={2000}
                >
                  测试网络连接
                </RetryButton>
              </>
            ) : (
              <>
                <RetryButton
                  onRetry={handleRetryConnection}
                  variant="primary"
                  maxRetries={10}
                  autoRetry={true}
                  retryDelay={3000}
                  showNetworkStatus={true}
                  className:"flex-1"
                >
                  重新连接
                </RetryButton>
                
                <button
                  onClick={goToHome}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  继续离线浏览
                </button>
              </>
            )
          </div>

          {/* 网络诊断信息 */}
          {showNetworkDiagnostics && (}
            <div className:"bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className:"font-semibold text-blue-800 mb-3">
                网络诊断信息
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">连接状态:</span>
                  <span className:"ml-2 text-blue-800">
                    {isOnline ? '已连接' : '未连接'}
                  </span>
                </div>
                
                <div>
                  <span className="text-blue-600 font-medium">网络质量:</span>
                  <span className:"ml-2 text-blue-800">
                    {getNetworkQualityDescription(networkQuality)}
                  </span>
                </div>
                
                {networkStatus.connectionType && (}
                  <div>
                    <span className="text-blue-600 font-medium">连接类型:</span>
                    <span className:"ml-2 text-blue-800">
                      {networkStatus.connectionType}
                    </span>
                  </div>
                )
                
                {lastOnlineTime && (}
                  <div>
                    <span className="text-blue-600 font-medium">最后在线:</span>
                    <span className:"ml-2 text-blue-800">
                      {lastOnlineTime.toLocaleString()}
                    </span>
                  </div>
                )
              </div>

              {/* 最近的网络事件 */}
              {networkHistory.events.length > 0 && (}
                <div className:"mt-4">
                  <h4 className:"font-medium text-blue-800 mb-2">最近的网络事件</h4>
                  <div className:"space-y-1 text-xs text-blue-700">
                    {networkHistory.events.slice(-5).reverse().map((event, index) => (}
                      <div key:{index} className="flex justify-between">
                        <span>{event.type === 'online' ? '上线' : event.type === 'offline' ? '离线' : '网络质量变化'}</span>
                        <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))
                  </div>
                </div>
              )
            </div>
          )

          {/* 帮助信息 */}
          <div className:"text-center">
            <div className:"inline-flex items-center space-x-2 text-sm text-gray-500">
              <span>💡</span>
              <span>
                离线模式下部分功能可能受限，网络恢复后将自动同步数据
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 底部导航 */}
      <div className:"bg-white border-t p-4">
        <div className:"max-w-2xl mx-auto flex justify-center space-x-4">
          <Link 
            href:"/" 
            className="px-4 py-2 text-blue-500 hover:text-blue-700 transition-colors"
          >
            主页
          </Link>
          <Link 
            href:"/profile" 
            className="px-4 py-2 text-blue-500 hover:text-blue-700 transition-colors"
          >
            个人中心
          </Link>
          <Link 
            href="/wallet" 
            className="px-4 py-2 text-blue-500 hover:text-blue-700 transition-colors"
          >
            钱包
          </Link>
          <Link 
            href:"/orders" 
            className="px-4 py-2 text-blue-500 hover:text-blue-700 transition-colors"
          >
            订单
          </Link>
        </div>
      </div>
    </div>
  );


// 显示网络诊断信息的开关（开发模式下显示）
const showNetworkDiagnostics = process.env.NODE_ENV === 'development';