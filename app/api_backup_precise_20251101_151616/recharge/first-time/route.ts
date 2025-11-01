/**
 * 首充奖励系统API
 * 
 * 提供首充奖励查询和领取功能
 * 支持4档奖励：10/20/50/100 Som
 * 奖励比例：20%/25%/30%/35%
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { withAuth } from '@/lib/auth';
import { getLogger } from '@/lib/logger';
import { validationEngine } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';

// 首充奖励配置
const FIRST_RECHARGE_REWARDS = {
  10: { reward: 2, rate: 0.20 },    // 充值10 Som → 奖励2 Som (20%)
  20: { reward: 5, rate: 0.25 },    // 充值20 Som → 奖励5 Som (25%)
  50: { reward: 15, rate: 0.30 },   // 充值50 Som → 奖励15 Som (30%)
  100: { reward: 35, rate: 0.35 },  // 充值100 Som → 奖励35 Som (35%)
} as const;

type RechargeAmount = keyof typeof FIRST_RECHARGE_REWARDS;

/**
 * 检查用户是否满足首充奖励条件
 */
async function checkFirstRechargeEligibility(userId: string): Promise<{
  isEligible: boolean;
  hasFirstRecharge: boolean;
  error?: string;
}> {
  try {
    // 检查用户是否已有充值记录
    const existingRecharge = await prisma.orders.findFirst({
      where: {
        userId,
        type: 'recharge',
        paymentStatus: 'paid',
        fulfillmentStatus: 'completed'
      }
    });

    return {
      isEligible: !existingRecharge,
      hasFirstRecharge: !!existingRecharge
    };
  } catch (error) {
    console.error('检查首充资格失败:', error);
    return {
      isEligible: false,
      hasFirstRecharge: false,
      error: '检查首充资格失败'
    };
  }
}

/**
 * 获取用户的首充奖励状态
 */
async function getFirstRechargeStatus(userId: string) {
  try {
    // 检查用户是否满足首充条件
    const eligibility = await checkFirstRechargeEligibility(userId);
    
    if (!eligibility.isEligible) {
      return {
        hasFirstRecharge: true,
        isEligible: false,
        availableRewards: [],
        message: eligibility.hasFirstRecharge ? '您已完成首充' : '无法验证首充资格'
      };
    }

    // 获取所有可用的首充奖励档位
    const availableRewards = Object.entries(FIRST_RECHARGE_REWARDS).map(([amount, config]) => ({
      amount: Number(amount),
      reward: config.reward,
      rate: config.rate,
      type: 'bonus_coins' as const,
      description: `首充${amount} Som奖励${config.reward} Som（${Math.round(config.rate * 100)}%）`,
      isActive: true
    }));

    return {
      hasFirstRecharge: false,
      isEligible: true,
      availableRewards,
      message: '首次充值可享受奖励！'
    };
  } catch (error) {
    console.error('获取首充状态失败:', error);
    return {
      hasFirstRecharge: false,
      isEligible: false,
      availableRewards: [],
      error: '获取首充状态失败'
    };
  }
}

/**
 * 发放首充奖励
 */
async function grantFirstRechargeReward(
  userId: string, 
  rechargeAmount: number,
  orderId: string
): Promise<{ success: boolean; error?: string; rewardAmount?: number }> {
  const logger = getLogger();
  const requestId = `first_recharge_reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    logger.info('开始发放首充奖励', {
      requestId,
      userId,
      rechargeAmount,
      orderId
    });

    // 检查奖励配置是否存在
    const rewardConfig = FIRST_RECHARGE_REWARDS[rechargeAmount as RechargeAmount];
    if (!rewardConfig) {
      return { 
        success: false, 
        error: `未找到充值金额${rechargeAmount}的奖励配置` 
      };
    }

    // 使用数据库事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 1. 检查用户是否已领取过该档位奖励
      const existingReward = await tx.firstRechargeRewards.findUnique({
        where: {
          userId_rechargeAmount: {
            userId,
            rechargeAmount
          }
        }
      });

      if (existingReward) {
        throw new Error('该档位奖励已领取');
      }

      // 2. 创建奖励记录
      const rewardRecord = await tx.firstRechargeRewards.create({
        data: {
          userId,
          rechargeAmount,
          rewardType: 'bonus_coins',
          rewardAmount: rewardConfig.reward,
          status: 'claimed',
          claimedAt: new Date()
        }
      });

      // 3. 使用安全的钱包更新函数增加用户余额
      const balanceUpdateResult = await tx.$executeRaw`
        SELECT * FROM update_user_balance_with_optimistic_lock(
          ${userId}::uuid,
          ${rewardConfig.reward}::decimal,
          'add',
          'balance'
        )
      `;

      if (!balanceUpdateResult?.[0]?.success) {
        throw new Error(balanceUpdateResult?.[0]?.error_message || '余额更新失败');
      }

      // 4. 记录钱包交易
      await tx.walletTransactions.create({
        data: {
          userId,
          type: 'first_recharge_reward',
          amount: rewardConfig.reward,
          currency: 'TJS',
          description: `首充奖励：充值${rechargeAmount} Som获得${rewardConfig.reward} Som奖励`,
          status: 'completed',
          metadata: {
            orderId,
            rechargeAmount,
            rewardRate: rewardConfig.rate,
            rewardId: rewardRecord.id
          }
        }
      });

      // 5. 创建通知
      await tx.notifications.create({
        data: {
          userId,
          type: 'first_recharge_reward',
          content: `恭喜！首充奖励已到账：+${rewardConfig.reward} Som`,
          status: 'pending'
        }
      });

      logger.info('首充奖励发放成功', {
        requestId,
        userId,
        rechargeAmount,
        rewardAmount: rewardConfig.reward,
        rewardId: rewardRecord.id
      });

      return {
        success: true,
        rewardAmount: rewardConfig.reward,
        newBalance: balanceUpdateResult[0].new_balance
      };
    });

    return result;
  } catch (error: any) {
    logger.error('发放首充奖励失败', error, {
      requestId,
      userId,
      rechargeAmount,
      orderId,
      error: error.message
    });

    return {
      success: false,
      error: error.message || '发放奖励失败'
    };
  }
}

/**
 * GET /api/recharge/first-time
 * 
 * 查询首充奖励状态和可用奖励
 */
export const GET = withAuth(async (request: NextRequest, user: any) => {
  const logger = getLogger();
  const requestId = `first_recharge_status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    logger.info('查询首充奖励状态', {
      requestId,
      userId: user.userId
    });

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
      userId: user.userId,
      error: error.message
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATUS_QUERY_FAILED',
          message: '查询首充奖励状态失败',
          details: error.message
        }
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/recharge/first-time/claim
 * 
 * 领取首充奖励
 * 请求体: { orderId: string, rechargeAmount: number }
 */
export const POST = withAuth(async (request: NextRequest, user: any) => {
  const logger = getLogger();
  const requestId = `claim_first_recharge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    logger.info('领取首充奖励请求', {
      requestId,
      userId: user.userId
    });

    const body = await request.json();
    const { orderId, rechargeAmount } = body;

    // 参数验证
    if (!orderId || !rechargeAmount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: '缺少必要参数：orderId和rechargeAmount都是必需的'
          }
        },
        { status: 400 }
      );
    }

    // 验证充值金额是否为支持的档位
    const validAmounts = Object.keys(FIRST_RECHARGE_REWARDS).map(Number);
    if (!validAmounts.includes(rechargeAmount)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: `不支持的充值金额。支持的首充档位：${validAmounts.join(', ')} Som`
          }
        },
        { status: 400 }
      );
    }

    // 检查订单是否存在且属于当前用户
    const order = await prisma.orders.findFirst({
      where: {
        id: orderId,
        userId: user.userId,
        type: 'recharge',
        paymentStatus: 'paid'
      }
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: '订单不存在或未完成支付'
          }
        },
        { status: 404 }
      );
    }

    // 验证订单金额与请求金额一致
    const orderAmount = Number(order.totalAmount);
    if (orderAmount !== rechargeAmount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AMOUNT_MISMATCH',
            message: `订单金额(${orderAmount} Som)与请求金额(${rechargeAmount} Som)不一致`
          }
        },
        { status: 400 }
      );
    }

    // 检查用户是否满足首充条件
    const eligibility = await checkFirstRechargeEligibility(user.userId);
    if (!eligibility.isEligible) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_ELIGIBLE',
            message: '您不符合首充奖励条件'
          }
        },
        { status: 403 }
      );
    }

    // 发放奖励
    const rewardResult = await grantFirstRechargeReward(
      user.userId, 
      rechargeAmount, 
      orderId
    );

    if (!rewardResult.success) {
      return NextResponse.json(
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
      rechargeAmount,
      rewardAmount: rewardResult.rewardAmount
    });

    return NextResponse.json({
      success: true,
      data: {
        claimed: true,
        rewardAmount: rewardResult.rewardAmount,
        message: `首充奖励领取成功！获得${rewardResult.rewardAmount} Som奖励`
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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CLAIM_FAILED',
          message: '领取首充奖励失败',
          details: error.message
        }
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/recharge/first-time/history
 * 
 * 查询首充奖励历史记录
 */
export const GET_REWARD_HISTORY = withAuth(async (request: NextRequest, user: any) => {
  const logger = getLogger();
  const requestId = `first_recharge_history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    logger.info('查询首充奖励历史', {
      requestId,
      userId: user.userId
    });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const [rewards, total] = await Promise.all([
      prisma.firstRechargeRewards.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.firstRechargeRewards.count({
        where: { userId: user.userId }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        rewards,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('查询首充奖励历史失败', error, {
      requestId,
      userId: user.userId,
      error: error.message
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'HISTORY_QUERY_FAILED',
          message: '查询首充奖励历史失败',
          details: error.message
        }
      },
      { status: 500 }
    );
  }
});