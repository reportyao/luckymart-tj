/**
 * 性能监控和分析系统
 * 实时监控系统性能，收集指标，并提供分析报告
 */

import { EventEmitter } from 'events';
import { logger } from './logger';

export interface PerformanceMetrics {
  timestamp: string;
  system: SystemMetrics;
  application: ApplicationMetrics;
  custom: Record<string, any>;
}

export interface SystemMetrics {
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
  processes: ProcessMetrics;
}

export interface CPUMetrics {
  usage: number; // CPU使用率百分比
  loadAverage: number[]; // 1, 5, 15分钟负载
  cores: number; // CPU核心数
  model: string; // CPU型号
  speed: number; // CPU频率
}

export interface MemoryMetrics {
  total: number; // 总内存(字节)
  free: number; // 空闲内存(字节)
  used: number; // 已用内存(字节)
  percentage: number; // 内存使用百分比
  heapUsed: number; // V8堆已用
  heapTotal: number; // V8堆总计
  external: number; // 外部内存
  rss: number; // 常驻集大小
}

export interface DiskMetrics {
  total: number; // 总空间
  free: number; // 可用空间
  used: number; // 已用空间
  percentage: number; // 使用百分比
  readBytes: number; // 读取字节数
  writeBytes: number; // 写入字节数
}

export interface NetworkMetrics {
  bytesSent: number; // 发送字节数
  bytesReceived: number; // 接收字节数
  packetsSent: number; // 发送包数
  packetsReceived: number; // 接收包数
  errorsIn: number; // 入站错误
  errorsOut: number; // 出站错误
  latency: number; // 网络延迟(ms)
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
}

export interface ProcessMetrics {
  pid: number; // 进程ID
  ppid: number; // 父进程ID
  cpu: number; // CPU使用率
  memory: number; // 内存使用量
  uptime: number; // 进程运行时间
  handles: number; // 句柄数
  requests: number; // 请求数
}

export interface ApplicationMetrics {
  uptime: number; // 应用运行时间
  restartCount: number; // 重启次数
  messageQueueSize: number; // 消息队列大小
  errorCount: number; // 错误计数
  requestCount: number; // 请求计数
  responseTime: number; // 平均响应时间
  throughput: number; // 吞吐量
  activeConnections: number; // 活跃连接数
  eventLoopDelay: number; // 事件循环延迟
}

export interface PerformanceAlert {
  id: string;
  timestamp: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'response_time' | 'throughput';
  severity: 'warning' | 'critical';
  threshold: number;
  current: number;
  message: string;
  duration: number; // 持续时间(ms)
  autoResolved: boolean;
}

export interface PerformanceReport {
  timestamp: string;
  duration: number; // 报告时间范围
  summary: {
    uptime: number;
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
  };
  metrics: {
    cpu: {
      average: number;
      peak: number;
      minimum: number;
      usageDistribution: number[];
    };
    memory: {
      average: number;
      peak: number;
      minimum: number;
      heapGrowth: number;
    };
    responseTime: {
      average: number;
      p50: number;
      p95: number;
      p99: number;
      maximum: number;
    };
    errors: {
      total: number;
      byType: Record<string, number>;
      rate: number;
    };
  };
  trends: {
    timestamp: string;
    cpu: number;
    memory: number;
    responseTime: number;
    errorCount: number;
  }[];
  recommendations: string[];
}

export class PerformanceMonitor extends EventEmitter {
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metricsHistory: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private maxHistorySize = 10000;
  private maxAlertsSize = 1000;
  private lastSnapshot: PerformanceMetrics | null = null;
  private startTime: Date = new Date();

  constructor() {
    super();
    this.setupDefaultAlertRules();
  }

  // 启动性能监控
  public startMonitoring(intervalMs: number = 10000): void {
    if (this.isMonitoring) {
      logger.warn('Performance monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.startTime = new Date();

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    logger.info('Performance monitoring started', { interval: intervalMs });
    this.emit('monitoring:started');
  }

  // 停止性能监控
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.info('Performance monitoring stopped');
    this.emit('monitoring:stopped');
  }

  // 收集性能指标
  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.captureMetrics();
      
      // 保存指标历史
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
      }

      this.lastSnapshot = metrics;

      // 检查告警规则
      this.checkAlertRules(metrics);

      // 发送指标事件
      this.emit('metrics:collected', metrics);

      logger.debug('Performance metrics collected', {
        cpuUsage: metrics.system.cpu.usage,
        memoryUsage: metrics.system.memory.percentage,
        responseTime: metrics.application.responseTime
      });

    } catch (error) {
      logger.error('Failed to collect performance metrics', { 
        error: (error as Error).message 
      }, error as Error);
    }
  }

  // 捕获当前指标
  private async captureMetrics(): Promise<PerformanceMetrics> {
    const now = new Date().toISOString();
    
    return {
      timestamp: now,
      system: await this.captureSystemMetrics(),
      application: await this.captureApplicationMetrics(),
      custom: this.captureCustomMetrics()
    };
  }

  // 捕获系统指标
  private async captureSystemMetrics(): Promise<SystemMetrics> {
    const os = require('os');
    const memUsage = process.memoryUsage();

    return {
      cpu: this.captureCPUMetrics(),
      memory: this.captureMemoryMetrics(memUsage),
      disk: await this.captureDiskMetrics(),
      network: await this.captureNetworkMetrics(),
      processes: this.captureProcessMetrics()
    };
  }

  // 捕获CPU指标
  private captureCPUMetrics(): CPUMetrics {
    const os = require('os');
    const cpus = os.cpus();

    // 计算CPU使用率
    const cpuUsage = this.calculateCPUUsage();
    
    return {
      usage: cpuUsage,
      loadAverage: process.platform !== 'win32' ? process.loadavg() : [0, 0, 0],
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      speed: cpus[0]?.speed || 0
    };
  }

  // 计算CPU使用率
  private calculateCPUUsage(): number {
    const startUsage = process.cpuUsage();
    const startTime = Date.now();

    return new Promise<number>((resolve) => {
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = Date.now();
        const userTime = endUsage.user;
        const systemTime = endUsage.system;
        const totalTime = (endTime - startTime) * 1000; // 转换为微秒

        const cpuPercent = ((userTime + systemTime) / totalTime) * 100;
        resolve(Math.min(cpuPercent, 100)); // 限制在0-100%
      }, 100);
    });
  }

  // 捕获内存指标
  private captureMemoryMetrics(memUsage: NodeJS.MemoryUsage): MemoryMetrics {
    const os = require('os');
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    return {
      total: totalMem,
      free: freeMem,
      used: totalMem - freeMem,
      percentage: ((totalMem - freeMem) / totalMem) * 100,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    };
  }

  // 捕获磁盘指标
  private async captureDiskMetrics(): Promise<DiskMetrics> {
    // 简化实现，在实际应用中可以使用更详细的磁盘监控
    return {
      total: 1024 * 1024 * 1024 * 100, // 100GB 假设
      free: 1024 * 1024 * 1024 * 50,   // 50GB 假设
      used: 1024 * 1024 * 1024 * 50,   // 50GB 假设
      percentage: 50,
      readBytes: 0,
      writeBytes: 0
    };
  }

  // 捕获网络指标
  private async captureNetworkMetrics(): Promise<NetworkMetrics> {
    const startTime = Date.now();
    
    try {
      // 测试网络延迟
      const start = process.hrtime.bigint();
      await fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD',
        timeout: 5000 
      } as any);
      const end = process.hrtime.bigint();
      const latency = Number(end - start) / 1000000; // 转换为毫秒

      let connectionQuality: NetworkMetrics['connectionQuality'] = 'good';
      if (latency < 50) connectionQuality = 'excellent';
      else if (latency < 100) connectionQuality = 'good';
      else if (latency < 200) connectionQuality = 'fair';
      else if (latency < 500) connectionQuality = 'poor';
      else connectionQuality = 'offline';

      return {
        bytesSent: 0,
        bytesReceived: 0,
        packetsSent: 0,
        packetsReceived: 0,
        errorsIn: 0,
        errorsOut: 0,
        latency: Math.round(latency),
        connectionQuality
      };
    } catch (error) {
      return {
        bytesSent: 0,
        bytesReceived: 0,
        packetsSent: 0,
        packetsReceived: 0,
        errorsIn: 1,
        errorsOut: 0,
        latency: 5000,
        connectionQuality: 'offline'
      };
    }
  }

  // 捕获进程指标
  private captureProcessMetrics(): ProcessMetrics {
    const cpuUsage = process.cpuUsage();
    
    return {
      pid: process.pid,
      ppid: process.ppid,
      cpu: (cpuUsage.user + cpuUsage.system) / 1000000, // 转换为秒
      memory: process.memoryUsage().rss,
      uptime: process.uptime(),
      handles: (process as any)._getActiveHandles().length,
      requests: (process as any)._getActiveRequests().length
    };
  }

  // 捕获应用指标
  private async captureApplicationMetrics(): Promise<ApplicationMetrics> {
    return {
      uptime: process.uptime(),
      restartCount: 0, // 可以从其他地方获取
      messageQueueSize: await this.getMessageQueueSize(),
      errorCount: this.getErrorCount(),
      requestCount: this.getRequestCount(),
      responseTime: await this.getAverageResponseTime(),
      throughput: this.getThroughput(),
      activeConnections: this.getActiveConnections(),
      eventLoopDelay: await this.measureEventLoopDelay()
    };
  }

  // 捕获自定义指标
  private captureCustomMetrics(): Record<string, any> {
    return {
      eventLoopUtilization: this.calculateEventLoopUtilization(),
      tickFrequency: this.getTickFrequency(),
      memoryFragmentation: this.getMemoryFragmentation(),
      gcStats: this.getGCStats()
    };
  }

  // 测量事件循环延迟
  private async measureEventLoopDelay(): Promise<number> {
    const start = process.hrtime.bigint();
    
    return new Promise<number>((resolve) => {
      setImmediate(() => {
        const end = process.hrtime.bigint();
        resolve(Number(end - start) / 1000000); // 转换为毫秒
      });
    });
  }

  // 计算事件循环利用率
  private calculateEventLoopUtilization(): number {
    // 简化实现，实际可以使用 perf_hooks
    return 0.8; // 假设80%利用率
  }

  // 获取tick频率
  private getTickFrequency(): number {
    // 简化实现
    return 60; // 假设每秒60次
  }

  // 获取内存碎片化率
  private getMemoryFragmentation(): number {
    const memUsage = process.memoryUsage();
    if (memUsage.heapTotal === 0) return 0;
    return ((memUsage.heapUsed / memUsage.heapTotal) * 100);
  }

  // 获取垃圾回收统计
  private getGCStats(): Record<string, number> {
    // 简化实现，实际可以从 v8 获取 GC 统计
    return {
      gcCount: 0,
      gcTime: 0,
      gcType: 'unknown'
    };
  }

  // 获取消息队列大小（需要从消息队列组件获取）
  private async getMessageQueueSize(): Promise<number> {
    // 这里应该从实际的消息队列组件获取
    return 0;
  }

  // 获取错误计数（需要从错误追踪器获取）
  private getErrorCount(): number {
    // 这里应该从实际的错误追踪器获取
    return 0;
  }

  // 获取请求计数
  private getRequestCount(): number {
    // 这里应该从实际的应用计数器获取
    return 0;
  }

  // 获取平均响应时间
  private async getAverageResponseTime(): Promise<number> {
    // 这里应该从实际的请求监控获取
    return 0;
  }

  // 获取吞吐量
  private getThroughput(): number {
    // 这里应该从实际的吞吐量监控获取
    return 0;
  }

  // 获取活跃连接数
  private getActiveConnections(): number {
    // 这里应该从实际的网络连接监控获取
    return 0;
  }

  // 设置默认告警规则
  private setupDefaultAlertRules(): void {
    // CPU使用率告警
    this.alertRules.set('cpu_high', {
      id: 'cpu_high',
      metric: 'system.cpu.usage',
      threshold: 80,
      duration: 30000, // 30秒
      severity: 'warning',
      message: 'CPU usage is high'
    });

    // 内存使用率告警
    this.alertRules.set('memory_high', {
      id: 'memory_high',
      metric: 'system.memory.percentage',
      threshold: 85,
      duration: 30000,
      severity: 'warning',
      message: 'Memory usage is high'
    });

    // 响应时间告警
    this.alertRules.set('response_time_high', {
      id: 'response_time_high',
      metric: 'application.responseTime',
      threshold: 1000, // 1秒
      duration: 60000, // 1分钟
      severity: 'critical',
      message: 'Response time is too high'
    });

    // 网络延迟告警
    this.alertRules.set('network_latency_high', {
      id: 'network_latency_high',
      metric: 'system.network.latency',
      threshold: 1000, // 1秒
      duration: 60000,
      severity: 'warning',
      message: 'Network latency is high'
    });
  }

  // 检查告警规则
  private checkAlertRules(metrics: PerformanceMetrics): void {
    for (const rule of this.alertRules.values()) {
      const currentValue = this.getMetricValue(metrics, rule.metric);
      if (currentValue !== undefined && currentValue > rule.threshold) {
        this.triggerAlert(rule, currentValue);
      }
    }
  }

  // 获取指标值
  private getMetricValue(metrics: PerformanceMetrics, metricPath: string): number | undefined {
    const parts = metricPath.split('.');
    let current: any = metrics;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return typeof current === 'number' ? current : undefined;
  }

  // 触发告警
  private triggerAlert(rule: AlertRule, currentValue: number): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: rule.metric.split('.')[1] as PerformanceAlert['type'], // 简化提取类型
      severity: rule.severity,
      threshold: rule.threshold,
      current: currentValue,
      message: rule.message,
      duration: rule.duration,
      autoResolved: false
    };

    this.alerts.push(alert);
    if (this.alerts.length > this.maxAlertsSize) {
      this.alerts = this.alerts.slice(-this.maxAlertsSize);
    }

    this.emit('alert:triggered', alert);
    logger.warn('Performance alert triggered', alert);
  }

  // 添加自定义告警规则
  public addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    logger.info('Alert rule added', { ruleId: rule.id, metric: rule.metric });
  }

  // 移除告警规则
  public removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    logger.info('Alert rule removed', { ruleId });
  }

  // 获取当前性能指标
  public getCurrentMetrics(): PerformanceMetrics | null {
    return this.lastSnapshot;
  }

  // 获取性能历史
  public getMetricsHistory(timeRange?: { start: Date; end: Date }): PerformanceMetrics[] {
    let history = this.metricsHistory;

    if (timeRange) {
      history = history.filter(m => {
        const timestamp = new Date(m.timestamp);
        return timestamp >= timeRange.start && timestamp <= timeRange.end;
      });
    }

    return history;
  }

  // 获取告警历史
  public getAlerts(limit?: number): PerformanceAlert[] {
    const alerts = [...this.alerts].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return limit ? alerts.slice(0, limit) : alerts;
  }

  // 解决告警
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.autoResolved = true;
      this.emit('alert:resolved', alert);
      logger.info('Performance alert resolved', { alertId });
      return true;
    }
    return false;
  }

  // 生成性能报告
  public generateReport(duration: number = 3600000): PerformanceReport { // 默认1小时
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - duration);
    
    const history = this.getMetricsHistory({ start: startTime, end: endTime });
    
    if (history.length === 0) {
      throw new Error('No metrics available for report generation');
    }

    const summary = this.calculateSummary(history);
    const metrics = this.calculateDetailedMetrics(history);
    const trends = this.calculateTrends(history);
    const recommendations = this.generateRecommendations(summary, metrics);

    return {
      timestamp: new Date().toISOString(),
      duration,
      summary,
      metrics,
      trends,
      recommendations
    };
  }

  // 计算摘要
  private calculateSummary(history: PerformanceMetrics[]): PerformanceReport['summary'] {
    const totalRequests = history.reduce((sum, m) => sum + m.application.requestCount, 0);
    const totalErrors = history.reduce((sum, m) => sum + m.application.errorCount, 0);
    const totalResponseTime = history.reduce((sum, m) => sum + m.application.responseTime, 0);
    
    return {
      uptime: history[0]?.application.uptime || 0,
      totalRequests,
      averageResponseTime: totalResponseTime / history.length,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      throughput: totalRequests / (history.length * (10000 / 1000)) // 估算吞吐量
    };
  }

  // 计算详细指标
  private calculateDetailedMetrics(history: PerformanceMetrics[]): PerformanceReport['metrics'] {
    const cpuValues = history.map(m => m.system.cpu.usage);
    const memoryValues = history.map(m => m.system.memory.percentage);
    const responseTimeValues = history.map(m => m.application.responseTime);
    const errorCounts = history.map(m => m.application.errorCount);

    return {
      cpu: {
        average: this.average(cpuValues),
        peak: Math.max(...cpuValues),
        minimum: Math.min(...cpuValues),
        usageDistribution: this.calculateDistribution(cpuValues)
      },
      memory: {
        average: this.average(memoryValues),
        peak: Math.max(...memoryValues),
        minimum: Math.min(...memoryValues),
        heapGrowth: this.calculateHeapGrowth(history)
      },
      responseTime: {
        average: this.average(responseTimeValues),
        p50: this.percentile(responseTimeValues, 50),
        p95: this.percentile(responseTimeValues, 95),
        p99: this.percentile(responseTimeValues, 99),
        maximum: Math.max(...responseTimeValues)
      },
      errors: {
        total: errorCounts.reduce((sum, count) => sum + count, 0),
        byType: this.groupErrorsByType(history),
        rate: this.average(errorCounts)
      }
    };
  }

  // 计算趋势
  private calculateTrends(history: PerformanceMetrics[]) {
    return history.map(m => ({
      timestamp: m.timestamp,
      cpu: m.system.cpu.usage,
      memory: m.system.memory.percentage,
      responseTime: m.application.responseTime,
      errorCount: m.application.errorCount
    }));
  }

  // 生成建议
  private generateRecommendations(summary: any, metrics: any): string[] {
    const recommendations: string[] = [];

    if (metrics.cpu.average > 70) {
      recommendations.push('Consider optimizing CPU-intensive operations or scaling horizontally');
    }

    if (metrics.memory.average > 80) {
      recommendations.push('Monitor for memory leaks and consider increasing memory allocation');
    }

    if (metrics.responseTime.p95 > 1000) {
      recommendations.push('Optimize database queries and implement caching strategies');
    }

    if (metrics.errors.rate > 5) {
      recommendations.push('Review error patterns and implement better error handling');
    }

    if (recommendations.length === 0) {
      recommendations.push('System performance is within normal parameters');
    }

    return recommendations;
  }

  // 辅助函数
  private average(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private calculateDistribution(values: number[]): number[] {
    // 简化的分布计算：分为5个桶
    const buckets = [0, 20, 40, 60, 80, 100];
    const distribution = new Array(buckets.length - 1).fill(0);

    values.forEach(value => {
      for (let i = 0; i < buckets.length - 1; i++) {
        if (value >= buckets[i] && value < buckets[i + 1]) {
          distribution[i]++;
          break;
        }
      }
    });

    return distribution;
  }

  private calculateHeapGrowth(history: PerformanceMetrics[]): number {
    if (history.length < 2) return 0;
    const first = history[0].system.memory.heapUsed;
    const last = history[history.length - 1].system.memory.heapUsed;
    return last - first;
  }

  private groupErrorsByType(history: PerformanceMetrics[]): Record<string, number> {
    // 简化实现，实际应该按错误类型分组
    return {
      total: history.reduce((sum, m) => sum + m.application.errorCount, 0)
    };
  }

  // 获取监控状态
  public getMonitoringStatus() {
    return {
      isMonitoring: this.isMonitoring,
      uptime: Date.now() - this.startTime.getTime(),
      metricsCount: this.metricsHistory.length,
      alertsCount: this.alerts.length,
      rulesCount: this.alertRules.size,
      lastSnapshot: this.lastSnapshot?.timestamp
    };
  }
}

// 告警规则接口
interface AlertRule {
  id: string;
  metric: string;
  threshold: number;
  duration: number;
  severity: 'warning' | 'critical';
  message: string;
}

// 单例性能监控器
export const performanceMonitor = new PerformanceMonitor();