'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/src/i18n/useLanguageCompat';
import InvitationCode from '@/components/InvitationCode';
import InvitationStats from '@/components/InvitationStats';
import InvitationHistory from '@/components/InvitationHistory';
import CommissionHistory from '@/components/CommissionHistory';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function InvitationPage() {
  const { t } = useTranslation('referral');
  const { currentLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('code');

  // 检测当前用户语言并自动切换到对应语言的邀请页面
  useEffect(() => {
    // 如果有用户信息，可以在这里获取用户的邀请数据
    // 或者根据用户偏好设置默认的活跃标签页
  }, [currentLanguage]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('my_referrals', '我的邀请')}
        </h1>
        <p className="text-gray-600 text-lg">
          {t('subtitle', '邀请好友，获取奖励')}
        </p>
      </div>

      {/* 邀请统计卡片 */}
      <div className="mb-8">
        <InvitationStats />
      </div>

      {/* 主要内容区域 */}
      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="code" className="text-sm">
              {t('invite_code', '邀请码')}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-sm">
              {t('referral_history', '邀请历史')}
            </TabsTrigger>
            <TabsTrigger value="earnings" className="text-sm">
              {t('earnings_history', '收益历史')}
            </TabsTrigger>
            <TabsTrigger value="rules" className="text-sm">
              {t('invitation_rules', '邀请规则')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="space-y-6">
            <InvitationCode />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <InvitationHistory />
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <CommissionHistory />
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <div className="space-y-6">
              {/* 邀请规则说明 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  {t('commission_structure', '佣金结构')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-blue-600 mb-2">
                      {t('tier_1_rate', '一级佣金率')}: 5%
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {t('direct_referrals', '直接邀请')}/br {t('level_1', '一级推荐')}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-green-600 mb-2">
                      {t('tier_2_rate', '二级佣金率')}: 2%
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {t('indirect_referrals', '间接邀请')}/br {t('level_2', '二级推荐')}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-purple-600 mb-2">
                      {t('tier_3_rate', '三级佣金率')}: 1%
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {t('indirect_referrals', '间接邀请')}/br {t('level_3', '三级推荐')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 特殊奖励说明 */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  {t('special_bonuses', '特殊奖励')}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-700">
                      {t('milestone_rewards', '里程碑奖励')}: 
                      邀请满10人奖励100金币，满50人奖励500金币，满100人奖励1000金币
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-700">
                      {t('seasonal_events', '季节活动')}: 
                      节假日特殊邀请活动，获得双倍奖励
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-700">
                      {t('monthly_competition', '月度竞赛')}: 
                      邀请排行榜前10名获得额外奖励
                    </span>
                  </div>
                </div>
              </div>

              {/* 常见问题 */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  {t('faq', '常见问题')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">Q: 如何邀请好友？</h4>
                    <p className="text-gray-600 text-sm">
                      A: 复制您的邀请码或邀请链接，分享给好友即可。
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">Q: 奖励什么时候到账？</h4>
                    <p className="text-gray-600 text-sm">
                      A: 被邀请用户完成首次充值后，奖励将在24小时内到账。
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">Q: 可以邀请多少人？</h4>
                    <p className="text-gray-600 text-sm">
                      A: 无限制邀请人数，邀请越多，奖励越多。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}