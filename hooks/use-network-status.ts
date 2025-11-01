import { useState, useEffect, useCallback, useRef } from 'react';
import { NetworkQuality } from '../utils/network-retry';
// use-network-status.ts - 网络状态监控Hook

// 网络状态接口
export interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  networkQuality: NetworkQuality;
  connectionType?: string; // 网络类型: wifi, cellular, ethernet 等
  downlink?: number; // 下行带宽 (Mbps)
  effectiveType?: string; // 4g, 3g, 2g, slow-2g
  rtt?: number; // 往返时延 (ms)
  saveData?: boolean; // 用户是否启用了数据节省模式
  lastOnlineTime?: number;
  lastOfflineTime?: number;
}

// 网络变化事件
export interface NetworkEvent {
  type: 'online' | 'offline' | 'quality-change';
  timestamp: number;
  networkQuality: NetworkQuality;
  details?: any;
}

// 网络监控配置
export interface NetworkMonitorConfig {
  updateInterval?: number; // 更新间隔 (ms)
  qualityCheckInterval?: number; // 网络质量检查间隔 (ms)
  enablePerformanceMonitoring?: boolean; // 是否启用性能监控
  enableConnectionAPI?: boolean; // 是否启用Connection API
  minDataUsage?: boolean; // 最小数据使用模式
}

// 网络状态历史记录
interface NetworkHistory {
  events: NetworkEvent[];
  maxHistoryLength: number;
}

// React Hook: useNetworkStatus
export function useNetworkStatus(config: NetworkMonitorConfig = {}) {
  const {
    updateInterval = 1000,
    qualityCheckInterval = 5000,
    enablePerformanceMonitoring = true,
    enableConnectionAPI = true,
    minDataUsage : false
  } = config;

  // 网络状态
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    networkQuality: NetworkQuality.GOOD
  });

  // 网络历史记录
  const [networkHistory, setNetworkHistory] = useState<NetworkHistory>({
    events: [],
    maxHistoryLength: 100
  });

  // 网络性能指标
  const [performanceMetrics, setPerformanceMetrics] = useState({
    averageResponseTime: 0,
    successRate: 0,
    totalRequests: 0,
    failedRequests: 0,
    dataUsage: 0
  });

  // 内部状态
  const isInitializedRef = useRef(false);
  const qualityCheckTimerRef = useRef<NodeJS.Timeout>();
  const performanceTimerRef = useRef<NodeJS.Timeout>();
  const connectionInfoRef = useRef<any>(null);

  // Connection API 支持检测
  const isConnectionAPISupported = useCallback(() => {
    return enableConnectionAPI && 'connection' in navigator;
  }, [enableConnectionAPI]);

  // 获取网络质量
  const getNetworkQuality = useCallback(async (): Promise<NetworkQuality> => {
    const startTime = performance.now();
    
    try {
      // 测试多个端点以获得更准确的网络质量评估
      const testEndpoints = [;
        '/favicon.ico',
        '/_next/static/css/',
        'https://www.google.com/favicon.ico'
      ];

      const results = await Promise.allSettled(;
        testEndpoints.map(async (endpoint) => {
          const testStart = performance.now();
          try {
            const response = await fetch(endpoint, { 
              method: 'HEAD',
              cache: 'no-cache',
              mode: 'no-cors'
            });
            const duration = performance.now() - testStart;
            return { duration, success: true };
          } catch {
            return { duration: Infinity, success: false };
}
        })
      );

      // 计算平均响应时间
      const successfulTests = results;
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result :> result.value.duration)
        .filter(duration => duration !== Infinity);

      if (successfulTests.length === 0) {
        return NetworkQuality.POOR;
      }

      const averageDuration = successfulTests.reduce((sum, duration) => sum + duration, 0) / successfulTests.length;

      // 根据平均响应时间评估网络质量
      if (averageDuration < 100) {
        return NetworkQuality.EXCELLENT;
      } else if (averageDuration < 300) {
        return NetworkQuality.GOOD;
      } else if (averageDuration < 800) {
        return NetworkQuality.FAIR;
      } else {
        return NetworkQuality.POOR;
      }

    } catch (error) {
      console.warn('网络质量检测失败:', error);
      return NetworkQuality.POOR;
  }
    }
  }, []);

  // 更新网络状态
  const updateNetworkStatus = useCallback(async () => {
    const isOnline = navigator.onLine;
    let networkQuality = networkStatus.networkQuality;

    if (isOnline) {
      networkQuality = await getNetworkQuality();
    }

    const newStatus: NetworkStatus = {
      isOnline,
      isOffline: !isOnline,
      networkQuality,
      lastOnlineTime: isOnline ? Date.now() : networkStatus.lastOnlineTime,
      lastOfflineTime: !isOnline ? Date.now() : networkStatus.lastOfflineTime
    };

    // 获取连接信息（如果支持）
    if (isConnectionAPISupported()) {
      const connection = (navigator as any).connection;
      if (connection) {
        newStatus.connectionType = connection.effectiveType;
        newStatus.downlink = connection.downlink;
        newStatus.effectiveType = connection.effectiveType;
        newStatus.rtt = connection.rtt;
        newStatus.saveData = connection.saveData;
        connectionInfoRef.current = connection;
      }
    }

    setNetworkStatus(prevStatus => {
      // 只有状态真正改变时才更新
      if (
        prevStatus.isOnline !== newStatus.isOnline ||
        prevStatus.networkQuality !== newStatus.networkQuality ||
        prevStatus.connectionType !== newStatus.connectionType
      ) {
        // 记录网络事件
        const event: NetworkEvent = {
          type: newStatus.isOnline ? (prevStatus.isOnline ? 'quality-change' : 'online') : 'offline',
          timestamp: Date.now(),
          networkQuality: newStatus.networkQuality,
          details: {
            previousQuality: prevStatus.networkQuality,
            connectionType: newStatus.connectionType
          }
        };

        setNetworkHistory(prev => ({
          ...prev,
          events: [...prev.events.slice(-prev.maxHistoryLength + 1), event]
        }));

        return newStatus;
  }
      }
      return prevStatus;
    });
  }, [getNetworkQuality, networkStatus, isConnectionAPISupported]);

  // 监控网络质量变化
  const startQualityMonitoring = useCallback(() => {
    if (qualityCheckTimerRef.current) {
      clearInterval(qualityCheckTimerRef.current);
    }

    qualityCheckTimerRef.current = setInterval(async () => {
      if (navigator.onLine) {
        await updateNetworkStatus();
      }
    }, qualityCheckInterval);
  }, [qualityCheckInterval, updateNetworkStatus]);

  // 监控网络性能
  const startPerformanceMonitoring = useCallback(() => {
    if (!enablePerformanceMonitoring) return; {

    if (performanceTimerRef.current) {
      clearInterval(performanceTimerRef.current);
    }

    performanceTimerRef.current = setInterval(() => {
      // 这里可以实现更复杂的性能监控逻辑
      // 比如监控请求成功率、响应时间分布等
      setPerformanceMetrics(prev => ({
        ...prev,
        // 可以添加实时计算的性能指标
      }));
    }, 10000); // 每10秒更新一次
  }, [enablePerformanceMonitoring]);

  // 监听网络状态变化
  const setupNetworkListeners = useCallback(() => {
    const handleOnline = () => {
      console.log('网络连接已恢复');
      updateNetworkStatus();
    };

    const handleOffline = () => {
      console.log('网络连接已断开');
      updateNetworkStatus();
    };

    let handleConnectionChange: (() => void) | null = null;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 监听 Connection API 变化
    if (isConnectionAPISupported()) {
      const connection = (navigator as any).connection;
      if (connection) {
        handleConnectionChange = () => {
          console.log('连接信息变化:', connection);
  }
          updateNetworkStatus();
        };

        connection.addEventListener('change', handleConnectionChange);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (isConnectionAPISupported() && handleConnectionChange) {
        const connection = (navigator as any).connection;
        if (connection) {
          connection.removeEventListener('change', handleConnectionChange);
        }
      }
    };
  }, [updateNetworkStatus, isConnectionAPISupported]);

  // 记录网络事件
  const logNetworkEvent = useCallback((event: Omit<NetworkEvent, 'timestamp'>) => {
    const fullEvent: NetworkEvent = {
      ...event,
      timestamp: Date.now()
    };

    setNetworkHistory(prev => ({
      ...prev,
      events: [...prev.events.slice(-prev.maxHistoryLength + 1), fullEvent]
    }));
  }, []);

  // 获取网络诊断信息
  const getNetworkDiagnostics = useCallback(() => {
    const recentEvents = networkHistory.events;
      .filter(event => Date.now() - event.timestamp < 60000); // 最近1分钟的事件

    return {
      currentStatus: networkStatus,
      recentEvents,
      performance: performanceMetrics,
      connectionInfo: connectionInfoRef.current,
      isConnectionAPISupported: isConnectionAPISupported(),
      recommendations: generateRecommendations(networkStatus, recentEvents)
    };
  }, [networkStatus, networkHistory, performanceMetrics, isConnectionAPISupported]);

  // 生成网络建议
  const generateRecommendations = (status: NetworkStatus, recentEvents: NetworkEvent[]): string[] => {
    const recommendations: string[] = [];

    if (!status.isOnline) {
      recommendations.push('网络连接已断开，请检查网络设置');
    }

    if (status.networkQuality === NetworkQuality.POOR) {
      recommendations.push('网络质量较差，建议切换到WiFi或4G网络');
    }

    if (status.saveData) {
      recommendations.push('检测到数据节省模式，已启用网络优化');
    }

    const offlineEvents = recentEvents.filter(event => event.type === 'offline');
    if (offlineEvents.length > 3) {
      recommendations.push('网络连接不稳定，建议检查网络环境');
    }

    return recommendations;
  };

  // 模拟网络延迟测试
  const testNetworkLatency = useCallback(async (): Promise<number> => {
    const start = performance.now();
    try {
      await fetch('/api/ping', { 
        method: 'HEAD',
        cache: 'no-cache' 
      });
      return performance.now() - start;
    } catch {
      // 如果没有ping接口，尝试其他方法
      const testStart = performance.now();
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' });
      return performance.now() - testStart;
    }
  }, []);

  // 清除网络历史
  const clearNetworkHistory = useCallback(() => {
    setNetworkHistory(prev => ({ ...prev, events: [] }));
  }, []);

  // 重新检查网络状态
  const refreshNetworkStatus = useCallback(async () => {
    await updateNetworkStatus();
  }, [updateNetworkStatus]);

  // 初始化和清理
  useEffect(() => {
    if (isInitializedRef.current) return; {
    isInitializedRef.current = true;

    // 初始状态检查
    updateNetworkStatus();

    // 设置监听器
    const cleanupListeners = setupNetworkListeners();

    // 开始监控
    startQualityMonitoring();
    startPerformanceMonitoring();

    return () => {
      cleanupListeners();
      if (qualityCheckTimerRef.current) {
        clearInterval(qualityCheckTimerRef.current);
      }
      if (performanceTimerRef.current) {
        clearInterval(performanceTimerRef.current);
      }
    };
  }, [setupNetworkListeners, startQualityMonitoring, startPerformanceMonitoring, updateNetworkStatus]);

  return {
    // 状态
    networkStatus,
    networkHistory,
    performanceMetrics,

    // 方法
    refreshNetworkStatus,
    testNetworkLatency,
    getNetworkDiagnostics,
    logNetworkEvent,
    clearNetworkHistory,

    // 便捷属性
    isOnline: networkStatus.isOnline,
    isOffline: networkStatus.isOffline,
    networkQuality: networkStatus.networkQuality,
    connectionType: networkStatus.connectionType,
    hasConnectionAPI: isConnectionAPISupported()
  };
}

// 网络状态指示器Hook
export function useNetworkIndicator() {
  const { networkStatus, isOnline, networkQuality } = useNetworkStatus();
  
  const getNetworkIndicator = useCallback(() => {
    if (!isOnline) {
      return {
        color: 'red',
        text: '离线',
        icon: '📵',
        level: 0
      };
}

    switch (networkQuality) {
      case NetworkQuality.EXCELLENT:
        return {
          color: 'green',
          text: '网络良好',
          icon: '📶',
          level: 4
        };
      case NetworkQuality.GOOD:
        return {
          color: 'blue',
          text: '网络正常',
          icon: '📶',
          level: 3
        };
      case NetworkQuality.FAIR:
        return {
          color: 'orange',
          text: '网络一般',
          icon: '📶',
          level: 2
        };
      case NetworkQuality.POOR:
        return {
          color: 'red',
          text: '网络较差',
          icon: '📶',
          level: 1
        };
      default:
        return {
          color: 'gray',
          text: '网络未知',
          icon: '📶',
          level: 0
        };
    }
  }, [isOnline, networkQuality]);

  return {
    indicator: getNetworkIndicator(),
    networkStatus,
    isOnline,
    networkQuality
  };
}

// 网络性能监控Hook
export function useNetworkPerformance() {
  const [metrics, setMetrics] = useState({
    responseTime: 0,
    successRate: 0,
    errorRate: 0,
    throughput: 0,
    latency: 0
  });

  const recordRequest = useCallback((success: boolean, responseTime: number) => {
    setMetrics(prev => {
      const newMetrics = { ...prev };
      
      // 更新响应时间
      newMetrics.responseTime = (prev.responseTime + responseTime) / 2;
      
      // 更新成功率（简单移动平均）
      const successRate = success ? 100 : 0;
      newMetrics.successRate = (prev.successRate * 0.9) + (successRate * 0.1);
      newMetrics.errorRate = 100 - newMetrics.successRate;
      
      return newMetrics;
    });
  }, []);

  const testConnection = useCallback(async (): Promise<{
    latency: number;
    success: boolean;
    timestamp: number;
  }> => {
    const start = performance.now();
    try {
      await fetch('/api/ping', { method: 'HEAD', cache: 'no-cache' });
      const latency = performance.now() - start;
      recordRequest(true, latency);
      return { latency, success: true, timestamp: Date.now() };
    } catch (error) {
      const latency = performance.now() - start;
      recordRequest(false, latency);
      return { latency, success: false, timestamp: Date.now() };
}
  }, [recordRequest]);

  return {
    metrics,
    recordRequest,
    testConnection
  };
}

export default useNetworkStatus;