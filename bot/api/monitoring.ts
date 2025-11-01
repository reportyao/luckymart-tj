import { NextApiRequest, NextApiResponse } from 'next';
import { faultToleranceManager } from '../utils/fault-tolerance-manager';
import { reconnectManager } from '../utils/reconnect-manager';
import { healthMonitor } from '../utils/health-monitor';
import { logger } from '../utils/logger';
import { getFaultToleranceConfig } from './fault-tolerance-config';
/**
 * 监控端点
 * 提供HTTP API来访问系统健康状态和指标
 */


// 响应类型定义
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// 健康检查端点
export async function healthCheckHandler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const healthStatus = await healthMonitor.getHealthStatus();
    
    // 根据健康状态设置HTTP状态码
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: healthStatus,
      timestamp: new Date().toISOString()
    });
    
    // 记录健康检查请求
    logger.debug('Health check requested', {
      status: healthStatus.status,
      userAgent: req.headers['user-agent'],
      ip: req.connection.remoteAddress
    });
    
  } catch (error) {
    logger.error('Health check endpoint error', { error: (error as Error).message }, error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
}
}

// 系统状态端点
export async function statusHandler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const systemStatus = await faultToleranceManager.getSystemStatus();
    const connectionStates = reconnectManager.getAllConnectionStates();
    
    res.status(200).json({
      success: true,
      data: {
        system: systemStatus,
        connections: connectionStates,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      },
      timestamp: new Date().toISOString()
    });
    
    logger.debug('Status endpoint requested', {
      systemStatus: systemStatus.overall,
      connectionsCount: Object.keys(connectionStates).length
    });
    
  } catch (error) {
    logger.error('Status endpoint error', { error: (error as Error).message }, error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Status check failed',
      timestamp: new Date().toISOString()
    });
}
}

// 指标端点
export async function metricsHandler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const metrics = faultToleranceManager.getMetrics();
    const networkMetrics = reconnectManager.getNetworkMetrics();
    const telegramConnection = reconnectManager.getTelegramConnection();
    const errorStats = (logger as any).errorTracker?.getErrorStats?.() || { totalErrors: 0, errorTypes: {} };
    
    const responseData = {
      system: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        platform: process.platform,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      faultTolerance: {
        isInitialized: (faultToleranceManager as any).isInitialized || false,
        messageQueue: metrics.messageQueue,
        events: {
          total: metrics.systemEvents.total,
          recent: metrics.systemEvents.recent
        },
        recovery: metrics.recoveryStats
      },
      network: networkMetrics,
      telegram: telegramConnection,
      errors: errorStats,
      config: getFaultToleranceConfig()
    };
    
    res.status(200).json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });
    
    logger.debug('Metrics endpoint requested', {
      uptime: Math.round(process.uptime()),
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    });
    
  } catch (error) {
    logger.error('Metrics endpoint error', { error: (error as Error).message }, error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Metrics collection failed',
      timestamp: new Date().toISOString()
    });
}
}

// 消息队列状态端点
export async function messageQueueHandler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const messageQueue = faultToleranceManager.getMessageQueue();
    const stats = await messageQueue.getStats();
    
    res.status(200).json({
      success: true,
      data: {
        stats,
        status: messageQueue.getQueueStatus()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Message queue endpoint error', { error: (error as Error).message }, error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Message queue status check failed',
      timestamp: new Date().toISOString()
    });
}
}

// 连接状态端点
export async function connectionsHandler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const connectionStates = reconnectManager.getAllConnectionStates();
    const networkMetrics = reconnectManager.getNetworkMetrics();
    const telegramConnection = reconnectManager.getTelegramConnection();
    
    res.status(200).json({
      success: true,
      data: {
        states: connectionStates,
        network: networkMetrics,
        telegram: telegramConnection
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Connections endpoint error', { error: (error as Error).message }, error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Connection status check failed',
      timestamp: new Date().toISOString()
    });
}
}

// 手动重启端点
export async function restartHandler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
}
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { reason } = req.body || {};
    
    // 验证重启请求
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.RESTART_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      logger.warn('Unauthorized restart attempt', {
        ip: req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        timestamp: new Date().toISOString()
      });
    }
    
    logger.info('Manual restart requested', { reason, ip: req.connection.remoteAddress });
    
    // 启动重启流程
    const restartPromise = faultToleranceManager.triggerRecovery('manual_restart', reason || 'Manual restart via API');
    
    // 立即返回响应
    res.status(200).json({
      success: true,
      data: {
        message: 'Restart initiated',
        reason: reason || 'Manual restart',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
    // 延迟执行重启
    setTimeout(() => {
      restartPromise.catch(error => {
        logger.error('Restart failed', { error: error.message });
      });
    }, 1000);
    
  } catch (error) {
    logger.error('Restart endpoint error', { error: (error as Error).message }, error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Restart failed',
      timestamp: new Date().toISOString()
    });
  }
}

// 日志端点
export async function logsHandler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const { level, limit = 100, component } = req.query;
    
    // 简化的日志获取（实际应该从文件或数据库获取）
    const logs = {
      recent: [],
      stats: {
        total: 0,
        byLevel: { error: 0, warn: 0, info: 0, debug: 0 }
}
    };
    
    // 这里应该实现实际的日志查询逻辑
    // 暂时返回模拟数据
    
    res.status(200).json({
      success: true,
      data: {
        logs: logs.recent,
        stats: logs.stats,
        query: {
          level,
          limit,
          component
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Logs endpoint error', { error: (error as Error).message }, error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Logs retrieval failed',
      timestamp: new Date().toISOString()
    });
  }
}

// 错误统计端点
export async function errorsHandler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const errorStats = (logger as any).errorTracker?.getErrorStats?.() || {
      totalTypes: 0,
      totalErrors: 0,
      topErrors: [],
      uptime: 0
    };
    
    res.status(200).json({
      success: true,
      data: {
        stats: errorStats,
        recent: [], // 最近错误详情
        trends: {
          // 错误趋势数据
          hourly: [],
          daily: []
}
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Errors endpoint error', { error: (error as Error).message }, error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Error stats retrieval failed',
      timestamp: new Date().toISOString()
    });
  }
}

// 配置端点
export async function configHandler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const config = getFaultToleranceConfig();
    
    // 隐藏敏感信息
    const sanitizedConfig = {
      ...config,
      monitoring: {
        ...config.monitoring,
        alertWebhook: config.monitoring.alertWebhook ? '***' : undefined
}
    };
    
    res.status(200).json({
      success: true,
      data: {
        config: sanitizedConfig,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Config endpoint error', { error: (error as Error).message }, error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Config retrieval failed',
      timestamp: new Date().toISOString()
    });
  }
}

// 根端点 - 系统概览
export async function rootHandler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const [healthStatus, systemStatus, metrics] = await Promise.all([;
      healthMonitor.getHealthStatus(),
      faultToleranceManager.getSystemStatus(),
      faultToleranceManager.getMetrics()
    ]);
    
    const responseData = {
      service: {
        name: 'Telegram Bot',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
      },
      status: {
        overall: systemStatus.overall,
        health: healthStatus.status,
        components: systemStatus.components
      },
      quickStats: {
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        messageQueueSize: metrics.messageQueue.queueLength,
        errorCount: metrics.recoveryStats.totalRecoveries,
        lastRestart: metrics.recoveryStats.lastRecovery?.timestamp || null
      },
      links: {
        health: '/api/health',
        status: '/api/status',
        metrics: '/api/metrics',
        messageQueue: '/api/message-queue',
        connections: '/api/connections',
        logs: '/api/logs',
        errors: '/api/errors',
        config: '/api/config'
}
    };
    
    res.status(200).json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Root endpoint error', { error: (error as Error).message }, error as Error);
    
    res.status(500).json({
      success: false,
      error: 'System overview failed',
      timestamp: new Date().toISOString()
    });
  }
}

// 统一错误处理中间件
export function withErrorHandler(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      logger.error('API handler error', {
        handler: handler.name,
        error: (error as Error).message,
        stack: (error as Error).stack,
        url: req.url,
        method: req.method
      }, error as Error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
}
  };
}

// 请求日志中间件
export function withRequestLogging(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    
    // 记录请求开始
    logger.debug('API request started', {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.connection.remoteAddress
    });
    
    // 监听响应完成
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      logger.debug('API request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration
      });
    });
    
    await handler(req, res);
  };
}