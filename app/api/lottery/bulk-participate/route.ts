import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLogger } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { withRateLimit, lotteryRateLimit } from '@/lib/rate-limit-middleware';
import { triggerImmediateDraw } from '@/lib/lottery';

const handleBulkParticipate = async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `lottery_bulk_participate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  let decoded: { userId: string } | null = null;

  try {
    logger.info('批量参与抽奖请求开始', {
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
    const { roundId, quantity } = body;

    // 参数验证
    if (!roundId || !quantity) {
      return NextResponse.json(;
        { error: '参数不完整：roundId和quantity都是必需的' }, 
        { status: 400 }
      );
    }

    // 验证数量范围（批量购买限制1-10份）
    if (typeof quantity !== 'number' || quantity < 1 || quantity > 10) {
      return NextResponse.json(;
        { error: '批量购买份数必须在1-10份之间' }, 
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

      // 2. 验证用户幸运币余额
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

      // 3. 计算批量折扣
      const getDiscount = (shares: number) => {
        if (shares >= 10) return 0.9; // 10份9折 {
        if (shares >= 5) return 0.95; // 5份9.5折 {
        return 1; // 无折扣;
      };

      const discount = getDiscount(quantity);
      const originalCost = round.pricePerShare * quantity;
      const totalCost = originalCost * discount;
      const discountAmount = originalCost - totalCost;

      if (Number(user.luckyCoins) < Number(totalCost)) {
        throw new Error('幸运币余额不足');
      }

      // 4. 获取用户当前参与信息
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

      const currentSharesCount = currentParticipation.reduce((sum: any: any,   p: any: any) => sum + p.sharesCount, 0);

      // 5. 创建参与记录
      const participation = await tx.participations.create({
        data: {
          roundId: round.id,
          userId: decoded!.userId,
          productId: round.productId,
          numbers: Array.from({ length: quantity }, () => Math.floor(Math.random() * 100) + 1),
          sharesCount: quantity,
          type: 'lottery',
          cost: totalCost,
          metadata: {
            discount: discount,
            originalCost: originalCost,
            discountAmount: discountAmount,
            purchaseType: 'bulk'
          }
        }
      });

      // 6. 使用乐观锁更新用户幸运币余额，防止并发冲突
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

      // 7. 更新期次已售份额
      await tx.lotteryRounds.update({
        where: { id: round.id },
        data: {
          soldShares: { increment: quantity }
        }
      });

      // 8. 记录交易（记录原价，扣除实际金额）
      await tx.transactions.create({
        data: {
          userId: decoded!.userId,
          type: 'lottery_participation',
          amount: -totalCost,
          balanceType: 'lucky_coins',
          relatedOrderId: participation.id,
          description: `抽奖批量购买 - 第${round.id}期 ${quantity}份，${Math.round((1 - discount) * 100)}%折扣`
        }
      });

      // 如果有折扣，额外记录折扣交易
      if (discountAmount > 0) {
        await tx.transactions.create({
          data: {
            userId: decoded!.userId,
            type: 'discount',
            amount: discountAmount,
            balanceType: 'lucky_coins',
            relatedOrderId: participation.id,
            description: `批量购买折扣 - 第${round.id}期 ${quantity}份`
          }
        });
      }

      // 9. 创建通知
      await tx.notifications.create({
        data: {
          userId: decoded!.userId,
          type: 'lottery_participation',
          content: `批量购买成功！您购买了第${round.id}期 ${quantity}份幸运币，获得${Math.round((1 - discount) * 100)}%折扣，节省${discountAmount}幸运币。当前共参与 ${currentSharesCount + quantity} 份`,
          status: 'pending'
        }
      });

      return {
        participationId: participation.id,
        roundId: round.id,
        quantity: quantity,
        totalCost: totalCost,
        originalCost: originalCost,
        discount: discount,
        discountAmount: discountAmount,
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

    logger.info('批量参与成功', {
      requestId,
      userId: decoded!.userId,
      roundId,
      quantity,
      totalCost: result.totalCost,
      discount: result.discount,
      discountAmount: result.discountAmount,
      executionTime: Date.now() - startTime
    });

    return NextResponse.json({
  }
      success: true,
      data: result,
      message: '批量购买成功！'
    });

  } catch (error: any) {
    logger.error('批量参与失败', error, {
      requestId,
      userId: decoded?.userId,
      roundId: body?.roundId,
      quantity: body?.quantity,
      error: error.message,
      executionTime: Date.now() - startTime
    });

    // 根据错误类型返回不同状态码
    let statusCode = 500;
    let errorMessage = '批量购买失败';

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
    }

    return NextResponse.json(;
      { error: errorMessage },
      { status: statusCode }
    );
  }
};

// 应用速率限制并导出处理函数
const processRequest = withRateLimit(handleBulkParticipate, lotteryRateLimit({
  onLimitExceeded: async (result, request) => {
    const logger = getLogger();
    logger.warn('批量参与接口速率限制触发', {
      identifier: 'unknown',
      endpoint: '/api/lottery/bulk-participate',
      limit: result.totalHits + result.remaining,
      remaining: result.remaining,
      resetTime: result.resetTime
    });

    return NextResponse.json(;
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
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': result.resetTime.toString()
        }
      }
    );
  }
}));

// 导出主处理函数
export { processRequest as POST };
}