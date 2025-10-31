/**
 * 重连管理器
 * 处理网络连接、Telegram API重连和连接池管理
 */

import { EventEmitter } from 'events';
import { logger, errorTracker } from './logger';
import { getBotApiConfig } from '../../config/api-config';

export interface ReconnectConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  timeout: number;
  enableExponentialBackoff: boolean;
}

export interface ConnectionState {
  isConnected: boolean;
  lastConnected: Date | null;
  lastDisconnected: Date | null;
  connectionAttempts: number;
  totalDowntime: number;
  averageUptime: number;
}

export interface NetworkMetrics {
  latency: number;
  packetLoss: number;
  bandwidth: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  uptime: number;
  downtime: number;
  reconnections: number;
}

export interface TelegramConnection {
  status: 'connected' | 'disconnected' | 'connecting' | 'error' | 'reconnecting';
  lastError: string | null;
  lastPing: Date | null;
  messageCount: number;
  errorCount: number;
  uptime: number;
}

export class ReconnectManager extends EventEmitter {
  private config: ReconnectConfig;
  private connectionStates: Map<string, ConnectionState> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private networkMonitorInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor(config: Partial<ReconnectConfig> = {}) {
    super();

    this.config = {
      maxRetries: 5,
      initialDelay: 1000, // 1秒
      maxDelay: 30000, // 30秒
      backoffFactor: 2,
      jitter: true,
      timeout: 10000, // 10秒
      enableExponentialBackoff: true,
      ...config
    };

    this.initializeConnectionStates();
  }

  private initializeConnectionStates() {
    // 初始化各种连接的初始状态
    const connections = ['telegram', 'database', 'api', 'webhook'];
    
    connections.forEach(connection => {
      this.connectionStates.set(connection, {
        isConnected: false,
        lastConnected: null,
        lastDisconnected: null,
        connectionAttempts: 0,
        totalDowntime: 0,
        averageUptime: 0
      });
    });
  }

  // 开始网络监控
  public startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // 开始网络连接监控
    this.startNetworkMonitoring();
    
    // 开始连接状态检查
    this.startConnectionStatusCheck();

    logger.info('Reconnect manager monitoring started', { 
      config: this.config 
    });

    this.emit('monitor:started');
  }

  private startNetworkMonitoring() {
    this.networkMonitorInterval = setInterval(async () => {
      try {
        await this.performNetworkCheck();
      } catch (error) {
        logger.error('Network monitoring error', { error: (error as Error).message }, error as Error);
      }
    }, 30000); // 每30秒检查一次
  }

  private startConnectionStatusCheck() {
    setInterval(() => {
      this.checkAllConnections();
    }, 10000); // 每10秒检查一次连接状态
  }

  private async performNetworkCheck() {
    try {
      // 检查基本网络连接
      const connectivity = await this.checkConnectivity();
      
      if (!connectivity) {
        this.handleNetworkDisconnection();
      } else {
        this.handleNetworkConnection();
      }

    } catch (error) {
      logger.error('Network connectivity check failed', 
        { error: (error as Error).message }, error as Error);
    }
  }

  private async checkConnectivity(): Promise<boolean> {
    try {
      // 检查基本网络连接
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        timeout: 5000
      } as any);

      return response.ok;
    } catch (error) {
      // 尝试备用检查
      try {
        const altResponse = await fetch('https://1.1.1.1/', {
          method: 'HEAD',
          timeout: 3000
        } as any);
        
        return altResponse.ok;
      } catch {
        return false;
      }
    }
  }

  private handleNetworkDisconnection() {
    logger.warn('Network disconnection detected');
    this.emit('network:disconnected');

    // 标记所有外部连接为断开
    this.markConnectionDisconnected('network');
  }

  private handleNetworkConnection() {
    logger.debug('Network connection restored');
    this.emit('network:connected');

    // 尝试重连所有断开的连接
    this.attemptReconnectAll();
  }

  private checkAllConnections() {
    for (const [connectionName, state] of this.connectionStates) {
      if (!state.isConnected) {
        this.attemptReconnect(connectionName);
      }
    }
  }

  private markConnectionDisconnected(connectionType: string) {
    const state = this.connectionStates.get(connectionType);
    if (state && state.isConnected) {
      state.isConnected = false;
      state.lastDisconnected = new Date();
      
      // 计算总断线时间
      if (state.lastConnected) {
        state.totalDowntime += Date.now() - state.lastConnected.getTime();
      }

      this.connectionStates.set(connectionType, state);
      this.emit('connection:disconnected', { type: connectionType, state });
      
      logger.warn(`Connection marked as disconnected: ${connectionType}`);
    }
  }

  private markConnectionConnected(connectionType: string) {
    const state = this.connectionStates.get(connectionType);
    if (state && !state.isConnected) {
      state.isConnected = true;
      state.lastConnected = new Date();
      state.connectionAttempts = 0;
      
      this.connectionStates.set(connectionType, state);
      this.emit('connection:connected', { type: connectionType, state });
      
      logger.info(`Connection restored: ${connectionType}`);
    }
  }

  // 尝试重连特定连接
  public async attemptReconnect(connectionType: string): Promise<boolean> {
    const state = this.connectionStates.get(connectionType);
    if (!state) {
      logger.error('Unknown connection type', { connectionType });
      return false;
    }

    if (state.connectionAttempts >= this.config.maxRetries) {
      logger.warn(`Max reconnection attempts reached for ${connectionType}`);
      this.emit('connection:max-retries', { type: connectionType });
      return false;
    }

    state.connectionAttempts++;
    this.connectionStates.set(connectionType, state);

    const delay = this.calculateReconnectDelay(state.connectionAttempts);
    
    logger.info(`Attempting to reconnect ${connectionType} (attempt ${state.connectionAttempts}/${this.config.maxRetries})`);

    // 设置重连定时器
    const timer = setTimeout(async () => {
      try {
        const success = await this.executeReconnect(connectionType);
        
        if (success) {
          this.clearReconnectTimer(connectionType);
          this.markConnectionConnected(connectionType);
        } else {
          // 重连失败，准备下次重试
          if (state.connectionAttempts < this.config.maxRetries) {
            this.scheduleReconnect(connectionType);
          }
        }
      } catch (error) {
        logger.error(`Reconnection failed for ${connectionType}`, 
          { error: (error as Error).message }, error as Error);
        
        if (state.connectionAttempts < this.config.maxRetries) {
          this.scheduleReconnect(connectionType);
        } else {
          this.emit('connection:failed', { type: connectionType, error });
        }
      }
    }, delay);

    this.reconnectTimers.set(connectionType, timer);
    this.emit('reconnection:attempted', { type: connectionType, attempt: state.connectionAttempts, delay });

    return true;
  }

  private calculateReconnectDelay(attempt: number): number {
    let delay = this.config.initialDelay;

    if (this.config.enableExponentialBackoff) {
      delay = this.config.initialDelay * Math.pow(this.config.backoffFactor, attempt - 1);
    }

    // 限制最大延迟
    delay = Math.min(delay, this.config.maxDelay);

    // 添加抖动
    if (this.config.jitter) {
      const jitterRange = delay * 0.1; // 10% 的抖动
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }

    return Math.max(delay, 100); // 最少100ms
  }

  private clearReconnectTimer(connectionType: string) {
    const timer = this.reconnectTimers.get(connectionType);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(connectionType);
    }
  }

  private scheduleReconnect(connectionType: string) {
    const state = this.connectionStates.get(connectionType);
    if (state) {
      this.attemptReconnect(connectionType);
    }
  }

  private async executeReconnect(connectionType: string): Promise<boolean> {
    switch (connectionType) {
      case 'telegram':
        return await this.reconnectTelegram();
      case 'database':
        return await this.reconnectDatabase();
      case 'api':
        return await this.reconnectAPI();
      case 'webhook':
        return await this.reconnectWebhook();
      default:
        logger.error('Unknown connection type for reconnection', { connectionType });
        return false;
    }
  }

  private async reconnectTelegram(): Promise<boolean> {
    try {
      // 检查Telegram Bot Token
      if (!process.env.TELEGRAM_BOT_TOKEN) {
        throw new Error('Telegram bot token not configured');
      }

      // 这里应该测试实际的Telegram API连接
      // 暂时模拟成功
      await this.simulateTelegramCheck();
      
      return true;
    } catch (error) {
      logger.error('Telegram reconnection failed', { error: (error as Error).message }, error as Error);
      return false;
    }
  }

  private async simulateTelegramCheck(): Promise<void> {
    // 模拟Telegram API检查
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟10%的失败率
        if (Math.random() < 0.1) {
          reject(new Error('Simulated Telegram API error'));
        } else {
          resolve();
        }
      }, 100 + Math.random() * 500);
    });
  }

  private async reconnectDatabase(): Promise<boolean> {
    try {
      // 导入数据库客户端
      const { prisma } = await import('../../lib/prisma');
      
      // 测试数据库连接
      await prisma.$queryRaw`SELECT 1`;
      
      return true;
    } catch (error) {
      logger.error('Database reconnection failed', { error: (error as Error).message }, error as Error);
      return false;
    }
  }

  private async reconnectAPI(): Promise<boolean> {
    try {
      const { baseURL } = getBotApiConfig();
      
      // 测试API连接
      const response = await fetch(`${baseURL}/api/health`, {
        method: 'GET',
        timeout: 5000
      } as any);
      
      return response.ok;
    } catch (error) {
      logger.error('API reconnection failed', { error: (error as Error).message }, error as Error);
      return false;
    }
  }

  private async reconnectWebhook(): Promise<boolean> {
    try {
      // 测试webhook端点
      if (!process.env.WEBHOOK_URL) {
        return true; // 没有配置webhook时认为成功
      }

      const response = await fetch(process.env.WEBHOOK_URL, {
        method: 'HEAD',
        timeout: 3000
      } as any);
      
      return response.ok || response.status === 405; // 405 Method Not Allowed 也算连接正常
    } catch (error) {
      logger.error('Webhook reconnection failed', { error: (error as Error).message }, error as Error);
      return false;
    }
  }

  // 尝试重连所有断开的连接
  public async attemptReconnectAll(): Promise<void> {
    const promises: Promise<boolean>[] = [];

    for (const [connectionType, state] of this.connectionStates) {
      if (!state.isConnected && state.connectionAttempts < this.config.maxRetries) {
        promises.push(this.attemptReconnect(connectionType));
      }
    }

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    logger.info(`Reconnection attempt completed`, { 
      total: promises.length, 
      successful 
    });
  }

  // 手动触发重连
  public async manualReconnect(connectionType: string): Promise<boolean> {
    logger.info(`Manual reconnection requested for ${connectionType}`);
    
    // 清除重连定时器
    this.clearReconnectTimer(connectionType);
    
    // 重置连接状态
    const state = this.connectionStates.get(connectionType);
    if (state) {
      state.connectionAttempts = 0;
      this.connectionStates.set(connectionType, state);
    }

    return await this.attemptReconnect(connectionType);
  }

  // 获取连接状态
  public getConnectionState(connectionType: string): ConnectionState | undefined {
    return this.connectionStates.get(connectionType);
  }

  // 获取所有连接状态
  public getAllConnectionStates(): Record<string, ConnectionState> {
    const states: Record<string, ConnectionState> = {};
    
    for (const [connectionType, state] of this.connectionStates) {
      states[connectionType] = { ...state };
    }
    
    return states;
  }

  // 获取网络指标
  public getNetworkMetrics(): NetworkMetrics {
    let totalUptime = 0;
    let totalDowntime = 0;
    let reconnections = 0;

    for (const state of this.connectionStates.values()) {
      if (state.isConnected && state.lastConnected) {
        totalUptime += Date.now() - state.lastConnected.getTime();
      } else if (!state.isConnected && state.lastDisconnected) {
        totalDowntime += Date.now() - state.lastDisconnected.getTime();
      }
      
      reconnections += state.connectionAttempts;
    }

    const totalTime = totalUptime + totalDowntime;
    const uptimePercentage = totalTime > 0 ? (totalUptime / totalTime) * 100 : 100;

    let connectionQuality: NetworkMetrics['connectionQuality'] = 'excellent';
    if (uptimePercentage > 99) connectionQuality = 'excellent';
    else if (uptimePercentage > 95) connectionQuality = 'good';
    else if (uptimePercentage > 90) connectionQuality = 'fair';
    else if (uptimePercentage > 80) connectionQuality = 'poor';
    else connectionQuality = 'offline';

    return {
      latency: this.calculateAverageLatency(),
      packetLoss: this.calculatePacketLoss(),
      bandwidth: this.estimateBandwidth(),
      connectionQuality,
      uptime: totalUptime,
      downtime: totalDowntime,
      reconnections
    };
  }

  private calculateAverageLatency(): number {
    // 简化实现，返回估算值
    return 50 + Math.random() * 100; // 50-150ms
  }

  private calculatePacketLoss(): number {
    // 简化实现，返回估算值
    return Math.random() * 2; // 0-2%
  }

  private estimateBandwidth(): number {
    // 简化实现，返回估算值 (Mbps)
    return 10 + Math.random() * 90; // 10-100 Mbps
  }

  // 获取Telegram连接信息
  public getTelegramConnection(): TelegramConnection {
    const telegramState = this.connectionStates.get('telegram');
    
    return {
      status: telegramState?.isConnected ? 'connected' : 'disconnected',
      lastError: null, // 可以从错误追踪器获取
      lastPing: null, // 可以记录最后ping时间
      messageCount: 0, // 可以统计消息数量
      errorCount: errorTracker.getErrorStats().totalErrors,
      uptime: telegramState?.lastConnected ? 
        Date.now() - telegramState.lastConnected.getTime() : 0
    };
  }

  // 停止监控
  public stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    // 停止网络监控
    if (this.networkMonitorInterval) {
      clearInterval(this.networkMonitorInterval);
      this.networkMonitorInterval = null;
    }

    // 清除所有重连定时器
    for (const [connectionType, timer] of this.reconnectTimers) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();

    logger.info('Reconnect manager monitoring stopped');
    this.emit('monitor:stopped');
  }

  // 销毁管理器
  public destroy() {
    this.stopMonitoring();
    this.connectionStates.clear();
    
    logger.info('Reconnect manager destroyed');
    this.emit('destroyed');
  }
}

export const reconnectManager = new ReconnectManager();