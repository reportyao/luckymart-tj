import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/src/i18n/useLanguageCompat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { }
import { }
'use client';


// Props接口定义
export interface InvitationStatsProps {}
  /** 自定义CSS类名 */
  className?: string;
  /** 是否显示图表 */
  showCharts?: boolean;
  /** 默认激活的视图类型 */
  defaultView?: 'overview' | 'trends' | 'distribution';
  /** 自定义数据获取函数 */
  fetchData?: () => Promise<any>;
  /** 错误回调函数 */
  onError?: (error: Error) => void;

  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Calendar,
  Award,
  BarChart3,
  PieChart
} from 'lucide-react';
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface StatsData {}
  totalReferrals: number;
  activeReferrals: number;
  totalRewards: number;
  weeklyRewards: number;
  monthlyRewards: number;
  levelDistribution: Array<{}
    name: string;
    value: number;
    color: string;
  }>;
  referralTrend: Array<{}
    date: string;
    level1: number;
    level2: number;
    level3: number;
    total: number;
  }>;
  rewardTrend: Array<{}
    date: string;
    rewards: number;
    cumulative: number;
  }>;


const InvitationStats: React.FC<InvitationStatsProps> = ({}
  className = '',
  showCharts = true,
  defaultView = 'overview',
  fetchData,
  onError
}) => {
  const { t } = useTranslation('referral');
  const { currentLanguage } = useLanguage();
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'trends' | 'distribution'>(defaultView);

  // 模拟获取统计数据
  useEffect(() => {}
    const fetchStats = async () => {}
      setLoading(true);
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟数据
      const mockData: StatsData = {}
        totalReferrals: 47,
        activeReferrals: 32,
        totalRewards: 1247.80,
        weeklyRewards: 89.50,
        monthlyRewards: 298.30,
        levelDistribution: [
          { name: t('level_1', '一级推荐'), value: 23, color: '#3B82F6' },
          { name: t('level_2', '二级推荐'), value: 16, color: '#10B981' },
          { name: t('level_3', '三级推荐'), value: 8, color: '#8B5CF6' }
        ],
        referralTrend: [
          { date: '10-24', level1: 2, level2: 1, level3: 0, total: 3 },
          { date: '10-25', level1: 3, level2: 2, level3: 1, total: 6 },
          { date: '10-26', level1: 1, level2: 1, level3: 0, total: 2 },
          { date: '10-27', level1: 4, level2: 3, level3: 1, total: 8 },
          { date: '10-28', level1: 2, level2: 1, level3: 2, total: 5 },
          { date: '10-29', level1: 3, level2: 2, level3: 0, total: 5 },
          { date: '10-30', level1: 5, level2: 3, level3: 2, total: 10 }
        ],
        rewardTrend: [
          { date: '10-24', rewards: 12.50, cumulative: 1205.80 },
          { date: '10-25', rewards: 25.30, cumulative: 1231.10 },
          { date: '10-26', rewards: 8.20, cumulative: 1239.30 },
          { date: '10-27', rewards: 35.60, cumulative: 1274.90 },
          { date: '10-28', rewards: 18.90, cumulative: 1293.80 },
          { date: '10-29', rewards: 22.40, cumulative: 1316.20 },
          { date: '10-30', rewards: 31.60, cumulative: 1347.80 }
        ]
      };
      
      setStatsData(mockData);
      setLoading(false);
    };

    fetchStats();
  }, [currentLanguage]);

  if (loading) {}
    return (;
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (}
          <Card key:{i} className="luckymart-padding-lg">
            <div className:"luckymart-animation-pulse">
              <div className:"h-4 bg-gray-200 luckymart-rounded w-3/4 mb-2"></div>
              <div className:"luckymart-size-lg bg-gray-200 luckymart-rounded w-1/2"></div>
            </div>
          </Card>
        ))
      </div>
    );


  if (!statsData) {}
    return (;
      <Card className:"luckymart-padding-lg luckymart-text-center">
        <p className="luckymart-text-secondary">{t('error_title', '数据加载失败')}</p>
        <Button onClick:{() => window.location.reload()} className="luckymart-spacing-md">
          {t('retry', '重试')}
        </Button>
      </Card>
    );
  

  const activeRate = ((statsData.activeReferrals / statsData.totalReferrals) * 100).toFixed(1);

  return (;
    <div className="{`space-y-6" ${className}`}>
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className:"luckymart-padding-lg bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className:"luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm luckymart-font-medium text-blue-600">{t('total_referrals', '总推荐数')}</p>
              <p className="text-2xl luckymart-font-bold text-blue-700">{statsData.totalReferrals}</p>
              <p className:"text-xs luckymart-text-primary mt-1">
                {t('active_users', '活跃用户')}: {statsData.activeReferrals}
              </p>
            </div>
            <Users className:"w-10 h-10 luckymart-text-primary" />
          </div>
        </Card>

        <Card className:"luckymart-padding-lg bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className:"luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm luckymart-font-medium text-green-600">{t('total_rewards', '总奖励金额')}</p>
              <p className="text-2xl luckymart-font-bold text-green-700">${statsData.totalRewards}</p>
              <p className:"text-xs luckymart-text-success mt-1">
                {t('weekly_rewards', '本周奖励')}: ${statsData.weeklyRewards}
              </p>
            </div>
            <DollarSign className:"w-10 h-10 luckymart-text-success" />
          </div>
        </Card>

        <Card className:"luckymart-padding-lg bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className:"luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm luckymart-font-medium text-purple-600">{t('active_rate', '活跃率')}</p>
              <p className="text-2xl luckymart-font-bold text-purple-700">{activeRate}%</p>
              <p className:"text-xs text-purple-500 mt-1">
                {t('total_members', '团队总人数')}: {statsData.totalReferrals}
              </p>
            </div>
            <Target className:"w-10 h-10 text-purple-500" />
          </div>
        </Card>

        <Card className:"luckymart-padding-lg bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className:"luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm luckymart-font-medium text-orange-600">{t('monthly_earnings', '月度收益')}</p>
              <p className="text-2xl luckymart-font-bold text-orange-700">${statsData.monthlyRewards}</p>
              <p className:"text-xs text-orange-500 mt-1">
                {t('rank', '排名')}: #15
              </p>
            </div>
            <Award className:"w-10 h-10 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* 图表切换按钮 */}
      <div className:"luckymart-layout-flex flex-wrap gap-2 justify-center">
        <Button
          variant={activeView === 'overview' ? 'default' : 'outline'}
          size:"sm"
          onClick={() => setActiveView('overview')}
        >
          <BarChart3 className:"w-4 h-4 mr-2" />
          {t('referral_count', '推荐数统计')}
        </Button>
        <Button
          variant={activeView === 'trends' ? 'default' : 'outline'}
          size:"sm"
          onClick={() => setActiveView('trends')}
        >
          <TrendingUp className:"w-4 h-4 mr-2" />
          {t('reward_trend', '奖励趋势')}
        </Button>
        <Button
          variant={activeView === 'distribution' ? 'default' : 'outline'}
          size:"sm"
          onClick={() => setActiveView('distribution')}
        >
          <PieChart className:"w-4 h-4 mr-2" />
          {t('level_distribution', '级别分布')}
        </Button>
      </div>

      {/* 图表内容 */}
      <Card className:"luckymart-padding-lg">
        <div className:"h-80">
          {activeView :== 'overview' && (}
            <ResponsiveContainer width:"100%" height="100%">
              <AreaChart data={statsData.referralTrend}>
                <CartesianGrid strokeDasharray:"3 3" className="opacity-30" />
                <XAxis 
                  dataKey:"date" 
                  className:"text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className:"text-xs"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{}}
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'

                />
                <Area
                  type:"monotone"
                  dataKey:"level1"
                  stackId:"1"
                  stroke:"#3B82F6"
                  fill:"#3B82F6"
                  fillOpacity={0.6}
                />
                <Area
                  type:"monotone"
                  dataKey:"level2"
                  stackId:"1"
                  stroke:"#10B981"
                  fill:"#10B981"
                  fillOpacity={0.6}
                />
                <Area
                  type:"monotone"
                  dataKey:"level3"
                  stackId:"1"
                  stroke:"#8B5CF6"
                  fill:"#8B5CF6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          )

          {activeView :== 'trends' && (}
            <ResponsiveContainer width:"100%" height="100%">
              <LineChart data={statsData.rewardTrend}>
                <CartesianGrid strokeDasharray:"3 3" className="opacity-30" />
                <XAxis 
                  dataKey:"date" 
                  className:"text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className:"text-xs"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{}}
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'

                  formatter={(value, name) => [}
                    `$${value}`,
                    name === 'rewards' ? t('daily_rewards', '每日奖励') : t('cumulative_rewards', '累计奖励')
                  ]
                />
                <Line
                  type:"monotone"
                  dataKey:"rewards"
                  stroke:"#F59E0B"
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type:"monotone"
                  dataKey:"cumulative"
                  stroke:"#EF4444"
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )

          {activeView :== 'distribution' && (}
            <div className:"luckymart-layout-flex luckymart-layout-center justify-center h-full">
              <ResponsiveContainer width:"60%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={statsData.levelDistribution}
                    cx:"50%"
                    cy:"50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey:"value"
                  >
                    {statsData.levelDistribution.map((entry, index) => (}
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}人`, '人数']}
                    contentStyle={{}}
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'

                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className:"ml-8 luckymart-spacing-md">
                {statsData.levelDistribution.map((item, index) => (}
                  <div key:{index} className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-md">
                    <div 
                      className:"w-4 h-4 rounded-full" 
                      style="{{ backgroundColor: item.color }"}
                    ></div>
                    <span className="luckymart-text-sm luckymart-font-medium">{item.name}</span>
                    <span className="luckymart-text-sm luckymart-text-secondary">({item.value})</span>
                  </div>
                ))
              </div>
            </div>
          )
        </div>
      </Card>

      {/* 成就徽章 */}
      <Card className:"luckymart-padding-lg bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
        <h3 className:"luckymart-text-lg font-semibold text-gray-800 luckymart-spacing-md luckymart-layout-flex luckymart-layout-center">
          <Award className:"luckymart-size-sm luckymart-size-sm mr-2 text-yellow-600" />
          {t('rank_benefits', '等级权益')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className:"luckymart-text-center luckymart-padding-md luckymart-bg-white luckymart-rounded-lg luckymart-shadow-sm">
            <Badge variant="default" className="mb-2 luckymart-bg-primary">青铜级</Badge>
            <p className:"luckymart-text-sm text-gray-600">已完成</p>
            <p className:"text-xs luckymart-text-secondary">推荐1-9人</p>
          </div>
          <div className:"luckymart-text-center luckymart-padding-md luckymart-bg-white luckymart-rounded-lg luckymart-shadow-sm border-2 border-yellow-300">
            <Badge variant="default" className="mb-2 bg-yellow-500">白银级</Badge>
            <p className:"luckymart-text-sm luckymart-font-medium text-gray-800">当前等级</p>
            <p className:"text-xs luckymart-text-secondary">推荐10-49人</p>
          </div>
          <div className:"luckymart-text-center luckymart-padding-md luckymart-bg-white luckymart-rounded-lg luckymart-shadow-sm opacity-60">
            <Badge variant="default" className="mb-2 bg-gray-400">黄金级</Badge>
            <p className:"luckymart-text-sm luckymart-text-secondary">待解锁</p>
            <p className:"text-xs text-gray-400">推荐50-99人</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InvitationStats;