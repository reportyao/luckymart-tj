// 创建转售商品
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { sendResaleStatusNotification } from '../../../bot/index';
import { validationEngine } from '@/lib/validation';
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

    // 基础参数验证
    if (!order_id || listing_price === undefined || listing_price === null) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '订单ID和转售价格是必填项'
      }, { status: 400 });
    }

    // 验证listing_price是否为有效数字
    const price = Number(listing_price);
    if (isNaN(price)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '转售价格必须是有效数字'
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

    // 获取系统验证配置
    try {
      const { data: settings } = await supabaseAdmin
        .from('system_validation_settings')
        .select('*');
      
      if (settings) {
        const config = settings.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.parsed_value;
          return acc;
        }, {} as any);
        
        validationEngine.setConfig(config);
      }
    } catch (configError) {
      console.warn('无法获取系统验证配置，使用默认设置:', configError);
    }

    // 严格的价格验证
    const priceValidation = validationEngine.validateResalePrice(price, Number(product.market_price));
    if (!priceValidation.isValid) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: priceValidation.error
      }, { status: 400 });
    }

    // 计算平台手续费和净收入
    const platformFeeRate = 0.02; // 可以从系统设置中获取
    const platformFee = Math.round(price * platformFeeRate * 100) / 100;
    const netAmount = price - platformFee;

    // 创建转售记录
    const { data: resaleListing, error: insertError } = await supabaseAdmin
      .from('resale_listings')
      .insert({
        order_id,
        seller_user_id: user.userId,
        product_id: order.product_id,
        listing_price: price,
        platform_fee: platformFee,
        net_amount: netAmount,
        status: 'active'
      })
      .select()
      .single();

    if (insertError) {throw insertError;}

    // 更新订单的转售状态（如果订单表有相关字段）
    // 注意：schema.prisma中orders表没有isResale和resalePrice字段
    // 这里需要根据实际业务需求来决定是否需要更新订单表

    return NextResponse.json<ApiResponse<ResaleListing>>({
      success: true,
      data: resaleListing,
      message: '转售商品创建成功！正在寻找买家，预计1-10分钟内快速成交。'
    }).then(async () => {
      // 发送转售创建通知给用户
      try {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('telegram_id')
          .eq('id', user.userId)
          .single();
        
        if (user?.telegram_id) {
          await sendResaleStatusNotification(
            user.telegram_id.toString(),
            resaleListing.id.toString(),
            'created'
          );
        }
      } catch (notificationError) {
        console.error('发送转售创建通知失败:', notificationError);
      }
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
