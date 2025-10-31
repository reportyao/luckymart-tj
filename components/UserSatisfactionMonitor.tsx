import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Activity,
  Eye,
  Zap
} from 'lucide-react';
import { feedbackDataManager, FeedbackAnalytics } from '../utils/feedback-data-manager';

export interface SatisfactionAlert {
  id: string;
  type: 'satisfaction_drop' | 'low_rating_spike' | 'issue_increase' | 'positive_trend';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metrics: {
    currentValue: number;
    threshold: number;
    changePercent: number;
  };
  timestamp: Date;
  acknowledged: boolean;
}

export interface SatisfactionThresholds {
  minimumSatisfaction: number;
  warningThreshold: number;
  criticalThreshold: number;
  ratingDropThreshold: number;
  issueIncreaseThreshold: number;
}

const DEFAULT_THRESHOLDS: SatisfactionThresholds = {
  minimumSatisfaction: 3.5,
  warningThreshold: 4.0,
  criticalThreshold: 2.5,
  ratingDropThreshold: 20, // 百分比
  issueIncreaseThreshold: 30
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface UserSatisfactionMonitorProps {
  refreshInterval?: number; // 刷新间隔（毫秒）
  showAlerts?: boolean;
  showTrends?: boolean;
  language?: string;
  onAlertTriggered?: (alert: SatisfactionAlert) => void;
  customThresholds?: Partial<SatisfactionThresholds>;
}

export const UserSatisfactionMonitor: React.FC<UserSatisfactionMonitorProps> = ({
  refreshInterval = 30000, // 默认30秒刷新
  showAlerts = true,
  showTrends = true,
  language,
  onAlertTriggered,
  customThresholds = {}
}) => {
  const { t, currentLanguage } = useLanguage();
  
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [alerts, setAlerts] = useState<SatisfactionAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [thresholds] = useState<SatisfactionThresholds>({
    ...DEFAULT_THRESHOLDS,
    ...customThresholds
  });

  /**
   * 加载分析数据
   */
  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const filter = language ? { language } : undefined;
      const data = feedbackDataManager.getFeedbackAnalytics(filter);
      
      setAnalytics(data);
      setLastUpdated(new Date());
      
      // 检查是否需要生成预警
      if (showAlerts) {
        const newAlerts = await checkForAlerts(data);
        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev.filter(a => 
            !newAlerts.some(na => na.id === a.id)
          )]);
          newAlerts.forEach(alert => onAlertTriggered?.(alert));
        }
      }
    } catch (error) {
      console.error('加载满意度数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [language, showAlerts, thresholds, onAlertTriggered]);

  /**
   * 检查是否需要生成预警
   */
  const checkForAlerts = async (data: FeedbackAnalytics): Promise<SatisfactionAlert[]> => {
    const newAlerts: SatisfactionAlert[] = [];
    
    // 1. 检查满意度下降
    if (data.satisfactionTrend.length >= 7) {
      const recent = data.satisfactionTrend.slice(-7);
      const first = recent[0].averageRating;
      const last = recent[recent.length - 1].averageRating;
      const dropPercent = ((first - last) / first) * 100;
      
      if (dropPercent > thresholds.ratingDropThreshold) {
        newAlerts.push({
          id: `satisfaction_drop_${Date.now()}`,
          type: 'satisfaction_drop',
          severity: dropPercent > 40 ? 'critical' : 'high',
          message: `用户满意度在过去7天下降了${dropPercent.toFixed(1)}%，从${first.toFixed(2)}降至${last.toFixed(2)}`,
          metrics: {
            currentValue: last,
            threshold: thresholds.warningThreshold,
            changePercent: dropPercent
          },
          timestamp: new Date(),
          acknowledged: false
        });
      }
    }
    
    // 2. 检查低评分激增
    if (data.ratingDistribution[1] + data.ratingDistribution[2] > 0) {
      const lowRatingCount = data.ratingDistribution[1] + data.ratingDistribution[2];
      const totalRatings = Object.values(data.ratingDistribution).reduce((sum, count) => sum + count, 0);
      const lowRatingPercent = (lowRatingCount / totalRatings) * 100;
      
      if (lowRatingPercent > 30) {
        newAlerts.push({
          id: `low_rating_spike_${Date.now()}`,
          type: 'low_rating_spike',
          severity: lowRatingPercent > 50 ? 'critical' : 'medium',
          message: `低评分(1-2星)占比达到${lowRatingPercent.toFixed(1)}%，需要立即关注`,
          metrics: {
            currentValue: lowRatingPercent,
            threshold: 30,
            changePercent: lowRatingPercent
          },
          timestamp: new Date(),
          acknowledged: false
        });
      }
    }
    
    // 3. 检查问题趋势
    const increasingIssues = data.trendingIssues.filter(issue => issue.trend === 'increasing');
    if (increasingIssues.length > 2) {
      newAlerts.push({
        id: `issue_increase_${Date.now()}`,
        type: 'issue_increase',
        severity: 'medium',
        message: `${increasingIssues.length}类问题呈现增长趋势，需要关注和改进`,
        metrics: {
          currentValue: increasingIssues.length,
          threshold: 2,
          changePercent: 0
        },
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    // 4. 检查正面趋势
    if (data.averageRating >= thresholds.warningThreshold && data.qualityScore >= 80) {
      newAlerts.push({
        id: `positive_trend_${Date.now()}`,
        type: 'positive_trend',
        severity: 'low',
        message: `翻译质量表现优秀！平均评分${data.averageRating.toFixed(2)}，质量分数${data.qualityScore}`,
        metrics: {
          currentValue: data.averageRating,
          threshold: thresholds.warningThreshold,
          changePercent: 0
        },
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    return newAlerts;
  };

  /**
   * 确认预警
   */
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  /**
   * 清除已确认的预警
   */
  const clearAcknowledgedAlerts = () => {
    setAlerts(prev => prev.filter(alert => !alert.acknowledged));
  };

  /**
   * 获取满意度状态颜色
   */
  const getSatisfactionColor = (rating: number): string => {
    if (rating >= thresholds.warningThreshold) return 'text-green-600';
    if (rating >= thresholds.minimumSatisfaction) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * 获取满意度状态标签
   */
  const getSatisfactionLabel = (rating: number): string => {
    if (rating >= thresholds.warningThreshold) return '优秀';
    if (rating >= thresholds.minimumSatisfaction) return '良好';
    return '需要改进';
  };

  // 初始化加载
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // 定期刷新
  useEffect(() => {
    const interval = setInterval(loadAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [loadAnalytics, refreshInterval]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="luckymart-padding-lg">
          <div className="luckymart-layout-flex luckymart-layout-center justify-center h-64">
            <div className="luckymart-animation-spin rounded-full luckymart-size-lg luckymart-size-lg border-b-2 border-blue-600"></div>
            <span className="ml-3">加载满意度数据...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="w-full">
        <CardContent className="luckymart-padding-lg">
          <div className="luckymart-text-center luckymart-text-secondary">
            暂无满意度数据
          </div>
        </CardContent>
      </Card>
    );
  }

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <div className="space-y-6">
      {/* 预警显示 */}
      {showAlerts && unacknowledgedAlerts.length > 0 && (
        <div className="luckymart-spacing-md">
          {unacknowledgedAlerts.map(alert => (
            <Alert 
              key={alert.id} 
              className={`${
                alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-green-500 bg-green-50'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="luckymart-layout-flex luckymart-layout-center justify-between">
                <span>{alert.message}</span>
                <div className="luckymart-layout-flex luckymart-layout-center gap-2">
                  <Badge variant={
                    alert.severity === 'critical' ? 'destructive' :
                    alert.severity === 'high' ? 'destructive' :
                    alert.severity === 'medium' ? 'secondary' : 'default'
                  }>
                    {alert.severity === 'critical' ? '紧急' :
                     alert.severity === 'high' ? '高' :
                     alert.severity === 'medium' ? '中' : '低'}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    确认
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ))}
          
          {alerts.filter(a => a.acknowledged).length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAcknowledgedAlerts}
              className="luckymart-text-sm"
            >
              清除已确认预警 ({alerts.filter(a => a.acknowledged).length})
            </Button>
          )}
        </div>
      )}

      {/* 概览指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="luckymart-layout-flex flex-row luckymart-layout-center justify-between space-y-0 pb-2">
            <CardTitle className="luckymart-text-sm luckymart-font-medium">平均满意度</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSatisfactionColor(analytics.averageRating)}`}>
              {analytics.averageRating.toFixed(1)}/5.0
            </div>
            <p className="text-xs text-muted-foreground">
              {getSatisfactionLabel(analytics.averageRating)}
            </p>
            <Progress 
              value={analytics.averageRating * 20} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="luckymart-layout-flex flex-row luckymart-layout-center justify-between space-y-0 pb-2">
            <CardTitle className="luckymart-text-sm luckymart-font-medium">质量分数</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              analytics.qualityScore >= 80 ? 'text-green-600' :
              analytics.qualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {analytics.qualityScore}/100
            </div>
            <p className="text-xs text-muted-foreground">
              基于反馈综合评估
            </p>
            <Progress 
              value={analytics.qualityScore} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="luckymart-layout-flex flex-row luckymart-layout-center justify-between space-y-0 pb-2">
            <CardTitle className="luckymart-text-sm luckymart-font-medium">反馈总数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl luckymart-font-bold">{analytics.totalFeedbacks}</div>
            <p className="text-xs text-muted-foreground">
              已收集用户反馈
            </p>
            <div className="luckymart-layout-flex luckymart-layout-center mt-2 text-xs">
              {analytics.resolvedRate > 0.7 ? (
                <CheckCircle className="h-3 w-3 luckymart-text-success mr-1" />
              ) : (
                <Clock className="h-3 w-3 text-orange-500 mr-1" />
              )}
              {(analytics.resolvedRate * 100).toFixed(0)}% 已解决
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="luckymart-layout-flex flex-row luckymart-layout-center justify-between space-y-0 pb-2">
            <CardTitle className="luckymart-text-sm luckymart-font-medium">活跃预警</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              unacknowledgedAlerts.length === 0 ? 'text-green-600' :
              unacknowledgedAlerts.some(a => a.severity === 'critical') ? 'text-red-600' :
              'text-orange-600'
            }`}>
              {unacknowledgedAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              需要关注的问题
            </p>
            <div className="luckymart-layout-flex luckymart-layout-center mt-2 text-xs">
              {analytics.trendingIssues.filter(i => i.trend === 'increasing').length > 0 ? (
                <TrendingUp className="h-3 w-3 luckymart-text-error mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 luckymart-text-success mr-1" />
              )}
              {analytics.trendingIssues.filter(i => i.trend === 'increasing').length} 项趋势上升
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      {showTrends && analytics.satisfactionTrend.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 满意度趋势图 */}
          <Card>
            <CardHeader>
              <CardTitle className="luckymart-layout-flex luckymart-layout-center gap-2">
                <TrendingUp className="luckymart-size-sm luckymart-size-sm" />
                满意度趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.satisfactionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[0, 5]} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('zh-CN')}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)}/5.0`, 
                      '平均评分'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="averageRating" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 反馈类型分布 */}
          <Card>
            <CardHeader>
              <CardTitle className="luckymart-layout-flex luckymart-layout-center gap-2">
                <Eye className="luckymart-size-sm luckymart-size-sm" />
                反馈类型分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.feedbackTypeDistribution).map(([key, value]) => ({
                      name: key,
                      value
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {Object.entries(analytics.feedbackTypeDistribution).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 问题趋势 */}
          <Card>
            <CardHeader>
              <CardTitle className="luckymart-layout-flex luckymart-layout-center gap-2">
                <Zap className="luckymart-size-sm luckymart-size-sm" />
                问题趋势分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.trendingIssues.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="issueType" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="count" 
                    fill={(entry: any) => {
                      if (entry.trend === 'increasing') return '#ff4444';
                      if (entry.trend === 'decreasing') return '#44ff44';
                      return '#8884d8';
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 评分分布 */}
          <Card>
            <CardHeader>
              <CardTitle className="luckymart-layout-flex luckymart-layout-center gap-2">
                <Star className="luckymart-size-sm luckymart-size-sm" />
                评分分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={Object.entries(analytics.ratingDistribution)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([rating, count]) => ({
                      rating: `${rating}星`,
                      count,
                      percentage: ((count / analytics.totalFeedbacks) * 100).toFixed(1)
                    }))
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip formatter={(value: number, name: string) => [`${value}条`, '反馈数量']} />
                  <Bar 
                    dataKey="count" 
                    fill="#8884d8"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 底部信息 */}
      <div className="luckymart-layout-flex luckymart-layout-center justify-between luckymart-text-sm luckymart-text-secondary">
        <div className="luckymart-layout-flex luckymart-layout-center gap-2">
          <Clock className="h-4 w-4" />
          最后更新: {lastUpdated.toLocaleString('zh-CN')}
        </div>
        <div className="luckymart-layout-flex luckymart-layout-center gap-4">
          <span>自动刷新: {refreshInterval / 1000}秒</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAnalytics}
            disabled={isLoading}
          >
            {isLoading ? '刷新中...' : '手动刷新'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserSatisfactionMonitor;