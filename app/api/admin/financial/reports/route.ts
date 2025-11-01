import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin-permission-manager';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';

// 获取数据库连接
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 创建权限中间件
const withStatsPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.stats.read()
});

/**
 * GET /api/admin/financial/reports
 * 获取财务报告列表
 * 
 * Query Parameters:
 * - reportType: 报告类型 (monthly/quarterly/yearly)
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `reports_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('reports_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('reports_route.ts request failed', error as Error, {
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
        const reportType = searchParams.get('reportType');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabase
          .from('financial_reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (reportType) {
          query = query.eq('report_type', reportType);
        }

        if (status) {
          query = query.eq('status', status);
        }

        const { data: reportsData, error } = await query;

        if (error) {
          logger.error("API Error", error as Error, {
          requestId,
          endpoint: request.url
        });'查询财务报告数据失败:', error);
          return NextResponse.json(
            { error: '查询财务报告数据失败' },
            { status: 500 }
          );
        }

        // 按报告类型分组统计
        const reportTypeStats = reportsData?.reduce((acc, curr) => {
          if (!acc[curr.report_type]) {
            acc[curr.report_type] = {
              count: 0,
              published: 0,
              draft: 0,
              archived: 0
            };
          }
          acc[curr.report_type].count++;
          if (curr.status === 'published') acc[curr.report_type].published++;
          else if (curr.status === 'draft') acc[curr.report_type].draft++;
          else if (curr.status === 'archived') acc[curr.report_type].archived++;
          return acc;
        }, {} as Record<string, any>) || {};

        // 最新报告摘要
        const latestReports = reportsData?.slice(0, 5).map(report => ({
          id: report.id,
          reportType: report.report_type,
          reportPeriod: report.report_period,
          title: report.title,
          status: report.status,
          publishedAt: report.published_at,
          createdAt: report.created_at,
          summary: report.summary
        })) || [];

        const response = {
          data: reportsData || [],
          summary: {
            totalReports: reportsData?.length || 0,
            reportTypeStats,
            latestReports
          }
        };

        return NextResponse.json(response);

      } catch (error) {
        logger.error("API Error", error as Error, {
          requestId,
          endpoint: request.url
        });'获取财务报告API错误:', error);
        return NextResponse.json(
          { error: '服务器内部错误' },
          { status: 500 }
        );
      }
      })(request);
}

/**
 * POST /api/admin/financial/reports
 * 生成新的财务报告
 * 
 * Body:
 * {
 *   "reportType": "monthly",
 *   "reportPeriod": "2024-10",
 *   "title": "2024年10月财务报告"
 * }
 */
export async function POST(request: NextRequest) {
  return await withStatsPermission(async (request: any, admin: any) => {
  try {
    const body = await request.json();
    const {
      reportType = 'monthly',
      reportPeriod,
      title,
      generatedBy = 'system'
    } = body;

    if (!reportPeriod) {
      return NextResponse.json(
        { error: 'reportPeriod 为必填参数' },
        { status: 400 }
      );
    }

    // 根据报告类型和期间解析日期范围
    let startDate: Date;
    let endDate: Date;

    if (reportType === 'monthly') {
      const [year, month] = reportPeriod.split('-');
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 0);
    } else if (reportType === 'quarterly') {
      const [year, quarter] = reportPeriod.split('-Q');
      const quarterNum = parseInt(quarter);
      startDate = new Date(parseInt(year), (quarterNum - 1) * 3, 1);
      endDate = new Date(parseInt(year), quarterNum * 3, 0);
    } else if (reportType === 'yearly') {
      startDate = new Date(parseInt(reportPeriod), 0, 1);
      endDate = new Date(parseInt(reportPeriod), 11, 31);
    } else {
      return NextResponse.json(
        { error: '不支持的报告类型' },
        { status: 400 }
      );
    }

    const startISO = startDate.toISOString().split('T')[0];
    const endISO = endDate.toISOString().split('T')[0];

    // 获取收入数据
    const { data: revenueData } = await supabase
      .from('revenue_statistics')
      .select('*')
      .gte('period_start', startISO)
      .lte('period_end', endISO);

    // 获取成本数据
    const { data: costData } = await supabase
      .from('cost_breakdown')
      .select('*')
      .gte('breakdown_date', startISO)
      .lte('breakdown_date', endISO);

    // 获取利润数据
    const { data: profitData } = await supabase
      .from('profit_analysis')
      .select('*')
      .gte('date', startISO)
      .lte('date', endISO);

    // 获取提现数据
    const { data: withdrawalData } = await supabase
      .from('withdrawal_records')
      .select('*')
      .gte('period_start', startISO)
      .lte('period_end', endISO);

    // 计算汇总数据
    const revenueSummary = calculateRevenueSummary(revenueData || []);
    const costSummary = calculateCostSummary(costData || []);
    const profitSummary = calculateProfitSummary(profitData || []);
    const withdrawalSummary = calculateWithdrawalSummary(withdrawalData || []);

    // 生成关键指标
    const keyMetrics = generateKeyMetrics(revenueSummary, costSummary, profitSummary, withdrawalSummary);

    // 生成趋势分析
    const trends = generateTrends(revenueData || [], profitData || [], costData || []);

    // 生成建议
    const recommendations = generateRecommendations(keyMetrics, trends);

    // 生成报告摘要
    const summary = generateReportSummary(reportType, reportPeriod, revenueSummary, profitSummary, keyMetrics);

    // 确定默认标题
    const finalTitle = title || generateDefaultTitle(reportType, reportPeriod);

    // 插入报告数据
    const { data, error } = await supabase
      .from('financial_reports')
      .insert({
        report_type: reportType,
        report_period: reportPeriod,
        title: finalTitle,
        summary,
        revenue_data: revenueSummary,
        cost_data: costSummary,
        profit_data: profitSummary,
        withdrawal_data: withdrawalSummary,
        key_metrics: keyMetrics,
        trends,
        recommendations,
        status: 'draft',
        generated_by: generatedBy
      })
      .select()
      .single();

    if (error) {
      logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'生成财务报告失败:', error);
      return NextResponse.json(
        { error: '生成财务报告失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '财务报告生成完成',
      data: {
        id: data.id,
        reportType,
        reportPeriod,
        title: finalTitle,
        summary,
        keyMetrics,
        trends,
        recommendations
      }
    });

  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'生成财务报告API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
  })(request);
}

// 辅助函数：计算收入摘要
function calculateRevenueSummary(data: any[]) {
  const summary = {
    totalRevenue: 0,
    actualReceived: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    growthRate: 0
  };

  if (data.length === 0) return summary;

  summary.totalRevenue = data.reduce((sum: any,  item: any) => sum + parseFloat(item.total_revenue.toString()), 0);
  summary.actualReceived = data.reduce((sum: any,  item: any) => sum + parseFloat(item.actual_received.toString()), 0);
  summary.totalOrders = data.reduce((sum: any,  item: any) => sum + item.order_count, 0);
  summary.averageOrderValue = summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0;

  // 计算平均增长率
  const growthRates = data.filter((item : any) => item.growth_rate).map(item => parseFloat(item.growth_rate.toString()));
  summary.growthRate = growthRates.length > 0 
    ? growthRates.reduce((sum: any,  rate: any) => sum + rate, 0) / growthRates.length 
    : 0;

  return summary;
}

// 辅助函数：计算成本摘要
function calculateCostSummary(data: any[]) {
  const summary = {
    totalCost: 0,
    costByType: {},
    averageCostPerUser: 0,
    costTrend: 'stable'
  };

  if (data.length === 0) return summary;

  summary.totalCost = data.reduce((sum: any,  item: any) => sum + parseFloat(item.cost_amount.toString()), 0);
  const totalUsers = data.reduce((sum: any,  item: any) => sum + item.user_count, 0);
  summary.averageCostPerUser = totalUsers > 0 ? summary.totalCost / totalUsers : 0;

  // 按类型分组
  data.forEach((item : any) => {
    const type = item.user_type || 'unknown';
    if (!summary.costByType[type]) {
      summary.costByType[type] = 0;
    }
    summary.costByType[type] += parseFloat(item.cost_amount.toString());
  });

  return summary;
}

// 辅助函数：计算利润摘要
function calculateProfitSummary(data: any[]) {
  const summary = {
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
    roi: 0,
    profitabilityTrend: 'stable'
  };

  if (data.length === 0) return summary;

  summary.grossProfit = data.reduce((sum: any,  item: any) => sum + parseFloat(item.gross_profit.toString()), 0);
  summary.netProfit = data.reduce((sum: any,  item: any) => sum + parseFloat(item.net_profit.toString()), 0);
  
  const totalRevenue = data.reduce((sum: any,  item: any) => sum + parseFloat(item.revenue.toString()), 0);
  summary.profitMargin = totalRevenue > 0 ? (summary.netProfit / totalRevenue) * 100 : 0;

  // 计算平均ROI
  const rois = data.filter((item : any) => item.roi).map(item => parseFloat(item.roi.toString()));
  summary.roi = rois.length > 0 
    ? rois.reduce((sum: any,  roi: any) => sum + roi, 0) / rois.length 
    : 0;

  return summary;
}

// 辅助函数：计算提现摘要
function calculateWithdrawalSummary(data: any[]) {
  const summary = {
    totalAmount: 0,
    totalUsers: 0,
    averageAmount: 0,
    successRate: 0,
    platformFee: 0
  };

  if (data.length === 0) return summary;

  summary.totalAmount = data.reduce((sum: any,  item: any) => sum + parseFloat(item.total_amount.toString()), 0);
  summary.totalUsers = data.reduce((sum: any,  item: any) => sum + item.total_users, 0);
  summary.platformFee = data.reduce((sum: any,  item: any) => sum + parseFloat(item.platform_fee.toString()), 0);
  
  const totalWithdrawals = data.reduce((sum: any,  item: any) => sum + item.withdrawal_count, 0);
  const totalSuccess = data.reduce((sum: any,  item: any) => sum + item.success_count, 0);
  summary.successRate = totalWithdrawals > 0 ? (totalSuccess / totalWithdrawals) * 100 : 0;
  summary.averageAmount = summary.totalUsers > 0 ? summary.totalAmount / summary.totalUsers : 0;

  return summary;
}

// 辅助函数：生成关键指标
function generateKeyMetrics(revenue: any, cost: any, profit: any, withdrawal: any) {
  return {
    revenue: {
      total: revenue.totalRevenue,
      actualReceived: revenue.actualReceived,
      growthRate: revenue.growthRate,
      averageOrderValue: revenue.averageOrderValue
    },
    costs: {
      total: cost.totalCost,
      averagePerUser: cost.averageCostPerUser,
      costRatio: revenue.totalRevenue > 0 ? (cost.totalCost / revenue.totalRevenue) * 100 : 0
    },
    profits: {
      gross: profit.grossProfit,
      net: profit.netProfit,
      margin: profit.profitMargin,
      roi: profit.roi
    },
    withdrawals: {
      total: withdrawal.totalAmount,
      users: withdrawal.totalUsers,
      successRate: withdrawal.successRate,
      platformRevenue: withdrawal.platformFee
    },
    overall: {
      profitability: profit.netProfit > 0 ? 'profitable' : 'loss',
      efficiency: profit.roi > 0 ? 'good' : 'poor',
      riskLevel: withdrawal.successRate > 95 ? 'low' : withdrawal.successRate > 90 ? 'medium' : 'high'
    }
  };
}

// 辅助函数：生成趋势分析
function generateTrends(revenue: any[], profit: any[], cost: any[]) {
  return {
    revenue: calculateArrayTrend(revenue.map((r : any) => parseFloat(r.total_revenue.toString()))),
    profit: calculateArrayTrend(profit.map((p : any) => parseFloat(p.net_profit.toString()))),
    cost: calculateArrayTrend(cost.map((c : any) => parseFloat(c.cost_amount.toString()))),
    orders: calculateArrayTrend(revenue.map((r : any) => r.order_count)),
    customers: calculateArrayTrend(cost.map((c : any) => c.user_count))
  };
}

// 辅助函数：计算数组趋势
function calculateArrayTrend(values: number[]): string {
  if (values.length < 2) return 'stable';
  
  const increasing = values.slice(1).filter((val, index) => val > values[index]).length;
  const decreasing = values.slice(1).filter((val, index) => val < values[index]).length;
  
  if (increasing > decreasing * 1.5) return 'increasing';
  if (decreasing > increasing * 1.5) return 'decreasing';
  return 'stable';
}

// 辅助函数：生成建议
function generateRecommendations(metrics: any, trends: any): string[] {
  const recommendations = [];

  // 收入相关建议
  if (metrics.revenue.growthRate < 0) {
    recommendations.push('收入出现负增长，建议加强营销推广活动');
  }
  if (metrics.revenue.averageOrderValue < 10) {
    recommendations.push('平均订单价值较低，建议推出高价值产品套餐');
  }

  // 成本相关建议
  if (metrics.costs.costRatio > 70) {
    recommendations.push('成本占比过高，建议优化运营效率和成本结构');
  }

  // 利润相关建议
  if (metrics.profits.margin < 10) {
    recommendations.push('利润率偏低，建议提高产品定价或降低运营成本');
  }
  if (metrics.profits.roi < 20) {
    recommendations.push('投资回报率较低，建议优化营销策略');
  }

  // 提现相关建议
  if (metrics.withdrawals.successRate < 95) {
    recommendations.push('提现成功率需要改善，建议优化提现流程');
  }

  // 趋势相关建议
  if (trends.profit === 'decreasing') {
    recommendations.push('利润呈下降趋势，建议及时调整业务策略');
  }
  if (trends.revenue === 'stable' && trends.cost === 'increasing') {
    recommendations.push('成本上升但收入稳定，需要控制成本增长');
  }

  if (recommendations.length === 0) {
    recommendations.push('财务状况良好，继续保持当前运营策略');
  }

  return recommendations;
}

// 辅助函数：生成报告摘要
function generateReportSummary(reportType: string, reportPeriod: string, revenue: any, profit: any, metrics: any): string {
  return `${reportPeriod}期间财务概况：总收入${revenue.totalRevenue.toFixed(2)}TJS，净利润${profit.netProfit.toFixed(2)}TJS，利润率${profit.profitMargin.toFixed(2)}%。${profit.netProfit > 0 ? '盈利状况良好' : '出现亏损，需要关注'}`;
}

// 辅助函数：生成默认标题
function generateDefaultTitle(reportType: string, reportPeriod: string): string {
  const typeMap = {
    monthly: '月',
    quarterly: '季度',
    yearly: '年'
  };
  
  return `${reportPeriod}${typeMap[reportType]}财务报告`;
}