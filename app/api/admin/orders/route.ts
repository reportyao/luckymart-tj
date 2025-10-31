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

// 订单状态更新请求体
interface OrderUpdateRequest {
  orderId: string;
  trackingNumber?: string;
  updateType?: 'ship' | 'complete';
}

// 获取订单列表
export async function GET(request: NextRequest) {
  const logger = getLogger();
  
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
              id: true,
              username: true,
              email: true,
              referred_by_user_id: true,
              has_first_purchase: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.orders.count({ where })
    ]);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('获取订单列表失败', error as Error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '获取订单列表失败'
    }, { status: 500 });
  }
}

// 更新订单状态
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

    // 验证请求体
    const body: OrderUpdateRequest = await request.json();
    const { orderId, trackingNumber, updateType = 'ship' } = body;

    // 验证必填参数
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
      
    } else {
      // 标记处理失败
      await prisma.processingLogs.update({
        where: { id: processingLog.id },
        data: { 
          status: 'failed',
          errorMessage: `无效的状态转换: ${order.status} -> ${updateType}`
        }
      });
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `无法执行此操作：当前订单状态为 ${order.status}，无法执行 ${updateType} 操作`
      }, { status: 400 });
    }

    // 检查是否需要触发奖励（仅首次购买或被推荐用户完成订单时）
    if (shouldTriggerReward) {
      const hasReferral = !!order.users.referred_by_user_id;
      const shouldTriggerReferralReward = hasReferral && !order.users.has_first_purchase;
      
      try {
        const rewardResult = await rewardTrigger.triggerReward({
          orderId: order.id,
          userId: order.user_id,
          triggerType: shouldTriggerReferralReward ? 'first_purchase' : 'order_completion',
          referralCode: hasReferral ? order.users.referred_by_user_id : undefined
        });

        if (rewardResult.success) {
          // 标记用户已完成首次购买
          if (shouldTriggerReferralReward) {
            await prisma.users.update({
              where: { id: order.user_id },
              data: { has_first_purchase: true }
            });
          }
        }

        monitor.increment(`order_reward_trigger_${shouldTriggerReferralReward ? 'first_purchase' : 'order_completion'}_success_total`, 1);
        
      } catch (rewardError) {
        logger.warn('订单奖励触发失败', rewardError as Error, {
          orderId: order.id,
          userId: order.user_id,
          rewardType: shouldTriggerReferralReward ? 'first_purchase' : 'order_completion'
        });

        monitor.increment(`order_reward_trigger_${shouldTriggerReferralReward ? 'first_purchase' : 'order_completion'}_error_total`, 1);
      }
    }

    // 发送订单状态更新通知
    try {
      // 这里可以添加通知逻辑，比如发送邮件或推送通知
      logger.info('订单状态更新成功', {
        orderId: order.id,
        oldStatus: order.status,
        newStatus,
        updateType
      });
    } catch (notificationError) {
      logger.warn('发送通知失败', notificationError as Error, { orderId: order.id });
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
      rewardTriggered: !!shouldTriggerReward
    });

    const successMessage = updateType === 'ship' ? '发货成功' : '订单完成';
    return NextResponse.json<ApiResponse>({
      success: true,
      message: successMessage,
      data: {
        orderId: order.id,
        newStatus,
        rewardTriggered: shouldTriggerReward
      }
    });

  } catch (error: any) {
    operationSpan.finish(false, {
      error: error.message
    });

    monitor.increment('order_update_error_total', 1);

    logger.error('订单状态更新失败', error as Error);

    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '订单状态更新失败'
    }, { status: 500 });
  }
}