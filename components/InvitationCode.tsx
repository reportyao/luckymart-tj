'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/src/i18n/useLanguageCompat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Share2, 
  QrCode, 
  Check, 
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function InvitationCode() {
  const { t } = useTranslation('referral');
  const { currentLanguage } = useLanguage();
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [userStats, setUserStats] = useState({
    totalReferrals: 0,
    level1Count: 0,
    level2Count: 0,
    level3Count: 0,
    totalRewards: 0,
    pendingRewards: 0
  });

  // 模拟获取用户邀请数据
  useEffect(() => {
    // 实际项目中这里应该调用 API 获取真实数据
    const mockData = {
      inviteCode: 'LUCKY' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      inviteLink: `https://luckymart-tj.com/register?ref=LUCKY${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      userStats: {
        totalReferrals: 15,
        level1Count: 8,
        level2Count: 5,
        level2Count: 2,
        totalRewards: 125.50,
        pendingRewards: 25.30
      }
    };

    setInviteCode(mockData.inviteCode);
    setInviteLink(mockData.inviteLink);
    setUserStats(mockData.userStats);
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleShareTelegram = () => {
    const text = t('share_message', '注册并获得新用户奖励！使用我的邀请码或链接：') + `\n邀请码：${inviteCode}\n邀请链接：${inviteLink}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleGenerateQR = () => {
    // 生成二维码逻辑，可以集成第三方库
    console.log('生成二维码', inviteLink);
  };

  return (
    <div className="space-y-6">
      {/* 邀请码卡片 */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {t('my_code', '我的邀请码')}
          </h3>
          
          {/* 邀请码显示 */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border">
            <div className="flex items-center justify-center space-x-3">
              <Input
                value={inviteCode}
                readOnly
                className="text-center text-2xl font-mono font-bold border-none bg-transparent text-blue-600"
              />
              <Button
                onClick={handleCopyCode}
                variant="outline"
                size="sm"
                className="ml-2"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 邀请链接显示 */}
          <div className="bg-white rounded-lg p-3 mb-4 shadow-sm border">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 truncate flex-1">
                {inviteLink}
              </span>
              <Button
                onClick={handleCopyLink}
                variant="ghost"
                size="sm"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 分享按钮 */}
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={handleShareTelegram}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {t('telegram_share', '分享到Telegram')}
            </Button>
            <Button
              onClick={handleGenerateQR}
              variant="outline"
            >
              <QrCode className="w-4 h-4 mr-2" />
              {t('qr_code', '二维码')}
            </Button>
            <Button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: t('share_title', '邀请加入LuckyMart TJ'),
                    text: t('share_message', '注册并获得新用户奖励！使用我的邀请码或链接：') + inviteCode,
                    url: inviteLink
                  });
                } else {
                  handleCopyLink();
                }
              }}
              variant="outline"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {t('social_share', '社交分享')}
            </Button>
          </div>
        </div>
      </Card>

      {/* 邀请统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('total_referrals', '总推荐数')}</p>
              <p className="text-2xl font-bold text-gray-800">{userStats.totalReferrals}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('total_rewards', '总奖励金额')}</p>
              <p className="text-2xl font-bold text-green-600">${userStats.totalRewards}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('pending_rewards', '待确认奖励')}</p>
              <p className="text-2xl font-bold text-orange-600">${userStats.pendingRewards}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* 邀请级别分布 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t('level_structure', '层级结构')}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Badge variant="default" className="bg-blue-500">1</Badge>
              <span className="font-medium">{t('level_1', '一级推荐')}</span>
            </div>
            <span className="text-lg font-semibold text-blue-600">{userStats.level1Count}人</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Badge variant="default" className="bg-green-500">2</Badge>
              <span className="font-medium">{t('level_2', '二级推荐')}</span>
            </div>
            <span className="text-lg font-semibold text-green-600">{userStats.level2Count}人</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Badge variant="default" className="bg-purple-500">3</Badge>
              <span className="font-medium">{t('level_3', '三级推荐')}</span>
            </div>
            <span className="text-lg font-semibold text-purple-600">{userStats.level3Count}人</span>
          </div>
        </div>
      </Card>

      {/* 邀请提示 */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">{t('referral_tips', '邀请技巧')}</h4>
            <p className="text-gray-600 text-sm">
              • 分享邀请码给朋友，他们注册后可获得新用户奖励，您也能获得邀请奖励<br/>
              • 通过社交媒体、群聊等方式分享您的邀请链接<br/>
              • 定期查看邀请历史，了解邀请进度和奖励情况
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}