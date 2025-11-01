import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { ApiResponse } from '@/lib/api-response';
import { getLogger } from '@/lib/logger';
import { DatabaseLockManager } from '@/lib/database-lock-manager';

const logger = getLogger();

// 签到奖励配置：7天周期的奖励金额
const CHECK_IN_REWARDS = [1.00, 0.50, 0.30, 0.10, 0.05, 0.03, 0.02];
const TOTAL_REWARD_AMOUNT = CHECK_IN_REWARDS.reduce((sum: any,  reward: any) => sum + reward, 0);

/**
 * 签到并领取奖励API
 * POST /api/check-in/claim
 */
export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const requestLogger = logger;
    const startTime = Date.now();

    // 验证必需参数
    if (!user?.userId) {
      requestLogger.warn('签到失败：用户ID缺失', undefined, {
        endpoint: '/api/check-in/claim',
        method: 'POST'
      });
      
      return NextResponse.json<ApiResponse>(
        ApiResponse.unauthorized('用户身份验证失败'),
        { status: 401 }
      );
    }

    requestLogger.info('开始处理用户签到', { userId: user.userId }, {
      endpoint: '/api/check-in/claim',
      method: 'POST'
    });

    // 获取请求体数据
    const body = await request.json().catch(() => ({}));
    const { forceCheckIn = false } = body; // 支持强制签到（用于断签重置后）

    // 使用数据库锁确保并发安全
    const lockKey = `check_in_${user.userId}`;
    const lockManager = DatabaseLockManager.getInstance();
    const lockAcquired = await lockManager.acquireLock(lockKey, 5000); // 5秒超时

    if (!lockAcquired) {
      requestLogger.warn('签到失败：获取数据库锁超时', { userId: user.userId }, {
        endpoint: '/api/check-in/claim',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(
        ApiResponse.badRequest('请求过于频繁，请稍后重试', 'RATE_LIMIT'),
        { status: 429 }
      );
    }

    try {
      // 开始数据库事务
      const result = await prisma.$transaction(async (tx: any) => {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式

        // 检查今日是否已签到
        const todayCheckIn = await tx.check_in_records.findFirst({
          where: {
            userId: user.userId,
            checkInDate: new Date(today)
          }
        });

        if (todayCheckIn && !forceCheckIn) {
          return {
            success: false,
            error: '今日已签到，请勿重复签到',
            code: 'ALREADY_CHECKED_IN'
          };
        }

        // 获取或创建当前签到周期
        let currentCycle = await tx.check_in_cycles.findFirst({
          where: {
            userId: user.userId,
            isActive: true
          }
        });

        // 获取最近7天内的签到记录，用于断签检测
        const recentCheckIns = await tx.check_in_records.findMany({
          where: {
            userId: user.userId,
            status: 'claimed',
            checkInDate: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: {
            checkInDate: 'desc'
          }
        });

        // 断签检测：如果连续签到中断，需要重置周期
        let shouldResetCycle = false;
        let cycleStartDate = today;
        let currentStreak = 1;

        if (currentCycle && recentCheckIns.length > 0) {
          const lastCheckIn = recentCheckIns[0];
          const lastCheckInDate = new Date(lastCheckIn.checkInDate);
          const todayDate = new Date(today);
          const daysDiff = Math.floor((todayDate.getTime() - lastCheckInDate.getTime()) / (24 * 60 * 60 * 1000));

          // 如果距离上次签到超过1天且不是强制签到，则视为断签
          if (daysDiff > 1 && !forceCheckIn) {
            shouldResetCycle = true;
            cycleStartDate = today;
            currentStreak = 1;
          } else if (daysDiff === 1) {
            // 连续签到，正常递增
            cycleStartDate = currentCycle.cycleStartDate;
            currentStreak = (currentCycle.currentStreak || 0) + 1;
          } else if (daysDiff === 0 && !forceCheckIn) {
            // 今日已签到
            return {
              success: false,
              error: '今日已签到，请勿重复签到',
              code: 'ALREADY_CHECKED_IN'
            };
          } else {
            // 强制签到或异常情况，重新开始
            shouldResetCycle = true;
            cycleStartDate = today;
            currentStreak = 1;
          }
        }

        // 处理周期重置
        if (shouldResetCycle || !currentCycle) {
          if (currentCycle) {
            // 关闭之前的活跃周期
            await tx.check_in_cycles.update({
              where: { id: currentCycle.id },
              data: {
                isActive: false,
                cycleEndDate: today,
                updatedAt: new Date()
              }
            });
          }

          // 创建新的签到周期
          currentCycle = await tx.check_in_cycles.create({
            data: {
              userId: user.userId,
              cycleStartDate: new Date(cycleStartDate),
              currentStreak: currentStreak,
              totalRewards: 0,
              isActive: true,
              isCompleted: false
            }
          });
        } else {
          // 更新现有周期
          currentCycle = await tx.check_in_cycles.update({
            where: { id: currentCycle.id },
            data: {
              currentStreak: currentStreak,
              updatedAt: new Date()
            }
          });
        }

        // 计算签到奖励
        const checkInDay = currentStreak;
        if (checkInDay > 7) {
          return {
            success: false,
            error: '当前签到周期已完成，请等待新的周期',
            code: 'CYCLE_COMPLETED'
          };
        }

        const rewardAmount = CHECK_IN_REWARDS[checkInDay - 1];

        // 创建签到记录
        let checkInRecord;
        if (todayCheckIn) {
          // 更新现有记录
          checkInRecord = await tx.check_in_records.update({
            where: { id: todayCheckIn.id },
            data: {
              checkInDay: checkInDay,
              rewardAmount: rewardAmount,
              status: 'claimed',
              updatedAt: new Date()
            }
          });
        } else {
          // 创建新记录
          checkInRecord = await tx.check_in_records.create({
            data: {
              userId: user.userId,
              checkInDate: new Date(today),
              checkInDay: checkInDay,
              rewardAmount: rewardAmount,
              status: 'claimed'
            }
          });
        }

        // 更新用户幸运币余额
        const updatedUser = await tx.users.update({
          where: { id: user.userId },
          data: {
            luckyCoins: {
              increment: rewardAmount
            },
            luckyCoinsVersion: {
              increment: 1
            },
            updatedAt: new Date()
          }
        });

        // 记录钱包交易
        await tx.wallet_transactions.create({
          data: {
            userId: user.userId,
            type: 'check_in_reward',
            amount: 0, // 余额不变
            luckyCoins: rewardAmount,
            currency: 'LC', // LuckyCoins
            description: `签到奖励 - 第${checkInDay}天`,
            status: 'completed',
            metadata: {
              checkInDay: checkInDay,
              rewardAmount: rewardAmount,
              cycleId: currentCycle.id,
              checkInRecordId: checkInRecord.id
            }
          }
        });

        // 判断是否完成7天周期
        const isCycleCompleted = checkInDay === 7;
        
        // 如果完成周期，更新周期状态
        if (isCycleCompleted) {
          await tx.check_in_cycles.update({
            where: { id: currentCycle.id },
            data: {
              isCompleted: true,
              cycleEndDate: today,
              isActive: false,
              totalRewards: {
                increment: rewardAmount
              },
              updatedAt: new Date()
            }
          });
        } else {
          // 更新周期总奖励
          await tx.check_in_cycles.update({
            where: { id: currentCycle.id },
            data: {
              totalRewards: {
                increment: rewardAmount
              },
              updatedAt: new Date()
            }
          });
        }

        return {
          success: true,
          checkInRecord: {
            id: checkInRecord.id,
            checkInDate: today,
            checkInDay: checkInDay,
            rewardAmount: rewardAmount,
            status: checkInRecord.status
          },
          currentCycle: {
            id: currentCycle.id,
            cycleStartDate: currentCycle.cycleStartDate,
            currentStreak: currentStreak,
            isCompleted: isCycleCompleted
          },
          userBalance: {
            luckyCoins: parseFloat(updatedUser.luckyCoins.toString()),
            version: updatedUser.luckyCoinsVersion
          }
        };
      });

      // 如果签到失败，释放锁并返回错误
      if (!result.success) {
        requestLogger.warn('签到失败', { 
          userId: user.userId, 
          error: result.error,
          code: result.code 
        }, {
          endpoint: '/api/check-in/claim',
          method: 'POST'
        });

        const errorResponse = result.code === 'ALREADY_CHECKED_IN' 
          ? ApiResponse.badRequest(result.error, result.code)
          : result.code === 'CYCLE_COMPLETED'
          ? ApiResponse.badRequest(result.error, result.code)
          : ApiResponse.badRequest(result.error, result.code);

        return NextResponse.json<ApiResponse>(errorResponse, { status: 400 });
      }

      const duration = Date.now() - startTime;
      
      requestLogger.info('签到成功', { 
        userId: user.userId,
        checkInDay: result.checkInRecord.checkInDay,
        rewardAmount: result.checkInRecord.rewardAmount,
        currentStreak: result.currentCycle.currentStreak,
        isCycleCompleted: result.currentCycle.isCompleted
      }, {
        endpoint: '/api/check-in/claim',
        method: 'POST',
        duration
      });

      // 返回成功响应
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          checkIn: result.checkInRecord,
          cycle: result.currentCycle,
          balance: result.userBalance,
          nextReward: result.currentCycle.isCompleted ? 0 : CHECK_IN_REWARDS[result.currentCycle.currentStreak] || 0,
          message: result.currentCycle.isCompleted 
            ? '恭喜完成7天签到周期！' 
            : `签到成功！获得${result.checkInRecord.rewardAmount}幸运币`
        },
        message: '签到成功'
      });

    } finally {
      // 释放数据库锁
      await lockManager.releaseLock(lockKey);
    }

  } catch (error) {
    logger.error('签到时发生异常', error as Error, {
      userId: user?.userId,
      endpoint: '/api/check-in/claim',
      method: 'POST'
    });

    return NextResponse.json<ApiResponse>(
      ApiResponse.internal('签到失败，请稍后重试'),
      { status: 500 }
    );
  }
});