import { EventEmitter } from 'events';
import { logger } from '../bot/utils/logger';
import { faultToleranceManager } from '../bot/utils/fault-tolerance-manager';
import { performance } from 'perf_hooks';
/**
 * Telegram Bot 推送监控和调试工具
 * 消息状态监控、推送成功率统计、错误日志和告警机制
 */


export interface MessageStatus {
  messageId: string;
  telegramId: string;
  chatId?: string;
  status: 'pending' | 'processing' | 'sent' | 'delivered' | 'failed' | 'retry';
  timestamp: Date;
  attempts: number;
  lastAttempt?: Date;
  nextRetry?: Date;
  error?: string;
  response?: any;
  latency?: number;
  size?: number;
  priority?: 'high' | 'normal' | 'low';
  type: string;
}

export interface PushMetrics {
  timestamp: Date;
  totalMessages: number;
  successfulMessages: number;
  failedMessages: number;
  pendingMessages: number;
  processingMessages: number;
  successRate: number;
  failureRate: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  messagesPerSecond: number;
  retryCount: number;
  errorBreakdown: Record<string, number>;
}

export interface PushAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  type: 'success_rate' | 'latency' | 'queue_overflow' | 'error_spike' | 'service_down';
  message: string;
  details: any;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface PushConfig {
  alertThresholds: {
    successRate: number;
    averageLatency: number;
    queueLength: number;
    errorRate: number;
    messageRate: number;
  };
  monitoringInterval: number;
  retentionPeriod: number;
  maxQueueSize: number;
  maxRetries: number;
}

export class TelegramBotPushMonitor extends EventEmitter {
  private messageStatuses: Map<string, MessageStatus> = new Map();
  private metricsHistory: PushMetrics[] = [];
  private alerts: PushAlert[] = [];
  private config: PushConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private errorCounts = new Map<string, number>();
  private latencyData: number[] = [];
  private startTime = Date.now();

  constructor(config?: Partial<PushConfig>) {
    super();
    this.config = {
      alertThresholds: {
        successRate: 90,        // 成功率低于90%告警
        averageLatency: 2000,   // 平均延迟超过2秒告警
        queueLength: 1000,      // 队列长度超过1000告警
        errorRate: 10,          // 错误率超过10%告警
        messageRate: 50         // 每秒消息数低于50告警
      },
      monitoringInterval: 5000, // 5秒监控间隔
      retentionPeriod: 3600000, // 1小时数据保留
      maxQueueSize: 10000,      // 最大队列大小
      maxRetries: 5,
      ...config
    };

    this.startMonitoring();
}

  /**
   * 记录消息状态
   */
  public recordMessage(messageId: string, data: Partial<MessageStatus>): void {
    const existingStatus = this.messageStatuses.get(messageId);
    
    const status: MessageStatus = {
      messageId,
      telegramId: data.telegramId || existingStatus?.telegramId || '',
      chatId: data.chatId,
      status: data.status || existingStatus?.status || 'pending',
      timestamp: data.timestamp || new Date(),
      attempts: data.attempts || existingStatus?.attempts || 0,
      lastAttempt: data.lastAttempt,
      nextRetry: data.nextRetry,
      error: data.error,
      response: data.response,
      latency: data.latency,
      size: data.size,
      priority: data.priority || existingStatus?.priority || 'normal',
      type: data.type || existingStatus?.type || 'unknown'
    };

    this.messageStatuses.set(messageId, status);

    // 记录延迟数据
    if (status.latency) {
      this.latencyData.push(status.latency);
      if (this.latencyData.length > 1000) {
        this.latencyData.shift(); // 保持数据大小
      }
    }

    // 记录错误
    if (status.error) {
      const errorKey = this.categorizeError(status.error);
      this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    }

    // 触发事件
    this.emit('message:recorded', status);
    this.emit('message:status_change', status);

    logger.debug('消息状态记录', { messageId, status: status.status });
  }

  /**
   * 更新消息状态
   */
  public updateMessageStatus(messageId: string, updates: Partial<MessageStatus>): void {
    const existingStatus = this.messageStatuses.get(messageId);
    if (!existingStatus) {
      logger.warn('尝试更新不存在的消息状态', { messageId });
      return;
    }

    const updatedStatus = { ...existingStatus, ...updates };
    this.messageStatuses.set(messageId, updatedStatus);

    this.emit('message:updated', updatedStatus);
  }

  /**
   * 获取消息状态
   */
  public getMessageStatus(messageId: string): MessageStatus | undefined {
    return this.messageStatuses.get(messageId);
  }

  /**
   * 获取所有消息状态
   */
  public getAllMessageStatuses(): MessageStatus[] {
    return Array.from(this.messageStatuses.values());
  }

  /**
   * 获取当前推送指标
   */
  public getCurrentMetrics(): PushMetrics {
    const now = new Date();
    const messages = this.getAllMessageStatuses();
    
    const totalMessages = messages.length;
    const successfulMessages = messages.filter(m => m.status === 'delivered' || m.status === 'sent').length;
    const failedMessages = messages.filter(m => m.status === 'failed').length;
    const pendingMessages = messages.filter(m => m.status === 'pending').length;
    const processingMessages = messages.filter(m => m.status === 'processing' || m.status === 'retry').length;
    
    const successRate = totalMessages > 0 ? (successfulMessages / totalMessages) * 100 : 0;
    const failureRate = totalMessages > 0 ? (failedMessages / totalMessages) * 100 : 0;
    
    // 计算延迟统计
    const latencies = this.latencyData;
    const averageLatency = latencies.length > 0 ? 
      latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;
    
    const sortedLatencies = [...latencies].sort((a, b) => a - b);
    const p95Latency = sortedLatencies.length > 0 ? 
      sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] : 0;
    const p99Latency = sortedLatencies.length > 0 ? 
      sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] : 0;

    // 计算消息速率（每秒）
    const runningTime = (now.getTime() - this.startTime) / 1000;
    const messagesPerSecond = runningTime > 0 ? totalMessages / runningTime : 0;

    // 计算重试次数
    const retryCount = messages.reduce((sum, m) => sum + (m.attempts - 1), 0);

    // 错误分类统计
    const errorBreakdown: Record<string, number> = {};
    this.errorCounts.forEach((count, errorType) => {
      errorBreakdown[errorType] = count;
    });

    const metrics: PushMetrics = {
      timestamp: now,
      totalMessages,
      successfulMessages,
      failedMessages,
      pendingMessages,
      processingMessages,
      successRate,
      failureRate,
      averageLatency,
      p95Latency,
      p99Latency,
      messagesPerSecond,
      retryCount,
      errorBreakdown
    };

    return metrics;
  }

  /**
   * 获取历史指标
   */
  public getMetricsHistory(): PushMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * 获取推送成功率统计
   */
  public getSuccessRateStats(): {
    current: number;
    average: number;
    trend: 'up' | 'down' | 'stable';
    periods: Array<{ period: string; rate: number }>;
  } {
    const current = this.getCurrentMetrics().successRate;
    
    // 计算历史平均成功率
    const recentMetrics = this.metricsHistory.slice(-10); // 最近10个数据点;
    const average = recentMetrics.length > 0 ? 
      recentMetrics.reduce((sum, m) => sum + m.successRate, 0) / recentMetrics.length : 
      current;

    // 计算趋势
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentMetrics.length >= 2) {
      const recent = recentMetrics[recentMetrics.length - 1].successRate;
      const previous = recentMetrics[recentMetrics.length - 2].successRate;
      const diff = recent - previous;
      
      if (diff > 1) trend = 'up'; {
      else if (diff < -1) trend = 'down'; {
    }

    // 生成时间段统计
    const periods = this.generateTimePeriods();

    return {
      current,
      average,
      trend,
      periods
    };
  }

  /**
   * 获取错误分析
   */
  public getErrorAnalysis(): {
    totalErrors: number;
    errorTypes: Array<{ type: string; count: number; percentage: number }>;
    recentErrors: MessageStatus[];
    topErrors: Array<{ error: string; count: number }>;
  } {
    const messages = this.getAllMessageStatuses();
    const errorMessages = messages.filter(m => m.error);
    const totalErrors = errorMessages.length;

    // 错误类型统计
    const errorTypeMap = new Map<string, number>();
    errorMessages.forEach(m => {
      if (m.error) {
        const errorType = this.categorizeError(m.error);
        errorTypeMap.set(errorType, (errorTypeMap.get(errorType) || 0) + 1);
      }
    });

    const errorTypes = Array.from(errorTypeMap.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0
    })).sort((a, b) => b.count - a.count);

    // 最近错误（最多50个）
    const recentErrors = errorMessages;
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50);

    // 最高频错误
    const topErrors = errorTypes.slice(0, 10).map(et => ({
      error: et.type,
      count: et.count
    }));

    return {
      totalErrors,
      errorTypes,
      recentErrors,
      topErrors
    };
  }

  /**
   * 获取性能分析
   */
  public getPerformanceAnalysis(): {
    latency: {
      average: number;
      p50: number;
      p95: number;
      p99: number;
      max: number;
    };
    throughput: {
      messagesPerSecond: number;
      peakRate: number;
      averageRate: number;
    };
    queue: {
      currentSize: number;
      maxSize: number;
      utilization: number;
      averageWaitTime: number;
    };
    reliability: {
      successRate: number;
      retryRate: number;
      timeoutRate: number;
    };
  } {
    const metrics = this.getCurrentMetrics();
    const latencies = this.latencyData;
    
    const sortedLatencies = [...latencies].sort((a, b) => a - b);
    const latencyStats = {
      average: metrics.averageLatency,
      p50: sortedLatencies.length > 0 ? sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] : 0,
      p95: metrics.p95Latency,
      p99: metrics.p99Latency,
      max: sortedLatencies.length > 0 ? Math.max(...sortedLatencies) : 0
    };

    // 计算吞吐量统计
    const recentMetrics = this.metricsHistory.slice(-60); // 最近5分钟;
    const rates = recentMetrics.map(m => m.messagesPerSecond);
    const throughputStats = {
      messagesPerSecond: metrics.messagesPerSecond,
      peakRate: rates.length > 0 ? Math.max(...rates) : 0,
      averageRate: rates.length > 0 ? rates.reduce((sum, r) => sum + r, 0) / rates.length : 0
    };

    // 队列统计
    const queueMetrics = faultToleranceManager.getMetrics().messageQueue;
    const queueStats = {
      currentSize: queueMetrics.queueLength,
      maxSize: this.config.maxQueueSize,
      utilization: (queueMetrics.queueLength / this.config.maxQueueSize) * 100,
      averageWaitTime: metrics.averageLatency // 简化的等待时间
    };

    // 可靠性统计
    const messages = this.getAllMessageStatuses();
    const totalAttempts = messages.reduce((sum, m) => sum + m.attempts, 0);
    const retryRate = totalAttempts > 0 ? ((totalAttempts - messages.length) / totalAttempts) * 100 : 0;
    const timeoutRate = messages.filter(m => m.latency && m.latency > 5000).length / messages.length * 100;

    const reliabilityStats = {
      successRate: metrics.successRate,
      retryRate,
      timeoutRate
    };

    return {
      latency: latencyStats,
      throughput: throughputStats,
      queue: queueStats,
      reliability: reliabilityStats
    };
  }

  /**
   * 启动监控
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      logger.info('监控已经在运行中');
      return;
    }

    this.isMonitoring = true;
    logger.info('启动Telegram Bot推送监控');

    // 设置监控定时器
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
      this.cleanupOldData();
    }, this.config.monitoringInterval);

    this.emit('monitoring:started');
  }

  /**
   * 停止监控
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.info('Telegram Bot推送监控已停止');
    this.emit('monitoring:stopped');
  }

  /**
   * 收集指标
   */
  private collectMetrics(): void {
    try {
      const metrics = this.getCurrentMetrics();
      this.metricsHistory.push(metrics);

      // 保持历史数据大小
      const maxHistory = Math.floor(this.config.retentionPeriod / this.config.monitoringInterval);
      if (this.metricsHistory.length > maxHistory) {
        this.metricsHistory = this.metricsHistory.slice(-maxHistory);
      }

      this.emit('metrics:collected', metrics);

    } catch (error) {
      logger.error('收集推送指标失败', { error: (error as Error).message }, error as Error);
    }
  }

  /**
   * 检查告警条件
   */
  private checkAlerts(): void {
    const metrics = this.getCurrentMetrics();

    // 检查成功率告警
    if (metrics.successRate < this.config.alertThresholds.successRate) {
      this.createAlert('warning', 'success_rate', 
        `推送成功率低于阈值: ${metrics.successRate.toFixed(2)}% < ${this.config.alertThresholds.successRate}%`,
        { successRate: metrics.successRate, threshold: this.config.alertThresholds.successRate }
      );
    }

    // 检查延迟告警
    if (metrics.averageLatency > this.config.alertThresholds.averageLatency) {
      this.createAlert('warning', 'latency',
        `平均延迟过高: ${metrics.averageLatency.toFixed(2)}ms > ${this.config.alertThresholds.averageLatency}ms`,
        { averageLatency: metrics.averageLatency, threshold: this.config.alertThresholds.averageLatency }
      );
    }

    // 检查队列长度告警
    const queueLength = faultToleranceManager.getMetrics().messageQueue.queueLength;
    if (queueLength > this.config.alertThresholds.queueLength) {
      this.createAlert('error', 'queue_overflow',
        `消息队列溢出: ${queueLength} > ${this.config.alertThresholds.queueLength}`,
        { queueLength, threshold: this.config.alertThresholds.queueLength }
      );
    }

    // 检查错误率告警
    const errorRate = metrics.failureRate;
    if (errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert('error', 'error_spike',
        `错误率激增: ${errorRate.toFixed(2)}% > ${this.config.alertThresholds.errorRate}%`,
        { errorRate, threshold: this.config.alertThresholds.errorRate }
      );
    }

    // 检查消息速率告警
    if (metrics.messagesPerSecond < this.config.alertThresholds.messageRate) {
      this.createAlert('warning', 'service_down',
        `消息处理速率过低: ${metrics.messagesPerSecond.toFixed(2)} msg/s < ${this.config.alertThresholds.messageRate} msg/s`,
        { messageRate: metrics.messagesPerSecond, threshold: this.config.alertThresholds.messageRate }
      );
    }
  }

  /**
   * 创建告警
   */
  private createAlert(level: PushAlert['level'], type: PushAlert['type'], 
                     message: string, details: any): void {
    // 检查是否已经有相同的活跃告警
    const existingAlert = this.alerts.find(a =>;
      a.type :== type && !a.resolved && 
      Math.abs(a.timestamp.getTime() - Date.now()) < 300000 // 5分钟内的相同告警
    );

    if (existingAlert) {
      return; // 避免重复告警
    }

    const alert: PushAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      type,
      message,
      details,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);
    this.emit('alert:created', alert);

    // 记录告警日志
    switch (level) {
      case 'critical':
        logger.error(`🚨 [CRITICAL ALERT] ${message}`, details);
        break;
      case 'error':
        logger.error(`❌ [ERROR ALERT] ${message}`, details);
        break;
      case 'warning':
        logger.warn(`⚠️ [WARNING ALERT] ${message}`, details);
        break;
      case 'info':
        logger.info(`ℹ️ [INFO ALERT] ${message}`, details);
        break;
    }
  }

  /**
   * 解析告警
   */
  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      
      this.emit('alert:resolved', alert);
      logger.info(`告警已解析: ${alert.message}`, { alertId });
    }
  }

  /**
   * 获取活跃告警
   */
  public getActiveAlerts(): PushAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * 获取所有告警
   */
  public getAllAlerts(): PushAlert[] {
    return [...this.alerts];
  }

  /**
   * 清理旧数据
   */
  private cleanupOldData(): void {
    const cutoffTime = Date.now() - this.config.retentionPeriod;

    // 清理消息状态
    for (const [messageId, status] of this.messageStatuses.entries()) {
      if (status.timestamp.getTime() < cutoffTime) {
        this.messageStatuses.delete(messageId);
      }
    }

    // 清理历史指标
    this.metricsHistory : this.metricsHistory.filter(m => 
      m.timestamp.getTime() >= cutoffTime
    );

    // 清理已解析的旧告警
    this.alerts : this.alerts.filter(a => 
      !a.resolved || a.timestamp.getTime() >= cutoffTime
    );
  }

  /**
   * 分类错误
   */
  private categorizeError(error: string): string {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('network') || lowerError.includes('timeout') || lowerError.includes('connection')) {
      return 'network_error';
    } else if (lowerError.includes('rate limit') || lowerError.includes('too many')) {
      return 'rate_limit_error';
    } else if (lowerError.includes('not found') || lowerError.includes('invalid')) {
      return 'validation_error';
    } else if (lowerError.includes('permission') || lowerError.includes('unauthorized')) {
      return 'permission_error';
    } else if (lowerError.includes('quota') || lowerError.includes('exceeded')) {
      return 'quota_error';
    } else if (lowerError.includes('database') || lowerError.includes('sql')) {
      return 'database_error';
    } else {
      return 'unknown_error';
    }
  }

  /**
   * 生成时间段统计
   */
  private generateTimePeriods(): Array<{ period: string; rate: number }> {
    const now = new Date();
    const periods = [];
    
    for (let i = 6; i >= 0; i--) {
      const periodStart = new Date(now.getTime() - i * 60 * 60 * 1000); // 每小时;
      const periodEnd = new Date(periodStart.getTime() + 60 * 60 * 1000);
      
      const periodMessages = this.getAllMessageStatuses().filter(m =>;
        m.timestamp >= periodStart && m.timestamp <= periodEnd
      );
      
      const periodSuccess = periodMessages.filter(m =>;
        m.status :== 'delivered' || m.status === 'sent'
      ).length;
      
      const rate = periodMessages.length > 0 ? (periodSuccess / periodMessages.length) * 100 : 0;
      
      periods.push({
        period: `${periodStart.getHours()}:00`,
        rate
      });
    }
    
    return periods;
  }

  /**
   * 生成监控报告
   */
  public generateMonitorReport(): string {
    const metrics = this.getCurrentMetrics();
    const successStats = this.getSuccessRateStats();
    const errorAnalysis = this.getErrorAnalysis();
    const performanceAnalysis = this.getPerformanceAnalysis();
    const alerts = this.getActiveAlerts();

    const report = `;
# Telegram Bot 推送监控报告

**生成时间:** ${new Date().toISOString()}

## 推送指标概览

| 指标 | 数值 |
|------|------|
| 总消息数 | ${metrics.totalMessages} |
| 成功消息 | ${metrics.successfulMessages} |
| 失败消息 | ${metrics.failedMessages} |
| 成功率 | ${metrics.successRate.toFixed(2)}% |
| 平均延迟 | ${metrics.averageLatency.toFixed(2)}ms |
| 消息速率 | ${metrics.messagesPerSecond.toFixed(2)} msg/s |

## 成功率趋势

- **当前成功率:** ${successStats.current.toFixed(2)}%
- **平均成功率:** ${successStats.average.toFixed(2)}%
- **趋势:** ${successStats.trend === 'up' ? '📈 上升' : successStats.trend === 'down' ? '📉 下降' : '➡️ 稳定'}

## 错误分析

- **总错误数:** ${errorAnalysis.totalErrors}
- **错误类型分布:**
${errorAnalysis.errorTypes.map(et => `  - ${et.type}: ${et.count} (${et.percentage.toFixed(1)}%)`).join('\n')}

## 性能分析

### 延迟统计
- 平均延迟: ${performanceAnalysis.latency.average.toFixed(2)}ms
- P50延迟: ${performanceAnalysis.latency.p50.toFixed(2)}ms
- P95延迟: ${performanceAnalysis.latency.p95.toFixed(2)}ms
- P99延迟: ${performanceAnalysis.latency.p99.toFixed(2)}ms

### 吞吐量
- 当前速率: ${performanceAnalysis.throughput.messagesPerSecond.toFixed(2)} msg/s
- 峰值速率: ${performanceAnalysis.throughput.peakRate.toFixed(2)} msg/s
- 平均速率: ${performanceAnalysis.throughput.averageRate.toFixed(2)} msg/s

### 队列状态
- 当前队列长度: ${performanceAnalysis.queue.currentSize}
- 队列利用率: ${performanceAnalysis.queue.utilization.toFixed(1)}%
- 平均等待时间: ${performanceAnalysis.queue.averageWaitTime.toFixed(2)}ms

## 活跃告警

${alerts.length > 0 ? alerts.map(alert :> 
  `- **${alert.level.toUpperCase()}:** ${alert.message} (${alert.timestamp.toISOString()})`
).join('\n') : '✅ 无活跃告警'}

## 建议

${this.generateRecommendations(metrics, performanceAnalysis, alerts)}
`;

    return report;
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(metrics: PushMetrics, performance: any, alerts: PushAlert[]): string {
    const recommendations = [];

    // 基于成功率提供建议
    if (metrics.successRate < 95) {
      recommendations.push('• **改进成功率**: 检查网络连接和Telegram API配置');
    }

    // 基于延迟提供建议
    if (metrics.averageLatency > 1000) {
      recommendations.push('• **优化延迟**: 考虑增加并发数或优化数据库查询');
    }

    // 基于队列长度提供建议
    if (performance.queue.utilization > 80) {
      recommendations.push('• **队列扩容**: 当前队列使用率过高，建议增加处理能力');
    }

    // 基于错误率提供建议
    if (metrics.failureRate > 5) {
      recommendations.push('• **错误处理**: 错误率较高，建议检查错误日志并实施修复');
    }

    // 基于告警提供建议
    if (alerts.length > 0) {
      recommendations.push('• **告警处理**: 有活跃告警需要处理，请查看告警详情');
    }

    if (recommendations.length === 0) {
      recommendations.push('• **系统状态良好**: 当前各项指标均在正常范围内');
    }

    return recommendations.join('\n');
  }

  /**
   * 获取监控状态
   */
  public getMonitorStatus(): {
    isMonitoring: boolean;
    uptime: number;
    messageCount: number;
    alertCount: number;
    lastUpdate: Date;
  } {
    return {
      isMonitoring: this.isMonitoring,
      uptime: Date.now() - this.startTime,
      messageCount: this.messageStatuses.size,
      alertCount: this.alerts.length,
      lastUpdate: new Date()
    };
  }

  /**
   * 导出监控数据
   */
  public exportData(): {
    messages: MessageStatus[];
    metrics: PushMetrics[];
    alerts: PushAlert[];
    config: PushConfig;
  } {
    return {
      messages: this.getAllMessageStatuses(),
      metrics: this.getMetricsHistory(),
      alerts: this.getAllAlerts(),
      config: this.config
    };
  }
}

// 导出单例实例
export const pushMonitor = new TelegramBotPushMonitor();

// 启动全局监控
pushMonitor.startMonitoring();

// 事件监听器
pushMonitor.on('metrics:collected', (metrics: PushMetrics) => {
  if (metrics.successRate < 90) {
    logger.warn('推送成功率较低', { successRate: metrics.successRate });
}
});

pushMonitor.on('alert:created', (alert: PushAlert) => {
  logger.error('推送监控告警', { alertType: alert.type, message: alert.message });
});

export default TelegramBotPushMonitor;
}}