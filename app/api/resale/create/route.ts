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
    const { order_id, listing_price } = body;

    // 验证参数
    if (!order_id || !listing_price || listing_price <= 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '无效的参数：order_id 和 listing_price 是必需的'
      }, { status: 400 });
    }

    // 验证订单归属和状态
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', user.userId)
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
      .eq('order_id', order_id)
      .eq('status', 'active')
      .single();

    if (existingListing) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '该订单已有转售记录'
      }, { status: 400 });
    }

    // 获取商品信息进行价格验证
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('market_price')
      .eq('id', order.product_id)
      .single();

    if (!product) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '商品信息不存在'
      }, { status: 400 });
    }

    // 价格范围验证（不能高于市场价的80%）
    const maxPrice = Number(product.market_price) * 0.8;
    if (listing_price > maxPrice) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `转售价格不能高于市场价的80%（${maxPrice.toFixed(2)} TJS）`
      }, { status: 400 });
    }

    // 计算平台手续费（2%）和净收入
    const platformFeeRate = 0.02;
    const platformFee = Math.round(listing_price * platformFeeRate * 100) / 100;
    const netAmount = listing_price - platformFee;

    // 创建转售记录
    const { data: resaleListing, error: insertError } = await supabaseAdmin
      .from('resale_listings')
      .insert({
        order_id,
        seller_user_id: user.userId,
        product_id: order.product_id,
        listing_price,
        platform_fee: platformFee,
        net_amount: netAmount,
        status: 'active'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 更新订单的转售状态（如果订单表有相关字段）
    // 注意：schema.prisma中orders表没有isResale和resalePrice字段
    // 这里需要根据实际业务需求来决定是否需要更新订单表

    return NextResponse.json<ApiResponse<ResaleListing>>({
      success: true,
      data: resaleListing,
      message: '转售商品创建成功！正在寻找买家，预计1-10分钟内快速成交。'
    });

  } catch (error: any) {
    console.error('创建转售失败:', error);
    
    // 区分不同类型的错误
    let errorMessage = '创建转售失败';
    let statusCode = 500;

    if (error.code === 'PGRST116') {
      errorMessage = '资源不存在';
      statusCode = 404;
    } else if (error.code === '23505') {
      errorMessage = '数据已存在，无法重复创建';
      statusCode = 409;
    } else if (error.code === '23503') {
      errorMessage = '外键约束错误，订单或商品不存在';
      statusCode = 400;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: errorMessage
    }, { status: statusCode });
  }
}
