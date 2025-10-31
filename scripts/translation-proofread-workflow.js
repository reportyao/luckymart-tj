/**
 * 翻译校对工作流程
 * 自动化翻译校对流程，支持批量处理和进度跟踪
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class TranslationProofreadWorkflow {
  constructor(options = {}) {
    this.basePath = options.basePath || './src/locales';
    this.outputPath = options.outputPath || './reports';
    this.languages = options.languages || ['en-US', 'ru-RU', 'tg-TJ'];
    this.namespaces = options.namespaces || [
      'common', 'auth', 'lottery', 'wallet', 
      'referral', 'task', 'error', 'admin', 'bot'
    ];
    this.qualityThreshold = options.qualityThreshold || 70;
    this.parallel = options.parallel !== false; // 默认并行处理
    this.maxConcurrent = options.maxConcurrent || 3;
    this.progress = {
      total: 0,
      completed: 0,
      current: '',
      startTime: null,
      results: []
    };
  }

  /**
   * 执行翻译校对工作流程
   */
  async run(options = {}) {
    const {
      languages = this.languages,
      namespaces = this.namespaces,
      generateReports = true,
      fixIssues = false,
      verbose = false
    } = options;

    console.log('🚀 开始翻译校对工作流程...\n');
    
    // 初始化进度跟踪
    this.initializeProgress(languages, namespaces);
    
    // 创建输出目录
    this.ensureOutputDirectory();
    
    // 预检查
    console.log('📋 执行预检查...');
    await this.performPreChecks();
    
    // 执行翻译校对
    console.log('🔍 开始翻译质量检查...\n');
    const results = await this.performProofreading(languages, namespaces, verbose);
    
    // 汇总结果
    console.log('📊 汇总分析结果...\n');
    const summary = this.summarizeResults(results);
    
    // 生成报告
    if (generateReports) {
      console.log('📄 生成校对报告...\n');
      await this.generateReports(summary, results);
    }
    
    // 应用修复（如果需要）
    if (fixIssues) {
      console.log('🔧 应用自动修复...\n');
      await this.applyAutoFixes(results);
    }
    
    // 显示最终结果
    this.displayFinalResults(summary);
    
    return {
      summary,
      results,
      success: summary.overallScore >= this.qualityThreshold
    };
  }

  /**
   * 初始化进度跟踪
   */
  initializeProgress(languages, namespaces) {
    this.progress.total = languages.length * namespaces.length;
    this.progress.completed = 0;
    this.progress.startTime = Date.now();
    this.progress.results = [];
  }

  /**
   * 确保输出目录存在
   */
  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  /**
   * 执行预检查
   */
  async performPreChecks() {
    const checks = [
      this.checkDirectoryStructure(),
      this.checkFileCompleteness(),
      this.validateJsonFormat(),
      this.checkBaseTranslation()
    ];

    const results = await Promise.all(checks);
    const failedChecks = results.filter(result => !result.passed);

    if (failedChecks.length > 0) {
      console.warn('⚠️ 预检查发现问题:');
      failedChecks.forEach(check => {
        console.warn(`  - ${check.name}: ${check.message}`);
      });
      console.log();
    } else {
      console.log('✅ 预检查通过\n');
    }
  }

  /**
   * 检查目录结构
   */
  async checkDirectoryStructure() {
    try {
      const localesPath = this.basePath;
      if (!fs.existsSync(localesPath)) {
        return { name: 'directory_structure', passed: false, message: 'locales目录不存在' };
      }

      const baseFiles = fs.readdirSync(localesPath);
      const missingLangs = this.languages.filter(lang => !baseFiles.includes(lang));
      
      if (missingLangs.length > 0) {
        return { 
          name: 'directory_structure', 
          passed: false, 
          message: `缺少语言目录: ${missingLangs.join(', ')}` 
        };
      }

      return { name: 'directory_structure', passed: true, message: '目录结构正确' };
    } catch (error) {
      return { name: 'directory_structure', passed: false, message: error.message };
    }
  }

  /**
   * 检查文件完整性
   */
  async checkFileCompleteness() {
    const missingFiles = [];

    for (const language of this.languages) {
      for (const namespace of this.namespaces) {
        const filePath = path.join(this.basePath, language, `${namespace}.json`);
        if (!fs.existsSync(filePath)) {
          missingFiles.push(`${language}/${namespace}.json`);
        }
      }
    }

    if (missingFiles.length > 0) {
      return { 
        name: 'file_completeness', 
        passed: false, 
        message: `缺少翻译文件: ${missingFiles.slice(0, 5).join(', ')}${missingFiles.length > 5 ? '...' : ''}` 
      };
    }

    return { name: 'file_completeness', passed: true, message: '所有翻译文件存在' };
  }

  /**
   * 验证JSON格式
   */
  async validateJsonFormat() {
    const invalidFiles = [];

    for (const language of this.languages) {
      for (const namespace of this.namespaces) {
        const filePath = path.join(this.basePath, language, `${namespace}.json`);
        try {
          JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
          invalidFiles.push(`${language}/${namespace}.json`);
        }
      }
    }

    if (invalidFiles.length > 0) {
      return { 
        name: 'json_format', 
        passed: false, 
        message: `JSON格式错误: ${invalidFiles.slice(0, 3).join(', ')}${invalidFiles.length > 3 ? '...' : ''}` 
      };
    }

    return { name: 'json_format', passed: true, message: 'JSON格式正确' };
  }

  /**
   * 检查基准翻译
   */
  async checkBaseTranslation() {
    const basePath = path.join(this.basePath, 'zh-CN');
    const missingBaseFiles = [];

    for (const namespace of this.namespaces) {
      const filePath = path.join(basePath, `${namespace}.json`);
      if (!fs.existsSync(filePath)) {
        missingBaseFiles.push(`zh-CN/${namespace}.json`);
      }
    }

    if (missingBaseFiles.length > 0) {
      return { 
        name: 'base_translation', 
        passed: false, 
        message: `缺少基准翻译文件: ${missingBaseFiles.join(', ')}` 
      };
    }

    return { name: 'base_translation', passed: true, message: '基准翻译完整' };
  }

  /**
   * 执行翻译校对
   */
  async performProofreading(languages, namespaces, verbose = false) {
    const results = [];
    const tasks = [];

    // 创建任务队列
    for (const language of languages) {
      for (const namespace of namespaces) {
        tasks.push({ language, namespace });
      }
    }

    // 处理任务
    if (this.parallel) {
      // 并行处理
      const chunks = this.chunkArray(tasks, this.maxConcurrent);
      
      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map(task => this.processTranslationTask(task, verbose))
        );
        results.push(...chunkResults);
      }
    } else {
      // 串行处理
      for (const task of tasks) {
        const result = await this.processTranslationTask(task, verbose);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * 处理单个翻译任务
   */
  async processTranslationTask(task, verbose = false) {
    const { language, namespace } = task;
    
    this.progress.current = `${language}/${namespace}`;
    this.progress.completed++;
    
    if (verbose) {
      console.log(`🔍 检查 ${this.progress.current} (${this.progress.completed}/${this.progress.total})`);
    } else {
      this.updateProgressBar();
    }

    try {
      const result = await this.proofreadTranslation(language, namespace);
      this.progress.results.push({
        language,
        namespace,
        ...result,
        timestamp: new Date().toISOString()
      });
      
      return {
        language,
        namespace,
        success: true,
        ...result
      };
    } catch (error) {
      console.error(`❌ 检查失败 ${language}/${namespace}:`, error.message);
      
      return {
        language,
        namespace,
        success: false,
        error: error.message,
        metrics: { overall: 0, accuracy: 0, consistency: 0, fluency: 0, cultural: 0, technical: 0 },
        issues: [],
        suggestions: []
      };
    }
  }

  /**
   * 校对单个翻译文件
   */
  async proofreadTranslation(language, namespace) {
    // 读取翻译文件
    const translationPath = path.join(this.basePath, language, `${namespace}.json`);
    const basePath = path.join(this.basePath, 'zh-CN', `${namespace}.json`);
    
    const translation = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
    const base = JSON.parse(fs.readFileSync(basePath, 'utf8'));

    // 执行质量检查
    const issues = this.checkTranslationQuality(base, translation, language, namespace);
    
    // 计算质量指标
    const metrics = this.calculateMetrics(issues);
    
    // 生成改进建议
    const suggestions = this.generateSuggestions(issues, language, namespace);
    
    // 生成改进版本
    const improvedVersion = this.generateImprovedVersion(translation, issues, language);

    return {
      metrics,
      issues,
      suggestions,
      improvedVersion,
      status: this.determineStatus(metrics, issues)
    };
  }

  /**
   * 检查翻译质量
   */
  checkTranslationQuality(base, translation, language, namespace) {
    const issues = [];

    // 检查缺失翻译
    issues.push(...this.checkMissingTranslations(base, translation, language, namespace));
    
    // 检查术语一致性
    issues.push(...this.checkTermConsistency(translation, language, namespace));
    
    // 检查占位符
    issues.push(...this.checkPlaceholders(base, translation, language, namespace));
    
    // 检查文化适应性
    if (language === 'tg-TJ') {
      issues.push(...this.checkTajikCulture(translation, namespace));
    }
    
    if (language === 'ru-RU') {
      issues.push(...this.checkRussianCulture(translation, namespace));
    }
    
    // 检查技术规范
    issues.push(...this.checkTechnicalStandards(translation, language, namespace));
    
    return issues;
  }

  /**
   * 检查缺失翻译
   */
  checkMissingTranslations(base, translation, language, namespace) {
    const issues = [];

    const checkObject = (baseObj, targetObj, prefix = '') => {
      for (const key in baseObj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof baseObj[key] === 'object' && baseObj[key] !== null) {
          if (typeof targetObj[key] === 'object' && targetObj[key] !== null) {
            checkObject(baseObj[key], targetObj[key], fullKey);
          } else {
            issues.push({
              type: 'accuracy',
              severity: 'high',
              language,
              namespace,
              key: fullKey,
              original: JSON.stringify(baseObj[key]),
              translation: '',
              explanation: '翻译缺失'
            });
          }
        } else {
          if (!(key in targetObj) || !targetObj[key]) {
            issues.push({
              type: 'accuracy',
              severity: 'high',
              language,
              namespace,
              key: fullKey,
              original: baseObj[key],
              translation: targetObj[key] || '',
              explanation: '翻译缺失或为空'
            });
          }
        }
      }
    };

    checkObject(base, translation);
    return issues;
  }

  /**
   * 检查术语一致性
   */
  checkTermConsistency(translation, language, namespace) {
    const issues = [];
    const standardTerms = this.getStandardTerms(language);

    const checkObject = (obj, prefix = '') => {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkObject(obj[key], fullKey);
        } else {
          // 检查是否使用了标准术语
          const term = this.extractTerm(key);
          if (term && standardTerms[term]) {
            const expectedTranslation = standardTerms[term];
            if (!obj[key].includes(expectedTranslation) && this.shouldUseStandardTerm(key)) {
              issues.push({
                type: 'consistency',
                severity: 'medium',
                language,
                namespace,
                key: fullKey,
                original: '',
                translation: obj[key],
                suggestion: expectedTranslation,
                explanation: `术语"${term}"应使用标准翻译: ${expectedTranslation}`
              });
            }
          }
        }
      }
    };

    checkObject(translation);
    return issues;
  }

  /**
   * 检查占位符
   */
  checkPlaceholders(base, translation, language, namespace) {
    const issues = [];

    const checkObject = (baseObj, targetObj, prefix = '') => {
      for (const key in baseObj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof baseObj[key] === 'object' && baseObj[key] !== null) {
          if (typeof targetObj[key] === 'object' && targetObj[key] !== null) {
            checkObject(baseObj[key], targetObj[key], fullKey);
          }
        } else {
          const baseText = baseObj[key];
          const targetText = targetObj[key];
          
          const basePlaceholders = this.extractPlaceholders(baseText);
          const targetPlaceholders = this.extractPlaceholders(targetText);
          
          // 检查占位符一致性
          const missingPlaceholders = basePlaceholders.filter(p => !targetPlaceholders.includes(p));
          const extraPlaceholders = targetPlaceholders.filter(p => !basePlaceholders.includes(p));
          
          if (missingPlaceholders.length > 0) {
            issues.push({
              type: 'placeholder',
              severity: 'critical',
              language,
              namespace,
              key: fullKey,
              original: baseText,
              translation: targetText,
              explanation: `缺少占位符: ${missingPlaceholders.join(', ')}`
            });
          }
          
          if (extraPlaceholders.length > 0) {
            issues.push({
              type: 'placeholder',
              severity: 'medium',
              language,
              namespace,
              key: fullKey,
              original: baseText,
              translation: targetText,
              explanation: `多余的占位符: ${extraPlaceholders.join(', ')}`
            });
          }
        }
      }
    };

    checkObject(base, translation);
    return issues;
  }

  /**
   * 检查塔吉克语文化适应性
   */
  checkTajikCulture(translation, namespace) {
    const issues = [];

    const checkObject = (obj, prefix = '') => {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkObject(obj[key], fullKey);
        } else {
          const text = obj[key];
          
          // 检查不自然的塔吉克语表达
          if (this.hasUnnaturalTajikExpression(text)) {
            const suggestion = this.getNaturalTajikTranslation(text);
            issues.push({
              type: 'cultural',
              severity: 'high',
              language: 'tg-TJ',
              namespace,
              key: fullKey,
              original: '',
              translation: text,
              suggestion,
              explanation: '表达不符合塔吉克语习惯用法'
            });
          }
        }
      }
    };

    checkObject(translation);
    return issues;
  }

  /**
   * 检查俄语文化适应性
   */
  checkRussianCulture(translation, namespace) {
    const issues = [];

    const checkObject = (obj, prefix = '') => {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkObject(obj[key], fullKey);
        } else {
          const text = obj[key];
          
          // 检查敬语级别
          if (this.hasIncorrectFormality(text, key)) {
            const suggestion = this.getCorrectRussianFormality(text, key);
            issues.push({
              type: 'cultural',
              severity: 'medium',
              language: 'ru-RU',
              namespace,
              key: fullKey,
              original: '',
              translation: text,
              suggestion,
              explanation: '敬语级别使用不当'
            });
          }
        }
      }
    };

    checkObject(translation);
    return issues;
  }

  /**
   * 检查技术规范
   */
  checkTechnicalStandards(translation, language, namespace) {
    const issues = [];

    const checkObject = (obj, prefix = '') => {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkObject(obj[key], fullKey);
        } else {
          const text = obj[key];
          
          // 检查文本长度
          if (text.length > 50 && namespace !== 'admin') {
            issues.push({
              type: 'technical',
              severity: 'low',
              language,
              namespace,
              key: fullKey,
              original: '',
              translation: text,
              suggestion: this.suggestShortenedText(text),
              explanation: '文本过长，可能不适合移动端显示'
            });
          }

          // 检查特殊字符
          if (this.hasInvalidSpecialChars(text, language)) {
            issues.push({
              type: 'technical',
              severity: 'medium',
              language,
              namespace,
              key: fullKey,
              original: '',
              translation: text,
              suggestion: this.fixSpecialChars(text, language),
              explanation: '包含无效的特殊字符'
            });
          }
        }
      }
    };

    checkObject(translation);
    return issues;
  }

  // 辅助方法
  calculateMetrics(issues) {
    const totalIssues = issues.length;
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    const lowIssues = issues.filter(i => i.severity === 'low').length;

    const accuracy = Math.max(0, 100 - (criticalIssues * 30 + highIssues * 20 + mediumIssues * 10));
    const consistency = Math.max(0, 100 - (highIssues * 25 + mediumIssues * 15 + lowIssues * 5));
    const fluency = Math.max(0, 100 - (mediumIssues * 10 + lowIssues * 5));
    const cultural = Math.max(0, 100 - (highIssues * 20 + mediumIssues * 10));
    const technical = Math.max(0, 100 - (criticalIssues * 40 + mediumIssues * 15 + lowIssues * 5));

    const overall = Math.round((accuracy + consistency + fluency + cultural + technical) / 5);

    return { accuracy, consistency, fluency, cultural, technical, overall };
  }

  generateSuggestions(issues, language, namespace) {
    const suggestions = [];
    const issueCount = issues.length;

    if (issueCount > 20) {
      suggestions.push('严重：翻译质量问题较多，建议进行全面校对');
    } else if (issueCount > 10) {
      suggestions.push('警告：存在较多翻译问题，需要重点关注');
    } else if (issueCount > 5) {
      suggestions.push('提示：存在少量翻译问题，建议优化');
    } else {
      suggestions.push('良好：翻译质量基本符合要求');
    }

    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    if (criticalCount > 0) {
      suggestions.push(`存在${criticalCount}个严重问题，需要立即修复`);
    }

    return suggestions;
  }

  generateImprovedVersion(translation, issues, language) {
    const improved = JSON.parse(JSON.stringify(translation));

    issues.forEach(issue => {
      if (issue.suggestion) {
        this.setNestedValue(improved, issue.key, issue.suggestion);
      }
    });

    return improved;
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  determineStatus(metrics, issues) {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const overallScore = metrics.overall;

    if (criticalIssues > 0 || overallScore < 30) {
      return 'failed';
    } else if (overallScore < 70 || issues.length > 10) {
      return 'warning';
    } else {
      return 'passed';
    }
  }

  // 更多的辅助方法...
  getStandardTerms(language) {
    const terms = {
      'zh-CN': {
        'coins': '夺宝币',
        'shares': '份',
        'balance': '余额',
        'currency': '货币',
        'amount': '金额',
        'recharge': '充值',
        'withdraw': '提现',
        'time': '时间',
        'date': '日期',
        'today': '今天',
        'yesterday': '昨天',
        'tomorrow': '明天',
        'tap': '点击',
        'swipe': '滑动',
        'long_press': '长按',
        'double_tap': '双击',
        'confirm': '确认'
      },
      'en-US': {
        'coins': 'Lucky Coins',
        'shares': 'shares',
        'balance': 'balance',
        'currency': 'currency',
        'amount': 'amount',
        'recharge': 'recharge',
        'withdraw': 'withdraw',
        'time': 'time',
        'date': 'date',
        'today': 'today',
        'yesterday': 'yesterday',
        'tomorrow': 'tomorrow',
        'tap': 'tap',
        'swipe': 'swipe',
        'long_press': 'long press',
        'double_tap': 'double tap',
        'confirm': 'confirm'
      },
      'ru-RU': {
        'coins': 'Монеты Удачи',
        'shares': 'долей',
        'balance': 'баланс',
        'currency': 'валюта',
        'amount': 'сумма',
        'recharge': 'пополнение',
        'withdraw': 'вывод',
        'time': 'время',
        'date': 'дата',
        'today': 'сегодня',
        'yesterday': 'вчера',
        'tomorrow': 'завтра',
        'tap': 'нажать',
        'swipe': 'свайп',
        'long_press': 'долгое нажатие',
        'double_tap': 'двойной тап',
        'confirm': 'подтвердить'
      },
      'tg-TJ': {
        'coins': 'Тангаҳои Бахт',
        'shares': 'ҳисса',
        'balance': 'баланс',
        'currency': 'пул',
        'amount': 'маблағ',
        'recharge': 'пардохт',
        'withdraw': 'кашондан',
        'time': 'вақт',
        'date': 'рӯз',
        'today': 'имрӯз',
        'yesterday': 'дирӯз',
        'tomorrow': 'фардо',
        'tap': 'пахш',
        'swipe': 'саворт',
        'long_press': 'давидани дароз',
        'double_tap': 'дубора пахш',
        'confirm': 'тасдиқ'
      }
    };

    return terms[language] || {};
  }

  extractTerm(key) {
    const termMap = {
      'currency': 'currency',
      'amount': 'amount',
      'balance': 'balance',
      'recharge': 'recharge',
      'withdraw': 'withdraw',
      'time': 'time',
      'date': 'date',
      'today': 'today',
      'yesterday': 'yesterday',
      'tomorrow': 'tomorrow',
      'tap': 'tap',
      'swipe': 'swipe',
      'long_press': 'long_press',
      'double_tap': 'double_tap',
      'confirm': 'confirm'
    };
    
    return termMap[key] || '';
  }

  shouldUseStandardTerm(key) {
    return ['currency', 'amount', 'balance', 'recharge', 'withdraw'].includes(key);
  }

  extractPlaceholders(text) {
    const matches = text.match(/\{\{?\w+\}?\}/g);
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
  }

  hasUnnaturalTajikExpression(text) {
    const unnaturalPatterns = [
      /糖ворт/i,
      /давидани дароз/i,
      /дубора пахш/i,
    ];
    
    return unnaturalPatterns.some(pattern => pattern.test(text));
  }

  getNaturalTajikTranslation(text) {
    const improvements = {
      '糖ворт': 'саворт',
      'давидани дароз': 'фишор дароз',
      'дубора пахш': 'ду маротиба пахш кардан'
    };
    
    let improved = text;
    for (const [wrong, correct] of Object.entries(improvements)) {
      improved = improved.replace(new RegExp(wrong, 'g'), correct);
    }
    
    return improved;
  }

  hasIncorrectFormality(text, key) {
    const informalWords = ['ты', 'тебе', 'тебя'];
    const formalWords = ['вы', 'вам', 'вас'];
    
    if (key.includes('admin') || key.includes('error')) {
      return informalWords.some(word => text.includes(word));
    }
    
    return false;
  }

  getCorrectRussianFormality(text, key) {
    const corrections = {
      'ты': 'вы',
      'тебе': 'вам',
      'тебя': 'вас'
    };
    
    let corrected = text;
    for (const [informal, formal] of Object.entries(corrections)) {
      corrected = corrected.replace(new RegExp(informal, 'gi'), formal);
    }
    
    return corrected;
  }

  hasInvalidSpecialChars(text, language) {
    if (language === 'zh-CN') {
      return !/^[\u4e00-\u9fa5\s\w\-\.\!\?\(\)\[\]\{\}\:\"\'\,\.\;\/\\\-\+]+$/.test(text);
    }
    
    if (language === 'en-US') {
      return !/^[a-zA-Z\s\w\-\.\!\?\(\)\[\]\{\}\:\"\'\,\.\;\/\\\-\+]+$/.test(text);
    }
    
    if (language === 'ru-RU') {
      return !/^[а-яё\s\w\-\.\!\?\(\)\[\]\{\}\:\"\'\,\.\;\/\\\-\+]+$/i.test(text);
    }
    
    if (language === 'tg-TJ') {
      return !/^[ӣӯҳқғҷӈӉӟӅӍӉҙҫҡҟҭҵҷҹһӯҷӈҟҳҝҡҵҶҲҳҫӊӉҰҳӆҭӇӈҚӈӬӖҳҢҭӇҸӔүӍӜӍӆҺӂӈҖҳҖҴҙӭӈӝҶҗҵҡӭӍӘӆӃӱӨҼ ҫҵӴҖЎӵӄӔӓІіІӅғĀĂĄĆĊĈĊĖĒĜĞĠĢĤĦĨĪĬĮİĲĴĶĹĻĽĿŁŃŅŇŊŌŎŐŒŔŖŚŜŞŤŦŨŪŬŮŰŲŴŶŹŽẀẂẄỲỸḤḤṢṬṰṶẆẊẊẎ◦·•─━│┌┐└┘├┤┬┴┼║═╗╗╔╚╝]+$/u.test(text);
    }
    
    return false;
  }

  fixSpecialChars(text, language) {
    if (language === 'tg-TJ') {
      return text.replace(/糖ворт/g, 'саворт');
    }
    
    return text;
  }

  suggestShortenedText(text) {
    if (text.length > 50) {
      return text.substring(0, 47) + '...';
    }
    return text;
  }

  // 进度显示
  updateProgressBar() {
    const percentage = Math.round((this.progress.completed / this.progress.total) * 100);
    const barLength = 30;
    const filledLength = Math.round(barLength * percentage / 100);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    process.stdout.write(`\r进度: [${bar}] ${percentage}% (${this.progress.completed}/${this.progress.total}) - ${this.progress.current}`);
    
    if (this.progress.completed === this.progress.total) {
      console.log(); // 换行
    }
  }

  // 数组分块
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 汇总结果
   */
  summarizeResults(results) {
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    const totalFiles = results.length;
    const passedFiles = successfulResults.filter(r => r.status === 'passed').length;
    const warningFiles = successfulResults.filter(r => r.status === 'warning').length;
    const failedFiles = successfulResults.filter(r => r.status === 'failed').length + failedResults.length;
    
    // 计算平均分数
    const validScores = successfulResults
      .map(r => r.metrics.overall)
      .filter(score => score > 0);
    
    const averageScore = validScores.length > 0 
      ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
      : 0;
    
    // 统计问题
    const allIssues = successfulResults.flatMap(r => r.issues);
    const issuesByType = {};
    const issuesBySeverity = {};
    
    allIssues.forEach(issue => {
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
      issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;
    });
    
    // 按语言分组统计
    const languageStats = {};
    this.languages.forEach(lang => {
      const langResults = successfulResults.filter(r => r.language === lang);
      const langScores = langResults.map(r => r.metrics.overall).filter(s => s > 0);
      const avgScore = langScores.length > 0 
        ? Math.round(langScores.reduce((sum, score) => sum + score, 0) / langScores.length)
        : 0;
      
      languageStats[lang] = {
        total: langResults.length,
        passed: langResults.filter(r => r.status === 'passed').length,
        warning: langResults.filter(r => r.status === 'warning').length,
        failed: langResults.filter(r => r.status === 'failed').length,
        averageScore: avgScore,
        totalIssues: langResults.flatMap(r => r.issues).length
      };
    });
    
    const duration = Date.now() - this.progress.startTime;
    
    return {
      overallScore: averageScore,
      passedFiles,
      warningFiles,
      failedFiles,
      totalFiles,
      passRate: Math.round((passedFiles / totalFiles) * 100),
      issuesByType,
      issuesBySeverity,
      languageStats,
      duration,
      timestamp: new Date().toISOString(),
      threshold: this.qualityThreshold
    };
  }

  /**
   * 生成报告
   */
  async generateReports(summary, results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.outputPath, `translation-proofread-report-${timestamp}.json`);
    
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        tool: 'TranslationProofreadWorkflow',
        parameters: {
          languages: this.languages,
          namespaces: this.namespaces,
          qualityThreshold: this.qualityThreshold
        }
      },
      summary,
      details: results,
      recommendations: this.generateRecommendations(summary)
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // 生成简化报告
    const simpleReportPath = path.join(this.outputPath, `translation-proofread-summary-${timestamp}.md`);
    this.generateMarkdownReport(summary, simpleReportPath);
    
    console.log(`📄 报告已生成:`);
    console.log(`   详细报告: ${reportPath}`);
    console.log(`   简化报告: ${simpleReportPath}\n`);
  }

  /**
   * 生成推荐建议
   */
  generateRecommendations(summary) {
    const recommendations = [];
    
    if (summary.overallScore < this.qualityThreshold) {
      recommendations.push({
        priority: 'high',
        category: 'quality',
        title: '整体翻译质量需要改进',
        description: `当前总体分数 ${summary.overallScore} 低于阈值 ${this.qualityThreshold}，建议优先处理高优先级问题`
      });
    }
    
    if (summary.failedFiles > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'stability',
        title: '存在失败的文件',
        description: `${summary.failedFiles} 个文件的翻译质量严重不达标，需要立即修复`
      });
    }
    
    // 按语言给出建议
    Object.entries(summary.languageStats).forEach(([lang, stats]) => {
      if (stats.averageScore < this.qualityThreshold) {
        recommendations.push({
          priority: 'high',
          category: 'localization',
          title: `${lang} 翻译质量需要改进`,
          description: `${lang} 平均分数 ${stats.averageScore}，建议重点校对该语言的翻译内容`
        });
      }
    });
    
    // 按问题类型给出建议
    Object.entries(summary.issuesByType).forEach(([type, count]) => {
      if (count > summary.totalFiles * 0.5) { // 超过50%的文件都有这个问题
        recommendations.push({
          priority: 'medium',
          category: 'process',
          title: `${type} 问题需要系统改进`,
          description: `${count} 个文件存在 ${type} 类型问题，建议建立系统性解决方案`
        });
      }
    });
    
    return recommendations;
  }

  /**
   * 生成Markdown报告
   */
  generateMarkdownReport(summary, outputPath) {
    const report = `# 翻译校对报告

生成时间: ${new Date().toLocaleString('zh-CN')}

## 总体概览

- **总体评分**: ${summary.overallScore}/100 ${summary.overallScore >= summary.threshold ? '✅' : '❌'}
- **通过文件**: ${summary.passedFiles}/${summary.totalFiles} (${summary.passRate}%)
- **警告文件**: ${summary.warningFiles}
- **失败文件**: ${summary.failedFiles}
- **处理时间**: ${Math.round(summary.duration / 1000)}秒

## 按语言统计

| 语言 | 文件数 | 通过 | 警告 | 失败 | 平均分数 | 问题数 |
|------|--------|------|------|------|----------|--------|
${Object.entries(summary.languageStats).map(([lang, stats]) => 
  `| ${lang} | ${stats.total} | ${stats.passed} | ${stats.warning} | ${stats.failed} | ${stats.averageScore} | ${stats.totalIssues} |`
).join('\n')}

## 问题分布

### 按严重程度
${Object.entries(summary.issuesBySeverity).map(([severity, count]) => 
  `- **${severity}**: ${count} 个问题`
).join('\n')}

### 按类型
${Object.entries(summary.issuesByType).map(([type, count]) => 
  `- **${type}**: ${count} 个问题`
).join('\n')}

## 质量阈值
通过线: ${summary.threshold}/100

## 建议

${summary.overallScore >= summary.threshold ? '✅ 翻译质量整体符合要求，建议继续保持和改进。' : '❌ 翻译质量需要改进，建议优先处理高优先级问题。'}

---
*报告由 TranslationProofreadWorkflow 自动生成*
`;

    fs.writeFileSync(outputPath, report);
  }

  /**
   * 应用自动修复
   */
  async applyAutoFixes(results) {
    const fixes = [];
    
    for (const result of results) {
      if (!result.success || !result.improvedVersion) continue;
      
      // 只应用低风险的修复
      const safeFixes = result.issues.filter(issue => 
        issue.severity === 'low' || 
        (issue.severity === 'medium' && issue.type === 'technical')
      );
      
      if (safeFixes.length > 0) {
        const filePath = path.join(this.basePath, result.language, `${result.namespace}.json`);
        
        // 备份原文件
        const backupPath = filePath + '.backup';
        fs.copyFileSync(filePath, backupPath);
        
        // 应用修复
        fs.writeFileSync(filePath, JSON.stringify(result.improvedVersion, null, 2));
        
        fixes.push({
          language: result.language,
          namespace: result.namespace,
          filePath,
          backupPath,
          fixedIssues: safeFixes.length
        });
      }
    }
    
    console.log(`🔧 应用了 ${fixes.length} 个自动修复`);
    fixes.forEach(fix => {
      console.log(`   - ${fix.language}/${fix.namespace}: 修复了 ${fix.fixedIssues} 个问题`);
      console.log(`     备份文件: ${fix.backupPath}`);
    });
  }

  /**
   * 显示最终结果
   */
  displayFinalResults(summary) {
    console.log('📊 翻译校对完成!\n');
    
    console.log('=== 总体结果 ===');
    console.log(`总体评分: ${summary.overallScore}/100 ${summary.overallScore >= summary.threshold ? '✅ 通过' : '❌ 未通过'}`);
    console.log(`通过率: ${summary.passRate}% (${summary.passedFiles}/${summary.totalFiles})`);
    console.log(`处理时间: ${Math.round(summary.duration / 1000)}秒\n`);
    
    console.log('=== 各语言表现 ===');
    Object.entries(summary.languageStats).forEach(([lang, stats]) => {
      const status = stats.averageScore >= summary.threshold ? '✅' : '❌';
      console.log(`${lang}: ${stats.averageScore}/100 ${status} (${stats.passed}/${stats.total} 通过)`);
    });
    
    console.log('\n=== 主要问题 ===');
    const topIssues = Object.entries(summary.issuesByType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    topIssues.forEach(([type, count]) => {
      console.log(`${type}: ${count} 个问题`);
    });
    
    if (summary.overallScore >= summary.threshold) {
      console.log('\n🎉 翻译质量整体符合发布标准!');
    } else {
      console.log('\n⚠️ 翻译质量需要改进后再发布.');
    }
  }
}

// CLI 支持
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // 解析命令行参数
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    
    if (key && value) {
      switch (key) {
        case 'languages':
          options.languages = value.split(',');
          break;
        case 'namespaces':
          options.namespaces = value.split(',');
          break;
        case 'threshold':
          options.qualityThreshold = parseInt(value);
          break;
        case 'parallel':
          options.parallel = value === 'true';
          break;
        case 'concurrent':
          options.maxConcurrent = parseInt(value);
          break;
        case 'fix':
          options.fixIssues = value === 'true';
          break;
        case 'verbose':
          options.verbose = value === 'true';
          break;
      }
    }
  }
  
  // 运行工作流程
  const workflow = new TranslationProofreadWorkflow(options);
  workflow.run({
    languages: options.languages,
    namespaces: options.namespaces,
    fixIssues: options.fixIssues,
    verbose: options.verbose
  }).then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('❌ 工作流程执行失败:', error);
    process.exit(1);
  });
}

module.exports = TranslationProofreadWorkflow;