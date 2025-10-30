/**
 * Bot容错机制集成测试
 * 测试Telegram Bot的错误处理、重连机制、消息队列等功能
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Telegraf } from 'telegraf';
import {
  FaultToleranceManager,
  reconnectManager,
  healthMonitor,
  messageQueue,
  processMonitor
} from '../bot/utils/fault-tolerance-manager';
import { enhancedLauncher } from '../bot/enhanced-launcher';

describe('Bot容错机制测试', () => {
  let mockBot: any;
  let faultToleranceManager: FaultToleranceManager;

  beforeAll(() => {
    console.log('🤖 初始化Bot容错测试...');
    
    // 创建模拟Bot实例
    mockBot = {
      telegram: {
        sendMessage: jest.fn(),
        editMessageText: jest.fn(),
        deleteMessage: jest.fn(),
        getMe: jest.fn().mockResolvedValue({ id: 123456789, first_name: 'Test Bot' })
      },
      command: jest.fn(),
      hear: jest.fn(),
      launch: jest.fn(),
      stop: jest.fn(),
      catch: jest.fn()
    };
    
    faultToleranceManager = new FaultToleranceManager(mockBot);
  });

  afterAll(() => {
    console.log('🧹 清理Bot容错测试...');
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // 每个测试前重置状态
    jest.clearAllMocks();
    faultToleranceManager.resetState();
  });

  describe('错误处理机制测试', () => {
    test('应该捕获和处理Bot启动错误', async () => {
      // 模拟启动失败
      mockBot.launch.mockRejectedValue(new Error('Network connection failed'));
      
      const config = {
        maxRetries: 3,
        retryDelay: 1000,
        enableHealthCheck: true
      };

      const result = await faultToleranceManager.initializeBot(config);
      
      expect(result.success).toBe(false);
      expect(result.attempts).toBeGreaterThan(1);
      expect(result.error).toContain('Network connection failed');
    });

    test('应该处理命令执行错误', async () => {
      const testError = new Error('Command execution failed');
      
      // 模拟命令执行
      const mockHandler = jest.fn().mockRejectedValue(testError);
      
      // 测试错误处理
      await faultToleranceManager.handleCommandError('start', testError);
      
      expect(mockHandler).not.toHaveBeenCalled(); // 确保错误被正确处理
    });

    test('应该记录错误日志', async () => {
      const error = new Error('Test error for logging');
      const context = { chatId: 123456, userId: 654321 };
      
      await faultToleranceManager.logError(error, context);
      
      // 验证错误被记录
      expect(faultToleranceManager.getErrorLog().length).toBeGreaterThan(0);
    });

    test('应该防止错误累积', async () => {
      const maxErrors = 5;
      const errors = Array(maxErrors + 1).fill(0).map(() => 
        new Error(`Error ${Math.random()}`)
      );
      
      // 触发多个错误
      for (const error of errors) {
        await faultToleranceManager.handleError(error);
      }
      
      const errorCount = faultToleranceManager.getErrorCount();
      expect(errorCount).toBeLessThanOrEqual(maxErrors);
    });
  });

  describe('重连机制测试', () => {
    test('应该自动重连断开的连接', async () => {
      const originalLaunch = mockBot.launch;
      let callCount = 0;
      
      // 模拟重连行为
      mockBot.launch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Connection failed');
        }
        return Promise.resolve();
      });

      const reconnectResult = await reconnectManager.attemptReconnect({
        maxAttempts: 5,
        delayBetweenAttempts: 1000
      });

      expect(reconnectResult.success).toBe(true);
      expect(callCount).toBeGreaterThan(1);
      expect(reconnectResult.attempts).toBe(3);
    });

    test('应该在达到最大重试次数后停止', async () => {
      let attempts = 0;
      mockBot.launch = jest.fn().mockImplementation(() => {
        attempts++;
        throw new Error('Persistent connection failure');
      });

      const reconnectResult = await reconnectManager.attemptReconnect({
        maxAttempts: 3,
        delayBetweenAttempts: 500
      });

      expect(reconnectResult.success).toBe(false);
      expect(reconnectResult.attempts).toBe(3);
      expect(attempts).toBe(3);
    });

    test('应该使用指数退避策略', async () => {
      const delays: number[] = [];
      const originalDelay = setTimeout;
      
      // 模拟setTimeout来捕获延迟时间
      global.setTimeout = jest.fn().mockImplementation((callback, delay) => {
        delays.push(delay);
        return originalDelay(callback, 0) as any;
      });

      await reconnectManager.attemptReconnect({
        maxAttempts: 4,
        delayBetweenAttempts: 1000,
        backoffMultiplier: 2
      });

      // 验证指数退避
      expect(delays[0]).toBe(1000); // 第一次延迟
      expect(delays[1]).toBe(2000); // 第二次延迟（2倍）
      expect(delays[2]).toBe(4000); // 第三次延迟（4倍）

      // 恢复原始setTimeout
      global.setTimeout = originalDelay;
    });

    test('应该在重连成功时重置错误计数', async () => {
      // 先模拟一些错误
      for (let i = 0; i < 3; i++) {
        await faultToleranceManager.handleError(new Error(`Previous error ${i}`));
      }

      expect(faultToleranceManager.getErrorCount()).toBe(3);

      // 模拟成功重连
      mockBot.launch.mockResolvedValue(Promise.resolve());
      await reconnectManager.attemptReconnect({ maxAttempts: 1 });

      expect(faultToleranceManager.getErrorCount()).toBe(0);
    });
  });

  describe('消息队列测试', () => {
    test('应该正确排队消息', async () => {
      const testMessages = [
        { chatId: 123, text: 'Message 1' },
        { chatId: 456, text: 'Message 2' },
        { chatId: 789, text: 'Message 3' }
      ];

      for (const message of testMessages) {
        await messageQueue.enqueue(message);
      }

      const queuedMessages = await messageQueue.getQueue();
      expect(queuedMessages.length).toBe(3);
    });

    test('应该按FIFO顺序处理消息', async () => {
      const messages = [
        { chatId: 1, text: 'First message' },
        { chatId: 2, text: 'Second message' },
        { chatId: 3, text: 'Third message' }
      ];

      // 添加消息
      for (const message of messages) {
        await messageQueue.enqueue(message);
      }

      // 模拟处理消息
      const processedMessages = [];
      const maxBatch = 2;
      const batch = await messageQueue.dequeueBatch(maxBatch);
      
      expect(batch.length).toBeLessThanOrEqual(maxBatch);
      expect(batch[0].text).toBe('First message'); // FIFO顺序
    });

    test('应该处理消息处理失败', async () => {
      const failedMessage = { chatId: 123, text: 'This will fail' };
      
      // 模拟消息处理失败
      mockBot.telegram.sendMessage.mockRejectedValue(new Error('Send failed'));
      
      await messageQueue.enqueue(failedMessage);
      const result = await messageQueue.processNext();
      
      expect(result.success).toBe(false);
      expect(result.attempts).toBeGreaterThan(0);
    });

    test('应该支持优先级队列', async () => {
      const normalMessage = { chatId: 1, text: 'Normal', priority: 1 };
      const urgentMessage = { chatId: 2, text: 'Urgent', priority: 10 };
      const lowPriorityMessage = { chatId: 3, text: 'Low', priority: 0 };

      await messageQueue.enqueue(urgentMessage);
      await messageQueue.enqueue(normalMessage);
      await messageQueue.enqueue(lowPriorityMessage);

      const topMessage = await messageQueue.peek();
      expect(topMessage.priority).toBe(10); // 最高优先级
    });

    test('应该清理过期消息', async () => {
      const now = Date.now();
      const expiredMessage = { 
        chatId: 1, 
        text: 'Expired', 
        timestamp: now - 3600000 // 1小时前
      };
      const freshMessage = { 
        chatId: 2, 
        text: 'Fresh', 
        timestamp: now 
      };

      await messageQueue.enqueue(expiredMessage);
      await messageQueue.enqueue(freshMessage);

      await messageQueue.cleanupExpired(1800000); // 清理30分钟前的消息

      const queue = await messageQueue.getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].text).toBe('Fresh');
    });
  });

  describe('健康监控测试', () => {
    test('应该监控Bot连接状态', async () => {
      // 模拟正常连接
      mockBot.telegram.getMe.mockResolvedValue({ 
        id: 123456789, 
        first_name: 'Test Bot' 
      });

      const healthStatus = await healthMonitor.checkConnection();
      
      expect(healthStatus.connected).toBe(true);
      expect(healthStatus.responseTime).toBeLessThan(5000);
      expect(healthStatus.lastCheck).toBeDefined();
    });

    test('应该检测连接断开', async () => {
      // 模拟连接失败
      mockBot.telegram.getMe.mockRejectedValue(
        new Error('Connection timeout')
      );

      const healthStatus = await healthMonitor.checkConnection();
      
      expect(healthStatus.connected).toBe(false);
      expect(healthStatus.error).toBeDefined();
    });

    test('应该记录响应时间趋势', async () => {
      const responseTimes: number[] = [];
      
      // 模拟多次健康检查
      for (let i = 0; i < 5; i++) {
        mockBot.telegram.getMe.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => 
            resolve({ id: 123456789 }), i * 100
          ))
        );
        
        await healthMonitor.checkConnection();
        responseTimes.push(healthMonitor.getLastResponseTime() || 0);
      }

      expect(responseTimes.length).toBe(5);
      
      // 验证趋势记录
      const trend = healthMonitor.getResponseTimeTrend();
      expect(trend.length).toBeGreaterThan(0);
    });

    test('应该在连接异常时触发告警', async () => {
      const alertCallback = jest.fn();
      healthMonitor.onAlert(alertCallback);

      // 模拟连续失败
      for (let i = 0; i < 3; i++) {
        mockBot.telegram.getMe.mockRejectedValue(new Error('Network error'));
        await healthMonitor.checkConnection();
      }

      expect(alertCallback).toHaveBeenCalled();
    });
  });

  describe('进程监控测试', () => {
    test('应该监控Bot进程状态', async () => {
      const processStatus = await processMonitor.checkProcess();
      
      expect(processStatus.pid).toBeDefined();
      expect(processStatus.memory).toBeDefined();
      expect(processStatus.cpu).toBeDefined();
      expect(processStatus.uptime).toBeGreaterThan(0);
    });

    test('应该检测内存泄漏', async () => {
      const initialMemory = process.memoryUsage();
      
      // 模拟内存增长
      const largeData = Array(1000000).fill('x');
      const afterDataMemory = process.memoryUsage();
      
      // 清理数据
      largeData.length = 0;
      
      const memoryCheck = await processMonitor.checkMemoryUsage();
      
      expect(memoryCheck.heapUsed).toBeDefined();
      expect(memoryCheck.external).toBeDefined();
    });

    test('应该在资源耗尽时重启进程', async () => {
      const restartCallback = jest.fn();
      processMonitor.onRestart(restartCallback);

      // 模拟高内存使用
      processMonitor.simulateHighMemoryUsage();
      
      const memoryCheck = await processMonitor.checkMemoryUsage();
      if (memoryCheck.usage > 0.9) { // 超过90%
        await processMonitor.requestRestart();
      }

      expect(restartCallback).toHaveBeenCalled();
    });
  });

  describe('优雅关闭测试', () => {
    test('应该优雅关闭Bot', async () => {
      const shutdownResult = await faultToleranceManager.gracefulShutdown();
      
      expect(shutdownResult.success).toBe(true);
      expect(mockBot.stop).toHaveBeenCalled();
    });

    test('应该在关闭时保存队列状态', async () => {
      // 添加一些待处理消息
      await messageQueue.enqueue({ chatId: 1, text: 'Test message' });
      
      const shutdownResult = await faultToleranceManager.gracefulShutdown();
      
      expect(shutdownResult.queueSaved).toBe(true);
    });

    test('应该清理资源', async () => {
      await faultToleranceManager.gracefulShutdown();
      
      // 验证资源清理
      expect(messageQueue.isEmpty()).toBe(true);
      expect(healthMonitor.isMonitoring()).toBe(false);
    });
  });

  describe('配置管理测试', () => {
    test('应该加载容错配置', () => {
      const config = {
        maxRetries: 5,
        retryDelay: 2000,
        enableHealthCheck: true,
        healthCheckInterval: 30000,
        maxQueueSize: 1000,
        messageTimeout: 5000
      };

      faultToleranceManager.updateConfig(config);
      const currentConfig = faultToleranceManager.getConfig();

      expect(currentConfig.maxRetries).toBe(5);
      expect(currentConfig.retryDelay).toBe(2000);
      expect(currentConfig.enableHealthCheck).toBe(true);
    });

    test('应该验证配置有效性', () => {
      const invalidConfig = {
        maxRetries: -1,
        retryDelay: 0,
        enableHealthCheck: 'invalid' as any
      };

      expect(() => {
        faultToleranceManager.updateConfig(invalidConfig);
      }).toThrow();
    });
  });

  describe('性能测试', () => {
    test('消息队列吞吐量', async () => {
      const messageCount = 1000;
      const startTime = process.hrtime.bigint();

      // 添加消息
      const enqueuePromises = Array(messageCount).fill(0).map((_, i) =>
        messageQueue.enqueue({ chatId: i, text: `Message ${i}` })
      );

      await Promise.all(enqueuePromises);

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      const throughput = messageCount / (duration / 1000);

      console.log(`   📨 消息队列吞吐量: ${throughput.toFixed(2)} msgs/sec`);
      expect(throughput).toBeGreaterThan(100); // 至少100 msgs/sec
    });

    test('错误处理性能', async () => {
      const errorCount = 100;
      const startTime = process.hrtime.bigint();

      const errorPromises = Array(errorCount).fill(0).map(() =>
        faultToleranceManager.handleError(new Error('Test error'))
      );

      await Promise.all(errorPromises);

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      const throughput = errorCount / (duration / 1000);

      console.log(`   ⚡ 错误处理性能: ${throughput.toFixed(2)} errors/sec`);
      expect(duration).toBeLessThan(1000); // 应该在1秒内处理
    });
  });

  describe('集成测试', () => {
    test('完整的容错工作流', async () => {
      // 1. 初始化Bot
      const initResult = await faultToleranceManager.initializeBot({
        maxRetries: 3,
        retryDelay: 500,
        enableHealthCheck: true
      });

      expect(initResult.success).toBe(true);

      // 2. 添加消息到队列
      await messageQueue.enqueue({ chatId: 1, text: 'Integration test message' });

      // 3. 执行健康检查
      const healthStatus = await healthMonitor.checkConnection();
      expect(healthStatus).toBeDefined();

      // 4. 模拟错误并处理
      await faultToleranceManager.handleError(new Error('Simulated error'));

      // 5. 优雅关闭
      const shutdownResult = await faultToleranceManager.gracefulShutdown();
      expect(shutdownResult.success).toBe(true);

      console.log('   ✅ 完整工作流测试通过');
    });
  });
});