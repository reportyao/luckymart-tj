// 管理员登录
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateAdminToken } from '@/lib/auth';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 验证参数
    if (!username || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '用户名和密码不能为空'
      }, { status: 400 });
    }

    // 查询管理员（使用Prisma）
    const admin = await prisma.admins.findFirst({
      where: { username }
    });

    if (!admin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '用户名或密码错误'
      }, { status: 401 });
    }

    // 检查管理员是否激活
    if (!admin.isActive) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '账户已被禁用'
      }, { status: 403 });
    }

    // 验证密码
    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '用户名或密码错误'
      }, { status: 401 });
    }

    // 获取管理员权限
    const permissions = await prisma.adminPermissions.findMany({
      where: { adminId: admin.id }
    });

    // 构建权限数组
    const permissionStrings = permissions.map(p => `${p.resource}:${p.action}`);

    // 生成管理员 token（使用管理员专用JWT）
    const token = generateAdminToken(
      admin.id,
      admin.username,
      admin.role,
      permissionStrings
    );

    // 更新最后登录时间
    await prisma.admins.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() }
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role,
          permissions: permissionStrings
        }
      },
      message: '登录成功'
    });

  } catch (error: any) {
    console.error('管理员登录失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '登录失败'
    }, { status: 500 });
  }
}
