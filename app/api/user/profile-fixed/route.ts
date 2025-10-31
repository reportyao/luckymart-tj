import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { userService } from '@/lib/user-service';
import { convertUserFromPrisma } from '@/types';
import { ApiResponse } from '@/types';
import { TajikistanTimeUtils } from '@/lib/timezone-utils';
import { getLogger } from '@/lib/logger';

const logger = getLogger();

export async function GET(request: NextRequest) {
  try {
    // 验证JWT Token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const requestId = `profile_get_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('获取用户档案请求', { 
      userId: decoded.userId,
      requestId
    });

    // 使用用户服务获取档案（带缓存）
    const user = await userService.getUserProfile(decoded.userId);

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '用户不存在'
      }, { status: 404 });
    }

    // 检查并重置每日免费次数（使用塔吉克斯坦时区）
    const needsReset = TajikistanTimeUtils.isNewDay(user.lastFreeResetDate);
    
    if (needsReset) {
      logger.info('重置用户每日免费次数', { 
        userId: decoded.userId,
        requestId,
        previousCount: user.freeDailyCount
      });
      
      // 使用事务性缓存更新
      const result = await userService.updateUserProfile(decoded.userId, {
        freeDailyCount: 3,
        lastFreeResetDate: TajikistanTimeUtils.getCurrentTime()
      });
      
      if (result.success) {
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
        
        user.freeDailyCount = 3;
        user.lastFreeResetDate = TajikistanTimeUtils.getCurrentTime();
        
        logger.info('免费次数重置成功', {
          userId: decoded.userId,
          requestId,
          cacheUpdated: result.cacheUpdated
        });
      } else {
        logger.error('免费次数重置失败', {
          userId: decoded.userId,
          requestId,
          error: result.error
        });
      }
    }

    logger.info('用户档案获取成功', { 
      userId: decoded.userId,
      requestId,
      freeDailyCount: user.freeDailyCount,
      balance: user.balance 
    });

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
    logger.error('获取用户档案失败', {
      error: error.message,
      stack: error.stack
    });
    
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

    const requestId = `profile_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('更新用户档案请求', { 
      userId: decoded.userId,
      requestId,
      updates: { language }
    });

    // 使用事务性缓存更新
    const result = await userService.updateUserProfile(decoded.userId, { language });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '更新失败'
      }, { status: 500 });
    }

    const messages: Record<string, string> = {
      zh: '语言已切换为中文',
      en: 'Language switched to English',
      ru: 'Язык переключен на русский'
    };

    logger.info('用户档案更新成功', { 
      userId: decoded.userId,
      requestId,
      language,
      cacheUpdated: result.cacheUpdated,
      dbUpdated: result.dbUpdated
    });

    // 记录更新日志
    try {
      await prisma.$executeRaw`
        SELECT log_system_event('profile_updated', '用户档案更新', $1)
      `, {
        user_id: decoded.userId,
        updates: JSON.stringify({ language }),
        cache_updated: result.cacheUpdated,
        timestamp: new Date().toISOString()
      };
    } catch (logError) {
      console.error('记录更新日志失败:', logError);
    }

    return NextResponse.json({
      success: true,
      data: {
        language,
        message: messages[language] || messages.zh,
        cacheUpdated: result.cacheUpdated,
        dbUpdated: result.dbUpdated
      }
    });

  } catch (error: any) {
    logger.error('更新用户档案失败', {
      error: error.message,
      stack: error.stack
    });
    
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