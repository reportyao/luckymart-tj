// 创建提现申请
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { calculateWithdrawFee } from '@/lib/utils';
import { validationEngine } from '@/lib/validation';
import { withRateLimit, withdrawRateLimit } from '@/lib/rate-limit-middleware';
import { rateLimitMonitor } from '@/lib/rate-limit-monitor';
import type { ApiResponse, WithdrawRequest } from '@/types';

// 应用速率限制的提现处理函数
const handleWithdrawRequest = async (request: NextRequest) => {
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
    const { amount, paymentMethod, paymentAccount } = body;

    // 基础参数验证
    if (amount === undefined || amount === null) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '提现金额是必填项'
      }, { status: 400 });
    }

    if (!paymentMethod || !['alif_mobi', 'dc_bank'].includes(paymentMethod)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '无效的支付方式'
      }, { status: 400 });
    }

    if (!paymentAccount || typeof paymentAccount !== 'string') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '请提供有效的收款账号'
      }, { status: 400 });
    }

    // 验证提现金额
    const amountNum = Number(amount);
    if (isNaN(amountNum)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '提现金额必须是有效数字'
      }, { status: 400 });
    }

    // 验证账户信息
    const accountValidation = validationEngine.validateAccountInfo(paymentAccount, '收款账号');
    if (!accountValidation.isValid) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: accountValidation.error
      }, { status: 400 });
    }

    // 查询用户余额
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('platform_balance')
      .eq('id', user.userId)
      .single();

    if (userError || !userData) {
      throw new Error('用户不存在');
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

    // 严格的提现金额验证
    const withdrawValidation = validationEngine.validateWithdrawAmount(amountNum, userData.platform_balance);
    if (!withdrawValidation.isValid) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: withdrawValidation.error
      }, { status: 400 });
    }

    // 计算手续费
    const fee = calculateWithdrawFee(amountNum);
    const totalRequired = amountNum + fee;

    // 使用原子操作扣除余额，防止并发冲突
    const { data: withdrawRequest, error: withdrawError } = await supabaseAdmin.rpc('create_withdraw_request_atomic', {
      p_user_id: user.userId,
      p_amount: amountNum,
      p_fee: fee,
      p_actual_amount: amountNum - fee,
      p_payment_method: paymentMethod,
      p_payment_account: paymentAccount,
      p_total_required: totalRequired
    });

    if (withdrawError) {
      // 如果是余额不足或并发冲突错误，返回更友好的错误信息
      if (withdrawError.message?.includes('余额不足') || withdrawError.message?.includes('insufficient')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: '余额不足，无法创建提现申请'
        }, { status: 400 });
      }
      throw withdrawError;
    }

    // 记录交易
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: user.userId,
        type: 'withdraw',
        amount: -totalRequired,
        balance_type: 'platform_balance',
        related_order_id: withdrawRequest.id,
        description: `提现申请 ${amountNum} TJS（手续费 ${fee} TJS）`
      });

    return NextResponse.json<ApiResponse<WithdrawRequest>>({
      success: true,
      data: withdrawRequest,
      message: '提现申请提交成功，请等待审核'
    });

  } catch (error: any) {
    console.error('创建提现申请失败:', error);
    
    // 记录速率限制监控数据
    rateLimitMonitor.recordMetric({
      timestamp: Date.now(),
      endpoint: '/api/withdraw/create',
      identifier: 'unknown',
      hits: 1,
      blocked: false,
      strategy: 'token_bucket',
      windowMs: 60 * 60 * 1000,
      limit: 3,
      remaining: 0,
      resetTime: Date.now() + 60 * 60 * 1000,
      responseTime: Date.now()
    });

    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '创建提现申请失败'
    }, { status: 500 });
  }
};

// 应用速率限制并导出处理函数
const processRequest = withRateLimit(handleWithdrawRequest, withdrawRateLimit({
  onLimitExceeded: async (result, request) => {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '提现操作过于频繁，请稍后再试',
      rateLimit: {
        limit: result.totalHits + result.remaining,
        remaining: result.remaining,
        resetTime: new Date(result.resetTime).toISOString()
      }
    }, {
      status: 429,
      headers: {
        'X-RateLimit-Limit': (result.totalHits + result.remaining).toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString()
      }
    });
  }
}));

// 导出主处理函数
export { processRequest as POST };
