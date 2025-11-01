import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin/permission-manager';

// 创建权限中间件
const withReadPermission = AdminPermissionManager.createPermissionMiddleware(AdminPermissions.USERS_READ);

/**
 * GET /api/admin/show-off/users/[id]/posts
 * 获取用户的晒单历史和画像
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withReadPermission(req, async (adminUser) => {
    const userId = params.id;

    // 获取用户基本信息
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatar: true,
        createdAt: true,
        telegramUsername: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 获取用户所有晒单
    const posts = await prisma.showOffPost.findMany({
      where: { userId },
      include: {
        prize: {
          select: {
            id: true,
            name: true,
            value: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 计算用户晒单统计
    const stats = {
      totalPosts: posts.length,
      approvedPosts: posts.filter((p : any) => p.status === 'approved').length,
      rejectedPosts: posts.filter((p : any) => p.status === 'rejected').length,
      pendingPosts: posts.filter((p : any) => p.status === 'pending').length,
      totalLikes: posts.reduce((sum: any,  p: any) => sum + (p.likesCount || 0), 0),
      totalComments: posts.reduce((sum: any,  p: any) => sum + (p.commentsCount || 0), 0),
      totalViews: posts.reduce((sum: any,  p: any) => sum + (p.viewsCount || 0), 0),
      averageHotness:
        posts.length > 0
          ? Math.round(posts.reduce((sum: any,  p: any) => sum + (p.hotnessScore || 0), 0) / posts.length)
          : 0,
    };

    // 计算内容质量分布
    const qualityDistribution = {
      highQuality: 0, // 平均互动 > 20
      mediumQuality: 0, // 平均互动 5-20
      lowQuality: 0, // 平均互动 < 5
    };

    posts.forEach((post : any) => {
      const avgEngagement = ((post.likesCount || 0) + (post.commentsCount || 0)) / 2;
      if (avgEngagement > 20) qualityDistribution.highQuality++;
      else if (avgEngagement >= 5) qualityDistribution.mediumQuality++;
      else qualityDistribution.lowQuality++;
    });

    // 获奖奖品统计
    const prizeStats = posts
      .filter(p => p.prize)
      .reduce((acc, p) => {
        const prizeName = p.prize!.name;
        const prizeValue = p.prize!.value || 0;
        if (!acc[prizeName]) {
          acc[prizeName] = {
            count: 0,
            totalValue: 0,
          };
        }
        acc[prizeName].count++;
        acc[prizeName].totalValue += prizeValue;
        return acc;
      }, {} as Record<string, { count: number; totalValue: number }>);

    // 时间分布分析
    const postsByMonth = posts.reduce((acc: any,  p: any) => {
      const month = new Date(p.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) acc[month] = 0;
      acc[month]++;
      return acc;
    }, {} as Record<string, number>);

    // 用户行为画像
    const profile = {
      activityLevel:
        posts.length > 10 ? 'high' : posts.length > 3 ? 'medium' : 'low',
      contentQuality:
        qualityDistribution.highQuality / posts.length > 0.5
          ? 'high'
          : qualityDistribution.mediumQuality / posts.length > 0.3
          ? 'medium'
          : 'low',
      engagementRate:
        posts.length > 0
          ? (stats.totalLikes + stats.totalComments) / posts.length
          : 0,
      approvalRate: posts.length > 0 ? stats.approvedPosts / posts.length : 0,
      avgPostInterval:
        posts.length > 1
          ? Math.round(
              (new Date(posts[0].createdAt).getTime() -
                new Date(posts[posts.length - 1].createdAt).getTime()) /
                (1000 * 60 * 60 * 24) /
                (posts.length - 1)
            )
          : 0, // 平均发帖间隔（天）
    };

    // 风险指标
    const riskIndicators = {
      hasLowQualityPosts: qualityDistribution.lowQuality > posts.length * 0.5,
      hasHighRejectionRate: profile.approvalRate < 0.6,
      hasSuspiciousActivity: profile.avgPostInterval < 1 && posts.length > 5, // 一天多条
      hasNoEngagement: stats.totalLikes === 0 && stats.totalComments === 0 && posts.length > 3,
    };

    return NextResponse.json({
      user,
      posts: posts.map((post : any) => ({
        id: post.id,
        content: post.content,
        images: post.images,
        status: post.status,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        viewsCount: post.viewsCount,
        hotnessScore: post.hotnessScore,
        createdAt: post.createdAt,
        prize: post.prize,
      })),
      stats,
      qualityDistribution,
      prizeStats: Object.entries(prizeStats).map(([name, data]) => ({
        prizeName: name,
        count: data.count,
        totalValue: data.totalValue,
      })),
      postsByMonth: Object.entries(postsByMonth)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      profile,
      riskIndicators,
    });
  });
}
