import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// 获取评论列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!postId) {
      return NextResponse.json(
        { success: false, error: '晒单ID不能为空' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.showOffComments.findMany({
        where: {
          postId,
          parentCommentId: null // 只获取顶级评论
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              vipLevel: true
            }
          },
          // 获取回复评论
          showOffComments: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                  vipLevel: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.showOffComments.count({
        where: {
          postId,
          parentCommentId: null
        }
      })
    ]);

    // 格式化返回数据
    const formattedComments = comments.map((comment : any) => ({
      id: comment.id,
      user: {
        id: comment.user.id,
        name: `${comment.user.firstName} ${comment.user.lastName || ''}`.trim(),
        avatar: comment.user.avatarUrl,
        vipLevel: comment.user.vipLevel
      },
      content: comment.content,
      likeCount: comment.likeCount,
      createdAt: comment.createdAt,
      replies: comment.showOffComments.map((reply : any) => ({
        id: reply.id,
        user: {
          id: reply.user.id,
          name: `${reply.user.firstName} ${reply.user.lastName || ''}`.trim(),
          avatar: reply.user.avatarUrl,
          vipLevel: reply.user.vipLevel
        },
        content: reply.content,
        likeCount: reply.likeCount,
        createdAt: reply.createdAt
      }))
    }));

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      data: {
        comments: formattedComments,
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
    console.error('获取评论列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取评论列表失败' },
      { status: 500 }
    );
  }
}

// 发表评论
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

    const body = await request.json();
    const { content, parentCommentId } = body;

    // 验证必需字段
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '评论内容不能为空' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: '评论内容不能超过500字符' },
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

    // 如果是回复评论，验证父评论是否存在
    if (parentCommentId) {
      const parentComment = await prisma.showOffComments.findUnique({
        where: { id: parentCommentId }
      });

      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json(
          { success: false, error: '父评论不存在' },
          { status: 400 }
        );
      }
    }

    // 创建评论
    const comment = await prisma.$transaction(async (tx) => {
      // 创建评论
      const newComment = await tx.showOffComments.create({
        data: {
          postId,
          userId: session.user.id,
          content: content.trim(),
          parentCommentId: parentCommentId || null
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              vipLevel: true
            }
          }
        }
      });

      // 更新晒单的评论数
      await tx.showOffPosts.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } }
      });

      return newComment;
    });

    // 检查是否达到评论奖励上限（25条评论）
    if (post.commentCount < 25) {
      await processCommentReward(postId, session.user.id);
    }

    // 格式化返回数据
    const formattedComment = {
      id: comment.id,
      user: {
        id: comment.user.id,
        name: `${comment.user.firstName} ${comment.user.lastName || ''}`.trim(),
        avatar: comment.user.avatarUrl,
        vipLevel: comment.user.vipLevel
      },
      content: comment.content,
      likeCount: comment.likeCount,
      createdAt: comment.createdAt
    };

    return NextResponse.json({
      success: true,
      data: formattedComment,
      message: '评论发表成功'
    });

  } catch (error) {
    console.error('发表评论失败:', error);
    return NextResponse.json(
      { success: false, error: '发表评论失败' },
      { status: 500 }
    );
  }
}

// 处理评论奖励
async function processCommentReward(postId: string, userId: string) {
  try {
    // 只有原帖作者能获得奖励
    const post = await prisma.showOffPosts.findUnique({
      where: { id: postId },
      select: { userId: true, commentCount: true }
    });

    if (!post || post.userId !== userId) {
      return; // 只有作者评论自己的帖子才能获得奖励
    }

    await prisma.$transaction(async (tx) => {
      // 检查当前评论数是否在奖励范围内
      if (post.commentCount >= 25) {
        return; // 超过奖励上限
      }

      // 发放0.2幸运币奖励
      await tx.users.update({
        where: { id: userId },
        data: {
          luckyCoins: {
            increment: 0.2
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
          type: 'show_off_comment_reward',
          amount: 0,
          luckyCoins: 0.2,
          currency: 'TJS',
          description: '晒单评论奖励',
          status: 'completed',
          metadata: {
            postId,
            rewardType: 'comment_reward',
            rewardAmount: 0.2,
            commentCount: post.commentCount + 1
          }
        }
      });
    });
  } catch (error) {
    console.error('处理评论奖励失败:', error);
  }
}
