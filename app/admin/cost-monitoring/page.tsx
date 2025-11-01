'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PagePermission from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin-permission-manager';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  LineChart,
  RefreshCw,
  Calendar,
  Users,
  Target,
  Calculator
} from 'lucide-react';

// 导入图表组件（假设使用 Recharts）
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// API 基础URL
const API_BASE = '/api/admin/costs';

interface CostStatistics {
  id: string;
  stat_date: string;
  total_cost: number;
  incentive_cost: number;
  operation_cost: number;
  referral_cost: number;
  lottery_cost: number;
  task_reward_cost: number;
  checkin_cost: number;
  first_charge_cost: number;
  server_cost: number;
  maintenance_cost: number;
  payment_fee_cost: number;
}

interface ROIData {
  id: string;
  analysis_type: string;
  reference_name: string;
  total_revenue: number;
  total_cost: number;
  roi_percentage: number;
  profit_margin: number;
  user_count: number;
  transaction_count: number;
  analysis_date: string;
}

interface CostBreakdown {
  id: string;
  breakdown_type: string;
  user_type: string;
  cost_amount: number;
  user_count: number;
  transaction_count: number;
  cost_per_user: number;
  breakdown_date: string;
}

interface TrendData {
  date: string;
  totalCost: number;
  incentiveCost: number;
  operationCost: number;
  referralCost: number;
  lotteryCost: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function CostMonitoringPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // 数据状态
  const [costStatistics, setCostStatistics] = useState<CostStatistics[]>([]);
  const [roiData, setROIData] = useState<ROIData[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  
  // 汇总数据
  const [summaryStats, setSummaryStats] = useState({
    totalCost: 0,
    averageDailyCost: 0,
    totalRevenue: 0,
    roi: 0,
    profitMargin: 0,
    userCount: 0,
    transactionCount: 0
  });

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCostStatistics(),
        loadROIData(),
        loadCostBreakdown(),
        loadTrendData()
      ]);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCostStatistics = async () => {
    const response = await fetch(
      `${API_BASE}/daily?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=100`
    );
    const result = await response.json();
    if (result.data) {
      setCostStatistics(result.data);
      setSummaryStats(prev => ({
        ...prev,
        totalCost: result.summary?.totalCost || 0,
        averageDailyCost: result.summary?.averageDailyCost || 0
      }));
    }
  };

  const loadROIData = async () => {
    const response = await fetch(
      `${API_BASE}/roi?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=50`
    );
    const result = await response.json();
    if (result.data) {
      setROIData(result.data);
      setSummaryStats(prev => ({
        ...prev,
        totalRevenue: result.summary?.totalRevenue || 0,
        roi: result.summary?.roiPercentage || 0,
        profitMargin: result.summary?.profitMargin || 0,
        userCount: result.summary?.totalUserCount || 0,
        transactionCount: result.summary?.totalTransactionCount || 0
      }));
    }
  };

  const loadCostBreakdown = async () => {
    const response = await fetch(
      `${API_BASE}/breakdown?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
    );
    const result = await response.json();
    if (result.data) {
      setCostBreakdown(result.data);
    }
  };

  const loadTrendData = async () => {
    const response = await fetch(
      `${API_BASE}/trends?period=30d&groupBy=daily`
    );
    const result = await response.json();
    if (result.data) {
      setTrendData(result.data);
    }
  };

  // 计算今日成本数据
  const todayStats = costStatistics[0] || {
    total_cost: 0,
    incentive_cost: 0,
    operation_cost: 0,
    referral_cost: 0,
    lottery_cost: 0
  };

  // 格式化数字
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'TJS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // 组件加载时获取数据
  useEffect(() => {
    loadData();
  }, [dateRange]);

  // 成本趋势图表数据处理
  const trendChartData = trendData.map(item => ({
    date: new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    总成本: item.totalCost,
    激励成本: item.incentiveCost,
    运营成本: item.operationCost,
    邀请成本: item.referralCost,
    抽奖成本: item.lotteryCost
  }));

  // 成本占比图表数据
  const costBreakdownChartData = [
    { name: '激励成本', value: todayStats.incentive_cost || 0, color: '#0088FE' },
    { name: '运营成本', value: todayStats.operation_cost || 0, color: '#00C49F' },
    { name: '邀请成本', value: todayStats.referral_cost || 0, color: '#FFBB28' },
    { name: '抽奖成本', value: todayStats.lottery_cost || 0, color: '#FF8042' }
  ].filter(item => item.value > 0);

  // ROI趋势数据
  const roiChartData = roiData.slice(0, 7).reverse().map(item => ({
    date: new Date(item.analysis_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    ROI: parseFloat(item.roi_percentage.toString()),
    利润率: parseFloat(item.profit_margin.toString())
  }));

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">成本监控中心</h1>
          <p className="text-gray-600 mt-1">平台成本分析与ROI计算系统</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="startDate">开始日期:</Label>
            <Input
              id="startDate"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-40"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="endDate">结束日期:</Label>
            <Input
              id="endDate"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-40"
            />
          </div>
          <Button onClick={loadData} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日总成本</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayStats.total_cost || 0)}</div>
            <p className="text-xs text-muted-foreground">
              日均成本: {formatCurrency(summaryStats.averageDailyCost || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(summaryStats.roi || 0)}</div>
            <p className="text-xs text-muted-foreground">
              利润率: {formatPercentage(summaryStats.profitMargin || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">用户数量</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.userCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              交易数: {summaryStats.transactionCount || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              净利润: {formatCurrency((summaryStats.totalRevenue || 0) - (summaryStats.totalCost || 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">成本概览</TabsTrigger>
          <TabsTrigger value="trends">成本趋势</TabsTrigger>
          <TabsTrigger value="roi">ROI分析</TabsTrigger>
          <TabsTrigger value="breakdown">成本细分</TabsTrigger>
        </TabsList>

        {/* 成本概览 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 成本占比饼图 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  成本占比分析
                </CardTitle>
                <CardDescription>今日各项成本分布情况</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <RechartsPieChart data={costBreakdownChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                      {costBreakdownChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPieChart>
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 成本明细表格 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  成本明细
                </CardTitle>
                <CardDescription>详细成本构成分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">激励成本</span>
                    <Badge variant="secondary">{formatCurrency(todayStats.incentive_cost || 0)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">运营成本</span>
                    <Badge variant="secondary">{formatCurrency(todayStats.operation_cost || 0)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">邀请裂变成本</span>
                    <Badge variant="secondary">{formatCurrency(todayStats.referral_cost || 0)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">抽奖成本</span>
                    <Badge variant="secondary">{formatCurrency(todayStats.lottery_cost || 0)}</Badge>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center font-bold">
                      <span>总计</span>
                      <Badge variant="default">{formatCurrency(todayStats.total_cost || 0)}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 成本趋势 */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                成本趋势分析
              </CardTitle>
              <CardDescription>过去30天各项成本变化趋势</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Legend />
                  <Area type="monotone" dataKey="总成本" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="激励成本" stackId="2" stroke="#0088FE" fill="#0088FE" />
                  <Area type="monotone" dataKey="运营成本" stackId="3" stroke="#00C49F" fill="#00C49F" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROI分析 */}
        <TabsContent value="roi" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROI趋势图 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  ROI趋势
                </CardTitle>
                <CardDescription>投资回报率变化趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={roiChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `${value}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="ROI" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="利润率" stroke="#82ca9d" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ROI分析表格 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  ROI详情
                </CardTitle>
                <CardDescription>最近7天的ROI分析数据</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roiData.slice(0, 7).map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.reference_name}</h4>
                          <p className="text-sm text-gray-500">{item.analysis_date}</p>
                        </div>
                        <Badge variant={item.roi_percentage > 0 ? "default" : "destructive"}>
                          {formatPercentage(parseFloat(item.roi_percentage.toString()))}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-500">收入</p>
                          <p className="font-medium">{formatCurrency(parseFloat(item.total_revenue.toString()))}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">成本</p>
                          <p className="font-medium">{formatCurrency(parseFloat(item.total_cost.toString()))}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 成本细分 */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                成本细分分析
              </CardTitle>
              <CardDescription>按用户类型和时间维度的成本分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 按用户类型分析 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">按用户类型分析</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['new_user', 'active_user', 'vip_user'].map((userType) => {
                      const userData = costBreakdown.filter(item => item.user_type === userType);
                      const totalCost = userData.reduce((sum, item) => sum + parseFloat(item.cost_amount.toString()), 0);
                      const totalUsers = userData.reduce((sum, item) => sum + item.user_count, 0);
                      const avgCostPerUser = totalUsers > 0 ? totalCost / totalUsers : 0;

                      const userTypeNames: Record<string, string> = {
                        new_user: '新用户',
                        active_user: '活跃用户',
                        vip_user: 'VIP用户'
                      };

                      return (
                        <div key={userType} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">{userTypeNames[userType]}</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">总成本</span>
                              <span className="font-medium">{formatCurrency(totalCost)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">用户数</span>
                              <span className="font-medium">{totalUsers}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">人均成本</span>
                              <span className="font-medium">{formatCurrency(avgCostPerUser)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 数据加载状态 */}
      {loading && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>正在加载数据，请稍候...</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function WrappedCostMonitoringPage() {
  return (
    <PagePermission permissions={AdminPermissions.stats.read()}>
      <CostMonitoringPage />
    </PagePermission>
  );
}
