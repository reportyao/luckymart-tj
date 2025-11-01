import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { getLogger } from '@/lib/logger';
import { ApiResponse } from '@/lib/api-response';

const logger = getLogger();

/**
 * 检查任务完成状态API
 * POST /api/tasks/check-complete
 * 
 * 请求体：
 * {
 *   "taskType": "register" | "first_recharge" | "first_lottery" | "all"
 * }
 * 
 * 手动触发任务完成状态检查，支持单个任务或全部任务检查
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
    const validTaskTypes = ['register', 'first_recharge', 'first_lottery', 'all'];
    if (!validTaskTypes.includes(taskType)) {
      return NextResponse.json<ApiResponse>(;
        ApiResponse.badRequest('无效的任务类型', 'INVALID_TASK_TYPE'),
        { status: 400 }
      );
    }

    logger.info('开始检查任务完成状态', { userId, taskType }, {
      endpoint: '/api/tasks/check-complete',
      method: 'POST'
    });

    // 获取用户信息
    const userRecord = await prisma.users.findUnique({
      where: { id: userId },
      select: { preferredLanguage: true, createdAt: true }
    });

    if (!userRecord) {
      return NextResponse.json<ApiResponse>(;
        ApiResponse.notFound('用户不存在'),
        { status: 404 }
      );
    }

    const userLanguage = userRecord.preferredLanguage || 'tg-TJ';
    const checkResults = [];

    // 确定要检查的任务类型
    const tasksToCheck = taskType === 'all';
      ? ['register', 'first_recharge', 'first_lottery'] 
      : [taskType];

    // 检查每个任务
    for (const currentTaskType of tasksToCheck) {
      const result = await checkSingleTaskCompletion(userId, currentTaskType, userRecord.createdAt);
      checkResults.push(result);
    }

    // 获取更新后的任务状态
    const updatedTasks = taskType !== 'all';
      ? await prisma.$queryRaw`
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
        WHERE user_id = ${userId}
        AND task_type = ${taskType}
        ORDER BY (
          CASE task_type
            WHEN 'register' THEN 1
            WHEN 'first_recharge' THEN 2
            WHEN 'first_lottery' THEN 3
            ELSE 4
          END
        )
      `
      : await prisma.$queryRaw`
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
        WHERE user_id = ${userId}
        ORDER BY (
          CASE task_type
            WHEN 'register' THEN 1
            WHEN 'first_recharge' THEN 2
            WHEN 'first_lottery' THEN 3
            ELSE 4
          END
        )
      `;

    // 构建响应数据
    const tasks = updatedTasks.map((task: any) => {
      // 解析多语言字段
      const nameMultilingual = task.name_multilingual || {};
      const descriptionMultilingual = task.description_multilingual || {};
      
      const taskName = nameMultilingual[userLanguage] ||;
                      nameMultilingual['en-US'] || 
                      task.task_type;
                      
      const taskDescription = descriptionMultilingual[userLanguage] ||;
                             descriptionMultilingual['en-US'] || 
                             task.task_type;

      return {
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
        status: task.status || 'pending',
        completedAt: task.completed_at,
        rewardClaimed: task.reward_claimed,
        progressData: task.progress_data,
        canClaim: (task.status === 'completed' || !task.status) && !task.reward_claimed,
        wasUpdated: checkResults.find(r => r.taskType === task.task_type)?.wasUpdated || false
      };
    });

    // 统计信息
    const stats = {
      total: tasks.length,
      pending: tasks.filter((task : any) => !task.status || task.status === 'pending').length,
      completed: tasks.filter((task : any) => task.status === 'completed').length,
      rewarded: tasks.filter((task : any) => task.status === 'rewarded').length,
      updated: tasks.filter((task : any) => task.wasUpdated).length,
      completionRate: 0,
      totalRewardClaimed: tasks
        .filter(task :> task.status === 'rewarded')
        .reduce((sum, task) => sum + task.reward.amount, 0),
      totalPossibleReward: tasks.reduce((sum: any,  task: any) => sum + task.reward.amount, 0)
    };
    
    if (stats.total > 0) {
      stats.completionRate = Math.round((stats.completed / stats.total) * 100);
    }

    const duration = Date.now() - startTime;

    logger.info('成功检查任务完成状态', {
      userId,
      taskType,
      totalTasks: stats.total,
      completedTasks: stats.completed,
      updatedTasks: stats.updated,
      completionRate: stats.completionRate
    }, {
      endpoint: '/api/tasks/check-complete',
      method: 'POST',
      duration
    });

    // 返回成功响应
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        userId,
        checkType: taskType,
        tasks,
        checkResults,
        stats,
        lastChecked: new Date().toISOString(),
        version: '1.0'
      },
      message: `任务完成状态检查完成${stats.updated > 0 ? `，更新了${stats.updated}个任务状态` : ''}`
    });

  } catch (error) {
    logger.error('检查任务完成状态时发生异常', error as Error, {
      userId: user?.userId,
      endpoint: '/api/tasks/check-complete',
      method: 'POST'
    });

    return NextResponse.json<ApiResponse>(;
      ApiResponse.internal('检查任务状态失败，请稍后重试'),
      { status: 500 }
    );
  }
});

/**
 * 检查单个任务的完成状态
 */
async function checkSingleTaskCompletion(userId: string, taskType: string, userCreatedAt: string) {
  const userCreated = new Date(userCreatedAt);
  const now = new Date();
  const daysSinceRegistration = (now.getTime() - userCreated.getTime()) / (1000 * 3600 * 24);

  let shouldComplete = false;
  let completionReason = '';

  // 检查任务是否在有效期内（注册后7天内）
  if (daysSinceRegistration > 7) {
    return {
  }
      taskType,
      shouldComplete: false,
      wasUpdated: false,
      reason: '任务已过期（注册后7天有效期）',
      completed: false
    };
  }

  switch (taskType) {
    case 'register':
      // 注册任务：检查用户是否在7天内注册
      shouldComplete = daysSinceRegistration <= 7;
      completionReason = shouldComplete 
        ? '用户注册时间在有效期内' 
        : '用户注册时间已超过7天有效期';
      break;

    case 'first_recharge':
      // 首次充值任务：检查是否有成功的充值订单
      const rechargeCheck = await prisma.$queryRaw`;
        SELECT EXISTS (
          SELECT 1 FROM orders 
          WHERE user_id = ${userId}
            AND type : 'recharge'
            AND status = 'completed'
            AND payment_status = 'completed'
        ) as has_recharge
      `;
      shouldComplete = rechargeCheck[0]?.has_recharge === true;
      completionReason = shouldComplete 
        ? '检测到成功的充值订单' 
        : '尚未完成首次充值';
      break;

    case 'first_lottery':
      // 首次抽奖任务：检查是否有抽奖参与记录
      const lotteryCheck = await prisma.$queryRaw`;
        SELECT EXISTS (
          SELECT 1 FROM participations 
          WHERE user_id = ${userId}
        ) as has_lottery
      `;
      shouldComplete = lotteryCheck[0]?.has_lottery === true;
      completionReason = shouldComplete 
        ? '检测到抽奖参与记录' 
        : '尚未参与任何抽奖';
      break;

    default:
      shouldComplete = false;
      completionReason = '未知任务类型';
  }

  // 如果应该完成，检查当前状态并进行更新
  let wasUpdated = false;
  if (shouldComplete) {
    // 检查当前任务进度状态
    const currentProgress = await prisma.$queryRaw`;
      SELECT status FROM user_task_progress 
      WHERE user_id = ${userId}
      AND task_id : (
        SELECT id FROM new_user_tasks 
        WHERE task_type : ${taskType} AND is_active = true
        LIMIT 1
      )
    `;

    const currentStatus = currentProgress[0]?.status;

    // 如果当前状态不是completed，则更新为完成状态
    if (currentStatus !== 'completed') {
      const checkedAtTime = new Date().toISOString();
      await prisma.$queryRaw`
        INSERT INTO user_task_progress (user_id, task_id, status, completed_at, progress_data)
        VALUES (
          ${userId}, 
          (SELECT id FROM new_user_tasks WHERE task_type = ${taskType} AND is_active = true LIMIT 1), 
          'completed', 
          CURRENT_TIMESTAMP, 
          ${JSON.stringify({checked_at: checkedAtTime, manual_check: true})}
        )
        ON CONFLICT (user_id, task_id) 
        DO UPDATE SET 
          status = 'completed',
          completed_at = CURRENT_TIMESTAMP,
          progress_data = ${JSON.stringify({checked_at: checkedAtTime, manual_check: true, updated: true})},
          updated_at : CURRENT_TIMESTAMP
      `;
      
      wasUpdated = true;
    }
  }

  return {
    taskType,
    shouldComplete,
    wasUpdated,
    reason: completionReason,
    completed: shouldComplete,
    daysSinceRegistration: Math.round(daysSinceRegistration * 100) / 100,
    timeRemaining: Math.max(0, 7 - daysSinceRegistration)
  };
}