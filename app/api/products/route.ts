/**
 * 产品API路由 - 多语言版本
 * 
 * 支持根据用户语言偏好返回翻译后的产品数据
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  ProductMultilingualService,
  type SupportedLanguage,
} from '@/lib/services/multilingual-query';

/**
 * GET /api/products
 * 
 * 查询参数:
 * - language: 用户首选语言 (zh-CN, en-US, ru-RU, tg-TJ)
 * - category: 产品分类（可选）
 * - limit: 每页数量（可选，默认20）
 * - offset: 分页偏移（可选，默认0）
 * - status: 产品状态（可选，默认active）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 获取语言参数，默认塔吉克语
    const language = (searchParams.get('language') || 'tg-TJ') as SupportedLanguage;
    const category = searchParams.get('category') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'active';

    // 验证语言参数
    const validLanguages: SupportedLanguage[] = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];
    if (!validLanguages.includes(language)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_LANGUAGE',
            message: `不支持的语言代码: ${language}。支持的语言: ${validLanguages.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // 使用多语言服务查询产品
    const products = await ProductMultilingualService.getProductsByLanguage(
      language,
      {
        category,
        limit,
        offset,
      }
    );

    // 过滤状态
    const filteredProducts = products.filter(p => p.status === status);

    return NextResponse.json({
      success: true,
      data: filteredProducts,
      meta: {
        language,
        total: filteredProducts.length,
        limit,
        offset,
        category,
        status,
      },
    });
  } catch (error: any) {
    console.error('产品查询错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: error.message || '查询产品失败',
        },
      },
      { status: 500 }
    );
  }
}
