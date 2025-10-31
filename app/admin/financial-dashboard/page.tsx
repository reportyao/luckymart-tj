"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard, 
  PiggyBank,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

// 颜色配置
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface FinancialSummary {
  totalRevenue: number;
  actualReceived: number;
  totalOrders: number;
  averageOrderValue: number;
  growthRate: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  withdrawalStats: {
    totalAmount: number;
    totalUsers: number;
    successRate: number;
  };
}

interface TrendData {
  date: string;
  revenue?: number;
  profit?: number;
  cost?: number;
  orders?: number;
  withdrawals?: number;
}

export default function FinancialDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<any>({});
  const [profitData, setProfitData] = useState<any>({});

  // 获取财务概览数据
  const fetchFinancialOverview = async () => {
    setLoading(true);
    try {
      // 获取收入数据
      const revenueResponse = await fetch(`/api/admin/financial/revenue?periodType=daily&limit=30`);
      const revenueData = await revenueResponse.json();
      
      // 获取成本数据
      const costResponse = await fetch(`/api/admin/financial/costs?periodType=daily&limit=30`);
      const costData = await costResponse.json();
      
      // 获取利润数据
      const profitResponse = await fetch(`/api/admin/financial/profits?limit=30`);
      const profitData = await profitResponse.json();
      
      // 获取提现数据
      const withdrawalResponse = await fetch(`/api/admin/financial/withdrawals?periodType=daily&limit=30`);
      const withdrawalData = await withdrawalResponse.json();

      // 构建汇总数据
      const summaryData: FinancialSummary = {
        totalRevenue: revenueData.summary?.totalRevenue || 0,
        actualReceived: revenueData.summary?.actualReceived || 0,
        totalOrders: revenueData.summary?.totalOrders || 0,
        averageOrderValue: revenueData.summary?.averageOrderValue || 0,
        growthRate: revenueData.summary?.growthRate || 0,
        totalCosts: costData.summary?.totalCost || 0,
        grossProfit: profitData.summary?.grossProfit || 0,
        netProfit: profitData.summary?.netProfit || 0,
        profitMargin: profitData.summary?.overallMargin || 0,
        withdrawalStats: {
          totalAmount: withdrawalData.summary?.totalAmount || 0,
          totalUsers: withdrawalData.summary?.totalUsers || 0,
          successRate: withdrawalData.summary?.successRate || 0
        }
      };

      setSummary(summaryData);
      setTrendData(revenueData.trendData || []);
      setCostBreakdown(costData.costTypeBreakdown || {});
      setProfitData(profitData.profitAnalysis || {});

    } catch (error) {
      console.error('获取财务数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialOverview();
  }, [timeRange]);

  // 刷新数据
  const handleRefresh = () => {
    fetchFinancialOverview();
  };

  // 格式化货币
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tg-TJ', {
      style: 'currency',
      currency: 'TJS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // 格式化百分比
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // 获取趋势图标和颜色
  const getTrendIcon = (value: number) => {
    if (value > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (value < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  // 成本类型饼图数据
  const costPieData = Object.entries(costBreakdown).map(([type, data]: [string, any]) => ({
    name: type,
    value: data.cost,
    users: data.userCount
  }));

  return (
    <div className="container mx-auto p-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">财务仪表板</h1>
          <p className="text-muted-foreground">
            全面监控收入、成本、利润和提现统计数据
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="90d">最近90天</option>
          </select>
          <Button onClick={handleRefresh} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 关键指标卡片 */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总收入</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getTrendIcon(summary.growthRate)}
                <span className={summary.growthRate > 0 ? 'text-green-600' : summary.growthRate < 0 ? 'text-red-600' : ''}>
                  {formatPercentage(summary.growthRate)} 相比上期
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">净利润</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.netProfit)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>利润率: {formatPercentage(summary.profitMargin)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总成本</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalCosts)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>平均订单价值: {formatCurrency(summary.averageOrderValue)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">提现统计</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.withdrawalStats.totalAmount)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Users className="h-3 w-3 mr-1" />
                <span>{summary.withdrawalStats.totalUsers} 人</span>
                <span className="mx-1">•</span>
                <span>成功率: {formatPercentage(summary.withdrawalStats.successRate)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">财务概览</TabsTrigger>
          <TabsTrigger value="revenue">收入分析</TabsTrigger>
          <TabsTrigger value="costs">成本分析</TabsTrigger>
          <TabsTrigger value="profits">利润分析</TabsTrigger>
          <TabsTrigger value="withdrawals">提现分析</TabsTrigger>
        </TabsList>

        {/* 财务概览 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>收入趋势</CardTitle>
                <CardDescription>最近30天收入变化趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), '收入']} />
                    <Line type="monotone" dataKey="totalRevenue" stroke="#8884d8" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>利润趋势</CardTitle>
                <CardDescription>最近30天利润变化趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), '利润']} />
                    <Line type="monotone" dataKey="grossProfit" stroke="#00C49F" strokeWidth={2} />
                    <Line type="monotone" dataKey="netProfit" stroke="#FF8042" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>成本构成</CardTitle>
                <CardDescription>按类型分布的成本占比</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={costPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), '成本']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>财务健康指标</CardTitle>
                <CardDescription>关键财务指标汇总</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">毛利率</span>
                  <Badge variant={summary && summary.profitMargin > 20 ? "default" : "destructive"}>
                    {summary ? formatPercentage(summary.profitMargin) : '0%'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">收入增长率</span>
                  <Badge variant={summary && summary.growthRate > 0 ? "default" : "destructive"}>
                    {summary ? formatPercentage(summary.growthRate) : '0%'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">提现成功率</span>
                  <Badge variant={summary && summary.withdrawalStats.successRate > 95 ? "default" : "destructive"}>
                    {summary ? formatPercentage(summary.withdrawalStats.successRate) : '0%'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">平均客单价</span>
                  <Badge variant="outline">
                    {summary ? formatCurrency(summary.averageOrderValue) : '0'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 收入分析 */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>收入详细分析</CardTitle>
              <CardDescription>收入构成和趋势分析</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                  <Line type="monotone" dataKey="totalRevenue" stroke="#8884d8" strokeWidth={2} name="总收入" />
                  <Line type="monotone" dataKey="actualReceived" stroke="#00C49F" strokeWidth={2} name="实际到账" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 成本分析 */}
        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>成本构成分析</CardTitle>
              <CardDescription>按类型分析成本分布</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(costBreakdown).map(([type, data]: [string, any]) => (
                  <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium capitalize">{type}成本</h4>
                      <p className="text-sm text-muted-foreground">
                        用户数: {data.userCount} | 交易数: {data.transactionCount}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(data.cost)}</div>
                      <div className="text-sm text-muted-foreground">
                        人均: {formatCurrency(data.avgCostPerUser)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 利润分析 */}
        <TabsContent value="profits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>利润分析</CardTitle>
              <CardDescription>毛利润、净利润及利润率分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {summary ? formatCurrency(summary.grossProfit) : formatCurrency(0)}
                  </div>
                  <div className="text-sm text-muted-foreground">毛利润</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {summary ? formatCurrency(summary.netProfit) : formatCurrency(0)}
                  </div>
                  <div className="text-sm text-muted-foreground">净利润</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {summary ? formatPercentage(summary.profitMargin) : '0%'}
                  </div>
                  <div className="text-sm text-muted-foreground">利润率</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 提现分析 */}
        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>提现统计</CardTitle>
              <CardDescription>提现金额、用户数和成功率统计</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {summary ? formatCurrency(summary.withdrawalStats.totalAmount) : formatCurrency(0)}
                  </div>
                  <div className="text-sm text-muted-foreground">提现总额</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {summary ? summary.withdrawalStats.totalUsers : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">提现人数</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {summary ? formatPercentage(summary.withdrawalStats.successRate) : '0%'}
                  </div>
                  <div className="text-sm text-muted-foreground">成功率</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {summary ? formatCurrency(summary.totalRevenue * 0.05) : formatCurrency(0)}
                  </div>
                  <div className="text-sm text-muted-foreground">平台手续费收入</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}