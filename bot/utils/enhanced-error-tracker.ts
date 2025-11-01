import { EventEmitter } from 'events';
import { logger } from './logger';
/**
 * 增强的错误追踪和分析系统
 * 全面跟踪、分类、分析和报告系统中的错误
 */


export interface ErrorRecord {
  id: string;
  type: string;
  message: string;
  stack?: string;
  timestamp: string;
  severity: ErrorSeverity;
  component: string;
  context: ErrorContext;
  fingerprint: string;
  occurrenceCount: number;
  firstOccurrence: string;
  lastOccurrence: string;
  resolved: boolean;
  resolvedAt?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorContext {
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  systemInfo?: SystemInfo;
  environment?: string;
  version?: string;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  uptime: number;
  cpu: {
    model: string;
    speed: number;
    count: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
  };
}

export interface ErrorStats {
  totalErrors: number;
  uniqueErrors: number;
  resolvedErrors: number;
  criticalErrors: number;
  errorRate: number; // 每分钟错误数
  topErrors: ErrorTypeCount[];
  errorsByComponent: ComponentErrorCount[];
  errorsBySeverity: SeverityCount[];
  recentTrends: ErrorTrend[];
}

export interface ErrorTypeCount {
  type: string;
  count: number;
  percentage: number;
}

export interface ComponentErrorCount {
  component: string;
  count: number;
  percentage: number;
}

export interface SeverityCount {
  severity: ErrorSeverity;
  count: number;
  percentage: number;
}

export interface ErrorTrend {
  timestamp: string;
  count: number;
  cumulative: number;
}

export interface ErrorPattern {
  pattern: string;
  frequency: number;
  severity: ErrorSeverity;
  components: string[];
  description: string;
  recommendations: string[];
}

export interface ErrorFilter {
  component?: string;
  severity?: ErrorSeverity;
  type?: string;
  timeRange?: {
    start: string;
    end: string;
  };
  resolved?: boolean;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical' | 'fatal';

export class EnhancedErrorTracker extends EventEmitter {
  private errors: Map<string, ErrorRecord> = new Map();
  private errorHistory: ErrorRecord[] = [];
  private patterns: ErrorPattern[] = [];
  private maxHistorySize = 10000;
  private analysisInterval: NodeJS.Timeout | null = null;
  private stats: ErrorStats = this.initializeStats();

  constructor() {
    super();
    this.startErrorAnalysis();
    this.setupEventHandlers();
}

  // 记录错误
  public recordError(
    type: string,
    error: Error | string,
    options: {
      severity?: ErrorSeverity;
      component?: string;
      context?: Partial<ErrorContext>;
      metadata?: Record<string, any>;
      userId?: string;
      sessionId?: string;
      requestId?: string;
    } = {}
  ): string {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;
    const fingerprint = this.generateFingerprint(type, errorMessage, options.component);

    const now = new Date().toISOString();

    const errorRecord: ErrorRecord = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message: errorMessage,
      stack: errorStack,
      timestamp: now,
      severity: options.severity || this.determineSeverity(errorMessage),
      component: options.component || 'unknown',
      context: {
        ...this.collectContext(),
        ...options.context
      },
      fingerprint,
      occurrenceCount: 1,
      firstOccurrence: now,
      lastOccurrence: now,
      resolved: false,
      userId: options.userId,
      sessionId: options.sessionId,
      requestId: options.requestId,
      metadata: options.metadata
    };

    // 检查是否已存在相同错误
    const existingError = this.errors.get(fingerprint);
    if (existingError) {
      // 更新现有错误记录
      this.updateExistingError(existingError, errorRecord);
    } else {
      // 添加新错误记录
      this.errors.set(fingerprint, errorRecord);
      this.errorHistory.push(errorRecord);
      
      // 限制历史记录大小
      if (this.errorHistory.length > this.maxHistorySize) {
        this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
      }
    }

    // 保存到数据库（异步）
    this.saveErrorToDatabase(errorRecord).catch(err => {
      logger.error('Failed to save error to database', { error: err.message });
    });

    // 发送事件
    this.emit('error:recorded', errorRecord);
    this.emit('error:new', errorRecord);

    // 更新统计信息
    this.updateStats();

    // 检查是否需要触发告警
    this.checkAlertConditions(errorRecord);

    // 分析错误模式
    this.analyzeErrorPattern(errorRecord);

    logger.warn('Error recorded', {
      errorId: errorRecord.id,
      type,
      severity: errorRecord.severity,
      component: errorRecord.component,
      message: errorMessage,
      fingerprint
    });

    return errorRecord.id;
  }

  // 更新现有错误
  private updateExistingError(existing: ErrorRecord, newError: ErrorRecord): void {
    existing.occurrenceCount++;
    existing.lastOccurrence = newError.timestamp;
    existing.stack = newError.stack || existing.stack; // 更新为最新堆栈信息
    
    // 更新上下文信息
    existing.context = {
      ...existing.context,
      ...newError.context
    };

    // 如果严重程度提高了，更新严重程度
    if (this.getSeverityLevel(newError.severity) > this.getSeverityLevel(existing.severity)) {
      existing.severity = newError.severity;
    }

    // 更新元数据
    existing.metadata = {
      ...existing.metadata,
      ...newError.metadata
    };
  }

  // 确定错误严重程度
  private determineSeverity(message: string): ErrorSeverity {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('fatal') || lowerMessage.includes('critical')) {
      return 'critical';
    }
    
    if (lowerMessage.includes('database') || lowerMessage.includes('connection')) {
      return 'high';
    }
    
    if (lowerMessage.includes('timeout') || lowerMessage.includes('unauthorized')) {
      return 'medium';
    }
    
    return 'low';
  }

  // 获取严重程度等级
  private getSeverityLevel(severity: ErrorSeverity): number {
    const levels = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4,
      'fatal': 5
    };
    return levels[severity];
  }

  // 收集错误上下文
  private collectContext(): ErrorContext {
    return {
      userAgent: process.env.USER_AGENT,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
      systemInfo: this.collectSystemInfo(),
      memoryUsage: process.memoryUsage()
    };
  }

  // 收集系统信息
  private collectSystemInfo(): SystemInfo {
    const os = require('os');
    const cpus = os.cpus();
    
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime(),
      cpu: {
        model: cpus[0]?.model || 'unknown',
        speed: cpus[0]?.speed || 0,
        count: cpus.length
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      }
    };
  }

  // 生成错误指纹
  private generateFingerprint(type: string, message: string, component?: string): string {
    const key = `${type}:${component}:${this.sanitizeMessage(message)}`;
    return this.simpleHash(key);
  }

  // 清理消息（移除变化的数字和ID）
  private sanitizeMessage(message: string): string {
    return message;
      .replace(/\b\d{4,}\b/g, '<NUM>') // 替换长数字
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<UUID>') // 替换UUID
      .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '<EMAIL>') // 替换邮箱
      .trim();
  }

  // 简单哈希函数
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(16);
  }

  // 保存错误到数据库
  private async saveErrorToDatabase(error: ErrorRecord): Promise<void> {
    try {
      // 这里可以扩展为保存到数据库
      // 暂时记录到日志
      logger.debug('Error saved to database', {
        errorId: error.id,
        type: error.type,
        component: error.component
      });
    } catch (error) {
      logger.error('Failed to save error to database', { 
        errorId: error.id,
        error: (error as Error).message 
      });
    }
  }

  // 检查告警条件
  private checkAlertConditions(error: ErrorRecord): void {
    // 如果是严重错误，发送告警
    if (error.severity === 'critical' || error.severity === 'fatal') {
      this.emit('error:critical', error);
      
      // 记录严重错误日志
      logger.error('Critical error detected', {
        errorId: error.id,
        type: error.type,
        message: error.message,
        component: error.component,
        stack: error.stack
      }, error.stack ? new Error(error.stack) : new Error(error.message));
    }

    // 如果错误频率过高，发送告警
    const existingError = this.errors.get(error.fingerprint);
    if (existingError && existingError.occurrenceCount > 10) {
      this.emit('error:frequent', existingError);
    }
  }

  // 分析错误模式
  private analyzeErrorPattern(error: ErrorRecord): void {
    // 简单的模式分析
    const pattern = this.detectErrorPattern(error);
    if (pattern) {
      this.emit('error:pattern_detected', pattern);
    }
  }

  // 检测错误模式
  private detectErrorPattern(error: ErrorRecord): ErrorPattern | null {
    // 分析最近的错误，寻找模式
    const recentErrors = this.errorHistory;
      .filter(e :> Date.now() - new Date(e.timestamp).getTime() < 300000) // 5分钟内
      .filter(e => e.component === error.component);

    if (recentErrors.length >= 5) {
      const pattern: ErrorPattern = {
        pattern: `${error.type} in ${error.component}`,
        frequency: recentErrors.length,
        severity: error.severity,
        components: [error.component],
        description: `Error ${error.type} is occurring frequently in ${error.component}`,
        recommendations: [
          `Check ${error.component} configuration`,
          'Review recent deployments',
          'Monitor system resources',
          'Check external dependencies'
        ]
      };

      return pattern;
    }

    return null;
  }

  // 更新统计信息
  private updateStats(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentErrors = this.errorHistory.filter(;
      e :> new Date(e.timestamp) > oneHourAgo
    );

    this.stats = {
      totalErrors: this.errorHistory.length,
      uniqueErrors: this.errors.size,
      resolvedErrors: Array.from(this.errors.values()).filter(e => e.resolved).length,
      criticalErrors: this.errorHistory.filter(e => e.severity === 'critical').length,
      errorRate: recentErrors.length,
      topErrors: this.calculateTopErrors(),
      errorsByComponent: this.calculateErrorsByComponent(),
      errorsBySeverity: this.calculateErrorsBySeverity(),
      recentTrends: this.calculateErrorTrends()
    };

    this.emit('stats:updated', this.stats);
  }

  // 计算顶级错误
  private calculateTopErrors(): ErrorTypeCount[] {
    const errorTypes = new Map<string, number>();
    
    this.errorHistory.forEach(error => {
      const count = errorTypes.get(error.type) || 0;
      errorTypes.set(error.type, count + 1);
    });

    const total = this.errorHistory.length;
    return Array.from(errorTypes.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // 计算按组件分组的错误
  private calculateErrorsByComponent(): ComponentErrorCount[] {
    const components = new Map<string, number>();
    
    this.errorHistory.forEach(error => {
      const count = components.get(error.component) || 0;
      components.set(error.component, count + 1);
    });

    const total = this.errorHistory.length;
    return Array.from(components.entries())
      .map(([component, count]) => ({
        component,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  // 计算按严重程度分组的错误
  private calculateErrorsBySeverity(): SeverityCount[] {
    const severities = new Map<ErrorSeverity, number>();
    
    this.errorHistory.forEach(error => {
      const count = severities.get(error.severity) || 0;
      severities.set(error.severity, count + 1);
    });

    const total = this.errorHistory.length;
    return Array.from(severities.entries())
      .map(([severity, count]) => ({
        severity,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => this.getSeverityLevel(b.severity) - this.getSeverityLevel(a.severity));
  }

  // 计算错误趋势
  private calculateErrorTrends(): ErrorTrend[] {
    const trends: ErrorTrend[] = [];
    const now = new Date();
    let cumulative = 0;

    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const hourErrors = this.errorHistory.filter(;
        error => {
          const errorTime = new Date(error.timestamp);
          return errorTime >= hourStart && errorTime < hourEnd;
        }
      );

      cumulative += hourErrors.length;
      trends.push({
        timestamp: hourStart.toISOString(),
        count: hourErrors.length,
        cumulative
      });
    }

    return trends;
  }

  // 获取错误
  public getError(fingerprint: string): ErrorRecord | undefined {
    return this.errors.get(fingerprint);
  }

  // 获取所有错误
  public getErrors(filter?: ErrorFilter): ErrorRecord[] {
    let errors = Array.from(this.errors.values());

    if (filter) {
      if (filter.component) {
        errors = errors.filter(e => e.component === filter.component);
      }
      if (filter.severity) {
        errors = errors.filter(e => e.severity === filter.severity);
      }
      if (filter.type) {
        errors = errors.filter(e => e.type === filter.type);
      }
      if (filter.resolved !== undefined) {
        errors = errors.filter(e => e.resolved === filter.resolved);
      }
      if (filter.timeRange) {
        const start = new Date(filter.timeRange.start);
        const end = new Date(filter.timeRange.end);
        errors = errors.filter(e => {
          const timestamp = new Date(e.timestamp);
          return timestamp >= start && timestamp <= end;
  }
        });
      }
    }

    return errors.sort((a, b) =>;
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // 解决错误
  public resolveError(fingerprint: string, resolvedBy: string = 'system'): boolean {
    const error = this.errors.get(fingerprint);
    if (error) {
      error.resolved = true;
      error.resolvedAt = new Date().toISOString();

      this.emit('error:resolved', error);
      this.updateStats();

      logger.info('Error resolved', {
        errorId: error.id,
        type: error.type,
        resolvedBy,
        occurrenceCount: error.occurrenceCount
      });

      return true;
    }
    return false;
  }

  // 批量解决错误
  public resolveErrors(fingerprints: string[], resolvedBy: string = 'system'): number {
    let resolved = 0;
    for (const fingerprint of fingerprints) {
      if (this.resolveError(fingerprint, resolvedBy)) {
        resolved++;
      }
    }
    return resolved;
  }

  // 获取统计信息
  public getErrorStats(): ErrorStats {
    return { ...this.stats };
  }

  // 获取错误模式
  public getErrorPatterns(): ErrorPattern[] {
    return [...this.patterns];
  }

  // 清理旧错误
  public cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    const cutoff = new Date(Date.now() - maxAge);
    let cleaned = 0;

    for (const [fingerprint, error] of this.errors) {
      if (error.resolved && new Date(error.lastOccurrence) < cutoff) {
        this.errors.delete(fingerprint);
        cleaned++;
      }
    }

    // 清理历史记录
    this.errorHistory : this.errorHistory.filter(
      error :> new Date(error.timestamp) > cutoff
    );

    logger.info('Error cleanup completed', {
      cleaned,
      remainingErrors: this.errors.size,
      remainingHistory: this.errorHistory.length
    });

    return cleaned;
  }

  // 初始化统计
  private initializeStats(): ErrorStats {
    return {
      totalErrors: 0,
      uniqueErrors: 0,
      resolvedErrors: 0,
      criticalErrors: 0,
      errorRate: 0,
      topErrors: [],
      errorsByComponent: [],
      errorsBySeverity: [],
      recentTrends: []
    };
  }

  // 启动错误分析
  private startErrorAnalysis(): void {
    this.analysisInterval = setInterval(() => {
      this.performErrorAnalysis();
    }, 5 * 60 * 1000); // 每5分钟分析一次
  }

  // 执行错误分析
  private performErrorAnalysis(): void {
    try {
      // 分析错误模式
      this.analyzeErrorPatterns();
      
      // 生成分析报告
      this.generateAnalysisReport();
      
      // 更新统计信息
      this.updateStats();

    } catch (error) {
      logger.error('Error analysis failed', { error: (error as Error).message }, error as Error);
    }
  }

  // 分析错误模式
  private analyzeErrorPatterns(): void {
    // 寻找重复出现的错误模式
    const groupedErrors = new Map<string, ErrorRecord[]>();
    
    this.errorHistory.forEach(error => {
      const key = `${error.type}:${error.component}`;
      const group = groupedErrors.get(key) || [];
      group.push(error);
      groupedErrors.set(key, group);
    });

    // 识别高频错误模式
    for (const [key, errors] of groupedErrors) {
      if (errors.length >= 5) {
        const pattern: ErrorPattern = {
          pattern: key,
          frequency: errors.length,
          severity: this.getMostCommonSeverity(errors),
          components: [...new Set(errors.map(e => e.component))],
          description: `Pattern "${key}" occurred ${errors.length} times`,
          recommendations: this.generateRecommendations(errors)
        };

        // 检查是否已存在该模式
        const existing = this.patterns.find(p => p.pattern === pattern.pattern);
        if (!existing) {
          this.patterns.push(pattern);
          this.emit('pattern:detected', pattern);
        }
      }
    }
  }

  // 获取最常见的严重程度
  private getMostCommonSeverity(errors: ErrorRecord[]): ErrorSeverity {
    const severityCounts = new Map<ErrorSeverity, number>();
    
    errors.forEach(error => {
      const count = severityCounts.get(error.severity) || 0;
      severityCounts.set(error.severity, count + 1);
    });

    let maxSeverity: ErrorSeverity = 'low';
    let maxCount = 0;

    for (const [severity, count] of severityCounts) {
      if (count > maxCount) {
        maxCount = count;
        maxSeverity = severity;
      }
    }

    return maxSeverity;
  }

  // 生成建议
  private generateRecommendations(errors: ErrorRecord[]): string[] {
    const recommendations = new Set<string>();
    
    // 基于错误类型生成建议
    const type = (errors?.0 ?? null).type;
    if (type.includes('database')) {
      recommendations.add('Check database connection and query performance');
      recommendations.add('Review database indexes and optimize slow queries');
    }
    
    if (type.includes('memory')) {
      recommendations.add('Monitor memory usage and identify memory leaks');
      recommendations.add('Optimize data structures and garbage collection');
    }
    
    if (type.includes('timeout')) {
      recommendations.add('Increase timeout values or optimize response times');
      recommendations.add('Check network connectivity and external service status');
    }

    // 默认建议
    recommendations.add('Review application logs for more details');
    recommendations.add('Check system resources and configuration');
    
    return Array.from(recommendations);
  }

  // 生成分析报告
  private generateAnalysisReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: this.errorHistory.length,
        uniqueErrors: this.errors.size,
        patterns: this.patterns.length,
        criticalErrors: this.errorHistory.filter(e => e.severity === 'critical').length
      },
      topComponents: this.calculateErrorsByComponent().slice(0, 5),
      severityDistribution: this.calculateErrorsBySeverity(),
      trends: this.calculateErrorTrends().slice(-24), // 最近24小时
      patterns: this.patterns.slice(0, 10)
    };

    this.emit('analysis:report', report);
    logger.debug('Error analysis report generated', report);
  }

  // 设置事件处理器
  private setupEventHandlers(): void {
    this.on('error:critical', (error: ErrorRecord) => {
      logger.error('Critical error detected', {
        errorId: error.id,
        type: error.type,
        component: error.component,
        message: error.message
      });
    });

    this.on('error:frequent', (error: ErrorRecord) => {
      logger.warn('Frequent error detected', {
        errorId: error.id,
        type: error.type,
        component: error.component,
        occurrenceCount: error.occurrenceCount
      });
    });
  }

  // 销毁追踪器
  public destroy(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }

    this.removeAllListeners();
    this.errors.clear();
    this.errorHistory = [];
    this.patterns = [];

    logger.info('Enhanced error tracker destroyed');
  }
}

// 导出单例实例
export const enhancedErrorTracker = new EnhancedErrorTracker();