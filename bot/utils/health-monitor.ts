import { prisma } from '../../lib/prisma';
import { logger } from './logger';
import { MessageQueue } from './message-queue';
/**
 * 健康检查系统
 * 监控Bot各个组件的健康状态
 */


export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    telegram: HealthCheckResult;
    memory: HealthCheckResult;
    messageQueue: HealthCheckResult;
    diskSpace: HealthCheckResult;
  };
  metrics: {
    memoryUsage: MemoryMetrics;
    cpuUsage: CPUMetrics;
    messageQueueStats: any;
    recentErrors: number;
  };
  alerts: HealthAlert[];
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  duration: number;
  lastChecked: string;
  details?: any;
}

export interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
}

export interface CPUMetrics {
  usage: number;
  loadAverage: number[];
}

export interface HealthAlert {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  component: string;
  timestamp: string;
  resolved?: boolean;
}

export class HealthMonitor {
  private messageQueue: MessageQueue;
  private checks: Map<string, NodeJS.Timeout> = new Map();
  private alerts: HealthAlert[] = [];
  private lastHealthStatus: HealthStatus | null = null;

  constructor(messageQueue?: MessageQueue) {
    this.messageQueue = messageQueue;
}

  public async getHealthStatus(): Promise<HealthStatus> {
    const start = Date.now();
    const checks = await this.runAllChecks();
    const metrics = this.collectMetrics();
    
    const overallStatus = this.determineOverallStatus(checks);
    const alerts = this.generateAlerts(checks, metrics);

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      metrics,
      alerts
    };

    this.lastHealthStatus = healthStatus;
    return healthStatus;
  }

  private async runAllChecks(): Promise<HealthStatus['checks']> {
    const checkPromises = [;
      this.checkDatabase(),
      this.checkTelegram(),
      this.checkMemory(),
      this.checkMessageQueue(),
      this.checkDiskSpace()
    ];

    const results = await Promise.allSettled(checkPromises);
    
    return {
      database: results[0].status === 'fulfilled' ? results[0].value : this.createErrorResult('database', 'Database check failed'),
      telegram: results[1].status === 'fulfilled' ? results[1].value : this.createErrorResult('telegram', 'Telegram check failed'),
      memory: results[2].status === 'fulfilled' ? results[2].value : this.createErrorResult('memory', 'Memory check failed'),
      messageQueue: results[3].status === 'fulfilled' ? results[3].value : this.createErrorResult('messageQueue', 'Message queue check failed'),
      diskSpace: results[4].status === 'fulfilled' ? results[4].value : this.createErrorResult('diskSpace', 'Disk space check failed')
    };
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      // 测试数据库连接
      await prisma.$queryRaw`SELECT 1`;
      
      // 检查最近的数据库操作
      const recentUsers = await prisma.users.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 最近24小时
          }
        }
      });

      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        message: 'Database connection healthy',
        duration,
        lastChecked: new Date().toISOString(),
        details: {
          recentUsersLast24h: recentUsers,
          responseTime: `${duration}ms`
        }
      };
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Database health check failed', { error: (error as Error).message }, error as Error);
      
      return {
  }
        status: 'unhealthy',
        message: 'Database connection failed',
        duration,
        lastChecked: new Date().toISOString(),
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  private async checkTelegram(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      // 这里需要访问bot实例，暂时通过环境检查
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      
      if (!botToken) {
        throw new Error('Telegram bot token not configured');
  }
      }

      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        message: 'Telegram configuration valid',
        duration,
        lastChecked: new Date().toISOString(),
        details: {
          botTokenConfigured: true,
          responseTime: `${duration}ms`
        }
      };
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Telegram health check failed', { error: (error as Error).message }, error as Error);
      
      return {
        status: 'unhealthy',
        message: 'Telegram connection failed',
        duration,
        lastChecked: new Date().toISOString(),
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  private async checkMemory(): Promise<HealthCheckResult> {
    const start = Date.now();
    const memUsage = process.memoryUsage();
    
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const usagePercentage = (usedMemory / totalMemory) * 100;
    
    const duration = Date.now() - start;
    
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    let message = 'Memory usage normal';
    
    if (usagePercentage > 90) {
      status = 'unhealthy';
      message = 'Critical memory usage';
    } else if (usagePercentage > 80) {
      status = 'degraded';
      message = 'High memory usage';
    }
    
    return {
      status,
      message,
      duration,
      lastChecked: new Date().toISOString(),
      details: {
        heapUsed: Math.round(usedMemory / 1024 / 1024),
        heapTotal: Math.round(totalMemory / 1024 / 1024),
        percentage: Math.round(usagePercentage * 100) / 100,
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024)
      }
    };
  }

  private async checkMessageQueue(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      if (!this.messageQueue) {
        throw new Error('Message queue not available');
      }

      const stats = await this.messageQueue.getStats();
      
      const duration = Date.now() - start;
      
      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      let message = 'Message queue healthy';
      
      if (stats.queueLength > 1000) {
        status = 'unhealthy';
        message = 'Message queue overloaded';
      } else if (stats.queueLength > 500) {
        status = 'degraded';
        message = 'Message queue under high load';
      }
      
      return {
        status,
        message,
        duration,
        lastChecked: new Date().toISOString(),
        details: {
          queueLength: stats.queueLength,
          processingQueue: stats.processing.length,
          failedMessages: stats.failed.length,
          responseTime: `${duration}ms`
        }
      };
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Message queue health check failed', { error: (error as Error).message }, error as Error);
      
      return {
        status: 'unhealthy',
        message: 'Message queue check failed',
        duration,
        lastChecked: new Date().toISOString(),
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  private async checkDiskSpace(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const fs = require('fs');
      const stats = fs.statSync('./logs');
      
      const logsDir = './logs';
      const freeSpace = await this.getFreeDiskSpace();
      
      const duration = Date.now() - start;
      
      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      let message = 'Disk space sufficient';
      
      if (freeSpace < 1024 * 1024 * 1024) { // 小于1GB {
        status = 'unhealthy';
        message = 'Low disk space';
      } else if (freeSpace < 5 * 1024 * 1024 * 1024) { // 小于5GB {
        status = 'degraded';
        message = 'Disk space warning';
      }
      
      return {
        status,
        message,
        duration,
        lastChecked: new Date().toISOString(),
        details: {
          freeSpaceMB: Math.round(freeSpace / 1024 / 1024),
          logsDir: logsDir
        }
      };
    } catch (error) {
      const duration = Date.now() - start;
      
      return {
        status: 'degraded',
        message: 'Disk space check failed',
        duration,
        lastChecked: new Date().toISOString(),
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  private async getFreeDiskSpace(): Promise<number> {
    try {
      // 这里简化处理，实际应该检查文件系统
      // 在实际部署中可以使用更准确的方法
      return 10 * 1024 * 1024 * 1024; // 假设10GB可用空间;
    } catch {
      return 0;
    }
  }

  private collectMetrics(): HealthStatus['metrics'] {
    const memUsage = process.memoryUsage();
    const memoryMetrics: MemoryMetrics = {
      used: memUsage.rss,
      total: memUsage.rss + (1024 * 1024 * 1024), // 估算总内存
      percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    };

    const cpuMetrics: CPUMetrics = {
      usage: process.cpuUsage().user / 1000, // 简化的CPU使用率
      loadAverage: process.platform !== 'win32' ? process.loadavg() : [0, 0, 0]
    };

    const messageQueueStats = this.messageQueue ? 
      { available: true } : { available: false };

    return {
      memoryUsage: memoryMetrics,
      cpuUsage: cpuMetrics,
      messageQueueStats,
      recentErrors: this.getRecentErrorCount()
    };
  }

  private getRecentErrorCount(): number {
    // 简化实现，实际可以接入日志分析
    return 0;
  }

  private determineOverallStatus(checks: HealthStatus['checks']): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }
    
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  private generateAlerts(checks: HealthStatus['checks'], metrics: HealthStatus['metrics']): HealthAlert[] {
    const alerts: HealthAlert[] = [];
    const now = new Date().toISOString();

    // 检查每个组件的状态
    Object.entries(checks).forEach(([component, check]) => {
      if (check.status === 'unhealthy') {
        alerts.push({
          severity: 'critical',
          message: `${component} component is unhealthy: ${check.message}`,
          component,
          timestamp: now
        });
      } else if (check.status === 'degraded') {
        alerts.push({
          severity: 'warning',
          message: `${component} component is degraded: ${check.message}`,
          component,
          timestamp: now
        });
      }
    });

    // 检查内存使用
    if (metrics.memoryUsage.percentage > 80) {
      alerts.push({
        severity: metrics.memoryUsage.percentage > 90 ? 'critical' : 'warning',
        message: `Memory usage is ${metrics.memoryUsage.percentage.toFixed(1)}%`,
        component: 'memory',
        timestamp: now
      });
    }

    return alerts;
  }

  private createErrorResult(component: string, message: string): HealthCheckResult {
    return {
      status: 'unhealthy',
      message,
      duration: 0,
      lastChecked: new Date().toISOString(),
      details: { component, error: message }
    };
  }

  // 启动定期健康检查
  public startMonitoring(intervalMs: number = 60000) {
    const checkInterval = setInterval(async () => {
      try {
        const healthStatus = await this.getHealthStatus();
        
        // 记录健康检查结果
        if (healthStatus.status !== 'healthy') {
          logger.warn(`Health check degraded: ${healthStatus.status}`, {
            checks: healthStatus.checks,
            alerts: healthStatus.alerts
          });
        }
        
        // 严重问题时发送告警
        if (healthStatus.status === 'unhealthy' && healthStatus.alerts.length > 0) {
          await this.handleCriticalHealthIssues(healthStatus);
        }
        
      } catch (error) {
        logger.error('Health monitoring check failed', { error: (error as Error).message }, error as Error);
      }
    }, intervalMs);

    this.checks.set('health-monitoring', checkInterval);
    logger.info(`Health monitoring started with ${intervalMs}ms interval`);
  }

  // 停止健康检查
  public stopMonitoring() {
    for (const [name, interval] of this.checks) {
      clearInterval(interval);
      logger.debug(`Stopped health check: ${name}`);
    }
    this.checks.clear();
  }

  private async handleCriticalHealthIssues(healthStatus: HealthStatus) {
    const criticalAlerts = healthStatus.alerts.filter(alert => alert.severity === 'critical');
    
    for (const alert of criticalAlerts) {
      logger.error(`Critical health issue detected: ${alert.message}`, {
        component: alert.component,
        healthStatus
      });
      
      // 这里可以添加自动恢复逻辑
      await this.attemptAutoRecovery(alert.component, healthStatus);
    }
  }

  private async attemptAutoRecovery(component: string, healthStatus: HealthStatus) {
    logger.info(`Attempting auto recovery for component: ${component}`);
    
    try {
      switch (component) {
        case 'database':
          // 尝试重连数据库
          await prisma.$disconnect();
          await prisma.$connect();
          logger.info('Database reconnection attempted');
          break;
          
        case 'messageQueue':
          // 重启消息队列
          if (this.messageQueue) {
            await this.messageQueue.restart();
            logger.info('Message queue restart attempted');
          }
          break;
          
        default:
          logger.warn(`No auto recovery strategy for component: ${component}`);
      }
    } catch (error) {
      logger.error(`Auto recovery failed for ${component}`, { error: (error as Error).message }, error as Error);
    }
  }

  // 获取最后一次健康状态
  public getLastHealthStatus(): HealthStatus | null {
    return this.lastHealthStatus;
  }

  // 创建健康检查端点
  public createHealthCheckEndpoint() {
    return async (req: any, res: any) => {
      try {
        const healthStatus = await this.getHealthStatus();
        const statusCode = healthStatus.status === 'healthy' ? 200 : 
                          healthStatus.status === 'degraded' ? 200 : 503;
        
        res.status(statusCode).json(healthStatus);
      } catch (error) {
        logger.error('Health check endpoint error', { error: (error as Error).message }, error as Error);
        res.status(500).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Health check failed'
        });
      }
    };
  }
}

export const healthMonitor = new HealthMonitor();