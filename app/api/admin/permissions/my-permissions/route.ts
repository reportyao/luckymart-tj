import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';

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
      console.error('获取权限失败:', error);
      return NextResponse.json({
        success: false,
        error: '获取权限失败'
      }, { status: 500 });
    }
  })(request);
}
