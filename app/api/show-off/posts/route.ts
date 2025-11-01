import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';

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
  } catch (error) {
    logger.error('posts_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

    // 获取晒单列表
    export async function GET(request: NextRequest) {
      try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const sort = searchParams.get('sort') || 'latest'; // latest | hottest
        const userId = searchParams.get('user_id'); // 可选：获取特定用户的晒单

        const skip = (page - 1) * limit;

        let orderBy: any = {};
        if (sort === 'hottest') {
          orderBy = { hotScore: 'desc' };
        } else {
          orderBy = { createdAt: 'desc' };
        }

        // 构建查询条件
        const where: any = {
          status: 'approved'
        };

        if (userId) {
          where.userId = userId;
        }

        const [posts, total] = await Promise.all([
          prisma.showOffPosts.findMany({
            where,
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                  vipLevel: true,
                  preferredLanguage: true
                }
              },
              round: {
                select: {
                  id: true,
                  productId: true,
                  roundNumber: true,
                  winningNumber: true,
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
            orderBy,
            skip,
            take: limit
          }),
          prisma.showOffPosts.count({ where })
        ]);

        // 计算分页信息
        const totalPages = Math.ceil(total / limit);
        const hasMore = page < totalPages;

        // 格式化返回数据
        const formattedPosts = posts.map((post : any) => ({
          id: post.id,
          user: {
            id: post.user.id,
            name: `${post.user.firstName} ${post.user.lastName || ''}`.trim(),
            avatar: post.user.avatarUrl,
            vipLevel: post.user.vipLevel,
            preferredLanguage: post.user.preferredLanguage
          },
          content: post.content,
          images: post.images,
          product: {
            id: post.round.products.id,
            name: post.round.products.nameMultilingual || 
                  post.round.products.nameZh || 
                  post.round.products.nameEn || 
                  post.round.products.nameRu,
            images: post.round.products.images,
            marketPrice: post.round.products.marketPrice
          },
          stats: {
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            shareCount: post.shareCount,
            viewCount: post.viewCount
          },
          hotScore: post.hotScore,
          createdAt: post.createdAt
        }));

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
            },
            sort
          }
        });

      } catch (error) {
        logger.error("API Error", error as Error, {
          requestId,
          endpoint: request.url
        });'获取晒单列表失败:', error);
        return NextResponse.json(
          { success: false, error: '获取晒单列表失败' },
          { status: 500 }
        );
      }
}

// 发布晒单
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { roundId, participationId, content, images } = body;

    // 验证必需字段
    if (!roundId || !participationId || !images) {
      return NextResponse.json(
        { success: false, error: '缺少必需字段' },
        { status: 400 }
      );
    }

    // 验证图片数量
    if (!Array.isArray(images) || images.length === 0 || images.length > 9) {
      return NextResponse.json(
        { success: false, error: '图片数量必须为1-9张' },
        { status: 400 }
      );
    }

    // 验证文字长度
    if (content && (content.length < 20 || content.length > 200)) {
      return NextResponse.json(
        { success: false, error: '文字内容长度必须在20-200字符之间' },
        { status: 400 }
      );
    }

    // 验证用户是否真的中奖且未晒单
    const participation = await prisma.participations.findFirst({
      where: {
        id: participationId,
        userId: session.user.id,
        isWinner: true
      },
      include: {
        round: true
      }
    });

    if (!participation || participation.roundId !== roundId) {
      return NextResponse.json(
        { success: false, error: '未找到中奖记录或参数错误' },
        { status: 400 }
      );
    }

    // 检查是否已经晒单
    const existingPost = await prisma.showOffPosts.findUnique({
      where: { participationId }
    });

    if (existingPost) {
      return NextResponse.json(
        { success: false, error: '该中奖记录已经晒单过了' },
        { status: 400 }
      );
    }

    // 基础自动审核（简单的内容过滤）
    const autoReviewPassed = await performAutoReview(content, images);
    
    // 创建晒单
    const post = await prisma.showOffPosts.create({
      data: {
        userId: session.user.id,
        roundId,
        participationId,
        content: content || '',
        images: images,
        status: autoReviewPassed ? 'approved' : 'pending',
        autoReviewPassed,
        autoReviewReason: autoReviewPassed ? '自动审核通过' : '需要人工审核'
      }
    });

    // 如果自动审核通过，发放奖励并更新统计数据
    if (autoReviewPassed) {
      await processPostReward(post.id, session.user.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: post.id,
        status: post.status,
        message: autoReviewPassed ? '晒单发布成功并审核通过' : '晒单提交成功，等待审核'
      }
    });

  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'发布晒单失败:', error);
    return NextResponse.json(
      { success: false, error: '发布晒单失败' },
      { status: 500 }
    );
  }
}

// 基础自动审核逻辑
async function performAutoReview(content: string | null, images: string[]): Promise<boolean> {
  // 基础敏感词过滤（实际项目中应该使用更复杂的审核服务）
  const sensitiveWords = ['广告', '垃圾', '诈骗', '违禁']; // 简化示例
  
  if (content) {
    for (const word of sensitiveWords) {
      if (content.includes(word)) {
        return false;
      }
    }
  }

  // 基础图片审核（实际项目中应该调用图片审核服务）
  // 这里暂时假设所有图片都通过审核
  return true;
}

// 处理晒单审核通过的奖励
async function processPostReward(postId: string, userId: string) {
  try {
    // 发放3幸运币奖励
    await prisma.$transaction(async (tx) => {
      // 更新用户幸运币
      await tx.users.update({
        where: { id: userId },
        data: {
          luckyCoins: {
            increment: 3.0
          },
          luckyCoinsVersion: {
            increment: 1
          }
        }
      });

      // 记录交易
      await tx.walletTransactions.create({
        data: {
          userId,
          type: 'show_off_reward',
          amount: 0,
          luckyCoins: 3.0,
          currency: 'TJS',
          description: '晒单审核通过奖励',
          status: 'completed',
          metadata: {
            postId,
            rewardType: 'show_off_post',
            rewardAmount: 3.0
          }
        }
      });

      // 更新晒单状态
      await tx.showOffPosts.update({
        where: { id: postId },
        data: {
          status: 'approved',
          coinRewarded: true,
          coinRewardedAt: new Date()
        }
      });
    });
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'处理晒单奖励失败:', error);
  }
}
