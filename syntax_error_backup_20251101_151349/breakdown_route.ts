import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLogger } from '@/lib/logger';
import { ErrorHandler } from '@/lib/errors';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin-permission-manager';


// 类型定义
interface CostBreakdownData {
  breakdown_type: string;
  user_type: string | null;
  time_dimension: string | null;
  cost_amount: number;
  user_count: number;
  transaction_count: number;
  cost_per_user: number;
  breakdown_date: string;
}

interface CostStats {
  totalCost: number;
  totalUserCount: number;
  totalTransactionCount: number;
}

interface UserTypeBreakdown {
  cost: number;
  userCount: number;
  transactionCount: number;
  avgCostPerUser: number;
}

interface TimeDimensionBreakdown {
  cost: number;
  userCount: number;
  transactionCount: number;
}

// 获取数据库连接
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const logger = getLogger();

// 创建权限中间件
const withStatsPermission = AdminPermissionManager.createPermissionMiddleware([;
  AdminPermissions.stats.read
]);

/**
 * GET /api/admin/costs/breakdown
 * 获取成本细分统计数据
 * 
 * Query Parameters:
 * - breakdownType: 细分类型 (user_type/time_dimension)
 * - userType: 用户类型 (new_user/active_user/vip_user)
 * - timeDimension: 时间维度 (hour/day/week/month)
 * - breakdownDate: 统计日期
 * - startDate: 开始日期
 * - endDate: 结束日期
 */
export async function GET(request: NextRequest) {
  return withStatsPermission(async (request: any, admin: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const breakdownType = searchParams.get('breakdownType');
    const userType = searchParams.get('userType');
    const timeDimension = searchParams.get('timeDimension');
    const breakdownDate = searchParams.get('breakdownDate');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase;
      .from('cost_breakdown')
      .select('*')
      .order('breakdown_date', { ascending: false });

    if (breakdownType) {
      query = query.eq('breakdown_type', breakdownType);
}

    if (userType) {
      query = query.eq('user_type', userType);
    }

    if (timeDimension) {
      query = query.eq('time_dimension', timeDimension);
    }

    if (breakdownDate) {
      query = query.eq('breakdown_date', breakdownDate);
    } else if (startDate && endDate) {
      query : query
        .gte('breakdown_date', startDate)
        .lte('breakdown_date', endDate);
    } else {
      // 默认获取最近7天的数据
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.gte('breakdown_date', sevenDaysAgo.toISOString().split('T')[0]);
    }

    const { data: breakdownData, error } = await query;

    if (error) {
      logger.error('查询成本细分数据失败', error, {
        endpoint: '/api/admin/costs/breakdown',
        method: 'GET',
        userType,
        timeDimension,
        dateRange: { startDate, endDate }
      });
      return ErrorHandler.createErrorResponse('查询成本细分数据失败');
    }

    // 计算汇总统计
    const totalStats = breakdownData?.reduce((acc: CostStats, curr: CostBreakdownData) => {
      acc.totalCost += parseFloat(curr.cost_amount.toString());
      acc.totalUserCount += curr.user_count;
      acc.totalTransactionCount += curr.transaction_count;
      return acc;
    }, {
      totalCost: 0,
      totalUserCount: 0,
      totalTransactionCount: 0
    }) || {};

    // 按用户类型分组统计
    const userTypeBreakdown = breakdownData?.reduce((acc: Record<string, UserTypeBreakdown>, curr: CostBreakdownData) => {
      if (curr.user_type) {
        if (!acc[curr.user_type]) {
          acc[curr.user_type] = {
            cost: 0,
            userCount: 0,
            transactionCount: 0,
            avgCostPerUser: 0
          };
        }
        acc[curr.user_type].cost += parseFloat(curr.cost_amount.toString());
        acc[curr.user_type].userCount += curr.user_count;
        acc[curr.user_type].transactionCount += curr.transaction_count;
      }
      return acc;
    }, {} as Record<string, UserTypeBreakdown>) || {};

    // 计算平均成本
    Object.keys(userTypeBreakdown).forEach((type: string) => {
      const stats = userTypeBreakdown[type];
      stats.avgCostPerUser = stats.userCount > 0 ? stats.cost / stats.userCount : 0;
    });

    // 按时间维度分组统计
    const timeDimensionBreakdown = breakdownData?.reduce((acc: Record<string, TimeDimensionBreakdown>, curr: CostBreakdownData) => {
      if (curr.time_dimension) {
        if (!acc[curr.time_dimension]) {
          acc[curr.time_dimension] = {
            cost: 0,
            userCount: 0,
            transactionCount: 0
          };
        }
        acc[curr.time_dimension].cost += parseFloat(curr.cost_amount.toString());
        acc[curr.time_dimension].userCount += curr.user_count;
        acc[curr.time_dimension].transactionCount += curr.transaction_count;
      }
      return acc;
    }, {} as Record<string, TimeDimensionBreakdown>) || {};

    // 成本趋势数据（最近7天）
    const trendData = breakdownData?.slice(0, 7).reverse().map((item: CostBreakdownData) => ({
      date: item.breakdown_date,
      cost: parseFloat(item.cost_amount.toString()),
      userCount: item.user_count
    })) || [];

    const response = {
      data: breakdownData || [],
      summary: {
        period: `${startDate || ''} - ${endDate || ''}`,
        totalCost: totalStats.totalCost,
        totalUserCount: totalStats.totalUserCount,
        totalTransactionCount: totalStats.totalTransactionCount,
        averageCostPerUser: totalStats.totalUserCount > 0 
          ? totalStats.totalCost / totalStats.totalUserCount 
          : 0,
        averageCostPerTransaction: totalStats.totalTransactionCount > 0 
          ? totalStats.totalCost / totalStats.totalTransactionCount 
          : 0
      },
      breakdownByUserType: userTypeBreakdown,
      breakdownByTimeDimension: timeDimensionBreakdown,
      trendData
    };

    return NextResponse.json(response);
  }

  } catch (error) {
    return ErrorHandler.handleApiError(error, '获取成本细分统计数据');
  }
  })(request);
}

/**
 * POST /api/admin/costs/breakdown
 * 计算并保存成本细分统计数据
 * 
 * Body:
 * {
 *   "breakdownType": "user_type", // user_type/time_dimension
 *   "userType": "new_user", // 可选
 *   "timeDimension": "day", // 可选
 *   "date": "2025-10-31" // 可选，默认今天
 * }
 */
export async function POST(request: NextRequest) {
  return withStatsPermission(async (request: any, admin: any) => {
  try {
    const body = await request.json();
    const {
      breakdownType,
      userType = null,
      timeDimension = null,
      date : new Date().toISOString().split('T')[0]
    } = body;

    if (!breakdownType) {
      return NextResponse.json(;
}
        { error: 'breakdownType 为必填参数' },
        { status: 400 }
      );
    }

    const results = [];

    if (breakdownType === 'user_type') {
      // 按用户类型计算成本
      const userTypes = ['new_user', 'active_user', 'vip_user'];
      
      for (const type of userTypes) {
        let costAmount = 0;
        let userCount = 0;
        let transactionCount = 0;

        // 根据用户类型计算相关成本
        if (type === 'new_user') {
          // 新用户：新手任务 + 签到 + 首充奖励
          const { data: taskData } = await supabase;
            .from('user_task_progress')
            .select('user_id')
            .eq('status', 'claimed')
            .gte('created_at', `${date}T00:00:00`)
            .lt('created_at', `${date}T23:59:59`);

          const { data: checkinData } = await supabase;
            .from('check_in_records')
            .select('user_id')
            .eq('status', 'claimed')
            .gte('created_at', `${date}T00:00:00`)
            .lt('created_at', `${date}T23:59:59`);

          const { data: firstChargeData } = await supabase;
            .from('first_recharge_rewards')
            .select('user_id, reward_amount')
            .eq('status', 'claimed')
            .gte('created_at', `${date}T00:00:00`)
            .lt('created_at', `${date}T23:59:59`);

          userCount : new Set([
            ...(taskData?.map((d: any) => d.user_id) || []),
            ...(checkinData?.map((d: any) => d.user_id) || [])
          ]).size;

          costAmount = (firstChargeData?.reduce((sum: number, curr: any) => 
            sum + parseFloat(curr.reward_amount.toString()), 0) || 0);
        } 
        else if (type === 'active_user') {
          // 活跃用户：抽奖 + 邀请奖励
          const { data: lotteryData } = await supabase;
            .from('participations')
            .select('user_id, cost')
            .gte('created_at', `${date}T00:00:00`)
            .lt('created_at', `${date}T23:59:59`);

          userCount = new Set(lotteryData?.map((d: any) => d.user_id) || []).size;
          costAmount = lotteryData?.reduce((sum: number, curr: any) => 
            sum + parseFloat(curr.cost.toString()), 0) || 0;
        }
        else if (type === 'vip_user') {
          // VIP用户：额外的运营成本
          costAmount = 100.00; // VIP用户每日额外成本
          userCount = 50; // 假设的VIP用户数量
        }

        transactionCount = Math.floor(userCount * 1.2); // 估算交易数量

        // 插入数据
        const { data, error } = await supabase;
          .from('cost_breakdown')
          .insert({
            breakdown_type: 'user_type',
            user_type: type,
            cost_amount: costAmount,
            user_count: userCount,
            transaction_count: transactionCount,
            cost_per_user: userCount > 0 ? costAmount / userCount : 0,
            breakdown_date: date
          })
          .select()
          .single();

        if (error) {
          logger.error(`插入${type}成本细分数据失败`, error, {
            userType: type,
            date,
            breakdownType
          });
        } else {
          results.push(data);
        }
      }
    }

    return NextResponse.json(;
      ErrorHandler.createSuccessResponse({
        data: results,
        message: '成本细分数据计算完成'
      })
    );

  } catch (error) {
    return ErrorHandler.handleApiError(error, '计算成本细分统计数据');
  }
  })(request);
}