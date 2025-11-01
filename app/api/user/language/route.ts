import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withI18n, ApiLanguageContext } from '@/lib/i18n-middleware';
import { validateLanguageParameter } from '@/lib/i18n-middleware';
import { getLogger } from '@/lib/logger';

/**
 * 更新用户语言偏好设置
 */
async function PUT(request: NextRequest & { languageContext: ApiLanguageContext }) {
  const { languageContext, formatter } = request;
  
  try {
    const body = await request.json();
    const { userId, language } = body;

    // 验证必需参数
    if (!userId || !language) {
      return NextResponse.json(
        formatter.formatError(
          'validation_error',
          'validation_error',
          { requiredFields: ['userId', 'language'] }
        ),
        { status: 400 }
      );
    }

    // 更新用户语言偏好
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { preferredLanguage: language },
      select: {
        id: true,
        preferredLanguage: true,
        email: true,
        createdAt: true
      }
    });

    // 返回成功响应
    const response = formatter.formatSuccess(
      { user: updatedUser },
      'success',
      {
        languageChanged: true,
        previousLanguage: languageContext.detectedLanguage,
        newLanguage: language
      }
    );

    // 设置cookie来持久化语言偏好
    const headers = new Headers(response.headers);
    headers.append('Set-Cookie', 
      `preferred_language=${language}; Path=/; Max-Age=31536000; SameSite=Lax`
    );

    return NextResponse.json(response, {
      headers: formatter.addLanguageHeaders(headers)
    });

  } catch (error: any) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'Update user language error:', error);
    
    // 处理特定错误类型
    if (error.code === 'P2025') {
      return NextResponse.json(
        formatter.formatError('user_not_found', 'user_not_found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      formatter.formatError('internal_error', 'error', { 
        originalError: error.message 
      }),
      { status: 500 }
    );
  }
}

/**
 * 获取用户语言偏好设置
 */
async function GET(request: NextRequest & { languageContext: ApiLanguageContext }) {
  const { languageContext, formatter } = request;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        formatter.formatError('validation_error', 'validation_error', {
          requiredField: 'userId'
        }),
        { status: 400 }
      );
    }

    // 获取用户信息（包含语言偏好）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        preferredLanguage: true,
        email: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        formatter.formatError('user_not_found', 'user_not_found'),
        { status: 404 }
      );
    }

    // 返回用户语言设置信息
    const response = formatter.formatSuccess(
      { 
        user: {
          id: user.id,
          preferredLanguage: user.preferredLanguage,
          email: user.email,
          createdAt: user.createdAt
        },
        availableLanguages: ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ']
      },
      undefined,
      {
        currentDetectedLanguage: languageContext.detectedLanguage,
        fallbackUsed: languageContext.fallbackUsed
      }
    );

    return NextResponse.json(response);

  } catch (error: any) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'Get user language error:', error);
    
    return NextResponse.json(
      formatter.formatError('internal_error', 'error', {
        originalError: error.message
      }),
      { status: 500 }
    );
  }
}

// 使用i18n中间件包装处理程序
const PUTWithI18n = withI18n(PUT);
const GETWithI18n = withI18n(GET);

// 导出包装后的处理程序
export { PUTWithI18n as PUT, GETWithI18n as GET };