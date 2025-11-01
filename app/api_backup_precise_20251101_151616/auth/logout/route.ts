import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies, setSecurityHeaders } from '@/lib/auth';
import { withErrorHandling } from '../../../lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const logger = getLogger();
  const requestId = crypto.randomUUID();

  try {
    // 获取当前用户信息（用于日志记录）
    const authHeader = req.headers.get('authorization');
    let userId = 'unknown';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // 这里可以添加token解析逻辑，但为了安全起见，我们不解析token内容
      userId = 'authenticated_user';
    }

    // 清除所有认证相关的cookies
    const response = NextResponse.json(
      respond.success({
        message: '登出成功',
        timestamp: new Date().toISOString()
      }, requestId).toJSON()
    );

    // 设置安全头
    setSecurityHeaders(response);

    // 清除认证cookies
    clearAuthCookies(response);

    // 记录登出日志
    logger.info('User logged out successfully', {
      userId,
      requestId,
      timestamp: new Date().toISOString()
    });

    return response;

  } catch (error) {
    logger.error('Logout error', error as Error, { requestId });
    
    return NextResponse.json(
      respond.customError('INTERNAL_ERROR', '登出处理失败').toJSON(),
      { status: 500 }
    );
  }
});

// 处理预检请求
export const OPTIONS = async (req: NextRequest) => {
  const response = new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
      'Access-Control-Max-Age': '86400',
    },
  });

  setSecurityHeaders(response);
  return response;
};