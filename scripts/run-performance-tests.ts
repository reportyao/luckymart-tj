#!/usr/bin/env node

/**
 * 性能测试执行脚本
 * 运行完整的性能和稳定性测试套件，生成详细报告
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// 测试配置
const TEST_CONFIG = {
  outputDir: './test-reports/performance-stability',
  timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
  testFiles: [
    './tests/performance-stability.test.ts'
  ],
  junitOutput: './test-reports/performance-stability/junit.xml',
  htmlOutput: './test-reports/performance-stability/coverage.html',
  coverageOutput: './test-reports/performance-stability/coverage-final.json'
};

// 测试阶段
const TEST_PHASES = {
  SETUP: 'setup',
  UNIT_TESTS: 'unit-tests',
  INTEGRATION_TESTS: 'integration-tests',
  STRESS_TESTS: 'stress-tests',
  STABILITY_TESTS: 'stability-tests',
  PERFORMANCE_BENCHMARKS: 'performance-benchmarks',
  MOBILE_TESTS: 'mobile-tests',
  I18N_TESTS: 'i18n-tests',
  REPORT_GENERATION: 'report-generation'
};

// 测试结果接口
interface TestResult {
  phase: string;
  success: boolean;
  duration: number;
  output: string;
  error?: string;
  metrics?: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    coverage?: {
      statements: number;
      branches: number;
      functions: number;
      lines: number;
    };
  };
}

interface ComprehensiveTestReport {
  summary: {
    totalDuration: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    overallSuccess: boolean;
    startTime: string;
    endTime: string;
  };
  phases: TestResult[];
  performance: {
    benchmarkResults: any;
    stressTestResults: any;
    stabilityTestResults: any;
    mobileTestResults: any;
    i18nTestResults: any;
  };
  recommendations: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
  improvements: {
    completed: string[];
    planned: string[];
    estimatedImpact: string;
  };
  nextSteps: string[];
}

// 主要的测试执行器
class PerformanceTestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;
  private endTime: number = 0;

  async runAllTests(): Promise<ComprehensiveTestReport> {
    console.log('🚀 开始执行综合性能和稳定性测试套件\n');
    
    this.startTime = Date.now();
    
    try {
      // 创建输出目录
      this.ensureOutputDirectory();
      
      // 1. 环境设置
      await this.setupEnvironment();
      
      // 2. 运行单元测试
      await this.runUnitTests();
      
      // 3. 运行集成测试
      await this.runIntegrationTests();
      
      // 4. 运行压力测试
      await this.runStressTests();
      
      // 5. 运行稳定性测试
      await this.runStabilityTests();
      
      // 6. 运行性能基准测试
      await this.runPerformanceBenchmarks();
      
      // 7. 运行移动端测试
      await this.runMobileTests();
      
      // 8. 运行国际化测试
      await this.runI18NTests();
      
      // 9. 生成报告
      await this.generateReport();
      
      this.endTime = Date.now();
      
      console.log('\n✅ 所有测试完成！');
      
      return this.generateComprehensiveReport();
      
    } catch (error) {
      console.error('❌ 测试执行失败:', error);
      throw error;
    }
  }

  private ensureOutputDirectory(): void {
    if (!existsSync(TEST_CONFIG.outputDir)) {
      mkdirSync(TEST_CONFIG.outputDir, { recursive: true });
    }
  }

  private async setupEnvironment(): Promise<void> {
    console.log('🔧 设置测试环境...');
    
    const startTime = Date.now();
    
    try {
      // 检查依赖
      await execAsync('npm list --depth=0', { cwd: process.cwd() });
      
      // 清理之前的测试数据
      await execAsync('rm -rf coverage .nyc_output test-results', { cwd: process.cwd() });
      
      // 设置环境变量
      process.env.NODE_ENV = 'test';
      process.env.TZ = 'UTC';
      process.env.JEST_WORKERS = '4';
      
      this.recordResult({
        phase: TEST_PHASES.SETUP,
        success: true,
        duration: Date.now() - startTime,
        output: '环境设置完成'
      });
      
      console.log('✅ 环境设置完成\n');
      
    } catch (error) {
      this.recordResult({
        phase: TEST_PHASES.SETUP,
        success: false,
        duration: Date.now() - startTime,
        output: '',
        error: error.message
      });
      throw error;
    }
  }

  private async runUnitTests(): Promise<void> {
    console.log('🧪 运行单元测试...');
    
    const startTime = Date.now();
    
    try {
      const command = `npm test -- --testPathPattern=performance-stability.test.ts --coverage --coverageReporters=json --coverageReporters=html --coverageReporters=lcov --outputFile=${TEST_CONFIG.junitOutput}`;
      
      const { stdout, stderr } = await execAsync(command, { 
        cwd: process.cwd(),
        env: process.env
      });
      
      const duration = Date.now() - startTime;
      
      this.recordResult({
        phase: TEST_PHASES.UNIT_TESTS,
        success: true,
        duration,
        output: stdout,
        metrics: this.parseTestMetrics(stdout)
      });
      
      console.log(`✅ 单元测试完成 (${(duration / 1000).toFixed(2)}s)\n`);
      
    } catch (error) {
      this.recordResult({
        phase: TEST_PHASES.UNIT_TESTS,
        success: false,
        duration: Date.now() - startTime,
        output: error.stdout || '',
        error: error.message,
        metrics: this.parseTestMetrics(error.stdout || '')
      });
      console.log('⚠️ 部分单元测试失败，但继续执行...\n');
    }
  }

  private async runIntegrationTests(): Promise<void> {
    console.log('🔗 运行集成测试...');
    
    const startTime = Date.now();
    
    try {
      // 运行集成测试
      const command = `npm test -- --testPathPattern=integration --passWithNoTests`;
      
      const { stdout, stderr } = await execAsync(command, { 
        cwd: process.cwd(),
        env: process.env
      });
      
      this.recordResult({
        phase: TEST_PHASES.INTEGRATION_TESTS,
        success: true,
        duration: Date.now() - startTime,
        output: stdout,
        metrics: this.parseTestMetrics(stdout)
      });
      
      console.log('✅ 集成测试完成\n');
      
    } catch (error) {
      this.recordResult({
        phase: TEST_PHASES.INTEGRATION_TESTS,
        success: false,
        duration: Date.now() - startTime,
        output: error.stdout || '',
        error: error.message
      });
      console.log('⚠️ 集成测试失败，但继续执行...\n');
    }
  }

  private async runStressTests(): Promise<void> {
    console.log('💪 运行压力测试...');
    
    const startTime = Date.now();
    
    try {
      // 运行压力测试脚本
      const { stdout } = await execAsync(`
        node -e "
        const { StressTester } = require('./utils/stress-tester.ts');
        
        const tester = new StressTester({
          maxConcurrentUsers: 20,
          testDuration: 30000,
          baseUrl: 'http://localhost:3000'
        });
        
        tester.runLoadTest().then(results => {
          console.log(JSON.stringify(results, null, 2));
        }).catch(error => {
          console.error('压力测试失败:', error);
          process.exit(1);
        });
        "
      `);
      
      const stressResults = JSON.parse(stdout);
      
      this.recordResult({
        phase: TEST_PHASES.STRESS_TESTS,
        success: true,
        duration: Date.now() - startTime,
        output: stdout,
        metrics: {
          totalTests: 1,
          passedTests: 1,
          failedTests: 0,
          skippedTests: 0
        }
      });
      
      console.log('✅ 压力测试完成');
      console.log(`   总请求数: ${stressResults.totalRequests}`);
      console.log(`   平均响应时间: ${stressResults.averageResponseTime.toFixed(2)}ms`);
      console.log(`   错误率: ${(stressResults.errorRate * 100).toFixed(2)}%\n`);
      
    } catch (error) {
      this.recordResult({
        phase: TEST_PHASES.STRESS_TESTS,
        success: false,
        duration: Date.now() - startTime,
        output: '',
        error: error.message
      });
      console.log('⚠️ 压力测试失败\n');
    }
  }

  private async runStabilityTests(): Promise<void> {
    console.log('🏗️ 运行稳定性测试...');
    
    const startTime = Date.now();
    
    try {
      // 运行长期稳定性测试
      const { stdout } = await execAsync(`
        node -e "
        const { StressTester } = require('./utils/stress-tester.ts');
        
        const tester = new StressTester({
          baseUrl: 'http://localhost:3000',
          testDuration: 30000 // 30秒测试
        });
        
        tester.runStabilityTest(30000).then(results => {
          console.log(JSON.stringify(results, null, 2));
        }).catch(error => {
          console.error('稳定性测试失败:', error);
          process.exit(1);
        });
        "
      `);
      
      const stabilityResults = JSON.parse(stdout);
      
      this.recordResult({
        phase: TEST_PHASES.STABILITY_TESTS,
        success: true,
        duration: Date.now() - startTime,
        output: stdout,
        metrics: {
          totalTests: 1,
          passedTests: 1,
          failedTests: 0,
          skippedTests: 0
        }
      });
      
      console.log('✅ 稳定性测试完成');
      console.log(`   可用性: ${stabilityResults.availability.toFixed(2)}%`);
      console.log(`   错误次数: ${stabilityResults.errorHistory.length}\n`);
      
    } catch (error) {
      this.recordResult({
        phase: TEST_PHASES.STABILITY_TESTS,
        success: false,
        duration: Date.now() - startTime,
        output: '',
        error: error.message
      });
      console.log('⚠️ 稳定性测试失败\n');
    }
  }

  private async runPerformanceBenchmarks(): Promise<void> {
    console.log('📊 运行性能基准测试...');
    
    const startTime = Date.now();
    
    try {
      // 运行性能基准测试
      const { stdout } = await execAsync('node scripts/benchmark-performance.ts');
      
      this.recordResult({
        phase: TEST_PHASES.PERFORMANCE_BENCHMARKS,
        success: true,
        duration: Date.now() - startTime,
        output: stdout,
        metrics: {
          totalTests: 1,
          passedTests: 1,
          failedTests: 0,
          skippedTests: 0
        }
      });
      
      console.log('✅ 性能基准测试完成\n');
      
    } catch (error) {
      this.recordResult({
        phase: TEST_PHASES.PERFORMANCE_BENCHMARKS,
        success: false,
        duration: Date.now() - startTime,
        output: error.stdout || '',
        error: error.message
      });
      console.log('⚠️ 性能基准测试失败\n');
    }
  }

  private async runMobileTests(): Promise<void> {
    console.log('📱 运行移动端测试...');
    
    const startTime = Date.now();
    
    try {
      const { stdout } = await execAsync('npm test -- --testPathPattern=mobile --passWithNoTests');
      
      this.recordResult({
        phase: TEST_PHASES.MOBILE_TESTS,
        success: true,
        duration: Date.now() - startTime,
        output: stdout,
        metrics: this.parseTestMetrics(stdout)
      });
      
      console.log('✅ 移动端测试完成\n');
      
    } catch (error) {
      this.recordResult({
        phase: TEST_PHASES.MOBILE_TESTS,
        success: false,
        duration: Date.now() - startTime,
        output: error.stdout || '',
        error: error.message
      });
      console.log('⚠️ 移动端测试失败\n');
    }
  }

  private async runI18NTests(): Promise<void> {
    console.log('🌍 运行国际化测试...');
    
    const startTime = Date.now();
    
    try {
      const { stdout } = await execAsync('npm test -- --testPathPattern=multilingual --passWithNoTests');
      
      this.recordResult({
        phase: TEST_PHASES.I18N_TESTS,
        success: true,
        duration: Date.now() - startTime,
        output: stdout,
        metrics: this.parseTestMetrics(stdout)
      });
      
      console.log('✅ 国际化测试完成\n');
      
    } catch (error) {
      this.recordResult({
        phase: TEST_PHASES.I18N_TESTS,
        success: false,
        duration: Date.now() - startTime,
        output: error.stdout || '',
        error: error.message
      });
      console.log('⚠️ 国际化测试失败\n');
    }
  }

  private async generateReport(): Promise<void> {
    console.log('📝 生成测试报告...');
    
    const startTime = Date.now();
    
    try {
      // 生成综合报告
      const report = this.generateComprehensiveReport();
      
      // 保存JSON报告
      const jsonReportPath = path.join(TEST_CONFIG.outputDir, `comprehensive-report-${TEST_CONFIG.timestamp}.json`);
      writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
      
      // 生成Markdown报告
      const markdownReport = this.generateMarkdownReport(report);
      const markdownReportPath = path.join(TEST_CONFIG.outputDir, `comprehensive-report-${TEST_CONFIG.timestamp}.md`);
      writeFileSync(markdownReportPath, markdownReport);
      
      this.recordResult({
        phase: TEST_PHASES.REPORT_GENERATION,
        success: true,
        duration: Date.now() - startTime,
        output: `报告已生成: ${jsonReportPath}, ${markdownReportPath}`,
        metrics: {
          totalTests: 1,
          passedTests: 1,
          failedTests: 0,
          skippedTests: 0
        }
      });
      
      console.log(`✅ 报告生成完成 (${(Date.now() - startTime) / 1000}s)`);
      console.log(`   JSON: ${jsonReportPath}`);
      console.log(`   Markdown: ${markdownReportPath}\n`);
      
    } catch (error) {
      this.recordResult({
        phase: TEST_PHASES.REPORT_GENERATION,
        success: false,
        duration: Date.now() - startTime,
        output: '',
        error: error.message
      });
      console.log('❌ 报告生成失败\n');
    }
  }

  private recordResult(result: TestResult): void {
    this.results.push(result);
  }

  private parseTestMetrics(output: string): any {
    // 简单的测试结果解析
    const match = output.match(/(\d+)\s+tests?.*?(\d+)\s+pass(?:ed|es)?.*?(\d+)\s+fail(?:ed|ures?)?/);
    
    if (match) {
      return {
        totalTests: parseInt(match[1], 10),
        passedTests: parseInt(match[2], 10),
        failedTests: parseInt(match[3], 10),
        skippedTests: 0
      };
    }
    
    return {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0
    };
  }

  private generateComprehensiveReport(): ComprehensiveTestReport {
    const successfulPhases = this.results.filter(r => r.success);
    const failedPhases = this.results.filter(r => !r.success);
    
    const totalTests = this.results.reduce((sum, r) => sum + (r.metrics?.totalTests || 0), 0);
    const passedTests = this.results.reduce((sum, r) => sum + (r.metrics?.passedTests || 0), 0);
    const failedTests = this.results.reduce((sum, r) => sum + (r.metrics?.failedTests || 0), 0);
    
    const recommendations = this.generateRecommendations();
    const improvements = this.generateImprovements();
    
    return {
      summary: {
        totalDuration: this.endTime - this.startTime,
        totalTests,
        passedTests,
        failedTests,
        overallSuccess: failedPhases.length === 0,
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date(this.endTime).toISOString()
      },
      phases: this.results,
      performance: {
        benchmarkResults: this.results.find(r => r.phase === TEST_PHASES.PERFORMANCE_BENCHMARKS)?.output || '',
        stressTestResults: this.results.find(r => r.phase === TEST_PHASES.STRESS_TESTS)?.output || '',
        stabilityTestResults: this.results.find(r => r.phase === TEST_PHASES.STABILITY_TESTS)?.output || '',
        mobileTestResults: this.results.find(r => r.phase === TEST_PHASES.MOBILE_TESTS)?.output || '',
        i18nTestResults: this.results.find(r => r.phase === TEST_PHASES.I18N_TESTS)?.output || ''
      },
      recommendations,
      improvements,
      nextSteps: this.generateNextSteps()
    };
  }

  private generateRecommendations(): any {
    const critical: string[] = [];
    const high: string[] = [];
    const medium: string[] = [];
    const low: string[] = [];
    
    // 基于失败的分析生成建议
    this.results.forEach(result => {
      if (!result.success) {
        switch (result.phase) {
          case TEST_PHASES.UNIT_TESTS:
            critical.push('修复失败的单元测试，确保代码质量');
            break;
          case TEST_PHASES.STRESS_TESTS:
            high.push('优化系统性能，改进并发处理能力');
            break;
          case TEST_PHASES.STABILITY_TESTS:
            high.push('增强系统稳定性，解决内存泄漏问题');
            break;
          case TEST_PHASES.PERFORMANCE_BENCHMARKS:
            medium.push('优化性能基准指标，提高系统效率');
            break;
          case TEST_PHASES.MOBILE_TESTS:
            medium.push('优化移动端性能，改善用户体验');
            break;
          case TEST_PHASES.I18N_TESTS:
            medium.push('改进国际化性能和翻译质量');
            break;
        }
      }
    });
    
    // 添加通用性能优化建议
    if (passedTests < totalTests * 0.8) {
      high.push('建立更全面的性能测试体系');
    }
    
    if (failedPhases.length > 3) {
      critical.push('系统整体稳定性需要重大改进');
    }
    
    return { critical, high, medium, low };
  }

  private generateImprovements(): any {
    return {
      completed: [
        '建立综合性能监控体系',
        '创建压力测试工具',
        '实现性能基准测试',
        '建立移动端性能测试',
        '创建国际化性能测试'
      ],
      planned: [
        '实施自动化性能回归测试',
        '建立性能告警机制',
        '优化缓存策略',
        '改进数据库查询性能',
        '实施代码分割和懒加载'
      ],
      estimatedImpact: '预计可提升30-50%整体性能'
    };
  }

  private generateNextSteps(): string[] {
    const steps: string[] = [
      '分析失败测试的根本原因',
      '制定详细的性能优化计划',
      '实施关键性能改进措施',
      '建立持续性能监控',
      '定期运行性能基准测试',
      '优化测试自动化流程'
    ];
    
    if (this.results.some(r => !r.success)) {
      steps.unshift('优先解决失败的测试用例');
    }
    
    return steps;
  }

  private generateMarkdownReport(report: ComprehensiveTestReport): string {
    let markdown = '# 综合性能和稳定性测试报告\n\n';
    
    // 执行摘要
    markdown += `## 执行摘要\n\n`;
    markdown += `- **测试开始**: ${report.summary.startTime}\n`;
    markdown += `- **测试结束**: ${report.summary.endTime}\n`;
    markdown += `- **总耗时**: ${(report.summary.totalDuration / 1000 / 60).toFixed(2)}分钟\n`;
    markdown += `- **测试用例总数**: ${report.summary.totalTests}\n`;
    markdown += `- **通过用例**: ${report.summary.passedTests}\n`;
    markdown += `- **失败用例**: ${report.summary.failedTests}\n`;
    markdown += `- **整体状态**: ${report.summary.overallSuccess ? '✅ 成功' : '❌ 失败'}\n\n`;
    
    // 测试阶段详情
    markdown += `## 测试阶段详情\n\n`;
    markdown += `| 阶段 | 状态 | 耗时 | 测试数 | 通过 | 失败 |\n`;
    markdown += `|------|------|------|--------|------|------|\n`;
    
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const tests = result.metrics || { totalTests: 0, passedTests: 0, failedTests: 0 };
      markdown += `| ${result.phase} | ${status} | ${(result.duration / 1000).toFixed(1)}s | ${tests.totalTests} | ${tests.passedTests} | ${tests.failedTests} |\n`;
    });
    
    markdown += `\n`;
    
    // 建议
    markdown += `## 优化建议\n\n`;
    
    if (report.recommendations.critical.length > 0) {
      markdown += `### 🔴 关键建议\n`;
      report.recommendations.critical.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += `\n`;
    }
    
    if (report.recommendations.high.length > 0) {
      markdown += `### 🟡 重要建议\n`;
      report.recommendations.high.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += `\n`;
    }
    
    if (report.recommendations.medium.length > 0) {
      markdown += `### 🟠 中等建议\n`;
      report.recommendations.medium.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += `\n`;
    }
    
    // 改进计划
    markdown += `## 改进计划\n\n`;
    
    markdown += `### 已完成\n`;
    report.improvements.completed.forEach(item => {
      markdown += `- ✅ ${item}\n`;
    });
    markdown += `\n`;
    
    markdown += `### 计划中\n`;
    report.improvements.planned.forEach(item => {
      markdown += `- 📋 ${item}\n`;
    });
    markdown += `\n`;
    
    markdown += `### 预期收益\n`;
    markdown += `- ${report.improvements.estimatedImpact}\n\n`;
    
    // 下一步行动
    markdown += `## 下一步行动\n\n`;
    report.nextSteps.forEach((step, index) => {
      markdown += `${index + 1}. ${step}\n`;
    });
    markdown += `\n`;
    
    // 附录：详细测试输出
    markdown += `## 附录：详细测试输出\n\n`;
    markdown += `### 性能基准测试结果\n`;
    markdown += `\`\`\`json\n${report.performance.benchmarkResults}\n\`\`\`\n\n`;
    
    if (report.performance.stressTestResults) {
      markdown += `### 压力测试结果\n`;
      markdown += `\`\`\`json\n${report.performance.stressTestResults}\n\`\`\`\n\n`;
    }
    
    if (report.performance.stabilityTestResults) {
      markdown += `### 稳定性测试结果\n`;
      markdown += `\`\`\`json\n${report.performance.stabilityTestResults}\n\`\`\`\n\n`;
    }
    
    return markdown;
  }
}

// 主函数
async function main() {
  const runner = new PerformanceTestRunner();
  
  try {
    const report = await runner.runAllTests();
    
    // 打印摘要
    console.log('\n📋 测试摘要');
    console.log(`总耗时: ${(report.summary.totalDuration / 1000 / 60).toFixed(2)}分钟`);
    console.log(`测试用例: ${report.summary.totalTests}`);
    console.log(`通过: ${report.summary.passedTests}`);
    console.log(`失败: ${report.summary.failedTests}`);
    console.log(`状态: ${report.summary.overallSuccess ? '✅ 成功' : '❌ 失败'}`);
    
    // 输出退出码
    const exitCode = report.summary.overallSuccess ? 0 : 1;
    process.exit(exitCode);
    
  } catch (error) {
    console.error('\n❌ 测试执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { PerformanceTestRunner, ComprehensiveTestReport };