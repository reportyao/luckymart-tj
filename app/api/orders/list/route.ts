import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { validateOrder, validateOrderQuery } from '@/lib/order-validator';
import { CommonErrors } from '@/lib/errors';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `list_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('list_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('list_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

}

export async function GET(request: NextRequest) {
  try {
    // 验证认证
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // 验证查询参数
    const searchParams = request.nextUrl.searchParams;
    const queryData = Object.fromEntries(searchParams);
    
    const validationResult = validateOrderQuery(queryData);
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map((e : any) => e.message).join('; ');
      return NextResponse.json(
        { error: '查询参数验证失败', details: errorMessages },
        { status: 400 }
      );
    }

    // 使用验证后的参数
    const page = validationResult.sanitizedData?.page || 1;
    const limit = validationResult.sanitizedData?.limit || 20;
    const type = validationResult.sanitizedData?.type;
    const status = validationResult.sanitizedData?.status;

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = { userId: decoded.userId };
    
    if (type) {
      where.type = type;
    }
    
    if (status) {
      where.paymentStatus = status;
    }

    // 查询订单和关联信息，使用关联查询避免N+1问题
    const [orders, total, products] = await Promise.all([
      prisma.orders.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        // 暂时保留原有结构，products 将通过单独查询获取
      }),
      prisma.orders.count({ where }),
      // 预加载所有相关商品信息
      prisma.products.findMany({
        where: { id: { in: orders.map((o : any) => o.productId).filter(Boolean) } },
        select: { id: true, nameZh: true, nameEn: true, images: true }
      })
    ]);

    // 创建商品映射表
    const productMap = new Map(products.map((p : any) => [p.id, p]));

    // 格式化订单数据，使用映射表避免循环查找
    const formattedOrders = orders.map((order : any) => {
      const product = order.productId ? productMap.get(order.productId) : null;
      
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        type: order.type,
        totalAmount: parseFloat(order.totalAmount.toString()),
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        paymentMethod: order.paymentMethod,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt,
        product: product ? {
          id: product.id,
          name: product.nameZh,
          image: product.images[0] || null
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'Get orders error:', error);
    return NextResponse.json(
      { error: '获取订单列表失败', message: error.message },
      { status: 500 }
    );
  }
}
