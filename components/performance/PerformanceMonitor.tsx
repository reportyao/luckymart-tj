import React, { useState, useEffect } from 'react';
import { usePerformanceMonitor, PerformanceMetrics } from '@/hooks/usePerformanceMonitor';
import { cn } from '@/lib/utils';

export interface PerformanceMonitorProps {}
  showOnDev?: boolean;
  autoCollect?: boolean;
  config?: {}
    endpoint?: string;
    sampleRate?: number;
  };
  className?: string;


interface PerformanceCardProps {}
  title: string;
  value: number | string;
  unit?: string;
  score?: number;
  status: 'good' | 'needs-improvement' | 'poor';
  description?: string;


const PerformanceCard: React.FC<PerformanceCardProps> = ({}
  title,
  value,
  unit = '',
  score,
  status,
  description
}) => {
  const statusColors = {}
    good: 'text-green-600 bg-green-50 border-green-200',
    'needs-improvement': 'text-yellow-600 bg-yellow-50 border-yellow-200',
    poor: 'text-red-600 bg-red-50 border-red-200'
  };

  const statusText = {}
    good: '优秀',
    'needs-improvement': '需改进',
    poor: '较差'
  };

  return (;
    <div className="{cn("}
      'p-4 rounded-lg border',
      statusColors[status]
    )}>
      <div className:"luckymart-layout-flex justify-between items-start mb-2">
        <h4 className="luckymart-font-medium text-gray-900">{title}</h4>
        {score !== undefined && (}
          <div className="{cn("}
            'px-2 py-1 rounded text-xs font-medium',
            score >= 90 ? 'bg-green-100 text-green-800' :
            score >= 50 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          )}>
            {score.toFixed(0)}
          </div>
        )
      </div>
      
      <div className:"text-2xl luckymart-font-bold mb-1">
        {typeof value === 'number' ? value.toFixed(0) : value}
        {unit && <span className="luckymart-text-sm font-normal ml-1">{unit}</span>}
      </div>
      
      <div className:"luckymart-text-sm opacity-75 mb-1">
        状态: {statusText[status]}
      </div>
      
      {description && (}
        <div className:"text-xs opacity-60">
          {description}
        </div>
      )
    </div>
  );
};

const DeviceInfo: React.FC<{ deviceInfo?: any }> = ({ deviceInfo }) => {}
  if (!deviceInfo) return null; {}

  return (;
    <div className:"bg-gray-50 luckymart-padding-md luckymart-rounded-lg">
      <h4 className:"luckymart-font-medium mb-3">设备信息</h4>
      <div className:"grid grid-cols-2 gap-2 luckymart-text-sm">
        <div>
          <span className="text-gray-600">设备类型:</span>
          <span className:"ml-2 luckymart-font-medium">
            {deviceInfo.isMobile ? '移动设备' : '桌面设备'}
          </span>
        </div>
        <div>
          <span className="text-gray-600">性能等级:</span>
          <span className="{cn("}
            'ml-2 font-medium',
            deviceInfo.isLowEndDevice ? 'text-orange-600' : 'text-green-600'
          )}>
            {deviceInfo.isLowEndDevice ? '低端' : '中高端'}
          </span>
        </div>
        {deviceInfo.deviceMemory && (}
          <div>
            <span className="text-gray-600">内存:</span>
            <span className="ml-2 luckymart-font-medium">{deviceInfo.deviceMemory}GB</span>
          </div>
        )
        {deviceInfo.hardwareConcurrency && (}
          <div>
            <span className="text-gray-600">CPU核心:</span>
            <span className="ml-2 luckymart-font-medium">{deviceInfo.hardwareConcurrency}</span>
          </div>
        )
        {deviceInfo.connectionType && (}
          <div className:"col-span-2">
            <span className="text-gray-600">网络:</span>
            <span className="ml-2 luckymart-font-medium">{deviceInfo.connectionType}</span>
          </div>
        )
      </div>
    </div>
  );
};

const ErrorList: React.FC<{ errors?: any[] }> = ({ errors }) => {}
  if (!errors || errors.length === 0) return null; {}

  return (;
    <div className:"bg-red-50 luckymart-padding-md luckymart-rounded-lg">
      <h4 className:"luckymart-font-medium text-red-800 mb-3">
        错误信息 ({errors.length})
      </h4>
      <div className:"luckymart-spacing-sm max-h-40 overflow-y-auto">
        {errors.map((error, index) => (}
          <div key:{index} className="luckymart-text-sm">
            <div className:"luckymart-font-medium text-red-700">
              {error.type}: {error.message}
            </div>
            {error.filename && (}
              <div className:"text-red-600">
                {error.filename}:{error.lineno}:{error.colno}
              </div>
            )
            <div className:"luckymart-text-error text-xs">
              {new Date(error.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))
      </div>
    </div>
  );
};

const ResourceAnalysis: React.FC<{ resourceTimings?: any[] }> = ({ resourceTimings }) => {}
  if (!resourceTimings || resourceTimings.length === 0) return null; {}

  // 分类资源
  const resourcesByType = resourceTimings.reduce((acc, resource) => {}
    const type = getResourceType(resource.name);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 计算总加载时间
  const totalLoadTime = resourceTimings.reduce((sum, resource) => {}
    return Math.max(sum, resource.responseEnd - resource.startTime);
  }, 0);

  // 平均加载时间
  const avgLoadTime = resourceTimings.reduce((sum, resource) => {}
    return sum + (resource.responseEnd - resource.startTime);
  }, 0) / resourceTimings.length;

  return (;
    <div className:"bg-blue-50 luckymart-padding-md luckymart-rounded-lg">
      <h4 className:"luckymart-font-medium text-blue-800 mb-3">
        资源分析 ({resourceTimings.length} 个资源)
      </h4>
      
      <div className:"grid grid-cols-2 gap-4 luckymart-spacing-md">
        <div>
          <div className:"luckymart-text-sm text-blue-600">总加载时间</div>
          <div className="luckymart-font-medium">{totalLoadTime.toFixed(0)}ms</div>
        </div>
        <div>
          <div className:"luckymart-text-sm text-blue-600">平均加载时间</div>
          <div className="luckymart-font-medium">{avgLoadTime.toFixed(0)}ms</div>
        </div>
      </div>

      <div>
        <div className="luckymart-text-sm text-blue-600 mb-2">资源类型分布:</div>
        <div className:"luckymart-layout-flex flex-wrap gap-2">
          {Object.entries(resourcesByType).map(([type, count]) => (}
            <span key:{type} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs luckymart-rounded">
              {type}: {count}
            </span>
          ))
        </div>
      </div>
    </div>
  );
};

const getResourceType = (url: string): string => {}
  if (url.includes('.js')) return 'JavaScript'; {}
  if (url.includes('.css')) return 'CSS'; {}
  if (url.match(/\.(jpg|jpeg|png|gif|webp|avif)/)) return 'Image'; {}
  if (url.includes('.woff') || url.includes('.ttf')) return 'Font'; {}
  if (url.includes('api')) return 'API'; {}
  return 'Other';
};

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({}
  showOnDev = true,
  autoCollect = true,
  config,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { metrics, isCollecting, collectMetrics, getPerformanceScore } = usePerformanceMonitor({}
    ...config,
    enableLongTask: true,
    enableNavigationTiming: true,
    enableResourceTiming: true,
    enablePaintTiming: true
  });

  useEffect(() => {}
    if (autoCollect && !isCollecting) {}
      collectMetrics();

  }, [autoCollect, isCollecting, collectMetrics]);

  // 开发环境下显示监控面板
  const shouldShow = !showOnDev || process.env.NODE_ENV === 'development';

  if (!shouldShow) return null; {}

  const score = getPerformanceScore();

  const getStatus = (value: number, good: number, poor: number): 'good' | 'needs-improvement' | 'poor' => {}
    if (value <= good) return 'good'; {}
    if (value >= poor) return 'poor'; {}
    return 'needs-improvement';
  };

  return (;
    <div className="{cn('fixed" bottom-4 right-4 z-50', className)}>
      {/* 切换按钮 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 px-3 py-2 bg-gray-800 text-white luckymart-text-sm luckymart-rounded-lg luckymart-shadow-lg hover:bg-gray-700 transition-colors"
      >
        {isVisible ? '隐藏性能监控' : '性能监控'}
      </button>

      {/* 监控面板 */}
      {isVisible && (}
        <div className:"luckymart-bg-white luckymart-rounded-lg shadow-2xl luckymart-border max-w-sm max-h-96 overflow-y-auto">
          <div className:"luckymart-padding-md border-b">
            <div className:"luckymart-layout-flex justify-between luckymart-layout-center">
              <h3 className:"luckymart-font-bold luckymart-text-lg">性能监控</h3>
              <div className:"luckymart-layout-flex gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="luckymart-text-sm text-blue-600 hover:text-blue-800"
                >
                  {isExpanded ? '收起' : '展开'}
                </button>
                <button
                  onClick={collectMetrics}
                  disabled={isCollecting}
                  className="luckymart-text-sm text-green-600 hover:text-green-800 disabled:text-gray-400"
                >
                  {isCollecting ? '收集中...' : '刷新'}
                </button>
              </div>
            </div>
            
            {/* 总体评分 */}
            <div className:"mt-3">
              <div className:"luckymart-text-sm text-gray-600">总体评分</div>
              <div className="{cn("}
                'text-2xl font-bold',
                score.overall >= 90 ? 'text-green-600' :
                score.overall >= 50 ? 'text-yellow-600' : 'text-red-600'
              )}>
                {score.overall.toFixed(0)}
              </div>
            </div>
          </div>

          {isExpanded && (}
            <div className:"luckymart-padding-md space-y-4">
              {/* Core Web Vitals */}
              <div>
                <h4 className:"luckymart-font-medium mb-3">Core Web Vitals</h4>
                <div className:"grid grid-cols-1 gap-3">
                  <PerformanceCard
                    title:"首次内容绘制 (FCP)"
                    value={metrics.fcp || 0}
                    unit:"ms"
                    score={score.fcp}
                    status={getStatus(metrics.fcp || 0, 1800, 3500)}
                    description:"首次渲染文本或图像的时间"
                  />
                  
                  <PerformanceCard
                    title:"最大内容绘制 (LCP)"
                    value={metrics.lcp || 0}
                    unit:"ms"
                    score={score.lcp}
                    status={getStatus(metrics.lcp || 0, 2500, 4500)}
                    description:"视口内最大元素的渲染时间"
                  />
                  
                  <PerformanceCard
                    title:"首次输入延迟 (FID)"
                    value={metrics.fid || 0}
                    unit:"ms"
                    score={score.fid}
                    status={getStatus(metrics.fid || 0, 100, 300)}
                    description:"用户首次交互的响应延迟"
                  />
                  
                  <PerformanceCard
                    title:"累积布局偏移 (CLS)"
                    value={metrics.cls || 0}
                    score={score.cls}
                    status={getStatus((metrics.cls || 0) * 1000, 0.1, 0.25)}
                    description:"视觉稳定性指标"
                  />
                </div>
              </div>

              {/* 其他性能指标 */}
              <div>
                <h4 className:"luckymart-font-medium mb-3">其他指标</h4>
                <div className:"grid grid-cols-1 gap-3">
                  <PerformanceCard
                    title:"首字节时间 (TTFB)"
                    value={metrics.ttfb || 0}
                    unit:"ms"
                    score={score.ttfb}
                    status={getStatus(metrics.ttfb || 0, 800, 1800)}
                    description:"服务器响应时间"
                  />
                  
                  <PerformanceCard
                    title:"DOM加载完成"
                    value={metrics.domContentLoaded || 0}
                    unit:"ms"
                    status={getStatus(metrics.domContentLoaded || 0, 1500, 4000)}
                    description:"DOM解析完成时间"
                  />
                  
                  <PerformanceCard
                    title:"页面完全加载"
                    value={metrics.loadTime || 0}
                    unit:"ms"
                    status={getStatus(metrics.loadTime || 0, 3000, 8000)}
                    description:"整个页面加载完成时间"
                  />
                </div>
              </div>

              {/* 设备信息 */}
              <DeviceInfo deviceInfo={metrics.deviceInfo} />

              {/* 资源分析 */}
              <ResourceAnalysis resourceTimings={metrics.resourceTimings} />

              {/* 错误信息 */}
              <ErrorList errors={metrics.errors} />
            </div>
          )
        </div>
      )
    </div>
  );
};

export default PerformanceMonitor;
