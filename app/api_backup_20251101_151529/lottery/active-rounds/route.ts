import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLogger } from '@/lib/logger';

const handleActiveRounds = async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `lottery_active_rounds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  try {
    logger.info('获取活跃抽奖期次', {
      requestId,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'zh';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // 获取活跃的抽奖期次
    const rounds = await prisma.lotteryRounds.findMany({
      where: {
        status: 'active',
        OR: [
          { drawTime: null },
          { drawTime: { gt: new Date() } }
        ]
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            marketPrice: true,
            images: true,
            marketingBadge: true
          }
        },
        participations: {
          select: {
            userId: true,
            sharesCount: true,
            numbers: true,
            isWinner: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // 计算每个期次的详细信息
    const enrichedRounds = rounds.map((round : any) => {
      const progress = round.totalShares > 0 ? (round.soldShares / round.totalShares) * 100 : 0;
      const availableShares = round.totalShares - round.soldShares;
      
      // 计算用户参与统计（如果有用户ID的话）
      const userParticipations = round.participations.reduce((acc: any,  p: any) => {
        if (!acc[p.userId]) {
          acc[p.userId] = {
            sharesCount: 0,
            numbers: [],
            isWinner: false
          };
        }
        acc[p.userId].sharesCount += p.sharesCount;
        acc[p.userId].numbers.push(...p.numbers);
        if (p.isWinner) {
          acc[p.userId].isWinner = true;
        }
        return acc;
      }, {} as Record<string, any>);

      return {
        id: round.id,
        productId: round.productId,
        roundNumber: round.roundNumber,
        totalShares: round.totalShares,
        soldShares: round.soldShares,
        status: round.status,
        drawTime: round.drawTime,
        pricePerShare: round.pricePerShare || 10, // 默认价格，如果没有设置的话
        progress: Math.round(progress),
        availableShares,
        product: {
          ...round.product,
          images: round.product.images || []
        },
        statistics: {
          totalParticipants: new Set(round.participations.map((p : any) => p.userId)).size,
          totalSharesSold: round.soldShares,
          winProbability: round.totalShares > 0 ? Math.round((round.soldShares / round.totalShares) * 100) : 0,
          estimatedDrawTime: round.drawTime ? new Date(round.drawTime).toLocaleString('zh-CN') : null
        }
      };
    });

    // 获取总数统计
    const totalCount = await prisma.lotteryRounds.count({
      where: {
        status: 'active',
        OR: [
          { drawTime: null },
          { drawTime: { gt: new Date() } }
        ]
      }
    });

    logger.info('获取活跃抽奖期次成功', {
      requestId,
      roundsCount: enrichedRounds.length,
      totalCount,
      executionTime: Date.now() - startTime
    });

    return NextResponse.json({
      success: true,
      data: {
        rounds: enrichedRounds,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    });

  } catch (error: any) {
    logger.error('获取活跃抽奖期次失败', error, {
      requestId,
      error: error.message,
      executionTime: Date.now() - startTime
    });

    return NextResponse.json(
      { 
        success: false,
        error: '获取抽奖期次失败',
        message: error.message
      },
      { status: 500 }
    );
  }
};

// 导出主处理函数
export { handleActiveRounds as GET };