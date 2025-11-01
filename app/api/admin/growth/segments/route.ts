import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const withPermission = AdminPermissionManager.createPermissionMiddleware({
    customPermissions: AdminPermissions.stats.read()
  });

  return await withPermission(async (request, admin) => {

    // 获取用户总数
    const totalUsers = await prisma.users.count();

    // 获取最近7天注册的用户（新手用户）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const newbieCount = await prisma.users.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    // 获取最近30天有活动的用户（活跃用户）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeCount = await prisma.users.count({
      where: {
        updatedAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // 沉睡用户 = 总用户 - 新手用户 - 活跃用户
    const dormantCount = totalUsers - newbieCount - activeCount;

    // 计算百分比
    const segments = [
      {
        segment: 'newbie',
        count: newbieCount,
        percentage: totalUsers > 0 ? Math.round((newbieCount / totalUsers) * 100) : 0
      },
      {
        segment: 'active',
        count: activeCount,
        percentage: totalUsers > 0 ? Math.round((activeCount / totalUsers) * 100) : 0
      },
      {
        segment: 'dormant',
        count: dormantCount,
        percentage: totalUsers > 0 ? Math.round((dormantCount / totalUsers) * 100) : 0
      }
    ];

    return NextResponse.json({
      success: true,
      data: segments
    });
  })(request);
}
