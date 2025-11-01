import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';
import { createTranslation } from '@/lib/createTranslation';


const prisma = new PrismaClient();

// 创建权限中间件
const withPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.system.manage()
});

// PATCH - 更新部门
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(async (request, admin) => {
    try {
      const body = await request.json();
      const { id } = params;

      const department = await prisma.orgDepartments.update({
        where: { id },
        data: body
      });

      return NextResponse.json({
        success: true,
        data: department
      });

    } catch (error) {
      logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'更新部门失败:', error);
      const { t } = await createTranslation(request, 'api-errors');
      return NextResponse.json(;
        { success: false, error: t('errors.serverError') },
        { status: 500 }
      );
}
  })(request);
}

// DELETE - 删除部门
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(async (request, admin) => {
    try {
      const { id } = params;

      // 检查是否有子部门
      const children = await prisma.orgDepartments.count({
        where: { parentId: id }
      });

      if (children > 0) {
        return NextResponse.json(;
          { success: false, error: '该部门下还有子部门，无法删除' },
          { status: 400 }
        );
}

      await prisma.orgDepartments.delete({
        where: { id }
      });

      return NextResponse.json({
        success: true,
        message: '删除成功'
      });

    } catch (error) {
      logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'删除部门失败:', error);
      const { t } = await createTranslation(request, 'api-errors');
      return NextResponse.json(;
        { success: false, error: t('errors.serverError') },
        { status: 500 }
      );
    }
  })(request);
}
