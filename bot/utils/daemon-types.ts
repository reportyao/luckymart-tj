/**
 * 守护进程相关的类型定义
 */

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
  alertWebhook?: string;
  monitoringEnabled?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface BotProcess {
  child: any;
  startTime: Date;
  pid: number;
  status: 'starting' | 'running' | 'error' | 'exited';
  restartCount: number;
  lastOutput: string;
  errorCount: number;
  lastHealthCheck?: Date;
  lastError?: Error;
  uptime: number;
}

export interface BotMetrics {
  timestamp: string;
  daemon: {
    uptime: number;
    restartCount: number;
    isRunning: boolean;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    eventLoopDelay: number;
  };
  bot: {
    uptime: number;
    pid: number;
    status: string;
    errorCount: number;
    lastRestartTime: Date | null;
    lastError?: string;
    healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  } | null;
  performance: {
    averageRestartTime: number;
    stability: number;
    successRate: number;
    errorRate: number;
  };
  network: {
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
    latency: number;
    packetLoss: number;
  };
}

export interface DaemonEvent {
  type: 'start' | 'stop' | 'restart' | 'error' | 'health_check' | 'metrics';
  timestamp: string;
  data?: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    daemon: HealthCheckResult;
    bot: HealthCheckResult;
    system: HealthCheckResult;
  };
  metrics: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
  };
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  duration: number;
  lastChecked: string;
  details?: Record<string, any>;
}

export interface AlertConfig {
  webhookUrl?: string;
  emailEnabled: boolean;
  telegramEnabled: boolean;
  thresholds: {
    memoryUsage: number;
    cpuUsage: number;
    restartCount: number;
    errorRate: number;
  };
  rateLimiting: {
    enabled: boolean;
    maxAlerts: number;
    timeWindow: number; // 毫秒
  };
}

export interface RestartReason {
  type: 'manual' | 'automatic' | 'error' | 'timeout' | 'health_check_failed';
  description: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source: 'daemon' | 'bot' | 'system';
  data?: Record<string, any>;
}

export interface NetworkInfo {
  interface: string;
  address: string;
  netmask: string;
  family: 'IPv4' | 'IPv6';
  internal: boolean;
  cidr?: string;
}