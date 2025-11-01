import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AdminPermissionManager } from '@/lib/admin/permissions/AdminPermissionManager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';

const prisma = new PrismaClient();

// 创建权限中间件
const withPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.system.manage()
});

// GET - 获取所有部门
export async function GET(request: NextRequest) {
  return withPermission(async (request, admin) => {
    try {
      const departments = await prisma.orgDepartments.findMany({
        orderBy: {
          sortOrder: 'asc'
        }
      });

      return NextResponse.json({
        success: true,
        data: departments
      });

    } catch (error) {
      console.error('获取部门列表失败:', error);
      return NextResponse.json(
        { success: false, error: '服务器错误' },
        { status: 500 }
      );
    }
  })(request);
}

// POST - 创建新部门
export async function POST(request: NextRequest) {
  return withPermission(async (request, admin) => {
    try {
      const body = await request.json();
      const { name, description, parentId, sortOrder } = body;

      // 验证必填字段
      if (!name) {
        return NextResponse.json(
          { success: false, error: '部门名称不能为空' },
          { status: 400 }
        );
      }

      // 检查名称是否已存在
      const existing = await prisma.orgDepartments.findUnique({
        where: { name }
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: '部门名称已存在' },
          { status: 400 }
        );
      }

      const department = await prisma.orgDepartments.create({
        data: {
          name,
          description: description || null,
          parentId: parentId || null,
          sortOrder: sortOrder || 0,
          isActive: true
        }
      });

      return NextResponse.json({
        success: true,
        data: department
      });

    } catch (error) {
      console.error('创建部门失败:', error);
      return NextResponse.json(
        { success: false, error: '服务器错误' },
        { status: 500 }
      );
    }
  })(request);
}
