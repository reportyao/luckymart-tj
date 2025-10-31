import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '@/lib/api-response';
import { getLogger } from '@/lib/logger';

const logger = getLogger();

// 7天签到奖励配置
const CHECK_IN_REWARDS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.25, 0.25];
const TOTAL_REWARD_AMOUNT = CHECK_IN_REWARDS.reduce((sum, reward) => sum + reward, 0);

/**
 * 查询签到状态API
 * GET /api/checkin/status
 */
export async function GET(request: NextRequest) {
  try {
    const requestLogger = logger;
    const startTime = Date.now();

    // 验证JWT Token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      requestLogger.warn('查询签到状态失败：未授权访问', undefined, {
        endpoint: '/api/checkin/status',
        method: 'GET'
      });
      
      return NextResponse.json<ApiResponse>(
        ApiResponse.unauthorized('用户身份验证失败'),
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    if (!decoded?.userId) {
      requestLogger.warn('查询签到状态失败：用户ID缺失', undefined, {
        endpoint: '/api/checkin/status',
        method: 'GET'
      });
      
      return NextResponse.json<ApiResponse>(
        ApiResponse.unauthorized('用户身份验证失败'),
        { status: 401 }
      );
    }

    requestLogger.info('开始获取用户签到状态', { userId: decoded.userId }, {
      endpoint: '/api/checkin/status',
      method: 'GET'
    });

    // 获取用户信息
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      requestLogger.warn('查询签到状态失败：用户不存在', { userId: decoded.userId }, {
        endpoint: '/api/checkin/status',
        method: 'GET'
      });

      return NextResponse.json<ApiResponse>(
        ApiResponse.notFound('用户不存在'),
        { status: 404 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // 获取今日签到状态
    const todayCheckIn = await prisma.dailyCheckIns.findFirst({
      where: {
        userId: decoded.userId,
        checkInDate: new Date(today)
      }
    });

    // 获取最近7天签到记录
    const recentCheckIns = await prisma.dailyCheckIns.findMany({
      where: {
        userId: decoded.userId,
        checkInDate: {
          gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 最近7天
        }
      },
      orderBy: {
        checkInDate: 'desc'
      }
    });

    // 获取连续签到天数（不考虑今日）
    const consecutiveDays = await getConsecutiveDays(decoded.userId);

    // 计算当前周期进度
    const currentStreak = consecutiveDays;
    const todayIsCheckedIn = !!todayCheckIn;
    const canCheckIn = !todayIsCheckedIn;
    
    // 今日应得的奖励（如果未签到）
    const todayRewardDay = Math.min(currentStreak + 1, 7);
    const todayReward = todayIsCheckedIn ? 0 : CHECK_IN_REWARDS[todayRewardDay - 1] || 0;

    // 连续签到的记录
    const streakDates = recentCheckIns.map(checkin => {
      const date = new Date(checkin.checkInDate);
      return {
        date: date.toISOString().split('T')[0],
        day: checkin.consecutiveDays,
        reward: parseFloat(checkin.rewardAmount.toString()),
        isCheckedIn: true
      };
    });

    // 构建7天日历数据
    const calendarData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existingRecord = streakDates.find(d => d.date === dateStr);
      
      calendarData.push({
        date: dateStr,
        day: existingRecord ? existingRecord.day : null,
        reward: existingRecord ? existingRecord.reward : null,
        isCheckedIn: !!existingRecord,
        isToday: dateStr === today
      });
    }

    const responseData = {
      user: {
        userId: user.id,
        username: user.username,
        firstName: user.firstName,
        luckyCoins: parseFloat(user.luckyCoins.toString())
      },
      todayStatus: {
        date: today,
        isCheckedIn: todayIsCheckedIn,
        canCheckIn: canCheckIn,
        reward: parseFloat(todayCheckIn?.rewardAmount?.toString() || '0'),
        rewardAmount: todayReward,
        nextRewardDay: todayRewardDay
      },
      cycleInfo: {
        currentStreak: currentStreak,
        cycleProgress: Math.min(currentStreak, 7),
        isCycleCompleted: currentStreak >= 7,
        rewardConfig: CHECK_IN_REWARDS,
        totalRewardAmount: TOTAL_REWARD_AMOUNT
      },
      calendar: calendarData,
      statistics: {
        totalCheckIns: recentCheckIns.length,
        maxConsecutiveDays: Math.max(...recentCheckIns.map(c => c.consecutiveDays), 0),
        totalEarned: recentCheckIns.reduce((sum, c) => sum + parseFloat(c.rewardAmount.toString()), 0)
      }
    };

    const duration = Date.now() - startTime;
    
    requestLogger.info('成功获取用户签到状态', { 
      userId: decoded.userId,
      currentStreak: responseData.cycleInfo.currentStreak,
      isCheckedInToday: responseData.todayStatus.isCheckedIn,
      canCheckIn: responseData.todayStatus.canCheckIn
    }, {
      endpoint: '/api/checkin/status',
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
      endpoint: '/api/checkin/status',
      method: 'GET'
    });

    return NextResponse.json<ApiResponse>(
      ApiResponse.internal('获取签到状态失败，请稍后重试'),
      { status: 500 }
    );
  }
}

// 计算连续签到天数
async function getConsecutiveDays(userId: string): Promise<number> {
  try {
    const checkIns = await prisma.dailyCheckIns.findMany({
      where: {
        userId: userId,
        status: 'claimed'
      },
      orderBy: {
        checkInDate: 'desc'
      },
      take: 50 // 只查询最近50条记录以提高性能
    });

    if (checkIns.length === 0) {
      return 0;
    }

    let consecutive = 0;
    let expectedDate = new Date();

    for (const checkIn of checkIns) {
      const checkInDate = new Date(checkIn.checkInDate);
      const checkInDateStr = checkInDate.toISOString().split('T')[0];
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (checkInDateStr === expectedDateStr) {
        consecutive++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }

    return consecutive;
  } catch (error) {
    logger.error('计算连续签到天数失败', error as Error, { userId });
    return 0;
  }
}