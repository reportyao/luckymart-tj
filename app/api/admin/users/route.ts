import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({
        success: false,
        error: '未授权'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { telegramId: { equals: search } }
      ].filter(item => item.telegramId === undefined || search.trim().length > 0);
    }

    // 获取用户列表和总数
    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.users.count({ where })
    ]);

    // 手动获取每个用户的统计数据
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const [participationCount, orderCount, transactionCount] = await Promise.all([
          prisma.participations.count({ where: { userId: u.id } }),
          prisma.orders.count({ where: { userId: u.id } }),
          prisma.transactions.count({ where: { userId: u.id } })
        ]);

        return {
          id: u.id,
          telegramId: u.telegramId, // 现在已经是String类型
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          language: u.language,
          balance: Number(u.balance),
          platformBalance: Number(u.platformBalance),
          vipLevel: u.vipLevel,
          totalSpent: Number(u.totalSpent),
          createdAt: u.createdAt.toISOString(),
          stats: {
            participations: participationCount,
            orders: orderCount,
            transactions: transactionCount
          }
        };
      })
    );

    // 获取统计数据
    const stats = await prisma.users.aggregate({
      _sum: {
        balance: true,
        platformBalance: true,
        totalSpent: true
      },
      _count: true
    });

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          totalUsers: stats._count,
          totalBalance: Number(stats._sum.balance || 0),
          totalPlatformBalance: Number(stats._sum.platformBalance || 0),
          totalSpent: Number(stats._sum.totalSpent || 0)
        }
      }
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '获取用户列表失败'
    }, { status: 500 });
  }
}
