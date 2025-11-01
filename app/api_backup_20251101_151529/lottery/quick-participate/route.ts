import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLogger } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { withRateLimit, lotteryRateLimit } from '@/lib/rate-limit-middleware';
import { triggerImmediateDraw } from '@/lib/lottery';

const handleQuickParticipate = async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `lottery_quick_participate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  let decoded: { userId: string } | null = null;

  try {
    logger.info('快速参与抽奖请求开始', {
      requestId,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // 验证用户身份
    const user = getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    decoded = { userId: user.userId };

    // 验证请求体
    const body = await request.json();
    const { roundId, quantity, mode = 'smart' } = body;

    // 参数验证
    if (!roundId || !quantity) {
      return NextResponse.json(
        { error: '参数不完整：roundId和quantity都是必需的' }, 
        { status: 400 }
      );
    }

    // 验证数量范围
    if (typeof quantity !== 'number' || quantity < 1 || quantity > 100) {
      return NextResponse.json(
        { error: '数量必须在1-100之间' }, 
        { status: 400 }
      );
    }

    // 开始数据库事务
    const result = await prisma.$transaction(async (tx) => {
      // 1. 验证夺宝期次
      const round = await tx.lotteryRounds.findUnique({
        where: { id: roundId },
        select: {
          id: true,
          status: true,
          totalShares: true,
          soldShares: true,
          pricePerShare: true,
          drawTime: true,
          productId: true
        }
      });

      if (!round) {
        throw new Error('夺宝期次不存在');
      }

      // 验证期次状态
      if (round.status !== 'active') {
        throw new Error('夺宝期次未激活');
      }

      // 验证期次是否已结束
      if (round.drawTime && new Date() > new Date(round.drawTime)) {
        throw new Error('夺宝期次已结束');
      }

      // 验证剩余份额
      const availableShares = round.totalShares - round.soldShares;
      if (quantity > availableShares) {
        throw new Error(`剩余份额不足，仅剩${availableShares}份`);
      }

      // 2. 验证用户幸运币余额和历史参与情况
      const user = await tx.users.findUnique({
        where: { id: decoded!.userId },
        select: { 
          luckyCoins: true,
          luckyCoinsVersion: true 
        }
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      let totalCost = round.pricePerShare * quantity;
      
      // 智能模式：预留30%余额
      if (mode === 'smart') {
        const maxAffordable = Math.floor((user.luckyCoins * 0.7) / round.pricePerShare);
        if (quantity > maxAffordable) {
          throw new Error(`智能模式下最多可购买 ${maxAffordable} 份，建议保留30%余额`);
        }
      }

      if (Number(user.luckyCoins) < Number(totalCost)) {
        throw new Error('幸运币余额不足');
      }

      // 3. 获取用户当前参与信息
      const currentParticipation = await tx.participations.findMany({
        where: {
          userId: decoded!.userId,
          roundId: round.id,
          isWinner: false
        },
        select: {
          sharesCount: true,
          numbers: true
        }
      });

      const currentSharesCount = currentParticipation.reduce((sum: any,  p: any) => sum + p.sharesCount, 0);

      // 4. 创建新的参与记录
      const participation = await tx.participations.create({
        data: {
          roundId: round.id,
          userId: decoded!.userId,
          productId: round.productId,
          numbers: Array.from({ length: quantity }, () => Math.floor(Math.random() * 100) + 1),
          sharesCount: quantity,
          type: 'lottery',
          cost: totalCost
        }
      });

      // 5. 使用乐观锁更新用户幸运币余额，防止并发冲突
      const updatedUser = await tx.users.updateMany({
        where: {
          id: decoded!.userId,
          luckyCoinsVersion: user.luckyCoinsVersion
        },
        data: {
          luckyCoins: { decrement: totalCost },
          totalSpent: { increment: totalCost },
          luckyCoinsVersion: { increment: 1 }
        }
      });

      if (updatedUser.count === 0) {
        throw new Error('用户余额更新失败，可能是并发操作，请重试');
      }

      // 6. 更新期次已售份额
      await tx.lotteryRounds.update({
        where: { id: round.id },
        data: {
          soldShares: { increment: quantity }
        }
      });

      // 7. 记录交易
      await tx.transactions.create({
        data: {
          userId: decoded!.userId,
          type: 'lottery_participation',
          amount: -totalCost,
          balanceType: 'lucky_coins',
          relatedOrderId: participation.id,
          description: `抽奖快速参与 - 第${round.id}期 ${quantity}份`
        }
      });

      // 8. 创建通知
      await tx.notifications.create({
        data: {
          userId: decoded!.userId,
          type: 'lottery_participation',
          content: `快速参与成功！您购买了第${round.id}期 ${quantity}份幸运币，当前共参与 ${currentSharesCount + quantity} 份`,
          status: 'pending'
        }
      });

      return {
        participationId: participation.id,
        roundId: round.id,
        quantity: quantity,
        totalCost: totalCost,
        remainingShares: availableShares - quantity,
        currentTotalShares: currentSharesCount + quantity,
        winProbability: ((currentSharesCount + quantity) / round.totalShares) * 100
      };
    });

    // 检查是否触达开奖条件（异步调用）
    triggerImmediateDraw(roundId).catch((error) => {
      logger.error('异步开奖触发失败', error, {
        requestId,
        roundId,
        userId: decoded?.userId
      });
    });

    logger.info('快速参与成功', {
      requestId,
      userId: decoded!.userId,
      roundId,
      quantity,
      mode,
      totalCost: result.totalCost,
      executionTime: Date.now() - startTime
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: '快速参与成功！'
    });

  } catch (error: any) {
    logger.error('快速参与失败', error, {
      requestId,
      userId: decoded?.userId,
      roundId: body?.roundId,
      quantity: body?.quantity,
      mode: body?.mode,
      error: error.message,
      executionTime: Date.now() - startTime
    });

    // 根据错误类型返回不同状态码
    let statusCode = 500;
    let errorMessage = '快速参与失败';

    if (error.message.includes('幸运币余额不足')) {
      statusCode = 400;
      errorMessage = '幸运币余额不足';
    } else if (error.message.includes('夺宝期次不存在')) {
      statusCode = 404;
      errorMessage = '抽奖期次不存在';
    } else if (error.message.includes('份额不足')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('未授权')) {
      statusCode = 401;
      errorMessage = '未授权访问';
    } else if (error.message.includes('智能模式下最多可购买')) {
      statusCode = 400;
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
};

// 应用速率限制并导出处理函数
const processRequest = withRateLimit(handleQuickParticipate, lotteryRateLimit({
  onLimitExceeded: async (result, request) => {
    const logger = getLogger();
    logger.warn('快速参与接口速率限制触发', {
      identifier: 'unknown',
      endpoint: '/api/lottery/quick-participate',
      limit: result.totalHits + result.remaining,
      remaining: result.remaining,
      resetTime: result.resetTime
    });

    return NextResponse.json(
      {
        success: false,
        error: '参与抽奖过于频繁，请稍后再试',
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