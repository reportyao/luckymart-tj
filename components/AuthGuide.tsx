'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, RefreshCw, Clock } from 'lucide-react';

interface AuthStatus {
  state: 'preparing' | 'validating' | 'retrying' | 'completed' | 'error';
  message: string;
  progress: number;
  canRetry?: boolean;
  errorCode?: string;
  action?: string;
}

interface AuthGuideProps {
  onStatusChange?: (status: AuthStatus) => void;
  onRetry?: () => void;
}

const AuthGuide: React.FC<AuthGuideProps> = ({ onStatusChange, onRetry }) => {
  const [status, setStatus] = useState<AuthStatus>({
    state: 'preparing',
    message: '正在准备安全验证...',
    progress: 10
  });

  // 模拟认证进度更新
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    // 更新状态时通知父组件
    onStatusChange?.(status);
    
    return () => {
      intervals.forEach(clearInterval);
    };
  }, [status, onStatusChange]);

  const updateStatus = (newStatus: Partial<AuthStatus>) => {
    setStatus(prev => ({ ...prev, ...newStatus }));
  };

  const getStatusIcon = () => {
    switch (status.state) {
      case 'preparing':
      case 'validating':
      case 'retrying':
        return <Loader2 className="animate-spin h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status.state) {
      case 'preparing':
      case 'validating':
      case 'retrying':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getProgressColor = () => {
    switch (status.state) {
      case 'preparing':
      case 'validating':
      case 'retrying':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleRetry = () => {
    updateStatus({
      state: 'retrying',
      message: '正在重新验证...',
      progress: 30,
      canRetry: false
    });
    
    onRetry?.();
  };

  return (
    <div className={`max-w-md mx-auto p-6 rounded-lg border-2 ${getStatusColor()} transition-all duration-300`}>
      {/* 状态图标和消息 */}
      <div className="flex items-center space-x-3 mb-4">
        {getStatusIcon()}
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{status.message}</h3>
          {status.action && (
            <p className="text-sm text-gray-600 mt-1">{status.action}</p>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">验证进度</span>
          <span className="text-sm text-gray-500">{status.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>

      {/* 错误信息和重试按钮 */}
      {status.state === 'error' && (
        <div className="space-y-3">
          <div className="bg-red-100 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">
              登录验证出现问题，我们正在优化验证流程
            </p>
          </div>
          
          {status.canRetry !== false && (
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>重新尝试</span>
            </button>
          )}
          
          <p className="text-xs text-gray-500 text-center">
            如问题持续，请联系客服支持
          </p>
        </div>
      )}

      {/* 成功信息 */}
      {status.state === 'completed' && (
        <div className="bg-green-100 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-700">
            登录验证成功！正在为您准备个性化体验...
          </p>
        </div>
      )}

      {/* 状态详情 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>
              {status.state === 'preparing' && '准备验证环境'}
              {status.state === 'validating' && '验证身份信息'}
              {status.state === 'retrying' && '智能重试中'}
              {status.state === 'completed' && '验证完成'}
              {status.state === 'error' && '遇到问题'}
            </span>
          </span>
          
          {status.errorCode && (
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
              {status.errorCode}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// 认证状态管理器
export class AuthStatusManager {
  private callbacks: ((status: AuthStatus) => void)[] = [];

  updateStatus(status: Partial<AuthStatus>) {
    this.callbacks.forEach(callback => callback(status as AuthStatus));
  }

  onStatusChange(callback: (status: AuthStatus) => void) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
}

// 预设状态配置
export const AUTH_STATUS_PRESETS = {
  preparing: {
    state: 'preparing' as const,
    message: '正在准备安全验证...',
    progress: 10
  },
  
  validating: {
    state: 'validating' as const,
    message: '正在验证登录信息...',
    progress: 60
  },
  
  retrying: {
    state: 'retrying' as const,
    message: '网络较慢，正在重新验证...',
    progress: 40
  },
  
  completed: {
    state: 'completed' as const,
    message: '登录验证成功！',
    progress: 100
  },
  
  expired: {
    state: 'error' as const,
    message: '登录信息已过期，正在重新验证...',
    progress: 20,
    canRetry: true,
    errorCode: 'AUTH_EXPIRED',
    action: '系统正在自动为您重新验证'
  },
  
  timeSync: {
    state: 'error' as const,
    message: '设备时间可能有偏差，正在调整验证策略...',
    progress: 30,
    canRetry: true,
    errorCode: 'TIME_SYNC',
    action: '建议检查设备时间设置'
  },
  
  networkError: {
    state: 'error' as const,
    message: '网络连接较慢，正在优化验证流程...',
    progress: 35,
    canRetry: true,
    errorCode: 'NETWORK_SLOW',
    action: '建议切换到更稳定的网络环境'
  },
  
  validationFailed: {
    state: 'error' as const,
    message: '登录验证出现问题，正在重试...',
    progress: 50,
    canRetry: true,
    errorCode: 'VALIDATION_FAILED',
    action: '请保持页面开启，无需手动操作'
  }
};

export default AuthGuide;