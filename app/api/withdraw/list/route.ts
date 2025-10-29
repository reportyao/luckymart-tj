// 获取提现申请列表
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import type { ApiResponse, WithdrawRequest } from '@/types';

export async function GET(request: Request) {
  try {
    // 验证用户
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { status: 401 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 构建查询
    let query = supabaseAdmin
      .from('withdraw_requests')
      .select('*', { count: 'exact' })
      .eq('userId', user.userId)
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
