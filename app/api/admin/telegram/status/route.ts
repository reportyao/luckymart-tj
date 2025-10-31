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
      console.error('获取Bot状态失败:', error);
      return NextResponse.json(
        { success: false, error: '服务器错误' },
        { status: 500 }
      );
    }
  })(request);
}
