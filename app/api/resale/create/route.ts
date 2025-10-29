// 创建转售商品
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import type { ApiResponse, ResaleListing } from '@/types';

export async function POST(request: Request) {
  try {
    // 验证用户
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, price } = body;

    // 验证参数
    if (!orderId || !price || price <= 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '无效的参数'
      }, { status: 400 });
    }

    // 验证订单归属和状态
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, products(marketPrice)')
      .eq('id', orderId)
      .eq('userId', user.userId)
      .single();

    if (orderError || !order) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '订单不存在或无权操作'
      }, { status: 404 });
    }

    // 检查订单状态（只有待收货地址或已发货的订单才能转售）
    if (!['pending_address', 'pending_shipment', 'shipped'].includes(order.status)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '该订单状态不允许转售'
      }, { status: 400 });
    }

    // 检查是否已经在转售中
    if (order.isResale) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '该订单已在转售中'
      }, { status: 400 });
    }

    // 检查是否已存在转售记录
    const { data: existingListing } = await supabaseAdmin
      .from('resale_listings')
      .select('*')
      .eq('orderId', orderId)
      .eq('status', 'active')
      .single();

    if (existingListing) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '该订单已有转售记录'
      }, { status: 400 });
    }

    // 价格范围验证（不能高于市场价的80%）
    const maxPrice = order.products.marketPrice * 0.8;
    if (price > maxPrice) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `转售价格不能高于市场价的80%（${maxPrice} TJS）`
      }, { status: 400 });
    }

    // 创建转售记录
    const { data: resaleListing, error: insertError } = await supabaseAdmin
      .from('resale_listings')
      .insert({
        orderId,
        sellerId: user.userId,
        productId: order.productId,
        price,
        status: 'active'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 更新订单的转售状态
    await supabaseAdmin
      .from('orders')
      .update({ 
        isResale: true,
        resalePrice: price 
      })
      .eq('id', orderId);

    return NextResponse.json<ApiResponse<ResaleListing>>({
      success: true,
      data: resaleListing,
      message: '转售商品创建成功'
    });

  } catch (error: any) {
    console.error('创建转售失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '创建转售失败'
    }, { status: 500 });
  }
}
