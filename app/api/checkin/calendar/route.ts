import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '@/lib/api-response';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';

const logger = getLogger();

// 7天签到奖励配置
const CHECK_IN_REWARDS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.25, 0.25];
const TOTAL_REWARD_AMOUNT = CHECK_IN_REWARDS.reduce((sum: any: any,   reward: any: any) => sum + reward, 0);

/**
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `calendar_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('calendar_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
}
  } catch (error) {
    logger.error('calendar_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {
     * GET /api/checkin/calendar
     */
    export async function GET(request: NextRequest) {
      try {
        const requestLogger = logger;
        const startTime = Date.now();

        // 验证JWT Token
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          requestLogger.warn('获取签到日历失败：未授权访问', undefined, {
            endpoint: '/api/checkin/calendar',
            method: 'GET'
          });
      
          return NextResponse.json<ApiResponse>(;
            ApiResponse.unauthorized('用户身份验证失败'),
            { status: 401 }
          );
    }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

        if (!decoded?.userId) {
          requestLogger.warn('获取签到日历失败：用户ID缺失', undefined, {
            endpoint: '/api/checkin/calendar',
            method: 'GET'
          });
      
          return NextResponse.json<ApiResponse>(;
            ApiResponse.unauthorized('用户身份验证失败'),
            { status: 401 }
          );
        }

        requestLogger.info('开始获取用户签到日历', { userId: decoded.userId }, {
          endpoint: '/api/checkin/calendar',
          method: 'GET'
        });

        // 获取用户信息
        const user = await prisma.users.findUnique({
          where: { id: decoded.userId }
        });

        if (!user) {
          requestLogger.warn('获取签到日历失败：用户不存在', { userId: decoded.userId }, {
            endpoint: '/api/checkin/calendar',
            method: 'GET'
          });

          return NextResponse.json<ApiResponse>(;
            ApiResponse.notFound('用户不存在'),
            { status: 404 }
          );
        }

        // 获取查询参数
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '7'; // 默认7天;
        const month = searchParams.get('month'); // 可选：获取整月数据;

        let startDate: Date;
        let endDate: Date;

        if (month) {
          // 获取整月数据
          const [year, monthNum] = month.split('-').map(Number);
          startDate = new Date(year, monthNum - 1, 1);
          endDate = new Date(year, monthNum, 0); // 月末
        } else {
          // 获取指定天数的日历数据
          const days = Math.min(Math.max(parseInt(period), 1), 30); // 限制1-30天;
          startDate = new Date();
          startDate.setDate(startDate.getDate() - (days - 1));
          endDate = new Date();
        }

        // 获取该时间段的签到记录
        const checkInRecords = await prisma.dailyCheckIns.findMany({
          where: {
            userId: decoded.userId,
            checkInDate: {
              gte: startDate,
              lte: endDate
            },
            status: 'claimed'
          },
          orderBy: {
            checkInDate: 'asc'
          }
        });

        // 计算连续签到天数（不考虑今日）
        const consecutiveDays = await getConsecutiveDays(decoded.userId);

        // 构建日历数据
        const calendarData = [];
        const today = new Date();
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const isToday = currentDate.toDateString() === today.toDateString();
      
          // 查找对应的签到记录
          const checkInRecord = checkInRecords.find(record => {
            const recordDate = new Date(record.checkInDate);
            return recordDate.toISOString().split('T')[0] === dateStr;
          });

          // 计算这一天的理论奖励（基于连续天数）
          let theoreticalReward: any = null;
          if (checkInRecord) {
            theoreticalReward = CHECK_IN_REWARDS[checkInRecord.consecutiveDays - 1] || 0;
          }

          calendarData.push({
            date: dateStr,
            day: checkInRecord ? checkInRecord.consecutiveDays : null,
            reward: checkInRecord ? parseFloat(checkInRecord.rewardAmount.toString()) : null,
            theoreticalReward: theoreticalReward,
            isCheckedIn: !!checkInRecord,
            isToday: isToday,
            isFuture: currentDate > today,
            dayOfWeek: currentDate.getDay(), // 0-6 (周日-周六)
            dayOfMonth: currentDate.getDate()
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        // 获取统计信息
        const statistics = {
          totalCheckIns: checkInRecords.length,
          totalEarned: checkInRecords.reduce((sum: any: any,   record: any: any) => sum + parseFloat(record.rewardAmount.toString()), 0),
          currentStreak: consecutiveDays,
          maxStreak: await getMaxStreak(decoded.userId),
          completionRate: calendarData.length > 0 ? 
            (checkInRecords.length / calendarData.length * 100).toFixed(1) : '0.0'
        };

        const responseData = {
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            days: calendarData.length
          },
          calendar: calendarData,
          rewards: {
            daily: CHECK_IN_REWARDS,
            total: TOTAL_REWARD_AMOUNT,
            cycleDays: 7
          },
          stats: statistics,
          todayInfo: {
            date: today.toISOString().split('T')[0],
            canCheckIn: calendarData.find(d => d.isToday)?.isCheckedIn === false,
            todayReward: consecutiveDays < 7 ? CHECK_IN_REWARDS[consecutiveDays] : 0,
            nextDay: consecutiveDays + 1
          }
        };

        const duration = Date.now() - startTime;
    
        requestLogger.info('成功获取用户签到日历', { 
          userId: decoded.userId,
          periodDays: calendarData.length,
          totalCheckIns: statistics.totalCheckIns,
          currentStreak: statistics.currentStreak
        }, {
          endpoint: '/api/checkin/calendar',
          method: 'GET',
          duration
        });

        // 返回成功响应
        return NextResponse.json<ApiResponse>({
          success: true,
          data: responseData,
          message: '签到日历获取成功'
        });

      } catch (error) {
        logger.error('获取签到日历时发生异常', error as Error, {
          endpoint: '/api/checkin/calendar',
          method: 'GET'
        });

        return NextResponse.json<ApiResponse>(;
          ApiResponse.internal('获取签到日历失败，请稍后重试'),
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
      take: 50
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
  }
  } catch (error) {
    logger.error('计算连续签到天数失败', error as Error, { userId });
    return 0;
  }
}

// 获取最大连续签到天数
async function getMaxStreak(userId: string): Promise<number> {
  try {
    const checkIns = await prisma.dailyCheckIns.findMany({
      where: {
        userId: userId,
        status: 'claimed'
      },
      orderBy: {
        checkInDate: 'asc'
      },
      take: 365 // 最多查询一年的数据
    });

    if (checkIns.length === 0) {
      return 0;
  }
    }

    let maxStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const checkIn of checkIns) {
      const checkInDate = new Date(checkIn.checkInDate);
      
      if (lastDate) {
        const daysDiff = Math.floor((checkInDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      maxStreak = Math.max(maxStreak, currentStreak);
      lastDate = checkInDate;
    }

    return maxStreak;
  } catch (error) {
    logger.error('获取最大连续签到天数失败', error as Error, );
    return 0;
  }
}