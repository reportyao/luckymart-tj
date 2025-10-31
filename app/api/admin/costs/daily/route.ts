import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 获取数据库连接
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/admin/costs/daily
 * 获取每日成本统计数据
 * 
 * Query Parameters:
 * - date: 特定日期 (格式: YYYY-MM-DD)
 * - startDate: 开始日期 (格式: YYYY-MM-DD)
 * - endDate: 结束日期 (格式: YYYY-MM-DD)
 * - page: 页码
 * - limit: 每页记录数
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('cost_statistics')
      .select('*')
      .order('stat_date', { ascending: false });

    if (date) {
      query = query.eq('stat_date', date);
    } else if (startDate && endDate) {
      query = query
        .gte('stat_date', startDate)
        .lte('stat_date', endDate);
    } else {
      // 默认获取最近30天的数据
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('stat_date', thirtyDaysAgo.toISOString().split('T')[0]);
    }

    // 获取总数
    const { count } = await query.select('*', { count: 'exact', head: true });
    
    // 获取分页数据
    const { data: costData, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('查询成本统计数据失败:', error);
      return NextResponse.json(
        { error: '查询成本统计数据失败' },
        { status: 500 }
      );
    }

    // 计算汇总统计
    const totalStats = costData?.reduce((acc, curr) => {
      acc.totalCost += parseFloat(curr.total_cost.toString());
      acc.incentiveCost += parseFloat(curr.incentive_cost.toString());
      acc.operationCost += parseFloat(curr.operation_cost.toString());
      acc.referralCost += parseFloat(curr.referral_cost.toString());
      acc.lotteryCost += parseFloat(curr.lottery_cost.toString());
      return acc;
    }, {
      totalCost: 0,
      incentiveCost: 0,
      operationCost: 0,
      referralCost: 0,
      lotteryCost: 0
    }) || {};

    const response = {
      data: costData || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      },
      summary: {
        period: date ? date : `${startDate || ''} - ${endDate || ''}`,
        totalCost: totalStats.totalCost,
        averageDailyCost: (totalStats.totalCost / (costData?.length || 1)),
        costBreakdown: {
          incentive: totalStats.incentiveCost,
          operation: totalStats.operationCost,
          referral: totalStats.referralCost,
          lottery: totalStats.lotteryCost
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('获取每日成本统计API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/costs/daily
 * 计算并保存指定日期的成本统计数据
 * 
 * Body:
 * {
 *   "date": "2025-10-31", // 可选，默认今天
 *   "forceRecalculate": false // 是否强制重新计算
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const targetDate = body.date || new Date().toISOString().split('T')[0];
    const forceRecalculate = body.forceRecalculate || false;

    // 检查是否已存在该日期的数据
    if (!forceRecalculate) {
      const { data: existing } = await supabase
        .from('cost_statistics')
        .select('id')
        .eq('stat_date', targetDate)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: '该日期的成本数据已存在，如需重新计算请设置 forceRecalculate=true' },
          { status: 400 }
        );
      }
    }

    // 调用成本聚合函数
    const { data, error } = await supabase
      .rpc('aggregate_daily_cost_statistics', {
        target_date: targetDate
      });

    if (error) {
      console.error('计算成本统计数据失败:', error);
      return NextResponse.json(
        { error: '计算成本统计数据失败', details: error.message },
        { status: 500 }
      );
    }

    // 获取计算结果
    const { data: resultData } = await supabase
      .from('cost_statistics')
      .select('*')
      .eq('stat_date', targetDate)
      .single();

    return NextResponse.json({
      success: true,
      message: '成本统计数据计算完成',
      date: targetDate,
      data: resultData
    });

  } catch (error) {
    console.error('计算每日成本统计API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}