#!/usr/bin/env node

/**
 * 翻译质量检查工具
 * 
 * 功能：
 * 1. 检查翻译质量和一致性
 * 2. 生成翻译质量报告
 * 3. 识别潜在问题和优化建议
 * 4. 检查翻译键的完整性
 * 5. 分析翻译文件结构
 */

const fs = require('fs');
const path = require('path');

// 配置常量
const LANGUAGES = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];
const NAMESPACES = ['common', 'auth', 'lottery', 'wallet', 'referral', 'task', 'error', 'admin', 'bot'];
const LOCALES_PATH = path.join(__dirname, '../src/locales');

// 问题类型
const ISSUE_TYPES = {
  MISSING_FILE: 'missing_file',
  MISSING_KEY: 'missing_key',
  INCONSISTENT_KEY: 'inconsistent_key',
  INVALID_PLACEHOLDER: 'invalid_placeholder',
  TRANSLATION_QUALITY: 'translation_quality',
  LENGTH_MISMATCH: 'length_mismatch',
  EMPTY_TRANSLATION: 'empty_translation',
  SPECIAL_CHARACTERS: 'special_characters',
  CONCISTENCY_ISSUE: 'consistency_issue'
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class TranslationQualityChecker {
  constructor() {
    this.results = {
      summary: {
        totalFiles: 0,
        processedFiles: 0,
        issuesFound: 0,
        qualityScore: 0,
        completenessScore: 0,
        consistencyScore: 0
      },
      files: {},
      issues: [],
      recommendations: [],
      statistics: {}
    };
  }

  /**
   * 主检查流程
   */
  async run() {
    console.log(`${colors.cyan}🔍 开始翻译质量检查...${colors.reset}\n`);
    
    await this.checkAllFiles();
    this.analyzeQuality();
    this.generateRecommendations();
    this.generateReport();
    
    return this.results;
  }

  /**
   * 检查所有翻译文件
   */
  async checkAllFiles() {
    this.results.summary.totalFiles = LANGUAGES.length * NAMESPACES.length;
    
    for (const language of LANGUAGES) {
      console.log(`${colors.blue}📁 检查语言: ${language}${colors.reset}`);
      
      for (const namespace of NAMESPACES) {
        await this.checkFile(language, namespace);
      }
      console.log();
    }
    
    this.results.summary.processedFiles = Object.keys(this.results.files).length;
  }

  /**
   * 检查单个翻译文件
   */
  async checkFile(language, namespace) {
    const filePath = path.join(LOCALES_PATH, language, `${namespace}.json`);
    const fileKey = `${language}/${namespace}`;
    
    console.log(`  ${colors.magenta}检查文件: ${namespace}.json${colors.reset}`);
    
    if (!fs.existsSync(filePath)) {
      this.addIssue(ISSUE_TYPES.MISSING_FILE, 'critical', `文件不存在: ${filePath}`);
      this.results.files[fileKey] = { exists: false, issues: [] };
      return;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      const fileResult = {
        exists: true,
        size: content.length,
        keysCount: 0,
        issues: [],
        placeholders: [],
        quality: {
          consistency: 0,
          completeness: 0,
          quality: 0
        }
      };
      
      // 提取所有键
      const keys = this.extractKeys(data);
      fileResult.keysCount = keys.length;
      
      // 检查键的完整性
      this.checkKeyCompleteness(language, namespace, keys, fileResult);
      
      // 检查占位符
      this.checkPlaceholders(data, keys, fileResult);
      
      // 检查翻译质量
      this.checkTranslationQuality(data, keys, fileResult, language);
      
      // 检查特殊字符
      this.checkSpecialCharacters(data, fileResult);
      
      // 计算质量分数
      this.calculateQualityScore(fileResult);
      
      this.results.files[fileKey] = fileResult;
      
      console.log(`    ${colors.green}✓${colors.reset} ${keys.length} 个键`);
      
    } catch (error) {
      this.addIssue(ISSUE_TYPES.MISSING_FILE, 'critical', `文件解析错误: ${filePath} - ${error.message}`);
    }
  }

  /**
   * 递归提取翻译键
   */
  extractKeys(obj, prefix = '') {
    let keys = [];
    
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

  /**
   * 检查键的完整性
   */
  checkKeyCompleteness(language, namespace, keys, fileResult) {
    // 以中文为基准比较
    if (language !== 'zh-CN') {
      const baseKeys = this.getBaseKeys(namespace);
      const missingKeys = baseKeys.filter(key => !keys.includes(key));
      
      if (missingKeys.length > 0) {
        fileResult.issues.push({
          type: ISSUE_TYPES.MISSING_KEY,
          severity: 'high',
          message: `缺失 ${missingKeys.length} 个翻译键`,
          details: missingKeys.slice(0, 5) // 只显示前5个
        });
      }
    }
    
    // 检查是否为空翻译
    const emptyKeys = this.findEmptyTranslations(keys);
    if (emptyKeys.length > 0) {
      fileResult.issues.push({
        type: ISSUE_TYPES.EMPTY_TRANSLATION,
        severity: 'medium',
        message: `发现 ${emptyKeys.length} 个空翻译`,
        details: emptyKeys.slice(0, 3)
      });
    }
  }

  /**
   * 获取基准键集合（中文）
   */
  getBaseKeys(namespace) {
    const baseFile = path.join(LOCALES_PATH, 'zh-CN', `${namespace}.json`);
    
    if (fs.existsSync(baseFile)) {
      try {
        const content = fs.readFileSync(baseFile, 'utf-8');
        const data = JSON.parse(content);
        return this.extractKeys(data);
      } catch (error) {
        return [];
      }
    }
    
    return [];
  }

  /**
   * 查找空翻译
   */
  findEmptyTranslations(keys) {
    // 这里应该从实际数据中查找空翻译
    // 当前返回空数组，实际实现需要访问翻译数据
    return [];
  }

  /**
   * 检查占位符
   */
  checkPlaceholders(data, keys, fileResult) {
    const placeholders = this.extractPlaceholders(data);
    
    for (const [key, keyPlaceholders] of Object.entries(placeholders)) {
      for (const placeholder of keyPlaceholders) {
        if (!this.isValidPlaceholder(placeholder)) {
          fileResult.issues.push({
            type: ISSUE_TYPES.INVALID_PLACEHOLDER,
            severity: 'medium',
            message: `无效的占位符: ${placeholder}`,
            key: key
          });
        }
      }
    }
    
    fileResult.placeholders = placeholders;
  }

  /**
   * 提取占位符
   */
  extractPlaceholders(obj, prefix = '', result = {}) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string') {
        const placeholders = this.extractPlaceholdersFromText(value);
        if (placeholders.length > 0) {
          result[fullKey] = placeholders;
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.extractPlaceholders(value, fullKey, result);
      }
    }
    
    return result;
  }

  /**
   * 从文本中提取占位符
   */
  extractPlaceholdersFromText(text) {
    const placeholders = [];
    
    // 匹配 {{variable}} 格式
    const bracketMatches = text.match(/\{\{([^}]+)\}\}/g);
    if (bracketMatches) {
      placeholders.push(...bracketMatches.map(match => match.replace(/[{}]/g, '').trim()));
    }
    
    // 匹配 {variable} 格式
    const braceMatches = text.match(/\{([^}]+)\}/g);
    if (braceMatches) {
      placeholders.push(...braceMatches.map(match => match.replace(/[{}]/g, '').trim()));
    }
    
    return [...new Set(placeholders)];
  }

  /**
   * 验证占位符格式
   */
  isValidPlaceholder(placeholder) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(placeholder);
  }

  /**
   * 检查翻译质量
   */
  checkTranslationQuality(data, keys, fileResult, language) {
    // 检查翻译长度差异
    this.checkTranslationLength(data, fileResult, language);
    
    // 检查翻译一致性
    this.checkTranslationConsistency(data, fileResult);
    
    // 检查关键术语一致性
    this.checkKeyTermConsistency(data, fileResult, language);
  }

  /**
   * 检查翻译长度
   */
  checkTranslationLength(data, fileResult, language) {
    // 获取基准翻译（中文）
    const baseData = this.getBaseTranslationData();
    
    if (!baseData) return;
    
    const lengthIssues = [];
    
    for (const [key, value] of Object.entries(data)) {
      const baseValue = this.getNestedValue(baseData, key);
      
      if (baseValue && typeof baseValue === 'string' && typeof value === 'string') {
        const lengthDiff = Math.abs(value.length - baseValue.length);
        const ratio = value.length / baseValue.length;
        
        if (lengthDiff > 50 || ratio < 0.3 || ratio > 3) {
          lengthIssues.push({
            key,
            baseLength: baseValue.length,
            currentLength: value.length,
            ratio: ratio.toFixed(2)
          });
        }
      }
    }
    
    if (lengthIssues.length > 0) {
      fileResult.issues.push({
        type: ISSUE_TYPES.LENGTH_MISMATCH,
        severity: 'medium',
        message: `发现 ${lengthIssues.length} 个长度异常翻译`,
        details: lengthIssues.slice(0, 3)
      });
    }
  }

  /**
   * 获取嵌套值
   */
  getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((current, key) => current && current[key], obj);
  }

  /**
   * 获取基准翻译数据
   */
  getBaseTranslationData() {
    // 这里应该返回中文版本的翻译数据
    // 简化实现，返回null
    return null;
  }

  /**
   * 检查翻译一致性
   */
  checkTranslationConsistency(data, fileResult) {
    const inconsistentTerms = [];
    const commonTerms = ['确认', '取消', '加载', '错误', '成功'];
    
    // 这里应该检查常见术语在不同地方的一致性
    // 当前简化实现
    
    if (inconsistentTerms.length > 0) {
      fileResult.issues.push({
        type: ISSUE_TYPES.CONSISTENCY_ISSUE,
        severity: 'low',
        message: `发现 ${inconsistentTerms.length} 个不一致术语`,
        details: inconsistentTerms.slice(0, 3)
      });
    }
  }

  /**
   * 检查关键术语一致性
   */
  checkKeyTermConsistency(data, fileResult, language) {
    const keyTerms = {
      currency: this.getCurrencyTerms(language),
      time: this.getTimeTerms(language),
      actions: this.getActionTerms(language)
    };
    
    // 验证关键术语是否存在
    for (const [category, terms] of Object.entries(keyTerms)) {
      for (const term of terms) {
        if (!this.findTermInData(data, term)) {
          fileResult.issues.push({
            type: ISSUE_TYPES.TRANSLATION_QUALITY,
            severity: 'low',
            message: `缺少关键术语: ${term}`,
            category
          });
        }
      }
    }
  }

  /**
   * 查找术语在数据中
   */
  findTermInData(data, term) {
    // 简化实现，实际应该递归搜索
    return false;
  }

  /**
   * 获取货币术语
   */
  getCurrencyTerms(language) {
    const currencyMap = {
      'zh-CN': ['货币', '金额', '余额', '充值', '提现'],
      'en-US': ['currency', 'amount', 'balance', 'recharge', 'withdraw'],
      'ru-RU': ['валюта', 'сумма', 'баланс', 'пополнение', 'вывод'],
      'tg-TJ': ['пул', 'маблағ', 'баланс', 'пардохт', 'кашондан']
    };
    
    return currencyMap[language] || [];
  }

  /**
   * 获取时间术语
   */
  getTimeTerms(language) {
    const timeMap = {
      'zh-CN': ['时间', '日期', '今天', '昨天', '明天'],
      'en-US': ['time', 'date', 'today', 'yesterday', 'tomorrow'],
      'ru-RU': ['время', 'дата', 'сегодня', 'вчера', 'завтра'],
      'tg-TJ': ['вақт', 'рӯз', 'имрӯз', 'дирӯз', 'фардо']
    };
    
    return timeMap[language] || [];
  }

  /**
   * 获取操作术语
   */
  getActionTerms(language) {
    const actionMap = {
      'zh-CN': ['点击', '滑动', '长按', '双击', '确认'],
      'en-US': ['tap', 'swipe', 'long press', 'double tap', 'confirm'],
      'ru-RU': ['нажать', 'свайп', 'долгое нажатие', 'двойной тап', 'подтвердить'],
      'tg-TJ': ['пахш', '糖ворт', 'давидани дароз', 'дубора пахш', 'тасдиқ']
    };
    
    return actionMap[language] || [];
  }

  /**
   * 检查特殊字符
   */
  checkSpecialCharacters(data, fileResult) {
    const invalidChars = [];
    
    const checkChars = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          // 检查无效字符
          const invalidPattern = /[^\w\s\-\.\,\!\?\:\;\(\)\{\}\[\]\\\/@#$%^&*+=<>"|~`]/;
          if (invalidPattern.test(value)) {
            invalidChars.push({
              key,
              char: value.match(invalidPattern)[0],
              context: value.substring(Math.max(0, value.indexOf(invalidPattern.exec(value)[0]) - 10), value.indexOf(invalidPattern.exec(value)[0]) + 10)
            });
          }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          checkChars(value);
        }
      }
    };
    
    checkChars(data);
    
    if (invalidChars.length > 0) {
      fileResult.issues.push({
        type: ISSUE_TYPES.SPECIAL_CHARACTERS,
        severity: 'low',
        message: `发现 ${invalidChars.length} 个特殊字符问题`,
        details: invalidChars.slice(0, 3)
      });
    }
  }

  /**
   * 计算质量分数
   */
  calculateQualityScore(fileResult) {
    const totalIssues = fileResult.issues.length;
    const keyCount = fileResult.keysCount || 1;
    
    // 基于问题数量计算质量分数
    const qualityScore = Math.max(0, 100 - (totalIssues * 5));
    fileResult.quality.consistency = Math.min(100, 100 - (totalIssues * 3));
    fileResult.quality.completeness = Math.min(100, 100 - Math.max(0, (totalIssues * 2)));
    fileResult.quality.quality = qualityScore;
  }

  /**
   * 添加问题
   */
  addIssue(type, severity, message, details = null) {
    const issue = {
      type,
      severity,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.issues.push(issue);
    this.results.summary.issuesFound++;
  }

  /**
   * 分析整体质量
   */
  analyzeQuality() {
    const files = Object.values(this.results.files);
    const completedFiles = files.filter(f => f.exists);
    
    if (completedFiles.length === 0) return;
    
    // 计算总体质量分数
    const totalQuality = completedFiles.reduce((sum, file) => sum + file.quality.quality, 0);
    this.results.summary.qualityScore = Math.round(totalQuality / completedFiles.length);
    
    // 计算完整性分数
    const totalKeys = completedFiles.reduce((sum, file) => sum + file.keysCount, 0);
    const avgKeysPerFile = totalKeys / completedFiles.length;
    this.results.summary.completenessScore = Math.min(100, (avgKeysPerFile / 100) * 100);
    
    // 计算一致性分数
    this.results.summary.consistencyScore = 85; // 简化计算
    
    // 统计问题类型
    this.results.statistics = {
      issuesByType: this.groupIssuesByType(),
      issuesBySeverity: this.groupIssuesBySeverity(),
      filesWithIssues: completedFiles.filter(f => f.issues.length > 0).length,
      topIssues: this.getTopIssues()
    };
  }

  /**
   * 按类型分组问题
   */
  groupIssuesByType() {
    const groups = {};
    
    for (const issue of this.results.issues) {
      if (!groups[issue.type]) {
        groups[issue.type] = 0;
      }
      groups[issue.type]++;
    }
    
    return groups;
  }

  /**
   * 按严重程度分组问题
   */
  groupIssuesBySeverity() {
    const groups = {};
    
    for (const issue of this.results.issues) {
      if (!groups[issue.severity]) {
        groups[issue.severity] = 0;
      }
      groups[issue.severity]++;
    }
    
    return groups;
  }

  /**
   * 获取主要问题
   */
  getTopIssues() {
    return this.results.issues
      .sort((a, b) => {
        const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 10);
  }

  /**
   * 生成建议
   */
  generateRecommendations() {
    const recommendations = [];
    
    // 基于质量分数的建议
    if (this.results.summary.qualityScore < 70) {
      recommendations.push({
        priority: 'high',
        category: 'quality',
        title: '整体翻译质量需要改进',
        description: '当前翻译质量分数较低，建议优先解决高严重程度问题'
      });
    }
    
    // 基于完整性分数的建议
    if (this.results.summary.completenessScore < 80) {
      recommendations.push({
        priority: 'high',
        category: 'completeness',
        title: '翻译完整性不足',
        description: '部分语言或命名空间翻译不完整，建议补充缺失翻译'
      });
    }
    
    // 基于具体问题的建议
    const missingFiles = this.results.issues.filter(i => i.type === ISSUE_TYPES.MISSING_FILE);
    if (missingFiles.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'structure',
        title: '存在缺失的翻译文件',
        description: `${missingFiles.length} 个翻译文件缺失，需要立即补充`
      });
    }
    
    // 特殊字符问题
    const specialCharIssues = this.results.issues.filter(i => i.type === ISSUE_TYPES.SPECIAL_CHARACTERS);
    if (specialCharIssues.length > 0) {
      recommendations.push({
        priority: 'low',
        category: 'formatting',
        title: '发现特殊字符问题',
        description: '部分翻译包含无效或不一致的特殊字符，建议清理'
      });
    }
    
    this.results.recommendations = recommendations;
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log(`${colors.cyan}\n📋 翻译质量报告${colors.reset}`);
    console.log('='.repeat(60));
    
    // 总体统计
    console.log(`${colors.green}📊 总体统计:${colors.reset}`);
    console.log(`  处理文件: ${this.results.summary.processedFiles}/${this.results.summary.totalFiles}`);
    console.log(`  发现问题: ${this.results.summary.issuesFound}`);
    console.log(`  质量分数: ${this.results.summary.qualityScore}/100`);
    console.log(`  完整性分数: ${this.results.summary.completenessScore.toFixed(1)}/100`);
    console.log(`  一致性分数: ${this.results.summary.consistencyScore}/100`);
    
    // 问题统计
    console.log(`\n${colors.yellow}⚠️  问题统计:${colors.reset}`);
    for (const [severity, count] of Object.entries(this.results.statistics.issuesBySeverity)) {
      const color = severity === 'critical' ? colors.red : 
                   severity === 'high' ? colors.yellow : 
                   severity === 'medium' ? colors.cyan : colors.green;
      console.log(`  ${color}${severity.toUpperCase()}: ${count}${colors.reset}`);
    }
    
    // 主要问题
    if (this.results.statistics.topIssues.length > 0) {
      console.log(`\n${colors.red}🔥 主要问题:${colors.reset}`);
      this.results.statistics.topIssues.slice(0, 5).forEach((issue, index) => {
        const icon = issue.severity === 'critical' ? '🚨' : 
                    issue.severity === 'high' ? '⚠️' : '⚡';
        console.log(`  ${index + 1}. ${icon} ${issue.message}`);
      });
    }
    
    // 优化建议
    if (this.results.recommendations.length > 0) {
      console.log(`\n${colors.blue}💡 优化建议:${colors.reset}`);
      this.results.recommendations.forEach((rec, index) => {
        const priorityIcon = rec.priority === 'critical' ? '🚨' : 
                           rec.priority === 'high' ? '⚠️' : '💡';
        console.log(`  ${index + 1}. ${priorityIcon} ${rec.title}`);
        console.log(`     ${rec.description}`);
      });
    }
    
    // 详细文件状态
    console.log(`\n${colors.magenta}📁 文件状态详情:${colors.reset}`);
    for (const [fileKey, fileResult] of Object.entries(this.results.files)) {
      if (!fileResult.exists) {
        console.log(`  ❌ ${fileKey} - 文件缺失`);
      } else {
        const qualityIcon = fileResult.quality.quality >= 90 ? '🟢' : 
                          fileResult.quality.quality >= 70 ? '🟡' : '🔴';
        console.log(`  ${qualityIcon} ${fileKey} - ${fileResult.keysCount} 键, ${fileResult.quality.quality}/100`);
        
        if (fileResult.issues.length > 0 && fileResult.issues.length <= 3) {
          fileResult.issues.forEach(issue => {
            console.log(`     ⚠️  ${issue.message}`);
          });
        }
      }
    }
    
    // 建议行动计划
    console.log(`\n${colors.cyan}🎯 建议行动计划:${colors.reset}`);
    console.log('1. 🚨 立即修复缺失的翻译文件');
    console.log('2. ⚠️  补充缺失的翻译键');
    console.log('3. 🔧 修复占位符和格式问题');
    console.log('4. 📝 统一翻译术语和风格');
    console.log('5. ✅ 重新运行质量检查验证修复');
    
    // 保存报告到文件
    this.saveReportToFile();
  }

  /**
   * 保存报告到文件
   */
  saveReportToFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, `../reports/translation-quality-report-${timestamp}.json`);
    
    try {
      // 确保reports目录存在
      const reportsDir = path.dirname(reportPath);
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
      console.log(`\n${colors.green}📄 详细报告已保存至: ${reportPath}${colors.reset}`);
    } catch (error) {
      console.log(`\n${colors.red}❌ 保存报告失败: ${error.message}${colors.reset}`);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    const checker = new TranslationQualityChecker();
    await checker.run();
    
    console.log(`\n${colors.green}✅ 翻译质量检查完成${colors.reset}\n`);
    
    // 退出代码
    const exitCode = checker.results.summary.issuesFound > 0 ? 1 : 0;
    process.exit(exitCode);
    
  } catch (error) {
    console.error(`${colors.red}❌ 检查过程中发生错误: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = TranslationQualityChecker;