/**
 * 内存泄漏检测和监控工具
 * 用于检测和预防内存泄漏问题
 */

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  percentage: number;
  timestamp: number;
}

interface MemoryAlert {
  type: 'warning' | 'critical';
  message: string;
  memoryIncrease: number;
  timestamp: number;
}

export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private baselineMemory: number = 0;
  private leakThreshold = 50 * 1024 * 1024; // 50MB
  private warningThreshold = 30 * 1024 * 1024; // 30MB
  private checkInterval?: NodeJS.Timeout;
  private statsHistory: MemoryStats[] = [];
  private maxHistorySize = 100;
  private alerts: MemoryAlert[] = [];
  private isMonitoring = false;

  private constructor() {}

  public static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /**
   * 开始内存监控
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      console.warn('内存监控已在运行中');
      return;
    }

    this.isMonitoring = true;
    this.baselineMemory = this.getCurrentMemoryUsage().heapUsed;
    this.statsHistory = [];
    this.alerts = [];

    this.checkInterval = setInterval(() => {
      this.checkMemoryLeak();
    }, intervalMs);

    console.log('内存监控已启动，基线内存:', this.formatBytes(this.baselineMemory));
  }

  /**
   * 停止内存监控
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('内存监控已停止');
  }

  /**
   * 获取当前内存使用情况
   */
  getCurrentMemoryUsage(): MemoryStats {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const percentage = (usage.heapUsed / usage.heapTotal) * 100;
      
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss,
        percentage: Math.round(percentage * 100) / 100,
        timestamp: Date.now()
      };
    }

    // 浏览器环境下的估算
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0,
      percentage: 0,
      timestamp: Date.now()
    };
  }

  /**
   * 检查内存泄漏
   */
  private checkMemoryLeak(): void {
    const currentMemory = this.getCurrentMemoryUsage();
    const memoryIncrease = currentMemory.heapUsed - this.baselineMemory;
    
    // 保存统计历史
    this.statsHistory.push(currentMemory);
    if (this.statsHistory.length > this.maxHistorySize) {
      this.statsHistory.shift();
    }

    // 检查内存增长
    if (memoryIncrease > this.leakThreshold) {
      this.triggerAlert('critical', memoryIncrease);
      console.warn('检测到可能的严重内存泄漏:', {
        baseline: this.formatBytes(this.baselineMemory),
        current: this.formatBytes(currentMemory.heapUsed),
        increase: this.formatBytes(memoryIncrease)
      });

      // 强制垃圾回收（仅开发环境）
      if (process.env.NODE_ENV === 'development' && global.gc) {
        global.gc();
        console.log('已触发强制垃圾回收');
      }
    } else if (memoryIncrease > this.warningThreshold) {
      this.triggerAlert('warning', memoryIncrease);
      console.warn('内存使用增长较快:', {
        baseline: this.formatBytes(this.baselineMemory),
        current: this.formatBytes(currentMemory.heapUsed),
        increase: this.formatBytes(memoryIncrease)
      });
    }
  }

  /**
   * 触发内存警告
   */
  private triggerAlert(type: 'warning' | 'critical', memoryIncrease: number): void {
    const alert: MemoryAlert = {
      type,
      message: type === 'critical' ? '严重内存泄漏警告' : '内存使用增长警告',
      memoryIncrease,
      timestamp: Date.now()
    };

    this.alerts.push(alert);
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }
  }

  /**
   * 获取内存统计报告
   */
  getMemoryReport(): {
    current: MemoryStats;
    baseline: number;
    increase: number;
    increasePercentage: number;
    history: MemoryStats[];
    alerts: MemoryAlert[];
    trend: 'increasing' | 'stable' | 'decreasing';
  } {
    const current = this.getCurrentMemoryUsage();
    const increase = current.heapUsed - this.baselineMemory;
    const increasePercentage = (increase / this.baselineMemory) * 100;

    // 分析趋势
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (this.statsHistory.length >= 5) {
      const recent = this.statsHistory.slice(-5);
      const older = this.statsHistory.slice(-10, -5);
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, stat) => sum + stat.heapUsed, 0) / recent.length;
        const olderAvg = older.reduce((sum, stat) => sum + stat.heapUsed, 0) / older.length;
        
        if (recentAvg > olderAvg * 1.1) {
          trend = 'increasing';
        } else if (recentAvg < olderAvg * 0.9) {
          trend = 'decreasing';
        }
      }
    }

    return {
      current,
      baseline: this.baselineMemory,
      increase,
      increasePercentage: Math.round(increasePercentage * 100) / 100,
      history: [...this.statsHistory],
      alerts: [...this.alerts],
      trend
    };
  }

  /**
   * 格式化字节数
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取内存使用摘要
   */
  getMemorySummary(): string {
    const report = this.getMemoryReport();
    return [
      `当前内存: ${this.formatBytes(report.current.heapUsed)}`,
      `基线内存: ${this.formatBytes(report.baseline)}`,
      `增长: ${this.formatBytes(report.increase)} (${report.increasePercentage}%)`,
      `趋势: ${report.trend}`,
      `警告数: ${report.alerts.filter(a => a.type === 'warning').length}`,
      `严重警告数: ${report.alerts.filter(a => a.type === 'critical').length}`
    ].join(' | ');
  }

  /**
   * 清理内存监控数据
   */
  clearData(): void {
    this.statsHistory = [];
    this.alerts = [];
    this.baselineMemory = this.getCurrentMemoryUsage().heapUsed;
  }

  /**
   * 检查是否有内存泄漏
   */
  hasMemoryLeak(): boolean {
    return this.alerts.some(alert => alert.type === 'critical');
  }

  /**
   * 获取最近的内存警告
   */
  getRecentAlerts(count: number = 5): MemoryAlert[] {
    return this.alerts.slice(-count);
  }
}

// 导出单例实例
export const memoryMonitor = MemoryMonitor.getInstance();

// 便捷函数
export const startMemoryMonitoring = (intervalMs?: number) => {
  memoryMonitor.startMonitoring(intervalMs);
};

export const stopMemoryMonitoring = () => {
  memoryMonitor.stopMonitoring();
};

export const getMemoryReport = () => {
  return memoryMonitor.getMemoryReport();
};

export const logMemorySummary = () => {
  console.log('内存使用摘要:', memoryMonitor.getMemorySummary());
};
