'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/src/i18n/useLanguageCompat';
import InvitationAnalytics from '@/components/admin/InvitationAnalytics';
import PagePermission from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin-permission-manager';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Filter, 
  Search, 
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Settings,
  Shield
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalReferrals: number;
  activeReferrers: number;
  totalCommissionPaid: number;
  pendingCommissions: number;
  conversionRate: number;
  fraudAttempts: number;
  topReferrer: {
    username: string;
    referralCount: number;
    totalEarnings: number;
  };
}

function AdminInvitationsPage() {
  const { t } = useTranslation('referral');
  const { currentLanguage } = useLanguage();
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('7d');

  // 模拟获取管理后台统计数据
  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true);
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // 模拟管理后台数据
      const mockStats: AdminStats = {
        totalUsers: 15420,
        totalReferrals: 8956,
        activeReferrers: 2847,
        totalCommissionPaid: 45632.80,
        pendingCommissions: 8934.25,
        conversionRate: 68.5,
        fraudAttempts: 23,
        topReferrer: {
          username: 'super_referrer',
          referralCount: 347,
          totalEarnings: 2156.75
        }
      };
      
      setAdminStats(mockStats);
      setLoading(false);
    };

    fetchAdminStats();
  }, [currentLanguage, dateRange]);

  const handleExportData = () => {
    // 实现数据导出功能
    console.log('导出邀请统计数据');
  };

  const handleRefresh = () => {
    setLoading(true);
    // 重新获取数据
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  if (loading && !adminStats) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">{t('loading', '加载中...')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!adminStats) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Card className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {t('error_title', '数据加载失败')}
          </h3>
          <p className="text-gray-600 mb-4">{t('error_message', '无法获取邀请统计数据')}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('retry', '重试')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('admin_invitation_title', '邀请数据管理')}
          </h1>
          <p className="text-gray-600">
            {t('admin_invitation_subtitle', '监控和管理邀请系统数据')}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh', '刷新')}
          </Button>
          <Button onClick={handleExportData} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            {t('export_data', '导出数据')}
          </Button>
        </div>
      </div>

      {/* 核心指标概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">{t('total_users', '总用户数')}</p>
              <p className="text-3xl font-bold text-blue-700">{adminStats.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-blue-500 mt-1">
                {t('active_referrers', '活跃邀请人')}: {adminStats.activeReferrers.toLocaleString()}
              </p>
            </div>
            <Users className="w-12 h-12 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">{t('total_referrals', '总邀请数')}</p>
              <p className="text-3xl font-bold text-green-700">{adminStats.totalReferrals.toLocaleString()}</p>
              <p className="text-xs text-green-500 mt-1">
                {t('conversion_rate', '转化率')}: {adminStats.conversionRate}%
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">{t('total_commission_paid', '已付佣金')}</p>
              <p className="text-3xl font-bold text-purple-700">
                ${adminStats.totalCommissionPaid.toLocaleString()}
              </p>
              <p className="text-xs text-purple-500 mt-1">
                {t('pending_commissions', '待付佣金')}: ${adminStats.pendingCommissions.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">{t('fraud_attempts', '可疑活动')}</p>
              <p className="text-3xl font-bold text-orange-700">{adminStats.fraudAttempts}</p>
              <p className="text-xs text-orange-500 mt-1">
                {t('security_status', '安全状态')}: {t('normal', '正常')}
              </p>
            </div>
            <Shield className="w-12 h-12 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* 顶级邀请者展示 */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            {t('top_referrers', '顶级邀请者')}
          </h3>
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            🏆 {t('this_month', '本月')}
          </Badge>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-800">{adminStats.topReferrer.username}</h4>
              <p className="text-sm text-gray-600">
                {t('referral_count', '邀请数量')}: {adminStats.topReferrer.referralCount} | 
                {t('total_earnings', '总收益')}: ${adminStats.topReferrer.totalEarnings.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-yellow-600">#1</p>
              <p className="text-sm text-gray-500">{t('ranking', '排行榜')}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 筛选控制 */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('search_users', '搜索用户名或用户ID...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">{t('last_7_days', '最近7天')}</option>
              <option value="30d">{t('last_30_days', '最近30天')}</option>
              <option value="90d">{t('last_90_days', '最近90天')}</option>
              <option value="1y">{t('last_year', '最近一年')}</option>
            </select>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              {t('advanced_filter', '高级筛选')}
            </Button>
          </div>
        </div>
      </Card>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="analytics" className="text-sm">
            {t('data_analytics', '数据分析')}
          </TabsTrigger>
          <TabsTrigger value="users" className="text-sm">
            {t('user_management', '用户管理')}
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-sm">
            {t('transaction_history', '交易记录')}
          </TabsTrigger>
          <TabsTrigger value="fraud" className="text-sm">
            {t('fraud_monitor', '异常监控')}
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-sm">
            {t('reward_settings', '奖励配置')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <InvitationAnalytics />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {t('user_management', '用户管理')}
            </h3>
            <p className="text-gray-600">
              {t('user_management_desc', '管理邀请系统中的用户，包括邀请权限设置、用户状态管理等')}
            </p>
            {/* 这里可以添加用户管理表格 */}
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {t('transaction_history', '交易记录')}
            </h3>
            <p className="text-gray-600">
              {t('transaction_history_desc', '查看所有邀请相关的交易记录，包括佣金支付、退款等')}
            </p>
            {/* 这里可以添加交易记录表格 */}
          </Card>
        </TabsContent>

        <TabsContent value="fraud" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-600" />
              {t('fraud_monitor', '异常监控')}
            </h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <span className="font-medium text-red-800">
                  {t('current_alerts', '当前警报')}: {adminStats.fraudAttempts}
                </span>
              </div>
              <p className="text-red-700 text-sm">
                {t('fraud_monitor_desc', '监控系统检测到的可疑邀请活动，包括刷邀请、虚假注册等行为')}
              </p>
            </div>
            {/* 这里可以添加异常监控列表 */}
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              {t('reward_settings', '奖励配置')}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">{t('tier_1_rate', '一级佣金率')}</h4>
                  <p className="text-2xl font-bold text-blue-600">5%</p>
                  <p className="text-sm text-blue-500 mt-1">{t('direct_referrals', '直接邀请')}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">{t('tier_2_rate', '二级佣金率')}</h4>
                  <p className="text-2xl font-bold text-green-600">2%</p>
                  <p className="text-sm text-green-500 mt-1">{t('indirect_referrals', '间接邀请')}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-2">{t('tier_3_rate', '三级佣金率')}</h4>
                  <p className="text-2xl font-bold text-purple-600">1%</p>
                  <p className="text-sm text-purple-500 mt-1">{t('indirect_referrals', '间接邀请')}</p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button>{t('edit_settings', '编辑设置')}</Button>
                <Button variant="outline">{t('reset_defaults', '重置默认值')}</Button>
                <Button variant="outline">{t('backup_settings', '备份设置')}</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WrappedAdminInvitationsPage() {
  return (
    <PagePermission permissions={AdminPermissions.users.read()}>
      <AdminInvitationsPage />
    </PagePermission>
  );
}
