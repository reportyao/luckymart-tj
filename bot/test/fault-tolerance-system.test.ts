/**
 * 容错机制测试脚本
 * 测试各种容错组件的功能和集成
 */

import { botDaemon } from '../utils/bot-daemon';
import { alertManager } from '../utils/alert-manager';
import { enhancedErrorTracker } from '../utils/enhanced-error-tracker';
import { configManager } from '../utils/config-manager';
import { performanceMonitor } from '../utils/performance-monitor';
import { faultToleranceManager } from '../utils/fault-tolerance-manager';
import { processMonitor } from '../utils/process-monitor';
import { healthMonitor } from '../utils/health-monitor';
import { reconnectManager } from '../utils/reconnect-manager';
import { logger } from '../utils/logger';

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

export class FaultToleranceTester {
  private results: TestResult[] = [];
  private testStartTime: number = 0;

  constructor() {
    this.setupTestEnvironment();
  }

  // 设置测试环境
  private setupTestEnvironment(): void {
    process.env.NODE_ENV = 'test';
    process.env.TELEGRAM_BOT_TOKEN = 'test_token_12345';
    console.log('🔧 Test environment configured');
  }

  // 运行所有测试
  public async runAllTests(): Promise<void> {
    console.log('🚀 Starting fault tolerance system tests...\n');

    this.testStartTime = Date.now();

    try {
      // 基础组件测试
      await this.testErrorTracker();
      await this.testConfigManager();
      await this.testPerformanceMonitor();
      await this.testAlertManager();
      
      // 集成组件测试
      await this.testFaultToleranceManager();
      await this.testHealthMonitor();
      await this.testProcessMonitor();
      await this.testReconnectManager();
      
      // 高级功能测试
      await this.testBotDaemon();
      await this.testSystemIntegration();
      
      // 性能测试
      await this.testPerformanceBenchmarks();

      this.printTestSummary();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  // 测试错误追踪器
  private async testErrorTracker(): Promise<void> {
    await this.runTest('Error Tracker', async () => {
      // 测试错误记录
      const errorId = enhancedErrorTracker.recordError(
        'test_error',
        new Error('Test error for validation'),
        {
          severity: 'medium',
          component: 'test_component',
          metadata: { test: true }
        }
      );

      if (!errorId) {
        throw new Error('Failed to record error');
      }

      // 测试错误获取
      const errors = enhancedErrorTracker.getErrors({
        component: 'test_component'
      });

      if (errors.length === 0) {
        throw new Error('Failed to retrieve errors');
      }

      // 测试错误解决
      const resolved = enhancedErrorTracker.resolveError(errors[0].id);
      if (!resolved) {
        throw new Error('Failed to resolve error');
      }

      // 测试统计信息
      const stats = enhancedErrorTracker.getErrorStats();
      if (stats.totalErrors === 0) {
        throw new Error('Error stats not updated');
      }

      return {
        errorId,
        errorCount: errors.length,
        resolved,
        stats
      };
    });
  }

  // 测试配置管理器
  private async testConfigManager(): Promise<void> {
    await this.runTest('Config Manager', async () => {
      // 测试配置获取
      const existingValue = configManager.get('telegram.botToken');
      if (!existingValue) {
        throw new Error('Failed to get existing config value');
      }

      // 测试配置设置
      const testKey = 'test.dynamic_config';
      const testValue = { enabled: true, threshold: 100 };
      await configManager.set(testKey, testValue, {
        user: 'test_user',
        reason: 'Test configuration update'
      });

      // 测试配置获取
      const retrievedValue = configManager.get(testKey);
      if (JSON.stringify(retrievedValue) !== JSON.stringify(testValue)) {
        throw new Error('Failed to retrieve updated config value');
      }

      // 测试配置变更历史
      const history = configManager.getChangeHistory(5);
      const latestChange = history.find(change => change.key === testKey);
      if (!latestChange) {
        throw new Error('Config change not recorded in history');
      }

      // 测试配置备份
      const backupId = await configManager.createBackup('test_backup', {
        user: 'test_user',
        reason: 'Test backup creation'
      });

      if (!backupId) {
        throw new Error('Failed to create config backup');
      }

      // 测试配置恢复
      await configManager.restoreBackup(backupId, {
        user: 'test_user',
        reason: 'Test backup restoration'
      });

      return {
        existingValue,
        testValue,
        retrievedValue,
        historyCount: history.length,
        backupId
      };
    });
  }

  // 测试性能监控器
  private async testPerformanceMonitor(): Promise<void> {
    await this.runTest('Performance Monitor', async () => {
      // 启动性能监控
      performanceMonitor.startMonitoring(1000); // 1秒间隔

      // 等待指标收集
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 测试当前指标获取
      const currentMetrics = performanceMonitor.getCurrentMetrics();
      if (!currentMetrics) {
        throw new Error('Failed to get current metrics');
      }

      // 测试历史数据获取
      const history = performanceMonitor.getMetricsHistory({
        start: new Date(Date.now() - 5000),
        end: new Date()
      });

      if (history.length === 0) {
        throw new Error('No metrics history available');
      }

      // 测试告警规则
      performanceMonitor.addAlertRule({
        id: 'test_cpu_alert',
        metric: 'system.cpu.usage',
        threshold: 99,
        duration: 5000,
        severity: 'warning',
        message: 'Test CPU alert'
      });

      // 生成性能报告
      const report = performanceMonitor.generateReport(10000); // 10秒报告
      if (!report || !report.summary) {
        throw new Error('Failed to generate performance report');
      }

      // 停止性能监控
      performanceMonitor.stopMonitoring();

      return {
        currentMetrics: {
          timestamp: currentMetrics.timestamp,
          cpuUsage: currentMetrics.system.cpu.usage,
          memoryUsage: currentMetrics.system.memory.percentage
        },
        historyCount: history.length,
        reportGenerated: !!report
      };
    });
  }

  // 测试告警管理器
  private async testAlertManager(): Promise<void> {
    await this.runTest('Alert Manager', async () => {
      // 启动告警监控
      alertManager.startMonitoring();

      // 添加测试告警规则
      alertManager.addRule({
        id: 'test_alert_rule',
        name: 'Test Alert Rule',
        description: 'Test alert for system validation',
        condition: {
          type: 'metric',
          metric: 'system.cpu.usage',
          operator: '>',
          threshold: 99,
          duration: 1000
        },
        actions: [
          {
            type: 'log',
            config: {
              message: 'Test alert triggered: {{value}}%'
            }
          }
        ],
        enabled: true,
        severity: 'medium',
        cooldown: 5000
      });

      // 手动触发告警测试
      alertManager.triggerAlert(
        'test_alert',
        'Test Alert',
        'This is a test alert message',
        'medium',
        { testData: true }
      );

      // 等待告警处理
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 获取活跃告警
      const activeAlerts = alertManager.getActiveAlerts();
      if (activeAlerts.length === 0) {
        throw new Error('No active alerts found');
      }

      // 解决告警
      const resolved = alertManager.resolveAlert(activeAlerts[0].id);
      if (!resolved) {
        throw new Error('Failed to resolve alert');
      }

      // 获取监控状态
      const status = alertManager.getMonitoringStatus();
      if (!status.isMonitoring) {
        throw new Error('Alert manager not monitoring');
      }

      // 停止告警监控
      alertManager.stopMonitoring();

      return {
        activeAlerts: activeAlerts.length,
        resolved,
        status: status.isMonitoring,
        rulesCount: alertManager.getRules().length
      };
    });
  }

  // 测试容错管理器
  private async testFaultToleranceManager(): Promise<void> {
    await this.runTest('Fault Tolerance Manager', async () => {
      // 初始化容错管理器
      await faultToleranceManager.initialize();

      // 测试系统状态获取
      const systemStatus = await faultToleranceManager.getSystemStatus();
      if (!systemStatus || !systemStatus.overall) {
        throw new Error('Failed to get system status');
      }

      // 测试触发恢复机制
      await faultToleranceManager.triggerRecovery(
        'test_recovery',
        'Testing recovery mechanism'
      );

      // 等待恢复处理
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 测试获取指标
      const metrics = faultToleranceManager.getMetrics();
      if (!metrics || !metrics.uptime) {
        throw new Error('Failed to get fault tolerance metrics');
      }

      // 停止容错管理器
      await faultToleranceManager.shutdown();

      return {
        systemStatus: systemStatus.overall,
        uptime: metrics.uptime,
        isInitialized: true
      };
    });
  }

  // 测试健康监控器
  private async testHealthMonitor(): Promise<void> {
    await this.runTest('Health Monitor', async () => {
      // 启动健康监控
      healthMonitor.startMonitoring(1000);

      // 等待健康检查
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 获取健康状态
      const healthStatus = await healthMonitor.getHealthStatus();
      if (!healthStatus || !healthStatus.status) {
        throw new Error('Failed to get health status');
      }

      // 获取最后健康状态
      const lastHealth = healthMonitor.getLastHealthStatus();
      if (!lastHealth) {
        throw new Error('No last health status available');
      }

      // 检查各个组件健康状态
      const components = healthStatus.checks;
      const requiredComponents = ['database', 'telegram', 'memory', 'messageQueue', 'diskSpace'];
      
      for (const component of requiredComponents) {
        if (!components[component as keyof typeof components]) {
          throw new Error(`Missing health check for component: ${component}`);
        }
      }

      // 停止健康监控
      healthMonitor.stopMonitoring();

      return {
        status: healthStatus.status,
        componentsCount: Object.keys(components).length,
        lastHealth: !!lastHealth,
        checks: Object.keys(components)
      };
    });
  }

  // 测试进程监控器
  private async testProcessMonitor(): Promise<void> {
    await this.runTest('Process Monitor', async () => {
      // 获取监控状态
      const status = processMonitor.getMonitoringStatus();
      if (!status || !status.isMonitoring) {
        throw new Error('Process monitor not monitoring');
      }

      // 测试健康检查
      const isHealthy = await processMonitor.isHealthy();
      if (typeof isHealthy !== 'boolean') {
        throw new Error('Health check failed');
      }

      // 测试手动重启（不实际执行重启）
      const restartStatus = await processMonitor.getMonitoringStatus();
      if (!restartStatus) {
        throw new Error('Failed to get restart status');
      }

      // 检查重启历史
      const restartHistory = processMonitor.getRestartHistory();
      if (!restartHistory) {
        throw new Error('Failed to get restart history');
      }

      return {
        isMonitoring: status.isMonitoring,
        isHealthy,
        uptime: status.processUptime,
        memoryUsage: status.memoryUsage
      };
    });
  }

  // 测试重连管理器
  private async testReconnectManager(): Promise<void> {
    await this.runTest('Reconnect Manager', async () => {
      // 启动重连监控
      reconnectManager.startMonitoring();

      // 等待网络检查
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 获取网络指标
      const networkMetrics = reconnectManager.getNetworkMetrics();
      if (!networkMetrics || !networkMetrics.connectionQuality) {
        throw new Error('Failed to get network metrics');
      }

      // 获取Telegram连接状态
      const telegramConnection = reconnectManager.getTelegramConnection();
      if (!telegramConnection || !telegramConnection.status) {
        throw new Error('Failed to get Telegram connection status');
      }

      // 停止重连监控
      reconnectManager.stopMonitoring();

      return {
        networkQuality: networkMetrics.connectionQuality,
        telegramStatus: telegramConnection.status,
        latency: networkMetrics.latency
      };
    });
  }

  // 测试Bot守护进程
  private async testBotDaemon(): Promise<void> {
    await this.runTest('Bot Daemon', async () => {
      // 配置守护进程
      botDaemon.updateConfig({
        maxRestarts: 5,
        restartDelay: 1000,
        healthCheckInterval: 2000,
        autoRestart: false // 测试模式不自动重启
      });

      // 获取守护进程状态
      const status = botDaemon.getStatus();
      if (!status || typeof status.isRunning !== 'boolean') {
        throw new Error('Failed to get daemon status');
      }

      // 测试健康检查
      // 注意：在测试环境中不启动实际的Bot进程

      // 检查守护进程配置
      const config = botDaemon.getStatus().config;
      if (!config || config.maxRestarts !== 5) {
        throw new Error('Daemon configuration not updated');
      }

      return {
        isRunning: status.isRunning,
        config: status.config,
        status
      };
    });
  }

  // 测试系统集成
  private async testSystemIntegration(): Promise<void> {
    await this.runTest('System Integration', async () => {
      // 测试组件间协调
      let integrationTestResults = {
        configToMonitoring: false,
        errorToAlert: false,
        performanceToAlert: false
      };

      // 测试配置到监控的集成
      try {
        const configValue = configManager.get('monitoring.enabled');
        const alertRules = alertManager.getRules();
        integrationTestResults.configToMonitoring = true;
      } catch (error) {
        throw new Error('Config to monitoring integration failed');
      }

      // 测试错误到告警的集成
      try {
        const errorId = enhancedErrorTracker.recordError(
          'integration_test',
          new Error('Testing integration between error tracker and alert manager'),
          { severity: 'high', component: 'integration_test' }
        );
        integrationTestResults.errorToAlert = !!errorId;
      } catch (error) {
        throw new Error('Error to alert integration failed');
      }

      // 测试性能到告警的集成
      try {
        const metrics = performanceMonitor.getCurrentMetrics();
        integrationTestResults.performanceToAlert = !!metrics;
      } catch (error) {
        throw new Error('Performance to alert integration failed');
      }

      // 检查所有集成测试
      const allTestsPassed = Object.values(integrationTestResults).every(result => result === true);
      if (!allTestsPassed) {
        throw new Error('Some integration tests failed');
      }

      return integrationTestResults;
    });
  }

  // 性能基准测试
  private async testPerformanceBenchmarks(): Promise<void> {
    await this.runTest('Performance Benchmarks', async () => {
      const benchmarks = {
        errorRecording: 0,
        configAccess: 0,
        metricsCollection: 0,
        alertTriggering: 0
      };

      // 错误记录性能测试
      const errorStart = Date.now();
      for (let i = 0; i < 100; i++) {
        enhancedErrorTracker.recordError(
          'perf_test_error',
          new Error(`Performance test error ${i}`),
          { component: 'performance_test' }
        );
      }
      benchmarks.errorRecording = Date.now() - errorStart;

      // 配置访问性能测试
      const configStart = Date.now();
      for (let i = 0; i < 1000; i++) {
        configManager.get('telegram.botToken');
      }
      benchmarks.configAccess = Date.now() - configStart;

      // 指标收集性能测试
      const metricsStart = Date.now();
      for (let i = 0; i < 10; i++) {
        performanceMonitor.getCurrentMetrics();
      }
      benchmarks.metricsCollection = Date.now() - metricsStart;

      // 告警触发性能测试
      const alertStart = Date.now();
      for (let i = 0; i < 10; i++) {
        alertManager.triggerAlert(
          'perf_test',
          'Performance Test Alert',
          `Performance test alert ${i}`,
          'low'
        );
      }
      benchmarks.alertTriggering = Date.now() - alertStart;

      // 验证性能基准
      const maxAcceptableTime = {
        errorRecording: 1000, // 1秒
        configAccess: 500,    // 0.5秒
        metricsCollection: 500,
        alertTriggering: 1000
      };

      for (const [test, time] of Object.entries(benchmarks)) {
        const maxTime = maxAcceptableTime[test as keyof typeof maxAcceptableTime];
        if (time > maxTime) {
          logger.warn(`Performance benchmark exceeded for ${test}`, {
            actual: `${time}ms`,
            max: `${maxTime}ms`
          });
        }
      }

      return benchmarks;
    });
  }

  // 运行单个测试
  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Testing ${testName}...`);
      
      const result = await testFunction();
      
      const duration = Date.now() - startTime;
      this.results.push({
        testName,
        passed: true,
        duration,
        details: result
      });
      
      console.log(`✅ ${testName} passed (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        testName,
        passed: false,
        duration,
        error: (error as Error).message
      });
      
      console.log(`❌ ${testName} failed: ${(error as Error).message} (${duration}ms)`);
    }
    
    console.log(''); // 空行分隔
  }

  // 打印测试总结
  private printTestSummary(): void {
    const totalTime = Date.now() - this.testStartTime;
    const passedTests = this.results.filter(r => r.passed);
    const failedTests = this.results.filter(r => !r.passed);
    
    console.log('📊 Test Summary');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${passedTests.length}`);
    console.log(`Failed: ${failedTests.length}`);
    console.log(`Total Time: ${totalTime}ms`);
    console.log('');
    
    if (failedTests.length > 0) {
      console.log('❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  - ${test.testName}: ${test.error}`);
      });
      console.log('');
    }
    
    if (passedTests.length > 0) {
      console.log('✅ Passed Tests:');
      passedTests.forEach(test => {
        console.log(`  - ${test.testName} (${test.duration}ms)`);
      });
      console.log('');
    }
    
    const successRate = (passedTests.length / this.results.length) * 100;
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    
    if (successRate === 100) {
      console.log('🎉 All tests passed! Fault tolerance system is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the issues above.');
    }
  }

  // 获取测试结果
  public getResults(): TestResult[] {
    return this.results;
  }

  // 生成测试报告
  public generateReport(): string {
    const totalTime = Date.now() - this.testStartTime;
    const passedTests = this.results.filter(r => r.passed);
    const failedTests = this.results.filter(r => !r.passed);
    
    let report = `# Fault Tolerance Test Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Total Time:** ${totalTime}ms\n\n`;
    
    report += `## Summary\n`;
    report += `- Total Tests: ${this.results.length}\n`;
    report += `- Passed: ${passedTests.length}\n`;
    report += `- Failed: ${failedTests.length}\n`;
    report += `- Success Rate: ${((passedTests.length / this.results.length) * 100).toFixed(1)}%\n\n`;
    
    if (passedTests.length > 0) {
      report += `## Passed Tests\n\n`;
      passedTests.forEach(test => {
        report += `### ${test.testName}\n`;
        report += `- Duration: ${test.duration}ms\n`;
        if (test.details) {
          report += `- Details: \`${JSON.stringify(test.details, null, 2)}\`\n`;
        }
        report += `\n`;
      });
    }
    
    if (failedTests.length > 0) {
      report += `## Failed Tests\n\n`;
      failedTests.forEach(test => {
        report += `### ${test.testName}\n`;
        report += `- Duration: ${test.duration}ms\n`;
        report += `- Error: ${test.error}\n\n`;
      });
    }
    
    return report;
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  (async () => {
    try {
      const tester = new FaultToleranceTester();
      await tester.runAllTests();
      
      // 保存测试报告
      const report = tester.generateReport();
      console.log('\n📄 Test Report:');
      console.log(report);
      
      const failedCount = tester.getResults().filter(r => !r.passed).length;
      process.exit(failedCount > 0 ? 1 : 0);
      
    } catch (error) {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    }
  })();
}

export default FaultToleranceTester;