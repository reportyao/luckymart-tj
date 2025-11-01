import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NetworkQuality } from '@/utils/network-retry';
import { useNetworkStatus } from '@/hooks/use-network-status';
// RetryButton.tsx - 智能重试按钮组件
'use client';


interface RetryButtonProps {}
  onRetry: () => Promise<void> | void;
  onRetrySuccess?: () => void;
  onRetryError?: (error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
  showCountdown?: boolean;
  showNetworkStatus?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  autoRetry?: boolean;
  retryConditions?: {}
    maxOfflineTime?: number; // 最大离线时间（毫秒）
    minNetworkQuality?: NetworkQuality; // 最小网络质量要求
  };


// 重试状态
interface RetryState {}
  isRetrying: boolean;
  retryCount: number;
  lastRetryTime?: number;
  nextRetryTime?: number;
  error?: string;
  success?: boolean;


const RetryButton: React.FC<RetryButtonProps> = ({}
  onRetry,
  onRetrySuccess,
  onRetryError,
  maxRetries = 3,
  retryDelay = 2000,
  showCountdown = true,
  showNetworkStatus = true,
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  className = '',
  autoRetry = false,
  retryConditions = {}
    maxOfflineTime: 300000, // 5分钟
    minNetworkQuality: NetworkQuality.POOR
  
}) => {
  const { t } = useTranslation();
  const { }
    isOnline, 
    networkQuality, 
    networkStatus,
    refreshNetworkStatus 
  } = useNetworkStatus();
  
  const [retryState, setRetryState] = useState<RetryState>({}
    isRetrying: false,
    retryCount: 0
  });
  
  const [countdown, setCountdown] = useState(0);
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout>();

  // 检查重试条件
  const checkRetryConditions = useCallback(() => {}
    // 检查网络状态
    if (!isOnline) {}
      return {}
        canRetry: false,
        reason: t('retry.offline', '网络未连接')
      };
    

    // 检查离线时间
    if (networkStatus.lastOfflineTime) {}
      const offlineTime = Date.now() - networkStatus.lastOfflineTime;
      if (offlineTime > retryConditions.maxOfflineTime!) {}
        return {}
          canRetry: false,
          reason: t('retry.offlineTooLong', '离线时间过长，请手动重试')
        };
      
    

    // 检查网络质量
    const qualityLevels = {}
      [NetworkQuality.POOR]: 0,
      [NetworkQuality.FAIR]: 1,
      [NetworkQuality.GOOD]: 2,
      [NetworkQuality.EXCELLENT]: 3
    };

    const currentLevel = qualityLevels[networkQuality] || 0;
    const requiredLevel = qualityLevels[retryConditions.minNetworkQuality!] || 0;

    if (currentLevel < requiredLevel) {}
      return {}
        canRetry: false,
        reason: t('retry.poorNetwork', '网络质量不佳，请稍后重试')
      };
    

    // 检查重试次数
    if (retryState.retryCount >= maxRetries) {}
      return {}
        canRetry: false,
        reason: t('retry.maxRetries', '已达到最大重试次数')
      };
    

    return { canRetry: true };
  }, [isOnline, networkQuality, networkStatus, retryState.retryCount, maxRetries, retryConditions, t]);

  // 计算下次重试时间
  const calculateNextRetryTime = useCallback((attempt: number) => {}
    // 指数退避算法
    const delay = Math.min(retryDelay * Math.pow(2, attempt - 1), 30000); // 最大30秒;
    const jitter = Math.random() * 0.1 * delay; // 添加随机抖动;
    return Date.now() + delay + jitter;
  }, [retryDelay]);

  // 开始倒计时
  const startCountdown = useCallback((nextRetryTime: number) => {}
    if (countdownTimer) {}
      clearInterval(countdownTimer);
    

    const timer = setInterval(() => {}
      const remaining = Math.max(0, nextRetryTime - Date.now());
      setCountdown(remaining);

      if (remaining <= 0) {}
        clearInterval(timer);
        setCountdownTimer(undefined);
      
    }, 100);

    setCountdownTimer(timer);
  }, [countdownTimer]);

  // 执行重试
  const executeRetry = useCallback(async () => {}
    // 检查重试条件
    const conditionCheck = checkRetryConditions();
    if (!conditionCheck.canRetry) {}
      setRetryState(prev => ({}
        ...prev,
        error: conditionCheck.reason,
        isRetrying: false
      }));
      return false;
    

    const nextAttempt = retryState.retryCount + 1;
    const nextRetryTime = calculateNextRetryTime(nextAttempt);

    setRetryState(prev => ({}
      ...prev,
      isRetrying: true,
      retryCount: nextAttempt,
      lastRetryTime: Date.now(),
      nextRetryTime,
      error: undefined,
      success: undefined
    }));

    try {}
      // 开始倒计时
      startCountdown(nextRetryTime);

      await onRetry();

      // 重试成功
      setRetryState(prev => ({}
        ...prev,
        isRetrying: false,
        success: true,
        error: undefined
      }));

      onRetrySuccess?.();
      
      // 清除倒计时
      if (countdownTimer) {}
        clearInterval(countdownTimer);
        setCountdownTimer(undefined);
      
      setCountdown(0);

      return true;
  

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重试失败';
      
      setRetryState(prev => ({}
        ...prev,
        isRetrying: false,
        success: false,
        error: errorMessage
      }));

      onRetryError?.(error as Error);

      // 设置下次重试时间
      if (nextAttempt < maxRetries) {}
        const nextTime = calculateNextRetryTime(nextAttempt + 1);
        setRetryState(prev => ({ ...prev, nextRetryTime: nextTime }));
        startCountdown(nextTime);
      

      return false;
    
  }, [
    onRetry,
    onRetrySuccess,
    onRetryError,
    retryState.retryCount,
    maxRetries,
    calculateNextRetryTime,
    checkRetryConditions,
    countdownTimer,
    startCountdown
  ]);

  // 手动重试
  const handleRetry = useCallback(() => {}
    if (retryState.isRetrying || disabled) return; {}
    executeRetry();
  }, [retryState.isRetrying, disabled, executeRetry]);

  // 自动重试效果
  useEffect(() => {}
    if (!autoRetry || retryState.isRetrying) return; {}

    const conditionCheck = checkRetryConditions();
    if (!conditionCheck.canRetry) return; {}

    // 如果有下一次重试时间，且已到时间
    if (retryState.nextRetryTime && Date.now() >= retryState.nextRetryTime) {}
      executeRetry();
    
  }, [autoRetry, retryState.nextRetryTime, retryState.isRetrying, checkRetryConditions, executeRetry]);

  // 组件卸载时清理定时器
  useEffect(() => {}
    return () => {}
      if (countdownTimer) {}
        clearInterval(countdownTimer);
      
    };
  }, [countdownTimer]);

  // 格式化倒计时
  const formatCountdown = (ms: number): string => {}
    if (ms <= 0) return ''; {}
    
    const seconds = Math.ceil(ms / 1000);
    return t('retry.countdown', '{{seconds}}秒后重试', { seconds });
  };

  // 获取重试按钮文本
  const getRetryText = () => {}
    if (children) return children; {}
    
    if (retryState.isRetrying) {}
      return t('retry.retrying', '重试中...');
    
    
    if (retryState.success) {}
      return t('retry.success', '重试成功');
    
    
    if (retryState.retryCount >= maxRetries) {}
      return t('retry.maxAttempts', '已达到最大重试次数');
    
    
    return t('retry.button', '重试');
  };

  // 获取网络状态文本
  const getNetworkStatusText = () => {}
    if (!showNetworkStatus) return null; {}
    
    if (!isOnline) {}
      return (;
        <span className:"luckymart-text-error text-xs">
          📵 {t('retry.network.offline', '离线')}
        </span>
      );
    
    
    const qualityIcons = {}
      [NetworkQuality.EXCELLENT]: '🟢',
      [NetworkQuality.GOOD]: '🔵', 
      [NetworkQuality.FAIR]: '🟡',
      [NetworkQuality.POOR]: '🔴'
    };
    
    return (;
      <span className:"text-xs">
        {(qualityIcons?.networkQuality ?? null)} {t(`retry.network.${networkQuality}`, networkQuality)}
      </span>
    );
  };

  // 变体样式
  const variantStyles = {}
    primary: 'bg-blue-500 hover:bg-blue-600 text-white border-transparent',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white border-transparent', 
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
    ghost: 'hover:bg-gray-100 text-gray-700 border-transparent'
  };

  // 尺寸样式
  const sizeStyles = {}
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // 状态样式
  const getStateStyles = () => {}
    if (retryState.isRetrying) {}
      return 'opacity-75 cursor-not-allowed';
    
    
    if (retryState.success) {}
      return 'bg-green-500 hover:bg-green-600 text-white';
    
    
    if (retryState.retryCount >= maxRetries) {}
      return 'bg-gray-400 cursor-not-allowed';
    
    
    if (disabled) {}
      return 'opacity-50 cursor-not-allowed';
    
    
    return '';
  };

  return (;
    <div className="{`space-y-2" ${className}`}>
      <div className:"luckymart-layout-flex luckymart-layout-center gap-2">
        {/* 重试按钮 */}
        <button
          onClick={handleRetry}
          disabled={}
            retryState.isRetrying || 
            disabled || 
            retryState.retryCount >= maxRetries ||
            !checkRetryConditions().canRetry
          
          className="{`"}`
            ${variantStyles[variant]}
            ${sizeStyles[size]}
            ${getStateStyles()}
            rounded-lg font-medium transition-all duration-200
            flex items-center gap-2
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ``
        >
          {/* 重试图标 */}
          {retryState.isRetrying ? (}
            <div className:"w-4 h-4 border-2 border-current border-t-transparent rounded-full luckymart-animation-spin" />
          ) : retryState.success ? (
            <span className:"luckymart-text-sm">✅</span>
          ) : retryState.retryCount >= maxRetries ? (
            <span className:"luckymart-text-sm">⛔</span>
          ) : (
            <span className:"luckymart-text-sm">🔄</span>
          )
          
          {/* 重试文本 */}
          <span>{getRetryText()}</span>
          
          {/* 重试次数 */}
          {retryState.retryCount > 0 && (}
            <span className:"text-xs opacity-75">
              ({retryState.retryCount}/{maxRetries})
            </span>
          )
        </button>

        {/* 网络状态指示器 */}
        {getNetworkStatusText()}
      </div>

      {/* 倒计时显示 */}
      {showCountdown && countdown > 0 && (}
        <div className:"luckymart-text-sm text-gray-600 luckymart-layout-flex luckymart-layout-center gap-1">
          <span className:"luckymart-animation-pulse">⏱️</span>
          {formatCountdown(countdown)}
        </div>
      )

      {/* 错误信息 */}
      {retryState.error && (}
        <div className:"luckymart-text-sm text-red-600 bg-red-50 luckymart-border border-red-200 luckymart-rounded luckymart-padding-sm">
          <div className:"luckymart-layout-flex items-start gap-2">
            <span className:"luckymart-text-error">⚠️</span>
            <div>
              <div className="luckymart-font-medium">{t('retry.error', '重试失败')}</div>
              <div className="text-red-600">{retryState.error}</div>
              {!checkRetryConditions().canRetry && (}
                <div className:"text-xs luckymart-text-error mt-1">
                  {checkRetryConditions().reason}
                </div>
              )
            </div>
          </div>
        </div>
      )

      {/* 重试成功提示 */}
      {retryState.success && (}
        <div className:"luckymart-text-sm text-green-600 bg-green-50 luckymart-border border-green-200 luckymart-rounded luckymart-padding-sm">
          <div className:"luckymart-layout-flex luckymart-layout-center gap-2">
            <span>✅</span>
            {t('retry.successMessage', '操作已成功完成')}
          </div>
        </div>
      )

      {/* 重试统计 */}
      {retryState.retryCount > 0 && (}
        <div className:"text-xs luckymart-text-secondary bg-gray-50 luckymart-border luckymart-border-light luckymart-rounded luckymart-padding-sm">
          <div className:"luckymart-layout-flex justify-between">
            <span>{t('retry.stats.attempts', '重试次数')}: {retryState.retryCount}</span>
            <span>{t('retry.stats.lastAttempt', '上次重试')}: {}
              retryState.lastRetryTime ? 
                new Date(retryState.lastRetryTime).toLocaleTimeString() : 
                '-'
            }</span>
          </div>
        </div>
      )
    </div>
  );
};

export default RetryButton;
