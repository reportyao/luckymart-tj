#!/usr/bin/env node

/**
 * TypeScript 类型安全检查脚本
 * 用于验证类型定义的一致性和安全性
 */

const fs = require('fs');
const path = require('path');

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
  const requiredTypes = [
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
  const guards = [
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
  const converters = [
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
  return true;
}

// 检查前端页面文件
function checkAppPages() {
  console.log('🔍 检查前端页面文件...');
  
  let hasErrors = false;
  const pageFiles = [];
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
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
  const requiredFunctions = [
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
  
  const requiredDeps = [
    'typescript',
    '@types/node'
  ];
  
  const missingDeps = [];
  
  for (const dep of requiredDeps) {
    if (!packageJson.devDependencies || !packageJson.devDependencies[dep]) {
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
  
  const checks = [
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

// 运行检查
if (require.main === module) {
  runChecks();
}

module.exports = {
  checkTypeDefinitions,
  checkApiRoutes,
  checkAppPages,
  checkPrismaUtils,
  checkDependencies
};