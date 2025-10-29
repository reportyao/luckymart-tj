import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // lottery_win, recharge, resale
    const status = searchParams.get('status'); // pending, paid, etc.

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = { userId: decoded.userId };
    
    if (type) {
      where.type = type;
    }
    
    if (status) {
      where.paymentStatus = status;
    }

    // 查询订单
    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.orders.count({ where })
    ]);

    // 获取关联的商品信息
    const productIds = orders.map(o => o.productId).filter(Boolean) as string[];
    const products = productIds.length > 0
      ? await prisma.products.findMany({
          where: { id: { in: productIds } },
          select: { id: true, nameZh: true, images: true }
        })
      : [];

    // 格式化订单数据
    const formattedOrders = orders.map(order => {
      const product = products.find(p => p.id === order.productId);
      
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
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: '获取订单列表失败', message: error.message },
      { status: 500 }
    );
  }
}
