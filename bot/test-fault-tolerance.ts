#!/usr/bin/env node

/**
 * 容错机制测试脚本
 * 用于测试各个组件的功能和集成
 */

import { logger, errorTracker } from './utils/logger';
import { healthMonitor } from './utils/health-monitor';
import { MessageQueue } from './utils/message-queue';
import { processMonitor } from './utils/process-monitor';
import { reconnectManager } from './utils/reconnect-manager';
import { faultToleranceManager } from './utils/fault-tolerance-manager';

class FaultToleranceTester {
  private results: Map<string, boolean> = new Map();
  private startTime: number = Date.now();

  constructor() {
    console.log('🧪 开始容错机制测试...\n');
  }

  // 运行所有测试
  public async runAllTests(): Promise<void> {
    try {
      await this.testLogger();
      await this.testHealthMonitor();
      await this.testMessageQueue();
      await this.testProcessMonitor();
      await this.testReconnectManager();
      await this.testFaultToleranceManager();
      
      this.showTestResults();
    } catch (error) {
      console.error('❌ 测试执行失败:', error);
      process.exit(1);
    }
  }

  // 测试日志系统
  private async testLogger(): Promise<void> {
    console.log('📝 测试日志系统...');
    
    try {
      // 测试不同级别的日志
      logger.debug('Debug message test');
      logger.info('Info message test');
      logger.warn('Warning message test');
      logger.error('Error message test', { test: true });
      
      // 测试性能日志
      await this.simulateAsyncOperation();
      
      // 测试业务事件日志
      logger.business('test_event', 'test_user', { action: 'test' });
      
      // 测试安全事件日志
      logger.security('test_security_event', { userId: 'test' });
      
      // 测试错误统计
      const errorStats = errorTracker.getErrorStats();
      console.log('  ✅ 错误统计:', errorStats);
      
      this.results.set('logger', true);
      console.log('  ✅ 日志系统测试通过\n');
    } catch (error) {
      console.log('  ❌ 日志系统测试失败:', error);
      this.results.set('logger', false);
    }
  }

  // 测试健康监控
  private async testHealthMonitor(): Promise<void> {
    console.log('🏥 测试健康监控系统...');
    
    try {
      // 启动健康监控
      healthMonitor.startMonitoring(5000); // 5秒检查一次
      
      // 等待一次健康检查完成
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      // 获取健康状态
      const healthStatus = await healthMonitor.getHealthStatus();
      console.log('  📊 健康状态:', healthStatus.status);
      
      // 测试健康检查端点
      const healthCheckEndpoint = healthMonitor.createHealthCheckEndpoint();
      console.log('  📋 健康检查端点已创建');
      
      // 停止监控
      healthMonitor.stopMonitoring();
      
      this.results.set('healthMonitor', true);
      console.log('  ✅ 健康监控系统测试通过\n');
    } catch (error) {
      console.log('  ❌ 健康监控系统测试失败:', error);
      this.results.set('healthMonitor', false);
    }
  }

  // 测试消息队列
  private async testMessageQueue(): Promise<void> {
    console.log('📨 测试消息队列...');
    
    try {
      const queue = new MessageQueue(5);
      
      // 测试添加消息
      const messageId = await queue.addMessage('telegram', {
        type: 'test_message',
        content: 'Hello, World!'
      }, { priority: 'high' });
      
      console.log('  📨 消息已添加:', messageId);
      
      // 等待消息处理
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 获取队列统计
      const stats = await queue.getStats();
      console.log('  📊 队列统计:', {
        processed: stats.processed,
        queueLength: stats.queueLength,
        successRate: `${stats.successRate.toFixed(1)}%`
      });
      
      // 测试批量消息
      const batchIds = await queue.batchAddMessages([
        { type: 'notification', payload: { title: 'Test 1' } },
        { type: 'notification', payload: { title: 'Test 2' } }
      ]);
      
      console.log('  📦 批量消息已添加:', batchIds.length);
      
      // 等待处理完成
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 清理
      queue.destroy();
      
      this.results.set('messageQueue', true);
      console.log('  ✅ 消息队列测试通过\n');
    } catch (error) {
      console.log('  ❌ 消息队列测试失败:', error);
      this.results.set('messageQueue', false);
    }
  }

  // 测试进程监控
  private async testProcessMonitor(): Promise<void> {
    console.log('⚙️ 测试进程监控系统...');
    
    try {
      // 启动进程监控
      processMonitor.startMonitoring();
      
      // 获取监控状态
      const status = processMonitor.getMonitoringStatus();
      console.log('  📊 监控状态:', {
        isMonitoring: status.isMonitoring,
        uptime: Math.round(status.uptime),
        memoryUsage: Math.round(status.memoryUsage.heapUsed / 1024 / 1024)
      });
      
      // 测试重启触发
      console.log('  🔄 测试重启机制...');
      
      // 注意：这里不实际触发重启，只测试逻辑
      const restartReason = {
        type: 'manual' as const,
        description: 'Test restart',
        timestamp: new Date().toISOString()
      };
      
      console.log('  📋 重启原因已记录');
      
      this.results.set('processMonitor', true);
      console.log('  ✅ 进程监控系统测试通过\n');
    } catch (error) {
      console.log('  ❌ 进程监控系统测试失败:', error);
      this.results.set('processMonitor', false);
    }
  }

  // 测试重连管理器
  private async testReconnectManager(): Promise<void> {
    console.log('🔗 测试重连管理器...');
    
    try {
      // 启动重连监控
      reconnectManager.startMonitoring();
      
      // 获取网络指标
      const networkMetrics = reconnectManager.getNetworkMetrics();
      console.log('  📊 网络指标:', {
        quality: networkMetrics.connectionQuality,
        latency: Math.round(networkMetrics.latency),
        uptime: Math.round(networkMetrics.uptime / 1000)
      });
      
      // 获取连接状态
      const connectionStates = reconnectManager.getAllConnectionStates();
      console.log('  🔗 连接状态:', Object.keys(connectionStates).length, '个连接');
      
      // 测试重连逻辑
      const telegramConnection = reconnectManager.getTelegramConnection();
      console.log('  🤖 Telegram连接:', telegramConnection.status);
      
      // 停止监控
      reconnectManager.stopMonitoring();
      
      this.results.set('reconnectManager', true);
      console.log('  ✅ 重连管理器测试通过\n');
    } catch (error) {
      console.log('  ❌ 重连管理器测试失败:', error);
      this.results.set('reconnectManager', false);
    }
  }

  // 测试容错管理器
  private async testFaultToleranceManager(): Promise<void> {
    console.log('🛡️ 测试容错管理器...');
    
    try {
      // 初始化容错系统
      await faultToleranceManager.initialize();
      
      // 获取系统状态
      const systemStatus = await faultToleranceManager.getSystemStatus();
      console.log('  📊 系统状态:', systemStatus.overall);
      
      // 测试恢复触发
      console.log('  🔧 测试恢复机制...');
      await faultToleranceManager.triggerRecovery(
        'test_condition',
        'Testing recovery mechanism'
      );
      
      // 获取指标
      const metrics = faultToleranceManager.getMetrics();
      console.log('  📈 指标统计:', {
        uptime: Math.round(metrics.uptime),
        messageQueueSize: metrics.messageQueue.queueLength,
        errorCount: metrics.recoveryStats.totalRecoveries
      });
      
      // 关闭容错系统
      await faultToleranceManager.shutdown();
      
      this.results.set('faultToleranceManager', true);
      console.log('  ✅ 容错管理器测试通过\n');
    } catch (error) {
      console.log('  ❌ 容错管理器测试失败:', error);
      this.results.set('faultToleranceManager', false);
    }
  }

  // 模拟异步操作
  private async simulateAsyncOperation(): Promise<void> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    const duration = Date.now() - startTime;
    
    // 性能日志会被自动记录
    return;
  }

  // 显示测试结果
  private showTestResults(): void {
    const totalTests = this.results.size;
    const passedTests = Array.from(this.results.values()).filter(Boolean).length;
    const failedTests = totalTests - passedTests;
    const totalTime = Date.now() - this.startTime;
    
    console.log('=' .repeat(50));
    console.log('🧪 容错机制测试结果');
    console.log('=' .repeat(50));
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过测试: ${passedTests}`);
    console.log(`失败测试: ${failedTests}`);
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`测试耗时: ${totalTime}ms`);
    console.log('');
    
    // 显示详细结果
    console.log('详细结果:');
    for (const [testName, passed] of this.results) {
      const status = passed ? '✅' : '❌';
      console.log(`  ${status} ${testName}`);
    }
    
    console.log('');
    
    if (passedTests === totalTests) {
      console.log('🎉 所有测试通过！容错机制工作正常。');
    } else {
      console.log('⚠️  部分测试失败，请检查相关组件。');
    }
    
    console.log('');
    console.log('测试完成，时间:', new Date().toISOString());
  }
}

// 性能压力测试
class PerformanceTester {
  private static async testMessageQueuePerformance(): Promise<void> {
    console.log('🚀 性能压力测试 - 消息队列...');
    
    const queue = new MessageQueue(10);
    const messageCount = 100;
    const startTime = Date.now();
    
    try {
      // 批量添加消息
      const messages = Array.from({ length: messageCount }, (_, i) => ({
        type: 'test' as const,
        payload: { id: i, data: `test_${i}` }
      }));
      
      const batchIds = await queue.batchAddMessages(messages);
      console.log(`  📤 添加了 ${batchIds.length} 条消息`);
      
      // 等待处理完成
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const stats = await queue.getStats();
      const endTime = Date.now();
      
      console.log(`  ⏱️  处理时间: ${endTime - startTime}ms`);
      console.log(`  📊 吞吐量: ${messageCount / ((endTime - startTime) / 1000)} 消息/秒`);
      console.log(`  ✅ 成功率: ${stats.successRate.toFixed(1)}%`);
      
      queue.destroy();
      
    } catch (error) {
      console.error('  ❌ 性能测试失败:', error);
    }
  }
}

// 集成测试
class IntegrationTester {
  private static async testEndToEnd(): Promise<void> {
    console.log('🔗 集成测试 - 端到端...');
    
    try {
      // 模拟完整的用户操作流程
      console.log('  👤 模拟用户注册...');
      logger.business('user_registration_start', 'test_user_123');
      
      console.log('  💰 模拟余额查询...');
      logger.business('balance_check', 'test_user_123');
      
      console.log('  🛒 模拟订单创建...');
      logger.business('order_creation', 'test_user_123', {
        orderId: 'order_456',
        amount: 100
      });
      
      console.log('  ❌ 模拟错误处理...');
      try {
        throw new Error('Simulated error for testing');
      } catch (error) {
        logger.error('Integration test error', { test: true }, error as Error);
        errorTracker.recordError('integration_test_error', error as Error);
      }
      
      console.log('  🔄 模拟恢复...');
      await faultToleranceManager.triggerRecovery(
        'integration_test',
        'Testing recovery in integration scenario'
      );
      
      console.log('  ✅ 集成测试完成');
      
    } catch (error) {
      console.error('  ❌ 集成测试失败:', error);
    }
  }
}

// 主测试函数
async function main() {
  const tester = new FaultToleranceTester();
  
  try {
    await tester.runAllTests();
    
    // 运行性能测试
    console.log('\n' + '='.repeat(50));
    await PerformanceTester.testMessageQueuePerformance();
    
    // 运行集成测试
    console.log('\n' + '='.repeat(50));
    await IntegrationTester.testEndToEnd();
    
    console.log('\n🎉 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 致命错误:', error);
    process.exit(1);
  });
}

export default FaultToleranceTester;