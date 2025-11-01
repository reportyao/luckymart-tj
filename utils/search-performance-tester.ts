import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
/**
 * 多语言搜索性能测试工具
 * 
 * 测试不同语言的搜索响应时间
 * 验证搜索结果的相关性和准确性
 * 生成搜索性能报告
 */

  ProductMultilingualService,
  MultilingualHelper,
  type SupportedLanguage,
  type MultilingualText,
} from '@/lib/services/multilingual-query';

interface SearchPerformanceMetrics {
  language: SupportedLanguage;
  searchTerm: string;
  responseTime: number;
  resultsCount: number;
  relevanceScore: number;
  accuracyScore: number;
  timestamp: Date;
}

interface SearchTestResult {
  testName: string;
  language: SupportedLanguage;
  searchTerm: string;
  responseTime: number;
  resultsCount: number;
  relevanceScore: number;
  accuracyScore: number;
  status: 'PASS' | 'FAIL' | 'WARNING';
  errorMessage?: string;
  timestamp: Date;
}

interface PerformanceReport {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageResponseTime: number;
    slowestTest: number;
    fastestTest: number;
    languageBreakdown: Record<SupportedLanguage, {
      testsCount: number;
      averageResponseTime: number;
      successRate: number;
    }>;
  };
  details: SearchTestResult[];
  recommendations: string[];
  performanceThresholds: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };
  timestamp: string;
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];

// 性能阈值（毫秒）
const PERFORMANCE_THRESHOLDS = {
  excellent: 100,  // 优秀：<100ms
  good: 300,       // 良好：<300ms
  acceptable: 500, // 可接受：<500ms
  poor: 1000,      // 差：<1000ms
};

// 测试数据
const PERFORMANCE_TEST_DATA = [;
  {
    category: 'electronics',
    searchTerms: {
      'zh-CN': ['智能手机', '无线耳机', '电子产品'],
      'en-US': ['smartphone', 'wireless headphones', 'electronics'],
      'ru-RU': ['смартфон', 'беспроводные наушники', 'электроника'],
      'tg-TJ': ['smartfon', 'quloqchin', 'elektronika'],
    },
  },
  {
    category: 'clothing',
    searchTerms: {
      'zh-CN': ['运动鞋', '服装', '鞋帽'],
      'en-US': ['sports shoes', 'clothing', 'fashion'],
      'ru-RU': ['кроссовки', 'одежда', 'мода'],
      'tg-TJ': ['маҳсулоти варзишӣ', 'либос', 'мода'],
    },
  },
];

/**
 * 搜索性能测试器类
 */
export class SearchPerformanceTester {
  private results: SearchTestResult[] = [];
  private baseUrl: string = process.env.TEST_API_URL || '${API_BASE_URL}';

  /**
   * 运行完整的搜索性能测试套件
   */
  async runFullTestSuite(): Promise<PerformanceReport> {
    console.log('🚀 开始多语言搜索性能测试...');
    
    this.results = [];
    
    // 1. 基本搜索性能测试
    await this.runBasicSearchPerformanceTests();
    
    // 2. 多语言搜索准确性测试
    await this.runMultilingualAccuracyTests();
    
    // 3. 搜索相关性测试
    await this.runSearchRelevanceTests();
    
    // 4. 并发搜索测试
    await this.runConcurrentSearchTests();
    
    // 5. 搜索压力测试
    await this.runSearchStressTests();

    // 生成报告
    const report = this.generatePerformanceReport();
    
    // 保存报告到文件
    await this.savePerformanceReport(report);
    
    console.log('✅ 搜索性能测试完成');
    return report;
}

  /**
   * 运行基本搜索性能测试
   */
  private async runBasicSearchPerformanceTests(): Promise<void> {
    console.log('📊 运行基本搜索性能测试...');

    for (const language of SUPPORTED_LANGUAGES) {
      for (const testData of PERFORMANCE_TEST_DATA) {
        const searchTerms = testData.(searchTerms?.language ?? null);
        
        for (const searchTerm of searchTerms) {
          const startTime = Date.now();
          
          try {
            // 模拟搜索API调用
            const products = await this.simulateSearchRequest(language, searchTerm);
            const responseTime = Date.now() - startTime;
            
            const result: SearchTestResult = {
              testName: 'basic_search_performance',
              language,
              searchTerm,
              responseTime,
              resultsCount: products.length,
              relevanceScore: this.calculateRelevanceScore(searchTerm, products),
              accuracyScore: this.calculateAccuracyScore(searchTerm, products),
              status: this.getPerformanceStatus(responseTime),
              timestamp: new Date(),
            };
            
            this.results.push(result);
            console.log(`  ${language}: "${searchTerm}" - ${responseTime}ms`);
  }
            
          } catch (error) {
            const responseTime = Date.now() - startTime;
            
            this.results.push({
              testName: 'basic_search_performance',
              language,
              searchTerm,
              responseTime,
              resultsCount: 0,
              relevanceScore: 0,
              accuracyScore: 0,
              status: 'FAIL',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
            });
            
            console.error(`  ${language}: "${searchTerm}" - 失败: ${error}`);
          }
        }
      }
    }
  }

  /**
   * 运行多语言搜索准确性测试
   */
  private async runMultilingualAccuracyTests(): Promise<void> {
    console.log('🌍 运行多语言搜索准确性测试...');

    // 测试跨语言搜索的准确性
    const crossLanguageTests = [;
      {
        searchLanguage: 'zh-CN' as SupportedLanguage,
        searchTerm: '智能手机',
        expectedInLanguages: ['en-US', 'ru-RU', 'tg-TJ'] as SupportedLanguage[],
      },
      {
        searchLanguage: 'en-US' as SupportedLanguage,
        searchTerm: 'wireless headphones',
        expectedInLanguages: ['zh-CN', 'ru-RU', 'tg-TJ'] as SupportedLanguage[],
      },
    ];

    for (const test of crossLanguageTests) {
      try {
        const startTime = Date.now();
        const products = await this.simulateSearchRequest(test.searchLanguage, test.searchTerm);
        const responseTime = Date.now() - startTime;
        
        // 验证结果在所有预期语言中的存在性
        let accuracyScore = 0;
        for (const lang of test.expectedInLanguages) {
          const hasMultilingualContent = products.some(product =>;
            product._multilingual?.name?.[lang] && product._multilingual.name[lang].length > 0
          );
          if (hasMultilingualContent) {
            accuracyScore += 1 / test.expectedInLanguages.length;
          }
        }
        
        this.results.push({
          testName: 'cross_language_accuracy',
          language: test.searchLanguage,
          searchTerm: test.searchTerm,
          responseTime,
          resultsCount: products.length,
          relevanceScore: this.calculateRelevanceScore(test.searchTerm, products),
          accuracyScore,
          status: accuracyScore >= 0.8 ? 'PASS' : 'WARNING',
          timestamp: new Date(),
        });
        
        console.log(`  跨语言准确性: "${test.searchTerm}" - 准确率: ${(accuracyScore * 100).toFixed(1)}%`);
        
      } catch (error) {
        console.error(`  跨语言准确性测试失败: ${error}`);
      }
    }
  }

  /**
   * 运行搜索相关性测试
   */
  private async runSearchRelevanceTests(): Promise<void> {
    console.log('🎯 运行搜索相关性测试...');

    const relevanceTests = [;
      {
        searchTerm: '手机',
        expectedTerms: ['smartphone', '手机', 'смартфон', 'smartfon'],
        category: 'electronics',
      },
      {
        searchTerm: 'headphones',
        expectedTerms: ['headphones', 'наушники', 'quloqchin'],
        category: 'electronics',
      },
    ];

    for (const test of relevanceTests) {
      for (const language of SUPPORTED_LANGUAGES) {
        try {
          const startTime = Date.now();
          const products = await this.simulateSearchRequest(language, test.searchTerm);
          const responseTime = Date.now() - startTime;
          
          const relevanceScore = this.calculateRelevanceScore(test.searchTerm, products, test.expectedTerms);
          
          this.results.push({
            testName: 'search_relevance',
            language,
            searchTerm: test.searchTerm,
            responseTime,
            resultsCount: products.length,
            relevanceScore,
            accuracyScore: relevanceScore, // 相关性测试中相关性等于准确性
            status: relevanceScore >= 0.7 ? 'PASS' : 'WARNING',
            timestamp: new Date(),
          });
          
        } catch (error) {
          console.error(`  相关性测试失败: ${error}`);
        }
      }
    }
  }

  /**
   * 运行并发搜索测试
   */
  private async runConcurrentSearchTests(): Promise<void> {
    console.log('⚡ 运行并发搜索测试...');

    const concurrentRequests = 10;
    const promises: Promise<SearchTestResult>[] = [];

    // 创建并发请求
    for (let i = 0; i < concurrentRequests; i++) {
      const language = SUPPORTED_LANGUAGES[i % SUPPORTED_LANGUAGES.length];
      const searchTerm = 'smartphone';
      
      promises.push(this.performSingleSearchTest(language, searchTerm, 'concurrent_search'));
    }

    const startTime = Date.now();
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    this.results.push(...results);
    
    console.log(`  并发搜索: ${concurrentRequests}个请求，总用时 ${totalTime}ms，平均 ${(totalTime / concurrentRequests).toFixed(1)}ms`);
  }

  /**
   * 运行搜索压力测试
   */
  private async runSearchStressTests(): Promise<void> {
    console.log('🔥 运行搜索压力测试...');

    const stressTestScenarios = [;
      { requests: 50, duration: 1000 }, // 50个请求，1秒内完成
      { requests: 100, duration: 2000 }, // 100个请求，2秒内完成
    ];

    for (const scenario of stressTestScenarios) {
      const promises: Promise<SearchTestResult>[] = [];
      
      // 创建压力测试请求
      for (let i = 0; i < scenario.requests; i++) {
        const language = SUPPORTED_LANGUAGES[i % SUPPORTED_LANGUAGES.length];
        const searchTerm = `stress_test_${i}`;
        
        promises.push(this.performSingleSearchTest(language, searchTerm, 'stress_search'));
      }

      try {
        const startTime = Date.now();
        const results = await Promise.allSettled(promises);
        const totalTime = Date.now() - startTime;
        
        const successfulResults = results.filter(r => r.status === 'fulfilled').length;
        const failedResults = results.filter(r => r.status === 'rejected').length;
        
        console.log(`  压力测试: ${scenario.requests}个请求，成功 ${successfulResults}个，失败 ${failedResults}个，总用时 ${totalTime}ms`);
        
        // 生成压力测试总结结果
        this.results.push({
          testName: 'stress_search_summary',
          language: 'tg-TJ' as SupportedLanguage,
          searchTerm: `stress_${scenario.requests}_requests`,
          responseTime: totalTime,
          resultsCount: successfulResults,
          relevanceScore: successfulResults / scenario.requests,
          accuracyScore: successfulResults / scenario.requests,
          status: successfulResults / scenario.requests >= 0.9 ? 'PASS' : 'WARNING',
          timestamp: new Date(),
        });
        
      } catch (error) {
        console.error(`  压力测试失败: ${error}`);
      }
    }
  }

  /**
   * 执行单个搜索测试
   */
  private async performSingleSearchTest(
    language: SupportedLanguage,
    searchTerm: string,
    testType: string
  ): Promise<SearchTestResult> {
    const startTime = Date.now();
    
    try {
      const products = await this.simulateSearchRequest(language, searchTerm);
      const responseTime = Date.now() - startTime;
      
      return {
        testName: testType,
        language,
        searchTerm,
        responseTime,
        resultsCount: products.length,
        relevanceScore: this.calculateRelevanceScore(searchTerm, products),
        accuracyScore: this.calculateAccuracyScore(searchTerm, products),
        status: this.getPerformanceStatus(responseTime),
        timestamp: new Date(),
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        testName: testType,
        language,
        searchTerm,
        responseTime,
        resultsCount: 0,
        relevanceScore: 0,
        accuracyScore: 0,
        status: 'FAIL',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * 模拟搜索API请求
   */
  private async simulateSearchRequest(language: SupportedLanguage, searchTerm: string): Promise<any[]> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
    
    // 模拟搜索结果
    const mockResults = [;
      {
        id: '1',
        name: `Mock Product ${searchTerm}`,
        description: `Description for ${searchTerm}`,
        category: 'electronics',
        _multilingual: {
          name: {
            'zh-CN': `${searchTerm} 产品`,
            'en-US': `${searchTerm} Product`,
            'ru-RU': `Товар ${searchTerm}`,
            'tg-TJ': `Маҳсулоти ${searchTerm}`,
          },
        },
      },
    ];
    
    return mockResults;
  }

  /**
   * 计算搜索相关性评分
   */
  private calculateRelevanceScore(searchTerm: string, results: any[], expectedTerms: string[] = []): number {
    if (results.length === 0) return 0; {
    
    let totalScore = 0;
    
    results.forEach(result => {
      const text = `${result.name} ${result.description} ${result.category}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      // 精确匹配
      if (text.includes(searchLower)) {
        totalScore += 1.0;
      }
      // 部分匹配
      else if (text.split(' ').some(word => word.includes(searchLower) || searchLower.includes(word))) {
        totalScore += 0.7;
      }
      // 预期术语匹配
      else if (expectedTerms.some(term => text.includes(term.toLowerCase()))) {
        totalScore += 0.8;
      }
      else {
        totalScore += 0.3; // 基础分
      }
    });
    
    return Math.min(totalScore / results.length, 1.0);
  }

  /**
   * 计算搜索准确性评分
   */
  private calculateAccuracyScore(searchTerm: string, results: any[]): number {
    // 简单的准确性评分：结果中包含搜索词的程度
    return this.calculateRelevanceScore(searchTerm, results);
  }

  /**
   * 根据响应时间获取性能状态
   */
  private getPerformanceStatus(responseTime: number): 'PASS' | 'FAIL' | 'WARNING' {
    if (responseTime <= PERFORMANCE_THRESHOLDS.excellent) return 'PASS'; {
    if (responseTime <= PERFORMANCE_THRESHOLDS.good) return 'PASS'; {
    if (responseTime <= PERFORMANCE_THRESHOLDS.acceptable) return 'WARNING'; {
    return 'FAIL';
  }

  /**
   * 生成性能报告
   */
  private generatePerformanceReport(): PerformanceReport {
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const totalTests = this.results.length;
    
    const responseTimes = this.results.map(r => r.responseTime);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / totalTests;
    const slowestTest = Math.max(...responseTimes);
    const fastestTest = Math.min(...responseTimes);

    // 按语言统计
    const languageBreakdown = SUPPORTED_LANGUAGES.reduce((acc, lang) => {
      const langResults = this.results.filter(r => r.language === lang);
      const langPassed = langResults.filter(r => r.status === 'PASS').length;
      
      acc[lang] = {
        testsCount: langResults.length,
        averageResponseTime: langResults.reduce((sum, r) => sum + r.responseTime, 0) / langResults.length,
        successRate: langResults.length > 0 ? langPassed / langResults.length : 0,
      };
      
      return acc;
    }, {} as PerformanceReport['summary']['languageBreakdown']);

    const recommendations = this.generateRecommendations();

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        averageResponseTime,
        slowestTest,
        fastestTest,
        languageBreakdown,
      },
      details: this.results,
      recommendations,
      performanceThresholds: PERFORMANCE_THRESHOLDS,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // 基于性能指标生成建议
    const averageResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length;
    
    if (averageResponseTime > PERFORMANCE_THRESHOLDS.acceptable) {
      recommendations.push('搜索响应时间过长，建议优化数据库查询和添加索引');
    }
    
    if (averageResponseTime > PERFORMANCE_THRESHOLDS.good) {
      recommendations.push('搜索响应时间可以进一步优化，建议使用缓存');
    }
    
    // 检查语言性能差异
    const langAverages = SUPPORTED_LANGUAGES.map(lang => {
      const langResults = this.results.filter(r => r.language === lang);
      return {
        language: lang,
        avgTime: langResults.reduce((sum, r) => sum + r.responseTime, 0) / langResults.length,
      };
    });
    
    const maxAvgTime = Math.max(...langAverages.map(l => l.avgTime));
    const minAvgTime = Math.min(...langAverages.map(l => l.avgTime));
    
    if (maxAvgTime - minAvgTime > 200) {
      recommendations.push('不同语言搜索性能差异较大，建议统一优化策略');
    }
    
    // 基于准确性生成建议
    const lowAccuracyResults = this.results.filter(r => r.accuracyScore < 0.7);
    if (lowAccuracyResults.length > 0) {
      recommendations.push('部分搜索结果准确性较低，建议改进搜索算法和词库');
    }
    
    // 基于相关性生成建议
    const lowRelevanceResults = this.results.filter(r => r.relevanceScore < 0.6);
    if (lowRelevanceResults.length > 0) {
      recommendations.push('搜索相关性有待提升，建议增强语义匹配能力');
    }
    
    // 默认建议
    if (recommendations.length === 0) {
      recommendations.push('搜索性能表现良好，建议继续保持并监控性能指标');
      recommendations.push('考虑添加更多语言特定的优化策略');
      recommendations.push('建议实施实时性能监控和告警机制');
    }
    
    return recommendations;
  }

  /**
   * 保存性能报告到文件
   */
  private async savePerformanceReport(report: PerformanceReport): Promise<void> {
    const reportsDir = './test-reports';
    
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `search-performance-report-${timestamp}`;
    
    // 保存JSON格式报告
    const jsonPath = join(reportsDir, `${filename}.json`);
    writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    
    // 保存Markdown格式报告
    const mdPath = join(reportsDir, `${filename}.md`);
    const markdownReport = this.generateMarkdownReport(report);
    writeFileSync(mdPath, markdownReport);
    
    console.log(`📄 性能报告已保存:`);
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  Markdown: ${mdPath}`);
  }

  /**
   * 生成Markdown格式的性能报告
   */
  private generateMarkdownReport(report: PerformanceReport): string {
    const md = [;
      `# 多语言搜索性能测试报告`,
      ``,
      `**生成时间:** ${report.timestamp}`,
      ``,
      `## 测试摘要`,
      ``,
      `- **总测试数:** ${report.summary.totalTests}`,
      `- **通过测试:** ${report.summary.passedTests}`,
      `- **失败测试:** ${report.summary.failedTests}`,
      `- **平均响应时间:** ${report.summary.averageResponseTime.toFixed(2)}ms`,
      `- **最慢测试:** ${report.summary.slowestTest}ms`,
      `- **最快测试:** ${report.summary.fastestTest}ms`,
      ``,
      `## 性能阈值`,
      ``,
      `- **优秀:** < ${report.performanceThresholds.excellent}ms`,
      `- **良好:** < ${report.performanceThresholds.good}ms`,
      `- **可接受:** < ${report.performanceThresholds.acceptable}ms`,
      `- **较差:** >= ${report.performanceThresholds.poor}ms`,
      ``,
      `## 语言性能分解`,
      ``,
    ];

    for (const [language, stats] of Object.entries(report.summary.languageBreakdown)) {
      md.push(`### ${language}`);
      md.push(`- 测试数量: ${stats.testsCount}`);
      md.push(`- 平均响应时间: ${stats.averageResponseTime.toFixed(2)}ms`);
      md.push(`- 成功率: ${(stats.successRate * 100).toFixed(1)}%`);
      md.push(``);
    }

    md.push(`## 详细测试结果`);
    md.push(``);
    md.push(`| 测试类型 | 语言 | 搜索词 | 响应时间(ms) | 结果数 | 相关性 | 准确性 | 状态 |`);
    md.push(`|----------|------|--------|-------------|--------|--------|--------|------|`);

    for (const result of report.details) {
      md.push(`| ${result.testName} | ${result.language} | ${result.searchTerm} | ${result.responseTime} | ${result.resultsCount} | ${result.relevanceScore.toFixed(2)} | ${result.accuracyScore.toFixed(2)} | ${result.status} |`);
    }

    md.push(``);
    md.push(`## 优化建议`);
    md.push(``);

    for (const recommendation of report.recommendations) {
      md.push(`- ${recommendation}`);
    }

    return md.join('\n');
  }
}

// 导出主要类和函数
export default SearchPerformanceTester;
export { SearchPerformanceTester };

// 便捷函数：运行完整测试
export async function runSearchPerformanceTests(): Promise<PerformanceReport> {
  const tester = new SearchPerformanceTester();
  return await tester.runFullTestSuite();
}
}}}