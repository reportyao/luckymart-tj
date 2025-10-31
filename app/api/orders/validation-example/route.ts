/**
 * 订单参数验证API示例
 * 展示如何在实际API中集成和使用订单验证器
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { 
  OrderValidator, 
  validateOrderCreation, 
  validateOrderUpdate, 
  validateOrderQuery,
  createOrderValidationMiddleware,
  ORDER_VALIDATION_MIDDLEWARES,
  formatValidationErrorResponse,
  formatValidationSuccessResponse
} from '@/lib/order-validator';
import { ErrorFactory, CommonErrors } from '@/lib/errors';
import { getLogger } from '@/lib/logger';
import { getMonitor } from '@/lib/monitoring';

// 验证装饰器示例
class OrderController {
  @createOrderValidationMiddleware({
    operation: 'create',
    source: 'body',
    strictMode: true
  })
  async createOrder(req: NextRequest, validatedData: any) {
    try {
      // 认证验证
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(CommonErrors.unauthorized('需要有效的认证令牌'));
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

      // 检查用户权限
      if (decoded.userId !== validatedData.userId) {
        return NextResponse.json(CommonErrors.forbidden('只能创建自己的订单'));
      }

      // 检查余额（业务逻辑验证）
      const user = await prisma.users.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return NextResponse.json(CommonErrors.notFound('用户不存在'));
      }

      // 检查余额是否足够
      const requiredAmount = validatedData.totalAmount;
      if (user.balance < requiredAmount) {
        return NextResponse.json(
          CommonErrors.insufficientBalance(requiredAmount, Number(user.balance)),
          { status: 400 }
        );
      }

      // 创建订单（在事务中）
      const result = await prisma.$transaction(async (tx) => {
        // 生成订单号
        const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // 创建订单
        const order = await tx.orders.create({
          data: {
            orderNumber,
            userId: decoded.userId,
            productId: validatedData.productId || null,
            roundId: validatedData.roundId || null,
            type: validatedData.type,
            quantity: validatedData.quantity,
            totalAmount: validatedData.totalAmount,
            status: 'pending',
            paymentMethod: validatedData.paymentMethod || 'balance',
            paymentStatus: 'pending',
            fulfillmentStatus: 'pending',
            isResale: validatedData.isResale || false,
            resalePrice: validatedData.resalePrice || null,
            notes: validatedData.notes || null
          }
        });

        // 扣减余额（使用原子操作防止并发问题）
        await tx.users.update({
          where: { id: decoded.userId, balance: { gte: requiredAmount } },
          data: {
            balance: { decrement: requiredAmount },
            totalSpent: { increment: requiredAmount }
          }
        });

        // 创建交易记录
        await tx.transactions.create({
          data: {
            userId: decoded.userId,
            type: validatedData.type,
            amount: -requiredAmount, // 负数表示支出
            balanceType: 'balance',
            relatedOrderId: order.id,
            description: `订单支付: ${orderNumber}`
          }
        });

        return order;
      });

      // 记录监控指标
      const monitor = getMonitor();
      monitor.increment('order_created_total', 1, {
        type: validatedData.type,
        userId: decoded.userId
      });

      return NextResponse.json(
        formatValidationSuccessResponse(result, '创建'),
        { status: 201 }
      );

    } catch (error: any) {
      const logger = getLogger();
      logger.error('创建订单失败', error as Error, { 
        userId: validatedData?.userId,
        type: validatedData?.type 
      });

      return NextResponse.json(
        {
          success: false,
          error: '创建订单失败',
          message: error.message
        },
        { status: 500 }
      );
    }
  }

  @createOrderValidationMiddleware({
    operation: 'update',
    source: 'body',
    strictMode: true,
    customConstraints: {
      allowZeroAmounts: true, // 允许0金额（退款场景）
      maxNotesLength: 1000 // 允许更长备注
    }
  })
  async updateOrder(req: NextRequest, validatedData: any) {
    try {
      const { id, status, trackingNumber, notes } = validatedData;

      // 查找订单
      const order = await prisma.orders.findUnique({
        where: { id }
      });

      if (!order) {
        return NextResponse.json(CommonErrors.notFound('订单不存在'));
      }

      // 检查状态转换是否合法
      const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['processing', 'cancelled'],
        'processing': ['shipped', 'cancelled'],
        'shipped': ['delivered', 'completed'],
        'delivered': ['completed']
      };

      if (status && !validTransitions[order.status as keyof typeof validTransitions]?.includes(status)) {
        return NextResponse.json(
          CommonErrors.invalidInput(`不能从状态 ${order.status} 转换为 ${status}`),
          { status: 400 }
        );
      }

      // 更新订单
      const updatedOrder = await prisma.orders.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(trackingNumber && { trackingNumber }),
          ...(notes !== undefined && { notes }),
          updatedAt: new Date()
        }
      });

      return NextResponse.json(
        formatValidationSuccessResponse(updatedOrder, '更新')
      );

    } catch (error: any) {
      const logger = getLogger();
      logger.error('更新订单失败', error as Error, { orderId: validatedData?.id });

      return NextResponse.json(
        {
          success: false,
          error: '更新订单失败',
          message: error.message
        },
        { status: 500 }
      );
    }
  }
}

// 直接使用验证函数的示例（不依赖装饰器）
export async function POST_with_validation(request: NextRequest) {
  // 手动验证示例
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(CommonErrors.unauthorized('需要认证'));
    }

    const body = await request.json();
    const validationResult = validateOrderCreation(body);

    if (!validationResult.isValid) {
      return NextResponse.json(
        formatValidationErrorResponse(validationResult),
        { status: 400 }
      );
    }

    // 验证成功后处理订单逻辑
    return NextResponse.json(
      formatValidationSuccessResponse(validationResult.sanitizedData, '创建')
    );

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: '处理订单失败',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// 使用中间件的示例
export async function GET_with_middleware(request: NextRequest) {
  return await ORDER_VALIDATION_MIDDLEWARES.query(request, async (req, validatedQuery) => {
    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json(CommonErrors.unauthorized('需要认证'));
      }

      // 使用验证后的查询参数
      const page = validatedQuery.page || 1;
      const limit = validatedQuery.limit || 20;
      const status = validatedQuery.status;
      const type = validatedQuery.type;

      // 构建查询条件
      const where: any = {};
      if (status) where.status = status;
      if (type) where.type = type;

      // 分页查询
      const skip = (page - 1) * limit;
      const [orders, total] = await Promise.all([
        prisma.orders.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.orders.count({ where })
      ]);

      return NextResponse.json({
        success: true,
        data: {
          orders,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        },
        validated: true
      });

    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: '查询订单失败',
          message: error.message
        },
        { status: 500 }
      );
    }
  });
}

// 高级验证示例：转售订单
export async function POST_resale_order(request: NextRequest) {
  return await ORDER_VALIDATION_MIDDLEWARES.create(request, async (req, validatedData) => {
    try {
      // 认证检查
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json(CommonErrors.unauthorized());
      }

      // 转售订单特殊验证
      if (validatedData.type !== 'resale') {
        return NextResponse.json(
          CommonErrors.invalidInput('必须是转售订单类型'),
          { status: 400 }
        );
      }

      if (!validatedData.isResale) {
        return NextResponse.json(
          CommonErrors.validationFailed('转售订单必须设置 isResale 为 true', 'isResale'),
          { status: 400 }
        );
      }

      // 检查转售价格合理性
      if (!validatedData.resalePrice || validatedData.resalePrice <= 0) {
        return NextResponse.json(
          CommonErrors.validationFailed('转售价格必须大于0', 'resalePrice'),
          { status: 400 }
        );
      }

      // 创建转售订单逻辑...
      const resaleOrder = {
        id: 'resale-order-id',
        ...validatedData,
        status: 'pending'
      };

      return NextResponse.json(
        formatValidationSuccessResponse(resaleOrder, '创建')
      );

    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: '创建转售订单失败',
          message: error.message
        },
        { status: 500 }
      );
    }
  });
}

// 批量操作示例
export async function POST_batch_operations(request: NextRequest) {
  try {
    const body = await request.json();
    const { orders, action } = body;

    // 验证批量操作参数
    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        CommonErrors.invalidInput('订单列表不能为空'),
        { status: 400 }
      );
    }

    if (orders.length > 100) {
      return NextResponse.json(
        CommonErrors.invalidInput('批量操作订单数量不能超过100个'),
        { status: 400 }
      );
    }

    // 验证每个订单
    const validationResults = orders.map((order, index) => {
      const result = validateOrderUpdate(order);
      return {
        index,
        orderId: order.id,
        ...result
      };
    });

    // 检查验证结果
    const validOrders = validationResults.filter(r => r.isValid);
    const invalidOrders = validationResults.filter(r => !r.isValid);

    if (invalidOrders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: '部分订单参数验证失败',
          summary: {
            total: orders.length,
            valid: validOrders.length,
            invalid: invalidOrders.length
          },
          invalidOrders: invalidOrders.map(r => ({
            orderId: r.orderId,
            index: r.index,
            errors: r.errors.map(e => e.message)
          }))
        },
        { status: 400 }
      );
    }

    // 执行批量操作
    const results = await batchProcessOrders(validOrders.map(r => r.sanitizedData), action);

    return NextResponse.json({
      success: true,
      message: '批量操作完成',
      summary: {
        total: orders.length,
        processed: results.length,
        failed: 0
      },
      results
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: '批量操作失败',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// 辅助函数
async function batchProcessOrders(orders: any[], action: string) {
  // 实际的批量处理逻辑
  return orders.map(order => ({
    orderId: order.id,
    action,
    success: true,
    timestamp: new Date()
  }));
}