import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { getLogger } from '@/lib/logger';
import { ApiResponse } from '@/lib/api-response';
import { DatabaseLockManager } from '@/lib/database-lock-manager';

const logger = getLogger();

// 验证请求参数
const completeTaskSchema = z.object({
  taskType: z.enum(['register', 'first_recharge', 'first_lottery'], {
    errorMap: () => ({ message: '无效的任务类型' })
  }),
  forceCheck: z.boolean().optional().default(false) // 是否强制检查
});

/**
 * 检查任务完成并发放奖励API
 * POST /api/tasks/complete
 */
export const POST = withAuth(async (request: NextRequest, user: any) => {
  const startTime = Date.now();
  let requestData;

  try {
    const { userId } = user;

    logger.info('开始检查任务完成状态', { userId }, {
      endpoint: '/api/tasks/complete',
      method: 'POST'
    });

    // 解析请求参数
    try {
      requestData = completeTaskSchema.parse(await request.json());
    } catch (validationError: any) {
      logger.warn('任务完成检查请求参数验证失败', validationError, {
        userId,
        endpoint: '/api/tasks/complete'
      });

      return NextResponse.json<ApiResponse>(;
        ApiResponse.badRequest('请求参数无效: ' + validationError.errors.map((e: any) => e.message).join(', ')),
        { status: 400 }
      );
}

    const { taskType, forceCheck } = requestData;

    // 获取数据库锁以防止并发问题
    const lockManager = DatabaseLockManager.getInstance();
    const lockKey = `task_check_${userId}_${taskType}`;
    
    try {
      await lockManager.acquireLock(lockKey, 5000); // 5秒超时

      logger.info('成功获取任务检查锁', { userId, taskType }, {
        endpoint: '/api/tasks/complete'
      });

      // 手动检查任务完成状态
      if (forceCheck) {
        logger.info('执行强制任务检查', { userId, taskType }, {
          endpoint: '/api/tasks/complete'
        });

        await prisma.$executeRawUnsafe(`
          SELECT update_user_task_progress('${userId}'::uuid, '${taskType}')
        `);
      }

      // 获取任务状态
      const taskStatus = await prisma.$queryRaw`;
        SELECT * FROM user_new_user_task_status 
        WHERE user_id = ${userId}::uuid AND task_type = ${taskType}
      `;

      if (!taskStatus || taskStatus.length === 0) {
        logger.warn('任务配置不存在', { userId, taskType }, {
          endpoint: '/api/tasks/complete'
        });

        return NextResponse.json<ApiResponse>(;
          ApiResponse.notFound('任务配置不存在'),
          { status: 404 }
        );
      }

      const task = taskStatus[0];

      // 检查任务是否已完成
      if (task.status === 'pending') {
        logger.info('任务尚未完成', { userId, taskType, status: task.status }, {
          endpoint: '/api/tasks/complete'
        });

        return NextResponse.json<ApiResponse>({
          success: false,
          data: {
            taskType,
            status: task.status,
            message: '任务尚未完成'
          },
          message: '任务检查完成，但尚未完成'
        }, { status: 200 });
      }

      // 检查是否已经领取过奖励
      if (task.reward_claimed) {
        logger.info('任务奖励已领取', { userId, taskType }, {
          endpoint: '/api/tasks/complete'
        });

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            taskType,
            status: 'rewarded',
            alreadyClaimed: true,
            message: '任务已完成，奖励已领取'
          },
          message: '任务已完成，奖励已领取'
        }, { status: 200 });
      }

      // 自动发放奖励
      logger.info('自动发放任务奖励', { 
        userId, 
        taskType, 
        rewardAmount: task.reward_amount,
        rewardType: task.reward_type 
      }, {
        endpoint: '/api/tasks/complete'
      });

      // 使用数据库函数发放奖励
      const rewardResult = await prisma.$queryRaw`;
        SELECT claim_task_reward(${userId}::uuid, ${taskType}) as result
      `;

      const rewardData = rewardResult[0];

      if (!rewardData || !rewardData.result.success) {
        logger.error('自动发放奖励失败', { 
          userId, 
          taskType, 
          error: rewardData?.result?.error || '未知错误' 
        }, {
          endpoint: '/api/tasks/complete'
        });

        return NextResponse.json<ApiResponse>(;
          ApiResponse.internal('发放奖励失败，请稍后重试'),
          { status: 500 }
        );
      }

      // 构建奖励响应数据
      const rewardResponse = {
        taskType,
        status: 'rewarded' as const,
        reward: {
          amount: parseFloat(task.reward_amount.toString()),
          type: task.reward_type,
          currency: task.reward_type === 'balance' ? 'TJS' : 'LC'
        },
        claimedAt: new Date().toISOString(),
        message: `恭喜！获得 ${task.reward_amount} ${task.reward_type === 'balance' ? 'TJS' : 'LC'} 奖励`
      };

      const duration = Date.now() - startTime;

      logger.info('任务检查和奖励发放成功', {
        userId,
        taskType,
        rewardAmount: task.reward_amount,
        rewardType: task.reward_type,
        duration
      }, {
        endpoint: '/api/tasks/complete',
        method: 'POST'
      });

      // 返回成功响应
      return NextResponse.json<ApiResponse>({
        success: true,
        data: rewardResponse,
        message: '任务检查成功，奖励已自动发放'
      }, { status: 200 });

    } finally {
      // 释放数据库锁
      await lockManager.releaseLock(lockKey);
      logger.debug('释放任务检查锁', { userId, taskType }, {
        endpoint: '/api/tasks/complete'
      });
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('检查任务完成状态时发生异常', error as Error, {
      userId: user?.userId,
      taskType: requestData?.taskType || 'unknown',
      endpoint: '/api/tasks/complete',
      method: 'POST',
      duration
    });

    return NextResponse.json<ApiResponse>(;
      ApiResponse.internal('检查任务完成状态失败，请稍后重试'),
      { status: 500 }
    );
  }
});

/**
 * 手动检查所有新手任务完成状态API
 * POST /api/tasks/complete?checkAll=true
 */
export const PUT = withAuth(async (request: NextRequest, user: any) => {
  const startTime = Date.now();

  try {
    const { userId } = user;
    const url = new URL(request.url);
    const checkAll = url.searchParams.get('checkAll') === 'true';

    if (!checkAll) {
      return NextResponse.json<ApiResponse>(;
        ApiResponse.badRequest('需要指定 checkAll=true 参数'),
        { status: 400 }
      );
}

    logger.info('开始检查所有新手任务', { userId }, {
      endpoint: '/api/tasks/complete',
      method: 'PUT'
    });

    // 获取所有任务类型
    const taskTypes = ['register', 'first_recharge', 'first_lottery'];
    const results = [];

    for (const taskType of taskTypes) {
      try {
        // 调用数据库函数检查任务状态
        await prisma.$executeRawUnsafe(`
          SELECT update_user_task_progress('${userId}'::uuid, '${taskType}')
        `);

        // 获取更新后的状态
        const taskStatus = await prisma.$queryRawUnsafe(`;
          SELECT status, reward_claimed FROM user_new_user_task_status 
          WHERE user_id = '${userId}' AND task_type = '${taskType}'
        `);

        if (taskStatus && taskStatus.length > 0) {
          results.push({
            taskType,
            status: (taskStatus?.0 ?? null).status,
            rewardClaimed: (taskStatus?.0 ?? null).reward_claimed
          });
        }
      } catch (taskError) {
        logger.error(`检查任务 ${taskType} 失败`, taskError as Error, { userId }, {
          endpoint: '/api/tasks/complete',
          method: 'PUT'
        });

        results.push({
          taskType,
          status: 'error',
          rewardClaimed: false,
          error: (taskError as Error).message
        });
      }
    }

    const duration = Date.now() - startTime;

    logger.info('批量检查任务完成', { 
      userId, 
      resultsCount: results.length,
      duration 
    }, {
      endpoint: '/api/tasks/complete',
      method: 'PUT'
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        userId,
        taskResults: results,
        checkedAt: new Date().toISOString()
      },
      message: '任务状态检查完成'
    });

  } catch (error) {
    logger.error('批量检查任务完成状态时发生异常', error as Error, {
      userId: user?.userId,
      endpoint: '/api/tasks/complete',
      method: 'PUT'
    });

    return NextResponse.json<ApiResponse>(;
      ApiResponse.internal('批量检查任务状态失败，请稍后重试'),
      { status: 500 }
    );
  }
});
