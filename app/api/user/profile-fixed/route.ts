import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { convertUserFromPrisma } from '@/types';
import { ApiResponse } from '@/types';
import { TajikistanTimeUtils } from '@/lib/timezone-utils';

export async function GET(request: NextRequest) {
  try {
    // 验证JWT Token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // 获取用户信息
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '用户不存在'
      }, { status: 404 });
    }

    // 检查并重置每日免费次数（使用塔吉克斯坦时区）
    const needsReset = TajikistanTimeUtils.isNewDay(user.lastFreeResetDate);
    
    if (needsReset) {
      const tajikistanNow = TajikistanTimeUtils.getCurrentTime();
      
      // 使用原子性更新操作
      const updatedUser = await prisma.users.update({
        where: { id: user.id },
        data: {
          freeDailyCount: 3,
          lastFreeResetDate: tajikistanNow
        }
      });
      
      // 记录重置日志
      await prisma.transactions.create({
        data: {
          userId: user.id,
          type: 'free_count_reset',
          amount: 0,
          balanceType: 'system',
          description: `免费次数重置 - ${TajikistanTimeUtils.getCurrentDateString()}`
        }
      });
      
      // 记录系统日志
      await prisma.$executeRaw`
        SELECT log_system_event('free_count_reset', '用户免费次数重置', $1)
      `, {
        user_id: user.id,
        user_telegram_id: user.telegramId,
        reset_time: tajikistanNow.toISOString(),
        previous_count: user.freeDailyCount,
        new_count: 3
      };
      
      // 更新用户对象用于响应
      user.freeDailyCount = 3;
      user.lastFreeResetDate = tajikistanNow;
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...convertUserFromPrisma(user),
        // 添加时区信息用于调试
        timezone: TajikistanTimeUtils.TIMEZONE,
        lastResetDateLocal: TajikistanTimeUtils.formatLocal(user.lastFreeResetDate),
        currentTimeLocal: TajikistanTimeUtils.formatLocal(new Date()),
        isNewDay: TajikistanTimeUtils.isNewDay(user.lastFreeResetDate)
      }
    });

  } catch (error: any) {
    console.error('Get profile error:', error);
    
    // 记录错误日志
    try {
      await prisma.$executeRaw`
        SELECT log_system_event('profile_error', '获取用户信息失败', $1)
      `, {
        error: error.message,
        user_id: decoded?.userId,
        timestamp: new Date().toISOString()
      };
    } catch (logError) {
      console.error('记录错误日志失败:', logError);
    }
    
    return NextResponse.json(
      { error: '获取用户信息失败', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const body = await request.json();
    const { language } = body;

    if (language && !['zh', 'en', 'ru'].includes(language)) {
      return NextResponse.json({ error: '无效的语言' }, { status: 400 });
    }

    const updatedUser = await prisma.users.update({
      where: { id: decoded.userId },
      data: { language }
    });

    const messages: Record<string, string> = {
      zh: '语言已切换为中文',
      en: 'Language switched to English',
      ru: 'Язык переключен на русский'
    };

    return NextResponse.json({
      success: true,
      data: {
        language: updatedUser.language,
        message: messages[language] || messages.zh
      }
    });

  } catch (error: any) {
    console.error('Update profile error:', error);
    
    // 记录错误日志
    try {
      await prisma.$executeRaw`
        SELECT log_system_event('profile_update_error', '更新用户信息失败', $1)
      `, {
        error: error.message,
        user_id: decoded?.userId,
        timestamp: new Date().toISOString()
      };
    } catch (logError) {
      console.error('记录错误日志失败:', logError);
    }
    
    return NextResponse.json(
      { error: '更新失败', message: error.message },
      { status: 500 }
    );
  }
}