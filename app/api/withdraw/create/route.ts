// 创建提现申请
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { calculateWithdrawFee } from '@/lib/utils';
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

    // 验证参数
    if (!amount || amount <= 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '提现金额必须大于0'
      }, { status: 400 });
    }

    if (!paymentMethod || !['alif_mobi', 'dc_bank'].includes(paymentMethod)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '无效的支付方式'
      }, { status: 400 });
    }

    if (!paymentAccount) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '请提供收款账号'
      }, { status: 400 });
    }

    // 最低提现金额
    const MIN_WITHDRAW = 50;
    if (amount < MIN_WITHDRAW) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `最低提现金额为 ${MIN_WITHDRAW} TJS`
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

    // 计算手续费
    const fee = calculateWithdrawFee(amount);
    const totalRequired = amount + fee;

    // 检查余额
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
        amount,
        fee,
        actual_amount: amount - fee,
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
        description: `提现申请 ${amount} TJS（手续费 ${fee} TJS）`
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
