// 获取转售商品列表
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `list_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('list_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('list_route.ts request failed', error as Error, {
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where: any = { status: 'active' };

    // 分类筛选需要先关联产品
    let categoryFilter = '';
    if (category && category !== 'all') {
      categoryFilter = ` AND p.category = '${category}'`;
    }

    // 使用原生SQL查询以获得最佳性能，关联转售列表、商品和卖家信息
    const query = `
      SELECT 
        rl.*,
        p.id as product_id,
        p.name_zh as product_name_zh,
        p.name_en as product_name_en,
        p.images as product_images,
        p.market_price as product_market_price,
        p.category as product_category,
        u.username as seller_username,
        u.first_name as seller_first_name
      FROM resale_listings rl
      LEFT JOIN products p ON rl.product_id = p.id
      LEFT JOIN users u ON rl.seller_user_id = u.id
      WHERE rl.status = 'active'${categoryFilter}
      ORDER BY rl.listed_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM resale_listings rl
      LEFT JOIN products p ON rl.product_id = p.id
      WHERE rl.status = 'active'${categoryFilter}
    `;

    // 执行查询
    const [listings, countResult] = await Promise.all([
      prisma.$queryRawUnsafe(query),
      prisma.$queryRawUnsafe(countQuery)
    ]);

    const total = Number(countResult[0]?.total || 0);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        listings: listings || [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'获取转售列表失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '获取转售列表失败'
    }, { status: 500 });
  }
}
