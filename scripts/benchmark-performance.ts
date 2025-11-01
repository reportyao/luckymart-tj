import { PerformanceTester, NPlusOneDetector } from '../lib/n-plus-one-detector';
import QueryOptimizer from '../lib/query-optimizer';
#!/usr/bin/env node

/**
 * 性能基准测试脚本
 * 用于验证 N+1 查询修复的效果
 * 
 * 运行方式:
 * - 开发环境: npm run benchmark
 * - 性能对比: npm run benchmark:compare
 * - 压力测试: npm run benchmark:stress
 */


// 基准测试配置
const BenchmarkConfig = {
  iterations: 50,        // 测试迭代次数
  warmupIterations: 10,  // 预热次数
  concurrentUsers: 5,    // 并发用户数
  testScenarios: [
    {
      name: '用户列表查询',
      description: '测试管理员用户列表查询性能',
      queryFn: () => QueryOptimizer.getOptimizedUsersList({ page: 1, limit: 50 }),
      expectedMaxTime: 1000,    // 期望最大执行时间 (ms)
      expectedMaxQueries: 10,   // 期望最大查询数
      weight: 1.0              // 在总分中的权重
    },
    {
      name: '订单列表查询',
      description: '测试订单列表查询性能',
      queryFn: () => QueryOptimizer.getOptimizedOrdersList({ page: 1, limit: 30 }),
      expectedMaxTime: 800,
      expectedMaxQueries: 5,
      weight: 1.0
    },
    {
      name: '仪表板统计',
      description: '测试仪表板统计数据查询',
      queryFn: () => QueryOptimizer.getDashboardStats(),
      expectedMaxTime: 500,
      expectedMaxQueries: 1,
      weight: 1.2  // 权重更高，因为这是关键指标
    },
    {
      name: '商品列表查询',
      description: '测试商品列表查询性能',
      queryFn: () => QueryOptimizer.getProductsList({ page: 1, limit: 20 }),
      expectedMaxTime: 600,
      expectedMaxQueries: 3,
      weight: 0.8
    }
  ]
};

export class PerformanceBenchmark {
  private static results: any[] = [];

  // 运行单个基准测试
  static async runSingleBenchmark(scenario: any) {
    console.log(`🧪 运行测试: ${scenario.name}`);
    console.log(`   描述: ${scenario.description}`);
    console.log(`   迭代次数: ${BenchmarkConfig.iterations}`);

    // 清理监控数据
    NPlusOneDetector.clearStats();
    NPlusOneDetector.enableMonitoring();

    const times: number[] = [];
    const queryCounts: number[] = [];

    // 预热阶段
    console.log('   预热中...');
    for (let i = 0; i < BenchmarkConfig.warmupIterations; i++) {
      try {
        await scenario.queryFn();
      } catch (error) {
        console.warn(`   预热失败 (第${i + 1}次):`, error.message);
}
    }

    // 正式测试
    console.log('   测试中...');
    for (let i = 0; i < BenchmarkConfig.iterations; i++) {
      try {
        const startTime = Date.now();
        await scenario.queryFn();
        const endTime = Date.now();
        
        times.push(endTime - startTime);
        
        // 获取查询统计
        const stats = NPlusOneDetector.getStats();
        queryCounts.push(stats.totalQueries);
        
        // 进度显示
        if ((i + 1) % 10 === 0) {
          process.stdout.write(`   进度: ${i + 1}/${BenchmarkConfig.iterations}\r`);
        }
        
      } catch (error) {
        console.error(`   测试失败 (第${i + 1}次):`, error.message);
        times.push(0);
        queryCounts.push(999); // 标记为失败
      }
    }

    console.log('   测试完成');

    // 计算统计指标
    const validTimes = times.filter(t => t > 0);
    const validQueries = queryCounts.filter(q => q < 999);

    const result = {
      name: scenario.name,
      description: scenario.description,
      iterations: BenchmarkConfig.iterations,
      successRate: validTimes.length / BenchmarkConfig.iterations,
      
      // 时间统计
      timeStats: {
        min: Math.min(...validTimes),
        max: Math.max(...validTimes),
        avg: validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length,
        median: this.calculateMedian(validTimes),
        p95: this.calculatePercentile(validTimes, 0.95),
        p99: this.calculatePercentile(validTimes, 0.99)
      },
      
      // 查询统计
      queryStats: {
        min: Math.min(...validQueries),
        max: Math.max(...validQueries),
        avg: validQueries.reduce((sum, q) => sum + q, 0) / validQueries.length,
        median: this.calculateMedian(validQueries),
        p95: this.calculatePercentile(validQueries, 0.95)
      },
      
      // 预期对比
      expectations: {
        time: scenario.expectedMaxTime,
        queries: scenario.expectedMaxQueries
      },
      
      // 性能评分
      scores: {
        timeScore: this.calculateTimeScore(validTimes, scenario.expectedMaxTime),
        queryScore: this.calculateQueryScore(validQueries, scenario.expectedMaxQueries),
        overall: 0 // 稍后计算
      }
    };

    // 计算总体评分
    result.scores.overall : (
      result.scores.timeScore * 0.6 + 
      result.scores.queryScore * 0.4
    ) * result.successRate;

    return result;
  }

  // 运行所有基准测试
  static async runAllBenchmarks() {
    console.log('🚀 开始性能基准测试...\n');
    console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`时间: ${new Date().toISOString()}`);
    console.log('=' * 60);

    const results = [];

    for (const scenario of BenchmarkConfig.testScenarios) {
      try {
        const result = await this.runSingleBenchmark(scenario);
        results.push(result);
        console.log(''); // 空行分隔
  }
      } catch (error) {
        console.error(`❌ 测试 ${scenario.name} 失败:`, error.message);
      }
    }

    this.results = results;
    return results;
  }

  // 生成性能报告
  static generateReport(results: any[]) {
    console.log('📊 性能基准测试报告');
    console.log('=' * 60);

    // 总体统计
    const totalTests = results.length;
    const passedTests = results.filter(r => r.scores.overall >= 80).length;
    const avgScore = results.reduce((sum, r) => sum + r.scores.overall, 0) / totalTests;

    console.log(`\n📈 总体结果:`);
    console.log(`   总测试数: ${totalTests}`);
    console.log(`   通过测试: ${passedTests}`);
    console.log(`   通过率: ${(passedTests / totalTests * 100).toFixed(1)}%`);
    console.log(`   平均评分: ${avgScore.toFixed(1)}/100`);

    // 详细结果
    console.log(`\n📋 详细结果:`);
    results.forEach(result => {
      const status = result.scores.overall >= 80 ? '✅' : '⚠️';
      const scoreColor = result.scores.overall >= 90 ? '🟢' : 
                        result.scores.overall >= 80 ? '🟡' : '🔴';
      
      console.log(`${status} ${scoreColor} ${result.name}`);
      console.log(`   成功率: ${(result.successRate * 100).toFixed(1)}%`);
      console.log(`   平均时间: ${result.timeStats.avg.toFixed(1)}ms (目标: <${result.expectations.time}ms)`);
      console.log(`   平均查询: ${result.queryStats.avg.toFixed(1)}次 (目标: <${result.expectations.queries}次)`);
      console.log(`   评分: ${result.scores.overall.toFixed(1)}/100`);
      
      if (result.timeStats.avg > result.expectations.time) {
        console.log(`   ⚠️ 时间性能未达标`);
      }
      
      if (result.queryStats.avg > result.expectations.queries) {
        console.log(`   ⚠️ 查询数量超标，可能存在N+1问题`);
      }
      
      console.log('');
    });

    // 建议
    console.log('💡 优化建议:');
    const slowTests = results.filter(r => r.timeStats.avg > r.expectations.time);
    const highQueryTests = results.filter(r => r.queryStats.avg > r.expectations.queries);
    
    if (slowTests.length > 0) {
      console.log('   🔧 性能优化建议:');
      slowTests.forEach(test => {
        console.log(`     - ${test.name}: 平均${test.timeStats.avg.toFixed(1)}ms，建议添加索引或优化查询`);
      });
    }
    
    if (highQueryTests.length > 0) {
      console.log('   🚫 N+1 查询修复建议:');
      highQueryTests.forEach(test => {
        console.log(`     - ${test.name}: 平均${test.queryStats.avg.toFixed(1)}次查询，建议使用批量查询或缓存`);
      });
    }
    
    if (slowTests.length === 0 && highQueryTests.length === 0) {
      console.log('   🎉 所有测试性能良好，无需进一步优化！');
    }

    return {
      summary: {
        totalTests,
        passedTests,
        passRate: passedTests / totalTests,
        avgScore
      },
      results
    };
  }

  // 性能对比测试
  static async comparePerformance() {
    console.log('📊 性能对比测试 (修复前 vs 修复后)');
    console.log('注意: 需要对比数据才能运行此测试');
    
    // 这里可以实现修复前后的性能对比
    // 由于没有历史数据，仅提供框架
    const currentPerformance = await this.runAllBenchmarks();
    
    return {
      current: currentPerformance,
      // historical: historicalData, // 修复前的数据
      improvement: '需要历史数据进行对比'
    };
  }

  // 压力测试
  static async stressTest() {
    console.log('🔥 压力测试开始...');
    console.log(`并发用户数: ${BenchmarkConfig.concurrentUsers}`);
    
    const promises = [];
    for (let i = 0; i < BenchmarkConfig.concurrentUsers; i++) {
      promises.push(this.runAllBenchmarks());
    }
    
    try {
      const results = await Promise.all(promises);
      console.log('✅ 压力测试完成');
      return results;
    } catch (error) {
      console.error('❌ 压力测试失败:', error.message);
      throw error;
    }
  }

  // 工具方法
  private static calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0;
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  private static calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  private static calculateTimeScore(times: number[], expectedMax: number): number {
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const ratio = expectedMax / avgTime;
    return Math.min(100, Math.max(0, ratio * 100));
  }

  private static calculateQueryScore(queries: number[], expectedMax: number): number {
    const avgQueries = queries.reduce((sum, q) => sum + q, 0) / queries.length;
    const ratio = expectedMax / avgQueries;
    return Math.min(100, Math.max(0, ratio * 100));
  }
}

// 命令行接口
if (require.main === module) {
  const command = process.(argv?.2 ?? null);

  switch (command) {
    case 'compare':
      PerformanceBenchmark.comparePerformance()
        .then(result => console.log(JSON.stringify(result, null, 2)))
        .catch(console.error);
      break;
      
    case 'stress':
      PerformanceBenchmark.stressTest()
        .then(results => console.log(`压力测试完成，处理了 ${results.length} 组数据`))
        .catch(console.error);
      break;
      
    default:
      PerformanceBenchmark.runAllBenchmarks()
        .then(results => {
          const report = PerformanceBenchmark.generateReport(results);
          process.exit(report.summary.passRate >= 0.8 ? 0 : 1);
        })
        .catch(console.error);
  }
}

export default PerformanceBenchmark;