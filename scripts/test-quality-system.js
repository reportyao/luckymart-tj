#!/usr/bin/env node

/**
 * 翻译质量评估系统测试脚本
 * Translation Quality Assessment System Test
 */

const path = require('path');
const { QualityAssessor } = require('../utils/translation-quality-metrics');
const { AutomatedQualityChecker } = require('../utils/automated-quality-checker');
const { QualityReportGenerator } = require('./generate-quality-report');

class QualitySystemTester {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🧪 开始翻译质量评估系统测试...\n');

    try {
      // 1. 基础质量评估测试
      await this.testBasicQualityAssessment();
      
      // 2. 自动化质量检查测试
      await this.testAutomatedQualityChecker();
      
      // 3. 报告生成测试
      await this.testReportGeneration();
      
      // 4. 性能测试
      await this.testPerformance();
      
      // 5. 集成测试
      await this.testIntegration();
      
      // 生成测试报告
      await this.generateTestReport();
      
      this.printSummary();
      
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error);
      process.exit(1);
    }
  }

  /**
   * 测试基础质量评估功能
   */
  async testBasicQualityAssessment() {
    console.log('📊 测试基础质量评估...');
    
    const testCases = [
      {
        name: '准确翻译测试',
        sourceText: '欢迎使用我们的应用程序',
        translatedText: 'Welcome to our application',
        sourceLanguage: 'zh-CN',
        targetLanguage: 'en-US',
        namespace: 'common',
        key: 'welcome.message'
      },
      {
        name: '术语一致性测试',
        sourceText: '钱包余额不足',
        translatedText: 'Insufficient wallet balance',
        sourceLanguage: 'zh-CN',
        targetLanguage: 'en-US',
        namespace: 'wallet',
        key: 'balance.insufficient'
      },
      {
        name: '缺失翻译测试',
        sourceText: '这是一个测试消息',
        translatedText: '',
        sourceLanguage: 'zh-CN',
        targetLanguage: 'en-US',
        namespace: 'common',
        key: 'test.message'
      },
      {
        name: '占位符匹配测试',
        sourceText: '您有 {count} 条新消息',
        translatedText: 'You have {count} new messages',
        sourceLanguage: 'zh-CN',
        targetLanguage: 'en-US',
        namespace: 'common',
        key: 'messages.count'
      }
    ];

    for (const testCase of testCases) {
      try {
        const assessment = QualityAssessor.assessTranslation(
          testCase.sourceText,
          testCase.translatedText,
          testCase.sourceLanguage,
          testCase.targetLanguage,
          testCase.namespace,
          testCase.key
        );

        const result = {
          testName: testCase.name,
          success: true,
          score: assessment.overallScore,
          issuesCount: assessment.issues.length,
          recommendationsCount: assessment.recommendations.length
        };

        this.testResults.push(result);
        console.log(`  ✅ ${testCase.name}: 分数 ${assessment.overallScore}, 问题 ${assessment.issues.length}`);
        
      } catch (error) {
        console.log(`  ❌ ${testCase.name}: ${error.message}`);
        this.testResults.push({
          testName: testCase.name,
          success: false,
          error: error.message
        });
      }
    }
    
    console.log('  基础质量评估测试完成\n');
  }

  /**
   * 测试自动化质量检查器
   */
  async testAutomatedQualityChecker() {
    console.log('🤖 测试自动化质量检查器...');
    
    const checker = new AutomatedQualityChecker({
      sourceLanguage: 'zh-CN',
      targetLanguages: ['en-US', 'ru-RU'],
      namespaces: ['common', 'auth', 'wallet'],
      threshold: 70,
      autoFix: false,
      generateReport: false,
      batchSize: 5,
      parallel: false, // 测试串行处理
      excludePatterns: [],
      includeOnlyUpdated: false
    });

    try {
      // 测试文件扫描功能
      console.log('  📁 测试文件扫描...');
      await checker.scanTranslationFiles();
      console.log(`  ✅ 文件扫描完成，发现 ${checker.translationFiles?.length || 0} 个文件`);
      
      // 测试快速质量检查
      console.log('  🔍 测试快速质量检查...');
      const stats = await checker.performQualityCheck();
      
      const result = {
        testName: 'Automated Quality Check',
        success: true,
        totalTranslations: stats.totalTranslations,
        passedCount: stats.passedCount,
        failedCount: stats.failedCount,
        averageScore: stats.averageScore
      };

      this.testResults.push(result);
      console.log(`  ✅ 自动化检查完成: 总数 ${stats.totalTranslations}, 平均分 ${stats.averageScore.toFixed(1)}`);
      
    } catch (error) {
      console.log(`  ❌ 自动化检查失败: ${error.message}`);
      this.testResults.push({
        testName: 'Automated Quality Check',
        success: false,
        error: error.message
      });
    }
    
    console.log('  自动化质量检查器测试完成\n');
  }

  /**
   * 测试报告生成功能
   */
  async testReportGeneration() {
    console.log('📋 测试报告生成功能...');
    
    const generator = new QualityReportGenerator();

    const testCases = [
      {
        name: 'JSON报告生成',
        options: { format: 'json' }
      },
      {
        name: 'HTML报告生成',
        options: { format: 'html' }
      },
      {
        name: 'CSV报告生成',
        options: { format: 'csv' }
      }
    ];

    for (const testCase of testCases) {
      try {
        const reportPath = await generator.generateComprehensiveReport(testCase.options);
        
        const result = {
          testName: testCase.name,
          success: true,
          reportPath: reportPath
        };

        this.testResults.push(result);
        console.log(`  ✅ ${testCase.name}: ${reportPath}`);
        
      } catch (error) {
        console.log(`  ❌ ${testCase.name}: ${error.message}`);
        this.testResults.push({
          testName: testCase.name,
          success: false,
          error: error.message
        });
      }
    }
    
    console.log('  报告生成测试完成\n');
  }

  /**
   * 测试性能
   */
  async testPerformance() {
    console.log('⚡ 测试系统性能...');
    
    const startTime = Date.now();
    
    try {
      // 创建大量测试数据
      const testData = [];
      for (let i = 0; i < 100; i++) {
        testData.push({
          sourceText: `测试文本 ${i}`,
          translatedText: `Test text ${i}`,
          sourceLanguage: 'zh-CN',
          targetLanguage: 'en-US',
          namespace: 'test',
          key: `test.key.${i}`
        });
      }

      // 测试批量评估性能
      const batchStartTime = Date.now();
      for (const data of testData) {
        QualityAssessor.assessTranslation(
          data.sourceText,
          data.translatedText,
          data.sourceLanguage,
          data.targetLanguage,
          data.namespace,
          data.key
        );
      }
      const batchEndTime = Date.now();

      const result = {
        testName: 'Performance Test',
        success: true,
        dataCount: testData.length,
        totalTime: batchEndTime - batchStartTime,
        averageTime: (batchEndTime - batchStartTime) / testData.length
      };

      this.testResults.push(result);
      console.log(`  ✅ 性能测试完成: ${testData.length} 个评估，平均耗时 ${result.averageTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.log(`  ❌ 性能测试失败: ${error.message}`);
      this.testResults.push({
        testName: 'Performance Test',
        success: false,
        error: error.message
      });
    }
    
    console.log('  性能测试完成\n');
  }

  /**
   * 测试集成功能
   */
  async testIntegration() {
    console.log('🔗 测试集成功能...');
    
    try {
      // 测试完整的质量评估流程
      const checker = new AutomatedQualityChecker({
        sourceLanguage: 'zh-CN',
        targetLanguages: ['en-US'],
        namespaces: ['common'],
        threshold: 70,
        autoFix: false,
        generateReport: true,
        outputPath: path.join(__dirname, '../quality-reports/test-integration.json')
      });

      // 执行完整的质量检查流程
      const assessmentResult = await checker.performQualityCheck();
      const reportGenerator = new QualityReportGenerator();
      const reportPath = await reportGenerator.generateComprehensiveReport({
        format: 'json',
        languages: ['en-US'],
        namespaces: ['common']
      });

      const result = {
        testName: 'Integration Test',
        success: true,
        assessmentCompleted: !!assessmentResult,
        reportGenerated: !!reportPath
      };

      this.testResults.push(result);
      console.log('  ✅ 集成测试完成');
      
    } catch (error) {
      console.log(`  ❌ 集成测试失败: ${error.message}`);
      this.testResults.push({
        testName: 'Integration Test',
        success: false,
        error: error.message
      });
    }
    
    console.log('  集成测试完成\n');
  }

  /**
   * 生成测试报告
   */
  async generateTestReport() {
    console.log('📊 生成测试报告...');
    
    const endTime = Date.now();
    const totalTime = endTime - this.startTime;
    
    const report = {
      metadata: {
        testRun: new Date().toISOString(),
        totalDuration: totalTime,
        nodeVersion: process.version,
        platform: process.platform
      },
      summary: {
        totalTests: this.testResults.length,
        passedTests: this.testResults.filter(r => r.success).length,
        failedTests: this.testResults.filter(r => !r.success).length,
        successRate: (this.testResults.filter(r => r.success).length / this.testResults.length * 100).toFixed(1)
      },
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(__dirname, '../quality-reports/test-report.json');
    const fs = require('fs').promises;
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`  测试报告已保存: ${reportPath}`);
  }

  /**
   * 生成建议
   */
  generateRecommendations() {
    const recommendations = [];
    
    const failedTests = this.testResults.filter(r => !r.success);
    if (failedTests.length > 0) {
      recommendations.push('需要修复失败的测试用例');
    }
    
    const performanceTests = this.testResults.filter(r => r.testName === 'Performance Test');
    if (performanceTests.length > 0 && performanceTests[0].averageTime > 100) {
      recommendations.push('性能测试耗时较长，建议优化评估算法');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('所有测试通过，系统运行正常');
    }
    
    return recommendations;
  }

  /**
   * 打印测试摘要
   */
  printSummary() {
    console.log('📋 测试摘要:');
    console.log('=' * 50);
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过测试: ${passedTests}`);
    console.log(`失败测试: ${failedTests}`);
    console.log(`成功率: ${(passedTests / totalTests * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n失败的测试:');
      this.testResults
        .filter(r => !r.success)
        .forEach(test => {
          console.log(`  ❌ ${test.testName}: ${test.error}`);
        });
    }
    
    const totalTime = Date.now() - this.startTime;
    console.log(`\n总耗时: ${totalTime}ms`);
    
    if (failedTests === 0) {
      console.log('\n🎉 所有测试通过！翻译质量评估系统工作正常。');
    } else {
      console.log('\n⚠️ 部分测试失败，请检查系统配置。');
      process.exit(1);
    }
  }
}

// 运行测试
async function main() {
  const tester = new QualitySystemTester();
  await tester.runAllTests();
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = { QualitySystemTester };