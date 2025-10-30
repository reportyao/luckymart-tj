// 管理员 - 提现审核
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';
import type { ApiResponse } from '@/types';

// 获取提现申请列表
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '管理员权限验证失败'
      }, { status: 403 });
    }

    // 检查提现查看权限
    const hasPermission = admin.permissions.includes('withdrawals:read') || admin.role === 'super_admin';
    if (!hasPermission) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '权限不足：无法查看提现列表'
      }, { status: 403 });
    }

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
    console.error('获取提现列表失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '获取提现列表失败'
    }, { status: 500 });
  }
}

// 审核提现申请
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '管理员权限验证失败'
      }, { status: 403 });
    }

    // 检查提现管理权限
    const hasPermission = admin.permissions.includes('withdrawals:write') || admin.role === 'super_admin';
    if (!hasPermission) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '权限不足：无法处理提现申请'
      }, { status: 403 });
    }

    const body = await request.json();
    const { withdrawId, action, adminNote } = body;

    // 验证参数
    if (!withdrawId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '无效的参数'
      }, { status: 400 });
    }

    // 获取提现申请（为了验证申请存在性）
    const withdraw = await prisma.withdrawRequests.findUnique({
      where: { id: withdrawId }
    });

    if (!withdraw) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '提现申请不存在'
      }, { status: 404 });
    }

    // 使用事务处理审核操作
    const result = await prisma.$transaction(async (tx) => {
      if (action === 'approve') {
        // 通过申请 - 更新状态并扣减用户余额
        const updatedWithdraw = await tx.withdrawRequests.update({
          where: { id: withdrawId },
          data: {
            status: 'completed',
            adminNote: adminNote || '审核通过',
            processedAt: new Date()
          }
        });

        // 扣减用户余额（在实际应用中应该调用外部支付接口）
        await tx.users.update({
          where: { id: withdraw.userId },
          data: {
            balance: {
              decrement: withdraw.amount
            }
          }
        });

        return {
          success: true,
          message: '提现申请已通过',
          data: updatedWithdraw
        };
        
      } else {
        // 拒绝申请 - 恢复用户余额并更新状态
        const updatedWithdraw = await tx.withdrawRequests.update({
          where: { id: withdrawId },
          data: {
            status: 'rejected',
            adminNote: adminNote || '审核未通过',
            processedAt: new Date()
          }
        });

        // 恢复用户余额
        await tx.users.update({
          where: { id: withdraw.userId },
          data: {
            balance: {
              increment: withdraw.amount
            }
          }
        });

        return {
          success: true,
          message: '提现申请已拒绝',
          data: updatedWithdraw
        };
      }
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: result.message,
      data: result.data || null
    });

  } catch (error: any) {
    console.error('审核提现失败:', error);
    
    // 处理具体的错误信息
    let errorMessage = error.message || '审核提现失败';
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
