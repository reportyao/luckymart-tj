import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const language = searchParams.get('language') || 'zh';

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    
    if (status !== 'all') {
      where.status = status;
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }

    // 查询商品
    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.products.count({ where })
    ]);

    // 为每个商品获取当前进行中的夺宝期次
    const productsWithRounds = await Promise.all(
      products.map(async (product) => {
        const currentRound = await prisma.lotteryRounds.findFirst({
          where: { 
            productId: product.id, 
            status: 'active' 
          },
          orderBy: { createdAt: 'desc' }
        });

        // 多语言处理
        const langSuffix = language === 'zh' ? 'Zh' : language === 'en' ? 'En' : 'Ru';
        
        return {
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
          createdAt: product.createdAt,
          currentRound: currentRound ? {
            id: currentRound.id,
            roundNumber: currentRound.roundNumber,
            totalShares: currentRound.totalShares,
            soldShares: currentRound.soldShares,
            status: currentRound.status,
            participants: currentRound.participants,
            progress: Math.round((currentRound.soldShares / currentRound.totalShares) * 100)
          } : null
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        products: productsWithRounds,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: '获取商品列表失败', message: error.message },
      { status: 500 }
    );
  }
}
