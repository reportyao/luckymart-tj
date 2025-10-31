import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';
import { getLogger } from '@/lib/logger';

import { AdminPermissionManager } from '@/lib/admin/permissions/AdminPermissionManager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';


const withReadPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.users.read()
});

const withWritePermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.users.write()
});

// GET - 获取用户消费行为分析
export async function GET(request: NextRequest) {
  return withReadPermission(async (request, admin) => {
    const logger = getLogger();

    try {

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const analysisType = searchParams.get('analysisType') || 'overview'; // 'overview', 'user', 'segments'
    const spendingSegment = searchParams.get('spendingSegment'); // 'low', 'medium', 'high', 'vip'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'total_spent';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 根据分析类型返回不同数据
    switch (analysisType) {
      case 'user':
        return await getUserSpendingAnalysis(admin, userId);
      case 'segments':
        return await getSpendingSegmentsAnalysis(admin, spendingSegment, startDate, endDate, sortBy, sortOrder, limit, offset);
      default:
        return await getSpendingOverview(admin, startDate, endDate);
    }

    } catch (error: any) {
      logger.error('获取用户消费行为分析失败', error as Error);
      return NextResponse.json({
        success: false,
        error: error.message || '获取用户消费行为分析失败'
      }, { status: 500 });
    }
  })(request);
}

// POST - 更新用户消费分析
export async function POST(request: NextRequest) {
  return withWritePermission(async (request, admin) => {
    const logger = getLogger();

    try {
    const body = await request.json();
    const { userId } = body;

    // 验证必需参数
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '缺少必需参数：userId'
      }, { status: 400 });
    }

    // 验证用户是否存在
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, createdAt: true, totalSpent: true }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '用户不存在'
      }, { status: 404 });
    }

    // 计算消费数据
    const spendingData = await calculateUserSpendingData(userId);

    // 更新或创建消费分析记录
    const spendingAnalysis = await prisma.spendingAnalysis.upsert({
      where: { user_id: userId },
      update: {
        ...spendingData,
        updatedAt: new Date()
      },
      create: {
        userId,
        registrationDate: user.createdAt,
        ...spendingData
      }
    });

    logger.info('用户消费分析更新成功', {
      userId,
      totalSpent: spendingData.totalSpent,
      clv: spendingData.customerLifetimeValue,
      segment: spendingData.spendingSegment,
      analysisId: spendingAnalysis.id
    });

    return NextResponse.json({
      success: true,
      data: spendingAnalysis,
      message: '消费分析更新成功'
    });

    } catch (error: any) {
      logger.error('更新用户消费分析失败', error as Error);
      return NextResponse.json({
        success: false,
        error: error.message || '更新用户消费分析失败'
      }, { status: 500 });
    }
  })(request);
}

/**
 * 获取消费概览
 */
async function getSpendingOverview(admin: any, startDate?: string | null, endDate?: string | null) {
  const { searchParams } = new URL(admin.url);

  // 构建日期过滤条件
  const dateFilter = buildSpendingDateFilter(startDate, endDate);

  // 获取总体消费统计
  const overallStats = await getOverallSpendingStats(dateFilter);

  // 获取消费趋势
  const spendingTrends = await getSpendingTrends(dateFilter);

  // 获取消费分群统计
  const segmentStats = await getSpendingSegmentStats(dateFilter);

  // 获取RFM分析
  const rfmAnalysis = await getRFMAnalysis(dateFilter);

  // 获取高价值客户
  const highValueCustomers = await getHighValueCustomers();

  return NextResponse.json({
    success: true,
    data: {
      overview: overallStats,
      trends: spendingTrends,
      segments: segmentStats,
      rfmAnalysis,
      highValueCustomers
    }
  });
}

/**
 * 获取单个用户消费分析
 */
async function getUserSpendingAnalysis(admin: any, userId?: string | null) {
  if (!userId) {
    return NextResponse.json({
      success: false,
      error: '缺少用户ID参数'
    }, { status: 400 });
  }

  const userSpending = await prisma.spendingAnalysis.findUnique({
    where: { userId },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          username: true,
          telegramId: true,
          vipLevel: true,
          totalSpent: true,
          luckyCoins: true
        }
      }
    }
  });

  if (!userSpending) {
    return NextResponse.json({
      success: false,
      error: '用户消费分析数据不存在'
    }, { status: 404 });
  }

  // 获取用户交易历史
  const transactionHistory = await prisma.walletTransactions.findMany({
    where: { userId },
    orderBy: { created_at: 'desc' },
    take: 50
  });

  // 获取订单历史
  const orderHistory = await prisma.orders.findMany({
    where: { userId },
    orderBy: { created_at: 'desc' },
    take: 20,
    include: {
      products: {
        select: {
          nameZh: true,
          nameEn: true,
          nameRu: true
        }
      }
    }
  });

  // 获取消费时间线
  const spendingTimeline = await getSpendingTimeline(userId);

  return NextResponse.json({
    success: true,
    data: {
      userSpending,
      transactionHistory,
      orderHistory,
      spendingTimeline
    }
  });
}

/**
 * 获取消费分群分析
 */
async function getSpendingSegmentsAnalysis(
  admin: any,
  spendingSegment?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  sortBy?: string,
  sortOrder?: string,
  limit?: number,
  offset?: number
) {
  const { searchParams } = new URL(admin.url);
  const dateFilter = buildSpendingDateFilter(startDate, endDate);

  // 构建查询条件
  const whereConditions: any = {
    ...dateFilter
  };

  if (spendingSegment) {
    whereConditions.spending_segment = spendingSegment;
  }

  // 获取分群用户数据
  const [segmentUsers, totalCount] = await Promise.all([
    prisma.spendingAnalysis.findMany({
      where: whereConditions,
      orderBy: {
        [sortBy || 'total_spent']: (sortOrder || 'desc') as 'asc' | 'desc'
      },
      take: limit || 50,
      skip: offset || 0,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            username: true,
            telegramId: true,
            vipLevel: true
          }
        }
      }
    }),
    prisma.spendingAnalysis.count({ where: whereConditions })
  ]);

  // 获取分群统计信息
  const segmentStats = await getSegmentStatistics(spendingSegment);

  return NextResponse.json({
    success: true,
    data: {
      segmentUsers,
      pagination: {
        total: totalCount,
        limit: limit || 50,
        offset: offset || 0,
        hasMore: (offset || 0) + (limit || 50) < totalCount
      },
      segmentStats
    }
  });
}

/**
 * 计算用户消费数据
 */
async function calculateUserSpendingData(userId: string) {
  // 获取用户基本信息和交易数据
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      createdAt: true,
      totalSpent: true
    }
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  // 获取订单数据
  const orders = await prisma.orders.findMany({
    where: { 
      userId,
      paymentStatus: 'completed'
    },
    select: {
      id: true,
      totalAmount: true,
      status: true,
      createdAt: true,
      type: true
    },
    orderBy: { created_at: 'asc' }
  });

  // 获取充值数据
  const recharges = await prisma.walletTransactions.findMany({
    where: {
      userId,
      type: 'recharge'
    },
    select: {
      amount: true,
      createdAt: true
    },
    orderBy: { created_at: 'asc' }
  });

  // 计算各种指标
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
  const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount.toString()), 0);
  const totalRechargeAmount = recharges.reduce((sum, recharge) => sum + parseFloat(recharge.amount?.toString() || '0'), 0);

  // 计算首次和最后购买日期
  const firstPurchaseDate = orders.length > 0 ? orders[0].createdAt : null;
  const lastPurchaseDate = orders.length > 0 ? orders[orders.length - 1].createdAt : null;

  // 计算平均订单价值
  const averageOrderValue = completedOrders > 0 ? totalSpent / completedOrders : 0;

  // 计算购买频率
  let purchaseFrequencyDays = null;
  if (orders.length > 1 && firstPurchaseDate && lastPurchaseDate) {
    const timeDiff = lastPurchaseDate.getTime() - firstPurchaseDate.getTime();
    purchaseFrequencyDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * (orders.length - 1)));
  }

  // 计算距离最后购买天数
  const daysSinceLastPurchase = lastPurchaseDate 
    ? Math.floor((Date.now() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // 计算客户生命周期价值（简化版）
  const customerLifetimeValue = calculateCLV(
    totalSpent,
    averageOrderValue,
    purchaseFrequencyDays || 30,
    user.createdAt
  );

  // 判断高价值客户
  const highValueCustomer = totalSpent >= 1000; // 消费超过1000为高价值客户

  // 分配消费分群
  const spendingSegment = determineSpendingSegment(totalSpent, totalOrders, averageOrderValue);

  // 计算流失风险评分
  const churnRiskScore = calculateChurnRisk(
    daysSinceLastPurchase || 0,
    0, // 这里可以后续添加参与度数据
    customerLifetimeValue
  );

  // 最后充值金额
  const lastRechargeAmount = recharges.length > 0 
    ? parseFloat(recharges[recharges.length - 1].amount?.toString() || '0')
    : 0;

  return {
    firstPurchaseDate,
    lastPurchaseDate,
    totalTransactions: orders.length,
    totalSpent,
    totalOrders,
    completedOrders,
    cancelledOrders,
    averageOrderValue,
    customerLifetimeValue,
    purchaseFrequencyDays,
    daysSinceLastPurchase: daysSinceLastPurchase || 0,
    highValueCustomer,
    spendingSegment,
    churnRiskScore,
    lastRechargeAmount,
    totalRechargeAmount
  };
}

/**
 * 计算客户生命周期价值
 */
function calculateCLV(
  totalSpent: number,
  averageOrderValue: number,
  purchaseFrequencyDays: number,
  registrationDate: Date
): number {
  // 如果没有购买数据，返回0
  if (totalSpent === 0 || averageOrderValue === 0) {
    return 0;
  }

  // 计算客户生命周期（天数）
  const customerLifespanDays = Math.floor(
    (Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 简化的CLV计算
  // CLV = (平均订单价值 * 购买频率 * 客户生命周期) / 365
  const annualPurchaseFrequency = 365 / purchaseFrequencyDays;
  const projectedLifetimeValue = averageOrderValue * annualPurchaseFrequency * (customerLifespanDays / 365);

  return Math.max(totalSpent, projectedLifetimeValue);
}

/**
 * 分配消费分群
 */
function determineSpendingSegment(
  totalSpent: number,
  totalOrders: number,
  averageOrderValue: number
): string {
  if (totalSpent >= 5000 || totalOrders >= 50) {
    return 'vip';
  } else if (totalSpent >= 1000 || totalOrders >= 10) {
    return 'high';
  } else if (totalSpent >= 200 || totalOrders >= 3) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * 计算流失风险评分
 */
function calculateChurnRisk(
  daysSinceLastPurchase: number,
  engagementScore: number,
  customerLifetimeValue: number
): number {
  let riskScore = 0;

  // 基于最后购买时间的风险
  if (daysSinceLastPurchase > 90) {
    riskScore += 60;
  } else if (daysSinceLastPurchase > 30) {
    riskScore += 40;
  } else if (daysSinceLastPurchase > 14) {
    riskScore += 20;
  }

  // 基于客户价值的反向风险（高价值客户风险较低）
  if (customerLifetimeValue < 100) {
    riskScore += 20;
  }

  return Math.min(riskScore, 100);
}

/**
 * 构建消费分析的日期过滤条件
 */
function buildSpendingDateFilter(startDate?: string | null, endDate?: string | null) {
  const filter: any = {};
  
  if (startDate && endDate) {
    filter.registration_date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  } else if (startDate) {
    filter.registration_date = { gte: new Date(startDate) };
  } else if (endDate) {
    filter.registration_date = { lte: new Date(endDate) };
  }

  return filter;
}

/**
 * 获取总体消费统计
 */
async function getOverallSpendingStats(dateFilter: any) {
  const stats = await prisma.spendingAnalysis.aggregate({
    where: dateFilter,
    _count: { _all: true },
    _avg: {
      totalSpent: true,
      averageOrderValue: true,
      customerLifetimeValue: true,
      totalOrders: true
    },
    _max: {
      totalSpent: true,
      customerLifetimeValue: true
    },
    _sum: {
      totalSpent: true
    }
  });

  const totalUsers = stats._count._all || 0;
  const totalRevenue = parseFloat(stats._sum.totalSpent?.toString() || '0');

  return {
    totalUsers,
    totalRevenue,
    averageSpentPerUser: totalUsers > 0 ? parseFloat((totalRevenue / totalUsers).toFixed(2)) : 0,
    averageOrderValue: parseFloat(stats._avg.averageOrderValue?.toFixed(2) || '0'),
    averageCLV: parseFloat(stats._avg.customerLifetimeValue?.toFixed(2) || '0'),
    maxSpent: parseFloat(stats._max.totalSpent?.toString() || '0'),
    maxCLV: parseFloat(stats._max.customerLifetimeValue?.toString() || '0'),
    averageOrdersPerUser: parseFloat(stats._avg.totalOrders?.toFixed(2) || '0')
  };
}

/**
 * 获取消费趋势
 */
async function getSpendingTrends(dateFilter: any) {
  const trends = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', registration_date) as month,
      COUNT(*) as new_users,
      SUM(total_spent) as total_revenue,
      AVG(total_spent) as avg_spent_per_user,
      AVG(customer_lifetime_value) as avg_clv,
      COUNT(CASE WHEN spending_segment = 'high' OR spending_segment = 'vip' THEN 1 END) as high_value_users
    FROM spending_analysis
    WHERE registration_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', registration_date)
    ORDER BY month DESC
    LIMIT 12
  `;

  return trends;
}

/**
 * 获取消费分群统计
 */
async function getSpendingSegmentStats(dateFilter: any) {
  const segmentStats = await prisma.$queryRaw`
    SELECT 
      spending_segment,
      COUNT(*) as user_count,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
      ROUND(AVG(total_spent), 2) as avg_spent,
      ROUND(AVG(customer_lifetime_value), 2) as avg_clv,
      ROUND(AVG(total_orders), 2) as avg_orders,
      ROUND(SUM(total_spent), 2) as total_revenue
    FROM spending_analysis
    WHERE spending_segment IS NOT NULL
    GROUP BY spending_segment
    ORDER BY 
      CASE spending_segment
        WHEN 'vip' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END
  `;

  return segmentStats;
}

/**
 * 获取RFM分析
 */
async function getRFMAnalysis(dateFilter: any) {
  const rfmData = await prisma.$queryRaw`
    SELECT 
      CASE 
        WHEN days_since_last_purchase <= 30 THEN 'R1'
        WHEN days_since_last_purchase <= 60 THEN 'R2'
        WHEN days_since_last_purchase <= 90 THEN 'R3'
        ELSE 'R4'
      END as recency,
      CASE 
        WHEN total_orders >= 10 THEN 'F1'
        WHEN total_orders >= 5 THEN 'F2'
        WHEN total_orders >= 2 THEN 'F3'
        ELSE 'F4'
      END as frequency,
      CASE 
        WHEN total_spent >= 1000 THEN 'M1'
        WHEN total_spent >= 500 THEN 'M2'
        WHEN total_spent >= 100 THEN 'M3'
        ELSE 'M4'
      END as monetary,
      COUNT(*) as user_count,
      ROUND(AVG(total_spent), 2) as avg_spent
    FROM spending_analysis
    WHERE total_spent > 0
    GROUP BY recency, frequency, monetary
    ORDER BY user_count DESC
  `;

  return rfmData;
}

/**
 * 获取高价值客户
 */
async function getHighValueCustomers() {
  const highValueCustomers = await prisma.spendingAnalysis.findMany({
    where: {
      highValueCustomer: true
    },
    orderBy: {
      customerLifetimeValue: 'desc'
    },
    take: 20,
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          username: true,
          telegramId: true,
          vipLevel: true
        }
      }
    }
  });

  return highValueCustomers;
}

/**
 * 获取分群统计信息
 */
async function getSegmentStatistics(spendingSegment?: string | null) {
  if (!spendingSegment) {
    return null;
  }

  const stats = await prisma.spendingAnalysis.aggregate({
    where: { spendingSegment },
    _count: { _all: true },
    _avg: {
      totalSpent: true,
      customerLifetimeValue: true,
      churnRiskScore: true
    }
  });

  return {
    totalUsers: stats._count._all || 0,
    averageSpent: parseFloat(stats._avg.totalSpent?.toFixed(2) || '0'),
    averageCLV: parseFloat(stats._avg.customerLifetimeValue?.toFixed(2) || '0'),
    averageChurnRisk: parseFloat(stats._avg.churnRiskScore?.toFixed(2) || '0')
  };
}

/**
 * 获取消费时间线
 */
async function getSpendingTimeline(userId: string) {
  const timeline = await prisma.$queryRaw`
    SELECT 
      DATE(created_at) as date,
      type,
      SUM(COALESCE(amount, 0)) as daily_amount,
      COUNT(*) as transaction_count
    FROM wallet_transactions
    WHERE user_id = $1 
      AND type IN ('recharge', 'purchase', 'transfer_in', 'transfer_out')
      AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(created_at), type
    ORDER BY date DESC, type
  `, userId);

  return timeline;
}