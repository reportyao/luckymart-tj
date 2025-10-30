// 购买转售商品 - 使用数据库事务确保完整性
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/utils';
import type { ApiResponse } from '@/types';
import { randomUUID } from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const requestId = randomUUID();
  
  try {
    console.log(`[${requestId}] 开始处理转售购买请求`);

    // 验证用户
    const user = getUserFromRequest(request);
    if (!user) {
      console.log(`[${requestId}] 用户未授权`);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { status: 401 });
    }

    const listingId = params.id;
    console.log(`[${requestId}] 处理商品ID: ${listingId}`);

    // 验证listingId格式
    if (!listingId || typeof listingId !== 'string') {
      console.log(`[${requestId}] 无效的商品ID格式`);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '无效的商品ID'
      }, { status: 400 });
    }

    // 生成订单号
    const orderNumber = generateOrderNumber();
    console.log(`[${requestId}] 生成订单号: ${orderNumber}`);

    // 调用数据库事务函数处理整个购买流程
    const { data: result, error: transactionError } = await supabaseAdmin
      .rpc('process_resale_purchase_atomic', {
        p_listing_id: listingId,
        p_buyer_user_id: user.userId,
        p_order_number: orderNumber,
        p_request_id: requestId
      });

    const executionTime = Date.now() - startTime;
    console.log(`[${requestId}] 事务执行完成，耗时: ${executionTime}ms`);

    // 处理数据库函数执行错误
    if (transactionError) {
      console.error(`[${requestId}] 数据库事务执行失败:`, transactionError);
      
      // 根据错误类型返回合适的错误信息
      let errorMessage = '购买失败，请稍后重试';
      let statusCode = 500;

      if (transactionError.message?.includes('转售商品不存在')) {
        errorMessage = '转售商品不存在或已售出';
        statusCode = 404;
      } else if (transactionError.message?.includes('商品已售出') || 
                 transactionError.message?.includes('商品已被购买')) {
        errorMessage = '商品已被购买，请选择其他商品';
        statusCode = 409;
      } else if (transactionError.message?.includes('余额不足')) {
        errorMessage = transactionError.message;
        statusCode = 400;
      } else if (transactionError.message?.includes('不能购买自己的')) {
        errorMessage = transactionError.message;
        statusCode = 400;
      } else if (transactionError.message?.includes('用户不存在') || 
                 transactionError.message?.includes('关联订单') ||
                 transactionError.message?.includes('商品不存在')) {
        errorMessage = '数据异常，请联系客服';
        statusCode = 400;
      } else if (transactionError.code === 'PGRST116') {
        errorMessage = '转售商品不存在';
        statusCode = 404;
      } else if (transactionError.code === '23505') {
        errorMessage = '数据已存在，无法重复购买';
        statusCode = 409;
      } else if (transactionError.code === '55P03') {
        errorMessage = '系统繁忙，请稍后重试';
        statusCode = 503;
      }

      return NextResponse.json<ApiResponse>({
        success: false,
        error: errorMessage
      }, { status: statusCode });
    }

    // 检查事务函数返回的结果
    if (!result) {
      console.log(`[${requestId}] 事务函数返回空结果`);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '系统异常，请稍后重试'
      }, { status: 500 });
    }

    // 解析事务结果
    const transactionResult = typeof result === 'string' ? JSON.parse(result) : result;

    if (!transactionResult.success) {
      // 业务逻辑错误（如余额不足等）
      console.log(`[${requestId}] 业务逻辑错误:`, transactionResult.error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: transactionResult.error || '购买失败'
      }, { status: 400 });
    }

    // 成功购买，返回结果
    console.log(`[${requestId}] 购买成功，订单: ${transactionResult.data?.order?.order_number}`);
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...transactionResult.data,
        execution_time: executionTime
      },
      message: transactionResult.message || '购买成功！商品已转入您的订单'
    });

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`[${requestId}] 购买转售商品异常 (${executionTime}ms):`, error);
    
    // 记录详细错误信息用于调试
    if (error instanceof Error) {
      console.error(`[${requestId}] 错误堆栈:`, error.stack);
      console.error(`[${requestId}] 错误详情:`, {
        message: error.message,
        name: error.name,
        cause: error.cause
      });
    }
    
    // 返回通用错误响应
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '系统异常，请稍后重试'
    }, { status: 500 });
  }
}

// GET方法用于检查转售商品状态
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

    // 查询转售商品信息
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('resale_listings')
      .select(`
        id,
        seller_user_id,
        buyer_user_id,
        listing_price,
        platform_fee,
        status,
        listed_at,
        sold_at,
        orders:order_id (
          id,
          round_id,
          products:product_id (
            id,
            name_zh,
            name_tj,
            image_url
          )
        )
      `)
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '转售商品不存在'
      }, { status: 404 });
    }

    // 返回商品信息（敏感信息如余额等已在前端查询）
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        listing: {
          id: listing.id,
          listing_price: Number(listing.listing_price),
          platform_fee: Number(listing.platform_fee),
          status: listing.status,
          listed_at: listing.listed_at,
          sold_at: listing.sold_at,
          is_owner: listing.seller_user_id === user.userId,
          is_sold: listing.status !== 'active',
          product: listing.orders?.products ? {
            id: listing.orders.products.id,
            name_zh: listing.orders.products.name_zh,
            name_tj: listing.orders.products.name_tj,
            image_url: listing.orders.products.image_url
          } : null
        }
      }
    });

  } catch (error: any) {
    console.error('获取转售商品信息失败:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '获取商品信息失败'
    }, { status: 500 });
  }
}