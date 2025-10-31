import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin/permission-manager';

// 创建权限中间件
const withReadPermission = AdminPermissionManager.createPermissionMiddleware(AdminPermissions.USERS_READ);
const withWritePermission = AdminPermissionManager.createPermissionMiddleware(AdminPermissions.USERS_WRITE);

/**
 * 内容质量评分算法
 */
function calculateQualityScore(post: any): number {
  let score = 0;
  let maxScore = 100;

  // 1. 内容长度 (20分)
  const contentLength = post.content?.length || 0;
  if (contentLength > 100) score += 20;
  else if (contentLength > 50) score += 15;
  else if (contentLength > 20) score += 10;
  else score += 5;

  // 2. 图片质量 (30分)
  const imageCount = post.images?.length || 0;
  if (imageCount >= 3) score += 30;
  else if (imageCount >= 2) score += 20;
  else if (imageCount >= 1) score += 10;

  // 3. 用户互动 (30分)
  const engagement = (post.likesCount || 0) + (post.commentsCount || 0) * 2;
  if (engagement > 50) score += 30;
  else if (engagement > 20) score += 20;
  else if (engagement > 5) score += 10;
  else score += 5;

  // 4. 用户信誉 (20分)
  const userPostCount = post.user?.showOffPostsCount || 0;
  if (userPostCount > 10) score += 20;
  else if (userPostCount > 5) score += 15;
  else if (userPostCount > 1) score += 10;
  else score += 5;

  return Math.min(score, maxScore);
}

/**
 * 检测可疑内容
 */
function detectSuspiciousContent(post: any): string[] {
  const issues: string[] = [];

  // 1. 内容过短
  if ((post.content?.length || 0) < 10) {
    issues.push('内容过短');
  }

  // 2. 无图片
  if (!post.images || post.images.length === 0) {
    issues.push('缺少图片');
  }

  // 3. 重复内容检测（简单版）
  const content = post.content?.toLowerCase() || '';
  const repetitivePatterns = /(.{5,})\1{3,}/; // 检测5个字符以上重复3次
  if (repetitivePatterns.test(content)) {
    issues.push('疑似重复内容');
  }

  // 4. 敏感词检测（需要配置敏感词库）
  const sensitiveWords = ['广告', '推广', '微信', 'QQ', '代理'];
  for (const word of sensitiveWords) {
    if (content.includes(word)) {
      issues.push(`包含敏感词: ${word}`);
      break;
    }
  }

  // 5. 互动异常低
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreated > 7 && (post.likesCount || 0) === 0 && (post.commentsCount || 0) === 0) {
    issues.push('互动异常低');
  }

  return issues;
}

/**
 * GET /api/admin/show-off/content-quality
 * 获取内容质量分析
 */
export async function GET(req: NextRequest) {
  return withReadPermission(req, async (adminUser) => {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // all, low_quality, suspicious
    const limit = parseInt(searchParams.get('limit') || '50');

    // 获取晒单数据
    const posts = await prisma.showOffPost.findMany({
      where: {
        status: 'approved',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            _count: {
              select: {
                showOffPosts: true,
              },
            },
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
        createdAt: 'desc',
      },
      take: limit * 2, // 取多一些，后面筛选
    });

    // 计算质量分数和检测问题
    const analyzedPosts = posts.map(post => {
      const qualityScore = calculateQualityScore({
        ...post,
        user: {
          showOffPostsCount: post.user._count.showOffPosts,
        },
      });

      const issues = detectSuspiciousContent(post);

      return {
        id: post.id,
        content: post.content,
        images: post.images,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        viewsCount: post.viewsCount,
        createdAt: post.createdAt,
        user: {
          id: post.user.id,
          username: post.user.username,
          avatar: post.user.avatar,
          postsCount: post.user._count.showOffPosts,
        },
        prize: post.prize,
        qualityScore,
        issues,
      };
    });

    // 根据筛选条件过滤
    let filteredPosts = analyzedPosts;
    if (filter === 'low_quality') {
      filteredPosts = analyzedPosts.filter(p => p.qualityScore < 60);
    } else if (filter === 'suspicious') {
      filteredPosts = analyzedPosts.filter(p => p.issues.length > 0);
    }

    // 限制返回数量
    filteredPosts = filteredPosts.slice(0, limit);

    // 统计信息
    const stats = {
      total: analyzedPosts.length,
      highQuality: analyzedPosts.filter(p => p.qualityScore >= 80).length,
      mediumQuality: analyzedPosts.filter(p => p.qualityScore >= 60 && p.qualityScore < 80).length,
      lowQuality: analyzedPosts.filter(p => p.qualityScore < 60).length,
      suspicious: analyzedPosts.filter(p => p.issues.length > 0).length,
      averageScore: Math.round(
        analyzedPosts.reduce((sum, p) => sum + p.qualityScore, 0) / analyzedPosts.length
      ),
    };

    return NextResponse.json({
      posts: filteredPosts,
      stats,
    });
  });
}

/**
 * POST /api/admin/show-off/content-quality
 * 批量处理低质量内容
 */
export async function POST(req: NextRequest) {
  return withWritePermission(req, async (adminUser) => {
    const body = await req.json();
    const { action, postIds } = body; // action: hide, delete, flag

    if (!['hide', 'delete', 'flag'].includes(action)) {
      return NextResponse.json({ error: '无效的操作类型' }, { status: 400 });
    }

    let result;
    switch (action) {
      case 'hide':
        // 隐藏低质量内容
        result = await prisma.showOffPost.updateMany({
          where: {
            id: { in: postIds },
          },
          data: {
            status: 'hidden',
            updatedAt: new Date(),
          },
        });
        break;

      case 'delete':
        // 删除低质量内容
        result = await prisma.showOffPost.deleteMany({
          where: {
            id: { in: postIds },
          },
        });
        break;

      case 'flag':
        // 标记为需要人工审核
        result = await prisma.showOffPost.updateMany({
          where: {
            id: { in: postIds },
          },
          data: {
            status: 'flagged',
            updatedAt: new Date(),
          },
        });
        break;
    }

    // 记录操作日志
    await prisma.operationLogs.create({
      data: {
        adminId: adminUser.id,
        action: `batch_${action}_low_quality`,
        resource: 'show_off_post',
        resourceId: postIds.join(','),
        details: {
          action,
          postIds,
          count: postIds.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      action,
      affected: result.count || postIds.length,
    });
  });
}

/**
 * PUT /api/admin/show-off/content-quality
 * 更新内容质量规则配置
 */
export async function PUT(req: NextRequest) {
  return withWritePermission(req, async (adminUser) => {
    const body = await req.json();
    const { rules } = body;

    // 保存质量规则配置
    await prisma.systemSettings.upsert({
      where: {
        key: 'show_off_quality_rules',
      },
      create: {
        key: 'show_off_quality_rules',
        value: rules,
        description: '晒单内容质量评分规则',
      },
      update: {
        value: rules,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: '质量规则已更新',
    });
  });
}
