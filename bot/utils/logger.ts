/**
 * 增强的日志系统
 * 支持多级别日志、文件轮转、错误追踪
 */

import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack: string;
    code?: string;
  };
}

class BotLogger {
  private logger: any;
  private serviceName: string;
  private logDir: string;

  constructor(serviceName: string = 'telegram-bot') {
    this.serviceName = serviceName;
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    this.initializeLogger();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private initializeLogger() {
    const logFormat = format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.errors({ stack: true }),
      format.json(),
      format.prettyPrint()
    );

    // 文件日志配置
    const fileTransport = new (transports as any).DailyRotateFile({
      filename: path.join(this.logDir, `${this.serviceName}-%DATE%.log`),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: LogLevel.INFO,
      format: logFormat,
    });

    const errorTransport = new (transports as any).DailyRotateFile({
      filename: path.join(this.logDir, `${this.serviceName}-error-%DATE%.log`),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: LogLevel.ERROR,
      format: logFormat,
    });

    // 控制台日志配置
    const consoleTransport = new transports.Console({
      level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
      format: format.combine(
        format.colorize(),
        format.simple(),
        format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
          return `[${timestamp}] ${service || this.serviceName} ${level}: ${message}${metaStr}`;
        })
      )
    });

    this.logger = createLogger({
      level: LogLevel.DEBUG,
      format: logFormat,
      defaultMeta: { service: this.serviceName },
      transports: [
        fileTransport,
        errorTransport,
        consoleTransport
      ],
      exitOnError: false,
    });

    // 文件轮转事件监听
    fileTransport.on('rotate', (oldFilename: string, newFilename: string) => {
      console.log(`日志文件轮转: ${oldFilename} -> ${newFilename}`);
    });
  }

  private formatLog(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack || '',
        code: (error as any).code
      } : undefined
    };
  }

  public error(message: string, context?: Record<string, any>, error?: Error) {
    const logEntry = this.formatLog(LogLevel.ERROR, message, context, error);
    this.logger.error(message, { context, error: error?.stack, ...logEntry });
    
    // 关键错误立即发送到监控
    this.sendToMonitoring(logEntry);
  }

  public warn(message: string, context?: Record<string, any>) {
    const logEntry = this.formatLog(LogLevel.WARN, message, context);
    this.logger.warn(message, { context, ...logEntry });
  }

  public info(message: string, context?: Record<string, any>) {
    const logEntry = this.formatLog(LogLevel.INFO, message, context);
    this.logger.info(message, { context, ...logEntry });
  }

  public debug(message: string, context?: Record<string, any>) {
    const logEntry = this.formatLog(LogLevel.DEBUG, message, context);
    this.logger.debug(message, { context, ...logEntry });
  }

  // 性能日志
  public performance(operation: string, duration: number, context?: Record<string, any>) {
    const logEntry = this.formatLog(LogLevel.INFO, `Performance: ${operation}`, {
      ...context,
      operation,
      duration,
      durationFormatted: this.formatDuration(duration)
    });
    this.logger.info(`性能监控 - ${operation}`, logEntry);
  }

  // 安全事件日志
  public security(event: string, context?: Record<string, any>) {
    const logEntry = this.formatLog(LogLevel.WARN, `安全事件: ${event}`, {
      ...context,
      event,
      severity: 'HIGH',
      timestamp: Date.now()
    });
    this.logger.warn(`安全事件 - ${event}`, logEntry);
  }

  // 业务事件日志
  public business(event: string, userId?: string, context?: Record<string, any>) {
    const logEntry = this.formatLog(LogLevel.INFO, `业务事件: ${event}`, {
      ...context,
      event,
      userId,
      timestamp: Date.now()
    });
    this.logger.info(`业务事件 - ${event}`, logEntry);
  }

  // 将关键错误发送到监控系统
  private async sendToMonitoring(logEntry: LogEntry) {
    if (process.env.MONITORING_WEBHOOK) {
      try {
        const response = await fetch(process.env.MONITORING_WEBHOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            alert: true,
            severity: logEntry.level,
            message: logEntry.message,
            service: logEntry.service,
            timestamp: logEntry.timestamp,
            context: logEntry.context
          })
        });
        
        if (!response.ok) {
          console.error('Failed to send alert to monitoring system');
        }
      } catch (error) {
        console.error('Failed to send monitoring alert:', error);
      }
    }
  }

  // 获取当前日志统计
  public getLogStats() {
    return {
      service: this.serviceName,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      logs: this.getLogCounts()
    };
  }

  private getLogCounts() {
    // 这里可以实现日志统计逻辑
    return {
      error: 0,
      warn: 0,
      info: 0,
      debug: 0
    };
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }

  // 创建子日志记录器
  public child(component: string) {
    return new BotLogger(`${this.serviceName}:${component}`);
  }
}

// 单例模式的日志记录器
export const logger = new BotLogger();

// 性能监控装饰器
export function performanceLogger(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const logContext = {
        component: target.constructor.name,
        method: propertyName,
        args: args.length
      };
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        logger.performance(operation, duration, logContext);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.error(`操作失败: ${operation}`, {
          ...logContext,
          duration,
          error: error.message
        }, error as Error);
        throw error;
      }
    };
  };
}

// 错误追踪器
export class ErrorTracker {
  private errors: Map<string, number> = new Map();
  private lastReset = Date.now();

  public recordError(errorType: string, error: Error) {
    const count = this.errors.get(errorType) || 0;
    this.errors.set(errorType, count + 1);

    logger.error(`错误统计: ${errorType}`, {
      errorType,
      count: count + 1,
      recent: true,
      error: error.message
    }, error);

    // 每小时重置统计
    if (Date.now() - this.lastReset > 3600000) {
      this.reset();
    }
  }

  public getErrorStats() {
    return {
      totalTypes: this.errors.size,
      totalErrors: Array.from(this.errors.values()).reduce((sum, count) => sum + count, 0),
      topErrors: Array.from(this.errors.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([type, count]) => ({ type, count })),
      uptime: Date.now() - this.lastReset
    };
  }

  public reset() {
    this.errors.clear();
    this.lastReset = Date.now();
    logger.info('错误统计已重置');
  }
}

export const errorTracker = new ErrorTracker();