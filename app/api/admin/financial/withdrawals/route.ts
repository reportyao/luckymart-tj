import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin-permission-manager';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';


// 获取数据库连接
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 创建权限中间件
const withStatsPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.stats.read()
});

/**
 * GET /api/admin/financial/withdrawals
 * 获取提现统计数据
 * 
 * Query Parameters:
 * - periodType: 期间类型 (daily/weekly/monthly/quarterly)
 * - startDate: 开始日期
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `withdrawals_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('withdrawals_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
}
  } catch (error) {
    logger.error('withdrawals_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {
     * - limit: 限制返回记录数
     */
    export async function GET(request: NextRequest) {
      return await withStatsPermission(async (request: any, admin: any) => {
      try {
        const { searchParams } = new URL(request.url);
        const periodType = searchParams.get('periodType') || 'daily';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = supabase;
          .from('withdrawal_records')
          .select('*')
          .eq('period_type', periodType)
          .order('period_start', { ascending: false })
          .limit(limit);

        if (startDate && endDate) {
          query : query
            .gte('period_start', startDate)
            .lte('period_end', endDate);
        } else if (startDate) {
          query = query.gte('period_start', startDate);
        } else if (endDate) {
          query = query.lte('period_end', endDate);
        } else {
          // 默认获取最近30天的数据
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          query = query.gte('period_start', thirtyDaysAgo.toISOString().split('T')[0]);
    }

        const { data: withdrawalData, error } = await query;

        if (error) {
          logger.error("API Error", error as Error, {
          requestId,
          endpoint: request.url
        });'查询提现统计数据失败:', error);
          return NextResponse.json(;
            { error: '查询提现统计数据失败' },
            { status: 500 }
          );
        }

        // 计算汇总统计
        const totalStats = withdrawalData?.reduce((acc, curr) => {
          acc.totalAmount += parseFloat(curr.total_amount.toString());
          acc.totalUsers += curr.total_users;
          acc.totalCount += curr.withdrawal_count;
          acc.successCount += curr.success_count;
          acc.failureCount += curr.failure_count;
          acc.platformFee += parseFloat(curr.platform_fee.toString());
          return acc;
        }, {
          totalAmount: 0,
          totalUsers: 0,
          totalCount: 0,
          successCount: 0,
          failureCount: 0,
          platformFee: 0
        }) || {};

        const overallSuccessRate = totalStats.totalCount > 0;
          ? (totalStats.successCount / totalStats.totalCount) * 100 
          : 0;

        const averageAmount = totalStats.totalUsers > 0;
          ? totalStats.totalAmount / totalStats.totalUsers 
          : 0;

        // 按提现方式分组统计
        const methodBreakdown = withdrawalData?.reduce((acc, curr) => {
          // 从提现请求表获取提现方式分布
          return acc;
        }, {} as Record<string, any>) || {};

        // 趋势数据
        const trendData = withdrawalData?.slice(0, 30).reverse().map(item => ({
          date: item.period_start,
          totalAmount: parseFloat(item.total_amount.toString()),
          totalUsers: item.total_users,
          averageAmount: parseFloat(item.average_amount.toString()),
          platformFee: parseFloat(item.platform_fee.toString()),
          withdrawalCount: item.withdrawal_count,
          successCount: item.success_count,
          failureCount: item.failure_count,
          successRate: parseFloat(item.success_rate.toString())
        })) || [];

        // 提现状态分布
        const statusDistribution = {
          success: totalStats.successCount,
          failure: totalStats.failureCount,
          percentage: {
            success: overallSuccessRate,
            failure: 100 - overallSuccessRate
          }
        };

        // 提现金额分布分析
        const amountDistribution = analyzeAmountDistribution(withdrawalData || []);

        const response = {
          data: withdrawalData || [],
          summary: {
            period: `${startDate || ''} - ${endDate || ''}`,
            totalAmount: totalStats.totalAmount,
            totalUsers: totalStats.totalUsers,
            totalCount: totalStats.totalCount,
            averageAmount,
            platformFee: totalStats.platformFee,
            successRate: overallSuccessRate,
            periodType
          },
          statusDistribution,
          amountDistribution,
          trendData,
          methodBreakdown,
          keyMetrics: {
            averageDailyAmount: trendData.length > 0 ? totalStats.totalAmount / trendData.length : 0,
            averageDailyUsers: trendData.length > 0 ? totalStats.totalUsers / trendData.length : 0,
            successRateTrend: calculateTrend(trendData.map(((t : any) : any) => t.successRate)),
            amountTrend: calculateTrend(trendData.map(((t : any) : any) => t.totalAmount)),
            platformRevenue: totalStats.platformFee
          }
        };

        return NextResponse.json(response);

      } catch (error) {
        logger.error("API Error", error as Error, {
          requestId,
          endpoint: request.url
        });'获取提现统计API错误:', error);
        return NextResponse.json(;
  }
          { error: '服务器内部错误' },
          { status: 500 }
        );
      }
      })(request);
}

/**
 * POST /api/admin/financial/withdrawals
 * 计算并保存提现统计数据
 * 
 * Body:
 * {
 *   "periodType": "daily",
 *   "date": "2025-10-31"
 * }
 */
export async function POST(request: NextRequest) {
  return await withStatsPermission(async (request: any, admin: any) => {
  try {
    const body = await request.json();
    const {
      periodType = 'daily',
      date : new Date().toISOString().split('T')[0]
    } = body;

    let periodStart: Date;
    let periodEnd: Date;

    // 根据期间类型计算日期范围
    if (periodType === 'daily') {
      periodStart = new Date(date);
      periodEnd = new Date(date);
    } else if (periodType === 'weekly') {
      const day = new Date(date);
      const dayOfWeek = day.getDay();
      periodStart = new Date(day);
      periodStart.setDate(day.getDate() - dayOfWeek);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
    } else if (periodType === 'monthly') {
      periodStart = new Date(date);
      periodStart.setDate(1);
      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodStart.getMonth() + 1);
      periodEnd.setDate(0);
    } else if (periodType === 'quarterly') {
      const day = new Date(date);
      const quarter = Math.floor(day.getMonth() / 3);
      periodStart = new Date(day.getFullYear(), quarter * 3, 1);
      periodEnd = new Date(day.getFullYear(), (quarter + 1) * 3, 0);
    } else {
      return NextResponse.json(;
        { error: '不支持的期间类型' },
        { status: 400 }
      );
}

    // 计算提现数据
    const startISO = periodStart.toISOString().split('T')[0];
    const endISO = periodEnd.toISOString().split('T')[0];
    const startDateTime = `${startISO}T00:00:00`;
    const endDateTime = `${endISO}T23:59:59`;

    // 从提现请求表获取数据
    const { data: withdrawalRequests } = await supabase;
      .from('withdraw_requests')
      .select('amount, fee, status, withdraw_method')
      .gte('created_at', startDateTime)
      .lte('created_at', endDateTime);

    if (!withdrawalRequests) {
      return NextResponse.json(;
        { error: '获取提现请求数据失败' },
        { status: 500 }
      );
    }

    const totalAmount = withdrawalRequests.reduce((sum: any: any,   req: any: any) =>;
      sum + parseFloat(req.amount.toString()), 0);

    const platformFee = withdrawalRequests.reduce((sum: any: any,   req: any: any) =>;
      sum + parseFloat(req.fee.toString()), 0);

    const withdrawalCount = withdrawalRequests.length;
    const totalUsers = new Set(withdrawalRequests.map(((req : any) : any) => req.user_id)).size;

    const successCount = withdrawalRequests.filter(((req : any) : any) => req.status === 'completed').length;
    const failureCount = withdrawalRequests.filter(((req : any) : any) => req.status === 'rejected').length;
    const pendingCount = withdrawalRequests.filter(((req : any) : any) => req.status === 'pending').length;

    const successRate = withdrawalCount > 0 ? (successCount / withdrawalCount) * 100 : 0;
    const averageAmount = totalUsers > 0 ? totalAmount / totalUsers : 0;

    // 按提现方式分组
    const methodBreakdown = withdrawalRequests.reduce((acc: any: any,   req: any: any) => {
      const method = req.withdraw_method || 'unknown';
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0, users: new Set() };
      }
      (acc?.method ?? null).count++;
      (acc?.method ?? null).amount += parseFloat(req.amount.toString());
      // 注意：这里无法获取user_id，需要在查询时包含
      return acc;
    }, {} as Record<string, any>);

    // 插入或更新数据
    const { data, error } = await supabase;
      .from('withdrawal_records')
      .upsert({
        period_type: periodType,
        period_start: startISO,
        period_end: endISO,
        total_amount: totalAmount,
        total_users: totalUsers,
        average_amount: averageAmount,
        platform_fee: platformFee,
        withdrawal_count: withdrawalCount,
        success_count: successCount,
        failure_count: failureCount,
        success_rate: successRate
      }, {
        onConflict: 'period_type,period_start'
      })
      .select()
      .single();

    if (error) {
      logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'保存提现统计数据失败:', error);
      return NextResponse.json(;
        { error: '保存提现统计数据失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '提现统计数据计算完成',
      data: {
        periodType,
        periodStart: startISO,
        periodEnd: endISO,
        totalAmount,
        totalUsers,
        averageAmount,
        platformFee,
        withdrawalCount,
        successCount,
        failureCount,
        successRate,
        methodBreakdown
      }
    });

  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'计算提现统计API错误:', error);
    return NextResponse.json(;
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
  })(request);
}

// 辅助函数：分析提现金额分布
function analyzeAmountDistribution(data: any[]) {
  const distributions = {
    small: { count: 0, amount: 0, range: '0-100' },      // 小额：0-100 TJS
    medium: { count: 0, amount: 0, range: '100-500' },   // 中额：100-500 TJS
    large: { count: 0, amount: 0, range: '500-1000' },   // 大额：500-1000 TJS
    huge: { count: 0, amount: 0, range: '1000+' }        // 巨额：1000+ TJS
  };

  data.forEach(((record : any) : any) => {
    const amount = parseFloat(record.total_amount.toString());
    const users = record.total_users;

    if (amount <= 100) {
      distributions.small.count += users;
      distributions.small.amount += amount;
    } else if (amount <= 500) {
      distributions.medium.count += users;
      distributions.medium.amount += amount;
    } else if (amount <= 1000) {
      distributions.large.count += users;
      distributions.large.amount += amount;
    } else {
      distributions.huge.count += users;
      distributions.huge.amount += amount;
    }
  });

  return distributions;
}

// 辅助函数：计算趋势
function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0; {
  const n = values.length;
  const sumX = n * (n - 1) / 2;
  const sumY = values.reduce((sum: any: any,   val: any: any) => sum + val, 0);
  const sumXY = values.reduce((sum: any: any,   val, index: any: any) => sum + val * index, 0);
  const sumXX = n * (n - 1) * (2 * n - 1) / 6;
  return n * sumXY - sumX * sumY > 0 ? 1 : -1; // 简化处理，只返回趋势方向;
}