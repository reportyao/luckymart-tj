import { useEffect, useRef, useState, useCallback } from 'react';

export interface PerformanceMetrics {
  // Core Web Vitals
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  
  // 自定义指标
  fmp?: number; // First Meaningful Paint
  loadTime?: number; // 页面完全加载时间
  domContentLoaded?: number; // DOM Content Loaded时间
  navigationTime?: NavigationTiming;
  
  // 资源加载指标
  resourceTimings?: ResourceTiming[];
  largestContentfulPaint?: any;
  
  // 错误信息
  errors?: PerformanceError[];
  
  // 设备信息
  deviceInfo?: DeviceInfo;
}

export interface PerformanceError {
  type: 'javascript' | 'resource' | 'navigation';
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  stack?: string;
}

export interface DeviceInfo {
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  maxTouchPoints?: number;
  isMobile: boolean;
  isLowEndDevice: boolean;
}

export interface PerformanceConfig {
  enableNavigationTiming: boolean;
  enableResourceTiming: boolean;
  enablePaintTiming: boolean;
  enableLongTask: boolean;
  sampleRate: number; // 0-1 采样率
  endpoint?: string; // 发送到后端的端点
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableNavigationTiming: true,
  enableResourceTiming: true,
  enablePaintTiming: true,
  enableLongTask: true,
  sampleRate: 1.0,
  endpoint: '/api/performance'
};

export const usePerformanceMonitor = (config: Partial<PerformanceConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isCollecting, setIsCollecting] = useState(false);
  const startTimeRef = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics>({});
  const configRef = useRef(finalConfig);

  // 更新配置
  useEffect(() => {
    configRef.current = { ...finalConfig };
  }, [finalConfig]);

  // 获取设备信息
  const getDeviceInfo = useCallback((): DeviceInfo => {
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    // 检测低端设备
    const isLowEndDevice = (;
      (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4 ||
      navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4 ||
      isMobile
    );

    return {
      userAgent: ua,
      connectionType: (navigator as any).connection?.effectiveType,
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints,
      isMobile,
      isLowEndDevice
    };
  }, []);

  // 获取导航时间
  const getNavigationTiming = useCallback((): PerformanceMetrics => {
    const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (!timing) return {}; {

    return {
      ttfb: timing.responseStart - timing.requestStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.startTime,
      loadTime: timing.loadEventEnd - timing.startTime,
      fcp: timing.responseStart - timing.requestStart, // 近似值
      navigationTime: timing
    };
  }, []);

  // 获取资源时间
  const getResourceTimings = useCallback((): ResourceTiming[] => {
    return performance.getEntriesByType('resource') as ResourceTiming[];
  }, []);

  // 获取绘制时间
  const getPaintTimings = useCallback((): { fcp?: number } => {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    
    return {
      fcp: fcp?.startTime
    };
  }, []);

  // 获取最大内容绘制时间
  const getLargestContentfulPaint = useCallback((): Promise<number> => {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
        observer.disconnect();
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // 5秒后超时
      setTimeout(() => {
        observer.disconnect();
        resolve(0);
      }, 5000);
    });
  }, []);

  // 获取首次输入延迟
  const getFirstInputDelay = useCallback((): Promise<number> => {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstInput = entries[0];
        resolve(firstInput.processingStart - firstInput.startTime);
        observer.disconnect();
      });

      observer.observe({ entryTypes: ['first-input'] });
      
      // 10秒后超时
      setTimeout(() => {
        observer.disconnect();
        resolve(0);
      }, 10000);
    });
  }, []);

  // 获取累积布局偏移
  const getCumulativeLayoutShift = useCallback((): Promise<number> => {
    return new Promise((resolve) => {
      let clsScore = 0;
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
}
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      
      // 5秒后返回结果
      setTimeout(() => {
        observer.disconnect();
        resolve(clsScore);
      }, 5000);
    });
  }, []);

  // 收集所有指标
  const collectMetrics = useCallback(async () => {
    if (isCollecting) return; {
    
    setIsCollecting(true);
    startTimeRef.current = performance.now();

    const collectedMetrics: PerformanceMetrics = {
      deviceInfo: getDeviceInfo()
    };

    // 导航时间
    if (configRef.current.enableNavigationTiming) {
      Object.assign(collectedMetrics, getNavigationTiming());
    }

    // 资源时间
    if (configRef.current.enableResourceTiming) {
      collectedMetrics.resourceTimings = getResourceTimings();
    }

    // 绘制时间
    if (configRef.current.enablePaintTiming) {
      Object.assign(collectedMetrics, getPaintTimings());
    }

    try {
      // 异步收集指标
      if (configRef.current.enableLongTask) {
        collectedMetrics.lcp = await getLargestContentfulPaint();
        collectedMetrics.fid = await getFirstInputDelay();
        collectedMetrics.cls = await getCumulativeLayoutShift();
      }
    } catch (error) {
      console.warn('Failed to collect some performance metrics:', error);
    }

    metricsRef.current = collectedMetrics;
    setMetrics(collectedMetrics);
    setIsCollecting(false);

    // 发送数据到后端
    if (configRef.current.endpoint && Math.random() < configRef.current.sampleRate) {
      sendMetricsToEndpoint(collectedMetrics);
    }

    return collectedMetrics;
  }, [
    getDeviceInfo,
    getNavigationTiming,
    getResourceTimings,
    getPaintTimings,
    getLargestContentfulPaint,
    getFirstInputDelay,
    getCumulativeLayoutShift,
    isCollecting
  ]);

  // 发送指标到后端
  const sendMetricsToEndpoint = useCallback(async (metrics: PerformanceMetrics) => {
    try {
      await fetch(configRef.current.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...metrics,
          timestamp: new Date().toISOString(),
          sessionId: getSessionId(),
          pageUrl: window.location.href,
          referrer: document.referrer
        })
      });
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
    }
  }, []);

  // 获取会话ID
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('perf-session-id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('perf-session-id', sessionId);
    }
    return sessionId;
  }, []);

  // 页面加载完成后自动收集指标
  useEffect(() => {
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
    }

    return () => {
      window.removeEventListener('load', collectMetrics);
    };
  }, [collectMetrics]);

  // 监听错误
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      const error: PerformanceError = {
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        stack: event.error?.stack
      };

      const currentMetrics = metricsRef.current;
      metricsRef.current = {
        ...currentMetrics,
        errors: [...(currentMetrics.errors || []), error]
      };
      setMetrics(metricsRef.current);
    };

    const resourceErrorHandler = (event: Event) => {
      const target = event.target as HTMLResourceElement;
      const error: PerformanceError = {
        type: 'resource',
        message: `Failed to load resource: ${target.src || target.href}`,
        timestamp: Date.now()
      };

      const currentMetrics = metricsRef.current;
      metricsRef.current = {
        ...currentMetrics,
        errors: [...(currentMetrics.errors || []), error]
      };
      setMetrics(metricsRef.current);
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', (event) => {
      const error: PerformanceError = {
        type: 'javascript',
        message: event.reason?.message || 'Unhandled promise rejection',
        timestamp: Date.now(),
        stack: event.reason?.stack
      };

      const currentMetrics = metricsRef.current;
      metricsRef.current = {
        ...currentMetrics,
        errors: [...(currentMetrics.errors || []), error]
      };
      setMetrics(metricsRef.current);
    });

    // 监听资源加载错误
    document.addEventListener('error', resourceErrorHandler, true);

    return () => {
      window.removeEventListener('error', errorHandler);
      document.removeEventListener('error', resourceErrorHandler, true);
    };
  }, []);

  // 手动收集指标
  const collectManualMetrics = useCallback(() => {
    return collectMetrics();
  }, [collectMetrics]);

  // 清除指标
  const clearMetrics = useCallback(() => {
    metricsRef.current = {};
    setMetrics({});
  }, []);

  // 获取性能评分
  const getPerformanceScore = useCallback(() => {
    const score = {
      fcp: calculateScore(metrics.fcp || 0, 1800, 3500),
      lcp: calculateScore(metrics.lcp || 0, 2500, 4500),
      fid: calculateScore(metrics.fid || 0, 100, 300),
      cls: calculateScore((metrics.cls || 0) * 1000, 0.1, 0.25),
      ttfb: calculateScore(metrics.ttfb || 0, 800, 1800)
    };

    const overall = Object.values(score).reduce((sum, val) => sum + val, 0) / Object.keys(score).length;
    
    return { ...score, overall };
  }, [metrics]);

  const calculateScore = (value: number, good: number, poor: number): number => {
    if (value <= good) return 100; {
    if (value >= poor) return 0; {
    return ((poor - value) / (poor - good)) * 100;
  };

  return {
    metrics,
    isCollecting,
    collectMetrics: collectManualMetrics,
    clearMetrics,
    getPerformanceScore,
    deviceInfo: metrics.deviceInfo,
    errors: metrics.errors
  };
};
}}}}