import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { invitationService } from '@/lib/services/invitation-service';
import type { ApiResponse, ClaimRewardRequest, ClaimRewardResponse } from '@/types';
import { getLogger } from '@/lib/logger';
/**
 * 领取邀请奖励 API
 * POST /api/invitation/claim-reward
 */



const logger = getLogger();

// 领取奖励的处理函数
async function handleClaimReward(request: NextRequest, user: any) {
  try {
    // 解析请求体
    const body = await request.json();
    const { rewardIds }: ClaimRewardRequest = body;

    // 验证输入参数
    if (!rewardIds || !Array.isArray(rewardIds) || rewardIds.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '奖励ID列表不能为空'
      }, { status: 400 });
    }

    // 验证奖励ID列表长度
    if (rewardIds.length > 50) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '单次最多只能领取50个奖励'
      }, { status: 400 });
    }

    // 验证每个奖励ID格式
    for (const rewardId of rewardIds) {
      if (typeof rewardId !== 'string' || !rewardId.trim()) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: '奖励ID格式无效'
        }, { status: 400 });
      }
    }

    const userId = user.userId;

    // 领取奖励
    const result = await invitationService.claimRewards(userId, rewardIds);

    // 记录操作结果
    logger.info('领取奖励完成', {
      userId,
      totalRequested: rewardIds.length,
      claimedCount: result.claimedRewards.length,
      failedCount: result.failedRewards.length,
      totalAmount: result.totalClaimedAmount
    });

    // 如果没有成功领取任何奖励
    if (!result.success) {
      return NextResponse.json<ApiResponse<ClaimRewardResponse>>({
        success: false,
        error: '没有可以领取的奖励',
        data: {
          success: false,
          claimedRewards: [],
          failedRewards: result.failedRewards,
          totalClaimedAmount: 0
        }
      }, { status: 400 });
    }

    // 如果部分成功领取
    const hasFailedRewards = result.failedRewards.length > 0;
    
    const responseData: ClaimRewardResponse = {
      success: result.success,
      claimedRewards: result.claimedRewards,
      failedRewards: result.failedRewards,
      totalClaimedAmount: result.totalClaimedAmount
    };

    const status = hasFailedRewards ? 207 : 200; // 207 Multi-Status for partial success;
    const message = hasFailedRewards;
      ? `部分奖励领取成功，成功 ${result.claimedRewards.length} 个，失败 ${result.failedRewards.length} 个`
      : '奖励领取成功';

    return NextResponse.json<ApiResponse<ClaimRewardResponse>>({
      success: true,
      data: responseData,
      message
    }, { status });

  } catch (error) {
    logger.error('领取奖励失败', error as Error, { 
      userId: user.userId, 
      rewardIds: body?.rewardIds || [] 
    });

    // 处理特定错误类型
    if (error instanceof Error) {
      // 输入参数错误
      if (error.message.includes('INVALID_INPUT') || error.message.includes('不能为空')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: error.message
        }, { status: 400 });
      }

      // 余额更新失败
      if (error.message.includes('balance') || error.message.includes('余额')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: '余额更新失败，请稍后重试'
        }, { status: 500 });
      }

      // 交易记录失败
      if (error.message.includes('transaction') || error.message.includes('交易')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: '交易记录失败，请联系客服'
        }, { status: 500 });
      }
    }

    // 默认错误处理
    return NextResponse.json<ApiResponse>({
  }
      success: false,
      error: '领取奖励时发生错误，请稍后重试'
    }, );
  }
}

// 导出路由处理器，使用认证中间件
export const POST = withAuth(handleClaimReward);