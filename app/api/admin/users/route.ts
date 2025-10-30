import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';
import QueryOptimizer from '@/lib/query-optimizer';

// GET - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({
        success: false,
        error: '管理员权限验证失败'
      }, { status: 403 });
    }

    // 检查是否有用户查看权限
    const hasPermission = admin.permissions.includes('users:read') || admin.role === 'super_admin';
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: '权限不足：无法查看用户列表'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // 使用优化后的查询方法
    const result = await QueryOptimizer.getOptimizedUsersList({
      page,
      limit,
      search
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '获取用户列表失败'
    }, { status: 500 });
  }
}
