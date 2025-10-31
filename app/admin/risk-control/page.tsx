'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Activity, Bell, Settings, TrendingUp, Users, Clock } from 'lucide-react';
import PagePermission from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin-permission-manager';

// 风险事件类型定义
interface RiskIncident {
  id: string;
  userId: string;
  incidentType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive' | 'escalated';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

// 风险规则类型定义
interface RiskRule {
  id: number;
  name: string;
  description: string;
  ruleType: string;
  conditions: any;
  riskLevel: number;
  action: string;
  actionConfig?: any;
  enabled: boolean;
  priority: number;
  triggerCount: number;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 统计数据类型定义
interface RiskStats {
  total: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byStatus: {
    open: number;
    investigating: number;
    resolved: number;
    false_positive: number;
    escalated: number;
  };
  byType: {
    login: number;
    transaction: number;
    registration: number;
    withdrawal: number;
    suspicious_session: number;
  };
  avgResolutionTime: number;
  trends: {
    last24h: { total: number; change: string };
    last7d: { total: number; change: string };
    last30d: { total: number; change: string };
  };
}

// 模拟数据
const mockIncidents: RiskIncident[] = [
  {
    id: '1',
    userId: 'user-123',
    incidentType: 'transaction',
    severity: 'high',
    riskScore: 85,
    title: '异常交易金额',
    description: '检测到用户在短时间内进行大额交易',
    status: 'open',
    createdAt: '2025-10-31T16:57:13Z',
    updatedAt: '2025-10-31T16:57:13Z'
  },
  {
    id: '2',
    userId: 'user-456',
    incidentType: 'login',
    severity: 'critical',
    riskScore: 95,
    title: '多次登录失败',
    description: '用户在10分钟内失败登录5次',
    status: 'investigating',
    createdAt: '2025-10-31T15:30:00Z',
    updatedAt: '2025-10-31T16:00:00Z',
    assignedTo: 'admin-789'
  },
  {
    id: '3',
    userId: 'user-789',
    incidentType: 'registration',
    severity: 'medium',
    riskScore: 60,
    title: '可疑注册行为',
    description: '检测到使用代理IP注册账户',
    status: 'resolved',
    createdAt: '2025-10-31T14:15:00Z',
    updatedAt: '2025-10-31T15:45:00Z',
    assignedTo: 'admin-789'
  }
];

const mockRules: RiskRule[] = [
  {
    id: 1,
    name: 'multiple_login_failures',
    description: '多次登录失败',
    ruleType: 'threshold',
    conditions: { type: 'login_failure_count', threshold: 5, timeWindow: '10m' },
    riskLevel: 80,
    action: 'freeze',
    actionConfig: { freeze_duration: '1h', require_verification: true },
    enabled: true,
    priority: 1,
    triggerCount: 25,
    lastTriggeredAt: '2025-10-31T16:57:13Z',
    createdAt: '2025-10-30T00:00:00Z',
    updatedAt: '2025-10-31T10:00:00Z'
  },
  {
    id: 2,
    name: 'unusual_transaction_amount',
    description: '异常交易金额',
    ruleType: 'threshold',
    conditions: { type: 'transaction_amount', threshold: 'avg_amount * 3' },
    riskLevel: 75,
    action: 'verify',
    actionConfig: { require_manual_review: true },
    enabled: true,
    priority: 2,
    triggerCount: 15,
    lastTriggeredAt: '2025-10-31T15:30:00Z',
    createdAt: '2025-10-30T00:00:00Z',
    updatedAt: '2025-10-31T08:00:00Z'
  },
  {
    id: 3,
    name: 'device_fingerprint_mismatch',
    description: '设备指纹不匹配',
    ruleType: 'device',
    conditions: { type: 'device_change', threshold: 1, timeWindow: '1d' },
    riskLevel: 50,
    action: 'verify',
    actionConfig: { require_identity_verification: true },
    enabled: true,
    priority: 3,
    triggerCount: 8,
    lastTriggeredAt: '2025-10-31T12:00:00Z',
    createdAt: '2025-10-30T00:00:00Z',
    updatedAt: '2025-10-31T06:00:00Z'
  }
];

const mockStats: RiskStats = {
  total: 150,
  bySeverity: {
    critical: 5,
    high: 25,
    medium: 80,
    low: 40
  },
  byStatus: {
    open: 15,
    investigating: 30,
    resolved: 95,
    false_positive: 8,
    escalated: 2
  },
  byType: {
    login: 45,
    transaction: 65,
    registration: 20,
    withdrawal: 12,
    suspicious_session: 8
  },
  avgResolutionTime: 4.2,
  trends: {
    last24h: { total: 25, change: '+15%' },
    last7d: { total: 180, change: '-5%' },
    last30d: { total: 750, change: '+2%' }
  }
};

const RiskControlPage: React.FC = () => {
  const [incidents, setIncidents] = useState<RiskIncident[]>(mockIncidents);
  const [rules, setRules] = useState<RiskRule[]>(mockRules);
  const [stats, setStats] = useState<RiskStats>(mockStats);
  const [loading, setLoading] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<RiskIncident | null>(null);

  // 获取严重程度颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  // 获取严重程度图标
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Shield className="h-4 w-4 text-green-500" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'investigating': return 'secondary';
      case 'resolved': return 'default';
      case 'false_positive': return 'outline';
      case 'escalated': return 'destructive';
      default: return 'outline';
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 处理事件状态更新
  const handleStatusUpdate = async (incidentId: string, newStatus: string) => {
    setLoading(true);
    try {
      // 这里应该调用实际的API
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: newStatus as any, updatedAt: new Date().toISOString() }
          : incident
      ));
    } catch (error) {
      console.error('更新事件状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理规则启用/禁用
  const handleRuleToggle = async (ruleId: number) => {
    setLoading(true);
    try {
      // 这里应该调用实际的API
      setRules(prev => prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, enabled: !rule.enabled, updatedAt: new Date().toISOString() }
          : rule
      ));
    } catch (error) {
      console.error('更新规则状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">风控系统</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            系统设置
          </Button>
          <Button>
            <Bell className="mr-2 h-4 w-4" />
            通知设置
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总风险事件</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              较昨日 {stats.trends.last24h.change}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">高风险事件</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.bySeverity.critical + stats.bySeverity.high}
            </div>
            <p className="text-xs text-muted-foreground">
              需要立即处理
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理事件</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.byStatus.open + stats.byStatus.investigating}
            </div>
            <p className="text-xs text-muted-foreground">
              平均处理时间 {stats.avgResolutionTime}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃规则</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rules.filter(rule => rule.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              共 {rules.length} 条规则
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incidents">
            <AlertTriangle className="mr-2 h-4 w-4" />
            风险事件
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Shield className="mr-2 h-4 w-4" />
            风控规则
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="mr-2 h-4 w-4" />
            实时监控
          </TabsTrigger>
          <TabsTrigger value="reports">
            <TrendingUp className="mr-2 h-4 w-4" />
            统计报告
          </TabsTrigger>
        </TabsList>

        {/* 风险事件标签页 */}
        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>风险事件列表</CardTitle>
              <CardDescription>
                管理系统检测到的所有风险事件
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <div className="flex items-center space-x-4">
                      {getSeverityIcon(incident.severity)}
                      <div>
                        <div className="font-medium">{incident.title}</div>
                        <div className="text-sm text-gray-500">{incident.description}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={getSeverityColor(incident.severity) as any}>
                            {incident.severity}
                          </Badge>
                          <Badge variant={getStatusColor(incident.status) as any}>
                            {incident.status}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            评分: {incident.riskScore}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {formatDate(incident.createdAt)}
                      </div>
                      <div className="flex space-x-1 mt-1">
                        {incident.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(incident.id, 'investigating');
                            }}
                          >
                            开始调查
                          </Button>
                        )}
                        {incident.status === 'investigating' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(incident.id, 'resolved');
                            }}
                          >
                            标记已解决
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 风控规则标签页 */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>风控规则管理</CardTitle>
              <CardDescription>
                管理风险检测规则，支持热更新
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {rule.enabled ? (
                          <Shield className="h-4 w-4 text-green-500" />
                        ) : (
                          <Shield className="h-4 w-4 text-gray-400" />
                        )}
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-gray-500">{rule.description}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{rule.ruleType}</Badge>
                            <Badge variant="outline">
                              风险等级: {rule.riskLevel}
                            </Badge>
                            <Badge variant="outline">
                              优先级: {rule.priority}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              触发次数: {rule.triggerCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant={rule.enabled ? "destructive" : "default"}
                        onClick={() => handleRuleToggle(rule.id)}
                        disabled={loading}
                      >
                        {rule.enabled ? '禁用' : '启用'}
                      </Button>
                      <Button size="sm" variant="outline">
                        编辑
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 实时监控标签页 */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>实时监控</CardTitle>
              <CardDescription>
                监控当前活跃的用户会话和风险事件
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-2">活跃会话</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>用户 user-123</span>
                      <Badge variant="outline">正常</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>用户 user-456</span>
                      <Badge variant="destructive">可疑</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>用户 user-789</span>
                      <Badge variant="secondary">调查中</Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">实时统计</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>当前风险评分</span>
                      <span className="font-mono">25.3</span>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>今日事件数</span>
                      <span className="font-mono">{stats.trends.last24h.total}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>监控准确率</span>
                      <span className="font-mono">96.8%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 统计报告标签页 */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>风险分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>严重风险</span>
                    <Badge variant="destructive">{stats.bySeverity.critical}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>高风险</span>
                    <Badge variant="destructive">{stats.bySeverity.high}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>中风险</span>
                    <Badge variant="secondary">{stats.bySeverity.medium}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>低风险</span>
                    <Badge variant="outline">{stats.bySeverity.low}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>事件类型分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>登录异常</span>
                    <Badge variant="outline">{stats.byType.login}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>交易异常</span>
                    <Badge variant="outline">{stats.byType.transaction}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>注册异常</span>
                    <Badge variant="outline">{stats.byType.registration}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>提现异常</span>
                    <Badge variant="outline">{stats.byType.withdrawal}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function WrappedRiskControlPage() {
  return (
    <PagePermission permissions={AdminPermissions.system.manage()}>
      <RiskControlPage />
    </PagePermission>
  );
}