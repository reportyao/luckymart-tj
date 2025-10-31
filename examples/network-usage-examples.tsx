// network-usage-examples.ts - 网络优化系统使用示例
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRetry } from '@/utils/network-retry';
import { useRequestDegradation, DEGRADATION_PRESETS } from '@/utils/request-degradation';
import { useNetworkStatus, useNetworkIndicator } from '@/hooks/use-network-status';
import { useRequestQueue, QueuePriority } from '@/utils/request-queue';
import NetworkStatusIndicator from '@/components/NetworkStatusIndicator';
import OfflineFallback from '@/components/OfflineFallback';

// 示例1: 基本网络重试使用
export function BasicRetryExample() {
  const { t } = useTranslation();
  const { executeWithRetry, isRetrying, networkQuality } = useRetry();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    try {
      const result = await executeWithRetry(async () => {
        const response = await fetch('/api/user/profile');
        if (!response.ok) throw new Error('获取用户数据失败');
        return response.json();
      }, {
        maxRetries: 3,
        baseDelay: 1000,
        timeout: 10000
      });
      
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
      setData(null);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">基本重试示例</h3>
      
      <button 
        onClick={fetchUserData}
        disabled={isRetrying}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isRetrying ? t('common.loading', '加载中...') : t('common.refresh', '刷新')}
      </button>

      {error && (
        <div className="text-red-600 mt-2">
          {error}
        </div>
      )}

      {data && (
        <div className="mt-2 p-2 bg-green-50 rounded">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      <div className="text-sm text-gray-600 mt-2">
        网络质量: {networkQuality}
      </div>
    </div>
  );
}

// 示例2: 请求降级策略使用
export function DegradationExample() {
  const { executeWithDegradation, isLoading, error } = useRequestDegradation();
  const [products, setProducts] = useState([]);
  const [source, setSource] = useState('');

  const fetchProducts = async () => {
    try {
      const result = await executeWithDegradation(
        'products-list',
        async () => {
          const response = await fetch('/api/products');
          if (!response.ok) throw new Error('获取商品列表失败');
          return response.json();
        },
        DEGRADATION_PRESETS.PRODUCTS
      );

      setProducts(result.data || []);
      setSource(result.source);
    } catch (err) {
      console.error('获取商品列表失败:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">请求降级示例</h3>

      <button 
        onClick={fetchProducts}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        重新获取商品列表
      </button>

      {isLoading && (
        <div className="text-blue-600 mt-2">
          正在加载...
        </div>
      )}

      {error && (
        <div className="text-red-600 mt-2">
          错误: {error}
        </div>
      )}

      <div className="mt-2 text-sm text-gray-600">
        数据来源: {source}
      </div>

      <div className="mt-4 space-y-2">
        {products.map((product, index) => (
          <div key={index} className="p-2 border rounded">
            <div className="font-medium">{product.name || '未命名商品'}</div>
            <div className="text-sm text-gray-600">价格: {product.price || '未知'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 示例3: 网络状态监控
export function NetworkStatusExample() {
  const { 
    networkStatus, 
    networkHistory, 
    refreshNetworkStatus,
    testNetworkLatency 
  } = useNetworkStatus();
  const [latency, setLatency] = useState(0);

  const handleTestLatency = async () => {
    const result = await testNetworkLatency();
    setLatency(result);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">网络状态监控</h3>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span>在线状态:</span>
          <span className={networkStatus.isOnline ? 'text-green-600' : 'text-red-600'}>
            {networkStatus.isOnline ? '在线' : '离线'}
          </span>
        </div>

        <div className="flex justify-between">
          <span>网络质量:</span>
          <span>{networkStatus.networkQuality}</span>
        </div>

        <div className="flex justify-between">
          <span>连接类型:</span>
          <span>{networkStatus.connectionType || '未知'}</span>
        </div>

        <div className="flex justify-between">
          <span>延迟测试:</span>
          <span>{latency > 0 ? `${latency.toFixed(2)}ms` : '未测试'}</span>
        </div>
      </div>

      <div className="mt-4 space-x-2">
        <button 
          onClick={refreshNetworkStatus}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          刷新状态
        </button>
        
        <button 
          onClick={handleTestLatency}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm"
        >
          测试延迟
        </button>
      </div>

      <div className="mt-4">
        <h4 className="font-medium mb-2">网络事件历史</h4>
        <div className="text-sm space-y-1">
          {networkHistory.events.slice(-5).map((event, index) => (
            <div key={index} className="text-gray-600">
              {new Date(event.timestamp).toLocaleTimeString()}: {event.type} - {event.networkQuality}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 示例4: 请求队列管理
export function QueueExample() {
  const { add, stats, isPaused, pause, resume } = useRequestQueue();
  const [results, setResults] = useState([]);

  const handleAddRequest = async () => {
    const id = add(async () => {
      // 模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // 模拟失败情况
      if (Math.random() > 0.7) {
        throw new Error('模拟网络错误');
      }
      
      return { timestamp: Date.now(), data: '成功获取数据' };
    }, {
      priority: QueuePriority.NORMAL,
      onSuccess: (result) => {
        setResults(prev => [...prev, result]);
      },
      onError: (error) => {
        console.error('请求失败:', error.message);
      }
    });

    console.log('添加请求:', id);
  };

  const handleAddBatch = () => {
    const operations = Array.from({ length: 3 }, (_, i) => ({
      operation: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { id: i + 1, data: `批量请求 ${i + 1}` };
      },
      options: {
        priority: QueuePriority.LOW,
        onSuccess: (result) => {
          setResults(prev => [...prev, result]);
        }
      }
    }));

    addBatch(operations);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">请求队列管理</h3>

      <div className="mb-4 space-x-2">
        <button 
          onClick={handleAddRequest}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          添加单个请求
        </button>
        
        <button 
          onClick={handleAddBatch}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm"
        >
          添加批量请求
        </button>

        <button 
          onClick={isPaused ? resume : pause}
          className={`px-3 py-1 rounded text-sm text-white ${
            isPaused ? 'bg-green-500' : 'bg-orange-500'
          }`}
        >
          {isPaused ? '恢复' : '暂停'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <div>队列总数: {stats.totalItems}</div>
          <div>待处理: {stats.pendingItems}</div>
          <div>处理中: {stats.processingItems}</div>
        </div>
        <div>
          <div>已完成: {stats.completedItems}</div>
          <div>失败: {stats.failedItems}</div>
          <div>成功率: {stats.successRate.toFixed(1)}%</div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">处理结果</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {results.map((result, index) => (
            <div key={index} className="text-sm text-green-600">
              ✓ {new Date(result.timestamp).toLocaleTimeString()} - {result.data}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 示例5: 完整的网络优化应用
export function CompleteNetworkApp() {
  const [currentView, setCurrentView] = useState('basic');
  const { indicator } = useNetworkIndicator();

  const views = [
    { id: 'basic', name: '基本重试', component: BasicRetryExample },
    { id: 'degradation', name: '请求降级', component: DegradationExample },
    { id: 'status', name: '状态监控', component: NetworkStatusExample },
    { id: 'queue', name: '队列管理', component: QueueExample }
  ];

  const CurrentComponent = views.find(v => v.id === currentView)?.component || BasicRetryExample;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 网络状态指示器 */}
      <NetworkStatusIndicator 
        position="top-right"
        variant="full"
        showDetails={true}
        refreshable={true}
      />

      {/* 离线降级包装器 */}
      <OfflineFallback
        position="overlay"
        showRetryButton={true}
        showRefreshButton={true}
      >
        <div className="container mx-auto py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              网络优化系统演示
            </h1>
            <p className="text-gray-600">
              网络质量: {indicator.text} {indicator.icon}
            </p>
          </div>

          {/* 导航 */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg shadow-sm p-1">
              {views.map(view => (
                <button
                  key={view.id}
                  onClick={() => setCurrentView(view.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === view.id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {view.name}
                </button>
              ))}
            </div>
          </div>

          {/* 内容区域 */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <CurrentComponent />
            </div>
          </div>
        </div>
      </OfflineFallback>
    </div>
  );
}

// 最佳实践示例
export class NetworkBestPractices {
  // 1. API调用的最佳实践
  static async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    retryConfig = {}
  ): Promise<T> {
    const { executeWithRetry } = useRetry();
    
    return await executeWithRetry(async () => {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    }, retryConfig);
  }

  // 2. 分页数据的优化加载
  static async fetchPaginatedData<T>(
    fetchFn: (page: number, limit: number) => Promise<T>,
    page: number = 1,
    limit: number = 20
  ) {
    const { executeWithDegradation } = useRequestDegradation();
    
    const cacheKey = `paginated-${page}-${limit}`;
    
    return await executeWithDegradation(
      cacheKey,
      () => fetchFn(page, limit),
      {
        ...DEGRADATION_PRESETS.PRODUCTS,
        priority: 'medium',
        staleWhileRevalidate: true
      }
    );
  }

  // 3. 图片加载的优化
  static optimizeImageLoading(
    imageUrl: string,
    options: {
      quality?: 'low' | 'medium' | 'high';
      format?: 'webp' | 'jpg' | 'png';
    } = {}
  ) {
    const { networkQuality } = useNetworkIndicator();
    const { executeWithDegradation } = useRequestDegradation();

    // 根据网络质量调整图片质量
    let optimizedUrl = imageUrl;
    if (options.quality) {
      const qualityParams = {
        low: '?q=60&w=400',
        medium: '?q=80&w=800',
        high: '?q=90&w=1200'
      };
      optimizedUrl = `${imageUrl}${qualityParams[options.quality]}`;
    }

    // 网络质量差时使用缓存版本
    if (networkQuality === 'poor' || networkQuality === 'fair') {
      optimizedUrl = `${optimizedUrl}&cache=true`;
    }

    return executeWithDegradation(
      `img-${optimizedUrl}`,
      async () => {
        const img = new Image();
        img.src = optimizedUrl;
        return new Promise((resolve, reject) => {
          img.onload = () => resolve(optimizedUrl);
          img.onerror = reject;
        });
      },
      {
        strategy: 'cache_first',
        cacheTimeout: 60000, // 1分钟缓存
        priority: 'low'
      }
    );
  }

  // 4. 实时数据的降级策略
  static async fetchRealtimeData<T>(
    fetchFn: () => Promise<T>,
    fallbackData: T
  ) {
    const { networkStatus } = useNetworkStatus();
    const { executeWithDegradation } = useRequestDegradation();

    // 网络质量好时使用实时数据
    if (networkStatus.networkQuality === 'excellent' && networkStatus.isOnline) {
      return await executeWithDegradation(
        'realtime-data',
        fetchFn,
        {
          strategy: 'network_first',
          cacheTimeout: 0, // 不缓存实时数据
          priority: 'high'
        }
      );
    }

    // 网络质量差或离线时返回降级数据
    return {
      data: fallbackData,
      source: 'fallback',
      stale: true
    };
  }

  // 5. 表单提交的可靠性保证
  static async submitFormWithRetry(
    formData: any,
    submitUrl: string
  ) {
    const { add } = useRequestQueue();
    
    return new Promise((resolve, reject) => {
      const id = add(async () => {
        const response = await fetch(submitUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error(`提交失败: ${response.status}`);
        }

        return response.json();
      }, {
        priority: QueuePriority.CRITICAL,
        maxAttempts: 5,
        timeout: 60000,
        onSuccess: resolve,
        onError: reject,
        metadata: {
          type: 'form_submit',
          formId: formData.id
        }
      });

      return id;
    });
  }

  // 6. 文件上传的断点续传
  static async uploadFileWithResume(
    file: File,
    uploadUrl: string,
    onProgress?: (progress: number) => void
  ) {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks = Math.ceil(file.size / chunkSize);
    
    const { add } = useRequestQueue();
    
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', i.toString());
      formData.append('totalChunks', chunks.toString());
      formData.append('fileName', file.name);

      add(async () => {
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`上传块 ${i} 失败`);
        }

        const progress = ((i + 1) / chunks) * 100;
        onProgress?.(progress);
        
        return response.json();
      }, {
        priority: QueuePriority.HIGH,
        metadata: {
          type: 'file_upload',
          fileName: file.name,
          chunkIndex: i
        }
      });
    }
  }
}

// 7. 网络质量自适应的组件
export function AdaptiveComponent({ 
  children,
  lowQualityFallback 
}: { 
  children: React.ReactNode;
  lowQualityFallback?: React.ReactNode;
}) {
  const { networkQuality, isOnline } = useNetworkIndicator();

  if (!isOnline) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold mb-2">网络连接已断开</h3>
        <p className="text-gray-600">请检查网络设置后重试</p>
      </div>
    );
  }

  if (networkQuality === 'poor' && lowQualityFallback) {
    return <>{lowQualityFallback}</>;
  }

  return <>{children}</>;
}

// 导出所有示例和最佳实践
export const NetworkExamples = {
  BasicRetryExample,
  DegradationExample,
  NetworkStatusExample,
  QueueExample,
  CompleteNetworkApp,
  NetworkBestPractices,
  AdaptiveComponent
};

export default NetworkExamples;