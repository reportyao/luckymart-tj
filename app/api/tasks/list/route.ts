import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { getLogger } from '@/lib/logger';
import { ApiResponse } from '@/lib/api-response';

const logger = getLogger();

/**
 * 获取任务列表和用户进度API
 * GET /api/tasks/list
 * 
 * 返回用户的任务列表，包括任务状态、进度和奖励信息
 */
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const startTime = Date.now();
    const { userId } = user;

    logger.info('开始获取用户任务列表', { userId }, {
      endpoint: '/api/tasks/list',
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

    // 获取用户任务进度状态
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

    // 构建响应数据，包含任务自动检测逻辑
    const tasks = [];
    
    for (const task of taskStatus) {
      // 解析多语言字段
      const nameMultilingual = task.name_multilingual || {};
      const descriptionMultilingual = task.description_multilingual || {};
      
      const taskName = nameMultilingual[userLanguage] || 
                      nameMultilingual['en-US'] || 
                      task.task_type;
                      
      const taskDescription = descriptionMultilingual[userLanguage] || 
                             descriptionMultilingual['en-US'] || 
                             task.task_type;

      // 检查任务完成状态（如果还未完成）
      let currentStatus = task.status;
      if (currentStatus === 'pending') {
        // 调用数据库函数检查完成状态
        const completionCheck = await prisma.$queryRaw`
          SELECT update_user_task_progress(${userId}, ${task.task_type}) as result
        `;
        
        // 重新获取更新后的状态
        const updatedStatus = await prisma.$queryRaw`
          SELECT status FROM user_task_progress 
          WHERE user_id = ${userId} 
          AND task_id = ${task.task_id}
        `;
        
        if (updatedStatus.length > 0) {
          currentStatus = updatedStatus[0].status;
        }
      }

      tasks.push({
        taskId: task.task_id,
        taskType: task.task_type,
        name: taskName,
        description: taskDescription,
        reward: {
          amount: parseFloat(task.reward_amount.toString()),
          type: task.reward_type,
          currency: task.reward_type === 'balance' ? 'TJS' : 'LC',
          formatted: task.reward_type === 'balance' 
            ? `${task.reward_amount} TJS` 
            : `${task.reward_amount} LC`
        },
        status: currentStatus, // 'pending', 'completed', 'rewarded'
        completedAt: task.completed_at,
        rewardClaimed: task.reward_claimed,
        progressData: task.progress_data,
        canClaim: currentStatus === 'completed' && !task.reward_claimed,
        isExpired: false // 新手任务在注册后7天内有效
      });
    }

    // 统计任务进度
    const stats = {
      total: tasks.length,
      pending: tasks.filter(task => task.status === 'pending').length,
      completed: tasks.filter(task => task.status === 'completed').length,
      rewarded: tasks.filter(task => task.status === 'rewarded').length,
      completionRate: 0,
      totalRewardClaimed: tasks
        .filter(task => task.status === 'rewarded')
        .reduce((sum, task) => sum + task.reward.amount, 0),
      totalPossibleReward: tasks.reduce((sum, task) => sum + task.reward.amount, 0)
    };
    
    if (stats.total > 0) {
      stats.completionRate = Math.round((stats.completed / stats.total) * 100);
    }

    const duration = Date.now() - startTime;

    logger.info('成功获取用户任务列表', {
      userId,
      totalTasks: stats.total,
      completionRate: stats.completionRate,
      claimedRewards: stats.totalRewardClaimed
    }, {
      endpoint: '/api/tasks/list',
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
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      },
      message: '任务列表获取成功'
    });

  } catch (error) {
    logger.error('获取用户任务列表时发生异常', error as Error, {
      userId: user?.userId,
      endpoint: '/api/tasks/list',
      method: 'GET'
    });

    return NextResponse.json<ApiResponse>(
      ApiResponse.internal('获取任务列表失败，请稍后重试'),
      { status: 500 }
    );
  }
});