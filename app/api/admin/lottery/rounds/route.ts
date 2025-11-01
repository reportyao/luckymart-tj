import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';

import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';


const withReadPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.lottery.read()
});

const withWritePermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.lottery.write()
});

// GET - 获取开奖轮次列表
export async function GET(request: NextRequest) {
  return withReadPermission(async (request, admin) => {
    try {

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // 查询轮次
    const [rounds, total] = await Promise.all([
      prisma.lotteryRounds.findMany({
        where: { status },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.lotteryRounds.count({ where: { status } })
    ]);

    // 手动查询产品信息和中奖用户信息
    const roundsWithDetails = await Promise.all(
      rounds.map(async (r) => {
        const product = await prisma.products.findUnique({
          where: { id: r.productId },
          select: {
            nameZh: true,
            nameEn: true,
            nameRu: true
          }
        });

        let winner = null;
        if (r.winnerUserId) {
          winner = await prisma.users.findUnique({
            where: { id: r.winnerUserId },
            select: {
              id: true,
              username: true,
              firstName: true
            }
          });
        }

        return {
          id: r.id,
          productId: r.productId,
          productName: product?.nameZh || '',
          roundNumber: r.roundNumber,
          totalShares: r.totalShares,
          soldShares: r.soldShares,
          status: r.status,
          winnerUserId: r.winnerUserId,
          winnerUsername: winner?.username || null,
          winningNumber: r.winningNumber,
          drawTime: r.drawTime?.toISOString() || null,
          createdAt: r.createdAt.toISOString()
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        rounds: roundsWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
    } catch (error: any) {
      console.error('Get rounds error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || '获取轮次失败'
      }, { status: 500 });
    }
  })(request);
}
