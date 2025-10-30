// 管理员登录
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import jwt from 'jsonwebtoken';
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

    // 生成管理员 token（包含管理员信息）
    const token = jwt.sign(
      { 
        adminId: admin.id,
        username: admin.username, 
        role: admin.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' } // 管理员token有效期较短
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
          role: admin.role
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
