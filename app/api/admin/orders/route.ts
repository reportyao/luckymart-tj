// 管理员 - 订单管理
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import type { ApiResponse } from '@/types';

// 获取订单列表
export async function GET(request: Request) {
  try {
    // 验证管理员权限
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // 构建查询
    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        users(username, firstName, telegramId),
        products(nameZh, nameEn, imageUrl)
      `, { count: 'exact' })
      .order('createdAt', { ascending: false });

    // 状态筛选
    if (status) {
      query = query.eq('status', status);
    }

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) throw error;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        orders: orders || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('获取订单列表失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '获取订单列表失败'
    }, { status: 500 });
  }
}

// 更新订单状态（发货）
export async function POST(request: Request) {
  try {
    // 验证管理员权限
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, trackingNumber } = body;

    // 验证参数
    if (!orderId || !trackingNumber) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '缺少必填参数'
      }, { status: 400 });
    }

    // 获取订单
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '订单不存在'
      }, { status: 404 });
    }

    // 检查订单状态
    if (order.status !== 'pending_shipment') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '订单状态不正确'
      }, { status: 400 });
    }

    // 更新订单状态
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'shipped',
        trackingNumber,
        updatedAt: new Date().toISOString()
      })
      .eq('id', orderId);

    // 发送通知
    await supabaseAdmin
      .from('notifications')
      .insert({
        userId: order.userId,
        type: 'order_shipped',
        title: '商品已发货',
        content: `您的订单 ${order.orderNumber} 已发货，物流单号：${trackingNumber}`,
        isRead: false
      });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '发货成功'
    });

  } catch (error: any) {
    console.error('发货失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '发货失败'
    }, { status: 500 });
  }
}
