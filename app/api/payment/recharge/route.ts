import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { generateOrderNumber } from '@/lib/utils';
import { validationEngine } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';
import { getLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const logger = getLogger();
  const requestId = `recharge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    logger.info('充值请求开始', {
      requestId,
      userId: decoded.userId,
      tokenPrefix: `${token.substring(0, 10)  }...`
    });

    const body = await request.json();
    const { packageId, paymentMethod } = body;

    // 基础参数验证
    if (!packageId || !paymentMethod) {
      return NextResponse.json({ error: '参数不完整：packageId和paymentMethod都是必需的' }, { status: 400 });
    }

    // 获取系统验证配置
    try {
      const { data: settings } = await supabaseAdmin
        .from('system_validation_settings')
        .select('*');
      
      if (settings) {
        const config = settings.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.parsed_value;
          return acc;
        }, {} as any);
        
        validationEngine.setConfig(config);
      }
    } catch (configError) {
      console.warn('无法获取系统验证配置，使用默认设置:', configError);
    }

    // 验证礼包
    const pkg = await prisma.rechargePackages.findUnique({
      where: { id: packageId }
    });

    if (!pkg || !pkg.isActive) {
      return NextResponse.json({ error: '礼包不存在或已下架' }, { status: 404 });
    }

    // 验证充值金额（通过套餐价格验证）
    const packagePrice = Number(pkg.price);
    const rechargeValidation = validationEngine.validateRechargeAmount(packagePrice);
    if (!rechargeValidation.isValid) {
      return NextResponse.json({ error: rechargeValidation.error }, { status: 400 });
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
      await handlePaymentSuccess(order.id, `MOCK_${  Date.now()}`);
      
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

    // 真实支付 - 生成支付指引，隐藏敏感信息
    const paymentInstructions = {
      method: paymentMethod,
      // 不再暴露具体的收款账户信息
      recipientInfo: paymentMethod === 'alif_mobi' 
        ? '手机支付账户' 
        : paymentMethod === 'dc_bank'
        ? '银行账户'
        : null,
      recipientName: 'LuckyMart TJ',
      amount: parseFloat(pkg.price.toString()).toFixed(2),
      reference: orderNumber, // 必须填写的备注
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      // 添加安全提示
      securityNote: '请确保转账信息与平台显示一致'
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
    logger.error('创建充值订单失败', error, {
      requestId,
      userId: decoded?.userId,
      error: error.message,
      stack: error.stack
    });
    // 统一错误处理，不暴露敏感信息
    return NextResponse.json(
      { error: '创建充值订单失败' },
      { status: 500 }
    );
  }
}

// 处理支付成功（供支付回调使用）
async function handlePaymentSuccess(orderId: string, transactionId: string) {
  const logger = getLogger();
  const requestId = `payment_success_${orderId}`;

  const order = await prisma.orders.findUnique({
    where: { id: orderId }
  });

  if (!order || order.paymentStatus === 'paid') {
    return;
  }

  const orderNotes = JSON.parse(order.notes || '{}');
  const totalCoins = orderNotes.coins + orderNotes.bonusCoins;

  logger.info('支付成功，开始处理订单', {
    requestId,
    orderId,
    userId: order.userId,
    totalCoins
  });

  await prisma.$transaction(async (tx) => {
    // 更新订单状态
    await tx.orders.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'paid',
        fulfillmentStatus: 'completed',
        notes: `${order.notes  } | 交易ID: ${transactionId}`
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

  // 触发邀请奖励（独立事务，不影响充值逻辑）
  try {
    logger.info('开始检查用户首次充值触发奖励', {
      requestId,
      userId: order.userId,
      orderId
    });

    // 检查用户是否首次充值
    const userForRewardCheck = await prisma.users.findUnique({
      where: { id: order.userId },
      select: { has_first_purchase: true }
    });

    if (!userForRewardCheck?.has_first_purchase) {
      logger.info('用户首次充值，触发邀请奖励', {
        requestId,
        userId: order.userId,
        orderId,
        totalCoins
      });

      // 调用触发邀请奖励API
      try {
        const rewardResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/referral/trigger-reward`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: order.userId,
            event_type: 'first_purchase',
            event_data: {
              order_id: orderId,
              transaction_id: transactionId,
              amount: parseFloat(order.totalAmount.toString()),
              coins_received: totalCoins
            }
          })
        });

        if (rewardResponse.ok) {
          const rewardData = await rewardResponse.json();
          logger.info('邀请奖励触发成功', {
            requestId,
            userId: order.userId,
            rewardData
          });
        } else {
          const errorData = await rewardResponse.text();
          logger.warn('邀请奖励触发失败', {
            requestId,
            userId: order.userId,
            status: rewardResponse.status,
            error: errorData
          });
        }
      } catch (rewardError) {
        logger.error('触发邀请奖励时发生错误', rewardError, {
          requestId,
          userId: order.userId,
          orderId
        });
      }
    }
  } catch (rewardCheckError) {
    logger.error('检查用户首次充值状态时发生错误', rewardCheckError, {
      requestId,
      userId: order.userId,
      orderId
    });
  }
}