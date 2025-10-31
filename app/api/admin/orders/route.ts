// 管理员 - 订单管理
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';
import type { ApiResponse } from '@/types';
import { rewardTrigger } from '@/lib/reward-trigger-manager';
import { getLogger } from '@/lib/logger';
import { getMonitor } from '@/lib/monitoring';
import { createOrderValidationMiddleware, ORDER_VALIDATION_MIDDLEWARES } from '@/lib/order-validation-middleware';
import { ErrorFactory } from '@/lib/errors';

// 获取订单列表
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

    // 检查订单查看权限
    const hasPermission = admin.permissions.includes('orders:read') || admin.role === 'super_admin';
    if (!hasPermission) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '权限不足：无法查看订单列表'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // 获取订单列表和总数
    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        include: {
          users: {
            select: {
              username: true,
              firstName: true,
              telegramId: true
            }
          },
          products: {
            select: {
              nameZh: true,
              nameEn: true,
              images: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.orders.count({ where })
    ]);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        orders: orders || [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('获取订单列表失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '获取订单列表失败'
    }, { status: 500 });
  }
}

// 更新订单状态（发货）
export async function POST(request: NextRequest) {
  const logger = getLogger();
  const monitor = getMonitor();
  const operationSpan = monitor.startSpan('order_ship');

  try {
    // 验证管理员权限
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '管理员权限验证失败'
      }, { status: 403 });
    }

    // 检查订单管理权限
    const hasPermission = admin.permissions.includes('orders:write') || admin.role === 'super_admin';
    if (!hasPermission) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '权限不足：无法更新订单状态'
      }, { status: 403 });
    }

    // 使用订单验证中间件
    return await ORDER_VALIDATION_MIDDLEWARES.admin(request, async (req, validatedData) => {
      const body = validatedData;
      const { orderId, trackingNumber, updateType = 'ship' } = body;

      // 额外验证更新操作特有参数
      if (!orderId) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: '缺少必填参数：orderId'
        }, { status: 400 });
      }

    // 生成幂等性请求ID
    const idempotencyKey = `order_update_${orderId}_${updateType}_${Date.now()}`;
    
    // 检查是否已经处理过该请求
    const existingRequest = await prisma.processingLogs.findFirst({
      where: {
        entityId: orderId,
        operationType: `order_${updateType}`,
        status: 'completed'
      }
    });

    if (existingRequest) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: '该订单操作已处理过',
        data: { 
          idempotent: true,
          message: '重复的订单操作已被忽略'
        }
      });
    }

    // 记录处理开始
    const processingLog = await prisma.processingLogs.create({
      data: {
        entityId: orderId,
        operationType: `order_${updateType}`,
        status: 'processing',
        requestId: idempotencyKey,
        createdAt: new Date()
      }
    });

    // 获取订单
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        users: {
          select: {
            referred_by_user_id: true,
            has_first_purchase: true
          }
        }
      }
    });

    if (!order) {
      // 标记处理失败
      await prisma.processingLogs.update({
        where: { id: processingLog.id },
        data: { 
          status: 'failed',
          errorMessage: '订单不存在'
        }
      });
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '订单不存在'
      }, { status: 404 });
    }

    // 检查订单状态并使用原子操作更新，防止并发处理
    let newStatus = order.status;
    let shouldTriggerReward = false;

    if (updateType === 'ship' && order.status === 'pending_shipment') {
      // 使用原子操作检查和更新，防止并发发货
      const updateResult = await prisma.orders.updateMany({
        where: {
          id: orderId,
          status: 'pending_shipment'
        },
        data: {
          status: 'shipped',
          trackingNumber: trackingNumber,
          updatedAt: new Date()
        }
      });

      // 如果没有行被更新，说明状态已改变
      if (updateResult.count === 0) {
        await prisma.processingLogs.update({
          where: { id: processingLog.id },
          data: { 
            status: 'failed',
            errorMessage: `订单状态异常，当前状态: ${order.status}`
          }
        });
        
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `订单状态已变化，请刷新页面重试`
        }, { status: 400 });
      }

      newStatus = 'shipped';
      
    } else if (updateType === 'complete' && order.status === 'shipped') {
      // 使用原子操作检查和更新，防止并发完成
      const updateResult = await prisma.orders.updateMany({
        where: {
          id: orderId,
          status: 'shipped'
        },
        data: {
          status: 'completed',
          fulfillmentStatus: 'completed',
          updatedAt: new Date()
        }
      });

      // 如果没有行被更新，说明状态已改变
      if (updateResult.count === 0) {
        await prisma.processingLogs.update({
          where: { id: processingLog.id },
          data: { 
            status: 'failed',
            errorMessage: `订单状态异常，当前状态: ${order.status}`
          }
        });
        
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `订单状态已变化，请刷新页面重试`
        }, { status: 400 });
      }

      newStatus = 'completed';
      shouldTriggerReward = true;
      
      // 标记用户已完成首次购买
      await prisma.users.update({
        where: { id: order.userId },
        data: { has_first_purchase: true }
      });
      
    } else {
      await prisma.processingLogs.update({
        where: { id: processingLog.id },
        data: { 
          status: 'failed',
          errorMessage: `状态转换错误: ${order.status} -> ${updateType}`
        }
      });
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `无法从状态 ${order.status} 更新为 ${updateType}`
      }, { status: 400 });
    }

    // 发送通知（在事务外处理，通知失败不影响主要业务）
    try {
      const notificationType = updateType === 'ship' ? 'order_shipped' : 'order_completed';
      const notificationTitle = updateType === 'ship' ? '商品已发货' : '订单已完成';
      const notificationContent = updateType === 'ship' 
        ? `您的订单 ${order.orderNumber} 已发货，物流单号：${trackingNumber}`
        : `您的订单 ${order.orderNumber} 已完成，感谢您的购买！`;

      await prisma.notifications.create({
        data: {
          userId: order.userId,
          type: notificationType,
          title: notificationTitle,
          content: notificationContent,
          status: 'pending'
        }
      });
    } catch (notificationError) {
      logger.warn('发送通知失败', notificationError as Error, { orderId });
      // 通知失败不影响主要业务逻辑
    }

    // 触发邀请奖励（如果需要）
    let rewardResult = null;
    if (shouldTriggerReward && order.users.referred_by_user_id) {
      try {
        const rewardType = !order.users.has_first_purchase ? 'FIRST_PURCHASE' : 'ORDER_COMPLETION';
        
        rewardResult = await rewardTrigger.triggerReward({
          type: rewardType,
          userId: order.userId,
          data: {
            orderId: order.id,
            orderAmount: order.totalAmount,
            orderNumber: order.orderNumber
          },
          timestamp: new Date()
        });

        logger.info('订单奖励触发结果', {
          orderId: order.id,
          rewardType,
          rewardSuccess: rewardResult.success,
          totalRewards: rewardResult.result?.totalRewards || 0
        });

        monitor.increment(`order_reward_trigger_${rewardType.toLowerCase()}_success_total`, 1);

      } catch (rewardError) {
        logger.warn('订单奖励触发失败', rewardError as Error, {
          orderId: order.id,
          userId: order.userId,
          rewardType: shouldTriggerReward ? 'FIRST_PURCHASE' : 'ORDER_COMPLETION'
        });

        monitor.increment(`order_reward_trigger_${shouldTriggerReward ? 'first_purchase' : 'order_completion'}_error_total`, 1);
      }
    }

    // 标记处理完成
    await prisma.processingLogs.update({
      where: { id: processingLog.id },
      data: { 
        status: 'completed',
        completedAt: new Date()
      }
    });

    operationSpan.finish(true, {
      orderId: order.id,
      updateType,
      hasReferral: !!order.users.referred_by_user_id,
      shouldTriggerReward,
      rewardTriggered: !!rewardResult?.success
    });

    const successMessage = updateType === 'ship' ? '发货成功' : '订单完成';
    const rewardMessage = rewardResult?.success ? `，邀请奖励已发放（${rewardResult.result?.totalRewards || 0}币）` : '';

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `${successMessage}${rewardMessage}`,
      data: {
        orderId: order.id,
        newStatus,
        rewardTriggered: !!rewardResult?.success,
        totalRewards: rewardResult?.result?.totalRewards || 0
      }
    });

  } catch (error: any) {
    operationSpan.finish(false, {
      error: error.message
    });

    monitor.increment('order_update_error_total', 1);

    logger.error('订单状态更新失败', error as Error, { 
      orderId: body?.orderId,
      updateType: body?.updateType 
    });

      return NextResponse.json<ApiResponse>({
        success: false,
        error: error.message || '订单状态更新失败'
      }, { status: 500 });
    }
  });
}
