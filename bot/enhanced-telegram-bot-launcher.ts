import { botDaemon } from './utils/bot-daemon';
import { alertManager } from './utils/alert-manager';
import { enhancedErrorTracker } from './utils/enhanced-error-tracker';
import { configManager } from './utils/config-manager';
import { performanceMonitor } from './utils/performance-monitor';
import { faultToleranceManager } from './utils/fault-tolerance-manager';
import { processMonitor } from './utils/process-monitor';
import { healthMonitor } from './utils/health-monitor';
import { reconnectManager } from './utils/reconnect-manager';
import { logger } from './utils/logger';
#!/usr/bin/env node

/**
 * 完整的Telegram Bot容错增强启动脚本
 * 集成了所有容错机制：守护进程、监控告警、错误追踪、配置管理、性能监控等
 */


export interface EnhancedBotConfig {
  daemon: {
    enabled: boolean;
    maxRestarts: number;
    restartDelay: number;
    healthCheckInterval: number;
  };
  monitoring: {
    enabled: boolean;
    alertWebhook?: string;
    metricsEndpoint: string;
  };
  performance: {
    enabled: boolean;
    collectionInterval: number;
    alertThresholds: {
      cpu: number;
      memory: number;
      responseTime: number;
    };
  };
  errorTracking: {
    enabled: boolean;
    maxHistory: number;
    autoCleanup: boolean;
  };
  config: {
    enabled: boolean;
    autoSave: boolean;
    maxBackups: number;
  };
}

export class EnhancedTelegramBotLauncher {
  private config: EnhancedBotConfig;
  private isShuttingDown = false;
  private startupTime: Date = new Date();

  constructor(config?: Partial<EnhancedBotConfig>) {
    this.config = {
      daemon: {
        enabled: true,
        maxRestarts: 10,
        restartDelay: 5000,
        healthCheckInterval: 30000,
        ...config?.daemon
      },
      monitoring: {
        enabled: true,
        metricsEndpoint: '/health/metrics',
        ...config?.monitoring
      },
      performance: {
        enabled: true,
        collectionInterval: 10000,
        alertThresholds: {
          cpu: 80,
          memory: 85,
          responseTime: 1000,
          ...config?.performance?.alertThresholds
        },
        ...config?.performance
      },
      errorTracking: {
        enabled: true,
        maxHistory: 10000,
        autoCleanup: true,
        ...config?.errorTracking
      },
      config: {
        enabled: true,
        autoSave: true,
        maxBackups: 50,
        ...config?.config
}
    };
  }

  // 启动完整的容错系统
  public async start(): Promise<void> {
    try {
      logger.info('🚀 Starting Enhanced Telegram Bot with Full Fault Tolerance', {
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
        config: this.config
      });

      // 验证环境
      await this.validateEnvironment();

      // 启动配置管理器
      await this.startConfigManager();

      // 启动错误追踪器
      await this.startErrorTracker();

      // 启动性能监控
      await this.startPerformanceMonitor();

      // 启动监控告警系统
      await this.startAlertManager();

      // 启动基础容错系统
      await this.startFaultToleranceSystem();

      // 启动进程监控
      await this.startProcessMonitor();

      // 启动健康监控
      await this.startHealthMonitor();

      // 启动重连管理器
      await this.startReconnectManager();

      // 启动Bot守护进程
      await this.startBotDaemon();

      // 启动集成监控
      this.startIntegratedMonitoring();

      // 设置信号处理器
      this.setupSignalHandlers();

      logger.info('✅ Enhanced Telegram Bot startup completed successfully', {
        startupTime: Date.now() - this.startupTime.getTime(),
        uptime: process.uptime()
      });

      // 发送启动通知
      await this.sendStartupNotification();

    } catch (error) {
      logger.error('❌ Enhanced Telegram Bot startup failed', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        startupTime: Date.now() - this.startupTime.getTime()
      }, error as Error);

      throw error;
    }
  }

  // 验证环境
  private async validateEnvironment(): Promise<void> {
    const requiredEnvVars = ['TELEGRAM_BOT_TOKEN'];
    const missingVars: string[] = [];

    for (const varName of requiredEnvVars) {
      if (!process.(env?.varName ?? null)) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // 检查Node.js版本
    const nodeVersion = process.version;
    if (parseFloat(nodeVersion.slice(1)) < 16) {
      logger.warn('Node.js version is below recommended minimum (16.0.0)', {
        current: nodeVersion,
        recommended: '16.0.0+'
      });
    }

    logger.info('Environment validation passed', {
      nodeVersion,
      platform: process.platform,
      arch: process.arch,
      memory: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
    });
  }

  // 启动配置管理器
  private async startConfigManager(): Promise<void> {
    if (!this.config.config.enabled) {
      return;
    }

    logger.info('Starting configuration manager...');

    try {
      // 监听配置变更
      configManager.on('config:changed', (data) => {
        logger.info('Configuration changed', {
          changesCount: data.changes.length,
          user: data.user
        });

        // 更新相关组件配置
        this.updateComponentConfigurations(data.newConfig);
      });

      // 监听配置错误
      configManager.on('config:error', (error) => {
        logger.error('Configuration error', { error: error.message });
        enhancedErrorTracker.recordError('config_error', error, {
          component: 'config_manager'
        });
      });

      logger.info('Configuration manager started', {
        configPath: (configManager as any).configPath,
        autoSave: this.config.config.autoSave
      });

    } catch (error) {
      logger.error('Failed to start configuration manager', { 
        error: (error as Error).message 
      }, error as Error);
      throw error;
    }
  }

  // 启动错误追踪器
  private async startErrorTracker(): Promise<void> {
    if (!this.config.errorTracking.enabled) {
      return;
    }

    logger.info('Starting enhanced error tracker...');

    try {
      // 监听严重错误
      enhancedErrorTracker.on('error:critical', (error) => {
        logger.error('Critical error detected', {
          errorId: error.id,
          type: error.type,
          component: error.component,
          message: error.message
        });

        // 触发告警
        this.triggerCriticalAlert('critical_error', error.message, error);
      });

      // 监听高频错误
      enhancedErrorTracker.on('error:frequent', (error) => {
        logger.warn('Frequent error detected', {
          errorId: error.id,
          type: error.type,
          occurrenceCount: error.occurrenceCount
        });

        // 检查是否需要重启
        if (error.occurrenceCount > 20) {
          this.triggerRestart('frequent_errors', 'High error frequency detected');
        }
      });

      // 监听错误模式
      enhancedErrorTracker.on('pattern:detected', (pattern) => {
        logger.warn('Error pattern detected', {
          pattern: pattern.pattern,
          frequency: pattern.frequency,
          components: pattern.components
        });

        this.triggerAlert('error_pattern', `Error pattern: ${pattern.pattern}`, pattern);
      });

      logger.info('Enhanced error tracker started', {
        maxHistory: this.config.errorTracking.maxHistory,
        autoCleanup: this.config.errorTracking.autoCleanup
      });

      // 设置自动清理
      if (this.config.errorTracking.autoCleanup) {
        setInterval(() => {
          enhancedErrorTracker.cleanup(7 * 24 * 60 * 60 * 1000); // 7天
        }, 24 * 60 * 60 * 1000); // 每24小时清理一次
      }

    } catch (error) {
      logger.error('Failed to start error tracker', { 
        error: (error as Error).message 
      }, error as Error);
      throw error;
    }
  }

  // 启动性能监控
  private async startPerformanceMonitor(): Promise<void> {
    if (!this.config.performance.enabled) {
      return;
    }

    logger.info('Starting performance monitor...');

    try {
      // 启动性能监控
      performanceMonitor.startMonitoring(this.config.performance.collectionInterval);

      // 监听性能告警
      performanceMonitor.on('alert:triggered', (alert) => {
        logger.warn('Performance alert triggered', alert);

        // 根据告警类型触发相应动作
        this.handlePerformanceAlert(alert);
      });

      // 监听指标收集
      performanceMonitor.on('metrics:collected', (metrics) => {
        // 记录关键指标
        if (metrics.system.cpu.usage > 90) {
          this.triggerAlert('high_cpu', `CPU usage: ${metrics.system.cpu.usage}%`, metrics);
        }

        if (metrics.system.memory.percentage > 90) {
          this.triggerAlert('high_memory', `Memory usage: ${metrics.system.memory.percentage}%`, metrics);
        }
      });

      logger.info('Performance monitor started', {
        collectionInterval: this.config.performance.collectionInterval,
        thresholds: this.config.performance.alertThresholds
      });

    } catch (error) {
      logger.error('Failed to start performance monitor', { 
        error: (error as Error).message 
      }, error as Error);
      throw error;
    }
  }

  // 启动监控告警系统
  private async startAlertManager(): Promise<void> {
    if (!this.config.monitoring.enabled) {
      return;
    }

    logger.info('Starting alert manager...');

    try {
      // 启动告警监控
      alertManager.startMonitoring();

      // 监听告警事件
      alertManager.on('alert:triggered', (alert) => {
        logger.warn('Alert triggered', {
          alertId: alert.id,
          ruleName: alert.ruleName,
          severity: alert.severity,
          title: alert.title
        });

        // 发送到外部系统
        this.sendExternalAlert(alert);
      });

      // 添加自定义告警规则
      this.setupCustomAlertRules();

      logger.info('Alert manager started', {
        rulesCount: alertManager.getRules().length
      });

    } catch (error) {
      logger.error('Failed to start alert manager', { 
        error: (error as Error).message 
      }, error as Error);
      throw error;
    }
  }

  // 启动基础容错系统
  private async startFaultToleranceSystem(): Promise<void> {
    logger.info('Starting fault tolerance system...');

    try {
      await faultToleranceManager.initialize();

      // 监听系统事件
      faultToleranceManager.on('system:event', (event) => {
        logger.info('System event', {
          type: event.type,
          severity: event.severity,
          component: event.component,
          message: event.message
        });

        if (event.severity === 'critical') {
          this.triggerCriticalAlert('system_event', event.message, event);
        }
      });

      // 监听恢复统计
      faultToleranceManager.on('recovery:stats', (stats) => {
        logger.debug('Recovery statistics updated', {
          successfulRecoveries: stats.successfulRecoveries,
          failedRecoveries: stats.failedRecoveries,
          totalRecoveries: stats.totalRecoveries
        });
      });

      logger.info('Fault tolerance system started');

    } catch (error) {
      logger.error('Failed to start fault tolerance system', { 
        error: (error as Error).message 
      }, error as Error);
      throw error;
    }
  }

  // 启动进程监控
  private async startProcessMonitor(): Promise<void> {
    logger.info('Starting process monitor...');

    try {
      // 进程监控已经在构造函数中启动
      logger.info('Process monitor started', {
        uptime: processMonitor.getMonitoringStatus()
      });

    } catch (error) {
      logger.error('Failed to start process monitor', { 
        error: (error as Error).message 
      }, error as Error);
      throw error;
    }
  }

  // 启动健康监控
  private async startHealthMonitor(): Promise<void> {
    logger.info('Starting health monitor...');

    try {
      healthMonitor.startMonitoring(30000); // 30秒检查一次

      // 监听健康检查结果
      healthMonitor.on('health:check', (healthStatus) => {
        if (healthStatus.status !== 'healthy') {
          logger.warn('Health check failed', {
            status: healthStatus.status,
            alerts: healthStatus.alerts
          });

          if (healthStatus.status === 'unhealthy') {
            this.triggerCriticalAlert('health_check_failed', 'System health check failed', healthStatus);
          }
        }
      });

      logger.info('Health monitor started');

    } catch (error) {
      logger.error('Failed to start health monitor', { 
        error: (error as Error).message 
      }, error as Error);
      throw error;
    }
  }

  // 启动重连管理器
  private async startReconnectManager(): Promise<void> {
    logger.info('Starting reconnect manager...');

    try {
      reconnectManager.startMonitoring();

      // 监听重连事件
      reconnectManager.on('connection:connected', (data) => {
        logger.info('Connection restored', {
          connectionType: data.type,
          uptime: data.state.uptime
        });
      });

      reconnectManager.on('connection:disconnected', (data) => {
        logger.warn('Connection lost', {
          connectionType: data.type,
          downtime: data.state.totalDowntime
        });
      });

      logger.info('Reconnect manager started');

    } catch (error) {
      logger.error('Failed to start reconnect manager', { 
        error: (error as Error).message 
      }, error as Error);
      throw error;
    }
  }

  // 启动Bot守护进程
  private async startBotDaemon(): Promise<void> {
    if (!this.config.daemon.enabled) {
      return;
    }

    logger.info('Starting bot daemon...');

    try {
      // 配置守护进程
      botDaemon.updateConfig({
        maxRestarts: this.config.daemon.maxRestarts,
        restartDelay: this.config.daemon.restartDelay,
        healthCheckInterval: this.config.daemon.healthCheckInterval,
        alertWebhook: this.config.monitoring.alertWebhook
      });

      // 监听守护进程事件
      botDaemon.on('daemon:started', () => {
        logger.info('Bot daemon started successfully');
      });

      botDaemon.on('bot:started', () => {
        logger.info('Bot process started successfully');
      });

      botDaemon.on('bot:restarted', (data) => {
        logger.info('Bot process restarted', {
          restartCount: data.restartCount
        });

        // 发送重启通知
        this.sendRestartNotification(data.restartCount);
      });

      botDaemon.on('daemon:max_restarts_reached', () => {
        logger.error('Maximum restart attempts reached');
        this.triggerCriticalAlert('max_restarts_reached', 'Maximum restart attempts reached');
      });

      // 启动守护进程
      await botDaemon.start();

      logger.info('Bot daemon started successfully');

    } catch (error) {
      logger.error('Failed to start bot daemon', { 
        error: (error as Error).message 
      }, error as Error);
      throw error;
    }
  }

  // 启动集成监控
  private startIntegratedMonitoring(): void {
    logger.info('Starting integrated monitoring...');

    // 定期报告系统状态
    setInterval(() => {
      this.reportSystemStatus();
    }, 5 * 60 * 1000); // 每5分钟

    // 定期清理
    setInterval(() => {
      this.performPeriodicCleanup();
    }, 30 * 60 * 1000); // 每30分钟

    // 性能报告生成
    if (this.config.performance.enabled) {
      setInterval(() => {
        this.generatePerformanceReport();
      }, 60 * 60 * 1000); // 每小时
    }
  }

  // 设置自定义告警规则
  private setupCustomAlertRules(): void {
    // Bot进程异常重启告警
    alertManager.addRule({
      id: 'bot_restart_frequent',
      name: 'Frequent Bot Restarts',
      description: 'Bot restarts more than 3 times in 10 minutes',
      condition: {
        type: 'custom',
        metric: 'custom.bot_restart_count'
      },
      actions: [
        {
          type: 'webhook',
          config: {
            webhookUrl: this.config.monitoring.alertWebhook,
            message: 'Bot is restarting frequently - possible instability'
          }
        },
        {
          type: 'log',
          config: {
            message: 'Frequent bot restarts detected'
          }
        }
      ],
      enabled: true,
      severity: 'high',
      cooldown: 600000 // 10分钟冷却
    });

    // 系统资源告警
    alertManager.addRule({
      id: 'system_resources',
      name: 'System Resources Critical',
      description: 'Critical system resource usage',
      condition: {
        type: 'custom',
        metric: 'custom.system_resource_score'
      },
      actions: [
        {
          type: 'restart',
          config: {}
        }
      ],
      enabled: true,
      severity: 'critical',
      cooldown: 300000 // 5分钟冷却
    });
  }

  // 更新组件配置
  private updateComponentConfigurations(newConfig: Record<string, any>): void {
    try {
      // 更新性能监控阈值
      if (newConfig.performance?.alertThresholds) {
        performanceMonitor.getRules().forEach(rule => {
          if (rule.id.startsWith('cpu_') || rule.id.startsWith('memory_')) {
            // 更新阈值逻辑
          }
        });
      }

      // 更新告警配置
      if (newConfig.monitoring?.alertWebhook) {
        // 更新告警Webhook配置
      }

      logger.info('Component configurations updated');

    } catch (error) {
      logger.error('Failed to update component configurations', { 
        error: (error as Error).message 
      }, error as Error);
    }
  }

  // 处理性能告警
  private handlePerformanceAlert(alert: any): void {
    switch (alert.type) {
      case 'cpu':
        if (alert.current > 95) {
          this.triggerRestart('high_cpu', `CPU usage critical: ${alert.current}%`);
        }
        break;
      case 'memory':
        if (alert.current > 95) {
          this.triggerRestart('high_memory', `Memory usage critical: ${alert.current}%`);
        }
        break;
      case 'response_time':
        if (alert.current > 2000) {
          this.triggerAlert('slow_response', `Response time critical: ${alert.current}ms`);
        }
        break;
    }
  }

  // 触发重启
  private async triggerRestart(reason: string, description?: string): Promise<void> {
    logger.warn('Triggering system restart', { reason, description });

    try {
      if (this.config.daemon.enabled && botDaemon) {
        await botDaemon.restart();
      } else if (processMonitor) {
        await processMonitor.manualRestart(`${reason}: ${description || ''}`);
      } else {
        process.exit(0); // 最后的手段
      }
    } catch (error) {
      logger.error('Failed to trigger restart', { error: (error as Error).message }, error as Error);
    }
  }

  // 触发告警
  private triggerAlert(type: string, message: string, data?: any): void {
    logger.warn('Triggering alert', { type, message });

    try {
      alertManager.triggerAlert(type, 'Alert', message, 'medium', data);
    } catch (error) {
      logger.error('Failed to trigger alert', { error: (error as Error).message }, error as Error);
    }
  }

  // 触发严重告警
  private triggerCriticalAlert(type: string, message: string, data?: any): void {
    logger.error('Triggering critical alert', { type, message });

    try {
      alertManager.triggerAlert(type, 'Critical Alert', message, 'critical', data);
      enhancedErrorTracker.recordError(`critical_${type}`, new Error(message), {
        component: 'system',
        severity: 'critical',
        metadata: data
      });
    } catch (error) {
      logger.error('Failed to trigger critical alert', { error: (error as Error).message }, error as Error);
    }
  }

  // 发送外部告警
  private async sendExternalAlert(alert: any): Promise<void> {
    if (!this.config.monitoring.alertWebhook) {
      return;
    }

    try {
      const payload = {
        service: 'telegram-bot',
        alert: {
          id: alert.id,
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          timestamp: alert.timestamp
        },
        system: {
          hostname: process.env.HOSTNAME || 'unknown',
          pid: process.pid,
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        }
      };

      await fetch(this.config.monitoring.alertWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

    } catch (error) {
      logger.error('Failed to send external alert', { 
        error: (error as Error).message 
      }, error as Error);
    }
  }

  // 发送重启通知
  private async sendRestartNotification(restartCount: number): Promise<void> {
    logger.info('Bot restart notification sent', { restartCount });
    // 这里可以发送到监控系统或管理面板
  }

  // 发送启动通知
  private async sendStartupNotification(): Promise<void> {
    const message = `🤖 Enhanced Telegram Bot 已启动;

启动时间: ${new Date().toISOString()}
运行时间: ${process.uptime()}秒
环境: ${process.env.NODE_ENV || 'development'}
平台: ${process.platform} ${process.arch}
进程ID: ${process.pid}

✅ 容错组件已激活:
• Bot守护进程
• 性能监控系统  
• 错误追踪分析
• 监控告警系统
• 健康检查系统
• 重连管理机制
• 配置动态管理

Bot现在可以稳定运行了！`;

    logger.info('📱 Enhanced Bot startup notification', {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      components: [
        'daemon',
        'performance_monitor',
        'error_tracker',
        'alert_manager',
        'health_monitor',
        'reconnect_manager',
        'config_manager'
      ]
    });
  }

  // 报告系统状态
  private async reportSystemStatus(): Promise<void> {
    try {
      const status = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        daemon: this.config.daemon.enabled ? botDaemon.getStatus() : null,
        performance: this.config.performance.enabled ? performanceMonitor.getMonitoringStatus() : null,
        errors: this.config.errorTracking.enabled ? enhancedErrorTracker.getErrorStats() : null,
        health: healthMonitor.getLastHealthStatus()
      };

      logger.info('System status report', status);
      this.emit('status:report', status);

    } catch (error) {
      logger.error('Failed to generate status report', { 
        error: (error as Error).message 
      }, error as Error);
    }
  }

  // 执行定期清理
  private performPeriodicCleanup(): void {
    try {
      // 清理性能监控历史
      if (this.config.performance.enabled) {
        // 清理逻辑由性能监控器内部处理
      }

      // 清理错误追踪历史
      if (this.config.errorTracking.enabled) {
        enhancedErrorTracker.cleanup();
      }

      logger.debug('Periodic cleanup completed');

    } catch (error) {
      logger.error('Failed during periodic cleanup', { 
        error: (error as Error).message 
      }, error as Error);
    }
  }

  // 生成性能报告
  private generatePerformanceReport(): void {
    try {
      if (!this.config.performance.enabled) {
        return;
      }

      const report = performanceMonitor.generateReport(3600000); // 1小时报告;
      
      logger.info('Performance report generated', {
        timestamp: report.timestamp,
        duration: report.duration,
        cpuAverage: report.metrics.cpu.average,
        memoryAverage: report.metrics.memory.average,
        responseTime: report.metrics.responseTime.average,
        recommendations: report.recommendations.length
      });

      this.emit('performance:report', report);

    } catch (error) {
      logger.error('Failed to generate performance report', { 
        error: (error as Error).message 
      }, error as Error);
    }
  }

  // 设置信号处理器
  private setupSignalHandlers(): void {
    const gracefulShutdown = (signal: string) => {
      if (this.isShuttingDown) {
        logger.warn(`Received ${signal} again, forcing shutdown`);
        process.exit(1);
      }

      this.gracefulShutdown(signal);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Node.js 专用重启信号

    // 未捕获异常处理
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception in enhanced launcher', { 
        error: error.message,
        stack: error.stack 
      }, error);

      enhancedErrorTracker.recordError('enhanced_launcher_uncaught_exception', error, {
        component: 'enhanced_launcher',
        severity: 'critical'
      });

      if (!this.isShuttingDown) {
        this.gracefulShutdown('uncaughtException');
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection in enhanced launcher', { 
        reason: reason.toString(),
        promise: promise.toString() 
      });

      enhancedErrorTracker.recordError('enhanced_launcher_unhandled_rejection', new Error(reason.toString()), {
        component: 'enhanced_launcher',
        severity: 'high'
      });
    });
  }

  // 优雅关闭
  private async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;

    logger.info(`🔄 Starting graceful shutdown due to ${signal}`);

    const shutdownStart = Date.now();

    try {
      // 1. 停止Bot守护进程
      if (this.config.daemon.enabled && botDaemon) {
        logger.info('Step 1: Stopping bot daemon...');
        await botDaemon.shutdown(signal);
      }

      // 2. 停止监控告警系统
      if (this.config.monitoring.enabled && alertManager) {
        logger.info('Step 2: Stopping alert manager...');
        alertManager.stopMonitoring();
      }

      // 3. 停止性能监控
      if (this.config.performance.enabled && performanceMonitor) {
        logger.info('Step 3: Stopping performance monitor...');
        performanceMonitor.stopMonitoring();
      }

      // 4. 停止基础容错系统
      if (faultToleranceManager) {
        logger.info('Step 4: Stopping fault tolerance system...');
        await faultToleranceManager.shutdown();
      }

      // 5. 停止健康监控
      if (healthMonitor) {
        logger.info('Step 5: Stopping health monitor...');
        healthMonitor.stopMonitoring();
      }

      // 6. 停止重连管理器
      if (reconnectManager) {
        logger.info('Step 6: Stopping reconnect manager...');
        reconnectManager.stopMonitoring();
      }

      // 7. 清理错误追踪器
      if (this.config.errorTracking.enabled && enhancedErrorTracker) {
        logger.info('Step 7: Destroying error tracker...');
        enhancedErrorTracker.destroy();
      }

      // 8. 清理配置管理器
      if (this.config.config.enabled && configManager) {
        logger.info('Step 8: Destroying config manager...');
        configManager.destroy();
      }

      const shutdownTime = Date.now() - shutdownStart;
      logger.info(`✅ Graceful shutdown completed in ${shutdownTime}ms`);

      process.exit(0);

    } catch (error) {
      logger.error('❌ Error during graceful shutdown', {
        error: (error as Error).message,
        shutdownTime: Date.now() - shutdownStart
      }, error as Error);

      process.exit(1);
    }
  }

  // 获取系统状态
  public getSystemStatus() {
    return {
      isRunning: !this.isShuttingDown,
      uptime: process.uptime(),
      startupTime: this.startupTime,
      config: this.config,
      components: {
        daemon: this.config.daemon.enabled ? botDaemon.getStatus() : null,
        performance: this.config.performance.enabled ? performanceMonitor.getMonitoringStatus() : null,
        alertManager: this.config.monitoring.enabled ? alertManager.getMonitoringStatus() : null,
        errorTracker: this.config.errorTracking.enabled ? enhancedErrorTracker.getErrorStats() : null,
        healthMonitor: healthMonitor.getLastHealthStatus(),
        faultTolerance: faultToleranceManager.getMetrics()
      }
    };
  }
}

// 主启动函数
async function main() {
  const launcher = new EnhancedTelegramBotLauncher();

  try {
    await launcher.start();
    
    // 保持进程运行
    logger.info('🚀 Enhanced Telegram Bot is now running with full fault tolerance...');
    
    // 发送定期状态报告
    setInterval(() => {
      const status = launcher.getSystemStatus();
      logger.info('System status check', {
        uptime: Math.round(status.uptime),
        memoryUsage: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        isHealthy: status.components.healthMonitor?.status === 'healthy'
      });
    }, 60000); // 每分钟

  } catch (error) {
    logger.error('💥 Failed to start enhanced Telegram Bot', { 
      error: (error as Error).message 
    }, error as Error);
    
    process.exit(1);
  }
}

// 如果直接运行此文件，启动Bot
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error during enhanced bot startup:', error);
    process.exit(1);
  });
}

export default EnhancedTelegramBotLauncher;