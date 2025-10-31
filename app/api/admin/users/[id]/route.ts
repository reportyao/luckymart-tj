import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdminPermissionManager } from '@/lib/admin/permissions/AdminPermissionManager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';

// 创建权限中间件
const withReadPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.users.read()
});

const withWritePermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.users.write()
});

// GET - 获取用户详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withReadPermission(async (request, admin) => {
    try {
      const userId = params.id;

      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return NextResponse.json({
          success: false,
          error: '用户不存在'
        }, { status: 404 });
      }

      // 手动查询关联数据
      const [participations, orders, transactions, withdrawRequests] = await Promise.all([
        prisma.participations.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        prisma.orders.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        prisma.transactions.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 20
        }),
        prisma.withdrawRequests.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);

      // 获取参与记录的详细信息
      const participationsWithDetails = await Promise.all(
        participations.map(async (p) => {
          const [product, round] = await Promise.all([
            prisma.products.findUnique({
              where: { id: p.productId },
              select: {
                nameZh: true,
                nameEn: true,
                nameRu: true,
                images: true
              }
            }),
            prisma.lotteryRounds.findUnique({
              where: { id: p.roundId },
              select: {
                roundNumber: true,
                status: true,
                winningNumber: true
              }
            })
          ]);

          return {
            id: p.id,
            productName: product?.nameZh || '',
            numbers: p.numbers,
            sharesCount: p.sharesCount,
            type: p.type,
            cost: Number(p.cost),
            isWinner: p.isWinner,
            roundNumber: round?.roundNumber || 0,
            roundStatus: round?.status || '',
            winningNumber: round?.winningNumber || null,
            createdAt: p.createdAt.toISOString()
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: user.id,
            telegramId: user.telegramId.toString(),
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
            language: user.language,
            balance: Number(user.balance),
            platformBalance: Number(user.platformBalance),
            vipLevel: user.vipLevel,
            totalSpent: Number(user.totalSpent),
            freeDailyCount: user.freeDailyCount,
            lastFreeResetDate: user.lastFreeResetDate.toISOString(),
            createdAt: user.createdAt.toISOString(),
            participations: participationsWithDetails,
            orders: orders.map(o => ({
              id: o.id,
              orderNumber: o.orderNumber,
              type: o.type,
              totalAmount: Number(o.totalAmount),
              paymentStatus: o.paymentStatus,
              fulfillmentStatus: o.fulfillmentStatus,
              createdAt: o.createdAt.toISOString()
            })),
            transactions: transactions.map(t => ({
              id: t.id,
              type: t.type,
              amount: Number(t.amount),
              balanceType: t.balanceType,
              description: t.description,
              createdAt: t.createdAt.toISOString()
            })),
            withdrawRequests: withdrawRequests.map(w => ({
              id: w.id,
              amount: Number(w.amount),
              fee: Number(w.fee),
              actualAmount: Number(w.actualAmount),
              status: w.status,
              createdAt: w.createdAt.toISOString()
            }))
          }
        }
      });
    } catch (error: any) {
      console.error('Get user error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || '获取用户详情失败'
      }, { status: 500 });
    }
  })(request);
}

// POST - 手动充值夺宝币
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withWritePermission(async (request, admin) => {
    try {
      const userId = params.id;
      const body = await request.json();
      const { amount, note } = body;

      if (!amount || amount <= 0) {
        return NextResponse.json({
          success: false,
          error: '充值金额必须大于0'
        }, { status: 400 });
      }

      // 执行充值
      await prisma.$transaction(async (tx) => {
        // 更新用户余额
        await tx.users.update({
          where: { id: userId },
          data: {
            balance: { increment: amount }
          }
        });

        // 记录交易
        await tx.transactions.create({
          data: {
            userId,
            type: 'admin_recharge',
            amount: amount,
            balanceType: 'lottery_coin',
            description: `管理员充值：${note || '手动充值'}`
          }
        });
      });

      return NextResponse.json({
        success: true,
        data: {
          message: '充值成功',
          amount
        }
      });
    } catch (error: any) {
      console.error('Recharge user error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || '充值失败'
      }, { status: 500 });
    }
  })(request);
}
