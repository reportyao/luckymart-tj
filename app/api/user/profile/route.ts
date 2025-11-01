import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { convertUserFromPrisma } from '@/types';
import { ApiResponse } from '@/types';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `profile_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('profile_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('profile_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

}

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

    // 检查并重置每日免费次数
    const today = new Date().toISOString().split('T')[0];
    const lastResetDate = user.lastFreeResetDate.toISOString().split('T')[0];

    if (today !== lastResetDate) {
      await prisma.users.update({
        where: { id: user.id },
        data: {
          freeDailyCount: 3,
          lastFreeResetDate: new Date()
        }
      });
      user.freeDailyCount = 3;
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: convertUserFromPrisma(user)
    });

  } catch (error: any) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'Get profile error:', error);
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
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'Update profile error:', error);
    return NextResponse.json(
      { error: '更新失败', message: error.message },
      { status: 500 }
    );
  }
}
