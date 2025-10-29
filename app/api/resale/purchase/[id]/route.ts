// 购买转售商品
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/utils';
import type { ApiResponse } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { status: 401 });
    }

    const listingId = params.id;

    // 获取转售商品信息
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('resale_listings')
      .select('*')
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (listingError || !listing) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '转售商品不存在或已售出'
      }, { status: 404 });
    }

    // 查询关联的订单和商品
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', listing.order_id)
      .single();

    const { data: product } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', listing.product_id)
      .single();

    // 不能购买自己的转售商品
    if (listing.seller_user_id === user.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '不能购买自己的转售商品'
      }, { status: 400 });
    }

    // 获取买家信息
    const { data: buyer, error: buyerError } = await supabaseAdmin
      .from('users')
      .select('platform_balance')
      .eq('id', user.userId)
      .single();

    if (buyerError || !buyer) {
      throw new Error('用户不存在');
    }

    // 检查余额
    if (buyer.platform_balance < listing.listing_price) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `余额不足。需要 ${Number(listing.listing_price).toFixed(2)} TJS，当前余额 ${Number(buyer.platform_balance).toFixed(2)} TJS`
      }, { status: 400 });
    }

    // 获取卖家信息
    const { data: seller, error: sellerError } = await supabaseAdmin
      .from('users')
      .select('platform_balance')
      .eq('id', listing.seller_user_id)
      .single();

    if (sellerError || !seller) {
      throw new Error('卖家不存在');
    }

    // 开始事务处理

    // 1. 扣除买家余额
    await supabaseAdmin
      .from('users')
      .update({ 
        platform_balance: Number(buyer.platform_balance) - Number(listing.listing_price)
      })
      .eq('id', user.userId);

    // 2. 增加卖家余额（转售收入）
    await supabaseAdmin
      .from('users')
      .update({ 
        platform_balance: Number(seller.platform_balance) + Number(listing.listing_price)
      })
      .eq('id', listing.seller_user_id);

    // 3. 更新转售记录状态
    await supabaseAdmin
      .from('resale_listings')
      .update({
        status: 'sold',
        buyer_user_id: user.userId,
        sold_at: new Date().toISOString()
      })
      .eq('id', listingId);

    // 4. 创建新订单给买家
    const orderNumber = generateOrderNumber();
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user.userId,
        round_id: order?.round_id,
        product_id: listing.product_id,
        type: 'resale_purchase',
        total_amount: Number(listing.listing_price),
        payment_status: 'paid',
        fulfillment_status: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 5. 标记原订单为已转售
    await supabaseAdmin
      .from('orders')
      .update({ 
        fulfillment_status: 'resold'
      })
      .eq('id', listing.order_id);

    // 6. 记录买家交易
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: user.userId,
        type: 'resale_purchase',
        amount: -Number(listing.listing_price),
        balance_type: 'platform_balance',
        related_order_id: newOrder.id,
        description: `购买转售商品：${product?.name_zh || '未知商品'}`
      });

    // 7. 记录卖家交易
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: listing.seller_user_id,
        type: 'resale_income',
        amount: Number(listing.listing_price),
        balance_type: 'platform_balance',
        related_order_id: listing.order_id,
        description: `转售收入：${product?.name_zh || '未知商品'}`
      });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { order: newOrder },
      message: '购买成功！商品已转入您的订单'
    });

  } catch (error: any) {
    console.error('购买转售商品失败:', error);
    
    // 区分不同类型的错误
    let errorMessage = '购买转售商品失败';
    let statusCode = 500;

    if (error.code === 'PGRST116') {
      errorMessage = '转售商品不存在';
      statusCode = 404;
    } else if (error.code === '23505') {
      errorMessage = '数据已存在，无法重复购买';
      statusCode = 409;
    } else if (error.code === '23503') {
      errorMessage = '数据关联错误';
      statusCode = 400;
    } else if (error.message?.includes('余额不足')) {
      errorMessage = error.message;
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
