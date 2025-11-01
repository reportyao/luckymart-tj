import { translationCache } from '@/utils/translation-cache';
import { retryManager } from '@/utils/network-retry';
import { degradationManager } from '@/utils/request-degradation';
// network-performance-tester.ts - 网络性能测试工具

export interface NetworkPerformanceMetrics {
  // 基础性能指标
  responseTime: number;          // 响应时间 (ms)
  latency: number;               // 延迟 (ms)
  throughput: number;            // 吞吐量 (KB/s)
  packetLoss: number;            // 丢包率 (0-1)
  
  // 缓存性能
  cacheHitRate: number;          // 缓存命中率 (0-1)
  cacheSize: number;             // 缓存大小 (bytes)
  cacheEfficiency: number;       // 缓存效率 (0-1)
  
  // 重试性能
  retryCount: number;            // 重试次数
  retrySuccessRate: number;      // 重试成功率 (0-1)
  averageRetryDelay: number;     // 平均重试延迟 (ms)
  
  // 翻译加载性能
  translationLoadTime: number;   // 翻译文件加载时间 (ms)
  preloadedNamespaces: number;   // 预加载命名空间数
  translationCacheHitRate: number; // 翻译缓存命中率 (0-1)
  
  // 降级性能
  degradationTriggerCount: number; // 降级触发次数
  fallbackSuccessRate: number;    // 降级成功率 (0-1)
  
  // 综合指标
  availability: number;          // 可用性 (0-1)
  reliability: number;           // 可靠性 (0-1)
  efficiency: number;            // 效率 (0-1)
}

export interface NetworkTestConfig {
  testDuration: number;          // 测试持续时间 (ms)
  requestInterval: number;       // 请求间隔 (ms)
  concurrentRequests: number;    // 并发请求数
  testUrls: string[];            // 测试URL列表
  languages: string[];           // 测试语言列表
  namespaces: string[];          // 测试命名空间列表
}

export interface NetworkPerformanceReport {
  timestamp: string;
  environment: {
    userAgent: string;
    connection?: any;
    online: boolean;
  };
  config: NetworkTestConfig;
  metrics: NetworkPerformanceMetrics;
  detailedResults: {
    requestResults: RequestResult[];
    translationResults: TranslationResult[];
    cacheAnalysis: CacheAnalysis;
    retryAnalysis: RetryAnalysis;
    degradationAnalysis: DegradationAnalysis;
  };
  recommendations: string[];
  networkQuality: string;
  overallScore: number;          // 0-100
}

export interface RequestResult {
  url: string;
  status: 'success' | 'failure' | 'timeout';
  responseTime: number;
  timestamp: number;
  retryAttempt?: number;
  error?: string;
}

export interface TranslationResult {
  language: string;
  namespace: string;
  loadTime: number;
  cacheHit: boolean;
  success: boolean;
  size?: number;
}

export interface CacheAnalysis {
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageCacheAccessTime: number;
  cacheSize: number;
  cacheEntries: number;
}

export interface RetryAnalysis {
  totalRetries: number;
  successfulRetries: number;
  failedRetries: number;
  averageRetryDelay: number;
  retryReasons: Record<string, number>;
  retryEffectiveness: number;
}

export interface DegradationAnalysis {
  triggersCount: number;
  successfulDegradations: number;
  failedDegradations: number;
  fallbackUsage: Record<string, number>;
  degradationEffectiveness: number;
}

class NetworkPerformanceTester {
  private config: NetworkTestConfig;
  private results: {
    requests: RequestResult[];
    translations: TranslationResult[];
    cacheHits: { hit: boolean; url: string; time: number }[];
    retryEvents: { attempt: number; delay: number; success: boolean }[];
    degradationEvents: { trigger: string; success: boolean; fallback: string }[];
  };

  constructor(config: Partial<NetworkTestConfig> = {}) {
    this.config = {
      testDuration: 30000,           // 30秒
      requestInterval: 1000,         // 1秒
      concurrentRequests: 3,         // 3个并发
      testUrls: [
        '/api/user/profile',
        '/api/translations/common',
        '/api/products',
        '/locales/zh-CN/common.json',
        '/locales/en-US/common.json'
      ],
      languages: ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'],
      namespaces: ['common', 'auth', 'error', 'admin', 'lottery'],
      ...config
    };

    this.results = {
      requests: [],
      translations: [],
      cacheHits: [],
      retryEvents: [],
      degradationEvents: []
    };
}

  /**
   * 执行完整的网络性能测试
   */
  async runPerformanceTest(): Promise<NetworkPerformanceReport> {
    console.log('[NetworkPerformanceTester] 开始网络性能测试...');
    
    const startTime = Date.now();
    const endTime = startTime + this.config.testDuration;
    
    // 1. 环境检测
    const environment = this.collectEnvironmentInfo();
    
    // 2. 基础网络性能测试
    await this.runNetworkBaselineTest();
    
    // 3. 缓存性能测试
    await this.runCachePerformanceTest();
    
    // 4. 翻译文件加载性能测试
    await this.runTranslationPerformanceTest();
    
    // 5. 重试机制性能测试
    await this.runRetryPerformanceTest();
    
    // 6. 降级机制性能测试
    await this.runDegradationPerformanceTest();
    
    // 7. 并发性能测试
    await this.runConcurrencyPerformanceTest();
    
    // 8. 生成报告
    const report = this.generateReport(startTime, environment);
    
    console.log('[NetworkPerformanceTester] 网络性能测试完成');
    return report;
  }

  /**
   * 收集环境信息
   */
  private collectEnvironmentInfo(): NetworkPerformanceReport['environment'] {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      userAgent: navigator.userAgent,
      connection: connection ? {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      } : undefined,
      online: navigator.onLine
    };
  }

  /**
   * 基础网络性能测试
   */
  private async runNetworkBaselineTest(): Promise<void> {
    console.log('[NetworkPerformanceTester] 运行基础网络性能测试...');
    
    const testPromises: Promise<void>[] = [];
    
    // 并发请求测试
    for (let i = 0; i < this.config.concurrentRequests; i++) {
      testPromises.push(this.performNetworkRequest(i));
    }
    
    // 定期执行测试直到结束时间
    const endTime = Date.now() + this.config.testDuration;
    while (Date.now() < endTime) {
      await Promise.allSettled(testPromises);
      await this.sleep(this.config.requestInterval);
    }
  }

  /**
   * 执行单个网络请求
   */
  private async performNetworkRequest(requestId: number): Promise<void> {
    for (const url of this.config.testUrls) {
      const startTime = performance.now();
      let retryCount = 0;
      
      try {
        await retryManager.executeWithRetry(async () => {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return response.json();
        }, {
          maxRetries: 3,
          baseDelay: 500,
          timeout: 10000,
          onRetry: (attempt, error) => {
            this.results.retryEvents.push({
              attempt,
              delay: 500 * Math.pow(2, attempt - 1),
              success: false
            });
            retryCount = attempt;
          }
        });

        const responseTime = performance.now() - startTime;
        
        this.results.requests.push({
          url,
          status: 'success',
          responseTime,
          timestamp: Date.now(),
          retryAttempt: retryCount
        });

        // 测试缓存命中
        await this.testCacheAccess(url, responseTime);

      } catch (error) {
        const responseTime = performance.now() - startTime;
        
        this.results.requests.push({
          url,
          status: error instanceof Error && error.message.includes('超时') ? 'timeout' : 'failure',
          responseTime,
          timestamp: Date.now(),
          retryAttempt: retryCount,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * 缓存性能测试
   */
  private async runCachePerformanceTest(): Promise<void> {
    console.log('[NetworkPerformanceTester] 运行缓存性能测试...');
    
    const cacheTestKey = 'performance-cache-test';
    const testData = { test: 'cache performance data', timestamp: Date.now() };
    
    // 测试缓存写入和读取
    const cacheStartTime = performance.now();
    
    // 首次写入
    const writeResult = await degradationManager.fetchWithDegradation(;
      cacheTestKey,
      async () => testData,
      {
        strategy: DegradationStrategy.CACHE_FIRST,
        cacheTimeout: 60000,
        priority: 'high' as const
      }
    );
    
    const writeTime = performance.now() - cacheStartTime;
    
    // 第二次读取（应该命中缓存）
    const cacheStartTime2 = performance.now();
    const readResult = await degradationManager.fetchWithDegradation(;
      cacheTestKey,
      async () => ({ ...testData, updated: true }),
      {
        strategy: DegradationStrategy.CACHE_FIRST,
        cacheTimeout: 60000,
        priority: 'high' as const
      }
    );
    
    const readTime = performance.now() - cacheStartTime2;
    
    console.log(`[Cache Performance] 写入: ${writeTime}ms, 读取: ${readTime}ms`);
  }

  /**
   * 翻译文件加载性能测试
   */
  private async runTranslationPerformanceTest(): Promise<void> {
    console.log('[NetworkPerformanceTester] 运行翻译性能测试...');
    
    for (const language of this.config.languages) {
      for (const namespace of this.config.namespaces) {
        const startTime = performance.now();
        let success = false;
        let cacheHit = false;
        let size = 0;
        
        try {
          // 尝试从缓存获取
          const cached = translationCache.getCachedTranslation(language, namespace);
          if (cached) {
            cacheHit = true;
            size = JSON.stringify(cached).length;
            success = true;
          } else {
            // 网络请求翻译文件
            const url = `/locales/${language}/${namespace}.json`;
            const response = await fetch(url);
            
            if (response.ok) {
              const content = await response.json();
              size = JSON.stringify(content).length;
              
              // 缓存翻译文件
              translationCache.cacheTranslation(language, namespace, content);
              success = true;
            }
          }
        } catch (error) {
          console.warn(`Translation load failed for ${language}/${namespace}:`, error);
        }
        
        const loadTime = performance.now() - startTime;
        
        this.results.translations.push({
          language,
          namespace,
          loadTime,
          cacheHit,
          success,
          size
        });
      }
    }
  }

  /**
   * 重试机制性能测试
   */
  private async runRetryPerformanceTest(): Promise<void> {
    console.log('[NetworkPerformanceTester] 运行重试机制性能测试...');
    
    // 测试重试成功率
    const retryTestOperations = [;
      // 成功的操作
      { shouldFail: false, delay: 100 },
      // 会失败一次的操作
      { shouldFail: true, failCount: 1, delay: 200 },
      // 会失败多次的操作
      { shouldFail: true, failCount: 3, delay: 150 }
    ];
    
    for (const testOp of retryTestOperations) {
      await retryManager.executeWithRetry(async () => {
        if (testOp.shouldFail && testOp.failCount > 0) {
          // 模拟失败
          await this.sleep(testOp.delay);
          throw new Error('Simulated network failure');
  }
        }
        
        await this.sleep(testOp.delay);
        return 'success';
      }, {
        maxRetries: 5,
        baseDelay: 100
      });
    }
  }

  /**
   * 降级机制性能测试
   */
  private async runDegradationPerformanceTest(): Promise<void> {
    console.log('[NetworkPerformanceTester] 运行降级机制性能测试...');
    
    // 测试网络失败时的降级策略
    const networkFailOperation = async () => {
      await this.sleep(100);
      throw new Error('Network failure');
    };
    
    const fallbackOperation = async () => {
      await this.sleep(50);
      return { fallback: true, data: 'fallback-data' };
    };
    
    try {
      const result = await degradationManager.fetchWithDegradation(;
        'degradation-test',
        networkFailOperation,
        {
          strategy: DegradationStrategy.NETWORK_FIRST,
          fallbackEnabled: true,
          cacheTimeout: 60000,
          priority: 'medium' as const
        }
      );
      
      this.results.degradationEvents.push({
        trigger: 'network-failure',
        success: true,
        fallback: 'cache-fallback'
      });
      
    } catch (error) {
      this.results.degradationEvents.push({
        trigger: 'network-failure',
        success: false,
        fallback: 'none'
      });
    }
  }

  /**
   * 并发性能测试
   */
  private async runConcurrencyPerformanceTest(): Promise<void> {
    console.log('[NetworkPerformanceTester] 运行并发性能测试...');
    
    const concurrency = this.config.concurrentRequests;
    const operations = Array.from({ length: concurrency }, (_, i) =>;
      this.performConcurrentOperation(`concurrent-${i}`)
    );
    
    await Promise.allSettled(operations);
  }

  /**
   * 执行并发操作
   */
  private async performConcurrentOperation(id: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      await Promise.all([
        fetch('/api/test1'),
        fetch('/api/test2'),
        fetch('/api/test3')
      ]);
      
      const duration = performance.now() - startTime;
      console.log(`[Concurrency] ${id} completed in ${duration}ms`);
    } catch (error) {
      console.warn(`[Concurrency] ${id} failed:`, error);
    }
  }

  /**
   * 测试缓存访问
   */
  private async testCacheAccess(url: string, responseTime: number): Promise<void> {
    // 这里可以扩展更复杂的缓存测试逻辑
    const isCacheHit = responseTime < 50; // 简单的启发式判断;
    this.results.cacheHits.push({
      hit: isCacheHit,
      url,
      time: responseTime
    });
  }

  /**
   * 生成性能报告
   */
  private generateReport(startTime: number, environment: NetworkPerformanceReport['environment']): NetworkPerformanceReport {
    const totalTestTime = Date.now() - startTime;
    const metrics = this.calculateMetrics();
    
    const report: NetworkPerformanceReport = {
      timestamp: new Date().toISOString(),
      environment,
      config: this.config,
      metrics,
      detailedResults: {
        requestResults: this.results.requests,
        translationResults: this.results.translations,
        cacheAnalysis: this.analyzeCachePerformance(),
        retryAnalysis: this.analyzeRetryPerformance(),
        degradationAnalysis: this.analyzeDegradationPerformance()
      },
      recommendations: this.generateRecommendations(metrics),
      networkQuality: this.determineNetworkQuality(metrics),
      overallScore: this.calculateOverallScore(metrics)
    };
    
    return report;
  }

  /**
   * 计算性能指标
   */
  private calculateMetrics(): NetworkPerformanceMetrics {
    const requests = this.results.requests;
    const translations = this.results.translations;
    const cacheHits = this.results.cacheHits;
    const retryEvents = this.results.retryEvents;
    const degradationEvents = this.results.degradationEvents;

    // 基础性能指标
    const successfulRequests = requests.filter(r => r.status === 'success');
    const totalResponseTime = successfulRequests.reduce((sum, r) => sum + r.responseTime, 0);
    const avgResponseTime = successfulRequests.length > 0 ? totalResponseTime / successfulRequests.length : 0;
    
    const avgLatency = successfulRequests.length > 0;
      ? successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length 
      : 0;
    
    // 缓存性能
    const totalCacheRequests = cacheHits.length;
    const cacheHitsCount = cacheHits.filter(c => c.hit).length;
    const cacheHitRate = totalCacheRequests > 0 ? cacheHitsCount / totalCacheRequests : 0;
    
    // 重试性能
    const totalRetries = retryEvents.length;
    const successfulRetries = retryEvents.filter(r => r.success).length;
    const retrySuccessRate = totalRetries > 0 ? successfulRetries / totalRetries : 1;
    const avgRetryDelay = retryEvents.length > 0;
      ? retryEvents.reduce((sum, r) => sum + r.delay, 0) / retryEvents.length 
      : 0;
    
    // 翻译加载性能
    const successfulTranslations = translations.filter(t => t.success);
    const avgTranslationLoadTime = successfulTranslations.length > 0;
      ? successfulTranslations.reduce((sum, t) => sum + t.loadTime, 0) / successfulTranslations.length
      : 0;
    
    const translationCacheHits = translations.filter(t => t.cacheHit).length;
    const translationCacheHitRate = translations.length > 0 ? translationCacheHits / translations.length : 0;
    
    // 降级性能
    const successfulDegradations = degradationEvents.filter(d => d.success).length;
    const degradationSuccessRate = degradationEvents.length > 0;
      ? successfulDegradations / degradationEvents.length 
      : 1;
    
    // 综合指标
    const availability = requests.length > 0 ? successfulRequests.length / requests.length : 0;
    const reliability = Math.min(1, (retrySuccessRate + degradationSuccessRate) / 2);
    const efficiency = Math.min(1, (cacheHitRate + translationCacheHitRate) / 2);

    // 计算吞吐量 (估算)
    const testDurationMinutes = this.config.testDuration / 60000;
    const throughput = testDurationMinutes > 0 ? requests.length / testDurationMinutes : 0;

    return {
      responseTime: avgResponseTime,
      latency: avgLatency,
      throughput,
      packetLoss: 0, // 需要更复杂的网络监控
      cacheHitRate,
      cacheSize: 0, // 需要从缓存管理器获取
      cacheEfficiency: cacheHitRate,
      retryCount: totalRetries,
      retrySuccessRate,
      averageRetryDelay: avgRetryDelay,
      translationLoadTime: avgTranslationLoadTime,
      preloadedNamespaces: translations.filter(t => t.cacheHit).length,
      translationCacheHitRate,
      degradationTriggerCount: degradationEvents.length,
      fallbackSuccessRate: degradationSuccessRate,
      availability,
      reliability,
      efficiency
    };
  }

  /**
   * 分析缓存性能
   */
  private analyzeCachePerformance(): CacheAnalysis {
    const cacheHits = this.results.cacheHits;
    const totalRequests = cacheHits.length;
    const hits = cacheHits.filter(c => c.hit).length;
    
    return {
      hitRate: totalRequests > 0 ? hits / totalRequests : 0,
      totalRequests,
      cacheHits: hits,
      cacheMisses: totalRequests - hits,
      averageCacheAccessTime: cacheHits.length > 0 
        ? cacheHits.reduce((sum, c) => sum + c.time, 0) / cacheHits.length 
        : 0,
      cacheSize: 0, // 需要从实际缓存获取
      cacheEntries: hits
    };
  }

  /**
   * 分析重试性能
   */
  private analyzeRetryPerformance(): RetryAnalysis {
    const retryEvents = this.results.retryEvents;
    const successful = retryEvents.filter(r => r.success).length;
    
    return {
      totalRetries: retryEvents.length,
      successfulRetries: successful,
      failedRetries: retryEvents.length - successful,
      averageRetryDelay: retryEvents.length > 0 
        ? retryEvents.reduce((sum, r) => sum + r.delay, 0) / retryEvents.length 
        : 0,
      retryReasons: {},
      retryEffectiveness: retryEvents.length > 0 ? successful / retryEvents.length : 1
    };
  }

  /**
   * 分析降级性能
   */
  private analyzeDegradationPerformance(): DegradationAnalysis {
    const degradationEvents = this.results.degradationEvents;
    const successful = degradationEvents.filter(d => d.success).length;
    
    return {
      triggersCount: degradationEvents.length,
      successfulDegradations: successful,
      failedDegradations: degradationEvents.length - successful,
      fallbackUsage: {},
      degradationEffectiveness: degradationEvents.length > 0 ? successful / degradationEvents.length : 1
    };
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(metrics: NetworkPerformanceMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.responseTime > 2000) {
      recommendations.push('响应时间过长，建议优化网络请求或增加缓存策略');
    }
    
    if (metrics.cacheHitRate < 0.5) {
      recommendations.push('缓存命中率偏低，建议增加缓存大小或调整缓存策略');
    }
    
    if (metrics.retrySuccessRate < 0.8) {
      recommendations.push('重试成功率较低，建议优化重试策略或检查网络稳定性');
    }
    
    if (metrics.translationLoadTime > 1000) {
      recommendations.push('翻译文件加载时间过长，建议预加载或压缩翻译文件');
    }
    
    if (metrics.availability < 0.9) {
      recommendations.push('系统可用性偏低，建议增强错误处理和降级机制');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('网络性能良好，当前配置下系统运行稳定');
    }
    
    return recommendations;
  }

  /**
   * 确定网络质量等级
   */
  private determineNetworkQuality(metrics: NetworkPerformanceMetrics): string {
    if (metrics.responseTime < 100 && metrics.cacheHitRate > 0.8) {
      return '优秀';
    } else if (metrics.responseTime < 500 && metrics.cacheHitRate > 0.6) {
      return '良好';
    } else if (metrics.responseTime < 2000) {
      return '一般';
    } else {
      return '较差';
    }
  }

  /**
   * 计算综合评分
   */
  private calculateOverallScore(metrics: NetworkPerformanceMetrics): number {
    const weights = {
      availability: 0.25,
      reliability: 0.25,
      efficiency: 0.20,
      responseTime: 0.15,
      cacheHitRate: 0.15
    };
    
    // 将响应时间转换为得分 (响应时间越短得分越高)
    const responseTimeScore = Math.max(0, 100 - (metrics.responseTime / 50));
    
    const score = (;
      metrics.availability * weights.availability * 100 +
      metrics.reliability * weights.reliability * 100 +
      metrics.efficiency * weights.efficiency * 100 +
      responseTimeScore * weights.responseTime +
      metrics.cacheHitRate * weights.cacheHitRate * 100
    );
    
    return Math.round(score);
  }

  /**
   * 睡眠工具函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 导出测试结果为JSON
   */
  exportResults(report: NetworkPerformanceReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * 导出测试结果为Markdown报告
   */
  exportMarkdownReport(report: NetworkPerformanceReport): string {
    const lines: string[] = [];
    
    lines.push('# 网络性能测试报告\n');
    lines.push(`**生成时间**: ${report.timestamp}`);
    lines.push(`**测试时长**: ${this.config.testDuration / 1000}秒`);
    lines.push(`**网络质量**: ${report.networkQuality}`);
    lines.push(`**综合评分**: ${report.overallScore}/100\n`);
    
    lines.push('## 环境信息\n');
    lines.push(`- 用户代理: ${report.environment.userAgent.substring(0, 100)}...`);
    lines.push(`- 在线状态: ${report.environment.online ? '在线' : '离线'}`);
    if (report.environment.connection) {
      lines.push(`- 连接类型: ${report.environment.connection.effectiveType || '未知'}`);
      lines.push(`- 下行速度: ${report.environment.connection.downlink || '未知'} Mbps`);
    }
    lines.push('');
    
    lines.push('## 性能指标\n');
    lines.push(`- 平均响应时间: ${report.metrics.responseTime.toFixed(2)}ms`);
    lines.push(`- 缓存命中率: ${(report.metrics.cacheHitRate * 100).toFixed(2)}%`);
    lines.push(`- 重试成功率: ${(report.metrics.retrySuccessRate * 100).toFixed(2)}%`);
    lines.push(`- 翻译加载时间: ${report.metrics.translationLoadTime.toFixed(2)}ms`);
    lines.push(`- 系统可用性: ${(report.metrics.availability * 100).toFixed(2)}%`);
    lines.push('');
    
    lines.push('## 优化建议\n');
    report.recommendations.forEach(rec => {
      lines.push(`- ${rec}`);
    });
    lines.push('');
    
    lines.push('## 详细分析\n');
    lines.push(`### 请求分析`);
    const requestStats = this.calculateRequestStats(report.detailedResults.requestResults);
    lines.push(`- 总请求数: ${requestStats.total}`);
    lines.push(`- 成功请求: ${requestStats.success}`);
    lines.push(`- 失败请求: ${requestStats.failure}`);
    lines.push(`- 超时请求: ${requestStats.timeout}`);
    lines.push('');
    
    lines.push(`### 翻译分析`);
    const translationStats = this.calculateTranslationStats(report.detailedResults.translationResults);
    lines.push(`- 成功加载: ${translationStats.success}`);
    lines.push(`- 缓存命中: ${translationStats.cacheHit}`);
    lines.push(`- 平均加载时间: ${translationStats.avgLoadTime.toFixed(2)}ms`);
    
    return lines.join('\n');
  }

  private calculateRequestStats(results: RequestResult[]) {
    return {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      failure: results.filter(r => r.status === 'failure').length,
      timeout: results.filter(r => r.status === 'timeout').length
    };
  }

  private calculateTranslationStats(results: TranslationResult[]) {
    const successful = results.filter(r => r.success);
    const cacheHits = results.filter(r => r.cacheHit);
    
    return {
      success: successful.length,
      cacheHit: cacheHits.length,
      avgLoadTime: successful.length > 0 
        ? successful.reduce((sum, r) => sum + r.loadTime, 0) / successful.length 
        : 0
    };
  }
}

// 便捷函数
export async function runNetworkPerformanceTest(config?: Partial<NetworkTestConfig>): Promise<NetworkPerformanceReport> {
  const tester = new NetworkPerformanceTester(config);
  return await tester.runPerformanceTest();
}

export async function runQuickNetworkTest(): Promise<NetworkPerformanceReport> {
  return await runNetworkPerformanceTest({
    testDuration: 10000,  // 10秒快速测试
    requestInterval: 2000,
    concurrentRequests: 2
  });
}

export { NetworkPerformanceTester };
export type ;