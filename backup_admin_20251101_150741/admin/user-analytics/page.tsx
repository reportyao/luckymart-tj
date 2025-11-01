'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserAnalyticsData {
  behavior: {
    statistics: any;
    behaviorTypeDistribution: any[];
    heatmap: any[];
  };
  engagement: {
    summary: any;
    distribution: any[];
    trends: any[];
    segmentation: any[];
  };
  retention: {
    overview: any;
    trends: any[];
    funnel: any[];
    segmentComparison: any[];
  };
  spending: {
    overview: any;
    trends: any[];
    segments: any[];
    rfmAnalysis: any[];
    highValueCustomers: any[];
  };
}

function UserAnalytics() {
  const router = useRouter();
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<UserAnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('admin_token');
    const info = localStorage.getItem('admin_info');
    
    if (!token || !info) {
      router.push('/admin');
      return;
    }

    setAdminInfo(JSON.parse(info));
    loadAnalyticsData();
  }, [router, dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      // 并行加载所有数据
      const [behaviorRes, engagementRes, retentionRes, spendingRes] = await Promise.all([
        fetch(`/api/admin/users/behavior?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/admin/users/engagement?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/admin/users/retention?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/admin/users/spending?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [behaviorData, engagementData, retentionData, spendingData] = await Promise.all([
        behaviorRes.json(),
        engagementRes.json(),
        retentionRes.json(),
        spendingRes.json()
      ]);

      setAnalyticsData({
        behavior: behaviorData.success ? behaviorData.data : {},
        engagement: engagementData.success ? engagementData.data : {},
        retention: retentionData.success ? retentionData.data : {},
        spending: spendingData.success ? spendingData.data : {}
      });
    } catch (error) {
      console.error('加载用户分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    router.push('/admin');
  };

  const renderOverview = () => {
    if (!analyticsData) return null;

    const { behavior, engagement, retention, spending } = analyticsData;

    return (
      <div className="space-y-6">
        {/* 核心指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">总用户数</h3>
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {spending.overview?.totalUsers || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">注册用户总数</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">活跃用户</h3>
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {engagement.summary?.activeUsers || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">参与度评分 &gt; 50</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">7日留存率</h3>
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {retention.overview?.day7Retention || 0}%
            </p>
            <p className="text-sm text-gray-500 mt-1">第7天留存比例</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">总营收</h3>
              <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {spending.overview?.totalRevenue?.toFixed(2) || '0.00'}
            </p>
            <p className="text-sm text-gray-500 mt-1">TJS 总消费金额</p>
          </div>
        </div>

        {/* 趋势图表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">用户活跃度趋势</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>活跃度趋势图表</p>
                <p className="text-sm text-gray-400">数据来源: 参与度统计</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">留存率趋势</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p>留存率趋势图表</p>
                <p className="text-sm text-gray-400">数据来源: 留存分析</p>
              </div>
            </div>
          </div>
        </div>

        {/* 用户分群 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">用户参与度分群</h3>
            <div className="space-y-3">
              {engagement.segmentation?.map((segment: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      segment.segment === 'vip_active' ? 'bg-purple-500' :
                      segment.segment === 'power_user' ? 'bg-blue-500' :
                      segment.segment === 'vip_regular' ? 'bg-indigo-500' :
                      segment.segment === 'regular_user' ? 'bg-green-500' :
                      segment.segment === 'casual_user' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {segment.segment === 'vip_active' ? 'VIP活跃用户' :
                       segment.segment === 'power_user' ? '强势用户' :
                       segment.segment === 'vip_regular' ? 'VIP普通用户' :
                       segment.segment === 'regular_user' ? '普通用户' :
                       segment.segment === 'casual_user' ? '偶尔用户' : '风险用户'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{segment.user_count}</div>
                    <div className="text-xs text-gray-500">{segment.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">消费分群</h3>
            <div className="space-y-3">
              {spending.segments?.map((segment: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      segment.spending_segment === 'vip' ? 'bg-purple-500' :
                      segment.spending_segment === 'high' ? 'bg-blue-500' :
                      segment.spending_segment === 'medium' ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {segment.spending_segment === 'vip' ? 'VIP用户' :
                       segment.spending_segment === 'high' ? '高消费用户' :
                       segment.spending_segment === 'medium' ? '中等消费用户' : '低消费用户'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{segment.user_count}</div>
                    <div className="text-xs text-gray-500">{segment.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBehavior = () => {
    if (!analyticsData?.behavior) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">用户行为统计</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analyticsData.behavior.statistics?.totalBehaviors || 0}
              </div>
              <div className="text-sm text-gray-600">总行为数</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analyticsData.behavior.statistics?.uniqueUsersCount || 0}
              </div>
              <div className="text-sm text-gray-600">活跃用户数</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analyticsData.behavior.statistics?.averageBehaviorsPerUser || 0}
              </div>
              <div className="text-sm text-gray-600">人均行为数</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">行为类型分布</h3>
          <div className="space-y-3">
            {analyticsData.behavior.behaviorTypeDistribution?.map((type: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {type.behavior_type}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {type._count.behavior_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderEngagement = () => {
    if (!analyticsData?.engagement) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">参与度概览</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analyticsData.engagement.summary?.averageEngagementScore || 0}
              </div>
              <div className="text-sm text-gray-600">平均参与度评分</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analyticsData.engagement.summary?.activeUsers || 0}
              </div>
              <div className="text-sm text-gray-600">活跃用户</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analyticsData.engagement.summary?.highlyEngagedUsers || 0}
              </div>
              <div className="text-sm text-gray-600">高参与度用户</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {analyticsData.engagement.summary?.totalUsers || 0}
              </div>
              <div className="text-sm text-gray-600">总用户数</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRetention = () => {
    if (!analyticsData?.retention) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">留存率概览</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {analyticsData.retention.overview?.day1Retention || 0}%
              </div>
              <div className="text-sm text-gray-600">次日留存</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {analyticsData.retention.overview?.day7Retention || 0}%
              </div>
              <div className="text-sm text-gray-600">7日留存</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {analyticsData.retention.overview?.day14Retention || 0}%
              </div>
              <div className="text-sm text-gray-600">14日留存</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analyticsData.retention.overview?.day30Retention || 0}%
              </div>
              <div className="text-sm text-gray-600">30日留存</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analyticsData.retention.overview?.totalUsers || 0}
              </div>
              <div className="text-sm text-gray-600">分析用户数</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">留存漏斗</h3>
          <div className="space-y-3">
            {analyticsData.retention.funnel?.map((stage: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${stage.retention_rate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                    {stage.users} ({stage.retention_rate}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSpending = () => {
    if (!analyticsData?.spending) return null;
    const spending = analyticsData.spending;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">消费概览</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {spending.overview?.totalRevenue?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-600">总营收 (TJS)</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {spending.overview?.averageSpentPerUser?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-600">人均消费</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {spending.overview?.averageCLV?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-600">平均CLV</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {spending.overview?.averageOrderValue?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-600">平均订单价值</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">RFM分析</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">R - 最近购买</div>
              <div className="text-sm text-gray-600 mt-2">距离最后购买时间</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">F - 购买频率</div>
              <div className="text-sm text-gray-600 mt-2">购买次数频率</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">M - 消费金额</div>
              <div className="text-sm text-gray-600 mt-2">累计消费金额</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载用户分析数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">用户行为分析</h1>
              <p className="text-sm text-gray-600">深入分析用户活跃度和消费行为</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            退出登录
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 日期范围选择 */}
        <div className="bg-white rounded-xl p-4 shadow-md mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={loadAnalyticsData}
              className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              刷新数据
            </button>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: '概览', icon: '📊' },
                { id: 'behavior', name: '行为分析', icon: '👤' },
                { id: 'engagement', name: '参与度', icon: '🔥' },
                { id: 'retention', name: '留存率', icon: '📈' },
                { id: 'spending', name: '消费分析', icon: '💰' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 标签页内容 */}
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'behavior' && renderBehavior()}
          {activeTab === 'engagement' && renderEngagement()}
          {activeTab === 'retention' && renderRetention()}
          {activeTab === 'spending' && renderSpending()}
        </div>
      </div>
    </div>
  );
}