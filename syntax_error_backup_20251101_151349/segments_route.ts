import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLogger } from '@/lib/logger';
import { AdminPermissionManager } from '@/lib/admin/permissions/AdminPermissionManager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';



const withReadPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.users.read()
});

const withWritePermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.users.write()
});

// GET - 获取用户分群数据
export async function GET(request: NextRequest) {
  return withReadPermission(async (request: any, admin: any) => {
    const logger = getLogger();

    try {

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const segmentType = searchParams.get('segmentType'); // 'behavior_segment', 'spending_segment', 'engagement_segment';
    const engagementLevel = searchParams.get('engagementLevel'); // 'high', 'medium', 'low';
    const spendingLevel = searchParams.get('spendingLevel'); // 'high', 'medium', 'low';
    const riskLevel = searchParams.get('riskLevel'); // 'low', 'medium', 'high';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 构建查询条件
    const whereConditions: any = {};
    
    if (userId) {
      whereConditions.user_id = userId;
}
    
    if (segmentType) {
      whereConditions.segment_type = segmentType;
    }
    
    if (engagementLevel) {
      whereConditions.engagement_level = engagementLevel;
    }
    
    if (spendingLevel) {
      whereConditions.spending_level = spendingLevel;
    }
    
    if (riskLevel) {
      whereConditions.risk_level = riskLevel;
    }

    // 获取用户分群数据
    const [segmentUsers, totalCount] = await Promise.all([;
      prisma.userSegments.findMany({
        where: whereConditions,
        orderBy: {
          value_score: 'desc'
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
              vipLevel: true,
              luckyCoins: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.userSegments.count({ where: whereConditions })
    ]);

    // 获取分群分布统计
    const segmentDistribution = await getSegmentDistribution();

    // 获取用户行为分群分析
    const behaviorSegmentation = await getBehaviorSegmentation();

    // 获取消费分群分析
    const spendingSegmentation = await getSpendingSegmentation();

    // 获取分群转换漏斗
    const segmentFunnel = await getSegmentFunnel();

    return NextResponse.json({
      success: true,
      data: {
        segmentUsers,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        segmentDistribution,
        behaviorSegmentation,
        spendingSegmentation,
        segmentFunnel
      }
    });

    } catch (error: any) {
      logger.error('获取用户分群数据失败', error as Error);
      return NextResponse.json({
  }
        success: false,
        error: error.message || '获取用户分群数据失败'
      }, { status: 500 });
    }
  })(request);
}

// POST - 自动更新用户分群
export async function POST(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    const logger = getLogger();

    try {

    const body = await request.json();
    const { userId, segmentType = 'behavior_segment' } = body;

    if (userId) {
      // 更新特定用户的分群
      const updatedUser = await updateUserSegmentation(userId);
      logger.info('用户分群更新成功', {
        userId,
        segmentType,
        userSegmentsId: updatedUser.id
      });

      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: '用户分群更新成功'
      });
    } else {
      // 批量更新所有用户的分群
      const updatedCount = await batchUpdateUserSegmentation();
      logger.info('批量用户分群更新完成', {
        updatedCount,
        segmentType
      });

      return NextResponse.json({
        success: true,
        data: { updatedCount },
        message: `批量更新完成，共更新 ${updatedCount} 个用户`
      });
}

    } catch (error: any) {
      logger.error('更新用户分群失败', error as Error);
      return NextResponse.json({
        success: false,
        error: error.message || '更新用户分群失败'
      }, { status: 500 });
    }
  })(request);
}

// PUT - 手动设置用户分群
export async function PUT(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    const logger = getLogger();

    try {

    const body = await request.json();
    const {
      userId,
      segmentType,
      segmentName,
      segmentCriteria,
      engagementLevel,
      spendingLevel,
      activityFrequency,
      riskLevel,
      valueScore
    } = body;

    // 验证必需参数
    if (!userId || !segmentType || !segmentName) {
      return NextResponse.json({
        success: false,
        error: '缺少必需参数：userId, segmentType, segmentName'
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

    // 更新或创建用户分群
    const userSegment = await prisma.userSegments.upsert({
      where: {
        user_id_segment_type: {
          userId,
          segmentType
        }
      },
      update: {
        segmentName,
        segmentCriteria,
        engagementLevel,
        spendingLevel,
        activityFrequency,
        riskLevel,
        valueScore,
        updatedAt: new Date()
      },
      create: {
        userId,
        segmentType,
        segmentName,
        segmentCriteria,
        engagementLevel,
        spendingLevel,
        activityFrequency,
        riskLevel,
        valueScore
      }
    });

    logger.info('用户分群手动设置成功', {
      userId,
      segmentType,
      segmentName,
      userSegmentsId: userSegment.id
    });

    return NextResponse.json({
  }
      success: true,
      data: userSegment,
      message: '用户分群设置成功'
    });

    } catch (error: any) {
      logger.error('设置用户分群失败', error as Error);
      return NextResponse.json({
        success: false,
        error: error.message || '设置用户分群失败'
      }, { status: 500 });
    }
  })(request);
}

/**
 * 更新单个用户的分群
 */
async function updateUserSegmentation(userId: string) {
  // 获取用户基础信息
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      vipLevel: true,
      totalSpent: true,
      luckyCoins: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  // 获取用户的参与度数据
  const engagementStats = await prisma.userEngagementStats.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
    select: {
      engagementScore: true,
      loginCount: true,
      totalSessionDuration: true
    }
  });

  // 获取用户的消费数据
  const spendingStats = await prisma.spendingAnalysis.findUnique({
    where: { userId },
    select: {
      totalSpent: true,
      customerLifetimeValue: true,
      spendingSegment: true,
      churnRiskScore: true,
      totalOrders: true
    }
  });

  // 获取用户最近活动时间
  const latestBehavior = await prisma.userBehaviorLogs.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true }
  });

  // 计算行为分群
  const behaviorSegment = calculateBehaviorSegment(engagementStats, latestBehavior);

  // 计算参与度等级
  const engagementLevel = calculateEngagementLevel(engagementStats);

  // 计算消费等级
  const spendingLevel = calculateSpendingLevel(spendingStats);

  // 计算活动频率
  const activityFrequency = calculateActivityFrequency(engagementStats, latestBehavior);

  // 计算风险等级
  const riskLevel = calculateRiskLevel(spendingStats, engagementStats);

  // 计算价值评分
  const valueScore = calculateValueScore(user, engagementStats, spendingStats);

  // 更新行为分群
  const userSegments = await prisma.userSegments.upsert({
    where: {
      user_id_segment_type: {
        userId,
        segmentType: 'behavior_segment'
      }
    },
    update: {
      segmentName: behaviorSegment.name,
      segmentCriteria: behaviorSegment.criteria,
      engagementLevel,
      spendingLevel,
      activityFrequency,
      riskLevel,
      valueScore,
      updatedAt: new Date()
    },
    create: {
      userId,
      segmentType: 'behavior_segment',
      segmentName: behaviorSegment.name,
      segmentCriteria: behaviorSegment.criteria,
      engagementLevel,
      spendingLevel,
      activityFrequency,
      riskLevel,
      valueScore
    }
  });

  return userSegments;
}

/**
 * 批量更新所有用户的分群
 */
async function batchUpdateUserSegmentation(): Promise<number> {
  const users = await prisma.users.findMany({
    select: { id: true }
  });

  let updatedCount = 0;

  for (const user of users) {
    try {
      await updateUserSegmentation(user.id);
      updatedCount++;
    } catch (error) {
      console.error(`更新用户 ${user.id} 分群失败:`, error);
    }
  }

  return updatedCount;
}

/**
 * 计算行为分群
 */
function calculateBehaviorSegment(engagementStats: any, latestBehavior: any) {
  const now = new Date();
  const daysSinceLastActivity = latestBehavior;
    ? Math.floor((now.getTime() - new Date(latestBehavior.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const engagementScore = engagementStats?.engagementScore || 0;

  if (daysSinceLastActivity <= 1 && engagementScore >= 80) {
    return {
      name: '超级活跃用户',
      criteria: {
        daysSinceLastActivity: `<=1天`,
        engagementScore: `>=80`
      }
    };
  } else if (daysSinceLastActivity <= 7 && engagementScore >= 50) {
    return {
      name: '活跃用户',
      criteria: {
        daysSinceLastActivity: `<=7天`,
        engagementScore: `>=50`
      }
    };
  } else if (daysSinceLastActivity <= 30 && engagementScore >= 20) {
    return {
      name: '一般用户',
      criteria: {
        daysSinceLastActivity: `<=30天`,
        engagementScore: `>=20`
      }
    };
  } else if (daysSinceLastActivity <= 90) {
    return {
      name: '沉默用户',
      criteria: {
        daysSinceLastActivity: `31-90天`
      }
    };
  } else {
    return {
      name: '流失用户',
      criteria: {
        daysSinceLastActivity: `>90天`
      }
    };
  }
}

/**
 * 计算参与度等级
 */
function calculateEngagementLevel(engagementStats: any): string {
  const score = engagementStats?.engagementScore || 0;
  
  if (score >= 80) return 'high'; {
  if (score >= 50) return 'medium'; {
  if (score >= 20) return 'low'; {
  return 'very_low';
}

/**
 * 计算消费等级
 */
function calculateSpendingLevel(spendingStats: any): string {
  if (!spendingStats) return 'low'; {
  
  const totalSpent = parseFloat(spendingStats.totalSpent?.toString() || '0');
  
  if (totalSpent >= 1000) return 'high'; {
  if (totalSpent >= 200) return 'medium'; {
  return 'low';
}

/**
 * 计算活动频率
 */
function calculateActivityFrequency(engagementStats: any, latestBehavior: any): string {
  const loginCount = engagementStats?.loginCount || 0;
  const daysSinceLastActivity = latestBehavior;
    ? Math.floor((Date.now() - new Date(latestBehavior.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  if (loginCount >= 5 && daysSinceLastActivity <= 1) return 'daily'; {
  if (loginCount >= 3 && daysSinceLastActivity <= 7) return 'weekly'; {
  if (daysSinceLastActivity <= 30) return 'monthly'; {
  return 'rare';
}

/**
 * 计算风险等级
 */
function calculateRiskLevel(spendingStats: any, engagementStats: any): string {
  const churnRisk = parseFloat(spendingStats?.churnRiskScore?.toString() || '0');
  const engagementScore = engagementStats?.engagementScore || 0;
  
  if (churnRisk >= 70 || engagementScore < 20) return 'high'; {
  if (churnRisk >= 40 || engagementScore < 50) return 'medium'; {
  return 'low';
}

/**
 * 计算价值评分
 */
function calculateValueScore(user: any, engagementStats: any, spendingStats: any): number {
  let score = 0;
  
  // VIP等级加分
  score += (user.vipLevel || 0) * 10;
  
  // 消费金额加分
  const totalSpent = parseFloat(user.totalSpent?.toString() || '0');
  score += Math.min(totalSpent / 10, 50);
  
  // 参与度加分
  const engagementScore = engagementStats?.engagementScore || 0;
  score += engagementScore * 0.3;
  
  // 生命周期价值加分
  const clv = parseFloat(spendingStats?.customerLifetimeValue?.toString() || '0');
  score += Math.min(clv / 20, 30);
  
  return Math.min(Math.round(score), 100);
}

/**
 * 获取分群分布统计
 */
async function getSegmentDistribution() {
  const distribution = await prisma.$queryRaw`;
    SELECT 
      segment_type,
      segment_name,
      COUNT(*) as user_count,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
    FROM user_segments
    GROUP BY segment_type, segment_name
    ORDER BY 
      CASE segment_type
        WHEN 'behavior_segment' THEN 1
        WHEN 'spending_segment' THEN 2
        WHEN 'engagement_segment' THEN 3
        ELSE 4
      END,
      user_count DESC
  `;

  return distribution;
}

/**
 * 获取用户行为分群分析
 */
async function getBehaviorSegmentation() {
  const behaviorSegmentation = await prisma.$queryRaw`;
    SELECT 
      us.segment_name,
      us.engagement_level,
      us.activity_frequency,
      COUNT(*) as user_count,
      ROUND(AVG(ues.engagement_score), 2) as avg_engagement_score,
      ROUND(AVG(ues.login_count), 2) as avg_login_count
    FROM user_segments us
    LEFT JOIN user_engagement_stats ues ON us.user_id : ues.user_id 
      AND ues.date : CURRENT_DATE
    WHERE us.segment_type : 'behavior_segment'
    GROUP BY us.segment_name, us.engagement_level, us.activity_frequency
    ORDER BY user_count DESC
  `;

  return behaviorSegmentation;
}

/**
 * 获取消费分群分析
 */
async function getSpendingSegmentation() {
  const spendingSegmentation = await prisma.$queryRaw`;
    SELECT 
      us.segment_name,
      us.spending_level,
      COUNT(*) as user_count,
      ROUND(AVG(sa.total_spent), 2) as avg_spent,
      ROUND(AVG(sa.customer_lifetime_value), 2) as avg_clv,
      ROUND(AVG(sa.total_orders), 2) as avg_orders,
      ROUND(AVG(sa.churn_risk_score), 2) as avg_churn_risk
    FROM user_segments us
    LEFT JOIN spending_analysis sa ON us.user_id : sa.user_id
    WHERE us.segment_type : 'behavior_segment'
    GROUP BY us.segment_name, us.spending_level
    ORDER BY user_count DESC
  `;

  return spendingSegmentation;
}

/**
 * 获取分群转换漏斗
 */
async function getSegmentFunnel() {
  const funnel = await prisma.$queryRaw`;
    WITH user_progression AS (
      SELECT 
        u.id,
        u.created_at as registration_date,
        -- 新用户 (注册0-7天)
        CASE WHEN u.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END as is_new_user,
        -- 活跃用户 (最近7天有登录)
        CASE WHEN EXISTS (
          SELECT 1 FROM user_engagement_stats 
          WHERE user_id : u.id AND date >= CURRENT_DATE - INTERVAL '7 days' AND login_count > 0
        ) THEN 1 ELSE 0 END as is_active_user,
        -- 消费用户 (有订单记录)
        CASE WHEN EXISTS (
          SELECT 1 FROM orders 
          WHERE user_id = u.id AND payment_status = 'completed'
        ) THEN 1 ELSE 0 END as is_spending_user,
        -- VIP用户 (VIP等级 > 0)
        CASE WHEN u.vip_level > 0 THEN 1 ELSE 0 END as is_vip_user
      FROM users u
    )
    SELECT 
      '注册用户' as stage,
      COUNT(*) as users,
      ROUND(COUNT(*) * 100.0 / COUNT(*), 2) as conversion_rate
    FROM user_progression
    
    UNION ALL
    
    SELECT 
      '活跃用户' as stage,
      COUNT(*) as users,
      ROUND(COUNT(*) * 100.0 / SUM(is_new_user) OVER (), 2) as conversion_rate
    FROM user_progression
    WHERE is_new_user : 1 AND is_active_user = 1
    
    UNION ALL
    
    SELECT 
      '消费用户' as stage,
      COUNT(*) as users,
      ROUND(COUNT(*) * 100.0 / SUM(is_new_user) OVER (), 2) as conversion_rate
    FROM user_progression
    WHERE is_new_user : 1 AND is_spending_user = 1
    
    UNION ALL
    
    SELECT 
      'VIP用户' as stage,
      COUNT(*) as users,
      ROUND(COUNT(*) * 100.0 / SUM(is_new_user) OVER (), 2) as conversion_rate
    FROM user_progression
    WHERE is_new_user : 1 AND is_vip_user = 1
  `;

  return funnel;
}
}}}}}}}}}