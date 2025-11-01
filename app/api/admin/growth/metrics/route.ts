import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `metrics_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('metrics_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
}
  } catch (error) {
    logger.error('metrics_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {
    const prisma = new PrismaClient();

    export async function GET(request: NextRequest) {
      const withPermission = AdminPermissionManager.createPermissionMiddleware({
        customPermissions: AdminPermissions.stats.read()
      });

      return await withPermission(async (request, admin) => {

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '7d';

        // 计算日期范围
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // 获取增长指标数据
        const metrics = await prisma.growthMetrics.findMany({
          where: {
            date: {
              gte: startDate
    }
          },
          orderBy: {
            date: 'desc'
          },
          take: 1
        });

        // 如果没有数据，返回默认值
        if (metrics.length === 0) {
          return NextResponse.json({
            success: true,
            data: {
              date: new Date().toISOString(),
              newUsers: 0,
              activeUsers: 0,
              retainedUsers: 0,
              conversionRate: 0,
              referralCount: 0,
              checkInCount: 0,
              tasksCompleted: 0,
              totalRewards: 0,
              kFactor: 0
            }
          });
        }

        const latestMetric = metrics[0];

        return NextResponse.json({
  }
          success: true,
          data: {
            date: latestMetric.date,
            newUsers: latestMetric.newUsers,
            activeUsers: latestMetric.activeUsers,
            retainedUsers: latestMetric.retainedUsers,
            conversionRate: Number(latestMetric.conversionRate) || 0,
            referralCount: latestMetric.referralCount,
            checkInCount: latestMetric.checkInCount,
            tasksCompleted: latestMetric.tasksCompleted,
            totalRewards: Number(latestMetric.totalRewards) || 0,
            kFactor: Number(latestMetric.kFactor) || 0
          }
        });
      })(request);
}
