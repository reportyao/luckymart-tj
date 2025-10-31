'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PagePermission from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin-permission-manager';

interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  sub_category?: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RewardConfig {
  id: string;
  config_name: string;
  category: string;
  name_zh: string;
  name_en: string;
  name_ru: string;
  reward_type: string;
  reward_amount: number;
  reward_percentage?: number;
  min_threshold?: number;
  max_amount?: number;
  daily_limit: number;
  total_limit: number;
  valid_days: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface RiskConfig {
  id: string;
  config_name: string;
  category: string;
  risk_type: string;
  threshold_value: number;
  max_attempts: number;
  time_window_minutes: number;
  auto_action: string;
  action_duration_minutes: number;
  notification_required: boolean;
  escalation_level: number;
  weight_score: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface FeatureFlag {
  id: string;
  flag_name: string;
  flag_key: string;
  name_zh: string;
  name_en: string;
  name_ru: string;
  category: string;
  is_enabled: boolean;
  enabled_for_all: boolean;
  rollout_percentage: number;
  target_version?: string;
  test_duration_hours?: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface OperationConfig {
  id: string;
  config_name: string;
  category: string;
  name_zh: string;
  name_en: string;
  name_ru: string;
  discount_percentage?: number;
  discount_amount?: number;
  promo_code?: string;
  usage_limit?: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  daily_limit?: number;
  monthly_limit?: number;
  platform_fee_rate?: number;
  minimum_fee?: number;
  maximum_fee?: number;
  fee_calculation_method?: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

function SystemSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('system');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // 数据状态
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [rewardConfigs, setRewardConfigs] = useState<RewardConfig[]>([]);
  const [riskConfigs, setRiskConfigs] = useState<RiskConfig[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [operationConfigs, setOperationConfigs] = useState<OperationConfig[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }
    loadAllData();
  }, [router]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSystemSettings(),
        fetchRewardConfigs(),
        fetchRiskConfigs(),
        fetchFeatureFlags(),
        fetchOperationConfigs()
      ]);
    } catch (error) {
      console.error('加载数据失败:', error);
      setError('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/settings/system', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemSettings(data.data || []);
      }
    } catch (error) {
      console.error('获取系统参数失败:', error);
    }
  };

  const fetchRewardConfigs = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/settings/rewards', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRewardConfigs(data.data || []);
      }
    } catch (error) {
      console.error('获取奖励配置失败:', error);
    }
  };

  const fetchRiskConfigs = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/settings/risk', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRiskConfigs(data.data || []);
      }
    } catch (error) {
      console.error('获取风控配置失败:', error);
    }
  };

  const fetchFeatureFlags = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/settings/features', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeatureFlags(data.data || []);
      }
    } catch (error) {
      console.error('获取功能开关失败:', error);
    }
  };

  const fetchOperationConfigs = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/settings/operation', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOperationConfigs(data.data || []);
      }
    } catch (error) {
      console.error('获取运营配置失败:', error);
    }
  };

  const toggleFeatureFlag = async (id: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/settings/features', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          enabled,
          reason: enabled ? '启用功能' : '禁用功能'
        })
      });
      
      if (response.ok) {
        setMessage(`功能开关${enabled ? '启用' : '禁用'}成功`);
        await fetchFeatureFlags();
      } else {
        setError('操作失败');
      }
    } catch (error) {
      console.error('切换功能开关失败:', error);
      setError('操作失败');
    }
  };

  const getStatusBadge = (isActive: boolean, isEnabled?: boolean) => {
    if (isEnabled !== undefined) {
      return isEnabled ? 
        <Badge className="bg-green-500">已启用</Badge> : 
        <Badge className="bg-red-500">已禁用</Badge>;
    }
    return isActive ? 
      <Badge className="bg-green-500">活跃</Badge> : 
      <Badge className="bg-gray-500">非活跃</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors: { [key: string]: string } = {
      'general': 'bg-blue-500',
      'newbie': 'bg-purple-500',
      'checkin': 'bg-green-500',
      'first_recharge': 'bg-orange-500',
      'invitation': 'bg-pink-500',
      'payment': 'bg-red-500',
      'withdrawal': 'bg-yellow-500',
      'registration': 'bg-indigo-500',
      'behavior': 'bg-teal-500',
      'platform_fee': 'bg-cyan-500',
      'promotion': 'bg-amber-500',
      'user_limit': 'bg-lime-500'
    };
    
    const colorClass = categoryColors[category] || 'bg-gray-500';
    return <Badge className={colorClass}>{category}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">系统设置优化管理</h1>
        <p className="text-gray-600">管理系统参数配置、奖励参数、风控参数、功能开关和运营参数</p>
      </div>

      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-4">
          <AlertDescription className="text-red-600">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="system">系统参数</TabsTrigger>
          <TabsTrigger value="rewards">奖励参数</TabsTrigger>
          <TabsTrigger value="risk">风控参数</TabsTrigger>
          <TabsTrigger value="features">功能开关</TabsTrigger>
          <TabsTrigger value="operation">运营参数</TabsTrigger>
        </TabsList>

        {/* 系统参数配置 */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>系统参数配置</CardTitle>
              <CardDescription>管理系统的基础参数配置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {systemSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{setting.setting_key}</h3>
                        {getCategoryBadge(setting.category)}
                      </div>
                      <p className="text-sm text-gray-600">{setting.description}</p>
                      <p className="text-sm text-gray-800 mt-1">
                        当前值: <span className="font-mono">{setting.setting_value}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(setting.is_active)}
                      <Badge variant="outline">{setting.setting_type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 奖励参数配置 */}
        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>奖励参数配置</CardTitle>
              <CardDescription>管理系统各类奖励参数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {rewardConfigs.map((reward) => (
                  <div key={reward.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{reward.config_name}</h3>
                        <p className="text-sm text-gray-600">{reward.name_zh}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(reward.category)}
                        {getStatusBadge(reward.is_active)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">奖励类型:</span>
                        <p className="font-medium">{reward.reward_type}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">奖励金额:</span>
                        <p className="font-medium">{reward.reward_amount}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">每日限制:</span>
                        <p className="font-medium">{reward.daily_limit || '无限制'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">优先级:</span>
                        <p className="font-medium">{reward.priority}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 风控参数配置 */}
        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle>风控参数配置</CardTitle>
              <CardDescription>管理系统风控参数和策略</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {riskConfigs.map((risk) => (
                  <div key={risk.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{risk.config_name}</h3>
                        <p className="text-sm text-gray-600">风险类型: {risk.risk_type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(risk.category)}
                        {getStatusBadge(risk.is_active)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">阈值:</span>
                        <p className="font-medium">{risk.threshold_value}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">最大尝试:</span>
                        <p className="font-medium">{risk.max_attempts}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">时间窗口(分钟):</span>
                        <p className="font-medium">{risk.time_window_minutes}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">自动动作:</span>
                        <p className="font-medium">{risk.auto_action}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">权重分数:</span>
                        <p className="font-medium">{risk.weight_score}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 功能开关 */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>功能开关</CardTitle>
              <CardDescription>管理系统功能模块的开关控制</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {featureFlags.map((flag) => (
                  <div key={flag.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{flag.flag_name}</h3>
                        <p className="text-sm text-gray-600">{flag.name_zh}</p>
                        <p className="text-xs text-gray-500 mt-1">Key: {flag.flag_key}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(flag.category)}
                        {getStatusBadge(flag.is_active, flag.is_enabled)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">推出比例:</span>
                          <p className="font-medium">{flag.rollout_percentage}%</p>
                        </div>
                        <div>
                          <span className="text-gray-600">全局启用:</span>
                          <p className="font-medium">{flag.enabled_for_all ? '是' : '否'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">目标版本:</span>
                          <p className="font-medium">{flag.target_version || '无'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">优先级:</span>
                          <p className="font-medium">{flag.priority}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => toggleFeatureFlag(flag.id, !flag.is_enabled)}
                        variant={flag.is_enabled ? "destructive" : "default"}
                        size="sm"
                      >
                        {flag.is_enabled ? '禁用' : '启用'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 运营参数配置 */}
        <TabsContent value="operation">
          <Card>
            <CardHeader>
              <CardTitle>运营参数配置</CardTitle>
              <CardDescription>管理促销活动、用户限制、平台费率等运营参数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {operationConfigs.map((config) => (
                  <div key={config.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{config.config_name}</h3>
                        <p className="text-sm text-gray-600">{config.name_zh}</p>
                        {config.promo_code && (
                          <p className="text-xs text-blue-600 mt-1">促销代码: {config.promo_code}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(config.category)}
                        {getStatusBadge(config.is_active)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                      {config.discount_percentage && (
                        <div>
                          <span className="text-gray-600">折扣:</span>
                          <p className="font-medium">{config.discount_percentage}%</p>
                        </div>
                      )}
                      {config.discount_amount && (
                        <div>
                          <span className="text-gray-600">折扣金额:</span>
                          <p className="font-medium">{config.discount_amount}</p>
                        </div>
                      )}
                      {config.platform_fee_rate && (
                        <div>
                          <span className="text-gray-600">平台费率:</span>
                          <p className="font-medium">{(config.platform_fee_rate * 100).toFixed(2)}%</p>
                        </div>
                      )}
                      {config.daily_limit && (
                        <div>
                          <span className="text-gray-600">日限制:</span>
                          <p className="font-medium">{config.daily_limit}</p>
                        </div>
                      )}
                      {config.monthly_limit && (
                        <div>
                          <span className="text-gray-600">月限制:</span>
                          <p className="font-medium">{config.monthly_limit}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">优先级:</span>
                        <p className="font-medium">{config.priority}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <Button onClick={loadAllData} variant="outline">
          刷新数据
        </Button>
      </div>
    </div>
  );
}

export default function WrappedSystemSettingsPage() {
  return (
    <PagePermission permissions={AdminPermissions.settings.write()}>
      <SystemSettingsPage />
    </PagePermission>
  );
}
