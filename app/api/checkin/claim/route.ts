import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '@/lib/api-response';
import { getLogger } from '@/lib/logger';

const logger = getLogger();

// 7天签到奖励配置
const CHECK_IN_REWARDS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.25, 0.25];
const TOTAL_REWARD_AMOUNT = CHECK_IN_REWARDS.reduce((sum: any,  reward: any) => sum + reward, 0);

/**
 * 执行签到并获取奖励API
 * POST /api/checkin/claim
 */
export async function POST(request: NextRequest) {
  try {
    const requestLogger = logger;
    const startTime = Date.now();

    // 验证JWT Token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      requestLogger.warn('签到失败：未授权访问', undefined, {
        endpoint: '/api/checkin/claim',
        method: 'POST'
      });
      
      return NextResponse.json<ApiResponse>(
        ApiResponse.unauthorized('用户身份验证失败'),
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    if (!decoded?.userId) {
      requestLogger.warn('签到失败：用户ID缺失', undefined, {
        endpoint: '/api/checkin/claim',
        method: 'POST'
      });
      
      return NextResponse.json<ApiResponse>(
        ApiResponse.unauthorized('用户身份验证失败'),
        { status: 401 }
      );
    }

    requestLogger.info('开始处理用户签到', { userId: decoded.userId }, {
      endpoint: '/api/checkin/claim',
      method: 'POST'
    });

    // 开始数据库事务
    const result = await prisma.$transaction(async (tx) => {
      const today = new Date().toISOString().split('T')[0];

      // 检查今日是否已签到
      const existingCheckIn = await tx.dailyCheckIns.findFirst({
        where: {
          userId: decoded.userId,
          checkInDate: new Date(today)
        }
      });

      if (existingCheckIn) {
        return {
          success: false,
          error: '今日已签到，请勿重复签到',
          code: 'ALREADY_CHECKED_IN'
        };
      }

      // 获取用户信息
      const user = await tx.users.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return {
          success: false,
          error: '用户不存在',
          code: 'USER_NOT_FOUND'
        };
      }

      // 计算连续签到天数
      const consecutiveDays = await getConsecutiveDays(tx, decoded.userId);
      const currentDay = consecutiveDays + 1;

      if (currentDay > 7) {
        return {
          success: false,
          error: '当前签到周期已完成，请等待新的周期',
          code: 'CYCLE_COMPLETED'
        };
      }

      // 获取今日奖励
      const rewardAmount = CHECK_IN_REWARDS[currentDay - 1];

      // 创建签到记录
      const checkInRecord = await tx.dailyCheckIns.create({
        data: {
          userId: decoded.userId,
          checkInDate: new Date(today),
          consecutiveDays: currentDay,
          rewardAmount: rewardAmount,
          status: 'claimed'
        }
      });

      // 更新用户luckyCoins余额
      const updatedUser = await tx.users.update({
        where: { id: decoded.userId },
        data: {
          luckyCoins: {
            increment: rewardAmount
          },
          luckyCoinsVersion: {
            increment: 1
          }
        }
      });

      // 记录钱包交易
      await tx.wallet_transactions.create({
        data: {
          userId: decoded.userId,
          type: 'check_in_reward',
          amount: 0,
          luckyCoins: rewardAmount,
          currency: 'LC',
          description: `7天签到奖励 - 第${currentDay}天`,
          status: 'completed',
          metadata: {
            checkInDay: currentDay,
            rewardAmount: rewardAmount,
            cycleProgress: currentDay,
            totalRewardAmount: TOTAL_REWARD_AMOUNT
          }
        }
      });

      // 判断是否完成7天周期
      const isCycleCompleted = currentDay === 7;

      return {
        success: true,
        checkInRecord: {
          id: checkInRecord.id,
          date: today,
          day: currentDay,
          reward: rewardAmount,
          status: 'claimed',
          consecutiveDays: currentDay
        },
        cycleInfo: {
          currentStreak: currentDay,
          isCycleCompleted: isCycleCompleted,
          nextReward: isCycleCompleted ? 0 : CHECK_IN_REWARDS[currentDay] || 0,
          progress: `${currentDay}/7`
        },
        userBalance: {
          luckyCoins: parseFloat(updatedUser.luckyCoins.toString())
        },
        rewardInfo: {
          todayReward: rewardAmount,
          totalCycleReward: TOTAL_REWARD_AMOUNT,
          earnedInCycle: currentDay === 7 ? TOTAL_REWARD_AMOUNT : CHECK_IN_REWARDS.slice(0, currentDay).reduce((sum, r) => sum + r, 0)
        }
      };
    });

    // 如果签到失败，释放锁并返回错误
    if (!result.success) {
      requestLogger.warn('签到失败', { 
        userId: decoded.userId, 
        error: result.error,
        code: result.code 
      }, {
        endpoint: '/api/checkin/claim',
        method: 'POST'
      });

      const errorResponse = result.code === 'ALREADY_CHECKED_IN' 
        ? ApiResponse.badRequest(result.error, result.code)
        : result.code === 'CYCLE_COMPLETED'
        ? ApiResponse.badRequest(result.error, result.code)
        : result.code === 'USER_NOT_FOUND'
        ? ApiResponse.notFound(result.error)
        : ApiResponse.badRequest(result.error, result.code);

      return NextResponse.json<ApiResponse>(errorResponse, { status: 400 });
    }

    const duration = Date.now() - startTime;
    
    requestLogger.info('签到成功', { 
      userId: decoded.userId,
      checkInDay: result.checkInRecord.day,
      rewardAmount: result.checkInRecord.reward,
      currentStreak: result.cycleInfo.currentStreak,
      isCycleCompleted: result.cycleInfo.isCycleCompleted
    }, {
      endpoint: '/api/checkin/claim',
      method: 'POST',
      duration
    });

    // 返回成功响应
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        checkIn: result.checkInRecord,
        cycle: result.cycleInfo,
        balance: result.userBalance,
        reward: result.rewardInfo,
        message: result.cycleInfo.isCycleCompleted 
          ? `恭喜完成7天签到周期！获得总计${TOTAL_REWARD_AMOUNT}幸运币` 
          : `签到成功！第${result.checkInRecord.day}天获得${result.checkInRecord.reward}幸运币`
      },
      message: '签到成功'
    });

  } catch (error) {
    logger.error('签到时发生异常', error as Error, {
      endpoint: '/api/checkin/claim',
      method: 'POST'
    });

    return NextResponse.json<ApiResponse>(
      ApiResponse.internal('签到失败，请稍后重试'),
      { status: 500 }
    );
  }
}

// 计算连续签到天数
async function getConsecutiveDays(tx: any, userId: string): Promise<number> {
  try {
    const checkIns = await tx.dailyCheckIns.findMany({
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
  } catch (error) {
    logger.error('计算连续签到天数失败', error as Error, { userId });
    return 0;
  }
}