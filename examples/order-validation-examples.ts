import { NextRequest, NextResponse } from 'next/server';
import { validateOrder } from '@/lib/order-validator';
import { ErrorFactory } from '@/lib/errors';
/**
 * 订单验证中间件使用示例
 * 演示如何在不同的API路由中使用订单参数验证器
 */


// 示例1: 创建订单API - 使用验证装饰器
export async function POST_create_order(request: NextRequest) {
  // 使用装饰器进行验证
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '需要认证' }, { status: 401 });
}

    const body = await request.json();
    
    // 直接调用验证器
    const validationResult = await validateOrder('create')(request);
    // 注意：上面这行在实际代码中需要调整，因为装饰器通常是用于方法的

    return NextResponse.json({ 
      success: true, 
      message: '订单创建成功',
      order: {} // 实际的订单数据
    });

  } catch (error: any) {
    return NextResponse.json(;
      { 
        success: false, 
        error: error.message,
        code: error.code 
      },
      { status: error.statusCode || 400 }
    );
  }
}

// 示例2: 更新订单API - 使用装饰器
class OrderController {
  @validateOrder('update', {
    source: 'body',
    constraints: {
      ...DEFAULT_CONSTRAINTS,
      minAmount: 0, // 更新时允许0金额（用于状态更新）
      maxNotesLength: 1000
    }
  })
  async updateOrder(req: NextRequest) {
    const validatedData = (req as any).validatedData;
    // 在这里处理验证后的订单更新逻辑
    
    return NextResponse.json({
  }
      success: true,
      data: validatedData
    });
  }

  @validateOrder('query', {
    source: 'query',
    constraints: {
      minAmount: 0, // 查询不需要金额验证
      maxAmount: Number.MAX_SAFE_INTEGER
    }
  })
  async queryOrders(req: NextRequest) {
    const validatedData = (req as any).validatedData;
    // 在这里处理验证后的订单查询逻辑
    
    return NextResponse.json({
      success: true,
      data: validatedData
    });
  }
}

// 示例3: 管理员订单管理API - 严格验证
export async function POST_admin_update_order(request: NextRequest) {
  try {
    // 验证管理员权限（这里省略具体实现）
    
    const body = await request.json();
    
    // 使用严格的验证配置
    const validationResult = validateOrder('update', {
      strict: true,
      allowUnknownFields: false,
      constraints: {
        minAmount: 0,
        maxAmount: 999999.99,
        decimalPlaces: 2,
        minQuantity: 1,
        maxQuantity: 10000, // 管理员允许更大的数量
        maxNotesLength: 2000, // 管理员允许更长的备注
        maxOrderNumberLength: 50,
        maxTrackingNumberLength: 500,
        maxPaymentMethodLength: 100,
        allowNegativeAmounts: false,
        allowZeroAmounts: true // 允许0金额（如退款）
      },
      regexValidators: {
        orderNumber: /^[A-Z0-9_]{8,50}$/,
        phone: /^\+?[1-9]\d{1,14}$/,
        trackingNumber: /^[A-Za-z0-9\-_]{1,500}$/,
        postalCode: /^[A-Za-z0-9\- ]{1,20}$/,
        amount: /^\d+(\.\d{1,2})?$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
}
    })(body);

    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(e => e.message).join('; ');
      return NextResponse.json(;
  }
        {
          success: false,
          error: '订单参数验证失败',
          details: errorMessages,
          validationErrors: validationResult.errors.map(e => ({
            field: e.details?.field,
            message: e.message,
            value: e.details?.value
          }))
        },
        { status: 400 }
      );
    }

    // 执行订单更新逻辑...
    const updatedOrder = await updateOrderWithValidation(validationResult.sanitizedData);

    return NextResponse.json({
      success: true,
      message: '订单更新成功',
      data: updatedOrder
    });

  } catch (error: any) {
    console.error('订单更新错误:', error);
    return NextResponse.json(;
      {
        success: false,
        error: error.message || '订单更新失败'
      },
      { status: 500 }
    );
  }
}

// 示例4: 转售相关订单API - 自定义验证
export async function POST_resale_order(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 转售订单的特殊验证配置
    const validationResult = validateOrder('create', {
      constraints: {
        minAmount: 0.01,
        maxAmount: 999999.99,
        decimalPlaces: 2,
        minQuantity: 1,
        maxQuantity: 1, // 转售通常是单个商品
        maxNotesLength: 1000,
        maxOrderNumberLength: 50,
        maxTrackingNumberLength: 255,
        maxPaymentMethodLength: 50,
        allowNegativeAmounts: false,
        allowZeroAmounts: false
}
    });

    // 转售订单特殊验证
    if (validationResult.isValid) {
      const data = validationResult.sanitizedData;
      
      // 确保是转售订单
      if (data.type !== 'resale') {
        validationResult.errors.push(ErrorFactory.createValidationError(
          '必须是转售订单类型',
          'type'
        ));
      }
      
      // 确保设置转售标志
      if (!data.isResale) {
        validationResult.errors.push(ErrorFactory.createValidationError(
          '转售订单必须设置 isResale 为 true',
          'isResale'
        ));
      }
      
      // 确保有转售价格
      if (!data.resalePrice || data.resalePrice <= 0) {
        validationResult.errors.push(ErrorFactory.createValidationError(
          '转售订单必须设置有效的转售价格',
          'resalePrice'
        ));
      }
    }

    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(e => e.message).join('; ');
      return NextResponse.json(;
        { 
          success: false, 
          error: '转售订单参数验证失败',
          details: errorMessages 
        },
        { status: 400 }
      );
    }

    // 执行转售订单创建逻辑...
    const resaleOrder = await createResaleOrder(validationResult.sanitizedData);

    return NextResponse.json({
      success: true,
      message: '转售订单创建成功',
      data: resaleOrder
    });

  } catch (error: any) {
    return NextResponse.json(;
      { 
        success: false, 
        error: error.message || '转售订单创建失败' 
      },
      { status: 500 }
    );
  }
}

// 示例5: 批量订单处理API - 批量验证
export async function POST_batch_process_orders(request: NextRequest) {
  try {
    const body = await request.json();
    const { orders, action } = body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(;
        { success: false, error: '订单列表不能为空' },
        { status: 400 }
      );
}

    if (orders.length > 100) { // 限制批量操作数量 {
      return NextResponse.json(;
        { success: false, error: '批量操作订单数量不能超过100个' },
        { status: 400 }
      );
    }

    const validationResults = orders.map((order, index) => {
      const result = validateOrder('update', {
        constraints: {
          minAmount: 0,
          maxAmount: 999999.99,
          decimalPlaces: 2,
          minQuantity: 1,
          maxQuantity: 10000,
          maxNotesLength: 500,
          maxOrderNumberLength: 50,
          maxTrackingNumberLength: 255,
          maxPaymentMethodLength: 50,
          allowNegativeAmounts: false,
          allowZeroAmounts: true
        }
      })(order);

      return {
        index,
        orderId: order.id || order.orderId,
        ...result
      };
    });

    // 汇总验证结果
    const validOrders = validationResults.filter(r => r.isValid);
    const invalidOrders = validationResults.filter(r => !r.isValid);

    if (invalidOrders.length > 0) {
      const errorSummary = invalidOrders.map(r => ({
        orderId: r.orderId,
        index: r.index,
        errors: r.errors.map(e => e.message)
      }));

      return NextResponse.json(;
        {
          success: false,
          error: '部分订单参数验证失败',
          summary: {
            total: orders.length,
            valid: validOrders.length,
            invalid: invalidOrders.length
          },
          invalidOrders: errorSummary
        },
        { status: 400 }
      );
    }

    // 执行批量处理逻辑...
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
    return NextResponse.json(;
      { 
        success: false, 
        error: error.message || '批量处理失败' 
      },
      { status: 500 }
    );
  }
}

// 示例6: 获取订单统计API - 查询参数验证
export async function GET_order_statistics(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryData = Object.fromEntries(searchParams);
    
    // 统计查询的特殊验证
    const validationResult = validateOrder('query', {
      constraints: {
        minAmount: 0, // 统计时不需要金额下限
        maxAmount: Number.MAX_SAFE_INTEGER,
        decimalPlaces: 2,
        minQuantity: 1,
        maxQuantity: 1, // 统计查询不需要数量
        maxNotesLength: 0, // 统计查询不需要备注
        maxOrderNumberLength: 50,
        maxTrackingNumberLength: 0,
        maxPaymentMethodLength: 0,
        allowNegativeAmounts: true, // 统计允许负数（退款）
        allowZeroAmounts: true
      },
      regexValidators: {
        orderNumber: /^[A-Z0-9_]{0,50}$/, // 统计查询时订单号可选
        phone: /^\+?[1-9]\d{0,14}$/,
        trackingNumber: /^.{0,0}$/, // 不允许跟踪号
        postalCode: /^[A-Za-z0-9\- ]{0,20}$/,
        amount: /^\d+(\.\d{1,2})?$/,
        email: /^[^\s@]*@[^\s@]*\.[^\s@]*$/
}
    })(queryData);

    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(e => e.message).join('; ');
      return NextResponse.json(;
        { 
          success: false, 
          error: '统计查询参数验证失败',
          details: errorMessages 
        },
        { status: 400 }
      );
    }

    // 执行统计逻辑...
    const statistics = await getOrderStatistics(validationResult.sanitizedData);

    return NextResponse.json({
      success: true,
      data: statistics
    });

  } catch (error: any) {
    return NextResponse.json(;
      { 
        success: false, 
        error: error.message || '获取统计失败' 
      },
      { status: 500 }
    );
  }
}

// 辅助函数（这些在实际项目中应该在其他地方定义）
async function updateOrderWithValidation(data: any) {
  // 实际的订单更新逻辑
  return { updated: true, data };
}

async function createResaleOrder(data: any) {
  // 实际的转售订单创建逻辑
  return { created: true, data };
}

async function batchProcessOrders(orders: any[], action: string) {
  // 实际的批量处理逻辑
  return orders.map(order => ({ orderId: order.id, success: true }));
}

async function getOrderStatistics(query: any) {
  // 实际的统计逻辑
  return {
    totalOrders: 0,
    totalAmount: 0,
    statusBreakdown: {},
    dateRange: query
  };
}

// 导出验证配置示例
export const ORDER_VALIDATION_CONFIGS = {
  // 创建订单验证配置
  CREATE_CONFIG: {
    strict: true,
    allowUnknownFields: false,
    constraints: {
      minAmount: 0.01,
      maxAmount: 999999.99,
      decimalPlaces: 2,
      minQuantity: 1,
      maxQuantity: 100,
      maxNotesLength: 500,
      allowNegativeAmounts: false,
      allowZeroAmounts: false
}
  },

  // 更新订单验证配置
  UPDATE_CONFIG: {
    strict: true,
    allowUnknownFields: false,
    constraints: {
      minAmount: 0,
      maxAmount: 999999.99,
      decimalPlaces: 2,
      minQuantity: 1,
      maxQuantity: 10000,
      maxNotesLength: 1000,
      allowNegativeAmounts: false,
      allowZeroAmounts: true
    }
  },

  // 管理员验证配置
  ADMIN_CONFIG: {
    strict: false, // 管理员可以更宽松一些
    allowUnknownFields: true,
    constraints: {
      minAmount: 0,
      maxAmount: 9999999.99,
      decimalPlaces: 4, // 管理员可以使用更多小数位
      minQuantity: 1,
      maxQuantity: 100000,
      maxNotesLength: 5000,
      allowNegativeAmounts: true, // 管理员可以处理退款
      allowZeroAmounts: true
    }
  },

  // 转售订单验证配置
  RESALE_CONFIG: {
    strict: true,
    allowUnknownFields: false,
    constraints: {
      minAmount: 0.01,
      maxAmount: 999999.99,
      decimalPlaces: 2,
      minQuantity: 1,
      maxQuantity: 1, // 转售通常是单个
      maxNotesLength: 1000,
      allowNegativeAmounts: false,
      allowZeroAmounts: false
    }
  }
};