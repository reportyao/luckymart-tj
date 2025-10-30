// N+1 查询修复验证测试
// 测试各种场景下的查询性能

import { prisma } from '../lib/prisma';
import QueryOptimizer from '../lib/query-optimizer';
import { NPlusOneDetector, PerformanceTester } from '../lib/n-plus-one-detector';

export class NPlusOneFixValidator {
  // 测试用户列表查询优化
  static async testUserListOptimization() {
    console.log('🧪 测试用户列表查询优化...');
    
    // 启用监控
    NPlusOneDetector.enableMonitoring();
    
    const startTime = Date.now();
    
    try {
      // 测试优化后的查询
      const result = await QueryOptimizer.getOptimizedUsersList({
        page: 1,
        limit: 50,
        search: ''
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 获取查询统计
      const stats = NPlusOneDetector.getStats();
      
      console.log('✅ 用户列表查询测试完成:');
      console.log(`   📊 查询数量: ${stats.totalQueries} (期望: < 10)`);
      console.log(`   ⏱️ 执行时间: ${duration}ms (期望: < 1000ms)`);
      console.log(`   📋 返回记录: ${result.users.length}`);
      
      // 验证结果
      const isOptimized = stats.totalQueries < 10 && duration < 1000;
      
      return {
        success: isOptimized,
        metrics: {
          queryCount: stats.totalQueries,
          duration,
          recordCount: result.users.length
        }
      };
      
    } catch (error) {
      console.error('❌ 用户列表查询测试失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // 测试订单列表查询优化
  static async testOrderListOptimization() {
    console.log('🧪 测试订单列表查询优化...');
    
    NPlusOneDetector.clearStats();
    NPlusOneDetector.enableMonitoring();
    
    const startTime = Date.now();
    
    try {
      const result = await QueryOptimizer.getOptimizedOrdersList({
        page: 1,
        limit: 30
      });
      
      const endTime = Date.now();
      const stats = NPlusOneDetector.getStats();
      
      console.log('✅ 订单列表查询测试完成:');
      console.log(`   📊 查询数量: ${stats.totalQueries} (期望: < 5)`);
      console.log(`   ⏱️ 执行时间: ${endTime - startTime}ms (期望: < 800ms)`);
      console.log(`   📋 返回记录: ${result.orders.length}`);
      
      return {
        success: stats.totalQueries < 5 && (endTime - startTime) < 800,
        metrics: {
          queryCount: stats.totalQueries,
          duration: endTime - startTime,
          recordCount: result.orders.length
        }
      };
      
    } catch (error) {
      console.error('❌ 订单列表查询测试失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // 测试仪表板统计查询
  static async testDashboardStatsOptimization() {
    console.log('🧪 测试仪表板统计查询优化...');
    
    NPlusOneDetector.clearStats();
    
    const startTime = Date.now();
    
    try {
      const result = await QueryOptimizer.getDashboardStats();
      
      const endTime = Date.now();
      const stats = NPlusOneDetector.getStats();
      
      console.log('✅ 仪表板统计查询测试完成:');
      console.log(`   📊 查询数量: ${stats.totalQueries} (期望: = 1)`);
      console.log(`   ⏱️ 执行时间: ${endTime - startTime}ms (期望: < 500ms)`);
      console.log(`   📊 统计数据: ${Object.keys(result).length} 项`);
      
      return {
        success: stats.totalQueries === 1 && (endTime - startTime) < 500,
        metrics: {
          queryCount: stats.totalQueries,
          duration: endTime - startTime,
          statsCount: Object.keys(result).length
        }
      };
      
    } catch (error) {
      console.error('❌ 仪表板统计查询测试失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // 测试批量用户统计查询
  static async testBatchUserStats() {
    console.log('🧪 测试批量用户统计查询...');
    
    NPlusOneDetector.clearStats();
    
    // 创建测试用户数据
    const testUserIds = ['test-user-1', 'test-user-2', 'test-user-3'];
    
    try {
      const result = await QueryOptimizer.getBatchUserStats(testUserIds);
      
      const stats = NPlusOneDetector.getStats();
      
      console.log('✅ 批量用户统计查询测试完成:');
      console.log(`   📊 查询数量: ${stats.totalQueries} (期望: <= 3)`);
      console.log(`   📋 处理用户: ${testUserIds.length}`);
      console.log(`   📊 返回统计: ${result.size} 项`);
      
      return {
        success: stats.totalQueries <= 3,
        metrics: {
          queryCount: stats.totalQueries,
          userCount: testUserIds.length,
          statsCount: result.size
        }
      };
      
    } catch (error) {
      console.error('❌ 批量用户统计查询测试失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // 运行所有测试
  static async runAllTests() {
    console.log('🚀 开始 N+1 查询修复验证测试...\n');
    
    const tests = [
      { name: '用户列表优化', fn: this.testUserListOptimization },
      { name: '订单列表优化', fn: this.testOrderListOptimization },
      { name: '仪表板统计优化', fn: this.testDashboardStatsOptimization },
      { name: '批量用户统计优化', fn: this.testBatchUserStats }
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        const result = await test.fn.call(this);
        results.push({
          test: test.name,
          ...result
        });
      } catch (error) {
        results.push({
          test: test.name,
          success: false,
          error: error.message
        });
      }
      
      console.log(''); // 空行分隔
    }
    
    // 汇总结果
    console.log('📋 测试结果汇总:');
    console.log('='.repeat(50));
    
    const passedTests = results.filter(r => r.success).length;
    const totalTests = results.length;
    
    results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.test}`);
      
      if (result.metrics) {
        console.log(`   指标: ${JSON.stringify(result.metrics)}`);
      }
      
      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
      
      console.log('');
    });
    
    console.log('='.repeat(50));
    console.log(`📊 总计: ${passedTests}/${totalTests} 测试通过`);
    
    if (passedTests === totalTests) {
      console.log('🎉 所有测试通过！N+1 查询优化成功！');
    } else {
      console.log('⚠️ 部分测试失败，请检查优化配置');
    }
    
    return {
      passed: passedTests,
      total: totalTests,
      results
    };
  }
  
  // 生成性能报告
  static async generatePerformanceReport() {
    console.log('📊 生成性能报告...\n');
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      tests: await this.runAllTests(),
      recommendations: []
    };
    
    // 添加优化建议
    if (report.tests.passed < report.tests.total) {
      report.recommendations.push('检查数据库连接配置');
      report.recommendations.push('验证索引是否正确创建');
      report.recommendations.push('确认查询优化工具是否正常工作');
    }
    
    console.log('\n📄 性能报告已生成');
    console.log(JSON.stringify(report, null, 2));
    
    return report;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  NPlusOneFixValidator.generatePerformanceReport()
    .then(() => {
      console.log('\n✅ 验证完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ 验证失败:', error);
      process.exit(1);
    });
}

export default NPlusOneFixValidator;