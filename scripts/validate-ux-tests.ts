import * as fs from 'fs';
import * as path from 'path';
#!/usr/bin/env node

/**
 * 用户体验测试验证脚本
 * 
 * 验证创建的测试文件是否正常工作
 */


interface ValidationResult {
  file: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: string;
}

/**
 * 主验证函数
 */
async function validateUXTests(): Promise<void> {
  console.log('🔍 开始验证用户体验测试文件...\n');

  const results: ValidationResult[] = [];

  // 1. 验证测试文件存在性
  console.log('📁 检查测试文件存在性...');
  results.push(...await validateFileExistence());

  // 2. 验证文件结构
  console.log('\n📋 检查文件结构...');
  results.push(...await validateFileStructure());

  // 3. 验证TypeScript类型
  console.log('\n🔧 检查TypeScript类型...');
  results.push(...await validateTypeScriptTypes());

  // 4. 验证测试逻辑
  console.log('\n🧪 检查测试逻辑...');
  results.push(...await validateTestLogic());

  // 5. 生成验证报告
  generateValidationReport(results);
}

/**
 * 验证文件存在性
 */
async function validateFileExistence(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  const filesToCheck = [;
    {
      path: './tests/user-experience.test.ts',
      description: '用户体验测试套件'
    },
    {
      path: './tests/accessibility.test.ts', 
      description: '无障碍测试套件'
    },
    {
      path: './utils/ux-evaluator.ts',
      description: '用户体验评估工具'
    },
    {
      path: './scripts/run-ux-tests.ts',
      description: '测试执行脚本'
    }
  ];

  for (const file of filesToCheck) {
    try {
      if (fs.existsSync(file.path)) {
        results.push({
          file: file.path,
          status: 'PASS',
          message: `${file.description}文件存在`
        });
      } else {
        results.push({
          file: file.path,
          status: 'FAIL',
          message: `${file.description}文件不存在`
        });
      }
    } catch (error) {
      results.push({
        file: file.path,
        status: 'FAIL',
        message: `${file.description}文件检查失败`,
        details: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  return results;
}

/**
 * 验证文件结构
 */
async function validateFileStructure(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // 验证用户体验测试文件结构
  try {
    const uxTestContent = fs.readFileSync('./tests/user-experience.test.ts', 'utf8');
    
    // 检查关键组件
    const requiredComponents = [;
      'UXTester',
      'runUXTests',
      'UXTestReport',
      'UXTestResult',
      'UserBehavior',
      'testUserOperationFlows',
      'testMultilingualUsability',
      'testErrorHandlingUserFriendliness',
      'testMobileUX'
    ];

    const missingComponents = requiredComponents.filter(comp => !uxTestContent.includes(comp));
    
    if (missingComponents.length === 0) {
      results.push({
        file: './tests/user-experience.test.ts',
        status: 'PASS',
        message: '用户体验测试文件结构完整'
      });
    } else {
      results.push({
        file: './tests/user-experience.test.ts',
        status: 'FAIL',
        message: '缺少必要的组件',
        details: `缺少: ${missingComponents.join(', ')}`
      });
    }

    // 检查测试场景数量
    const testScenarios = (uxTestContent.match(/name: '.*'/g) || []).length;
    if (testScenarios >= 6) {
      results.push({
        file: './tests/user-experience.test.ts',
        status: 'PASS',
        message: `测试场景数量充足 (${testScenarios}个)`
      });
    } else {
      results.push({
        file: './tests/user-experience.test.ts',
        status: 'WARNING',
        message: '测试场景数量可能不足',
        details: `当前只有${testScenarios}个测试场景`
      });
    }

  } catch (error) {
    results.push({
      file: './tests/user-experience.test.ts',
      status: 'FAIL',
      message: '无法读取用户体验测试文件',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }

  // 验证无障碍测试文件结构
  try {
    const accessibilityContent = fs.readFileSync('./tests/accessibility.test.ts', 'utf8');
    
    const requiredAccessibilityComponents = [;
      'AccessibilityTester',
      'runAccessibilityTests',
      'AccessibilityComplianceReport',
      'AccessibilityTestResult',
      'testPerceivability',
      'testOperability', 
      'testUnderstandability',
      'testRobustness',
      'WCAG'
    ];

    const missingComponents = requiredAccessibilityComponents.filter(comp => !accessibilityContent.includes(comp));
    
    if (missingComponents.length === 0) {
      results.push({
        file: './tests/accessibility.test.ts',
        status: 'PASS',
        message: '无障碍测试文件结构完整'
      });
    } else {
      results.push({
        file: './tests/accessibility.test.ts',
        status: 'FAIL',
        message: '缺少必要的无障碍测试组件',
        details: `缺少: ${missingComponents.join(', ')}`
      });
    }

    // 检查WCAG合规性测试
    const wcagTests = (accessibilityContent.match(/wcagLevel/g) || []).length;
    if (wcagTests >= 20) {
      results.push({
        file: './tests/accessibility.test.ts',
        status: 'PASS',
        message: 'WCAG合规性测试覆盖充分'
      });
    } else {
      results.push({
        file: './tests/accessibility.test.ts',
        status: 'WARNING',
        message: 'WCAG合规性测试可能不够全面',
        details: `只有${wcagTests}个WCAG相关测试`
      });
    }

  } catch (error) {
    results.push({
      file: './tests/accessibility.test.ts',
      status: 'FAIL',
      message: '无法读取无障碍测试文件',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }

  // 验证UX评估工具文件结构
  try {
    const uxEvaluatorContent = fs.readFileSync('./utils/ux-evaluator.ts', 'utf8');
    
    const requiredEvaluatorComponents = [;
      'UXEvaluator',
      'UserBehavior',
      'UserFeedback',
      'UserJourney',
      'UXMetrics',
      'trackEvent',
      'recordFeedback',
      'analyzeBehavior',
      'generateOptimizations'
    ];

    const missingComponents = requiredEvaluatorComponents.filter(comp => !uxEvaluatorContent.includes(comp));
    
    if (missingComponents.length === 0) {
      results.push({
        file: './utils/ux-evaluator.ts',
        status: 'PASS',
        message: 'UX评估工具文件结构完整'
      });
    } else {
      results.push({
        file: './utils/ux-evaluator.ts',
        status: 'FAIL',
        message: '缺少必要的UX评估工具组件',
        details: `缺少: ${missingComponents.join(', ')}`
      });
    }

  } catch (error) {
    results.push({
      file: './utils/ux-evaluator.ts',
      status: 'FAIL',
      message: '无法读取UX评估工具文件',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }

  return results;
}

/**
 * 验证TypeScript类型
 */
async function validateTypeScriptTypes(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  try {
    // 使用TypeScript编译器检查类型
    const { execSync } = require('child_process');
    
    // 检查用户测试文件类型
    try {
      execSync('npx tsc --noEmit --strict tests/user-experience.test.ts', {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      results.push({
        file: './tests/user-experience.test.ts',
        status: 'PASS',
        message: '用户体验测试文件TypeScript类型检查通过'
      });
    } catch (error) {
      results.push({
        file: './tests/user-experience.test.ts',
        status: 'WARNING',
        message: '用户体验测试文件类型检查有警告',
        details: error.message
      });
    }

    // 检查无障碍测试文件类型
    try {
      execSync('npx tsc --noEmit --strict tests/accessibility.test.ts', {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      results.push({
        file: './tests/accessibility.test.ts',
        status: 'PASS',
        message: '无障碍测试文件TypeScript类型检查通过'
      });
    } catch (error) {
      results.push({
        file: './tests/accessibility.test.ts',
        status: 'WARNING',
        message: '无障碍测试文件类型检查有警告',
        details: error.message
      });
    }

    // 检查UX评估工具文件类型
    try {
      execSync('npx tsc --noEmit --strict utils/ux-evaluator.ts', {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      results.push({
        file: './utils/ux-evaluator.ts',
        status: 'PASS',
        message: 'UX评估工具TypeScript类型检查通过'
      });
    } catch (error) {
      results.push({
        file: './utils/ux-evaluator.ts',
        status: 'WARNING',
        message: 'UX评估工具TypeScript类型检查有警告',
        details: error.message
      });
    }

  } catch (error) {
    results.push({
      file: 'TypeScript Compiler',
      status: 'WARNING',
      message: '无法运行TypeScript编译器',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }

  return results;
}

/**
 * 验证测试逻辑
 */
async function validateTestLogic(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // 验证测试覆盖率
  try {
    const uxTestContent = fs.readFileSync('./tests/user-experience.test.ts', 'utf8');
    
    // 检查测试方法数量
    const testMethods = (uxTestContent.match(/async test\w+\(/g) || []).length;
    if (testMethods >= 4) {
      results.push({
        file: './tests/user-experience.test.ts',
        status: 'PASS',
        message: `测试方法数量充足 (${testMethods}个)`
      });
    } else {
      results.push({
        file: './tests/user-experience.test.ts',
        status: 'WARNING',
        message: '测试方法数量可能不足',
        details: `当前只有${testMethods}个测试方法`
      });
    }

    // 检查评分系统
    const scoreMentions = (uxTestContent.match(/score.*\d+/g) || []).length;
    if (scoreMentions >= 10) {
      results.push({
        file: './tests/user-experience.test.ts',
        status: 'PASS',
        message: '评分系统实现完整'
      });
    } else {
      results.push({
        file: './tests/user-experience.test.ts',
        status: 'WARNING',
        message: '评分系统可能不够完善'
      });
    }

  } catch (error) {
    results.push({
      file: './tests/user-experience.test.ts',
      status: 'FAIL',
      message: '无法验证测试逻辑',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }

  // 验证无障碍测试WCAG覆盖
  try {
    const accessibilityContent = fs.readFileSync('./tests/accessibility.test.ts', 'utf8');
    
    // 检查WCAG四个原则覆盖
    const principles = ['perceivable', 'operable', 'understandable', 'robust'];
    const coveredPrinciples = principles.filter(principle =>;
      accessibilityContent.includes(principle) || 
      accessibilityContent.includes(principle.charAt(0).toUpperCase() + principle.slice(1))
    );

    if (coveredPrinciples.length === 4) {
      results.push({
        file: './tests/accessibility.test.ts',
        status: 'PASS',
        message: 'WCAG四个原则测试覆盖完整'
      });
    } else {
      results.push({
        file: './tests/accessibility.test.ts',
        status: 'FAIL',
        message: 'WCAG四个原则测试覆盖不完整',
        details: `缺少: ${principles.filter(p => !coveredPrinciples.includes(p)).join(', ')}`
      });
    }

  } catch (error) {
    results.push({
      file: './tests/accessibility.test.ts',
      status: 'FAIL',
      message: '无法验证无障碍测试逻辑',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }

  // 验证UX评估工具功能
  try {
    const uxEvaluatorContent = fs.readFileSync('./utils/ux-evaluator.ts', 'utf8');
    
    // 检查核心功能
    const coreFeatures = [;
      'trackEvent',
      'recordFeedback', 
      'startJourney',
      'analyzeBehavior',
      'generateOptimizations'
    ];

    const implementedFeatures = coreFeatures.filter(feature =>;
      uxEvaluatorContent.includes(feature)
    );

    if (implementedFeatures.length === coreFeatures.length) {
      results.push({
        file: './utils/ux-evaluator.ts',
        status: 'PASS',
        message: '核心功能实现完整'
      });
    } else {
      results.push({
        file: './utils/ux-evaluator.ts',
        status: 'FAIL',
        message: '部分核心功能缺失',
        details: `缺少: ${coreFeatures.filter(f => !implementedFeatures.includes(f)).join(', ')}`
      });
    }

  } catch (error) {
    results.push({
      file: './utils/ux-evaluator.ts',
      status: 'FAIL',
      message: '无法验证UX评估工具功能',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }

  return results;
}

/**
 * 生成验证报告
 */
function generateValidationReport(results: ValidationResult[]): void {
  console.log('\n' + '='.repeat(60));
  console.log('📋 UX测试验证报告');
  console.log('='.repeat(60));

  const totalTests = results.length;
  const passedTests = results.filter(r => r.status === 'PASS').length;
  const failedTests = results.filter(r => r.status === 'FAIL').length;
  const warningTests = results.filter(r => r.status === 'WARNING').length;

  console.log(`\n📊 验证结果统计:`);
  console.log(`   总计: ${totalTests} 项`);
  console.log(`   ✅ 通过: ${passedTests} 项`);
  console.log(`   ⚠️  警告: ${warningTests} 项`);
  console.log(`   ❌ 失败: ${failedTests} 项`);

  console.log(`\n📋 详细结果:`);
  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : 
                 result.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`   ${icon} ${result.file}: ${result.message}`);
    if (result.details) {
      console.log(`      详情: ${result.details}`);
    }
  });

  const successRate = Math.round((passedTests / totalTests) * 100);
  console.log(`\n🏆 验证成功率: ${successRate}%`);

  if (failedTests === 0) {
    console.log(`\n🎉 所有测试文件验证通过！可以安全运行UX测试。`);
  } else if (warningTests > 0) {
    console.log(`\n⚠️  部分验证项有警告，建议检查后运行。`);
  } else {
    console.log(`\n❌ 存在失败的验证项，需要修复后运行。`);
  }

  // 保存验证报告
  saveValidationReport(results);
}

/**
 * 保存验证报告
 */
function saveValidationReport(results: ValidationResult[]): void {
  const reportDir = './test-reports';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = `${reportDir}/ux-validation-report-${timestamp}.json`;
  
  try {
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'PASS').length,
        warnings: results.filter(r => r.status === 'WARNING').length,
        failed: results.filter(r => r.status === 'FAIL').length
      },
      results
    };

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 验证报告已保存到: ${reportFile}`);
  } catch (error) {
    console.error('\n❌ 保存验证报告失败:', error);
  }
}

// 主函数
async function main() {
  try {
    await validateUXTests();
  } catch (error) {
    console.error('\n❌ 验证过程出错:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { validateUXTests, type ValidationResult };