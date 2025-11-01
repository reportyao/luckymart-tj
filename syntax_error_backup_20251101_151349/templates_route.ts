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
      const templates = await prisma.botPushTemplates.findMany({
        orderBy: {
          messageType: 'asc'
}
      });

      return NextResponse.json({
        success: true,
        data: templates
      });

    } catch (error) {
      console.error('获取推送模板失败:', error);
      return NextResponse.json(;
        { success: false, error: '服务器错误' },
        { status: 500 }
      );
    }
  })(request);
}
