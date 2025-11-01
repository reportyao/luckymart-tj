import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSecureWinningNumber, generateSecureDrawProof, findWinner } from '@/lib/lottery-algorithm';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';

const withWritePermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.lottery.write()
});

const withReadPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.lottery.read()
});

/**
 * 手动触发开奖API
 * 管理员可以手动触发某个已售罄的抽奖轮次的开奖
 */
export async function POST(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    try {

    const body = await request.json();
    const { roundId } = body;

    if (!roundId) {
      return NextResponse.json({
        success: false,
        error: '缺少轮次ID'
      }, { status: 400 });
    }

    // 1. 查询轮次信息
    const round = await prisma.lotteryRounds.findUnique({
      where: { id: roundId }
    });

    if (!round) {
      return NextResponse.json({
        success: false,
        error: '轮次不存在'
      }, { status: 404 });
    }

    // 2. 检查轮次状态
    if (round.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: `轮次状态为 ${round.status}，无法开奖`
      }, { status: 400 });
    }

    // 3. 检查是否售罄
    if (round.soldShares < round.totalShares) {
      return NextResponse.json({
        success: false,
        error: `当前已售 ${round.soldShares}/${round.totalShares} 份，未售罄，无法开奖`
      }, { status: 400 });
    }

    // 4. 查询产品信息
    const product = await prisma.products.findUnique({
      where: { id: round.productId }
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        error: '商品不存在'
      }, { status: 404 });
    }

    // 5. 查询参与记录
    const participations = await prisma.participations.findMany({
      where: { roundId }
    });

    // 6. 检查是否有参与记录
    if (participations.length === 0) {
      return NextResponse.json({
        success: false,
        error: '无参与记录，无法开奖'
      }, { status: 400 });
    }

    // 5. 执行开奖算法
    const participationIds = participations.map((p : any) => p.id);
    const participationData = participations.map((p : any) => ({
      userId: p.userId,
      numbers: p.numbers,
      amount: Number(p.cost),
      createdAt: p.createdAt
    }));
    
    const drawResult = calculateSecureWinningNumber(
      participationIds,
      participationData,
      round.productId,
      round.totalShares
    );

    // 6. 查找中奖用户
    const participationsWithNumbers = participations.map((p : any) => ({
      userId: p.userId,
      numbers: p.numbers
    }));
    const winnerUserId = findWinner(participationsWithNumbers, drawResult.winningNumber);

    if (!winnerUserId) {
      return NextResponse.json({
        success: false,
        error: '未找到中奖用户，这不应该发生！'
      }, { status: 500 });
    }

    // 7. 执行开奖事务
    await prisma.$transaction(async (tx: any) => {
      // 更新轮次状态
      await tx.lotteryRounds.update({
        where: { id: roundId },
        data: {
          status: 'completed',
          winnerUserId,
          winningNumber: drawResult.winningNumber,
          drawTime: new Date(),
          drawAlgorithmData: drawResult as any
        }
      });

      // 标记中奖参与记录
      await tx.participations.updateMany({
        where: {
          roundId,
          userId: winnerUserId,
          numbers: { has: drawResult.winningNumber }
        },
        data: {
          isWinner: true
        }
      });

      // 创建中奖订单
      const orderNumber = `LM${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      await tx.orders.create({
        data: {
          orderNumber,
          userId: winnerUserId,
          roundId,
          productId: round.productId,
          type: 'lottery_win',
          totalAmount: 0, // 中奖订单无需支付
          paymentStatus: 'paid',
          fulfillmentStatus: 'pending',
          quantity: 1,
          status: 'pending',
          notes: JSON.stringify({
            roundNumber: round.roundNumber,
            winningNumber: drawResult.winningNumber,
            drawTime: drawResult.timestamp
          })
        }
      });

      // 记录交易
      await tx.transactions.create({
        data: {
          userId: winnerUserId,
          type: 'lottery_win',
          amount: Number(product.marketPrice),
          balanceType: 'platform_balance',
          description: `恭喜中奖：${product.nameZh} - 第${round.roundNumber}期，中奖号码 ${drawResult.winningNumber}`
        }
      });
    });

    // 8. 查询中奖用户信息
    const winner = await prisma.users.findUnique({
      where: { id: winnerUserId }
    });

    return NextResponse.json({
      success: true,
      data: {
        roundId,
        roundNumber: round.roundNumber,
        productName: product.nameZh,
        winningNumber: drawResult.winningNumber,
        winner: {
          userId: winnerUserId,
          username: winner?.username,
          firstName: winner?.firstName
        },
        drawResult,
        proof: generateSecureDrawProof(drawResult)
      }
    });
    } catch (error: any) {
      console.error('Manual draw error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || '开奖失败'
      }, { status: 500 });
    }
  })(request);
}

/**
 * GET - 获取待开奖列表
 */
export async function GET(request: NextRequest) {
  return withReadPermission(async (request: any, admin: any) => {
    try {

    // 查询已售罄但未开奖的轮次（soldShares >= totalShares）
    const allActiveRounds = await prisma.lotteryRounds.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'asc' }
    });
    
    // 筛选出已售罄的轮次
    const readyRounds = allActiveRounds.filter((r : any) => r.soldShares >= r.totalShares);

    // 手动查询产品信息和参与人数
    const roundsWithDetails = await Promise.all(
      readyRounds.map(async (r) : any => {
        const product = await prisma.products.findUnique({
          where: { id: r.productId },
          select: {
            nameZh: true,
            nameEn: true,
            nameRu: true,
            images: true,
            marketPrice: true
          }
        });

        const participantCount = await prisma.participations.count({
          where: { roundId: r.id }
        });

        return {
          id: r.id,
          productId: r.productId,
          productName: product?.nameZh || '',
          productImages: product?.images || [],
          marketPrice: Number(product?.marketPrice || 0),
          roundNumber: r.roundNumber,
          totalShares: r.totalShares,
          soldShares: r.soldShares,
          participants: participantCount,
          createdAt: r.createdAt.toISOString()
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        rounds: roundsWithDetails
      }
    });
    } catch (error: any) {
      console.error('Get ready rounds error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || '获取待开奖列表失败'
      }, { status: 500 });
    }
  })(request);
}
