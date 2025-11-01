import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';
import { getLogger } from '@/lib/logger';

import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';


const withReadPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.users.read()
});

const withWritePermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.users.write()
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `engagement_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('engagement_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('engagement_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

    // GET - 获取用户参与度分析
    export async function GET(request: NextRequest) {
      return withReadPermission(async (request: any, admin: any) => {
        const logger = getLogger();

        try {

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const date = searchParams.get('date'); // 指定某一天的统计
        const sortBy = searchParams.get('sortBy') || 'engagement_score';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // 构建查询条件
        const whereConditions: any = {};
    
        if (userId) {
          whereConditions.user_id = userId;
        }
    
        if (date) {
          whereConditions.date = new Date(date);
        } else if (startDate || endDate) {
          if (startDate && endDate) {
            whereConditions.date = {
              gte: new Date(startDate),
              lte: new Date(endDate)
            };
          } else if (startDate) {
            whereConditions.date = { gte: new Date(startDate) };
          } else if (endDate) {
            whereConditions.date = { lte: new Date(endDate) };
          }
        }

        // 获取参与度统计数据
        const [engagementStats, totalCount] = await Promise.all([
          prisma.userEngagementStats.findMany({
            where: whereConditions,
            orderBy: {
              [sortBy]: sortOrder as 'asc' | 'desc'
            },
            take: limit,
            skip: offset,
            include: {
              users: {
                select: {
                  id: true,
                  firstName: true,
                  username: true,
                  telegramId: true,
                  vipLevel: true
                }
              }
            }
          }),
          prisma.userEngagementStats.count({ where: whereConditions })
        ]);

        // 获取汇总统计
        const summaryStats = await getEngagementSummaryStats(whereConditions);

        // 获取参与度分布
        const engagementDistribution = await getEngagementDistribution(whereConditions);

        // 获取趋势数据
        const trendData = await getEngagementTrendData(whereConditions);

        // 获取用户分群数据
        const userSegmentation = await getUserSegmentation(whereConditions);

        return NextResponse.json({
          success: true,
          data: {
            engagementStats,
            pagination: {
              total: totalCount,
              limit,
              offset,
              hasMore: offset + limit < totalCount
            },
            summary: summaryStats,
            distribution: engagementDistribution,
            trends: trendData,
            segmentation: userSegmentation
          }
        });

        } catch (error: any) {
          logger.error('获取用户参与度分析失败', error as Error);
          return NextResponse.json({
            success: false,
            error: error.message || '获取用户参与度分析失败'
          }, { status: 500 });
        }
}
}

// PUT - 更新用户参与度统计
export async function PUT(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    const logger = getLogger();

    try {
    const body = await request.json();
    const {
      userId,
      date,
      loginCount,
      totalSessionDuration,
      pageViews,
      interactionsCount,
      featuresUsed
    } = body;

    // 验证必需参数
    if (!userId || !date) {
      return NextResponse.json({
        success: false,
        error: '缺少必需参数：userId 和 date'
      }, { status: 400 });
    }

    // 验证用户是否存在
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '用户不存在'
      }, { status: 404 });
    }

    // 计算参与度评分
    const engagementScore = calculateEngagementScore(
      loginCount || 0,
      totalSessionDuration || 0,
      pageViews || 0,
      interactionsCount || 0
    );

    // 更新或创建参与度统计
    const engagementStats = await prisma.userEngagementStats.upsert({
      where: {
        user_id_date: {
          userId,
          date: new Date(date)
        }
      },
      update: {
        loginCount,
        totalSessionDuration,
        pageViews,
        interactionsCount,
        featuresUsed,
        engagementScore,
        lastActivityTime: new Date()
      },
      create: {
        userId,
        date: new Date(date),
        loginCount: loginCount || 0,
        totalSessionDuration: totalSessionDuration || 0,
        pageViews: pageViews || 0,
        interactionsCount: interactionsCount || 0,
        featuresUsed: featuresUsed || [],
        engagementScore,
        lastActivityTime: new Date()
      }
    });

    logger.info('用户参与度统计更新成功', {
      userId,
      date,
      engagementScore,
      statsId: engagementStats.id
    });

    return NextResponse.json({
      success: true,
      data: engagementStats,
      message: '参与度统计更新成功'
    });

    } catch (error: any) {
      logger.error('更新用户参与度统计失败', error as Error);
      return NextResponse.json({
        success: false,
        error: error.message || '更新用户参与度统计失败'
      }, { status: 500 });
    }
  })(request);
}

/**
 * 计算参与度评分
 */
function calculateEngagementScore(
  loginCount: number,
  sessionDuration: number,
  pageViews: number,
  interactions: number
): number {
  let score = 0;
  
  // 基于登录次数的评分 (0-30分)
  score += Math.min(loginCount * 5, 30);
  
  // 基于会话时长的评分 (0-25分)
  score += Math.min(sessionDuration / 60, 25);
  
  // 基于页面浏览的评分 (0-25分)
  score += Math.min(pageViews * 2, 25);
  
  // 基于交互次数的评分 (0-20分)
  score += Math.min(interactions, 20);
  
  return Math.min(score, 100);
}

/**
 * 获取参与度汇总统计
 */
async function getEngagementSummaryStats(whereConditions: any) {
  const summary = await prisma.userEngagementStats.aggregate({
    where: whereConditions,
    _avg: {
      engagementScore: true,
      loginCount: true,
      totalSessionDuration: true,
      pageViews: true,
      interactionsCount: true
    },
    _max: {
      engagementScore: true,
      loginCount: true,
      totalSessionDuration: true
    },
    _min: {
      engagementScore: true
    }
  });

  // 获取活跃用户数（参与度评分 > 50）
  const activeUsers = await prisma.userEngagementStats.count({
    where: {
      ...whereConditions,
      engagementScore: { gt: 50 }
    }
  });

  // 获取高参与度用户数（参与度评分 > 80）
  const highlyEngagedUsers = await prisma.userEngagementStats.count({
    where: {
      ...whereConditions,
      engagementScore: { gt: 80 }
    }
  });

  return {
    averageEngagementScore: parseFloat(summary._avg.engagementScore?.toFixed(2) || '0'),
    averageLoginCount: parseFloat(summary._avg.loginCount?.toFixed(2) || '0'),
    averageSessionDuration: parseFloat(summary._avg.totalSessionDuration?.toFixed(2) || '0'),
    averagePageViews: parseFloat(summary._avg.pageViews?.toFixed(2) || '0'),
    averageInteractions: parseFloat(summary._avg.interactionsCount?.toFixed(2) || '0'),
    maxEngagementScore: parseFloat(summary._max.engagementScore?.toFixed(2) || '0'),
    maxLoginCount: summary._max.loginCount || 0,
    maxSessionDuration: summary._max.totalSessionDuration || 0,
    minEngagementScore: parseFloat(summary._min.engagementScore?.toFixed(2) || '0'),
    activeUsers,
    highlyEngagedUsers,
    totalUsers: await prisma.userEngagementStats.count({ where: whereConditions })
  };
}

/**
 * 获取参与度分布
 */
async function getEngagementDistribution(whereConditions: any) {
  const distribution = await prisma.$queryRaw`
    SELECT 
      CASE 
        WHEN engagement_score >= 80 THEN 'high'
        WHEN engagement_score >= 50 THEN 'medium'
        WHEN engagement_score >= 20 THEN 'low'
        ELSE 'very_low'
      END as engagement_level,
      COUNT(*) as user_count,
      ROUND(AVG(engagement_score), 2) as avg_score,
      ROUND(AVG(login_count), 2) as avg_login_count,
      ROUND(AVG(total_session_duration), 2) as avg_duration
    FROM user_engagement_stats
    ${whereConditions.user_id ? `WHERE user_id = '${whereConditions.user_id}'` : ''}
    ${whereConditions.date ? `AND date = '${whereConditions.date}'` : ''}
    GROUP BY 
      CASE 
        WHEN engagement_score >= 80 THEN 'high'
        WHEN engagement_score >= 50 THEN 'medium'
        WHEN engagement_score >= 20 THEN 'low'
        ELSE 'very_low'
      END
    ORDER BY 
      CASE 
        WHEN engagement_score >= 80 THEN 4
        WHEN engagement_score >= 50 THEN 3
        WHEN engagement_score >= 20 THEN 2
        ELSE 1
      END
  `;

  return distribution;
}

/**
 * 获取参与度趋势数据
 */
async function getEngagementTrendData(whereConditions: any) {
  const trends = await prisma.$queryRaw`
    SELECT 
      date,
      COUNT(*) as total_users,
      AVG(engagement_score) as avg_engagement_score,
      AVG(login_count) as avg_login_count,
      AVG(total_session_duration) as avg_session_duration,
      COUNT(CASE WHEN engagement_score >= 80 THEN 1 END) as high_engagement_users,
      COUNT(CASE WHEN engagement_score >= 50 AND engagement_score < 80 THEN 1 END) as medium_engagement_users,
      COUNT(CASE WHEN engagement_score < 50 THEN 1 END) as low_engagement_users
    FROM user_engagement_stats
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    ${whereConditions.user_id ? `AND user_id = '${whereConditions.user_id}'` : ''}
    GROUP BY date
    ORDER BY date
  `;

  return trends;
}

/**
 * 获取用户分群数据
 */
async function getUserSegmentation(whereConditions: any) {
  const segmentation = await prisma.$queryRaw`
    WITH user_segments AS (
      SELECT 
        ues.user_id,
        ues.engagement_score,
        u.vip_level,
        CASE 
          WHEN ues.engagement_score >= 80 AND u.vip_level > 0 THEN 'vip_active'
          WHEN ues.engagement_score >= 80 THEN 'power_user'
          WHEN ues.engagement_score >= 50 AND u.vip_level > 0 THEN 'vip_regular'
          WHEN ues.engagement_score >= 50 THEN 'regular_user'
          WHEN ues.engagement_score >= 20 THEN 'casual_user'
          ELSE 'at_risk'
        END as segment
      FROM user_engagement_stats ues
      JOIN users u ON ues.user_id = u.id
      WHERE ues.date = CURRENT_DATE
      ${whereConditions.user_id ? `AND ues.user_id = '${whereConditions.user_id}'` : ''}
    )
    SELECT 
      segment,
      COUNT(*) as user_count,
      ROUND(AVG(engagement_score), 2) as avg_engagement_score,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
    FROM user_segments
    GROUP BY segment
    ORDER BY 
      CASE segment
        WHEN 'vip_active' THEN 1
        WHEN 'power_user' THEN 2
        WHEN 'vip_regular' THEN 3
        WHEN 'regular_user' THEN 4
        WHEN 'casual_user' THEN 5
        WHEN 'at_risk' THEN 6
      END
  `;

  return segmentation;
}