import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get('language') || 'zh';

    // 获取商品信息
    const product = await prisma.products.findUnique({
      where: { id }
    });

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }

    // 获取当前进行中的夺宝期次
    const currentRound = await prisma.lotteryRounds.findFirst({
      where: { 
        productId: id,
        status: 'active'
      },
      orderBy: { createdAt: 'desc' }
    });

    // 如果有进行中的期次，获取最近的参与记录
    let recentParticipations: any[] = [];
    if (currentRound) {
      recentParticipations = await prisma.participations.findMany({
        where: { roundId: currentRound.id },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // 获取参与用户信息
      const userIds = [...new Set(recentParticipations.map(p => p.userId))];
      const users = await prisma.users.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, username: true }
      });

      recentParticipations = recentParticipations.map(p => {
        const user = users.find(u => u.id === p.userId);
        return {
          id: p.id,
          userId: p.userId,
          userName: user?.firstName || user?.username || '匿名用户',
          sharesCount: p.sharesCount,
          numbers: p.numbers,
          createdAt: p.createdAt
        };
      });
    }

    // 多语言处理
    const langSuffix = language === 'zh' ? 'Zh' : language === 'en' ? 'En' : 'Ru';

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        name: product[`name${langSuffix}` as keyof typeof product],
        description: product[`description${langSuffix}` as keyof typeof product],
        images: product.images,
        marketPrice: parseFloat(product.marketPrice.toString()),
        totalShares: product.totalShares,
        pricePerShare: parseFloat(product.pricePerShare.toString()),
        category: product.category,
        stock: product.stock,
        status: product.status,
        currentRound: currentRound ? {
          id: currentRound.id,
          roundNumber: currentRound.roundNumber,
          totalShares: currentRound.totalShares,
          soldShares: currentRound.soldShares,
          status: currentRound.status,
          participants: currentRound.participants,
          progress: Math.round((currentRound.soldShares / currentRound.totalShares) * 100),
          remainingShares: currentRound.totalShares - currentRound.soldShares
        } : null,
        recentParticipations
      }
    });

  } catch (error: any) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: '获取商品详情失败', message: error.message },
      { status: 500 }
    );
  }
}
