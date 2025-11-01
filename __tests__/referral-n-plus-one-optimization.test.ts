import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { ReferralQueryOptimizer } from '../lib/referral-optimizer';
import { OptimizedReferralService } from '../lib/referral-service-optimized';
/**
 * 推荐系统N+1问题修复测试
 * 验证优化后的推荐系统性能
 */


describe('推荐系统N+1查询优化测试', () => {
  let prisma: PrismaClient;
  let optimizer: ReferralQueryOptimizer;
  let referralService: OptimizedReferralService;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    
    optimizer = new ReferralQueryOptimizer(prisma, true);
    referralService = new OptimizedReferralService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 清理测试数据
    await prisma.referralRelationships.deleteMany();
    await prisma.rewardTransactions.deleteMany();
    await prisma.users.deleteMany();
  });

  afterEach(async () => {
    await prisma.referralRelationships.deleteMany();
    await prisma.rewardTransactions.deleteMany();
    await prisma.users.deleteMany();
  });

  describe('递归查询性能对比', () => {
    test('优化前后性能对比 - 10层推荐树', async () => {
      // 创建10层推荐链
      const userCount = 10;
      const users = [];
      
      for (let i = 0; i < userCount; i++) {
        const user = await prisma.users.create({
          data: {
            telegramId: `test_user_${i}`,
            username: `user${i}`,
            firstName: `User${i}`,
            referralCode: `CODE${i}`
          }
        });
        users.push(user);
      }

      // 创建推荐关系链 A -> B -> C -> ... -> J
      for (let i = 0; i < userCount - 1; i++) {
        await prisma.referralRelationships.create({
          data: {
            referrerUserId: (users?.i ?? null).id,
            refereeUserId: users[i + 1].id,
            referralLevel: 1
          }
        });
      }

      // 测试优化后的WITH RECURSIVE查询
      console.log('\n🧪 测试10层推荐树循环检测...');
      
      const recursiveResult = await optimizer.detectCircularReferralWithRecursive(;
        (users?.0 ?? null).id,
        (users?.9 ?? null).id
      );

      const iterativeResult = await optimizer.detectCircularReferralIterative(;
        (users?.0 ?? null).id,
        (users?.9 ?? null).id
      );

      console.log('WITH RECURSIVE结果:', {
        hasCycle: recursiveResult.hasCycle,
        queryCount: recursiveResult.queryCount,
        executionTime: recursiveResult.executionTime.toFixed(2) + 'ms'
      });

      console.log('迭代算法结果:', {
        hasCycle: iterativeResult.hasCycle,
        queryCount: iterativeResult.queryCount,
        executionTime: iterativeResult.executionTime.toFixed(2) + 'ms'
      });

      // 验证结果
      expect(recursiveResult.hasCycle).toBe(false);
      expect(iterativeResult.hasCycle).toBe(false);
      
      // 优化后查询次数应该显著减少
      expect(recursiveResult.queryCount).toBeLessThanOrEqual(1);
      expect(iterativeResult.queryCount).toBeLessThanOrEqual(10);
      
      // 性能应该良好（10层深度下应该在100ms内完成）
      expect(recursiveResult.executionTime).toBeLessThan(100);
      expect(iterativeResult.executionTime).toBeLessThan(100);
    });

    test('复杂循环检测性能测试', async () => {
      // 创建复杂推荐网络：4个用户形成循环 A->B->C->D->A
      const users = [];
      
      for (let i = 0; i < 4; i++) {
        const user = await prisma.users.create({
          data: {
            telegramId: `cycle_user_${i}`,
            username: `cycle_user${i}`,
            firstName: `CycleUser${i}`,
            referralCode: `CYCLE${i}`
          }
        });
        users.push(user);
      }

      // 创建循环推荐关系
      for (let i = 0; i < 4; i++) {
        await prisma.referralRelationships.create({
          data: {
            referrerUserId: (users?.i ?? null).id,
            refereeUserId: users[(i + 1) % 4].id,
            referralLevel: 1
          }
        });
      }

      console.log('\n🧪 测试循环推荐检测...');
      
      // 测试循环检测
      const cycleResult = await optimizer.detectCircularReferralWithRecursive(;
        (users?.0 ?? null).id,
        (users?.0 ?? null).id
      );

      console.log('循环检测结果:', {
        hasCycle: cycleResult.hasCycle,
        cyclePath: cycleResult.cyclePath,
        queryCount: cycleResult.queryCount,
        executionTime: cycleResult.executionTime.toFixed(2) + 'ms'
      });

      expect(cycleResult.hasCycle).toBe(true);
      expect(cycleResult.cyclePath).toBeDefined();
      expect(cycleResult.queryCount).toBeLessThanOrEqual(1);
      expect(cycleResult.executionTime).toBeLessThan(50);
    });

    test('15层推荐树性能测试（压力测试）', async () => {
      // 创建15层推荐链
      const userCount = 15;
      const users = [];
      
      for (let i = 0; i < userCount; i++) {
        const user = await prisma.users.create({
          data: {
            telegramId: `deep_user_${i}`,
            username: `deepuser${i}`,
            firstName: `DeepUser${i}`,
            referralCode: `DEEP${i}`
          }
        });
        users.push(user);
      }

      // 创建深度推荐链
      for (let i = 0; i < userCount - 1; i++) {
        await prisma.referralRelationships.create({
          data: {
            referrerUserId: (users?.i ?? null).id,
            refereeUserId: users[i + 1].id,
            referralLevel: 1
          }
        });
      }

      console.log('\n🧪 测试15层深度推荐树...');
      
      const startTime = performance.now();
      const result = await optimizer.detectCircularReferralWithRecursive(;
        (users?.0 ?? null).id,
        (users?.14 ?? null).id
      );
      const endTime = performance.now();

      const totalTime = endTime - startTime;

      console.log('15层深度测试结果:', {
        hasCycle: result.hasCycle,
        queryCount: result.queryCount,
        executionTime: result.executionTime.toFixed(2) + 'ms',
        totalTime: totalTime.toFixed(2) + 'ms'
      });

      // 15层深度优化后的查询次数应该只有1次（使用WITH RECURSIVE）
      // 而递归算法会需要2^15-1 : 32767次查询
      expect(result.queryCount).toBe(1);
      expect(result.hasCycle).toBe(false);
      expect(result.executionTime).toBeLessThan(50);
      
      console.log(`✅ 性能对比: 优化前需要${Math.pow(2, 15) - 1}次查询，优化后只需${result.queryCount}次查询`);
    });
  });

  describe('推荐树分页性能测试', () => {
    test('大型推荐树分页查询', async () => {
      // 创建100个用户的推荐树
      const userCount = 100;
      const users = [];
      
      for (let i = 0; i < userCount; i++) {
        const user = await prisma.users.create({
          data: {
            telegramId: `tree_user_${i}`,
            username: `treeuser${i}`,
            firstName: `TreeUser${i}`,
            referralCode: `TREE${i}`
          }
        });
        users.push(user);
      }

      // 创建星型推荐结构（一个推荐者推荐99个用户）
      for (let i = 1; i < userCount; i++) {
        await prisma.referralRelationships.create({
          data: {
            referrerUserId: (users?.0 ?? null).id,
            refereeUserId: (users?.i ?? null).id,
            referralLevel: 1
          }
        });
      }

      console.log('\n🧪 测试推荐树分页查询...');
      
      // 测试分页查询
      const page1 = await optimizer.getReferralTree((users?.0 ?? null).id, 3, 20, 1);
      const page2 = await optimizer.getReferralTree((users?.0 ?? null).id, 3, 20, 2);
      const page3 = await optimizer.getReferralTree((users?.0 ?? null).id, 3, 20, 3);

      console.log('分页查询结果:', {
        page1: {
          items: page1.tree.length,
          total: page1.total,
          hasMore: page1.hasMore,
          queryCount: page1.performanceMetrics.queryCount,
          executionTime: page1.performanceMetrics.executionTime.toFixed(2) + 'ms'
        },
        page2: {
          items: page2.tree.length,
          total: page2.total,
          hasMore: page2.hasMore,
          queryCount: page2.performanceMetrics.queryCount,
          executionTime: page2.performanceMetrics.executionTime.toFixed(2) + 'ms'
        },
        page3: {
          items: page3.tree.length,
          total: page3.total,
          hasMore: page3.hasMore,
          queryCount: page3.performanceMetrics.queryCount,
          executionTime: page3.performanceMetrics.executionTime.toFixed(2) + 'ms'
        }
      });

      // 验证分页逻辑
      expect(page1.total).toBe(99); // 99个推荐用户
      expect(page1.tree.length).toBeLessThanOrEqual(20);
      expect(page1.hasMore).toBe(true);
      expect(page2.hasMore).toBe(true);
      expect(page3.hasMore).toBe(false);
      
      // 每个查询应该只需要2次查询（数据+计数）
      expect(page1.performanceMetrics.queryCount).toBe(2);
      expect(page1.performanceMetrics.executionTime).toBeLessThan(100);
    });
  });

  describe('批量循环检测性能测试', () => {
    test('批量循环检测效率对比', async () => {
      // 创建多个独立的推荐链
      const chains = 5;
      const chainLength = 10;
      const allUsers: string[] = [];
      
      for (let c = 0; c < chains; c++) {
        const chainUsers = [];
        
        for (let i = 0; i < chainLength; i++) {
          const user = await prisma.users.create({
            data: {
              telegramId: `batch_chain_${c}_user_${i}`,
              username: `batchuser${c}_${i}`,
              firstName: `BatchUser${c}_${i}`,
              referralCode: `BATCH${c}_${i}`
            }
          });
          chainUsers.push(user.id);
        }
        allUsers.push(...chainUsers);

        // 创建链式推荐关系
        for (let i = 0; i < chainLength - 1; i++) {
          await prisma.referralRelationships.create({
            data: {
              referrerUserId: chainUsers[i],
              refereeUserId: chainUsers[i + 1],
              referralLevel: 1
            }
          });
        }
      }

      console.log('\n🧪 测试批量循环检测...');
      
      // 创建批量检测请求
      const batchChecks = [];
      for (let c = 0; c < chains; c++) {
        batchChecks.push({
          startUserId: allUsers[c * chainLength],
          targetUserId: allUsers[c * chainLength + chainLength - 1]
        });
      }

      // 测试批量检测
      const batchResults = await optimizer.batchDetectCircularReferrals(batchChecks);

      console.log('批量检测结果:');
      batchChecks.forEach((check, index) => {
        const result = batchResults.get(`${check.startUserId}-${check.targetUserId}`);
        console.log(`Chain ${index + 1}:`, {
          hasCycle: result?.hasCycle,
          queryCount: result?.queryCount,
          executionTime: result?.executionTime.toFixed(2) + 'ms'
        });
      });

      // 验证批量检测结果
      let totalQueries = 0;
      batchResults.forEach(result => {
        expect(result.hasCycle).toBe(false);
        expect(result.queryCount).toBeLessThanOrEqual(1);
        totalQueries += result.queryCount;
      });

      console.log(`✅ 批量检测效率: ${batchChecks.length}个检测只使用了${totalQueries}次数据库查询`);
      expect(totalQueries).toBeLessThanOrEqual(batchChecks.length);
    });
  });

  describe('端到端推荐流程测试', () => {
    test('完整推荐流程性能测试', async () => {
      console.log('\n🧪 测试完整推荐流程...');
      
      // 创建推荐者和被推荐者
      const referrer = await prisma.users.create({
        data: {
          telegramId: 'referrer_test',
          username: 'referrer_test',
          firstName: 'ReferrerTest',
          referralCode: 'REFERRER_TEST'
        }
      });

      const referee = await prisma.users.create({
        data: {
          telegramId: 'referee_test',
          username: 'referee_test',
          firstName: 'RefereeTest'
        }
      });

      // 执行推荐绑定流程
      const bindResult = await referralService.bindReferralRelationship(;
        'REFERRER_TEST',
        'referee_test',
        {
          username: 'referee_test',
          firstName: 'RefereeTest'
        }
      );

      console.log('推荐绑定结果:', bindResult);

      expect(bindResult.success).toBe(true);
      expect(bindResult.performance?.queryCount).toBeLessThanOrEqual(5); // 优化后应该大幅减少查询次数
      expect(bindResult.performance?.executionTime).toBeLessThan(200);
      expect(bindResult.rewards).toBeDefined();

      // 获取推荐统计
      const stats = await referralService.getUserReferralStats(referrer.id);
      console.log('推荐统计:', stats);

      expect(stats.totalReferrals).toBe(1);
      expect(stats.level1Referrals).toBe(1);
      expect(stats.totalRewards).toBeGreaterThan(0);

      // 获取推荐树
      const treeResult = await referralService.getReferralTreePaginated(referrer.id, {
        maxDepth: 3,
        pageSize: 10,
        page: 1
      });

      console.log('推荐树结果:', {
        totalUsers: treeResult.total,
        pageSize: treeResult.tree.length,
        queryCount: treeResult.performanceMetrics.queryCount,
        executionTime: treeResult.performanceMetrics.executionTime.toFixed(2) + 'ms'
      });

      expect(treeResult.total).toBe(1);
      expect(treeResult.performanceMetrics.queryCount).toBe(2); // 数据查询 + 计数查询
      expect(treeResult.performanceMetrics.executionTime).toBeLessThan(100);
    });
  });

  describe('内存使用监控', () => {
    test('大量推荐关系创建的内存使用', async () => {
      const initialMemory = process.memoryUsage();
      
      console.log('\n🧪 测试大量推荐关系内存使用...');
      
      // 创建1000个用户
      const userCount = 1000;
      const users = [];
      
      for (let i = 0; i < userCount; i++) {
        const user = await prisma.users.create({
          data: {
            telegramId: `memory_test_${i}`,
            username: `memoryuser${i}`,
            firstName: `MemoryUser${i}`,
            referralCode: `MEMORY${i}`
          }
        });
        users.push(user);
      }

      // 创建复杂的推荐关系网络
      for (let i = 0; i < userCount - 1; i++) {
        // 每个用户推荐1-3个用户
        const referralCount = Math.floor(Math.random() * 3) + 1;
        
        for (let j = 1; j <= referralCount && i + j < userCount; j++) {
          await prisma.referralRelationships.create({
            data: {
              referrerUserId: (users?.i ?? null).id,
              refereeUserId: users[i + j].id,
              referralLevel: 1
            }
          });
        }
      }

      const peakMemory = process.memoryUsage();
      
      // 性能测试：批量检测推荐关系
      const batchChecks = [];
      for (let i = 0; i < Math.min(10, userCount); i++) {
        batchChecks.push({
          startUserId: (users?.i ?? null).id,
          targetUserId: users[Math.min(i + 10, userCount - 1)].id
        });
      }

      await optimizer.batchDetectCircularReferrals(batchChecks);

      const finalMemory = process.memoryUsage();

      console.log('内存使用情况:');
      console.log(`初始内存: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`峰值内存: ${(peakMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`最终内存: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`内存增长: ${((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`);

      // 内存增长应该控制在合理范围内
      expect(finalMemory.heapUsed - initialMemory.heapUsed).toBeLessThan(100 * 1024 * 1024); // 小于100MB
    });
  });
});