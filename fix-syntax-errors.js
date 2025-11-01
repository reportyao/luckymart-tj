#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 要修复的目录
const directories = [;
  'app/api',
  'components',
  'lib',
  'types',
  'hooks',
  'utils',
  'constants',
  'contexts',
  'config'
];

// 常见的语法错误模式
const errorPatterns = [;
  {
    // 修复箭头函数参数类型定义错误：(param: Type: any) -> (param: Type)
    pattern: /(\(\s*\w+:\s*\w+)\s*:\s*any\s*\)/g,
    replacement: '$1)',
    description: '修复箭头函数参数类型注解错误'
  },
  {
    // 修复reduce等函数的参数类型定义错误
    pattern: /(\w+\s*:\s*\w+)\s*:\s*any\s*(\)|,)/g,
    replacement: '$1$2',
    description: '修复函数参数类型注解错误'
  },
  {
    // 修复.map((param: Type) : any) 模式
    pattern: /(\(\s*\w+:\s*\w+\))\s*:\s*any/g,
    replacement: '$1',
    description: '修复.map箭头函数参数注解错误'
  },
  {
    // 修复.forEach(((param: Type) : any) 模式
    pattern: /(\(\s*\(\s*\w+:\s*\w+\)\s*:\s*any\s*\))/g,
    replacement: '($1)',
    description: '修复.forEach箭头函数参数注解错误'
  }
];

// 检查文件是否存在语法错误
function hasSyntaxErrors(content) {
  return /:\s*\w+\s*:\s*any/.test(content);
}

// 修复文件中的语法错误
function fixFileSyntax(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let fixed = false;
    let changes = [];

    errorPatterns.forEach((patternInfo, index) => {
      const before = content;
      content = content.replace(patternInfo.pattern, patternInfo.replacement);
      
      if (content !== before) {
        fixed = true;
        changes.push(patternInfo.description);
      }
    });

    if (fixed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 修复文件: ${filePath}`);
      changes.forEach(change => console.log(`   - ${change}`));
      return true;
    }

    return false;
  }
  } catch (error) {
    console.error(`❌ 修复文件失败 ${filePath}:`, error.message);
    return false;
  }
}

// 遍历目录并修复文件
function fixDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  let fixedCount = 0;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      fixedCount += fixDirectory(fullPath);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      if (hasSyntaxErrors(fs.readFileSync(fullPath, 'utf8'))) {
        if (fixFileSyntax(fullPath)) {
          fixedCount++;
        }
      }
    }
  });

  return fixedCount;
}

// 主函数
function main() {
  console.log('🔧 开始修复TypeScript语法错误...\n');

  let totalFixed = 0;

  directories.forEach(dir => {
    console.log(`检查目录: ${dir}`);
    const fixedCount = fixDirectory(dir);
    if (fixedCount > 0) {
      totalFixed += fixedCount;
      console.log(`  修复了 ${fixedCount} 个文件\n`);
    } else {
      console.log('  没有发现需要修复的文件\n');
    }
  });

  console.log(`🎉 修复完成！总共修复了 $ 个文件`);
}

// 运行
main();