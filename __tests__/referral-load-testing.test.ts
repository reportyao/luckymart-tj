/**
 * 推荐系统负载测试
 * 测试系统在高负载场景下的性能表现和稳定性
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { TestDataGenerator, PerformanceTester, TestCleanup, testConfig } from './test-config';

describe('推荐系统负载测试', () => {
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

  describe('渐进式负载测试', () => {
    test('推荐绑定请求渐进式负载', async () => {
      const loadStages = [
        { users: 100, duration: 1000, name: '轻负载' },
        { users: 500, duration: 2000, name: '中负载' },
        { users: 1000, duration: 3000, name: '重负载' },
      ];

      const results = [];

      for (const stage of loadStages) {
        console.log(`\n开始${stage.name}测试: ${stage.users}用户，${stage.duration}ms`);

        const startTime = process.hrtime.bigint();
        let successCount = 0;
        let errorCount = 0;
        const responseTimes: number[] = [];

        const concurrentOps = Array(stage.users).fill(0).map(async (_, i) => {
          const opStart = process.hrtime.bigint();
          
          try {
            // 模拟推荐绑定操作
            const userId = `load-test-user-${stage.name}-${i}`;
            const referrerId = `load-test-referrer-${stage.name}-${i % 10}`;

            // 创建用户
            await prisma.users.create({
              data: testDataGenerator.generateUser({
                id: userId,
                telegramId: `load_${stage.name}_${i}`,
              })
            });

            // 创建推荐关系
            if (i % 10 !== 0) { // 10%用户作为推荐者
              await prisma.referralRelationships.create({
                data: {
                  referrerUserId: referrerId,
                  refereeUserId: userId,
                  referralLevel: 1,
                }
              });
            }

            successCount++;
          } catch (error) {
            errorCount++;
          } finally {
            const opTime = Number(process.hrtime.bigint() - opStart) / 1000000;
            responseTimes.push(opTime);
          }
        });

        await Promise.all(concurrentOps);
        const totalTime = Number(process.hrtime.bigint() - startTime) / 1000000;

        const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        const maxResponseTime = Math.max(...responseTimes);
        const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

        const successRate = (successCount / stage.users) * 100;
        const throughput = stage.users / (totalTime / 1000); // ops/second

        const stageResult = {
          stage: stage.name,
          users: stage.users,
          duration: stage.duration,
          successCount,
          errorCount,
          successRate,
          totalTime,
          avgResponseTime,
          maxResponseTime,
          p95ResponseTime,
          throughput
        };

        results.push(stageResult);

        console.log(`${stage.name}测试结果:`, {
          成功率: `${successRate.toFixed(2)}%`,
          平均响应时间: `${avgResponseTime.toFixed(2)}ms`,
          最大响应时间: `${maxResponseTime.toFixed(2)}ms`,
          P95响应时间: `${p95ResponseTime.toFixed(2)}ms`,
          吞吐量: `${throughput.toFixed(2)} ops/s`
        });

        // 验证性能指标
        expect(successRate).toBeGreaterThan(95); // 成功率应大于95%
        expect(avgResponseTime).toBeLessThan(1000); // 平均响应时间应小于1秒
        expect(throughput).toBeGreaterThan(10); // 吞吐量应大于10 ops/s
      }

      // 验证负载递增对性能的影响
      expect(results[1].avgResponseTime).toBeGreaterThan(results[0].avgResponseTime);
      expect(results[2].avgResponseTime).toBeGreaterThan(results[1].avgResponseTime);
    });

    test('推荐奖励计算负载测试', async () => {
      const rewardConfig = {
        first_lottery: { rate: 0.05, amount: 3.0 },
        first_purchase: { rate: 0.10, amount: 10.0 },
        daily_activity: { rate: 0.02, amount: 1.0 },
      };

      const concurrentCalculations = 2000;
      const calculationCount = 5000;

      console.log(`开始奖励计算负载测试: ${concurrentCalculations}并发，${calculationCount}计算次数`);

      const startTime = process.hrtime.bigint();
      let successCount = 0;
      let errorCount = 0;

      // 创建推荐关系数据
      const referralCount = 100;
      await prisma.users.createMany({
        data: Array(referralCount).fill(0).map((_, i) =>
          testDataGenerator.generateUser({
            id: `reward-load-user-${i}`,
            telegramId: `reward_${i}`,
            coinBalance: 1000,
          })
        )
      });

      const relationships = [];
      for (let i = 0; i < referralCount; i++) {
        for (let j = i + 1; j < Math.min(i + 5, referralCount); j++) {
          relationships.push({
            referrerUserId: `reward-load-user-${i}`,
            refereeUserId: `reward-load-user-${j}`,
            referralLevel: (j - i) % 3 + 1,
          });
        }
      }

      if (relationships.length > 0) {
        await prisma.referralRelationships.createMany({ data: relationships });
      }

      // 并发奖励计算
      for (let batch = 0; batch < calculationCount / concurrentCalculations; batch++) {
        const batchOperations = Array(concurrentCalculations).fill(0).map(async (_, i) => {
          const userIndex = Math.floor(Math.random() * referralCount);
          const rewardType = Object.keys(rewardConfig)[Math.floor(Math.random() * 3)] as keyof typeof rewardConfig;
          const config = rewardConfig[rewardType];

          try {
            const rewardAmount = Number((config.amount * config.rate).toFixed(1));

            await prisma.rewardTransactions.create({
              data: {
                userId: `reward-load-user-${userIndex}`,
                amount: rewardAmount,
                description: `load-test ${rewardType}`,
                rewardType: 'referral',
                triggerUserId: `reward-load-user-${Math.floor(Math.random() * referralCount)}`,
              }
            });

            successCount++;
          } catch (error) {
            errorCount++;
          }
        });

        await Promise.all(batchOperations);
      }

      const totalTime = Number(process.hrtime.bigint() - startTime) / 1000000;
      const throughput = calculationCount / (totalTime / 1000);

      console.log('奖励计算负载测试结果:', {
        总计算次数: calculationCount,
        成功次数: successCount,
        失败次数: errorCount,
        成功率: `${((successCount / calculationCount) * 100).toFixed(2)}%`,
        总耗时: `${totalTime.toFixed(2)}ms`,
        吞吐量: `${throughput.toFixed(2)} calculations/s`,
        平均每次计算时间: `${(totalTime / calculationCount).toFixed(2)}ms`
      });

      expect(successCount / calculationCount).toBeGreaterThan(0.95); // 成功率应大于95%
      expect(throughput).toBeGreaterThan(100); // 吞吐量应大于100 calculations/s
    });
  });

  describe('压力测试', () => {
    test('数据库连接池压力测试', async () => {
      const maxConnections = 100;
      const testDuration = 10000; // 10秒
      const operationInterval = 50; // 每50ms执行一次操作

      console.log(`开始数据库连接池压力测试: 最大${maxConnections}连接，${testDuration}ms持续时间`);

      let activeConnections = 0;
      let totalOperations = 0;
      let successOperations = 0;
      let errorOperations = 0;
      const responseTimes: number[] = [];

      const startTime = Date.now();
      const endTime = startTime + testDuration;

      // 创建多个并发连接
      const connections = Array(maxConnections).fill(0).map(async (_, connectionId) => {
        const connection = prisma.$connect();

        while (Date.now() < endTime) {
          activeConnections++;

          const opStart = process.hrtime.bigint();
          
          try {
            // 执行数据库操作
            await prisma.$transaction(async (tx) => {
              const user = await tx.users.create({
                data: testDataGenerator.generateUser({
                  id: `stress-test-user-${connectionId}-${totalOperations}`,
                  telegramId: `stress_${connectionId}_${totalOperations}`,
                })
              });

              await tx.referralRelationships.create({
                data: {
                  referrerUserId: user.id,
                  refereeUserId: `stress-test-referee-${connectionId}-${totalOperations}`,
                  referralLevel: 1,
                }
              });
            });

            successOperations++;
          } catch (error) {
            errorOperations++;
          } finally {
            const opTime = Number(process.hrtime.bigint() - opStart) / 1000000;
            responseTimes.push(opTime);
            totalOperations++;
            activeConnections--;
          }

          await new Promise(resolve => setTimeout(resolve, operationInterval));
        }

        await connection;
      });

      await Promise.all(connections);

      const totalTime = Date.now() - startTime;
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const p99ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.99)];
      const maxResponseTime = Math.max(...responseTimes);
      const throughput = totalOperations / (totalTime / 1000);

      console.log('数据库连接池压力测试结果:', {
        测试时长: `${totalTime}ms`,
        总操作数: totalOperations,
        成功操作: successOperations,
        失败操作: errorOperations,
        成功率: `${((successOperations / totalOperations) * 100).toFixed(2)}%`,
        平均响应时间: `${avgResponseTime.toFixed(2)}ms`,
        P99响应时间: `${p99ResponseTime.toFixed(2)}ms`,
        最大响应时间: `${maxResponseTime.toFixed(2)}ms`,
        吞吐量: `${throughput.toFixed(2)} ops/s`
      });

      expect(successOperations / totalOperations).toBeGreaterThan(0.90); // 成功率应大于90%
      expect(avgResponseTime).toBeLessThan(5000); // 平均响应时间应小于5秒
      expect(throughput).toBeGreaterThan(5); // 吞吐量应大于5 ops/s
    });

    test('内存泄漏检测', async () => {
      const iterations = 1000;
      const batchSize = 100;
      
      console.log(`开始内存泄漏检测: ${iterations}次迭代，每次${batchSize}个操作`);

      const memorySnapshots: any[] = [];
      
      for (let i = 0; i < iterations; i++) {
        // 执行一批操作
        const operations = Array(batchSize).fill(0).map(async (_, j) => {
          const userId = `memory-leak-test-${i}-${j}`;
          
          await prisma.users.create({
            data: testDataGenerator.generateUser({
              id: userId,
              telegramId: `memory_${i}_${j}`,
            })
          });

          // 清理部分数据以模拟真实场景
          if (i % 10 === 0 && j % 5 === 0) {
            await prisma.users.delete({
              where: { id: userId }
            });
          }
        });

        await Promise.all(operations);

        // 每100次迭代记录一次内存快照
        if (i % 100 === 0) {
          const memoryUsage = PerformanceTester.getMemoryUsage();
          memorySnapshots.push({
            iteration: i,
            memory: memoryUsage
          });
          
          // 强制垃圾回收（如果可用）
          if (global.gc) {
            global.gc();
          }
        }
      }

      // 分析内存使用趋势
      const initialMemory = memorySnapshots[0].memory.heapUsed;
      const finalMemory = memorySnapshots[memorySnapshots.length - 1].memory.heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      const growthRate = (memoryGrowth / initialMemory) * 100;

      console.log('内存泄漏检测结果:', {
        初始内存: `${initialMemory.toFixed(2)}MB`,
        最终内存: `${finalMemory.toFixed(2)}MB`,
        内存增长: `${memoryGrowth.toFixed(2)}MB`,
        增长率: `${growthRate.toFixed(2)}%`,
        快照数量: memorySnapshots.length
      });

      // 内存增长应该在合理范围内（小于20%）
      expect(growthRate).toBeLessThan(20);
      expect(finalMemory).toBeLessThan(initialMemory * 2); // 最终内存不应超过初始内存的2倍
    });
  });

  describe('长时间稳定性测试', () => {
    test('长时间运行稳定性', async () => {
      const testDuration = 30000; // 30秒
      const operationInterval = 100; // 每100ms执行一次操作
      const expectedOperations = testDuration / operationInterval;

      console.log(`开始长时间稳定性测试: ${testDuration}ms`);

      let operationCount = 0;
      let successCount = 0;
      let errorCount = 0;
      const responseTimes: number[] = [];

      const startTime = Date.now();
      const endTime = startTime + testDuration;

      // 启动稳定的工作负载
      const workload = setInterval(async () => {
        if (Date.now() >= endTime) {
          clearInterval(workload);
          return;
        }

        const opStart = process.hrtime.bigint();
        
        try {
          const userId = `stability-test-${operationCount}`;
          
          await prisma.$transaction(async (tx) => {
            await tx.users.create({
              data: testDataGenerator.generateUser({
                id: userId,
                telegramId: `stability_${operationCount}`,
              })
            });

            // 随机创建推荐关系
            if (operationCount > 0 && Math.random() < 0.3) {
              await tx.referralRelationships.create({
                data: {
                  referrerUserId: `stability-test-${operationCount - 1}`,
                  refereeUserId: userId,
                  referralLevel: 1,
                }
              });
            }
          });

          successCount++;
        } catch (error) {
          errorCount++;
        } finally {
          const opTime = Number(process.hrtime.bigint() - opStart) / 1000000;
          responseTimes.push(opTime);
          operationCount++;
        }
      }, operationInterval);

      // 等待测试完成
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (Date.now() >= endTime) {
            clearInterval(checkInterval);
            resolve(null);
          }
        }, 100);
      });

      const actualDuration = Date.now() - startTime;
      const actualThroughput = operationCount / (actualDuration / 1000);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

      console.log('长时间稳定性测试结果:', {
        预期操作数: expectedOperations,
        实际操作数: operationCount,
        成功操作: successCount,
        失败操作: errorCount,
        成功率: `${((successCount / operationCount) * 100).toFixed(2)}%`,
        实际运行时间: `${actualDuration}ms`,
        平均响应时间: `${avgResponseTime.toFixed(2)}ms`,
        P95响应时间: `${p95ResponseTime.toFixed(2)}ms`,
        吞吐量: `${actualThroughput.toFixed(2)} ops/s`
      });

      // 验证系统稳定性
      expect(operationCount).toBeGreaterThan(expectedOperations * 0.95); // 操作数应达到预期的95%以上
      expect(successCount / operationCount).toBeGreaterThan(0.98); // 成功率应大于98%
      expect(avgResponseTime).toBeLessThan(100); // 平均响应时间应稳定在100ms以内
    });
  });

  describe('故障恢复测试', () => {
    test('系统故障恢复能力', async () => {
      console.log('开始故障恢复能力测试');

      // 正常操作阶段
      const normalOperations = Array(50).fill(0).map(async (_, i) => {
        await prisma.users.create({
          data: testDataGenerator.generateUser({
            id: `recovery-test-normal-${i}`,
            telegramId: `recovery_normal_${i}`,
          })
        });
      });

      await Promise.all(normalOperations);

      // 模拟故障阶段 - 大量并发操作导致资源紧张
      const stressOperations = Array(200).fill(0).map(async (_, i) => {
        try {
          await prisma.users.create({
            data: testDataGenerator.generateUser({
              id: `recovery-test-stress-${i}`,
              telegramId: `recovery_stress_${i}`,
            })
          });
        } catch (error) {
          // 预期会有部分失败
          console.log(`stress operation ${i} failed:`, (error as Error).message);
        }
      });

      await Promise.all(stressOperations);

      // 恢复阶段 - 系统应该能够恢复正常性能
      const recoveryStartTime = process.hrtime.bigint();
      
      const recoveryOperations = Array(100).fill(0).map(async (_, i) => {
        const startTime = process.hrtime.bigint();
        
        const user = await prisma.users.create({
          data: testDataGenerator.generateUser({
            id: `recovery-test-recovery-${i}`,
            telegramId: `recovery_recovery_${i}`,
          })
        });

        const responseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
        return { user, responseTime };
      });

      const recoveryResults = await Promise.all(recoveryOperations);
      const recoveryTime = Number(process.hrtime.bigint() - recoveryStartTime) / 1000000;
      
      const avgRecoveryTime = recoveryResults.reduce((sum, result) => sum + result.responseTime, 0) / recoveryResults.length;

      console.log('故障恢复测试结果:', {
        正常操作: normalOperations.length,
        压力操作: stressOperations.length,
        恢复操作: recoveryOperations.length,
        恢复耗时: `${recoveryTime.toFixed(2)}ms`,
        平均恢复响应时间: `${avgRecoveryTime.toFixed(2)}ms`
      });

      // 验证系统能够恢复正常
      expect(recoveryResults.length).toBe(recoveryOperations.length); // 所有恢复操作都应成功
      expect(avgRecoveryTime).toBeLessThan(200); // 恢复后平均响应时间应小于200ms
    });
  });

  describe('资源使用监控', () => {
    test('资源使用峰值监控', async () => {
      const peakLoadOperations = 500;
      const resourceSnapshots: any[] = [];

      console.log(`开始资源使用峰值监控: ${peakLoadOperations}个操作`);

      // 记录初始资源状态
      const initialResource = PerformanceTester.getMemoryUsage();
      resourceSnapshots.push({ label: 'initial', ...initialResource });

      // 执行峰值负载操作
      const operations = Array(peakLoadOperations).fill(0).map(async (_, i) => {
        await prisma.$transaction(async (tx) => {
          await tx.users.create({
            data: testDataGenerator.generateUser({
              id: `resource-peak-${i}`,
              telegramId: `resource_${i}`,
            })
          });

          // 定期记录资源快照
          if (i % 50 === 0) {
            const resource = PerformanceTester.getMemoryUsage();
            resourceSnapshots.push({ 
              label: `operation_${i}`, 
              ...resource 
            });
          }
        });
      });

      await Promise.all(operations);

      // 记录最终资源状态
      const finalResource = PerformanceTester.getMemoryUsage();
      resourceSnapshots.push({ label: 'final', ...finalResource });

      // 分析资源使用情况
      const memoryIncrease = finalResource.heapUsed - initialResource.heapUsed;
      const maxMemoryUsed = Math.max(...resourceSnapshots.map(s => s.heapUsed));
      const memoryGrowthRate = (memoryIncrease / initialResource.heapUsed) * 100;

      console.log('资源使用监控结果:', {
        操作数量: peakLoadOperations,
        初始内存: `${initialResource.heapUsed}MB`,
        最终内存: `${finalResource.heapUsed}MB`,
        峰值内存: `${maxMemoryUsed}MB`,
        内存增长: `${memoryIncrease.toFixed(2)}MB`,
        增长率: `${memoryGrowthRate.toFixed(2)}%`,
        资源快照数: resourceSnapshots.length
      });

      // 验证资源使用在合理范围内
      expect(memoryGrowthRate).toBeLessThan(30); // 内存增长率应小于30%
      expect(maxMemoryUsed).toBeLessThan(initialResource.heapUsed * 1.5); // 峰值内存不应超过初始内存的1.5倍
    });
  });
});