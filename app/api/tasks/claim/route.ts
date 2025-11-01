import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { getLogger } from '@/lib/logger';
import { ApiResponse } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/auth';

const logger = getLogger();

/**
 * 领取任务奖励API
 * POST /api/tasks/claim
 * 
 * 请求体：
 * {
 *   "taskType": "register" | "first_recharge" | "first_lottery"
 * }
 * 
 * 返回领取结果，包括奖励金额和类型
 */
export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const startTime = Date.now();
    const { userId } = user;

    // 获取请求数据
    const body = await request.json();
    const { taskType } = body;

    // 验证输入参数
    if (!taskType) {
      return NextResponse.json<ApiResponse>(;
        ApiResponse.badRequest('任务类型不能为空', 'TASK_TYPE_REQUIRED'),
        { status: 400 }
      );
}

    // 验证任务类型
    const validTaskTypes = ['register', 'first_recharge', 'first_lottery'];
    if (!validTaskTypes.includes(taskType)) {
      return NextResponse.json<ApiResponse>(;
        ApiResponse.badRequest('无效的任务类型', 'INVALID_TASK_TYPE'),
        { status: 400 }
      );
    }

    logger.info('开始领取任务奖励', { userId, taskType }, {
      endpoint: '/api/tasks/claim',
      method: 'POST'
    });

    // 速率限制检查
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `claim_${userId}_${taskType}`;
    const rateLimit = checkRateLimit(rateLimitKey, 3, 60 * 1000); // 每分钟最多3次领取尝试;

    if (!rateLimit.allowed) {
      logger.warn('领取任务奖励频率超限', { userId, taskType, rateLimit }, {
        endpoint: '/api/tasks/claim',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(;
        ApiResponse.rateLimitExceeded('领取过于频繁，请稍后再试', 'RATE_LIMIT_EXCEEDED'),
        { status: 429 }
      );
    }

    // 获取用户语言偏好
    const userRecord = await prisma.users.findUnique({
      where: { id: userId },
      select: { preferredLanguage: true, balance: true, luckyCoins: true }
    });

    if (!userRecord) {
      return NextResponse.json<ApiResponse>(;
        ApiResponse.notFound('用户不存在'),
        { status: 404 }
      );
    }

    // 调用数据库函数领取奖励
    const result = await prisma.$queryRaw`;
      SELECT claim_task_reward(${userId}, ${taskType}) as result
    `;

    if (!result || result.length === 0 || !(result?.0 ?? null).result) {
      const errorResult = result?.[0]?.result;
      
      if (errorResult && !errorResult.success) {
        let errorCode = 'CLAIM_FAILED';
        let statusCode = 400;
        let errorMessage = '领取奖励失败';

        switch (errorResult.error) {
          case 'Task not found':
            errorMessage = '任务不存在';
            errorCode = 'TASK_NOT_FOUND';
            statusCode = 404;
            break;
          case 'Task not completed':
            errorMessage = '任务尚未完成，无法领取奖励';
            errorCode = 'TASK_NOT_COMPLETED';
            statusCode = 400;
            break;
          case 'Reward already claimed':
            errorMessage = '奖励已领取，不能重复领取';
            errorCode = 'REWARD_ALREADY_CLAIMED';
            statusCode = 409;
            break;
          default:
            errorMessage = errorResult.error || '领取奖励失败';
            errorCode = 'CLAIM_FAILED';
            statusCode = 400;
        }

        logger.warn('领取任务奖励业务逻辑失败', {
          userId,
          taskType,
          error: errorResult.error,
          errorCode
        }, {
          endpoint: '/api/tasks/claim',
          method: 'POST'
        });

        return NextResponse.json<ApiResponse>(;
          ApiResponse.badRequest(errorMessage, errorCode),
          { status: statusCode }
        );
      } else {
        throw new Error('奖励领取处理异常');
      }
    }

    const claimResult = (result?.0 ?? null).result;
    
    // 获取更新后的用户余额信息
    const updatedUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { balance: true, luckyCoins: true }
    });

    // 获取任务详细信息用于响应
    const taskInfo = await prisma.$queryRaw`;
      SELECT 
        t.name_multilingual,
        t.description_multilingual,
        t.reward_amount,
        t.reward_type
      FROM new_user_tasks t
      WHERE t.task_type : ${taskType} AND t.is_active = true
    `;

    const task = taskInfo[0];
    const userLanguage = userRecord.preferredLanguage || 'tg-TJ';
    const nameMultilingual = task?.name_multilingual || {};
    const descriptionMultilingual = task?.description_multilingual || {};
    
    const taskName = nameMultilingual[userLanguage] ||;
                    nameMultilingual['en-US'] || 
                    taskType;
                    
    const taskDescription = descriptionMultilingual[userLanguage] ||;
                           descriptionMultilingual['en-US'] || 
                           taskType;

    const duration = Date.now() - startTime;

    logger.info('成功领取任务奖励', {
      userId,
      taskType,
      rewardAmount: claimResult.reward_amount,
      rewardType: claimResult.reward_type,
      newBalance: updatedUser?.balance,
      newLuckyCoins: updatedUser?.luckyCoins
    }, {
      endpoint: '/api/tasks/claim',
      method: 'POST',
      duration
    });

    // 返回成功响应
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        claim: {
          taskType,
          taskName,
          taskDescription,
          reward: {
            amount: parseFloat(claimResult.reward_amount.toString()),
            type: claimResult.reward_type,
            currency: claimResult.reward_type === 'balance' ? 'TJS' : 'LC',
            formatted: claimResult.reward_type === 'balance' 
              ? `${claimResult.reward_amount} TJS` 
              : `${claimResult.reward_amount} LC`
          },
          claimedAt: new Date().toISOString()
        },
        user: {
          balance: updatedUser?.balance ? parseFloat(updatedUser.balance.toString()) : 0,
          luckyCoins: updatedUser?.luckyCoins ? parseFloat(updatedUser.luckyCoins.toString()) : 0
        },
        rateLimit: {
          remaining: rateLimit.remaining - 1,
          resetTime: rateLimit.resetTime
        }
      },
      message: '奖励领取成功'
    });

  } catch (error) {
    logger.error('领取任务奖励时发生异常', error as Error, {
      userId: user?.userId,
      endpoint: '/api/tasks/claim',
      method: 'POST'
    });

    return NextResponse.json<ApiResponse>(;
      ApiResponse.internal('领取奖励失败，请稍后重试'),
      { status: 500 }
    );
  }
});