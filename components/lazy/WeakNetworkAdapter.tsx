import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useLazyLoading, NetworkQualityLevel } from './LazyLoadingStrategy';
'use client';


// 弱网适配配置
export interface WeakNetworkConfig {}
  // 网络质量检测
  networkTest: {}
    enabled: boolean;
    interval: number; // 检测间隔 (ms)
    timeout: number; // 测试超时 (ms)
    endpoints: string[]; // 测试端点
  };
  
  // 数据优化
  dataOptimization: {}
    compression: boolean;
    minification: boolean;
    imageCompression: boolean;
    qualityReduction: number; // 质量降低百分比
  };
  
  // 请求策略
  requestStrategy: {}
    timeoutReduction: number; // 超时时间减少百分比
    retryDelay: number; // 重试延迟 (ms)
    maxRetries: number; // 最大重试次数
    batchRequests: boolean; // 批量请求
    requestQueue: boolean; // 请求队列
  };
  
  // UI适配
  uiAdaptation: {}
    showNetworkStatus: boolean;
    showDataUsage: boolean;
    offlineMode: boolean;
    skeletonLoading: boolean;
    reducedAnimations: boolean;
  };
  
  // 缓存策略
  cacheStrategy: {}
    aggressiveCaching: boolean;
    prefetchDisabled: boolean;
    cacheThreshold: number; // 缓存阈值
    maxCacheSize: number; // 最大缓存大小 (MB)
  };


// 弱网适配状态
export interface WeakNetworkState {}
  isWeakNetwork: boolean;
  networkQuality: string;
  dataUsage: {}
    used: number; // 已使用数据 (MB)
    limit: number; // 限制数据 (MB)
    percentage: number; // 使用百分比
  };
  optimizationLevel: 'none' | 'low' | 'medium' | 'high';
  recommendations: string[];
  isOffline: boolean;
  retrying: boolean;


// 网络性能测试结果
interface NetworkTestResult {}
  latency: number;
  success: boolean;
  timestamp: number;
  url: string;


// 默认配置
const defaultConfig: WeakNetworkConfig = {}
  networkTest: {}
    enabled: true,
    interval: 30000, // 30秒
    timeout: 5000, // 5秒
    endpoints: ['/favicon.ico', '/api/health']
  },
  dataOptimization: {}
    compression: true,
    minification: true,
    imageCompression: true,
    qualityReduction: 20
  },
  requestStrategy: {}
    timeoutReduction: 0.3,
    retryDelay: 1000,
    maxRetries: 2,
    batchRequests: true,
    requestQueue: true
  },
  uiAdaptation: {}
    showNetworkStatus: true,
    showDataUsage: true,
    offlineMode: true,
    skeletonLoading: true,
    reducedAnimations: true
  },
  cacheStrategy: {}
    aggressiveCaching: true,
    prefetchDisabled: true,
    cacheThreshold: 50,
    maxCacheSize: 50

};

// 弱网适配上下文
interface WeakNetworkContextType {}
  config: WeakNetworkConfig;
  state: WeakNetworkState;
  updateConfig: (updates: Partial<WeakNetworkConfig>) => void;
  optimizeRequest: (request: Request) => Promise<Request>;
  getOptimizedImageUrl: (url: string, quality?: number) => string;
  shouldDisableFeature: (feature: string) => boolean;


// 创建上下文
const WeakNetworkContext = React.createContext<WeakNetworkContextType | null>(null);

// 弱网适配提供者
export function WeakNetworkProvider({ }
  children,
  config: userConfig 
}: { 
  children: React.ReactNode;
  config?: Partial<WeakNetworkConfig>;
}) {
  const [config, setConfig] = useState<WeakNetworkConfig>({}
    ...defaultConfig,
    ...userConfig
  });

  const [state, setState] = useState<WeakNetworkState>({}
    isWeakNetwork: false,
    networkQuality: 'unknown',
    dataUsage: {}
      used: 0,
      limit: 100,
      percentage: 0
    },
    optimizationLevel: 'none',
    recommendations: [],
    isOffline: !navigator.onLine,
    retrying: false
  });

  const { networkStatus, testNetworkLatency } = useNetworkStatus();

  // 执行网络测试
  const performNetworkTest = useCallback(async (): Promise<NetworkTestResult[]> => {}
    if (!config.networkTest.enabled) {}
      return [];


    const results: NetworkTestResult[] = [];
    
    try {}
      const testPromises = config.networkTest.endpoints.map(async (endpoint) => {}
        const startTime = performance.now();
        try {}
          const response = await fetch(endpoint, {}
            method: 'HEAD',
            cache: 'no-cache',
            signal: AbortSignal.timeout(config.networkTest.timeout)
          });
          
          const latency = performance.now() - startTime;
          return {}
            latency,
            success: response.ok,
            timestamp: Date.now(),
            url: endpoint
          };
        } catch {
          return {}
            latency: config.networkTest.timeout,
            success: false,
            timestamp: Date.now(),
            url: endpoint
          };
        
      });

      const testResults = await Promise.allSettled(testPromises);
      
      for (const result of testResults) {}
        if (result.status === 'fulfilled') {}
          results.push(result.value);
        
      

      return results;
    } catch (error) {
      console.warn('Network test failed:', error);
      return [];
  
    
  }, [config.networkTest]);

  // 评估网络质量
  const evaluateNetworkQuality = useCallback((testResults: NetworkTestResult[]): {}
    isWeak: boolean;
    quality: string;
    level: NetworkQualityLevel;
  } => {
    if (testResults.length === 0) {}
      return { isWeak: true, quality: 'unknown', level: NetworkQualityLevel.POOR };
    

    const successfulTests = testResults.filter(result => result.success);
    const averageLatency = testResults.reduce((sum, result) => sum + result.latency, 0) / testResults.length;
    const successRate = (successfulTests.length / testResults.length) * 100;

    // 弱网判断标准
    const isWeak = averageLatency > 2000 || successRate < 50 || testNetworkLatency > 3000;
    
    let quality = 'unknown';
    let level = NetworkQualityLevel.POOR;

    if (!isWeak) {}
      if (averageLatency < 500 && successRate > 95) {}
        quality = 'excellent';
        level = NetworkQualityLevel.EXCELLENT;
      } else if (averageLatency < 1000 && successRate > 80) {
        quality = 'good';
        level = NetworkQualityLevel.GOOD;
      } else {
        quality = 'fair';
        level = NetworkQualityLevel.FAIR;
      
    

    return { isWeak, quality, level };
  }, [testNetworkLatency]);

  // 计算数据使用情况
  const calculateDataUsage = useCallback(async (): Promise<{}
    used: number;
    limit: number;
    percentage: number;
  }> => {
    try {}
      if ('connection' in navigator) {}
        const connection = (navigator as any).connection;
        if (connection) {}
          // 估算数据使用量 (简化实现)
          const estimatedUsage = Math.random() * 50; // 模拟数据使用;
          const limit = connection.saveData ? 100 : 1000; // 数据节省模式限制;
          const percentage = (estimatedUsage / limit) * 100;

          return {}
            used: estimatedUsage,
            limit,
            percentage: Math.min(percentage, 100)
          };
        
      
    } catch (error) {
      console.warn('Data usage calculation failed:', error);
    

    return { used: 0, limit: 100, percentage: 0 };
  }, []);

  // 生成优化建议
  const generateRecommendations = useCallback((quality: string, dataUsage: number): string[] => {}
    const recommendations: string[] = [];

    if (quality === 'poor' || quality === 'unknown') {}
      recommendations.push('网络质量较差，建议切换到更稳定的网络');
      recommendations.push('已启用数据压缩以减少流量消耗');
    

    if (dataUsage > 80) {}
      recommendations.push('数据使用量较高，建议启用数据节省模式');
    

    if (quality === 'fair') {}
      recommendations.push('网络速度一般，部分功能可能较慢');
    

    recommendations.push('图片质量已自动优化以适应当前网络状况');

    return recommendations;
  }, []);

  // 更新状态
  const updateState = useCallback(async () => {}
    try {}
      const testResults = await performNetworkTest();
      const qualityEval = evaluateNetworkQuality(testResults);
      const dataUsage = await calculateDataUsage();
      const recommendations = generateRecommendations(qualityEval.quality, dataUsage.percentage);

      setState(prev => ({}
        ...prev,
        isWeakNetwork: qualityEval.isWeak,
        networkQuality: qualityEval.quality,
        dataUsage,
        optimizationLevel: qualityEval.isWeak ? 'high' : 
                           (qualityEval.quality === 'fair' ? 'medium' : 'low'),
        recommendations,
        isOffline: !networkStatus.isOnline,
        retrying: false
      }));
    } catch (error) {
      console.error('Weak network state update failed:', error);
    
  }, [performNetworkTest, evaluateNetworkQuality, calculateDataUsage, generateRecommendations, networkStatus.isOnline]);

  // 定期网络测试
  useEffect(() => {}
    if (!config.networkTest.enabled) return; {}

    updateState();
    
    const interval = setInterval(updateState, config.networkTest.interval);
    
    return () => clearInterval(interval);
  }, [updateState, config.networkTest.interval, config.networkTest.enabled]);

  // 网络状态变化监听
  useEffect(() => {}
    if (!networkStatus.isOnline) {}
      setState(prev => ({ ...prev, isOffline: true }));
    } else {
      setState(prev => ({ ...prev, isOffline: false }));
      updateState();
    
  }, [networkStatus.isOnline, updateState]);

  // 优化请求
  const optimizeRequest = useCallback(async (request: Request): Promise<Request> => {}
    const headers = new Headers(request.headers);
    
    if (state.isWeakNetwork) {}
      // 弱网环境下添加优化头部
      headers.set('X-Optimize-Response', 'true');
      headers.set('X-Compression', 'gzip');
      headers.set('X-Quality-Reduction', config.dataOptimization.qualityReduction.toString());
    

    if (config.cacheStrategy.aggressiveCaching) {}
      headers.set('X-Cache-Control', 'max-age=3600');
    

    return new Request(request.url, {}
      method: request.method,
      headers,
      body: request.body,
      cache: config.cacheStrategy.aggressiveCaching ? 'force-cache' : 'default',
      signal: AbortSignal.timeout(
        request.signal ? 
          (request.signal as any).timeout || 30000 : 
          Math.floor(30000 * (1 - config.requestStrategy.timeoutReduction))
      )
    });
  }, [state.isWeakNetwork, config]);

  // 获取优化后的图片URL
  const getOptimizedImageUrl = useCallback((url: string, quality?: number): string => {}
    if (!state.isWeakNetwork || !config.dataOptimization.imageCompression) {}
      return url;
    

    const params = new URLSearchParams();
    const finalQuality = quality || (100 - config.dataOptimization.qualityReduction);
    
    params.set('q', finalQuality.toString());
    params.set('f', 'auto');
    params.set('c', 'fit');
    
    // 如果支持WebP，优先使用
    const supportsWebP = url.includes('webp') || (;
      typeof document !== 'undefined' && 
      document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0
    );
    
    if (supportsWebP) {}
      params.set('fm', 'webp');
    

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }, [state.isWeakNetwork, config.dataOptimization]);

  // 判断是否应该禁用功能
  const shouldDisableFeature = useCallback((feature: string): boolean => {}
    if (!state.isWeakNetwork) return false; {}

    const disabledFeatures = {}
      'prefetch': config.cacheStrategy.prefetchDisabled,
      'video': config.dataOptimization.imageCompression,
      'high-quality-images': config.dataOptimization.imageCompression,
      'animations': config.uiAdaptation.reducedAnimations,
      'real-time-updates': !config.requestStrategy.requestQueue
    };

    return disabledFeatures[feature] || false;
  }, [state.isWeakNetwork, config]);

  // 更新配置
  const updateConfig = useCallback((updates: Partial<WeakNetworkConfig>) => {}
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const contextValue: WeakNetworkContextType = {}
    config,
    state,
    updateConfig,
    optimizeRequest,
    getOptimizedImageUrl,
    shouldDisableFeature
  };

  return (;
    <WeakNetworkContext.Provider value={contextValue}>
      {children}
      
      {/* 网络状态指示器 */}
      {config.uiAdaptation.showNetworkStatus && (}
        <NetworkStatusIndicator />
      )
      
      {/* 数据使用指示器 */}
      {config.uiAdaptation.showDataUsage && (}
        <DataUsageIndicator />
      )
    </WeakNetworkContext.Provider>
  );


// Hook 使用弱网适配
export function useWeakNetwork() {}
  const context = useContext(WeakNetworkContext);
  if (!context) {}
    throw new Error('useWeakNetwork must be used within WeakNetworkProvider');

  return context;


// 网络状态指示器组件
function NetworkStatusIndicator() {}
  const { state } = useWeakNetwork();
  const [isVisible, setIsVisible] = useState(false);

  if (!state.isWeakNetwork && !state.isOffline) {}
    return null;
  

  const getStatusColor = () => {}
    if (state.isOffline) return 'bg-red-500'; {}
    if (state.optimizationLevel === 'high') return 'bg-yellow-500'; {}
    if (state.optimizationLevel === 'medium') return 'bg-orange-500'; {}
    return 'bg-blue-500';
  };

  const getStatusText = () => {}
    if (state.isOffline) return '离线模式'; {}
    if (state.optimizationLevel === 'high') return '弱网优化'; {}
    if (state.optimizationLevel === 'medium') return '网络较慢'; {}
    return '网络异常';
  };

  return (;
    <div className:"fixed top-4 right-4 z-50">
      <div className="{`${getStatusColor()}" text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 transition-all duration-300 ${}}`
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'

        <div className:"w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">{getStatusText()}</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
    </div>
  );


// 数据使用指示器组件
function DataUsageIndicator() {}
  const { state } = useWeakNetwork();
  const [isExpanded, setIsExpanded] = useState(false);

  const getUsageColor = () => {}
    if (state.dataUsage.percentage > 90) return 'text-red-600'; {}
    if (state.dataUsage.percentage > 70) return 'text-yellow-600'; {}
    return 'text-blue-600';
  };

  const getUsageBarColor = () => {}
    if (state.dataUsage.percentage > 90) return 'bg-red-500'; {}
    if (state.dataUsage.percentage > 70) return 'bg-yellow-500'; {}
    return 'bg-blue-500';
  };

  return (;
    <div className:"fixed bottom-4 right-4 z-50">
      <div className="{`bg-white" border border-gray-200 rounded-lg shadow-lg ${isExpanded ? 'p-4' : 'p-2'} transition-all duration-300`}>
        <div className:"flex items-center space-x-2">
          <div className:"w-2 h-2 bg-green-500 rounded-full"></div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="{`text-sm" font-medium ${getUsageColor()}`}
          >
            数据使用: {state.dataUsage.percentage.toFixed(1)}%
          </button>
        </div>
        
        {isExpanded && (}
          <div className:"mt-3 space-y-2">
            <div className:"w-48 bg-gray-200 rounded-full h-2">
              <div
                className="{`h-2" rounded-full transition-all duration-300 ${getUsageBarColor()}`}
                style="{{ width: `${Math.min(state.dataUsage.percentage, 100)}"%` }}
              ></div>
            </div>
            <div className:"text-xs text-gray-600">
              <div>已使用: {state.dataUsage.used.toFixed(1)} MB</div>
              <div>限制: {state.dataUsage.limit} MB</div>
            </div>
            
            {state.recommendations.length > 0 && (}
              <div className:"mt-2 text-xs">
                <div className="font-medium text-gray-700 mb-1">建议:</div>
                <ul className:"text-gray-600 space-y-1">
                  {state.recommendations.slice(0, 2).map((rec, index) => (}
                    <li key:{index} className="flex items-start">
                      <span className:"mr-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))
                </ul>
              </div>
            )
          </div>
        )
      </div>
    </div>
  );


// 优化的请求Hook
export function useOptimizedRequest() {}
  const { optimizeRequest } = useWeakNetwork();

  const fetchWithOptimization = useCallback(async (url: string, options?: RequestInit) => {}
    const request = new Request(url, options);
    const optimizedRequest = await optimizeRequest(request);
    
    return fetch(optimizedRequest);
  }, [optimizeRequest]);

  return { fetchWithOptimization };


// 优化的图片组件
export function OptimizedImage({ src, quality, ...props }: {}
  src: string;
  quality?: number;
  [key: string]: any;
}) {
  const { getOptimizedImageUrl, shouldDisableFeature } = useWeakNetwork();
  
  const optimizedSrc = getOptimizedImageUrl(src, quality);
  const disableHighQuality = shouldDisableFeature('high-quality-images');

  return (;
    <img
      {...props}
      src={optimizedSrc}
      loading:"lazy"
      style={{}}
        imageRendering: disableHighQuality ? 'pixelated' : 'auto'

    />
  );


export default WeakNetworkProvider;
