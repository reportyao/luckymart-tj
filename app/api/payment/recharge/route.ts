import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { generateOrderNumber } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const body = await request.json();
    const { packageId, paymentMethod } = body;

    // 验证礼包
    const pkg = await prisma.rechargePackages.findUnique({
      where: { id: packageId }
    });

    if (!pkg || !pkg.isActive) {
      return NextResponse.json({ error: '礼包不存在或已下架' }, { status: 404 });
    }

    // 验证支付方式
    if (!['alif_mobi', 'dc_bank', 'mock'].includes(paymentMethod)) {
      return NextResponse.json({ error: '无效的支付方式' }, { status: 400 });
    }

    // 生成订单
    const orderNumber = generateOrderNumber();

    const order = await prisma.orders.create({
      data: {
        orderNumber,
        userId: decoded.userId,
        type: 'recharge',
        totalAmount: pkg.price,
        paymentMethod,
        paymentStatus: 'pending',
        fulfillmentStatus: 'pending',
        notes: JSON.stringify({
          packageId: pkg.id,
          packageName: pkg.nameZh,
          coins: pkg.coins,
          bonusCoins: pkg.bonusCoins
        })
      }
    });

    // 模拟支付 - 生产环境需要对接真实支付接口
    if (paymentMethod === 'mock') {
      // 自动完成支付（仅用于开发测试）
      await handlePaymentSuccess(order.id, 'MOCK_' + Date.now());
      
      return NextResponse.json({
        success: true,
        data: {
          orderId: order.id,
          orderNumber,
          status: 'paid',
          coins: pkg.coins + pkg.bonusCoins,
          message: '充值成功（模拟支付）'
        }
      });
    }

    // 真实支付 - 生成支付指引
    const paymentInstructions = {
      method: paymentMethod,
      recipientPhone: paymentMethod === 'alif_mobi' 
        ? process.env.ALIF_MOBI_PHONE 
        : null,
      recipientAccount: paymentMethod === 'dc_bank'
        ? process.env.DC_BANK_ACCOUNT
        : null,
      recipientName: 'LuckyMart TJ',
      amount: parseFloat(pkg.price.toString()).toFixed(2),
      reference: orderNumber, // 必须填写的备注
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber,
        amount: parseFloat(pkg.price.toString()),
        coins: pkg.coins + pkg.bonusCoins,
        paymentInstructions
      }
    });

  } catch (error: any) {
    console.error('Create recharge order error:', error);
    return NextResponse.json(
      { error: '创建充值订单失败', message: error.message },
      { status: 500 }
    );
  }
}

// 处理支付成功（供支付回调使用）
async function handlePaymentSuccess(orderId: string, transactionId: string) {
  const order = await prisma.orders.findUnique({
    where: { id: orderId }
  });

  if (!order || order.paymentStatus === 'paid') {
    return;
  }

  const orderNotes = JSON.parse(order.notes || '{}');
  const totalCoins = orderNotes.coins + orderNotes.bonusCoins;

  await prisma.$transaction(async (tx) => {
    // 更新订单状态
    await tx.orders.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'paid',
        fulfillmentStatus: 'completed',
        notes: order.notes + ` | 交易ID: ${transactionId}`
      }
    });

    // 增加用户余额
    await tx.users.update({
      where: { id: order.userId },
      data: {
        balance: { increment: totalCoins }
      }
    });

    // 记录交易
    await tx.transactions.create({
      data: {
        userId: order.userId,
        type: 'recharge',
        amount: totalCoins,
        balanceType: 'lottery_coin',
        relatedOrderId: orderId,
        description: `充值 ${parseFloat(order.totalAmount.toString())} TJS = ${totalCoins} 夺宝币`
      }
    });

    // 创建通知
    await tx.notifications.create({
      data: {
        userId: order.userId,
        type: 'recharge_success',
        content: `充值成功！您获得了${totalCoins}个夺宝币`,
        status: 'pending'
      }
    });
  });
}
