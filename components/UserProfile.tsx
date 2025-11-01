'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useLanguage } from '@/src/i18n/useLanguageCompat';
import type { User } from '@/types';

interface UserProfileProps {
  user?: User;
  onUpdate?: (updatedUser: Partial<User>) => Promise<void>;
  className?: string;
  editable?: boolean;
}

interface UserProfileFormData {
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string;
}

export function UserProfile({ 
  user, 
  onUpdate, 
  className = '', 
  editable = true 
}: UserProfileProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserProfileFormData>({
    firstName: '',
    lastName: '',
    username: '',
    avatarUrl: ''
  });

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  // 格式化日期
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  };

  // 获取VIP等级文本
  const getVipLevelText = (level: number) => {
    if (level === 0) return t('profile.vip.none') || '普通用户';
    return t('profile.vip.level', { level }) || `VIP ${level}`;
  };

  // 获取VIP等级颜色
  const getVipLevelColor = (level: number) => {
    if (level === 0) return 'bg-gray-100 text-gray-800';
    if (level === 1) return 'bg-yellow-100 text-yellow-800';
    if (level === 2) return 'bg-purple-100 text-purple-800';
    if (level === 3) return 'bg-pink-100 text-pink-800';
    return 'bg-gradient-to-r from-yellow-400 to-pink-400 text-white';
  };

  // 处理表单输入变化
  const handleInputChange = (field: keyof UserProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 保存用户资料
  const handleSave = async () => {
    if (!onUpdate) return;
    
    setLoading(true);
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('更新用户资料失败:', error);
      alert('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
    setIsEditing(false);
  };

  // 模拟用户数据（如果没有传入用户数据）
  const defaultUser: User = {
    id: 'user-1',
    telegramId: '123456789',
    username: 'demo_user',
    firstName: '演示',
    lastName: '用户',
    avatarUrl: '',
    language: 'zh',
    coinBalance: 1250.50,
    platformBalance: 320.00,
    vipLevel: 2,
    totalSpent: 5800.00,
    freeDailyCount: 3,
    lastFreeResetDate: new Date(),
    referralCode: 'REF2024',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    balance: 1250.50
  };

  const currentUser = user || defaultUser;

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('profile.title') || '用户资料'}
          </h1>
          <p className="text-gray-600">
            {t('profile.subtitle') || '管理和查看您的个人信息'}
          </p>
        </div>
        {editable && (
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "default"}
          >
            {isEditing ? 
              (t('profile.cancel') || '取消') : 
              (t('profile.edit') || '编辑资料')
            }
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 用户基本信息卡片 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {currentUser.avatarUrl ? (
                    <img 
                      src={currentUser.avatarUrl} 
                      alt={currentUser.firstName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    currentUser.firstName?.charAt(0) || 'U'
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {currentUser.firstName} {currentUser.lastName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    @{currentUser.username || '未设置'}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">
                    {t('profile.tab.basic') || '基本信息'}
                  </TabsTrigger>
                  <TabsTrigger value="financial">
                    {t('profile.tab.financial') || '财务信息'}
                  </TabsTrigger>
                  <TabsTrigger value="activity">
                    {t('profile.tab.activity') || '活动统计'}
                  </TabsTrigger>
                </TabsList>

                {/* 基本信息 */}
                <TabsContent value="basic" className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">
                            {t('profile.firstName') || '名字'}
                          </Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            placeholder={t('profile.firstName.placeholder') || '请输入名字'}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">
                            {t('profile.lastName') || '姓氏'}
                          </Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            placeholder={t('profile.lastName.placeholder') || '请输入姓氏'}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="username">
                          {t('profile.username') || '用户名'}
                        </Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          placeholder={t('profile.username.placeholder') || '请输入用户名'}
                        />
                      </div>
                      <div>
                        <Label htmlFor="avatarUrl">
                          {t('profile.avatarUrl') || '头像链接'}
                        </Label>
                        <Input
                          id="avatarUrl"
                          value={formData.avatarUrl}
                          onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                          placeholder={t('profile.avatarUrl.placeholder') || '请输入头像图片链接'}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            {t('profile.firstName') || '名字'}
                          </Label>
                          <p className="mt-1">{currentUser.firstName || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            {t('profile.lastName') || '姓氏'}
                          </Label>
                          <p className="mt-1">{currentUser.lastName || '-'}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          {t('profile.username') || '用户名'}
                        </Label>
                        <p className="mt-1">@{currentUser.username || t('profile.notSet') || '未设置'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          {t('profile.telegramId') || 'Telegram ID'}
                        </Label>
                        <p className="mt-1">{currentUser.telegramId}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          {t('profile.referralCode') || '邀请码'}
                        </Label>
                        <p className="mt-1 font-mono text-sm">
                          {currentUser.referralCode || t('profile.none') || '无'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          {t('profile.memberSince') || '注册时间'}
                        </Label>
                        <p className="mt-1">{formatDate(currentUser.createdAt)}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* 财务信息 */}
                <TabsContent value="financial" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <Label className="text-sm font-medium text-green-700">
                        {t('profile.coinBalance') || '余额'}
                      </Label>
                      <p className="text-2xl font-bold text-green-800">
                        {formatNumber(currentUser.coinBalance)}
                      </p>
                      <p className="text-xs text-green-600">
                        {t('profile.coinUnit') || '币'}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <Label className="text-sm font-medium text-blue-700">
                        {t('profile.platformBalance') || '平台余额'}
                      </Label>
                      <p className="text-2xl font-bold text-blue-800">
                        {formatNumber(currentUser.platformBalance)}
                      </p>
                      <p className="text-xs text-blue-600">
                        {t('profile.coinUnit') || '币'}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <Label className="text-sm font-medium text-purple-700">
                        {t('profile.totalSpent') || '总消费'}
                      </Label>
                      <p className="text-2xl font-bold text-purple-800">
                        {formatNumber(currentUser.totalSpent)}
                      </p>
                      <p className="text-xs text-purple-600">
                        {t('profile.coinUnit') || '币'}
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <Label className="text-sm font-medium text-orange-700">
                        {t('profile.vipLevel') || 'VIP等级'}
                      </Label>
                      <div className="mt-1">
                        <Badge className={getVipLevelColor(currentUser.vipLevel)}>
                          {getVipLevelText(currentUser.vipLevel)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* 活动统计 */}
                <TabsContent value="activity" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        {t('profile.freeDailyCount') || '今日免费次数'}
                      </Label>
                      <p className="text-2xl font-bold text-gray-900">
                        {currentUser.freeDailyCount}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        {t('profile.language') || '语言偏好'}
                      </Label>
                      <p className="text-lg mt-1">{currentUser.language}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        {t('profile.lastUpdate') || '最后更新'}
                      </Label>
                      <p className="text-sm mt-1">{formatDate(currentUser.updatedAt)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        {t('profile.freeResetDate') || '免费次数重置'}
                      </Label>
                      <p className="text-sm mt-1">{formatDate(currentUser.lastFreeResetDate)}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* 编辑模式下的操作按钮 */}
              {isEditing && editable && (
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={loading}
                  >
                    {t('profile.cancel') || '取消'}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? 
                      (t('profile.saving') || '保存中...') : 
                      (t('profile.save') || '保存')
                    }
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 侧边信息卡片 */}
        <div className="space-y-6">
          {/* VIP状态卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t('profile.vipStatus') || 'VIP状态'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-3">
                <div className="text-3xl">
                  {currentUser.vipLevel === 0 ? '👤' : 
                   currentUser.vipLevel === 1 ? '⭐' :
                   currentUser.vipLevel === 2 ? '🌟' : '💎'}
                </div>
                <div>
                  <Badge className={getVipLevelColor(currentUser.vipLevel)}>
                    {getVipLevelText(currentUser.vipLevel)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {currentUser.vipLevel === 0 ? 
                    (t('profile.vip.notVip') || '您是普通用户') :
                    currentUser.vipLevel === 1 ?
                    (t('profile.vip.benefits1') || '享受基础特权') :
                    currentUser.vipLevel === 2 ?
                    (t('profile.vip.benefits2') || '享受高级特权') :
                    (t('profile.vip.benefits3') || '享受至尊特权')
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 快速操作卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t('profile.quickActions') || '快速操作'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                💰 {t('profile.actions.recharge') || '充值'}
              </Button>
              <Button className="w-full justify-start" variant="outline">
                🎁 {t('profile.actions.invite') || '邀请好友'}
              </Button>
              <Button className="w-full justify-start" variant="outline">
                📋 {t('profile.actions.history') || '交易记录'}
              </Button>
              <Button className="w-full justify-start" variant="outline">
                ⚙️ {t('profile.actions.settings') || '账户设置'}
              </Button>
            </CardContent>
          </Card>

          {/* 账户状态卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t('profile.accountStatus') || '账户状态'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {t('profile.status') || '状态'}
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {t('profile.status.active') || '正常'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {t('profile.verified') || '认证'}
                  </span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {t('profile.verified.yes') || '已认证'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {t('profile.riskLevel') || '风险等级'}
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {t('profile.riskLevel.low') || '低风险'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;