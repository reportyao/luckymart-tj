// 创建提现申请
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { calculateWithdrawFee } from '@/lib/utils';
import { validationEngine } from '@/lib/validation';
import type { ApiResponse, WithdrawRequest } from '@/types';

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

    // 重新检查余额（包含手续费）
    if (userData.platform_balance < totalRequired) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `余额不足。需要 ${totalRequired} TJS（含手续费 ${fee} TJS），当前余额 ${userData.platform_balance} TJS`
      }, { status: 400 });
    }

    // 创建提现申请
    const { data: withdrawRequest, error: insertError } = await supabaseAdmin
      .from('withdraw_requests')
      .insert({
        user_id: user.userId,
        amount: amountNum,
        fee,
        actual_amount: amountNum - fee,
        withdraw_method: paymentMethod,
        account_info: { account: paymentAccount },
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 扣除余额
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        platform_balance: userData.platform_balance - totalRequired 
      })
      .eq('id', user.userId);

    if (updateError) throw updateError;

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
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '创建提现申请失败'
    }, { status: 500 });
  }
}
