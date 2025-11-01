import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { logger, errorTracker } from './logger';
import { BotDaemonConfig, BotProcess, BotMetrics } from './daemon-types';
#!/usr/bin/env node

/**
 * Bot守护进程
 * 独立监控和管理Bot进程，确保Bot异常时能够自动重启
 */


export class BotDaemon extends EventEmitter {
  private config: BotDaemonConfig;
  private botProcess: BotProcess | null = null;
  private restartCount = 0;
  private lastRestartTime: Date | null = null;
  private startTime: Date = new Date();
  private isRunning = false;
  private monitorInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<BotDaemonConfig> = {}) {
    super();

    this.config = {
      maxRestarts: 10,
      restartDelay: 5000,
      healthCheckInterval: 30000,
      startTimeout: 30000,
      shutdownTimeout: 15000,
      watchLogFiles: true,
      logFilePath: './logs/bot.log',
      enableMetrics: true,
      metricsEndpoint: '/health/metrics',
      autoRestart: true,
      ...config
    };

    this.setupEventHandlers();
}

  private setupEventHandlers() {
    // 监听退出信号
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGUSR2', () => this.restart()); // Node.js 重启信号

    // 未捕获异常
    process.on('uncaughtException', (error) => {
      logger.error('Daemon caught uncaught exception', { error: error.message }, error);
      errorTracker.recordError('daemon_uncaught_exception', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Daemon caught unhandled rejection', { reason, promise });
      errorTracker.recordError('daemon_unhandled_rejection', new Error(reason.toString()));
    });
  }

  // 启动守护进程
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Daemon is already running');
      return;
    }

    logger.info('🚀 Starting Bot daemon', {
      config: this.config,
      pid: process.pid,
      platform: process.platform
    });

    try {
      this.isRunning = true;

      // 启动Bot进程
      await this.startBotProcess();

      // 启动监控
      this.startMonitoring();

      // 启动健康检查
      this.startHealthCheck();

      // 启动指标收集
      if (this.config.enableMetrics) {
        this.startMetricsCollection();
      }

      this.emit('daemon:started');
      logger.info('✅ Bot daemon started successfully');

      // 发送启动通知
      await this.sendStartupNotification();

    } catch (error) {
      this.isRunning = false;
      logger.error('Failed to start bot daemon', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  private async startBotProcess(): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      // 清理之前的进程
      if (this.botProcess?.child) {
        try {
          this.botProcess.child.kill('SIGTERM');
        } catch (error) {
          logger.warn('Error killing previous bot process', { error: (error as Error).message });
        }
      }

      // 启动新的Bot进程
      const botPath = this.config.botScriptPath || './start.ts';
      const child = spawn('node', [botPath], {
        env: { ...process.env, DAEMON_MODE: 'true' },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // 创建进程记录
      this.botProcess = {
        child,
        startTime: new Date(),
        pid: child.pid || 0,
        status: 'starting',
        restartCount: this.restartCount,
        lastOutput: '',
        errorCount: 0
      };

      // 监听进程输出
      child.stdout?.on('data', (data) => {
        const output = data.toString();
        this.botProcess!.lastOutput = output;
        this.handleProcessOutput(output, 'stdout');
      });

      child.stderr?.on('data', (data) => {
        const output = data.toString();
        this.botProcess!.lastOutput = output;
        this.handleProcessOutput(output, 'stderr');
      });

      // 监听进程事件
      child.on('spawn', () => {
        logger.info('Bot process spawned', { 
          pid: child.pid,
          startupTime: Date.now() - startTime 
        });
      });

      child.on('exit', (code, signal) => {
        this.handleProcessExit(code, signal);
      });

      child.on('error', (error) => {
        logger.error('Bot process error', { error: error.message }, error);
        this.botProcess!.errorCount++;
      });

      // 等待启动完成或超时
      const startupTimeout = setTimeout(() => {
        if (this.botProcess?.status === 'starting') {
          reject(new Error('Bot startup timeout'));
        }
      }, this.config.startTimeout);

      // 监听启动成功信号
      child.on('message', (message) => {
        if (message.type === 'bot:started') {
          clearTimeout(startupTimeout);
          this.botProcess!.status = 'running';
          resolve();
        }
      });

      // 设置启动超时检测
      const checkStartup = setInterval(() => {
        if (this.botProcess?.status === 'running') {
          clearInterval(checkStartup);
          resolve();
        } else if (this.botProcess?.status === 'error') {
          clearInterval(checkStartup);
          reject(new Error('Bot failed to start'));
        }
      }, 1000);

      // 超时后拒绝
      setTimeout(() => {
        clearInterval(checkStartup);
        reject(new Error('Bot startup timeout'));
      }, this.config.startTimeout);
    });
  }

  private handleProcessOutput(output: string, stream: 'stdout' | 'stderr') {
    // 记录日志
    logger.debug('Bot process output', { stream, output });

    // 检查启动信号
    if (output.includes('Bot startup completed successfully')) {
      this.botProcess!.status = 'running';
      this.emit('bot:started');
    }

    // 检查错误信号
    if (stream === 'stderr' && output.includes('error')) {
      this.botProcess!.errorCount++;
      
      if (this.botProcess!.errorCount > 5) {
        logger.warn('Bot process has too many errors, may need restart');
        this.emit('bot:error_spike', { errorCount: this.botProcess!.errorCount });
      }
    }

    // 检查关键错误
    if (this.shouldRestartOnError(output)) {
      logger.warn('Detected critical error in bot output, will restart', { output });
      this.restart();
    }
  }

  private shouldRestartOnError(output: string): boolean {
    const criticalErrors = [;
      'ECONNREFUSED',
      'ECONNRESET',
      'Database connection failed',
      'Memory leak detected',
      'Segmentation fault',
      'FATAL ERROR'
    ];

    return criticalErrors.some(error => output.includes(error));
  }

  private handleProcessExit(code: number | null, signal: string | null) {
    const exitInfo = { code, signal };
    const isExpectedExit = code === 0 || signal === 'SIGTERM' || signal === 'SIGINT';

    logger.warn('Bot process exited', {
      ...exitInfo,
      uptime: this.getBotUptime(),
      restartCount: this.restartCount
    });

    this.botProcess!.status = 'exited';
    this.emit('bot:exited', exitInfo);

    // 如果不是预期退出且允许自动重启
    if (!isExpectedExit && this.config.autoRestart) {
      this.handleUnexpectedExit(code, signal);
    }
  }

  private handleUnexpectedExit(code: number | null, signal: string | null) {
    if (this.restartCount >= this.config.maxRestarts) {
      logger.error('Max restart attempts reached, giving up', {
        restartCount: this.restartCount,
        maxRestarts: this.config.maxRestarts
      });

      this.emit('daemon:max_restarts_reached');
      return;
    }

    const timeSinceLastRestart = this.lastRestartTime;
      ? Date.now() - this.lastRestartTime.getTime()
      : Infinity;

    // 如果重启频率过高（1分钟内超过3次），暂停重启
    if (timeSinceLastRestart < 60000 && this.restartCount % 3 === 0) {
      logger.warn('High restart frequency detected, pausing restart attempts', {
        timeSinceLastRestart,
        restartCount: this.restartCount
      });

      this.emit('daemon:restart_paused', {
        reason: 'high_frequency',
        restartCount: this.restartCount
      });

      setTimeout(() => this.restart(), 60000); // 1分钟后重试
      return;
    }

    // 执行重启
    setTimeout(() => this.restart(), this.config.restartDelay);
  }

  // 重启Bot
  public async restart(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Cannot restart, daemon not running');
      return;
    }

    logger.info('🔄 Restarting bot process', {
      restartCount: this.restartCount,
      uptime: this.getBotUptime()
    });

    this.emit('bot:restarting');

    try {
      // 停止当前进程
      await this.stopBotProcess();

      // 更新重启计数
      this.restartCount++;
      this.lastRestartTime = new Date();

      // 等待延迟后重启
      await new Promise(resolve => setTimeout(resolve, this.config.restartDelay));

      // 启动新进程
      await this.startBotProcess();

      logger.info('✅ Bot restart completed', {
        restartCount: this.restartCount,
        botUptime: this.getBotUptime()
      });

      this.emit('bot:restarted', { restartCount: this.restartCount });

    } catch (error) {
      logger.error('Bot restart failed', { error: (error as Error).message }, error as Error);
      this.emit('bot:restart_failed', error);
      throw error;
    }
  }

  private async stopBotProcess(): Promise<void> {
    if (!this.botProcess?.child) {
      return;
    }

    return new Promise((resolve) => {
      const child = this.botProcess!.child;
      const timeout = setTimeout(() => {
        logger.warn('Bot stop timeout, forcing kill');
        child.kill('SIGKILL');
        resolve();
      }, this.config.shutdownTimeout);

      child.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });

      child.kill('SIGTERM');
    });
  }

  // 启动监控
  private startMonitoring() {
    this.monitorInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    logger.info('Bot monitoring started', {
      interval: this.config.healthCheckInterval
    });
  }

  // 启动健康检查
  private startHealthCheck() {
    this.healthCheckInterval = setInterval(() => {
      this.checkBotHealth();
    }, this.config.healthCheckInterval);
  }

  // 启动指标收集
  private startMetricsCollection() {
    setInterval(() => {
      this.collectMetrics();
    }, 10000); // 每10秒收集一次
  }

  private async performHealthCheck() {
    try {
      if (!this.botProcess?.child || !this.isBotRunning()) {
        logger.warn('Bot process not running, initiating restart');
        await this.restart();
        return;
      }

      // 检查进程是否响应
      const isResponsive = await this.checkBotResponsive();

      if (!isResponsive) {
        logger.warn('Bot not responsive, initiating restart');
        await this.restart();
        return;
      }

      // 检查资源使用
      this.checkResourceUsage();

    } catch (error) {
      logger.error('Health check failed', { error: (error as Error).message }, error as Error);
    }
  }

  private async checkBotHealth() {
    const health = {
      timestamp: new Date().toISOString(),
      daemonRunning: this.isRunning,
      botRunning: this.isBotRunning(),
      restartCount: this.restartCount,
      uptime: this.getDaemonUptime(),
      lastRestart: this.lastRestartTime,
      botUptime: this.getBotUptime(),
      pid: this.botProcess?.pid || 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };

    this.emit('daemon:health_check', health);
  }

  private async checkBotResponsive(): Promise<boolean> {
    try {
      // 发送健康检查消息到Bot进程
      this.botProcess?.child.send({ type: 'health_check' });

      // 等待响应
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000);

        this.botProcess!.child.once('message', (message) => {
          clearTimeout(timeout);
          if (message.type === 'health_response') {
            resolve(message.healthy);
          } else {
            resolve(false);
          }
        });
      });
    } catch (error) {
      logger.error('Bot responsive check failed', { error: (error as Error).message }, error as Error);
      return false;
    }
  }

  private checkResourceUsage() {
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;

    if (memUsageMB > 512) {
      logger.warn('Daemon memory usage high', {
        heapUsed: Math.round(memUsageMB),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024)
      });
    }

    // 检查Bot进程资源
    if (this.botProcess?.child) {
      // 在实际应用中，可以通过系统调用获取子进程资源使用情况
    }
  }

  private isBotRunning(): boolean {
    return this.botProcess?.child && this.botProcess.status === 'running';
  }

  private collectMetrics(): BotMetrics {
    const metrics: BotMetrics = {
      timestamp: new Date().toISOString(),
      daemon: {
        uptime: this.getDaemonUptime(),
        restartCount: this.restartCount,
        isRunning: this.isRunning,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      bot: this.botProcess ? {
        uptime: this.getBotUptime(),
        pid: this.botProcess.pid,
        status: this.botProcess.status,
        errorCount: this.botProcess.errorCount,
        lastRestartTime: this.lastRestartTime
      } : null,
      performance: {
        averageRestartTime: this.calculateAverageRestartTime(),
        stability: this.calculateStability()
      }
    };

    this.emit('daemon:metrics', metrics);
    return metrics;
  }

  private getDaemonUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  private getBotUptime(): number {
    return this.botProcess?.startTime ? 
      Date.now() - this.botProcess.startTime.getTime() : 0;
  }

  private calculateAverageRestartTime(): number {
    // 简化实现，实际可以保存重启历史记录
    return 0;
  }

  private calculateStability(): number {
    // 基于重启次数和运行时间计算稳定性
    const uptime = this.getDaemonUptime();
    const restartPenalty = this.restartCount * 300000; // 每次重启扣5分钟;
    const effectiveUptime = uptime - restartPenalty;
    return Math.max(0, Math.min(100, (effectiveUptime / uptime) * 100));
  }

  private async sendStartupNotification() {
    logger.info('📱 Daemon startup notification', {
      timestamp: new Date().toISOString(),
      uptime: this.getDaemonUptime(),
      restartCount: this.restartCount
    });
  }

  // 关闭守护进程
  public async shutdown(signal?: string): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('🔄 Shutting down bot daemon', { signal });

    this.isRunning = false;

    try {
      // 停止监控
      if (this.monitorInterval) {
        clearInterval(this.monitorInterval);
        this.monitorInterval = null;
      }

      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      // 停止Bot进程
      await this.stopBotProcess();

      this.emit('daemon:stopped');
      logger.info('✅ Bot daemon shutdown complete');

    } catch (error) {
      logger.error('Error during daemon shutdown', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  // 获取守护进程状态
  public getStatus() {
    return {
      isRunning: this.isRunning,
      uptime: this.getDaemonUptime(),
      restartCount: this.restartCount,
      lastRestartTime: this.lastRestartTime,
      botProcess: this.botProcess ? {
        pid: this.botProcess.pid,
        status: this.botProcess.status,
        uptime: this.getBotUptime(),
        errorCount: this.botProcess.errorCount
      } : null,
      config: this.config
    };
  }
}

// 守护进程配置接口
export interface BotDaemonConfig {
  maxRestarts: number;
  restartDelay: number;
  healthCheckInterval: number;
  startTimeout: number;
  shutdownTimeout: number;
  watchLogFiles: boolean;
  logFilePath: string;
  enableMetrics: boolean;
  metricsEndpoint: string;
  autoRestart: boolean;
  botScriptPath?: string;
}

// Bot进程信息接口
export interface BotProcess {
  child: any;
  startTime: Date;
  pid: number;
  status: 'starting' | 'running' | 'error' | 'exited';
  restartCount: number;
  lastOutput: string;
  errorCount: number;
}

// Bot指标接口
export interface BotMetrics {
  timestamp: string;
  daemon: {
    uptime: number;
    restartCount: number;
    isRunning: boolean;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
  bot: {
    uptime: number;
    pid: number;
    status: string;
    errorCount: number;
    lastRestartTime: Date | null;
  } | null;
  performance: {
    averageRestartTime: number;
    stability: number;
  };
}

// 单例模式的守护进程
export const botDaemon = new BotDaemon();

// 如果直接运行此文件，启动守护进程
if (require.main === module) {
  (async () => {
    try {
      await botDaemon.start();
      
      // 保持进程运行
      process.on('SIGTERM', () => botDaemon.shutdown('SIGTERM'));
      process.on('SIGINT', () => botDaemon.shutdown('SIGINT'));
      
    } catch (error) {
      logger.error('Failed to start daemon', { error: (error as Error).message }, error as Error);
      process.exit(1);
}
  })();
}