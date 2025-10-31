'use client';

import { useState, useEffect, useCallback } from 'react';
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

// Props接口定义
export interface InvitationCodeProps {
  /** 自定义CSS类名 */
  className?: string;
  /** 自定义邀请码 */
  customCode?: string;
  /** 自定义邀请链接 */
  customLink?: string;
  /** 自定义用户统计数据 */
  customStats?: {
    totalReferrals: number;
    level1Count: number;
    level2Count: number;
    level3Count: number;
    totalRewards: number;
    pendingRewards: number;
  };
  /** 是否显示层级分布 */
  showLevelDistribution?: boolean;
  /** 是否显示邀请技巧 */
  showTips?: boolean;
  /** 复制回调函数 */
  onCopy?: (type: 'code' | 'link', value: string) => void;
  /** 分享回调函数 */
  onShare?: (platform: string, data: any) => void;
  /** 生成二维码回调函数 */
  onGenerateQR?: (link: string) => void;
  /** 数据获取回调函数 */
  fetchData?: () => Promise<any>;
  /** 错误回调函数 */
  onError?: (error: Error) => void;
}

const InvitationCode: React.FC<InvitationCodeProps> = ({
  className = '',
  customCode,
  customLink,
  customStats,
  showLevelDistribution = true,
  showTips = true,
  onCopy,
  onShare,
  onGenerateQR,
  fetchData,
  onError
}) => {
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

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.('code', inviteCode);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      onError?.(err as Error);
    }
  }, [inviteCode, onCopy, onError]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.('link', inviteLink);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      onError?.(err as Error);
    }
  }, [inviteLink, onCopy, onError]);

  const handleShareTelegram = useCallback(() => {
    const text = t('share_message', '注册并获得新用户奖励！使用我的邀请码或链接：') + `\n邀请码：${inviteCode}\n邀请链接：${inviteLink}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;
    const shareData = {
      platform: 'telegram',
      url: telegramUrl,
      code: inviteCode,
      text
    };
    onShare?.('telegram', shareData);
    window.open(telegramUrl, '_blank');
  }, [inviteCode, inviteLink, t, onShare]);

  const handleGenerateQR = useCallback(() => {
    // 生成二维码逻辑，可以集成第三方库
    console.log('生成二维码', inviteLink);
    onGenerateQR?.(inviteLink);
  }, [inviteLink, onGenerateQR]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 邀请码卡片 */}
      <Card className="luckymart-padding-lg bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
        <div className="luckymart-text-center">
          <h3 className="luckymart-text-xl font-semibold text-gray-800 luckymart-spacing-md">
            {t('my_code', '我的邀请码')}
          </h3>
          
          {/* 邀请码显示 */}
          <div className="luckymart-bg-white luckymart-rounded-lg luckymart-padding-md luckymart-spacing-md luckymart-shadow-sm luckymart-border">
            <div className="luckymart-layout-flex luckymart-layout-center justify-center luckymart-spacing-md">
              <Input
                value={inviteCode}
                readOnly
                className="luckymart-text-center text-2xl font-mono luckymart-font-bold border-none bg-transparent text-blue-600"
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
          <div className="luckymart-bg-white luckymart-rounded-lg p-3 luckymart-spacing-md luckymart-shadow-sm luckymart-border">
            <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
              <span className="luckymart-text-sm text-gray-600 truncate flex-1">
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
          <div className="luckymart-layout-flex flex-wrap justify-center gap-3">
            <Button
              onClick={handleShareTelegram}
              className="luckymart-bg-primary hover:bg-blue-600 text-white"
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
        <Card className="luckymart-padding-md">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm text-gray-600">{t('total_referrals', '总推荐数')}</p>
              <p className="text-2xl luckymart-font-bold text-gray-800">{userStats.totalReferrals}</p>
            </div>
            <Users className="luckymart-size-lg luckymart-size-lg luckymart-text-primary" />
          </div>
        </Card>

        <Card className="luckymart-padding-md">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm text-gray-600">{t('total_rewards', '总奖励金额')}</p>
              <p className="text-2xl luckymart-font-bold text-green-600">${userStats.totalRewards}</p>
            </div>
            <TrendingUp className="luckymart-size-lg luckymart-size-lg luckymart-text-success" />
          </div>
        </Card>

        <Card className="luckymart-padding-md">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm text-gray-600">{t('pending_rewards', '待确认奖励')}</p>
              <p className="text-2xl luckymart-font-bold text-orange-600">${userStats.pendingRewards}</p>
            </div>
            <Clock className="luckymart-size-lg luckymart-size-lg text-orange-500" />
          </div>
        </Card>
      </div>

      {/* 邀请级别分布 */}
      {showLevelDistribution && (
        <Card className="luckymart-padding-lg">
          <h3 className="luckymart-text-lg font-semibold text-gray-800 luckymart-spacing-md">
            {t('level_structure', '层级结构')}
          </h3>
        <div className="luckymart-spacing-md">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between p-3 bg-blue-50 luckymart-rounded-lg">
            <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-md">
              <Badge variant="default" className="luckymart-bg-primary">1</Badge>
              <span className="luckymart-font-medium">{t('level_1', '一级推荐')}</span>
            </div>
            <span className="luckymart-text-lg font-semibold text-blue-600">{userStats.level1Count}人</span>
          </div>
          <div className="luckymart-layout-flex luckymart-layout-center justify-between p-3 bg-green-50 luckymart-rounded-lg">
            <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-md">
              <Badge variant="default" className="luckymart-bg-success">2</Badge>
              <span className="luckymart-font-medium">{t('level_2', '二级推荐')}</span>
            </div>
            <span className="luckymart-text-lg font-semibold text-green-600">{userStats.level2Count}人</span>
          </div>
          <div className="luckymart-layout-flex luckymart-layout-center justify-between p-3 bg-purple-50 luckymart-rounded-lg">
            <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-md">
              <Badge variant="default" className="bg-purple-500">3</Badge>
              <span className="luckymart-font-medium">{t('level_3', '三级推荐')}</span>
            </div>
            <span className="luckymart-text-lg font-semibold text-purple-600">{userStats.level3Count}人</span>
          </div>
        </div>
        </Card>
      )}

      {/* 邀请提示 */}
      {showTips && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 luckymart-border border-yellow-200 luckymart-rounded-lg luckymart-padding-md">
        <div className="luckymart-layout-flex items-start luckymart-spacing-md">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
          <div>
            <h4 className="luckymart-font-medium text-gray-800 mb-1">{t('referral_tips', '邀请技巧')}</h4>
            <p className="text-gray-600 luckymart-text-sm">
              • 分享邀请码给朋友，他们注册后可获得新用户奖励，您也能获得邀请奖励<br/>
              • 通过社交媒体、群聊等方式分享您的邀请链接<br/>
              • 定期查看邀请历史，了解邀请进度和奖励情况
            </p>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default InvitationCode;