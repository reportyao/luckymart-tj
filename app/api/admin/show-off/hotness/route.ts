import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin/permission-manager';

// 创建权限中间件
const withReadPermission = AdminPermissionManager.createPermissionMiddleware(AdminPermissions.USERS_READ);
const withWritePermission = AdminPermissionManager.createPermissionMiddleware(AdminPermissions.USERS_WRITE);

/**
 * GET /api/admin/show-off/hotness
 * 获取热度排行和配置
 */
export async function GET(req: NextRequest) {
  return withReadPermission(req, async (adminUser) => {
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || '7d'; // 7d, 30d, all
    const limit = parseInt(searchParams.get('limit') || '50');

    // 计算时间范围
    let startDate: Date | undefined;
    if (timeRange === '7d') {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '30d') {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // 获取热度排行
    const posts = await prisma.showOffPost.findMany({
      where: {
        status: 'approved',
        ...(startDate && {
          createdAt: {
            gte: startDate,
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        prize: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        hotnessScore: 'desc',
      },
      take: limit,
    });

    // 计算热度分布
    const hotnessDistribution = await prisma.showOffPost.groupBy({
      by: ['hotnessScore'],
      _count: true,
      where: {
        status: 'approved',
        ...(startDate && {
          createdAt: {
            gte: startDate,
          },
        }),
      },
    });

    // 获取热度算法配置
    const hotnessConfig = await prisma.systemSettings.findFirst({
      where: {
        key: 'show_off_hotness_weights',
      },
    });

    const weights = hotnessConfig?.value as any || {
      likes: 1.0,
      comments: 2.0,
      views: 0.1,
      time_decay: 0.95, // 每天衰减5%
    };

    return NextResponse.json({
      posts: posts.map(post => ({
        id: post.id,
        content: post.content,
        images: post.images,
        hotnessScore: post.hotnessScore,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        viewsCount: post.viewsCount,
        createdAt: post.createdAt,
        user: post.user,
        prize: post.prize,
        // 计算热度组成
        breakdown: {
          likes: (post.likesCount || 0) * weights.likes,
          comments: (post.commentsCount || 0) * weights.comments,
          views: (post.viewsCount || 0) * weights.views,
        },
      })),
      distribution: hotnessDistribution.map(d => ({
        score: d.hotnessScore,
        count: d._count,
      })),
      config: weights,
    });
  });
}

/**
 * POST /api/admin/show-off/hotness
 * 更新热度算法配置
 */
export async function POST(req: NextRequest) {
  return withWritePermission(req, async (adminUser) => {
    const body = await req.json();
    const { weights, recalculate } = body;

    // 更新配置
    await prisma.systemSettings.upsert({
      where: {
        key: 'show_off_hotness_weights',
      },
      create: {
        key: 'show_off_hotness_weights',
        value: weights,
        description: '晒单热度算法权重配置',
      },
      update: {
        value: weights,
        updatedAt: new Date(),
      },
    });

    // 如果需要重新计算所有晒单的热度
    if (recalculate) {
      const posts = await prisma.showOffPost.findMany({
        where: {
          status: 'approved',
        },
      });

      // 批量更新热度分数
      const updatePromises = posts.map(post => {
        const daysSinceCreated = Math.floor(
          (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        const timeDecay = Math.pow(weights.time_decay, daysSinceCreated);

        const newHotness = Math.round(
          ((post.likesCount || 0) * weights.likes +
            (post.commentsCount || 0) * weights.comments +
            (post.viewsCount || 0) * weights.views) *
            timeDecay
        );

        return prisma.showOffPost.update({
          where: { id: post.id },
          data: { hotnessScore: newHotness },
        });
      });

      await Promise.all(updatePromises);
    }

    return NextResponse.json({
      success: true,
      updated: recalculate,
      message: recalculate
        ? `热度算法已更新，${recalculate}个晒单的热度已重新计算`
        : '热度算法配置已更新',
    });
  });
}

/**
 * PATCH /api/admin/show-off/hotness
 * 手动调整特定晒单的热度
 */
export async function PATCH(req: NextRequest) {
  return withWritePermission(req, async (adminUser) => {
    const body = await req.json();
    const { postId, adjustment } = body;

    const post = await prisma.showOffPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: '晒单不存在' }, { status: 404 });
    }

    const newHotness = Math.max(0, (post.hotnessScore || 0) + adjustment);

    await prisma.showOffPost.update({
      where: { id: postId },
      data: { hotnessScore: newHotness },
    });

    // 记录操作日志
    await prisma.operationLogs.create({
      data: {
        adminId: adminUser.id,
        action: 'adjust_hotness',
        resource: 'show_off_post',
        resourceId: postId,
        details: {
          oldHotness: post.hotnessScore,
          newHotness,
          adjustment,
        },
      },
    });

    return NextResponse.json({
      success: true,
      postId,
      oldHotness: post.hotnessScore,
      newHotness,
    });
  });
}
