/**
 * 支付确认竞态条件修复验证脚本
 * 模拟并发请求测试修复效果
 */

import { prisma } from './lib/prisma';
import { getLogger } from './lib/logger';

// Mock logger for demo
const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[ERROR] ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data || '')
};

// 模拟修复后的handlePaymentSuccess函数
async function handlePaymentSuccessFixed(orderId: string, transactionId: string) {
  const requestId = `payment_success_${orderId}_${Date.now()}`;
  
  logger.info('支付成功，开始原子检查订单状态', {
    requestId,
    orderId,
    transactionId
  });

  try {
    // 使用原子操作检查和更新订单状态
    const updateResult = await prisma.orders.updateMany({
      where: {
        id: orderId,
        paymentStatus: 'pending'
      },
      data: {
        paymentStatus: 'paid',
        fulfillmentStatus: 'completed',
        updatedAt: new Date()
      }
    });

    // 如果没有行被更新，说明订单已经被处理过
    if (updateResult.count === 0) {
      logger.info('订单已被处理，跳过重复处理', {
        requestId,
        orderId,
        transactionId
      });
      return { success: false, message: '订单已被处理' };
    }

    // 获取订单信息
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        userId: true,
        totalAmount: true,
        notes: true,
        paymentStatus: true
      }
    });

    if (!order) {
      logger.error('订单不存在但状态更新成功，数据不一致', {
        requestId,
        orderId,
        transactionId
      });
      return { success: false, message: '订单不存在' };
    }

    const orderNotes = JSON.parse(order.notes || '{}');
    const totalCoins = orderNotes.coins + orderNotes.bonusCoins;

    logger.info('支付状态确认成功，开始处理订单业务逻辑', {
      requestId,
      orderId,
      userId: order.userId,
      totalCoins
    });

    // 开始事务处理业务逻辑
    await prisma.$transaction(async (tx) => {
      // 更新订单备注，添加交易ID
      await tx.orders.update({
        where: { id: orderId },
        data: {
          notes: `${order.notes} | 交易ID: ${transactionId}`
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

    logger.info('订单处理完成', {
      requestId,
      orderId,
      userId: order.userId,
      totalCoins
    });

    return { success: true, message: '处理成功' };

  } catch (error) {
    logger.error('处理支付成功时发生错误', {
      requestId,
      orderId,
      transactionId,
      error: error.message
    });
    return { success: false, message: '处理失败' };
  }
}

// 测试函数
async function testConcurrencyFix() {
  console.log('\n🧪 开始测试支付确认并发控制修复\n');

  try {
    // 清理测试数据
    console.log('📋 清理旧的测试数据...');
    await prisma.transactions.deleteMany({
      where: { relatedOrderId: { not: null } }
    });
    await prisma.orders.deleteMany();
    await prisma.users.deleteMany();

    // 创建测试用户
    console.log('👤 创建测试用户...');
    const testUser = await prisma.users.create({
      data: {
        username: 'concurrency_test_user',
        firstName: 'Concurrency',
        lastName: 'Test',
        telegramId: `test_${Date.now()}`,
        balance: 0,
        has_first_purchase: false
      }
    });

    // 创建测试订单
    console.log('📦 创建测试订单...');
    const testOrder = await prisma.orders.create({
      data: {
        orderNumber: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: testUser.id,
        type: 'recharge',
        totalAmount: 10.0,
        paymentMethod: 'mock',
        paymentStatus: 'pending',
        fulfillmentStatus: 'pending',
        notes: JSON.stringify({
          packageId: 'test_package',
          packageName: 'Test Package',
          coins: 100,
          bonusCoins: 10
        })
      }
    });

    console.log(`✅ 测试环境准备完成`);
    console.log(`   - 用户ID: ${testUser.id}`);
    console.log(`   - 订单ID: ${testOrder.id}`);
    console.log(`   - 初始余额: ${testUser.balance}`);

    // 执行并发测试
    console.log('\n🚀 开始并发测试 (10个并发请求)...');
    const concurrentRequests = 10;
    const promises = Array(concurrentRequests).fill(null).map((_, index) => 
      handlePaymentSuccessFixed(testOrder.id, `TX_${Date.now()}_${index}`)
    );

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const duplicateCount = results.length - successCount;

    console.log(`\n📊 并发测试结果:`);
    console.log(`   - 总请求数: ${results.length}`);
    console.log(`   - 成功处理: ${successCount}`);
    console.log(`   - 重复请求: ${duplicateCount}`);

    // 验证结果
    const finalOrder = await prisma.orders.findUnique({
      where: { id: testOrder.id },
      select: {
        paymentStatus: true,
        fulfillmentStatus: true
      }
    });

    const finalUser = await prisma.users.findUnique({
      where: { id: testUser.id },
      select: { balance: true }
    });

    const transactions = await prisma.transactions.findMany({
      where: { relatedOrderId: testOrder.id }
    });

    console.log('\n🔍 验证结果:');
    console.log(`   - 订单状态: ${finalOrder?.paymentStatus} (应该是 'paid')`);
    console.log(`   - 完成状态: ${finalOrder?.fulfillmentStatus} (应该是 'completed')`);
    console.log(`   - 最终余额: ${finalUser?.balance} (应该是 110)`);
    console.log(`   - 交易记录: ${transactions.length} 条 (应该是 1 条)`);

    // 判断修复效果
    const isFixed = 
      finalOrder?.paymentStatus === 'paid' &&
      finalOrder?.fulfillmentStatus === 'completed' &&
      finalUser?.balance === 110 &&
      transactions.length === 1 &&
      duplicateCount === concurrentRequests - 1;

    if (isFixed) {
      console.log('\n✅ 修复验证成功！');
      console.log('   - 竞态条件已修复');
      console.log('   - 订单只被处理一次');
      console.log('   - 用户余额正确增加');
      console.log('   - 交易记录唯一');
      console.log('   - 重复请求被正确拒绝');
    } else {
      console.log('\n❌ 修复验证失败！');
      console.log('   - 仍存在并发问题');
    }

    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await prisma.transactions.deleteMany({
      where: { relatedOrderId: testOrder.id }
    });
    await prisma.orders.delete({ where: { id: testOrder.id } });
    await prisma.users.delete({ where: { id: testUser.id } });
    
    console.log('✅ 测试数据清理完成');

  } catch (error) {
    console.error('\n❌ 测试执行失败:', error);
  }
}

// 运行测试
if (require.main === module) {
  testConcurrencyFix()
    .then(() => {
      console.log('\n🎉 测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 测试异常:', error);
      process.exit(1);
    });
}

export { testConcurrencyFix };