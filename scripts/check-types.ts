#!/usr/bin/env node

/**
 * TypeScript 静态代码分析和类型安全检查脚本
 * 用于验证类型定义的一致性、安全性和代码质量
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 检查 TypeScript 文件
const TYPES_DIR = path.join(__dirname, '../types');
const API_DIR = path.join(__dirname, '../app/api');
const APP_DIR = path.join(__dirname, '../app');

// 检查类型定义文件
function checkTypeDefinitions() {
  console.log('🔍 检查类型定义文件...');
  
  const typesFile = path.join(TYPES_DIR, 'index.ts');
  
  if (!fs.existsSync(typesFile)) {
    console.error('❌ types/index.ts 文件不存在');
    return false;
  }
  
  const content = fs.readFileSync(typesFile, 'utf8');
  
  // 检查关键类型是否存在
  const requiredTypes = [;
    'WithdrawRequest',
    'Transaction', 
    'User',
    'Product',
    'Order',
    'LotteryRound'
  ];
  
  const missingTypes = [];
  
  for (const type of requiredTypes) {
    if (!content.includes(`export interface ${type}`)) {
      missingTypes.push(type);
    }
  }
  
  if (missingTypes.length > 0) {
    console.error('❌ 缺失的类型定义:', missingTypes.join(', '));
    return false;
  }
  
  // 检查类型守卫是否存在
  const guards = [;
    'isUser',
    'isProduct', 
    'isOrder',
    'isWithdrawRequest',
    'isTransaction'
  ];
  
  const missingGuards = [];
  
  for (const guard of guards) {
    if (!content.includes(`export function ${guard}`)) {
      missingGuards.push(guard);
    }
  }
  
  if (missingGuards.length > 0) {
    console.error('❌ 缺失的类型守卫:', missingGuards.join(', '));
    return false;
  }
  
  // 检查转换工具函数
  const converters = [;
    'convertUserFromPrisma',
    'convertProductFromPrisma',
    'convertOrderFromPrisma',
    'convertTransactionFromPrisma',
    'convertWithdrawRequestFromPrisma'
  ];
  
  const missingConverters = [];
  
  for (const converter of converters) {
    if (!content.includes(`export function ${converter}`)) {
      missingConverters.push(converter);
    }
  }
  
  if (missingConverters.length > 0) {
    console.error('❌ 缺失的转换函数:', missingConverters.join(', '));
    return false;
  }
  
  console.log('✅ 类型定义文件检查通过');
  return true;
}

// 检查 API 路由文件
function checkApiRoutes() {
  console.log('🔍 检查 API 路由文件...');
  
  let hasErrors = false;
  const apiFiles = [];
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.')) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        apiFiles.push(fullPath);
      }
    }
  }
  
  if (fs.existsSync(API_DIR)) {
    scanDirectory(API_DIR);
  }
  
  // 检查文件是否正确导入了类型
  for (const file of apiFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // 检查是否导入了 WithdrawRequest 或 Transaction 类型
      if (content.includes('WithdrawRequest') || content.includes('Transaction')) {
        if (!content.includes('import type') && !content.includes("import {") && !content.includes("from '@/types'")) {
          console.error(`❌ ${path.relative(__dirname, file)} - 未正确导入类型定义`);
          hasErrors = true;
        }
      }
      
      // 检查是否有重复的类型定义
      const interfaceMatches = content.match(/interface\s+\w+\s*{/g);
      if (interfaceMatches) {
        for (const match of interfaceMatches) {
          const interfaceName = match.replace(/interface\s+/, '').replace(/\s+{/, '');
          if (['WithdrawRequest', 'Transaction', 'User', 'Product', 'Order'].includes(interfaceName)) {
            console.error(`❌ ${path.relative(__dirname, file)} - 发现重复的类型定义: ${interfaceName}`);
            hasErrors = true;
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ 无法读取文件 ${file}:`, error.message);
      hasErrors = true;
    }
  }
  
  if (hasErrors) {
    console.error('❌ API 路由检查发现问题');
    return false;
  }
  
  console.log('✅ API 路由检查通过');
  }
  return true;
}

// 检查前端页面文件
function checkAppPages() {
  console.log('🔍 检查前端页面文件...');
  
  let hasErrors = false;
  const pageFiles = [];
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return; {
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.')) {
        scanDirectory(fullPath);
      } else if (item === 'page.tsx' || item === 'page.ts') {
        pageFiles.push(fullPath);
      }
    }
  }
  
  if (fs.existsSync(APP_DIR)) {
    scanDirectory(APP_DIR);
  }
  
  // 检查页面文件是否正确导入类型
  for (const file of pageFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // 检查是否使用了重复的类型定义
      const interfaceMatches = content.match(/interface\s+(\w+)\s*{/g);
      if (interfaceMatches) {
        for (const match of interfaceMatches) {
          const interfaceName = match.replace(/interface\s+/, '').replace(/\s+{/, '');
          if (['WithdrawRequest', 'Transaction', 'User', 'Product', 'Order'].includes(interfaceName)) {
            console.error(`❌ ${path.relative(__dirname, file)} - 发现重复的类型定义: ${interfaceName}`);
            hasErrors = true;
          }
        }
      }
      
      // 检查是否正确导入了统一类型
      if (content.includes('WithdrawRequest') || content.includes('Transaction')) {
        if (!content.includes("from '@/types'")) {
          console.error(`❌ ${path.relative(__dirname, file)} - 未从 @/types 导入类型`);
          hasErrors = true;
        }
      }
      
    } catch (error) {
      console.error(`❌ 无法读取文件 ${file}:`, error.message);
      hasErrors = true;
    }
  }
  
  if (hasErrors) {
    console.error('❌ 前端页面检查发现问题');
    return false;
  }
  
  console.log('✅ 前端页面检查通过');
  return true;
}

// 检查 Prisma 类型转换工具
function checkPrismaUtils() {
  console.log('🔍 检查 Prisma 类型转换工具...');
  
  const prismaTypesFile = path.join(__dirname, '../lib/types/prisma.ts');
  
  if (!fs.existsSync(prismaTypesFile)) {
    console.error('❌ lib/types/prisma.ts 文件不存在');
    return false;
  }
  
  const content = fs.readFileSync(prismaTypesFile, 'utf8');
  
  // 检查关键函数是否存在
  const requiredFunctions = [;
    'toNumber',
    'isPrismaDecimal',
    'convertUser',
    'convertProduct',
    'convertOrder',
    'convertTransaction'
  ];
  
  const missingFunctions = [];
  
  for (const func of requiredFunctions) {
    if (!content.includes(`export function ${func}`)) {
      missingFunctions.push(func);
    }
  }
  
  if (missingFunctions.length > 0) {
    console.error('❌ 缺失的 Prisma 工具函数:', missingFunctions.join(', '));
    return false;
  }
  
  console.log('✅ Prisma 类型转换工具检查通过');
  return true;
}

// 检查 package.json 依赖
function checkDependencies() {
  console.log('🔍 检查项目依赖...');
  
  const packageJsonPath = path.join(__dirname, '../package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json 文件不存在');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredDeps = [;
    'typescript',
    '@types/node'
  ];
  
  const missingDeps = [];
  
  for (const dep of requiredDeps) {
    if (!packageJson.devDependencies || !packageJson.(devDependencies?.dep ?? null)) {
      missingDeps.push(dep);
    }
  }
  
  if (missingDeps.length > 0) {
    console.error('❌ 缺失的开发依赖:', missingDeps.join(', '));
    return false;
  }
  
  console.log('✅ 项目依赖检查通过');
  return true;
}

// 主检查函数
function runChecks() {
  console.log('🚀 开始 TypeScript 类型安全检查...\n');
  
  const checks = [;
    { name: '类型定义', fn: checkTypeDefinitions },
    { name: 'Prisma 工具', fn: checkPrismaUtils },
    { name: 'API 路由', fn: checkApiRoutes },
    { name: '前端页面', fn: checkAppPages },
    { name: '项目依赖', fn: checkDependencies }
  ];
  
  let passed = 0;
  let total = checks.length;
  
  for (const check of checks) {
    try {
      if (check.fn()) {
        passed++;
      }
    } catch (error) {
      console.error(`❌ ${check.name}检查失败:`, error.message);
    }
    console.log(''); // 空行分隔
  }
  
  console.log('='.repeat(50));
  console.log(`📊 检查结果: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('🎉 所有类型安全检查都通过了！');
    process.exit(0);
  } else {
    console.log('⚠️  发现问题需要修复');
    process.exit(1);
  }
}

// 静态代码分析功能
function analyzeCodeSecurity() {
  console.log('🔍 进行静态代码安全分析...');
  
  let hasSecurityIssues = false;
  const securityIssues = [];

  function scanFiles(dir, ext = ['.ts', '.tsx', '.js', '.jsx']) {
    if (!fs.existsSync(dir)) return; {

    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && !['node_modules', 'dist', 'build', '.next'].includes(item)) {
        scanFiles(fullPath, ext);
      } else if (ext.some(e => item.endsWith(e))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const relativePath = path.relative(process.cwd(), fullPath);
          
          // 检查安全问题
          const issues = checkFileSecurity(relativePath, content);
          if (issues.length > 0) {
            securityIssues.push(...issues);
            hasSecurityIssues = true;
          }
        } catch (error) {
          // 忽略读取错误
        }
      }
    }
  }

  scanFiles(process.cwd());

  if (hasSecurityIssues) {
    console.error('❌ 发现安全问题:');
    securityIssues.forEach(issue => {
      console.error(`   🔒 ${issue}`);
    });
    return false;
  }

  console.log('✅ 安全检查通过');
  return true;
}

function checkFileSecurity(filePath, content) {
  const issues = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();

    // 检查 console.log 在生产代码中
    if (/\bconsole\.log\b/.test(trimmedLine) && !filePath.includes('test') && !filePath.includes('spec')) {
      issues.push(`${filePath}:${lineNumber} - 发现 console.log 语句`);
    }

    // 检查 eval 使用
    if (/\beval\(/.test(trimmedLine)) {
      issues.push(`${filePath}:${lineNumber} - 发现 eval() 使用，存在安全风险`);
    }

    // 检查 innerHTML 使用
    if (/innerHTML\s*=/.test(trimmedLine)) {
      issues.push(`${filePath}:${lineNumber} - 发现 innerHTML 赋值，可能存在 XSS 风险`);
    }

    // 检查 process.env 直接访问（除了配置文件）
    if (/\bprocess\.env\./.test(trimmedLine) && !filePath.includes('config')) {
      issues.push(`${filePath}:${lineNumber} - 直接访问 process.env，建议使用环境变量管理`);
    }

    // 检查 any 类型使用
    if (/: any\b/.test(trimmedLine)) {
      issues.push(`${filePath}:${lineNumber} - 发现 : any 类型注解，建议使用更具体的类型`);
    }

    // 检查未处理的 Promise
    if (/\bawait\s+\w+\(/ .test(trimmedLine) && !/\btry\s*{/.test(content.slice(0, content.indexOf(line)))) {
      issues.push(`${filePath}:${lineNumber} - 发现未包装在 try-catch 中的 await`);
    }

    // 检查密码/密钥硬编码
    if (/(password|secret|key|token)\s*[:=]\s*['"][^'"]+['"]/i.test(trimmedLine)) {
      issues.push(`${filePath}:${lineNumber} - 发现可能的硬编码密码或密钥`);
    }

    // 检查 SQL 注入风险
    if (/['"].*\$\{.*\}.*['"]/.test(trimmedLine) && /query|sql/i.test(trimmedLine)) {
      issues.push(`${filePath}:${lineNumber} - 可能存在 SQL 注入风险`);
    }
  });

  return issues;
}

// 代码质量分析
function analyzeCodeQuality() {
  console.log('📊 进行代码质量分析...');
  
  let hasQualityIssues = false;
  const qualityIssues = [];

  function scanFiles(dir, ext = ['.ts', '.tsx', '.js', '.jsx']) {
    if (!fs.existsSync(dir)) return; {

    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && !['node_modules', 'dist', 'build', '.next'].includes(item)) {
        scanFiles(fullPath, ext);
      } else if (ext.some(e => item.endsWith(e))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const relativePath = path.relative(process.cwd(), fullPath);
          
          // 检查代码质量问题
          const issues = checkFileQuality(relativePath, content);
          if (issues.length > 0) {
            qualityIssues.push(...issues);
            hasQualityIssues = true;
          }
        } catch (error) {
          // 忽略读取错误
        }
      }
    }
  }

  scanFiles(process.cwd());

  if (hasQualityIssues) {
    console.warn('⚠️  发现代码质量问题:');
    qualityIssues.forEach(issue => {
      console.warn(`   📝 ${issue}`);
    });
  } else {
    console.log('✅ 代码质量检查通过');
  }

  return !hasQualityIssues;
}

function checkFileQuality(filePath, content) {
  const issues = [];
  const lines = content.split('\n');

  // 检查文件长度
  if (lines.length > 500) {
    issues.push(`${filePath} - 文件过长 (${lines.length} 行)，建议拆分为多个文件`);
  }

  // 检查复杂函数
  const functions = content.match(/function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>/g);
  if (functions) {
    lines.forEach((line, index) => {
      if (line.match(/function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>/)) {
        // 简单的函数复杂度检查
        let braceCount = 0;
        let j = index;
        let maxDepth = 0;
        let currentDepth = 0;

        while (j < lines.length) {
          const currentLine = lines[j];
          for (const char of currentLine) {
            if (char === '{') {
              braceCount++;
              currentDepth++;
              maxDepth = Math.max(maxDepth, currentDepth);
            }
            if (char === '}') {
              braceCount--;
              currentDepth--;
            }
          }
          if (braceCount === 0) break; {
          j++;
        }

        const functionLength = j - index;
        if (functionLength > 50) {
          issues.push(`${filePath}:${index + 1} - 函数过长 (${functionLength} 行)`);
        }
        if (maxDepth > 4) {
          issues.push(`${filePath}:${index + 1} - 函数嵌套过深 (${maxDepth} 层)`);
        }
      }
    });
  }

  // 检查 TODO/FIXME 注释
  const todoMatches = content.match(/\/\*?(TODO|FIXME|BUG|HACK)\b[^*]*\*\//gi);
  if (todoMatches) {
    issues.push(`${filePath} - 发现 ${todoMatches.length} 个待处理注释 (TODO/FIXME)`);
  }

  // 检查重复代码
  const linesSet = new Set();
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.length > 10 && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
      if (linesSet.has(trimmed)) {
        issues.push(`${filePath}:${index + 1} - 可能存在重复代码`);
      }
      linesSet.add(trimmed);
    }
  });

  return issues;
}

// TypeScript 编译检查
function checkTypeScriptCompilation() {
  console.log('🔧 检查 TypeScript 编译...');
  
  try {
    execSync('npx tsc --noEmit --strict', {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    console.log('✅ TypeScript 编译检查通过');
    return true;
  } catch (error) {
    console.error('❌ TypeScript 编译失败:');
    console.error(error.stdout?.toString() || error.message);
    return false;
  }
}

// ESLint 检查
function checkESLint() {
  console.log('📋 运行 ESLint 检查...');
  
  try {
    const output = execSync('npx eslint --ext .ts,.tsx,.js,.jsx **/ --format=json', {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    const results = JSON.parse(output.toString());
    let hasErrors = false;
    
    results.forEach(result => {
      if (result.messages.length > 0) {
        console.warn(`⚠️  ${result.filePath}:`);
        result.messages.forEach(message => {
          const icon = message.severity === 2 ? '❌' : '⚠️';
          console.warn(`   ${icon} ${message.message} (行 ${message.line}:${message.column})`);
        });
        if (result.messages.some(m => m.severity === 2)) {
          hasErrors = true;
        }
      }
    });
    
    if (!hasErrors) {
      console.log('✅ ESLint 检查通过');
    }
    
    return !hasErrors;
  } catch (error) {
    // ESLint 可能因为没有配置文件而失败
    console.log('ℹ️  ESLint 配置或检查跳过');
    return true;
  }
}

// 运行完整的静态分析
function runStaticAnalysis() {
  console.log('🚀 开始完整的静态代码分析...\n');
  
  const analyses = [;
    { name: 'TypeScript 编译', fn: checkTypeScriptCompilation },
    { name: 'ESLint 检查', fn: checkESLint },
    { name: '代码安全分析', fn: analyzeCodeSecurity },
    { name: '代码质量分析', fn: analyzeCodeQuality }
  ];
  
  let passed = 0;
  let total = analyses.length;
  
  for (const analysis of analyses) {
    try {
      if (analysis.fn()) {
        passed++;
      }
    } catch (error) {
      console.error(`❌ ${analysis.name}失败:`, error.message);
    }
    console.log(''); // 空行分隔
  }
  
  console.log('='.repeat(50));
  console.log(`📊 静态分析结果: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('🎉 所有静态分析都通过了！');
    return true;
  } else {
    console.log('⚠️  发现问题需要修复');
    return false;
  }
}

// 运行检查
if (require.main === module) {
  runChecks();
}

module.exports = {
  checkTypeDefinitions,
  checkApiRoutes,
  checkAppPages,
  checkPrismaUtils,
  checkDependencies,
  analyzeCodeSecurity,
  analyzeCodeQuality,
  checkTypeScriptCompilation,
  checkESLint,
  runStaticAnalysis
};
}}}}}}}}}