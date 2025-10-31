import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { handlePaymentSuccess } from '../app/api/payment/recharge/route';
import { getLogger } from '@/lib/logger';

// Mock logger to avoid console output during tests
jest.mock('@/lib/logger', () => ({
  getLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  })
}));

describe('支付确认并发控制测试', () => {
  let testOrder: any;
  let testUser: any;

  beforeEach(async () => {
    // 清理测试数据
    await prisma.transactions.deleteMany({
      where: { relatedOrderId: { not: null } }
    });
    await prisma.orders.deleteMany();
    await prisma.users.deleteMany();

    // 创建测试用户
    testUser = await prisma.users.create({
      data: {
        username: 'test_user_concurrency',
        firstName: 'Test',
        lastName: 'User',
        telegramId: `test_${Date.now()}`,
        balance: 0,
        has_first_purchase: false
      }
    });

    // 创建测试订单
    testOrder = await prisma.orders.create({
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
  });

  afterEach(async () => {
    // 清理测试数据
    await prisma.transactions.deleteMany({
      where: { relatedOrderId: testOrder?.id }
    });
    if (testOrder) {
      await prisma.orders.delete({ where: { id: testOrder.id } });
    }
    if (testUser) {
      await prisma.users.delete({ where: { id: testUser.id } });
    }
  });

  it('应该防止并发请求重复处理同一订单', async () => {
    const transactionId = `TX_${Date.now()}`;
    const concurrentRequests = 10;

    // 并发执行多个支付确认请求
    const promises = Array(concurrentRequests).fill(null).map(() => 
      handlePaymentSuccess(testOrder.id, transactionId)
    );

    await Promise.all(promises);

    // 验证订单状态只被更新一次
    const updatedOrder = await prisma.orders.findUnique({
      where: { id: testOrder.id },
      select: {
        paymentStatus: true,
        fulfillmentStatus: true
      }
    });

    expect(updatedOrder?.paymentStatus).toBe('paid');
    expect(updatedOrder?.fulfillmentStatus).toBe('completed');

    // 验证用户余额只增加一次
    const userAfter = await prisma.users.findUnique({
      where: { id: testUser.id },
      select: { balance: true }
    });

    expect(userAfter?.balance).toBe(110); // 100 + 10 = 110

    // 验证交易记录只有一条
    const transactions = await prisma.transactions.findMany({
      where: { relatedOrderId: testOrder.id }
    });

    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(110);
  });

  it('应该防止重复处理已支付的订单', async () => {
    const transactionId1 = `TX_${Date.now()}_1`;
    const transactionId2 = `TX_${Date.now()}_2`;

    // 第一次处理
    await handlePaymentSuccess(testOrder.id, transactionId1);

    // 第二次处理同一个订单
    await handlePaymentSuccess(testOrder.id, transactionId2);

    // 验证订单状态
    const updatedOrder = await prisma.orders.findUnique({
      where: { id: testOrder.id },
      select: {
        paymentStatus: true,
        fulfillmentStatus: true,
        notes: true
      }
    });

    expect(updatedOrder?.paymentStatus).toBe('paid');
    expect(updatedOrder?.fulfillmentStatus).toBe('completed');
    
    // 确保备注中只包含第一个交易ID
    expect(updatedOrder?.notes).toContain(`交易ID: ${transactionId1}`);
    expect(updatedOrder?.notes).not.toContain(`交易ID: ${transactionId2}`);

    // 验证用户余额
    const userAfter = await prisma.users.findUnique({
      where: { id: testUser.id },
      select: { balance: true }
    });

    expect(userAfter?.balance).toBe(110);

    // 验证只有一条交易记录
    const transactions = await prisma.transactions.findMany({
      where: { relatedOrderId: testOrder.id }
    });

    expect(transactions).toHaveLength(1);
  });

  it('应该在批量并发请求中正确处理多个不同订单', async () => {
    const orders = [];
    const transactionIds = [];
    const promises = [];

    // 创建多个测试订单
    for (let i = 0; i < 5; i++) {
      const order = await prisma.orders.create({
        data: {
          orderNumber: `TEST_CONCURRENT_${i}_${Date.now()}`,
          userId: testUser.id,
          type: 'recharge',
          totalAmount: 10.0,
          paymentMethod: 'mock',
          paymentStatus: 'pending',
          fulfillmentStatus: 'pending',
          notes: JSON.stringify({
            packageId: `test_package_${i}`,
            packageName: `Test Package ${i}`,
            coins: 100 + i * 10,
            bonusCoins: 10
          })
        }
      });
      orders.push(order);
      transactionIds.push(`TX_${Date.now()}_${i}`);

      promises.push(handlePaymentSuccess(order.id, transactionIds[i]));
    }

    // 并发处理所有订单
    await Promise.all(promises);

    // 验证所有订单都被正确处理
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const transactionId = transactionIds[i];

      const updatedOrder = await prisma.orders.findUnique({
        where: { id: order.id },
        select: {
          paymentStatus: true,
          fulfillmentStatus: true,
          notes: true
        }
      });

      expect(updatedOrder?.paymentStatus).toBe('paid');
      expect(updatedOrder?.fulfillmentStatus).toBe('completed');
      expect(updatedOrder?.notes).toContain(`交易ID: ${transactionId}`);
    }

    // 验证用户余额正确增加（所有订单的奖励总和）
    const userAfter = await prisma.users.findUnique({
      where: { id: testUser.id },
      select: { balance: true }
    });

    // 100+10 + 110+10 + 120+10 + 130+10 + 140+10 = 660
    expect(userAfter?.balance).toBe(660);

    // 验证交易记录数量正确
    const transactions = await prisma.transactions.findMany({
      where: { relatedOrderId: { in: orders.map(o => o.id) } }
    });

    expect(transactions).toHaveLength(5);
  });
});

describe('原子更新操作测试', () => {
  it('updateMany 应该只在条件匹配时更新记录', async () => {
    // 创建测试订单
    const testOrder = await prisma.orders.create({
      data: {
        orderNumber: `ATOMIC_${Date.now()}`,
        userId: 'test_user_id',
        type: 'recharge',
        totalAmount: 10.0,
        paymentMethod: 'mock',
        paymentStatus: 'pending',
        fulfillmentStatus: 'pending',
        notes: JSON.stringify({
          coins: 100,
          bonusCoins: 10
        })
      }
    });

    // 第一次原子更新
    const firstUpdate = await prisma.orders.updateMany({
      where: {
        id: testOrder.id,
        paymentStatus: 'pending'
      },
      data: {
        paymentStatus: 'paid',
        updatedAt: new Date()
      }
    });

    expect(firstUpdate.count).toBe(1);

    // 第二次原子更新（应该不更新任何记录）
    const secondUpdate = await prisma.orders.updateMany({
      where: {
        id: testOrder.id,
        paymentStatus: 'pending'
      },
      data: {
        paymentStatus: 'paid',
        updatedAt: new Date()
      }
    });

    expect(secondUpdate.count).toBe(0);

    // 清理测试数据
    await prisma.orders.delete({ where: { id: testOrder.id } });
  });

  it('updateMany 应该只在订单状态为pending时更新', async () => {
    // 创建已支付的订单
    const paidOrder = await prisma.orders.create({
      data: {
        orderNumber: `PAID_${Date.now()}`,
        userId: 'test_user_id',
        type: 'recharge',
        totalAmount: 10.0,
        paymentMethod: 'mock',
        paymentStatus: 'paid', // 已支付状态
        fulfillmentStatus: 'pending',
        notes: JSON.stringify({
          coins: 100,
          bonusCoins: 10
        })
      }
    });

    // 尝试更新已支付的订单
    const updateResult = await prisma.orders.updateMany({
      where: {
        id: paidOrder.id,
        paymentStatus: 'pending' // 条件不匹配
      },
      data: {
        fulfillmentStatus: 'completed'
      }
    });

    expect(updateResult.count).toBe(0);

    // 验证订单状态未被更改
    const orderAfterUpdate = await prisma.orders.findUnique({
      where: { id: paidOrder.id },
      select: {
        paymentStatus: true,
        fulfillmentStatus: true
      }
    });

    expect(orderAfterUpdate?.paymentStatus).toBe('paid');
    expect(orderAfterUpdate?.fulfillmentStatus).toBe('pending');

    // 清理测试数据
    await prisma.orders.delete({ where: { id: paidOrder.id } });
  });
});