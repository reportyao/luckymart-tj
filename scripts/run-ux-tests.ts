#!/usr/bin/env node

/**
 * 用户体验测试执行脚本
 * 
 * 运行所有用户体验和无障碍测试，生成综合报告
 */

import { runUXTests } from '../tests/user-experience.test';
import { runAccessibilityTests } from '../tests/accessibility.test';
import { getUXMetrics, getOptimizationSuggestions } from '../utils/ux-evaluator';

interface TestExecutionReport {
  timestamp: string;
  uxTests: {
    overallScore: number;
    overallRating: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warningTests: number;
    criticalIssues: string[];
    priorityImprovements: {
      high: string[];
      medium: string[];
      low: string[];
    };
  };
  accessibilityTests: {
    overallScore: number;
    overallLevel: string;
    complianceStatus: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warningTests: number;
    wcagCompliance: {
      perceivable: number;
      operable: number;
      understandable: number;
      robust: number;
    };
    criticalIssues: string[];
  };
  uxMetrics: any;
  optimizationSuggestions: any[];
  executiveSummary: {
    overallHealthScore: number;
    keyStrengths: string[];
    criticalIssues: string[];
    immediateActions: string[];
    strategicRecommendations: string[];
  };
  testEnvironment: {
    timestamp: string;
    userAgent: string;
    screenResolution: string;
    viewportSize: string;
    connectionType: string;
  };
}

/**
 * 主测试执行函数
 */
async function runComprehensiveUXTests(): Promise<TestExecutionReport> {
  console.log('🚀 开始全面的用户体验和无障碍测试...\n');
  console.log('='.repeat(60));
  console.log('📊 用户体验测试执行报告');
  console.log('='.repeat(60) + '\n');

  // 记录开始时间
  const startTime = Date.now();

  try {
    // 1. 运行用户体验测试
    console.log('🎯 第一阶段：用户体验测试');
    console.log('-'.repeat(40));
    const uxReport = await runUXTests();
    
    // 2. 运行无障碍测试
    console.log('♿ 第二阶段：无障碍测试');
    console.log('-'.repeat(40));
    const accessibilityReport = await runAccessibilityTests();

    // 3. 生成UX指标
    console.log('📈 第三阶段：用户体验指标分析');
    console.log('-'.repeat(40));
    const uxMetrics = getUXMetrics();

    // 4. 生成优化建议
    console.log('💡 第四阶段：优化建议生成');
    console.log('-'.repeat(40));
    const optimizationSuggestions = getOptimizationSuggestions();

    // 5. 计算测试环境信息
    const testEnvironment = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown'
    };

    // 6. 生成执行摘要
    const executionTime = Date.now() - startTime;
    const summary = generateExecutiveSummary(uxReport, accessibilityReport, optimizationSuggestions);

    // 7. 构建完整报告
    const fullReport: TestExecutionReport = {
      timestamp: new Date().toISOString(),
      uxTests: {
        overallScore: uxReport.overallScore,
        overallRating: uxReport.overallRating,
        totalTests: uxReport.testResults.length,
        passedTests: uxReport.testResults.filter(r => r.status === 'PASS').length,
        failedTests: uxReport.testResults.filter(r => r.status === 'FAIL').length,
        warningTests: uxReport.testResults.filter(r => r.status === 'WARNING').length,
        criticalIssues: uxReport.criticalIssues,
        priorityImprovements: uxReport.priorityImprovements
      },
      accessibilityTests: {
        overallScore: accessibilityReport.overallScore,
        overallLevel: accessibilityReport.overallLevel,
        complianceStatus: accessibilityReport.complianceStatus,
        totalTests: accessibilityReport.testResults.length,
        passedTests: accessibilityReport.testResults.filter(r => r.status === 'PASS').length,
        failedTests: accessibilityReport.testResults.filter(r => r.status === 'FAIL').length,
        warningTests: accessibilityReport.testResults.filter(r => r.status === 'WARNING').length,
        wcagCompliance: accessibilityReport.wcagCompliance,
        criticalIssues: accessibilityReport.criticalIssues
      },
      uxMetrics,
      optimizationSuggestions,
      executiveSummary: summary,
      testEnvironment
    };

    // 8. 输出报告摘要
    printReportSummary(executionTime, fullReport);

    // 9. 保存详细报告
    await saveDetailedReport(fullReport);

    console.log(`\n✅ 测试完成！总耗时: ${(executionTime / 1000).toFixed(2)}秒`);
    
    return fullReport;

  } catch (error) {
    console.error('❌ 测试执行失败:', error);
    throw error;
  }
}

/**
 * 生成执行摘要
 */
function generateExecutiveSummary(uxReport: any, accessibilityReport: any, optimizations: any[]) {
  const uxScore = uxReport.overallScore;
  const accessibilityScore = accessibilityReport.overallScore;
  const overallHealthScore = Math.round((uxScore + accessibilityScore) / 2);

  // 确定关键优势
  const keyStrengths: string[] = [];
  if (uxReport.userJourneyAnalysis.strengths.length > 0) {
    keyStrengths.push(...uxReport.userJourneyAnalysis.strengths.slice(0, 3));
  }
  if (accessibilityReport.wcagCompliance.perceivable > 80) {
    keyStrengths.push('可感知性无障碍支持良好');
  }
  if (accessibilityReport.wcagCompliance.operable > 80) {
    keyStrengths.push('键盘导航和操作支持完善');
  }

  // 确定严重问题
  const criticalIssues: string[] = [
    ...uxReport.criticalIssues.slice(0, 3),
    ...accessibilityReport.criticalIssues.slice(0, 3)
  ];

  // 确定立即行动项
  const immediateActions: string[] = [];
  if (uxReport.priorityImprovements.high.length > 0) {
    immediateActions.push(...uxReport.priorityImprovements.high.slice(0, 2));
  }
  if (accessibilityReport.priorityFixes.critical.length > 0) {
    immediateActions.push(...accessibilityReport.priorityFixes.critical.slice(0, 2));
  }

  // 确定战略建议
  const strategicRecommendations: string[] = [
    '实施持续的用户体验监控',
    '建立定期无障碍测试流程',
    '优化移动端用户体验',
    '加强多语言内容质量控制',
    '提升整体系统性能表现'
  ];

  return {
    overallHealthScore,
    keyStrengths,
    criticalIssues,
    immediateActions,
    strategicRecommendations
  };
}

/**
 * 打印报告摘要
 */
function printReportSummary(executionTime: number, report: TestExecutionReport) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 测试执行摘要');
  console.log('='.repeat(60));

  console.log(`\n🏆 整体健康评分: ${report.executiveSummary.overallHealthScore}/100`);
  console.log(`⏱️  执行时间: ${(executionTime / 1000).toFixed(2)}秒`);
  console.log(`🕐 测试时间: ${new Date(report.timestamp).toLocaleString()}`);

  console.log('\n📊 测试结果概览:');
  console.log(`   用户体验测试: ${report.uxTests.overallScore}/100 (${report.uxTests.overallRating})`);
  console.log(`   无障碍测试: ${report.accessibilityTests.overallScore}/100 (${report.accessibilityTests.overallLevel})`);

  console.log('\n✅ 测试详情:');
  console.log(`   用户体验测试: ${report.uxTests.passedTests}/${report.uxTests.totalTests} 通过`);
  console.log(`   无障碍测试: ${report.accessibilityTests.passedTests}/${report.accessibilityTests.totalTests} 通过`);

  if (report.executiveSummary.keyStrengths.length > 0) {
    console.log('\n💪 关键优势:');
    report.executiveSummary.keyStrengths.forEach(strength => {
      console.log(`   • ${strength}`);
    });
  }

  if (report.executiveSummary.criticalIssues.length > 0) {
    console.log('\n⚠️  严重问题:');
    report.executiveSummary.criticalIssues.forEach(issue => {
      console.log(`   • ${issue}`);
    });
  }

  if (report.executiveSummary.immediateActions.length > 0) {
    console.log('\n🚨 立即行动项:');
    report.executiveSummary.immediateActions.forEach(action => {
      console.log(`   • ${action}`);
    });
  }

  if (report.executiveSummary.strategicRecommendations.length > 0) {
    console.log('\n🎯 战略建议:');
    report.executiveSummary.strategicRecommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
  }

  console.log('\n📈 WCAG合规性:');
  console.log(`   可感知性: ${report.accessibilityTests.wcagCompliance.perceivable}%`);
  console.log(`   可操作性: ${report.accessibilityTests.wcagCompliance.operable}%`);
  console.log(`   可理解性: ${report.accessibilityTests.wcagCompliance.understandable}%`);
  console.log(`   健壮性: ${report.accessibilityTests.wcagCompliance.robust}%`);
}

/**
 * 保存详细报告
 */
async function saveDetailedReport(report: TestExecutionReport) {
  const reportDir = './test-reports';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = `${reportDir}/ux-comprehensive-test-${timestamp}.json`;
  
  try {
    // 确保目录存在
    await import('fs').then(fs => {
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
    });

    // 写入报告
    await import('fs').then(fs => {
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    });

    console.log(`\n📄 详细报告已保存到: ${reportFile}`);
  } catch (error) {
    console.error('保存报告失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runComprehensiveUXTests()
    .then((report) => {
      console.log('\n🎉 全面用户体验测试完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 测试执行失败:', error);
      process.exit(1);
    });
}

export { runComprehensiveUXTests, type TestExecutionReport };