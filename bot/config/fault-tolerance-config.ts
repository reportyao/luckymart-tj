/**
 * 容错系统配置文件
 * 统一管理所有组件的配置参数
 */

export interface FaultToleranceConfiguration {
  // 健康检查配置
  healthCheck: {
    enabled: boolean;
    interval: number; // 检查间隔(毫秒)
    timeout: number; // 检查超时(毫秒)
    criticalThreshold: number; // 严重问题阈值
    warningThreshold: number; // 警告阈值
  };

  // 进程监控配置
  processMonitor: {
    enabled: boolean;
    healthCheckInterval: number;
    memoryThreshold: number; // MB
    cpuThreshold: number; // 百分比
    maxUptime: number; // 小时
    restartDelay: number; // 毫秒
    enableAutoRestart: boolean;
  };

  // 消息队列配置
  messageQueue: {
    enabled: boolean;
    maxConcurrent: number;
    maxRetries: number;
    initialDelay: number; // 毫秒
    maxDelay: number; // 毫秒
    backoffFactor: number;
    clearFailedMessagesInterval: number; // 毫秒
    clearFailedMessagesOlderThan: number; // 小时
  };

  // 重连管理器配置
  reconnectManager: {
    enabled: boolean;
    maxRetries: number;
    initialDelay: number; // 毫秒
    maxDelay: number; // 毫秒
    backoffFactor: number;
    jitter: boolean;
    timeout: number; // 毫秒
    enableExponentialBackoff: boolean;
  };

  // 日志系统配置
  logging: {
    enabled: boolean;
    level: 'error' | 'warn' | 'info' | 'debug';
    consoleOutput: boolean;
    fileOutput: boolean;
    maxFileSize: string; // 例如: '20m'
    maxFiles: number; // 文件保留数量
    datePattern: string; // 日期模式
    enablePerformanceLogging: boolean;
    enableSecurityLogging: boolean;
    enableBusinessLogging: boolean;
  };

  // 监控告警配置
  monitoring: {
    enabled: boolean;
    healthCheckEndpoint: string;
    metricsEndpoint: string;
    statusEndpoint: string;
    alertWebhook?: string;
    alertThresholds: {
      memoryUsage: number; // 百分比
      cpuUsage: number; // 百分比
      errorRate: number; // 每小时错误数
      responseTime: number; // 毫秒
    };
  };

  // 自动恢复配置
  autoRecovery: {
    enabled: boolean;
    strategies: Array<{
      condition: string;
      action: 'restart' | 'retry' | 'fallback' | 'alert';
      maxAttempts: number;
      delay: number;
    }>;
    maxRetries: number;
    retryDelay: number;
    enableExponentialBackoff: boolean;
  };

  // 资源监控配置
  resourceMonitoring: {
    enabled: boolean;
    memoryCheckInterval: number; // 毫秒
    cpuCheckInterval: number; // 毫秒
    diskCheckInterval: number; // 毫秒
    networkCheckInterval: number; // 毫秒
    memoryThreshold: number; // MB
    cpuThreshold: number; // 百分比
    diskThreshold: number; // 百分比
  };

  // 连接池配置
  connectionPool: {
    enabled: boolean;
    maxConnections: number;
    minConnections: number;
    acquireTimeout: number; // 毫秒
    createTimeout: number; // 毫秒
    destroyTimeout: number; // 毫秒
    idleTimeout: number; // 毫秒
    reapInterval: number; // 毫秒
    createRetryInterval: number; // 毫秒
  };
}

// 开发环境配置
export const developmentConfig: FaultToleranceConfiguration = {
  healthCheck: {
    enabled: true,
    interval: 30000, // 30秒
    timeout: 5000,
    criticalThreshold: 3,
    warningThreshold: 5
  },

  processMonitor: {
    enabled: true,
    healthCheckInterval: 30000,
    memoryThreshold: 256, // 256MB
    cpuThreshold: 70,
    maxUptime: 24, // 24小时
    restartDelay: 5000,
    enableAutoRestart: true
  },

  messageQueue: {
    enabled: true,
    maxConcurrent: 5,
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    clearFailedMessagesInterval: 600000, // 10分钟
    clearFailedMessagesOlderThan: 24 // 24小时
  },

  reconnectManager: {
    enabled: true,
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 15000,
    backoffFactor: 2,
    jitter: true,
    timeout: 5000,
    enableExponentialBackoff: true
  },

  logging: {
    enabled: true,
    level: 'debug',
    consoleOutput: true,
    fileOutput: true,
    maxFileSize: '10m',
    maxFiles: 7,
    datePattern: 'YYYY-MM-DD',
    enablePerformanceLogging: true,
    enableSecurityLogging: true,
    enableBusinessLogging: true
  },

  monitoring: {
    enabled: true,
    healthCheckEndpoint: '/api/health',
    metricsEndpoint: '/api/metrics',
    statusEndpoint: '/api/status',
    alertThresholds: {
      memoryUsage: 80,
      cpuUsage: 80,
      errorRate: 100,
      responseTime: 5000
}
  },

  autoRecovery: {
    enabled: true,
    strategies: [
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
    enableExponentialBackoff: true
  },

  resourceMonitoring: {
    enabled: true,
    memoryCheckInterval: 30000,
    cpuCheckInterval: 10000,
    diskCheckInterval: 60000,
    networkCheckInterval: 30000,
    memoryThreshold: 512,
    cpuThreshold: 80,
    diskThreshold: 90
  },

  connectionPool: {
    enabled: false, // 开发环境不启用连接池
    maxConnections: 10,
    minConnections: 2,
    acquireTimeout: 30000,
    createTimeout: 30000,
    destroyTimeout: 5000,
    idleTimeout: 300000,
    reapInterval: 1000,
    createRetryInterval: 200
  }
};

// 生产环境配置
export const productionConfig: FaultToleranceConfiguration = {
  healthCheck: {
    enabled: true,
    interval: 60000, // 1分钟
    timeout: 10000,
    criticalThreshold: 2,
    warningThreshold: 3
  },

  processMonitor: {
    enabled: true,
    healthCheckInterval: 60000,
    memoryThreshold: 512, // 512MB
    cpuThreshold: 75,
    maxUptime: 168, // 7天
    restartDelay: 10000,
    enableAutoRestart: true
  },

  messageQueue: {
    enabled: true,
    maxConcurrent: 20,
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffFactor: 2,
    clearFailedMessagesInterval: 3600000, // 1小时
    clearFailedMessagesOlderThan: 72 // 72小时
  },

  reconnectManager: {
    enabled: true,
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 30000,
    backoffFactor: 2,
    jitter: true,
    timeout: 15000,
    enableExponentialBackoff: true
  },

  logging: {
    enabled: true,
    level: 'info',
    consoleOutput: false,
    fileOutput: true,
    maxFileSize: '50m',
    maxFiles: 30,
    datePattern: 'YYYY-MM-DD',
    enablePerformanceLogging: true,
    enableSecurityLogging: true,
    enableBusinessLogging: true
  },

  monitoring: {
    enabled: true,
    healthCheckEndpoint: '/api/health',
    metricsEndpoint: '/api/metrics',
    statusEndpoint: '/api/status',
    alertWebhook: process.env.MONITORING_WEBHOOK,
    alertThresholds: {
      memoryUsage: 85,
      cpuUsage: 85,
      errorRate: 50,
      responseTime: 3000
}
  },

  autoRecovery: {
    enabled: true,
    strategies: [
      {
        condition: 'database_connection_lost',
        action: 'retry',
        maxAttempts: 5,
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
        maxAttempts: 3,
        delay: 3000
      },
      {
        condition: 'network_timeout',
        action: 'fallback',
        maxAttempts: 2,
        delay: 1000
      }
    ],
    maxRetries: 5,
    retryDelay: 2000,
    enableExponentialBackoff: true
  },

  resourceMonitoring: {
    enabled: true,
    memoryCheckInterval: 30000,
    cpuCheckInterval: 10000,
    diskCheckInterval: 300000, // 5分钟
    networkCheckInterval: 60000, // 1分钟
    memoryThreshold: 1024,
    cpuThreshold: 80,
    diskThreshold: 85
  },

  connectionPool: {
    enabled: true,
    maxConnections: 50,
    minConnections: 10,
    acquireTimeout: 30000,
    createTimeout: 30000,
    destroyTimeout: 5000,
    idleTimeout: 300000,
    reapInterval: 1000,
    createRetryInterval: 200
  }
};

// 测试环境配置
export const testConfig: FaultToleranceConfiguration = {
  healthCheck: {
    enabled: false,
    interval: 60000,
    timeout: 5000,
    criticalThreshold: 3,
    warningThreshold: 5
  },

  processMonitor: {
    enabled: false,
    healthCheckInterval: 60000,
    memoryThreshold: 128,
    cpuThreshold: 90,
    maxUptime: 1, // 1小时
    restartDelay: 1000,
    enableAutoRestart: false
  },

  messageQueue: {
    enabled: false,
    maxConcurrent: 2,
    maxRetries: 1,
    initialDelay: 100,
    maxDelay: 1000,
    backoffFactor: 2,
    clearFailedMessagesInterval: 300000, // 5分钟
    clearFailedMessagesOlderThan: 1 // 1小时
  },

  reconnectManager: {
    enabled: false,
    maxRetries: 1,
    initialDelay: 100,
    maxDelay: 1000,
    backoffFactor: 2,
    jitter: false,
    timeout: 1000,
    enableExponentialBackoff: false
  },

  logging: {
    enabled: true,
    level: 'error',
    consoleOutput: true,
    fileOutput: false,
    maxFileSize: '1m',
    maxFiles: 1,
    datePattern: 'YYYY-MM-DD',
    enablePerformanceLogging: false,
    enableSecurityLogging: false,
    enableBusinessLogging: false
  },

  monitoring: {
    enabled: false,
    healthCheckEndpoint: '/api/health',
    metricsEndpoint: '/api/metrics',
    statusEndpoint: '/api/status',
    alertThresholds: {
      memoryUsage: 95,
      cpuUsage: 95,
      errorRate: 1000,
      responseTime: 10000
}
  },

  autoRecovery: {
    enabled: false,
    strategies: [],
    maxRetries: 1,
    retryDelay: 100,
    enableExponentialBackoff: false
  },

  resourceMonitoring: {
    enabled: false,
    memoryCheckInterval: 60000,
    cpuCheckInterval: 60000,
    diskCheckInterval: 60000,
    networkCheckInterval: 60000,
    memoryThreshold: 256,
    cpuThreshold: 95,
    diskThreshold: 95
  },

  connectionPool: {
    enabled: false,
    maxConnections: 5,
    minConnections: 1,
    acquireTimeout: 1000,
    createTimeout: 1000,
    destroyTimeout: 1000,
    idleTimeout: 60000,
    reapInterval: 1000,
    createRetryInterval: 100
  }
};

// 获取当前环境的配置
export function getFaultToleranceConfig(): FaultToleranceConfiguration {
  const environment = process.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    case 'development':
    default:
      return developmentConfig;
}
}

// 配置验证器
export function validateConfig(config: FaultToleranceConfiguration): boolean {
  const errors: string[] = [];

  // 验证健康检查配置
  if (config.healthCheck.interval < 1000) {
    errors.push('Health check interval must be at least 1000ms');
}

  if (config.healthCheck.timeout > config.healthCheck.interval) {
    errors.push('Health check timeout must be less than interval');
  }

  // 验证进程监控配置
  if (config.processMonitor.memoryThreshold < 64) {
    errors.push('Memory threshold must be at least 64MB');
  }

  if (config.processMonitor.cpuThreshold < 50 || config.processMonitor.cpuThreshold > 100) {
    errors.push('CPU threshold must be between 50% and 100%');
  }

  // 验证消息队列配置
  if (config.messageQueue.maxConcurrent < 1) {
    errors.push('Max concurrent must be at least 1');
  }

  if (config.messageQueue.maxRetries < 0) {
    errors.push('Max retries cannot be negative');
  }

  // 验证重连管理器配置
  if (config.reconnectManager.maxRetries < 0) {
    errors.push('Max retries cannot be negative');
  }

  if (config.reconnectManager.initialDelay < 100) {
    errors.push('Initial delay must be at least 100ms');
  }

  // 验证日志配置
  const validLogLevels = ['error', 'warn', 'info', 'debug'];
  if (!validLogLevels.includes(config.logging.level)) {
    errors.push('Invalid log level');
  }

  // 验证监控配置
  if (config.monitoring.alertThresholds.memoryUsage < 0 || config.monitoring.alertThresholds.memoryUsage > 100) {
    errors.push('Memory alert threshold must be between 0% and 100%');
  }

  if (errors.length > 0) {
    console.error('Configuration validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    return false;
  }

  return true;
}

// 配置热重载支持
export function watchConfigChanges(configPath: string, callback: (config: FaultToleranceConfiguration) => void) {
  if (process.env.NODE_ENV === 'production') {
    return; // 生产环境不启用配置监控
}

  try {
    const fs = require('fs');
    const path = require('path');

    if (fs.existsSync(configPath)) {
      fs.watch(configPath, { persistent: true }, (eventType: string, filename: string) => {
        if (eventType === 'change') {
          try {
            const configData = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configData);
            
            if (validateConfig(config)) {
              callback(config);
              console.log(`Configuration reloaded from ${configPath}`);
            }
          } catch (error) {
            console.error('Failed to reload configuration:', error);
          }
        }
      });
    }
  } catch (error) {
    console.error('Failed to setup config file watching:', error);
  }
}