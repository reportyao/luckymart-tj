import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
#!/usr/bin/env node
/**
 * 数据库并发性能测试
 * 测试数据库在高并发场景下的表现
 */


interface DatabaseTestResult {
  testName: string;
  operation: string;
  concurrentUsers: number;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  throughput: number;
  errorRate: number;
  deadlockCount: number;
}

class DatabaseStressTester {
  private prisma = new PrismaClient();
  private results: DatabaseTestResult[] = [];

  async runDatabaseStressTest(): Promise<void> {
    console.log('🔄 开始数据库压力测试...');
    
    await this.prisma.$connect();
    
    try {
      // 准备测试数据
      await this.prepareTestData();
      
      // 并发用户注册测试
      await this.testConcurrentUserRegistration();
      
      // 并发余额更新测试
      await this.testConcurrentBalanceUpdates();
      
      // 并发订单创建测试
      await this.testConcurrentOrderCreation();
      
      // 并发推荐关系查询测试
      await this.testConcurrentReferralQueries();
      
      // 并发奖励配置查询测试
      await this.testConcurrentConfigQueries();
      
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async prepareTestData(): Promise<void> {
    console.log('📦 准备测试数据...');
    
    // 创建基础用户数据
    const users = [];
    for (let i = 0; i < 100; i++) {
      users.push({
        telegramId: `test_${i}_${Date.now()}`,
        username: `testuser_${i}`,
        firstName: `Test${i}`,
        lastName: `User${i}`,
        balance: Math.floor(Math.random() * 10000) + 1000,
        freeTimes: Math.floor(Math.random() * 5) + 1,
        isActive: true
      });
    }
    
    // 批量插入用户（使用原生SQL以提高性能）
    const values = users.map((user, i) =>;
      `(${user.telegramId}, '${user.username}', '${user.firstName}', '${user.lastName}', ${user.balance}, ${user.freeTimes}, ${user.isActive})`
    ).join(', ');
    
    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "users" ("telegram_id", "username", "first_name", "last_name", "balance", "free_times", "is_active") VALUES ${values} ON CONFLICT ("telegram_id") DO NOTHING`
      );
    } catch (error) {
      // 忽略插入冲突，继续测试
    }
    
    console.log('✅ 测试数据准备完成');
  }

  private async testConcurrentUserRegistration(): Promise<void> {
    console.log('\n👥 测试并发用户注册...');
    await this.performConcurrentOperations({
      testName: '并发用户注册',
      operation: 'user_registration',
      concurrentUsers: 50,
      operationsPerUser: 20,
      operationFn: async (userId) => {
        const telegramId = `stress_test_${userId}_${Date.now()}`;
        return this.prisma.user.upsert({
          where: { telegramId },
          update: {
            lastActive: new Date(),
            freeTimes: { increment: 1 }
          },
          create: {
            telegramId,
            username: `st_user_${userId}`,
            firstName: 'Stress',
            lastName: 'Test',
            balance: 1000,
            freeTimes: 5,
            isActive: true
          }
        });
      }
    });
  }

  private async testConcurrentBalanceUpdates(): Promise<void> {
    console.log('\n💰 测试并发余额更新...');
    await this.performConcurrentOperations({
      testName: '并发余额更新',
      operation: 'balance_update',
      concurrentUsers: 30,
      operationsPerUser: 50,
      operationFn: async (userId) => {
        const randomAmount = Math.floor(Math.random() * 1000) - 500; // -500 to 500;
        return this.prisma.user.update({
          where: { id: userId },
          data: { 
            balance: { increment: randomAmount },
            lastActive: new Date()
          }
        });
      }
    });
  }

  private async testConcurrentOrderCreation(): Promise<void> {
    console.log('\n📦 测试并发订单创建...');
    await this.performConcurrentOperations({
      testName: '并发订单创建',
      operation: 'order_creation',
      concurrentUsers: 40,
      operationsPerUser: 30,
      operationFn: async (userId) => {
        const order = {
          userId,
          orderType: 'lottery' as const,
          totalAmount: Math.floor(Math.random() * 100) + 10,
          status: 'pending' as const,
          createdAt: new Date()
        };
        
        return this.prisma.order.create({
          data: order
        });
      }
    });
  }

  private async testConcurrentReferralQueries(): Promise<void> {
    console.log('\n🔗 测试并发推荐关系查询...');
    await this.performConcurrentOperations({
      testName: '并发推荐关系查询',
      operation: 'referral_query',
      concurrentUsers: 60,
      operationsPerUser: 40,
      operationFn: async (userId) => {
        return this.prisma.user.findMany({
          where: {
            OR: [
              { referredBy: userId },
              { id: userId }
            ]
          },
          select: {
            id: true,
            telegramId: true,
            username: true,
            balance: true,
            referredBy: true
          },
          take: 10
        });
      }
    });
  }

  private async testConcurrentConfigQueries(): Promise<void> {
    console.log('\n⚙️ 测试并发配置查询...');
    await this.performConcurrentOperations({
      testName: '并发配置查询',
      operation: 'config_query',
      concurrentUsers: 20,
      operationsPerUser: 100,
      operationFn: async () => {
        return this.prisma.rewardConfig.findMany({
          where: { isActive: true },
          orderBy: { level: 'asc' },
          take: 50
        });
      }
    });
  }

  private async performConcurrentOperations(params: {
    testName: string;
    operation: string;
    concurrentUsers: number;
    operationsPerUser: number;
    operationFn: (userId: number) => Promise<any>;
  }): Promise<DatabaseTestResult> {
    const { testName, operation, concurrentUsers, operationsPerUser, operationFn } = params;
    
    const startTime = performance.now();
    const workers: Promise<void>[] = [];
    const responseTimes: number[] = [];
    let successCount = 0;
    let failureCount = 0;
    let deadlockCount = 0;

    // 获取可用用户ID进行测试
    const users = await this.prisma.user.findMany({
      select: { id: true },
      take: concurrentUsers
    });

    // 创建并发工作者
    for (let i = 0; i < concurrentUsers; i++) {
      const userId = users[i % users.length]?.id || i + 1;
      workers.push(this.databaseWorker(userId, operationsPerUser, operationFn, responseTimes, successCount, failureCount, deadlockCount));
    }

    // 等待所有工作者完成
    await Promise.allSettled(workers);

    const endTime = performance.now();
    const duration = endTime - startTime;

    const totalOperations = concurrentUsers * operationsPerUser;
    const avgResponseTime = responseTimes.length > 0;
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const result: DatabaseTestResult = {
      testName,
      operation,
      concurrentUsers,
      totalOperations,
      successfulOperations: successCount,
      failedOperations: failureCount,
      avgResponseTime,
      maxResponseTime: Math.max(...responseTimes, 0),
      minResponseTime: Math.min(...responseTimes, 0),
      throughput: (totalOperations / duration) * 1000,
      errorRate: (failureCount / totalOperations) * 100,
      deadlockCount
    };

    this.results.push(result);
    this.printResult(result);
    return result;
  }

  private async databaseWorker(
    userId: number,
    operationsPerUser: number,
    operationFn: (userId: number) => Promise<any>,
    responseTimes: number[],
    successCount: number,
    failureCount: number,
    deadlockCount: number
  ): Promise<void> {
    for (let i = 0; i < operationsPerUser; i++) {
      try {
        const operationStart = performance.now();
        
        await operationFn(userId);
        
        const operationEnd = performance.now();
        const responseTime = operationEnd - operationStart;
        responseTimes.push(responseTime);
        successCount++;
        
      } catch (error) {
        failureCount++;
        if (error.message.includes('deadlock')) {
          deadlockCount++;
        }
        // 记录错误但不中断测试
      }

      // 轻微延迟避免过于激进的数据库操作
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
  }

  private printResult(result: DatabaseTestResult): void {
    console.log(`\n📊 ${result.testName} 结果:`);
    console.log(`   📊 总操作数: ${result.totalOperations.toLocaleString()}`);
    console.log(`   ✅ 成功: ${result.successfulOperations.toLocaleString()}`);
    console.log(`   ❌ 失败: ${result.failedOperations.toLocaleString()}`);
    console.log(`   🔒 死锁: ${result.deadlockCount}`);
    console.log(`   ⏱️ 平均响应时间: ${result.avgResponseTime.toFixed(2)}ms`);
    console.log(`   📈 吞吐量: ${result.throughput.toFixed(2)} 操作/秒`);
    console.log(`   🚨 错误率: ${result.errorRate.toFixed(2)}%`);
  }

  async generateDatabaseReport(): Promise<string> {
    const totalOperations = this.results.reduce((sum, r) => sum + r.totalOperations, 0);
    const totalSuccesses = this.results.reduce((sum, r) => sum + r.successfulOperations, 0);
    const totalFailures = this.results.reduce((sum, r) => sum + r.failedOperations, 0);
    const totalDeadlocks = this.results.reduce((sum, r) => sum + r.deadlockCount, 0);

    let report = `;
# 数据库压力测试报告

## 📊 总体指标

| 指标 | 数值 |
|------|------|
| 测试数量 | ${this.results.length} 个 |
| 总操作数 | ${totalOperations.toLocaleString()} 个 |
| 成功操作 | ${totalSuccesses.toLocaleString()} 个 |
| 失败操作 | ${totalFailures.toLocaleString()} 个 |
| 死锁次数 | ${totalDeadlocks} 次 |
| 整体成功率 | ${((totalSuccesses / totalOperations) * 100).toFixed(2)}% |
| 平均吞吐量 | ${(totalOperations / (this.results.reduce((sum, r) => sum + r.avgResponseTime, 0) / 1000)).toFixed(2)} 操作/秒 |

## 📋 详细测试结果

`;

    this.results.forEach((result, index) => {
      report += `
### ${index + 1}. ${result.testName}

**操作类型**: ${result.operation}
**并发用户**: ${result.concurrentUsers}
**总操作数**: ${result.totalOperations.toLocaleString()}

| 指标 | 数值 |
|------|------|
| 成功操作 | ${result.successfulOperations.toLocaleString()} |
| 失败操作 | ${result.failedOperations.toLocaleString()} |
| 死锁次数 | ${result.deadlockCount} |
| 错误率 | ${result.errorRate.toFixed(2)}% |
| 平均响应时间 | ${result.avgResponseTime.toFixed(2)}ms |
| 最大响应时间 | ${result.maxResponseTime.toFixed(2)}ms |
| 最小响应时间 | ${result.minResponseTime.toFixed(2)}ms |
| 吞吐量 | ${result.throughput.toFixed(2)} 操作/秒 |

`;
    });

    // 数据库性能评估
    const excellentTests = this.results.filter(r => r.errorRate < 0.1 && r.avgResponseTime < 10);
    const goodTests = this.results.filter(r => r.errorRate < 1 && r.avgResponseTime < 50);
    const needsImprovement = this.results.filter(r => r.errorRate >= 1 || r.avgResponseTime >= 50);

    report += `
## 🎯 性能评估

### 优秀 (✅) - 错误率 < 0.1%, 响应时间 < 10ms
${excellentTests.map(r => `- ${r.testName}`).join('\n') || '无'}

### 良好 (🟡) - 错误率 < 1%, 响应时间 < 50ms
${goodTests.map(r => `- ${r.testName}`).join('\n') || '无'}

### 需要优化 (🔴) - 错误率 >= 1% 或 响应时间 >= 50ms
${needsImprovement.map(r => `- ${r.testName} (错误率: ${r.errorRate.toFixed(1)}%, 响应时间: ${r.avgResponseTime.toFixed(2)}ms)`).join('\n') || '无'}

## 💡 优化建议

1. **死锁处理**: ${totalDeadlocks > 0 ? `检测到 ${totalDeadlocks} 次死锁，建议优化事务粒度和索引` : '无死锁检测到'}
2. **响应时间**: 对平均响应时间超过50ms的操作进行索引优化
3. **并发控制**: 考虑使用读写分离和连接池
4. **事务优化**: 重构长事务，使用乐观锁减少锁竞争
5. **监控告警**: 设置数据库性能监控和慢查询告警

---
*数据库压力测试报告生成时间: ${new Date().toISOString()}*
`;

    console.log(report);
    return report;
  }
}

async function main() {
  console.log('🚀 数据库压力测试开始');
  console.log('📅 开始时间:', new Date().toISOString());

  const tester = new DatabaseStressTester();

  try {
    await tester.runDatabaseStressTest();
    const report = await tester.generateDatabaseReport();
    
    // 保存报告
    const fs = await import('fs');
    const reportPath = '/workspace/luckymart-tj/test-reports/database-stress-test-report.md';
    
    const reportsDir = '/workspace/luckymart-tj/test-reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 数据库压力测试报告已保存到: ${reportPath}`);

  } catch (error) {
    console.error('❌ 数据库压力测试失败:', error);
    process.exit(1);
  }

  console.log('\n🎉 数据库压力测试完成!');
}

if (require.main === module) {
  main();
}

export { DatabaseStressTester, DatabaseTestResult };