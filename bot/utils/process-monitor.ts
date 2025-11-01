import { EventEmitter } from 'events';
import { logger, errorTracker } from './logger';
import { healthMonitor, HealthStatus } from './health-monitor';
/**
 * 进程监控和自动重启系统
 * 确保Bot稳定运行，监控资源使用，自动恢复异常状态
 */


export interface ProcessMetrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  eventLoopDelay: number;
  handlesCount: number;
  requestsCount: number;
  activeHandles: number;
  activeRequests: number;
}

export interface RestartReason {
  type: 'health-check-failed' | 'memory-leak' | 'cpu-overload' | 'graceful-shutdown' | 'manual';
  description: string;
  timestamp: string;
  metrics?: Partial<ProcessMetrics>;
  healthStatus?: HealthStatus;
}

export interface MonitoringConfig {
  healthCheckInterval: number;
  memoryThreshold: number; // MB
  cpuThreshold: number; // percentage
  maxUptime: number; // hours before graceful restart
  restartDelay: number; // ms
  enableAutoRestart: boolean;
  alertWebhook?: string;
}

export class ProcessMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private startTime: number = Date.now();
  private lastMetrics: ProcessMetrics | null = null;
  private isShuttingDown = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private shutdownTimeout: NodeJS.Timeout | null = null;

  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    
    this.config = {
      healthCheckInterval: 60000, // 1分钟
      memoryThreshold: 512, // 512MB
      cpuThreshold: 80, // 80%
      maxUptime: 24 * 7, // 7天
      restartDelay: 5000, // 5秒
      enableAutoRestart: true,
      ...config
    };

    this.startMonitoring();
}

  // 开始监控
  public startMonitoring() {
    logger.info('Starting process monitoring', { config: this.config });

    // 启动健康检查
    this.startHealthChecks();
    
    // 启动指标收集
    this.startMetricsCollection();
    
    // 启动优雅关闭监控
    this.startShutdownMonitoring();

    // 监听进程信号
    this.setupSignalHandlers();

    this.emit('monitor:started');
  }

  // 停止监控
  public stopMonitoring() {
    logger.info('Stopping process monitoring');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.shutdownTimeout) {
      clearTimeout(this.shutdownTimeout);
      this.shutdownTimeout = null;
    }

    this.emit('monitor:stopped');
  }

  private startHealthChecks() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('Health check failed', { error: (error as Error).message }, error as Error);
      }
    }, this.config.healthCheckInterval);
  }

  private startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      this.collectAndAnalyzeMetrics();
    }, 30000); // 每30秒收集一次指标
  }

  private startShutdownMonitoring() {
    // 监控优雅关闭超时
    this.shutdownTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, 30000); // 30秒超时
  }

  private setupSignalHandlers() {
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);
      this.gracefulShutdown(signal);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Node.js 专用重启信号

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception detected', { error: error.message }, error);
      this.handleCriticalError('uncaughtException', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', { reason: reason.toString(), promise: promise.toString() });
      this.handleCriticalError('unhandledRejection', new Error(reason.toString()));
    });

    process.on('warning', (warning) => {
      logger.warn('Node.js warning', { warning: warning.name, message: warning.message });
    });
  }

  private async performHealthCheck() {
    try {
      const healthStatus = await healthMonitor.getHealthStatus();
      
      this.emit('health:check', healthStatus);

      // 检查整体健康状态
      if (healthStatus.status === 'unhealthy') {
        const criticalAlerts = healthStatus.alerts.filter(alert => alert.severity === 'critical');
        
        if (criticalAlerts.length > 0 && this.config.enableAutoRestart) {
          await this.triggerRestart({
            type: 'health-check-failed',
            description: `Health check failed: ${criticalAlerts.map(a => a.message).join(', ')}`,
            timestamp: new Date().toISOString(),
            healthStatus
          });
        }
      }

      // 检查内存使用
      if (this.isMemoryUsageHigh()) {
        logger.warn('High memory usage detected', {
          memoryUsage: healthStatus.metrics.memoryUsage,
          threshold: this.config.memoryThreshold
        });

        if (this.shouldRestartDueToMemory() && this.config.enableAutoRestart) {
          await this.triggerRestart({
            type: 'memory-leak',
            description: 'High memory usage beyond threshold',
            timestamp: new Date().toISOString(),
            healthStatus
          });
        }
      }

    } catch (error) {
      logger.error('Health check monitoring error', { error: (error as Error).message }, error as Error);
    }
  }

  private collectAndAnalyzeMetrics() {
    try {
      const metrics = this.getCurrentMetrics();
      this.lastMetrics = metrics;

      this.emit('metrics:collected', metrics);

      // 检查CPU使用率
      if (this.isCpuUsageHigh(metrics)) {
        logger.warn('High CPU usage detected', {
          cpuUsage: metrics.cpuUsage,
          threshold: this.config.cpuThreshold
        });

        if (this.shouldRestartDueToCpu() && this.config.enableAutoRestart) {
          this.triggerRestart({
            type: 'cpu-overload',
            description: 'CPU usage beyond threshold',
            timestamp: new Date().toISOString(),
            metrics
          });
        }
      }

      // 检查运行时间（定期重启）
      if (this.shouldGracefulRestart()) {
        this.triggerRestart({
          type: 'graceful-shutdown',
          description: 'Scheduled graceful restart after max uptime',
          timestamp: new Date().toISOString(),
          metrics
        });
      }

    } catch (error) {
      logger.error('Metrics collection error', { error: (error as Error).message }, error as Error);
    }
  }

  private getCurrentMetrics(): ProcessMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      uptime: process.uptime(),
      memoryUsage: memUsage,
      cpuUsage,
      eventLoopDelay: this.measureEventLoopDelay(),
      handlesCount: (process as any)._getActiveHandles().length,
      requestsCount: (process as any)._getActiveRequests().length,
      activeHandles: (process as any)._getActiveHandles().length,
      activeRequests: (process as any)._getActiveRequests().length
    };
  }

  private measureEventLoopDelay(): number {
    const start = process.hrtime.bigint();
    
    return new Promise<number>((resolve) => {
      setImmediate(() => {
        const end = process.hrtime.bigint();
        resolve(Number(end - start) / 1000000); // 转换为毫秒
      });
    }).catch(() => 0);
  }

  private isMemoryUsageHigh(): boolean {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    return heapUsedMB > this.config.memoryThreshold;
  }

  private isCpuUsageHigh(metrics: ProcessMetrics): boolean {
    const cpuUsage = (metrics.cpuUsage.user + metrics.cpuUsage.system) / 1000000; // 转换为秒;
    const cpuPercentage = (cpuUsage / metrics.uptime) * 100;
    
    return cpuPercentage > this.config.cpuThreshold;
  }

  private shouldRestartDueToMemory(): boolean {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    return heapUsedMB > this.config.memoryThreshold * 1.5; // 150% 阈值;
  }

  private shouldRestartDueToCpu(): boolean {
    const cpuUsage = (this.lastMetrics?.cpuUsage.user || 0) + (this.lastMetrics?.cpuUsage.system || 0);
    const cpuPercentage = cpuUsage / 1000000 / (this.lastMetrics?.uptime || 1) * 100;
    
    return cpuPercentage > this.config.cpuThreshold * 1.2; // 120% 阈值;
  }

  private shouldGracefulRestart(): boolean {
    const uptimeHours = (Date.now() - this.startTime) / (1000 * 60 * 60);
    return uptimeHours > this.config.maxUptime;
  }

  private async triggerRestart(reason: RestartReason) {
    logger.warn('Triggering process restart', { reason });
    
    // 发送告警
    await this.sendRestartAlert(reason);

    // 记录重启历史
    this.emit('restart:triggered', reason);

    // 执行重启
    if (this.config.restartDelay > 0) {
      logger.info(`Restarting in ${this.config.restartDelay}ms`);
      setTimeout(() => {
        this.performRestart(reason);
      }, this.config.restartDelay);
    } else {
      this.performRestart(reason);
    }
  }

  private async performRestart(reason: RestartReason) {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    
    logger.info('Performing process restart', { reason });

    try {
      // 发送关闭信号给其他组件
      this.emit('shutdown:starting', reason);

      // 等待组件优雅关闭
      await this.waitForGracefulShutdown(10000);

      // 强制关闭
      process.exit(0);

    } catch (error) {
      logger.error('Restart failed, forcing exit', { error: (error as Error).message }, error as Error);
      process.exit(1);
    }
  }

  private async waitForGracefulShutdown(timeout: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        logger.warn('Graceful shutdown timeout, proceeding with force shutdown');
        resolve();
      }, timeout);

      // 监听 shutdown:completed 事件
      this.once('shutdown:completed', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  private async sendRestartAlert(reason: RestartReason) {
    const alertMessage = {
      service: 'telegram-bot',
      event: 'process_restart',
      reason: reason.type,
      description: reason.description,
      timestamp: reason.timestamp,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      lastMetrics: this.lastMetrics
    };

    logger.error('Process restart alert', alertMessage);

    // 发送到监控告警系统
    if (this.config.alertWebhook) {
      try {
        await fetch(this.config.alertWebhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(alertMessage)
        });
      } catch (error) {
        logger.error('Failed to send restart alert', { error: (error as Error).message }, error as Error);
      }
    }

    // 记录到错误追踪器
    errorTracker.recordError(`restart_${reason.type}`, new Error(reason.description));
  }

  private handleCriticalError(type: string, error: Error) {
    const reason: RestartReason = {
      type: 'health-check-failed',
      description: `Critical error: ${type} - ${error.message}`,
      timestamp: new Date().toISOString(),
      metrics: this.lastMetrics
    };

    if (this.config.enableAutoRestart) {
      this.triggerRestart(reason);
    } else {
      logger.error('Critical error detected, auto-restart disabled', { type, error: error.message }, error);
    }
  }

  // 手动重启
  public async manualRestart(reason: string = 'Manual restart') {
    const restartReason: RestartReason = {
      type: 'manual',
      description: reason,
      timestamp: new Date().toISOString(),
      metrics: this.lastMetrics
    };

    await this.triggerRestart(restartReason);
  }

  // 优雅关闭
  public async gracefulShutdown(signal: string) {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    
    logger.info('Starting graceful shutdown', { signal, uptime: process.uptime() });

    // 停止监控
    this.stopMonitoring();

    // 通知其他组件关闭
    this.emit('shutdown:starting', { signal, timestamp: new Date().toISOString() });

    try {
      // 等待其他组件关闭
      await this.waitForGracefulShutdown(20000);

      logger.info('Graceful shutdown completed');
      this.emit('shutdown:completed');

      process.exit(0);

    } catch (error) {
      logger.error('Graceful shutdown error', { error: (error as Error).message }, error as Error);
      process.exit(1);
    }
  }

  // 获取监控状态
  public getMonitoringStatus() {
    return {
      isMonitoring: this.healthCheckInterval !== null,
      uptime: Date.now() - this.startTime,
      config: this.config,
      lastMetrics: this.lastMetrics,
      processUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: this.lastMetrics?.cpuUsage,
      isShuttingDown: this.isShuttingDown
    };
  }

  // 更新配置
  public updateConfig(newConfig: Partial<MonitoringConfig>) {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    logger.info('Monitoring config updated', { 
      oldConfig, 
      newConfig: this.config 
    });

    // 重新启动监控（如果需要）
    if (this.healthCheckInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  // 获取重启历史（简化实现）
  public getRestartHistory() {
    // 在实际应用中，应该将重启历史存储到数据库或文件中
    return {
      totalRestarts: 0,
      lastRestart: null,
      averageUptime: 0
    };
  }

  // 健康状态检查（供外部调用）
  public async isHealthy(): Promise<boolean> {
    try {
      const healthStatus = await healthMonitor.getHealthStatus();
      return healthStatus.status === 'healthy';
    } catch (error) {
      logger.error('Health check failed in isHealthy', { error: (error as Error).message }, error as Error);
      return false;
    }
  }
}

export const processMonitor = new ProcessMonitor();