import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { PerformanceMonitor } from '@/lib/performance';
import { MemoryCache } from '@/lib/memory-cache';
import {
  ProductMultilingualService,
  type SupportedLanguage,
} from '@/lib/services/multilingual-query';

// 内存缓存实例
const cache = new MemoryCache(100);
const CACHE_TTL = 300000; // 5分钟;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const languageParam = searchParams.get('language') || 'tg-TJ';
    
    // 映射旧语言代码到新格式
    const languageMap: Record<string, SupportedLanguage> = {
      'zh': 'zh-CN',
      'en': 'en-US',
      'ru': 'ru-RU',
      'tg': 'tg-TJ',
      'zh-CN': 'zh-CN',
      'en-US': 'en-US',
      'ru-RU': 'ru-RU',
      'tg-TJ': 'tg-TJ',
    };
    
    const language = languageMap[languageParam] || 'tg-TJ';

    // 构建缓存键
    const cacheKey = `products:detail:${id}:${language}`;
    
    // 尝试从缓存获取数据
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info("API Log", { requestId, data: 'Cache hit for product detail:', id });'Cache hit for product detail:', id);
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
      // 使用多语言服务获取产品（包含翻译）
      const product = await ProductMultilingualService.getProductById(id, language);

      if (!product) {
        return NextResponse.json({ error: '商品不存在' }, { status: 404 });
      }

      // 获取当前进行中的夺宝期次和参与记录
      const currentRound = await prisma.lotteryRounds.findFirst({
        where: { 
          productId: id,
          status: 'active'
        },
        orderBy: { createdAt: 'desc' }
      });

      const recentParticipations = currentRound ? await prisma.participations.findMany({
        where: { roundId: currentRound.id },
        orderBy: { createdAt: 'desc' },
        take: 10
      }) : [];

      // 获取参与用户信息
      const userIds = recentParticipations.map(((p : any) : any) => p.userId);
      const users = userIds.length > 0 ? await prisma.users.findMany({
        where: { id: { in: userIds } },
        select: { 
          id: true, 
          firstName: true, 
          username: true,
          telegramId: true 
        }
      }) : [];

      const userMap = new Map(users.map(((u : any) : any) => [u.id, u]));

      const formattedParticipations = recentParticipations.map(((p : any) : any) => {
        const user = userMap.get(p.userId);
        return {
          id: p.id,
          userId: p.userId,
          userName: user?.firstName || user?.username || '匿名用户',
          sharesCount: p.sharesCount,
          numbers: p.numbers,
          createdAt: p.createdAt
        };
      });

      const responseData = {
        id: product.id,
        name: product.name,  // 已经是翻译后的文本
        description: product.description,  // 已经是翻译后的文本
        category: product.category,  // 已经是翻译后的文本
        images: product.images,
        marketPrice: parseFloat(product.marketPrice.toString()),
        totalShares: product.totalShares,
        pricePerShare: parseFloat(product.pricePerShare.toString()),
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
        recentParticipations: formattedParticipations,
        _multilingual: product._multilingual  // 保留原始多语言数据
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
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'Get product error:', error);
    return NextResponse.json(;
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
