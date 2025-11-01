import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { invitationService } from '@/lib/services/invitation-service';
import type { ApiResponse, CommissionQuery, CommissionResponse } from '@/types';
import { getLogger } from '@/lib/logger';
/**
 * 查询消费返利记录 API
 * GET /api/invitation/commission
 */


const logger = getLogger();

// 查询消费返利记录的处理函数
async function handleGetCommission(request: NextRequest, user: any) {
  try {
    const userId = user.userId;

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    
    const queryOptions: CommissionQuery = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined
    };

    // 验证分页参数
    if (queryOptions.page && queryOptions.page < 1) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '页码必须大于0'
      }, { status: 400 });
    }

    if (queryOptions.limit && (queryOptions.limit < 1 || queryOptions.limit > 100)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '每页数量必须在1-100之间'
      }, { status: 400 });
    }

    // 验证日期参数
    if (queryOptions.startDate && !isValidDate(queryOptions.startDate)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '开始日期格式无效'
      }, { status: 400 });
    }

    if (queryOptions.endDate && !isValidDate(queryOptions.endDate)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '结束日期格式无效'
      }, { status: 400 });
    }

    if (queryOptions.startDate && queryOptions.endDate && new Date(queryOptions.startDate) > new Date(queryOptions.endDate)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '开始日期不能大于结束日期'
      }, { status: 400 });
    }

    // 获取消费返利记录
    const result = await invitationService.getCommissionRecords(userId, queryOptions);

    logger.info('获取消费返利记录成功', {
      userId,
      page: queryOptions.page,
      limit: queryOptions.limit,
      totalCommissions: result.commissions.length
    });

    return NextResponse.json<ApiResponse<CommissionResponse>>({
      success: true,
      data: {
        commissions: result.commissions,
        pagination: result.pagination,
        summary: result.summary
      },
      message: '获取返利记录成功'
    });

  } catch (error) {
    logger.error('获取消费返利记录失败', error as Error, { userId: user.userId });

    // 数据库错误处理
    if (error instanceof Error && error.message.includes('DATABASE')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '数据库查询失败，请稍后重试'
      }, { status: 500 });
    }

    // 默认错误处理
    return NextResponse.json<ApiResponse>({
  }
      success: false,
      error: '获取返利记录时发生错误，请稍后重试'
    }, { status: 500 });
  }
}

// 验证日期格式的工具函数
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// 导出路由处理器，使用认证中间件
export const GET = withAuth(handleGetCommission);