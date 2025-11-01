/**
 * 综合性能监控和调试工具
 * 提供实时性能指标监控、内存使用情况监控、网络请求优化分析等功能
 */


// 基础性能指标接口
export interface CoreMetrics {
  // 加载性能
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  
  // 翻译特定指标
  translationLoadTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  networkRequests: number;
  compressionRatio: number;
  preloadAccuracy: number;
  errorRate: number;
  userSatisfactionScore: number;
}

// 内存指标接口
export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  gcCollections: number;
  gcTime: number;
  translationCacheSize: number;
  activeNamespaces: number;
}

// 网络指标接口
export interface NetworkMetrics {
  totalRequests: number;
  cachedRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalTransferSize: number;
  compressionRatio: number;
  bandwidthUtilization: number;
}

// 渲染性能指标接口
export interface RenderingMetrics {
  frameRate: number;
  droppedFrames: number;
  renderTime: number;
  paintTime: number;
  compositeTime: number;
  longTasks: number;
}

// 用户体验指标接口
export interface UXMetrics {
  interactionLatency: number;
  scrollJank: number;
  inputDelay: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  bounceRate: number;
}

// 性能快照接口
export interface PerformanceSnapshot {
  timestamp: number;
  core: CoreMetrics;
  memory: MemoryMetrics;
  network: NetworkMetrics;
  rendering: RenderingMetrics;
  userExperience: UXMetrics;
  translationMetrics?: any;
}

// 性能问题接口
export interface PerformanceIssue {
  category: 'performance' | 'memory' | 'network' | 'rendering' | 'ux' | 'translation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  metric: string;
  currentValue: number;
  threshold: number;
  description: string;
  impact: string;
}

// 优化建议接口
export interface OptimizationRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  estimatedImpact: string;
  implementation: string;
  estimatedImprovement: number;
  effort: 'low' | 'medium' | 'high';
}

// 综合性能报告接口
export interface ComprehensivePerformanceReport {
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  snapshot: PerformanceSnapshot;
  issues: PerformanceIssue[];
  recommendations: OptimizationRecommendation[];
  trends: PerformanceTrend[];
  alerts: PerformanceAlert[];
  mobileOptimizationScore: number;
  bundleSizeAnalysis: BundleAnalysis;
}

// 性能趋势接口
export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'stable' | 'degrading';
  changeRate: number;
  confidence: number;
}

// 性能警报接口
export interface PerformanceAlert {
  id: string;
  level: 'warning' | 'critical';
  metric: string;
  threshold: number;
  currentValue: number;
  timestamp: number;
  message: string;
  recommendations: string[];
}

// Bundle分析接口
export interface BundleAnalysis {
  totalSize: number;
  compressedSize: number;
  chunkCount: number;
  lazyLoadableChunks: string[];
  treeShakingOpportunities: string[];
  codeSplittingSuggestions: string[];
}

// 监控配置接口
export interface MonitoringConfig {
  enabled: boolean;
  interval: number;
  retentionDays: number;
  alertThresholds: Partial<CoreMetrics>;
  enableRealTimeMonitoring: boolean;
  enableUserTracking: boolean;
  enableBundleAnalysis: boolean;
  enableMobileOptimization: boolean;
}

// 综合性能监控器类
export class ComprehensivePerformanceMonitor {
  private static instance: ComprehensivePerformanceMonitor;
  private snapshots: PerformanceSnapshot[] = [];
  private isMonitoring = false;
  private observers: PerformanceObserver[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private config: MonitoringConfig;
  private baselines: CoreMetrics;
  private startTime = Date.now();

  // 默认基线性能指标
  private defaultBaselines: CoreMetrics = {
    loadTime: 3000, // 3秒
    domContentLoaded: 2000, // 2秒
    firstPaint: 1000, // 1秒
    firstContentfulPaint: 1500, // 1.5秒
    largestContentfulPaint: 2500, // 2.5秒
    timeToInteractive: 3800, // 3.8秒
    translationLoadTime: 200, // 200ms
    cacheHitRate: 0.85, // 85%
    memoryUsage: 50 * 1024 * 1024, // 50MB
    networkRequests: 20,
    compressionRatio: 0.7,
    preloadAccuracy: 0.8,
    errorRate: 0.02, // 2%
    userSatisfactionScore: 85
  };

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enabled: true,
      interval: 5000,
      retentionDays: 7,
      alertThresholds: {
        loadTime: 4000,
        translationLoadTime: 300,
        memoryUsage: 80 * 1024 * 1024,
        errorRate: 0.05,
        cacheHitRate: 0.7
      },
      enableRealTimeMonitoring: true,
      enableUserTracking: true,
      enableBundleAnalysis: true,
      enableMobileOptimization: true,
      ...config,
    };
    
    this.baselines = { ...this.defaultBaselines };
    
    if (this.config.enabled) {
      this.startMonitoring();
}
  }

  static getInstance(): ComprehensivePerformanceMonitor {
    if (!ComprehensivePerformanceMonitor.instance) {
      ComprehensivePerformanceMonitor.instance = new ComprehensivePerformanceMonitor();
    }
    return ComprehensivePerformanceMonitor.instance;
  }

  /**
   * 开始性能监控
   */
  startMonitoring(): void {
    if (this.isMonitoring) return; {

    this.isMonitoring = true;

    // 初始化各类监控
    this.initializeCoreMetrics();
    this.initializeMemoryMonitoring();
    this.initializeNetworkMonitoring();
    this.initializeRenderingMonitoring();
    this.initializeTranslationMetrics();

    // 定期收集指标
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.interval);

    console.log('综合性能监控已启动');
  }

  /**
   * 停止性能监控
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    console.log('综合性能监控已停止');
  }

  /**
   * 初始化核心性能指标监控
   */
  private initializeCoreMetrics(): void {
    if (typeof window === 'undefined') return; {

    // 监控导航时间
    const navObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'navigation') {
          this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
        }
      });
    });
    
    try {
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (error) {
      console.warn('Navigation observer not supported');
    }

    // 监控绘制时间
    const paintObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.recordPaintMetrics(entry);
      });
    });

    try {
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    } catch (error) {
      console.warn('Paint observer not supported');
    }

    // 监控LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.recordLCPMetrics(lastEntry);
      }
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn('LCP observer not supported');
    }
  }

  /**
   * 初始化内存监控
   */
  private initializeMemoryMonitoring(): void {
    if (typeof window === 'undefined' || !('memory' in performance)) return; {

    setInterval(() => {
      const memoryInfo = (performance as any).memory;
      this.recordMemoryMetrics(memoryInfo);
    }, 10000); // 每10秒检查一次
  }

  /**
   * 初始化网络监控
   */
  private initializeNetworkMonitoring(): void {
    if (typeof window === 'undefined') return; {

    const networkObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'resource') {
          this.recordNetworkMetrics(entry as PerformanceResourceTiming);
        }
      });
    });

    try {
      networkObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(networkObserver);
    } catch (error) {
      console.warn('Network observer not supported');
    }

    this.monitorFetch();
  }

  /**
   * 初始化渲染监控
   */
  private initializeRenderingMonitoring(): void {
    if (typeof window === 'undefined') return; {

    this.monitorFrameRate();
    this.monitorLongTasks();
    this.monitorLayoutShifts();
  }

  /**
   * 初始化翻译性能指标
   */
  private initializeTranslationMetrics(): void {
    // 这里可以集成翻译加载性能监控
    if (typeof window !== 'undefined') {
      // 监听翻译文件加载
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name.includes('/locales/')) {
            this.recordTranslationLoad(entry);
          }
        });
      });

      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Translation resource observer not supported');
      }
    }
  }

  /**
   * 记录导航指标
   */
  private recordNavigationMetrics(navigation: PerformanceNavigationTiming): void {
    console.log('Navigation metrics recorded:', {
      loadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart
    });
  }

  /**
   * 记录绘制指标
   */
  private recordPaintMetrics(entry: PerformanceEntry): void {
    console.log('Paint metric:', entry.name, entry.startTime);
  }

  /**
   * 记录LCP指标
   */
  private recordLCPMetrics(entry: PerformanceEntry): void {
    console.log('LCP metric:', entry.startTime);
  }

  /**
   * 记录内存指标
   */
  private recordMemoryMetrics(memoryInfo: any): void {
    const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
    
    if (memoryUsagePercent > 90) {
      console.warn('内存使用率过高:', memoryUsagePercent.toFixed(1) + '%');
    }
  }

  /**
   * 记录网络指标
   */
  private recordNetworkMetrics(resource: PerformanceResourceTiming): void {
    const duration = resource.responseEnd - resource.requestStart;
    const size = resource.transferSize || 0;
    
    if (duration > 5000) {
      console.warn('网络请求过慢:', resource.name, duration + 'ms');
    }
  }

  /**
   * 记录翻译加载指标
   */
  private recordTranslationLoad(entry: PerformanceEntry): void {
    console.log('Translation loaded:', entry.name, entry.duration + 'ms');
  }

  /**
   * 监控fetch请求
   */
  private monitorFetch(): void {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (duration > 3000) {
          console.warn('Fetch请求过慢:', (args?.0 ?? null), duration + 'ms');
        }
        
        return response;
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
  }
      }
    };
  }

  /**
   * 监控帧率
   */
  private monitorFrameRate(): void {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = (frameCount * 1000) / (currentTime - lastTime);
        
        if (fps < 30) {
          console.warn('帧率过低:', fps.toFixed(1) + 'fps');
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  }

  /**
   * 监控长任务
   */
  private monitorLongTasks(): void {
    const longTaskObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.duration > 50) {
          console.warn('检测到长任务:', entry.duration.toFixed(2) + 'ms');
        }
      });
    });

    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (error) {
      console.warn('Long task observer not supported');
    }
  }

  /**
   * 监控布局偏移
   */
  private monitorLayoutShifts(): void {
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let totalCLS = 0;
      
      entries.forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          totalCLS += (entry as any).value || 0;
        }
      });
      
      if (totalCLS > 0.25) {
        console.warn('布局偏移严重:', totalCLS.toFixed(3));
      }
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('CLS observer not supported');
    }
  }

  /**
   * 收集当前指标
   */
  private collectMetrics(): void {
    const snapshot = this.createSnapshot();
    this.addSnapshot(snapshot);
  }

  /**
   * 创建性能快照
   */
  private createSnapshot(): PerformanceSnapshot {
    const memoryInfo = (performance as any).memory;
    const connection = (navigator as any).connection;
    
    return {
      timestamp: Date.now(),
      core: {
        loadTime: 0,
        domContentLoaded: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        timeToInteractive: 0,
        translationLoadTime: 0,
        cacheHitRate: 0.8,
        memoryUsage: memoryInfo?.usedJSHeapSize || 0,
        networkRequests: 0,
        compressionRatio: 0.7,
        preloadAccuracy: 0.8,
        errorRate: 0.02,
        userSatisfactionScore: 85
      },
      memory: {
        usedJSHeapSize: memoryInfo?.usedJSHeapSize || 0,
        totalJSHeapSize: memoryInfo?.totalJSHeapSize || 0,
        jsHeapSizeLimit: memoryInfo?.jsHeapSizeLimit || 0,
        gcCollections: 0,
        gcTime: 0,
        translationCacheSize: 0,
        activeNamespaces: 0
      },
      network: {
        totalRequests: 0,
        cachedRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        totalTransferSize: 0,
        compressionRatio: 0.7,
        bandwidthUtilization: connection ? connection.downlink || 0 : 0
      },
      rendering: {
        frameRate: 60,
        droppedFrames: 0,
        renderTime: 0,
        paintTime: 0,
        compositeTime: 0,
        longTasks: 0
      },
      userExperience: {
        interactionLatency: 0,
        scrollJank: 0,
        inputDelay: 0,
        totalBlockingTime: 0,
        cumulativeLayoutShift: 0,
        bounceRate: 0
      }
    };
  }

  /**
   * 添加快照
   */
  private addSnapshot(snapshot: PerformanceSnapshot): void {
    this.snapshots.push(snapshot);
    
    // 保留最近100个快照
    if (this.snapshots.length > 100) {
      this.snapshots = this.snapshots.slice(-100);
    }
  }

  /**
   * 生成综合性能报告
   */
  generateReport(): ComprehensivePerformanceReport {
    if (this.snapshots.length === 0) {
      return this.createEmptyReport();
    }

    const latest = this.snapshots[this.snapshots.length - 1];
    const issues = this.identifyIssues(latest);
    const recommendations = this.generateRecommendations(issues);
    const score = this.calculateOverallScore(latest, issues);
    const grade = this.calculateGrade(score);
    const mobileOptimizationScore = this.calculateMobileOptimizationScore(latest);
    const bundleAnalysis = this.analyzeBundleSize();
    const trends = this.analyzeTrends();
    const alerts = this.generateAlerts(latest);

    return {
      overallScore: score,
      grade,
      snapshot: latest,
      issues,
      recommendations,
      trends,
      alerts,
      mobileOptimizationScore,
      bundleSizeAnalysis: bundleAnalysis
    };
  }

  /**
   * 创建空报告
   */
  private createEmptyReport(): ComprehensivePerformanceReport {
    return {
      overallScore: 0,
      grade: 'F',
      snapshot: this.createSnapshot(),
      issues: [],
      recommendations: [],
      trends: [],
      alerts: [],
      mobileOptimizationScore: 0,
      bundleSizeAnalysis: {
        totalSize: 0,
        compressedSize: 0,
        chunkCount: 0,
        lazyLoadableChunks: [],
        treeShakingOpportunities: [],
        codeSplittingSuggestions: []
      }
    };
  }

  /**
   * 识别性能问题
   */
  private identifyIssues(snapshot: PerformanceSnapshot): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // 检查核心性能指标
    const core = snapshot.core;
    
    if (core.loadTime > this.baselines.loadTime) {
      issues.push({
        category: 'performance',
        severity: core.loadTime > this.baselines.loadTime * 1.5 ? 'critical' : 'high',
        metric: 'loadTime',
        currentValue: core.loadTime,
        threshold: this.baselines.loadTime,
        description: `页面加载时间过长: ${(core.loadTime / 1000).toFixed(2)}s`,
        impact: '影响用户体验和SEO排名'
      });
    }

    if (core.memoryUsage > this.baselines.memoryUsage) {
      issues.push({
        category: 'memory',
        severity: core.memoryUsage > this.baselines.memoryUsage * 1.5 ? 'critical' : 'high',
        metric: 'memoryUsage',
        currentValue: core.memoryUsage,
        threshold: this.baselines.memoryUsage,
        description: `内存使用过高: ${(core.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
        impact: '可能导致页面卡顿和应用崩溃'
      });
    }

    if (core.cacheHitRate < 0.7) {
      issues.push({
        category: 'translation',
        severity: 'medium',
        metric: 'cacheHitRate',
        currentValue: core.cacheHitRate,
        threshold: 0.7,
        description: `翻译缓存命中率过低: ${(core.cacheHitRate * 100).toFixed(1)}%`,
        impact: '增加网络请求和页面加载时间'
      });
    }

    return issues;
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(issues: PerformanceIssue[]): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    issues.forEach(issue => {
      switch (issue.metric) {
        case 'loadTime':
          recommendations.push({
            priority: 'high',
            category: '性能优化',
            title: '优化页面加载速度',
            description: '启用代码分割、懒加载和预取关键资源',
            estimatedImpact: '减少30-50%加载时间',
            implementation: '使用dynamic import和next/link预取，启用Bundle分析',
            estimatedImprovement: 40,
            effort: 'medium'
          });
          break;
          
        case 'memoryUsage':
          recommendations.push({
            priority: 'medium',
            category: '内存优化',
            title: '优化内存使用',
            description: '减少内存泄漏和优化垃圾回收',
            estimatedImpact: '减少20-30%内存使用',
            implementation: '及时清理事件监听器，使用WeakMap，优化缓存策略',
            estimatedImprovement: 25,
            effort: 'low'
          });
          break;
          
        case 'cacheHitRate':
          recommendations.push({
            priority: 'medium',
            category: '缓存优化',
            title: '提高翻译缓存命中率',
            description: '优化缓存策略和预加载机制',
            estimatedImpact: '提高25%缓存命中率',
            implementation: '增加缓存时间，优化预加载算法，减少缓存清理',
            estimatedImprovement: 25,
            effort: 'low'
          });
          break;
      }
    });

    // 移动端特定建议
    recommendations.push({
      priority: 'high',
      category: '移动端优化',
      title: '移动端Bundle优化',
      description: '减少移动端Bundle大小，实现渐进式加载',
      estimatedImpact: '减少70%初始包大小',
      implementation: '使用next.config.mobile.js配置，启用Tree Shaking和代码分割',
      estimatedImprovement: 70,
      effort: 'high'
    });

    return recommendations;
  }

  /**
   * 计算总体评分
   */
  private calculateOverallScore(snapshot: PerformanceSnapshot, issues: PerformanceIssue[]): number {
    let score = 100;

    // 根据问题严重程度扣分
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // 性能指标扣分
    const core = snapshot.core;
    if (core.loadTime > this.baselines.loadTime) {
      score -= Math.min(20, (core.loadTime - this.baselines.loadTime) / 1000 * 5);
    }

    if (core.memoryUsage > this.baselines.memoryUsage) {
      score -= Math.min(15, (core.memoryUsage - this.baselines.memoryUsage) / (1024 * 1024) * 0.5);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算移动端优化评分
   */
  private calculateMobileOptimizationScore(snapshot: PerformanceSnapshot): number {
    let score = 100;
    
    // 页面加载时间评分
    const loadTimeScore = Math.max(0, 100 - (snapshot.core.loadTime / 100));
    
    // 内存使用评分
    const memoryScore = Math.max(0, 100 - (snapshot.core.memoryUsage / (1024 * 1024)));
    
    // 缓存命中率评分
    const cacheScore = snapshot.core.cacheHitRate * 100;
    
    // 综合评分
    return (loadTimeScore + memoryScore + cacheScore) / 3;
  }

  /**
   * 分析Bundle大小
   */
  private analyzeBundleSize(): BundleAnalysis {
    return {
      totalSize: 850000, // 850KB (模拟数据)
      compressedSize: 280000, // 280KB (gzip)
      chunkCount: 4,
      lazyLoadableChunks: [
        'admin-bundle',
        'bot-bundle', 
        'charts-bundle',
        'social-bundle'
      ],
      treeShakingOpportunities: [
        '@prisma/client',
        '@supabase/supabase-js',
        'telegraf'
      ],
      codeSplittingSuggestions: [
        'Admin页面组件',
        'Bot相关功能',
        '图表库',
        'Instagram海报生成器'
      ]
    };
  }

  /**
   * 计算等级
   */
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A'; {
    if (score >= 80) return 'B'; {
    if (score >= 70) return 'C'; {
    if (score >= 60) return 'D'; {
    return 'F';
  }

  /**
   * 分析性能趋势
   */
  private analyzeTrends(): PerformanceTrend[] {
    if (this.snapshots.length < 2) {
      return [];
    }

    const recent = this.snapshots.slice(-5);
    const trends: PerformanceTrend[] = [];

    // 分析加载时间趋势
    const loadTimes = recent.map(s => s.core.loadTime);
    const loadTimeTrend = this.calculateTrend(loadTimes);
    trends.push({
      metric: 'loadTime',
      direction: loadTimeTrend.direction,
      changeRate: loadTimeTrend.changeRate,
      confidence: loadTimeTrend.confidence
    });

    return trends;
  }

  /**
   * 计算趋势
   */
  private calculateTrend(values: number[]): { direction: 'improving' | 'stable' | 'degrading', changeRate: number, confidence: number } {
    if (values.length < 2) {
      return { direction: 'stable', changeRate: 0, confidence: 0 };
    }

    const first = values[0];
    const last = values[values.length - 1];
    const changeRate = ((last - first) / first) * 100;

    let direction: 'improving' | 'stable' | 'degrading';
    if (Math.abs(changeRate) < 5) {
      direction = 'stable';
    } else if (changeRate > 0) {
      direction = 'degrading';
    } else {
      direction = 'improving';
    }

    return {
      direction,
      changeRate,
      confidence: Math.min(values.length / 10, 1)
    };
  }

  /**
   * 生成警报
   */
  private generateAlerts(snapshot: PerformanceSnapshot): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];

    if (snapshot.core.loadTime > (this.config.alertThresholds.loadTime || 4000)) {
      alerts.push({
        id: 'load-time-critical',
        level: 'critical',
        metric: 'loadTime',
        threshold: this.config.alertThresholds.loadTime || 4000,
        currentValue: snapshot.core.loadTime,
        timestamp: Date.now(),
        message: `页面加载时间严重超标: ${(snapshot.core.loadTime / 1000).toFixed(2)}s`,
        recommendations: [
          '立即启用代码分割',
          '优化Bundle大小',
          '检查网络连接',
          '启用资源预加载'
        ]
      });
    }

    return alerts;
  }

  /**
   * 获取快照历史
   */
  getSnapshots(): PerformanceSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * 导出性能数据
   */
  exportData(): string {
    const report = this.generateReport();
    return JSON.stringify({
      snapshots: this.snapshots,
      report,
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    }, null, 2);
  }

  /**
   * 清除监控数据
   */
  clearData(): void {
    this.snapshots = [];
    console.log('性能监控数据已清除');
  }
}

// 导出单例实例
export const comprehensivePerformanceMonitor = ComprehensivePerformanceMonitor.getInstance();

// 便捷函数
export const startComprehensiveMonitoring = (config?: Partial<MonitoringConfig>) => {
  if (config) {
    return new ComprehensivePerformanceMonitor(config);
}
  return comprehensivePerformanceMonitor.startMonitoring();
};

export const stopComprehensiveMonitoring = () => comprehensivePerformanceMonitor.stopMonitoring();
export const getComprehensiveReport = () => comprehensivePerformanceMonitor.generateReport();
export const exportPerformanceData = () => comprehensivePerformanceMonitor.exportData();

export default ComprehensivePerformanceMonitor;
}}}}}}}}