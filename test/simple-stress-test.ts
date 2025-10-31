#!/usr/bin/env node
/**
 * 简化的压力测试脚本 - 快速验证系统稳定性
 */

import { performance } from 'perf_hooks';

interface SimpleTestResult {
  name: string;
  duration: number;
  requests: number;
  successes: number;
  failures: number;
  avgResponseTime: number;
  throughput: number;
  errorRate: number;
}

class SimpleStressTest {
  private baseUrl = '${API_BASE_URL}';

  async runSimpleTest(testName: string, url: string, requests: number = 100): Promise<SimpleTestResult> {
    console.log(`\n🧪 开始测试: ${testName}`);
    console.log(`   URL: ${url}`);
    console.log(`   请求数: ${requests}`);

    const startTime = performance.now();
    let successCount = 0;
    let failureCount = 0;
    const responseTimes: number[] = [];

    // 并发请求测试
    const concurrent = Math.min(20, Math.ceil(requests / 5)); // 最大20个并发
    const workers: Promise<void>[] = [];

    for (let i = 0; i < concurrent; i++) {
      workers.push(this.worker(url, Math.ceil(requests / concurrent), responseTimes, successCount, failureCount));
    }

    await Promise.all(workers);

    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const result: SimpleTestResult = {
      name: testName,
      duration,
      requests,
      successes: successCount,
      failures: failureCount,
      avgResponseTime,
      throughput: (requests / duration) * 1000,
      errorRate: (failureCount / requests) * 100
    };

    console.log(`✅ ${testName} 完成`);
    console.log(`   耗时: ${duration.toFixed(2)}ms`);
    console.log(`   成功率: ${((successCount / requests) * 100).toFixed(1)}%`);
    console.log(`   平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   吞吐量: ${result.throughput.toFixed(2)} 请求/秒`);

    return result;
  }

  private async worker(
    url: string, 
    requests: number, 
    responseTimes: number[], 
    successCount: number, 
    failureCount: number
  ): Promise<void> {
    for (let i = 0; i < requests; i++) {
      try {
        const start = performance.now();
        
        const response = await fetch(`${this.baseUrl}${url}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SimpleStressTest/1.0'
          },
          signal: AbortSignal.timeout(10000) // 10秒超时
        });

        const end = performance.now();
        responseTimes.push(end - start);

        if (response.ok) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        failureCount++;
      }

      // 小延迟避免过于激进
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    }
  }

  async runAllTests(): Promise<SimpleTestResult[]> {
    console.log('🚀 开始LuckyMartTJ简化压力测试');
    console.log('📅 开始时间:', new Date().toISOString());

    const results: SimpleTestResult[] = [];

    try {
      // 测试健康检查
      results.push(await this.runSimpleTest('健康检查API', '/api/monitoring/health', 50));

      // 测试推荐系统
      results.push(await this.runSimpleTest('推荐码查询', '/api/referral/my-code', 30));

      // 测试管理API
      results.push(await this.runSimpleTest('奖励配置查询', '/api/admin/reward-config', 25));

      // 测试统计API
      results.push(await this.runSimpleTest('统计数据查询', '/api/referral/stats', 20));

      // 快速高并发测试
      console.log('\n⚡ 执行快速高并发测试...');
      results.push(await this.runSimpleTest('高并发健康检查', '/api/monitoring/health', 200));

    } catch (error) {
      console.error('❌ 测试执行失败:', error);
    }

    this.generateReport(results);
    return results;
  }

  private generateReport(results: SimpleTestResult[]): void {
    const totalRequests = results.reduce((sum, r) => sum + r.requests, 0);
    const totalSuccesses = results.reduce((sum, r) => sum + r.successes, 0);
    const totalFailures = results.reduce((sum, r) => sum + r.failures, 0);
    const avgThroughput = results.reduce((sum, r) => sum + r.throughput, 0) / results.length;

    console.log('\n📊 === 简化压力测试报告 ===');
    console.log(`📈 总测试数: ${results.length} 个`);
    console.log(`📋 总请求数: ${totalRequests.toLocaleString()} 个`);
    console.log(`✅ 成功请求: ${totalSuccesses.toLocaleString()} 个`);
    console.log(`❌ 失败请求: ${totalFailures.toLocaleString()} 个`);
    console.log(`🎯 整体成功率: ${((totalSuccesses / totalRequests) * 100).toFixed(2)}%`);
    console.log(`🚀 平均吞吐量: ${avgThroughput.toFixed(2)} 请求/秒`);

    console.log('\n📋 详细结果:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.name}`);
      console.log(`   - 成功率: ${((result.successes / result.requests) * 100).toFixed(1)}%`);
      console.log(`   - 平均响应时间: ${result.avgResponseTime.toFixed(2)}ms`);
      console.log(`   - 吞吐量: ${result.throughput.toFixed(2)} 请求/秒`);
    });

    // 性能评估
    const excellentTests = results.filter(r => r.errorRate < 1 && r.avgResponseTime < 200);
    const goodTests = results.filter(r => r.errorRate < 5 && r.avgResponseTime < 500);
    const needsImprovement = results.filter(r => r.errorRate >= 5 || r.avgResponseTime >= 500);

    console.log('\n🎯 性能评估:');
    console.log(`✅ 优秀: ${excellentTests.length} 个测试`);
    console.log(`🟡 良好: ${goodTests.length} 个测试`);
    console.log(`🔴 需要优化: ${needsImprovement.length} 个测试`);

    if (needsImprovement.length > 0) {
      console.log('\n🔧 优化建议:');
      needsImprovement.forEach(test => {
        console.log(`- ${test.name}: 错误率 ${test.errorRate.toFixed(1)}%, 响应时间 ${test.avgResponseTime.toFixed(2)}ms`);
      });
    }
  }
}

// 直接运行
async function main() {
  const tester = new SimpleStressTest();
  await tester.runAllTests();
  console.log('\n🎉 简化压力测试完成!');
}

if (require.main === module) {
  main().catch(console.error);
}