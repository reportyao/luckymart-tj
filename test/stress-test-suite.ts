import { performance } from 'perf_hooks';
#!/usr/bin/env node
/**
 * LuckyMartTJ 全面压力测试套件
 * 测试范围：并发请求、支付流程、推荐系统、防欺诈、缓存系统、Telegram认证、Rate Limiting
 */


interface TestResult {
  name: string;
  duration: number;
  requests: number;
  successes: number;
  failures: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  throughput: number;
  errorRate: number;
  details?: any;
}

interface LoadTestConfig {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  concurrent: number;
  requests: number;
  rampUpTime?: number;
}

class StressTestRunner {
  private results: TestResult[] = [];
  private baseUrl = '${API_BASE_URL}';

  async runLoadTest(config: LoadTestConfig): Promise<TestResult> {
    console.log(`\n🚀 开始加载测试: ${config.name}`);
    console.log(`   并发数: ${config.concurrent}, 总请求: ${config.requests}`);

    const startTime = performance.now();
    const workers: Promise<void>[] = [];
    const responseTimes: number[] = [];
    let successCount = 0;
    let failureCount = 0;

    // 创建并发工作者
    for (let i = 0; i < config.concurrent; i++) {
      workers.push(this.worker(config, i, responseTimes, successCount, failureCount));
    }

    // 等待所有工作者完成
    await Promise.all(workers);

    const endTime = performance.now();
    const duration = endTime - startTime;

    const avgResponseTime = responseTimes.length > 0;
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const result: TestResult = {
      name: config.name,
      duration,
      requests: config.requests,
      successes: successCount,
      failures: failureCount,
      avgResponseTime,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      throughput: (config.requests / duration) * 1000,
      errorRate: (failureCount / config.requests) * 100
    };

    this.results.push(result);
    this.printResult(result);
    return result;
  }

  private async worker(
    config: LoadTestConfig,
    workerId: number,
    responseTimes: number[],
    successCount: number,
    failureCount: number
  ): Promise<void> {
    const requestsPerWorker = Math.ceil(config.requests / config.concurrent);
    
    for (let i = 0; i < requestsPerWorker; i++) {
      try {
        const requestStart = performance.now();
        
        const response = await fetch(`${this.baseUrl}${config.url}`, {
          method: config.method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `StressTest-${workerId}-${i}`,
            ...config.headers
          },
          body: config.body ? JSON.stringify(config.body) : undefined,
          // 设置超时
          signal: AbortSignal.timeout(30000)
        });

        const requestEnd = performance.now();
        const responseTime = requestEnd - requestStart;
        responseTimes.push(responseTime);

        if (response.ok) {
          successCount++;
        } else {
          failureCount++;
          console.warn(`   ⚠️  请求失败 [${workerId}-${i}]: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        failureCount++;
        console.warn(`   ❌ 请求异常 [${workerId}-${i}]: ${error.message}`);
      }

      // 稍微延迟避免过于激进的请求
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }

  private printResult(result: TestResult): void {
    console.log(`\n📊 测试结果: ${result.name}`);
    console.log(`   ⏱️  总耗时: ${result.duration.toFixed(2)}ms`);
    console.log(`   📈 吞吐量: ${result.throughput.toFixed(2)} 请求/秒`);
    console.log(`   ✅ 成功: ${result.successes} (${(100 - result.errorRate).toFixed(1)}%)`);
    console.log(`   ❌ 失败: ${result.failures} (${result.errorRate.toFixed(1)}%)`);
    console.log(`   📊 响应时间: 最小 ${result.minResponseTime.toFixed(2)}ms, 平均 ${result.avgResponseTime.toFixed(2)}ms, 最大 ${result.maxResponseTime.toFixed(2)}ms`);
  }

  // 1. 并发请求测试
  async testConcurrentRequests(): Promise<void> {
    console.log('\n🔄 === 并发请求测试 ===');
    
    // 测试核心API端点
    const endpoints = [;
      { path: '/api/monitoring/health', concurrent: 100, requests: 1000 },
      { path: '/api/referral/my-code', concurrent: 50, requests: 500 },
      { path: '/api/admin/reward-config', concurrent: 30, requests: 300 },
    ];

    for (const endpoint of endpoints) {
      await this.runLoadTest({
        name: `并发请求测试 - ${endpoint.path}`,
        url: endpoint.path,
        method: 'GET',
        concurrent: endpoint.concurrent,
        requests: endpoint.requests,
        headers: {
          'Authorization': `Bearer ${this.generateMockToken()}`
        }
      });
    }
  }

  // 2. 支付流程测试
  async testPaymentFlow(): Promise<void> {
    console.log('\n💳 === 支付流程测试 ===');
    
    const paymentTests = [;
      {
        name: '支付确认接口',
        url: '/api/payment/confirm',
        method: 'POST',
        body: {
          orderId: 'test-order-' + Date.now(),
          amount: 100,
          userId: 'test-user-' + Math.floor(Math.random() * 1000)
        },
        concurrent: 80,
        requests: 800
      },
      {
        name: '充值接口',
        url: '/api/payment/recharge',
        method: 'POST',
        body: {
          amount: 50,
          paymentMethod: 'wechat',
          userId: 'test-user-' + Math.floor(Math.random() * 1000)
        },
        concurrent: 60,
        requests: 600
      },
      {
        name: '提现接口',
        url: '/api/payment/withdraw',
        method: 'POST',
        body: {
          amount: 30,
          bankAccount: '622848123456789',
          userId: 'test-user-' + Math.floor(Math.random() * 1000)
        },
        concurrent: 40,
        requests: 400
      }
    ];

    for (const test of paymentTests) {
      await this.runLoadTest({
        ...test,
        headers: {
          'Authorization': `Bearer ${this.generateMockToken()}`,
          'Content-Type': 'application/json'
        }
      });
    }
  }

  // 3. 推荐系统测试
  async testReferralSystem(): Promise<void> {
    console.log('\n👥 === 推荐系统测试 ===');
    
    const referralTests = [;
      {
        name: '推荐关系查询',
        url: '/api/referral/list',
        method: 'GET',
        concurrent: 70,
        requests: 700
      },
      {
        name: '返利计算',
        url: '/api/referral/calculate-rebate',
        method: 'POST',
        body: {
          userId: 'test-user-' + Math.floor(Math.random() * 1000),
          amount: 200,
          level: 1
        },
        concurrent: 50,
        requests: 500
      },
      {
        name: '奖励发放',
        url: '/api/referral/trigger-reward',
        method: 'POST',
        body: {
          userId: 'test-user-' + Math.floor(Math.random() * 1000),
          referrerId: 'test-ref-' + Math.floor(Math.random() * 100),
          amount: 50
        },
        concurrent: 40,
        requests: 400
      }
    ];

    for (const test of referralTests) {
      await this.runLoadTest({
        ...test,
        headers: {
          'Authorization': `Bearer ${this.generateMockToken()}`,
          'Content-Type': 'application/json'
        }
      });
    }
  }

  // 4. 防欺诈系统测试
  async testAntiFraudSystem(): Promise<void> {
    console.log('\n🛡️ === 防欺诈系统测试 ===');
    
    const fraudTests = [;
      {
        name: '设备指纹检测',
        url: '/api/anti-fraud/device-check',
        method: 'POST',
        body: {
          deviceId: 'device-' + Math.random().toString(36).substr(2, 9),
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Test Browser)',
          timestamp: Date.now()
        },
        concurrent: 80,
        requests: 800
      },
      {
        name: 'IP检测',
        url: '/api/anti-fraud/ip-check',
        method: 'POST',
        body: {
          ipAddress: `203.0.113.${Math.floor(Math.random() * 255)}`,
          userId: 'test-user-' + Math.floor(Math.random() * 1000)
        },
        concurrent: 60,
        requests: 600
      },
      {
        name: '僵尸账户检测',
        url: '/api/anti-fraud/zombie-check',
        method: 'POST',
        body: {
          userId: 'test-zombie-' + Math.floor(Math.random() * 1000),
          accountAge: Math.floor(Math.random() * 365),
          activityScore: Math.floor(Math.random() * 100)
        },
        concurrent: 50,
        requests: 500
      }
    ];

    for (const test of fraudTests) {
      await this.runLoadTest({
        ...test,
        headers: {
          'Authorization': `Bearer ${this.generateMockToken()}`,
          'Content-Type': 'application/json'
        }
      });
    }
  }

  // 5. 缓存系统测试
  async testCacheSystem(): Promise<void> {
    console.log('\n💾 === 缓存系统测试 ===');
    
    const cacheTests = [;
      {
        name: '热点数据查询',
        url: '/api/referral/my-code',
        method: 'GET',
        concurrent: 100,
        requests: 1000
      },
      {
        name: '配置数据读取',
        url: '/api/admin/reward-config',
        method: 'GET',
        concurrent: 80,
        requests: 800
      },
      {
        name: '统计数据查询',
        url: '/api/referral/stats',
        method: 'GET',
        concurrent: 70,
        requests: 700
      }
    ];

    for (const test of cacheTests) {
      await this.runLoadTest({
        ...test,
        headers: {
          'Authorization': `Bearer ${this.generateMockToken()}`,
          'Cache-Control': 'no-cache'
        }
      });
    }
  }

  // 6. Telegram认证测试
  async testTelegramAuth(): Promise<void> {
    console.log('\n📱 === Telegram认证测试 ===');
    
    const authTests = [;
      {
        name: 'WebApp数据验证',
        url: '/api/auth/telegram-webapp',
        method: 'POST',
        body: {
          initData: 'test_init_data_' + Math.random().toString(36).substr(2, 20),
          user: {
            id: Math.floor(Math.random() * 1000000),
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser'
          }
        },
        concurrent: 90,
        requests: 900
      },
      {
        name: 'Bot认证验证',
        url: '/api/auth/bot-verify',
        method: 'POST',
        body: {
          chatId: Math.floor(Math.random() * 1000000),
          messageId: Math.floor(Math.random() * 1000000),
          from: {
            id: Math.floor(Math.random() * 1000000),
            first_name: 'Bot',
            username: 'testbot'
          },
          text: '/start'
        },
        concurrent: 60,
        requests: 600
      }
    ];

    for (const test of authTests) {
      await this.runLoadTest({
        ...test,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }

  // 7. Rate Limiting测试
  async testRateLimiting(): Promise<void> {
    console.log('\n🚦 === Rate Limiting测试 ===');
    
    // 测试恶意攻击场景 - 快速连续请求
    const rateLimitTests = [;
      {
        name: '快速请求攻击测试',
        url: '/api/monitoring/health',
        method: 'GET',
        concurrent: 200,
        requests: 2000,
        rampUpTime: 1000
      },
      {
        name: '高频认证请求',
        url: '/api/auth/telegram-webapp',
        method: 'POST',
        body: {
          initData: 'rapid_attack_' + Date.now(),
          user: { id: 999999 }
        },
        concurrent: 150,
        requests: 1500
      },
      {
        name: '批量支付请求',
        url: '/api/payment/confirm',
        method: 'POST',
        body: {
          orderId: 'rapid_' + Date.now(),
          amount: 1,
          userId: 'rapid_user'
        },
        concurrent: 100,
        requests: 1000
      }
    ];

    for (const test of rateLimitTests) {
      await this.runLoadTest({
        ...test,
        headers: {
          'Authorization': `Bearer ${this.generateMockToken()}`,
          'Content-Type': 'application/json'
        }
      });
    }
  }

  // 生成模拟JWT Token
  private generateMockToken(): string {
    const payload = {
      userId: 'test-user-' + Math.floor(Math.random() * 1000),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: 'user'
    };
    
    // 简单的base64编码 (仅用于测试)
    return 'mock.' + Buffer.from(JSON.stringify(payload)).toString('base64') + '.signature';
  }

  // 生成综合报告
  generateReport(): string {
    console.log('\n📈 === 综合压力测试报告 ===');
    
    const totalRequests = this.results.reduce((sum, r) => sum + r.requests, 0);
    const totalSuccesses = this.results.reduce((sum, r) => sum + r.successes, 0);
    const totalFailures = this.results.reduce((sum, r) => sum + r.failures, 0);
    const avgThroughput = this.results.reduce((sum, r) => sum + r.throughput, 0) / this.results.length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.avgResponseTime, 0) / this.results.length;

    let report = `;
# LuckyMartTJ 全面压力测试报告

## 📊 总体指标

| 指标 | 数值 |
|------|------|
| 总测试数量 | ${this.results.length} 个 |
| 总请求数 | ${totalRequests.toLocaleString()} 个 |
| 成功请求 | ${totalSuccesses.toLocaleString()} 个 |
| 失败请求 | ${totalFailures.toLocaleString()} 个 |
| 整体成功率 | ${((totalSuccesses / totalRequests) * 100).toFixed(2)}% |
| 平均吞吐量 | ${avgThroughput.toFixed(2)} 请求/秒 |
| 平均响应时间 | ${avgResponseTime.toFixed(2)}ms |

## 📋 详细测试结果

`;

    this.results.forEach((result, index) => {
      report += `
### ${index + 1}. ${result.name}

- **耗时**: ${result.duration.toFixed(2)}ms
- **吞吐量**: ${result.throughput.toFixed(2)} 请求/秒
- **成功率**: ${((result.successes / result.requests) * 100).toFixed(1)}%
- **错误率**: ${result.errorRate.toFixed(1)}%
- **响应时间**:
  - 最小: ${result.minResponseTime.toFixed(2)}ms
  - 平均: ${result.avgResponseTime.toFixed(2)}ms
  - 最大: ${result.maxResponseTime.toFixed(2)}ms

`;
    });

    // 性能评估
    report += `
## 🎯 性能评估

### 优秀 (✅)
${this.results.filter(r => r.errorRate < 1 && r.avgResponseTime < 100).map(r => `- ${r.name}`).join('\n') || '无'}

### 良好 (🟡)
${this.results.filter(r => r.errorRate < 5 && r.avgResponseTime < 500).map(r => `- ${r.name}`).join('\n') || '无'}

### 需要优化 (🔴)
${this.results.filter(r => r.errorRate >= 5 || r.avgResponseTime >= 500).map(r => `- ${r.name} (错误率: ${r.errorRate.toFixed(1)}%, 响应时间: ${r.avgResponseTime.toFixed(2)}ms)`).join('\n') || '无'}

## 💡 优化建议

1. **响应时间优化**: 对平均响应时间超过500ms的接口进行优化
2. **错误率控制**: 确保所有接口的错误率控制在1%以下
3. **并发处理**: 考虑增加缓存层和数据库连接池
4. **Rate Limiting**: 继续优化限流机制，防止恶意攻击
5. **监控告警**: 设置实时性能监控和告警阈值

---
*报告生成时间: ${new Date().toISOString()}*
`;

    console.log(report);
    return report;
  }
}

// 主执行函数
async function main() {
  console.log('🚀 LuckyMartTJ 全面压力测试开始');
  console.log('📅 开始时间:', new Date().toISOString());

  const runner = new StressTestRunner();

  try {
    // 执行所有测试
    await runner.testConcurrentRequests();
    await runner.testPaymentFlow();
    await runner.testReferralSystem();
    await runner.testAntiFraudSystem();
    await runner.testCacheSystem();
    await runner.testTelegramAuth();
    await runner.testRateLimiting();

    // 生成综合报告
    const report = runner.generateReport();
    
    // 保存报告到文件
    const fs = await import('fs');
    const reportPath = '/workspace/luckymart-tj/test-reports/stress-test-report.md';
    
    // 确保目录存在
    const reportsDir = '/workspace/luckymart-tj/test-reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);

  } catch (error) {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  }

  console.log('\n🎉 压力测试完成!');
}

if (require.main === module) {
  main();
}

export { StressTestRunner, TestResult, LoadTestConfig };