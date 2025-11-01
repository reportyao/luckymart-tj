'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  AreaChart, 
  RadarChart,
  ChartData,
  LineChartData,
  BarChartData 
} from '@/components/ui/chart';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// 接口定义
interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeRounds: number;
  pendingWithdrawals: number;
  monthlyGrowth: number;
  conversionRate: number;
  avgOrderValue: number;
}

interface UserStats {
  newUsers: number;
  activeUsers: number;
  totalUsers: number;
  userRetention: number;
  userGrowthTrend: LineChartData[];
  userSourceData: ChartData[];
}

interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  orderTrend: LineChartData[];
  orderStatusDistribution: ChartData[];
  topProducts: BarChartData[];
}

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  revenueTrend: LineChartData[];
  paymentMethodDistribution: ChartData[];
  commissionData: ChartData[];
}

interface RiskData {
  riskScore: number;
  totalAlerts: number;
  suspiciousActivities: number;
  blockedUsers: number;
  riskTrend: LineChartData[];
  riskCategoryDistribution: ChartData[];
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  badge?: number;
}

interface AdminDashboardProps {
  className?: string;
  showRealTimeUpdates?: boolean;
  refreshInterval?: number; // 秒
  onRefresh?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  className = '',
  showRealTimeUpdates = true,
  refreshInterval = 30,
  onRefresh
}) => {
  const router = useRouter();
  
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  
  // 数据状态
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeRounds: 0,
    pendingWithdrawals: 0,
    monthlyGrowth: 0,
    conversionRate: 0,
    avgOrderValue: 0
  });
  
  const [userStats, setUserStats] = useState<UserStats>({
    newUsers: 0,
    activeUsers: 0,
    totalUsers: 0,
    userRetention: 0,
    userGrowthTrend: [],
    userSourceData: []
  });
  
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    orderTrend: [],
    orderStatusDistribution: [],
    topProducts: []
  });
  
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    revenueTrend: [],
    paymentMethodDistribution: [],
    commissionData: []
  });
  
  const [riskData, setRiskData] = useState<RiskData>({
    riskScore: 0,
    totalAlerts: 0,
    suspiciousActivities: 0,
    blockedUsers: 0,
    riskTrend: [],
    riskCategoryDistribution: []
  });

  // 快捷操作配置
  const quickActions: QuickAction[] = [
    {
      id: 'products',
      title: '商品管理',
      description: '管理平台商品',
      path: '/admin/products',
      color: 'text-indigo-600 hover:text-indigo-700 hover:border-indigo-500',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      id: 'lottery',
      title: '开奖管理',
      description: '查看和管理开奖',
      path: '/admin/lottery',
      color: 'text-red-600 hover:text-red-700 hover:border-red-500',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      id: 'orders',
      title: '订单管理',
      description: '处理订单发货',
      path: '/admin/orders',
      color: 'text-green-600 hover:text-green-700 hover:border-green-500',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      id: 'withdrawals',
      title: '提现审核',
      description: '审核用户提现',
      path: '/admin/withdrawals',
      color: 'text-yellow-600 hover:text-yellow-700 hover:border-yellow-500',
      badge: dashboardStats.pendingWithdrawals,
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'users',
      title: '用户管理',
      description: '管理用户信息',
      path: '/admin/users',
      color: 'text-purple-600 hover:text-purple-700 hover:border-purple-500',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'risk',
      title: '风控面板',
      description: '风险数据总览',
      path: '/admin/risk-dashboard',
      color: 'text-red-600 hover:text-red-700 hover:border-red-500',
      badge: riskData.totalAlerts,
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    }
  ];

  // 模拟数据获取
  const fetchDashboardData = useCallback(async () => {
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟数据
      setDashboardStats({
        totalUsers: 15847,
        totalOrders: 8932,
        totalRevenue: 125847.50,
        activeRounds: 12,
        pendingWithdrawals: 28,
        monthlyGrowth: 15.2,
        conversionRate: 3.8,
        avgOrderValue: 14.09
      });

      setUserStats({
        newUsers: 342,
        activeUsers: 2156,
        totalUsers: 15847,
        userRetention: 78.5,
        userGrowthTrend: [
          { x: '周一', y: 120 },
          { x: '周二', y: 180 },
          { x: '周三', y: 150 },
          { x: '周四', y: 220 },
          { x: '周五', y: 280 },
          { x: '周六', y: 320 },
          { x: '周日', y: 290 }
        ],
        userSourceData: [
          { label: '自然流量', value: 45 },
          { label: '邀请推荐', value: 30 },
          { label: '广告投放', value: 15 },
          { label: '社交媒体', value: 10 }
        ]
      });

      setOrderStats({
        totalOrders: 8932,
        completedOrders: 7234,
        pendingOrders: 1456,
        cancelledOrders: 242,
        orderTrend: [
          { x: '周一', y: 120 },
          { x: '周二', y: 180 },
          { x: '周三', y: 150 },
          { x: '周四', y: 220 },
          { x: '周五', y: 280 },
          { x: '周六', y: 320 },
          { x: '周日', y: 290 }
        ],
        orderStatusDistribution: [
          { label: '已完成', value: 81, color: '#10B981' },
          { label: '处理中', value: 16, color: '#F59E0B' },
          { label: '已取消', value: 3, color: '#EF4444' }
        ],
        topProducts: [
          { label: '产品A', value: 1200 },
          { label: '产品B', value: 980 },
          { label: '产品C', value: 750 },
          { label: '产品D', value: 650 },
          { label: '产品E', value: 420 }
        ]
      });

      setFinancialStats({
        totalRevenue: 125847.50,
        monthlyRevenue: 45230.80,
        revenueGrowth: 12.5,
        revenueTrend: [
          { x: '1月', y: 32000 },
          { x: '2月', y: 35000 },
          { x: '3月', y: 38000 },
          { x: '4月', y: 42000 },
          { x: '5月', y: 45000 },
          { x: '6月', y: 48200 }
        ],
        paymentMethodDistribution: [
          { label: '支付宝', value: 45, color: '#1890FF' },
          { label: '微信支付', value: 35, color: '#07C160' },
          { label: '银行卡', value: 15, color: '#722ED1' },
          { label: '其他', value: 5, color: '#8C8C8C' }
        ],
        commissionData: [
          { label: '已结算', value: 8500 },
          { label: '待结算', value: 3200 },
          { label: '冻结中', value: 800 }
        ]
      });

      setRiskData({
        riskScore: 23,
        totalAlerts: 7,
        suspiciousActivities: 12,
        blockedUsers: 3,
        riskTrend: [
          { x: '周一', y: 5 },
          { x: '周二', y: 8 },
          { x: '周三', y: 3 },
          { x: '周四', y: 12 },
          { x: '周五', y: 7 },
          { x: '周六', y: 9 },
          { x: '周日', y: 4 }
        ],
        riskCategoryDistribution: [
          { label: '异常登录', value: 35, color: '#FF7875' },
          { label: '可疑交易', value: 28, color: '#FAAD14' },
          { label: '刷单行为', value: 22, color: '#FA541C' },
          { label: '其他', value: 15, color: '#A0D911' }
        ]
      });

      setError(null);
    } catch (err) {
      setError('数据加载失败，请重试');
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastUpdated(new Date());
    }
  }, []);

  // 手动刷新
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    onRefresh?.();
  }, [fetchDashboardData, onRefresh]);

  // 实时更新
  useEffect(() => {
    if (!showRealTimeUpdates) return;

    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [fetchDashboardData, showRealTimeUpdates, refreshInterval]);

  // 处理快捷操作点击
  const handleQuickAction = (action: QuickAction) => {
    router.push(action.path);
  };

  // 格式化数字
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // 格式化货币
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载管理员仪表盘...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? '刷新中...' : '重新加载'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">管理员仪表盘</h1>
                <p className="text-sm text-gray-600">
                  系统概览和数据分析 • 最后更新: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <svg 
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? '刷新中...' : '刷新'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 核心指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">总用户数</h3>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{formatNumber(dashboardStats.totalUsers)}</p>
            <div className="flex items-center text-sm">
              <span className="text-green-600 font-medium">+{dashboardStats.monthlyGrowth}%</span>
              <span className="text-gray-500 ml-1">较上月</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">总订单数</h3>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{formatNumber(dashboardStats.totalOrders)}</p>
            <div className="flex items-center text-sm">
              <span className="text-gray-500">转化率</span>
              <span className="text-green-600 font-medium ml-1">{dashboardStats.conversionRate}%</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">总营收</h3>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(dashboardStats.totalRevenue)}</p>
            <div className="flex items-center text-sm">
              <span className="text-green-600 font-medium">+{financialStats.revenueGrowth}%</span>
              <span className="text-gray-500 ml-1">较上月</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">进行中期次</h3>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{dashboardStats.activeRounds}</p>
            <div className="flex items-center text-sm">
              <span className="text-gray-500">活跃期次</span>
            </div>
          </Card>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 用户增长趋势 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">用户增长趋势</h3>
            <LineChart 
              data={userStats.userGrowthTrend}
              height={300}
              color="#3B82F6"
              showGrid={true}
              showDots={true}
            />
          </Card>

          {/* 订单趋势 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">订单趋势</h3>
            <AreaChart 
              data={orderStats.orderTrend}
              height={300}
              color="#10B981"
              fillColor="#10B98120"
              gradient={true}
            />
          </Card>

          {/* 收入趋势 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">收入趋势</h3>
            <AreaChart 
              data={financialStats.revenueTrend}
              height={300}
              color="#8B5CF6"
              fillColor="#8B5CF620"
              gradient={true}
            />
          </Card>

          {/* 风险趋势 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">风险事件趋势</h3>
            <LineChart 
              data={riskData.riskTrend}
              height={300}
              color="#EF4444"
              showGrid={true}
              showDots={true}
            />
          </Card>
        </div>

        {/* 数据分布图表 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* 订单状态分布 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">订单状态分布</h3>
            <PieChart 
              data={orderStats.orderStatusDistribution}
              size={250}
              showLabels={true}
              showPercentages={true}
              innerRadius={40}
              outerRadius={80}
            />
          </Card>

          {/* 用户来源分布 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">用户来源分布</h3>
            <PieChart 
              data={userStats.userSourceData}
              size={250}
              showLabels={true}
              showPercentages={true}
              innerRadius={40}
              outerRadius={80}
            />
          </Card>

          {/* 风险分类分布 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">风险分类分布</h3>
            <PieChart 
              data={riskData.riskCategoryDistribution}
              size={250}
              showLabels={true}
              showPercentages={true}
              innerRadius={40}
              outerRadius={80}
            />
          </Card>
        </div>

        {/* 热销产品排行 */}
        <div className="mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">热销产品排行</h3>
            <BarChart 
              data={orderStats.topProducts}
              height={300}
              showValues={true}
              colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']}
            />
          </Card>
        </div>

        {/* 快捷操作 */}
        <div className="mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">快捷操作</h2>
              <span className="text-sm text-gray-500">点击快速访问管理功能</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  className={`p-6 border-2 border-gray-200 rounded-xl transition-all text-left hover:shadow-md ${action.color}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <action.icon className="w-10 h-10" />
                    {action.badge && action.badge > 0 && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* 实时监控指标 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">实时监控</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">风险评分</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${riskData.riskScore > 50 ? 'bg-red-500' : riskData.riskScore > 25 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm font-bold text-gray-900">{riskData.riskScore}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">待审核提现</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${dashboardStats.pendingWithdrawals > 20 ? 'bg-red-500' : dashboardStats.pendingWithdrawals > 10 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm font-bold text-gray-900">{dashboardStats.pendingWithdrawals}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">可疑活动</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${riskData.suspiciousActivities > 10 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm font-bold text-gray-900">{riskData.suspiciousActivities}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">用户留存率</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${userStats.userRetention > 70 ? 'bg-green-500' : userStats.userRetention > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-bold text-gray-900">{userStats.userRetention}%</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">系统状态</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">活跃用户</span>
                <span className="text-sm font-bold text-green-600">{formatNumber(userStats.activeUsers)}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">今日新增用户</span>
                <span className="text-sm font-bold text-blue-600">{userStats.newUsers}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">平均订单金额</span>
                <span className="text-sm font-bold text-purple-600">{formatCurrency(dashboardStats.avgOrderValue)}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">月度收入</span>
                <span className="text-sm font-bold text-green-600">{formatCurrency(financialStats.monthlyRevenue)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;