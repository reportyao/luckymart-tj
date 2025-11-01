import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin-permission-manager';

// 获取数据库连接
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 创建权限中间件
const withStatsPermission = AdminPermissionManager.createPermissionMiddleware([
  AdminPermissions.stats.read
]);

/**
 * GET /api/admin/financial/costs
 * 获取成本统计数据（整合版本）
 * 
 * Query Parameters:
 * - periodType: 期间类型 (daily/weekly/monthly/quarterly)
 * - costType: 成本类型 (incentive/prize/operation/platform)
 * - startDate: 开始日期
 * - endDate: 结束日期
 * - limit: 限制返回记录数
 */
export async function GET(request: NextRequest) {
  return withStatsPermission(async (request, admin) => {
  try {
    const { searchParams } = new URL(request.url);
    const periodType = searchParams.get('periodType') || 'daily';
    const costType = searchParams.get('costType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    // 从cost_breakdown表获取数据
    let query = supabase
      .from('cost_breakdown')
      .select('*')
      .order('breakdown_date', { ascending: false })
      .limit(limit);

    if (costType) {
      query = query.eq('user_type', costType);
    }

    if (startDate && endDate) {
      query = query
        .gte('breakdown_date', startDate)
        .lte('breakdown_date', endDate);
    } else {
      // 默认获取最近30天的数据
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('breakdown_date', thirtyDaysAgo.toISOString().split('T')[0]);
    }

    const { data: costData, error } = await query;

    if (error) {
      console.error('查询成本统计数据失败:', error);
      return NextResponse.json(
        { error: '查询成本统计数据失败' },
        { status: 500 }
      );
    }

    // 计算汇总统计
    const totalStats = costData?.reduce((acc, curr) => {
      acc.totalCost += parseFloat(curr.cost_amount.toString());
      acc.totalUserCount += curr.user_count;
      acc.totalTransactionCount += curr.transaction_count;
      return acc;
    }, {
      totalCost: 0,
      totalUserCount: 0,
      totalTransactionCount: 0
    }) || {};

    const averageCostPerUser = totalStats.totalUserCount > 0 
      ? totalStats.totalCost / totalStats.totalUserCount 
      : 0;

    // 按成本类型分组统计
    const costTypeBreakdown = costData?.reduce((acc, curr) => {
      const type = curr.user_type || 'unknown';
      if (!acc[type]) {
        acc[type] = {
          cost: 0,
          userCount: 0,
          transactionCount: 0,
          avgCostPerUser: 0
        };
      }
      acc[type].cost += parseFloat(curr.cost_amount.toString());
      acc[type].userCount += curr.user_count;
      acc[type].transactionCount += curr.transaction_count;
      return acc;
    }, {} as Record<string, any>) || {};

    // 计算各类型的平均成本
    Object.keys(costTypeBreakdown).forEach(type => {
      const stats = costTypeBreakdown[type];
      stats.avgCostPerUser = stats.userCount > 0 ? stats.cost / stats.userCount : 0;
    });

    // 按时间维度分组统计
    const timeDimensionBreakdown = costData?.reduce((acc, curr) => {
      const date = curr.breakdown_date;
      if (!acc[date]) {
        acc[date] = {
          cost: 0,
          userCount: 0,
          transactionCount: 0
        };
      }
      acc[date].cost += parseFloat(curr.cost_amount.toString());
      acc[date].userCount += curr.user_count;
      acc[date].transactionCount += curr.transaction_count;
      return acc;
    }, {} as Record<string, any>) || {};

    // 成本趋势数据（最近30天）
    const trendData = costData?.slice(0, 30).reverse().map(item => ({
      date: item.breakdown_date,
      cost: parseFloat(item.cost_amount.toString()),
      userCount: item.user_count,
      transactionCount: item.transaction_count,
      costPerUser: parseFloat(item.cost_per_user?.toString() || '0')
    })) || [];

    // 成本效率分析
    const costEfficiency = {
      costPerUser: averageCostPerUser,
      costPerTransaction: totalStats.totalTransactionCount > 0 
        ? totalStats.totalCost / totalStats.totalTransactionCount 
        : 0,
      userEngagementRate: totalStats.totalUserCount > 0 
        ? (totalStats.totalTransactionCount / totalStats.totalUserCount) * 100 
        : 0
    };

    // 成本类型详细分析
    const costTypeAnalysis = analyzeCostTypes(costTypeBreakdown);

    // 计算成本增长率
    let costGrowthRate = 0;
    if (costData && costData.length > 1) {
      const recentCost = costData.slice(0, 7).reduce((sum, item) => 
        sum + parseFloat(item.cost_amount.toString()), 0);
      const previousCost = costData.slice(7, 14).reduce((sum, item) => 
        sum + parseFloat(item.cost_amount.toString()), 0);
      if (previousCost > 0) {
        costGrowthRate = ((recentCost - previousCost) / previousCost) * 100;
      }
    }

    const response = {
      data: costData || [],
      summary: {
        period: `${startDate || ''} - ${endDate || ''}`,
        totalCost: totalStats.totalCost,
        totalUserCount: totalStats.totalUserCount,
        totalTransactionCount: totalStats.totalTransactionCount,
        averageCostPerUser,
        costGrowthRate,
        periodType
      },
      costTypeBreakdown,
      timeDimensionBreakdown,
      trendData,
      costEfficiency,
      costTypeAnalysis,
      keyMetrics: {
        highestCostDay: findHighestCostDay(trendData),
        mostEfficientType: findMostEfficientType(costTypeBreakdown),
        costVolatility: calculateCostVolatility(trendData),
        userAcquisitionCost: calculateUserAcquisitionCost(costTypeBreakdown)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('获取成本统计API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
  })(request);
}

/**
 * POST /api/admin/financial/costs
 * 计算并保存成本统计数据
 * 
 * Body:
 * {
 *   "costType": "incentive",
 *   "date": "2025-10-31"
 * }
 */
export async function POST(request: NextRequest) {
  return withStatsPermission(async (request, admin) => {
  try {
    const body = await request.json();
    const {
      costType = 'incentive',
      date = new Date().toISOString().split('T')[0]
    } = body;

    let results = [];

    // 根据成本类型计算相关成本
    if (costType === 'incentive') {
      // 激励成本：新手任务、签到奖励、首充奖励
      results = await calculateIncentiveCosts(date, supabase);
    } else if (costType === 'prize') {
      // 奖品成本：抽奖奖品发放
      results = await calculatePrizeCosts(date, supabase);
    } else if (costType === 'operation') {
      // 运营成本：平台运营、技术维护等
      results = await calculateOperationCosts(date, supabase);
    } else if (costType === 'platform') {
      // 平台成本：服务器、第三方服务等
      results = await calculatePlatformCosts(date, supabase);
    } else {
      return NextResponse.json(
        { error: '不支持的成本类型' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${costType}成本数据计算完成`,
      data: results
    });

  } catch (error) {
    console.error('计算成本统计API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
  })(request);
}

// 辅助函数：计算激励成本
async function calculateIncentiveCosts(date: string, supabase: any) {
  const results = [];

  // 新手任务成本
  const { data: taskData } = await supabase
    .from('user_task_progress')
    .select('user_id, reward_amount')
    .eq('status', 'claimed')
    .gte('created_at', `${date}T00:00:00`)
    .lt('created_at', `${date}T23:59:59`);

  const taskCost = taskData?.reduce((sum, task) => 
    sum + parseFloat(task.reward_amount.toString()), 0) || 0;
  const taskUsers = new Set(taskData?.map(t => t.user_id) || []).size;

  if (taskCost > 0) {
    const { data: taskResult } = await supabase
      .from('cost_breakdown')
      .insert({
        breakdown_type: 'cost_type',
        user_type: 'incentive',
        time_dimension: 'daily',
        time_period: date,
        cost_amount: taskCost,
        user_count: taskUsers,
        transaction_count: taskData?.length || 0,
        cost_per_user: taskUsers > 0 ? taskCost / taskUsers : 0,
        breakdown_date: date
      })
      .select()
      .single();
    results.push(taskResult);
  }

  // 签到奖励成本
  const { data: checkinData } = await supabase
    .from('check_in_records')
    .select('user_id, reward_amount')
    .eq('status', 'claimed')
    .gte('created_at', `${date}T00:00:00`)
    .lt('created_at', `${date}T23:59:59`);

  const checkinCost = checkinData?.reduce((sum, checkin) => 
    sum + parseFloat(checkin.reward_amount.toString()), 0) || 0;
  const checkinUsers = new Set(checkinData?.map(c => c.user_id) || []).size;

  if (checkinCost > 0) {
    const { data: checkinResult } = await supabase
      .from('cost_breakdown')
      .insert({
        breakdown_type: 'cost_type',
        user_type: 'incentive',
        time_dimension: 'daily',
        time_period: date,
        cost_amount: checkinCost,
        user_count: checkinUsers,
        transaction_count: checkinData?.length || 0,
        cost_per_user: checkinUsers > 0 ? checkinCost / checkinUsers : 0,
        breakdown_date: date
      })
      .select()
      .single();
    results.push(checkinResult);
  }

  // 首充奖励成本
  const { data: firstRechargeData } = await supabase
    .from('first_recharge_rewards')
    .select('user_id, reward_amount')
    .eq('status', 'claimed')
    .gte('created_at', `${date}T00:00:00`)
    .lt('created_at', `${date}T23:59:59`);

  const firstRechargeCost = firstRechargeData?.reduce((sum, reward) => 
    sum + parseFloat(reward.reward_amount.toString()), 0) || 0;
  const firstRechargeUsers = new Set(firstRechargeData?.map(r => r.user_id) || []).size;

  if (firstRechargeCost > 0) {
    const { data: firstRechargeResult } = await supabase
      .from('cost_breakdown')
      .insert({
        breakdown_type: 'cost_type',
        user_type: 'incentive',
        time_dimension: 'daily',
        time_period: date,
        cost_amount: firstRechargeCost,
        user_count: firstRechargeUsers,
        transaction_count: firstRechargeData?.length || 0,
        cost_per_user: firstRechargeUsers > 0 ? firstRechargeCost / firstRechargeUsers : 0,
        breakdown_date: date
      })
      .select()
      .single();
    results.push(firstRechargeResult);
  }

  return results;
}

// 辅助函数：计算奖品成本
async function calculatePrizeCosts(date: string, supabase: any) {
  const results = [];
  
  // 抽奖奖品成本（简化处理，假设每次抽奖平均成本）
  const { data: participationsData } = await supabase
    .from('participations')
    .select('user_id, cost')
    .gte('created_at', `${date}T00:00:00`)
    .lt('created_at', `${date}T23:59:59`);

  const participationCount = participationsData?.length || 0;
  const participationUsers = new Set(participationsData?.map(p => p.user_id) || []).size;
  const totalParticipationCost = participationsData?.reduce((sum, p) => 
    sum + parseFloat(p.cost.toString()), 0) || 0;

  // 假设奖品成本占参与成本的20%
  const prizeCost = totalParticipationCost * 0.2;

  if (prizeCost > 0) {
    const { data: prizeResult } = await supabase
      .from('cost_breakdown')
      .insert({
        breakdown_type: 'cost_type',
        user_type: 'prize',
        time_dimension: 'daily',
        time_period: date,
        cost_amount: prizeCost,
        user_count: participationUsers,
        transaction_count: participationCount,
        cost_per_user: participationUsers > 0 ? prizeCost / participationUsers : 0,
        breakdown_date: date
      })
      .select()
      .single();
    results.push(prizeResult);
  }

  return results;
}

// 辅助函数：计算运营成本
async function calculateOperationCosts(date: string, supabase: any) {
  const results = [];
  
  // 运营成本（固定成本 + 变动成本）
  const baseOperationCost = 500.00; // 基础运营成本
  const variableOperationCost = 100.00; // 变动运营成本

  // 用户数量影响
  const { data: usersData } = await supabase
    .from('users')
    .select('id')
    .gte('created_at', `${date}T00:00:00`)
    .lt('created_at', `${date}T23:59:59`);

  const dailyNewUsers = usersData?.length || 0;
  const totalOperationCost = baseOperationCost + (dailyNewUsers * variableOperationCost);

  const { data: operationResult } = await supabase
    .from('cost_breakdown')
    .insert({
      breakdown_type: 'cost_type',
      user_type: 'operation',
      time_dimension: 'daily',
      time_period: date,
      cost_amount: totalOperationCost,
      user_count: dailyNewUsers,
      transaction_count: dailyNewUsers,
      cost_per_user: dailyNewUsers > 0 ? totalOperationCost / dailyNewUsers : 0,
      breakdown_date: date
    })
    .select()
    .single();

  if (operationResult) {
    results.push(operationResult);
  }

  return results;
}

// 辅助函数：计算平台成本
async function calculatePlatformCosts(date: string, supabase: any) {
  const results = [];
  
  // 平台成本（服务器、第三方服务等）
  const serverCost = 200.00; // 服务器成本
  const serviceCost = 100.00; // 第三方服务成本
  const maintenanceCost = 150.00; // 维护成本

  const totalPlatformCost = serverCost + serviceCost + maintenanceCost;

  const { data: platformResult } = await supabase
    .from('cost_breakdown')
    .insert({
      breakdown_type: 'cost_type',
      user_type: 'platform',
      time_dimension: 'daily',
      time_period: date,
      cost_amount: totalPlatformCost,
      user_count: 1, // 平台级成本，用户数为1
      transaction_count: 1,
      cost_per_user: totalPlatformCost,
      breakdown_date: date
    })
    .select()
    .single();

  if (platformResult) {
    results.push(platformResult);
  }

  return results;
}

// 辅助函数：分析成本类型
function analyzeCostTypes(costTypeBreakdown: Record<string, any>) {
  const analysis = {
    dominantType: null,
    efficiency: {} as Record<string, number>,
    recommendations: [] as string[]
  };

  // 找出主要成本类型
  let maxCost = 0;
  Object.keys(costTypeBreakdown).forEach(type => {
    const cost = costTypeBreakdown[type].cost;
    if (cost > maxCost) {
      maxCost = cost;
      analysis.dominantType = type;
    }
  });

  // 计算效率指标
  Object.keys(costTypeBreakdown).forEach(type => {
    const stats = costTypeBreakdown[type];
    analysis.efficiency[type] = stats.userCount > 0 ? stats.cost / stats.userCount : 0;
  });

  // 生成建议
  if (analysis.dominantType === 'operation') {
    analysis.recommendations.push('运营成本较高，建议优化运营效率');
  }
  if (analysis.efficiency['incentive'] > analysis.efficiency['platform']) {
    analysis.recommendations.push('激励成本效率较低，建议调整激励策略');
  }

  return analysis;
}

// 辅助函数：找出成本最高的一天
function findHighestCostDay(trendData: any[]) {
  if (trendData.length === 0) return null;
  return trendData.reduce((max, current) => 
    current.cost > max.cost ? current : max
  );
}

// 辅助函数：找出最高效的成本类型
function findMostEfficientType(costTypeBreakdown: Record<string, any>) {
  let minCostPerUser = Infinity;
  let mostEfficient = null;
  
  Object.keys(costTypeBreakdown).forEach(type => {
    const stats = costTypeBreakdown[type];
    if (stats.avgCostPerUser < minCostPerUser && stats.userCount > 0) {
      minCostPerUser = stats.avgCostPerUser;
      mostEfficient = type;
    }
  });
  
  return mostEfficient;
}

// 辅助函数：计算成本波动性
function calculateCostVolatility(trendData: any[]) {
  if (trendData.length < 2) return 0;
  const costs = trendData.map(d => d.cost);
  const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
  const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / costs.length;
  return Math.sqrt(variance);
}

// 辅助函数：计算用户获取成本
function calculateUserAcquisitionCost(costTypeBreakdown: Record<string, any>) {
  const incentiveCost = costTypeBreakdown['incentive']?.cost || 0;
  const operationCost = costTypeBreakdown['operation']?.cost || 0;
  const newUsers = costTypeBreakdown['incentive']?.userCount || 0;
  
  return newUsers > 0 ? (incentiveCost + operationCost) / newUsers : 0;
}