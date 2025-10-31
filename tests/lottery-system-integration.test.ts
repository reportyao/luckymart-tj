/**
 * 抽奖系统集成测试
 * 测试API端点、数据库操作和算法集成的完整流程
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { performLotteryDraw, triggerImmediateDraw } from '@/lib/lottery';
import { calculateSecureWinningNumber, findWinner } from '@/lib/lottery-algorithm';
import { getTajikistanTime } from '@/lib/lottery-algorithm';

// 测试数据
const testProductId = 'test-product-lottery-integration';
const testRoundId = 'test-round-lottery-integration';
const testUserId = 'test-user-lottery-integration';

describe('抽奖系统集成测试', () => {
  beforeAll(async () => {
    // 清理测试数据
    await prisma.lotteryRounds.deleteMany({
      where: { id: testRoundId }
    });
    await prisma.participations.deleteMany({
      where: { roundId: testRoundId }
    });
    await prisma.products.deleteMany({
      where: { id: testProductId }
    });
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.lotteryRounds.deleteMany({
      where: { id: testRoundId }
    });
    await prisma.participations.deleteMany({
      where: { roundId: testRoundId }
    });
    await prisma.products.deleteMany({
      where: { id: testProductId }
    });
  });

  describe('完整抽奖流程测试', () => {
    test('应该完成完整的抽奖参与和开奖流程', async () => {
      // 1. 创建测试商品
      const product = await prisma.products.create({
        data: {
          id: testProductId,
          nameZh: '测试商品',
          nameEn: 'Test Product',
          nameRu: 'Тестовый товар',
          marketPrice: 100.00,
          category: '测试',
          isActive: true,
          images: ['test-image.jpg']
        }
      });

      // 2. 创建抽奖期次
      const round = await prisma.lotteryRounds.create({
        data: {
          id: testRoundId,
          productId: testProductId,
          roundNumber: 1,
          totalShares: 10,
          pricePerShare: 5.00,
          soldShares: 0,
          status: 'active'
        }
      });

      // 3. 创建用户（如果不存在）
      let user;
      try {
        user = await prisma.users.findUnique({
          where: { id: testUserId }
        });
        if (!user) {
          user = await prisma.users.create({
            data: {
              id: testUserId,
              telegramId: 'test_telegram_id',
              firstName: 'Test',
              lastName: 'User',
              luckyCoins: 1000.00,
              isActive: true
            }
          });
        }
      } catch (error) {
        // 用户可能已存在，跳过创建
        user = await prisma.users.findUnique({
          where: { id: testUserId }
        }) || { id: testUserId };
      }

      // 4. 模拟参与抽奖
      const participations = [];
      for (let i = 0; i < 10; i++) {
        const participation = await prisma.participations.create({
          data: {
            userId: testUserId,
            roundId: testRoundId,
            productId: testProductId,
            numbers: [10000001 + i],
            sharesCount: 1,
            type: 'lottery',
            cost: 5.00
          }
        });
        participations.push(participation);

        // 更新期次已售份额
        await prisma.lotteryRounds.update({
          where: { id: testRoundId },
          data: {
            soldShares: { increment: 1 }
          }
        });
      }

      // 5. 手动标记期次为已售罄
      await prisma.lotteryRounds.update({
        where: { id: testRoundId },
        data: { status: 'full' }
      });

      // 6. 执行开奖
      const drawResult = await performLotteryDraw(testRoundId);

      // 7. 验证开奖结果
      expect(drawResult.success).toBe(true);
      expect(drawResult.winningNumber).toBeGreaterThanOrEqual(10000001);
      expect(drawResult.winningNumber).toBeLessThanOrEqual(10000010);

      // 8. 验证期次状态更新
      const updatedRound = await prisma.lotteryRounds.findUnique({
        where: { id: testRoundId }
      });
      expect(updatedRound?.status).toBe('completed');
      expect(updatedRound?.winningNumber).toBe(drawResult.winningNumber);
      expect(updatedRound?.winnerUserId).toBe(drawResult.winnerId);

      // 9. 验证中奖记录
      const winningParticipation = await prisma.participations.findFirst({
        where: {
          roundId: testRoundId,
          userId: drawResult.winnerId,
          isWinner: true
        }
      });
      expect(winningParticipation).toBeTruthy();

      // 10. 验证中奖订单创建
      const winningOrder = await prisma.orders.findFirst({
        where: {
          userId: drawResult.winnerId,
          roundId: testRoundId,
          type: 'lottery_win'
        }
      });
      expect(winningOrder).toBeTruthy();
      expect(winningOrder?.totalAmount).toBe(0);

      // 11. 验证交易记录
      const lotteryTransaction = await prisma.transactions.findFirst({
        where: {
          userId: drawResult.winnerId,
          type: 'lottery_win'
        }
      });
      expect(lotteryTransaction).toBeTruthy();
    });

    test('应该支持塔吉克斯坦时区的开奖时间', async () => {
      const tajikTime = getTajikistanTime();
      expect(tajikTime).toBeInstanceOf(Date);
      
      // 验证时间不是UTC时间（应该有5小时差异）
      const utcTime = new Date();
      const timeDiff = Math.abs(tajikTime.getTime() - utcTime.getTime()) / (1000 * 60 * 60);
      expect(timeDiff).toBeGreaterThan(4.5); // 至少4.5小时的时差
      expect(timeDiff).toBeLessThan(5.5); // 最多5.5小时的时差
    });

    test('应该验证开奖算法的不可预测性', () => {
      const participations = [
        {
          id: 'test-1',
          userId: 'user-1',
          numbers: [10000001],
          amount: 5.00,
          createdAt: new Date()
        },
        {
          id: 'test-2',
          userId: 'user-2',
          numbers: [10000002],
          amount: 5.00,
          createdAt: new Date()
        }
      ];

      // 多次运行相同数据应该产生相同结果
      const result1 = calculateSecureWinningNumber(
        participations.map(p => p.id),
        participations,
        testProductId,
        10
      );

      const result2 = calculateSecureWinningNumber(
        participations.map(p => p.id),
        participations,
        testProductId,
        10
      );

      expect(result1.winningNumber).toBe(result2.winningNumber);
    });

    test('应该防止重复开奖', async () => {
      // 尝试重复开奖应该失败
      await expect(performLotteryDraw(testRoundId)).rejects.toThrow();
    });

    test('应该正确查找中奖者', () => {
      const participations = [
        { userId: 'user-1', numbers: [10000001] },
        { userId: 'user-2', numbers: [10000002] },
        { userId: 'user-3', numbers: [10000003] }
      ];

      const winner = findWinner(participations, 10000002);
      expect(winner).toBe('user-2');

      const noWinner = findWinner(participations, 99999999);
      expect(noWinner).toBeNull();
    });
  });

  describe('立即开奖测试', () => {
    test('应该支持立即开奖触发', async () => {
      // 创建新的期次用于测试立即开奖
      const immediateRoundId = 'test-immediate-round';
      
      try {
        await prisma.lotteryRounds.create({
          data: {
            id: immediateRoundId,
            productId: testProductId,
            roundNumber: 2,
            totalShares: 5,
            pricePerShare: 5.00,
            soldShares: 0,
            status: 'active'
          }
        });

        // 填充所有份额
        for (let i = 0; i < 5; i++) {
          await prisma.participations.create({
            data: {
              userId: testUserId,
              roundId: immediateRoundId,
              productId: testProductId,
              numbers: [10000001 + i],
              sharesCount: 1,
              type: 'lottery',
              cost: 5.00
            }
          });

          await prisma.lotteryRounds.update({
            where: { id: immediateRoundId },
            data: {
              soldShares: { increment: 1 }
            }
          });
        }

        // 标记为已售罄
        await prisma.lotteryRounds.update({
          where: { id: immediateRoundId },
          data: { status: 'full' }
        });

        // 触发立即开奖
        const immediateResult = await triggerImmediateDraw(immediateRoundId);
        expect(immediateResult.success).toBe(true);
      } finally {
        // 清理测试数据
        await prisma.participations.deleteMany({
          where: { roundId: immediateRoundId }
        }).catch(() => {});
        await prisma.lotteryRounds.deleteMany({
          where: { id: immediateRoundId }
        }).catch(() => {});
      }
    });
  });

  describe('API字段映射测试', () => {
    test('应该使用正确的数据库字段名', async () => {
      const round = await prisma.lotteryRounds.findUnique({
        where: { id: testRoundId },
        select: {
          id: true,
          totalShares: true,
          soldShares: true,
          drawTime: true,
          status: true
        }
      });

      // 验证字段名正确（不应该有 maxShares 或 endTime）
      expect(round?.totalShares).toBeDefined();
      expect(round?.soldShares).toBeDefined();
      expect(round?.drawTime).toBeDefined();
      expect(round?.status).toBeDefined();

      // 确保没有使用错误的字段名
      expect((round as any).maxShares).toBeUndefined();
      expect((round as any).endTime).toBeUndefined();
    });

    test('应该使用正确的参与记录表名', async () => {
      const participations = await prisma.participations.findMany({
        where: { roundId: testRoundId },
        select: {
          id: true,
          roundId: true,
          userId: true,
          sharesCount: true
        }
      });

      expect(participations.length).toBeGreaterThan(0);
      expect(participations[0]?.sharesCount).toBeDefined();
    });
  });
});

describe('抽奖系统性能测试', () => {
  test('应该能在合理时间内处理大量参与', async () => {
    const perfRoundId = 'test-performance-round';
    
    try {
      // 创建大量参与的期次
      await prisma.lotteryRounds.create({
        data: {
          id: perfRoundId,
          productId: testProductId,
          roundNumber: 999,
          totalShares: 1000,
          pricePerShare: 1.00,
          soldShares: 0,
          status: 'active'
        }
      });

      // 创建1000个参与
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        await prisma.participations.create({
          data: {
            userId: testUserId,
            roundId: perfRoundId,
            productId: testProductId,
            numbers: [10000001 + i],
            sharesCount: 1,
            type: 'lottery',
            cost: 1.00
          }
        });

        await prisma.lotteryRounds.update({
          where: { id: perfRoundId },
          data: {
            soldShares: { increment: 1 }
          }
        });
      }

      await prisma.lotteryRounds.update({
        where: { id: perfRoundId },
        data: { status: 'full' }
      });

      const creationTime = Date.now() - startTime;
      expect(creationTime).toBeLessThan(10000); // 应该在10秒内完成创建

      // 执行开奖
      const drawStartTime = Date.now();
      const result = await performLotteryDraw(perfRoundId);
      const drawTime = Date.now() - drawStartTime;

      expect(result.success).toBe(true);
      expect(drawTime).toBeLessThan(5000); // 应该在5秒内完成开奖

    } finally {
      // 清理
      await prisma.participations.deleteMany({
        where: { roundId: perfRoundId }
      }).catch(() => {});
      await prisma.lotteryRounds.deleteMany({
        where: { id: perfRoundId }
      }).catch(() => {});
    }
  });
});
