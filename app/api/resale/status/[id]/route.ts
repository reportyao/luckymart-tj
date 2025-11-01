// 转售状态查询API
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import type { ApiResponse } from '@/types';
import { getLogger } from '@/lib/logger';

export async function GET(
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

    // 获取转售商品详细信息
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
              name_en,
              images,
              market_price
            )
          )
        )
      `)
      .eq('id', listingId)
      .single();

    if (!listing || !listing.orders?.lottery_rounds?.products) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '转售记录不存在'
      }, { status: 404 });
    }

    // 检查权限（只能查看自己的转售记录或公共信息）
    const isOwner = listing.seller_user_id === user.userId;
    const product = listing.orders.lottery_rounds.products;

    // 生成状态描述和进度信息
    const statusInfo = getStatusInfo(listing);

    // 如果不是所有者，隐藏敏感信息
    const responseData = {
      id: listing.id,
      status: listing.status,
      listedAt: listing.listed_at,
      soldAt: listing.sold_at,
      estimatedMatchTime: listing.estimated_match_time,
      product: {
        id: product.id,
        name: product.name_zh,
        nameEn: product.name_en,
        images: product.images,
        marketPrice: product.market_price
      },
      price: isOwner ? listing.listing_price : null,
      platformFee: isOwner ? listing.platform_fee : null,
      netAmount: isOwner ? listing.net_amount : null,
      isOwner,
      statusInfo,
      mysteryBuyer: isOwner && listing.platform_buyer_id ? getMysteryBuyerInfo(listing.platform_buyer_id) : null
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: responseData
    });

  } catch (error: any) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'查询转售状态失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '查询转售状态失败'
    }, { status: 500 });
  }
}

function getStatusInfo(listing: any) {
  const now = new Date();
  const listedAt = new Date(listing.listed_at);
  const estimatedMatchTime = listing.estimated_match_time ? new Date(listing.estimated_match_time) : null;

  switch (listing.status) {
    case 'active':
      return {
        title: '正在寻找买家',
        description: '您的商品已在转售市场发布，寻找合适的买家...',
        progress: 25,
        nextAction: '等待平台匹配买家',
        color: 'blue'
      };

    case 'matching':
      const matchProgress = estimatedMatchTime ? 
        Math.min(100, Math.round(((now.getTime() - listedAt.getTime()) / (estimatedMatchTime.getTime() - listedAt.getTime())) * 100)) :
        50;

      return {
        title: '正在匹配买家',
        description: '平台正在火速为您匹配合适的买家，请耐心等待...',
        progress: matchProgress,
        nextAction: estimatedMatchTime ? 
          `预计 ${Math.ceil((estimatedMatchTime.getTime() - now.getTime()) / (1000 * 60))} 分钟内完成` :
          '匹配进行中',
        color: 'orange'
      };

    case 'sold':
      return {
        title: '交易成功',
        description: `恭喜！您的商品已成功售出，获得 ${listing.net_amount} TJS（已扣除手续费）`,
        progress: 100,
        nextAction: '资金已存入平台余额，可随时提现或消费',
        color: 'green'
      };

    default:
      return {
        title: '未知状态',
        description: '转售状态异常，请联系客服',
        progress: 0,
        nextAction: '联系客服处理',
        color: 'red'
      };
  }
}

function getMysteryBuyerInfo(buyerId: string) {
  const buyers = {
    'platform_buyer_1': { username: '幸运的买家A88', avatar: '/images/bot-avatar-1.png' },
    'platform_buyer_2': { username: '杜尚别淘金者', avatar: '/images/bot-avatar-2.png' },
    'platform_buyer_3': { username: '塔吉克斯坦收藏家', avatar: '/images/bot-avatar-3.png' },
    'platform_buyer_4': { username: '神秘买家M99', avatar: '/images/bot-avatar-4.png' },
    'platform_buyer_5': { username: '本地数码爱好者', avatar: '/images/bot-avatar-5.png' }
  };

  return buyers[buyerId] || { username: '神秘买家', avatar: '/images/default-avatar.png' };
}