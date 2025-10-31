#!/usr/bin/env node

// 塔吉克语翻译修复验证脚本

const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证塔吉克语翻译修复...\n');

// 检查的文件路径
const files = [
  'src/locales/tg-TJ/auth.json',
  'src/locales/tg-TJ/wallet.json', 
  'src/locales/tg-TJ/task.json'
];

let allFixed = true;
let totalKeys = 0;
let chineseKeys = 0;

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    allFixed = false;
    return;
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const translations = JSON.parse(content);
    
    console.log(`📁 检查文件: ${filePath}`);
    
    let fileKeys = 0;
    let fileChineseKeys = 0;
    
    Object.entries(translations).forEach(([key, value]) => {
      fileKeys++;
      totalKeys++;
      
      // 检查是否包含中文字符
      if (/[\u4e00-\u9fff]/.test(value)) {
        fileChineseKeys++;
        chineseKeys++;
        console.log(`  ❌ 仍包含中文: ${key} = ${value}`);
      }
    });
    
    const completion = ((fileKeys - fileChineseKeys) / fileKeys * 100).toFixed(1);
    console.log(`  ✅ 完成度: ${completion}% (${fileKeys - fileChineseKeys}/${fileKeys})`);
    
    if (fileChineseKeys > 0) {
      allFixed = false;
    }
    
    console.log('');
    
  } catch (error) {
    console.log(`❌ 文件解析错误: ${filePath}`);
    console.log(`   错误: ${error.message}\n`);
    allFixed = false;
  }
});

// 总结报告
console.log('📊 修复验证总结:');
console.log(`总键值数量: ${totalKeys}`);
console.log(`仍含中文键值: ${chineseKeys}`);
console.log(`整体完成度: ${((totalKeys - chineseKeys) / totalKeys * 100).toFixed(1)}%`);

if (allFixed) {
  console.log('\n🎉 塔吉克语翻译修复验证通过！');
  console.log('✅ 所有关键翻译已成功本地化');
  process.exit(0);
} else {
  console.log('\n❌ 验证失败，仍有中文内容需要修复');
  process.exit(1);
}
