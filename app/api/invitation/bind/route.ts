import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { invitationService } from '@/lib/services/invitation-service';
import type { ApiResponse, BindReferralRequest, BindReferralResponse } from '@/types';
import { getLogger } from '@/lib/logger';
/**
 * 绑定邀请关系 API
 * POST /api/invitation/bind
 */



const logger = getLogger();

// 绑定邀请关系的处理函数
async function handleBindReferral(request: NextRequest, user: any) {
  try {
    // 解析请求体
    const body = await request.json();
    const { referralCode }: BindReferralRequest = body;

    // 验证输入参数
    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '邀请码不能为空'
      }, { status: 400 });
    }

    const userId = user.userId;

    // 绑定邀请关系
    const result = await invitationService.bindReferralRelationship(userId, referralCode);

    if (!result.success) {
      return NextResponse.json<ApiResponse<BindReferralResponse>>({
        success: false,
        error: result.message
      }, { status: 400 });
    }

    logger.info('绑定邀请关系成功', {
      userId,
      referralCode,
      referrerId: result.referrerUserId
    });

    return NextResponse.json<ApiResponse<BindReferralResponse>>({
      success: true,
      data: {
        success: result.success,
        referrerUserId: result.referrerUserId,
        referrerName: result.referrerName,
        message: result.message
      },
      message: result.message
    });

  } catch (error) {
    logger.error('绑定邀请关系失败', error as Error, { 
      userId: user.userId, 
      referralCode: request.body ? JSON.parse(await request.text()).referralCode : undefined 
    });

    // 处理特定错误类型
    if (error instanceof Error) {
      // 邀请码不存在
      if (error.message.includes('NOT_FOUND') || error.message.includes('不存在')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: '邀请码不存在，请检查后重试'
        }, { status: 404 });
      }

      // 自推荐错误
      if (error.message.includes('SELF_REFERRAL_DETECTED') || error.message.includes('不能使用自己的邀请码')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: '您不能使用自己的邀请码'
        }, { status: 400 });
      }

      // 邀请码格式错误
      if (error.message.includes('INVALID_INPUT') || error.message.includes('格式无效')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: '邀请码格式无效，请检查后重试'
        }, { status: 400 });
      }
    }

    // 默认错误处理
    return NextResponse.json<ApiResponse>({
  }
      success: false,
      error: '绑定邀请关系时发生错误，请稍后重试'
    }, );
  }
}

// 导出路由处理器，使用认证中间件
export const POST = withAuth(handleBindReferral);