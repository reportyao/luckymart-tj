import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';
import { createTranslation } from '@/lib/createTranslation';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';

const prisma = new PrismaClient();

// 创建权限中间件
const withPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.system.manage()
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `departments_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('departments_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
}
  } catch (error) {
    logger.error('departments_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

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
          logger.error("API Error", error as Error, {
          requestId,
          endpoint: request.url
        });'获取部门列表失败:', error);
          const { t } = await createTranslation(request, 'api-errors');
          return NextResponse.json(;
  }
            { success: false, error: t('errors.serverError') },
            { status: 500 }
          );
        }
}
}

// POST - 创建新部门
export async function POST(request: NextRequest) {
  return withPermission(async (request, admin) => {
    try {
      const body = await request.json();
      const { name, description, parentId, sortOrder } = body;

      // 验证必填字段
      if (!name) {
        return NextResponse.json(;
          { success: false, error: '部门名称不能为空' },
          { status: 400 }
        );
}

      // 检查名称是否已存在
      const existing = await prisma.orgDepartments.findUnique({
        where: { name }
      });

      if (existing) {
        return NextResponse.json(;
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
      logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'创建部门失败:', error);
      const { t } = await createTranslation(request, 'api-errors');
      return NextResponse.json(;
        { success: false, error: t('errors.serverError') },
        { status: 500 }
      );
    }
  })(request);
}
