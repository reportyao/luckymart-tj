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
  const requestId = `history_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('history_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('history_route.ts request failed', error as Error, {
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
          const { searchParams } = new URL(request.url);
          const limit = parseInt(searchParams.get('limit') || '50');

          const history = await prisma.botPushHistory.findMany({
            take: limit,
            orderBy: {
              sendTime: 'desc'
            }
          });

          return NextResponse.json({
            success: true,
            data: history
          });

        } catch (error) {
          logger.error("API Error", error as Error, {
          requestId,
          endpoint: request.url
        });'获取推送历史失败:', error);
          return NextResponse.json(
            { success: false, error: '服务器错误' },
            { status: 500 }
          );
        }
}
}
