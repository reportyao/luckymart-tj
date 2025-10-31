/**
 * 增强的监控告警系统
 * 实时监控系统状态，及时发现问题并发送告警
 */

import { EventEmitter } from 'events';
import { logger, errorTracker } from './logger';
import { healthMonitor, HealthStatus } from './health-monitor';
import { processMonitor } from './process-monitor';
import { faultToleranceManager } from './fault-tolerance-manager';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  actions: AlertAction[];
  enabled: boolean;
  severity: AlertSeverity;
  cooldown: number; // 告警冷却时间（毫秒）
  lastTriggered?: Date;
}

export interface AlertCondition {
  type: 'metric' | 'health' | 'log' | 'custom';
  metric?: string;
  operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
  threshold: number;
  duration?: number; // 持续时间
}

export interface AlertAction {
  type: 'webhook' | 'email' | 'telegram' | 'log' | 'restart';
  config: {
    webhookUrl?: string;
    email?: string;
    telegramChatId?: string;
    message?: string;
  };
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  data?: Record<string, any>;
}

export interface MonitoringMetrics {
  timestamp: string;
  system: SystemMetrics;
  application: ApplicationMetrics;
  custom: Record<string, any>;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    load: number[];
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
    free: number;
  };
  network: {
    bytesSent: number;
    bytesReceived: number;
    packetsSent: number;
    packetsReceived: number;
    errorsIn: number;
    errorsOut: number;
  };
}

export interface ApplicationMetrics {
  uptime: number;
  restartCount: number;
  errorCount: number;
  requestCount: number;
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  eventLoopDelay: number;
  activeHandles: number;
  activeRequests: number;
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export class AlertManager extends EventEmitter {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private metricsHistory: MonitoringMetrics[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private maxMetricsHistory = 1000;

  constructor() {
    super();
    this.setupDefaultRules();
  }

  // 启动监控
  public startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    logger.info('Starting alert monitoring system');

    // 启动指标收集
    this.startMetricsCollection();

    // 启动告警检查
    this.startAlertChecking();

    // 启动健康检查集成
    this.startHealthCheckIntegration();

    this.emit('monitoring:started');
  }

  // 停止监控
  public stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    logger.info('Alert monitoring system stopped');
    this.emit('monitoring:stopped');
  }

  // 添加告警规则
  public addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    logger.info('Alert rule added', { ruleId: rule.id, name: rule.name });
  }

  // 移除告警规则
  public removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    logger.info('Alert rule removed', { ruleId });
  }

  // 获取所有规则
  public getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  // 获取活跃告警
  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  // 解决告警
  public resolveAlert(alertId: string, resolvedBy: string = 'system'): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      
      // 记录解决事件
      logger.info('Alert resolved', { 
        alertId, 
        ruleName: alert.ruleName, 
        resolvedBy 
      });

      // 更新规则状态
      const rule = this.rules.get(alert.ruleId);
      if (rule) {
        rule.lastTriggered = new Date();
      }

      this.emit('alert:resolved', alert);
    }
  }

  // 手动触发告警
  public triggerAlert(
    ruleId: string,
    title: string,
    message: string,
    severity: AlertSeverity,
    data?: Record<string, any>
  ): void {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      logger.warn('Alert rule not found', { ruleId });
      return;
    }

    // 检查冷却时间
    if (rule.lastTriggered) {
      const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
      if (timeSinceLastTrigger < rule.cooldown) {
        logger.debug('Alert rule in cooldown', { 
          ruleId, 
          timeRemaining: rule.cooldown - timeSinceLastTrigger 
        });
        return;
      }
    }

    // 创建告警
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId,
      ruleName: rule.name,
      severity,
      title,
      message,
      timestamp: new Date().toISOString(),
      resolved: false,
      data
    };

    // 添加到活跃告警
    this.activeAlerts.set(alert.id, alert);

    // 更新规则状态
    rule.lastTriggered = new Date();

    // 执行告警动作
    this.executeAlertActions(alert, rule);

    // 发送事件
    this.emit('alert:triggered', alert);
    logger.warn('Alert triggered', { 
      alertId: alert.id, 
      ruleName: rule.name, 
      severity, 
      title 
    });
  }

  // 执行告警动作
  private async executeAlertActions(alert: Alert, rule: AlertRule): Promise<void> {
    for (const action of rule.actions) {
      try {
        await this.executeAction(action, alert);
      } catch (error) {
        logger.error('Alert action execution failed', {
          actionType: action.type,
          alertId: alert.id,
          error: (error as Error).message
        }, error as Error);
      }
    }
  }

  // 执行单个动作
  private async executeAction(action: AlertAction, alert: Alert): Promise<void> {
    switch (action.type) {
      case 'webhook':
        await this.executeWebhookAction(action, alert);
        break;
      case 'log':
        this.executeLogAction(action, alert);
        break;
      case 'restart':
        await this.executeRestartAction(action, alert);
        break;
      case 'telegram':
        await this.executeTelegramAction(action, alert);
        break;
      case 'email':
        await this.executeEmailAction(action, alert);
        break;
    }
  }

  // 执行Webhook动作
  private async executeWebhookAction(action: AlertAction, alert: Alert): Promise<void> {
    const webhookUrl = action.config.webhookUrl;
    if (!webhookUrl) {
      logger.warn('Webhook URL not configured', { actionType: action.type });
      return;
    }

    const payload = {
      alert: {
        id: alert.id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        timestamp: alert.timestamp,
        ruleName: alert.ruleName
      },
      system: {
        hostname: process.env.HOSTNAME || 'unknown',
        pid: process.pid,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
      }

      logger.debug('Alert webhook sent successfully', { alertId: alert.id });
    } catch (error) {
      logger.error('Failed to send alert webhook', {
        alertId: alert.id,
        webhookUrl,
        error: (error as Error).message
      }, error as Error);
    }
  }

  // 执行日志动作
  private executeLogAction(action: AlertAction, alert: Alert): void {
    const message = action.config.message || alert.message;
    
    switch (alert.severity) {
      case 'critical':
      case 'high':
        logger.error(`[ALERT] ${alert.title}: ${message}`, alert.data);
        break;
      case 'medium':
        logger.warn(`[ALERT] ${alert.title}: ${message}`, alert.data);
        break;
      case 'low':
        logger.info(`[ALERT] ${alert.title}: ${message}`, alert.data);
        break;
    }
  }

  // 执行重启动作
  private async executeRestartAction(action: AlertAction, alert: Alert): Promise<void> {
    logger.warn('Alert triggered restart action', { alertId: alert.id });
    
    try {
      // 通知进程监控器执行重启
      await processMonitor.manualRestart(`Alert triggered restart: ${alert.title}`);
    } catch (error) {
      logger.error('Failed to execute restart action', {
        alertId: alert.id,
        error: (error as Error).message
      }, error as Error);
    }
  }

  // 执行Telegram动作
  private async executeTelegramAction(action: AlertAction, alert: Alert): Promise<void> {
    const chatId = action.config.telegramChatId;
    const message = action.config.message || `🚨 ${alert.title}\n\n${alert.message}`;
    
    if (!chatId) {
      logger.warn('Telegram chat ID not configured', { actionType: action.type });
      return;
    }

    try {
      // 这里需要集成Telegram Bot发送消息
      // 暂时记录日志
      logger.info('Alert Telegram notification prepared', {
        alertId: alert.id,
        chatId,
        message
      });
    } catch (error) {
      logger.error('Failed to send Telegram alert', {
        alertId: alert.id,
        error: (error as Error).message
      }, error as Error);
    }
  }

  // 执行邮件动作
  private async executeEmailAction(action: AlertAction, alert: Alert): Promise<void> {
    const email = action.config.email;
    const message = action.config.message || `Alert: ${alert.title}\n\n${alert.message}`;
    
    if (!email) {
      logger.warn('Email address not configured', { actionType: action.type });
      return;
    }

    try {
      // 这里需要集成邮件发送服务
      // 暂时记录日志
      logger.info('Alert email notification prepared', {
        alertId: alert.id,
        email,
        subject: `Alert: ${alert.title}`,
        message
      });
    } catch (error) {
      logger.error('Failed to send email alert', {
        alertId: alert.id,
        error: (error as Error).message
      }, error as Error);
    }
  }

  // 启动指标收集
  private startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000); // 每30秒收集一次
  }

  // 收集指标
  private collectMetrics() {
    try {
      const metrics: MonitoringMetrics = {
        timestamp: new Date().toISOString(),
        system: this.collectSystemMetrics(),
        application: this.collectApplicationMetrics(),
        custom: this.collectCustomMetrics()
      };

      // 保存指标历史
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > this.maxMetricsHistory) {
        this.metricsHistory = this.metricsHistory.slice(-this.maxMetricsHistory);
      }

      this.emit('metrics:collected', metrics);
      
    } catch (error) {
      logger.error('Failed to collect metrics', { error: (error as Error).message }, error as Error);
    }
  }

  // 收集系统指标
  private collectSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      cpu: {
        usage: (cpuUsage.user + cpuUsage.system) / 1000000, // 转换为秒
        load: process.platform !== 'win32' ? process.loadavg() : [0, 0, 0],
        cores: require('os').cpus().length
      },
      memory: {
        used: memUsage.rss,
        total: memUsage.rss + (2 * 1024 * 1024 * 1024), // 估算总内存
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      },
      disk: {
        used: 0, // 简化处理
        total: 100 * 1024 * 1024 * 1024, // 100GB 估算
        percentage: 0,
        free: 0
      },
      network: {
        bytesSent: 0, // 简化处理
        bytesReceived: 0,
        packetsSent: 0,
        packetsReceived: 0,
        errorsIn: 0,
        errorsOut: 0
      }
    };
  }

  // 收集应用指标
  private collectApplicationMetrics(): ApplicationMetrics {
    return {
      uptime: process.uptime(),
      restartCount: 0, // 从容错管理器获取
      errorCount: errorTracker.getErrorStats().totalErrors,
      requestCount: 0, // 简化处理
      responseTime: 0, // 简化处理
      memoryUsage: process.memoryUsage(),
      eventLoopDelay: this.measureEventLoopDelay(),
      activeHandles: (process as any)._getActiveHandles().length,
      activeRequests: (process as any)._getActiveRequests().length
    };
  }

  // 收集自定义指标
  private collectCustomMetrics(): Record<string, any> {
    const systemStatus = faultToleranceManager.getMetrics();
    
    return {
      systemEvents: systemStatus.systemEvents.total,
      messageQueueSize: systemStatus.messageQueue.queueLength,
      recoveryStats: systemStatus.recoveryStats
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
    }).catch(() => 0);
  }

  // 启动告警检查
  private startAlertChecking() {
    this.monitoringInterval = setInterval(() => {
      this.checkAlertRules();
    }, 10000); // 每10秒检查一次
  }

  // 检查告警规则
  private checkAlertRules() {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) {
        continue;
      }

      this.evaluateRule(rule);
    }
  }

  // 评估规则
  private evaluateRule(rule: AlertRule): void {
    try {
      let shouldTrigger = false;

      switch (rule.condition.type) {
        case 'metric':
          shouldTrigger = this.evaluateMetricCondition(rule.condition);
          break;
        case 'health':
          shouldTrigger = this.evaluateHealthCondition(rule.condition);
          break;
        case 'log':
          shouldTrigger = this.evaluateLogCondition(rule.condition);
          break;
        case 'custom':
          shouldTrigger = this.evaluateCustomCondition(rule.condition);
          break;
      }

      if (shouldTrigger) {
        this.triggerAlert(
          rule.id,
          rule.name,
          rule.description,
          rule.severity,
          { ruleCondition: rule.condition }
        );
      }

    } catch (error) {
      logger.error('Failed to evaluate alert rule', {
        ruleId: rule.id,
        error: (error as Error).message
      }, error as Error);
    }
  }

  // 评估指标条件
  private evaluateMetricCondition(condition: AlertCondition): boolean {
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    if (!latestMetrics) return false;

    const metricValue = this.getMetricValue(latestMetrics, condition.metric || '');
    if (metricValue === undefined) return false;

    return this.compareValues(metricValue, condition.operator, condition.threshold);
  }

  // 评估健康条件
  private evaluateHealthCondition(condition: AlertCondition): boolean {
    // 简化实现，可以根据条件检查健康状态
    return false;
  }

  // 评估日志条件
  private evaluateLogCondition(condition: AlertCondition): boolean {
    // 简化实现，可以根据日志模式检查
    return false;
  }

  // 评估自定义条件
  private evaluateCustomCondition(condition: AlertCondition): boolean {
    // 简化实现，可以根据自定义逻辑检查
    return false;
  }

  // 获取指标值
  private getMetricValue(metrics: MonitoringMetrics, metricPath: string): number | undefined {
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

  // 比较值
  private compareValues(actual: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>': return actual > threshold;
      case '<': return actual < threshold;
      case '==': return actual === threshold;
      case '!=': return actual !== threshold;
      case '>=': return actual >= threshold;
      case '<=': return actual <= threshold;
      default: return false;
    }
  }

  // 启动健康检查集成
  private startHealthCheckIntegration() {
    healthMonitor.on('health:check', (healthStatus: HealthStatus) => {
      if (healthStatus.status === 'unhealthy') {
        const criticalAlerts = healthStatus.alerts.filter(alert => alert.severity === 'critical');
        
        if (criticalAlerts.length > 0) {
          this.triggerAlert(
            'health_check_failed',
            'System Health Check Failed',
            `Critical health issues detected: ${criticalAlerts.map(a => a.message).join(', ')}`,
            'critical',
            { healthStatus, alerts: criticalAlerts }
          );
        }
      }
    });
  }

  // 设置默认规则
  private setupDefaultRules() {
    // 高CPU使用率告警
    this.addRule({
      id: 'high_cpu_usage',
      name: 'High CPU Usage',
      description: 'CPU usage exceeds 80%',
      condition: {
        type: 'metric',
        metric: 'system.cpu.usage',
        operator: '>',
        threshold: 80,
        duration: 60000 // 持续1分钟
      },
      actions: [
        {
          type: 'log',
          config: { message: 'High CPU usage detected: {{value}}%' }
        }
      ],
      enabled: true,
      severity: 'medium',
      cooldown: 300000 // 5分钟冷却
    });

    // 高内存使用率告警
    this.addRule({
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      description: 'Memory usage exceeds 90%',
      condition: {
        type: 'metric',
        metric: 'system.memory.percentage',
        operator: '>',
        threshold: 90,
        duration: 30000 // 持续30秒
      },
      actions: [
        {
          type: 'log',
          config: { message: 'High memory usage detected: {{value}}%' }
        },
        {
          type: 'restart',
          config: {}
        }
      ],
      enabled: true,
      severity: 'high',
      cooldown: 600000 // 10分钟冷却
    });

    // 错误率过高告警
    this.addRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      description: 'Error rate exceeds 10%',
      condition: {
        type: 'metric',
        metric: 'application.errorCount',
        operator: '>',
        threshold: 10,
        duration: 60000
      },
      actions: [
        {
          type: 'log',
          config: { message: 'High error rate detected: {{value}} errors' }
        }
      ],
      enabled: true,
      severity: 'medium',
      cooldown: 300000
    });

    logger.info('Default alert rules configured', { count: this.rules.size });
  }

  // 获取监控状态
  public getMonitoringStatus() {
    return {
      isMonitoring: this.isMonitoring,
      activeAlerts: this.activeAlerts.size,
      rulesCount: this.rules.size,
      metricsHistorySize: this.metricsHistory.length,
      lastMetrics: this.metricsHistory[this.metricsHistory.length - 1]
    };
  }
}

// 单例模式的告警管理器
export const alertManager = new AlertManager();