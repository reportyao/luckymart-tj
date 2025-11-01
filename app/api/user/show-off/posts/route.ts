import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `posts_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('posts_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
}
  } catch (error) {
    logger.error('posts_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

    // 获取用户的晒单列表
    export async function GET(request: NextRequest) {
      try {
        const session = await auth();
        if (!session?.user) {
          return NextResponse.json(;
            { success: false, error: '请先登录' },
            { status: 401 }
          );
    }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status'); // 可选：筛选特定状态;

        const skip = (page - 1) * limit;

        // 构建查询条件
        const where: any = {
          userId: session.user.id
        };

        if (status) {
          where.status = status;
        }

        const [posts, total] = await Promise.all([;
          prisma.showOffPosts.findMany({
            where,
            include: {
              round: {
                select: {
                  id: true,
                  roundNumber: true,
                  winningNumber: true,
                  drawTime: true,
                  products: {
                    select: {
                      id: true,
                      nameMultilingual: true,
                      nameZh: true,
                      nameEn: true,
                      nameRu: true,
                      images: true,
                      marketPrice: true
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
          }),
          prisma.showOffPosts.count({ where })
        ]);

        // 格式化返回数据
        const formattedPosts = posts.map(((post : any) : any) => ({
          id: post.id,
          content: post.content,
          images: post.images,
          product: {
            id: post.round.products.id,
            name: post.round.products.nameMultilingual || 
                  post.round.products.nameZh || 
                  post.round.products.nameEn || 
                  post.round.products.nameRu,
            images: post.round.products.images,
            marketPrice: post.round.products.marketPrice,
            winningInfo: {
              roundNumber: post.round.roundNumber,
              winningNumber: post.round.winningNumber,
              drawTime: post.round.drawTime
            }
          },
          stats: {
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            shareCount: post.shareCount,
            viewCount: post.viewCount
          },
          status: post.status,
          review: {
            reviewedAt: post.reviewedAt,
            rejectReason: post.rejectReason,
            coinRewarded: post.coinRewarded,
            coinRewardedAt: post.coinRewardedAt
          },
          createdAt: post.createdAt
        }));

        const totalPages = Math.ceil(total / limit);
        const hasMore = page < totalPages;

        return NextResponse.json({
          success: true,
          data: {
            posts: formattedPosts,
            pagination: {
              page,
              limit,
              total,
              totalPages,
              hasMore
            }
          }
        });

      } catch (error) {
        logger.error("API Error", error as Error, {
          requestId,
          endpoint: request.url
        });'获取我的晒单列表失败:', error);
        return NextResponse.json(;
          { success: false, error: '获取我的晒单列表失败' },
          { status: 500 }
        );
      }
}
