import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateTokenPair, setSecurityHeaders } from '@/lib/auth';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const logger = getLogger();
  const requestId = crypto.randomUUID();

  try {
    // 从请求中获取刷新token
    const refreshToken = req.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      logger.warn('Missing refresh token', { requestId });
      return NextResponse.json(
        respond.validationError('缺少刷新令牌', 'refreshToken').toJSON(),
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="refresh_token_required"'
          }
        }
      );
    }

    // 验证刷新token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      logger.warn('Invalid refresh token', { requestId, userId: 'unknown' });
      return NextResponse.json(
        respond.validationError('无效的刷新令牌').toJSON(),
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="invalid_token"'
          }
        }
      );
    }

    // 生成新的token对
    const tokenPair = generateTokenPair(decoded.userId, decoded.telegramId);

    // 设置响应
    const response = NextResponse.json(
      respond.success({
        accessToken: tokenPair.accessToken,
        expiresIn: tokenPair.expiresIn,
        tokenType: 'Bearer',
        refreshToken: tokenPair.refreshToken
      }, requestId).toJSON()
    );

    // 设置安全头
    setSecurityHeaders(response);

    // 设置新的cookies
    response.cookies.set('access_token', tokenPair.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15分钟
      path: '/'
    });

    response.cookies.set('refresh_token', tokenPair.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7天
      path: '/api/auth/refresh'
    });

    logger.info('Token refreshed successfully', {
      userId: decoded.userId,
      requestId
    });

    return response;

  } catch (error) {
    logger.error('Token refresh error', error as Error, { requestId });
    
    return NextResponse.json(
      respond.customError('INTERNAL_ERROR', 'Token刷新失败').toJSON(),
      { 
        status: 500,
        headers: {
          'WWW-Authenticate': 'Bearer realm="internal_error"'
        }
      }
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