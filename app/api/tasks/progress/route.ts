import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { getLogger } from '@/lib/logger';
import { ApiResponse } from '@/lib/api-response';

const logger = getLogger();

/**
 * 查询用户任务完成情况API
 * GET /api/tasks/progress
 * 
 * 可选查询参数：
 * - status: 任务状态过滤 (pending|completed|rewarded)
 * - taskType: 特定任务类型 (register|first_recharge|first_lottery)
 * 
 * 返回用户的详细任务进度信息
 */
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const startTime = Date.now();
    const { userId } = user;

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const taskTypeFilter = searchParams.get('taskType');

    logger.info('开始查询用户任务进度', { 
      userId, 
      statusFilter, 
      taskTypeFilter 
    }, {
      endpoint: '/api/tasks/progress',
      method: 'GET'
    });

    // 验证状态过滤参数
    const validStatuses = ['pending', 'completed', 'rewarded'];
    if (statusFilter && !validStatuses.includes(statusFilter)) {
      return NextResponse.json<ApiResponse>(
        ApiResponse.badRequest('无效的状态过滤参数', 'INVALID_STATUS_FILTER'),
        { status: 400 }
      );
    }

    // 验证任务类型过滤参数
    const validTaskTypes = ['register', 'first_recharge', 'first_lottery'];
    if (taskTypeFilter && !validTaskTypes.includes(taskTypeFilter)) {
      return NextResponse.json<ApiResponse>(
        ApiResponse.badRequest('无效的任务类型过滤参数', 'INVALID_TASK_TYPE_FILTER'),
        { status: 400 }
      );
    }

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

    // 构建查询条件
    let whereClause = `WHERE user_id = '${userId}'`;
    if (statusFilter) {
      // 注意：视图中的status可能为NULL（pending状态）
      if (statusFilter === 'pending') {
        whereClause += ` AND status IS NULL`;
      } else {
        whereClause += ` AND status = '${statusFilter}'`;
      }
    }
    if (taskTypeFilter) {
      whereClause += ` AND task_type = '${taskTypeFilter}'`;
    }

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
      ${whereClause}
      ORDER BY (
        CASE task_type
          WHEN 'register' THEN 1
          WHEN 'first_recharge' THEN 2
          WHEN 'first_lottery' THEN 3
          ELSE 4
        END
      )
    `);

    // 检查并更新任务完成状态（如果需要）
    const updatedTasks = [];
    for (const task of taskStatus) {
      let currentStatus = task.status;
      let updatedProgressData = task.progress_data;

      // 如果任务状态为pending，重新检查完成状态
      if (!currentStatus || currentStatus === 'pending') {
        // 先检查是否真的完成了
        let shouldUpdate = false;
        switch (task.task_type) {
          case 'register':
            // 检查注册时间是否在7天内
            const userCreatedAt = new Date(userRecord.createdAt);
            const now = new Date();
            const daysDiff = (now.getTime() - userCreatedAt.getTime()) / (1000 * 3600 * 24);
            shouldUpdate = daysDiff <= 7;
            break;
          case 'first_recharge':
            // 检查是否有成功的充值订单
            const rechargeCheck = await prisma.$queryRaw`
              SELECT EXISTS (
                SELECT 1 FROM orders 
                WHERE user_id = ${userId}
                  AND type = 'recharge'
                  AND status = 'completed'
                  AND payment_status = 'completed'
              ) as has_recharge
            `;
            shouldUpdate = rechargeCheck[0]?.has_recharge === true;
            break;
          case 'first_lottery':
            // 检查是否有抽奖参与记录
            const lotteryCheck = await prisma.$queryRaw`
              SELECT EXISTS (
                SELECT 1 FROM participations 
                WHERE user_id = ${userId}
              ) as has_lottery
            `;
            shouldUpdate = lotteryCheck[0]?.has_lottery === true;
            break;
        }

        // 如果应该更新为完成状态
        if (shouldUpdate) {
          await prisma.$queryRaw`
            INSERT INTO user_task_progress (user_id, task_id, status, completed_at, progress_data)
            VALUES (${userId}, ${task.task_id}, 'completed', CURRENT_TIMESTAMP, 
                    jsonb_build_object('checked_at', CURRENT_TIMESTAMP::text, 'auto_updated', true))
            ON CONFLICT (user_id, task_id) 
            DO UPDATE SET 
              status = 'completed',
              completed_at = CURRENT_TIMESTAMP,
              progress_data = jsonb_build_object('checked_at', CURRENT_TIMESTAMP::text, 'auto_updated', true),
              updated_at = CURRENT_TIMESTAMP
          `;
          
          currentStatus = 'completed';
          updatedProgressData = { checked_at: new Date().toISOString(), auto_updated: true };
        }
      }

      // 解析多语言字段
      const nameMultilingual = task.name_multilingual || {};
      const descriptionMultilingual = task.description_multilingual || {};
      
      const taskName = nameMultilingual[userLanguage] || 
                      nameMultilingual['en-US'] || 
                      task.task_type;
                      
      const taskDescription = descriptionMultilingual[userLanguage] || 
                             descriptionMultilingual['en-US'] || 
                             task.task_type;

      updatedTasks.push({
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
        status: currentStatus || 'pending',
        completedAt: task.completed_at,
        rewardClaimed: task.reward_claimed,
        progressData: updatedProgressData,
        canClaim: (currentStatus === 'completed' || currentStatus === null) && !task.reward_claimed,
        progress: calculateProgress(task.task_type, userRecord.createdAt, currentStatus)
      });
    }

    // 统计信息
    const allTasksStatus = await prisma.$queryRawUnsafe(`
      SELECT 
        status,
        COUNT(*) as count
      FROM user_new_user_task_status
      WHERE user_id = '${userId}'
      GROUP BY status
    `);

    const stats = {
      total: updatedTasks.length,
      pending: allTasksStatus.find(s => s.status === null)?.count || 0,
      completed: allTasksStatus.find(s => s.status === 'completed')?.count || 0,
      rewarded: allTasksStatus.find(s => s.status === 'rewarded')?.count || 0,
      completionRate: 0,
      totalRewardClaimed: updatedTasks
        .filter(task => task.status === 'rewarded')
        .reduce((sum, task) => sum + task.reward.amount, 0),
      totalPossibleReward: updatedTasks.reduce((sum, task) => sum + task.reward.amount, 0),
      availableToClaim: updatedTasks.filter(task => task.canClaim).length
    };
    
    if (stats.total > 0) {
      stats.completionRate = Math.round((stats.completed / stats.total) * 100);
    }

    // 时间信息
    const timeInfo = {
      userCreatedAt: userRecord.createdAt,
      isNewUser: (new Date().getTime() - new Date(userRecord.createdAt).getTime()) / (1000 * 3600 * 24) <= 7,
      daysSinceRegistration: Math.floor((new Date().getTime() - new Date(userRecord.createdAt).getTime()) / (1000 * 3600 * 24)),
      taskDeadline: new Date(new Date(userRecord.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const duration = Date.now() - startTime;

    logger.info('成功查询用户任务进度', {
      userId,
      totalTasks: stats.total,
      completionRate: stats.completionRate,
      completedTasks: stats.completed,
      claimedRewards: stats.totalRewardClaimed,
      availableToClaim: stats.availableToClaim
    }, {
      endpoint: '/api/tasks/progress',
      method: 'GET',
      duration
    });

    // 返回成功响应
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        userId,
        tasks: updatedTasks,
        stats,
        timeInfo,
        filters: {
          status: statusFilter,
          taskType: taskTypeFilter
        },
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      },
      message: '任务进度查询成功'
    });

  } catch (error) {
    logger.error('查询用户任务进度时发生异常', error as Error, {
      userId: user?.userId,
      endpoint: '/api/tasks/progress',
      method: 'GET'
    });

    return NextResponse.json<ApiResponse>(
      ApiResponse.internal('查询任务进度失败，请稍后重试'),
      { status: 500 }
    );
  }
});

/**
 * 计算任务进度百分比
 */
function calculateProgress(taskType: string, userCreatedAt: string, currentStatus: string | null): number {
  const userCreated = new Date(userCreatedAt);
  const now = new Date();
  const daysSinceRegistration = (now.getTime() - userCreated.getTime()) / (1000 * 3600 * 24);

  switch (taskType) {
    case 'register':
      return currentStatus === 'rewarded' ? 100 : 
             currentStatus === 'completed' ? 90 : 
             daysSinceRegistration <= 7 ? 50 : 0;
    
    case 'first_recharge':
      return currentStatus === 'rewarded' ? 100 : 
             currentStatus === 'completed' ? 90 : 
             daysSinceRegistration <= 7 ? 30 : 0;
    
    case 'first_lottery':
      return currentStatus === 'rewarded' ? 100 : 
             currentStatus === 'completed' ? 90 : 
             daysSinceRegistration <= 7 ? 10 : 0;
    
    default:
      return 0;
  }
}