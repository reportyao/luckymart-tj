import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AdminPermissionManager } from '@/lib/admin/permissions/AdminPermissionManager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';

const prisma = new PrismaClient();

// 创建权限中间件
const withPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.system.manage()
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
      console.error('获取推送历史失败:', error);
      return NextResponse.json(
        { success: false, error: '服务器错误' },
        { status: 500 }
      );
    }
  })(request);
}
