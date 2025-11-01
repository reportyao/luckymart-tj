import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { TajikistanTimeUtils } from '@/lib/timezone-utils';
import { createTranslation } from '@/lib/createTranslation';
import { getLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // 验证JWT Token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const body = await request.json();
    const { roundId, sharesCount, useType = 'paid' } = body;

    if (!roundId || !sharesCount || sharesCount < 1) {
      const { t } = await createTranslation(request, 'api-errors');
      return NextResponse.json({ error: t('errors.invalidParameters') }, { status: 400 });
    }

    // 使用数据库事务确保原子性
    const result = await prisma.$transaction(async (tx) => {
      // 1. 查找并锁定用户记录
      const user = await tx.users.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true, balance: true, freeDailyCount: true, 
          lastFreeResetDate: true, free_count_version: true
        }
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 2. 检查免费次数是否需要重置（塔吉克斯坦时区）
      const tajikistanNow = TajikistanTimeUtils.getCurrentTime();
      const isNewDay = TajikistanTimeUtils.getCurrentDateString() !== 
        user.lastFreeResetDate.toISOString().split('T')[0];
      
      let currentFreeCount = user.freeDailyCount;
      let currentFreeCountVersion = user.free_count_version;

      if (isNewDay) {
        currentFreeCount = 3;
        currentFreeCountVersion += 1;
      }

      // 3. 查找并锁定夺宝期次
      const round = await tx.lotteryRounds.findUnique({
        where: { id: roundId },
        select: { 
          id: true, totalShares: true, soldShares: true, 
          status: true, productId: true 
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

      // 7. 执行原子性操作
      // 首先更新期次（使用数据库函数保证原子性）
      const roundUpdateResult = await tx.$queryRaw`
        SELECT atomic_update_lottery_round(${roundId}::uuid, ${sharesCount}, ${decoded.userId}::uuid) as result
      `;

      if (!roundUpdateResult[0]?.result?.success) {
        throw new Error(roundUpdateResult[0]?.result?.error || '期次更新失败');
      }

      // 8. 更新用户余额或免费次数
      if (useType === 'paid') {
        // 使用乐观锁更新余额
        await tx.users.update({
          where: { 
            id: decoded.userId,
            balance: { gte: cost } // 确保余额充足
          },
          data: {
            balance: { decrement: cost },
            totalSpent: { increment: cost },
            updatedAt: new Date()
          }
        });
      } else {
        // 使用原子函数更新免费次数
        const freeCountUpdateResult = await tx.$queryRaw`
          SELECT atomic_update_free_count(
            ${decoded.userId}::uuid, 
            ${currentFreeCount - 1}, 
            ${currentFreeCountVersion}
          ) as result
        `;

        if (!freeCountUpdateResult[0]?.result) {
          throw new Error('免费次数更新失败，请重试');
        }
      }

      // 9. 创建参与记录
      const participation = await tx.participations.create({
        data: {
          userId: decoded.userId,
          roundId: round.id,
          productId: round.productId,
          numbers,
          sharesCount,
          type: useType,
          cost: useType === 'paid' ? cost : 0,
          isWinner: false
        }
      });

      // 10. 记录交易
      if (useType === 'paid') {
        await tx.transactions.create({
          data: {
            userId: decoded.userId,
            type: 'lottery_participation',
            amount: cost,
            balanceType: 'lottery_coin',
            description: `参与夺宝 - ${sharesCount}份`
          }
        });
      } else {
        await tx.transactions.create({
          data: {
            userId: decoded.userId,
            type: 'free_lottery_participation',
            amount: 0,
            balanceType: 'free',
            description: `免费参与夺宝 - ${sharesCount}份`
          }
        });
      }

      return { 
        participation, 
        roundUpdateResult: roundUpdateResult[0].result,
        newFreeCount: useType === 'free' ? currentFreeCount - 1 : currentFreeCount
      };
    });

    // 11. 期次已满时立即触发开奖
    if (result.roundUpdateResult.isFull) {
      try {
        // 触发开奖Edge Function
        await fetch(`${process.env.SUPABASE_URL}/functions/v1/auto-draw`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ roundId })
        });
      } catch (drawError) {
        logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'触发开奖失败:', drawError);
        // 不影响主流程，开奖失败由定时任务处理
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        participationId: result.participation.id,
        numbers: result.participation.numbers,
        sharesCount: result.participation.sharesCount,
        newFreeCount: result.newFreeCount,
        roundStatus: result.roundUpdateResult.newStatus,
        soldShares: result.roundUpdateResult.newSoldShares,
        totalShares: result.roundUpdateResult.newSoldShares + 
                    (result.roundUpdateResult.newStatus === 'ongoing' ? 
                     1000 - result.roundUpdateResult.newSoldShares : 0)
      },
      message: '参与成功！祝您好运！'
    });

  } catch (error: any) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'Participate error:', error);
    
    // 根据错误类型返回不同状态码
    const statusCode = error.message.includes('份额不足') || 
                      error.message.includes('余额不足') ||
                      error.message.includes('免费次数已用完') ? 400 : 500;
    
    return NextResponse.json(
      { 
        error: '参与失败', 
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}