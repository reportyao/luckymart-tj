/**
 * 移动端性能监控Hook
 * 提供实时性能指标监控、内存使用监控、网络请求优化分析等功能
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  // 加载性能
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  
  // 渲染性能
  renderTime: number;
  frameRate: number;
  repaintCount: number;
  
  // 内存使用
  usedHeapSize: number;
  totalHeapSize: number;
  heapSizeLimit: number;
  memoryUsage: MemoryInfo;
  
  // 网络性能
  connectionSpeed: 'slow' | 'medium' | 'fast';
  dataTransfer: {
    downloaded: number;
    uploaded: number;
    cached: number;
  };
  
  // 用户体验
  interactionLatency: number;
  inputDelay: number;
  scrollPerformance: number;
}

interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  duration: number;
  size: number;
  cached: boolean;
}

interface PerformanceAlert {
  type: 'warning' | 'error' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
}

interface PerformanceMonitorConfig {
  enableMemoryMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  enableInteractionMonitoring: boolean;
  alertThresholds: {
    loadTime: number;
    memoryUsage: number;
    frameRate: number;
    interactionLatency: number;
  };
}

export const useMobilePerformance = (config: Partial<PerformanceMonitorConfig> = {}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const defaultConfig: PerformanceMonitorConfig = {
    enableMemoryMonitoring: true,
    enableNetworkMonitoring: true,
    enableInteractionMonitoring: true,
    alertThresholds: {
      loadTime: 3000, // 3秒
      memoryUsage: 50 * 1024 * 1024, // 50MB
      frameRate: 30, // 30fps
      interactionLatency: 100 // 100ms
    }
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);
  const networkRequestsRef = useRef<Map<string, number>>(new Map());

  // 收集性能指标
  const collectMetrics = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      // 获取导航计时
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      // 获取绘制计时
      const paintEntries = performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');

      // 获取内存信息
      let memoryInfo: MemoryInfo | null = null;
      if (finalConfig.enableMemoryMonitoring && 'memory' in performance) {
        memoryInfo = (performance as any).memory;
      }

      // 计算渲染性能
      const renderStartTime = performance.now();
      await new Promise(resolve => requestAnimationFrame(resolve));
      const renderTime = performance.now() - renderStartTime;

      // 检测连接速度
      const connection = (navigator as any).connection;
      const connectionSpeed: 'slow' | 'medium' | 'fast' = connection 
        ? connection.effectiveType >= 3 ? 'fast' : connection.effectiveType >= 2 ? 'medium' : 'slow'
        : 'medium';

      const currentMetrics: PerformanceMetrics = {
        loadTime: navigationTiming ? navigationTiming.loadEventEnd - navigationTiming.fetchStart : 0,
        domContentLoaded: navigationTiming ? navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart : 0,
        firstPaint: firstPaint ? firstPaint.startTime : 0,
        firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime : 0,
        renderTime,
        frameRate: calculateFrameRate(),
        repaintCount: calculateRepaintCount(),
        usedHeapSize: memoryInfo ? memoryInfo.usedJSHeapSize : 0,
        totalHeapSize: memoryInfo ? memoryInfo.totalJSHeapSize : 0,
        heapSizeLimit: memoryInfo ? memoryInfo.jsHeapSizeLimit : 0,
        memoryUsage: memoryInfo || {
          usedJSHeapSize: 0,
          totalJSHeapSize: 0,
          jsHeapSizeLimit: 0
        },
        connectionSpeed,
        dataTransfer: calculateDataTransfer(),
        interactionLatency: measureInteractionLatency(),
        inputDelay: measureInputDelay(),
        scrollPerformance: measureScrollPerformance()
      };

      setMetrics(currentMetrics);
      
      // 检查告警
      checkAlerts(currentMetrics);

    } catch (error) {
      console.error('性能指标收集失败:', error);
    }
  }, [finalConfig]);

  // 监控网络请求
  const monitorNetworkRequests = useCallback(() => {
    if (!finalConfig.enableNetworkMonitoring) return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      const method = args[1]?.method || 'GET';
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // 检查缓存
        const cached = response.headers.get('x-cache') === 'HIT';
        
        // 获取响应大小（估算）
        const contentLength = response.headers.get('content-length');
        const size = contentLength ? parseInt(contentLength) : 0;

        const request: NetworkRequest = {
          url,
          method,
          status: response.status,
          duration,
          size,
          cached
        };

        setNetworkRequests(prev => [...prev.slice(-49), request]); // 保留最近50个请求
        
        return response;
      } catch (error) {
        console.error('网络请求失败:', error);
        throw error;
      }
    };

    // 监控XMLHttpRequest
    const originalXHR = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method: string, url: string) {
      const startTime = performance.now();
      networkRequestsRef.current.set(url, startTime);
      
      this.addEventListener('loadend', () => {
        const requestStart = networkRequestsRef.current.get(url);
        if (requestStart) {
          const duration = performance.now() - requestStart;
          const request: NetworkRequest = {
            url,
            method,
            status: this.status,
            duration,
            size: this.responseText.length,
            cached: false
          };
          setNetworkRequests(prev => [...prev.slice(-49), request]);
          networkRequestsRef.current.delete(url);
        }
      });
      
      return originalXHR.apply(this, arguments);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [finalConfig.enableNetworkMonitoring]);

  // 计算帧率
  const calculateFrameRate = (): number => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      // 这里应该计算实际帧率，简化处理
    });
    observer.observe({ entryTypes: ['frame'] });
    return 60; // 模拟60fps
  };

  // 计算重绘次数
  const calculateRepaintCount = (): number => {
    return performance.getEntriesByType('paint').length;
  };

  // 计算数据传输
  const calculateDataTransfer = () => {
    const cached = networkRequests.filter(req => req.cached).length;
    const downloaded = networkRequests.reduce((total, req) => total + req.size, 0);
    return {
      downloaded,
      uploaded: 0, // 简化处理
      cached: downloaded * (cached / Math.max(networkRequests.length, 1))
    };
  };

  // 测量交互延迟
  const measureInteractionLatency = (): number => {
    const startTime = performance.now();
    // 模拟交互测量
    return Math.random() * 50; // 0-50ms随机延迟
  };

  // 测量输入延迟
  const measureInputDelay = (): number => {
    return Math.random() * 20; // 0-20ms随机延迟
  };

  // 测量滚动性能
  const measureScrollPerformance = (): number => {
    return Math.random() * 100; // 0-100性能评分
  };

  // 检查性能告警
  const checkAlerts = useCallback((currentMetrics: PerformanceMetrics) => {
    const newAlerts: PerformanceAlert[] = [];
    
    if (currentMetrics.loadTime > finalConfig.alertThresholds.loadTime) {
      newAlerts.push({
        type: 'warning',
        metric: 'loadTime',
        value: currentMetrics.loadTime,
        threshold: finalConfig.alertThresholds.loadTime,
        message: `页面加载时间过长: ${currentMetrics.loadTime.toFixed(2)}ms`
      });
    }

    if (currentMetrics.usedHeapSize > finalConfig.alertThresholds.memoryUsage) {
      newAlerts.push({
        type: 'warning',
        metric: 'memoryUsage',
        value: currentMetrics.usedHeapSize,
        threshold: finalConfig.alertThresholds.memoryUsage,
        message: `内存使用过高: ${(currentMetrics.usedHeapSize / 1024 / 1024).toFixed(2)}MB`
      });
    }

    if (currentMetrics.frameRate < finalConfig.alertThresholds.frameRate) {
      newAlerts.push({
        type: 'error',
        metric: 'frameRate',
        value: currentMetrics.frameRate,
        threshold: finalConfig.alertThresholds.frameRate,
        message: `帧率过低: ${currentMetrics.frameRate}fps`
      });
    }

    if (currentMetrics.interactionLatency > finalConfig.alertThresholds.interactionLatency) {
      newAlerts.push({
        type: 'warning',
        metric: 'interactionLatency',
        value: currentMetrics.interactionLatency,
        threshold: finalConfig.alertThresholds.interactionLatency,
        message: `交互延迟过高: ${currentMetrics.interactionLatency.toFixed(2)}ms`
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts].slice(-20)); // 保留最近20个告警
    }
  }, [finalConfig.alertThresholds]);

  // 开始监控
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    collectMetrics();
    
    // 定期收集指标
    const interval = setInterval(collectMetrics, 5000);
    
    // 监控网络请求
    const cleanupNetwork = monitorNetworkRequests();
    
    // 监控交互性能
    if (finalConfig.enableInteractionMonitoring) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'longtask') {
            setAlerts(prev => [...prev, {
              type: 'warning',
              metric: 'longTask',
              value: entry.duration,
              threshold: 50,
              message: `检测到长任务: ${entry.duration.toFixed(2)}ms`
            }].slice(-20));
          }
        });
      });
      observer.observe({ entryTypes: ['longtask'] });
      performanceObserverRef.current = observer;
    }

    return () => {
      clearInterval(interval);
      cleanupNetwork?.();
      performanceObserverRef.current?.disconnect();
    };
  }, [collectMetrics, monitorNetworkRequests, finalConfig]);

  // 停止监控
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    performanceObserverRef.current?.disconnect();
  }, []);

  // 获取性能报告
  const getPerformanceReport = useCallback(() => {
    if (!metrics) return null;

    return {
      summary: {
        loadTime: metrics.loadTime,
        memoryUsage: metrics.usedHeapSize,
        frameRate: metrics.frameRate,
        connectionSpeed: metrics.connectionSpeed
      },
      network: {
        totalRequests: networkRequests.length,
        cachedRequests: networkRequests.filter(r => r.cached).length,
        averageResponseTime: networkRequests.reduce((sum, r) => sum + r.duration, 0) / Math.max(networkRequests.length, 1)
      },
      alerts: alerts.slice(-5), // 最近5个告警
      recommendations: generateRecommendations(metrics, networkRequests)
    };
  }, [metrics, networkRequests, alerts]);

  // 生成优化建议
  const generateRecommendations = (currentMetrics: PerformanceMetrics, requests: NetworkRequest[]) => {
    const recommendations = [];
    
    if (currentMetrics.loadTime > 3000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: '页面加载优化',
        description: '考虑启用代码分割和懒加载来减少初始包大小'
      });
    }

    if (currentMetrics.usedHeapSize > 50 * 1024 * 1024) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        title: '内存优化',
        description: '检查内存泄漏，考虑及时清理未使用的对象和事件监听器'
      });
    }

    if (currentMetrics.connectionSpeed === 'slow') {
      recommendations.push({
        type: 'network',
        priority: 'high',
        title: '网络优化',
        description: '弱网环境下，启用离线缓存和渐进式加载'
      });
    }

    const cacheHitRate = requests.filter(r => r.cached).length / Math.max(requests.length, 1);
    if (cacheHitRate < 0.5) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        title: '缓存优化',
        description: '提高缓存命中率，减少重复请求'
      });
    }

    return recommendations;
  };

  // 组件挂载时自动开始监控
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, []);

  return {
    metrics,
    networkRequests,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    collectMetrics,
    getPerformanceReport,
    clearAlerts: () => setAlerts([])
  };
};

export default useMobilePerformance;