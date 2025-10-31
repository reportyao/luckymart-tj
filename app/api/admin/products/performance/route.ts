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

// GET - 获取商品表现统计数据
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
    const [performanceData, totalCount] = await Promise.all([
      prisma.productPerformance.findMany({
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
      prisma.productPerformance.count({ where })
    ]);

    // 统计汇总数据
    const summary = await prisma.productPerformance.aggregate({
      where,
      _sum: {
        participants_count: true,
        sales_amount: true,
        total_revenue: true
      },
      _avg: {
        conversion_rate: true,
        inventory_turnover: true,
        avg_price_per_share: true
      }
    });

    // 获取实时数据（从基础表计算今日数据）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // 今日参与人数
    const todayParticipants = await prisma.participations.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    // 今日销售额（从订单表计算）
    const todaySales = await prisma.orders.aggregate({
      where: {
        createdAt: {
          gte: today
        },
        paymentStatus: 'completed'
      },
      _sum: {
        totalAmount: true
      }
    });

    // 转换数据格式
    const formattedData = performanceData.map(item => ({
      id: item.id,
      productId: item.product_id,
      productName: {
        zh: item.products?.nameZh || '',
        en: item.products?.nameEn || '',
        ru: item.products?.nameRu || ''
      },
      category: item.products?.category || '',
      date: item.date.toISOString().split('T')[0],
      participantsCount: Number(item.participants_count),
      salesAmount: Number(item.sales_amount),
      conversionRate: Number(item.conversion_rate),
      inventoryTurnover: Number(item.inventory_turnover),
      avgPricePerShare: Number(item.avg_price_per_share),
      totalRevenue: Number(item.total_revenue),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: {
        performance: formattedData,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        summary: {
          totalParticipants: Number(summary._sum.participants_count || 0),
          totalSalesAmount: Number(summary._sum.sales_amount || 0),
          totalRevenue: Number(summary._sum.total_revenue || 0),
          avgConversionRate: Number(summary._avg.conversion_rate || 0),
          avgInventoryTurnover: Number(summary._avg.inventory_turnover || 0),
          avgPricePerShare: Number(summary._avg.avg_price_per_share || 0)
        },
        realTimeData: {
          todayParticipants,
          todaySalesAmount: Number(todaySales._sum.totalAmount || 0),
          date: todayStr
        }
      }
    });
    } catch (error: any) {
      console.error('获取商品表现数据失败:', error);
      return NextResponse.json({
        success: false,
        error: '获取商品表现数据失败'
      }, { status: 500 });
    }
  })(request);
}

// POST - 创建或更新商品表现数据
export async function POST(request: NextRequest) {
  return withWritePermission(async (request, admin) => {
    try {

    const body = await request.json();
    const {
      productId,
      date,
      participantsCount,
      salesAmount,
      conversionRate,
      inventoryTurnover,
      avgPricePerShare
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

    // 计算总销售额
    const totalRevenue = salesAmount || 0;

    // 创建或更新数据
    const performanceData = await prisma.productPerformance.upsert({
      where: {
        product_id_date: {
          product_id: productId,
          date: new Date(date)
        }
      },
      create: {
        product_id: productId,
        date: new Date(date),
        participants_count: participantsCount || 0,
        sales_amount: salesAmount || 0,
        conversion_rate: conversionRate || 0,
        inventory_turnover: inventoryTurnover || 0,
        avg_price_per_share: avgPricePerShare || 0,
        total_revenue: totalRevenue
      },
      update: {
        participants_count: participantsCount || 0,
        sales_amount: salesAmount || 0,
        conversion_rate: conversionRate || 0,
        inventory_turnover: inventoryTurnover || 0,
        avg_price_per_share: avgPricePerShare || 0,
        total_revenue: totalRevenue,
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        performanceData: {
          id: performanceData.id,
          productId: performanceData.product_id,
          date: performanceData.date.toISOString().split('T')[0],
          participantsCount: Number(performanceData.participants_count),
          salesAmount: Number(performanceData.sales_amount),
          conversionRate: Number(performanceData.conversion_rate),
          inventoryTurnover: Number(performanceData.inventory_turnover),
          avgPricePerShare: Number(performanceData.avg_price_per_share),
          totalRevenue: Number(performanceData.total_revenue)
        },
        message: '商品表现数据保存成功'
      }
    });
    } catch (error: any) {
      console.error('保存商品表现数据失败:', error);
      return NextResponse.json({
        success: false,
        error: '保存商品表现数据失败'
      }, { status: 500 });
    }
  })(request);
}
}