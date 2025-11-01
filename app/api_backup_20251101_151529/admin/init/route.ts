import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// 初始化管理员账号 - 仅供首次设置使用，增加IP白名单限制
export async function POST(request: Request) {
  try {
    // 检查请求来源IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // 只允许特定IP访问（默认localhost）
    const allowedIPs = process.env.ALLOWED_INIT_IPS?.split(',') || ['127.0.0.1'];
    if (!allowedIPs.includes(clientIP)) {
      return NextResponse.json(
        { error: '无权访问此端点' }, 
        { status: 403 }
      );
    }

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

    // 生成随机密码而不是使用硬编码
    const defaultPassword = `admin${Date.now().toString().slice(-6)}`;
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    
    const admin = await prisma.admins.create({
      data: {
        username: 'admin',
        passwordHash,
        role: 'super_admin',
        createdAt: new Date(),
        isActive: true
      }
    });

    // 不再在响应中返回默认密码，只返回成功信息
    return NextResponse.json({
      success: true,
      message: '管理员账号创建成功',
      data: {
        username: 'admin',
        // 不返回密码信息，避免泄露
      }
    });

  } catch (error: any) {
    console.error('创建管理员失败:', error);
    // 统一错误处理，不暴露敏感信息
    return NextResponse.json(
      { error: '创建管理员账号失败' }, 
      { status: 500 }
    );
  }
}
