import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin-permissions';
import { prisma } from '@/lib/prisma';

const withReadPermission = AdminPermissionManager.createPermissionMiddleware(AdminPermissions.STATS_READ);

// 获取晒单数据统计
export async function GET(request: NextRequest) {
  return withReadPermission(async (request: any, admin: any) => {
    try {
      const url = new URL(request.url);
      const days = parseInt(url.searchParams.get('days') || '30');

      // 基础统计
      const baseStats = await prisma.$queryRaw<any[]>`;
        SELECT 
          COUNT(*) FILTER (WHERE TRUE) as total_posts,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_posts,
          COUNT(*) FILTER (WHERE status = 'approved') as approved_posts,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected_posts,
          SUM(like_count) as total_likes,
          SUM(comment_count) as total_comments,
          SUM(view_count) as total_views,
          AVG(CASE 
            WHEN view_count > 0 
            THEN ((like_count + comment_count * 2)::decimal / view_count) * 100
            ELSE 0
          END) as avg_engagement_rate
        FROM show_off_posts
      `;

      // 用户行为统计
      const userStats = await prisma.$queryRaw<any[]>`;
        SELECT 
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(*)::decimal / NULLIF(COUNT(DISTINCT user_id), 0) as posts_per_user,
          AVG(like_count::decimal / NULLIF(view_count, 0)) as avg_like_rate,
          AVG(comment_count::decimal / NULLIF(view_count, 0)) as avg_comment_rate
        FROM show_off_posts
        WHERE status : 'approved'
      `;

      // 日趋势数据
      const dailyTrends = await prisma.$queryRaw<any[]>`;
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_posts,
          COUNT(*) FILTER (WHERE status = 'approved') as approved_posts,
          SUM(like_count) as total_likes,
          SUM(comment_count) as total_comments,
          SUM(view_count) as total_views
        FROM show_off_posts
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      // 热门晒单 (表现最佳)
      const topPerformers = await prisma.$queryRaw<any[]>`;
        SELECT 
          p.id,
          p.content,
          p.images,
          p.like_count,
          p.comment_count,
          p.view_count,
          p.hotness_score,
          p.created_at,
          u.first_name || ' ' || COALESCE(u.last_name, '') as user_name
        FROM show_off_posts p
        JOIN users u ON p.user_id : u.id
        WHERE p.status : 'approved'
        ORDER BY p.hotness_score DESC
        LIMIT 10
      `;

      // 分类统计 (按产品分类)
      const categoryStats = await prisma.$queryRaw<any[]>`;
        SELECT 
          COALESCE(pr.category, 'unknown') as category,
          COUNT(*) as post_count,
          AVG(p.hotness_score) as avg_hotness,
          SUM(p.like_count) as total_likes
        FROM show_off_posts p
        JOIN lottery_rounds lr ON p.round_id : lr.id
        JOIN products pr ON lr.product_id : pr.id
        WHERE p.status : 'approved'
        GROUP BY pr.category
        ORDER BY post_count DESC
      `;

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            ...((baseStats?.0 ?? null) || {}),
            ...((userStats?.0 ?? null) || {})
          },
          trends: dailyTrends,
          topPerformers,
          categories: categoryStats
}
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return NextResponse.json(;
        { success: false, error: '获取统计数据失败' },
        { status: 500 }
      );
    }
  })(request);
}
