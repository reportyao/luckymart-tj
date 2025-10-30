import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PerformanceMonitor } from '@/lib/performance';
import { MemoryCache } from '@/lib/memory-cache';

// 内存缓存实例
const cache = new MemoryCache(100);
const CACHE_TTL = 180000; // 3分钟

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const language = searchParams.get('language') || 'zh';

    const skip = (page - 1) * limit;

    // 构建缓存键
    const cacheKey = `products:list:${category}:${status}:${page}:${limit}:${language}`;
    
    // 尝试从缓存获取数据
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Cache hit for products list');
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        responseTime: Date.now() - startTime
      }, {
        headers: {
          'Cache-Control': 'public, max-age=180, stale-while-revalidate=300',
          'X-Response-Time': `${Date.now() - startTime}ms`,
          'X-Cache-Status': 'HIT'
        }
      });
    }

    return PerformanceMonitor.measure('products/list', async () => {
      // 构建查询条件
      const where: any = {};
      
      if (status !== 'all') {
        where.status = status;
      }
      
      if (category && category !== 'all') {
        where.category = category;
      }

      // 使用Prisma关联查询解决N+1问题
      const [products, total] = await Promise.all([
        prisma.products.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            lotteryRounds: {
              where: { status: 'active' },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }),
        prisma.products.count({ where })
      ]);

      // 数据转换，避免N+1查询
      const productsWithRounds = products.map(product => {
        // 多语言处理
        const langSuffix = language === 'zh' ? 'Zh' : language === 'en' ? 'En' : 'Ru';
        const currentRound = product.lotteryRounds[0] || null;
        
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
      });

      const responseData = {
        products: productsWithRounds,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
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
          'Cache-Control': 'public, max-age=180, stale-while-revalidate=300',
          'X-Response-Time': `${responseTime}ms`,
          'X-Cache-Status': 'MISS',
          'X-Timestamp': Date.now().toString()
        }
      });
    });

  } catch (error: any) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { 
        error: '获取商品列表失败', 
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
