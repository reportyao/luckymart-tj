// 管理员权限验证 - 完整使用示例
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';
import { requireAdminPermission } from '@/lib/admin-auth-middleware';

// ==================== 示例1: 基础权限验证 ====================
export async function GET_basic_example(request: NextRequest) {
  try {
    // 验证管理员身份
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({
        success: false,
        error: '管理员权限验证失败',
        code: 'ADMIN_UNAUTHORIZED'
      }, { status: 403 });
    }

    // 检查特定权限
    const hasPermission = admin.permissions.includes('users:read') || admin.role === 'super_admin';
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: '权限不足：无法查看用户列表',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: 'users:read'
      }, { status: 403 });
    }

    // 业务逻辑...
    return NextResponse.json({
      success: true,
      data: { message: '权限验证通过' }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 });
  }
}

// ==================== 示例2: 使用权限中间件 ====================
export async function GET_middleware_example(request: NextRequest) {
  // 创建权限中间件
  const withPermission = AdminPermissionManager.createPermissionMiddleware({
    customPermissions: AdminPermissions.products.all()
  });

  return withPermission(async (request, admin) => {
    // 业务逻辑 - 只有具有商品管理权限的管理员才能访问
    return NextResponse.json({
      success: true,
      data: { 
        message: '商品管理权限验证通过',
        admin: admin.username 
      }
    });
  })(request);
}

// ==================== 示例3: 使用装饰器中间件 ====================
export async function POST_decorator_example(request: NextRequest) {
  const withOrderManage = requireAdminPermission('orders', 'write');
  
  return withOrderManage(async (request, admin) => {
    const body = await request.json();
    
    // 处理订单...
    return NextResponse.json({
      success: true,
      data: { 
        message: '订单处理成功',
        admin: admin.username 
      }
    });
  })(request);
}

// ==================== 示例4: 超级管理员专用 ====================
export async function GET_superadmin_example(request: NextRequest) {
  const withSuperAdmin = AdminPermissionManager.createPermissionMiddleware({
    requireSuperAdmin: true
  });

  return withSuperAdmin(async (request, admin) => {
    // 只有超级管理员才能访问
    return NextResponse.json({
      success: true,
      data: { 
        message: '系统管理权限验证通过',
        admin: admin.username,
        role: admin.role
      }
    });
  })(request);
}

// ==================== 示例5: 多权限组合 ====================
export async function PUT_multi_permission_example(request: NextRequest) {
  // 需要同时具有多个权限
  const withMultiPermission = AdminPermissionManager.createPermissionMiddleware({
    customPermissions: [
      'users:read',
      'users:write',
      'orders:read',
      'stats:read'
    ]
  });

  return withMultiPermission(async (request, admin) => {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      data: { 
        message: '多权限验证通过',
        admin: admin.username,
        permissions: admin.permissions
      }
    });
  })(request);
}

// ==================== 示例6: 完整的管理员API结构 ====================

/**
 * 管理员用户管理API示例
 * GET /api/admin/users
 */
export async function GET_admin_users_example(request: NextRequest) {
  const withPermission = AdminPermissionManager.createPermissionMiddleware({
    customPermissions: AdminPermissions.users.read()
  });

  return withPermission(async (request, admin) => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // 构建查询条件
    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { telegramId: { equals: search } }
      ];
    }

    // TODO: 使用Prisma查询数据库
    // const [users, total] = await Promise.all([
    //   prisma.users.findMany({
    //     where,
    //     skip: (page - 1) * limit,
    //     take: limit,
    //     orderBy: { createdAt: 'desc' }
    //   }),
    //   prisma.users.count({ where })
    // ]);

    return NextResponse.json({
      success: true,
      data: {
        users: [], // users,
        pagination: {
          page,
          limit,
          total: 0, // total,
          totalPages: 0 // Math.ceil(total / limit)
        },
        admin: {
          id: admin.adminId,
          username: admin.username,
          role: admin.role
        }
      }
    });
  })(request);
}

/**
 * 管理员商品管理API示例
 * POST /api/admin/products
 */
export async function POST_admin_products_example(request: NextRequest) {
  const withPermission = AdminPermissionManager.createPermissionMiddleware({
    customPermissions: AdminPermissions.products.write()
  });

  return withPermission(async (request, admin) => {
    const body = await request.json();
    const { nameZh, nameEn, nameRu, marketPrice, totalShares } = body;

    // 验证必填字段
    if (!nameZh || !nameEn || !nameRu || !marketPrice || !totalShares) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段'
      }, { status: 400 });
    }

    // TODO: 使用Prisma创建商品
    // const product = await prisma.products.create({
    //   data: {
    //     nameZh,
    //     nameEn,
    //     nameRu,
    //     marketPrice: parseFloat(marketPrice),
    //     totalShares: parseInt(totalShares),
    //     status: 'active'
    //   }
    // });

    return NextResponse.json({
      success: true,
      data: {
        // productId: product.id,
        message: '商品创建成功',
        admin: admin.username
      }
    });
  })(request);
}

// ==================== 错误处理示例 ====================

/**
 * 统一错误响应格式
 */
function createErrorResponse(
  success: boolean,
  error: string,
  code: string,
  status: number,
  extra?: any
): NextResponse {
  return NextResponse.json({
    success,
    error,
    code,
    ...(extra && { data: extra })
  }, { status });
}

// 预定义错误响应
export const ErrorResponses = {
  unauthorized: () => createErrorResponse(
    false,
    '管理员权限验证失败',
    'ADMIN_UNAUTHORIZED',
    403
  ),
  
  insufficientPermissions: (required: string[], missing?: string[]) => createErrorResponse(
    false,
    `权限不足：需要 [${required.join(', ')}] 权限`,
    'INSUFFICIENT_PERMISSIONS',
    403,
    { required, missing }
  ),
  
  superAdminRequired: () => createErrorResponse(
    false,
    '需要超级管理员权限',
    'SUPER_ADMIN_REQUIRED',
    403
  ),
  
  authFailed: () => createErrorResponse(
    false,
    '管理员认证失败',
    'ADMIN_AUTH_FAILED',
    401
  )
};