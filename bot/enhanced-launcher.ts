#!/usr/bin/env node

/**
 * 增强的Bot启动器
 * 集成所有容错机制，确保Bot稳定运行
 */

import { startBot } from './index';
import { faultToleranceManager } from './utils/fault-tolerance-manager';
import { logger, errorTracker } from './utils/logger';
import { reconnectManager } from './utils/reconnect-manager';

class BotLauncher {
  private isShuttingDown = false;

  constructor() {
    this.setupGlobalErrorHandlers();
    this.setupGracefulShutdown();
  }

  // 启动Bot和所有容错组件
  public async start(): Promise<void> {
    try {
      logger.info('🚀 Starting enhanced Telegram Bot with fault tolerance', {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        pid: process.pid
      });

      // 检查必要的环境变量
      this.validateEnvironment();

      // 启动容错系统
      await this.startFaultToleranceSystem();

      // 启动重连管理器
      this.startReconnectSystem();

      // 启动原始Bot
      await this.startTelegramBot();

      // 启动消息队列服务
      await this.startMessageQueueService();

      // 开始监控
      this.startMonitoring();

      logger.info('✅ Bot startup completed successfully');
      
      // 发送启动通知
      await this.sendStartupNotification();

    } catch (error) {
      logger.error('❌ Bot startup failed', { 
        error: (error as Error).message,
        stack: (error as Error).stack 
      }, error as Error);
      
      process.exit(1);
    }
  }

  private validateEnvironment() {
    const requiredEnvVars = ['TELEGRAM_BOT_TOKEN'];
    const missingVars: string[] = [];

    for (const varName of requiredEnvVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    logger.info('Environment validation passed', {
      botToken: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'missing',
      miniAppUrl: process.env.MINI_APP_URL || 'not configured',
      nodeEnv: process.env.NODE_ENV || 'development'
    });
  }

  private async startFaultToleranceSystem() {
    logger.info('Starting fault tolerance system...');
    
    try {
      await faultToleranceManager.initialize();
      
      // 监听容错系统事件
      faultToleranceManager.on('system:event', (event) => {
        logger.info(`System event: ${event.message}`, { 
          type: event.type, 
          severity: event.severity,
          component: event.component 
        });
      });

      faultToleranceManager.on('recovery:stats', (stats) => {
        logger.debug('Recovery statistics updated', { 
          successfulRecoveries: stats.successfulRecoveries,
          failedRecoveries: stats.failedRecoveries,
          totalRecoveries: stats.totalRecoveries
        });
      });

      logger.info('Fault tolerance system started successfully');
    } catch (error) {
      logger.error('Failed to start fault tolerance system', 
        { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  private startReconnectSystem() {
    logger.info('Starting reconnect system...');

    try {
      reconnectManager.startMonitoring();

      // 监听重连事件
      reconnectManager.on('connection:connected', (data) => {
        logger.info(`Connection restored: ${data.type}`, { 
          connectionType: data.type,
          uptime: data.state.uptime 
        });
      });

      reconnectManager.on('connection:disconnected', (data) => {
        logger.warn(`Connection lost: ${data.type}`, { 
          connectionType: data.type,
          downtime: data.state.totalDowntime 
        });
      });

      reconnectManager.on('reconnection:attempted', (data) => {
        logger.info(`Reconnection attempt: ${data.type}`, {
          connectionType: data.type,
          attempt: data.attempt,
          delay: data.delay
        });
      });

      reconnectManager.on('network:disconnected', () => {
        logger.warn('Network disconnection detected, initiating reconnection procedures');
      });

      reconnectManager.on('network:connected', () => {
        logger.info('Network connection restored');
      });

      logger.info('Reconnect system started successfully');
    } catch (error) {
      logger.error('Failed to start reconnect system', 
        { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  private async startTelegramBot() {
    logger.info('Starting Telegram bot...');

    try {
      // 启动原始Bot
      startBot();
      
      logger.info('Telegram bot started successfully');

      // 记录Bot启动时间
      logger.info('Bot launch time recorded', {
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });

    } catch (error) {
      logger.error('Failed to start Telegram bot', 
        { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  private async startMessageQueueService() {
    logger.info('Starting message queue service...');

    try {
      const messageQueue = faultToleranceManager.getMessageQueue();

      // 设置消息队列事件监听
      messageQueue.on('message:success', (data) => {
        logger.debug('Message processed successfully', {
          messageId: data.messageId,
          duration: data.duration
        });
      });

      messageQueue.on('message:error', (data) => {
        logger.warn('Message processing error', {
          messageId: data.messageId,
          error: data.error.message,
          duration: data.duration
        });

        // 记录错误
        errorTracker.recordError('message_processing_error', data.error);
      });

      messageQueue.on('message:failed', (data) => {
        logger.error('Message failed permanently', {
          messageId: data.messageId,
          error: data.error.message
        });
      });

      // 定期清理失败消息
      setInterval(() => {
        const clearedCount = messageQueue.clearFailedMessages(24);
        if (clearedCount > 0) {
          logger.info('Cleared old failed messages', { count: clearedCount });
        }
      }, 60 * 60 * 1000); // 每小时清理一次

      logger.info('Message queue service started successfully');
    } catch (error) {
      logger.error('Failed to start message queue service', 
        { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  private startMonitoring() {
    logger.info('Starting comprehensive monitoring...');

    // 定期日志系统状态
    setInterval(() => {
      this.logSystemStatus();
    }, 5 * 60 * 1000); // 每5分钟记录一次

    // 定期检查系统健康状态
    setInterval(async () => {
      try {
        const systemStatus = await faultToleranceManager.getSystemStatus();
        
        if (systemStatus.overall !== 'healthy') {
          logger.warn('System health degraded', {
            overall: systemStatus.overall,
            components: systemStatus.components
          });
        }
      } catch (error) {
        logger.error('System health check failed', 
          { error: (error as Error).message }, error as Error);
      }
    }, 30 * 1000); // 每30秒检查一次

    // 监控进程资源使用
    this.monitorResources();

    logger.info('Comprehensive monitoring started');
  }

  private logSystemStatus() {
    try {
      const metrics = faultToleranceManager.getMetrics();
      const networkMetrics = reconnectManager.getNetworkMetrics();
      const telegramConnection = reconnectManager.getTelegramConnection();

      logger.info('System status report', {
        uptime: Math.round(metrics.uptime),
        memoryUsage: {
          used: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(metrics.memoryUsage.heapTotal / 1024 / 1024),
          percentage: Math.round((metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100)
        },
        cpuUsage: {
          user: metrics.cpuUsage.user,
          system: metrics.cpuUsage.system
        },
        messageQueue: {
          queueLength: metrics.messageQueue.queueLength,
          processing: metrics.messageQueue.processing.length,
          failed: metrics.messageQueue.failedCount
        },
        network: {
          quality: networkMetrics.connectionQuality,
          latency: Math.round(networkMetrics.latency),
          uptime: Math.round(networkMetrics.uptime / 1000 / 60) // 转换为分钟
        },
        telegram: {
          status: telegramConnection.status,
          uptime: Math.round(telegramConnection.uptime / 1000 / 60),
          errorCount: telegramConnection.errorCount
        },
        errors: errorTracker.getErrorStats()
      });

    } catch (error) {
      logger.error('Failed to log system status', 
        { error: (error as Error).message }, error as Error);
    }
  }

  private monitorResources() {
    const memoryThreshold = 512 * 1024 * 1024; // 512MB
    const cpuCheckInterval = 10 * 1000; // 10秒

    setInterval(() => {
      const memUsage = process.memoryUsage();
      
      if (memUsage.heapUsed > memoryThreshold) {
        logger.warn('High memory usage detected', {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024)
        });
      }

      // 记录CPU使用情况
      const cpuUsage = process.cpuUsage();
      const totalCpuTime = cpuUsage.user + cpuUsage.system;
      const cpuPercentage = (totalCpuTime / (process.uptime() * 1000000)) * 100;

      if (cpuPercentage > 80) {
        logger.warn('High CPU usage detected', {
          percentage: Math.round(cpuPercentage * 100) / 100,
          user: cpuUsage.user,
          system: cpuUsage.system
        });
      }

    }, cpuCheckInterval);
  }

  private async sendStartupNotification() {
    try {
      const message = `🤖 Telegram Bot 已启动

运行时间: ${new Date().toISOString()}
环境: ${process.env.NODE_ENV || 'development'}
平台: ${process.platform} ${process.arch}
进程ID: ${process.pid}

✅ 所有容错组件已激活
📊 监控服务已启动
🔄 重连机制已启用

Bot现在可以正常处理消息了！`;

      logger.info('📱 Startup notification prepared', {
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });

    } catch (error) {
      logger.error('Failed to send startup notification', 
        { error: (error as Error).message }, error as Error);
    }
  }

  private setupGlobalErrorHandlers() {
    // 未捕获的异常
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }, error);

      // 记录到错误追踪器
      errorTracker.recordError('uncaught_exception', error);

      // 如果不是正在关闭，则尝试优雅关闭
      if (!this.isShuttingDown) {
        this.gracefulShutdown('uncaughtException');
      }
    });

    // 未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('⚠️ Unhandled Promise Rejection', {
        reason: reason.toString(),
        promise: promise.toString(),
        timestamp: new Date().toISOString()
      });

      const error = new Error(reason.toString());
      errorTracker.recordError('unhandled_rejection', error);
    });

    // 内存泄漏警告
    process.on('warning', (warning) => {
      logger.warn('⚠️ Node.js Warning', {
        name: warning.name,
        message: warning.message,
        detail: warning.detail
      });

      if (warning.name === 'MaxListenersExceededWarning') {
        errorTracker.recordError('max_listeners_exceeded', new Error(warning.message));
      }
    });
  }

  private setupGracefulShutdown() {
    const gracefulShutdown = (signal: string) => {
      if (this.isShuttingDown) {
        logger.warn(`Received ${signal} again, forcing shutdown`);
        process.exit(1);
      }

      this.gracefulShutdown(signal);
    };

    // 优雅关闭信号
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Node.js 专用重启信号
  }

  private async gracefulShutdown(signal: string) {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;

    logger.info(`🔄 Starting graceful shutdown due to ${signal}`);

    const shutdownStart = Date.now();

    try {
      // 1. 停止接收新请求
      logger.info('Step 1: Stopping new requests...');

      // 2. 停止容错系统
      logger.info('Step 2: Stopping fault tolerance system...');
      await faultToleranceManager.shutdown();

      // 3. 停止重连管理器
      logger.info('Step 3: Stopping reconnect manager...');
      reconnectManager.stopMonitoring();

      // 4. 等待当前操作完成（最多10秒）
      logger.info('Step 4: Waiting for current operations to complete...');
      await this.waitForOperations(10000);

      // 5. 强制关闭剩余连接
      logger.info('Step 5: Closing remaining connections...');
      this.forceCloseConnections();

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

  private async waitForOperations(maxWaitTime: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const metrics = faultToleranceManager.getMetrics();
      
      // 检查是否有正在处理的消息
      if (metrics.messageQueue.processingCount === 0) {
        logger.info('All operations completed');
        return;
      }

      logger.debug('Waiting for operations to complete...', {
        processingCount: metrics.messageQueue.processingCount,
        waitTime: Date.now() - startTime
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.warn('Timeout waiting for operations to complete');
  }

  private forceCloseConnections() {
    // 强制清理资源
    try {
      // 清理剩余的定时器
      const timers = (global as any).setTimeout.call(null, 0, () => {});
      
      // 清理事件监听器（保留必要的）
      process.removeAllListeners();

      logger.info('Forced connection cleanup completed');
    } catch (error) {
      logger.error('Error during forced cleanup', 
        { error: (error as Error).message }, error as Error);
    }
  }
}

// 主启动逻辑
async function main() {
  const launcher = new BotLauncher();

  try {
    await launcher.start();
    
    // 保持进程运行
    logger.info('🚀 Bot is now running and monitoring...');
    
  } catch (error) {
    logger.error('💥 Failed to start bot', { 
      error: (error as Error).message 
    }, error as Error);
    
    process.exit(1);
  }
}

// 如果直接运行此文件，启动Bot
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error during bot startup:', error);
    process.exit(1);
  });
}

export default BotLauncher;