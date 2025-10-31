import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PerformanceMonitor } from '@/lib/performance';
import { MemoryCache } from '@/lib/memory-cache';
import { withI18n, validateLanguageParameter } from '@/lib/i18n-middleware';
import { MultilingualHelper } from '@/lib/services/multilingual-query';

// 内存缓存实例
const cache = new MemoryCache(100);
const CACHE_TTL = 180000; // 3分钟

@validateLanguageParameter('language')
export async function GET(request: NextRequest & { languageContext: any; formatter: any }) {
  const startTime = Date.now();
  const { languageContext, formatter } = request;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    // 构建缓存键，包含语言信息
    const cacheKey = `products:list:${category}:${status}:${page}:${limit}:${languageContext.detectedLanguage}`;
    
    // 尝试从缓存获取数据
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Cache hit for products list');
      const response = formatter.formatSuccess(cached, undefined, {
        cached: true,
        responseTime: Date.now() - startTime
      });
      return NextResponse.json(response, {
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
        prisma.product.findMany({
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
        prisma.product.count({ where })
      ]);

      // 数据转换，应用多语言处理
      const productsWithRounds = products.map(product => {
        const currentRound = product.lotteryRounds[0] || null;
        
        return {
          id: product.id,
          name: MultilingualHelper.extractText(product.nameMultilingual, languageContext.detectedLanguage),
          description: MultilingualHelper.extractText(product.descriptionMultilingual, languageContext.detectedLanguage),
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

      const response = formatter.formatPaginated(
        responseData.products,
        responseData.pagination,
        'success'
      );

      // 添加额外元数据
      response.meta = {
        ...response.meta,
        cached: false,
        responseTime,
        detectedLanguage: languageContext.detectedLanguage,
        fallbackUsed: languageContext.fallbackUsed
      };

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, max-age=180, stale-while-revalidate=300',
          'X-Response-Time': `${responseTime}ms`,
          'X-Cache-Status': 'MISS'
        }
      });
    });

  } catch (error: any) {
    console.error('Get products error:', error);
    
    // 使用i18n中间件的错误处理
    const errorResponse = formatter.formatError(
      'internal_error',
      'error',
      { 
        originalError: error.message,
        responseTime: Date.now() - startTime 
      }
    );
    
    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
  }
}

// 使用i18n中间件包装处理程序
const GETWithI18n = withI18n(GET);

// 导出包装后的处理程序
export { GETWithI18n as GET };
