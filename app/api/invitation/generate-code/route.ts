/**
 * 生成个人邀请码 API
 * POST /api/invitation/generate-code
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { invitationService } from '@/lib/services/invitation-service';
import type { ApiResponse, GenerateReferralCodeResponse } from '@/types';
import { ErrorFactory } from '@/lib/errors';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';


const logger = getLogger();

// 生成邀请码的处理函数
async function handleGenerateCode(request: NextRequest, user: any) {
  try {
    const userId = user.userId;

    // 获取用户的邀请信息和统计
    const referralInfo = await invitationService.getUserReferralInfo(userId);

    logger.info('生成邀请码成功', {
      userId,
      referralCode: referralInfo.referralCode
    });

    // 构建响应数据
    const responseData: GenerateReferralCodeResponse = {
      referralCode: referralInfo.referralCode,
      shareLinks: referralInfo.shareLinks,
      shareTexts: referralInfo.shareTexts,
      // 可以添加二维码生成逻辑
      qrCodeUrl: undefined
    };

    return NextResponse.json<ApiResponse<GenerateReferralCodeResponse>>({
      success: true,
      data: responseData,
      message: '邀请码生成成功'
    });

  } catch (error) {
    logger.error('生成邀请码失败', error as Error, { userId: user.userId });

    // 处理不同类型的错误
    if (error instanceof Error && error.message.includes('REFERRAL_CODE_GENERATION_FAILED')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '邀请码生成失败，请稍后重试'
      }, { status: 400 });
    }

    // 默认错误处理
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '生成邀请码时发生错误，请稍后重试'
    }, { status: 500 });
  }
}

// 导出路由处理器，使用认证中间件
export const POST = withAuth(handleGenerateCode);