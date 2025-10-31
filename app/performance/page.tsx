'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  slowQueries: number;
  errorRate: number;
  cacheHitRate: number;
  topSlowEndpoints: Array<{
    endpoint: string;
    averageTime: number;
    maxTime: number;
    count: number;
    errorRate: number;
  }>;
}

interface CacheStats {
  maxSize: number;
  currentSize: number;
  activeEntries: number;
  expiredEntries: number;
  hitRate: number;
  memoryUsage: string;
}

interface PerformanceData {
  timestamp: number;
  performance: PerformanceStats;
  metrics: Record<string, any>;
  cache: Record<string, CacheStats>;
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
}

const PerformanceDashboard: React.FC = () => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // 秒

  // 获取性能数据
  const fetchData = useCallback(async (type: string = 'stats') => {
    try {
      setError(null);
      const response = await fetch(`/api/performance?type=${type}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || '获取性能数据失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '网络请求失败';
      setError(errorMessage);
      console.error('获取性能数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 刷新数据
  const refreshData = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // 清除数据
  const clearData = useCallback(async () => {
    try {
      const response = await fetch('/api/performance', {
        method: 'DELETE',
      });

      if (response.ok) {
        setData(null);
        alert('性能监控数据已清除');
      } else {
        throw new Error('清除数据失败');
      }
    } catch (err) {
      console.error('清除数据失败:', err);
      alert('清除数据失败');
    }
  }, []);

  // 记录自定义指标
  const recordMetric = useCallback(async (name: string, value: number) => {
    try {
      const response = await fetch('/api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, value }),
      });

      if (response.ok) {
        refreshData();
      } else {
        throw new Error('记录指标失败');
      }
    } catch (err) {
      console.error('记录指标失败:', err);
    }
  }, [refreshData]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) {return;}

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // 初始加载
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 格式化数字
  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toFixed(decimals);
  };

  // 获取状态颜色
  const getStatusColor = (value: number, thresholds: [number, number]): string => {
    if (value < thresholds[0]) {return 'text-green-600';}
    if (value < thresholds[1]) {return 'text-yellow-600';}
    return 'text-red-600';
  };

  // 性能指标卡片组件
  const MetricCard: React.FC<{
    title: string;
    value: number | string;
    unit?: string;
    color?: string;
    icon: React.ReactNode;
  }> = ({ title, value, unit = '', color = 'text-gray-900', icon }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>
            {typeof value === 'number' ? formatNumber(value) : value}
            {unit && <span className="text-sm ml-1">{unit}</span>}
          </p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-lg text-gray-600">加载性能数据...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400 text-2xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">加载失败</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={refreshData}
                className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 页面标题和控制 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">性能监控面板</h1>
        <div className="flex items-center space-x-4">
          {/* 自动刷新开关 */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">自动刷新</span>
          </label>
          
          {/* 刷新间隔 */}
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value={10}>10秒</option>
            <option value={30}>30秒</option>
            <option value={60}>1分钟</option>
            <option value={300}>5分钟</option>
          </select>

          {/* 操作按钮 */}
          <button
            onClick={refreshData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
          >
            {loading ? '刷新中...' : '刷新'}
          </button>

          <button
            onClick={clearData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            清除数据
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* 关键性能指标 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="总请求数"
              value={data.summary.totalRequests}
              icon="📊"
            />
            <MetricCard
              title="平均响应时间"
              value={data.summary.averageResponseTime}
              unit="ms"
              color={getStatusColor(data.summary.averageResponseTime, [200, 500])}
              icon="⚡"
            />
            <MetricCard
              title="缓存命中率"
              value={data.summary.cacheHitRate}
              unit="%"
              color={getStatusColor(100 - data.summary.cacheHitRate, [20, 50])}
              icon="💾"
            />
            <MetricCard
              title="错误率"
              value={data.summary.errorRate}
              unit="%"
              color={getStatusColor(data.summary.errorRate, [1, 5])}
              icon="❌"
            />
          </div>

          {/* 详细统计 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 性能统计 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">性能统计</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">慢查询数量:</span>
                  <span className="font-medium text-yellow-600">
                    {data.performance.slowQueries}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">平均响应时间:</span>
                  <span className="font-medium">{formatNumber(data.performance.averageResponseTime)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">错误率:</span>
                  <span className={`font-medium ${getStatusColor(data.performance.errorRate, [1, 5])}`}>
                    {formatNumber(data.performance.errorRate)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 缓存统计 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">缓存统计</h2>
              <div className="space-y-3">
                {Object.entries(data.cache).map(([name, stats]) => (
                  <div key={name} className="border-b border-gray-200 pb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">{name}</span>
                      <span className="text-sm text-gray-500">{stats.currentSize}/{stats.maxSize}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      命中率: {formatNumber(stats.hitRate)}% | 
                      内存: {stats.memoryUsage}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 慢查询详情 */}
          {data.performance.topSlowEndpoints.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">慢查询详情</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">端点</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">最大时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">请求次数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">错误率</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.performance.topSlowEndpoints.map((endpoint, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {endpoint.endpoint}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatNumber(endpoint.averageTime)}ms
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatNumber(endpoint.maxTime)}ms
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {endpoint.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatNumber(endpoint.errorRate)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 更新时间 */}
          <div className="text-center text-sm text-gray-500">
            最后更新: {new Date(data.timestamp).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceDashboard;