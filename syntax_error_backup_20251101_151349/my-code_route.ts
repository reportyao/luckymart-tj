import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { invitationService } from '@/lib/services/invitation-service';
import type { ApiResponse, ReferralStats, ShareLinks, ShareTexts } from '@/types';
import { getLogger } from '@/lib/logger';
/**
 * 获取我的邀请码和统计 API
 * GET /api/invitation/my-code
 */


const logger = getLogger();

// 获取邀请码和统计的处理函数
async function handleGetMyCode(request: NextRequest, user: any) {
  try {
    const userId = user.userId;

    // 获取用户的邀请信息和统计
    const referralInfo = await invitationService.getUserReferralInfo(userId);

    logger.info('获取邀请码和统计成功', {
      userId,
      referralCode: referralInfo.referralCode,
      totalInvites: referralInfo.stats.totalInvites
    });

    // 构建响应数据
    const responseData = {
      referralCode: referralInfo.referralCode,
      shareLinks: referralInfo.shareLinks,
      shareTexts: referralInfo.shareTexts,
      stats: referralInfo.stats
    };

    return NextResponse.json<ApiResponse<typeof responseData>>({
      success: true,
      data: responseData,
      message: '获取邀请信息成功'
    });

  } catch (error) {
    logger.error('获取邀请码和统计失败', error as Error, { userId: user.userId });

    // 处理不同类型的错误
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '用户不存在'
      }, { status: 404 });
    }

    // 默认错误处理
    return NextResponse.json<ApiResponse>({
  }
      success: false,
      error: '获取邀请信息时发生错误，请稍后重试'
    }, );
  }
}

// 导出路由处理器，使用认证中间件
export const GET = withAuth(handleGetMyCode);