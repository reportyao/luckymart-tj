// 管理员 - 订单管理
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';
import type { ApiResponse } from '@/types';

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

    const body = await request.json();
    const { orderId, trackingNumber } = body;

    // 验证参数
    if (!orderId || !trackingNumber) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '缺少必填参数'
      }, { status: 400 });
    }

    // 获取订单
    const order = await prisma.orders.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '订单不存在'
      }, { status: 404 });
    }

    // 检查订单状态
    if (order.status !== 'pending_shipment') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '订单状态不正确'
      }, { status: 400 });
    }

    // 更新订单状态
    await prisma.orders.update({
      where: { id: orderId },
      data: {
        status: 'shipped',
        trackingNumber
      }
    });

    // 发送通知
    try {
      await prisma.notifications.create({
        data: {
          userId: order.userId,
          type: 'order_shipped',
          title: '商品已发货',
          content: `您的订单 ${order.orderNumber} 已发货，物流单号：${trackingNumber}`,
          isRead: false
        }
      });
    } catch (notificationError) {
      console.warn('发送通知失败:', notificationError);
      // 通知失败不影响主要业务逻辑
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '发货成功'
    });

  } catch (error: any) {
    console.error('发货失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '发货失败'
    }, { status: 500 });
  }
}
