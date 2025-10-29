import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/stats - 获取后台统计数据
export async function GET(request: NextRequest) {
  try {
    // 验证管理员token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 统计总用户数
    const totalUsers = await prisma.users.count();

    // 统计总订单数
    const totalOrders = await prisma.orders.count();

    // 统计待审核提现数
    const pendingWithdrawals = await prisma.withdrawRequests.count({
      where: {
        status: 'pending'
      }
    });

    // 统计进行中的抽奖轮次
    const activeRounds = await prisma.lotteryRounds.count({
      where: {
        status: 'active'
      }
    });

    // 统计今日新增用户
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsers = await prisma.users.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    // 统计今日订单数
    const todayOrders = await prisma.orders.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    // 统计今日收入（订单总金额）
    const todayRevenue = await prisma.orders.aggregate({
      where: {
        createdAt: {
          gte: today
        },
        status: 'completed'
      },
      _sum: {
        totalAmount: true
      }
    });

    // 统计总收入
    const totalRevenue = await prisma.orders.aggregate({
      where: {
        status: 'completed'
      },
      _sum: {
        totalAmount: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        pendingWithdrawals,
        activeRounds,
        todayUsers,
        todayOrders,
        todayRevenue: todayRevenue._sum.totalAmount?.toString() || '0',
        totalRevenue: totalRevenue._sum.totalAmount?.toString() || '0'
      }
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stats'
    }, { status: 500 });
  }
}
