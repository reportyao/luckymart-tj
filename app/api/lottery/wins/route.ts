import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { authenticateUser } from '../../../../lib/auth';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `wins_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('wins_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('wins_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

    // GET /api/lottery/wins - 获取中奖记录
    export async function GET(request: NextRequest) {
      try {
        // 验证用户身份
        const authResult = await authenticateUser(request);
        if (!authResult.success) {
          return NextResponse.json(
            { success: false, error: '认证失败' },
            { status: 401 }
          );
        }

        const user = authResult.user;
        const { searchParams } = new URL(request.url);
    
        // 解析查询参数
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
        const offset = (page - 1) * limit;
        const period = searchParams.get('period') || 'all'; // 'week', 'month', 'year', 'all'

        // 构建时间筛选条件
        let dateFilter: Date | undefined;
        const now = new Date();
    
        switch (period) {
          case 'week':
            dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            dateFilter = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          case 'year':
            dateFilter = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        }

        // 构建查询条件
        let whereConditions: any = {
          userId: user.id,
          isWinner: true
        };

        if (dateFilter) {
          whereConditions.round = {
            ...whereConditions.round,
            drawTime: {
              gte: dateFilter
            }
          };
        }

        // 获取中奖记录总数
        const totalCount = await prisma.participations.count({
          where: whereConditions
        });

        // 获取中奖记录
        const winningParticipations = await prisma.participations.findMany({
          where: whereConditions,
          include: {
            round: {
              include: {
                product: {
                  select: {
                    id: true,
                    nameMultilingual: true,
                    nameZh: true,
                    nameEn: true,
                    nameRu: true,
                    images: true,
                    totalShares: true,
                    pricePerShare: true,
                    marketPrice: true
                  }
                }
              }
            }
          },
          orderBy: {
            round: {
              drawTime: 'desc'
            }
          },
          skip: offset,
          take: limit
        });

        // 转换数据格式
        const wins = winningParticipations.map((participation : any) => {
          const product = participation.round.product;
          const productName = getMultilingualProductName(product);
      
          // 计算奖金（可以是固定金额或基于商品价值）
          const prize = calculatePrize(product, participation.sharesCount);
      
          return {
            id: participation.id,
            participationId: participation.id,
            roundId: participation.roundId,
            productId: participation.productId,
            productName,
            productImage: product.images && product.images.length > 0 ? product.images[0] : undefined,
            roundNumber: participation.round.roundNumber,
            winningNumber: participation.round.winningNumber!,
            prize: prize.amount,
            prizeType: prize.type,
            prizeDescription: prize.description,
            claimStatus: participation.id, // 这里可以根据实际需求计算领奖状态
            claimedAt: null, // 领奖时间，暂无此字段
            numbers: participation.numbers,
            sharesCount: participation.sharesCount,
            participationCost: parseFloat(participation.cost.toString()),
            participationTime: participation.createdAt.toISOString(),
            drawTime: participation.round.drawTime!.toISOString(),
            period: getPrizePeriod(prize.amount, participation.round.roundNumber)
          };
        });

        // 计算统计数据
        const stats = await calculateWinStatistics(user.id, period);

        // 计算是否还有更多数据
        const hasMore = offset + wins.length < totalCount;

        return NextResponse.json({
          success: true,
          data: {
            wins,
            statistics: stats,
            pagination: {
              page,
              limit,
              total: totalCount,
              hasMore,
              totalPages: Math.ceil(totalCount / limit)
            }
          }
        });

      } catch (error) {
        logger.error("API Error", error as Error, {
          requestId,
          endpoint: request.url
        });'获取中奖记录失败:', error);
        return NextResponse.json(
          { success: false, error: '服务器错误' },
          { status: 500 }
        );
      }
}

// POST /api/lottery/wins/claim - 申请领奖
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: '认证失败' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const body = await request.json();
    const { participationId, claimType = 'wallet' } = body;

    if (!participationId) {
      return NextResponse.json(
        { success: false, error: '参与记录ID不能为空' },
        { status: 400 }
      );
    }

    // 检查参与记录是否存在且用户有权限
    const participation = await prisma.participations.findFirst({
      where: {
        id: participationId,
        userId: user.id,
        isWinner: true
      },
      include: {
        round: {
          include: {
            product: true
          }
        }
      }
    });

    if (!participation) {
      return NextResponse.json(
        { success: false, error: '中奖记录不存在或无权限' },
        { status: 404 }
      );
    }

    // 检查是否已经领奖（这里需要添加领奖状态字段）
    // const existingClaim = await prisma.claimRequests.findFirst({
    //   where: { participationId }
    // });
    // 
    // if (existingClaim) {
    //   return NextResponse.json(
    //     { success: false, error: '已经申请过领奖' },
    //     { status: 400 }
    //   );
    // }

    // 创建领奖申请
    const prize = calculatePrize(participation.round.product, participation.sharesCount);
    
    // 这里可以创建一个claim_requests记录，或者直接处理领奖逻辑
    // 简化处理，直接更新余额
    await prisma.users.update({
      where: { id: user.id },
      data: {
        balance: {
          increment: prize.amount
        }
      }
    });

    // 记录交易
    await prisma.transactions.create({
      data: {
        userId: user.id,
        type: 'lottery_win',
        amount: prize.amount,
        balanceType: 'main',
        description: `中奖奖金 - ${participation.round.product.nameZh || '未知商品'}第${participation.round.roundNumber}期`,
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        claimId: participationId,
        prize: prize.amount,
        claimType,
        message: '领奖申请已提交，奖金已发放到余额'
      }
    });

  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'申请领奖失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 计算奖金的辅助函数
function calculatePrize(product: any, sharesCount: number): { amount: number; type: string; description: string } {
  // 奖金策略：
  // 1. 固定奖金：每期固定奖金
  // 2. 比例奖金：基于商品价格的百分比
  // 3. 递增奖金：基于参与期数的递增奖金
  
  const pricePerShare = parseFloat(product.pricePerShare.toString());
  const totalShares = product.totalShares;
  
  // 示例策略：固定奖金 + 比例奖金
  const fixedPrize = 10; // 固定奖金 10 TJS
  const percentagePrize = pricePerShare * sharesCount * 0.1; // 10% 的商品价值
  
  const totalPrize = fixedPrize + percentagePrize;
  
  return {
    amount: parseFloat(totalPrize.toFixed(2)),
    type: 'mixed',
    description: `固定奖金 ${fixedPrize}TJS + 比例奖金 ${percentagePrize.toFixed(2)}TJS`
  };
}

// 获取奖金档次的辅助函数
function getPrizePeriod(prizeAmount: number, roundNumber: number): string {
  if (prizeAmount >= 100) return 'jackpot'; // 大奖
  if (prizeAmount >= 50) return 'major'; // 大奖
  if (prizeAmount >= 20) return 'medium'; // 中奖
  return 'minor'; // 小奖
}

// 计算中奖统计数据的辅助函数
async function calculateWinStatistics(userId: string, period: string) {
  const now = new Date();
  let dateFilter: Date | undefined;
  
  switch (period) {
    case 'week':
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      dateFilter = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case 'year':
      dateFilter = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
  }

  let whereConditions: any = {
    userId,
    isWinner: true
  };

  if (dateFilter) {
    whereConditions.round = {
      ...whereConditions.round,
      drawTime: {
        gte: dateFilter
      }
    };
  }

  const wins = await prisma.participations.findMany({
    where: whereConditions,
    include: {
      round: {
        include: {
          product: true
        }
      }
    }
  });

  const totalWins = wins.length;
  const totalPrize = wins.reduce((sum: any,  win: any) => {
    const prize = calculatePrize(win.round.product, win.sharesCount);
    return sum + prize.amount;
  }, 0);

  const averagePrize = totalWins > 0 ? totalPrize / totalWins : 0;

  // 按档次统计
  const prizeDistribution = {
    jackpot: 0, // >= 100
    major: 0,   // 50-99
    medium: 0,  // 20-49
    minor: 0    // < 20
  };

  wins.forEach((win : any) => {
    const prize = calculatePrize(win.round.product, win.sharesCount);
    const period = getPrizePeriod(prize.amount, win.round.roundNumber);
    prizeDistribution[period as keyof typeof prizeDistribution]++;
  });

  return {
    totalWins,
    totalPrize: parseFloat(totalPrize.toFixed(2)),
    averagePrize: parseFloat(averagePrize.toFixed(2)),
    maxPrize: Math.max(...wins.map((win : any) => calculatePrize(win.round.product, win.sharesCount).amount), 0),
    prizeDistribution,
    period
  };
}

// 获取多语言商品名称的辅助函数
function getMultilingualProductName(product: any): string {
  if (product.nameMultilingual) {
    try {
      const nameData = typeof product.nameMultilingual === 'string' 
        ? JSON.parse(product.nameMultilingual) 
        : product.nameMultilingual;
      
      const languages = ['zh-CN', 'zh', 'en', 'ru', 'tg'];
      
      for (const lang of languages) {
        if (nameData[lang] && nameData[lang].name) {
          return nameData[lang].name;
        }
      }
      
      const firstName = Object.values(nameData).find((value: any) => 
        value && typeof value === 'object' && value.name
      ) as any;
      
      if (firstName) {
        return firstName.name;
      }
    } catch (error) {
      console.warn('解析多语言名称失败:', error);
    }
  }

  return product.nameZh || product.nameEn || product.nameRu || '未知商品';
}