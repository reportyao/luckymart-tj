/**
 * 首充奖励配置API
 * GET /api/rewards/first-recharge/config
 * 
 * 返回首充奖励的档位配置信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { getLogger } from '@/lib/logger';

// 首充奖励配置 - 按任务要求
const FIRST_RECHARGE_REWARDS = [
  {
    amount: 10,
    reward: 2, // 奖励2幸运币（价值2 Som）
    description: '充值10 Som → 奖励2幸运币',
    rate: 0.20,
    type: 'lucky_coins'
  },
  {
    amount: 20,
    reward: 5, // 奖励5幸运币（价值5 Som）
    description: '充值20 Som → 奖励5幸运币',
    rate: 0.25,
    type: 'lucky_coins'
  },
  {
    amount: 50,
    reward: 15, // 奖励15幸运币（价值15 Som）
    description: '充值50 Som → 奖励15幸运币',
    rate: 0.30,
    type: 'lucky_coins'
  },
  {
    amount: 100,
    reward: 35, // 奖励35幸运币（价值35 Som）
    description: '充值100 Som → 奖励35幸运币',
    rate: 0.35,
    type: 'lucky_coins'
  }
];

export const GET = async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `first_recharge_config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    logger.info('获取首充奖励配置', {
      requestId
    });

    // 返回奖励配置
    return NextResponse.json({
      success: true,
      data: {
        rewardTiers: FIRST_RECHARGE_REWARDS,
        rules: {
          maxClaim: 1, // 每个用户最多享受一次
          autoClaim: true, // 充值确认后自动发放
          highestTierOnly: true, // 按最高档位发放，不叠加
          preventSmallAmountAbuse: true // 防止恶意小金额充值刷奖励
        },
        metadata: {
          supportedAmounts: FIRST_RECHARGE_REWARDS.map((tier : any) => tier.amount),
          totalRewardOptions: FIRST_RECHARGE_REWARDS.length,
          minimumRechargeAmount: Math.min(...FIRST_RECHARGE_REWARDS.map((tier : any) => tier.amount)),
          maximumRewardAmount: Math.max(...FIRST_RECHARGE_REWARDS.map((tier : any) => tier.reward))
        }
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('获取首充奖励配置失败', error, {
      requestId,
      error: error.message
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CONFIG_FETCH_FAILED',
          message: '获取首充奖励配置失败',
          details: error.message
        }
      },
      { status: 500 }
    );
  }
};