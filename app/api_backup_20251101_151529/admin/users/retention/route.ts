import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';
import { getLogger } from '@/lib/logger';

import { AdminPermissionManager } from '@/lib/admin/permissions/AdminPermissionManager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';


const withReadPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.users.read()
});

const withWritePermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.users.write()
});

// GET - 获取用户留存分析
export async function GET(request: NextRequest) {
  return withReadPermission(async (request: any, admin: any) => {
    const logger = getLogger();

    try {

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const cohortType = searchParams.get('cohortType') || 'weekly'; // 'weekly' 或 'monthly'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const analysisType = searchParams.get('analysisType') || 'overview'; // 'overview', 'cohort', 'user'

    // 根据分析类型返回不同数据
    switch (analysisType) {
      case 'cohort':
        return await getCohortAnalysis(admin, cohortType, startDate, endDate);
      case 'user':
        return await getUserRetentionAnalysis(admin, userId);
      default:
        return await getRetentionOverview(admin, cohortType, startDate, endDate);
    }

    } catch (error: any) {
      logger.error('获取用户留存分析失败', error as Error);
      return NextResponse.json({
        success: false,
        error: error.message || '获取用户留存分析失败'
      }, { status: 500 });
    }
  })(request);
}

// POST - 更新用户留存分析
export async function POST(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    const logger = getLogger();

    try {
    const body = await request.json();
    const {
      userId,
      registrationDate,
      cohortType = 'weekly'
    } = body;

    // 验证必需参数
    if (!userId || !registrationDate) {
      return NextResponse.json({
        success: false,
        error: '缺少必需参数：userId 和 registrationDate'
      }, { status: 400 });
    }

    // 验证用户是否存在
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, createdAt: true }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '用户不存在'
      }, { status: 404 });
    }

    // 计算留存状态
    const retentionData = await calculateRetentionData(
      userId,
      new Date(registrationDate),
      cohortType
    );

    // 更新或创建留存分析记录
    const retentionAnalysis = await prisma.retentionAnalysis.upsert({
      where: { user_id: userId },
      update: {
        ...retentionData,
        updatedAt: new Date()
      },
      create: {
        userId,
        registrationDate: new Date(registrationDate),
        cohortDate: retentionData.cohortDate,
        cohortType,
        ...retentionData
      }
    });

    logger.info('用户留存分析更新成功', {
      userId,
      cohortType,
      day7Retention: retentionData.day_7_retention,
      analysisId: retentionAnalysis.id
    });

    return NextResponse.json({
      success: true,
      data: retentionAnalysis,
      message: '留存分析更新成功'
    });

    } catch (error: any) {
      logger.error('更新用户留存分析失败', error as Error);
      return NextResponse.json({
        success: false,
        error: error.message || '更新用户留存分析失败'
      }, { status: 500 });
    }
  })(request);
}

/**
 * 获取留存概览
 */
async function getRetentionOverview(
  admin: AdminUser,
  cohortType: string,
  startDate?: string | null,
  endDate?: string | null
) {
  const { searchParams } = new URL(admin.url);
  
  // 构建日期范围
  const dateFilter = buildDateFilter(startDate, endDate, cohortType);

  // 获取总体留存统计
  const overallStats = await getOverallRetentionStats(dateFilter);

  // 获取留存趋势
  const retentionTrends = await getRetentionTrends(cohortType, dateFilter);

  // 获取留存漏斗
  const retentionFunnel = await getRetentionFunnel(dateFilter);

  // 获取用户分群留存对比
  const segmentComparison = await getSegmentRetentionComparison(dateFilter);

  return NextResponse.json({
    success: true,
    data: {
      overview: overallStats,
      trends: retentionTrends,
      funnel: retentionFunnel,
      segmentComparison
    }
  });
}

/**
 * 获取同期群分析
 */
async function getCohortAnalysis(
  admin: AdminUser,
  cohortType: string,
  startDate?: string | null,
  endDate?: string | null
) {
  const { searchParams } = new URL(admin.url);
  const limit = parseInt(searchParams.get('limit') || '12');
  
  const cohorts = await prisma.$queryRaw`
    WITH cohort_data AS (
      SELECT 
        ${cohortType === 'monthly' ? 
          'DATE_TRUNC(\'month\', registration_date)' : 
          'DATE_TRUNC(\'week\', registration_date)'
        } as cohort_date,
        registration_date,
        COUNT(*) as cohort_size,
        COUNT(CASE WHEN day_1_retention THEN 1 END) * 100.0 / COUNT(*) as day_1_rate,
        COUNT(CASE WHEN day_3_retention THEN 1 END) * 100.0 / COUNT(*) as day_3_rate,
        COUNT(CASE WHEN day_7_retention THEN 1 END) * 100.0 / COUNT(*) as day_7_rate,
        COUNT(CASE WHEN day_14_retention THEN 1 END) * 100.0 / COUNT(*) as day_14_rate,
        COUNT(CASE WHEN day_30_retention THEN 1 END) * 100.0 / COUNT(*) as day_30_rate,
        COUNT(CASE WHEN day_60_retention THEN 1 END) * 100.0 / COUNT(*) as day_60_rate,
        COUNT(CASE WHEN day_90_retention THEN 1 END) * 100.0 / COUNT(*) as day_90_rate,
        AVG(total_active_days) as avg_active_days
      FROM retention_analysis
      WHERE registration_date >= CURRENT_DATE - INTERVAL '${limit} ${cohortType}s'
      GROUP BY ${cohortType === 'monthly' ? 
        'DATE_TRUNC(\'month\', registration_date)' : 
        'DATE_TRUNC(\'week\', registration_date)'
      }, registration_date
    )
    SELECT * FROM cohort_data
    ORDER BY cohort_date DESC
    LIMIT ${limit}
  `;

  return NextResponse.json({
    success: true,
    data: {
      cohortType,
      cohorts,
      totalCohorts: cohorts.length
    }
  });
}

/**
 * 获取单个用户留存分析
 */
async function getUserRetentionAnalysis(admin: AdminUser, userId?: string | null) {
  if (!userId) {
    return NextResponse.json({
      success: false,
      error: '缺少用户ID参数'
    }, { status: 400 });
  }

  const userRetention = await prisma.retentionAnalysis.findUnique({
    where: { userId },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          username: true,
          telegramId: true,
          createdAt: true
        }
      }
    }
  });

  if (!userRetention) {
    return NextResponse.json({
      success: false,
      error: '用户留存分析数据不存在'
    }, { status: 404 });
  }

  // 获取用户行为时间线
  const behaviorTimeline = await prisma.userBehaviorLogs.findMany({
    where: { userId },
    orderBy: { created_at: 'asc' },
    take: 100
  });

  return NextResponse.json({
    success: true,
    data: {
      userRetention,
      behaviorTimeline
    }
  });
}

/**
 * 计算留存数据
 */
async function calculateRetentionData(
  userId: string,
  registrationDate: Date,
  cohortType: string
) {
  const cohortDate = cohortType === 'monthly' 
    ? new Date(registrationDate.getFullYear(), registrationDate.getMonth(), 1)
    : new Date(registrationDate.getFullYear(), registrationDate.getMonth(), registrationDate.getDate() - registrationDate.getDay());

  // 计算各时间点的留存状态
  const retentionChecks = await Promise.all([
    // Day 0 (注册当天)
    checkDayRetention(userId, registrationDate, registrationDate),
    // Day 1
    checkDayRetention(userId, registrationDate, new Date(registrationDate.getTime() + 24 * 60 * 60 * 1000)),
    // Day 3
    checkDayRetention(userId, registrationDate, new Date(registrationDate.getTime() + 3 * 24 * 60 * 60 * 1000)),
    // Day 7
    checkDayRetention(userId, registrationDate, new Date(registrationDate.getTime() + 7 * 24 * 60 * 60 * 1000)),
    // Day 14
    checkDayRetention(userId, registrationDate, new Date(registrationDate.getTime() + 14 * 24 * 60 * 60 * 1000)),
    // Day 30
    checkDayRetention(userId, registrationDate, new Date(registrationDate.getTime() + 30 * 24 * 60 * 60 * 1000)),
    // Day 60
    checkDayRetention(userId, registrationDate, new Date(registrationDate.getTime() + 60 * 24 * 60 * 60 * 1000)),
    // Day 90
    checkDayRetention(userId, registrationDate, new Date(registrationDate.getTime() + 90 * 24 * 60 * 60 * 1000))
  ]);

  // 获取最后活动日期和总活跃天数
  const activityStats = await prisma.userBehaviorLogs.aggregate({
    where: { userId },
    _max: { createdAt: true },
    _count: { _all: true }
  });

  const uniqueActiveDays = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT DATE(created_at)) as active_days
    FROM user_behavior_logs
    WHERE user_id = $1
  `(userId);

  return {
    cohortDate,
    day_0_retention: retentionChecks[0],
    day_1_retention: retentionChecks[1],
    day_3_retention: retentionChecks[2],
    day_7_retention: retentionChecks[3],
    day_14_retention: retentionChecks[4],
    day_30_retention: retentionChecks[5],
    day_60_retention: retentionChecks[6],
    day_90_retention: retentionChecks[7],
    lastActivityDate: activityStats._max.createdAt ? new Date(activityStats._max.createdAt) : null,
    totalActiveDays: parseInt(uniqueActiveDays[0]?.active_days || '0')
  };
}

/**
 * 检查特定日期的留存状态
 */
async function checkDayRetention(
  userId: string,
  registrationDate: Date,
  checkDate: Date
): Promise<boolean> {
  const nextDay = new Date(checkDate.getTime() + 24 * 60 * 60 * 1000);
  
  const behaviorExists = await prisma.userBehaviorLogs.findFirst({
    where: {
      userId,
      createdAt: {
        gte: checkDate,
        lt: nextDay
      }
    },
    select: { id: true }
  });

  return !!behaviorExists;
}

/**
 * 构建日期过滤条件
 */
function buildDateFilter(startDate?: string | null, endDate?: string | null, cohortType?: string) {
  const filter: any = {};
  
  if (startDate && endDate) {
    filter.registration_date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  } else if (startDate) {
    filter.registration_date = { gte: new Date(startDate) };
  } else if (endDate) {
    filter.registration_date = { lte: new Date(endDate) };
  } else {
    // 默认最近6个月的数据
    filter.registration_date = {
      gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    };
  }

  return filter;
}

/**
 * 获取总体留存统计
 */
async function getOverallRetentionStats(dateFilter: any) {
  const stats = await prisma.retentionAnalysis.aggregate({
    where: dateFilter,
    _count: { _all: true },
    _avg: {
      day_1_retention: true,
      day_3_retention: true,
      day_7_retention: true,
      day_14_retention: true,
      day_30_retention: true,
      totalActiveDays: true
    }
  });

  const totalUsers = stats._count._all || 0;

  return {
    totalUsers,
    day1Retention: parseFloat((stats._avg.day_1_retention ? (stats._avg.day_1_retention * 100).toFixed(2) : '0')),
    day3Retention: parseFloat((stats._avg.day_3_retention ? (stats._avg.day_3_retention * 100).toFixed(2) : '0')),
    day7Retention: parseFloat((stats._avg.day_7_retention ? (stats._avg.day_7_retention * 100).toFixed(2) : '0')),
    day14Retention: parseFloat((stats._avg.day_14_retention ? (stats._avg.day_14_retention * 100).toFixed(2) : '0')),
    day30Retention: parseFloat((stats._avg.day_30_retention ? (stats._avg.day_30_retention * 100).toFixed(2) : '0')),
    averageActiveDays: parseFloat((stats._avg.totalActiveDays?.toFixed(2) || '0'))
  };
}

/**
 * 获取留存趋势
 */
async function getRetentionTrends(cohortType: string, dateFilter: any) {
  const trends = await prisma.$queryRaw`
    SELECT 
      ${cohortType === 'monthly' ? 
        'DATE_TRUNC(\'month\', registration_date)' : 
        'DATE_TRUNC(\'week\', registration_date)'
      } as period,
      COUNT(*) as cohort_size,
      ROUND(AVG(day_1_retention) * 100, 2) as day_1_rate,
      ROUND(AVG(day_7_retention) * 100, 2) as day_7_rate,
      ROUND(AVG(day_30_retention) * 100, 2) as day_30_rate
    FROM retention_analysis
    WHERE registration_date >= CURRENT_DATE - INTERVAL '12 ${cohortType}s'
    GROUP BY ${cohortType === 'monthly' ? 
      'DATE_TRUNC(\'month\', registration_date)' : 
      'DATE_TRUNC(\'week\', registration_date)'
    }
    ORDER BY period DESC
    LIMIT 12
  `;

  return trends;
}

/**
 * 获取留存漏斗
 */
async function getRetentionFunnel(dateFilter: any) {
  const funnel = await prisma.$queryRaw`
    SELECT 
      'Day 0' as stage,
      COUNT(*) as users,
      ROUND(COUNT(*) * 100.0 / COUNT(*), 2) as retention_rate
    FROM retention_analysis
    WHERE registration_date >= CURRENT_DATE - INTERVAL '90 days'
    
    UNION ALL
    
    SELECT 
      'Day 1' as stage,
      COUNT(CASE WHEN day_1_retention THEN 1 END) as users,
      ROUND(COUNT(CASE WHEN day_1_retention THEN 1 END) * 100.0 / COUNT(*), 2) as retention_rate
    FROM retention_analysis
    WHERE registration_date >= CURRENT_DATE - INTERVAL '90 days'
    
    UNION ALL
    
    SELECT 
      'Day 7' as stage,
      COUNT(CASE WHEN day_7_retention THEN 1 END) as users,
      ROUND(COUNT(CASE WHEN day_7_retention THEN 1 END) * 100.0 / COUNT(*), 2) as retention_rate
    FROM retention_analysis
    WHERE registration_date >= CURRENT_DATE - INTERVAL '90 days'
    
    UNION ALL
    
    SELECT 
      'Day 30' as stage,
      COUNT(CASE WHEN day_30_retention THEN 1 END) as users,
      ROUND(COUNT(CASE WHEN day_30_retention THEN 1 END) * 100.0 / COUNT(*), 2) as retention_rate
    FROM retention_analysis
    WHERE registration_date >= CURRENT_DATE - INTERVAL '90 days'
  `;

  return funnel;
}

/**
 * 获取分群留存对比
 */
async function getSegmentRetentionComparison(dateFilter: any) {
  const comparison = await prisma.$queryRaw`
    WITH user_segments AS (
      SELECT 
        ra.user_id,
        ra.registration_date,
        ra.day_1_retention,
        ra.day_7_retention,
        ra.day_30_retention,
        u.vip_level,
        CASE 
          WHEN u.vip_level > 0 THEN 'VIP'
          ELSE 'Regular'
        END as user_segment
      FROM retention_analysis ra
      JOIN users u ON ra.user_id = u.id
      WHERE ra.registration_date >= CURRENT_DATE - INTERVAL '90 days'
    )
    SELECT 
      user_segment,
      COUNT(*) as total_users,
      ROUND(AVG(day_1_retention) * 100, 2) as day_1_retention,
      ROUND(AVG(day_7_retention) * 100, 2) as day_7_retention,
      ROUND(AVG(day_30_retention) * 100, 2) as day_30_retention
    FROM user_segments
    GROUP BY user_segment
    ORDER BY 
      CASE user_segment
        WHEN 'VIP' THEN 1
        WHEN 'Regular' THEN 2
      END
  `;

  return comparison;
}