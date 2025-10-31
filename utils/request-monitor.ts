// request-monitor.ts - 请求监控系统
import { RequestPriority } from './priority-manager';
import { NetworkQuality } from './network-retry';

export interface RequestMetrics {
  total: number;
  successful: number;
  failed: number;
  timeout: number;
  cancelled: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number; // requests per minute
  errorRate: number;
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  concurrencyLevel: number;
  queueDepth: number;
  successRate: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface PriorityMetrics {
  criticalRequests: RequestMetrics;
  normalRequests: RequestMetrics;
  lowRequests: RequestMetrics;
  priorityDistribution: Record<RequestPriority, number>;
  averageWaitTimeByPriority: Record<RequestPriority, number>;
}

export interface NetworkMetrics {
  quality: NetworkQuality;
  averageLatency: number;
  packetLoss: number;
  bandwidthUtilization: number;
  connectionType: string;
  signalStrength: number;
}

export interface UXMetrics {
  perceivedPerformance: number;
  completionRate: number;
  abandonmentRate: number;
  satisfactionScore: number;
  userWaitTime: number;
}

export interface RequestMonitoringMetrics {
  timestamp: number;
  performance: PerformanceMetrics;
  priority: PriorityMetrics;
  network: NetworkMetrics;
  userExperience: UXMetrics;
  system: {
    load: number;
    memory: number;
    activeConnections: number;
  };
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  title: string;
  message: string;
  timestamp: number;
  metrics: Record<string, any>;
  acknowledged: boolean;
  resolvedAt?: number;
}

export interface OptimizationRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  title: string;
  description: string;
  estimatedImpact: string;
  implementation: string;
  metrics: Record<string, any>;
}

// 实时监控器
export class RequestMonitoringSystem {
  private static instance: RequestMonitoringSystem;
  private metrics: RequestMonitoringMetrics;
  private alerts: Alert[] = [];
  private recommendations: OptimizationRecommendation[] = [];
  private reporters: MetricReporter[] = [];
  private history: RequestMonitoringMetrics[] = [];
  private maxHistorySize = 1000;
  private isCollecting = false;

  // 指标收集器
  private collectors = new Map<string, MetricCollector>();
  
  // 告警管理器
  private alertManager: AlertManager;
  
  // 优化引擎
  private optimizationEngine: OptimizationEngine;

  private constructor() {
    this.metrics = this.initializeMetrics();
    this.alertManager = new AlertManager(this);
    this.optimizationEngine = new OptimizationEngine(this);
    this.setupCollectors();
    this.startMonitoring();
  }

  public static getInstance(): RequestMonitoringSystem {
    if (!RequestMonitoringSystem.instance) {
      RequestMonitoringSystem.instance = new RequestMonitoringSystem();
    }
    return RequestMonitoringSystem.instance;
  }

  // 初始化指标
  private initializeMetrics(): RequestMonitoringMetrics {
    return {
      timestamp: Date.now(),
      performance: {
        responseTime: 0,
        throughput: 0,
        concurrencyLevel: 0,
        queueDepth: 0,
        successRate: 100,
        errorRate: 0,
        memoryUsage: 0,
        cpuUsage: 0
      },
      priority: {
        criticalRequests: this.initializeRequestMetrics(),
        normalRequests: this.initializeRequestMetrics(),
        lowRequests: this.initializeRequestMetrics(),
        priorityDistribution: {
          [RequestPriority.CRITICAL]: 0,
          [RequestPriority.NORMAL]: 0,
          [RequestPriority.LOW]: 0
        },
        averageWaitTimeByPriority: {
          [RequestPriority.CRITICAL]: 0,
          [RequestPriority.NORMAL]: 0,
          [RequestPriority.LOW]: 0
        }
      },
      network: {
        quality: NetworkQuality.EXCELLENT,
        averageLatency: 0,
        packetLoss: 0,
        bandwidthUtilization: 0,
        connectionType: 'unknown',
        signalStrength: 0
      },
      userExperience: {
        perceivedPerformance: 100,
        completionRate: 100,
        abandonmentRate: 0,
        satisfactionScore: 5,
        userWaitTime: 0
      },
      system: {
        load: 0,
        memory: 0,
        activeConnections: 0
      }
    };
  }

  // 初始化请求指标
  private initializeRequestMetrics(): RequestMetrics {
    return {
      total: 0,
      successful: 0,
      failed: 0,
      timeout: 0,
      cancelled: 0,
      averageResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      throughput: 0,
      errorRate: 0
    };
  }

  // 设置指标收集器
  private setupCollectors() {
    // 性能收集器
    this.collectors.set('performance', new PerformanceCollector());
    
    // 网络收集器
    this.collectors.set('network', new NetworkCollector());
    
    // 系统收集器
    this.collectors.set('system', new SystemCollector());
    
    // 用户体验收集器
    this.collectors.set('ux', new UXCollector());
  }

  // 开始监控
  startMonitoring(): void {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    
    // 主要指标收集
    setInterval(() => {
      this.collectCoreMetrics();
    }, 1000);

    // 告警检查
    setInterval(() => {
      this.checkAlerts();
    }, 5000);

    // 历史数据清理
    setInterval(() => {
      this.cleanupHistory();
    }, 60000);

    // 自动优化检查
    setInterval(() => {
      this.optimizationEngine.checkForOptimizations();
    }, 30000);

    console.log('Request monitoring system started');
  }

  // 停止监控
  stopMonitoring(): void {
    this.isCollecting = false;
    console.log('Request monitoring system stopped');
  }

  // 收集核心指标
  private async collectCoreMetrics(): Promise<void> {
    try {
      // 并行收集所有指标
      const results = await Promise.allSettled(
        Array.from(this.collectors.values()).map(collector => collector.collect())
      );

      // 更新指标
      const collectedMetrics = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value);

      // 合并指标数据
      this.mergeMetrics(collectedMetrics);

      // 更新历史记录
      this.updateHistory();

      // 通知报告器
      this.notifyReporters();

    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  // 合并指标数据
  private mergeMetrics(collectedMetrics: any[]): void {
    for (const metricData of collectedMetrics) {
      if (metricData.performance) {
        Object.assign(this.metrics.performance, metricData.performance);
      }
      
      if (metricData.priority) {
        Object.assign(this.metrics.priority, metricData.priority);
      }
      
      if (metricData.network) {
        Object.assign(this.metrics.network, metricData.network);
      }
      
      if (metricData.ux) {
        Object.assign(this.metrics.userExperience, metricData.ux);
      }
      
      if (metricData.system) {
        Object.assign(this.metrics.system, metricData.system);
      }
    }

    this.metrics.timestamp = Date.now();
  }

  // 更新历史记录
  private updateHistory(): void {
    this.history.push({ ...this.metrics });
    
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  // 清理历史数据
  private cleanupHistory(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1小时

    this.history = this.history.filter(
      metric => now - metric.timestamp < maxAge
    );
  }

  // 检查告警
  private checkAlerts(): void {
    const newAlerts = this.alertManager.checkThresholds(this.metrics);
    
    for (const alert of newAlerts) {
      this.addAlert(alert);
    }
  }

  // 添加告警
  addAlert(alert: Alert): void {
    this.alerts.push(alert);
    
    // 限制告警数量
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // 发送告警通知
    this.notifyAlert(alert);
  }

  // 发送告警通知
  private notifyAlert(alert: Alert): void {
    console.warn(`ALERT [${alert.severity.toUpperCase()}]: ${alert.title} - ${alert.message}`);
    
    // 这里可以集成邮件、短信、Slack等通知方式
    if (alert.severity === 'critical') {
      // 严重告警立即处理
      this.handleCriticalAlert(alert);
    }
  }

  // 处理严重告警
  private handleCriticalAlert(alert: Alert): void {
    // 实施紧急措施
    switch (alert.type) {
      case 'system_overload':
        this.emergencyOverloadHandling();
        break;
      case 'critical_request_failure':
        this.emergencyRequestFailureHandling();
        break;
      case 'network_outage':
        this.emergencyNetworkHandling();
        break;
    }
  }

  // 紧急过载处理
  private emergencyOverloadHandling(): void {
    console.log('Implementing emergency overload handling...');
    // 这里可以实施紧急措施，如：
    // - 暂时降低非关键请求优先级
    // - 启用额外的缓存
    // - 发送通知给运维团队
  }

  // 紧急请求失败处理
  private emergencyRequestFailureHandling(): void {
    console.log('Implementing emergency request failure handling...');
    // 实施请求失败的紧急处理
  }

  // 紧急网络处理
  private emergencyNetworkHandling(): void {
    console.log('Implementing emergency network handling...');
    // 实施网络问题的紧急处理
  }

  // 确认告警
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  // 解决告警
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolvedAt = Date.now();
    }
  }

  // 通知报告器
  private notifyReporters(): void {
    for (const reporter of this.reporters) {
      try {
        reporter.report(this.metrics);
      } catch (error) {
        console.error('Error in reporter:', error);
      }
    }
  }

  // 添加报告器
  addReporter(reporter: MetricReporter): void {
    this.reporters.push(reporter);
  }

  // 获取当前指标
  getCurrentMetrics(): RequestMonitoringMetrics {
    return { ...this.metrics };
  }

  // 获取历史指标
  getHistoryMetrics(timeRange?: { start: number; end: number }): RequestMonitoringMetrics[] {
    if (!timeRange) {
      return [...this.history];
    }

    return this.history.filter(
      metric => 
        metric.timestamp >= timeRange.start && 
        metric.timestamp <= timeRange.end
    );
  }

  // 获取告警
  getAlerts(filter?: { 
    severity?: Alert['severity']; 
    acknowledged?: boolean;
    resolved?: boolean;
  }): Alert[] {
    let filteredAlerts = [...this.alerts];

    if (filter) {
      if (filter.severity) {
        filteredAlerts = filteredAlerts.filter(a => a.severity === filter.severity);
      }
      if (filter.acknowledged !== undefined) {
        filteredAlerts = filteredAlerts.filter(a => a.acknowledged === filter.acknowledged);
      }
      if (filter.resolved !== undefined) {
        filteredAlerts = filteredAlerts.filter(a => 
          filter.resolved ? a.resolvedAt !== undefined : a.resolvedAt === undefined
        );
      }
    }

    return filteredAlerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  // 获取优化建议
  getRecommendations(): OptimizationRecommendation[] {
    return [...this.recommendations];
  }

  // 记录请求完成
  recordRequestCompletion(data: {
    requestId: string;
    priority: RequestPriority;
    duration: number;
    success: boolean;
    error?: string;
    waitTime: number;
  }): void {
    const metric = this.metrics.priority[`${data.priority}Requests` as keyof PriorityMetrics] as RequestMetrics;
    
    if (metric) {
      metric.total++;
      if (data.success) {
        metric.successful++;
      } else {
        metric.failed++;
        if (data.error?.includes('timeout')) {
          metric.timeout++;
        }
      }

      // 更新响应时间
      this.updateResponseTimeMetrics(metric, data.duration);
      
      // 更新错误率
      metric.errorRate = (metric.failed / metric.total) * 100;
      
      // 更新吞吐量
      this.updateThroughput(metric);
    }

    // 更新优先级分布
    this.metrics.priority.priorityDistribution[data.priority]++;
    
    // 更新平均等待时间
    const currentWaitTime = this.metrics.priority.averageWaitTimeByPriority[data.priority];
    const totalRequests = this.metrics.priority.priorityDistribution[data.priority];
    this.metrics.priority.averageWaitTimeByPriority[data.priority] = 
      (currentWaitTime * (totalRequests - 1) + data.waitTime) / totalRequests;
  }

  // 更新响应时间指标
  private updateResponseTimeMetrics(metric: RequestMetrics, duration: number): void {
    // 简化实现：使用移动平均
    if (metric.averageResponseTime === 0) {
      metric.averageResponseTime = duration;
      metric.p50ResponseTime = duration;
      metric.p95ResponseTime = duration;
      metric.p99ResponseTime = duration;
    } else {
      const alpha = 0.1; // 移动平均系数
      metric.averageResponseTime = metric.averageResponseTime * (1 - alpha) + duration * alpha;
      metric.p50ResponseTime = metric.p50ResponseTime * (1 - alpha) + duration * alpha;
      metric.p95ResponseTime = metric.p95ResponseTime * (1 - alpha) + duration * alpha;
      metric.p99ResponseTime = metric.p99ResponseTime * (1 - alpha) + duration * alpha;
    }
  }

  // 更新吞吐量
  private updateThroughput(metric: RequestMetrics): void {
    // 计算每分钟吞吐量
    const now = Date.now();
    const minuteAgo = now - 60000;
    
    // 这里应该根据实际的时间序列数据计算
    // 简化实现
    metric.throughput = metric.total / ((now - this.metrics.timestamp) / 60000);
  }

  // 获取系统健康状态
  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 100;

    // 检查错误率
    if (this.metrics.performance.errorRate > 5) {
      issues.push('High error rate');
      score -= 20;
    }

    // 检查响应时间
    if (this.metrics.performance.responseTime > 5000) {
      issues.push('High response time');
      score -= 15;
    }

    // 检查关键请求成功率
    if (this.metrics.priority.criticalRequests.errorRate > 1) {
      issues.push('Critical request failures');
      score -= 25;
    }

    // 检查网络质量
    if (this.metrics.network.quality === NetworkQuality.POOR) {
      issues.push('Poor network quality');
      score -= 10;
    }

    // 确定状态
    let status: 'healthy' | 'warning' | 'critical';
    if (score >= 80) {
      status = 'healthy';
    } else if (score >= 50) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return { status, score, issues };
  }

  // 销毁监控器
  destroy(): void {
    this.stopMonitoring();
    this.collectors.clear();
    this.reporters.length = 0;
    this.history.length = 0;
  }
}

// 告警管理器
class AlertManager {
  private monitoringSystem: RequestMonitoringSystem;
  private thresholds = {
    successRate: 95,
    criticalResponseTime: 5000,
    errorRate: 5,
    queueDepth: 100,
    systemLoad: 0.8,
    memoryUsage: 0.9
  };

  constructor(monitoringSystem: RequestMonitoringSystem) {
    this.monitoringSystem = monitoringSystem;
  }

  checkThresholds(metrics: RequestMonitoringMetrics): Alert[] {
    const alerts: Alert[] = [];

    // 成功率检查
    if (metrics.performance.successRate < this.thresholds.successRate) {
      alerts.push(this.createAlert(
        'low_success_rate',
        'medium',
        'Success Rate Below Threshold',
        `Success rate is ${metrics.performance.successRate}%, below ${this.thresholds.successRate}%`,
        { successRate: metrics.performance.successRate }
      ));
    }

    // 关键请求响应时间检查
    if (metrics.priority.criticalRequests.p95ResponseTime > this.thresholds.criticalResponseTime) {
      alerts.push(this.createAlert(
        'critical_request_slow',
        'high',
        'Critical Request Response Time High',
        `Critical requests P95 response time is ${metrics.priority.criticalRequests.p95ResponseTime}ms`,
        { p95ResponseTime: metrics.priority.criticalRequests.p95ResponseTime }
      ));
    }

    // 错误率检查
    if (metrics.performance.errorRate > this.thresholds.errorRate) {
      alerts.push(this.createAlert(
        'high_error_rate',
        'high',
        'Error Rate Above Threshold',
        `Error rate is ${metrics.performance.errorRate}%, above ${this.thresholds.errorRate}%`,
        { errorRate: metrics.performance.errorRate }
      ));
    }

    return alerts;
  }

  private createAlert(
    type: string,
    severity: Alert['severity'],
    title: string,
    message: string,
    metrics: Record<string, any>
  ): Alert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      type,
      title,
      message,
      timestamp: Date.now(),
      metrics,
      acknowledged: false
    };
  }
}

// 优化引擎
class OptimizationEngine {
  private monitoringSystem: RequestMonitoringSystem;
  private lastOptimizationCheck = 0;
  private optimizationCooldown = 300000; // 5分钟

  constructor(monitoringSystem: RequestMonitoringSystem) {
    this.monitoringSystem = monitoringSystem;
  }

  checkForOptimizations(): void {
    const now = Date.now();
    if (now - this.lastOptimizationCheck < this.optimizationCooldown) {
      return;
    }

    this.lastOptimizationCheck = now;
    const metrics = this.monitoringSystem.getCurrentMetrics();

    // 检查并发控制优化
    this.checkConcurrencyOptimization(metrics);
    
    // 检查重试策略优化
    this.checkRetryOptimization(metrics);
    
    // 检查缓存策略优化
    this.checkCacheOptimization(metrics);
  }

  private checkConcurrencyOptimization(metrics: RequestMonitoringMetrics): void {
    const recommendations: OptimizationRecommendation[] = [];

    // 如果关键请求积压
    if (metrics.priority.averageWaitTimeByPriority[RequestPriority.CRITICAL] > 3000) {
      recommendations.push({
        id: `opt_${Date.now()}_1`,
        priority: 'high',
        category: 'concurrency',
        title: 'Increase Critical Request Concurrency',
        description: 'Critical requests are experiencing high wait times. Consider increasing concurrency limits.',
        estimatedImpact: 'Reduce critical request wait time by 40-60%',
        implementation: 'Increase max concurrent critical requests from 10 to 15',
        metrics: { waitTime: metrics.priority.averageWaitTimeByPriority[RequestPriority.CRITICAL] }
      });
    }

    // 如果低优先级请求过多
    const lowPriorityRatio = metrics.priority.priorityDistribution[RequestPriority.LOW] / 
      (Object.values(metrics.priority.priorityDistribution).reduce((a, b) => a + b, 0) || 1);
    
    if (lowPriorityRatio > 0.7) {
      recommendations.push({
        id: `opt_${Date.now()}_2`,
        priority: 'medium',
        category: 'concurrency',
        title: 'Optimize Low Priority Request Handling',
        description: 'High proportion of low priority requests detected. Consider batching or deferring.',
        estimatedImpact: 'Free up resources for higher priority requests',
        implementation: 'Implement batching for low priority requests with 10-second delay',
        metrics: { lowPriorityRatio }
      });
    }

    this.addRecommendations(recommendations);
  }

  private checkRetryOptimization(metrics: RequestMonitoringMetrics): void {
    // 检查重试效果
    const totalRetries = metrics.priority.criticalRequests.failed + 
                       metrics.priority.normalRequests.failed + 
                       metrics.priority.lowRequests.failed;

    if (totalRetries > 50) {
      const recommendations: OptimizationRecommendation[] = [{
        id: `opt_${Date.now()}_3`,
        priority: 'medium',
        category: 'retry',
        title: 'Optimize Retry Strategy',
        description: 'High number of retry attempts detected. Consider adjusting retry parameters.',
        estimatedImpact: 'Reduce total retry attempts by 20-30%',
        implementation: 'Implement exponential backoff with jitter for failed requests',
        metrics: { totalRetries }
      }];

      this.addRecommendations(recommendations);
    }
  }

  private checkCacheOptimization(metrics: RequestMonitoringMetrics): void {
    // 检查缓存命中率（如果有相关指标）
    // 这里需要根据实际的缓存监控数据来实现
    
    // 简化示例：基于错误率推断缓存效果
    if (metrics.performance.errorRate > 3) {
      const recommendations: OptimizationRecommendation[] = [{
        id: `opt_${Date.now()}_4`,
        priority: 'low',
        category: 'cache',
        title: 'Improve Cache Strategy',
        description: 'High error rate may indicate cache issues. Consider improving cache invalidation.',
        estimatedImpact: 'Reduce error rate by 10-15%',
        implementation: 'Review cache invalidation logic and improve cache hit rate',
        metrics: { errorRate: metrics.performance.errorRate }
      }];

      this.addRecommendations(recommendations);
    }
  }

  private addRecommendations(recommendations: OptimizationRecommendation[]): void {
    for (const rec of recommendations) {
      this.monitoringSystem['recommendations'].push(rec);
    }

    // 限制建议数量
    if (this.monitoringSystem['recommendations'].length > 50) {
      this.monitoringSystem['recommendations'] = 
        this.monitoringSystem['recommendations'].slice(-50);
    }
  }
}

// 指标收集器接口
interface MetricCollector {
  collect(): Promise<any>;
}

// 性能收集器
class PerformanceCollector implements MetricCollector {
  async collect() {
    // 收集性能相关指标
    return {
      performance: {
        responseTime: this.getAverageResponseTime(),
        throughput: this.getThroughput(),
        concurrencyLevel: this.getConcurrencyLevel(),
        queueDepth: this.getQueueDepth(),
        successRate: this.getSuccessRate(),
        errorRate: this.getErrorRate()
      }
    };
  }

  private getAverageResponseTime(): number {
    // 实现实际的数据获取逻辑
    return Math.random() * 2000 + 500; // 模拟数据
  }

  private getThroughput(): number {
    return Math.random() * 100 + 50; // 模拟数据
  }

  private getConcurrencyLevel(): number {
    return Math.floor(Math.random() * 20) + 1; // 模拟数据
  }

  private getQueueDepth(): number {
    return Math.floor(Math.random() * 50); // 模拟数据
  }

  private getSuccessRate(): number {
    return Math.random() * 10 + 90; // 90-100% 模拟数据
  }

  private getErrorRate(): number {
    return Math.random() * 5; // 0-5% 模拟数据
  }
}

// 网络收集器
class NetworkCollector implements MetricCollector {
  async collect() {
    return {
      network: {
        quality: this.getNetworkQuality(),
        averageLatency: this.getAverageLatency(),
        packetLoss: this.getPacketLoss(),
        bandwidthUtilization: this.getBandwidthUtilization(),
        connectionType: this.getConnectionType(),
        signalStrength: this.getSignalStrength()
      }
    };
  }

  private getNetworkQuality(): NetworkQuality {
    // 实现实际的网络质量检测
    const qualities = Object.values(NetworkQuality);
    return qualities[Math.floor(Math.random() * qualities.length)];
  }

  private getAverageLatency(): number {
    return Math.random() * 200 + 50; // 50-250ms 模拟数据
  }

  private getPacketLoss(): number {
    return Math.random() * 2; // 0-2% 模拟数据
  }

  private getBandwidthUtilization(): number {
    return Math.random() * 80 + 10; // 10-90% 模拟数据
  }

  private getConnectionType(): string {
    const types = ['wifi', 'cellular', 'ethernet', 'unknown'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private getSignalStrength(): number {
    return Math.random() * 100; // 0-100% 模拟数据
  }
}

// 系统收集器
class SystemCollector implements MetricCollector {
  async collect() {
    return {
      system: {
        load: this.getSystemLoad(),
        memory: this.getMemoryUsage(),
        activeConnections: this.getActiveConnections()
      }
    };
  }

  private getSystemLoad(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / (performance as any).memory.jsHeapSizeLimit;
    }
    return Math.random(); // 模拟数据
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
    return Math.random(); // 模拟数据
  }

  private getActiveConnections(): number {
    return Math.floor(Math.random() * 1000) + 100; // 100-1100 模拟数据
  }
}

// 用户体验收集器
class UXCollector implements MetricCollector {
  async collect() {
    return {
      ux: {
        perceivedPerformance: this.getPerceivedPerformance(),
        completionRate: this.getCompletionRate(),
        abandonmentRate: this.getAbandonmentRate(),
        satisfactionScore: this.getSatisfactionScore(),
        userWaitTime: this.getUserWaitTime()
      }
    };
  }

  private getPerceivedPerformance(): number {
    return Math.random() * 20 + 80; // 80-100 模拟数据
  }

  private getCompletionRate(): number {
    return Math.random() * 10 + 90; // 90-100% 模拟数据
  }

  private getAbandonmentRate(): number {
    return Math.random() * 5; // 0-5% 模拟数据
  }

  private getSatisfactionScore(): number {
    return Math.random() * 2 + 3; // 3-5 模拟数据
  }

  private getUserWaitTime(): number {
    return Math.random() * 3000 + 500; // 500-3500ms 模拟数据
  }
}

// 指标报告器接口
interface MetricReporter {
  report(metrics: RequestMonitoringMetrics): void;
}

// 控制台报告器
class ConsoleReporter implements MetricReporter {
  report(metrics: RequestMonitoringMetrics): void {
    console.log('Current metrics:', {
      successRate: metrics.performance.successRate.toFixed(1) + '%',
      errorRate: metrics.performance.errorRate.toFixed(1) + '%',
      throughput: metrics.performance.throughput.toFixed(1) + ' req/min',
      responseTime: metrics.performance.responseTime.toFixed(0) + 'ms'
    });
  }
}

// 单例导出
export const monitoringSystem = RequestMonitoringSystem.getInstance();
export const consoleReporter = new ConsoleReporter();

// 添加默认报告器
monitoringSystem.addReporter(consoleReporter);

export default RequestMonitoringSystem;
