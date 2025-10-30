/**
 * 容错管理器
 * 统一管理和协调所有容错组件
 */

import { EventEmitter } from 'events';
import { logger } from './logger';
import { healthMonitor, HealthStatus } from './health-monitor';
import { processMonitor, RestartReason } from './process-monitor';
import { MessageQueue, Message } from './message-queue';

export interface FaultToleranceConfig {
  enableHealthMonitoring: boolean;
  enableProcessMonitoring: boolean;
  enableMessageQueue: boolean;
  enableAutoRecovery: boolean;
  recoveryStrategies: RecoveryStrategy[];
  maxRetries: number;
  retryDelay: number;
}

export interface RecoveryStrategy {
  condition: string;
  action: 'restart' | 'retry' | 'fallback' | 'alert';
  maxAttempts: number;
  delay: number;
}

export interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical' | 'recovering';
  timestamp: string;
  uptime: number;
  components: {
    healthMonitor: ComponentStatus;
    processMonitor: ComponentStatus;
    messageQueue: ComponentStatus;
    database: ComponentStatus;
    telegram: ComponentStatus;
  };
  recentEvents: SystemEvent[];
  recoveryStats: RecoveryStats;
}

export interface ComponentStatus {
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  lastCheck: string;
  errorCount: number;
  uptime: number;
  details?: any;
}

export interface SystemEvent {
  id: string;
  type: 'recovery' | 'restart' | 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  message: string;
  timestamp: string;
  resolved?: boolean;
  recoveryAttempted?: boolean;
}

export interface RecoveryStats {
  totalRecoveries: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  averageRecoveryTime: number;
  lastRecovery?: {
    timestamp: string;
    component: string;
    duration: number;
    success: boolean;
  };
}

export class FaultToleranceManager extends EventEmitter {
  private config: FaultToleranceConfig;
  private messageQueue: MessageQueue;
  private systemEvents: SystemEvent[] = [];
  private recoveryStats: RecoveryStats = {
    totalRecoveries: 0,
    successfulRecoveries: 0,
    failedRecoveries: 0,
    averageRecoveryTime: 0
  };
  private isInitialized = false;

  constructor(config: Partial<FaultToleranceConfig> = {}) {
    super();

    this.config = {
      enableHealthMonitoring: true,
      enableProcessMonitoring: true,
      enableMessageQueue: true,
      enableAutoRecovery: true,
      recoveryStrategies: [
        {
          condition: 'database_connection_lost',
          action: 'retry',
          maxAttempts: 3,
          delay: 5000
        },
        {
          condition: 'memory_usage_high',
          action: 'restart',
          maxAttempts: 1,
          delay: 1000
        },
        {
          condition: 'telegram_api_error',
          action: 'retry',
          maxAttempts: 5,
          delay: 2000
        }
      ],
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };

    // 初始化消息队列
    this.messageQueue = new MessageQueue(10);
    this.setupEventHandlers();
  }

  // 初始化容错系统
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Fault tolerance manager already initialized');
      return;
    }

    try {
      logger.info('Initializing fault tolerance system', { config: this.config });

      // 启动各个组件
      await this.startComponents();

      // 设置事件监听
      this.setupComponentEventHandlers();

      this.isInitialized = true;
      
      logger.info('Fault tolerance system initialized successfully');
      this.emit('initialized');

    } catch (error) {
      logger.error('Failed to initialize fault tolerance system', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  private async startComponents() {
    const startupPromises = [];

    if (this.config.enableHealthMonitoring) {
      startupPromises.push(this.startHealthMonitoring());
    }

    if (this.config.enableProcessMonitoring) {
      startupPromises.push(this.startProcessMonitoring());
    }

    if (this.config.enableMessageQueue) {
      startupPromises.push(this.startMessageQueue());
    }

    await Promise.allSettled(startupPromises);
  }

  private async startHealthMonitoring() {
    try {
      healthMonitor.startMonitoring(30000); // 30秒检查一次
      logger.info('Health monitoring started');
    } catch (error) {
      logger.error('Failed to start health monitoring', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  private async startProcessMonitoring() {
    try {
      processMonitor.startMonitoring();
      logger.info('Process monitoring started');
    } catch (error) {
      logger.error('Failed to start process monitoring', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  private async startMessageQueue() {
    try {
      // 消息队列已经在构造函数中初始化，这里只需要设置事件监听
      logger.info('Message queue ready');
    } catch (error) {
      logger.error('Failed to start message queue', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  private setupEventHandlers() {
    // 监听消息队列事件
    this.messageQueue.on('message:error', (data) => {
      this.handleMessageError(data);
    });

    this.messageQueue.on('message:failed', (data) => {
      this.handleMessageFailure(data);
    });
  }

  private setupComponentEventHandlers() {
    // 健康监控事件
    healthMonitor.on('health:check', (healthStatus: HealthStatus) => {
      this.handleHealthCheck(healthStatus);
    });

    // 进程监控事件
    processMonitor.on('restart:triggered', (reason: RestartReason) => {
      this.handleProcessRestart(reason);
    });

    processMonitor.on('monitor:started', () => {
      this.addSystemEvent('info', 'medium', 'processMonitor', 'Process monitoring started');
    });
  }

  // 处理健康检查结果
  private handleHealthCheck(healthStatus: HealthStatus) {
    if (healthStatus.status !== 'healthy') {
      const alerts = healthStatus.alerts.filter(alert => alert.severity === 'critical');
      
      if (alerts.length > 0 && this.config.enableAutoRecovery) {
        this.triggerRecovery('health_check_failed', alerts.map(a => a.message).join(', '));
      }
    }
  }

  // 处理进程重启事件
  private handleProcessRestart(reason: RestartReason) {
    this.addSystemEvent('restart', 'high', 'processMonitor', 
      `Process restart triggered: ${reason.description}`);

    // 记录重启历史
    this.updateRecoveryStats('restart', true);
  }

  // 处理消息错误
  private handleMessageError(data: { messageId: string; error: Error; duration: number }) {
    const { messageId, error, duration } = data;
    
    logger.error('Message processing error', { 
      messageId, 
      error: error.message,
      duration 
    });

    this.addSystemEvent('error', 'medium', 'messageQueue', 
      `Message processing failed: ${error.message}`);

    // 根据错误类型决定恢复策略
    if (this.shouldTriggerRecovery(error.message)) {
      this.triggerRecovery('message_processing_error', error.message);
    }
  }

  // 处理消息失败
  private handleMessageFailure(data: { messageId: string; error: Error; message: Message }) {
    const { messageId, error, message } = data;
    
    logger.error('Message failed permanently', {
      messageId,
      type: message.type,
      attempts: message.attempts,
      error: error.message
    });

    this.addSystemEvent('error', 'high', 'messageQueue',
      `Message failed permanently: ${error.message}`);

    this.updateRecoveryStats('message_failure', false);
  }

  // 判断是否应该触发恢复
  private shouldTriggerRecovery(errorMessage: string): boolean {
    const errorPatterns = [
      'connection lost',
      'timeout',
      'memory',
      'telegram',
      'database'
    ];

    return errorPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern)
    );
  }

  // 触发恢复机制
  public async triggerRecovery(condition: string, description: string): Promise<void> {
    if (!this.config.enableAutoRecovery) {
      logger.warn('Auto recovery disabled, skipping recovery', { condition, description });
      return;
    }

    const strategy = this.config.recoveryStrategies.find(s => 
      condition.toLowerCase().includes(s.condition.toLowerCase())
    );

    if (!strategy) {
      logger.warn('No recovery strategy found for condition', { condition });
      return;
    }

    const recoveryId = `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.addSystemEvent('recovery', 'medium', 'system',
      `Starting recovery for: ${description}`, recoveryId);

    const startTime = Date.now();

    try {
      const success = await this.executeRecovery(strategy, description);
      const duration = Date.now() - startTime;

      if (success) {
        logger.info('Recovery successful', { 
          recoveryId, 
          strategy: strategy.action, 
          duration 
        });

        this.updateRecoveryStats('recovery', true, duration);
        this.resolveSystemEvent(recoveryId, true);
        
      } else {
        throw new Error('Recovery execution failed');
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Recovery failed', { 
        recoveryId, 
        strategy: strategy.action,
        error: (error as Error).message,
        duration 
      });

      this.updateRecoveryStats('recovery', false, duration);
      this.resolveSystemEvent(recoveryId, false);

      // 如果恢复失败，尝试其他策略
      await this.handleRecoveryFailure(strategy, error as Error);
    }
  }

  private async executeRecovery(strategy: RecoveryStrategy, description: string): Promise<boolean> {
    switch (strategy.action) {
      case 'restart':
        return await this.executeRestart(strategy);
      
      case 'retry':
        return await this.executeRetry(strategy);
      
      case 'fallback':
        return await this.executeFallback(strategy);
      
      case 'alert':
        return await this.executeAlert(strategy, description);
      
      default:
        throw new Error(`Unknown recovery action: ${strategy.action}`);
    }
  }

  private async executeRestart(strategy: RecoveryStrategy): Promise<boolean> {
    try {
      await processMonitor.manualRestart(`Recovery restart: ${strategy.condition}`);
      return true;
    } catch (error) {
      logger.error('Recovery restart failed', { error: (error as Error).message }, error as Error);
      return false;
    }
  }

  private async executeRetry(strategy: RecoveryStrategy): Promise<boolean> {
    // 简单的重试逻辑，实际应用中需要根据具体情况实现
    let attempts = 0;
    
    while (attempts < strategy.maxAttempts) {
      try {
        attempts++;
        logger.debug(`Recovery retry attempt ${attempts}/${strategy.maxAttempts}`);
        
        // 模拟重试操作
        await new Promise(resolve => setTimeout(resolve, strategy.delay));
        
        // 这里应该执行具体的重试操作
        return true;
        
      } catch (error) {
        logger.warn(`Recovery retry attempt ${attempts} failed`, { 
          error: (error as Error).message 
        });
      }
    }
    
    return false;
  }

  private async executeFallback(strategy: RecoveryStrategy): Promise<boolean> {
    try {
      logger.info('Executing fallback recovery', { strategy: strategy.condition });
      
      // 实施降级策略
      // 这里可以根据具体的fallback逻辑来实现
      
      return true;
    } catch (error) {
      logger.error('Fallback recovery failed', { error: (error as Error).message }, error as Error);
      return false;
    }
  }

  private async executeAlert(strategy: RecoveryStrategy, description: string): Promise<boolean> {
    try {
      logger.error(`Recovery alert: ${description}`, { strategy: strategy.condition });
      
      // 发送告警通知
      // 这里可以集成各种告警渠道
      
      return true;
    } catch (error) {
      logger.error('Alert recovery failed', { error: (error as Error).message }, error as Error);
      return false;
    }
  }

  private async handleRecoveryFailure(strategy: RecoveryStrategy, error: Error) {
    // 如果恢复失败，尝试更激进的方法
    if (strategy.action === 'retry' && strategy.maxAttempts > 1) {
      // 尝试重启作为最后的手段
      logger.warn('Recovery failure, attempting restart as fallback');
      await this.executeRestart(strategy);
    }
  }

  // 添加系统事件
  private addSystemEvent(
    type: SystemEvent['type'], 
    severity: SystemEvent['severity'], 
    component: string, 
    message: string, 
    eventId?: string
  ) {
    const event: SystemEvent = {
      id: eventId || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      component,
      message,
      timestamp: new Date().toISOString(),
      resolved: false,
      recoveryAttempted: false
    };

    this.systemEvents.push(event);
    
    // 限制事件历史记录大小
    if (this.systemEvents.length > 1000) {
      this.systemEvents = this.systemEvents.slice(-500);
    }

    // 发送事件通知
    this.emit('system:event', event);

    logger.debug('System event added', event);
  }

  // 解决系统事件
  private resolveSystemEvent(eventId: string, success: boolean) {
    const event = this.systemEvents.find(e => e.id === eventId);
    if (event) {
      event.resolved = success;
      event.recoveryAttempted = true;
      
      this.emit('system:event:resolved', event);
      logger.debug('System event resolved', { eventId, success });
    }
  }

  // 更新恢复统计
  private updateRecoveryStats(type: string, success: boolean, duration?: number) {
    this.recoveryStats.totalRecoveries++;

    if (success) {
      this.recoveryStats.successfulRecoveries++;
    } else {
      this.recoveryStats.failedRecoveries++;
    }

    if (duration) {
      const currentAvg = this.recoveryStats.averageRecoveryTime;
      const totalSuccess = this.recoveryStats.successfulRecoveries;
      this.recoveryStats.averageRecoveryTime = 
        (currentAvg * (totalSuccess - 1) + duration) / totalSuccess;
    }

    this.recoveryStats.lastRecovery = {
      timestamp: new Date().toISOString(),
      component: type,
      duration: duration || 0,
      success
    };

    this.emit('recovery:stats', this.recoveryStats);
  }

  // 获取系统状态
  public async getSystemStatus(): Promise<SystemStatus> {
    const healthStatus = await healthMonitor.getHealthStatus();
    
    const components = {
      healthMonitor: {
        status: 'healthy' as const,
        lastCheck: new Date().toISOString(),
        errorCount: 0,
        uptime: process.uptime()
      },
      processMonitor: {
        status: 'healthy' as const,
        lastCheck: new Date().toISOString(),
        errorCount: 0,
        uptime: process.uptime()
      },
      messageQueue: {
        status: 'healthy' as const,
        lastCheck: new Date().toISOString(),
        errorCount: 0,
        uptime: process.uptime()
      },
      database: {
        status: healthStatus.checks.database.status,
        lastCheck: healthStatus.checks.database.lastChecked,
        errorCount: healthStatus.checks.database.status === 'unhealthy' ? 1 : 0,
        uptime: process.uptime(),
        details: healthStatus.checks.database.details
      },
      telegram: {
        status: healthStatus.checks.telegram.status,
        lastCheck: healthStatus.checks.telegram.lastChecked,
        errorCount: healthStatus.checks.telegram.status === 'unhealthy' ? 1 : 0,
        uptime: process.uptime(),
        details: healthStatus.checks.telegram.details
      }
    };

    // 确定整体状态
    let overall: SystemStatus['overall'] = 'healthy';
    const statuses = Object.values(components).map(c => c.status);
    
    if (statuses.includes('critical')) {
      overall = 'critical';
    } else if (statuses.includes('degraded')) {
      overall = 'degraded';
    }

    return {
      overall,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      components,
      recentEvents: this.systemEvents.slice(-20), // 最近20个事件
      recoveryStats: this.recoveryStats
    };
  }

  // 获取消息队列实例（供外部使用）
  public getMessageQueue(): MessageQueue {
    return this.messageQueue;
  }

  // 停止容错系统
  public async shutdown() {
    logger.info('Shutting down fault tolerance system');

    try {
      // 停止各个组件
      if (this.config.enableHealthMonitoring) {
        healthMonitor.stopMonitoring();
      }

      if (this.config.enableProcessMonitoring) {
        processMonitor.stopMonitoring();
      }

      if (this.config.enableMessageQueue) {
        this.messageQueue.destroy();
      }

      this.isInitialized = false;
      this.emit('shutdown');
      
      logger.info('Fault tolerance system shutdown complete');

    } catch (error) {
      logger.error('Error during fault tolerance system shutdown', 
        { error: (error as Error).message }, error as Error);
    }
  }

  // 获取系统指标
  public getMetrics() {
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      systemEvents: {
        total: this.systemEvents.length,
        recent: this.systemEvents.slice(-10)
      },
      recoveryStats: this.recoveryStats,
      messageQueue: this.messageQueue.getQueueStatus(),
      isInitialized: this.isInitialized
    };
  }
}

// 单例模式的容错管理器
export const faultToleranceManager = new FaultToleranceManager();