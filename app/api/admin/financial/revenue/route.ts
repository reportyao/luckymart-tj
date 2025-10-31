import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 获取数据库连接
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/admin/financial/revenue
 * 获取收入统计数据
 * 
 * Query Parameters:
 * - periodType: 期间类型 (daily/weekly/monthly/quarterly)
 * - startDate: 开始日期
 * - endDate: 结束日期
 * - limit: 限制返回记录数
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodType = searchParams.get('periodType') || 'daily';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('revenue_statistics')
      .select('*')
      .eq('period_type', periodType)
      .order('period_start', { ascending: false })
      .limit(limit);

    if (startDate && endDate) {
      query = query
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

    const { data: revenueData, error } = await query;

    if (error) {
      console.error('查询收入统计数据失败:', error);
      return NextResponse.json(
        { error: '查询收入统计数据失败' },
        { status: 500 }
      );
    }

    // 计算汇总统计
    const totalStats = revenueData?.reduce((acc, curr) => {
      acc.totalRevenue += parseFloat(curr.total_revenue.toString());
      acc.actualReceived += parseFloat(curr.actual_received.toString());
      acc.totalOrders += curr.order_count;
      return acc;
    }, {
      totalRevenue: 0,
      actualReceived: 0,
      totalOrders: 0
    }) || {};

    const averageOrderValue = totalStats.totalOrders > 0 
      ? totalStats.totalRevenue / totalStats.totalOrders 
      : 0;

    // 计算增长率
    let growthRate = 0;
    if (revenueData && revenueData.length > 1) {
      const current = revenueData[0];
      const previous = revenueData[1];
      if (previous && previous.total_revenue > 0) {
        growthRate = ((current.total_revenue - previous.total_revenue) / previous.total_revenue) * 100;
      }
    }

    // 趋势数据
    const trendData = revenueData?.slice(0, 30).reverse().map(item => ({
      date: item.period_start,
      totalRevenue: parseFloat(item.total_revenue.toString()),
      actualReceived: parseFloat(item.actual_received.toString()),
      orderCount: item.order_count,
      averageOrderValue: parseFloat(item.average_order_value.toString()),
      growthRate: item.growth_rate ? parseFloat(item.growth_rate.toString()) : null
    })) || [];

    // 按期间类型分组统计
    const periodBreakdown = revenueData?.reduce((acc, curr) => {
      const period = curr.period_start;
      if (!acc[period]) {
        acc[period] = {
          revenue: 0,
          actualReceived: 0,
          orders: 0
        };
      }
      acc[period].revenue += parseFloat(curr.total_revenue.toString());
      acc[period].actualReceived += parseFloat(curr.actual_received.toString());
      acc[period].orders += curr.order_count;
      return acc;
    }, {} as Record<string, any>) || {};

    const response = {
      data: revenueData || [],
      summary: {
        period: `${startDate || ''} - ${endDate || ''}`,
        totalRevenue: totalStats.totalRevenue,
        actualReceived: totalStats.actualReceived,
        totalOrders: totalStats.totalOrders,
        averageOrderValue,
        platformFees: totalStats.totalRevenue - totalStats.actualReceived,
        growthRate,
        periodType
      },
      periodBreakdown,
      trendData,
      revenueDistribution: {
        actualReceived: totalStats.actualReceived,
        platformFees: totalStats.totalRevenue - totalStats.actualReceived,
        percentage: {
          actualReceived: totalStats.totalRevenue > 0 
            ? (totalStats.actualReceived / totalStats.totalRevenue) * 100 
            : 0,
          platformFees: totalStats.totalRevenue > 0 
            ? ((totalStats.totalRevenue - totalStats.actualReceived) / totalStats.totalRevenue) * 100 
            : 0
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('获取收入统计API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/financial/revenue
 * 计算并保存收入统计数据
 * 
 * Body:
 * {
 *   "periodType": "daily",
 *   "date": "2025-10-31"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      periodType = 'daily',
      date = new Date().toISOString().split('T')[0]
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
      return NextResponse.json(
        { error: '不支持的期间类型' },
        { status: 400 }
      );
    }

    // 计算收入数据
    const startISO = periodStart.toISOString().split('T')[0];
    const endISO = periodEnd.toISOString().split('T')[0];

    // 从订单表计算总收入
    const { data: ordersData } = await supabase
      .from('orders')
      .select('total_amount, payment_status')
      .eq('payment_status', 'completed')
      .gte('created_at', `${startISO}T00:00:00`)
      .lte('created_at', `${endISO}T23:59:59`);

    const totalRevenue = ordersData?.reduce((sum, order) => 
      sum + parseFloat(order.total_amount.toString()), 0) || 0;

    const actualReceived = totalRevenue * 0.95; // 假设平台收取5%手续费

    // 计算订单数量
    const orderCount = ordersData?.length || 0;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // 获取上一期的数据用于计算增长率
    let growthRate = null;
    const { data: previousData } = await supabase
      .from('revenue_statistics')
      .select('total_revenue')
      .eq('period_type', periodType)
      .order('period_start', { ascending: false })
      .limit(1)
      .single();

    if (previousData && previousData.total_revenue > 0) {
      growthRate = ((totalRevenue - previousData.total_revenue) / previousData.total_revenue) * 100;
    }

    // 插入或更新数据
    const { data, error } = await supabase
      .from('revenue_statistics')
      .upsert({
        period_type: periodType,
        period_start: startISO,
        period_end: endISO,
        total_revenue: totalRevenue,
        actual_received: actualReceived,
        order_count: orderCount,
        average_order_value: averageOrderValue,
        growth_rate: growthRate
      }, {
        onConflict: 'period_type,period_start'
      })
      .select()
      .single();

    if (error) {
      console.error('保存收入统计数据失败:', error);
      return NextResponse.json(
        { error: '保存收入统计数据失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '收入统计数据计算完成',
      data: {
        periodType,
        periodStart: startISO,
        periodEnd: endISO,
        totalRevenue,
        actualReceived,
        orderCount,
        averageOrderValue,
        growthRate
      }
    });

  } catch (error) {
    console.error('计算收入统计API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}