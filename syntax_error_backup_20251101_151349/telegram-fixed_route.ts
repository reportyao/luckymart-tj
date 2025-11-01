import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateTelegramWebAppData, generateJWT } from '@/lib/utils';
import { withErrorHandling } from '../../../lib/middleware';
import { createRequestTracker, trackPerformance } from '@/lib/request-tracker';
import { getLogger } from '@/lib/logger';
import { getMonitor } from '@/lib/monitoring';
import { respond } from '@/lib/responses';
import { UnifiedTimezoneUtils, FREE_COUNT_RULES } from '@/lib/timezone-config';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const tracker = createRequestTracker(req);
  const logger = getLogger();
  const monitor = getMonitor();
  const requestId = tracker.getRequestId();
  const traceId = tracker.getTraceId();

  logger.logRequest(req, { requestId, traceId });
  
  // 开始业务操作跟踪
  const operationSpan = tracker.startSpan('telegram_auth');

  try {
    const body = await req.json();
    const { initData } = body;

    if (!initData) {
      logger.warn('Missing initData parameter', { requestId, traceId });
      return NextResponse.json(;
        respond.validationError('缺少initData参数', 'initData').toJSON(),
        { status: 400 }
      );
}

    // 验证Telegram WebApp数据
    let telegramUser;
    try {
      telegramUser = validateTelegramWebAppData(initData);
    } catch (error) {
      logger.warn('Invalid Telegram auth data', { 
        error: (error as Error).message, 
        requestId, 
        traceId 
      });
      return NextResponse.json(;
        respond.validationError('Telegram认证数据无效').toJSON(),
        { status: 400 }
      );
    }

    // 开始数据库操作跟踪
    const dbSpan = tracker.startSpan('user_lookup_create');
    
    // 查找或创建用户
    let user = await prisma.users.findUnique({
      where: { telegramId: telegramUser.id }
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      
      // 获取塔吉克斯坦当前时间
      const tajikistanNow = UnifiedTimezoneUtils.getCurrentTime();
      
      // 创建新用户，包含正确的免费次数初始化
      user = await prisma.users.create({
        data: {
          telegramId: telegramUser.id,
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          avatarUrl: telegramUser.photo_url,
          language: telegramUser.language_code === 'ru' ? 'ru' : 
                    telegramUser.language_code === 'zh' ? 'zh' : 'en',
          balance: 50, // 新用户赠送50夺宝币
          freeDailyCount: 3, // 新用户获得3次免费机会
          lastFreeResetDate: tajikistanNow, // 设置为当前塔吉克斯坦时间
          totalSpent: 0,
          platformBalance: 0,
          vipLevel: 0,
          free_count_version: 0,
          balance_version: 0
        }
      });

      // 记录注册赠送交易
      await prisma.transactions.create({
        data: {
          userId: user.id,
          type: 'bonus',
          amount: 50,
          balanceType: 'lottery_coin',
          description: '新用户注册赠送'
        }
      });

      // 记录免费次数初始化日志
      await prisma.transactions.create({
        data: {
          userId: user.id,
          type: 'free_count_init',
          amount: 0,
          balanceType: 'system',
          description: '新用户免费次数初始化'
        }
      });

      // 记录系统日志
      await prisma.$executeRaw`
        SELECT log_system_event('new_user_registration', '新用户注册完成', $1)
      `, {
        user_id: user.id,
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        language: user.language,
        free_daily_count: 3,
        registration_time: tajikistanNow.toISOString()
      };

      logger.info('New user created with free count', {
        telegramId: telegramUser.id,
        username: telegramUser.username,
        userId: user.id,
        freeDailyCount: 3,
        resetDate: tajikistanNow.toISOString()
      }, { requestId, traceId });
    } else {
      // 老用户检查是否需要重置免费次数
      const tajikistanNow = UnifiedTimezoneUtils.getCurrentTime();
      const isNewDay = UnifiedTimezoneUtils.getCurrentTime().toISOString().split('T')[0] !==;
        user.lastFreeResetDate.toISOString().split('T')[0];
      
      if (isNewDay) {
        // 自动重置免费次数
        user = await prisma.users.update({
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
            description: `免费次数重置 - ${UnifiedTimezoneUtils.getCurrentTime().toISOString().split('T')[0]}`
          }
        });
      }
    }

    dbSpan.finish(true, { userId: user.id, isNewUser });

    // 生成JWT Token
    let token;
    try {
      token = generateJWT(user.id, user.telegramId.toString());
    } catch (error) {
      logger.error('Failed to generate JWT token', error as Error, { userId: user.id });
      return NextResponse.json(;
        respond.customError('INTERNAL_ERROR', '生成认证令牌失败').toJSON(),
        { status: 500 }
      );
    }

    operationSpan.finish(true, { userId: user.id, isNewUser });

    // 记录监控指标
    monitor.recordRequest(req, 200);
    monitor.recordResponseTime('/api/auth/telegram', Date.now() - tracker.getContext().startTime, 200);
    monitor.increment('auth_success_total', 1, { method: 'telegram' });

    // 返回成功响应
    return NextResponse.json(;
  }
      respond.success({
        token,
        user: {
          id: user.id,
          telegramId: user.telegramId.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          avatarUrl: user.avatarUrl,
          language: user.language,
          balance: parseFloat(user.balance.toString()),
          platformBalance: parseFloat(user.platformBalance.toString()),
          vipLevel: user.vipLevel,
          freeDailyCount: user.freeDailyCount,
          // 添加时区信息
          timezone: UnifiedTimezoneUtils.TIMEZONE_CONFIG.DEFAULT_TIMEZONE,
          lastResetDateLocal: UnifiedTimezoneUtils.getCurrentTime().toLocaleString('zh-CN', {
            timeZone: UnifiedTimezoneUtils.TIMEZONE_CONFIG.DEFAULT_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      }, requestId, {
        isNewUser,
        loginMethod: 'telegram',
      }).toJSON()
    );

  } catch (error) {
    operationSpan.finish(false, { error: (error as Error).message });
    
    logger.error('Telegram auth error', error as Error, {
      requestId,
      traceId,
      endpoint: req.url,
      method: req.method
    }, { requestId, traceId });

    monitor.recordRequest(req, 500);
    monitor.increment('auth_error_total', 1, { method: 'telegram' });

    throw error;
  }
});

// 处理预检请求
export const OPTIONS = async (req: NextRequest) => {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-Trace-ID',
      'Access-Control-Max-Age': '86400',
    },
  });
};