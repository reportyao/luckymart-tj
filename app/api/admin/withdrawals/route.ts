// 管理员 - 提现审核
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import type { ApiResponse } from '@/types';

// 获取提现申请列表
export async function GET(request: Request) {
  try {
    // 验证管理员权限（简化版，实际应该验证是否为管理员）
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 构建查询
    let query = supabaseAdmin
      .from('withdraw_requests')
      .select(`
        *,
        users(id, username, firstName, telegramId)
      `, { count: 'exact' })
      .order('createdAt', { ascending: false });

    // 状态筛选
    if (status && ['pending', 'processing', 'completed', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: withdrawals, error, count } = await query;

    if (error) throw error;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        withdrawals: withdrawals || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('获取提现列表失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '获取提现列表失败'
    }, { status: 500 });
  }
}

// 审核提现申请
export async function POST(request: Request) {
  try {
    // 验证管理员权限
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { status: 401 });
    }

    const body = await request.json();
    const { withdrawId, action, adminNote } = body;

    // 验证参数
    if (!withdrawId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '无效的参数'
      }, { status: 400 });
    }

    // 获取提现申请
    const { data: withdraw, error: withdrawError } = await supabaseAdmin
      .from('withdraw_requests')
      .select('*, users(platform_balance)')
      .eq('id', withdrawId)
      .single();

    if (withdrawError || !withdraw) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '提现申请不存在'
      }, { status: 404 });
    }

    // 检查状态
    if (withdraw.status !== 'pending') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '该申请已经处理过了'
      }, { status: 400 });
    }

    if (action === 'approve') {
      // 通过申请
      await supabaseAdmin
        .from('withdraw_requests')
        .update({
          status: 'completed',
          admin_note: adminNote || '审核通过',
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawId);

      // 发送通知
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: withdraw.user_id,
          type: 'withdraw_approved',
          content: `您的提现申请已通过，${withdraw.actual_amount} TJS 将在1-3个工作日内到账`,
          status: 'pending'
        });

    } else {
      // 拒绝申请 - 退回余额
      const totalAmount = withdraw.amount + withdraw.fee;
      
      await supabaseAdmin
        .from('users')
        .update({ 
          platform_balance: withdraw.users.platform_balance + totalAmount 
        })
        .eq('id', withdraw.user_id);

      await supabaseAdmin
        .from('withdraw_requests')
        .update({
          status: 'rejected',
          admin_note: adminNote || '审核未通过',
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawId);

      // 记录退款交易
      await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: withdraw.user_id,
          type: 'refund',
          amount: totalAmount,
          balance_type: 'platform_balance',
          related_order_id: withdrawId,
          description: `提现申请被拒绝，退回 ${totalAmount} TJS`
        });

      // 发送通知
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: withdraw.user_id,
          type: 'withdraw_rejected',
          content: `您的提现申请被拒绝，${totalAmount} TJS 已退回账户。原因：${adminNote || '未通过审核'}`,
          status: 'pending'
        });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: action === 'approve' ? '提现申请已通过' : '提现申请已拒绝'
    });

  } catch (error: any) {
    console.error('审核提现失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '审核提现失败'
    }, { status: 500 });
  }
}
