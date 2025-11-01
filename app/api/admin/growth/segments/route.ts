import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `segments_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('segments_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('segments_route.ts request failed', error as Error, {
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

        // 获取用户总数
        const totalUsers = await prisma.users.count();

        // 获取最近7天注册的用户（新手用户）
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
        const newbieCount = await prisma.users.count({
          where: {
            createdAt: {
              gte: sevenDaysAgo
            }
          }
        });

        // 获取最近30天有活动的用户（活跃用户）
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
        const activeCount = await prisma.users.count({
          where: {
            updatedAt: {
              gte: thirtyDaysAgo
            }
          }
        });

        // 沉睡用户 = 总用户 - 新手用户 - 活跃用户
        const dormantCount = totalUsers - newbieCount - activeCount;

        // 计算百分比
        const segments = [
          {
            segment: 'newbie',
            count: newbieCount,
            percentage: totalUsers > 0 ? Math.round((newbieCount / totalUsers) * 100) : 0
          },
          {
            segment: 'active',
            count: activeCount,
            percentage: totalUsers > 0 ? Math.round((activeCount / totalUsers) * 100) : 0
          },
          {
            segment: 'dormant',
            count: dormantCount,
            percentage: totalUsers > 0 ? Math.round((dormantCount / totalUsers) * 100) : 0
          }
        ];

        return NextResponse.json({
          success: true,
          data: segments
        });
      })(request);
}
