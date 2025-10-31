import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwt } from 'jsonwebtoken';
import { userService } from '@/lib/user-service';
import { CacheConsistencyManager } from '@/lib/cache-consistency';
import { TajikistanTimeUtils } from '@/lib/timezone-utils';
import { cacheKeyBuilder } from '@/lib/redis-cache';
import { cacheManager } from '@/lib/cache-manager';
import { triggerImmediateDraw } from '@/lib/lottery';
import { getLogger } from '@/lib/logger';
import { API_BASE_URL } from '@/config/api-config';

const logger = getLogger();

export async function POST(request: NextRequest) {
  const requestId = `lottery_participate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
      tokenPrefix: `${token.substring(0, 10)}...`
    });

    const body = await request.json();
    const { roundId, sharesCount, useType = 'paid' } = body;

    if (!roundId || !sharesCount || sharesCount < 1) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    // 使用缓存一致性管理器处理夺宝参与
    const result = await CacheConsistencyManager.transactionalUpdate(
      async () => {
        // 数据库操作逻辑
        return await prisma.$transaction(async (tx) => {
          // 1. 获取用户信息
          const user = await tx.users.findUnique({
            where: { id: decoded.userId },
            select: {
              id: true,
              balance: true,
              freeDailyCount: true,
              lastFreeResetDate: true,
              balanceVersion: true
            }
          });

          if (!user) {
            throw new Error('用户不存在');
          }

          // 2. 检查免费次数重置
          const tajikistanNow = TajikistanTimeUtils.getCurrentTime();
          const isNewDay = TajikistanTimeUtils.getCurrentDateString() !== 
            user.lastFreeResetDate.toISOString().split('T')[0];
          
          let currentFreeCount = user.freeDailyCount;
          if (isNewDay) {
            currentFreeCount = 3;
          }

          // 3. 获取期次信息
          const round = await tx.lotteryRounds.findUnique({
            where: { id: roundId },
            select: {
              id: true,
              totalShares: true,
              soldShares: true,
              status: true,
              productId: true
            }
          });

          if (!round || round.status !== 'ongoing') {
            throw new Error('夺宝期次不存在或已结束');
          }

          // 4. 检查份额是否充足
          const availableShares = round.totalShares - round.soldShares;
          if (sharesCount > availableShares) {
            throw new Error(`份额不足，剩余 ${availableShares} 份`);
          }

          // 5. 业务验证
          const cost = sharesCount * 1;
          
          if (useType === 'paid') {
            // 付费参与检查余额
            if (parseFloat(user.balance.toString()) < cost) {
              throw new Error('夺宝币不足');
            }
          } else {
            // 免费参与检查
            if (currentFreeCount <= 0) {
              throw new Error('今日免费次数已用完');
            }
            if (sharesCount > Math.min(3, currentFreeCount)) {
              throw new Error(`免费参与最多${Math.min(3, currentFreeCount)}份`);
            }
          }

          // 6. 生成夺宝号码
          const startNumber = round.soldShares + 10000001;
          const numbers = Array.from({ length: sharesCount }, (_, i) => startNumber + i);

          // 7. 检查是否售罄，用于触发立即开奖
          const willBeSoldOut = round.soldShares + sharesCount >= round.totalShares;

          // 8. 执行原子性更新
          // 更新期次
          const updatedRound = await tx.lotteryRounds.updateMany({
            where: {
              id: roundId,
              status: 'ongoing',
              soldShares: { lt: round.totalShares }
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

          // 9. 创建参与记录
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

          // 10. 更新用户余额或免费次数
          if (useType === 'paid') {
            await tx.users.update({
              where: { id: user.id },
              data: {
                balance: { decrement: cost },
                totalSpent: { increment: cost },
                balanceVersion: { increment: 1 }
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
                freeDailyCount: { decrement: 1 },
                lastFreeResetDate: isNewDay ? tajikistanNow : user.lastFreeResetDate
              }
            });

            // 记录免费参与交易
            await tx.transactions.create({
              data: {
                userId: user.id,
                type: 'free_lottery_participation',
                amount: 0,
                balanceType: 'free',
                description: `免费参与夺宝 - ${sharesCount}份`
              }
            });
          }

          // 获取最终期次信息
          const finalRound = await tx.lotteryRounds.findUnique({
            where: { id: roundId }
          });

          // 获取更新后的用户信息
          const finalUser = await tx.users.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              balance: true,
              freeDailyCount: true,
              totalSpent: true,
              balanceVersion: true
            }
          });

          return {
            participation,
            finalRound,
            finalUser,
            willBeSoldOut,
            cost,
            newFreeCount: useType === 'free' ? finalUser?.freeDailyCount : undefined
          };
        });
      },
      // 要更新的缓存键
      [
        cacheKeyBuilder.user.profile(decoded.userId),
        cacheKeyBuilder.user.balance(decoded.userId),
        `lottery:round:${roundId}`,
        'lottery:rounds:list'
      ],
      // 新数据将在事务完成后更新
    );

    if (!result.success) {
      throw new Error(result.error || '夺宝参与失败');
    }

    const data = result.data!;

    // 11. 如果期次已满，触发立即开奖
    if (data.willBeSoldOut) {
      try {
        logger.info(`期次 ${roundId} 已售罄，触发立即开奖`, { requestId, roundId });
        
        // 异步执行开奖，不阻塞用户响应
        triggerImmediateDraw(roundId).catch(error => {
          logger.error('开奖失败', error, { requestId, roundId });
        });

        // 失效相关缓存
        await CacheConsistencyManager.invalidateCache([
          `lottery:round:${roundId}`,
          'lottery:rounds:list'
        ]);

        return NextResponse.json({
          success: true,
          data: {
            participationId: data.participation.id,
            numbers: data.participation.numbers,
            sharesCount: data.participation.sharesCount,
            roundStatus: 'full',
            soldShares: data.finalRound.soldShares,
            totalShares: data.finalRound.totalShares,
            newBalance: data.finalUser.balance,
            newFreeCount: data.newFreeCount,
            immediateDraw: true,
            cacheUpdated: result.cacheUpdated
          },
          message: '参与成功！期次已售罄，正在开奖中...'
        });
      } catch (error) {
        logger.error('立即开奖失败', error, { requestId, roundId });
      }
    }

    // 触发邀请奖励（独立事务，不影响夺宝逻辑）
    try {
      logger.info('开始检查用户首次参与夺宝触发奖励', {
        requestId,
        userId: decoded.userId,
        participationId: data.participation.id
      });

      // 检查用户是否首次参与夺宝
      const participationCount = await prisma.participations.count({
        where: {
          userId: decoded.userId,
          id: { not: data.participation.id }
        }
      });

      if (participationCount === 0) {
        logger.info('用户首次参与夺宝，触发邀请奖励', {
          requestId,
          userId: decoded.userId,
          participationId: data.participation.id
        });

        // 调用触发邀请奖励API
        try {
          const rewardResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || API_BASE_URL}/api/referral/trigger-reward`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: decoded.userId,
              event_type: 'first_lottery',
              event_data: {
                participation_id: data.participation.id,
                round_id: roundId,
                shares_count: sharesCount,
                cost: data.cost,
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

    logger.info('夺宝参与成功', {
      requestId,
      userId: decoded.userId,
      participationId: data.participation.id,
      cacheUpdated: result.cacheUpdated
    });

    return NextResponse.json({
      success: true,
      data: {
        participationId: data.participation.id,
        numbers: data.participation.numbers,
        sharesCount: data.participation.sharesCount,
        roundStatus: data.finalRound.status,
        soldShares: data.finalRound.soldShares,
        totalShares: data.finalRound.totalShares,
        newBalance: data.finalUser.balance,
        newFreeCount: data.newFreeCount,
        cost: data.cost,
        cacheUpdated: result.cacheUpdated
      },
      message: '参与成功！祝您好运！'
    });

  } catch (error: any) {
    logger.error('夺宝参与失败', {
      error: error.message,
      stack: error.stack,
      requestId,
      userId: decoded?.userId
    });
    
    // 根据错误类型返回不同状态码
    const statusCode = error.message.includes('份额不足') || 
                      error.message.includes('余额不足') ||
                      error.message.includes('免费次数已用完') ||
                      error.message.includes('期次已结束') ? 400 : 500;
    
    return NextResponse.json(
      { 
        error: '参与失败', 
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId
      },
      { status: statusCode }
    );
  }
}