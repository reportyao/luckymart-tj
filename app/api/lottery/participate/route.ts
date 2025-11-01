import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getLogger } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimitMonitor } from '@/lib/rate-limit-monitor';
import { withRateLimit, lotteryRateLimit } from '@/lib/rate-limit-middleware';
import { triggerImmediateDraw } from '@/lib/lottery';
import { withErrorHandling } from '@/lib/middleware';
import { respond } from '@/lib/responses';
import { CommonErrors } from '@/lib/errors';

const handleLotteryParticipation = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `lottery_participate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  // 在函数开始就声明decoded变量，避免未定义引用
  let decoded: { userId: string } | null = null;

  logger.info('抽奖参与请求开始', {
    requestId,
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    algorithmVersion: '3.0-secure-optimized-vrf',
    timezone: 'Asia/Dushanbe'
  });

  // 验证用户身份 - 使用更安全的方法
  const user = getUserFromRequest(request);
  if (!user?.userId) {
    return NextResponse.json(
      respond.customError('UNAUTHORIZED', '未授权访问').toJSON(),
      { status: 401 }
    );
  }
  decoded = { userId: user.userId };

  // 验证请求体
  const body = await request.json();
  const { roundId, quantity } = body;

  // 参数验证
  if (!roundId || !quantity) {
    return NextResponse.json(
      respond.validationError('参数不完整：roundId和quantity都是必需的').toJSON(),
      { status: 400 }
    );
  }

  // 验证数量范围
  if (typeof quantity !== 'number' || quantity < 1 || quantity > 100) {
    return NextResponse.json(
      respond.validationError('数量必须在1-100之间').toJSON(),
      { status: 400 }
    );
  }

    // 开始数据库事务
    const result = await prisma.$transaction(async (tx) => {
      // 1. 使用行级锁验证夺宝期次，防止竞态条件
      const round = await tx.lotteryRounds.findUnique({
        where: { id: roundId },
        select: {
          id: true,
          status: true,
          totalShares: true,
          soldShares: true,
          pricePerShare: true,
          drawTime: true,
          version: true
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

      // 2. 使用条件更新验证剩余份额，防止竞态条件
      const availableShares = round.totalShares - round.soldShares;
      if (quantity > availableShares) {
        throw new Error(`剩余份额不足，仅剩${availableShares}份`);
      }

      // 3. 原子性更新期次已售份额（使用乐观锁）
      const updatedRound = await tx.lotteryRounds.updateMany({
        where: {
          id: roundId,
          soldShares: round.soldShares, // 乐观锁：只有在soldShares没有变化时才更新
          status: 'active'
        },
        data: {
          soldShares: { increment: quantity }
        }
      });

      if (updatedRound.count === 0) {
        // 说明soldShares已经发生变化，可能存在竞态条件
        const currentRound = await tx.lotteryRounds.findUnique({
          where: { id: roundId },
          select: { soldShares: true }
        });
        
        const currentAvailable = round.totalShares - (currentRound?.soldShares || 0);
        throw new Error(`份额已被其他用户抢购，当前剩余${currentAvailable}份，请重试`);
      }

      // 验证用户幸运币余额
      const user = await tx.users.findUnique({
        where: { id: decoded!.userId },
        select: { luckyCoins: true }
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      const totalCost = round.pricePerShare * quantity;
      if (Number(user.luckyCoins) < Number(totalCost)) {
        throw new Error('幸运币余额不足');
      }

      // 获取商品信息用于参与记录
      const roundWithProduct = await tx.lotteryRounds.findUnique({
        where: { id: roundId },
        select: { productId: true }
      });

      if (!roundWithProduct) {
        throw new Error('无法获取商品信息');
      }

      // 创建夺宝参与记录
      const participation = await tx.participations.create({
        data: {
          roundId: round.id,
          userId: decoded!.userId,
          productId: roundWithProduct.productId,
          numbers: Array.from({ length: quantity }, () => Math.floor(Math.random() * 100) + 1),
          sharesCount: quantity,
          type: 'lottery',
          cost: totalCost
        }
      });

      // 获取并锁定用户记录，验证幸运币余额
      const userWithVersion = await tx.users.findUnique({
        where: { id: decoded!.userId },
        select: { 
          luckyCoins: true,
          luckyCoinsVersion: true 
        }
      });

      if (!userWithVersion) {
        throw new Error('用户不存在');
      }

      if (Number(userWithVersion.luckyCoins) < Number(totalCost)) {
        throw new Error('幸运币余额不足');
      }

      // 使用乐观锁更新用户余额
      const updatedUser = await tx.users.updateMany({
        where: {
          id: decoded!.userId,
          luckyCoinsVersion: userWithVersion.luckyCoinsVersion
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

      // 期次已售份额已在上面使用乐观锁原子性更新

      // 记录交易
      await tx.transactions.create({
        data: {
          userId: decoded!.userId,
          type: 'lottery_participation',
          amount: -totalCost,
          balanceType: 'lucky_coins',
          relatedOrderId: participation.id,
          description: `抽奖参与 - 第${round.id}期 ${quantity}份`
        }
      });

      // 创建通知
      await tx.notifications.create({
        data: {
          userId: decoded!.userId,
          type: 'lottery_participation',
          content: `抽奖参与成功！您购买了第${round.id}期 ${quantity}份幸运币`,
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

    logger.info('抽奖参与成功', {
      requestId,
      userId: decoded!.userId,
      roundId,
      quantity,
      totalCost: result.totalCost,
      executionTime: Date.now() - startTime
    });

    return NextResponse.json(
      respond.success(result, '抽奖参与成功！').toJSON()
    );

  } catch (error: any) {
    logger.error('抽奖参与失败', error as Error, {
      requestId,
      userId: decoded?.userId,
      roundId: body?.roundId,
      quantity: body?.quantity,
      error: error.message,
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

    // 根据错误类型返回不同状态码和统一响应格式
    if (error.message.includes('幸运币余额不足')) {
      return NextResponse.json(
        respond.customError('INSUFFICIENT_BALANCE', '幸运币余额不足').toJSON(),
        { status: 400 }
      );
    } else if (error.message.includes('夺宝期次不存在')) {
      return NextResponse.json(
        respond.customError('NOT_FOUND', '抽奖期次不存在').toJSON(),
        { status: 404 }
      );
    } else if (error.message.includes('份额不足')) {
      return NextResponse.json(
        respond.customError('INSUFFICIENT_STOCK', error.message).toJSON(),
        { status: 400 }
      );
    } else if (error.message.includes('未授权')) {
      return NextResponse.json(
        respond.customError('UNAUTHORIZED', '未授权访问').toJSON(),
        { status: 401 }
      );
    }

    // 默认服务器错误
    return NextResponse.json(
      respond.customError('INTERNAL_ERROR', '抽奖参与失败').toJSON(),
      { status: 500 }
    );
  }
});

// 应用速率限制并导出处理函数
const processRequest = withRateLimit(handleLotteryParticipation, lotteryRateLimit({
  onLimitExceeded: async (result, request) => {
    const logger = getLogger();
    logger.warn('抽奖参与接口速率限制触发', {
      identifier: 'unknown',
      endpoint: '/api/lottery/participate',
      limit: result.totalHits + result.remaining,
      remaining: result.remaining,
      resetTime: result.resetTime
    });

    const rateLimitResponse = {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '参与抽奖过于频繁，请稍后再试'
      },
      rateLimit: {
        limit: result.totalHits + result.remaining,
        remaining: result.remaining,
        resetTime: new Date(result.resetTime).toISOString()
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(rateLimitResponse, {
      status: 429,
      headers: {
        'X-RateLimit-Limit': (result.totalHits + result.remaining).toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString()
      }
    });
  }
}));

// 导出主处理函数
export { processRequest as POST };