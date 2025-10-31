/**
 * 奖励进度组件
 * components/RewardProgress.tsx
 */

'use client';

import { useEffect, useState } from 'react';

interface RewardTier {
  amount: number;
  reward: number;
  rate: number;
  type: string;
  description: string;
  isActive: boolean;
}

interface FirstRechargeStatus {
  isEligible: boolean;
  hasClaimed: boolean;
  hasRecharge: boolean;
  availableRewards: RewardTier[];
  claimedReward: {
    amount: number;
    reward: number;
    claimedAt: string;
    tier: RewardTier;
  } | null;
  rechargeInfo: {
    hasRecharge: boolean;
    firstRechargeAmount?: number;
    totalRecharges?: number;
  };
  message: string;
}

interface RewardProgressProps {
  status: FirstRechargeStatus;
}

export function RewardProgress({ status }: RewardProgressProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 获取所有可能的档位，按金额排序
  const allTiers = [
    { amount: 10, reward: 2 },
    { amount: 20, reward: 5 },
    { amount: 50, reward: 15 },
    { amount: 100, reward: 35 }
  ];

  // 计算用户当前的进度状态
  const getCurrentProgress = () => {
    if (status.hasClaimed && status.claimedReward) {
      const claimedAmount = status.claimedReward.amount;
      const claimedIndex = allTiers.findIndex(tier => tier.amount === claimedAmount);
      return {
        currentIndex: claimedIndex,
        isCompleted: true,
        progress: 100,
        message: `已完成首充奖励：${claimedAmount} Som`
      };
    }

    if (status.hasRecharge) {
      const rechargeAmount = status.rechargeInfo.firstRechargeAmount || 0;
      const matchedTier = allTiers.find(tier => tier.amount === rechargeAmount);
      
      if (matchedTier) {
        const tierIndex = allTiers.findIndex(tier => tier.amount === rechargeAmount);
        return {
          currentIndex: tierIndex,
          isCompleted: false,
          progress: ((tierIndex + 1) / allTiers.length) * 100,
          message: `已充值：${rechargeAmount} Som，奖励待发放`
        };
      }
      
      return {
        currentIndex: -1,
        isCompleted: false,
        progress: 0,
        message: `已充值：${rechargeAmount} Som（不在奖励档位内）`
      };
    }

    // 新用户，未充值
    return {
      currentIndex: -1,
      isCompleted: false,
      progress: 0,
      message: '新用户，等待首次充值'
    };
  };

  const progress = getCurrentProgress();

  return (
    <div className="luckymart-bg-white luckymart-rounded-lg shadow-xl luckymart-padding-lg mb-8">
      <h3 className="luckymart-text-xl luckymart-font-bold text-gray-800 mb-6 luckymart-layout-flex luckymart-layout-center">
        <span className="text-2xl mr-2">📊</span>
        奖励进度
      </h3>

      {/* 进度条 */}
      <div className="mb-6">
        <div className="luckymart-layout-flex justify-between luckymart-layout-center mb-2">
          <span className="luckymart-text-sm text-gray-600">完成进度</span>
          <span className="luckymart-text-sm font-semibold text-purple-600">
            {Math.round(progress.progress)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              progress.isCompleted 
                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                : 'bg-gradient-to-r from-purple-400 to-pink-500'
            }`}
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        
        <div className="mt-2 luckymart-text-sm text-gray-600 luckymart-text-center">
          {progress.message}
        </div>
      </div>

      {/* 档位列表 */}
      <div className="luckymart-spacing-md">
        {allTiers.map((tier, index) => {
          const isCompleted = progress.isCompleted && index <= progress.currentIndex;
          const isCurrent = !progress.isCompleted && index === progress.currentIndex + 1;
          const isFuture = index > progress.currentIndex + 1;
          const isPassed = index <= progress.currentIndex;

          return (
            <div
              key={tier.amount}
              className={`flex items-center p-3 rounded-lg border-2 transition-all duration-300 ${
                isCompleted
                  ? 'border-green-500 bg-green-50'
                  : isCurrent
                  ? 'border-purple-500 bg-purple-50'
                  : isFuture
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-gray-300 bg-gray-100'
              }`}
            >
              {/* 状态图标 */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isCurrent
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-300 text-gray-500'
              }`}>
                {isCompleted ? (
                  <svg className="luckymart-size-sm luckymart-size-sm" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : isCurrent ? (
                  <div className="w-2 h-2 luckymart-bg-white rounded-full luckymart-animation-pulse" />
                ) : (
                  <span className="text-xs luckymart-font-bold">{index + 1}</span>
                )}
              </div>

              {/* 档位信息 */}
              <div className="flex-1">
                <div className="luckymart-layout-flex luckymart-layout-center justify-between">
                  <div>
                    <div className={`font-semibold ${
                      isCompleted || isCurrent ? 'text-gray-800' : 'text-gray-500'
                    }`}>
                      {tier.amount} Som 充值
                    </div>
                    <div className="luckymart-text-sm text-gray-600">
                      奖励 {tier.reward} 幸运币
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {isCompleted && (
                      <div className="text-green-600 font-semibold luckymart-text-sm">
                        ✓ 已完成
                      </div>
                    )}
                    {isCurrent && (
                      <div className="text-purple-600 font-semibold luckymart-text-sm">
                        进行中
                      </div>
                    )}
                    {isFuture && (
                      <div className="text-gray-400 luckymart-text-sm">
                        待解锁
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 统计信息 */}
      <div className="mt-6 pt-6 border-t luckymart-border-light">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="luckymart-text-center">
            <div className="text-2xl luckymart-font-bold text-purple-600">
              {status.rechargeInfo.totalRecharges || 0}
            </div>
            <div className="luckymart-text-sm text-gray-600">总充值次数</div>
          </div>
          
          <div className="luckymart-text-center">
            <div className="text-2xl luckymart-font-bold text-green-600">
              {status.claimedReward?.reward || 0}
            </div>
            <div className="luckymart-text-sm text-gray-600">已获奖励</div>
          </div>
          
          <div className="luckymart-text-center">
            <div className="text-2xl luckymart-font-bold text-blue-600">
              {status.rechargeInfo.firstRechargeAmount || 0}
            </div>
            <div className="luckymart-text-sm text-gray-600">首充金额</div>
          </div>
          
          <div className="luckymart-text-center">
            <div className="text-2xl luckymart-font-bold text-orange-600">
              {allTiers.length}
            </div>
            <div className="luckymart-text-sm text-gray-600">奖励档位</div>
          </div>
        </div>
      </div>

      {/* 更新时间 */}
      <div className="luckymart-spacing-md luckymart-text-center text-xs text-gray-400">
        最后更新：{currentTime.toLocaleTimeString('zh-CN')}
      </div>
    </div>
  );
}