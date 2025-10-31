// request-utils.ts - 请求工具函数和使用示例
import { RequestPriority, priorityManager } from './priority-manager';
import { concurrencyController } from './concurrency-controller';
import { monitoringSystem } from './request-monitor';
import { requestManager } from './request-manager';
import { NetworkQuality } from './network-retry';

// 预设的业务优先级配置
export const BUSINESS_PRIORITIES = {
  // 电商核心功能
  CORE_COMMERCE: {
    payment: RequestPriority.CRITICAL,
    orderCreation: RequestPriority.CRITICAL,
    inventoryCheck: RequestPriority.CRITICAL,
    cartCheckout: RequestPriority.CRITICAL,
    userLogin: RequestPriority.CRITICAL,
    
    productSearch: RequestPriority.NORMAL,
    productDetails: RequestPriority.NORMAL,
    cartOperations: RequestPriority.NORMAL,
    userProfile: RequestPriority.NORMAL,
    orderHistory: RequestPriority.NORMAL,
    
    recommendations: RequestPriority.LOW,
    analytics: RequestPriority.LOW,
    dataSync: RequestPriority.LOW,
    logging: RequestPriority.LOW
  },

  // 用户体验相关
  USER_EXPERIENCE: {
    navigation: RequestPriority.CRITICAL,
    search: RequestPriority.CRITICAL,
    filter: RequestPriority.NORMAL,
    sorting: RequestPriority.NORMAL,
    
    imageLazyLoad: RequestPriority.LOW,
    prefetching: RequestPriority.LOW,
    cacheUpdates: RequestPriority.LOW
  },

  // 后台处理
  BACKGROUND_PROCESSING: {
    analyticsReporting: RequestPriority.LOW,
    dataExport: RequestPriority.LOW,
    batchOperations: RequestPriority.LOW,
    systemMonitoring: RequestPriority.LOW
  }
};

// 请求装饰器工厂
export function createPriorityRequestDecorator() {
  return function<T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value!;

    descriptor.value = async function(...args: any[]) {
      // 自动检测方法上的优先级配置
      const priority = (target.constructor as any).PRIORITY_MAPPINGS?.[propertyKey] || 
                      RequestPriority.NORMAL;

      return await requestManager.execute(
        () => originalMethod.apply(this, args),
        {
          priority,
          businessContext: {
            operation: propertyKey,
            urgency: this.getUrgency?.(args) || 'medium',
            businessValue: this.getBusinessValue?.(args) || 'medium'
          }
        }
      );
    } as T;

    return descriptor;
  };
}

// 业务上下文工具
export class BusinessContextBuilder {
  private context = {
    operation: '',
    userId: undefined as string | undefined,
    urgency: 'medium' as 'low' | 'medium' | 'high',
    businessValue: 'medium' as 'low' | 'medium' | 'high',
    userSegment: 'regular' as 'regular' | 'premium' | 'vip',
    sessionId: this.generateSessionId(),
    timestamp: Date.now()
  };

  // 设置操作类型
  operation(op: string): this {
    this.context.operation = op;
    return this;
  }

  // 设置用户ID
  user(id: string): this {
    this.context.userId = id;
    return this;
  }

  // 设置紧急程度
  urgency(level: 'low' | 'medium' | 'high'): this {
    this.context.urgency = level;
    return this;
  }

  // 设置业务价值
  businessValue(value: 'low' | 'medium' | 'high'): this {
    this.context.businessValue = value;
    return this;
  }

  // 设置用户群体
  userSegment(segment: 'regular' | 'premium' | 'vip'): this {
    this.context.userSegment = segment;
    return this;
  }

  // 构建上下文
  build() {
    return { ...this.context };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 智能请求调度器
export class SmartRequestScheduler {
  private requests: Array<{
    id: string;
    operation: () => Promise<any>;
    priority: RequestPriority;
    scheduledTime: number;
    context: any;
  }> = [];

  // 添加请求到调度器
  schedule<T>(
    operation: () => Promise<T>,
    priority: RequestPriority,
    delay: number = 0,
    context: any = {}
  ): string {
    const id = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.requests.push({
      id,
      operation,
      priority,
      scheduledTime: Date.now() + delay,
      context
    });

    // 按时间排序
    this.requests.sort((a, b) => a.scheduledTime - b.scheduledTime);

    return id;
  }

  // 批量调度
  scheduleBatch<T>(
    operations: Array<{
      operation: () => Promise<T>;
      priority: RequestPriority;
      delay?: number;
      context?: any;
    }>
  ): string[] {
    return operations.map(op => 
      this.schedule(op.operation, op.priority, op.delay || 0, op.context)
    );
  }

  // 执行调度器
  async execute(): Promise<Array<{ id: string; result: any; error?: string }>> {
    const now = Date.now();
    const dueRequests = this.requests.filter(req => req.scheduledTime <= now);
    
    // 移除已执行的请求
    this.requests = this.requests.filter(req => req.scheduledTime > now);

    const results = await Promise.allSettled(
      dueRequests.map(async (req) => {
        try {
          const result = await requestManager.execute(req.operation, {
            priority: req.priority,
            businessContext: req.context
          });
          
          return {
            id: req.id,
            result: result.success ? result.data : null,
            error: result.success ? undefined : result.error
          };
        } catch (error) {
          return {
            id: req.id,
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return results.map(result => 
      result.status === 'fulfilled' ? result.value : 
      { id: 'unknown', result: null, error: 'Execution failed' }
    );
  }

  // 获取队列状态
  getQueueStatus() {
    const now = Date.now();
    return {
      totalScheduled: this.requests.length,
      dueNow: this.requests.filter(req => req.scheduledTime <= now).length,
      upcoming: this.requests.filter(req => req.scheduledTime > now).length,
      byPriority: {
        [RequestPriority.CRITICAL]: this.requests.filter(req => req.priority === RequestPriority.CRITICAL).length,
        [RequestPriority.NORMAL]: this.requests.filter(req => req.priority === RequestPriority.NORMAL).length,
        [RequestPriority.LOW]: this.requests.filter(req => req.priority === RequestPriority.LOW).length
      }
    };
  }

  // 取消调度请求
  cancel(id: string): boolean {
    const index = this.requests.findIndex(req => req.id === id);
    if (index !== -1) {
      this.requests.splice(index, 1);
      return true;
    }
    return false;
  }

  // 清空调度器
  clear(): void {
    this.requests.length = 0;
  }
}

// 性能分析器
export class RequestPerformanceAnalyzer {
  private metrics: Map<string, {
    requestCount: number;
    totalTime: number;
    errorCount: number;
    priority: RequestPriority;
    lastAccess: number;
  }> = new Map();

  // 记录请求性能
  record(requestId: string, priority: RequestPriority, duration: number, success: boolean): void {
    const existing = this.metrics.get(requestId);
    
    if (existing) {
      existing.requestCount++;
      existing.totalTime += duration;
      existing.lastAccess = Date.now();
      if (!success) existing.errorCount++;
    } else {
      this.metrics.set(requestId, {
        requestCount: 1,
        totalTime: duration,
        errorCount: success ? 0 : 1,
        priority,
        lastAccess: Date.now()
      });
    }
  }

  // 获取性能分析
  analyze(): {
    summary: {
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
      performanceByPriority: Record<RequestPriority, {
        count: number;
        avgTime: number;
        errorRate: number;
      }>;
    };
    recommendations: Array<{
      type: string;
      message: string;
      impact: 'low' | 'medium' | 'high';
    }>;
    bottlenecks: Array<{
      requestId: string;
      avgTime: number;
      errorRate: number;
      priority: RequestPriority;
    }>;
  } {
    const summary = this.calculateSummary();
    const recommendations = this.generateRecommendations(summary);
    const bottlenecks = this.identifyBottlenecks();

    return { summary, recommendations, bottlenecks };
  }

  private calculateSummary() {
    let totalRequests = 0;
    let totalTime = 0;
    let totalErrors = 0;
    
    const byPriority: Record<RequestPriority, { count: number; totalTime: number; errors: number }> = {
      [RequestPriority.CRITICAL]: { count: 0, totalTime: 0, errors: 0 },
      [RequestPriority.NORMAL]: { count: 0, totalTime: 0, errors: 0 },
      [RequestPriority.LOW]: { count: 0, totalTime: 0, errors: 0 }
    };

    for (const [_, metrics] of this.metrics) {
      totalRequests += metrics.requestCount;
      totalTime += metrics.totalTime;
      totalErrors += metrics.errorCount;
      
      byPriority[metrics.priority].count += metrics.requestCount;
      byPriority[metrics.priority].totalTime += metrics.totalTime;
      byPriority[metrics.priority].errors += metrics.errorCount;
    }

    return {
      totalRequests,
      averageResponseTime: totalRequests > 0 ? totalTime / totalRequests : 0,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      performanceByPriority: {
        [RequestPriority.CRITICAL]: {
          count: byPriority[RequestPriority.CRITICAL].count,
          avgTime: byPriority[RequestPriority.CRITICAL].count > 0 ? 
                   byPriority[RequestPriority.CRITICAL].totalTime / byPriority[RequestPriority.CRITICAL].count : 0,
          errorRate: byPriority[RequestPriority.CRITICAL].count > 0 ? 
                     (byPriority[RequestPriority.CRITICAL].errors / byPriority[RequestPriority.CRITICAL].count) * 100 : 0
        },
        [RequestPriority.NORMAL]: {
          count: byPriority[RequestPriority.NORMAL].count,
          avgTime: byPriority[RequestPriority.NORMAL].count > 0 ? 
                   byPriority[RequestPriority.NORMAL].totalTime / byPriority[RequestPriority.NORMAL].count : 0,
          errorRate: byPriority[RequestPriority.NORMAL].count > 0 ? 
                     (byPriority[RequestPriority.NORMAL].errors / byPriority[RequestPriority.NORMAL].count) * 100 : 0
        },
        [RequestPriority.LOW]: {
          count: byPriority[RequestPriority.LOW].count,
          avgTime: byPriority[RequestPriority.LOW].count > 0 ? 
                   byPriority[RequestPriority.LOW].totalTime / byPriority[RequestPriority.LOW].count : 0,
          errorRate: byPriority[RequestPriority.LOW].count > 0 ? 
                     (byPriority[RequestPriority.LOW].errors / byPriority[RequestPriority.LOW].count) * 100 : 0
        }
      }
    };
  }

  private generateRecommendations(summary: any) {
    const recommendations = [];

    // 关键请求延迟建议
    if (summary.performanceByPriority[RequestPriority.CRITICAL].avgTime > 1000) {
      recommendations.push({
        type: 'critical_performance',
        message: '关键请求响应时间过长，建议增加并发限制或优化关键路径',
        impact: 'high' as const
      });
    }

    // 错误率建议
    if (summary.errorRate > 5) {
      recommendations.push({
        type: 'error_rate',
        message: '整体错误率较高，建议检查网络连接和服务稳定性',
        impact: 'high' as const
      });
    }

    // 并发建议
    const systemMetrics = requestManager.getSystemMetrics();
    if (systemMetrics.concurrency.utilizationRate > 80) {
      recommendations.push({
        type: 'concurrency',
        message: '系统并发利用率较高，建议适当调整并发参数',
        impact: 'medium' as const
      });
    }

    return recommendations;
  }

  private identifyBottlenecks() {
    const bottlenecks = [];

    for (const [requestId, metrics] of this.metrics) {
      const avgTime = metrics.totalTime / metrics.requestCount;
      const errorRate = (metrics.errorCount / metrics.requestCount) * 100;

      if (avgTime > 2000 || errorRate > 10) {
        bottlenecks.push({
          requestId,
          avgTime,
          errorRate,
          priority: metrics.priority
        });
      }
    }

    return bottlenecks.sort((a, b) => b.avgTime - a.avgTime);
  }

  // 清理旧数据
  cleanup(maxAge: number = 3600000): void { // 1小时
    const now = Date.now();
    for (const [requestId, metrics] of this.metrics) {
      if (now - metrics.lastAccess > maxAge) {
        this.metrics.delete(requestId);
      }
    }
  }
}

// 全局实例
export const smartScheduler = new SmartRequestScheduler();
export const performanceAnalyzer = new RequestPerformanceAnalyzer();
export const businessContextBuilder = new BusinessContextBuilder();

// React Hook - 增强请求
export function useBusinessRequest<T>(
  operation: () => Promise<T>,
  businessOptions: {
    operation: string;
    userId?: string;
    urgency?: 'low' | 'medium' | 'high';
    businessValue?: 'low' | 'medium' | 'high';
    priority?: RequestPriority;
  }
) {
  const { execute, ...state } = useEnhancedApi(operation, {
    businessContext: businessOptions,
    priority: businessOptions.priority,
    monitoring: {
      trackPerformance: true,
      realTime: true
    }
  });

  const executeWithBusinessContext = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    ...state,
    execute: executeWithBusinessContext,
    businessContext: businessOptions
  };
}

// React Hook - 批量请求
export function useBatchRequests() {
  const [batchState, setBatchState] = useState<{
    results: Array<{ id: string; data?: any; error?: string; success: boolean }>;
    loading: boolean;
    progress: number;
  }>({
    results: [],
    loading: false,
    progress: 0
  });

  const executeBatch = useCallback(async (
    requests: Array<{
      id: string;
      operation: () => Promise<any>;
      priority?: RequestPriority;
      businessContext?: any;
    }>
  ) => {
    setBatchState(prev => ({ ...prev, loading: true, progress: 0 }));

    const results = [];
    let completed = 0;

    // 按优先级分组并执行
    const groupedRequests = {
      [RequestPriority.CRITICAL]: requests.filter(r => r.priority === RequestPriority.CRITICAL),
      [RequestPriority.NORMAL]: requests.filter(r => !r.priority || r.priority === RequestPriority.NORMAL),
      [RequestPriority.LOW]: requests.filter(r => r.priority === RequestPriority.LOW)
    };

    for (const [priority, priorityRequests] of Object.entries(groupedRequests)) {
      // 并发执行同优先级请求
      const priorityResults = await Promise.allSettled(
        priorityRequests.map(async (req) => {
          try {
            const result = await requestManager.execute(req.operation, {
              priority: parseInt(priority) as RequestPriority,
              businessContext: req.businessContext
            });

            return {
              id: req.id,
              data: result.data,
              error: result.error,
              success: result.success
            };
          } catch (error) {
            return {
              id: req.id,
              data: null,
              error: error instanceof Error ? error.message : 'Unknown error',
              success: false
            };
          }
        })
      );

      // 收集结果
      for (const result of priorityResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }

      completed += priorityRequests.length;
      setBatchState(prev => ({
        ...prev,
        progress: (completed / requests.length) * 100
      }));
    }

    setBatchState(prev => ({
      ...prev,
      results,
      loading: false
    }));

    return results;
  }, []);

  return {
    ...batchState,
    executeBatch
  };
}

// 使用示例和测试代码
export const examples = {
  // 基础使用示例
  basicUsage: async () => {
    const result = await requestManager.execute(
      async () => {
        const response = await fetch('/api/user/profile');
        return response.json();
      },
      {
        priority: RequestPriority.CRITICAL,
        businessContext: {
          operation: 'userProfile',
          urgency: 'high',
          businessValue: 'high'
        }
      }
    );

    console.log('Request result:', result);
  },

  // 批量请求示例
  batchUsage: async () => {
    const requests = [
      {
        id: 'user_profile',
        operation: () => fetch('/api/user/profile').then(r => r.json()),
        priority: RequestPriority.CRITICAL,
        businessContext: { operation: 'userProfile', urgency: 'high' }
      },
      {
        id: 'product_list',
        operation: () => fetch('/api/products').then(r => r.json()),
        priority: RequestPriority.NORMAL,
        businessContext: { operation: 'productList', urgency: 'medium' }
      },
      {
        id: 'analytics',
        operation: () => fetch('/api/analytics').then(r => r.json()),
        priority: RequestPriority.LOW,
        businessContext: { operation: 'analytics', urgency: 'low' }
      }
    ];

    const smartScheduler = new SmartRequestScheduler();
    const results = await Promise.all(
      requests.map(req => 
        requestManager.execute(req.operation, {
          priority: req.priority,
          businessContext: req.businessContext
        })
      )
    );

    console.log('Batch results:', results);
  },

  // 调度器示例
  schedulerUsage: async () => {
    const scheduler = new SmartRequestScheduler();

    // 调度不同优先级的请求
    scheduler.schedule(
      () => fetch('/api/urgent-payment').then(r => r.json()),
      RequestPriority.CRITICAL,
      0,
      { operation: 'payment', urgency: 'high' }
    );

    scheduler.schedule(
      () => fetch('/api/product-recommendations').then(r => r.json()),
      RequestPriority.LOW,
      5000, // 5秒后执行
      { operation: 'recommendations', urgency: 'low' }
    );

    // 执行调度器
    const results = await scheduler.execute();
    console.log('Scheduled results:', results);
  },

  // 性能分析示例
  performanceAnalysis: async () => {
    const analyzer = new RequestPerformanceAnalyzer();

    // 模拟请求性能数据
    for (let i = 0; i < 100; i++) {
      analyzer.record(
        `request_${i}`,
        i < 10 ? RequestPriority.CRITICAL : 
        i < 50 ? RequestPriority.NORMAL : RequestPriority.LOW,
        Math.random() * 3000 + 100,
        Math.random() > 0.1 // 90% 成功率
      );
    }

    const analysis = analyzer.analyze();
    console.log('Performance analysis:', analysis);
  }
};

export default {
  BUSINESS_PRIORITIES,
  createPriorityRequestDecorator,
  BusinessContextBuilder,
  SmartRequestScheduler,
  RequestPerformanceAnalyzer,
  smartScheduler,
  performanceAnalyzer,
  businessContextBuilder,
  useBusinessRequest,
  useBatchRequests,
  examples
};
