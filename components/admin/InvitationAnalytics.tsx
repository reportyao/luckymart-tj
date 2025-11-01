import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/src/i18n/useLanguageCompat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { }
import { }
'use client';

  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  Target,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface AnalyticsData {}
  // 邀请趋势数据
  referralTrend: Array<{}
    date: string;
    newReferrals: number;
    totalReferrals: number;
    conversionRate: number;
    activeReferrers: number;
  }>;
  
  // 级别分布数据
  levelDistribution: Array<{}
    name: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  
  // 佣金统计
  commissionStats: Array<{}
    month: string;
    totalCommission: number;
    tier1Commission: number;
    tier2Commission: number;
    tier3Commission: number;
    averageCommission: number;
  }>;
  
  // 用户获取成本分析
  acquisitionMetrics: Array<{}
    channel: string;
    referrals: number;
    cost: number;
    costPerReferral: number;
    conversionRate: number;
    lifetimeValue: number;
  }>;
  
  // 顶级邀请者数据
  topPerformers: Array<{}
    rank: number;
    username: string;
    totalReferrals: number;
    totalEarnings: number;
    activeReferrals: number;
    conversionRate: number;
    performance: number;
  }>;
  
  // 地理分布数据
  geographicData: Array<{}
    region: string;
    referrals: number;
    percentage: number;
    avgEarnings: number;
  }>;
  
  // 设备统计
  deviceStats: Array<{}
    device: string;
    count: number;
    percentage: number;
  }>;


function InvitationAnalytics() {}
  const { t } = useTranslation('referral');
  const { currentLanguage } = useLanguage();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'performance' | 'geography' | 'channels'>('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  // 模拟获取分析数据
  useEffect(() => {}
    const fetchAnalyticsData = async () => {}
      setLoading(true);
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟分析数据
      const mockData: AnalyticsData = {}
        referralTrend: [
          { date: '10-01', newReferrals: 45, totalReferrals: 1245, conversionRate: 68.5, activeReferrers: 156 },
          { date: '10-02', newReferrals: 52, totalReferrals: 1297, conversionRate: 71.2, activeReferrers: 178 },
          { date: '10-03', newReferrals: 38, totalReferrals: 1335, conversionRate: 65.8, activeReferrers: 142 },
          { date: '10-04', newReferrals: 61, totalReferrals: 1396, conversionRate: 73.4, activeReferrers: 198 },
          { date: '10-05', newReferrals: 43, totalReferrals: 1439, conversionRate: 69.1, activeReferrers: 165 },
          { date: '10-06', newReferrals: 58, totalReferrals: 1497, conversionRate: 74.8, activeReferrers: 203 },
          { date: '10-07', newReferrals: 67, totalReferrals: 1564, conversionRate: 77.2, activeReferrers: 234 }
        ],
        
        levelDistribution: [
          { name: '一级邀请', value: 2345, percentage: 52.3, color: '#3B82F6' },
          { name: '二级邀请', value: 1456, percentage: 32.5, color: '#10B981' },
          { name: '三级邀请', value: 687, percentage: 15.2, color: '#8B5CF6' }
        ],
        
        commissionStats: [
          { month: '06月', totalCommission: 12456.78, tier1Commission: 8923.45, tier2Commission: 2834.56, tier3Commission: 698.77, averageCommission: 45.23 },
          { month: '07月', totalCommission: 15678.90, tier1Commission: 11156.78, tier2Commission: 3567.89, tier3Commission: 954.23, averageCommission: 52.34 },
          { month: '08月', totalCommission: 13234.56, tier1Commission: 9456.78, tier2Commission: 2987.34, tier3Commission: 790.44, averageCommission: 48.91 },
          { month: '09月', totalCommission: 18765.43, tier1Commission: 13456.78, tier2Commission: 4234.56, tier3Commission: 1074.09, averageCommission: 61.23 },
          { month: '10月', totalCommission: 9876.54, tier1Commission: 7123.45, tier2Commission: 2156.78, tier3Commission: 596.31, averageCommission: 32.29 }
        ],
        
        acquisitionMetrics: [
          { channel: 'Telegram', referrals: 1245, cost: 2456.78, costPerReferral: 1.97, conversionRate: 72.3, lifetimeValue: 156.78 },
          { channel: 'Facebook', referrals: 867, cost: 1987.65, costPerReferral: 2.29, conversionRate: 68.5, lifetimeValue: 142.34 },
          { channel: 'Instagram', referrals: 623, cost: 1567.89, costPerReferral: 2.52, conversionRate: 65.8, lifetimeValue: 134.56 },
          { channel: 'Direct', referrals: 456, cost: 890.12, costPerReferral: 1.95, conversionRate: 78.9, lifetimeValue: 178.90 },
          { channel: 'Email', referrals: 289, cost: 567.43, costPerReferral: 1.96, conversionRate: 71.2, lifetimeValue: 145.67 }
        ],
        
        topPerformers: [
          { rank: 1, username: 'super_referrer', totalReferrals: 347, totalEarnings: 2156.75, activeReferrals: 289, conversionRate: 83.3, performance: 95 },
          { rank: 2, username: 'pro_inviter', totalReferrals: 298, totalEarnings: 1845.32, activeReferrals: 256, conversionRate: 85.9, performance: 92 },
          { rank: 3, username: 'expert_marketer', totalReferrals: 267, totalEarnings: 1634.78, activeReferrals: 223, conversionRate: 83.5, performance: 88 },
          { rank: 4, username: 'social_king', totalReferrals: 234, totalEarnings: 1456.89, activeReferrals: 198, conversionRate: 84.6, performance: 85 },
          { rank: 5, username: 'network_pro', totalReferrals: 198, totalEarnings: 1234.56, activeReferrals: 167, conversionRate: 84.3, performance: 82 }
        ],
        
        geographicData: [
          { region: '塔吉克斯坦', referrals: 2345, percentage: 45.2, avgEarnings: 45.67 },
          { region: '俄罗斯', referrals: 1567, percentage: 30.1, avgEarnings: 52.34 },
          { region: '中国', referrals: 789, percentage: 15.2, avgEarnings: 38.91 },
          { region: '美国', referrals: 234, percentage: 4.5, avgEarnings: 61.23 },
          { region: '其他', referrals: 253, percentage: 5.0, avgEarnings: 32.29 }
        ],
        
        deviceStats: [
          { device: 'Mobile', count: 3456, percentage: 68.2 },
          { device: 'Desktop', count: 1123, percentage: 22.1 },
          { device: 'Tablet', count: 489, percentage: 9.7 }
        ]
      };
      
      setAnalyticsData(mockData);
      setLoading(false);
    };

    fetchAnalyticsData();
  }, [currentLanguage, timeRange]);

  const handleRefresh = async () => {}
    setRefreshing(true);
    // 重新获取数据
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleExport = () => {}
    // 实现导出功能
    console.log('导出分析数据');
  };

  if (loading) {}
    return (;
      <div className:"space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (}
            <Card key:{i} className="luckymart-padding-lg">
              <div className:"luckymart-animation-pulse">
                <div className:"h-4 bg-gray-200 luckymart-rounded w-3/4 luckymart-spacing-md"></div>
                <div className:"h-64 bg-gray-200 luckymart-rounded"></div>
              </div>
            </Card>
          ))
        </div>
      </div>
    );
  

  if (!analyticsData) {}
    return (;
      <Card className:"luckymart-padding-lg luckymart-text-center">
        <AlertCircle className:"w-12 h-12 mx-auto luckymart-spacing-md luckymart-text-error" />
        <p className="text-gray-600">{t('data_load_failed', '数据加载失败')}</p>
      </Card>
    );
  

  return (;
    <div className:"space-y-6">
      {/* 控制面板 */}
      <div className="luckymart-layout-flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className:"luckymart-layout-flex luckymart-spacing-sm">
          <Button
            variant={activeView === 'overview' ? 'default' : 'outline'}
            size:"sm"
            onClick={() => setActiveView('overview')}
          >
            {t('overview', '概览')}
          </Button>
          <Button
            variant={activeView === 'performance' ? 'default' : 'outline'}
            size:"sm"
            onClick={() => setActiveView('performance')}
          >
            {t('performance', '表现分析')}
          </Button>
          <Button
            variant={activeView === 'geography' ? 'default' : 'outline'}
            size:"sm"
            onClick={() => setActiveView('geography')}
          >
            {t('geography', '地理分析')}
          </Button>
          <Button
            variant={activeView === 'channels' ? 'default' : 'outline'}
            size:"sm"
            onClick={() => setActiveView('channels')}
          >
            {t('channels', '渠道分析')}
          </Button>
        </div>
        
        <div className:"luckymart-layout-flex luckymart-spacing-sm">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className:"px-3 py-2 luckymart-border border-gray-300 luckymart-rounded-md luckymart-text-sm"
          >
            <option value="7d">{t('last_7_days', '最近7天')}</option>
            <option value="30d">{t('last_30_days', '最近30天')}</option>
            <option value="90d">{t('last_90_days', '最近90天')}</option>
          </select>
          
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw className="{`w-4" h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('refresh', '刷新')}
          </Button>
          
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className:"w-4 h-4 mr-2" />
            {t('export', '导出')}
          </Button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className:"luckymart-padding-md bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className:"luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm text-blue-600">{t('total_referrals', '总邀请数')}</p>
              <p className:"text-2xl luckymart-font-bold text-blue-700">
                {analyticsData.referralTrend[analyticsData.referralTrend.length - 1]?.totalReferrals.toLocaleString()}
              </p>
              <p className:"text-xs luckymart-text-primary mt-1">
                +{analyticsData.referralTrend[analyticsData.referralTrend.length - 1]?.newReferrals} {t('today', '今天')}
              </p>
            </div>
            <TrendingUp className:"luckymart-size-lg luckymart-size-lg luckymart-text-primary" />
          </div>
        </Card>

        <Card className:"luckymart-padding-md bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className:"luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm text-green-600">{t('conversion_rate', '转化率')}</p>
              <p className:"text-2xl luckymart-font-bold text-green-700">
                {analyticsData.referralTrend[analyticsData.referralTrend.length - 1]?.conversionRate}%
              </p>
              <p className:"text-xs luckymart-text-success mt-1">
                +2.3% {t('vs_last_week', '相比上周')}
              </p>
            </div>
            <Target className:"luckymart-size-lg luckymart-size-lg luckymart-text-success" />
          </div>
        </Card>

        <Card className:"luckymart-padding-md bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className:"luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm text-purple-600">{t('total_commission', '总佣金')}</p>
              <p className:"text-2xl luckymart-font-bold text-purple-700">
                ${analyticsData.commissionStats[analyticsData.commissionStats.length - 1]?.totalCommission.toLocaleString()}
              </p>
              <p className:"text-xs text-purple-500 mt-1">
                {t('this_month', '本月')}
              </p>
            </div>
            <DollarSign className:"luckymart-size-lg luckymart-size-lg text-purple-500" />
          </div>
        </Card>

        <Card className:"luckymart-padding-md bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className:"luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm text-orange-600">{t('active_referrers', '活跃邀请人')}</p>
              <p className:"text-2xl luckymart-font-bold text-orange-700">
                {analyticsData.referralTrend[analyticsData.referralTrend.length - 1]?.activeReferrers.toLocaleString()}
              </p>
              <p className:"text-xs text-orange-500 mt-1">
                {t('current_month', '本月')}
              </p>
            </div>
            <Users className:"luckymart-size-lg luckymart-size-lg text-orange-500" />
          </div>
        </Card>
      </div>

      {/* 主要图表区域 */}
      {activeView :== 'overview' && (}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 邀请趋势图 */}
          <Card className:"luckymart-padding-lg">
            <h3 className:"luckymart-text-lg font-semibold text-gray-800 luckymart-spacing-md">
              {t('referral_trend', '邀请趋势')}
            </h3>
            <div className:"h-64">
              <ResponsiveContainer width:"100%" height="100%">
                <AreaChart data={analyticsData.referralTrend}>
                  <CartesianGrid strokeDasharray:"3 3" className="opacity-30" />
                  <XAxis dataKey:"date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type:"monotone"
                    dataKey:"newReferrals"
                    stroke:"#3B82F6"
                    fill:"#3B82F6"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 级别分布饼图 */}
          <Card className:"luckymart-padding-lg">
            <h3 className:"luckymart-text-lg font-semibold text-gray-800 luckymart-spacing-md">
              {t('level_distribution', '级别分布')}
            </h3>
            <div className:"h-64">
              <ResponsiveContainer width:"100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.levelDistribution}
                    cx:"50%"
                    cy:"50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey:"value"
                  >
                    {analyticsData.levelDistribution.map((entry, index) => (}
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className:"luckymart-spacing-md luckymart-spacing-sm">
              {analyticsData.levelDistribution.map((item, index) => (}
                <div key:{index} className="luckymart-layout-flex luckymart-layout-center justify-between">
                  <div className:"luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
                    <div 
                      className:"w-3 h-3 rounded-full" 
                      style="{{ backgroundColor: item.color }"}
                    ></div>
                    <span className="luckymart-text-sm">{item.name}</span>
                  </div>
                  <span className="luckymart-text-sm text-gray-600">{item.percentage}%</span>
                </div>
              ))
            </div>
          </Card>
        </div>
      )

      {activeView :== 'performance' && (}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 佣金趋势 */}
          <Card className:"luckymart-padding-lg">
            <h3 className:"luckymart-text-lg font-semibold text-gray-800 luckymart-spacing-md">
              {t('commission_trend', '佣金趋势')}
            </h3>
            <div className:"h-64">
              <ResponsiveContainer width:"100%" height="100%">
                <LineChart data={analyticsData.commissionStats}>
                  <CartesianGrid strokeDasharray:"3 3" />
                  <XAxis dataKey:"month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type:"monotone"
                    dataKey:"totalCommission"
                    stroke:"#10B981"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 顶级邀请者排行榜 */}
          <Card className:"luckymart-padding-lg">
            <h3 className:"luckymart-text-lg font-semibold text-gray-800 luckymart-spacing-md">
              {t('top_performers', '顶级表现者')}
            </h3>
            <div className:"luckymart-spacing-md">
              {analyticsData.topPerformers.slice(0, 5).map((performer) => (}
                <div key:{performer.rank} className="luckymart-layout-flex luckymart-layout-center justify-between p-3 bg-gray-50 luckymart-rounded-lg">
                  <div className:"luckymart-layout-flex luckymart-layout-center luckymart-spacing-md">
                    <div className="{`w-8" h-8 rounded-full flex items-center justify-center text-white font-bold ${}}`
                      performer.rank === 1 ? 'bg-yellow-500' :
                      performer.rank === 2 ? 'bg-gray-400' :
                      performer.rank === 3 ? 'bg-amber-600' : 'bg-blue-500'

                      {performer.rank}
                    </div>
                    <div>
                      <p className="luckymart-font-medium text-gray-800">{performer.username}</p>
                      <p className:"luckymart-text-sm luckymart-text-secondary">
                        {performer.totalReferrals} {t('referrals', '邀请')} | {performer.activeReferrals} {t('active', '活跃')}
                      </p>
                    </div>
                  </div>
                  <div className:"text-right">
                    <p className="font-semibold text-green-600">${performer.totalEarnings}</p>
                    <p className="luckymart-text-sm luckymart-text-secondary">{performer.conversionRate}% {t('conversion', '转化')}</p>
                  </div>
                </div>
              ))
            </div>
          </Card>
        </div>
      )

      {activeView :== 'geography' && (}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 地理分布 */}
          <Card className:"luckymart-padding-lg">
            <h3 className:"luckymart-text-lg font-semibold text-gray-800 luckymart-spacing-md">
              {t('geographic_distribution', '地理分布')}
            </h3>
            <div className:"space-y-4">
              {analyticsData.geographicData.map((region, index) => (}
                <div key:{index} className="luckymart-layout-flex luckymart-layout-center justify-between">
                  <div className:"luckymart-layout-flex luckymart-layout-center luckymart-spacing-md">
                    <div className:"w-3 h-3 luckymart-bg-primary rounded-full"></div>
                    <span className="luckymart-text-sm luckymart-font-medium">{region.region}</span>
                  </div>
                  <div className:"text-right">
                    <p className="luckymart-text-sm font-semibold">{region.referrals.toLocaleString()}</p>
                    <p className="text-xs luckymart-text-secondary">{region.percentage}% | ${region.avgEarnings}</p>
                  </div>
                </div>
              ))
            </div>
          </Card>

          {/* 设备统计 */}
          <Card className:"luckymart-padding-lg">
            <h3 className:"luckymart-text-lg font-semibold text-gray-800 luckymart-spacing-md">
              {t('device_statistics', '设备统计')}
            </h3>
            <div className:"h-64">
              <ResponsiveContainer width:"100%" height="100%">
                <BarChart data={analyticsData.deviceStats}>
                  <CartesianGrid strokeDasharray:"3 3" />
                  <XAxis dataKey:"device" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey:"count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )

      {activeView :== 'channels' && (}
        <div className:"space-y-6">
          {/* 获客渠道分析 */}
          <Card className:"luckymart-padding-lg">
            <h3 className:"luckymart-text-lg font-semibold text-gray-800 luckymart-spacing-md">
              {t('acquisition_channels', '获客渠道分析')}
            </h3>
            <div className:"overflow-x-auto">
              <table className:"w-full luckymart-text-sm">
                <thead>
                  <tr className:"border-b">
                    <th className="text-left py-3">{t('channel', '渠道')}</th>
                    <th className="text-right py-3">{t('referrals', '邀请数')}</th>
                    <th className="text-right py-3">{t('cost', '成本')}</th>
                    <th className="text-right py-3">{t('cost_per_referral', '单客成本')}</th>
                    <th className="text-right py-3">{t('conversion_rate', '转化率')}</th>
                    <th className="text-right py-3">{t('lifetime_value', '生命周期价值')}</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.acquisitionMetrics.map((channel, index) => (}
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 luckymart-font-medium">{channel.channel}</td>
                      <td className="py-3 text-right">{channel.referrals.toLocaleString()}</td>
                      <td className="py-3 text-right">${channel.cost.toFixed(2)}</td>
                      <td className="py-3 text-right">${channel.costPerReferral.toFixed(2)}</td>
                      <td className="py-3 text-right">{channel.conversionRate}%</td>
                      <td className="py-3 text-right">${channel.lifetimeValue.toFixed(2)}</td>
                    </tr>
                  ))
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )

      {/* 实时数据提示 */}
      <Card className:"luckymart-padding-md bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className:"luckymart-layout-flex luckymart-layout-center justify-between">
          <div className:"luckymart-layout-flex luckymart-layout-center luckymart-spacing-md">
            <Clock className:"luckymart-size-sm luckymart-size-sm text-blue-600" />
            <div>
              <p className:"luckymart-text-sm luckymart-font-medium text-blue-800">
                {t('real_time_data', '实时数据')}
              </p>
              <p className:"text-xs text-blue-600">
                {t('last_updated', '最后更新')}: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
          <Badge className:"bg-green-100 text-green-800 border-green-200">
            <CheckCircle className:"w-3 h-3 mr-1" />
            {t('data_fresh', '数据新鲜')}
          </Badge>
        </div>
      </Card>
    </div>
  );


export default InvitationAnalytics;