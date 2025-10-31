import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { AdminPermissionManager } from '@/lib/admin/permissions/AdminPermissionManager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';


const withReadPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.products.read()
});

const withWritePermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.products.write()
});

// GET - 获取转化漏斗分析数据
export async function GET(request: NextRequest) {
  return withReadPermission(async (request, admin) => {
    try {

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

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

    // 获取分页数据
    const [conversionData, totalCount] = await Promise.all([
      prisma.conversionFunnel.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          products: {
            select: {
              nameZh: true,
              nameEn: true,
              nameRu: true,
              category: true
            }
          }
        }
      }),
      prisma.conversionFunnel.count({ where })
    ]);

    // 统计汇总数据
    const summary = await prisma.conversionFunnel.aggregate({
      where,
      _sum: {
        page_views: true,
        detail_page_views: true,
        favorites: true,
        add_to_cart: true,
        purchases: true
      },
      _avg: {
        view_to_detail_rate: true,
        detail_to_favorite_rate: true,
        favorite_to_cart_rate: true,
        cart_to_purchase_rate: true,
        overall_conversion_rate: true,
        avg_dwell_time: true
      }
    });

    // 获取实时数据（从基础表计算今日数据）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // 今日购买数据
    const todayPurchases = await prisma.orders.count({
      where: {
        createdAt: {
          gte: today
        },
        paymentStatus: 'completed'
      }
    });

    // 今日参与抽奖数据
    const todayParticipations = await prisma.participations.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    // 计算转化率
    const totalViews = Number(summary._sum.page_views || 0);
    const totalDetailViews = Number(summary._sum.detail_page_views || 0);
    const totalFavorites = Number(summary._sum.favorites || 0);
    const totalCartAdds = Number(summary._sum.add_to_cart || 0);
    const totalPurchases = Number(summary._sum.purchases || 0);

    // 转换数据格式
    const formattedData = conversionData.map(item => {
      const pageViews = Number(item.page_views);
      const detailViews = Number(item.detail_page_views);
      const favorites = Number(item.favorites);
      const cartAdds = Number(item.add_to_cart);
      const purchases = Number(item.purchases);

      return {
        id: item.id,
        productId: item.product_id,
        productName: {
          zh: item.products?.nameZh || '',
          en: item.products?.nameEn || '',
          ru: item.products?.nameRu || ''
        },
        category: item.products?.category || '',
        date: item.date.toISOString().split('T')[0],
        pageViews,
        detailPageViews: detailViews,
        favorites,
        addToCart: cartAdds,
        purchases,
        viewToDetailRate: Number(item.view_to_detail_rate),
        detailToFavoriteRate: Number(item.detail_to_favorite_rate),
        favoriteToCartRate: Number(item.favorite_to_cart_rate),
        cartToPurchaseRate: Number(item.cart_to_purchase_rate),
        overallConversionRate: Number(item.overall_conversion_rate),
        avgDwellTime: Number(item.avg_dwell_time),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      };
    });

    // 计算汇总转化率
    const aggregatedRates = {
      viewToDetailRate: totalViews > 0 ? (totalDetailViews / totalViews) * 100 : 0,
      detailToFavoriteRate: totalDetailViews > 0 ? (totalFavorites / totalDetailViews) * 100 : 0,
      favoriteToCartRate: totalFavorites > 0 ? (totalCartAdds / totalFavorites) * 100 : 0,
      cartToPurchaseRate: totalCartAdds > 0 ? (totalPurchases / totalCartAdds) * 100 : 0,
      overallConversionRate: totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        conversion: formattedData,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        summary: {
          totalPageViews: totalViews,
          totalDetailViews: totalDetailViews,
          totalFavorites: totalFavorites,
          totalAddToCart: totalCartAdds,
          totalPurchases: totalPurchases,
          avgViewToDetailRate: Number(summary._avg.view_to_detail_rate || 0),
          avgDetailToFavoriteRate: Number(summary._avg.detail_to_favorite_rate || 0),
          avgFavoriteToCartRate: Number(summary._avg.favorite_to_cart_rate || 0),
          avgCartToPurchaseRate: Number(summary._avg.cart_to_purchase_rate || 0),
          avgOverallConversionRate: Number(summary._avg.overall_conversion_rate || 0),
          avgDwellTime: Number(summary._avg.avg_dwell_time || 0)
        },
        aggregatedRates,
        realTimeData: {
          todayPurchases,
          todayParticipations,
          date: todayStr
        }
      }
    });
    } catch (error: any) {
      console.error('获取转化漏斗数据失败:', error);
      return NextResponse.json({
        success: false,
        error: '获取转化漏斗数据失败'
      }, { status: 500 });
    }
  })(request);
}

// POST - 创建或更新转化漏斗数据
export async function POST(request: NextRequest) {
  return withWritePermission(async (request, admin) => {
    try {

    const body = await request.json();
    const {
      productId,
      date,
      pageViews,
      detailPageViews,
      favorites,
      addToCart,
      purchases,
      avgDwellTime
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

    // 计算转化率
    const views = pageViews || 0;
    const details = detailPageViews || 0;
    const favs = favorites || 0;
    const carts = addToCart || 0;
    const purchases_count = purchases || 0;

    const viewToDetailRate = views > 0 ? (details / views) * 100 : 0;
    const detailToFavoriteRate = details > 0 ? (favs / details) * 100 : 0;
    const favoriteToCartRate = favs > 0 ? (carts / favs) * 100 : 0;
    const cartToPurchaseRate = carts > 0 ? (purchases_count / carts) * 100 : 0;
    const overallConversionRate = views > 0 ? (purchases_count / views) * 100 : 0;

    // 创建或更新数据
    const conversionData = await prisma.conversionFunnel.upsert({
      where: {
        product_id_date: {
          product_id: productId,
          date: new Date(date)
        }
      },
      create: {
        product_id: productId,
        date: new Date(date),
        page_views: views,
        detail_page_views: details,
        favorites: favs,
        add_to_cart: carts,
        purchases: purchases_count,
        view_to_detail_rate: viewToDetailRate,
        detail_to_favorite_rate: detailToFavoriteRate,
        favorite_to_cart_rate: favoriteToCartRate,
        cart_to_purchase_rate: cartToPurchaseRate,
        overall_conversion_rate: overallConversionRate,
        avg_dwell_time: avgDwellTime || 0
      },
      update: {
        page_views: views,
        detail_page_views: details,
        favorites: favs,
        add_to_cart: carts,
        purchases: purchases_count,
        view_to_detail_rate: viewToDetailRate,
        detail_to_favorite_rate: detailToFavoriteRate,
        favorite_to_cart_rate: favoriteToCartRate,
        cart_to_purchase_rate: cartToPurchaseRate,
        overall_conversion_rate: overallConversionRate,
        avg_dwell_time: avgDwellTime || 0,
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        conversionData: {
          id: conversionData.id,
          productId: conversionData.product_id,
          date: conversionData.date.toISOString().split('T')[0],
          pageViews: Number(conversionData.page_views),
          detailPageViews: Number(conversionData.detail_page_views),
          favorites: Number(conversionData.favorites),
          addToCart: Number(conversionData.add_to_cart),
          purchases: Number(conversionData.purchases),
          viewToDetailRate: Number(conversionData.view_to_detail_rate),
          detailToFavoriteRate: Number(conversionData.detail_to_favorite_rate),
          favoriteToCartRate: Number(conversionData.favorite_to_cart_rate),
          cartToPurchaseRate: Number(conversionData.cart_to_purchase_rate),
          overallConversionRate: Number(conversionData.overall_conversion_rate),
          avgDwellTime: Number(conversionData.avg_dwell_time)
        },
        message: '转化漏斗数据保存成功'
      }
    });
    } catch (error: any) {
      console.error('保存转化漏斗数据失败:', error);
      return NextResponse.json({
        success: false,
        error: '保存转化漏斗数据失败'
      }, { status: 500 });
    }
  })(request);
}