import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { performance } from 'perf_hooks';
import { MessageQueue } from '../bot/utils/message-queue';
import { faultToleranceManager } from '../bot/utils/fault-tolerance-manager';
import { logger } from '../bot/utils/logger';
import { NotificationTemplateManager, Language, NotificationType } from '../bot/utils/notification-templates';
/**
 * Telegram Bot 推送性能测试
 * 测试大量消息的批量发送性能，验证推送频率和限制控制，测试消息丢失和重试处理
 */


interface PerformanceMetrics {
  testName: string;
  startTime: number;
  endTime: number;
  duration: number;
  totalMessages: number;
  successfulMessages: number;
  failedMessages: number;
  successRate: number;
  messagesPerSecond: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  maxLatency: number;
  minLatency: number;
  memoryUsage: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
  };
  errorDetails: Array<{
    messageId: string;
    error: string;
    timestamp: number;
  }>;
}

interface PushConfig {
  maxConcurrent: number;
  batchSize: number;
  rateLimit: {
    messagesPerSecond: number;
    burstLimit: number;
  };
  retryPolicy: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
}

class PerformanceTestRunner {
  private metrics: PerformanceMetrics[] = [];
  private messageLatencies: Map<string, number[]> = new Map();
  private pushConfig: PushConfig;
  private mockBotResponses = {
    success: { ok: true, result: { message_id: Math.random() * 1000000 } },
    failure: { ok: false, error_code: 400, description: 'Bad Request' },
    rateLimit: { ok: false, error_code: 429, description: 'Too Many Requests' }
  };

  constructor(config?: Partial<PushConfig>) {
    this.pushConfig = {
      maxConcurrent: config?.maxConcurrent || 50,
      batchSize: config?.batchSize || 100,
      rateLimit: {
        messagesPerSecond: config?.rateLimit?.messagesPerSecond || 20,
        burstLimit: config?.rateLimit?.burstLimit || 100
      },
      retryPolicy: {
        maxRetries: config?.retryPolicy?.maxRetries || 3,
        initialDelay: config?.retryPolicy?.initialDelay || 1000,
        maxDelay: config?.retryPolicy?.maxDelay || 30000,
        backoffMultiplier: config?.retryPolicy?.backoffMultiplier || 2
      }
    };
  }

  /**
   * 大量消息批量发送性能测试
   */
  public async testBatchMessagePerformance(
    messageCount: number,
    testName: string = 'Batch Message Test'
  ): Promise<PerformanceMetrics> {
    logger.info(`开始批量消息性能测试: ${messageCount} 条消息`, { testName });

    const startTime = performance.now();
    const memoryBefore = process.memoryUsage();
    const messageIds: string[] = [];
    const errorDetails: Array<{ messageId: string; error: string; timestamp: number }> = [];

    try {
      const messageQueue = faultToleranceManager.getMessageQueue();

      // 分批发送消息
      for (let i = 0; i < messageCount; i += this.pushConfig.batchSize) {
        const batch = Math.min(this.pushConfig.batchSize, messageCount - i);
        const batchPromises = [];

        for (let j = 0; j < batch; j++) {
          const messageId = `perf_test_${i + j}_${Date.now()}`;
          const startLatency = performance.now();

          const promise = messageQueue.addMessage('telegram', {
            type: 'send_message',
            text: `Performance test message ${i + j}`,
            chatId: `test_user_${Math.floor(Math.random() * 1000)}`,
            metadata: {
              testId: messageId,
              testName,
              batchIndex: i / this.pushConfig.batchSize,
              messageIndex: i + j
            }
          }, { priority: 'normal' });

          batchPromises.push(
            promise.then(() => {
              const latency = performance.now() - startLatency;
              this.recordLatency(messageId, latency);
              return messageId;
            })
          );
        }

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            messageIds.push(result.value);
          } else {
            const errorMessage = result.reason?.message || 'Unknown error';
            errorDetails.push({
              messageId: `error_${i + index}`,
              error: errorMessage,
              timestamp: Date.now()
            });
          }
        });

        // 批量间延迟，避免过载
        if (i + this.pushConfig.batchSize < messageCount) {
          await this.delay(100);
        }
      }

      // 等待所有消息处理完成
      await this.waitForMessageProcessing(messageIds.length);

    } catch (error) {
      logger.error('批量消息测试执行失败', { testName, error: (error as Error).message });
    }

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    const duration = endTime - startTime;

    const metrics = this.calculateMetrics({
      testName,
      startTime,
      endTime,
      duration,
      totalMessages: messageCount,
      successfulMessages: messageIds.length,
      failedMessages: messageCount - messageIds.length,
      memoryUsage: { before: memoryBefore, after: memoryAfter },
      errorDetails
    });

    this.metrics.push(metrics);
    logger.info('批量消息性能测试完成', metrics);

    return metrics;
  }

  /**
   * 推送频率和限制控制测试
   */
  public async testRateLimitControl(testName: string = 'Rate Limit Test'): Promise<PerformanceMetrics> {
    logger.info('开始推送频率限制控制测试', { testName });

    const startTime = performance.now();
    const memoryBefore = process.memoryUsage();
    const testDuration = 5000; // 5秒测试;
    const targetRate = this.pushConfig.rateLimit.messagesPerSecond;
    const messageIds: string[] = [];
    const errorDetails: Array<{ messageId: string; error: string; timestamp: number }> = [];

    try {
      const messageQueue = faultToleranceManager.getMessageQueue();
      const interval = 1000 / targetRate; // 发送间隔(ms)

      let sentCount = 0;
      const startSendTime = Date.now();

      // 定时发送消息以测试频率限制
      const sendInterval = setInterval(async () => {
        if (Date.now() - startSendTime >= testDuration) {
          clearInterval(sendInterval);
          return;
        }

        const messageId = `rate_limit_${sentCount}_${Date.now()}`;
        const startLatency = performance.now();

        try {
          const result = await messageQueue.addMessage('telegram', {
            type: 'send_message',
            text: `Rate limit test message ${sentCount}`,
            chatId: `test_user_${sentCount % 100}`,
            metadata: {
              testId: messageId,
              testName,
              sequenceNumber: sentCount
            }
          });

          const latency = performance.now() - startLatency;
          this.recordLatency(messageId, latency);
          messageIds.push(result);
          sentCount++;

        } catch (error) {
          const errorMessage = (error as Error).message;
          errorDetails.push({
            messageId,
            error: errorMessage,
            timestamp: Date.now()
          });
        }

        // 控制发送频率
        await this.delay(interval);

      }, interval);

      // 等待测试完成
      await this.delay(testDuration + 1000);

      // 清理定时器
      clearInterval(sendInterval);

    } catch (error) {
      logger.error('频率限制测试执行失败', { testName, error: (error as Error).message });
    }

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    const duration = endTime - startTime;

    const metrics = this.calculateMetrics({
      testName,
      startTime,
      endTime,
      duration,
      totalMessages: sentCount,
      successfulMessages: messageIds.length,
      failedMessages: sentCount - messageIds.length,
      memoryUsage: { before: memoryBefore, after: memoryAfter },
      errorDetails
    });

    this.metrics.push(metrics);
    logger.info('频率限制控制测试完成', metrics);

    return metrics;
  }

  /**
   * 消息丢失和重试处理测试
   */
  public async testMessageRetryAndRecovery(
    failureRate: number = 0.3,
    testName: string = 'Retry and Recovery Test'
  ): Promise<PerformanceMetrics> {
    logger.info('开始消息丢失和重试处理测试', { failureRate, testName });

    const startTime = performance.now();
    const memoryBefore = process.memoryUsage();
    const messageCount = 200;
    const messageIds: string[] = [];
    const errorDetails: Array<{ messageId: string; error: string; timestamp: number }> = [];

    try {
      const messageQueue = faultToleranceManager.getMessageQueue();

      // 发送带有模拟失败的消息
      for (let i = 0; i < messageCount; i++) {
        const messageId = `retry_test_${i}_${Date.now()}`;
        const shouldFail = Math.random() < failureRate;
        const startLatency = performance.now();

        try {
          const result = await messageQueue.addMessage('telegram', {
            type: 'send_message',
            text: `Retry test message ${i}`,
            chatId: `test_user_${i}`,
            simulateFailure: shouldFail,
            metadata: {
              testId: messageId,
              testName,
              shouldFail,
              attempt: 1
            }
          }, { 
            priority: 'normal',
            maxAttempts: this.pushConfig.retryPolicy.maxRetries
          });

          const latency = performance.now() - startLatency;
          this.recordLatency(messageId, latency);
          messageIds.push(result);

        } catch (error) {
          const errorMessage = (error as Error).message;
          errorDetails.push({
            messageId,
            error: errorMessage,
            timestamp: Date.now()
          });

          // 记录重试尝试
          logger.debug('消息发送失败，记录重试', { messageId, error: errorMessage });
        }

        // 短暂延迟
        await this.delay(50);
      }

      // 等待重试机制处理
      await this.delay(5000);

      // 验证重试结果
      const stats = messageQueue.getStats();
      logger.info('重试处理结果统计', {
        totalMessages: messageCount,
        processed: stats.processed,
        failed: stats.failed.length,
        retryCount: stats.failed.filter(msg => msg.attempts > 1).length
      });

    } catch (error) {
      logger.error('重试处理测试执行失败', { testName, error: (error as Error).message });
    }

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    const duration = endTime - startTime;

    const metrics = this.calculateMetrics({
      testName,
      startTime,
      endTime,
      duration,
      totalMessages: messageCount,
      successfulMessages: messageIds.length,
      failedMessages: messageCount - messageIds.length,
      memoryUsage: { before: memoryBefore, after: memoryAfter },
      errorDetails
    });

    this.metrics.push(metrics);
    logger.info('消息丢失和重试处理测试完成', metrics);

    return metrics;
  }

  /**
   * 高并发推送测试
   */
  public async testHighConcurrencyPush(
    concurrentUsers: number = 1000,
    messagesPerUser: number = 10,
    testName: string = 'High Concurrency Test'
  ): Promise<PerformanceMetrics> {
    logger.info('开始高并发推送测试', { concurrentUsers, messagesPerUser, testName });

    const startTime = performance.now();
    const memoryBefore = process.memoryUsage();
    const totalMessages = concurrentUsers * messagesPerUser;
    const messageIds: string[] = [];
    const errorDetails: Array<{ messageId: string; error: string; timestamp: number }> = [];

    try {
      const messageQueue = faultToleranceManager.getMessageQueue();
      
      // 创建并发用户组
      const userGroups = this.createUserGroups(concurrentUsers);
      
      // 为每个用户组并发发送消息
      const groupPromises = userGroups.map(async (userGroup, groupIndex) => {
        const groupResults = await Promise.allSettled(;
          userGroup.map(async (userId, messageIndex) => {
            const messageId = `concurrent_${groupIndex}_${messageIndex}_${Date.now()}`;
            const startLatency = performance.now();

            try {
              const result = await messageQueue.addMessage('telegram', {
                type: 'send_message',
                text: `Concurrent message for user ${userId}`,
                chatId: `user_${userId}`,
                metadata: {
                  testId: messageId,
                  testName,
                  userId,
                  groupIndex,
                  messageIndex
                }
              }, { priority: 'normal' });

              const latency = performance.now() - startLatency;
              this.recordLatency(messageId, latency);
              return result;

            } catch (error) {
              const errorMessage = (error as Error).message;
              errorDetails.push({
                messageId,
                error: errorMessage,
                timestamp: Date.now()
              });
              throw error;
            }
          })
        );

        return groupResults.filter(result => result.status === 'fulfilled').length;
      });

      const groupResults = await Promise.all(groupPromises);
      messageIds.push(...groupResults);

      // 等待处理完成
      await this.waitForMessageProcessing(totalMessages);

    } catch (error) {
      logger.error('高并发推送测试执行失败', { testName, error: (error as Error).message });
    }

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    const duration = endTime - startTime;

    const metrics = this.calculateMetrics({
      testName,
      startTime,
      endTime,
      duration,
      totalMessages,
      successfulMessages: messageIds.length,
      failedMessages: totalMessages - messageIds.length,
      memoryUsage: { before: memoryBefore, after: memoryAfter },
      errorDetails
    });

    this.metrics.push(metrics);
    logger.info('高并发推送测试完成', metrics);

    return metrics;
  }

  /**
   * 多语言通知性能测试
   */
  public async testMultilingualNotificationPerformance(
    testName: string = 'Multilingual Notification Performance'
  ): Promise<PerformanceMetrics> {
    logger.info('开始多语言通知性能测试', { testName });

    const startTime = performance.now();
    const memoryBefore = process.memoryUsage();
    const languages = [Language.ZH, Language.EN, Language.RU, Language.TJ];
    const messagesPerLanguage = 500;
    const totalMessages = languages.length * messagesPerLanguage;
    const messageIds: string[] = [];
    const errorDetails: Array<{ messageId: string; error: string; timestamp: number }> = [];

    try {
      const messageQueue = faultToleranceManager.getMessageQueue();

      // 为每种语言生成通知
      for (const language of languages) {
        const languagePromises = [];

        for (let i = 0; i < messagesPerLanguage; i++) {
          const messageId = `multilang_${language}_${i}_${Date.now()}`;
          
          // 生成多语言通知数据
          const notification = this.generateMultilingualNotification(language, i);
          const startLatency = performance.now();

          const promise = messageQueue.addMessage('notification', {
            type: 'multilingual_notification',
            language,
            notification,
            metadata: {
              testId: messageId,
              testName,
              language,
              messageIndex: i
            }
          }).then((result) => {
            const latency = performance.now() - startLatency;
            this.recordLatency(messageId, latency);
            return result;
          });

          languagePromises.push(promise);
        }

        const languageResults = await Promise.allSettled(languagePromises);
        languageResults.forEach(result => {
          if (result.status === 'fulfilled') {
            messageIds.push(result.value);
          } else {
            errorDetails.push({
              messageId: `error_${language}_${Math.random()}`,
              error: result.reason?.message || 'Unknown error',
              timestamp: Date.now()
            });
          }
        });
      }

      // 等待处理完成
      await this.waitForMessageProcessing(totalMessages);

    } catch (error) {
      logger.error('多语言通知性能测试执行失败', { testName, error: (error as Error).message });
    }

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    const duration = endTime - startTime;

    const metrics = this.calculateMetrics({
      testName,
      startTime,
      endTime,
      duration,
      totalMessages,
      successfulMessages: messageIds.length,
      failedMessages: totalMessages - messageIds.length,
      memoryUsage: { before: memoryBefore, after: memoryAfter },
      errorDetails
    });

    this.metrics.push(metrics);
    logger.info('多语言通知性能测试完成', metrics);

    return metrics;
  }

  // 辅助方法
  private recordLatency(messageId: string, latency: number): void {
    if (!this.messageLatencies.has(messageId)) {
      this.messageLatencies.set(messageId, []);
    }
    this.messageLatencies.get(messageId)!.push(latency);
  }

  private calculateMetrics(data: Partial<PerformanceMetrics>): PerformanceMetrics {
    const allLatencies = Array.from(this.messageLatencies.values()).flat();
    allLatencies.sort((a, b) => a - b);

    const averageLatency = allLatencies.reduce((sum, latency) => sum + latency, 0) / allLatencies.length;
    const p95Index = Math.floor(allLatencies.length * 0.95);
    const p99Index = Math.floor(allLatencies.length * 0.99);

    return {
      testName: data.testName || 'Unknown Test',
      startTime: data.startTime || 0,
      endTime: data.endTime || 0,
      duration: data.duration || 0,
      totalMessages: data.totalMessages || 0,
      successfulMessages: data.successfulMessages || 0,
      failedMessages: data.failedMessages || 0,
      successRate: data.totalMessages ? (data.successfulMessages! / data.totalMessages) * 100 : 0,
      messagesPerSecond: data.duration ? (data.totalMessages! / (data.duration / 1000)) : 0,
      averageLatency,
      p95Latency: allLatencies[p95Index] || 0,
      p99Latency: allLatencies[p99Index] || 0,
      maxLatency: Math.max(...allLatencies, 0),
      minLatency: Math.min(...allLatencies, Infinity),
      memoryUsage: data.memoryUsage || { before: {} as any, after: {} as any },
      errorDetails: data.errorDetails || []
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async waitForMessageProcessing(expectedCount: number): Promise<void> {
    const maxWaitTime = 30000; // 30秒超时;
    const startTime = Date.now();
    const messageQueue = faultToleranceManager.getMessageQueue();

    while (Date.now() - startTime < maxWaitTime) {
      const stats = messageQueue.getStats();
      if (stats.processed >= expectedCount || stats.queueLength === 0) {
        break;
      }
      await this.delay(100);
    }
  }

  private createUserGroups(totalUsers: number): number[][] {
    const groupSize = Math.ceil(totalUsers / this.pushConfig.maxConcurrent);
    const groups: number[][] = [];
    
    for (let i = 0; i < totalUsers; i += groupSize) {
      const group = [];
      for (let j = i; j < Math.min(i + groupSize, totalUsers); j++) {
        group.push(j);
      }
      groups.push(group);
    }
    
    return groups;
  }

  private generateMultilingualNotification(language: Language, index: number): any {
    const variables = {
      balance: Math.floor(Math.random() * 1000),
      platformBalance: Math.floor(Math.random() * 500),
      vipLevel: Math.floor(Math.random() * 6),
      firstName: ['张三', 'John', 'Иван', 'Аҳмад'][index % 4],
      orderNumber: `TEST_${Date.now()}_${index}`,
      amount: Math.floor(Math.random() * 1000) + 100,
      appUrl: 'https://app.example.com'
    };

    return NotificationTemplateManager.generateNotification({
      user: {
        telegramId: `user_${language}_${index}`,
        userId: index,
        username: `user_${language}_${index}`,
        firstName: variables.firstName,
        language,
        balance: variables.balance,
        platformBalance: variables.platformBalance,
        vipLevel: variables.vipLevel
      },
      type: NotificationType.SYSTEM_NOTIFICATION,
      variables: {
        title: `${language} Notification ${index}`,
        content: `This is a ${language} notification number ${index}`,
        ...variables
      }
    });
  }

  public getPerformanceReport(): string {
    const totalTests = this.metrics.length;
    const totalMessages = this.metrics.reduce((sum, m) => sum + m.totalMessages, 0);
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const overallSuccessRate = this.metrics.reduce((sum, m) => sum + m.successRate, 0) / totalTests;
    
    let report = `# Telegram Bot 推送性能测试报告;

## 测试概览
- 总测试数量: ${totalTests}
- 总消息数量: ${totalMessages}
- 总测试时长: ${(totalDuration / 1000).toFixed(2)}秒
- 整体成功率: ${overallSuccessRate.toFixed(2)}%

## 详细测试结果

`;

    this.metrics.forEach((metric, index) => {
      report += `
### 测试 ${index + 1}: ${metric.testName}

**性能指标:**
- 消息数量: ${metric.totalMessages}
- 成功消息: ${metric.successfulMessages}
- 失败消息: ${metric.failedMessages}
- 成功率: ${metric.successRate.toFixed(2)}%
- 处理时长: ${metric.duration.toFixed(2)}ms
- 消息吞吐: ${metric.messagesPerSecond.toFixed(2)} msg/s

**延迟统计:**
- 平均延迟: ${metric.averageLatency.toFixed(2)}ms
- P95延迟: ${metric.p95Latency.toFixed(2)}ms
- P99延迟: ${metric.p99Latency.toFixed(2)}ms
- 最大延迟: ${metric.maxLatency.toFixed(2)}ms
- 最小延迟: ${metric.minLatency.toFixed(2)}ms

**内存使用:**
- 处理前: ${(metric.memoryUsage.before.heapUsed / 1024 / 1024).toFixed(2)}MB
- 处理后: ${(metric.memoryUsage.after.heapUsed / 1024 / 1024).toFixed(2)}MB
- 增长: ${((metric.memoryUsage.after.heapUsed - metric.memoryUsage.before.heapUsed) / 1024 / 1024).toFixed(2)}MB

${metric.errorDetails.length > 0 ? `**错误详情 (前5个):**\n${metric.errorDetails.slice(0, 5).map(e => `- ${e.messageId}: ${e.error}`).join('\n')}` : '无错误'}
`;
    });

    return report;
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public clearMetrics(): void {
    this.metrics = [];
    this.messageLatencies.clear();
  }
}

describe('Telegram Bot 推送性能测试', () => {
  let testRunner: PerformanceTestRunner;

  beforeAll(() => {
    logger.info('开始Telegram Bot推送性能测试');
    testRunner = new PerformanceTestRunner({
      maxConcurrent: 50,
      batchSize: 100,
      rateLimit: {
        messagesPerSecond: 20,
        burstLimit: 100
      },
      retryPolicy: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2
      }
    });
  });

  afterAll(async () => {
    // 等待所有测试完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const report = testRunner.getPerformanceReport();
    logger.info('性能测试完成', { report });
  });

  test('批量消息发送性能测试 - 1000条消息', async () => {
    const metrics = await testRunner.testBatchMessagePerformance(1000, 'Batch 1000 Messages');
    
    expect(metrics.successRate).toBeGreaterThan(90);
    expect(metrics.messagesPerSecond).toBeGreaterThan(50);
    expect(metrics.averageLatency).toBeLessThan(1000);
  }, 60000);

  test('批量消息发送性能测试 - 5000条消息', async () => {
    const metrics = await testRunner.testBatchMessagePerformance(5000, 'Batch 5000 Messages');
    
    expect(metrics.successRate).toBeGreaterThan(85);
    expect(metrics.messagesPerSecond).toBeGreaterThan(30);
    expect(metrics.p95Latency).toBeLessThan(2000);
  }, 120000);

  test('推送频率限制控制测试', async () => {
    const metrics = await testRunner.testRateLimitControl('Rate Limit Control');
    
    expect(metrics.successRate).toBeGreaterThan(95);
    expect(metrics.messagesPerSecond).toBeLessThan(25); // 略低于设定值是正常的
    expect(metrics.failedMessages).toBeLessThan(metrics.totalMessages * 0.1);
  }, 30000);

  test('消息重试和恢复测试', async () => {
    const metrics = await testRunner.testMessageRetryAndRecovery(0.3, 'Message Retry Test');
    
    expect(metrics.successRate).toBeGreaterThan(80); // 考虑重试后的成功率
    expect(metrics.averageLatency).toBeGreaterThan(1000); // 重试会增加延迟
  }, 60000);

  test('高并发推送测试', async () => {
    const metrics = await testRunner.testHighConcurrencyPush(500, 5, 'High Concurrency 500 Users');
    
    expect(metrics.successRate).toBeGreaterThan(85);
    expect(metrics.messagesPerSecond).toBeGreaterThan(100);
    expect(metrics.p99Latency).toBeLessThan(5000);
  }, 90000);

  test('多语言通知性能测试', async () => {
    const metrics = await testRunner.testMultilingualNotificationPerformance('Multilingual Performance');
    
    expect(metrics.successRate).toBeGreaterThan(95);
    expect(metrics.totalMessages).toBe(2000); // 4种语言 * 500条
    expect(metrics.averageLatency).toBeLessThan(500);
  }, 60000);

  describe('性能基准测试', () => {
    test('消息发送基准 - 100条消息', async () => {
      const startTime = performance.now();
      const messageQueue = faultToleranceManager.getMessageQueue();
      
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(messageQueue.addMessage('telegram', {
          type: 'send_message',
          text: `Benchmark message ${i}`
        }));
      }

      await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;
      const throughput = 100 / (duration / 1000);

      expect(duration).toBeLessThan(5000);
      expect(throughput).toBeGreaterThan(20);
      
      logger.info(`基准测试结果: ${duration.toFixed(2)}ms, ${throughput.toFixed(2)} msg/s`);
    }, 30000);

    test('模板渲染性能测试', async () => {
      const startTime = performance.now();
      const renderCount = 10000;

      for (let i = 0; i < renderCount; i++) {
        const notification = NotificationTemplateManager.generateNotification({
          user: {
            telegramId: `user_${i}`,
            userId: i,
            username: `user_${i}`,
            firstName: 'Test',
            language: Language.ZH,
            balance: 100,
            platformBalance: 50,
            vipLevel: 1
          },
          type: NotificationType.SYSTEM_NOTIFICATION,
          variables: {
            title: `Test Title ${i}`,
            content: `Test content ${i}`,
            balance: 100,
            platformBalance: 50,
            vipLevel: 1,
            appUrl: 'https://app.example.com'
          }
        });

        expect(notification.message).toBeDefined();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const renderTime = duration / renderCount;

      expect(duration).toBeLessThan(5000);
      expect(renderTime).toBeLessThan(1); // 每次渲染小于1ms

      logger.info(`模板渲染基准: ${duration.toFixed(2)}ms, ${renderTime.toFixed(4)}ms/次`);
    }, 30000);
  });
});

export { PerformanceTestRunner, PerformanceMetrics, PushConfig };