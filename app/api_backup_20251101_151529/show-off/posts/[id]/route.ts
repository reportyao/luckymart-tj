import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// 获取晒单详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const session = await auth();

    if (!postId) {
      return NextResponse.json(
        { success: false, error: '晒单ID不能为空' },
        { status: 400 }
      );
    }

    const post = await prisma.showOffPosts.findUnique({
      where: { id: postId },
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
            drawTime: true,
            products: {
              select: {
                id: true,
                nameMultilingual: true,
                nameZh: true,
                nameEn: true,
                nameRu: true,
                descriptionMultilingual: true,
                descriptionZh: true,
                descriptionEn: true,
                descriptionRu: true,
                images: true,
                marketPrice: true
              }
            }
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: '晒单不存在' },
        { status: 404 }
      );
    }

    // 更新浏览量
    await prisma.showOffPosts.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } }
    });

    // 检查当前用户是否点赞
    let isLiked = false;
    if (session?.user) {
      const like = await prisma.showOffLikes.findUnique({
        where: {
          postId_userId: {
            postId: postId,
            userId: session.user.id
          }
        }
      });
      isLiked = !!like;
    }

    // 格式化返回数据
    const formattedPost = {
      id: post.id,
      user: {
        id: post.user.id,
        name: `${post.user.firstName} ${post.user.lastName || ''}`.trim(),
        avatar: post.user.avatarUrl,
        vipLevel: post.user.vipLevel,
        preferredLanguage: post.user.preferredLanguage
      },
      content: post.content,
      images: post.images || [],
      product: {
        id: post.round.products.id,
        name: post.round.products.nameMultilingual || 
              post.round.products.nameZh || 
              post.round.products.nameEn || 
              post.round.products.nameRu,
        description: post.round.products.descriptionMultilingual || 
                     post.round.products.descriptionZh || 
                     post.round.products.descriptionEn || 
                     post.round.products.descriptionRu,
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
        viewCount: post.viewCount + 1 // 使用更新后的数值
      },
      hotScore: post.hotScore,
      status: post.status,
      createdAt: post.createdAt,
      isLiked
    };

    return NextResponse.json({
      success: true,
      data: formattedPost
    });

  } catch (error) {
    console.error('获取晒单详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取晒单详情失败' },
      { status: 500 }
    );
  }
}

// 点赞/取消点赞晒单
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    if (!postId) {
      return NextResponse.json(
        { success: false, error: '晒单ID不能为空' },
        { status: 400 }
      );
    }

    // 检查晒单是否存在且已审核通过
    const post = await prisma.showOffPosts.findUnique({
      where: { id: postId }
    });

    if (!post || post.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: '晒单不存在或未审核通过' },
        { status: 404 }
      );
    }

    // 检查是否已点赞
    const existingLike = await prisma.showOffLikes.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id
        }
      }
    });

    let isLiked: boolean;
    let likeCount: number;

    if (existingLike) {
      // 取消点赞
      await prisma.$transaction(async (tx) => {
        // 删除点赞记录
        await tx.showOffLikes.delete({
          where: {
            postId_userId: {
              postId,
              userId: session.user.id
            }
          }
        });

        // 更新晒单的点赞数
        const updatedPost = await tx.showOffPosts.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } }
        });

        likeCount = updatedPost.likeCount;
      });

      isLiked = false;
    } else {
      // 点赞
      await prisma.$transaction(async (tx) => {
        // 添加点赞记录
        await tx.showOffLikes.create({
          data: {
            postId,
            userId: session.user.id
          }
        });

        // 更新晒单的点赞数
        const updatedPost = await tx.showOffPosts.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } }
        });

        likeCount = updatedPost.likeCount;
      });

      isLiked = true;

      // 检查是否达到点赞奖励上限（20赞）
      if (likeCount <= 20 && post.likeCount < 20) {
        // 发放点赞奖励（0.5币）
        await processLikeReward(postId, session.user.id);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        isLiked,
        likeCount
      }
    });

  } catch (error) {
    console.error('点赞操作失败:', error);
    return NextResponse.json(
      { success: false, error: '点赞操作失败' },
      { status: 500 }
    );
  }
}

// 处理点赞奖励
async function processLikeReward(postId: string, userId: string) {
  try {
    // 只有原帖作者能获得奖励
    const post = await prisma.showOffPosts.findUnique({
      where: { id: postId },
      select: { userId: true }
    });

    if (!post || post.userId !== userId) {
      return; // 只有作者给自己点赞才能获得奖励
    }

    await prisma.$transaction(async (tx) => {
      // 检查当前点赞数是否在奖励范围内
      const currentPost = await tx.showOffPosts.findUnique({
        where: { id: postId },
        select: { likeCount: true }
      });

      if (!currentPost || currentPost.likeCount > 20) {
        return; // 超过奖励上限
      }

      // 发放0.5幸运币奖励
      await tx.users.update({
        where: { id: userId },
        data: {
          luckyCoins: {
            increment: 0.5
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
          type: 'show_off_like_reward',
          amount: 0,
          luckyCoins: 0.5,
          currency: 'TJS',
          description: '晒单点赞奖励',
          status: 'completed',
          metadata: {
            postId,
            rewardType: 'like_reward',
            rewardAmount: 0.5,
            likeCount: currentPost.likeCount
          }
        }
      });
    });
  } catch (error) {
    console.error('处理点赞奖励失败:', error);
  }
}
