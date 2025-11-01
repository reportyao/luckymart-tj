import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
import { respond } from '@/lib/responses';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `my-permissions_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('my-permissions_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('my-permissions_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

}

export async function GET(request: NextRequest) {
  const withPermission = AdminPermissionManager.createPermissionMiddleware();

  return await withPermission(async (request, admin) => {
    try {
      // 获取管理员最新权限
      const permissions = await AdminPermissionManager.getAdminPermissions(admin.adminId);

      return NextResponse.json({
        success: true,
        data: {
          adminId: admin.adminId,
          username: admin.username,
          role: admin.role,
          permissions: admin.role === 'super_admin' ? ['*:*'] : permissions
        },
        permissions: admin.role === 'super_admin' ? ['*:*'] : permissions
      });
    } catch (error) {
      logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'获取权限失败:', error);
      return NextResponse.json({
        success: false,
        error: '获取权限失败'
      }, { status: 500 });
    }
  })(request);
}
