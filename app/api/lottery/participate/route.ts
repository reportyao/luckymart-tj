import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

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

    // 执行事务
    const result = await prisma.$transaction(async (tx) => {
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

      // 更新夺宝期次
      const updatedRound = await tx.lotteryRounds.update({
        where: { id: roundId },
        data: {
          soldShares: { increment: sharesCount },
          participants: { increment: 1 },
          status: round.soldShares + sharesCount >= round.totalShares ? 'full' : 'ongoing'
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

      return { participation, updatedRound };
    });

    // TODO: 如果期次已满，触发开奖（需要实现开奖逻辑）

    return NextResponse.json({
      success: true,
      data: {
        participationId: result.participation.id,
        numbers: result.participation.numbers,
        sharesCount: result.participation.sharesCount,
        roundStatus: result.updatedRound.status,
        soldShares: result.updatedRound.soldShares,
        totalShares: result.updatedRound.totalShares
      },
      message: '参与成功！祝您好运！'
    });

  } catch (error: any) {
    console.error('Participate error:', error);
    return NextResponse.json(
      { error: '参与失败', message: error.message },
      { status: 500 }
    );
  }
}
