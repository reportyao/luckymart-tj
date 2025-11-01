// 管理员 - 提现审核
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';
import type { ApiResponse } from '@/types';

import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';


const withReadPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.withdrawals.read()
});

const withWritePermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.withdrawals.write()
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `withdrawals_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('withdrawals_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('withdrawals_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

    // 获取提现申请列表
    export async function GET(request: NextRequest) {
      return withReadPermission(async (request: any, admin: any) => {
        try {

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // 构建查询条件
        const where: any = {};
        if (status && ['pending', 'processing', 'completed', 'rejected'].includes(status)) {
          where.status = status;
        }

        // 获取提现列表和总数
        const [withdrawals, total] = await Promise.all([
          prisma.withdrawRequests.findMany({
            where,
            include: {
              users: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  telegramId: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit
          }),
          prisma.withdrawRequests.count({ where })
        ]);

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            withdrawals: withdrawals || [],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        });

        } catch (error: any) {
          logger.error("API Error", error as Error, {
          requestId,
          endpoint: request.url
        });'获取提现列表失败:', error);
          return NextResponse.json<ApiResponse>({
            success: false,
            error: error.message || '获取提现列表失败'
          }, { status: 500 });
        }
}
}

// 审核提现申请
export async function POST(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    try {

    const body = await request.json();
    const { withdrawId, action, adminNote } = body;

    // 验证参数
    if (!withdrawId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '无效的参数'
      }, { status: 400 });
    }

    // 生成幂等性请求ID
    const idempotencyKey = `withdraw_review_${withdrawId}_${action}_${Date.now()}`;
    
    // 检查是否已经处理过该请求
    const existingRequest = await prisma.processingLogs.findFirst({
      where: {
        entityId: withdrawId,
        operationType: `withdraw_${action}`,
        status: 'completed'
      }
    });

    if (existingRequest) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: '该提现申请已处理过',
        data: { 
          idempotent: true,
          message: '重复的审核请求已被忽略'
        }
      });
    }

    // 记录处理开始
    const processingLog = await prisma.processingLogs.create({
      data: {
        entityId: withdrawId,
        operationType: `withdraw_${action}`,
        status: 'processing',
        requestId: idempotencyKey,
        createdAt: new Date()
      }
    });

    // 获取提现申请
    const withdraw = await prisma.withdrawRequests.findUnique({
      where: { id: withdrawId }
    });

    if (!withdraw) {
      // 标记处理失败
      await prisma.processingLogs.update({
        where: { id: processingLog.id },
        data: { 
          status: 'failed',
          errorMessage: '提现申请不存在'
        }
      });
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '提现申请不存在'
      }, { status: 404 });
    }

    // 检查提现申请状态，防止重复处理
    if (withdraw.status !== 'pending') {
      // 标记处理失败
      await prisma.processingLogs.update({
        where: { id: processingLog.id },
        data: { 
          status: 'failed',
          errorMessage: `提现申请状态异常: ${withdraw.status}`
        }
      });
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `该提现申请已被处理，状态: ${withdraw.status}`
      }, { status: 400 });
    }

    // 使用事务处理审核操作，并检查状态
    const result = await prisma.$transaction(async (tx: any) => {
      // 使用原子操作检查和更新状态，防止并发处理
      const updateResult = await tx.withdrawRequests.updateMany({
        where: {
          id: withdrawId,
          status: 'pending' // 只有在状态为待处理时才更新
        },
        data: {
          status: action === 'approve' ? 'completed' : 'rejected',
          adminNote: adminNote || (action === 'approve' ? '审核通过' : '审核未通过'),
          processedAt: new Date()
        }
      });

      // 如果没有行被更新，说明已经被处理过
      if (updateResult.count === 0) {
        throw new Error('提现申请已被处理，请刷新页面重试');
      }

      // 获取更新后的提现记录
      const updatedWithdraw = await tx.withdrawRequests.findUnique({
        where: { id: withdrawId }
      });

      if (action === 'approve') {
        // 通过申请 - 扣减用户余额（在实际应用中应该调用外部支付接口）
        await tx.users.update({
          where: { id: withdraw.userId },
          data: {
            balance: {
              decrement: withdraw.amount
            }
          }
        });

        // 记录交易
        await tx.transactions.create({
          data: {
            userId: withdraw.userId,
            type: 'withdraw_approve',
            amount: -withdraw.amount,
            balanceType: 'lottery_coin',
            description: `提现审核通过 - ${withdraw.amount} TJS`
          }
        });

      } else {
        // 拒绝申请 - 恢复用户余额
        await tx.users.update({
          where: { id: withdraw.userId },
          data: {
            balance: {
              increment: withdraw.amount
            }
          }
        });

        // 记录交易
        await tx.transactions.create({
          data: {
            userId: withdraw.userId,
            type: 'withdraw_reject',
            amount: withdraw.amount,
            balanceType: 'lottery_coin',
            description: `提现审核拒绝 - 余额已恢复 ${withdraw.amount} TJS`
          }
        });
      }

      // 创建通知
      const notificationType = action === 'approve' ? 'withdraw_approved' : 'withdraw_rejected';
      const notificationTitle = action === 'approve' ? '提现申请已通过' : '提现申请被拒绝';
      const notificationContent = action === 'approve' 
        ? `您的提现申请已通过审核，金额: ${withdraw.amount} TJS`
        : `您的提现申请已被拒绝，金额: ${withdraw.amount} TJS${adminNote ? `，原因: ${adminNote}` : ''}`;

      await tx.notifications.create({
        data: {
          userId: withdraw.userId,
          type: notificationType,
          title: notificationTitle,
          content: notificationContent,
          status: 'pending'
        }
      });

      return {
        success: true,
        message: `提现申请已${action === 'approve' ? '通过' : '拒绝'}`,
        data: updatedWithdraw
      };
    });

    // 标记处理完成
    await prisma.processingLogs.update({
      where: { id: processingLog.id },
      data: { 
        status: 'completed',
        completedAt: new Date()
      }
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: result.message,
      data: result.data || null
    });

    } catch (error: any) {
      logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'审核提现失败:', error);
      
      // 处理具体的错误信息
      const errorMessage = error.message || '审核提现失败';
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: errorMessage
      }, { status: 500 });
    }
  })(request);
}
