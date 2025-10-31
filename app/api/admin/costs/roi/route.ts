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
 * GET /api/admin/costs/roi
 * 获取ROI分析数据
 * 
 * Query Parameters:
 * - analysisType: 分析类型 (period/product/channel)
 * - referenceId: 关联对象ID
 * - analysisPeriod: 分析周期 (daily/weekly/monthly)
 * - startDate: 开始日期
 * - endDate: 结束日期
 * - page: 页码
 * - limit: 每页记录数
 */
export async function GET(request: NextRequest) {
  return withStatsPermission(async (request, admin) => {
  try {
    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('analysisType');
    const referenceId = searchParams.get('referenceId');
    const analysisPeriod = searchParams.get('analysisPeriod');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('roi_analysis')
      .select('*')
      .order('analysis_date', { ascending: false });

    if (analysisType) {
      query = query.eq('analysis_type', analysisType);
    }

    if (referenceId) {
      query = query.eq('reference_id', referenceId);
    }

    if (analysisPeriod) {
      query = query.eq('analysis_period', analysisPeriod);
    }

    if (startDate && endDate) {
      query = query
        .gte('analysis_date', startDate)
        .lte('analysis_date', endDate);
    } else {
      // 默认获取最近30天的数据
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('analysis_date', thirtyDaysAgo.toISOString().split('T')[0]);
    }

    // 获取总数
    const { count } = await query.select('*', { count: 'exact', head: true });
    
    // 获取分页数据
    const { data: roiData, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('查询ROI分析数据失败:', error);
      return NextResponse.json(
        { error: '查询ROI分析数据失败' },
        { status: 500 }
      );
    }

    // 计算汇总统计
    const totalStats = roiData?.reduce((acc, curr) => {
      acc.totalRevenue += parseFloat(curr.total_revenue.toString());
      acc.totalCost += parseFloat(curr.total_cost.toString());
      acc.totalUserCount += curr.user_count;
      acc.totalTransactionCount += curr.transaction_count;
      return acc;
    }, {
      totalRevenue: 0,
      totalCost: 0,
      totalUserCount: 0,
      totalTransactionCount: 0
    }) || {};

    const roiPercentage = totalStats.totalCost > 0 
      ? ((totalStats.totalRevenue - totalStats.totalCost) / totalStats.totalCost) * 100 
      : 0;
    
    const profitMargin = totalStats.totalRevenue > 0 
      ? ((totalStats.totalRevenue - totalStats.totalCost) / totalStats.totalRevenue) * 100 
      : 0;

    const response = {
      data: roiData || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      },
      summary: {
        period: `${startDate || ''} - ${endDate || ''}`,
        totalRevenue: totalStats.totalRevenue,
        totalCost: totalStats.totalCost,
        netProfit: totalStats.totalRevenue - totalStats.totalCost,
        roiPercentage,
        profitMargin,
        totalUserCount: totalStats.totalUserCount,
        totalTransactionCount: totalStats.totalTransactionCount,
        averageRevenuePerUser: totalStats.totalUserCount > 0 
          ? totalStats.totalRevenue / totalStats.totalUserCount 
          : 0,
        averageTransactionValue: totalStats.totalTransactionCount > 0 
          ? totalStats.totalRevenue / totalStats.totalTransactionCount 
          : 0
      },
      breakdownByType: roiData?.reduce((acc, curr) => {
        const type = curr.analysis_type;
        if (!acc[type]) {
          acc[type] = {
            count: 0,
            totalRevenue: 0,
            totalCost: 0,
            avgRoi: 0
          };
        }
        acc[type].count++;
        acc[type].totalRevenue += parseFloat(curr.total_revenue.toString());
        acc[type].totalCost += parseFloat(curr.total_cost.toString());
        return acc;
      }, {} as Record<string, any>) || {}
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('获取ROI分析API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
  })(request);
}

/**
 * POST /api/admin/costs/roi
 * 计算并保存ROI分析数据
 * 
 * Body:
 * {
 *   "analysisType": "period", // period/product/channel
 *   "referenceId": "optional-id",
 *   "analysisPeriod": "daily", // daily/weekly/monthly
 *   "date": "2025-10-31" // 可选，默认今天
 * }
 */
export async function POST(request: NextRequest) {
  return withStatsPermission(async (request, admin) => {
  try {
    const body = await request.json();
    const {
      analysisType,
      referenceId = null,
      analysisPeriod,
      date = new Date().toISOString().split('T')[0]
    } = body;

    if (!analysisType || !analysisPeriod) {
      return NextResponse.json(
        { error: 'analysisType 和 analysisPeriod 为必填参数' },
        { status: 400 }
      );
    }

    // 调用ROI计算函数
    const { data, error } = await supabase
      .rpc('calculate_roi_for_period', {
        p_analysis_type: analysisType,
        p_reference_id: referenceId,
        p_analysis_period: analysisPeriod,
        target_date: date
      });

    if (error) {
      console.error('计算ROI分析数据失败:', error);
      return NextResponse.json(
        { error: '计算ROI分析数据失败', details: error.message },
        { status: 500 }
      );
    }

    // 获取计算结果
    const { data: resultData } = await supabase
      .from('roi_analysis')
      .select('*')
      .eq('analysis_type', analysisType)
      .eq('reference_id', referenceId || '')
      .eq('analysis_date', date)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      message: 'ROI分析数据计算完成',
      data: resultData
    });

  } catch (error) {
    console.error('计算ROI分析API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
  })(request);
}