'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PagePermission } from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin-permission-manager';
import { FiUsers, FiTrendingUp, FiActivity, FiUserPlus, FiRepeat, FiAward } from 'react-icons/fi';

interface GrowthMetrics {
  date: string;
  newUsers: number;
  activeUsers: number;
  retainedUsers: number;
  conversionRate: number;
  referralCount: number;
  checkInCount: number;
  tasksCompleted: number;
  totalRewards: number;
  kFactor: number;
}

interface UserSegment {
  segment: string;
  count: number;
  percentage: number;
}

function GrowthCenterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<GrowthMetrics | null>(null);
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchGrowthData();
  }, [router, timeRange]);

  const fetchGrowthData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const [metricsRes, segmentsRes] = await Promise.all([
        fetch(`/api/admin/growth/metrics?range=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/growth/segments', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const metricsData = await metricsRes.json();
      const segmentsData = await segmentsRes.json();

      if (metricsData.success) setMetrics(metricsData.data);
      if (segmentsData.success) setSegments(segmentsData.data);
    } catch (error) {
      console.error('获取增长数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, change, color }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">用户增长中心</h1>
              <p className="mt-1 text-sm text-gray-600">监控和优化用户增长指标</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="7d">近7天</option>
                <option value="30d">近30天</option>
                <option value="90d">近90天</option>
              </select>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 核心指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={FiUserPlus}
            title="新增用户"
            value={metrics?.newUsers || 0}
            change={12.5}
            color="bg-blue-500"
          />
          <StatCard
            icon={FiActivity}
            title="活跃用户"
            value={metrics?.activeUsers || 0}
            change={8.3}
            color="bg-green-500"
          />
          <StatCard
            icon={FiUsers}
            title="留存用户"
            value={metrics?.retainedUsers || 0}
            change={5.7}
            color="bg-purple-500"
          />
          <StatCard
            icon={FiRepeat}
            title="邀请数"
            value={metrics?.referralCount || 0}
            change={15.2}
            color="bg-orange-500"
          />
          <StatCard
            icon={FiAward}
            title="签到数"
            value={metrics?.checkInCount || 0}
            change={10.1}
            color="bg-pink-500"
          />
          <StatCard
            icon={FiTrendingUp}
            title="K因子"
            value={metrics?.kFactor?.toFixed(2) || '0.00'}
            change={3.4}
            color="bg-indigo-500"
          />
        </div>

        {/* 转化率和任务完成 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">转化指标</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">转化率</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {metrics?.conversionRate?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${metrics?.conversionRate || 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">任务完成率</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {((metrics?.tasksCompleted || 0) / ((metrics?.activeUsers || 1) * 5) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${((metrics?.tasksCompleted || 0) / ((metrics?.activeUsers || 1) * 5) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">用户分层</h3>
            <div className="space-y-3">
              {segments.map((segment, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      segment.segment === 'newbie' ? 'bg-blue-500' :
                      segment.segment === 'active' ? 'bg-green-500' :
                      'bg-gray-400'
                    }`} />
                    <span className="text-sm text-gray-700">
                      {segment.segment === 'newbie' ? '新手用户' :
                       segment.segment === 'active' ? '活跃用户' : '沉睡用户'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{segment.count}</span>
                    <span className="text-xs text-gray-500 ml-2">({segment.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 新手任务管理 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">新手任务配置</h3>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              添加任务
            </button>
          </div>
          <div className="text-center py-8 text-gray-500">
            新手任务管理功能开发中...
          </div>
        </div>

        {/* 增长趋势图表 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">增长趋势</h3>
          <div className="text-center py-12 text-gray-500">
            图表组件待集成（建议使用 Chart.js 或 Recharts）
          </div>
        </div>
      </div>
    </div>
  );
}


// 导出带权限控制的页面
function ProtectedGrowthCenterPage() {
  return (
    <PagePermission 
      permissions={AdminPermissions.stats.read()}
      showFallback={true}
    >
      <GrowthCenterPage />
    </PagePermission>
  );
}

export default ProtectedGrowthCenterPage;
