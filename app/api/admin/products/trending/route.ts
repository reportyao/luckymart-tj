import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';


const withReadPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.products.read()
});

const withWritePermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.products.write()
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `trending_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('trending_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('trending_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

    // GET - 获取热销趋势数据
    export async function GET(request: NextRequest) {
      return withReadPermission(async (request: any, admin: any) => {
        try {

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const rankType = searchParams.get('rankType') || 'popularity'; // 'sales', 'popularity', 'search'

        // 构建查询条件
        const where: any = {};
        if (productId) {
          where.product_id = productId;
        }
        if (startDate && endDate) {
          where.date = {
            gte: new Date(startDate),
            lte: new Date(endDate)
          };
        }

        // 排序字段
        let orderBy: any = { date: 'desc' };
        switch (rankType) {
          case 'sales':
            orderBy = { sales_trend: 'desc' };
            break;
          case 'popularity':
            orderBy = { popularity_score: 'desc' };
            break;
          case 'search':
            orderBy = { search_volume: 'desc' };
            break;
        }

        // 获取分页数据
        const [trendingData, totalCount] = await Promise.all([
          prisma.productTrending.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: {
              products: {
                select: {
                  nameZh: true,
                  nameEn: true,
                  nameRu: true,
                  category: true,
                  marketPrice: true,
                  status: true
                }
              }
            }
          }),
          prisma.productTrending.count({ where })
        ]);

        // 统计汇总数据
        const summary = await prisma.productTrending.aggregate({
          where,
          _sum: {
            sales_trend: true,
            search_volume: true,
            social_mentions: true
          },
          _avg: {
            popularity_score: true,
            sales_trend: true,
            rank_position: true
          },
          _max: {
            popularity_score: true,
            sales_trend: true
          },
          _min: {
            popularity_score: true,
            sales_trend: true
          }
        });

        // 获取热销排行榜（今日数据）
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const topProducts = await prisma.productTrending.findMany({
          where: {
            date: today
          },
          orderBy: { popularity_score: 'desc' },
          take: 10,
          include: {
            products: {
              select: {
                nameZh: true,
                nameEn: true,
                nameRu: true,
                category: true,
                marketPrice: true
              }
            }
          }
        });

        // 获取实时数据（从基础表计算今日数据）
        const todayParticipations = await prisma.participations.count({
          where: {
            createdAt: {
              gte: today
            }
          }
        });

        const todaySales = await prisma.orders.aggregate({
          where: {
            createdAt: {
              gte: today
            },
            paymentStatus: 'completed'
          },
          _sum: {
            totalAmount: true
          },
          _count: {
            id: true
          }
        });

        // 转换数据格式
        const formattedData = trendingData.map((item : any) => ({
          id: item.id,
          productId: item.product_id,
          productName: {
            zh: item.products?.nameZh || '',
            en: item.products?.nameEn || '',
            ru: item.products?.nameRu || ''
          },
          category: item.products?.category || '',
          marketPrice: Number(item.products?.marketPrice || 0),
          status: item.products?.status || 'active',
          date: item.date.toISOString().split('T')[0],
          rankPosition: Number(item.rank_position),
          popularityScore: Number(item.popularity_score),
          salesTrend: Number(item.sales_trend),
          searchVolume: Number(item.search_volume),
          socialMentions: Number(item.social_mentions),
          competitorAnalysis: item.competitor_analysis,
          marketPosition: item.market_position,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString()
        }));

        // 转换排行榜数据格式
        const formattedTopProducts = topProducts.map((item : any) => ({
          id: item.id,
          productId: item.product_id,
          productName: {
            zh: item.products?.nameZh || '',
            en: item.products?.nameEn || '',
            ru: item.products?.nameRu || ''
          },
          category: item.products?.category || '',
          marketPrice: Number(item.products?.marketPrice || 0),
          rankPosition: Number(item.rank_position),
          popularityScore: Number(item.popularity_score),
          salesTrend: Number(item.sales_trend)
        }));

        // 计算趋势分析
        const trendAnalysis = {
          avgPopularityScore: Number(summary._avg.popularity_score || 0),
          maxPopularityScore: Number(summary._max.popularity_score || 0),
          minPopularityScore: Number(summary._min.popularity_score || 0),
          avgSalesTrend: Number(summary._avg.sales_trend || 0),
          maxSalesTrend: Number(summary._max.sales_trend || 0),
          minSalesTrend: Number(summary._min.sales_trend || 0),
          totalSearchVolume: Number(summary._sum.search_volume || 0),
          totalSocialMentions: Number(summary._sum.social_mentions || 0),
          avgRankPosition: Number(summary._avg.rank_position || 0)
        };

        return NextResponse.json({
          success: true,
          data: {
            trending: formattedData,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(totalCount / limit),
              totalCount,
              hasNext: page * limit < totalCount,
              hasPrev: page > 1
            },
            topProducts: formattedTopProducts,
            summary: {
              totalSearchVolume: trendAnalysis.totalSearchVolume,
              totalSocialMentions: trendAnalysis.totalSocialMentions,
              avgRankPosition: trendAnalysis.avgRankPosition
            },
            trendAnalysis,
            realTimeData: {
              todayParticipations,
              todaySalesAmount: Number(todaySales._sum.totalAmount || 0),
              todaySalesCount: Number(todaySales._count.id || 0),
              date: todayStr
            }
          }
        });
        } catch (error: any) {
          logger.error("API Error", error as Error, {
          requestId,
          endpoint: request.url
        });'获取热销趋势数据失败:', error);
          return NextResponse.json({
            success: false,
            error: '获取热销趋势数据失败'
          }, { status: 500 });
        }
}
}

// POST - 创建或更新热销趋势数据
export async function POST(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    try {

    const body = await request.json();
    const {
      productId,
      date,
      rankPosition,
      popularityScore,
      salesTrend,
      searchVolume,
      socialMentions,
      competitorAnalysis,
      marketPosition
    } = body;

    // 验证必填字段
    if (!productId || !date) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段：productId, date'
      }, { status: 400 });
    }

    // 检查商品是否存在
    const product = await prisma.products.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        error: '商品不存在'
      }, { status: 404 });
    }

    // 创建或更新数据
    const trendingData = await prisma.productTrending.upsert({
      where: {
        product_id_date: {
          product_id: productId,
          date: new Date(date)
        }
      },
      create: {
        product_id: productId,
        date: new Date(date),
        rank_position: rankPosition || 0,
        popularity_score: popularityScore || 0,
        sales_trend: salesTrend || 0,
        search_volume: searchVolume || 0,
        social_mentions: socialMentions || 0,
        competitor_analysis: competitorAnalysis || {},
        market_position: marketPosition || 'normal'
      },
      update: {
        rank_position: rankPosition || 0,
        popularity_score: popularityScore || 0,
        sales_trend: salesTrend || 0,
        search_volume: searchVolume || 0,
        social_mentions: socialMentions || 0,
        competitor_analysis: competitorAnalysis || {},
        market_position: marketPosition || 'normal',
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        trendingData: {
          id: trendingData.id,
          productId: trendingData.product_id,
          date: trendingData.date.toISOString().split('T')[0],
          rankPosition: Number(trendingData.rank_position),
          popularityScore: Number(trendingData.popularity_score),
          salesTrend: Number(trendingData.sales_trend),
          searchVolume: Number(trendingData.search_volume),
          socialMentions: Number(trendingData.social_mentions),
          competitorAnalysis: trendingData.competitor_analysis,
          marketPosition: trendingData.market_position
        },
        message: '热销趋势数据保存成功'
      }
    });
    } catch (error: any) {
      logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'保存热销趋势数据失败:', error);
      return NextResponse.json({
        success: false,
        error: '保存热销趋势数据失败'
      }, { status: 500 });
    }
  })(request);
}

// PUT - 批量更新排行榜数据
export async function PUT(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    try {

    const body = await request.json();
    const { date, rankings } = body;

    if (!date || !rankings || !Array.isArray(rankings)) {
      return NextResponse.json({
        success: false,
        error: '缺少必要数据：date, rankings'
      }, { status: 400 });
    }

    const results = [];
    const targetDate = new Date(date);

    // 批量处理排行榜更新
    for (let i = 0; i < rankings.length; i++) {
      const ranking = rankings[i];
      try {
        const { productId, popularityScore, salesTrend, searchVolume } = ranking;

        if (!productId) {
          results.push({
            position: i + 1,
            success: false,
            error: '缺少商品ID'
          });
          continue;
        }

        // 检查商品是否存在
        const product = await prisma.products.findUnique({
          where: { id: productId }
        });

        if (!product) {
          results.push({
            position: i + 1,
            productId,
            success: false,
            error: '商品不存在'
          });
          continue;
        }

        // 更新或创建趋势数据
        await prisma.productTrending.upsert({
          where: {
            product_id_date: {
              product_id: productId,
              date: targetDate
            }
          },
          create: {
            product_id: productId,
            date: targetDate,
            rank_position: i + 1,
            popularity_score: popularityScore || 0,
            sales_trend: salesTrend || 0,
            search_volume: searchVolume || 0,
            social_mentions: 0,
            competitor_analysis: {},
            market_position: 'normal'
          },
          update: {
            rank_position: i + 1,
            popularity_score: popularityScore || 0,
            sales_trend: salesTrend || 0,
            search_volume: searchVolume || 0,
            updated_at: new Date()
          }
        });

        results.push({
          position: i + 1,
          productId,
          success: true,
          message: '更新成功'
        });
      } catch (error: any) {
        results.push({
          position: i + 1,
          productId: ranking.productId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter((r : any) => r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: results.length - successCount
        },
        date,
        message: `排行榜更新完成，成功 ${successCount} 条，失败 ${results.length - successCount} 条`
      }
    });
    } catch (error: any) {
      logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'批量更新排行榜数据失败:', error);
      return NextResponse.json({
        success: false,
        error: '批量更新排行榜数据失败'
      }, { status: 500 });
    }
  })(request);
}