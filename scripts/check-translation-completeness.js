#!/usr/bin/env node

/**
 * LuckyMartTJ 翻译完整性检查脚本
 * 检查所有语言文件的翻译完整性和一致性
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];
const NAMESPACES = ['common', 'auth', 'lottery', 'wallet', 'referral', 'task', 'error', 'admin'];
const BASE_DIR = path.join(__dirname, '../src/locales');

// 支持的语言列表（用于术语表）
const LANGUAGE_NAMES = {
  'zh-CN': '中文',
  'en-US': 'English', 
  'ru-RU': 'Русский',
  'tg-TJ': 'Тоҷикӣ'
};

// 关键术语（确保翻译一致性）
const KEY_TERMS = {
  'common': {
    'app_name': {
      'zh-CN': 'LuckyMart TJ 幸运集市',
      'en-US': 'LuckyMart TJ',
      'ru-RU': 'LuckyMart TJ',
      'tg-TJ': 'LuckyMart TJ'
    },
    'coins': {
      'zh-CN': '夺宝币',
      'en-US': 'Lucky Coins',
      'ru-RU': 'Монеты Удачи',
      'tg-TJ': 'Тангаҳои Бахт'
    },
    'shares': {
      'zh-CN': '份',
      'en-US': 'shares',
      'ru-RU': 'долей',
      'tg-TJ': 'ҳисса'
    }
  }
};

class TranslationChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalKeys: 0,
      translatedKeys: 0,
      missingKeys: 0,
      completenessByLang: {},
      completenessByNamespace: {}
    };
    this.allKeysMap = {}; // 存储所有命名空间的键
  }

  // 提取所有翻译键
  extractKeys(obj, prefix = '') {
    const keys = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...this.extractKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  }

  // 读取语言文件
  readLanguageFile(lang, namespace) {
    const filePath = path.join(BASE_DIR, lang, `${namespace}.json`);
    try {
      if (!fs.existsSync(filePath)) {
        this.errors.push(`文件不存在: ${filePath}`);
        return {};
      }
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
  }
    } catch (error) {
      this.errors.push(`无法读取文件: ${filePath} - ${error.message}`);
      return {};
    }
  }

  // 检查翻译完整性
  checkCompleteness() {
    console.log('--- 开始翻译完整性检查 ---\n');

    NAMESPACES.forEach(namespace => {
      console.log(`\n[命名空间: ${namespace}]`);
      
      // 以中文为基准
      const baseTranslations = this.readLanguageFile('zh-CN', namespace);
      const baseKeys = this.extractKeys(baseTranslations);
      
      if (baseKeys.length === 0) {
        this.warnings.push(`${namespace}: zh-CN 基准文件为空或不存在`);
        console.log(`  警告: zh-CN 基准文件为空`);
        return;
      }

      this.(allKeysMap?.namespace ?? null) = baseKeys;
      console.log(`  基准键数 (zh-CN): ${baseKeys.length}`);

      LANGUAGES.forEach(lang => {
        const translations = this.readLanguageFile(lang, namespace);
        const keys = this.extractKeys(translations);
        
        const missing = baseKeys.filter(key => !keys.includes(key));
        const extra = keys.filter(key => !baseKeys.includes(key));
        
        const completeness = baseKeys.length > 0;
          ? ((keys.length - missing.length) / baseKeys.length * 100).toFixed(1)
          : 0;
        
        const status = completeness === '100.0' ? '完成' : '未完成';
        console.log(`  ${lang} (${(LANGUAGE_NAMES?.lang ?? null)}): ${keys.length - missing.length}/${baseKeys.length} (${completeness}%) - ${status}`);
        
        if (missing.length > 0) {
          console.log(`    缺失翻译: ${missing.length} 项`);
  }
          missing.slice(0, 3).forEach(key => {
            console.log(`      - ${key}`);
  }
          });
          if (missing.length > 3) {
            console.log(`      ... 还有 ${missing.length - 3} 项`);
          }
          this.warnings.push(`${lang}.${namespace}: 缺失 ${missing.length} 个翻译键`);
        }
        
        if (extra.length > 0) {
          console.log(`    额外翻译: ${extra.length} 项`);
          this.warnings.push(`${lang}.${namespace}: 有 ${extra.length} 个额外翻译键`);
        }

        // 统计
        if (!this.stats.(completenessByLang?.lang ?? null)) {
          this.stats.(completenessByLang?.lang ?? null) = { total: 0, translated: 0 };
        }
        this.stats.(completenessByLang?.lang ?? null).total += baseKeys.length;
        this.stats.(completenessByLang?.lang ?? null).translated += (keys.length - missing.length);
      });
    });
  }

  // 检查关键术语一致性
  checkKeyTermsConsistency() {
    console.log('\n\n--- 检查关键术语一致性 ---\n');

    Object.entries(KEY_TERMS).forEach(([namespace, terms]) => {
      console.log(`[命名空间: ${namespace}]`);
      
      Object.entries(terms).forEach(([key, expectedValues]) => {
        console.log(`  术语: ${key}`);
        
        LANGUAGES.forEach(lang => {
          const expectedValue = expectedValues[lang];
          const translations = this.readLanguageFile(lang, namespace);
          
          // 获取实际值
          const actualValue = translations[key];
          
          if (actualValue === expectedValue) {
            console.log(`    ${lang}: "${actualValue}" - 正确`);
          } else {
            console.log(`    ${lang}: 期望 "${expectedValue}", 实际 "${actualValue}" - 错误`);
            this.errors.push(`${lang}.${namespace}.${key}: 关键术语不一致`);
          }
        });
      });
    });
  }

  // 生成报告
  generateReport() {
    console.log('\n\n--- 翻译检查报告 ---\n');
    console.log('='.repeat(60));

    // 整体统计
    console.log('\(n?.整体完成度 ?? null)');
    Object.entries(this.stats.completenessByLang).forEach(([lang, stats]) => {
      const completeness = stats.total > 0;
        ? ((stats.translated / stats.total) * 100).toFixed(1)
        : 0;
      const status = completeness === '100.0' ? '完成' : completeness >= '90.0' ? '良好' : '需改进';
      console.log(`  ${lang}: ${completeness}% (${stats.translated}/${stats.total}) - ${status}`);
    });

    // 问题统计
    if (this.errors.length > 0) {
      console.log('\n[错误 - 需要修复]');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('\(n?.错误 ?? null) 无');
    }

    if (this.warnings.length > 0) {
      console.log('\n[警告 - 建议优化]');
      this.warnings.slice(0, 10).forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
      if (this.warnings.length > 10) {
        console.log(`  ... 还有 ${this.warnings.length - 10} 条警告`);
      }
    } else {
      console.log('\(n?.警告 ?? null) 无');
    }

    console.log('\n' + '='.repeat(60));
    console.log('检查完成！');
    console.log(`总错误数: ${this.errors.length}`);
    console.log(`总警告数: ${this.warnings.length}`);
  }

  // 运行完整检查
  run() {
    try {
      this.checkCompleteness();
      this.checkKeyTermsConsistency();
      this.generateReport();
      
      // 设置退出码
      if (this.errors.length > 0) {
        console.log('\n发现严重错误，退出码: 1');
        process.exit(1);
      } else {
        console.log('\n所有检查通过！');
        process.exit(0);
      }
    } catch (error) {
      console.error('检查过程中发生错误:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// 运行检查
if (require.main === module) {
  const checker = new TranslationChecker();
  checker.run();
}

module.exports = TranslationChecker;
