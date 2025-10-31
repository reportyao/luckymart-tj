import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 获取数据库连接
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/admin/costs/trends
 * 获取成本趋势分析数据
 * 
 * Query Parameters:
 * - period: 趋势周期 (7d/30d/90d)
 * - costType: 成本类型 (all/incentive/operation/referral/lottery)
 * - groupBy: 分组方式 (daily/weekly/monthly)
 * - startDate: 自定义开始日期
 * - endDate: 自定义结束日期
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const costType = searchParams.get('costType') || 'all';
    const groupBy = searchParams.get('groupBy') || 'daily';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 计算日期范围
    let calculatedStartDate: string;
    let calculatedEndDate = new Date().toISOString().split('T')[0];

    if (startDate && endDate) {
      calculatedStartDate = startDate;
    } else {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const start = new Date();
      start.setDate(start.getDate() - days);
      calculatedStartDate = start.toISOString().split('T')[0];
    }

    // 获取成本统计数据
    let query = supabase
      .from('cost_statistics')
      .select('*')
      .gte('stat_date', calculatedStartDate)
      .lte('stat_date', calculatedEndDate)
      .order('stat_date', { ascending: true });

    const { data: costData, error } = await query;

    if (error) {
      console.error('查询成本趋势数据失败:', error);
      return NextResponse.json(
        { error: '查询成本趋势数据失败' },
        { status: 500 }
      );
    }

    // 处理数据并按成本类型过滤
    const processedData = costData?.map(item => {
      const totalCost = parseFloat(item.total_cost.toString());
      const incentiveCost = parseFloat(item.incentive_cost.toString());
      const operationCost = parseFloat(item.operation_cost.toString());
      const referralCost = parseFloat(item.referral_cost.toString());
      const lotteryCost = parseFloat(item.lottery_cost.toString());

      let selectedCost = totalCost;
      if (costType === 'incentive') selectedCost = incentiveCost;
      else if (costType === 'operation') selectedCost = operationCost;
      else if (costType === 'referral') selectedCost = referralCost;
      else if (costType === 'lottery') selectedCost = lotteryCost;

      return {
        date: item.stat_date,
        totalCost,
        incentiveCost,
        operationCost,
        referralCost,
        lotteryCost,
        selectedCost
      };
    }) || [];

    // 按周期分组（如果需要周/月统计）
    let groupedData = processedData;
    if (groupBy === 'weekly' || groupBy === 'monthly') {
      groupedData = groupDataByPeriod(processedData, groupBy);
    }

    // 计算趋势统计
    const trendStats = calculateTrendStats(processedData);

    // 计算成本占比
    const costBreakdown = calculateCostBreakdown(processedData);

    // 计算同比增长（如果有足够的历史数据）
    const growthMetrics = calculateGrowthMetrics(processedData);

    const response = {
      data: groupedData,
      summary: {
        period: period,
        dateRange: {
          start: calculatedStartDate,
          end: calculatedEndDate
        },
        costType,
        groupBy,
        totalCost: trendStats.totalCost,
        averageDailyCost: trendStats.averageDailyCost,
        maxDailyCost: trendStats.maxDailyCost,
        minDailyCost: trendStats.minDailyCost,
        costVolatility: trendStats.costVolatility
      },
      costBreakdown,
      trendAnalysis: {
        trendDirection: trendStats.trendDirection,
        growthRate: trendStats.growthRate,
        consistency: trendStats.consistency
      },
      growthMetrics
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('获取成本趋势API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 数据分组函数
function groupDataByPeriod(data: any[], period: string) {
  const grouped: Record<string, any> = {};

  data.forEach(item => {
    const date = new Date(item.date);
    let key: string;

    if (period === 'weekly') {
      // 获取周一
      const monday = new Date(date);
      monday.setDate(date.getDate() - date.getDay() + 1);
      key = monday.toISOString().split('T')[0];
    } else if (period === 'monthly') {
      // 获取月份第一天
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    }

    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        totalCost: 0,
        incentiveCost: 0,
        operationCost: 0,
        referralCost: 0,
        lotteryCost: 0,
        count: 0
      };
    }

    grouped[key].totalCost += item.totalCost;
    grouped[key].incentiveCost += item.incentiveCost;
    grouped[key].operationCost += item.operationCost;
    grouped[key].referralCost += item.referralCost;
    grouped[key].lotteryCost += item.lotteryCost;
    grouped[key].count += 1;
  });

  return Object.values(grouped).map((item: any) => ({
    date: item.date,
    totalCost: item.totalCost / item.count,
    incentiveCost: item.incentiveCost / item.count,
    operationCost: item.operationCost / item.count,
    referralCost: item.referralCost / item.count,
    lotteryCost: item.lotteryCost / item.count,
    selectedCost: item.totalCost / item.count
  }));
}

// 计算趋势统计
function calculateTrendStats(data: any[]) {
  if (data.length === 0) {
    return {
      totalCost: 0,
      averageDailyCost: 0,
      maxDailyCost: 0,
      minDailyCost: 0,
      costVolatility: 0,
      trendDirection: 'stable',
      growthRate: 0,
      consistency: 0
    };
  }

  const totalCost = data.reduce((sum, item) => sum + item.selectedCost, 0);
  const averageDailyCost = totalCost / data.length;
  const maxDailyCost = Math.max(...data.map(item => item.selectedCost));
  const minDailyCost = Math.min(...data.map(item => item.selectedCost));

  // 计算成本波动性（标准差）
  const variance = data.reduce((sum, item) => 
    sum + Math.pow(item.selectedCost - averageDailyCost, 2), 0) / data.length;
  const costVolatility = Math.sqrt(variance);

  // 计算趋势方向
  let trendDirection = 'stable';
  let growthRate = 0;

  if (data.length >= 2) {
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((sum, item) => sum + item.selectedCost, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.selectedCost, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.1) {
      trendDirection = 'increasing';
      growthRate = ((secondAvg - firstAvg) / firstAvg) * 100;
    } else if (secondAvg < firstAvg * 0.9) {
      trendDirection = 'decreasing';
      growthRate = ((firstAvg - secondAvg) / firstAvg) * 100;
    }
  }

  // 计算一致性（波动系数）
  const consistency = averageDailyCost > 0 ? (costVolatility / averageDailyCost) * 100 : 0;

  return {
    totalCost,
    averageDailyCost,
    maxDailyCost,
    minDailyCost,
    costVolatility,
    trendDirection,
    growthRate,
    consistency
  };
}

// 计算成本占比
function calculateCostBreakdown(data: any[]) {
  const totals = data.reduce((acc, item) => {
    acc.incentive += item.incentiveCost;
    acc.operation += item.operationCost;
    acc.referral += item.referralCost;
    acc.lottery += item.lotteryCost;
    acc.total += item.totalCost;
    return acc;
  }, { incentive: 0, operation: 0, referral: 0, lottery: 0, total: 0 });

  return {
    incentive: {
      amount: totals.incentive,
      percentage: totals.total > 0 ? (totals.incentive / totals.total) * 100 : 0
    },
    operation: {
      amount: totals.operation,
      percentage: totals.total > 0 ? (totals.operation / totals.total) * 100 : 0
    },
    referral: {
      amount: totals.referral,
      percentage: totals.total > 0 ? (totals.referral / totals.total) * 100 : 0
    },
    lottery: {
      amount: totals.lottery,
      percentage: totals.total > 0 ? (totals.lottery / totals.total) * 100 : 0
    }
  };
}

// 计算增长指标
function calculateGrowthMetrics(data: any[]) {
  if (data.length < 2) {
    return {
      weekOverWeek: 0,
      monthOverMonth: 0,
      cumulativeGrowth: 0
    };
  }

  const lastWeek = data.slice(-7);
  const previousWeek = data.slice(-14, -7);

  const lastWeekAvg = lastWeek.reduce((sum, item) => sum + item.selectedCost, 0) / lastWeek.length;
  const previousWeekAvg = previousWeek.reduce((sum, item) => sum + item.selectedCost, 0) / previousWeek.length;

  const weekOverWeek = previousWeekAvg > 0 
    ? ((lastWeekAvg - previousWeekAvg) / previousWeekAvg) * 100 
    : 0;

  const firstValue = data[0].selectedCost;
  const lastValue = data[data.length - 1].selectedCost;

  const cumulativeGrowth = firstValue > 0 
    ? ((lastValue - firstValue) / firstValue) * 100 
    : 0;

  return {
    weekOverWeek,
    monthOverMonth: 0, // 需要更多历史数据才能计算
    cumulativeGrowth
  };
}