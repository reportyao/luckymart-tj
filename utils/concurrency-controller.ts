// concurrency-controller.ts - 全局并发控制器
import { RequestPriority, priorityManager } from './priority-manager';
import { QueueItemStatus, QueueItem } from './request-queue';

export interface RequestInfo {
  id: string;
  priority: RequestPriority;
  startTime: number;
  expectedDuration: number;
  abortController: AbortController;
  metadata?: Record<string, any>;
}

export interface ConcurrencyMetrics {
  totalActive: number;
  activeByPriority: Record<RequestPriority, number>;
  maxConcurrent: number;
  utilizationRate: number;
  averageWaitTime: number;
  queueDepthByPriority: Record<RequestPriority, number>;
}

// 全局并发控制器
export class GlobalConcurrencyController {
  private static instance: GlobalConcurrencyController;
  private maxGlobalConcurrent = 20;
  private activeRequests = new Map<string, RequestInfo>();
  private priorityQueues = new Map<RequestPriority, RequestQueue>();
  private metrics: ConcurrencyMetrics;
  private preemptiveThreshold = 0.9; // 抢占阈值
  private waitingRequests = new Set<string>();
  
  // 并发限制配置
  private concurrencyLimits = {
    [RequestPriority.CRITICAL]: 10,
    [RequestPriority.NORMAL]: 5,
    [RequestPriority.LOW]: 2
  };

  // 活跃请求按优先级分组
  private activeByPriority = {
    [RequestPriority.CRITICAL]: new Set<string>(),
    [RequestPriority.NORMAL]: new Set<string>(),
    [RequestPriority.LOW]: new Set<string>()
  };

  // 队列信息
  private queueInfo = {
    [RequestPriority.CRITICAL]: new Set<string>(),
    [RequestPriority.NORMAL]: new Set<string>(),
    [RequestPriority.LOW]: new Set<string>()
  };

  private constructor() {
    this.metrics = this.initializeMetrics();
    this.startMetricsCollection();
  }

  public static getInstance(): GlobalConcurrencyController {
    if (!GlobalConcurrencyController.instance) {
      GlobalConcurrencyController.instance = new GlobalConcurrencyController();
    }
    return GlobalConcurrencyController.instance;
  }

  // 初始化指标
  private initializeMetrics(): ConcurrencyMetrics {
    return {
      totalActive: 0,
      activeByPriority: {
        [RequestPriority.CRITICAL]: 0,
        [RequestPriority.NORMAL]: 0,
        [RequestPriority.LOW]: 0
      },
      maxConcurrent: this.maxGlobalConcurrent,
      utilizationRate: 0,
      averageWaitTime: 0,
      queueDepthByPriority: {
        [RequestPriority.CRITICAL]: 0,
        [RequestPriority.NORMAL]: 0,
        [RequestPriority.LOW]: 0
      }
    };
  }

  // 请求准入检查
  async acquireSlot(requestInfo: RequestInfo): Promise<boolean> {
    const totalActive = this.getTotalActiveRequests();
    
    // 检查全局限制
    if (totalActive >= this.maxGlobalConcurrent) {
      // 尝试抢占低优先级请求
      if (requestInfo.priority === RequestPriority.CRITICAL) {
        return this.tryPreemptLowPriority();
      }
      return false;
    }

    // 检查优先级限制
    const priorityLimit = this.concurrencyLimits[requestInfo.priority];
    const currentPriorityActive = this.activeByPriority[requestInfo.priority].size;

    if (currentPriorityActive >= priorityLimit) {
      // 检查是否可以抢占同优先级请求
      if (this.canPreemptSamePriority(requestInfo)) {
        return this.preemptSamePriority(requestInfo);
      }
      return false;
    }

    // 记录请求
    this.recordRequest(requestInfo);
    return true;
  }

  // 尝试抢占低优先级请求
  private tryPreemptLowPriority(): boolean {
    const lowPriorityRequests = Array.from(this.activeRequests.values())
      .filter(req => req.priority === RequestPriority.LOW);

    if (lowPriorityRequests.length === 0) return false;

    // 选择最适合抢占的请求
    const requestToPreempt = this.selectRequestToPreempt(lowPriorityRequests);
    
    if (requestToPreempt) {
      this.cancelRequest(requestToPreempt.id, 'preempted_by_critical');
      return true;
    }

    return false;
  }

  // 选择最适合抢占的请求
  private selectRequestToPreempt(requests: RequestInfo[]): RequestInfo | null {
    // 按执行时间排序，选择执行时间最长的
    return requests.sort((a, b) => {
      const aElapsed = Date.now() - a.startTime;
      const bElapsed = Date.now() - b.startTime;
      return bElapsed - aElapsed;
    })[0];
  }

  // 检查是否可以抢占同优先级请求
  private canPreemptSamePriority(requestInfo: RequestInfo): boolean {
    const activeSamePriority = Array.from(this.activeByPriority[requestInfo.priority])
      .map(id => this.activeRequests.get(id))
      .filter(Boolean) as RequestInfo[];

    // 如果有请求执行时间超过预期，可以抢占
    return activeSamePriority.some(req => {
      const elapsed = Date.now() - req.startTime;
      return elapsed > req.expectedDuration * 1.5;
    });
  }

  // 抢占同优先级请求
  private preemptSamePriority(requestInfo: RequestInfo): boolean {
    const activeSamePriority = Array.from(this.activeByPriority[requestInfo.priority])
      .map(id => this.activeRequests.get(id))
      .filter(Boolean) as RequestInfo[];

    const slowRequest = activeSamePriority.find(req => {
      const elapsed = Date.now() - req.startTime;
      return elapsed > req.expectedDuration * 1.5;
    });

    if (slowRequest) {
      this.cancelRequest(slowRequest.id, 'slow_request_preemption');
      return true;
    }

    return false;
  }

  // 记录请求
  private recordRequest(requestInfo: RequestInfo) {
    this.activeRequests.set(requestInfo.id, requestInfo);
    this.activeByPriority[requestInfo.priority].add(requestInfo.id);
    this.updateMetrics();
  }

  // 释放请求槽位
  releaseSlot(requestId: string): void {
    const requestInfo = this.activeRequests.get(requestId);
    if (!requestInfo) return;

    this.activeRequests.delete(requestId);
    this.activeByPriority[requestInfo.priority].delete(requestId);
    this.waitingRequests.delete(requestId);
    
    this.updateMetrics();
    
    // 尝试执行等待队列中的下一个请求
    this.processWaitingQueue();
  }

  // 处理等待队列
  private processWaitingQueue(): void {
    // 按优先级排序处理等待队列
    const priorities = [RequestPriority.CRITICAL, RequestPriority.NORMAL, RequestPriority.LOW];
    
    for (const priority of priorities) {
      const waitingIds = Array.from(this.queueInfo[priority]);
      
      for (const requestId of waitingIds) {
        if (this.acquireSlotForWaitingRequest(requestId)) {
          this.queueInfo[priority].delete(requestId);
          this.waitingRequests.delete(requestId);
          break; // 一次只处理一个请求
        }
      }
    }
  }

  // 为等待请求获取槽位
  private acquireSlotForWaitingRequest(requestId: string): boolean {
    const requestInfo = this.activeRequests.get(requestId);
    if (!requestInfo) return false;

    const totalActive = this.getTotalActiveRequests();
    
    if (totalActive < this.maxGlobalConcurrent) {
      const priorityLimit = this.concurrencyLimits[requestInfo.priority];
      const currentPriorityActive = this.activeByPriority[requestInfo.priority].size;

      if (currentPriorityActive < priorityLimit) {
        this.recordRequest(requestInfo);
        return true;
      }
    }

    return false;
  }

  // 添加到等待队列
  addToQueue(requestInfo: RequestInfo): void {
    this.queueInfo[requestInfo.priority].add(requestInfo.id);
    this.waitingRequests.add(requestInfo.id);
    this.updateMetrics();
  }

  // 从队列中移除
  removeFromQueue(requestId: string): boolean {
    for (const priority of Object.keys(this.queueInfo) as RequestPriority[]) {
      if (this.queueInfo[priority].delete(requestId)) {
        this.waitingRequests.delete(requestId);
        this.updateMetrics();
        return true;
      }
    }
    return false;
  }

  // 取消请求
  cancelRequest(requestId: string, reason: string): void {
    const requestInfo = this.activeRequests.get(requestId);
    if (requestInfo) {
      requestInfo.abortController.abort();
      this.releaseSlot(requestId);
    } else {
      this.removeFromQueue(requestId);
    }

    // 记录取消事件
    console.log(`Request ${requestId} cancelled: ${reason}`);
  }

  // 获取总活跃请求数
  private getTotalActiveRequests(): number {
    return this.activeRequests.size;
  }

  // 更新指标
  private updateMetrics(): void {
    this.metrics = {
      totalActive: this.activeRequests.size,
      activeByPriority: {
        [RequestPriority.CRITICAL]: this.activeByPriority[RequestPriority.CRITICAL].size,
        [RequestPriority.NORMAL]: this.activeByPriority[RequestPriority.NORMAL].size,
        [RequestPriority.LOW]: this.activeByPriority[RequestPriority.LOW].size
      },
      maxConcurrent: this.maxGlobalConcurrent,
      utilizationRate: (this.activeRequests.size / this.maxGlobalConcurrent) * 100,
      averageWaitTime: this.calculateAverageWaitTime(),
      queueDepthByPriority: {
        [RequestPriority.CRITICAL]: this.queueInfo[RequestPriority.CRITICAL].size,
        [RequestPriority.NORMAL]: this.queueInfo[RequestPriority.NORMAL].size,
        [RequestPriority.LOW]: this.queueInfo[RequestPriority.LOW].size
      }
    };
  }

  // 计算平均等待时间
  private calculateAverageWaitTime(): number {
    const queuedRequests = Array.from(this.waitingRequests)
      .map(id => this.activeRequests.get(id))
      .filter(Boolean) as RequestInfo[];

    if (queuedRequests.length === 0) return 0;

    const now = Date.now();
    const totalWaitTime = queuedRequests.reduce((sum, req) => {
      return sum + (now - req.startTime);
    }, 0);

    return totalWaitTime / queuedRequests.length;
  }

  // 获取当前指标
  getMetrics(): ConcurrencyMetrics {
    return { ...this.metrics };
  }

  // 获取等待队列信息
  getQueueInfo() {
    return {
      [RequestPriority.CRITICAL]: Array.from(this.queueInfo[RequestPriority.CRITICAL]),
      [RequestPriority.NORMAL]: Array.from(this.queueInfo[RequestPriority.NORMAL]),
      [RequestPriority.LOW]: Array.from(this.queueInfo[RequestPriority.LOW])
    };
  }

  // 动态调整并发限制
  adjustConcurrencyLimits(adjustments: Partial<typeof this.concurrencyLimits>): void {
    Object.assign(this.concurrencyLimits, adjustments);
    console.log('Concurrency limits updated:', this.concurrencyLimits);
  }

  // 调整全局并发限制
  setGlobalConcurrentLimit(limit: number): void {
    this.maxGlobalConcurrent = Math.max(1, limit);
    this.updateMetrics();
    console.log(`Global concurrent limit set to: ${limit}`);
  }

  // 设置抢占阈值
  setPreemptiveThreshold(threshold: number): void {
    this.preemptiveThreshold = Math.max(0, Math.min(1, threshold));
  }

  // 启动指标收集
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics();
      
      // 记录高利用率告警
      if (this.metrics.utilizationRate > 90) {
        console.warn(`High concurrency utilization: ${this.metrics.utilizationRate}%`);
      }
    }, 1000);
  }

  // 获取系统状态
  getSystemStatus() {
    return {
      health: this.metrics.utilizationRate < 80 ? 'healthy' : 'warning',
      utilization: this.metrics.utilizationRate,
      activeRequests: this.metrics.totalActive,
      queueDepth: this.getTotalQueueDepth(),
      isOverloaded: this.metrics.totalActive >= this.maxGlobalConcurrent
    };
  }

  // 获取总队列深度
  private getTotalQueueDepth(): number {
    return Object.values(this.queueInfo).reduce((sum, queue) => sum + queue.size, 0);
  }

  // 清理超时请求
  cleanupStaleRequests(): void {
    const now = Date.now();
    const staleThreshold = 300000; // 5分钟

    for (const [id, request] of this.activeRequests.entries()) {
      if (now - request.startTime > staleThreshold) {
        console.warn(`Cleaning up stale request: ${id}`);
        this.cancelRequest(id, 'stale_request_cleanup');
      }
    }
  }

  // 重置控制器
  reset(): void {
    // 取消所有活跃请求
    for (const [id, request] of this.activeRequests.entries()) {
      this.cancelRequest(id, 'controller_reset');
    }

    // 清空等待队列
    for (const priority of Object.keys(this.queueInfo) as RequestPriority[]) {
      this.queueInfo[priority].clear();
    }
    this.waitingRequests.clear();

    // 重置指标
    this.metrics = this.initializeMetrics();
    
    console.log('Concurrency controller reset');
  }

  // 销毁控制器
  destroy(): void {
    this.reset();
    // 清理其他资源
  }
}

// 基于优先级的并发控制器
export class PriorityBasedConcurrencyController {
  private controller: GlobalConcurrencyController;

  constructor() {
    this.controller = GlobalConcurrencyController.getInstance();
  }

  // 按优先级检查并发限制
  canExecute(priority: RequestPriority): boolean {
    const metrics = this.controller.getMetrics();
    const currentActive = metrics.activeByPriority[priority];
    const limit = this.controller['concurrencyLimits'][priority];
    
    return currentActive < limit;
  }

  // 动态调整并发限制
  adjustLimits(adjustments: Partial<Record<RequestPriority, number>>): void {
    this.controller.adjustConcurrencyLimits(adjustments);
  }

  // 获取优先级指标
  getPriorityMetrics(priority: RequestPriority) {
    const metrics = this.controller.getMetrics();
    return {
      active: metrics.activeByPriority[priority],
      queued: metrics.queueDepthByPriority[priority],
      limit: this.controller['concurrencyLimits'][priority],
      utilization: (metrics.activeByPriority[priority] / this.controller['concurrencyLimits'][priority]) * 100
    };
  }
}

// 智能调度器
export class IntelligentScheduler {
  private controller: GlobalConcurrencyController;
  private schedulingStrategy: 'fifo' | 'priority' | 'weighted_fair' | 'predictive' = 'weighted_fair';

  constructor() {
    this.controller = GlobalConcurrencyController.getInstance();
  }

  // 选择下一个执行的请求
  selectNextRequest(): RequestInfo | null {
    const queueInfo = this.controller.getQueueInfo();

    switch (this.schedulingStrategy) {
      case 'priority':
        return this.scheduleByPriority(queueInfo);
      
      case 'weighted_fair':
        return this.scheduleByWeightedFair(queueInfo);
      
      case 'predictive':
        return this.scheduleByPrediction(queueInfo);
      
      default:
        return this.scheduleFIFO(queueInfo);
    }
  }

  // 优先级调度
  private scheduleByPriority(queueInfo: ReturnType<GlobalConcurrencyController['getQueueInfo']>): RequestInfo | null {
    const priorities = [RequestPriority.CRITICAL, RequestPriority.NORMAL, RequestPriority.LOW];
    
    for (const priority of priorities) {
      const requestIds = queueInfo[priority];
      if (requestIds.length > 0) {
        const requestId = requestIds[0]; // 先进先出
        // 这里应该从实际存储中获取请求信息
        return null; // 简化实现
      }
    }
    
    return null;
  }

  // 加权公平调度
  private scheduleByWeightedFair(queueInfo: ReturnType<GlobalConcurrencyController['getQueueInfo']>): RequestInfo | null {
    const weights = {
      [RequestPriority.CRITICAL]: 0.5,
      [RequestPriority.NORMAL]: 0.35,
      [RequestPriority.LOW]: 0.15
    };

    // 计算每个优先级的权重分数
    const scores = Object.entries(queueInfo).map(([priority, requestIds]) => {
      const p = parseInt(priority) as RequestPriority;
      return {
        priority: p,
        score: requestIds.length * weights[p],
        requestCount: requestIds.length
      };
    });

    // 选择分数最高的优先级
    const selected = scores
      .filter(s => s.requestCount > 0)
      .sort((a, b) => b.score - a.score)[0];

    if (selected) {
      const requestId = queueInfo[selected.priority][0];
      // 返回请求信息
      return null; // 简化实现
    }

    return null;
  }

  // 预测性调度
  private scheduleByPrediction(queueInfo: ReturnType<GlobalConcurrencyController['getQueueInfo']>): RequestInfo | null {
    // 基于历史数据和用户行为预测最优调度
    const predictions = this.generatePredictions(queueInfo);
    
    // 选择预期影响最大的请求
    return predictions.sort((a, b) => b.expectedImpact - a.expectedImpact)[0]?.requestInfo || null;
  }

  // 生成预测
  private generatePredictions(queueInfo: ReturnType<GlobalConcurrencyController['getQueueInfo']>) {
    // 实现预测算法
    // 这里可以根据用户行为、网络条件、系统负载等生成预测
    return [];
  }

  // FIFO调度
  private scheduleFIFO(queueInfo: ReturnType<GlobalConcurrencyController['getQueueInfo']>): RequestInfo | null {
    // 按创建时间排序
    const allRequests = Object.entries(queueInfo)
      .flatMap(([priority, requestIds]) => 
        requestIds.map(id => ({ id, priority: parseInt(priority) as RequestPriority }))
      )
      .sort((a, b) => a.id.localeCompare(b.id));

    return allRequests.length > 0 ? null : null; // 简化实现
  }

  // 设置调度策略
  setSchedulingStrategy(strategy: typeof this.schedulingStrategy): void {
    this.schedulingStrategy = strategy;
    console.log(`Scheduling strategy changed to: ${strategy}`);
  }
}

// 单例导出
export const concurrencyController = GlobalConcurrencyController.getInstance();
export const priorityConcurrencyController = new PriorityBasedConcurrencyController();
export const intelligentScheduler = new IntelligentScheduler();

export default GlobalConcurrencyController;
