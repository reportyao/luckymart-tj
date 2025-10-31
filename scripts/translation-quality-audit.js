#!/usr/bin/env node

/**
 * LuckyMartTJ 翻译质量审计工具
 * 评估翻译质量和本土化程度
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];
const NAMESPACES = ['common', 'auth', 'lottery', 'wallet', 'referral', 'task', 'error', 'admin'];
const BASE_DIR = path.join(__dirname, '../src/locales');

// 文本质量评估
class TranslationQualityAuditor {
  constructor() {
    this.issues = [];
    this.qualityScore = {
      'zh-CN': 0,
      'en-US': 0,
      'ru-RU': 0,
      'tg-TJ': 0
    };
    this.totalChecks = {
      'zh-CN': 0,
      'en-US': 0,
      'ru-RU': 0,
      'tg-TJ': 0
    };
  }

  // 检查占位符和翻译标记
  checkTranslationCompleteness(text, lang, namespace, key) {
    this.totalChecks[lang]++;
    
    // 检查是否包含占位符或翻译标记
    const placeholders = ['{{', '${', '[TODO]', 'TODO:', 'FIXME:', '待翻译', '待完善'];
    const foundPlaceholder = placeholders.find(ph => text.includes(ph));
    
    if (foundPlaceholder) {
      this.issues.push({
        type: 'PLACEHOLDER',
        severity: 'ERROR',
        lang,
        namespace,
        key,
        text: text.substring(0, 50),
        message: `包含未翻译的占位符: ${foundPlaceholder}`
      });
      return false;
    }
    
    return true;
  }

  // 检查文本长度
  checkTextLength(text, lang, namespace, key) {
    this.totalChecks[lang]++;
    
    // 设置合理的最大长度（考虑移动端显示）
    const maxLength = lang === 'zh-CN' ? 100 : 200;
    
    if (text.length > maxLength) {
      this.issues.push({
        type: 'LENGTH',
        severity: 'WARNING',
        lang,
        namespace,
        key,
        text: text.substring(0, 50) + '...',
        message: `文本过长: ${text.length} 字符 (建议最大${maxLength})`
      });
      return false;
    }
    return true;
  }

  // 检查空白文本
  checkEmptyText(text, lang, namespace, key) {
    this.totalChecks[lang]++;
    
    if (!text || text.trim() === '') {
      this.issues.push({
        type: 'EMPTY',
        severity: 'ERROR',
        lang,
        namespace,
        key,
        text: '',
        message: '翻译内容为空'
      });
      return false;
    }
    return true;
  }

  // 检查HTML标签平衡
  checkHTMLTags(text, lang, namespace, key) {
    this.totalChecks[lang]++;
    
    const openTags = (text.match(/<[^\/][^>]*>/g) || []).length;
    const closeTags = (text.match(/<\/[^>]+>/g) || []).length;
    
    if (openTags !== closeTags) {
      this.issues.push({
        type: 'HTML_TAGS',
        severity: 'ERROR',
        lang,
        namespace,
        key,
        text: text.substring(0, 50),
        message: `HTML标签不平衡: ${openTags} 个开标签, ${closeTags} 个闭标签`
      });
      return false;
    }
    return true;
  }

  // 检查塔吉克语特殊字符
  checkTajikCharacters(text, lang, namespace, key) {
    if (lang !== 'tg-TJ') {
      return true;
    }

    this.totalChecks[lang]++;
    
    // 塔吉克语特有字符
    const tajikChars = ['ӣ', 'ӯ', 'ҳ', 'қ', 'ғ', 'Ӣ', 'Ӯ', 'Ҳ', 'Қ', 'Ғ'];
    const hasTajikChars = tajikChars.some(char => text.includes(char));
    
    // 如果文本中有西里尔字母但没有塔吉克语特殊字符，可能需要检查
    const hasCyrillic = /[а-яА-Я]/.test(text);
    
    if (hasCyrillic && !hasTajikChars && text.length > 10) {
      this.issues.push({
        type: 'TAJIK_CHARS',
        severity: 'INFO',
        lang,
        namespace,
        key,
        text: text.substring(0, 50),
        message: '可能缺少塔吉克语特殊字符（ӣ, ӯ, ҳ, қ, ғ）'
      });
      return false;
    }
    
    return true;
  }

  // 递归检查所有文本
  checkObject(obj, lang, namespace, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.checkObject(value, lang, namespace, fullKey);
      } else if (typeof value === 'string') {
        this.checkEmptyText(value, lang, namespace, fullKey);
        this.checkTextLength(value, lang, namespace, fullKey);
        this.checkTranslationCompleteness(value, lang, namespace, fullKey);
        this.checkHTMLTags(value, lang, namespace, fullKey);
        this.checkTajikCharacters(value, lang, namespace, fullKey);
      }
    }
  }

  // 运行质量审计
  runQualityAudit() {
    console.log('--- 开始翻译质量审计 ---\n');

    LANGUAGES.forEach(lang => {
      console.log(`[语言: ${lang}]`);
      
      NAMESPACES.forEach(namespace => {
        const filePath = path.join(BASE_DIR, lang, `${namespace}.json`);
        
        try {
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const translations = JSON.parse(content);
            
            console.log(`  命名空间: ${namespace} - 检查中...`);
            this.checkObject(translations, lang, namespace);
          } else {
            console.log(`  命名空间: ${namespace} - 文件不存在`);
          }
        } catch (error) {
          console.log(`  命名空间: ${namespace} - 读取失败: ${error.message}`);
          this.issues.push({
            type: 'FILE_ERROR',
            severity: 'ERROR',
            lang,
            namespace,
            key: namespace,
            message: `无法读取文件: ${error.message}`
          });
        }
      });
      console.log('');
    });
  }

  // 计算质量分数
  calculateQualityScore() {
    console.log('\n--- 计算质量分数 ---\n');
    
    LANGUAGES.forEach(lang => {
      const langIssues = this.issues.filter(issue => issue.lang === lang);
      const errorCount = langIssues.filter(i => i.severity === 'ERROR').length;
      const warningCount = langIssues.filter(i => i.severity === 'WARNING').length;
      const infoCount = langIssues.filter(i => i.severity === 'INFO').length;
      
      const passedChecks = this.totalChecks[lang] - errorCount - warningCount * 0.5 - infoCount * 0.1;
      const score = this.totalChecks[lang] > 0 
        ? Math.max(0, Math.round((passedChecks / this.totalChecks[lang]) * 100))
        : 0;
      
      this.qualityScore[lang] = score;
      
      const status = score >= 95 ? '优秀' : score >= 85 ? '良好' : score >= 70 ? '及格' : '需改进';
      console.log(`${lang}: ${score}% - ${status} (${passedChecks.toFixed(0)}/${this.totalChecks[lang]})`);
      console.log(`  错误: ${errorCount}, 警告: ${warningCount}, 提示: ${infoCount}`);
    });
  }

  // 生成质量报告
  generateQualityReport() {
    console.log('\n\n--- 翻译质量审计报告 ---\n');
    console.log('='.repeat(60));

    // 质量分数
    console.log('\n[翻译质量分数]');
    Object.entries(this.qualityScore).forEach(([lang, score]) => {
      const status = score >= 95 ? '优秀' : score >= 85 ? '良好' : score >= 70 ? '及格' : '需改进';
      console.log(`  ${lang}: ${score}% - ${status}`);
    });

    // 问题分类统计
    const issueTypes = {};
    const issueSeverities = { ERROR: 0, WARNING: 0, INFO: 0 };
    
    this.issues.forEach(issue => {
      issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
      issueSeverities[issue.severity]++;
    });

    console.log('\n[问题分类统计]');
    Object.entries(issueTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} 项`);
    });

    console.log('\n[问题严重性统计]');
    Object.entries(issueSeverities).forEach(([severity, count]) => {
      console.log(`  ${severity}: ${count} 项`);
    });

    // 显示部分具体问题
    if (this.issues.length > 0) {
      console.log('\n[部分问题详情]');
      const errorIssues = this.issues.filter(i => i.severity === 'ERROR').slice(0, 5);
      errorIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. [${issue.severity}] ${issue.lang}.${issue.namespace}.${issue.key}`);
        console.log(`     ${issue.message}`);
        if (issue.text) {
          console.log(`     文本: "${issue.text}"`);
        }
      });
      
      if (this.issues.length > 5) {
        console.log(`  ... 还有 ${this.issues.length - 5} 个问题`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('质量审计完成！');
    console.log(`总问题数: ${this.issues.length}`);
  }

  // 运行完整审计
  run() {
    try {
      this.runQualityAudit();
      this.calculateQualityScore();
      this.generateQualityReport();
      
      // 设置退出码
      const errorCount = this.issues.filter(i => i.severity === 'ERROR').length;
      if (errorCount > 10) {
        console.log('\n发现较多严重问题，建议修复后继续。退出码: 1');
        process.exit(1);
      } else {
        console.log('\n质量审计通过！');
        process.exit(0);
      }
    } catch (error) {
      console.error('审计过程中发生错误:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// 运行审计
if (require.main === module) {
  const auditor = new TranslationQualityAuditor();
  auditor.run();
}

module.exports = TranslationQualityAuditor;
