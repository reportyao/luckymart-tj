import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';

// 创建权限中间件
const withReadPermission = AdminPermissionManager.createPermissionMiddleware(AdminPermissions.USERS_READ);
const withWritePermission = AdminPermissionManager.createPermissionMiddleware(AdminPermissions.USERS_WRITE);

/**
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `recommendations_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('recommendations_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('recommendations_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {
     * 获取推荐列表和配置
     */
    export async function GET(req: NextRequest) {
      return withReadPermission(req, async (adminUser) => {
        const { searchParams } = new URL(req.url);
        const position = searchParams.get('position'); // homepage, detail, profile

        // 获取推荐配置
        const recommendations = await prisma.showOffRecommendation.findMany({
          where: position ? { position } : undefined,
          include: {
            post: {
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
            },
          },
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        });

        // 获取推荐位配置
        const positionConfig = await prisma.systemSettings.findFirst({
          where: {
            key: 'show_off_recommendation_positions',
          },
        });

        const positions = positionConfig?.value as any || {
          homepage: { maxCount: 5, description: '首页推荐位' },
          detail: { maxCount: 3, description: '详情页推荐位' },
          profile: { maxCount: 4, description: '个人页推荐位' },
        };

        return NextResponse.json({
          recommendations: recommendations.map((rec : any) => ({
            id: rec.id,
            position: rec.position,
            priority: rec.priority,
            startTime: rec.startTime,
            endTime: rec.endTime,
            isActive: rec.isActive,
            post: {
              id: rec.post.id,
              content: rec.post.content,
              images: rec.post.images,
              likesCount: rec.post.likesCount,
              commentsCount: rec.post.commentsCount,
              hotnessScore: rec.post.hotnessScore,
              user: rec.post.user,
              prize: rec.post.prize,
            },
          })),
          positions,
        });
      });
}

/**
 * POST /api/admin/show-off/recommendations
 * 添加推荐
 */
export async function POST(req: NextRequest) {
  return withWritePermission(req, async (adminUser) => {
    const body = await req.json();
    const { postId, position, priority, startTime, endTime } = body;

    // 验证晒单是否存在且已审核
    const post = await prisma.showOffPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: '晒单不存在' }, { status: 404 });
    }

    if (post.status !== 'approved') {
      return NextResponse.json({ error: '只能推荐已审核通过的晒单' }, { status: 400 });
    }

    // 检查该位置的推荐数量是否已满
    const positionConfig = await prisma.systemSettings.findFirst({
      where: { key: 'show_off_recommendation_positions' },
    });

    const positions = positionConfig?.value as any || {};
    const maxCount = positions[position]?.maxCount || 5;

    const currentCount = await prisma.showOffRecommendation.count({
      where: {
        position,
        isActive: true,
      },
    });

    if (currentCount >= maxCount) {
      return NextResponse.json(
        { error: `该推荐位已满 (最多${maxCount}个)` },
        { status: 400 }
      );
    }

    // 创建推荐
    const recommendation = await prisma.showOffRecommendation.create({
      data: {
        postId,
        position,
        priority: priority || 0,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : undefined,
        isActive: true,
      },
      include: {
        post: {
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
        },
      },
    });

    // 记录操作日志
    await prisma.operationLogs.create({
      data: {
        adminId: adminUser.id,
        action: 'add_recommendation',
        resource: 'show_off_recommendation',
        resourceId: recommendation.id,
        details: {
          postId,
          position,
          priority,
        },
      },
    });

    return NextResponse.json({
      success: true,
      recommendation,
    });
  });
}

/**
 * PATCH /api/admin/show-off/recommendations
 * 更新推荐
 */
export async function PATCH(req: NextRequest) {
  return withWritePermission(req, async (adminUser) => {
    const body = await req.json();
    const { id, priority, startTime, endTime, isActive } = body;

    const recommendation = await prisma.showOffRecommendation.findUnique({
      where: { id },
    });

    if (!recommendation) {
      return NextResponse.json({ error: '推荐不存在' }, { status: 404 });
    }

    const updated = await prisma.showOffRecommendation.update({
      where: { id },
      data: {
        ...(priority !== undefined && { priority }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
      include: {
        post: {
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
        },
      },
    });

    // 记录操作日志
    await prisma.operationLogs.create({
      data: {
        adminId: adminUser.id,
        action: 'update_recommendation',
        resource: 'show_off_recommendation',
        resourceId: id,
        details: {
          changes: { priority, startTime, endTime, isActive },
        },
      },
    });

    return NextResponse.json({
      success: true,
      recommendation: updated,
    });
  });
}

/**
 * DELETE /api/admin/show-off/recommendations
 * 删除推荐
 */
export async function DELETE(req: NextRequest) {
  return withWritePermission(req, async (adminUser) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少推荐ID' }, { status: 400 });
    }

    await prisma.showOffRecommendation.delete({
      where: { id },
    });

    // 记录操作日志
    await prisma.operationLogs.create({
      data: {
        adminId: adminUser.id,
        action: 'delete_recommendation',
        resource: 'show_off_recommendation',
        resourceId: id,
        details: {},
      },
    });

    return NextResponse.json({
      success: true,
      message: '推荐已删除',
    });
  });
}

/**
 * PUT /api/admin/show-off/recommendations
 * 批量更新推荐优先级
 */
export async function PUT(req: NextRequest) {
  return withWritePermission(req, async (adminUser) => {
    const body = await req.json();
    const { recommendations } = body; // [{ id, priority }]

    const updatePromises = recommendations.map((rec: any) : any =>
      prisma.showOffRecommendation.update({
        where: { id: rec.id },
        data: { priority: rec.priority },
      })
    );

    await Promise.all(updatePromises);

    // 记录操作日志
    await prisma.operationLogs.create({
      data: {
        adminId: adminUser.id,
        action: 'batch_update_recommendation_priority',
        resource: 'show_off_recommendation',
        resourceId: recommendations.map((r: any) : any => r.id).join(','),
        details: {
          recommendations,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `已更新${recommendations.length}个推荐的优先级`,
    });
  });
}
