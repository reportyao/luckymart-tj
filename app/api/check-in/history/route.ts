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
 * 获取用户签到历史记录API
 * GET /api/check-in/history
 * 
 * 查询参数：
 * - page: 页码 (默认1)
 * - limit: 每页条数 (默认20, 最大100)
 * - cycleId: 指定签到周期ID (可选)
 * - startDate: 开始日期 YYYY-MM-DD (可选)
 * - endDate: 结束日期 YYYY-MM-DD (可选)
 * - type: 记录类型 'records' | 'cycles' | 'all' (默认'all')
 */
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const requestLogger = logger;
    const startTime = Date.now();

    // 验证必需参数
    if (!user?.userId) {
      requestLogger.warn('获取签到历史失败：用户ID缺失', undefined, {
        endpoint: '/api/check-in/history',
        method: 'GET'
      });
      
      return NextResponse.json<ApiResponse>(
        ApiResponse.unauthorized('用户身份验证失败'),
        { status: 401 }
      );
    }

    requestLogger.info('开始获取用户签到历史', { userId: user.userId }, {
      endpoint: '/api/check-in/history',
      method: 'GET'
    });

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // 限制最大100条
    const cycleId = searchParams.get('cycleId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') || 'all';

    const offset = (page - 1) * limit;

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !dateRegex.test(startDate)) {
      return NextResponse.json<ApiResponse>(
        ApiResponse.badRequest('开始日期格式无效，请使用YYYY-MM-DD格式', 'INVALID_START_DATE'),
        { status: 400 }
      );
    }
    if (endDate && !dateRegex.test(endDate)) {
      return NextResponse.json<ApiResponse>(
        ApiResponse.badRequest('结束日期格式无效，请使用YYYY-MM-DD格式', 'INVALID_END_DATE'),
        { status: 400 }
      );
    }

    // 构建查询条件
    let checkInRecordWhere = `user_id = '${user.userId}'::uuid`;
    let cycleWhere = `user_id = '${user.userId}'::uuid`;
    
    if (cycleId) {
      checkInRecordWhere += ` AND EXISTS (SELECT 1 FROM check_in_cycles WHERE id = '${cycleId}'::uuid AND user_id = '${user.userId}'::uuid)`;
      cycleWhere += ` AND id = '${cycleId}'::uuid`;
    }
    
    if (startDate) {
      checkInRecordWhere += ` AND check_in_date >= '${startDate}'`;
      cycleWhere += ` AND cycle_start_date >= '${startDate}'`;
    }
    
    if (endDate) {
      checkInRecordWhere += ` AND check_in_date <= '${endDate}'`;
      cycleWhere += ` AND (cycle_end_date <= '${endDate}' OR (cycle_start_date <= '${endDate}' AND is_active = true))`;
    }

    // 获取签到记录
    let checkInRecords = [];
    let totalCheckInRecords = 0;

    if (type === 'all' || type === 'records') {
      const checkInRecordsQuery = `
        SELECT 
          cir.id,
          cir.check_in_date,
          cir.check_in_day,
          cir.reward_amount,
          cir.status,
          cir.created_at,
          cir.updated_at,
          cc.id as cycle_id,
          cc.cycle_start_date,
          cc.cycle_end_date,
          cc.is_completed,
          cc.current_streak as final_streak
        FROM check_in_records cir
        LEFT JOIN check_in_cycles cc ON cc.cycle_start_date <= cir.check_in_date 
          AND (cc.cycle_end_date IS NULL OR cc.cycle_end_date >= cir.check_in_date)
          AND cc.user_id = cir.user_id
        WHERE ${checkInRecordWhere}
        ORDER BY cir.check_in_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      checkInRecords = await prisma.$queryRawUnsafe(checkInRecordsQuery);

      // 获取总记录数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM check_in_records cir
        WHERE ${checkInRecordWhere}
      `;
      
      const countResult = await prisma.$queryRawUnsafe(countQuery);
      totalCheckInRecords = parseInt(countResult[0]?.total?.toString() || '0');
    }

    // 获取签到周期
    let cycles = [];
    let totalCycles = 0;

    if (type === 'all' || type === 'cycles') {
      const cyclesQuery = `
        SELECT 
          cc.id,
          cc.cycle_start_date,
          cc.cycle_end_date,
          cc.current_streak,
          cc.total_rewards,
          cc.is_active,
          cc.is_completed,
          cc.created_at,
          cc.updated_at,
          -- 获取该周期的签到记录统计
          (SELECT COUNT(*) FROM check_in_records cir 
           WHERE cir.user_id = cc.user_id 
           AND cir.check_in_date >= cc.cycle_start_date 
           AND cir.check_in_date <= COALESCE(cc.cycle_end_date, CURRENT_DATE)
           AND cir.status = 'claimed') as actual_check_ins,
          (SELECT COUNT(DISTINCT cir.check_in_date) FROM check_in_records cir 
           WHERE cir.user_id = cc.user_id 
           AND cir.check_in_date >= cc.cycle_start_date 
           AND cir.check_in_date <= COALESCE(cc.cycle_end_date, CURRENT_DATE)
           AND cir.status = 'claimed') as unique_check_in_days
        FROM check_in_cycles cc
        WHERE ${cycleWhere}
        ORDER BY cc.cycle_start_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      cycles = await prisma.$queryRawUnsafe(cyclesQuery);

      // 获取总周期数
      const cycleCountQuery = `
        SELECT COUNT(*) as total
        FROM check_in_cycles cc
        WHERE ${cycleWhere}
      `;
      
      const cycleCountResult = await prisma.$queryRawUnsafe(cycleCountQuery);
      totalCycles = parseInt(cycleCountResult[0]?.total?.toString() || '0');
    }

    // 统计信息
    const statsQuery = `
      SELECT 
        COUNT(*) as total_check_ins,
        COUNT(DISTINCT check_in_date) as unique_days_checked_in,
        SUM(reward_amount) as total_rewards_earned,
        MAX(check_in_date) as last_check_in_date,
        -- 连续签到统计
        CASE 
          WHEN COUNT(*) > 0 THEN
            CASE 
              WHEN MAX(check_in_date) = CURRENT_DATE THEN 
                (SELECT current_streak FROM check_in_cycles WHERE user_id = '${user.userId}'::uuid AND is_active = true ORDER BY created_at DESC LIMIT 1)
              ELSE 0
            END
          ELSE 0
        END as current_streak,
        -- 最长连续签到
        (SELECT MAX(streak) FROM (
          SELECT 
            user_id,
            check_in_date,
            ROW_NUMBER() OVER (ORDER BY check_in_date) - 
            ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY check_in_date) as streak
          FROM check_in_records 
          WHERE user_id = '${user.userId}'::uuid AND status = 'claimed'
        ) t)
        as longest_streak
      FROM check_in_records 
      WHERE user_id = '${user.userId}'::uuid AND status = 'claimed'
    `;
    
    const statsResult = await prisma.$queryRawUnsafe(statsQuery);
    const stats = statsResult[0] || {};

    // 构建响应数据
    const responseData = {
      pagination: {
        page,
        limit,
        totalCheckInRecords,
        totalCycles,
        totalRecords: type === 'all' ? totalCheckInRecords + totalCycles : (type === 'records' ? totalCheckInRecords : totalCycles),
        totalPages: Math.ceil((type === 'all' ? totalCheckInRecords + totalCycles : (type === 'records' ? totalCheckInRecords : totalCycles)) / limit),
        hasNext: page * limit < (type === 'all' ? totalCheckInRecords + totalCycles : (type === 'records' ? totalCheckInRecords : totalCycles)),
        hasPrev: page > 1
      },
      filters: {
        cycleId,
        startDate,
        endDate,
        type
      },
      statistics: {
        totalCheckIns: parseInt(stats.total_check_ins?.toString() || '0'),
        uniqueDaysCheckedIn: parseInt(stats.unique_days_checked_in?.toString() || '0'),
        totalRewardsEarned: parseFloat(stats.total_rewards_earned?.toString() || '0'),
        lastCheckInDate: stats.last_check_in_date,
        currentStreak: parseInt(stats.current_streak?.toString() || '0'),
        longestStreak: parseInt(stats.longest_streak?.toString() || '0'),
        rewardConfig: {
          dailyRewards: CHECK_IN_REWARDS,
          totalRewardAmount: TOTAL_REWARD_AMOUNT
        }
      },
      data: {
        checkInRecords: type === 'all' || type === 'records' ? checkInRecords.map((record: any) => ({
          id: record.id,
          checkInDate: record.check_in_date,
          checkInDay: parseInt(record.check_in_day.toString()),
          rewardAmount: parseFloat(record.reward_amount.toString()),
          status: record.status,
          cycleId: record.cycle_id,
          cycleStartDate: record.cycle_start_date,
          cycleEndDate: record.cycle_end_date,
          isCycleCompleted: Boolean(record.is_completed),
          finalStreak: parseInt(record.final_streak?.toString() || '0'),
          createdAt: record.created_at,
          updatedAt: record.updated_at
        })) : [],
        cycles: type === 'all' || type === 'cycles' ? cycles.map((cycle: any) => ({
          id: cycle.id,
          cycleStartDate: cycle.cycle_start_date,
          cycleEndDate: cycle.cycle_end_date,
          currentStreak: parseInt(cycle.current_streak.toString()),
          totalRewards: parseFloat(cycle.total_rewards.toString()),
          isActive: Boolean(cycle.is_active),
          isCompleted: Boolean(cycle.is_completed),
          actualCheckIns: parseInt(cycle.actual_check_ins.toString()),
          uniqueCheckInDays: parseInt(cycle.unique_check_in_days.toString()),
          completionRate: parseFloat((parseInt(cycle.actual_check_ins.toString()) / 7 * 100).toFixed(2)),
          createdAt: cycle.created_at,
          updatedAt: cycle.updated_at
        })) : []
      },
      lastUpdated: new Date()
    };

    const duration = Date.now() - startTime;
    
    requestLogger.info('成功获取用户签到历史', { 
      userId: user.userId,
      totalCheckIns: responseData.statistics.totalCheckIns,
      totalCycles: totalCycles,
      page: page,
      limit: limit
    }, {
      endpoint: '/api/check-in/history',
      method: 'GET',
      duration
    });

    // 返回成功响应
    return NextResponse.json<ApiResponse>({
      success: true,
      data: responseData,
      message: '签到历史查询成功'
    });

  } catch (error) {
    logger.error('获取签到历史时发生异常', error as Error, {
      userId: user?.userId,
      endpoint: '/api/check-in/history',
      method: 'GET'
    });

    return NextResponse.json<ApiResponse>(
      ApiResponse.internal('获取签到历史失败，请稍后重试'),
      { status: 500 }
    );
  }
});