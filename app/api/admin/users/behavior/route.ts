import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';
import { getLogger } from '@/lib/logger';

// GET - 获取用户行为统计
export async function GET(request: NextRequest) {
  const logger = getLogger();

  try {
    // 验证管理员权限
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({
        success: false,
        error: '管理员权限验证失败'
      }, { status: 403 });
    }

    // 检查是否有用户分析权限
    const hasPermission = admin.permissions.includes('users:read') || admin.role === 'super_admin';
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: '权限不足：无法查看用户行为统计'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const behaviorType = searchParams.get('behaviorType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 构建查询条件
    const whereConditions: any = {};
    
    if (userId) {
      whereConditions.user_id = userId;
    }
    
    if (behaviorType) {
      whereConditions.behavior_type = behaviorType;
    }
    
    if (startDate || endDate) {
      whereConditions.created_at = {};
      if (startDate) {
        whereConditions.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        whereConditions.created_at.lte = new Date(endDate);
      }
    }

    // 获取行为日志数据
    const [behaviorLogs, totalCount] = await Promise.all([
      prisma.userBehaviorLogs.findMany({
        where: whereConditions,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              username: true,
              telegramId: true
            }
          }
        }
      }),
      prisma.userBehaviorLogs.count({ where: whereConditions })
    ]);

    // 获取统计数据
    const stats = await getBehaviorStatistics(whereConditions);

    // 获取行为类型分布
    const behaviorTypeStats = await prisma.userBehaviorLogs.groupBy({
      by: ['behavior_type'],
      where: whereConditions,
      _count: {
        behavior_type: true
      },
      _count: true
    });

    // 获取用户行为热度图数据
    const heatmapData = await getBehaviorHeatmapData(whereConditions);

    return NextResponse.json({
      success: true,
      data: {
        behaviorLogs,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        statistics: stats,
        behaviorTypeDistribution: behaviorTypeStats,
        heatmap: heatmapData
      }
    });

  } catch (error: any) {
    logger.error('获取用户行为统计失败', error as Error);
    return NextResponse.json({
      success: false,
      error: error.message || '获取用户行为统计失败'
    }, { status: 500 });
  }
}

// POST - 记录用户行为
export async function POST(request: NextRequest) {
  const logger = getLogger();

  try {
    const body = await request.json();
    const {
      userId,
      behaviorType,
      behaviorSubtype,
      sessionId,
      deviceInfo,
      locationInfo,
      ipAddress,
      userAgent,
      referenceId,
      referenceType,
      amount,
      durationSeconds,
      metadata
    } = body;

    // 验证必需参数
    if (!userId || !behaviorType) {
      return NextResponse.json({
        success: false,
        error: '缺少必需参数：userId 和 behaviorType'
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

    // 创建行为日志
    const behaviorLog = await prisma.userBehaviorLogs.create({
      data: {
        userId,
        behaviorType,
        behaviorSubtype,
        sessionId,
        deviceInfo,
        locationInfo,
        ipAddress,
        userAgent,
        referenceId,
        referenceType,
        amount: amount ? parseFloat(amount) : null,
        durationSeconds,
        metadata
      }
    });

    logger.info('用户行为记录成功', {
      userId,
      behaviorType,
      behaviorSubtype,
      logId: behaviorLog.id
    });

    return NextResponse.json({
      success: true,
      data: behaviorLog,
      message: '行为记录成功'
    });

  } catch (error: any) {
    logger.error('记录用户行为失败', error as Error);
    return NextResponse.json({
      success: false,
      error: error.message || '记录用户行为失败'
    }, { status: 500 });
  }
}

/**
 * 获取行为统计数据
 */
async function getBehaviorStatistics(whereConditions: any) {
  // 获取总行为数
  const totalBehaviors = await prisma.userBehaviorLogs.count({
    where: whereConditions
  });

  // 获取唯一用户数
  const uniqueUsers = await prisma.userBehaviorLogs.findMany({
    where: whereConditions,
    select: { userId: true },
    distinct: ['userId']
  });

  // 获取最活跃的用户
  const mostActiveUsers = await prisma.userBehaviorLogs.groupBy({
    by: ['userId'],
    where: whereConditions,
    _count: {
      userId: true
    },
    orderBy: {
      _count: {
        userId: 'desc'
      }
    },
    take: 10
  });

  // 获取行为趋势（最近30天）
  const behaviorTrends = await prisma.$queryRaw`
    SELECT 
      DATE(created_at) as date,
      behavior_type,
      COUNT(*) as count
    FROM user_behavior_logs 
    WHERE ${whereConditions.user_id ? `user_id = '${whereConditions.user_id}' AND` : ''}
      created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at), behavior_type
    ORDER BY date DESC, count DESC
  `;

  return {
    totalBehaviors,
    uniqueUsersCount: uniqueUsers.length,
    mostActiveUsers,
    behaviorTrends,
    averageBehaviorsPerUser: uniqueUsers.length > 0 ? (totalBehaviors / uniqueUsers.length).toFixed(2) : 0
  };
}

/**
 * 获取行为热力图数据
 */
async function getBehaviorHeatmapData(whereConditions: any) {
  const heatmapData = await prisma.$queryRaw`
    SELECT 
      EXTRACT(hour FROM created_at) as hour,
      EXTRACT(dow FROM created_at) as day_of_week,
      COUNT(*) as count
    FROM user_behavior_logs
    WHERE ${whereConditions.user_id ? `user_id = '${whereConditions.user_id}' AND` : ''}
      created_at >= NOW() - INTERVAL '30 days'
    GROUP BY EXTRACT(hour FROM created_at), EXTRACT(dow FROM created_at)
    ORDER BY hour, day_of_week
  `;

  return heatmapData;
}