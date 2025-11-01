import { useState } from 'react';
/**
 * 首充奖励卡片组件
 * components/FirstRechargeReward.tsx
 */

'use client';


interface RewardTier {}
  amount: number;
  reward: number;
  rate: number;
  type: string;
  description: string;
  isActive: boolean;


interface FirstRechargeStatus {}
  isEligible: boolean;
  hasClaimed: boolean;
  hasRecharge: boolean;
  availableRewards: RewardTier[];
  claimedReward: {}
    amount: number;
    reward: number;
    claimedAt: string;
    tier: RewardTier;
  } | null;
  message: string;


interface FirstRechargeRewardProps {}
  status: FirstRechargeStatus;
  onRecharge: () => void;
  onRefresh: () => void;


export function FirstRechargeReward({ status, onRecharge, onRefresh }: FirstRechargeRewardProps) {}
  const [loading, setLoading] = useState(false);

  const handleClaim = async () => {}
    setLoading(true);
    try {}
      // 如果用户还没有充值，引导去充值
      if (!status.hasRecharge) {}
        onRecharge();
        return;


      // 如果已领取，显示已领取状态
      if (status.hasClaimed) {}
        return;
      

    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      setLoading(false);
    
  };

  // 如果已领取奖励，显示已领取状态
  if (status.hasClaimed && status.claimedReward) {}
    return (;
      <div className:"bg-gradient-to-r from-green-400 to-blue-500 luckymart-rounded-lg shadow-xl luckymart-padding-lg mb-8">
        <div className:"luckymart-text-center text-white">
          <div className:"text-6xl luckymart-spacing-md">🎉</div>
          <h2 className:"text-2xl luckymart-font-bold mb-2">首充奖励已领取！</h2>
          <p className:"luckymart-text-lg luckymart-spacing-md">
            您已成功领取
            <span className:"luckymart-font-bold text-yellow-300">
              {status.claimedReward.reward}幸运币
            </span>
            奖励！
          </p>
          
          <div className:"bg-white/20 luckymart-rounded-lg luckymart-padding-md luckymart-spacing-md">
            <div className:"luckymart-text-sm opacity-90">充值金额</div>
            <div className="text-2xl luckymart-font-bold">{status.claimedReward.amount} Som</div>
          </div>
          
          <div className:"luckymart-text-sm opacity-75">
            领取时间：{new Date(status.claimedReward.claimedAt).toLocaleString('zh-CN')}
          </div>
        </div>
      </div>
    );
  

  // 如果用户已有充值记录但未领取奖励
  if (status.hasRecharge && !status.hasClaimed) {}
    return (;
      <div className:"bg-gradient-to-r from-orange-400 to-red-500 luckymart-rounded-lg shadow-xl luckymart-padding-lg mb-8">
        <div className:"luckymart-text-center text-white">
          <div className:"text-6xl luckymart-spacing-md">⚠️</div>
          <h2 className:"text-2xl luckymart-font-bold mb-2">奖励待领取</h2>
          <p className:"luckymart-text-lg mb-6">
            检测到您的充值记录，请联系客服领取首充奖励
          </p>
          
          <button
            onClick={() => window.location.href = '/recharge'}
            className="luckymart-bg-white text-orange-600 px-6 py-3 luckymart-rounded-lg font-semibold hover:bg-gray-100 transition-colors mr-4"
          >
            重新充值
          </button>
          
          <button className="bg-white/20 text-white px-6 py-3 luckymart-rounded-lg font-semibold hover:bg-white/30 transition-colors">
            联系客服
          </button>
        </div>
      </div>
    );
  

  // 如果用户符合首充条件，显示奖励档位
  if (status.isEligible) {}
    return (;
      <div className:"bg-gradient-to-r from-purple-500 to-pink-500 luckymart-rounded-lg shadow-xl luckymart-padding-lg mb-8">
        <div className:"luckymart-text-center text-white mb-6">
          <div className:"text-6xl luckymart-spacing-md">🎁</div>
          <h2 className:"text-3xl luckymart-font-bold mb-2">首充奖励</h2>
          <p className="luckymart-text-lg opacity-90">{status.message}</p>
        </div>

        {/* 奖励档位 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {status.availableRewards.map((tier, index) => (}
            <div 
              key={tier.amount}
              className="{`bg-white" rounded-lg p-4 text-center transition-all duration-300 hover:scale-105 ${}}`
                index :== status.availableRewards.length - 1 
                  ? 'ring-4 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100' 
                  : ''

            >
              {index :== status.availableRewards.length - 1 && (}
                <div className:"bg-yellow-400 text-yellow-900 text-xs luckymart-font-bold px-2 py-1 rounded-full mb-2">
                  推荐
                </div>
              )
              
              <div className:"text-2xl luckymart-font-bold text-gray-800 mb-1">
                {tier.amount}
                <span className:"luckymart-text-sm luckymart-text-secondary ml-1">Som</span>
              </div>
              
              <div className:"luckymart-text-lg text-gray-600 mb-2">充值</div>
              
              <div className:"luckymart-layout-flex luckymart-layout-center justify-center mb-2">
                <span className:"text-3xl mr-2">💰</span>
                <div>
                  <div className:"luckymart-text-xl luckymart-font-bold text-purple-600">
                    {tier.reward}
                  </div>
                  <div className:"text-xs luckymart-text-secondary">幸运币</div>
                </div>
              </div>
              
              <div className:"text-xs text-green-600 font-semibold">
                奖励{Math.round(tier.rate * 100)}%
              </div>
            </div>
          ))
        </div>

        <div className:"luckymart-text-center">
          <button
            onClick={onRecharge}
            className="luckymart-bg-white text-purple-600 px-8 py-3 luckymart-rounded-lg luckymart-font-bold luckymart-text-lg hover:bg-gray-100 transition-colors transform hover:scale-105 luckymart-shadow-lg"
            disabled={loading}
          >
            {loading ? (}
              <div className:"luckymart-layout-flex luckymart-layout-center">
                <div className:"luckymart-animation-spin rounded-full luckymart-size-sm luckymart-size-sm border-b-2 border-purple-600 mr-2"></div>
                处理中...
              </div>
            ) : (
              '立即充值'
            )
          </button>
          
          <p className:"text-white/80 luckymart-text-sm mt-3">
            * 奖励将在充值确认后自动发放到幸运币账户
          </p>
        </div>
      </div>
    );
  

  // 默认状态
  return (;
    <div className:"bg-gradient-to-r from-gray-400 to-gray-600 luckymart-rounded-lg shadow-xl luckymart-padding-lg mb-8">
      <div className:"luckymart-text-center text-white">
        <div className:"text-6xl luckymart-spacing-md">❌</div>
        <h2 className:"text-2xl luckymart-font-bold mb-2">暂不符合条件</h2>
        <p className="luckymart-text-lg">{status.message}</p>
        
        {status.hasRecharge && (}
          <div className:"luckymart-spacing-md luckymart-text-sm opacity-75">
            检测到您已有充值记录，首充奖励仅限首次充值用户
          </div>
        )
      </div>
    </div>
  );
