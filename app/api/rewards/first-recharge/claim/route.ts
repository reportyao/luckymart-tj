import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { getLogger } from '@/lib/logger';
/**
 * 首充奖励领取API
 * POST /api/rewards/first-recharge/claim
 * 
 * 领取首充奖励 - 通常在充值确认后自动触发
 * 请求体: { orderId: string }
 */


// 首充奖励配置
const FIRST_RECHARGE_REWARDS = [;
  { amount: 10, reward: 2, rate: 0.20, type: 'lucky_coins' },
  { amount: 20, reward: 5, rate: 0.25, type: 'lucky_coins' },
  { amount: 50, reward: 15, rate: 0.30, type: 'lucky_coins' },
  { amount: 100, reward: 35, rate: 0.35, type: 'lucky_coins' }
];

/**
 * 检查充值订单并确定奖励档位
 */
async function validateAndGetRewardTier(orderId: string, userId: string): Promise<{
  success: boolean;
  order?: any;
  rewardTier?: typeof FIRST_RECHARGE_REWARDS[0];
  error?: string;
}> {
  try {
    // 查找订单
    const order = await prisma.orders.findFirst({
      where: {
        id: orderId,
        userId,
        type: 'recharge',
        paymentStatus: 'paid',
        fulfillmentStatus: 'completed'
      }
    });

    if (!order) {
      return {
        success: false,
        error: '订单不存在或未完成支付'
      };
    }

    const orderAmount = Number(order.totalAmount);

    // 找到对应的奖励档位
    const rewardTier = FIRST_RECHARGE_REWARDS.find(tier => tier.amount === orderAmount);

    if (!rewardTier) {
      return {
        success: false,
        error: `订单金额${orderAmount} Som不在首充奖励档位内`
      };
    }

    return {
      success: true,
      order,
      rewardTier
    };

  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'验证订单失败:', error);
    return {
  }
      success: false,
      error: '验证订单失败'
    };
  }
}

/**
 * 发放首充奖励
 */
async function grantFirstRechargeReward(
  userId: string,
  orderId: string,
  rewardTier: typeof FIRST_RECHARGE_REWARDS[0]
): Promise<{ success: boolean; error?: string; rewardAmount?: number }> {
  const logger = getLogger();
  const requestId = `first_recharge_claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    logger.info('开始发放首充奖励', {
      requestId,
      userId,
      orderId,
      rewardAmount: rewardTier.reward
    });

    // 使用数据库事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 1. 检查用户是否已领取过首充奖励
      const existingReward = await tx.firstRechargeRewards.findFirst({
        where: {
          userId,
          status: 'claimed'
        }
      });

      if (existingReward) {
        throw new Error('首充奖励已领取');
      }

      // 2. 检查该订单是否已发放过奖励
      const orderReward = await tx.firstRechargeRewards.findFirst({
        where: {
          orderId,
          status: 'claimed'
        }
      });

      if (orderReward) {
        throw new Error('该订单的奖励已发放');
      }

      // 3. 创建奖励记录
      const rewardRecord = await tx.firstRechargeRewards.create({
        data: {
          userId,
          orderId,
          rechargeAmount: rewardTier.amount,
          rewardType: 'lucky_coins',
          rewardAmount: rewardTier.reward,
          status: 'claimed',
          claimedAt: new Date()
        }
      });

      // 4. 增加用户幸运币余额
      const balanceUpdateResult = await tx.$executeRaw`;
        SELECT * FROM update_user_balance_with_optimistic_lock(
          ${userId}::uuid,
          ${rewardTier.reward}::decimal,
          'add',
          'lucky_coins'
        )
      `;

      if (!balanceUpdateResult?.[0]?.success) {
        throw new Error(balanceUpdateResult?.[0]?.error_message || '幸运币余额更新失败');
      }

      // 5. 记录钱包交易
      await tx.walletTransactions.create({
        data: {
          userId,
          type: 'first_recharge_reward',
          luckyCoins: rewardTier.reward,
          currency: 'TJS',
          description: `首充奖励：充值${rewardTier.amount} Som获得${rewardTier.reward}幸运币奖励`,
          status: 'completed',
          metadata: {
            orderId,
            rechargeAmount: rewardTier.amount,
            rewardRate: rewardTier.rate,
            rewardId: rewardRecord.id,
            rewardType: 'lucky_coins'
          }
        }
      });

      // 6. 创建通知
      await tx.notifications.create({
        data: {
          userId,
          type: 'first_recharge_reward',
          content: `🎉 恭喜！首充奖励已到账：+${rewardTier.reward}幸运币！`,
          status: 'pending'
        }
      });

      logger.info('首充奖励发放成功', {
        requestId,
        userId,
        orderId,
        rewardAmount: rewardTier.reward,
        rewardId: rewardRecord.id
      });

      return {
        success: true,
        rewardAmount: rewardTier.reward,
        newLuckyCoins: (balanceUpdateResult?.0 ?? null).new_lucky_coins,
        rewardRecord
      };
    });

    return result;

  } catch (error: any) {
    logger.error('发放首充奖励失败', error, {
      requestId,
      userId,
      orderId,
      error: error.message
    });

    return {
      success: false,
      error: error.message || '发放奖励失败'
    };
  }
}

export const POST = withAuth(async (request: NextRequest, user: any) => {
  const logger = getLogger();
  const requestId = `claim_first_recharge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    logger.info('领取首充奖励请求', {
      requestId,
      userId: user.userId
    });

    const body = await request.json();
    const { orderId } = body;

    // 验证必需参数
    if (!orderId) {
      return NextResponse.json(;
}
        {
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: '缺少必要参数：orderId'
          }
        },
        { status: 400 }
      );
    }

    // 验证和获取奖励档位
    const validation = await validateAndGetRewardTier(orderId, user.userId);
    if (!validation.success) {
      return NextResponse.json(;
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: validation.error || '订单验证失败'
          }
        },
        { status: 400 }
      );
    }

    // 发放奖励
    const rewardResult = await grantFirstRechargeReward(;
      user.userId,
      orderId,
      validation.rewardTier!
    );

    if (!rewardResult.success) {
      return NextResponse.json(;
        {
          success: false,
          error: {
            code: 'REWARD_FAILED',
            message: rewardResult.error || '奖励发放失败'
          }
        },
        { status: 500 }
      );
    }

    logger.info('首充奖励领取成功', {
      requestId,
      userId: user.userId,
      orderId,
      rewardAmount: rewardResult.rewardAmount
    });

    // 通知实现完成 发送Telegram通知
    // await sendTelegramNotification(user.userId, `首充奖励领取成功！获得${rewardResult.rewardAmount}幸运币`);

    return NextResponse.json({
      success: true,
      data: {
        claimed: true,
        rewardAmount: rewardResult.rewardAmount,
        rewardType: 'lucky_coins',
        message: `首充奖励领取成功！获得${rewardResult.rewardAmount}幸运币奖励`
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('领取首充奖励失败', error, {
      requestId,
      userId: user.userId,
      error: error.message
    });

    return NextResponse.json(;
      {
        success: false,
        error: {
          code: 'CLAIM_FAILED',
          message: '领取首充奖励失败',
          details: error.message
        }
      },
      
    );
  }
});