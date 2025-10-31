/**
 * 性能基准配置和目标定义
 * 定义各种性能指标的目标值、阈值和评估标准
 */

export interface PerformanceBenchmark {
  category: string;
  metric: string;
  description: string;
  unit: string;
  // 目标值
  target: number;
  // 优秀阈值 (绿色)
  excellent: number;
  // 良好阈值 (黄色)
  good: number;
  // 可接受阈值 (橙色)
  acceptable: number;
  // 不可接受阈值 (红色)
  poor: number;
  // 是否为关键指标
  critical: boolean;
  // 权重 (用于综合评分)
  weight: number;
  // 监控频率
  monitoringInterval: number;
}

export interface PerformanceTarget {
  name: string;
  description: string;
  category: 'frontend' | 'backend' | 'database' | 'mobile' | 'i18n';
  priority: 'critical' | 'high' | 'medium' | 'low';
  benchmarks: PerformanceBenchmark[];
  overallTarget: number; // 0-100
}

export interface DeviceProfile {
  name: string;
  type: 'mobile' | 'tablet' | 'desktop';
  characteristics: {
    cpuCores: number;
    memory: number; // GB
    network: 'slow-3g' | 'fast-3g' | '4g' | 'wifi';
    viewport: {
      width: number;
      height: number;
    };
    pixelRatio: number;
  };
  performanceTargets: Partial<Record<string, number>>;
}

// 性能基准配置
export const PERFORMANCE_BENCHMARKS: Record<string, PerformanceTarget> = {
  // 前端性能目标
  frontendCoreWebVitals: {
    name: '核心Web性能指标',
    description: 'Google Core Web Vitals - 影响搜索排名的关键指标',
    category: 'frontend',
    priority: 'critical',
    overallTarget: 85,
    benchmarks: [
      {
        category: '加载性能',
        metric: 'LCP',
        description: '最大内容绘制时间',
        unit: 'ms',
        target: 2500,
        excellent: 1200,
        good: 2500,
        acceptable: 4000,
        poor: 10000,
        critical: true,
        weight: 30,
        monitoringInterval: 5000
      },
      {
        category: '交互性能',
        metric: 'FID',
        description: '首次输入延迟',
        unit: 'ms',
        target: 100,
        excellent: 50,
        good: 100,
        acceptable: 300,
        poor: 1000,
        critical: true,
        weight: 25,
        monitoringInterval: 1000
      },
      {
        category: '视觉稳定性',
        metric: 'CLS',
        description: '累计布局偏移',
        unit: '',
        target: 0.1,
        excellent: 0.05,
        good: 0.1,
        acceptable: 0.25,
        poor: 0.5,
        critical: true,
        weight: 20,
        monitoringInterval: 2000
      },
      {
        category: '加载性能',
        metric: 'FCP',
        description: '首次内容绘制',
        unit: 'ms',
        target: 1800,
        excellent: 1000,
        good: 1800,
        acceptable: 3000,
        poor: 5000,
        critical: false,
        weight: 15,
        monitoringInterval: 5000
      },
      {
        category: '交互性能',
        metric: 'TTI',
        description: '可交互时间',
        unit: 'ms',
        target: 3800,
        excellent: 2000,
        good: 3800,
        acceptable: 7300,
        poor: 10000,
        critical: false,
        weight: 10,
        monitoringInterval: 10000
      }
    ]
  },

  // 移动端性能目标
  mobilePerformance: {
    name: '移动端性能',
    description: '针对移动设备的性能优化指标',
    category: 'mobile',
    priority: 'high',
    overallTarget: 80,
    benchmarks: [
      {
        category: '加载性能',
        metric: 'mobileLoadTime',
        description: '移动端页面加载时间',
        unit: 'ms',
        target: 3000,
        excellent: 1500,
        good: 3000,
        acceptable: 5000,
        poor: 10000,
        critical: true,
        weight: 35,
        monitoringInterval: 10000
      },
      {
        category: '内存使用',
        metric: 'memoryUsage',
        description: '移动端内存使用',
        unit: 'MB',
        target: 80,
        excellent: 40,
        good: 80,
        acceptable: 150,
        poor: 300,
        critical: true,
        weight: 25,
        monitoringInterval: 5000
      },
      {
        category: '交互性能',
        metric: 'touchResponse',
        description: '触摸响应时间',
        unit: 'ms',
        target: 100,
        excellent: 50,
        good: 100,
        acceptable: 200,
        poor: 500,
        critical: true,
        weight: 20,
        monitoringInterval: 1000
      },
      {
        category: '电池优化',
        metric: 'batteryDrain',
        description: '电池消耗率',
        unit: '%/hour',
        target: 5,
        excellent: 2,
        good: 5,
        acceptable: 10,
        poor: 20,
        critical: false,
        weight: 10,
        monitoringInterval: 60000
      },
      {
        category: '网络优化',
        metric: 'dataUsage',
        description: '网络数据使用',
        unit: 'MB',
        target: 2,
        excellent: 0.5,
        good: 2,
        acceptable: 5,
        poor: 10,
        critical: false,
        weight: 10,
        monitoringInterval: 30000
      }
    ]
  },

  // 国际化性能目标
  i18nPerformance: {
    name: '国际化性能',
    description: '多语言和国际化功能性能指标',
    category: 'i18n',
    priority: 'high',
    overallTarget: 85,
    benchmarks: [
      {
        category: '翻译加载',
        metric: 'translationLoadTime',
        description: '翻译文件加载时间',
        unit: 'ms',
        target: 200,
        excellent: 100,
        good: 200,
        acceptable: 500,
        poor: 1000,
        critical: true,
        weight: 30,
        monitoringInterval: 2000
      },
      {
        category: '缓存效率',
        metric: 'cacheHitRate',
        description: '翻译缓存命中率',
        unit: '%',
        target: 85,
        excellent: 95,
        good: 85,
        acceptable: 70,
        poor: 50,
        critical: true,
        weight: 25,
        monitoringInterval: 5000
      },
      {
        category: '语言切换',
        metric: 'languageSwitchTime',
        description: '语言切换响应时间',
        unit: 'ms',
        target: 150,
        excellent: 80,
        good: 150,
        acceptable: 300,
        poor: 600,
        critical: false,
        weight: 20,
        monitoringInterval: 1000
      },
      {
        category: '搜索性能',
        metric: 'multilingualSearchTime',
        description: '多语言搜索响应时间',
        unit: 'ms',
        target: 100,
        excellent: 50,
        good: 100,
        acceptable: 200,
        poor: 500,
        critical: false,
        weight: 15,
        monitoringInterval: 3000
      },
      {
        category: '预加载效率',
        metric: 'preloadAccuracy',
        description: '预加载准确率',
        unit: '%',
        target: 80,
        excellent: 95,
        good: 80,
        acceptable: 60,
        poor: 40,
        critical: false,
        weight: 10,
        monitoringInterval: 10000
      }
    ]
  },

  // 后端API性能目标
  apiPerformance: {
    name: 'API性能',
    description: '后端API接口性能指标',
    category: 'backend',
    priority: 'high',
    overallTarget: 90,
    benchmarks: [
      {
        category: '响应时间',
        metric: 'averageResponseTime',
        description: 'API平均响应时间',
        unit: 'ms',
        target: 200,
        excellent: 100,
        good: 200,
        acceptable: 500,
        poor: 1000,
        critical: true,
        weight: 35,
        monitoringInterval: 1000
      },
      {
        category: '并发处理',
        metric: 'maxConcurrentRequests',
        description: '最大并发请求数',
        unit: 'req/s',
        target: 1000,
        excellent: 2000,
        good: 1000,
        acceptable: 500,
        poor: 100,
        critical: true,
        weight: 25,
        monitoringInterval: 5000
      },
      {
        category: '可用性',
        metric: 'availability',
        description: '服务可用性',
        unit: '%',
        target: 99.9,
        excellent: 99.99,
        good: 99.9,
        acceptable: 99.0,
        poor: 95.0,
        critical: true,
        weight: 20,
        monitoringInterval: 60000
      },
      {
        category: '错误率',
        metric: 'errorRate',
        description: 'API错误率',
        unit: '%',
        target: 1.0,
        excellent: 0.1,
        good: 1.0,
        acceptable: 3.0,
        poor: 10.0,
        critical: true,
        weight: 15,
        monitoringInterval: 1000
      },
      {
        category: '吞吐量',
        metric: 'throughput',
        description: '系统吞吐量',
        unit: 'req/s',
        target: 500,
        excellent: 1000,
        good: 500,
        acceptable: 200,
        poor: 50,
        critical: false,
        weight: 5,
        monitoringInterval: 5000
      }
    ]
  },

  // 数据库性能目标
  databasePerformance: {
    name: '数据库性能',
    description: '数据库查询和操作性能指标',
    category: 'database',
    priority: 'high',
    overallTarget: 85,
    benchmarks: [
      {
        category: '查询性能',
        metric: 'averageQueryTime',
        description: '平均查询时间',
        unit: 'ms',
        target: 100,
        excellent: 50,
        good: 100,
        acceptable: 200,
        poor: 500,
        critical: true,
        weight: 30,
        monitoringInterval: 1000
      },
      {
        category: '连接池',
        metric: 'connectionPoolUtilization',
        description: '连接池利用率',
        unit: '%',
        target: 70,
        excellent: 50,
        good: 70,
        acceptable: 85,
        poor: 95,
        critical: true,
        weight: 25,
        monitoringInterval: 5000
      },
      {
        category: '缓存效率',
        metric: 'cacheEfficiency',
        description: '数据库缓存效率',
        unit: '%',
        target: 80,
        excellent: 95,
        good: 80,
        acceptable: 60,
        poor: 40,
        critical: false,
        weight: 20,
        monitoringInterval: 10000
      },
      {
        category: '并发处理',
        metric: 'concurrentQueries',
        description: '并发查询处理',
        unit: 'queries',
        target: 50,
        excellent: 100,
        good: 50,
        acceptable: 25,
        poor: 10,
        critical: false,
        weight: 15,
        monitoringInterval: 5000
      },
      {
        category: '锁等待',
        metric: 'lockWaitTime',
        description: '锁等待时间',
        unit: 'ms',
        target: 10,
        excellent: 5,
        good: 10,
        acceptable: 50,
        poor: 200,
        critical: false,
        weight: 10,
        monitoringInterval: 2000
      }
    ]
  }
};

// 设备配置
export const DEVICE_PROFILES: Record<string, DeviceProfile> = {
  // 高端移动设备
  highEndMobile: {
    name: '高端移动设备',
    type: 'mobile',
    characteristics: {
      cpuCores: 8,
      memory: 4,
      network: '4g',
      viewport: { width: 390, height: 844 },
      pixelRatio: 3
    },
    performanceTargets: {
      mobileLoadTime: 2000,
      touchResponse: 80,
      memoryUsage: 60
    }
  },

  // 中端移动设备
  midRangeMobile: {
    name: '中端移动设备',
    type: 'mobile',
    characteristics: {
      cpuCores: 4,
      memory: 2,
      network: 'fast-3g',
      viewport: { width: 375, height: 667 },
      pixelRatio: 2
    },
    performanceTargets: {
      mobileLoadTime: 3000,
      touchResponse: 100,
      memoryUsage: 80
    }
  },

  // 低端移动设备
  lowEndMobile: {
    name: '低端移动设备',
    type: 'mobile',
    characteristics: {
      cpuCores: 2,
      memory: 1,
      network: 'slow-3g',
      viewport: { width: 360, height: 640 },
      pixelRatio: 2
    },
    performanceTargets: {
      mobileLoadTime: 5000,
      touchResponse: 150,
      memoryUsage: 120
    }
  },

  // 桌面设备
  desktop: {
    name: '桌面设备',
    type: 'desktop',
    characteristics: {
      cpuCores: 8,
      memory: 8,
      network: 'wifi',
      viewport: { width: 1920, height: 1080 },
      pixelRatio: 1
    },
    performanceTargets: {
      loadTime: 2000,
      averageResponseTime: 150,
      memoryUsage: 100
    }
  }
};

// 性能评分计算器
export class PerformanceScorer {
  /**
   * 计算性能分数
   */
  static calculateScore(metric: string, value: number, benchmark: PerformanceBenchmark): number {
    if (value <= benchmark.excellent) return 100;
    if (value <= benchmark.good) return 85;
    if (value <= benchmark.acceptable) return 70;
    if (value <= benchmark.poor) return 50;
    return 25;
  }

  /**
   * 计算综合性能分数
   */
  static calculateOverallScore(
    metrics: Record<string, number>, 
    target: PerformanceTarget
  ): { score: number; grade: string; details: any } {
    let totalWeight = 0;
    let weightedScore = 0;
    const details: any = {
      perBenchmarkScores: {},
      categoryScores: {}
    };

    // 按类别分组
    const categoryGroups: Record<string, { score: number; weight: number; count: number }> = {};

    target.benchmarks.forEach(benchmark => {
      const value = metrics[benchmark.metric];
      if (value !== undefined) {
        const score = this.calculateScore(benchmark.metric, value, benchmark);
        weightedScore += score * benchmark.weight;
        totalWeight += benchmark.weight;

        details.perBenchmarkScores[benchmark.metric] = {
          score,
          value,
          target: benchmark.target,
          unit: benchmark.unit
        };

        // 按类别分组
        if (!categoryGroups[benchmark.category]) {
          categoryGroups[benchmark.category] = { score: 0, weight: 0, count: 0 };
        }
        categoryGroups[benchmark.category].score += score * benchmark.weight;
        categoryGroups[benchmark.category].weight += benchmark.weight;
        categoryGroups[benchmark.category].count += 1;
      }
    });

    // 计算类别分数
    Object.entries(categoryGroups).forEach(([category, group]) => {
      details.categoryScores[category] = {
        score: group.score / group.weight,
        count: group.count
      };
    });

    const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const grade = this.calculateGrade(overallScore);

    return { score: overallScore, grade, details };
  }

  /**
   * 获取性能等级
   */
  static calculateGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'C+';
    if (score >= 65) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * 获取性能状态颜色
   */
  static getPerformanceColor(score: number): string {
    if (score >= 85) return '#4CAF50'; // 绿色
    if (score >= 70) return '#FF9800'; // 橙色
    if (score >= 50) return '#FF5722'; // 深橙色
    return '#F44336'; // 红色
  }

  /**
   * 生成性能报告摘要
   */
  static generateSummary(
    metrics: Record<string, number>,
    targets: PerformanceTarget[]
  ): { overallScore: number; criticalIssues: string[]; recommendations: string[] } {
    let totalScore = 0;
    let targetCount = 0;
    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    targets.forEach(target => {
      const { score } = this.calculateOverallScore(metrics, target);
      totalScore += score;
      targetCount++;

      // 检查关键指标
      target.benchmarks.forEach(benchmark => {
        const value = metrics[benchmark.metric];
        if (value !== undefined) {
          const score = this.calculateScore(benchmark.metric, value, benchmark);
          
          if (benchmark.critical && score < 70) {
            criticalIssues.push(`${target.name} - ${benchmark.description} 低于目标值`);
          }

          // 生成建议
          if (score < 85) {
            const recommendation = this.generateRecommendation(benchmark, value, score);
            if (recommendation) {
              recommendations.push(recommendation);
            }
          }
        }
      });
    });

    const overallScore = targetCount > 0 ? totalScore / targetCount : 0;

    return {
      overallScore,
      criticalIssues,
      recommendations
    };
  }

  /**
   * 生成优化建议
   */
  private static generateRecommendation(
    benchmark: PerformanceBenchmark,
    value: number,
    score: number
  ): string | null {
    if (score >= 85) return null;

    const improvement = benchmark.target - value;
    const percentage = ((value - benchmark.target) / benchmark.target * 100).toFixed(1);

    const recommendations: Record<string, string> = {
      'LCP': `优化关键资源加载，减少${Math.abs(improvement).toFixed(0)}ms加载时间。考虑启用代码分割、资源预加载和图片优化。`,
      'FID': `减少主线程阻塞，优化JavaScript执行时间。建议使用Web Workers和代码分割。`,
      'CLS': `改善布局稳定性，为动态内容预留空间，避免在页面加载后插入内容。`,
      'mobileLoadTime': `优化移动端Bundle大小，减少初始加载内容。考虑使用Service Worker缓存和预取策略。`,
      'memoryUsage': `优化内存使用，避免内存泄漏。检查未清理的事件监听器和定时器。`,
      'touchResponse': `优化触摸事件处理，减少UI线程阻塞时间。`,
      'translationLoadTime': `优化翻译文件加载策略，增加缓存时间和预加载机制。`,
      'cacheHitRate': `提高缓存命中率，减少网络请求。优化缓存策略和TTL设置。`,
      'averageResponseTime': `优化API响应时间，检查数据库查询和服务器处理逻辑。`
    };

    return recommendations[benchmark.metric] || 
           `${benchmark.description}需要改善${Math.abs(improvement).toFixed(0)}${benchmark.unit}，当前比目标值高${percentage}%`;
  }
}

// 导出便捷函数
export const getTargetByCategory = (category: string): PerformanceTarget | null => {
  return PERFORMANCE_BENCHMARKS[category] || null;
};

export const getTargetsByPriority = (priority: string): PerformanceTarget[] => {
  return Object.values(PERFORMANCE_BENCHMARKS).filter(target => target.priority === priority);
};

export const getBenchmarkByMetric = (metric: string): PerformanceBenchmark | null => {
  for (const target of Object.values(PERFORMANCE_BENCHMARKS)) {
    const benchmark = target.benchmarks.find(b => b.metric === metric);
    if (benchmark) return benchmark;
  }
  return null;
};

export const validatePerformanceTargets = (metrics: Record<string, number>): {
  valid: boolean;
  violations: string[];
} => {
  const violations: string[] = [];
  
  Object.entries(PERFORMANCE_BENCHMARKS).forEach(([targetName, target]) => {
    target.benchmarks.forEach(benchmark => {
      const value = metrics[benchmark.metric];
      if (value !== undefined) {
        const score = PerformanceScorer.calculateScore(benchmark.metric, value, benchmark);
        if (score < 50) { // 分数低于50分认为是严重违规
          violations.push(`${targetName}: ${benchmark.description} 严重低于目标值`);
        }
      }
    });
  });

  return {
    valid: violations.length === 0,
    violations
  };
};

export default PERFORMANCE_BENCHMARKS;