import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { AdminPermissionManager } from '@/lib/admin/permissions/AdminPermissionManager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';

// 获取数据库连接
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 创建权限中间件
const withStatsPermission = AdminPermissionManager.createPermissionMiddleware([
  AdminPermissions.stats.read
]);

/**
 * GET /api/admin/financial/profits
 * 获取利润分析数据
 * 
 * Query Parameters:
 * - periodType: 期间类型 (daily/weekly/monthly/quarterly)
 * - startDate: 开始日期
 * - endDate: 结束日期
 * - limit: 限制返回记录数
 */
export async function GET(request: NextRequest) {
  return withStatsPermission(async (request, admin) => {
  try {
    const { searchParams } = new URL(request.url);
    const periodType = searchParams.get('periodType') || 'daily';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('profit_analysis')
      .select('*')
      .eq('product_id', null) // 只获取总体利润分析
      .order('date', { ascending: false })
      .limit(limit);

    if (startDate && endDate) {
      query = query
        .gte('date', startDate)
        .lte('date', endDate);
    } else {
      // 默认获取最近30天的数据
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('date', thirtyDaysAgo.toISOString().split('T')[0]);
    }

    const { data: profitData, error } = await query;

    if (error) {
      console.error('查询利润分析数据失败:', error);
      return NextResponse.json(
        { error: '查询利润分析数据失败' },
        { status: 500 }
      );
    }

    // 计算汇总统计
    const totalStats = profitData?.reduce((acc, curr) => {
      acc.grossRevenue += parseFloat(curr.revenue.toString());
      acc.productCosts += parseFloat(curr.product_cost.toString());
      acc.platformFees += parseFloat(curr.platform_fee.toString());
      acc.operationCosts += parseFloat(curr.operation_cost.toString());
      acc.grossProfit += parseFloat(curr.gross_profit.toString());
      acc.netProfit += parseFloat(curr.net_profit.toString());
      return acc;
    }, {
      grossRevenue: 0,
      productCosts: 0,
      platformFees: 0,
      operationCosts: 0,
      grossProfit: 0,
      netProfit: 0
    }) || {};

    // 计算总体指标
    const totalCosts = totalStats.productCosts + totalStats.platformFees + totalStats.operationCosts;
    const overallMargin = totalStats.grossRevenue > 0 ? (totalStats.netProfit / totalStats.grossRevenue) * 100 : 0;
    const costRatio = totalStats.grossRevenue > 0 ? (totalCosts / totalStats.grossRevenue) * 100 : 0;

    // 趋势数据
    const trendData = profitData?.slice(0, 30).reverse().map(item => ({
      date: item.date,
      revenue: parseFloat(item.revenue.toString()),
      productCost: parseFloat(item.product_cost.toString()),
      platformFee: parseFloat(item.platform_fee.toString()),
      operationCost: parseFloat(item.operation_cost.toString()),
      grossProfit: parseFloat(item.gross_profit.toString()),
      netProfit: parseFloat(item.net_profit.toString()),
      profitMargin: item.profit_margin ? parseFloat(item.profit_margin.toString()) : 0,
      roi: item.roi ? parseFloat(item.roi.toString()) : 0
    })) || [];

    // 成本构成分析
    const costBreakdown = {
      productCosts: totalStats.productCosts,
      platformFees: totalStats.platformFees,
      operationCosts: totalStats.operationCosts,
      totalCosts,
      percentages: {
        productCosts: totalCosts > 0 ? (totalStats.productCosts / totalCosts) * 100 : 0,
        platformFees: totalCosts > 0 ? (totalStats.platformFees / totalCosts) * 100 : 0,
        operationCosts: totalCosts > 0 ? (totalStats.operationCosts / totalCosts) * 100 : 0
      }
    };

    // 利润分析
    const profitAnalysis = {
      grossProfit: totalStats.grossProfit,
      netProfit: totalStats.netProfit,
      grossProfitMargin: totalStats.grossRevenue > 0 ? (totalStats.grossProfit / totalStats.grossRevenue) * 100 : 0,
      netProfitMargin: totalStats.grossRevenue > 0 ? (totalStats.netProfit / totalStats.grossRevenue) * 100 : 0,
      costEfficiency: totalCosts > 0 ? (totalStats.netProfit / totalCosts) * 100 : 0
    };

    const response = {
      data: profitData || [],
      summary: {
        period: `${startDate || ''} - ${endDate || ''}`,
        grossRevenue: totalStats.grossRevenue,
        totalCosts,
        grossProfit: totalStats.grossProfit,
        netProfit: totalStats.netProfit,
        overallMargin,
        costRatio,
        periodType
      },
      costBreakdown,
      profitAnalysis,
      trendData,
      keyMetrics: {
        averageDailyRevenue: trendData.length > 0 ? totalStats.grossRevenue / trendData.length : 0,
        averageDailyProfit: trendData.length > 0 ? totalStats.netProfit / trendData.length : 0,
        profitVolatility: calculateVolatility(trendData.map(t => t.netProfit)),
        costTrend: calculateTrend(trendData.map(t => t.productCost + t.platformFee + t.operationCost)),
        revenueGrowth: calculateGrowth(trendData.map(t => t.revenue))
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('获取利润分析API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
  })(request);
}

/**
 * POST /api/admin/financial/profits
 * 计算并保存利润分析数据
 * 
 * Body:
 * {
 *   "date": "2025-10-31"
 * }
 */
export async function POST(request: NextRequest) {
  return withStatsPermission(async (request, admin) => {
  try {
    const body = await request.json();
    const {
      date = new Date().toISOString().split('T')[0]
    } = body;

    // 计算收入数据
    const startDate = `${date}T00:00:00`;
    const endDate = `${date}T23:59:59`;

    // 从订单表计算总收入
    const { data: ordersData } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('payment_status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const revenue = ordersData?.reduce((sum, order) => 
      sum + parseFloat(order.total_amount.toString()), 0) || 0;

    // 计算产品成本（基于抽奖参与）
    const { data: participationsData } = await supabase
      .from('participations')
      .select('cost')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const productCost = participationsData?.reduce((sum, participation) => 
      sum + parseFloat(participation.cost.toString()), 0) || 0;

    // 计算平台费用（假设为收入的5%）
    const platformFee = revenue * 0.05;

    // 计算运营成本（新手任务、签到奖励等）
    const { data: taskData } = await supabase
      .from('user_task_progress')
      .select('reward_amount')
      .eq('status', 'claimed')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { data: checkinData } = await supabase
      .from('check_in_records')
      .select('reward_amount')
      .eq('status', 'claimed')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { data: firstRechargeData } = await supabase
      .from('first_recharge_rewards')
      .select('reward_amount')
      .eq('status', 'claimed')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const operationCost = [
      ...(taskData?.map(t => parseFloat(t.reward_amount.toString())) || []),
      ...(checkinData?.map(c => parseFloat(c.reward_amount.toString())) || []),
      ...(firstRechargeData?.map(f => parseFloat(f.reward_amount.toString())) || [])
    ].reduce((sum, amount) => sum + amount, 0);

    // 计算毛利润和净利润
    const grossProfit = revenue - productCost;
    const netProfit = grossProfit - platformFee - operationCost;

    // 计算指标
    const roi = productCost > 0 ? (netProfit / productCost) * 100 : 0;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const costRatio = revenue > 0 ? ((productCost + platformFee + operationCost) / revenue) * 100 : 0;

    // 插入数据
    const { data, error } = await supabase
      .from('profit_analysis')
      .insert({
        date,
        revenue,
        product_cost: productCost,
        platform_fee: platformFee,
        operation_cost: operationCost,
        gross_profit: grossProfit,
        net_profit: netProfit,
        roi,
        profit_margin: profitMargin,
        cost_ratio: costRatio
      })
      .select()
      .single();

    if (error) {
      console.error('保存利润分析数据失败:', error);
      return NextResponse.json(
        { error: '保存利润分析数据失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '利润分析数据计算完成',
      data: {
        date,
        revenue,
        productCost,
        platformFee,
        operationCost,
        grossProfit,
        netProfit,
        roi,
        profitMargin,
        costRatio
      }
    });

  } catch (error) {
    console.error('计算利润分析API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
  })(request);
}

// 辅助函数：计算波动性
function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

// 辅助函数：计算趋势
function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const sumX = n * (n - 1) / 2;
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
  const sumXX = n * (n - 1) * (2 * n - 1) / 6;
  return n * sumXY - sumX * sumY > 0 ? 1 : -1; // 简化处理，只返回趋势方向
}

// 辅助函数：计算增长率
function calculateGrowth(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  return first > 0 ? ((last - first) / first) * 100 : 0;
}