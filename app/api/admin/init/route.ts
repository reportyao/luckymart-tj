import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// 初始化管理员账号 - 仅供首次设置使用
export async function POST(request: Request) {
  try {
    // 检查是否已存在管理员
    const existing = await prisma.admins.findFirst({
      where: { username: 'admin' }
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: '管理员账号已存在'
      });
    }

    // 创建管理员账号
    const passwordHash = await bcrypt.hash('admin123456', 10);
    
    const admin = await prisma.admins.create({
      data: {
        username: 'admin',
        passwordHash,
        role: 'super_admin'
      }
    });

    return NextResponse.json({
      success: true,
      message: '管理员账号创建成功',
      data: {
        username: 'admin',
        defaultPassword: 'admin123456'
      }
    });

  } catch (error: any) {
    console.error('创建管理员失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
