import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import type { ApiResponse, WithdrawRequest } from '@/types';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
// 获取提现申请列表
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `list_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('list_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
}
  } catch (error) {
    logger.error('list_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

}

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
    let query = supabaseAdmin;
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

    if (error) {throw error;} {

    return NextResponse.json<ApiResponse>({
  }
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
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'获取提现列表失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '获取提现列表失败'
    }, );
  }
}
