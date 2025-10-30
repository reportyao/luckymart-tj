import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { PerformanceMonitor } from '@/lib/performance';
import { MemoryCache } from '@/lib/memory-cache';

// 内存缓存实例
const cache = new MemoryCache(100);
const CACHE_TTL = 300000; // 5分钟

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get('language') || 'zh';

    // 构建缓存键
    const cacheKey = `products:detail:${id}:${language}`;
    
    // 尝试从缓存获取数据
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Cache hit for product detail:', id);
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        responseTime: Date.now() - startTime
      }, {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'X-Response-Time': `${Date.now() - startTime}ms`,
          'X-Cache-Status': 'HIT'
        }
      });
    }

    return PerformanceMonitor.measure('products/detail', async () => {
      // 使用单一查询获取所有相关数据，解决多次查询问题
      const [product, currentRound, recentParticipations] = await Promise.all([
        // 获取商品信息
        prisma.products.findUnique({
          where: { id }
        }),
        // 获取当前进行中的夺宝期次
        prisma.lotteryRounds.findFirst({
          where: { 
            productId: id,
            status: 'active'
          },
          orderBy: { createdAt: 'desc' }
        }),
        // 获取最近的参与记录
        prisma.participations.findMany({
          where: { 
            roundId: currentRound?.id 
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: { 
                id: true, 
                firstName: true, 
                username: true,
                telegramId: true 
              }
            }
          }
        }).catch(() => []) // 如果没有当前期次，返回空数组
      ]);

      if (!product) {
        return NextResponse.json({ error: '商品不存在' }, { status: 404 });
      }

      // 处理参与记录的用户信息（已在上面的查询中通过include获取）
      const formattedParticipations = recentParticipations.map(p => ({
        id: p.id,
        userId: p.userId,
        userName: p.user.firstName || p.user.username || '匿名用户',
        sharesCount: p.sharesCount,
        numbers: p.numbers,
        createdAt: p.createdAt
      }));

      // 多语言处理
      const langSuffix = language === 'zh' ? 'Zh' : language === 'en' ? 'En' : 'Ru';

      const responseData = {
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
        recentParticipations: formattedParticipations
      };

      // 存储到缓存
      cache.set(cacheKey, responseData, CACHE_TTL);

      const responseTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        data: responseData,
        cached: false,
        responseTime,
        timestamp: Date.now()
      }, {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'X-Response-Time': `${responseTime}ms`,
          'X-Cache-Status': 'MISS',
          'X-Timestamp': Date.now().toString()
        }
      });
    });

  } catch (error: any) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { 
        error: '获取商品详情失败', 
        message: error.message,
        responseTime: Date.now() - startTime 
      },
      { 
        status: 500,
        headers: {
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      }
    );
  }
}
