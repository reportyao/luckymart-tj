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

// GET - 获取所有角色
export async function GET(request: NextRequest) {
  return withPermission(async (request, admin) => {
    try {
      const roles = await prisma.orgRoles.findMany({
        orderBy: {
          sortOrder: 'asc'
        }
      });

      return NextResponse.json({
        success: true,
        data: roles
      });

    } catch (error) {
      console.error('获取角色列表失败:', error);
      const { t } = await createTranslation(request, 'api-errors');
      return NextResponse.json(
        { success: false, error: t('errors.serverError') },
        { status: 500 }
      );
    }
  })(request);
}

// POST - 创建新角色
export async function POST(request: NextRequest) {
  return withPermission(async (request, admin) => {
    try {
      const body = await request.json();
      const { name, description, departmentId, permissions } = body;

      if (!name) {
        return NextResponse.json(
          { success: false, error: '角色名称不能为空' },
          { status: 400 }
        );
      }

      const existing = await prisma.orgRoles.findUnique({
        where: { name }
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: '角色名称已存在' },
          { status: 400 }
        );
      }

      const role = await prisma.orgRoles.create({
        data: {
          name,
          description: description || null,
          departmentId: departmentId || null,
          permissions: permissions || {},
          isActive: true,
          sortOrder: 0
        }
      });

      return NextResponse.json({
        success: true,
        data: role
      });

    } catch (error) {
      console.error('创建角色失败:', error);
      const { t } = await createTranslation(request, 'api-errors');
      return NextResponse.json(
        { success: false, error: t('errors.serverError') },
        { status: 500 }
      );
    }
  })(request);
}
