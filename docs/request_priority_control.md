# 幸运商城TJ - 请求优先级和并发控制实现方案

## 1. 执行概述

### 1.1 项目背景
在luckymart-tj项目中实现完整的请求优先级管理和并发控制机制，提升系统在高并发场景下的稳定性和用户体验。

### 1.2 核心目标
- 建立三级请求优先级分类体系（关键、正常、低优先级）
- 实现智能并发控制机制
- 完善请求取消和超时管理
- 优化重试和降级策略
- 建立完善的监控和性能指标体系

## 2. 现有请求管理架构分析

### 2.1 当前实现状态
经过代码审查，项目已具备以下基础组件：

#### 2.1.1 请求队列管理 (`utils/request-queue.ts`)
- ✅ **已有功能**：
  - `NetworkAwareRequestQueue` 网络感知请求队列
  - 优先级系统（LOW=0, NORMAL=1, HIGH=2, CRITICAL=3）
  - 并发控制（maxConcurrent 可配置）
  - 重试机制和依赖管理
  - 批量处理支持

#### 2.1.2 网络重试机制 (`utils/network-retry.ts`)
- ✅ **已有功能**：
  - `NetworkRetryManager` 智能重试管理器
  - 网络质量监控
  - 多种重试策略（固定、线性、指数退避）
  - 错误类型识别和重试判断
  - 批量重试支持

#### 2.1.3 请求降级策略 (`utils/request-degradation.ts`)
- ✅ **已有功能**：
  - `RequestDegradationManager` 降级管理器
  - 四种降级策略（缓存优先、网络优先、过期缓存、离线降级）
  - 缓存管理和自动清理
  - 预定义降级数据

#### 2.1.4 API客户端 (`lib/api-client.ts`)
- ✅ **已有功能**：
  - 统一的请求接口
  - 基础错误处理
  - AbortController 管理
  - 请求取消功能

### 2.2 架构优势
- 模块化设计，各组件职责明确
- 良好的扩展性和可配置性
- 集成了网络质量感知能力
- 提供了完整的生命周期管理

### 2.3 改进空间
- 优先级分类需要更细化
- 并发控制策略需要智能化
- 监控指标需要完善
- 需要统一的请求管理入口

## 3. 请求优先级分类设计

### 3.1 优先级分类体系

#### 3.1.1 三级分类架构

```typescript
// 扩展优先级枚举
export enum RequestPriority {
  LOW = 0,        // 低优先级：后台同步、非关键数据
  NORMAL = 1,     // 正常优先级：常规业务操作
  CRITICAL = 2    // 关键优先级：核心交易、用户认证
}

// 业务场景映射
export const PRIORITY_MAPPINGS = {
  // 关键优先级 - 直接影响用户体验和交易
  CRITICAL: {
    userAuthentication: true,        // 用户登录验证
    paymentProcessing: true,         // 支付处理
    orderCreation: true,             // 订单创建
    inventoryCheck: true,            // 库存检查
    securityVerification: true,      // 安全验证
    criticalNotifications: true      // 重要通知
  },
  
  // 正常优先级 - 常规业务功能
  NORMAL: {
    productSearch: true,             // 产品搜索
    cartOperations: true,            // 购物车操作
    userProfile: true,               // 用户资料
    orderHistory: true,              // 订单历史
    productReviews: true,            // 产品评价
    analyticsReporting: true         // 数据分析
  },
  
  // 低优先级 - 后台处理和非关键功能
  LOW: {
    dataSync: true,                  // 数据同步
    analytics: true,                 // 统计数据
    prefetching: true,               // 预加载
    imageOptimization: true,         // 图片优化
    cacheUpdates: true,              // 缓存更新
    logging: true                    // 日志记录
  }
};
```

#### 3.1.2 动态优先级调整

```typescript
// 动态优先级调整器
export class DynamicPriorityManager {
  private userActivityScore = 0;
  private networkQuality: NetworkQuality = NetworkQuality.EXCELLENT;
  private systemLoad = 0;

  // 根据上下文动态调整优先级
  adjustPriority(
    basePriority: RequestPriority,
    context: {
      userActivity?: 'high' | 'medium' | 'low';
      networkQuality?: NetworkQuality;
      systemLoad?: number;
      criticalUserAction?: boolean;
    }
  ): RequestPriority {
    let adjustedPriority = basePriority;

    // 系统负载高时，提升关键请求优先级
    if (context.systemLoad && context.systemLoad > 0.8) {
      if (basePriority === RequestPriority.CRITICAL) {
        adjustedPriority = RequestPriority.CRITICAL; // 保持最高
      } else if (basePriority === RequestPriority.NORMAL) {
        adjustedPriority = basePriority; // 正常优先级不变
      } else {
        // 低优先级进一步降低
        adjustedPriority = RequestPriority.LOW;
      }
    }

    // 网络质量差时，调整处理策略
    if (context.networkQuality === NetworkQuality.POOR) {
      // 网络差时，将非关键请求转为离线模式
      if (basePriority === RequestPriority.LOW) {
        adjustedPriority = RequestPriority.LOW; // 保持低优先级但使用离线策略
      }
    }

    return adjustedPriority;
  }
}
```

### 3.2 优先级配置

#### 3.2.1 预设配置
```typescript
export const PRIORITY_CONFIGS = {
  // 关键优先级配置 - 快速响应，最大资源分配
  CRITICAL: {
    maxConcurrent: 10,
    timeout: 5000,        // 5秒超时
    maxRetries: 3,
    retryDelay: 200,      // 快速重试
    enableQueue: false,   // 关键请求不排队
    backoffStrategy: 'exponential',
    enableDegradation: false // 不降级
  },

  // 正常优先级配置 - 平衡的资源分配
  NORMAL: {
    maxConcurrent: 5,
    timeout: 15000,       // 15秒超时
    maxRetries: 2,
    retryDelay: 1000,
    enableQueue: true,
    backoffStrategy: 'linear',
    enableDegradation: true
  },

  // 低优先级配置 - 资源有限，后台处理
  LOW: {
    maxConcurrent: 2,
    timeout: 60000,       // 60秒超时
    maxRetries: 5,
    retryDelay: 5000,
    enableQueue: true,
    backoffStrategy: 'fixed',
    enableDegradation: true,
    batchProcessing: true
  }
};
```

## 4. 并发控制机制

### 4.1 多层级并发控制

#### 4.1.1 全局并发控制
```typescript
export class GlobalConcurrencyController {
  private maxGlobalConcurrent = 20;
  private activeRequests = new Map<string, RequestInfo>();
  private priorityQueues = new Map<RequestPriority, RequestQueue>();

  // 全局并发限制
  async acquireSlot(priority: RequestPriority): Promise<boolean> {
    const totalActive = this.getTotalActiveRequests();
    
    if (totalActive >= this.maxGlobalConcurrent) {
      // 检查是否可以抢占低优先级请求
      if (priority === RequestPriority.CRITICAL) {
        return this.tryPreemptLowPriority();
      }
      return false;
    }
    
    return true;
  }

  // 尝试抢占低优先级请求
  private tryPreemptLowPriority(): boolean {
    const lowPriorityRequests = this.activeRequests.values()
      .filter(req => req.priority === RequestPriority.LOW);
    
    if (lowPriorityRequests.length > 0) {
      const oldestRequest = lowPriorityRequests
        .sort((a, b) => a.startTime - b.startTime)[0];
      
      // 取消最老的低优先级请求
      this.cancelRequest(oldestRequest.id);
      return true;
    }
    
    return false;
  }
}
```

#### 4.1.2 按优先级分组并发控制
```typescript
export class PriorityBasedConcurrencyController {
  private concurrencyLimits = {
    [RequestPriority.CRITICAL]: 10,
    [RequestPriority.NORMAL]: 5,
    [RequestPriority.LOW]: 2
  };

  private activeByPriority = {
    [RequestPriority.CRITICAL]: new Set<string>(),
    [RequestPriority.NORMAL]: new Set<string>(),
    [RequestPriority.LOW]: new Set<string>()
  };

  canExecute(priority: RequestPriority): boolean {
    const currentActive = this.activeByPriority[priority].size;
    const limit = this.concurrencyLimits[priority];
    
    return currentActive < limit;
  }

  // 动态调整并发限制
  adjustConcurrencyLimits(adjustments: Partial<typeof this.concurrencyLimits>) {
    Object.assign(this.concurrencyLimits, adjustments);
  }
}
```

### 4.2 智能调度算法

#### 4.2.1 优先级调度器
```typescript
export class PriorityScheduler {
  private requestQueue: NetworkAwareRequestQueue;
  private调度策略: 'fifo' | 'priority' | 'weighted_fair' = 'weighted_fair';

  // 加权公平调度
  scheduleNext(): string | null {
    const items = this.requestQueue.getItems({
      status: QueueItemStatus.PENDING
    });

    if (items.length === 0) return null;

    switch (this.调度策略) {
      case 'priority':
        return this.scheduleByPriority(items);
      
      case 'weighted_fair':
        return this.scheduleByWeightedFair(items);
      
      default:
        return this.scheduleFIFO(items);
    }
  }

  // 加权公平调度实现
  private scheduleByWeightedFair(items: QueueItem[]): string {
    // CRITICAL: 50%, NORMAL: 35%, LOW: 15%
    const weights = {
      [RequestPriority.CRITICAL]: 0.5,
      [RequestPriority.NORMAL]: 0.35,
      [RequestPriority.LOW]: 0.15
    };

    // 计算每个优先级的权重
    const priorityCounts = {
      [RequestPriority.CRITICAL]: items.filter(i => i.priority === RequestPriority.CRITICAL).length,
      [RequestPriority.NORMAL]: items.filter(i => i.priority === RequestPriority.NORMAL).length,
      [RequestPriority.LOW]: items.filter(i => i.priority === RequestPriority.LOW).length
    };

    // 选择下一个执行的请求
    return this.selectNextByWeight(items, priorityCounts, weights);
  }
}
```

## 5. 请求取消和超时机制

### 5.1 分层超时控制

#### 5.1.1 多级超时策略
```typescript
export class MultiLevelTimeoutManager {
  private timeouts = {
    // 请求级超时 - 单个请求的最大执行时间
    request: new Map<string, NodeJS.Timeout>(),
    
    // 优先级级超时 - 按优先级设置的超时
    priority: new Map<RequestPriority, NodeJS.Timeout>(),
    
    // 全局超时 - 所有请求的总超时时间
    global: new Map<string, NodeJS.Timeout>()
  };

  // 设置分层超时
  setTimeouts(requestId: string, priority: RequestPriority, config: {
    requestTimeout?: number;
    priorityTimeout?: number;
    globalTimeout?: number;
  }) {
    // 请求超时
    if (config.requestTimeout) {
      this.timeouts.request.set(requestId, setTimeout(() => {
        this.handleRequestTimeout(requestId);
      }, config.requestTimeout));
    }

    // 优先级超时（批量超时）
    if (config.priorityTimeout) {
      const priorityTimeoutId = setTimeout(() => {
        this.handlePriorityTimeout(priority);
      }, config.priorityTimeout);
      this.timeouts.priority.set(priority, priorityTimeoutId);
    }

    // 全局超时
    if (config.globalTimeout) {
      const globalTimeoutId = setTimeout(() => {
        this.handleGlobalTimeout();
      }, config.globalTimeout);
      this.timeouts.global.set('global', globalTimeoutId);
    }
  }
}
```

#### 5.1.2 智能超时调整
```typescript
export class AdaptiveTimeoutManager {
  private networkQuality: NetworkQuality = NetworkQuality.EXCELLENT;
  private historicalTimeoutRates = new Map<RequestPriority, number>();

  // 根据网络质量动态调整超时
  calculateTimeout(
    baseTimeout: number,
    priority: RequestPriority,
    context: {
      networkQuality?: NetworkQuality;
      requestSize?: number;
      serverLoad?: number;
    }
  ): number {
    let adjustedTimeout = baseTimeout;

    // 网络质量调整
    if (context.networkQuality) {
      const multipliers = {
        [NetworkQuality.EXCELLENT]: 0.8,
        [NetworkQuality.GOOD]: 1.0,
        [NetworkQuality.FAIR]: 1.5,
        [NetworkQuality.POOR]: 2.5
      };
      adjustedTimeout *= multipliers[context.networkQuality];
    }

    // 请求大小调整
    if (context.requestSize && context.requestSize > 1024 * 1024) {
      adjustedTimeout *= 1.5; // 大请求增加50%超时
    }

    // 服务器负载调整
    if (context.serverLoad && context.serverLoad > 0.8) {
      adjustedTimeout *= 1.3; // 高负载增加30%超时
    }

    return Math.min(adjustedTimeout, baseTimeout * 3); // 最多延长3倍
  }
}
```

### 5.2 取消机制增强

#### 5.2.1 智能取消策略
```typescript
export class IntelligentCancellationManager {
  private cancellationPolicies = new Map<string, CancellationPolicy>();
  private activeCancellations = new Set<string>();

  // 取消策略定义
  interface CancellationPolicy {
    trigger: 'timeout' | 'priority_preemption' | 'user_action' | 'system_overload';
    gracefulPeriod: number;  // 优雅取消时间
    forceAfter: number;      // 强制取消时间
    notifyUser: boolean;     // 是否通知用户
  }

  // 实施智能取消
  async cancelRequest(requestId: string, reason: string): Promise<boolean> {
    const requestInfo = this.getRequestInfo(requestId);
    if (!requestInfo) return false;

    const policy = this.cancellationPolicies.get(reason);
    
    // 优雅取消
    if (policy) {
      await this.gracefulCancellation(requestId, policy);
    } else {
      // 立即取消
      this.forceCancellation(requestId);
    }

    this.activeCancellations.add(requestId);
    return true;
  }

  // 优雅取消实现
  private async gracefulCancellation(
    requestId: string,
    policy: CancellationPolicy
  ): Promise<void> {
    const requestInfo = this.getRequestInfo(requestId);
    if (!requestInfo) return;

    // 发送取消信号
    requestInfo.abortController?.abort();

    // 等待优雅期结束
    await new Promise(resolve => 
      setTimeout(resolve, policy.gracefulPeriod)
    );

    // 检查是否仍在运行，强制取消
    if (this.isRequestStillActive(requestId)) {
      this.forceCancellation(requestId);
    }
  }
}
```

## 6. 请求重试和降级策略优化

### 6.1 智能重试策略

#### 6.1.1 感知型重试管理器
```typescript
export class IntelligentRetryManager extends NetworkRetryManager {
  private retryPatterns = new Map<string, RetryPattern>();
  private successHistory = new Map<string, number>();

  // 智能重试决策
  async shouldRetry(
    requestId: string,
    attempt: number,
    error: Error,
    context: RequestContext
  ): Promise<RetryDecision> {
    const pattern = this.retryPatterns.get(requestId);

    // 基于错误类型决策
    const errorType = this.classifyError(error);
    const baseDecision = this.getBaseRetryDecision(errorType, attempt);

    // 考虑请求优先级
    const priorityAdjustment = this.getPriorityAdjustment(
      context.priority,
      errorType,
      attempt
    );

    // 考虑网络质量
    const networkAdjustment = this.getNetworkAdjustment(
      this.getNetworkQuality(),
      errorType
    );

    // 综合决策
    return {
      shouldRetry: baseDecision.shouldRetry && priorityAdjustment.shouldRetry,
      delay: this.calculateOptimalDelay(baseDecision.delay, networkAdjustment),
      strategy: this.selectRetryStrategy(errorType, context.priority),
      maxAttempts: this.calculateMaxAttempts(context.priority, errorType)
    };
  }

  // 优先级敏感的重试策略
  private getPriorityAdjustment(
    priority: RequestPriority,
    errorType: string,
    attempt: number
  ): { shouldRetry: boolean; delay: number } {
    switch (priority) {
      case RequestPriority.CRITICAL:
        // 关键请求快速重试，少次数
        return {
          shouldRetry: attempt < 2,
          delay: 100 // 100ms快速重试
        };

      case RequestPriority.NORMAL:
        // 正常请求中等重试
        return {
          shouldRetry: attempt < 3,
          delay: 500 + attempt * 200
        };

      case RequestPriority.LOW:
        // 低优先级长时间重试
        return {
          shouldRetry: attempt < 5,
          delay: 2000 + attempt * 1000
        };

      default:
        return { shouldRetry: false, delay: 0 };
    }
  }
}
```

### 6.2 分层降级策略

#### 6.2.1 多级降级系统
```typescript
export class HierarchicalDegradationManager {
  private degradationLevels = [
    'full_functionality',      // 0级：全功能
    'cached_data',            // 1级：缓存数据
    'simplified_response',    // 2级：简化响应
    'offline_fallback',       // 3级：离线降级
    'minimal_response'        // 4级：最小响应
  ];

  // 智能降级决策
  async determineDegradationLevel(
    requestContext: RequestContext,
    errorContext: ErrorContext
  ): Promise<DegradationLevel> {
    const factors = {
      priority: this.getPriorityWeight(requestContext.priority),
      errorSeverity: this.getErrorSeverity(errorContext.error),
      networkQuality: this.getNetworkQualityWeight(),
      userExperience: this.getUImpactWeight(requestContext),
      systemLoad: this.getSystemLoadWeight()
    };

    // 计算综合降级分数
    const degradationScore = this.calculateDegradationScore(factors);

    // 根据分数选择降级级别
    return this.selectDegradationLevel(degradationScore);
  }

  // 降级策略执行
  async executeDegradation(
    level: DegradationLevel,
    originalRequest: () => Promise<any>
  ): Promise<DegradedResponse> {
    switch (level) {
      case 'cached_data':
        return this.executeCacheDegradation(originalRequest);
      
      case 'simplified_response':
        return this.executeSimplifiedResponse(originalRequest);
      
      case 'offline_fallback':
        return this.executeOfflineFallback(originalRequest);
      
      case 'minimal_response':
        return this.executeMinimalResponse(originalRequest);
      
      default:
        return this.executeFullFunctionality(originalRequest);
    }
  }
}
```

## 7. 请求监控和性能指标

### 7.1 综合监控体系

#### 7.1.1 请求监控指标
```typescript
export interface RequestMonitoringMetrics {
  // 基础性能指标
  performance: {
    responseTime: number;              // 响应时间
    throughput: number;               // 吞吐量 (req/min)
    concurrencyLevel: number;         // 并发级别
    queueDepth: number;               // 队列深度
    successRate: number;              // 成功率
    errorRate: number;                // 错误率
  };

  // 优先级指标
  priority: {
    criticalRequests: RequestMetrics;   // 关键请求指标
    normalRequests: RequestMetrics;     // 正常请求指标
    lowRequests: RequestMetrics;        // 低优先级请求指标
    priorityDistribution: PriorityDistribution;
  };

  // 网络质量指标
  network: {
    quality: NetworkQuality;
    averageLatency: number;
    packetLoss: number;
    bandwidthUtilization: number;
  };

  // 用户体验指标
  userExperience: {
    perceivedPerformance: number;      // 感知性能
    completionRate: number;           // 完成率
    abandonmentRate: number;          // 放弃率
    satisfactionScore: number;        // 满意度分数
  };
}

interface RequestMetrics {
  total: number;
  successful: number;
  failed: number;
  timeout: number;
  cancelled: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}
```

#### 7.1.2 实时监控系统
```typescript
export class RequestMonitoringSystem {
  private metrics: RequestMonitoringMetrics;
  private alerts: AlertManager;
  private reporters: MetricReporter[];

  // 实时指标收集
  collectMetrics(): RequestMonitoringMetrics {
    return {
      performance: this.collectPerformanceMetrics(),
      priority: this.collectPriorityMetrics(),
      network: this.collectNetworkMetrics(),
      userExperience: this.collectUXMetrics()
    };
  }

  // 性能指标收集
  private collectPerformanceMetrics() {
    const queueStats = requestQueue.getStats();
    
    return {
      responseTime: this.calculateAverageResponseTime(),
      throughput: this.calculateThroughput(),
      concurrencyLevel: queueStats.processingItems,
      queueDepth: queueStats.pendingItems,
      successRate: queueStats.successRate,
      errorRate: queueStats.errorRate
    };
  }

  // 智能告警
  checkAlerts(metrics: RequestMonitoringMetrics): Alert[] {
    const alerts: Alert[] = [];

    // 成功率告警
    if (metrics.performance.successRate < 95) {
      alerts.push({
        severity: 'high',
        type: 'success_rate_low',
        message: `请求成功率过低: ${metrics.performance.successRate}%`,
        metrics: { successRate: metrics.performance.successRate }
      });
    }

    // 关键请求延迟告警
    if (metrics.priority.criticalRequests.p95ResponseTime > 5000) {
      alerts.push({
        severity: 'critical',
        type: 'critical_request_slow',
        message: `关键请求延迟过高: ${metrics.priority.criticalRequests.p95ResponseTime}ms`,
        metrics: { p95ResponseTime: metrics.priority.criticalRequests.p95ResponseTime }
      });
    }

    // 队列积压告警
    if (metrics.performance.queueDepth > 100) {
      alerts.push({
        severity: 'medium',
        type: 'queue_backlog',
        message: `请求队列积压: ${metrics.performance.queueDepth} 个待处理请求`,
        metrics: { queueDepth: metrics.performance.queueDepth }
      });
    }

    return alerts;
  }
}
```

### 7.2 性能优化建议

#### 7.2.1 自动优化系统
```typescript
export class AutomaticOptimizationEngine {
  // 基于指标的自动调优
  async optimize(metrics: RequestMonitoringMetrics): Promise<OptimizationAction[]> {
    const actions: OptimizationAction[] = [];

    // 并发控制优化
    if (this.shouldAdjustConcurrency(metrics)) {
      actions.push(...this.generateConcurrencyAdjustments(metrics));
    }

    // 超时设置优化
    if (this.shouldAdjustTimeouts(metrics)) {
      actions.push(...this.generateTimeoutAdjustments(metrics));
    }

    // 重试策略优化
    if (this.shouldAdjustRetryStrategy(metrics)) {
      actions.push(...this.generateRetryStrategyAdjustments(metrics));
    }

    return actions;
  }

  // 并发控制优化建议
  private generateConcurrencyAdjustments(metrics: RequestMonitoringMetrics): OptimizationAction[] {
    const actions: OptimizationAction[] = [];

    // 如果关键请求积压，增加并发
    if (metrics.priority.criticalRequests.averageResponseTime > 3000) {
      actions.push({
        type: 'increase_concurrency',
        priority: RequestPriority.CRITICAL,
        newValue: Math.min(
          this.currentConcurrency[RequestPriority.CRITICAL] + 2,
          15
        ),
        reason: '关键请求响应时间过长，增加并发'
      });
    }

    // 如果低优先级请求过多，减少并发
    if (metrics.priority.lowRequests.total > metrics.priority.normalRequests.total * 2) {
      actions.push({
        type: 'decrease_concurrency',
        priority: RequestPriority.LOW,
        newValue: Math.max(
          this.currentConcurrency[RequestPriority.LOW] - 1,
          1
        ),
        reason: '低优先级请求过多，减少并发以释放资源'
      });
    }

    return actions;
  }
}
```

## 8. 统一请求管理器

### 8.1 请求管理器核心

#### 8.1.1 RequestManager 主控制器
```typescript
export class RequestManager {
  private static instance: RequestManager;
  private queueManager: NetworkAwareRequestQueue;
  private retryManager: IntelligentRetryManager;
  private degradationManager: HierarchicalDegradationManager;
  private monitoringSystem: RequestMonitoringSystem;
  private priorityManager: DynamicPriorityManager;
  private concurrencyController: GlobalConcurrencyController;

  // 统一请求接口
  async execute<T>(
    operation: () => Promise<T>,
    options: RequestExecutionOptions
  ): Promise<RequestResult<T>> {
    const requestId = this.generateRequestId();
    const priority = this.determinePriority(options);
    
    try {
      // 1. 预检查
      const canExecute = await this.preExecutionCheck(requestId, priority, options);
      if (!canExecute) {
        throw new Error('请求无法执行：并发限制或系统资源不足');
      }

      // 2. 设置监控
      this.monitoringSystem.startTracking(requestId, priority);

      // 3. 执行请求
      const result = await this.executeWithFullManagement(
        requestId,
        operation,
        priority,
        options
      );

      // 4. 记录成功
      this.monitoringSystem.recordSuccess(requestId, Date.now());

      return {
        success: true,
        data: result,
        metadata: {
          requestId,
          priority,
          executionTime: Date.now()
        }
      };

    } catch (error) {
      // 记录失败
      this.monitoringSystem.recordFailure(requestId, error, Date.now());
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          requestId,
          priority,
          error: error
        }
      };
    }
  }

  // 完整的请求执行流程
  private async executeWithFullManagement<T>(
    requestId: string,
    operation: () => Promise<T>,
    priority: RequestPriority,
    options: RequestExecutionOptions
  ): Promise<T> {
    const executionContext = {
      requestId,
      priority,
      startTime: Date.now(),
      options
    };

    try {
      // 第一阶段：快速执行关键请求
      if (priority === RequestPriority.CRITICAL) {
        return await this.executeCriticalRequest(operation, executionContext);
      }

      // 第二阶段：队列管理执行
      return await this.queueManager.add(operation, {
        priority: this.convertPriority(priority),
        timeout: options.timeout,
        maxAttempts: options.maxRetries,
        metadata: executionContext
      });

    } catch (error) {
      // 错误处理和降级
      return await this.handleExecutionError(error, executionContext);
    }
  }
}
```

#### 8.1.2 React Hook 集成
```typescript
// 增强版 useApi Hook
export function useEnhancedApi<T>(
  apiFunction: () => Promise<T>,
  options: EnhancedApiOptions = {}
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const requestManager = useMemo(() => RequestManager.getInstance(), []);
  const monitoring = useMemo(() => requestManager.getMonitoringSystem(), [requestManager]);

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await requestManager.execute(apiFunction, {
        priority: options.priority || RequestPriority.NORMAL,
        timeout: options.timeout,
        enableRetry: options.enableRetry !== false,
        enableDegradation: options.enableDegradation !== false,
        maxRetries: options.maxRetries,
        metadata: options.metadata
      });

      if (result.success) {
        setState({
          data: result.data,
          loading: false,
          error: null
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: result.error
        });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : '请求失败'
      });
    }
  }, [apiFunction, options, requestManager]);

  return {
    ...state,
    execute,
    monitoring: monitoring.getCurrentMetrics(),
    cancel: () => requestManager.cancelPendingRequests()
  };
}
```

### 8.2 配置和定制

#### 8.2.1 配置系统
```typescript
export const RequestManagerConfig = {
  // 全局配置
  global: {
    maxConcurrentRequests: 20,
    defaultTimeout: 30000,
    enableMonitoring: true,
    enableAutoOptimization: true
  },

  // 优先级配置
  priorities: {
    [RequestPriority.CRITICAL]: {
      maxConcurrent: 10,
      timeout: 5000,
      maxRetries: 3,
      retryDelay: 200,
      enableDegradation: false,
      enableQueue: false
    },
    [RequestPriority.NORMAL]: {
      maxConcurrent: 5,
      timeout: 15000,
      maxRetries: 2,
      retryDelay: 1000,
      enableDegradation: true,
      enableQueue: true
    },
    [RequestPriority.LOW]: {
      maxConcurrent: 2,
      timeout: 60000,
      maxRetries: 5,
      retryDelay: 5000,
      enableDegradation: true,
      enableQueue: true,
      enableBatchProcessing: true
    }
  },

  // 监控配置
  monitoring: {
    collectMetrics: true,
    enableRealTimeTracking: true,
    alertThresholds: {
      successRate: 95,
      criticalResponseTime: 5000,
      queueDepth: 100
    },
    reportingInterval: 5000
  }
};
```

## 9. 实施计划

### 9.1 实施步骤

#### 阶段1：核心架构优化（1-2天）
1. **扩展现有优先级系统**
   - 增强 `QueuePriority` 枚举
   - 完善优先级映射配置
   - 实现动态优先级调整器

2. **优化并发控制器**
   - 扩展 `GlobalConcurrencyController`
   - 实现智能抢占机制
   - 添加实时监控

#### 阶段2：智能重试和降级（2-3天）
1. **升级重试管理器**
   - 扩展 `IntelligentRetryManager`
   - 实现感知型重试决策
   - 优化错误分类和处理

2. **完善降级策略**
   - 扩展 `HierarchicalDegradationManager`
   - 实现多级降级选择
   - 添加降级效果评估

#### 阶段3：监控和优化（1-2天）
1. **实现监控系统**
   - 完善 `RequestMonitoringSystem`
   - 添加实时告警
   - 实现自动优化引擎

2. **统一接口开发**
   - 完善 `RequestManager`
   - 优化 React Hooks
   - 添加工具和调试功能

### 9.2 风险评估

#### 9.2.1 技术风险
- **复杂度增加**：新系统可能引入额外的复杂性
  - *缓解措施*：分阶段实施，充分测试
  
- **性能影响**：监控和管理可能影响请求性能
  - *缓解措施*：使用高性能的数据结构，定期清理

#### 9.2.2 兼容性风险
- **现有代码影响**：修改可能影响现有功能
  - *缓解措施*：向后兼容，提供迁移指南

### 9.3 验证测试

#### 9.3.1 功能测试
1. **优先级测试**
   - 验证三级优先级分类正确性
   - 测试优先级抢占机制
   - 确认优先级调整逻辑

2. **并发控制测试**
   - 验证全局并发限制
   - 测试优先级分组控制
   - 确认智能调度算法

3. **重试和降级测试**
   - 验证智能重试决策
   - 测试多级降级选择
   - 确认错误恢复机制

#### 9.3.2 性能测试
1. **负载测试**
   - 高并发场景测试
   - 内存使用监控
   - 响应时间验证

2. **压力测试**
   - 极限条件测试
   - 系统稳定性验证
   - 恢复能力测试

## 10. 总结

### 10.1 实施成果

通过实施请求优先级和并发控制系统，我们将获得：

1. **提升用户体验**
   - 关键请求获得优先处理
   - 减少用户等待时间
   - 提高系统响应性

2. **增强系统稳定性**
   - 智能资源分配
   - 防止系统过载
   - 优雅处理异常情况

3. **优化运维效率**
   - 实时监控和告警
   - 自动性能优化
   - 详细的问题诊断

### 10.2 核心价值

- **智能调度**：基于优先级和上下文的智能请求调度
- **弹性控制**：动态调整并发和资源分配
- **优雅降级**：多层次的降级策略确保服务连续性
- **全面监控**：实时监控和自动优化能力

### 10.3 后续扩展

1. **机器学习集成**：基于历史数据的预测性优化
2. **分布式支持**：跨服务的请求优先级协调
3. **A/B测试支持**：不同策略的效果对比
4. **成本优化**：基于成本效益的资源分配

通过这套完整的请求优先级和并发控制系统，luckymart-tj项目将能够更好地应对高并发场景，提供更稳定、更高效的服务体验。
