import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { ApiResponse } from '@/lib/api-response';
import { getLogger } from '@/lib/logger';

const logger = getLogger();

// 签到奖励配置：7天周期的奖励金额
const CHECK_IN_REWARDS = [1.00, 0.50, 0.30, 0.10, 0.05, 0.03, 0.02];
const TOTAL_REWARD_AMOUNT = CHECK_IN_REWARDS.reduce((sum, reward) => sum + reward, 0);

/**
 * 获取用户签到状态和进度API
 * GET /api/check-in/status
 */
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const requestLogger = logger;
    const startTime = Date.now();

    // 验证必需参数
    if (!user?.userId) {
      requestLogger.warn('获取签到状态失败：用户ID缺失', undefined, {
        endpoint: '/api/check-in/status',
        method: 'GET'
      });
      
      return NextResponse.json<ApiResponse>(
        ApiResponse.unauthorized('用户身份验证失败'),
        { status: 401 }
      );
    }

    requestLogger.info('开始获取用户签到状态', { userId: user.userId }, {
      endpoint: '/api/check-in/status',
      method: 'GET'
    });

    // 获取用户签到状态汇总信息
    const userCheckInSummary = await prisma.$queryRaw`
      SELECT * FROM user_check_in_summary WHERE user_id = ${user.userId}::uuid
    `;

    // 如果用户不存在，返回错误
    if (!userCheckInSummary || userCheckInSummary.length === 0) {
      requestLogger.warn('获取签到状态失败：用户不存在', { userId: user.userId }, {
        endpoint: '/api/check-in/status',
        method: 'GET'
      });

      return NextResponse.json<ApiResponse>(
        ApiResponse.notFound('用户不存在'),
        { status: 404 }
      );
    }

    const summaryData = userCheckInSummary[0];

    // 获取最近7天的签到记录
    const recentCheckIns = await prisma.$queryRaw`
      SELECT 
        check_in_date,
        check_in_day,
        reward_amount,
        status,
        created_at
      FROM check_in_records 
      WHERE user_id = ${user.userId}::uuid 
      AND check_in_date >= CURRENT_DATE - INTERVAL '6 days'
      AND status = 'claimed'
      ORDER BY check_in_date DESC
    `;

    // 获取签到周期历史
    const cycleHistory = await prisma.$queryRaw`
      SELECT 
        id,
        cycle_start_date,
        cycle_end_date,
        current_streak,
        total_rewards,
        is_active,
        is_completed,
        created_at
      FROM check_in_cycles 
      WHERE user_id = ${user.userId}::uuid 
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    // 构建响应数据
    const responseData = {
      userInfo: {
        userId: summaryData.user_id,
        username: summaryData.username,
        firstName: summaryData.first_name,
        lastName: summaryData.last_name
      },
      currentCycle: {
        cycleId: summaryData.current_cycle_id,
        cycleStartDate: summaryData.cycle_start_date,
        currentStreak: parseInt(summaryData.current_streak?.toString() || '0'),
        cycleTotalRewards: parseFloat(summaryData.cycle_total_rewards?.toString() || '0'),
        isCycleCompleted: Boolean(summaryData.is_cycle_completed),
        isActive: Boolean(summaryData.current_cycle_id)
      },
      todayStatus: {
        today: summaryData.today,
        isCheckedInToday: Boolean(summaryData.is_checked_in_today),
        todayCheckInDay: parseInt(summaryData.today_check_in_day?.toString() || '0'),
        todayRewardAmount: parseFloat(summaryData.today_reward_amount?.toString() || '0'),
        nextRewardAmount: parseFloat(summaryData.next_reward_amount?.toString() || '0')
      },
      statistics: {
        streakLast7Days: parseInt(summaryData.streak_last_7_days?.toString() || '0'),
        totalCheckIns: parseInt(summaryData.total_check_ins?.toString() || '0'),
        totalRewardEarned: TOTAL_REWARD_AMOUNT // 7天周期总奖励
      },
      recentCheckIns: recentCheckIns?.map((record: any) => ({
        checkInDate: record.check_in_date,
        checkInDay: parseInt(record.check_in_day.toString()),
        rewardAmount: parseFloat(record.reward_amount.toString()),
        status: record.status,
        createdAt: record.created_at
      })) || [],
      cycleHistory: cycleHistory?.map((cycle: any) => ({
        cycleId: cycle.id,
        cycleStartDate: cycle.cycle_start_date,
        cycleEndDate: cycle.cycle_end_date,
        currentStreak: parseInt(cycle.current_streak.toString()),
        totalRewards: parseFloat(cycle.total_rewards.toString()),
        isActive: Boolean(cycle.is_active),
        isCompleted: Boolean(cycle.is_completed),
        createdAt: cycle.created_at
      })) || [],
      rewardConfig: {
        dailyRewards: CHECK_IN_REWARDS,
        totalRewardAmount: TOTAL_REWARD_AMOUNT,
        cycleDays: 7
      },
      canCheckIn: !summaryData.is_checked_in_today && summaryData.current_streak < 7,
      nextCheckInDay: summaryData.current_streak + 1,
      lastUpdated: new Date() // 当前时间作为最后更新时间
    };

    const duration = Date.now() - startTime;
    
    requestLogger.info('成功获取用户签到状态', { 
      userId: user.userId,
      currentStreak: responseData.currentCycle.currentStreak,
      isCheckedInToday: responseData.todayStatus.isCheckedInToday,
      canCheckIn: responseData.canCheckIn
    }, {
      endpoint: '/api/check-in/status',
      method: 'GET',
      duration
    });

    // 返回成功响应
    return NextResponse.json<ApiResponse>({
      success: true,
      data: responseData,
      message: '签到状态查询成功'
    });

  } catch (error) {
    logger.error('获取签到状态时发生异常', error as Error, {
      userId: user?.userId,
      endpoint: '/api/check-in/status',
      method: 'GET'
    });

    return NextResponse.json<ApiResponse>(
      ApiResponse.internal('获取签到状态失败，请稍后重试'),
      { status: 500 }
    );
  }
});