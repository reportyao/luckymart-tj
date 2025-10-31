import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { triggerImmediateDraw } from '@/lib/lottery';
import { getLogger } from '@/lib/logger';
import { withRateLimit, lotteryRateLimit } from '@/lib/rate-limit-middleware';
import { rateLimitMonitor } from '@/lib/rate-limit-monitor';

// 应用速率限制的抽奖参与处理函数
const handleLotteryParticipateRequest = async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `lottery_participate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  (request as any).startTime = Date.now();

  try {
    // 验证JWT Token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    logger.info('夺宝参与请求开始', {
      requestId,
      userId: decoded.userId,
      tokenPrefix: `${token.substring(0, 10)  }...`
    });

    const body = await request.json();
    const { roundId, sharesCount, useType = 'paid' } = body;

    if (!roundId || !sharesCount || sharesCount < 1) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    // 查找用户
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 查找夺宝期次
    const round = await prisma.lotteryRounds.findUnique({
      where: { id: roundId }
    });

    if (!round || round.status !== 'ongoing') {
      return NextResponse.json({ error: '夺宝期次不存在或已结束' }, { status: 404 });
    }

    // 检查份额是否充足
    const availableShares = round.totalShares - round.soldShares;
    if (sharesCount > availableShares) {
      return NextResponse.json({ 
        error: '份额不足', 
        available: availableShares 
      }, { status: 400 });
    }

    // 检查余额
    const cost = sharesCount * 1; // 每份1夺宝币
    if (useType === 'paid') {
      if (parseFloat(user.balance.toString()) < cost) {
        return NextResponse.json({ 
          error: '夺宝币不足', 
          required: cost,
          current: parseFloat(user.balance.toString())
        }, { status: 400 });
      }
    } else {
      // 免费参与检查
      if (user.freeDailyCount <= 0) {
        return NextResponse.json({ error: '今日免费次数已用完' }, { status: 400 });
      }
      if (sharesCount > 3) {
        return NextResponse.json({ error: '免费参与最多3份' }, { status: 400 });
      }
    }

    // 生成夺宝号码
    const startNumber = round.soldShares + 10000001;
    const numbers = Array.from({ length: sharesCount }, (_, i) => startNumber + i);

    // 检查是否售罄，用于触发立即开奖
    const willBeSoldOut = round.soldShares + sharesCount >= round.totalShares;

    // 执行事务
    const result = await prisma.$transaction(async (tx) => {
      // 使用原子性更新防止超售
      const updatedRound = await tx.lotteryRounds.updateMany({
        where: {
          id: roundId,
          status: 'ongoing', // 确保期次仍在进行中
          soldShares: { lt: round.totalShares } // 确保更新前未满期
        },
        data: {
          soldShares: { increment: sharesCount },
          participants: { increment: 1 },
          status: willBeSoldOut ? 'full' : 'ongoing'
        }
      });

      if (updatedRound.count === 0) {
        throw new Error('期次已结束或售罄，请选择其他期次');
      }

      // 创建参与记录
      const participation = await tx.participations.create({
        data: {
          userId: user.id,
          roundId: round.id,
          productId: round.productId,
          numbers,
          sharesCount,
          type: useType,
          cost: useType === 'paid' ? cost : 0,
          isWinner: false
        }
      });

      // 扣除用户余额或免费次数
      if (useType === 'paid') {
        await tx.users.update({
          where: { id: user.id },
          data: {
            balance: { decrement: cost },
            totalSpent: { increment: cost }
          }
        });

        // 记录交易
        await tx.transactions.create({
          data: {
            userId: user.id,
            type: 'lottery_participation',
            amount: cost,
            balanceType: 'lottery_coin',
            description: `参与夺宝 - ${sharesCount}份`
          }
        });
      } else {
        await tx.users.update({
          where: { id: user.id },
          data: {
            freeDailyCount: { decrement: 1 }
          }
        });
      }

      // 获取更新后的期次信息
      const finalRound = await tx.lotteryRounds.findUnique({
        where: { id: roundId }
      });

      return { participation, finalRound, user };
    });

    // 触发邀请奖励（独立事务，不影响夺宝逻辑）
    try {
      logger.info('开始检查用户首次参与夺宝触发奖励', {
        requestId,
        userId: decoded.userId,
        participationId: result.participation.id
      });

      // 检查用户是否首次参与夺宝
      const userForRewardCheck = await prisma.users.findUnique({
        where: { id: decoded.userId },
        select: { has_first_lottery: true }
      });

      if (!userForRewardCheck?.has_first_lottery) {
        logger.info('用户首次参与夺宝，触发邀请奖励', {
          requestId,
          userId: decoded.userId,
          participationId: result.participation.id
        });

        // 调用触发邀请奖励API
        try {
          const rewardResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/referral/trigger-reward`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: decoded.userId,
              event_type: 'first_lottery',
              event_data: {
                participation_id: result.participation.id,
                round_id: roundId,
                shares_count: sharesCount,
                cost: cost,
                use_type: useType
              }
            })
          });

          if (rewardResponse.ok) {
            const rewardData = await rewardResponse.json();
            logger.info('邀请奖励触发成功', {
              requestId,
              userId: decoded.userId,
              rewardData
            });
          } else {
            const errorData = await rewardResponse.text();
            logger.warn('邀请奖励触发失败', {
              requestId,
              userId: decoded.userId,
              status: rewardResponse.status,
              error: errorData
            });
          }
        } catch (rewardError) {
          logger.error('触发邀请奖励时发生错误', rewardError, {
            requestId,
            userId: decoded.userId
          });
        }
      }
    } catch (rewardCheckError) {
      logger.error('检查用户首次参与状态时发生错误', rewardCheckError, {
        requestId,
        userId: decoded.userId
      });
    }

    // 如果期次已满，触发立即开奖
    if (willBeSoldOut) {
      try {
        logger.info(`期次 ${roundId} 已售罄，触发立即开奖`, { requestId, roundId });
        
        // 异步执行开奖，不阻塞用户响应
        triggerImmediateDraw(roundId).catch(error => {
          logger.error('开奖失败', error, { requestId, roundId });
        });

        return NextResponse.json({
          success: true,
          data: {
            participationId: result.participation.id,
            numbers: result.participation.numbers,
            sharesCount: result.participation.sharesCount,
            roundStatus: 'full', // 立即返回full状态
            soldShares: result.finalRound.soldShares,
            totalShares: result.finalRound.totalShares,
            immediateDraw: true, // 标记已触发立即开奖
            message: '参与成功！期次已售罄，正在开奖中...'
          },
          message: '参与成功！期次已售罄，正在开奖中...'
        });
      } catch (error) {
        logger.error('立即开奖失败', error, { requestId, roundId });
        // 即使开奖失败，也返回购买成功的结果
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        participationId: result.participation.id,
        numbers: result.participation.numbers,
        sharesCount: result.participation.sharesCount,
        roundStatus: result.finalRound.status,
        soldShares: result.finalRound.soldShares,
        totalShares: result.finalRound.totalShares
      },
      message: '参与成功！祝您好运！'
    });

  } catch (error: any) {
    const logger = getLogger();
    logger.error('夺宝参与失败', error, {
      requestId,
      userId: decoded?.userId,
      error: error.message,
      stack: error.stack
    });
    
    // 记录速率限制监控数据
    rateLimitMonitor.recordMetric({
      timestamp: Date.now(),
      endpoint: '/api/lottery/participate',
      identifier: decoded?.userId || 'anonymous',
      hits: 1,
      blocked: false,
      strategy: 'leaky_bucket',
      windowMs: 60 * 1000,
      limit: 10,
      remaining: 0,
      resetTime: Date.now() + 60 * 1000,
      responseTime: Date.now() - (request as any).startTime
    });
    
    return NextResponse.json(
      { error: '参与失败', message: error.message },
      { status: 500 }
    );
  }
};

// 应用速率限制并导出处理函数
const processRequest = withRateLimit(handleLotteryParticipateRequest, lotteryRateLimit({
  onLimitExceeded: async (result, request) => {
    return NextResponse.json(
      {
        success: false,
        error: '参与操作过于频繁，请稍后再试',
        rateLimit: {
          limit: result.totalHits + result.remaining,
          remaining: result.remaining,
          resetTime: new Date(result.resetTime).toISOString()
        }
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': (result.totalHits + result.remaining).toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString()
        }
      }
    );
  }
}));

// 导出主处理函数
export { processRequest as POST };
    logger.error('夺宝参与失败', error, {
      requestId,
      userId: decoded?.userId,
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { error: '参与失败', message: error.message },
      { status: 500 }
    );
  }
}
