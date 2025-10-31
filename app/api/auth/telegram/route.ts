import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  validateTelegramWebAppDataEnhanced, 
  handleAuthError, 
  buildUserContext,
  detectNetworkQuality,
  type UserContext,
  type AuthError 
} from '@/lib/enhanced-auth';
import { generateJWT } from '@/lib/utils';
import { withErrorHandling } from '../../../lib/middleware';
import { createRequestTracker, trackPerformance } from '@/lib/request-tracker';
import { getLogger } from '@/lib/logger';
import { getMonitor } from '@/lib/monitoring';
import { respond } from '@/lib/responses';
import { CommonErrors } from '@/lib/errors';

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
      return NextResponse.json(
        respond.validationError('缺少initData参数', 'initData').toJSON(),
        { status: 400 }
      );
    }

    // 构建用户上下文
    const userContext = buildUserContext(req);
    
    // 检测网络质量
    try {
      userContext.networkQuality = await detectNetworkQuality();
    } catch (error) {
      console.warn('Network quality detection failed:', error);
      userContext.networkQuality = 'good'; // fallback
    }

    // 增强版验证Telegram WebApp数据（包含智能重试和友好错误提示）
    let telegramUser;
    try {
      telegramUser = await validateTelegramWebAppDataEnhanced(initData, userContext);
      logger.info('Enhanced Telegram auth successful', { 
        userId: telegramUser.id,
        username: telegramUser.username,
        requestId, 
        traceId,
        networkQuality: userContext.networkQuality,
        deviceType: userContext.deviceType
      });
    } catch (error) {
      const authError = error as AuthError;
      
      logger.warn('Enhanced Telegram auth failed', { 
        errorType: authError.type,
        errorMessage: authError.message,
        canRetry: authError.canRetry,
        requestId, 
        traceId 
      });
      
      // 返回用户友好的错误信息
      const friendlyError = handleAuthError(authError);
      return NextResponse.json(friendlyError, { status: 400 });
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
      
      // 创建新用户
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
        }
      });

      // 记录交易
      await prisma.transactions.create({
        data: {
          userId: user.id,
          type: 'bonus',
          amount: 50,
          balanceType: 'lottery_coin',
          description: '新用户注册赠送'
        }
      });

      logger.info('New user created', {
        telegramId: telegramUser.id,
        username: telegramUser.username,
        userId: user.id,
      }, { requestId, traceId });
    }

    dbSpan.finish(true, { userId: user.id, isNewUser });

    // 生成JWT Token
    let token;
    try {
      token = generateJWT(user.id, user.telegramId.toString());
    } catch (error) {
      logger.error('Failed to generate JWT token', error as Error, { userId: user.id });
      return NextResponse.json(
        respond.customError('INTERNAL_ERROR', '生成认证令牌失败').toJSON(),
        { status: 500 }
      );
    }

    operationSpan.finish(true, { userId: user.id, isNewUser });

    // 记录监控指标
    monitor.recordRequest(req, 200);
    monitor.recordResponseTime('/api/auth/telegram', Date.now() - tracker.getContext().startTime, 200);
    monitor.increment('auth_success_total', 1, { 
      method: 'telegram',
      version: 'enhanced',
      networkQuality: userContext.networkQuality,
      deviceType: userContext.deviceType
    });

    // 返回成功响应
    return NextResponse.json(
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