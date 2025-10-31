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

// GET - 获取利润分析数据
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
    const [profitData, totalCount] = await Promise.all([
      prisma.profitAnalysis.findMany({
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
              category: true,
              marketPrice: true
            }
          }
        }
      }),
      prisma.profitAnalysis.count({ where })
    ]);

    // 统计汇总数据
    const summary = await prisma.profitAnalysis.aggregate({
      where,
      _sum: {
        revenue: true,
        product_cost: true,
        platform_fee: true,
        operation_cost: true,
        gross_profit: true,
        net_profit: true
      },
      _avg: {
        roi: true,
        profit_margin: true,
        cost_ratio: true
      }
    });

    // 获取实时数据（从订单表计算今日数据）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // 今日收入
    const todayRevenue = await prisma.orders.aggregate({
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

    // 今日平台费用
    const todayPlatformFees = await prisma.resaleListings.aggregate({
      where: {
        listedAt: {
          gte: today
        },
        status: 'sold'
      },
      _sum: {
        platformFee: true
      }
    });

    // 转换数据格式
    const formattedData = profitData.map(item => {
      const revenue = Number(item.revenue);
      const productCost = Number(item.product_cost);
      const platformFee = Number(item.platform_fee);
      const operationCost = Number(item.operation_cost);
      const grossProfit = Number(item.gross_profit);
      const netProfit = Number(item.net_profit);

      return {
        id: item.id,
        productId: item.product_id,
        productName: {
          zh: item.products?.nameZh || '',
          en: item.products?.nameEn || '',
          ru: item.products?.nameRu || ''
        },
        category: item.products?.category || '',
        marketPrice: Number(item.products?.marketPrice || 0),
        date: item.date.toISOString().split('T')[0],
        revenue,
        productCost,
        platformFee,
        operationCost,
        grossProfit,
        netProfit,
        roi: Number(item.roi),
        profitMargin: Number(item.profit_margin),
        costRatio: Number(item.cost_ratio),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      };
    });

    // 计算汇总指标
    const totalRevenue = Number(summary._sum.revenue || 0);
    const totalProductCost = Number(summary._sum.product_cost || 0);
    const totalPlatformFee = Number(summary._sum.platform_fee || 0);
    const totalOperationCost = Number(summary._sum.operation_cost || 0);
    const totalGrossProfit = Number(summary._sum.gross_profit || 0);
    const totalNetProfit = Number(summary._sum.net_profit || 0);

    const overallProfitMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
    const overallCostRatio = totalRevenue > 0 ? ((totalProductCost + totalPlatformFee + totalOperationCost) / totalRevenue) * 100 : 0;
    const overallROI = totalProductCost > 0 ? ((totalNetProfit - totalOperationCost) / totalProductCost) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        profit: formattedData,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        summary: {
          totalRevenue,
          totalProductCost,
          totalPlatformFee,
          totalOperationCost,
          totalGrossProfit,
          totalNetProfit,
          avgROI: Number(summary._avg.roi || 0),
          avgProfitMargin: Number(summary._avg.profit_margin || 0),
          avgCostRatio: Number(summary._avg.cost_ratio || 0)
        },
        overallMetrics: {
          overallProfitMargin,
          overallCostRatio,
          overallROI
        },
        realTimeData: {
          todayRevenue: Number(todayRevenue._sum.totalAmount || 0),
          todayPlatformFees: Number(todayPlatformFees._sum.platformFee || 0),
          date: todayStr
        }
      }
    });
    } catch (error: any) {
      console.error('获取利润分析数据失败:', error);
      return NextResponse.json({
        success: false,
        error: '获取利润分析数据失败'
      }, { status: 500 });
    }
  })(request);
}

// POST - 创建或更新利润分析数据
export async function POST(request: NextRequest) {
  return withWritePermission(async (request, admin) => {
    try {

    const body = await request.json();
    const {
      productId,
      date,
      revenue,
      productCost,
      platformFee,
      operationCost
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

    // 计算利润指标
    const revenue_amount = revenue || 0;
    const product_cost = productCost || 0;
    const platform_fee = platformFee || 0;
    const operation_cost = operationCost || 0;

    const grossProfit = revenue_amount - product_cost;
    const netProfit = grossProfit - platform_fee - operation_cost;
    const profitMargin = revenue_amount > 0 ? (netProfit / revenue_amount) * 100 : 0;
    const costRatio = revenue_amount > 0 ? ((product_cost + platform_fee + operation_cost) / revenue_amount) * 100 : 0;
    const roi = product_cost > 0 ? ((netProfit - operation_cost) / product_cost) * 100 : 0;

    // 创建或更新数据
    const profitData = await prisma.profitAnalysis.upsert({
      where: {
        product_id_date: {
          product_id: productId,
          date: new Date(date)
        }
      },
      create: {
        product_id: productId,
        date: new Date(date),
        revenue: revenue_amount,
        product_cost: product_cost,
        platform_fee: platform_fee,
        operation_cost: operation_cost,
        gross_profit: grossProfit,
        net_profit: netProfit,
        roi: roi,
        profit_margin: profitMargin,
        cost_ratio: costRatio
      },
      update: {
        revenue: revenue_amount,
        product_cost: product_cost,
        platform_fee: platform_fee,
        operation_cost: operation_cost,
        gross_profit: grossProfit,
        net_profit: netProfit,
        roi: roi,
        profit_margin: profitMargin,
        cost_ratio: costRatio,
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        profitData: {
          id: profitData.id,
          productId: profitData.product_id,
          date: profitData.date.toISOString().split('T')[0],
          revenue: Number(profitData.revenue),
          productCost: Number(profitData.product_cost),
          platformFee: Number(profitData.platform_fee),
          operationCost: Number(profitData.operation_cost),
          grossProfit: Number(profitData.gross_profit),
          netProfit: Number(profitData.net_profit),
          roi: Number(profitData.roi),
          profitMargin: Number(profitData.profit_margin),
          costRatio: Number(profitData.cost_ratio)
        },
        message: '利润分析数据保存成功'
      }
    });
    } catch (error: any) {
      console.error('保存利润分析数据失败:', error);
      return NextResponse.json({
        success: false,
        error: '保存利润分析数据失败'
      }, { status: 500 });
    }
  })(request);
}

// PUT - 批量更新利润数据
export async function PUT(request: NextRequest) {
  return withWritePermission(async (request, admin) => {
    try {

    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({
        success: false,
        error: '缺少更新数据'
      }, { status: 400 });
    }

    const results = [];

    // 批量处理
    for (const update of updates) {
      try {
        const {
          productId,
          date,
          revenue,
          productCost,
          platformFee,
          operationCost
        } = update;

        if (!productId || !date) {
          results.push({
            productId,
            success: false,
            error: '缺少必填字段'
          });
          continue;
        }

        // 检查商品是否存在
        const product = await prisma.products.findUnique({
          where: { id: productId }
        });

        if (!product) {
          results.push({
            productId,
            success: false,
            error: '商品不存在'
          });
          continue;
        }

        // 计算利润指标
        const revenue_amount = revenue || 0;
        const product_cost = productCost || 0;
        const platform_fee = platformFee || 0;
        const operation_cost = operationCost || 0;

        const grossProfit = revenue_amount - product_cost;
        const netProfit = grossProfit - platform_fee - operation_cost;
        const profitMargin = revenue_amount > 0 ? (netProfit / revenue_amount) * 100 : 0;
        const costRatio = revenue_amount > 0 ? ((product_cost + platform_fee + operation_cost) / revenue_amount) * 100 : 0;
        const roi = product_cost > 0 ? ((netProfit - operation_cost) / product_cost) * 100 : 0;

        // 更新数据
        await prisma.profitAnalysis.upsert({
          where: {
            product_id_date: {
              product_id: productId,
              date: new Date(date)
            }
          },
          create: {
            product_id: productId,
            date: new Date(date),
            revenue: revenue_amount,
            product_cost: product_cost,
            platform_fee: platform_fee,
            operation_cost: operation_cost,
            gross_profit: grossProfit,
            net_profit: netProfit,
            roi: roi,
            profit_margin: profitMargin,
            cost_ratio: costRatio
          },
          update: {
            revenue: revenue_amount,
            product_cost: product_cost,
            platform_fee: platform_fee,
            operation_cost: operation_cost,
            gross_profit: grossProfit,
            net_profit: netProfit,
            roi: roi,
            profit_margin: profitMargin,
            cost_ratio: costRatio,
            updated_at: new Date()
          }
        });

        results.push({
          productId,
          success: true,
          message: '更新成功'
        });
      } catch (error: any) {
        results.push({
          productId: update.productId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: results.length - successCount
        },
        message: `批量更新完成，成功 ${successCount} 条，失败 ${results.length - successCount} 条`
      }
    });
    } catch (error: any) {
      console.error('批量更新利润数据失败:', error);
      return NextResponse.json({
        success: false,
        error: '批量更新利润数据失败'
      }, { status: 500 });
    }
  })(request);
}
}