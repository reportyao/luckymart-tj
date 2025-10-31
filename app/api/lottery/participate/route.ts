import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getLogger } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimitMonitor } from '@/lib/rate-limit-monitor';
import { withRateLimit, lotteryRateLimit } from '@/lib/rate-limit-middleware';
import { triggerImmediateDraw } from '@/lib/lottery';

const handleLotteryParticipation = async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `lottery_participate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  // 在函数开始就声明decoded变量，避免未定义引用
  let decoded: { userId: string } | null = null;

  try {
    logger.info('夺宝参与请求开始', {
      requestId,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // 验证用户身份 - 使用更安全的方法
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
          maxShares: true,
          soldShares: true,
          pricePerShare: true,
          endTime: true
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
      if (round.endTime && new Date() > new Date(round.endTime)) {
        throw new Error('夺宝期次已结束');
      }

      // 验证剩余份额
      const availableShares = round.maxShares - round.soldShares;
      if (quantity > availableShares) {
        throw new Error(`剩余份额不足，仅剩${availableShares}份`);
      }

      // 验证用户余额
      const user = await tx.users.findUnique({
        where: { id: decoded!.userId },
        select: { balance: true }
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      const totalCost = round.pricePerShare * quantity;
      if (user.balance < totalCost) {
        throw new Error('余额不足');
      }

      // 创建夺宝参与记录
      const participation = await tx.lotteryParticipations.create({
        data: {
          roundId: round.id,
          userId: decoded!.userId,
          shares: quantity,
          costPerShare: round.pricePerShare,
          totalCost: totalCost,
          status: 'active'
        }
      });

      // 更新用户余额
      await tx.users.update({
        where: { id: decoded!.userId },
        data: {
          balance: { decrement: totalCost },
          totalSpent: { increment: totalCost },
          balanceVersion: { increment: 1 }
        }
      });

      // 更新期次已售份额
      await tx.lotteryRounds.update({
        where: { id: round.id },
        data: {
          soldShares: { increment: quantity }
        }
      });

      // 记录交易
      await tx.transactions.create({
        data: {
          userId: decoded!.userId,
          type: 'lottery_participation',
          amount: -totalCost,
          balanceType: 'lottery_coin',
          relatedOrderId: participation.id,
          description: `夺宝参与 - 第${round.id}期 ${quantity}份`
        }
      });

      // 创建通知
      await tx.notifications.create({
        data: {
          userId: decoded!.userId,
          type: 'lottery_participation',
          content: `夺宝参与成功！您购买了第${round.id}期 ${quantity}份夺宝币`,
          status: 'pending'
        }
      });

      return {
        participationId: participation.id,
        roundId: round.id,
        quantity: quantity,
        totalCost: totalCost,
        remainingShares: availableShares - quantity
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

    // 记录速率限制监控数据
    rateLimitMonitor.recordMetric({
      timestamp: Date.now(),
      endpoint: '/api/lottery/participate',
      identifier: decoded!.userId,
      hits: 1,
      blocked: false,
      strategy: 'sliding_window',
      windowMs: 5 * 60 * 1000,
      limit: 20,
      remaining: 0,
      resetTime: Date.now() + 5 * 60 * 1000,
      responseTime: Date.now() - startTime
    });

    logger.info('夺宝参与成功', {
      requestId,
      userId: decoded!.userId,
      roundId,
      quantity,
      totalCost: result.totalCost,
      executionTime: Date.now() - startTime
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: '夺宝参与成功！'
    });

  } catch (error: any) {
    logger.error('夺宝参与失败', error, {
      requestId,
      userId: decoded?.userId, // 现在decoded确保不会为undefined
      roundId: body?.roundId,
      quantity: body?.quantity,
      error: error.message,
      stack: error.stack,
      executionTime: Date.now() - startTime
    });

    // 记录速率限制监控数据
    rateLimitMonitor.recordMetric({
      timestamp: Date.now(),
      endpoint: '/api/lottery/participate',
      identifier: decoded?.userId || 'anonymous',
      hits: 1,
      blocked: false,
      strategy: 'sliding_window',
      windowMs: 5 * 60 * 1000,
      limit: 20,
      remaining: 0,
      resetTime: Date.now() + 5 * 60 * 1000,
      responseTime: Date.now() - startTime
    });

    // 根据错误类型返回不同状态码
    let statusCode = 500;
    let errorMessage = '夺宝参与失败';

    if (error.message.includes('余额不足')) {
      statusCode = 400;
      errorMessage = '余额不足';
    } else if (error.message.includes('夺宝期次不存在')) {
      statusCode = 404;
      errorMessage = '夺宝期次不存在';
    } else if (error.message.includes('份额不足')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('未授权')) {
      statusCode = 401;
      errorMessage = '未授权访问';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
};

// 应用速率限制并导出处理函数
const processRequest = withRateLimit(handleLotteryParticipation, lotteryRateLimit({
  onLimitExceeded: async (result, request) => {
    const logger = getLogger();
    logger.warn('夺宝参与接口速率限制触发', {
      identifier: 'unknown',
      endpoint: '/api/lottery/participate',
      limit: result.totalHits + result.remaining,
      remaining: result.remaining,
      resetTime: result.resetTime
    });

    return NextResponse.json(
      {
        success: false,
        error: '参与夺宝过于频繁，请稍后再试',
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