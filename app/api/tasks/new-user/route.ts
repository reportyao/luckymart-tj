import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { getLogger } from '@/lib/logger';
import { ApiResponse } from '@/lib/api-response';

const logger = getLogger();

/**
 * 查询用户新手任务状态API
 * GET /api/tasks/new-user
 */
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const startTime = Date.now();
    const { userId } = user;

    logger.info('开始查询用户新手任务状态', { userId }, {
      endpoint: '/api/tasks/new-user',
      method: 'GET'
    });

    // 获取用户语言偏好
    const userRecord = await prisma.users.findUnique({
      where: { id: userId },
      select: { preferredLanguage: true, createdAt: true }
    });

    if (!userRecord) {
      return NextResponse.json<ApiResponse>(
        ApiResponse.notFound('用户不存在'),
        { status: 404 }
      );
    }

    const userLanguage = userRecord.preferredLanguage || 'tg-TJ';

    // 获取用户新手任务状态
    const taskStatus = await prisma.$queryRawUnsafe(`
      SELECT 
        task_id,
        task_type,
        name_multilingual,
        description_multilingual,
        reward_amount,
        reward_type,
        status,
        completed_at,
        reward_claimed,
        progress_data
      FROM user_new_user_task_status
      WHERE user_id = '${userId}'
      ORDER BY (
        CASE task_type
          WHEN 'register' THEN 1
          WHEN 'first_recharge' THEN 2
          WHEN 'first_lottery' THEN 3
          ELSE 4
        END
      )
    `);

    // 构建响应数据
    const tasks = taskStatus.map((task: any) => {
      // 解析多语言字段
      const nameMultilingual = task.name_multilingual || {};
      const descriptionMultilingual = task.description_multilingual || {};
      
      const taskName = nameMultilingual[userLanguage] || 
                      nameMultilingual['en-US'] || 
                      task.task_type;
                      
      const taskDescription = descriptionMultilingual[userLanguage] || 
                             descriptionMultilingual['en-US'] || 
                             task.task_type;

      return {
        taskId: task.task_id,
        taskType: task.task_type,
        name: taskName,
        description: taskDescription,
        reward: {
          amount: parseFloat(task.reward_amount.toString()),
          type: task.reward_type, // 'balance' 或 'lucky_coins'
          currency: task.reward_type === 'balance' ? 'TJS' : 'LC'
        },
        status: task.status, // 'pending', 'completed', 'rewarded'
        completedAt: task.completed_at,
        rewardClaimed: task.reward_claimed,
        progressData: task.progress_data
      };
    });

    // 统计任务进度
    const stats = {
      total: tasks.length,
      pending: tasks.filter(task => task.status === 'pending').length,
      completed: tasks.filter(task => task.status === 'completed').length,
      rewarded: tasks.filter(task => task.status === 'rewarded').length,
      completionRate: 0
    };
    
    if (stats.total > 0) {
      stats.completionRate = Math.round((stats.completed / stats.total) * 100);
    }

    const duration = Date.now() - startTime;

    logger.info('成功获取用户新手任务状态', {
      userId,
      totalTasks: stats.total,
      completionRate: stats.completionRate
    }, {
      endpoint: '/api/tasks/new-user',
      method: 'GET',
      duration
    });

    // 返回成功响应
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        userId,
        tasks,
        stats,
        lastUpdated: new Date().toISOString()
      },
      message: '新手任务状态查询成功'
    });

  } catch (error) {
    logger.error('查询用户新手任务状态时发生异常', error as Error, {
      userId: user?.userId,
      endpoint: '/api/tasks/new-user',
      method: 'GET'
    });

    return NextResponse.json<ApiResponse>(
      ApiResponse.internal('查询任务状态失败，请稍后重试'),
      { status: 500 }
    );
  }
});
