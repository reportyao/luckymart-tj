import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { validationEngine } from '@/lib/validation';
import type { ApiResponse } from '@/types';
// 智能定价建议API

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
    const { orderId, customPrice } = body;

    if (!orderId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '订单ID不能为空'
      }, { status: 400 });
    }

    // 获取订单和商品信息
    const { data: order } = await supabaseAdmin;
      .from('orders')
      .select(`
        *,
        lottery_rounds!inner (
          product_id,
          products!inner (
            id,
            name_zh,
            market_price
          )
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.userId)
      .single();

    if (!order || !order.lottery_rounds?.products) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '订单不存在或无权操作'
      }, { status: 404 });
    }

    const product = order.lottery_rounds.products;
    const marketPrice = product.market_price;

    // 基础定价策略
    const priceRecommendations = [;
      {
        type: '建议售价',
        price: Math.round(marketPrice * 0.8), // 80% 市场价
        percentage: 80,
        description: '快速成交的最佳选择',
        estimatedTime: '1小时内快速成交'
      },
      {
        type: '保守定价',
        price: Math.round(marketPrice * 0.85), // 85% 市场价
        percentage: 85,
        description: '更稳妥的定价策略',
        estimatedTime: '2-4小时成交'
      },
      {
        type: '较高定价',
        price: Math.round(marketPrice * 0.9), // 90% 市场价
        percentage: 90,
        description: '追求更高收益',
        estimatedTime: '半天到一天'
      }
    ];

    // 获取系统验证配置
    try {
      const { data: settings } = await supabaseAdmin;
        .from('system_validation_settings')
        .select('*');
      
      if (settings) {
        const config = settings.reduce((acc: any,  setting: any) => {
          acc[setting.setting_key] = setting.parsed_value;
          return acc;
        }, {} as any);
        
        validationEngine.setConfig(config);
      }
    } catch (configError) {
      console.warn('无法获取系统验证配置，使用默认设置:', configError);
    }

    // 如果用户输入了自定义价格，计算预期手续费和到账金额
    let customAnalysis: any = null;
    if (customPrice && customPrice > 0) {
      const customPriceNum = Number(customPrice);
      
      // 验证自定义价格
      const priceValidation = validationEngine.validateResalePrice(customPriceNum, marketPrice);
      const isReasonable = priceValidation.isValid;
      
      const platformFeeRate = 0.02; // 2% 平台手续费;
      const platformFee = Math.round(customPriceNum * platformFeeRate);
      const netAmount = customPriceNum - platformFee;

      // 获取建议价格范围
      const suggestedMin = Math.round(marketPrice * (1 - 0.3)); // 70% 市场价;
      const suggestedMax = Math.round(marketPrice * (1 - 0.1)); // 90% 市场价;

      customAnalysis = {
        price: customPriceNum,
        platformFee,
        netAmount,
        platformFeeRate,
        isReasonable,
        suggestedRange: {
          min: suggestedMin,
          max: suggestedMax
        },
        validationError: priceValidation.isValid ? null : priceValidation.error
      };
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        marketPrice,
        orderId,
        recommendations: priceRecommendations,
        customAnalysis
      },
      message: '定价建议获取成功'
    });

  } catch (error: any) {
    console.error('获取定价建议失败:', error);
    return NextResponse.json<ApiResponse>({
  }
      success: false,
      error: error.message || '获取定价建议失败'
    }, );
  }
}