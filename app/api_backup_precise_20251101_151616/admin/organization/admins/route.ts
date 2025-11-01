import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AdminPermissionManager } from '@/lib/admin/permissions/AdminPermissionManager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';

const prisma = new PrismaClient();

// 创建权限中间件
const withPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.system.manage()
});

// GET - 获取所有管理员
export async function GET(request: NextRequest) {
  return withPermission(async (request, admin) => {
    try {
      const admins = await prisma.admins.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true
          // 不返回密码哈希
        }
      });

      return NextResponse.json({
        success: true,
        data: admins
      });

    } catch (error) {
      console.error('获取管理员列表失败:', error);
      return NextResponse.json(
        { success: false, error: '服务器错误' },
        { status: 500 }
      );
    }
  })(request);
}
