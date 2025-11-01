'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProfileCardProps {
  className?: string;
  showBalance?: boolean;
  showStats?: boolean;
  compact?: boolean;
  onUpdate?: () => void;
}

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  winRate: number;
  referralCount: number;
}

export function ProfileCard({ 
  className = '', 
  showBalance = true, 
  showStats = false,
  compact = false,
  onUpdate 
}: ProfileCardProps) {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载用户统计数据
  useEffect(() => {
    if (showStats && user?.id) {
      loadUserStats();
    }
  }, [showStats, user?.id]);

  const loadUserStats = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // 这里可以调用实际的 API
      // const response = await fetch('/api/user/stats', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await response.json();
      
      // 模拟数据 - 实际项目中应该从 API 获取
      setUserStats({
        totalOrders: 0,
        totalSpent: 0,
        winRate: 0,
        referralCount: 0
      });
    } catch (error) {
      console.error('加载用户统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 如果用户未登录，显示占位符
  if (!user) {
    return (
      <div className={`bg-white rounded-lg shadow-md border p-6 ${className}`}>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // 紧凑模式
  if (compact) {
    return (
      <div className={`bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg shadow-md text-white p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {user.telegramId ? (
                <Image
                  src={`https://t.me/i/userpic/160/${user.username || user.telegramId}.jpg`}
                  alt={user.firstName}
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-white"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/default-avatar.png';
                  }}
                />
              ) : (
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {user.firstName?.[0] || 'U'}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                {user.firstName} {user.lastName}
              </h3>
              {showBalance && (
                <p className="text-xs opacity-90">
                  {user.luckyCoins?.toLocaleString() || 0} {t('coins')}
                </p>
              )}
            </div>
          </div>
          {userStats && (
            <div className="text-right">
              <p className="text-xs opacity-90">{t('orders')}</p>
              <p className="font-semibold text-sm">{userStats.totalOrders}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 完整模式
  return (
    <div className={`bg-white rounded-lg shadow-md border overflow-hidden ${className}`}>
      {/* 头部背景 */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-24 relative">
        {/* 头像 */}
        <div className="absolute -bottom-8 left-6">
          <div className="relative">
            {user.telegramId ? (
              <Image
                src={`https://t.me/i/userpic/160/${user.username || user.telegramId}.jpg`}
                alt={user.firstName}
                width={64}
                height={64}
                className="rounded-full border-4 border-white shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/default-avatar.png';
                }}
              />
            ) : (
              <div className="w-16 h-16 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-gray-600 font-medium text-xl">
                  {user.firstName?.[0] || 'U'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="pt-12 pb-6 px-6">
        {/* 用户信息 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {user.firstName} {user.lastName}
          </h2>
          {user.username && (
            <p className="text-gray-600 text-sm">@{user.username}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            ID: {user.telegramId || user.id}
          </p>
        </div>

        {/* 余额显示 */}
        {showBalance && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('coins')}</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {user.luckyCoins?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">TJS</p>
                <p className="text-xl font-semibold text-gray-800">
                  {(user.luckyCoins * 0.1).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 统计信息 */}
        {showStats && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
              {t('stats')}
            </h3>
            
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : userStats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{t('total_orders')}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {userStats.totalOrders}
                  </p>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{t('total_spent')}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {userStats.totalSpent} TJS
                  </p>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{t('win_rate')}</p>
                  <p className="text-lg font-semibold text-green-600">
                    {userStats.winRate}%
                  </p>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{t('referrals')}</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {userStats.referralCount}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                {t('no_stats_available')}
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mt-6 flex space-x-3">
          <button 
            onClick={loadUserStats}
            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            disabled={loading}
          >
            {loading ? t('loading') : t('refresh')}
          </button>
          
          {onUpdate && (
            <button 
              onClick={onUpdate}
              className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              {t('update')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;