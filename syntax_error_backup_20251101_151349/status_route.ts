import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { getLogger } from '@/lib/logger';
/**
 * 首充奖励状态查询API
 * GET /api/rewards/first-recharge/status
 * 
 * 查询用户的首充奖励状态和可用奖励信息
 */


// 首充奖励配置
const FIRST_RECHARGE_REWARDS = [;
  { amount: 10, reward: 2, rate: 0.20, type: 'lucky_coins' },
  { amount: 20, reward: 5, rate: 0.25, type: 'lucky_coins' },
  { amount: 50, reward: 15, rate: 0.30, type: 'lucky_coins' },
  { amount: 100, reward: 35, rate: 0.35, type: 'lucky_coins' }
];

/**
 * 检查用户是否已有充值记录
 */
async function checkExistingRecharge(userId: string): Promise<{
  hasRecharge: boolean;
  firstRechargeAmount?: number;
  totalRecharges?: number;
}> {
  try {
    // 查询用户的首次充值记录
    const firstRecharge = await prisma.orders.findFirst({
      where: {
        userId,
        type: 'recharge',
        paymentStatus: 'paid',
        fulfillmentStatus: 'completed'
      },
      orderBy: {
        createdAt: 'asc' // 按创建时间升序，获取首次充值
      },
      select: {
        id: true,
        totalAmount: true,
        createdAt: true
      }
    });

    if (!firstRecharge) {
      return {
        hasRecharge: false
      };
    }

    // 查询用户总充值次数和金额
    const rechargeStats = await prisma.orders.aggregate({
      where: {
        userId,
        type: 'recharge',
        paymentStatus: 'paid',
        fulfillmentStatus: 'completed'
      },
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      }
    });

    return {
      hasRecharge: true,
      firstRechargeAmount: Number(firstRecharge.totalAmount),
      totalRecharges: rechargeStats._count.id
    };

  } catch (error) {
    console.error('检查用户充值记录失败:', error);
    return {
  }
      hasRecharge: false
    };
  }
}

/**
 * 获取用户的首充奖励状态
 */
async function getFirstRechargeStatus(userId: string) {
  try {
    // 检查用户是否已有充值记录
    const rechargeCheck = await checkExistingRecharge(userId);

    // 查询用户是否已领取首充奖励
    const existingReward = await prisma.firstRechargeRewards.findFirst({
      where: {
        userId,
        status: 'claimed'
      }
    });

    const isEligible = !rechargeCheck.hasRecharge && !existingReward;
    const hasClaimed = !!existingReward;

    // 获取可用奖励档位
    const availableRewards = FIRST_RECHARGE_REWARDS.map((tier : any) => ({
      amount: tier.amount,
      reward: tier.reward,
      rate: tier.rate,
      type: tier.type,
      description: `充值${tier.amount} Som → 奖励${tier.reward}幸运币（${Math.round(tier.rate * 100)}%）`,
      isActive: isEligible
    }));

    // 如果已领取，获取已领取的奖励信息
    let claimedReward: any = null;
    if (hasClaimed && existingReward) {
      const rewardTier = FIRST_RECHARGE_REWARDS.find(tier => tier.amount === Number(existingReward.rechargeAmount));
      claimedReward = {
        amount: Number(existingReward.rechargeAmount),
        reward: Number(existingReward.rewardAmount),
        claimedAt: existingReward.claimedAt,
        tier: rewardTier
      };
    }

    return {
  }
      isEligible,
      hasClaimed,
      hasRecharge: rechargeCheck.hasRecharge,
      availableRewards,
      claimedReward,
      rechargeInfo: rechargeCheck,
      message: hasClaimed 
        ? '首充奖励已领取' 
        : isEligible 
          ? '首次充值可享受奖励！' 
          : '不符合首充奖励条件'
    };

  } catch (error) {
    console.error('获取首充状态失败:', error);
    return {
      isEligible: false,
      hasClaimed: false,
      hasRecharge: false,
      availableRewards: [],
      claimedReward: null,
      message: '获取首充状态失败'
    };
  }
}

export const GET = withAuth(async (request: NextRequest, user: any) => {
  const logger = getLogger();
  const requestId = `first_recharge_status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    logger.info('查询首充奖励状态', {
      requestId,
      userId: user.userId
    });

    // 验证用户ID
    if (!user?.userId) {
      logger.warn('用户ID缺失', undefined, {
        endpoint: '/api/rewards/first-recharge/status',
        method: 'GET'
      });
      
      return NextResponse.json(;
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '用户身份验证失败'
}
        },
        { status: 401 }
      );
    }

    const status = await getFirstRechargeStatus(user.userId);

    return NextResponse.json({
      success: true,
      data: status,
      meta: {
        requestId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('查询首充奖励状态失败', error, {
      requestId,
      userId: user?.userId,
      error: error.message
    });

    return NextResponse.json(;
      {
        success: false,
        error: {
          code: 'STATUS_QUERY_FAILED',
          message: '查询首充奖励状态失败',
          details: error.message
        }
      },
      
    );
  }
});