import { 
import { 
import { 
import { 
import {
// request-priority-control.test.ts - 请求优先级和并发控制测试
  RequestPriority, 
  priorityManager, 
  DynamicPriorityManager,
  PriorityConfigManager,
  PriorityAnalyzer 
} from '../utils/priority-manager';

  GlobalConcurrencyController,
  PriorityBasedConcurrencyController,
  IntelligentScheduler
} from '../utils/concurrency-controller';

  RequestMonitoringSystem,
  monitoringSystem 
} from '../utils/request-monitor';

  RequestManager,
  requestManager 
} from '../utils/request-manager';

  BUSINESS_PRIORITIES,
  SmartRequestScheduler,
  RequestPerformanceAnalyzer,
  examples
} from '../utils/request-utils';

// 模拟网络环境
const mockNetworkQuality = {
  POOR: { latency: 2000, packetLoss: 0.1 },
  FAIR: { latency: 800, packetLoss: 0.05 },
  GOOD: { latency: 300, packetLoss: 0.01 },
  EXCELLENT: { latency: 100, packetLoss: 0.001 }
};

// 优先级管理器测试
describe('PriorityManager', () => {
  let priorityManager: DynamicPriorityManager;

  beforeEach(() => {
    priorityManager = new DynamicPriorityManager();
  });

  test('应该能自动确定请求优先级', () => {
    // 测试关键业务操作
    const criticalOp = priorityManager.autoDeterminePriority({
      operation: 'paymentProcessing',
      urgency: 'high'
    });
    expect(criticalOp).toBe(RequestPriority.CRITICAL);

    // 测试正常业务操作
    const normalOp = priorityManager.autoDeterminePriority({
      operation: 'productSearch',
      urgency: 'medium'
    });
    expect(normalOp).toBe(RequestPriority.NORMAL);

    // 测试低优先级操作
    const lowOp = priorityManager.autoDeterminePriority({
      operation: 'analytics',
      urgency: 'low'
    });
    expect(lowOp).toBe(RequestPriority.LOW);
  });

  test('应该能根据上下文动态调整优先级', () => {
    const basePriority = RequestPriority.NORMAL;

    // 系统负载高时调整
    const adjustedPriority = priorityManager.adjustPriority(basePriority, {
      systemLoad: 0.9,
      userActivity: 'high'
    });
    expect(adjustedPriority).toBeDefined();

    // 网络质量差时调整
    const networkAdjusted = priorityManager.adjustPriority(basePriority, {
      networkQuality: 'POOR' as any
    });
    expect(networkAdjusted).toBeDefined();
  });

  test('应该能分析请求特征', () => {
    const requestInfo = {
      url: '/api/auth/login',
      method: 'POST',
      size: 1024
    };

    const analysis = PriorityAnalyzer.analyzeRequest(requestInfo);
    expect(analysis).toHaveProperty('suggestedPriority');
    expect(analysis).toHaveProperty('confidence');
    expect(analysis).toHaveProperty('reasoning');
    expect(Array.isArray(analysis.reasoning)).toBe(true);
  });
});

// 并发控制器测试
describe('ConcurrencyController', () => {
  let controller: GlobalConcurrencyController;

  beforeEach(() => {
    controller = GlobalConcurrencyController.getInstance();
    controller.reset();
  });

  test('应该能控制全局并发', async () => {
    const mockRequest = {
      id: 'test-1',
      priority: RequestPriority.CRITICAL,
      startTime: Date.now(),
      expectedDuration: 5000,
      abortController: new AbortController()
    };

    // 获取槽位
    const canExecute = await controller.acquireSlot(mockRequest);
    expect(canExecute).toBe(true);

    // 释放槽位
    controller.releaseSlot('test-1');

    // 验证状态
    const status = controller.getSystemStatus();
    expect(status).toHaveProperty('health');
    expect(status).toHaveProperty('utilization');
  });

  test('应该支持优先级抢占', async () => {
    const lowPriorityRequest = {
      id: 'low-priority',
      priority: RequestPriority.LOW,
      startTime: Date.now(),
      expectedDuration: 10000,
      abortController: new AbortController()
    };

    const criticalRequest = {
      id: 'critical-request',
      priority: RequestPriority.CRITICAL,
      startTime: Date.now(),
      expectedDuration: 5000,
      abortController: new AbortController()
    };

    // 先执行低优先级请求
    await controller.acquireSlot(lowPriorityRequest);

    // 模拟系统满载
    for (let i = 0; i < controller['maxGlobalConcurrent']; i++) {
      const mockRequest = {
        id: `fill-${i}`,
        priority: RequestPriority.NORMAL,
        startTime: Date.now(),
        expectedDuration: 5000,
        abortController: new AbortController()
      };
      await controller.acquireSlot(mockRequest);
    }

    // 关键请求应该能够抢占
    const canExecute = await controller.acquireSlot(criticalRequest);
    expect(canExecute).toBe(true);
  });

  test('应该能获取详细的队列信息', () => {
    const queueInfo = controller.getQueueInfo();
    expect(queueInfo).toHaveProperty(String(RequestPriority.CRITICAL));
    expect(queueInfo).toHaveProperty(String(RequestPriority.NORMAL));
    expect(queueInfo).toHaveProperty(String(RequestPriority.LOW));
  });
});

// 监控系统测试
describe('RequestMonitoringSystem', () => {
  let monitoring: RequestMonitoringSystem;

  beforeEach(() => {
    monitoring = RequestMonitoringSystem.getInstance();
    monitoring.stopMonitoring();
    monitoring.startMonitoring();
  });

  afterEach(() => {
    monitoring.destroy();
  });

  test('应该能收集基本指标', () => {
    const metrics = monitoring.getCurrentMetrics();
    expect(metrics).toHaveProperty('timestamp');
    expect(metrics).toHaveProperty('performance');
    expect(metrics).toHaveProperty('priority');
    expect(metrics).toHaveProperty('network');
    expect(metrics).toHaveProperty('userExperience');
    expect(metrics).toHaveProperty('system');
  });

  test('应该能记录请求完成事件', () => {
    monitoring.recordRequestCompletion({
      requestId: 'test-request',
      priority: RequestPriority.CRITICAL,
      duration: 1500,
      success: true,
      waitTime: 100
    });

    const metrics = monitoring.getCurrentMetrics();
    expect(metrics.priority.criticalRequests.total).toBeGreaterThan(0);
    expect(metrics.priority.criticalRequests.successful).toBeGreaterThan(0);
  });

  test('应该能检测系统健康状态', () => {
    const health = monitoring.getSystemHealth();
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('score');
    expect(health).toHaveProperty('issues');
    expect(['healthy', 'warning', 'critical']).toContain(health.status);
  });

  test('应该能创建和管理告警', () => {
    // 模拟高错误率情况
    const testMetrics = {
      ...monitoring.getCurrentMetrics(),
      performance: {
        ...monitoring.getCurrentMetrics().performance,
        successRate: 80,
        errorRate: 20
      }
    };

    // 触发告警检查
    const alerts = monitoring.getAlerts();
    expect(Array.isArray(alerts)).toBe(true);
  });
});

// 统一请求管理器测试
describe('RequestManager', () => {
  let manager: RequestManager;

  beforeEach(() => {
    manager = RequestManager.getInstance();
    manager.reset();
  });

  test('应该能执行基本请求', async () => {
    const operation = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { message: 'success' };
    };

    const result = await manager.execute(operation, {
      priority: RequestPriority.NORMAL
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ message: 'success' });
    expect(result.metadata).toHaveProperty('requestId');
    expect(result.metadata).toHaveProperty('priority');
  });

  test('应该能处理业务上下文', async () => {
    const operation = async () => ({ status: 'ok' });

    const result = await manager.execute(operation, {
      businessContext: {
        operation: 'paymentProcessing',
        urgency: 'high',
        businessValue: 'high'
      }
    });

    expect(result.success).toBe(true);
    expect(result.metadata.priority).toBe(RequestPriority.CRITICAL);
  });

  test('应该能处理超时情况', async () => {
    const slowOperation = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { message: 'slow response' };
    };

    const result = await manager.execute(slowOperation, {
      timeout: 500,
      priority: RequestPriority.LOW
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('超时');
  });

  test('应该能处理重试机制', async () => {
    let attemptCount = 0;
    const flakyOperation = async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Temporary failure');
      }
      return { message: 'success after retries' };
    };

    const result = await manager.execute(flakyOperation, {
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 100
    });

    expect(result.success).toBe(true);
    expect(attemptCount).toBeGreaterThan(1);
  });

  test('应该能取消请求', async () => {
    const longOperation = async () => {
      await new Promise(resolve => setTimeout(resolve, 10000));
      return { message: 'should not complete' };
    };

    // 启动请求但不等待
    const executePromise = manager.execute(longOperation, {
      priority: RequestPriority.NORMAL
    });

    // 立即取消
    const cancelResult = manager.cancelRequest('test-cancel');
    expect(cancelResult).toBe(true);

    // 验证请求被取消
    const result = await executePromise;
    expect(result.success).toBe(false);
  });
});

// 智能调度器测试
describe('SmartRequestScheduler', () => {
  let scheduler: SmartRequestScheduler;

  beforeEach(() => {
    scheduler = new SmartRequestScheduler();
  });

  afterEach(() => {
    scheduler.clear();
  });

  test('应该能调度单个请求', async () => {
    const operation = async () => ({ id: 'scheduled-1' });
    const scheduleId = scheduler.schedule(operation, RequestPriority.CRITICAL, 0);

    expect(scheduleId).toBeDefined();

    const queueStatus = scheduler.getQueueStatus();
    expect(queueStatus.totalScheduled).toBe(1);
    expect(queueStatus.dueNow).toBe(1);
  });

  test('应该能调度批量请求', async () => {
    const operations = [;
      {
        operation: async () => ({ id: 'batch-1' }),
        priority: RequestPriority.CRITICAL,
        delay: 0
      },
      {
        operation: async () => ({ id: 'batch-2' }),
        priority: RequestPriority.NORMAL,
        delay: 1000
      },
      {
        operation: async () => ({ id: 'batch-3' }),
        priority: RequestPriority.LOW,
        delay: 2000
      }
    ];

    const scheduleIds = scheduler.scheduleBatch(operations);
    expect(scheduleIds).toHaveLength(3);

    const queueStatus = scheduler.getQueueStatus();
    expect(queueStatus.totalScheduled).toBe(3);
    expect(queueStatus.byPriority[RequestPriority.CRITICAL]).toBe(1);
    expect(queueStatus.byPriority[RequestPriority.NORMAL]).toBe(1);
    expect(queueStatus.byPriority[RequestPriority.LOW]).toBe(1);
  });

  test('应该能执行调度请求', async () => {
    scheduler.schedule(
      async () => ({ message: 'executed' }),
      RequestPriority.CRITICAL,
      0
    );

    const results = await scheduler.execute();
    expect(results).toHaveLength(1);
    expect((results?.0 ?? null).result).toEqual({ message: 'executed' });
    expect((results?.0 ?? null).error).toBeUndefined();
  });
});

// 性能分析器测试
describe('RequestPerformanceAnalyzer', () => {
  let analyzer: RequestPerformanceAnalyzer;

  beforeEach(() => {
    analyzer = new RequestPerformanceAnalyzer();
  });

  test('应该能记录和分析性能数据', () => {
    // 记录一些测试数据
    analyzer.record('req-1', RequestPriority.CRITICAL, 500, true);
    analyzer.record('req-1', RequestPriority.CRITICAL, 600, true);
    analyzer.record('req-2', RequestPriority.NORMAL, 1000, false);
    analyzer.record('req-3', RequestPriority.LOW, 2000, true);

    const analysis = analyzer.analyze();
    
    expect(analysis.summary).toHaveProperty('totalRequests');
    expect(analysis.summary).toHaveProperty('averageResponseTime');
    expect(analysis.summary).toHaveProperty('errorRate');
    expect(analysis.summary).toHaveProperty('performanceByPriority');
    
    expect(analysis.recommendations).toBeInstanceOf(Array);
    expect(analysis.bottlenecks).toBeInstanceOf(Array);
  });

  test('应该能识别性能瓶颈', () => {
    // 记录性能较差的请求
    analyzer.record('slow-req', RequestPriority.CRITICAL, 5000, false);
    analyzer.record('error-req', RequestPriority.NORMAL, 3000, false);

    const analysis = analyzer.analyze();
    expect(analysis.bottlenecks.length).toBeGreaterThan(0);
  });
});

// 集成测试
describe('Request Priority and Concurrency Integration', () => {
  test('完整工作流程测试', async () => {
    const manager = RequestManager.getInstance();
    manager.reset();

    // 执行不同优先级的请求
    const criticalResult = await manager.execute(;
      async () => ({ type: 'critical', data: 'important' }),
      { 
        priority: RequestPriority.CRITICAL,
        businessContext: { operation: 'payment', urgency: 'high' }
      }
    );

    const normalResult = await manager.execute(;
      async () => ({ type: 'normal', data: 'standard' }),
      { priority: RequestPriority.NORMAL }
    );

    const lowResult = await manager.execute(;
      async () => ({ type: 'low', data: 'background' }),
      { priority: RequestPriority.LOW }
    );

    // 验证结果
    expect(criticalResult.success).toBe(true);
    expect(normalResult.success).toBe(true);
    expect(lowResult.success).toBe(true);

    expect(criticalResult.metadata.priority).toBe(RequestPriority.CRITICAL);
    expect(normalResult.metadata.priority).toBe(RequestPriority.NORMAL);
    expect(lowResult.metadata.priority).toBe(RequestPriority.LOW);

    // 验证监控系统工作正常
    const metrics = monitoringSystem.getCurrentMetrics();
    expect(metrics.priority.criticalRequests.total).toBeGreaterThan(0);
    expect(metrics.priority.normalRequests.total).toBeGreaterThan(0);
    expect(metrics.priority.lowRequests.total).toBeGreaterThan(0);
  });

  test('高并发场景测试', async () => {
    const manager = RequestManager.getInstance();
    manager.reset();

    // 创建50个并发请求
    const requests = Array.from({ length: 50 }, (_, i) =>;
      manager.execute(
        async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
          return { id: i, timestamp: Date.now() };
        },
        {
          priority: i < 10 ? RequestPriority.CRITICAL : 
                   i < 30 ? RequestPriority.NORMAL : RequestPriority.LOW
        }
      )
    );

    // 等待所有请求完成
    const results = await Promise.all(requests);

    // 验证结果
    const successfulResults = results.filter(r => r.success);
    expect(successfulResults.length).toBeGreaterThan(45); // 90% 成功率

    // 验证系统状态
    const systemStatus = manager.getSystemMetrics();
    expect(systemStatus.system.health).toMatch(/healthy|warning/);
  });
});

// 性能基准测试
describe('Performance Benchmarks', () => {
  test('优先级调度性能', async () => {
    const start = performance.now();
    
    const manager = RequestManager.getInstance();
    manager.reset();

    const promises = Array.from({ length: 20 }, (_, i) =>;
      manager.execute(
        async () => ({ id: i }),
        { priority: [RequestPriority.CRITICAL, RequestPriority.NORMAL, RequestPriority.LOW][i % 3] }
      )
    );

    await Promise.all(promises);
    
    const end = performance.now();
    const executionTime = end - start;

    // 应该在合理时间内完成
    expect(executionTime).toBeLessThan(5000); // 5秒内完成
  });

  test('监控系统性能影响', async () => {
    const monitoring = RequestMonitoringSystem.getInstance();
    
    const start = performance.now();
    
    // 触发多次指标收集
    for (let i = 0; i < 100; i++) {
      monitoring.recordRequestCompletion({
        requestId: `perf-test-${i}`,
        priority: RequestPriority.NORMAL,
        duration: Math.random() * 1000,
        success: Math.random() > 0.1,
        waitTime: Math.random() * 100
      });
    }
    
    const end = performance.now();
    const collectionTime = end - start;

    // 指标收集不应该阻塞主线程
    expect(collectionTime).toBeLessThan(100); // 100ms内完成
  });
});

// 导出测试辅助函数
export const testUtils = {
  // 创建模拟请求
  createMockRequest: (priority: RequestPriority, delay: number = 100) => ({
    operation: async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return { mock: true, priority, delay };
    },
    priority,
    delay
  }),

  // 模拟网络延迟
  simulateNetworkDelay: (min: number = 100, max: number = 1000) => {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  },

  // 创建测试用户场景
  createUserScenario: (userType: 'regular' | 'premium' | 'vip') => {
    return {
      userId: `user-${userType}-${Date.now()}`,
      segment: userType,
      context: {
        businessContext: {
          operation: 'userAction',
          businessValue: userType === 'vip' ? 'high' : 'medium',
          urgency: userType === 'premium' ? 'high' : 'medium'
}
      }
    };
  }
};

export default {
  testUtils
};
