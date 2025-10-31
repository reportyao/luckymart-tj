/**
 * 推荐系统性能测试
 * 测试并发用户场景下的系统性能表现
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { TestDataGenerator, PerformanceTester, TestCleanup, testConfig } from './test-config';
import { createMockRequest } from './test-utils';

describe('推荐系统并发性能测试', () => {
  let prisma: PrismaClient;
  let testDataGenerator: TestDataGenerator;
  let testCleanup: TestCleanup;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testConfig.database.url
        }
      }
    });
    testDataGenerator = new TestDataGenerator(prisma);
    testCleanup = new TestCleanup(prisma);
    
    // 等待数据库连接
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await testCleanup.cleanupAll();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await testCleanup.cleanupAll();
  });

  describe('并发推荐绑定性能', () => {
    test('100个用户同时绑定推荐关系', async () => {
      const concurrentUsers = 100;
      const startTime = process.hrtime.bigint();

      const operations = Array(concurrentUsers).fill(0).map(async (_, i) => {
        const referrerId = `test-referrer-${i}`;
        const refereeId = `test-referee-${i}`;

        // 创建推荐者
        const referrer = testDataGenerator.generateUser({
          id: referrerId,
          telegramId: `referrer_${i}`,
          username: `referrer${i}`,
          referralCode: `CODE${i}`,
        });
        await prisma.users.create({ data: referrer });

        // 创建被推荐者
        const referee = testDataGenerator.generateUser({
          id: refereeId,
          telegramId: `referee_${i}`,
          username: `referee${i}`,
        });
        await prisma.users.create({ data: referee });

        // 绑定推荐关系
        const result = await prisma.referralRelationships.create({
          data: {
            referrerUserId: referrerId,
            refereeUserId: refereeId,
            referralLevel: 1,
          },
        });

        return result;
      });

      const results = await Promise.all(operations);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // 毫秒

      expect(results).toHaveLength(concurrentUsers);
      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
      
      console.log(`并发绑定${concurrentUsers}个推荐关系耗时: ${duration.toFixed(2)}ms`);
      console.log(`平均每个绑定操作耗时: ${(duration / concurrentUsers).toFixed(2)}ms`);
    });

    test('并发推荐奖励计算性能', async () => {
      const concurrentCalculations = 50;
      const rewardConfigs = [
        { config_key: 'first_play_referrer_l1', reward_amount: 5.0 },
        { config_key: 'first_play_referrer_l2', reward_amount: 3.0 },
        { config_key: 'first_play_referrer_l3', reward_amount: 2.0 },
      ];

      const { result, duration } = await PerformanceTester.measureExecutionTime(async () => {
        const calculations = Array(concurrentCalculations).fill(0).map(async (_, i) => {
          const referrerId = `test-referrer-${i}`;
          const refereeId = `test-referee-${i}`;

          // 创建用户和推荐关系
          await prisma.users.create({
            data: testDataGenerator.generateUser({
              id: referrerId,
              telegramId: `referrer_${i}`,
              referralCode: `CODE${i}`,
            })
          });

          await prisma.users.create({
            data: testDataGenerator.generateUser({
              id: refereeId,
              telegramId: `referee_${i}`,
            })
          });

          await prisma.referralRelationships.create({
            data: {
              referrerUserId: referrerId,
              refereeUserId: refereeId,
              referralLevel: 1,
            },
          });

          // 计算奖励
          const rewards = rewardConfigs.map(config => ({
            userId: referrerId,
            amount: config.reward_amount,
            configKey: config.config_key,
          }));

          // 创建奖励交易记录
          const transactions = await Promise.all(
            rewards.map(reward =>
              prisma.rewardTransactions.create({
                data: {
                  userId: reward.userId,
                  amount: reward.amount,
                  description: `推荐奖励 - ${reward.configKey}`,
                  rewardType: 'referral',
                  triggerUserId: refereeId,
                },
              })
            )
          );

          return transactions;
        });

        return Promise.all(calculations);
      });

      expect(result).toHaveLength(concurrentCalculations);
      expect(duration).toBeLessThan(3000); // 应该在3秒内完成

      console.log(`并发计算${concurrentCalculations}次奖励耗时: ${duration.toFixed(2)}ms`);
    });

    test('数据库连接池在高并发下的表现', async () => {
      const concurrentConnections = 100;
      const operations = [];

      for (let i = 0; i < concurrentConnections; i++) {
        operations.push(
          prisma.$transaction(async (tx) => {
            const user = testDataGenerator.generateUser({
              id: `perf-test-user-${i}`,
              telegramId: `perf_${i}`,
            });

            await tx.users.create({ data: user });

            // 模拟一些查询操作
            const userCount = await tx.users.count({
              where: { id: { startsWith: 'perf-test-user-' } }
            });

            return userCount;
          })
        );
      }

      const { totalTime, averageTime } = await PerformanceTester.testConcurrency(
        () => Promise.all(operations),
        1
      );

      console.log(`数据库连接池性能测试结果:`);
      console.log(`总耗时: ${totalTime.toFixed(2)}ms`);
      console.log(`并发连接数: ${concurrentConnections}`);
      console.log(`平均每个连接耗时: ${averageTime.toFixed(2)}ms`);

      expect(totalTime).toBeLessThan(10000); // 总耗时应在10秒内
      expect(averageTime).toBeLessThan(100); // 平均每个操作应在100ms内
    });
  });

  describe('内存使用监控', () => {
    test('大量推荐关系创建的内存使用', async () => {
      const initialMemory = PerformanceTester.getMemoryUsage();
      
      // 创建大量推荐关系
      const referralCount = 10000;
      const users: any[] = [];
      
      for (let i = 0; i < referralCount; i++) {
        users.push(
          testDataGenerator.generateUser({
            id: `memory-test-user-${i}`,
            telegramId: `memory_${i}`,
            referralCode: `MEMORY${i}`,
          })
        );
      }

      await prisma.users.createMany({ data: users });

      // 创建推荐关系
      const relationships = [];
      for (let i = 0; i < referralCount - 1; i++) {
        relationships.push({
          referrerUserId: `memory-test-user-${i}`,
          refereeUserId: `memory-test-user-${i + 1}`,
          referralLevel: 1,
        });
      }

      await prisma.referralRelationships.createMany({ data: relationships });

      const peakMemory = PerformanceTester.getMemoryUsage();

      console.log('内存使用情况:');
      console.log(`初始内存: ${JSON.stringify(initialMemory, null, 2)}`);
      console.log(`峰值内存: ${JSON.stringify(peakMemory, null, 2)}`);

      expect(peakMemory.heapUsed - initialMemory.heapUsed).toBeLessThan(500); // 内存增长应小于500MB
    });
  });

  describe('API响应时间测试', () => {
    test('推荐绑定API响应时间', async () => {
      const requestCount = 100;
      const responseTimes: number[] = [];

      // 模拟API调用
      for (let i = 0; i < requestCount; i++) {
        const startTime = process.hrtime.bigint();
        
        const request = createMockRequest({
          referrerCode: `TEST_CODE_${i}`,
          refereeTelegramId: `telegram_${i}`,
        });

        // 这里可以模拟实际的API调用逻辑
        await prisma.users.create({
          data: testDataGenerator.generateUser({
            id: `api-test-${i}`,
            telegramId: `api_${i}`,
            referralCode: `API_CODE_${i}`,
          })
        });

        const endTime = process.hrtime.bigint();
        responseTimes.push(Number(endTime - startTime) / 1000000);
      }

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

      console.log('API响应时间统计:');
      console.log(`平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`最大响应时间: ${maxResponseTime.toFixed(2)}ms`);
      console.log(`95%响应时间: ${p95ResponseTime.toFixed(2)}ms`);

      expect(avgResponseTime).toBeLessThan(100); // 平均响应时间应小于100ms
      expect(maxResponseTime).toBeLessThan(500); // 最大响应时间应小于500ms
      expect(p95ResponseTime).toBeLessThan(200); // 95%响应时间应小于200ms
    });
  });

  describe('数据库事务性能', () => {
    test('大量数据插入事务性能', async () => {
      const dataSize = 1000;
      const { duration } = await PerformanceTester.measureExecutionTime(async () => {
        await prisma.$transaction(async (tx) => {
          // 批量插入用户
          const users = Array(dataSize).fill(0).map((_, i) =>
            testDataGenerator.generateUser({
              id: `transaction-test-${i}`,
              telegramId: `tx_${i}`,
            })
          );

          await tx.users.createMany({ data: users });

          // 批量插入推荐关系
          const relationships = Array(dataSize - 1).fill(0).map((_, i) => ({
            referrerUserId: `transaction-test-${i}`,
            refereeUserId: `transaction-test-${i + 1}`,
            referralLevel: 1,
          }));

          await tx.referralRelationships.createMany({ data: relationships });
        });
      });

      console.log(`批量插入${dataSize}条记录事务耗时: ${duration.toFixed(2)}ms`);
      
      expect(duration).toBeLessThan(3000); // 事务应在3秒内完成
    });

    test('复杂查询性能', async () => {
      // 创建测试数据
      const userCount = 1000;
      await prisma.users.createMany({
        data: Array(userCount).fill(0).map((_, i) =>
          testDataGenerator.generateUser({
            id: `query-test-${i}`,
            telegramId: `query_${i}`,
          })
        )
      });

      const { duration } = await PerformanceTester.measureExecutionTime(async () => {
        // 执行复杂查询
        await prisma.referralRelationships.findMany({
          include: {
            referrer: true,
            referee: true,
          },
          where: {
            referralLevel: 1,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      });

      console.log(`复杂查询耗时: ${duration.toFixed(2)}ms`);
      
      expect(duration).toBeLessThan(1000); // 查询应在1秒内完成
    });
  });
});