// 平台回购机制 - 模拟神秘买家自动购买
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateOrderNumber } from '@/lib/utils';
import type { ApiResponse } from '@/types';

// 平台小号池 - 这些是模拟的"神秘买家"
const PLATFORM_BUYERS = [
  {
    id: 'platform_buyer_1',
    username: '幸运的买家A88',
    avatar: '/images/bot-avatar-1.png'
  },
  {
    id: 'platform_buyer_2', 
    username: '杜尚别淘金者',
    avatar: '/images/bot-avatar-2.png'
  },
  {
    id: 'platform_buyer_3',
    username: '塔吉克斯坦收藏家',
    avatar: '/images/bot-avatar-3.png'
  },
  {
    id: 'platform_buyer_4',
    username: '神秘买家M99',
    avatar: '/images/bot-avatar-4.png'
  },
  {
    id: 'platform_buyer_5',
    username: '本地数码爱好者',
    avatar: '/images/bot-avatar-5.png'
  }
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { listingId } = body;

    if (!listingId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '转售ID不能为空'
      }, { status: 400 });
    }

    // 获取转售商品信息
    const { data: listing } = await supabaseAdmin
      .from('resale_listings')
      .select(`
        *,
        orders!inner (
          id,
          user_id,
          lottery_rounds!inner (
            products!inner (
              id,
              name_zh,
              images
            )
          )
        )
      `)
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (!listing || !listing.orders?.lottery_rounds?.products) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '转售商品不存在或已售出'
      }, { status: 404 });
    }

    // 随机选择一个平台买家
    const randomBuyer = PLATFORM_BUYERS[Math.floor(Math.random() * PLATFORM_BUYERS.length)];
    
    // 模拟匹配延迟时间（1-10分钟随机）
    const matchDelayMinutes = Math.floor(Math.random() * 10) + 1;
    const estimatedMatchTime = new Date(Date.now() + matchDelayMinutes * 60 * 1000);

    // 更新转售状态为匹配中
    await supabaseAdmin
      .from('resale_listings')
      .update({
        status: 'matching',
        estimated_match_time: estimatedMatchTime.toISOString(),
        platform_buyer_id: randomBuyer.id
      })
      .eq('id', listingId);

    // 创建一个延迟任务来处理实际购买（这里用简单的setTimeout模拟）
    // 在实际生产环境中，应该使用任务队列如Bull或Redis
    setTimeout(async () => {
      try {
        await processPlatformPurchase(listingId, randomBuyer);
      } catch (error) {
        console.error('平台购买处理失败:', error);
      }
    }, matchDelayMinutes * 60 * 1000);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        listingId,
        status: 'matching',
        estimatedMatchTime,
        mysteryBuyer: {
          username: randomBuyer.username,
          avatar: randomBuyer.avatar,
          id: randomBuyer.id
        },
        message: `您的商品已上架，正在火速为您匹配买家！预计${matchDelayMinutes}分钟内完成交易。`
      }
    });

  } catch (error: any) {
    console.error('平台回购失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '平台回购失败'
    }, { status: 500 });
  }
}

// 处理平台实际购买
async function processPlatformPurchase(listingId: string, buyer: any) {
  try {
    // 获取转售商品信息
    const { data: listing } = await supabaseAdmin
      .from('resale_listings')
      .select(`
        *,
        orders!inner (
          id,
          user_id,
          total_amount,
          lottery_rounds!inner (
            products!inner (
              id,
              name_zh
            )
          )
        )
      `)
      .eq('id', listingId)
      .single();

    if (!listing || listing.status !== 'matching') {
      return; // 如果状态不是匹配中，跳过处理
    }

    const order = listing.orders;
    const product = order.lottery_rounds.products;

    // 计算平台手续费（2%）和卖家实际到手金额
    const platformFeeRate = 0.02;
    const platformFee = Math.round(listing.listing_price * platformFeeRate);
    const sellerNetAmount = listing.listing_price - platformFee;

    // 模拟平台账户（实际上是平台自己购买）
    const PLATFORM_ACCOUNT_ID = 'platform_account';

    // 开始事务处理
    // 1. 更新转售记录为已售出
    await supabaseAdmin
      .from('resale_listings')
      .update({
        status: 'sold',
        buyer_user_id: PLATFORM_ACCOUNT_ID,
        sold_at: new Date().toISOString(),
        platform_fee: platformFee,
        net_amount: sellerNetAmount
      })
      .eq('id', listingId);

    // 2. 增加卖家余额（转售收入）
    const { data: seller } = await supabaseAdmin
      .from('users')
      .select('platform_balance')
      .eq('id', order.user_id)
      .single();

    if (seller) {
      await supabaseAdmin
        .from('users')
        .update({
          platform_balance: seller.platform_balance + sellerNetAmount
        })
        .eq('id', order.user_id);

      // 3. 记录卖家交易
      await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: order.user_id,
          type: 'resale_income',
          amount: sellerNetAmount,
          balance_type: 'platform_balance',
          related_order_id: order.id,
          description: `转售收入：${product.name_zh} (已扣除手续费 ${platformFee} TJS)`
        });
    }

    // 4. 标记原订单为已转售
    await supabaseAdmin
      .from('orders')
      .update({
        fulfillment_status: 'resold'
      })
      .eq('id', order.id);

    console.log(`转售交易完成: ${product.name_zh}, 卖家获得 ${sellerNetAmount} TJS`);
    
  } catch (error) {
    console.error('处理平台购买时出错:', error);
  }
}