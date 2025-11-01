import { RequestPriority, priorityManager, PriorityConfigManager, analyzer } from './priority-manager';
import { concurrencyController, intelligentScheduler } from './concurrency-controller';
import { monitoringSystem } from './request-monitor';
import { NetworkAwareRequestQueue, QueueItemStatus } from './request-queue';
import { NetworkRetryManager } from './network-retry';
import { RequestDegradationManager } from './request-degradation';
import { useState, useCallback, useMemo, useEffect } from 'react';
// request-manager.ts - 统一请求管理器

// 请求执行选项
export interface RequestExecutionOptions {
  priority?: RequestPriority;
  timeout?: number;
  enableRetry?: boolean;
  enableDegradation?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  metadata?: Record<string, any>;
  businessContext?: {
    operation: string;
    userId?: string;
    urgency?: 'low' | 'medium' | 'high';
    businessValue?: 'low' | 'medium' | 'high';
  };
  monitoring?: {
    trackPerformance?: boolean;
    trackBusinessMetrics?: boolean;
    metricName?: string;
  };
}

// 请求结果
export interface RequestResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    requestId: string;
    priority: RequestPriority;
    executionTime: number;
    retryCount?: number;
    degradationLevel?: string;
    networkQuality?: string;
    waitTime?: number;
  };
}

// 请求上下文
interface RequestContext {
  requestId: string;
  priority: RequestPriority;
  startTime: number;
  options: RequestExecutionOptions;
  metadata: Record<string, any>;
  abortController: AbortController;
}

// 统一请求管理器
export class RequestManager {
  private static instance: RequestManager;
  private queueManager: NetworkAwareRequestQueue;
  private retryManager: NetworkRetryManager;
  private degradationManager: RequestDegradationManager;
  private requestIdGenerator: number = 0;

  private constructor() {
    this.queueManager = NetworkAwareRequestQueue.getInstance();
    this.retryManager = NetworkRetryManager.getInstance();
    this.degradationManager = new RequestDegradationManager();
}

  public static getInstance(): RequestManager {
    if (!RequestManager.instance) {
      RequestManager.instance = new RequestManager();
    }
    return RequestManager.instance;
  }

  // 统一请求接口
  async execute<T>(
    operation: () => Promise<T>,
    options: RequestExecutionOptions = {}
  ): Promise<RequestResult<T>> {
    const requestId = this.generateRequestId();
    const originalPriority = options.priority || RequestPriority.NORMAL;
    
    // 1. 分析和确定优先级
    const contextPriority = await this.determineRequestPriority(operation, options);
    const finalPriority = priorityManager.adjustPriority(contextPriority, {
      systemLoad: this.getCurrentSystemLoad(),
      networkQuality: this.retryManager.getNetworkQuality()
    });

    // 2. 创建请求上下文
    const requestContext = this.createRequestContext(;
      requestId,
      finalPriority,
      options
    );

    // 3. 预检查
    const canExecute = await this.preExecutionCheck(requestContext);
    if (!canExecute) {
      return this.handleExecutionBlocked(requestContext, '并发限制或系统资源不足');
    }

    // 4. 设置监控
    this.startRequestTracking(requestContext);

    // 5. 执行请求
    try {
      const result = await this.executeWithFullManagement(;
        requestContext,
        operation
      );

      // 6. 记录成功
      this.recordRequestSuccess(requestContext, result);

      return {
        success: true,
        data: result,
        metadata: {
          requestId,
          priority: finalPriority,
          executionTime: Date.now() - requestContext.startTime,
          networkQuality: this.retryManager.getNetworkQuality()
        }
      };

    } catch (error) {
      // 记录失败
      const errorResult = await this.handleExecutionError(;
        requestContext,
        error as Error
      );

      return errorResult;
    }
  }

  // 确定请求优先级
  private async determineRequestPriority(
    operation: () => Promise<any>,
    options: RequestExecutionOptions
  ): Promise<RequestPriority> {
    // 如果显式指定优先级，优先使用
    if (options.priority) {
      return options.priority;
    }

    // 使用业务上下文自动确定
    if (options.businessContext) {
      return priorityManager.autoDeterminePriority(options.businessContext);
    }

    // 基于请求特征分析
    try {
      const requestInfo = await this.analyzeOperation(operation);
      const analysis = analyzer.analyzeRequest(requestInfo);
      return analysis.suggestedPriority;
  }
    } catch {
      // 分析失败时使用默认优先级
      return RequestPriority.NORMAL;
    }
  }

  // 分析操作特征
  private async analyzeOperation(operation: () => Promise<any>): Promise<{
    url: string;
    method: string;
    size?: number;
    userAgent?: string;
    referrer?: string;
  }> {
    // 简化实现：基于函数名和上下文推断
    const functionName = operation.name || 'anonymous';
    
    return {
      url: `/api/${functionName}`,
      method: 'POST',
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };
  }

  // 创建请求上下文
  private createRequestContext(
    requestId: string,
    priority: RequestPriority,
    options: RequestExecutionOptions
  ): RequestContext {
    const config = PriorityConfigManager.getConfig(priority);
    
    return {
      requestId,
      priority,
      startTime: Date.now(),
      options: {
        ...options,
        timeout: options.timeout || config.timeout,
        enableRetry: options.enableRetry !== false,
        enableDegradation: options.enableDegradation !== false,
        maxRetries: options.maxRetries || config.maxRetries,
        retryDelay: options.retryDelay || config.retryDelay
      },
      metadata: {
        ...options.metadata,
        businessContext: options.businessContext,
        monitoring: options.monitoring
      },
      abortController: new AbortController()
    };
  }

  // 预执行检查
  private async preExecutionCheck(context: RequestContext): Promise<boolean> {
    // 检查并发限制
    const canExecute = await concurrencyController.acquireSlot({
      id: context.requestId,
      priority: context.priority,
      startTime: context.startTime,
      expectedDuration: context.options.timeout || 30000,
      abortController: context.abortController,
      metadata: context.metadata
    });

    if (!canExecute) {
      // 添加到等待队列
      concurrencyController.addToQueue({
        id: context.requestId,
        priority: context.priority,
        startTime: context.startTime,
        expectedDuration: context.options.timeout || 30000,
        abortController: context.abortController,
        metadata: context.metadata
      });
    }

    return canExecute;
  }

  // 完整管理执行
  private async executeWithFullManagement<T>(
    context: RequestContext,
    operation: () => Promise<T>
  ): Promise<T> {
    const config = PriorityConfigManager.getConfig(context.priority);

    // 第一阶段：快速执行关键请求
    if (context.priority === RequestPriority.CRITICAL && !config.enableQueue) {
      return await this.executeCriticalRequest(context, operation);
    }

    // 第二阶段：队列管理执行
    if (config.enableQueue) {
      return await this.executeWithQueue(context, operation);
    }

    // 第三阶段：直接执行（备用）
    return await this.executeDirectly(context, operation);
  }

  // 关键请求执行
  private async executeCriticalRequest<T>(
    context: RequestContext,
    operation: () => Promise<T>
  ): Promise<T> {
    const timeoutId = setTimeout(() => {
      context.abortController.abort();
    }, context.options.timeout);

    try {
      const result = await operation();
      clearTimeout(timeoutId);
      return result;
  }
    } catch (error) {
      clearTimeout(timeoutId);
      
      // 关键请求失败时的特殊处理
      if (context.options.enableRetry) {
        return await this.handleCriticalRequestRetry(context, operation, error as Error);
      }
      
      throw error;
    }
  }

  // 关键请求重试
  private async handleCriticalRequestRetry<T>(
    context: RequestContext,
    operation: () => Promise<T>,
    error: Error
  ): Promise<T> {
    let lastError = error;
    
    for (let attempt = 1; attempt <= (context.options.maxRetries || 1); attempt++) {
      try {
        // 短暂延迟后重试
        await new Promise(resolve => setTimeout(resolve, 200 * attempt));
        
        const result = await this.executeCriticalRequest(context, operation);
        
        // 记录重试成功
        monitoringSystem.recordRequestCompletion({
          requestId: context.requestId,
          priority: context.priority,
          duration: Date.now() - context.startTime,
          success: true,
          waitTime: 0
        });
        
        return result;
  }
      } catch (retryError) {
        lastError = retryError as Error;
        console.warn(`Critical request retry attempt ${attempt} failed:`, retryError);
      }
    }
    
    throw lastError;
  }

  // 队列执行
  private async executeWithQueue<T>(
    context: RequestContext,
    operation: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const queueItemId = this.queueManager.add(operation, {
        priority: this.convertPriority(context.priority),
        timeout: context.options.timeout,
        maxAttempts: context.options.maxRetries,
        retryDelay: context.options.retryDelay,
        metadata: {
          requestId: context.requestId,
          originalPriority: context.priority,
          ...context.metadata
        },
        onSuccess: (result: T) => {
          resolve(result);
        },
        onError: (error: Error) => {
          reject(error);
        }
      });

      // 设置超时
      setTimeout(() => {
        if (!this.queueManager.getItems({ metadata: { requestId: context.requestId } }).length) {
          reject(new Error('队列执行超时'));
        }
      }, context.options.timeout);
    });
  }

  // 直接执行
  private async executeDirectly<T>(
    context: RequestContext,
    operation: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        context.abortController.abort();
        reject(new Error(`请求超时: ${context.options.timeout}ms`));
      }, context.options.timeout);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  // 处理执行错误
  private async handleExecutionError<T>(
    context: RequestContext,
    error: Error
  ): Promise<RequestResult<T>> {
    // 记录失败
    this.recordRequestFailure(context, error);

    // 尝试降级处理
    if (context.options.enableDegradation) {
      try {
        const degradedResult = await this.handleDegradation(context, error);
        return {
  }
          success: true,
          data: degradedResult,
          metadata: {
            requestId: context.requestId,
            priority: context.priority,
            executionTime: Date.now() - context.startTime,
            degradationLevel: 'fallback_data'
          }
        };
      } catch (degradationError) {
        console.warn('Degradation failed:', degradationError);
      }
    }

    // 返回错误结果
    return {
      success: false,
      error: error.message || '请求失败',
      metadata: {
        requestId: context.requestId,
        priority: context.priority,
        executionTime: Date.now() - context.startTime
      }
    };
  }

  // 处理降级
  private async handleDegradation<T>(
    context: RequestContext,
    error: Error
  ): Promise<T> {
    // 基于错误类型和优先级选择降级策略
    const degradationConfig = this.selectDegradationConfig(context, error);
    
    // 模拟降级数据返回
    const fallbackData = this.generateFallbackData<T>(context, error);
    
    if (fallbackData) {
      return fallbackData;
    }
    
    throw new Error('降级处理失败');
  }

  // 选择降级配置
  private selectDegradationConfig(
    context: RequestContext,
    error: Error
  ) {
    const baseConfig = PriorityConfigManager.getConfig(context.priority);
    
    return {
      ...baseConfig,
      enableDegradation: true,
      fallbackEnabled: true
    };
  }

  // 生成降级数据
  private generateFallbackData<T>(
    context: RequestContext,
    error: Error
  ): T | null {
    // 基于业务上下文生成适当的降级数据
    if (context.metadata.businessContext?.operation) {
      const operation = context.metadata.businessContext.operation;
      
      if (operation.includes('products')) {
        return { products: [], total: 0, error: '数据暂时不可用' } as any;
      }
      
      if (operation.includes('user')) {
        return { user: null, error: '用户信息暂时不可用' } as any;
      }
      
      if (operation.includes('orders')) {
        return { orders: [], total: 0, error: '订单信息暂时不可用' } as any;
      }
    }
    
    // 默认降级数据
    return { message: '服务暂时不可用，请稍后重试' } as any;
  }

  // 处理执行被阻塞
  private handleExecutionBlocked<T>(
    context: RequestContext,
    reason: string
  ): RequestResult<T> {
    return {
      success: false,
      error: reason,
      metadata: {
        requestId: context.requestId,
        priority: context.priority,
        executionTime: Date.now() - context.startTime
      }
    };
  }

  // 开始请求跟踪
  private startRequestTracking(context: RequestContext): void {
    if (context.options.monitoring?.trackPerformance) {
      monitoringSystem.recordRequestCompletion({
        requestId: context.requestId,
        priority: context.priority,
        duration: 0, // 刚开始，尚未完成
        success: false,
        waitTime: 0
      });
    }
  }

  // 记录请求成功
  private recordRequestSuccess(context: RequestContext, result: any): void {
    const executionTime = Date.now() - context.startTime;
    
    monitoringSystem.recordRequestCompletion({
      requestId: context.requestId,
      priority: context.priority,
      duration: executionTime,
      success: true,
      waitTime: 0 // TODO: 计算实际等待时间
    });
  }

  // 记录请求失败
  private recordRequestFailure(context: RequestContext, error: Error): void {
    const executionTime = Date.now() - context.startTime;
    
    monitoringSystem.recordRequestCompletion({
      requestId: context.requestId,
      priority: context.priority,
      duration: executionTime,
      success: false,
      error: error.message,
      waitTime: 0
    });
  }

  // 转换优先级
  private convertPriority(priority: RequestPriority) {
    // 将 RequestPriority 转换为 QueuePriority
    const priorityMap = {
      [RequestPriority.LOW]: 0,
      [RequestPriority.NORMAL]: 1,
      [RequestPriority.CRITICAL]: 2
    };
    
    return priorityMap[priority] || 1;
  }

  // 获取当前系统负载
  private getCurrentSystemLoad(): number {
    const metrics = monitoringSystem.getCurrentMetrics();
    return metrics.system.load;
  }

  // 生成请求ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestIdGenerator}`;
  }

  // 取消请求
  cancelRequest(requestId: string, reason?: string): boolean {
    concurrencyController.cancelRequest(requestId, reason || 'manual_cancellation');
    return true;
  }

  // 批量取消请求
  cancelRequestsByPriority(priority: RequestPriority, reason?: string): number {
    // 获取指定优先级的所有活跃请求
    const activeRequests = concurrencyController.getQueueInfo()[priority];
    let cancelledCount = 0;

    for (const requestId of activeRequests) {
      if (this.cancelRequest(requestId, reason || `batch_cancellation_${priority}`)) {
        cancelledCount++;
      }
    }

    return cancelledCount;
  }

  // 获取请求状态
  getRequestStatus(requestId: string): {
    status: 'active' | 'queued' | 'completed' | 'failed' | 'cancelled';
    priority: RequestPriority;
    waitTime?: number;
    executionTime?: number;
  } {
    // 检查是否在并发控制器中
    const isActive = concurrencyController.getMetrics().activeByPriority[RequestPriority.CRITICAL] > 0 ||;
                    concurrencyController.getMetrics().activeByPriority[RequestPriority.NORMAL] > 0 ||
                    concurrencyController.getMetrics().activeByPriority[RequestPriority.LOW] > 0;

    // 检查是否在队列中
    const queueInfo = concurrencyController.getQueueInfo();
    const isQueued = Object.values(queueInfo).some(queue => queue.includes(requestId));

    // TODO: 实现更详细的状态检查逻辑
    return {
      status: isActive ? 'active' : isQueued ? 'queued' : 'completed',
      priority: RequestPriority.NORMAL // 简化实现
    };
  }

  // 获取系统指标
  getSystemMetrics() {
    return {
      monitoring: monitoringSystem.getCurrentMetrics(),
      concurrency: concurrencyController.getMetrics(),
      system: concurrencyController.getSystemStatus()
    };
  }

  // 动态调整配置
  updateConfiguration(updates: {
    priority?: Partial<Record<RequestPriority, any>>;
    global?: {
      maxConcurrent?: number;
      defaultTimeout?: number;
    };
    monitoring?: {
      enabled?: boolean;
      interval?: number;
    };
  }): void {
    if (updates.priority) {
      Object.entries(updates.priority).forEach(([priority, config]) => {
        PriorityConfigManager.updateConfig(parseInt(priority) as RequestPriority, config);
      });
    }

    if (updates.global) {
      if (updates.global.maxConcurrent) {
        concurrencyController.setGlobalConcurrentLimit(updates.global.maxConcurrent);
      }
    }

    console.log('Request manager configuration updated:', updates);
  }

  // 重置管理器
  reset(): void {
    concurrencyController.reset();
    monitoringSystem.stopMonitoring();
    monitoringSystem.startMonitoring();
    
    console.log('Request manager reset');
  }

  // 销毁管理器
  destroy(): void {
    this.reset();
    // 清理其他资源
  }
}

// React Hook 增强版

export function useEnhancedApi<T>(
  apiFunction: () => Promise<T>,
  options: EnhancedApiOptions = {}
) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
    metrics?: any;
  }>({
    data: null,
    loading: false,
    error: null
  });

  const requestManager = useMemo(() => RequestManager.getInstance(), []);
  const monitoring = useMemo(() => requestManager.getSystemMetrics(), [requestManager]);

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await requestManager.execute(apiFunction, {
        priority: options.priority || RequestPriority.NORMAL,
        timeout: options.timeout,
        enableRetry: options.enableRetry !== false,
        enableDegradation: options.enableDegradation !== false,
        maxRetries: options.maxRetries,
        metadata: options.metadata,
        businessContext: options.businessContext,
        monitoring: {
          trackPerformance: options.monitoring?.trackPerformance !== false,
          trackBusinessMetrics: options.monitoring?.trackBusinessMetrics !== false,
          metricName: options.monitoring?.metricName
}
      });

      if (result.success) {
        setState({
          data: result.data,
          loading: false,
          error: null,
          metrics: result.metadata
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: result.error || '请求失败',
          metrics: result.metadata
        });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : '请求失败',
        metrics: { error: true }
      });
    }
  }, [apiFunction, options, requestManager]);

  const cancel = useCallback(() => {
    // 取消当前请求的逻辑
    requestManager.reset();
  }, [requestManager]);

  // 定期更新指标
  useEffect(() => {
    if (options.monitoring?.realTime !== false) {
      const interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          metrics: requestManager.getSystemMetrics()
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [options.monitoring, requestManager]);

  return {
    ...state,
    execute,
    cancel,
    monitoring: monitoring
  };
}

export interface EnhancedApiOptions {
  priority?: RequestPriority;
  timeout?: number;
  enableRetry?: boolean;
  enableDegradation?: boolean;
  maxRetries?: number;
  metadata?: Record<string, any>;
  businessContext?: {
    operation: string;
    userId?: string;
    urgency?: 'low' | 'medium' | 'high';
    businessValue?: 'low' | 'medium' | 'high';
  };
  monitoring?: {
    trackPerformance?: boolean;
    trackBusinessMetrics?: boolean;
    metricName?: string;
    realTime?: boolean;
  };
}

// 单例导出
export const requestManager = RequestManager.getInstance();

export default RequestManager;
