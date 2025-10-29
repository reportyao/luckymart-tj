// 管理员登录
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken, verifyPassword } from '@/lib/auth';
import type { ApiResponse } from '@/types';

export async function POST(request: Request) {
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

    // 验证密码
    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '用户名或密码错误'
      }, { status: 401 });
    }

    // 生成 token
    const token = generateToken(admin.id, `admin_${admin.id}`);

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
          role: admin.role
        }
      },
      message: '登录成功'
    });

  } catch (error: any) {
    console.error('管理员登录失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '登录失败'
    }, { status: 500 });
  }
}
