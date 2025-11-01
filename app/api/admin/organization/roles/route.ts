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
  const requestId = `roles_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('roles_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
}
  } catch (error) {
    logger.error('roles_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

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
          logger.error("API Error", error as Error, {
          requestId,
          endpoint: request.url
        });'获取角色列表失败:', error);
          const { t } = await createTranslation(request, 'api-errors');
          return NextResponse.json(;
  }
            { success: false, error: t('errors.serverError') },
            { status: 500 }
          );
        }
}
}

// POST - 创建新角色
export async function POST(request: NextRequest) {
  return withPermission(async (request, admin) => {
    try {
      const body = await request.json();
      const { name, description, departmentId, permissions } = body;

      if (!name) {
        return NextResponse.json(;
          { success: false, error: '角色名称不能为空' },
          { status: 400 }
        );
}

      const existing = await prisma.orgRoles.findUnique({
        where: { name }
      });

      if (existing) {
        return NextResponse.json(;
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
      logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'创建角色失败:', error);
      const { t } = await createTranslation(request, 'api-errors');
      return NextResponse.json(;
        { success: false, error: t('errors.serverError') },
        { status: 500 }
      );
    }
  })(request);
}
