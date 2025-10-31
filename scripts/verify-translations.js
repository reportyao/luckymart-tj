#!/usr/bin/env node

/**
 * 快速验证翻译文件的完整性
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const LANGUAGES = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];
const NAMESPACES = ['common', 'auth', 'lottery', 'wallet', 'referral', 'task', 'error', 'admin'];

function countKeys(obj, prefix = '') {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      count += countKeys(obj[key], `${prefix}${key}.`);
    } else {
      count++;
    }
  }
  return count;
}

function verifyTranslations() {
  console.log('翻译文件验证报告');
  console.log('='.repeat(60));
  console.log('');

  const stats = {};

  LANGUAGES.forEach(lang => {
    stats[lang] = { total: 0, namespaces: {} };
    
    console.log(`[${lang}]`);
    NAMESPACES.forEach(namespace => {
      const filePath = path.join(LOCALES_DIR, lang, `${namespace}.json`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`  ${namespace}: 文件不存在`);
        stats[lang].namespaces[namespace] = 0;
        return;
      }
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        const keyCount = countKeys(data);
        
        console.log(`  ${namespace}: ${keyCount} 个键`);
        stats[lang].namespaces[namespace] = keyCount;
        stats[lang].total += keyCount;
      } catch (error) {
        console.log(`  ${namespace}: 解析错误 - ${error.message}`);
        stats[lang].namespaces[namespace] = 0;
      }
    });
    console.log(`  总计: ${stats[lang].total} 个键`);
    console.log('');
  });

  console.log('='.repeat(60));
  console.log('语言对比:');
  LANGUAGES.forEach(lang => {
    const percentage = ((stats[lang].total / stats['zh-CN'].total) * 100).toFixed(1);
    console.log(`  ${lang}: ${stats[lang].total} 个键 (${percentage}%)`);
  });
  console.log('');
  console.log('验证完成');
}

if (require.main === module) {
  verifyTranslations();
}

module.exports = verifyTranslations;
