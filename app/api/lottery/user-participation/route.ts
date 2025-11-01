import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLogger } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';

const handleUserParticipation = async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `lottery_user_participation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  let decoded: { userId: string } | null = null;

  try {
    logger.info('获取用户参与信息请求', {
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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get('roundId');

    // 如果指定了roundId，查询特定期次
    if (roundId) {
      const result = await getRoundParticipation(decoded.userId, roundId);
      logger.info('获取特定期次参与信息成功', {
        requestId,
        userId: decoded.userId,
        roundId,
        executionTime: Date.now() - startTime
      });
      return NextResponse.json({
        success: true,
        data: result
      });
    }

    // 如果没有指定roundId，查询用户所有参与信息
    const result = await getAllParticipations(decoded.userId);
    
    logger.info('获取所有参与信息成功', {
      requestId,
      userId: decoded.userId,
      participationCount: result.participations.length,
      executionTime: Date.now() - startTime
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    logger.error('获取用户参与信息失败', error, {
      requestId,
      userId: decoded?.userId,
      roundId: searchParams?.get('roundId'),
      error: error.message,
      executionTime: Date.now() - startTime
    });

    let statusCode = 500;
    let errorMessage = '获取用户参与信息失败';

    if (error.message.includes('未授权')) {
      statusCode = 401;
      errorMessage = '未授权访问';
    } else if (error.message.includes('用户不存在')) {
      statusCode = 404;
      errorMessage = '用户不存在';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
};

// 获取特定期次的用户参与信息
async function getRoundParticipation(userId: string, roundId: string) {
  // 1. 获取期次信息
  const round = await prisma.lotteryRounds.findUnique({
    where: { id: roundId },
    select: {
      id: true,
      totalShares: true,
      soldShares: true,
      pricePerShare: true,
      status: true,
      product: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!round) {
    throw new Error('期次不存在');
  }

  // 2. 获取用户的参与记录
  const participations = await prisma.participations.findMany({
    where: {
      userId: userId,
      roundId: roundId
    },
    select: {
      id: true,
      sharesCount: true,
      numbers: true,
      cost: true,
      isWinner: true,
      createdAt: true,
      type: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // 3. 计算用户总参与信息
  const totalSharesCount = participations.reduce((sum: any,  p: any) => sum + p.sharesCount, 0);
  const totalCost = participations.reduce((sum: any,  p: any) => sum + Number(p.cost), 0);
  const winProbability = round.totalShares > 0 ? (totalSharesCount / round.totalShares) * 100 : 0;

  // 4. 获取用户幸运币余额
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { luckyCoins: true }
  });

  return {
    roundId: round.id,
    roundNumber: 1, // 这里应该从round中获取，如果schema中有的话
    productId: round.product.id,
    productName: round.product.name,
    totalShares: round.totalShares,
    soldShares: round.soldShares,
    pricePerShare: round.pricePerShare,
    status: round.status,
    userParticipation: {
      sharesCount: totalSharesCount,
      totalCost: totalCost,
      participations: participations.map((p : any) => ({
        id: p.id,
        sharesCount: p.sharesCount,
        numbers: p.numbers,
        cost: p.cost,
        isWinner: p.isWinner,
        createdAt: p.createdAt,
        type: p.type
      })),
      winProbability: winProbability,
      availableNumbers: Array.from({ length: 100 }, (_, i) => i + 1).filter(
        num => !participations.some(p => p.numbers.includes(num))
      )
    },
    coinBalance: user?.luckyCoins || 0
  };
}

// 获取用户所有参与信息
async function getAllParticipations(userId: string) {
  // 1. 获取用户基本信息
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      luckyCoins: true,
      totalSpent: true
    }
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  // 2. 获取用户所有参与记录
  const participations = await prisma.participations.findMany({
    where: {
      userId: userId
    },
    select: {
      id: true,
      roundId: true,
      productId: true,
      sharesCount: true,
      numbers: true,
      cost: true,
      isWinner: true,
      createdAt: true,
      type: true,
      round: {
        select: {
          totalShares: true,
          soldShares: true,
          status: true,
          product: {
            select: {
              id: true,
              name: true,
              images: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50 // 限制返回最近50条记录
  });

  // 3. 按期次分组统计
  const roundStats = new Map();
  let totalParticipations = 0;
  let totalSpent = 0;
  let totalWins = 0;

  participations.forEach((participation : any) => {
    const roundId = participation.roundId;
    const existing = roundStats.get(roundId) || {
      roundId,
      totalShares: participation.round.totalShares,
      soldShares: participation.round.soldShares,
      status: participation.round.status,
      product: participation.round.product,
      userShares: 0,
      totalCost: 0,
      isWinner: false,
      winProbability: 0
    };

    existing.userShares += participation.sharesCount;
    existing.totalCost += Number(participation.cost);
    if (participation.isWinner) {
      existing.isWinner = true;
    }

    roundStats.set(roundId, existing);
    
    totalParticipations += participation.sharesCount;
    totalSpent += Number(participation.cost);
    if (participation.isWinner) {
      totalWins += 1;
    }
  });

  // 4. 计算每个期次的中奖概率
  roundStats.forEach(((stats, roundId) : any) => {
    stats.winProbability = stats.totalShares > 0 
      ? (stats.userShares / stats.totalShares) * 100 
      : 0;
  });

  return {
    userStats: {
      totalParticipations,
      totalSpent,
      totalWins,
      winRate: participations.length > 0 ? (totalWins / participations.length) * 100 : 0
    },
    coinBalance: user.luckyCoins,
    totalSpent: user.totalSpent,
    participations: participations.map((p : any) => ({
      id: p.id,
      roundId: p.roundId,
      productId: p.productId,
      productName: p.round.product.name,
      productImage: p.round.product.images?.[0] || null,
      sharesCount: p.sharesCount,
      numbers: p.numbers,
      cost: p.cost,
      isWinner: p.isWinner,
      createdAt: p.createdAt,
      type: p.type,
      roundStatus: p.round.status,
      userWinProbability: p.round.totalShares > 0 
        ? (p.sharesCount / p.round.totalShares) * 100 
        : 0
    })),
    roundStats: Array.from(roundStats.values()).sort((a, b) => 
      b.userShares - a.userShares
    )
  };
}

// 导出主处理函数
export { handleUserParticipation as GET };