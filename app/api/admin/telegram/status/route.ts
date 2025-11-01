import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';

const prisma = new PrismaClient();

// 创建权限中间件
const withPermission = AdminPermissionManager.createPermissionMiddleware({
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `status_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('status_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('status_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {
    });

    export async function GET(request: NextRequest) {
      return withPermission(async (request, admin) => {
        try {
          // 获取第一个Bot的状态（如果有多个Bot，需要修改逻辑）
          const status = await prisma.botStatus.findFirst({
            orderBy: {
              updatedAt: 'desc'
            }
          });

          if (!status) {
            // 如果没有Bot状态记录，返回默认值
            return NextResponse.json({
              success: true,
              data: {
                id: 'default',
                botUsername: 'LuckyMartBot',
                isOnline: false,
                lastHeartbeat: null,
                apiCallsCount: 0,
                errorCount: 0,
                pushSuccessCount: 0,
                pushFailureCount: 0,
                uptime: 0
              }
            });
          }

          return NextResponse.json({
            success: true,
            data: status
          });

        } catch (error) {
          logger.error("API Error", error as Error, {
          requestId,
          endpoint: request.url
        });'获取Bot状态失败:', error);
          return NextResponse.json(
            { success: false, error: '服务器错误' },
            { status: 500 }
          );
        }
}
}
