/**
 * 翻译校对和改进工具
 * 提供翻译质量检查、错误识别和改进建议功能
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TranslationIssue {
  type: 'accuracy' | 'consistency' | 'grammar' | 'cultural' | 'technical' | 'placeholder';
  severity: 'low' | 'medium' | 'high' | 'critical';
  language: string;
  namespace: string;
  key: string;
  original: string;
  translation: string;
  suggestion?: string;
  explanation: string;
}

export interface QualityMetrics {
  accuracy: number;      // 准确性 (0-100)
  consistency: number;   // 一致性 (0-100)
  fluency: number;       // 流畅度 (0-100)
  cultural: number;      // 文化适应性 (0-100)
  technical: number;     // 技术规范 (0-100)
  overall: number;       // 总体分数 (0-100)
}

export interface ProofreadingResult {
  language: string;
  namespace: string;
  metrics: QualityMetrics;
  issues: TranslationIssue[];
  suggestions: string[];
  improvedVersion?: any;
  status: 'passed' | 'warning' | 'failed';
}

export class TranslationProofreader {
  private basePath: string;
  private standardGlossary: Map<string, Record<string, string>> = new Map();

  constructor(basePath: string = './src/locales') {
    this.basePath = basePath;
    this.initializeStandardGlossary();
  }

  private initializeStandardGlossary() {
    // 标准术语库
    this.standardGlossary.set('currency', {
      'zh-CN': '货币',
      'en-US': 'currency',
      'ru-RU': 'валюта',
      'tg-TJ': 'пул'
    });

    this.standardGlossary.set('amount', {
      'zh-CN': '金额',
      'en-US': 'amount',
      'ru-RU': 'сумма',
      'tg-TJ': 'маблағ'
    });

    this.standardGlossary.set('balance', {
      'zh-CN': '余额',
      'en-US': 'balance',
      'ru-RU': 'баланс',
      'tg-TJ': 'баланс'
    });

    this.standardGlossary.set('recharge', {
      'zh-CN': '充值',
      'en-US': 'recharge',
      'ru-RU': 'пополнение',
      'tg-TJ': 'пардохт'
    });

    this.standardGlossary.set('withdraw', {
      'zh-CN': '提现',
      'en-US': 'withdraw',
      'ru-RU': 'вывод',
      'tg-TJ': 'кашондан'
    });

    this.standardGlossary.set('time', {
      'zh-CN': '时间',
      'en-US': 'time',
      'ru-RU': 'время',
      'tg-TJ': 'вақт'
    });

    this.standardGlossary.set('date', {
      'zh-CN': '日期',
      'en-US': 'date',
      'ru-RU': 'дата',
      'tg-TJ': 'рӯз'
    });

    this.standardGlossary.set('today', {
      'zh-CN': '今天',
      'en-US': 'today',
      'ru-RU': 'сегодня',
      'tg-TJ': 'имрӯз'
    });

    this.standardGlossary.set('yesterday', {
      'zh-CN': '昨天',
      'en-US': 'yesterday',
      'ru-RU': 'вчера',
      'tg-TJ': 'дирӯз'
    });

    this.standardGlossary.set('tomorrow', {
      'zh-CN': '明天',
      'en-US': 'tomorrow',
      'ru-RU': 'завтра',
      'tg-TJ': 'фардо'
    });

    this.standardGlossary.set('tap', {
      'zh-CN': '点击',
      'en-US': 'tap',
      'ru-RU': 'нажать',
      'tg-TJ': 'пахш'
    });

    this.standardGlossary.set('swipe', {
      'zh-CN': '滑动',
      'en-US': 'swipe',
      'ru-RU': 'свайп',
      'tg-TJ': 'саворт'
    });

    this.standardGlossary.set('long_press', {
      'zh-CN': '长按',
      'en-US': 'long press',
      'ru-RU': 'долгое нажатие',
      'tg-TJ': 'давидани дароз'
    });

    this.standardGlossary.set('double_tap', {
      'zh-CN': '双击',
      'en-US': 'double tap',
      'ru-RU': 'двойной тап',
      'tg-TJ': 'дубора пахш'
    });

    this.standardGlossary.set('confirm', {
      'zh-CN': '确认',
      'en-US': 'confirm',
      'ru-RU': 'подтвердить',
      'tg-TJ': 'тасдиқ'
    });
  }

  /**
   * 执行翻译校对
   */
  async proofRead(language: string, namespace: string): Promise<ProofreadingResult> {
    const translationPath = path.join(this.basePath, language, `${namespace}.json`);
    
    if (!fs.existsSync(translationPath)) {
      throw new Error(`Translation file not found: ${translationPath}`);
    }

    const translation = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
    const issues: TranslationIssue[] = [];
    const suggestions: string[] = [];

    // 读取基准文件（中文）进行比较
    const baseTranslation = JSON.parse(
      fs.readFileSync(path.join(this.basePath, 'zh-CN', `${namespace}.json`), 'utf8')
    );

    // 检查准确性
    const accuracyIssues = this.checkAccuracy(baseTranslation, translation, language, namespace);
    issues.push(...accuracyIssues);

    // 检查一致性
    const consistencyIssues = this.checkConsistency(translation, language, namespace);
    issues.push(...consistencyIssues);

    // 检查文化适应性
    const culturalIssues = this.checkCulturalAdaptation(translation, language, namespace);
    issues.push(...culturalIssues);

    // 检查技术规范
    const technicalIssues = this.checkTechnicalStandards(translation, language, namespace);
    issues.push(...technicalIssues);

    // 检查占位符
    const placeholderIssues = this.checkPlaceholders(baseTranslation, translation, language, namespace);
    issues.push(...placeholderIssues);

    // 计算质量指标
    const metrics = this.calculateMetrics(issues);

    // 生成改进建议
    const improvedSuggestions = this.generateSuggestions(issues, language, namespace);
    suggestions.push(...improvedSuggestions);

    // 生成改进版本
    const improvedVersion = this.generateImprovedVersion(translation, issues, language);

    const status = this.determineStatus(metrics, issues);

    return {
      language,
      namespace,
      metrics,
      issues,
      suggestions,
      improvedVersion,
      status
    };
  }

  /**
   * 检查翻译准确性
   */
  private checkAccuracy(
    base: any, 
    target: any, 
    language: string, 
    namespace: string
  ): TranslationIssue[] {
    const issues: TranslationIssue[] = [];

    const checkObject = (baseObj: any, targetObj: any, prefix: string = '') => {
      for (const key in baseObj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof baseObj[key] === 'object' && baseObj[key] !== null) {
          if (typeof targetObj[key] === 'object' && targetObj[key] !== null) {
            checkObject(baseObj[key], targetObj[key], fullKey);
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
          } else if (this.isPoorTranslation(baseObj[key], targetObj[key], language)) {
            issues.push({
              type: 'accuracy',
              severity: 'medium',
              language,
              namespace,
              key: fullKey,
              original: baseObj[key],
              translation: targetObj[key],
              suggestion: this.getBetterTranslation(baseObj[key], language),
              explanation: '翻译质量较差，可能存在误导或不准确'
            });
          }
        }
      }
    };

    checkObject(base, target);
    return issues;
  }

  /**
   * 检查术语一致性
   */
  private checkConsistency(target: any, language: string, namespace: string): TranslationIssue[] {
    const issues: TranslationIssue[] = [];
    const termCounts: Map<string, number> = new Map();

    const findTerms = (obj: any, prefix: string = '') => {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          findTerms(obj[key], fullKey);
        } else {
          const term = this.extractKeyTerm(key);
          if (term) {
            const count = termCounts.get(term) || 0;
            termCounts.set(term, count + 1);
            
            // 检查是否使用标准术语
            if (!this.isStandardTerm(term, obj[key], language)) {
              issues.push({
                type: 'consistency',
                severity: 'medium',
                language,
                namespace,
                key: fullKey,
                original: '',
                translation: obj[key],
                suggestion: this.getStandardTermTranslation(term, language),
                explanation: `术语"${term}"的翻译与标准不一致`
              });
            }
          }
        }
      }
    };

    findTerms(target);
    return issues;
  }

  /**
   * 检查文化适应性
   */
  private checkCulturalAdaptation(target: any, language: string, namespace: string): TranslationIssue[] {
    const issues: TranslationIssue[] = [];

    if (language === 'tg-TJ') {
      const culturalIssues = this.checkTajikCulture(target, namespace);
      issues.push(...culturalIssues);
    }

    if (language === 'ru-RU') {
      const culturalIssues = this.checkRussianCulture(target, namespace);
      issues.push(...culturalIssues);
    }

    return issues;
  }

  /**
   * 检查塔吉克语文化适应性
   */
  private checkTajikCulture(target: any, namespace: string): TranslationIssue[] {
    const issues: TranslationIssue[] = [];

    const checkObject = (obj: any, prefix: string = '') => {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkObject(obj[key], fullKey);
        } else {
          const translation = obj[key];
          
          // 检查不自然的表达
          if (this.hasUnnaturalTajikExpression(translation)) {
            issues.push({
              type: 'cultural',
              severity: 'high',
              language: 'tg-TJ',
              namespace,
              key: fullKey,
              original: '',
              translation,
              suggestion: this.getNaturalTajikTranslation(translation),
              explanation: '表达不符合塔吉克语习惯用法'
            });
          }

          // 检查错误的词汇选择
          if (this.hasWrongTajikVocabulary(translation)) {
            issues.push({
              type: 'cultural',
              severity: 'medium',
              language: 'tg-TJ',
              namespace,
              key: fullKey,
              original: '',
              translation,
              suggestion: this.getCorrectTajikVocabulary(translation),
              explanation: '使用了不恰当的塔吉克语词汇'
            });
          }
        }
      }
    };

    checkObject(target);
    return issues;
  }

  /**
   * 检查俄语文化适应性
   */
  private checkRussianCulture(target: any, namespace: string): TranslationIssue[] {
    const issues: TranslationIssue[] = [];

    const checkObject = (obj: any, prefix: string = '') => {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkObject(obj[key], fullKey);
        } else {
          const translation = obj[key];
          
          // 检查是否使用了正式/非正式形式
          if (this.hasIncorrectFormality(translation, key)) {
            issues.push({
              type: 'cultural',
              severity: 'medium',
              language: 'ru-RU',
              namespace,
              key: fullKey,
              original: '',
              translation,
              suggestion: this.getCorrectRussianFormality(translation, key),
              explanation: '敬语级别使用不当'
            });
          }
        }
      }
    };

    checkObject(target);
    return issues;
  }

  /**
   * 检查技术规范
   */
  private checkTechnicalStandards(target: any, language: string, namespace: string): TranslationIssue[] {
    const issues: TranslationIssue[] = [];

    const checkObject = (obj: any, prefix: string = '') => {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkObject(obj[key], fullKey);
        } else {
          const translation = obj[key];
          
          // 检查文本长度
          if (translation.length > 50 && namespace !== 'admin') {
            issues.push({
              type: 'technical',
              severity: 'low',
              language,
              namespace,
              key: fullKey,
              original: '',
              translation,
              suggestion: this.suggestShortenedText(translation),
              explanation: '文本过长，可能不适合移动端显示'
            });
          }

          // 检查特殊字符
          if (this.hasInvalidSpecialChars(translation, language)) {
            issues.push({
              type: 'technical',
              severity: 'medium',
              language,
              namespace,
              key: fullKey,
              original: '',
              translation,
              suggestion: this.fixSpecialChars(translation, language),
              explanation: '包含无效的特殊字符'
            });
          }
        }
      }
    };

    checkObject(target);
    return issues;
  }

  /**
   * 检查占位符
   */
  private checkPlaceholders(
    base: any, 
    target: any, 
    language: string, 
    namespace: string
  ): TranslationIssue[] {
    const issues: TranslationIssue[] = [];

    const checkObject = (baseObj: any, targetObj: any, prefix: string = '') => {
      for (const key in baseObj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof baseObj[key] === 'object' && baseObj[key] !== null) {
          if (typeof targetObj[key] === 'object' && targetObj[key] !== null) {
            checkObject(baseObj[key], targetObj[key], fullKey);
          }
        } else {
          const baseText = baseObj[key];
          const targetText = targetObj[key];
          
          // 检查占位符一致性
          const basePlaceholders = this.extractPlaceholders(baseText);
          const targetPlaceholders = this.extractPlaceholders(targetText);
          
          if (basePlaceholders.length > 0 && targetPlaceholders.length > 0) {
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
      }
    };

    checkObject(base, target);
    return issues;
  }

  // 辅助方法
  private isPoorTranslation(original: string, translation: string, language: string): boolean {
    // 简单的质量检查逻辑
    if (!translation || translation.trim().length === 0) return true;
    if (translation === original) return true; // 未翻译
    if (translation.length < original.length * 0.3) return true; // 太短
    if (translation.length > original.length * 3) return true; // 太长
    
    return false;
  }

  private getBetterTranslation(original: string, language: string): string {
    // 根据语言返回更好的翻译建议
    const translations: Record<string, string> = {
      'tg-TJ': this.getTajikTranslation(original),
      'ru-RU': this.getRussianTranslation(original),
      'en-US': this.getEnglishTranslation(original)
    };
    
    return translations[language] || '';
  }

  private extractKeyTerm(key: string): string {
    // 提取关键术语
    const termMap: Record<string, string> = {
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

  private isStandardTerm(term: string, translation: string, language: string): boolean {
    const standardTranslations = this.standardGlossary.get(term);
    if (!standardTranslations) return true;
    
    const standard = standardTranslations[language];
    return standard === translation;
  }

  private getStandardTermTranslation(term: string, language: string): string {
    const standardTranslations = this.standardGlossary.get(term);
    return standardTranslations?.[language] || '';
  }

  private hasUnnaturalTajikExpression(text: string): boolean {
    // 检查不自然的塔吉克语表达
    const unnaturalPatterns = [
      /糖ворт/i, // 错误的词汇
      /давидани дароз/i, // 不自然的组合
      /дубора пахш/i, // 表达不自然
    ];
    
    return unnaturalPatterns.some(pattern => pattern.test(text));
  }

  private hasWrongTajikVocabulary(text: string): boolean {
    // 检查错误的塔吉克语词汇
    const wrongVocab = [
      '糖ворт', // 应该是 саворт
    ];
    
    return wrongVocab.some(word => text.includes(word));
  }

  private getNaturalTajikTranslation(text: string): string {
    // 提供自然的塔吉克语翻译建议
    const improvements: Record<string, string> = {
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

  private getCorrectTajikVocabulary(text: string): string {
    // 提供正确的塔吉克语词汇
    const corrections: Record<string, string> = {
      '糖ворт': 'саворт'
    };
    
    let corrected = text;
    for (const [wrong, correct] of Object.entries(corrections)) {
      corrected = corrected.replace(new RegExp(wrong, 'g'), correct);
    }
    
    return corrected;
  }

  private hasIncorrectFormality(text: string, key: string): boolean {
    // 检查俄语敬语级别
    const informalWords = ['ты', 'тебе', 'тебя'];
    const formalWords = ['вы', 'вам', 'вас'];
    
    // 根据上下文判断应该使用正式还是非正式
    if (key.includes('admin') || key.includes('error')) {
      return informalWords.some(word => text.includes(word));
    }
    
    return false;
  }

  private getCorrectRussianFormality(text: string, key: string): string {
    // 提供正确的俄语敬语形式
    const corrections: Record<string, Record<string, string>> = {
      'admin.welcome': {
        'ты': 'вы',
        'тебе': 'вам',
        'тебя': 'вас'
      }
    };
    
    let corrected = text;
    const correctionsForKey = corrections[key];
    if (correctionsForKey) {
      for (const [informal, formal] of Object.entries(correctionsForKey)) {
        corrected = corrected.replace(new RegExp(informal, 'gi'), formal);
      }
    }
    
    return corrected;
  }

  private hasInvalidSpecialChars(text: string, language: string): boolean {
    // 检查无效的特殊字符
    if (language === 'zh-CN') {
      return !/^[\u4e00-\u9fa5\s\w\-\.\!\?\(\)\[\]\{\}\:\"\'\,\.\;\/\\\-\+]+$/.test(text);
    }
    
    if (language === 'en-US') {
      return !/^[a-zA-Z\s\w\-\.\!\?\(\)\[\]\{\}\:\"\'\,\.\;\/\\\-\+]+$/.test(text);
    }
    
    if (language === 'ru-RU') {
      return !/^[\u0400-\u04FFа-яё\s\w\-\.\!\?\(\)\[\]\{\}\:\"\'\,\.\;\/\\\-\+]+$/iu.test(text);
    }
    
    if (language === 'tg-TJ') {
      return !/^[\u0400-\u04FFӣӯҳқғҷӈӉӟӅӍӉҙҫҡҟҭҵҷҹһӯҷӈҟҳҝҡҵҶҲҳҫӊӉҰҳӆҭӇӈҚӈӬӖҳҢҭӇҸӔүӍӜӍӆҺӂӈҖҳҖҴҙӭӈӝҶҗҵҡӭӍӘӆӃӱӨҼ ҫҵӴҖЎӵӄӔӓІіІӅғĀĂĄĆĊĈĊĖĒĜĞĠĢĤĦĨĪĬĮİĲĴĶĹĻĽĿŁŃŅŇŊŌŎŐŒŔŖŚŜŞŤŦŨŪŬŮŰŲŴŶŹŽẀẂẄỲỸḤḤṢṬṰṶẆẊẊẎ◦·•─━│┌┐└┘├┤┬┴┼║═╗╗╔╚╝\s\w\-\.\!\?\(\)\[\]\{\}\:\"\'\,\.\;\/\\\-\+]+$/iu.test(text);
    }
    
    return false;
  }

  private fixSpecialChars(text: string, language: string): string {
    // 修复特殊字符
    if (language === 'tg-TJ') {
      return text.replace(/糖ворт/g, 'саворт');
    }
    
    return text;
  }

  private extractPlaceholders(text: string): string[] {
    const matches = text.match(/\{\{?\w+\}?\}/g);
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
  }

  private suggestShortenedText(text: string): string {
    // 建议缩短文本
    if (text.length > 50) {
      return text.substring(0, 47) + '...';
    }
    return text;
  }

  private calculateMetrics(issues: TranslationIssue[]): QualityMetrics {
    const totalIssues = issues.length;
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    const lowIssues = issues.filter(i => i.severity === 'low').length;

    // 计算各项分数 (简单算法)
    const accuracy = Math.max(0, 100 - (criticalIssues * 30 + highIssues * 20 + mediumIssues * 10));
    const consistency = Math.max(0, 100 - (highIssues * 25 + mediumIssues * 15 + lowIssues * 5));
    const fluency = Math.max(0, 100 - (mediumIssues * 10 + lowIssues * 5));
    const cultural = Math.max(0, 100 - (highIssues * 20 + mediumIssues * 10));
    const technical = Math.max(0, 100 - (criticalIssues * 40 + mediumIssues * 15 + lowIssues * 5));

    const overall = Math.round((accuracy + consistency + fluency + cultural + technical) / 5);

    return {
      accuracy,
      consistency,
      fluency,
      cultural,
      technical,
      overall
    };
  }

  private generateSuggestions(issues: TranslationIssue[], language: string, namespace: string): string[] {
    const suggestions: string[] = [];
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

    // 按问题类型给出建议
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const accuracyCount = issues.filter(i => i.type === 'accuracy').length;
    const culturalCount = issues.filter(i => i.type === 'cultural').length;

    if (criticalCount > 0) {
      suggestions.push(`存在${criticalCount}个严重问题，需要立即修复`);
    }

    if (accuracyCount > 0) {
      suggestions.push(`检查${accuracyCount}个准确性问题的翻译`);
    }

    if (culturalCount > 0 && language === 'tg-TJ') {
      suggestions.push(`重点关注塔吉克语文化适应性改进`);
    }

    return suggestions;
  }

  private generateImprovedVersion(translation: any, issues: TranslationIssue[], language: string): any {
    const improved = JSON.parse(JSON.stringify(translation)); // 深拷贝

    issues.forEach(issue => {
      if (issue.suggestion) {
        // 应用改进建议
        this.setNestedValue(improved, issue.key, issue.suggestion);
      }
    });

    return improved;
  }

  private setNestedValue(obj: any, path: string, value: string): void {
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

  private determineStatus(metrics: QualityMetrics, issues: TranslationIssue[]): 'passed' | 'warning' | 'failed' {
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

  private getTajikTranslation(original: string): string {
    // 塔吉克语翻译建议
    const tajikTranslations: Record<string, string> = {
      'currency': 'пул',
      'amount': 'маблағ',
      'balance': 'баланс',
      'recharge': 'пардохт',
      'withdraw': 'кашондан'
    };
    return tajikTranslations[original] || '';
  }

  private getRussianTranslation(original: string): string {
    // 俄语翻译建议
    const russianTranslations: Record<string, string> = {
      'currency': 'валюта',
      'amount': 'сумма',
      'balance': 'баланс',
      'recharge': 'пополнение',
      'withdraw': 'вывод'
    };
    return russianTranslations[original] || '';
  }

  private getEnglishTranslation(original: string): string {
    // 英语翻译建议
    const englishTranslations: Record<string, string> = {
      'currency': 'currency',
      'amount': 'amount',
      'balance': 'balance',
      'recharge': 'recharge',
      'withdraw': 'withdraw'
    };
    return englishTranslations[original] || '';
  }
}

export default TranslationProofreader;