import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin-permission-manager';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const withReadPermission = AdminPermissionManager.createPermissionMiddleware(AdminPermissions.USERS_READ);
const withWritePermission = AdminPermissionManager.createPermissionMiddleware(AdminPermissions.USERS_WRITE);

// 获取待审核晒单列表
export async function GET(request: NextRequest) {
  return withReadPermission(async (request: any, admin: any) => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'pending'; // pending, approved, rejected

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.showOffPosts.findMany({
        where: { status },
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
      prisma.showOffPosts.count({ where: { status } })
    ]);

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
        winningNumber: post.round.winningNumber,
        drawTime: post.round.drawTime
      },
      stats: {
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        shareCount: post.shareCount,
        viewCount: post.viewCount
      },
      review: {
        autoReviewPassed: post.autoReviewPassed,
        autoReviewReason: post.autoReviewReason,
        reviewedBy: post.reviewedBy,
        reviewedAt: post.reviewedAt,
        rejectReason: post.rejectReason
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
  })(request);
}

// 审核晒单
export async function POST(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    const body = await request.json();
    const { postId, action, reason } = body;

    // 验证必需字段
    if (!postId || !action) {
      return NextResponse.json(
        { success: false, error: '缺少必需字段' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: '无效的审核操作' },
        { status: 400 }
      );
    }

    if (action === 'reject' && (!reason || reason.trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: '拒绝审核必须提供原因' },
        { status: 400 }
      );
    }

    // 获取晒单信息
    const post = await prisma.showOffPosts.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
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

    if (post.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: '晒单已审核，不能重复审核' },
        { status: 400 }
      );
    }

    let result;
    if (action === 'approve') {
      result = await processApproval(postId, admin.id);
    } else {
      result = await processRejection(postId, admin.id, reason);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: action === 'approve' ? '审核通过' : '审核拒绝'
    });
  })(request);
}

// 处理审核通过
async function processApproval(postId: string, reviewerId: string) {
  return await prisma.$transaction(async (tx: any) => {
    // 更新晒单状态
    const updatedPost = await tx.showOffPosts.update({
      where: { id: postId },
      data: {
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        autoReviewPassed: true
      },
      include: {
        user: true
      }
    });

    // 发放3幸运币奖励
    await tx.users.update({
      where: { id: updatedPost.userId },
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
        userId: updatedPost.userId,
        type: 'show_off_reward',
        amount: 0,
        luckyCoins: 3.0,
        currency: 'TJS',
        description: '晒单审核通过奖励',
        status: 'completed',
        metadata: {
          postId,
          rewardType: 'show_off_post',
          rewardAmount: 3.0,
          reviewedBy: reviewerId
        }
      }
    });

    // 更新晒单的奖励状态
    await tx.showOffPosts.update({
      where: { id: postId },
      data: {
        coinRewarded: true,
        coinRewardedAt: new Date()
      }
    });

    // TODO: 发送通知给用户
    // await sendNotification(updatedPost.userId, `您的晒单审核通过，已获得3幸运币`);

    return {
      id: updatedPost.id,
      status: 'approved',
      coinReward: 3.0,
      message: '审核通过，已发放3幸运币奖励'
    };
  });
}

// 处理审核拒绝
async function processRejection(postId: string, reviewerId: string, reason: string) {
  const updatedPost = await prisma.showOffPosts.update({
    where: { id: postId },
    data: {
      status: 'rejected',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      rejectReason: reason
    },
    include: {
      user: true
    }
  });

  // TODO: 发送通知给用户
  // await sendNotification(updatedPost.userId, `您的晒单审核未通过：${reason}`);

  return {
    id: updatedPost.id,
    status: 'rejected',
    rejectReason: reason,
    message: '审核拒绝'
  };
}

// 验证管理员权限（简化版本，实际项目中应该更严格）
async function checkAdminPermission(userId: string): Promise<boolean> {
  // 这里应该查询管理员表或用户权限
  // 暂时返回true，实际情况应该根据具体业务需求实现
  return true;
}
