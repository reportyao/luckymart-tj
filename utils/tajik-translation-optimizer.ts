/**
 * 塔吉克语翻译优化工具
 * 识别不合适的机器翻译，提供更自然和准确的翻译建议
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface TranslationSuggestion {
  key: string;
  currentTranslation: string;
  suggestedTranslation: string;
  reason: string;
  category: 'grammar' | 'terminology' | 'naturalness' | 'cultural' | 'technical';
  confidence: number; // 0-100
}

interface OptimizationResult {
  file: string;
  totalKeys: number;
  optimizedKeys: number;
  suggestions: TranslationSuggestion[];
  improvements: {
    grammar: number;
    terminology: number;
    naturalness: number;
    cultural: number;
    technical: number;
  };
}

interface TranslationOptimizerConfig {
  enableAutoOptimize: boolean;
  confidenceThreshold: number;
  preserveExistingQuality: boolean;
  culturalAdaptationLevel: 'basic' | 'enhanced' | 'native';
  terminologyStrictness: 'loose' | 'moderate' | 'strict';
}

export class TajikTranslationOptimizer {
  private localesPath: string;
  private config: TranslationOptimizerConfig;
  private optimizedCount = 0;

  // 塔吉克语术语标准表
  private standardTerminology = {
    // 核心业务术语
    'coin': 'тангаи бахт',
    'coins': 'тангаҳои бахт', 
    'share': 'ҳисса',
    'shares': 'ҳиссаҳо',
    'balance': 'баланс',
    'withdraw': 'пардохт',
    'recharge': 'пулгузорӣ',
    'lottery': 'қисмат',
    'lottery_result': 'натиҷаи қисмат',
    'reward': 'ҷойиз',
    'prize': 'мукофот',
    'order': 'фармоиш',
    'order_number': 'рақами фармоиш',
    'product': 'маҳсулот',
    'price': 'нарх',
    'market_price': 'нархи бозор',
    'discount': 'тахфиф',
    'promotion': 'тадбири таблиғот',
    
    // 货币和金融
    'currency': 'сомонӣ',
    'tjs': 'сомонӣ',
    'somoni': 'сомонӣ',
    'amount': 'маблағ',
    'payment': 'пардохт',
    'transaction': 'амлиёт',
    'transfer': 'интиқол',
    
    // 用户界面
    'login': 'вход',
    'logout': 'баромадан',
    'register': 'сабтшудӣ',
    'profile': 'профил',
    'settings': 'танзимот',
    'notification': 'огоҳинома',
    'message': 'паём',
    'alert': 'ҳушдор',
    'error': 'хато',
    'success': 'муваффақият',
    'warning': 'диққат',
    'info': 'маълумот',
    
    // 动作和操作
    'click': 'пахш кардан',
    'tap': 'лоиқа кардан',
    'swipe': 'ҳаракат кардан',
    'select': 'интихоб кардан',
    'confirm': 'тасдиқ кардан',
    'cancel': 'бекор кардан',
    'save': 'сабт кардан',
    'delete': 'нест кардан',
    'edit': 'таҳрир кардан',
    'add': 'илова кардан',
    'remove': 'хориҷ кардан',
    'view': 'дидани',
    'show': 'нишон додан',
    'hide': 'пинҳон кардан',
    
    // 时间相关
    'date': 'сана',
    'time': 'вақт',
    'today': 'имрӯз',
    'yesterday': 'дирӯз',
    'tomorrow': 'фардо',
    'now': 'ҳоло',
    'soon': 'ба зудӣ',
    'later': 'баъдтар',
    'soon': 'ба зудӣ',
    
    // 状态和描述
    'active': 'фаъол',
    'inactive': 'ғайрифаъол',
    'enabled': 'фаъолшуда',
    'disabled': 'ғайрифаъолшуда',
    'available': 'дастрас',
    'unavailable': 'дастраснабуда',
    'valid': 'дуруст',
    'invalid': 'нодуруст',
    'empty': 'холӣ',
    'full': 'пур',
    'open': 'кушода',
    'closed': 'пӯшида',
    'online': 'онлайн',
    'offline': 'офлайн',
    
    // 数量和度量
    'total': 'умумӣ',
    'count': 'шумор',
    'number': 'рақам',
    'quantity': 'миқдор',
    'amount': 'маблағ',
    'percentage': 'фоиз',
    'rate': 'қимат',
    'speed': 'суръат',
    'duration': 'муддат',
    'size': 'андоза',
    'weight': 'вазн',
    'length': 'дарозӣ',
    'width': 'бар',
    'height': 'баландӣ',
    
    // 位置和方向
    'left': 'чап',
    'right': 'рост',
    'top': 'боло',
    'bottom': 'поён',
    'center': 'марказ',
    'front': 'пеш',
    'back': 'қафо',
    'inside': 'дохил',
    'outside': 'берун',
    'up': 'боло',
    'down': 'поён'
  };

  // 自然表达模式
  private naturalExpressions = {
    // 问候语优化
    'welcome': [
      { from: /Хуш омадед/g, to: 'Хуш омадед ба LuckyMart TJ' }
    ],
    
    // 感谢表达
    'thank_you': [
      { from: /Ташаккур/g, to: 'Ташаккур барои интихоби мо' },
      { from: /Ташаккур/g, to: 'Миннатдор ҳастем' }
    ],
    
    // 礼貌请求
    'please': [
      { from: /Лутфан/g, to: 'Лутфан, инро иҷро кунед' }
    ],
    
    // 商业表达
    'buy_now': [
      { from: /харидан/g, to: 'харидани фаврӣ' },
      { from: /сабт/g, to: 'сабткунӣ' }
    ]
  };

  // 语法优化规则
  private grammarRules = [
    {
      pattern: /(\w+)\s+\1/gi, // 重复词汇
      replacement: '$1',
      description: '移除重复词汇'
    },
    {
      pattern: /(\w+)(ся|сия|сон|сонӣ)\s+(\w+)/gi, // 不当的副词后缀
      replacement: '$1 $3',
      description: '修正副词形式'
    },
    {
      pattern: /(\w+)(да|де|до|ду)\s+(\w+)/gi, // 不当的形容词后缀
      replacement: '$1 $3',
      description: '修正形容词形式'
    }
  ];

  constructor(projectRoot: string, config?: Partial<TranslationOptimizerConfig>) {
    this.localesPath = path.join(projectRoot, 'src', 'locales', 'tg-TJ');
    this.config = {
      enableAutoOptimize: false,
      confidenceThreshold: 70,
      preserveExistingQuality: true,
      culturalAdaptationLevel: 'enhanced',
      terminologyStrictness: 'moderate',
      ...config
    };
  }

  /**
   * 优化塔吉克语翻译
   */
  async optimizeTranslation(): Promise<OptimizationResult[]> {
    const files = await this.getTranslationFiles();
    const results: OptimizationResult[] = [];

    for (const file of files) {
      const result = await this.optimizeFile(file);
      results.push(result);
      this.optimizedCount += result.optimizedKeys;
    }

    return results;
  }

  /**
   * 优化单个文件
   */
  private async optimizeFile(fileName: string): Promise<OptimizationResult> {
    const filePath = path.join(this.localesPath, fileName);
    const content = await fs.readFile(filePath, 'utf-8');
    const translations = JSON.parse(content);
    
    const suggestions: TranslationSuggestion[] = [];
    
    // 检查术语一致性
    suggestions.push(...this.optimizeTerminology(translations));
    
    // 检查语法正确性
    suggestions.push(...this.optimizeGrammar(translations));
    
    // 检查表达自然度
    suggestions.push(...this.optimizeNaturalness(translations));
    
    // 检查文化适应性
    suggestions.push(...this.optimizeCulturalAdaptation(translations));
    
    // 检查技术术语
    suggestions.push(...this.optimizeTechnicalTerms(translations));

    const improvements = this.calculateImprovements(suggestions);
    const optimizedKeys = suggestions.filter(s => s.confidence >= this.config.confidenceThreshold).length;

    return {
      file: fileName,
      totalKeys: this.countKeys(translations),
      optimizedKeys,
      suggestions,
      improvements
    };
  }

  /**
   * 优化术语一致性
   */
  private optimizeTerminology(translations: any): TranslationSuggestion[] {
    const suggestions: TranslationSuggestion[] = [];
    
    const allText = this.extractTextValues(translations);
    
    for (const [englishTerm, tajikTerm] of Object.entries(this.standardTerminology)) {
      // 检查不一致的翻译
      const inconsistentTranslations = allText.filter(text => {
        const lowerText = text.toLowerCase();
        return (lowerText.includes(englishTerm.toLowerCase()) || 
                this.findTermVariants(text, englishTerm)) &&
               !lowerText.includes(tajikTerm.toLowerCase());
      });

      inconsistentTranslations.forEach(text => {
        const suggestedText = this.suggestTermReplacement(text, englishTerm, tajikTerm);
        if (suggestedText !== text) {
          suggestions.push({
            key: this.findKeyForText(translations, text),
            currentTranslation: text,
            suggestedTranslation: suggestedText,
            reason: `术语 "${englishTerm}" 应统一翻译为 "${tajikTerm}"`,
            category: 'terminology',
            confidence: this.calculateTerminologyConfidence(text, englishTerm, tajikTerm)
          });
        }
      });
    }

    return suggestions;
  }

  /**
   * 优化语法
   */
  private optimizeGrammar(translations: any): TranslationSuggestion[] {
    const suggestions: TranslationSuggestion[] = [];
    
    this.grammarRules.forEach(rule => {
      const allText = this.extractTextValues(translations);
      
      allText.forEach(text => {
        if (rule.pattern.test(text)) {
          const suggestedText = text.replace(rule.pattern, rule.replacement);
          if (suggestedText !== text) {
            suggestions.push({
              key: this.findKeyForText(translations, text),
              currentTranslation: text,
              suggestedTranslation: suggestedText,
              reason: rule.description,
              category: 'grammar',
              confidence: 85
            });
          }
        }
      });
    });

    return suggestions;
  }

  /**
   * 优化表达自然度
   */
  private optimizeNaturalness(translations: any): TranslationSuggestion[] {
    const suggestions: TranslationSuggestion[] = [];
    const allText = this.extractTextValues(translations);
    
    // 检查常见的机器翻译特征
    const machineTranslationPatterns = [
      {
        pattern: /(\w+)\s+(\w+)\s+кардан/gi, // 动词+名词+кардан 结构
        replacement: (match: string, verb: string, noun: string) => {
          // 尝试使用更自然的表达
          const naturalForms: Record<string, string> = {
            'дида кардан': 'бинед',
            'кушодан кардан': 'кушоед',
            'сабт кардан': 'сабт кунед',
            'харидан кардан': 'харед'
          };
          return naturalForms[`${noun} кардан`] || match;
        },
        reason: '使用更自然的动词形式'
      },
      {
        pattern: /маҳз\s+(\w+)/gi, // 过度使用"маҳз"
        replacement: 'ин',
        reason: '减少不必要的强调词'
      },
      {
        pattern: /ба\s+таври\s+(аъло|хуб|дуруст)/gi, // 过度正式的表达
        replacement: (match: string, adverb: string) => {
          const informalForms: Record<string, string> = {
            'аъло': 'хуб',
            'дуруст': 'дуруст'
          };
          return informalForms[adverb] || match;
        },
        reason: '使用更自然的口语表达'
      }
    ];

    allText.forEach(text => {
      machineTranslationPatterns.forEach(pattern => {
        const matches = text.match(pattern.pattern);
        if (matches) {
          let suggestedText = text;
          matches.forEach(match => {
            if (typeof pattern.replacement === 'function') {
              const args = match.match(/(\w+)/g) || [];
              suggestedText = suggestedText.replace(match, pattern.replacement(match, ...args));
            } else {
              suggestedText = suggestedText.replace(pattern.pattern, pattern.replacement);
            }
          });

          if (suggestedText !== text) {
            suggestions.push({
              key: this.findKeyForText(translations, text),
              currentTranslation: text,
              suggestedTranslation: suggestedText,
              reason: pattern.reason,
              category: 'naturalness',
              confidence: 75
            });
          }
        }
      });
    });

    return suggestions;
  }

  /**
   * 优化文化适应性
   */
  private optimizeCulturalAdaptation(translations: any): TranslationSuggestion[] {
    const suggestions: TranslationSuggestion[] = [];
    const allText = this.extractTextValues(translations);
    
    // 文化适应性检查
    const culturalOptimizations = [
      {
        pattern: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}\b/g, // 日期格式
        replacement: (match: string) => {
          const parts = match.split(/[\/.-]/);
          if (parts.length === 3) {
            return `${parts[0]}.${parts[1]}.${parts[2]}`;
          }
          return match;
        },
        reason: '使用塔吉克斯坦标准日期格式 (dd.mm.yyyy)'
      },
      {
        pattern: /TJS\b/g, // 货币代码
        replacement: 'сомонӣ',
        reason: '使用本地货币表达习惯'
      },
      {
        pattern: /\b\d{1,3}(,\d{3})*\b/g, // 数字格式
        replacement: (match: string) => {
          // 确保使用逗号作为千位分隔符
          return match.replace(/\./g, ',');
        },
        reason: '使用塔吉克斯坦数字格式'
      },
      {
        pattern: /АҚШ\b/g, // 美国简写
        replacement: 'Иёлоти Муттаҳида',
        reason: '使用完整的国家名称'
      },
      {
        pattern: /ЕС\b/g, // 欧盟简写
        replacement: 'Иттиҳоди Аврупо',
        reason: '使用完整的组织名称'
      }
    ];

    allText.forEach(text => {
      culturalOptimizations.forEach(opt => {
        const matches = text.match(opt.pattern);
        if (matches) {
          let suggestedText = text;
          matches.forEach(match => {
            if (typeof opt.replacement === 'function') {
              suggestedText = suggestedText.replace(match, opt.replacement(match));
            } else {
              suggestedText = suggestedText.replace(opt.pattern, opt.replacement);
            }
          });

          if (suggestedText !== text) {
            suggestions.push({
              key: this.findKeyForText(translations, text),
              currentTranslation: text,
              suggestedTranslation: suggestedText,
              reason: opt.reason,
              category: 'cultural',
              confidence: 90
            });
          }
        }
      });
    });

    return suggestions;
  }

  /**
   * 优化技术术语
   */
  private optimizeTechnicalTerms(translations: any): TranslationSuggestion[] {
    const suggestions: TranslationSuggestion[] = [];
    const allText = this.extractTextValues(translations);
    
    const technicalTerminology = {
      // 技术术语
      'API': {
        preferred: 'API (Асоси Пойгоҳи Иттилоот)',
        explanation: '在塔吉克语中应添加解释性描述'
      },
      'UI': {
        preferred: 'Интерфейси Корбари',
        explanation: '使用完整的技术术语'
      },
      'URL': {
        preferred: 'Суроғаи Интернетӣ',
        explanation: '塔吉克语技术术语'
      },
      'email': {
        preferred: 'Почтаи Электронӣ',
        explanation: '标准技术术语'
      },
      'database': {
        preferred: 'Пойгоҳи Додаҳо',
        explanation: '数据库的标准术语'
      },
      'server': {
        preferred: 'Сервер',
        explanation: '保持国际通用术语，但可以添加本地化描述'
      },
      'download': {
        preferred: 'Боркунӣ',
        explanation: '塔吉克语本地表达'
      },
      'upload': {
        preferred: 'Боркунӣ',
        explanation: '塔吉克语本地表达'
      },
      'login': {
        preferred: 'Воридшавӣ',
        explanation: '标准技术术语'
      },
      'logout': {
        preferred: 'Баромадан',
        explanation: '标准技术术语'
      }
    };

    Object.entries(technicalTerminology).forEach(([english, info]) => {
      const incorrectUsage = allText.filter(text => 
        text.toLowerCase().includes(english.toLowerCase()) && 
        !text.includes(info.preferred)
      );

      incorrectUsage.forEach(text => {
        const suggestedText = text.replace(
          new RegExp(english, 'gi'), 
          info.preferred
        );

        if (suggestedText !== text) {
          suggestions.push({
            key: this.findKeyForText(translations, text),
            currentTranslation: text,
            suggestedTranslation: suggestedText,
            reason: info.explanation,
            category: 'technical',
            confidence: 80
          });
        }
      });
    });

    return suggestions;
  }

  /**
   * 自动应用优化建议
   */
  async applyOptimizations(results: OptimizationResult[]): Promise<void> {
    for (const result of results) {
      const highConfidenceSuggestions = result.suggestions.filter(
        s => s.confidence >= this.config.confidenceThreshold
      );

      if (highConfidenceSuggestions.length === 0) continue;

      const filePath = path.join(this.localesPath, result.file);
      const content = await fs.readFile(filePath, 'utf-8');
      let translations = JSON.parse(content);

      // 应用每个建议
      for (const suggestion of highConfidenceSuggestions) {
        translations = this.applySuggestion(translations, suggestion);
      }

      // 保存优化后的文件
      await fs.writeFile(
        filePath,
        JSON.stringify(translations, null, 2),
        'utf-8'
      );
    }
  }

  /**
   * 应用单个优化建议
   */
  private applySuggestion(translations: any, suggestion: TranslationSuggestion): any {
    // 查找并替换指定文本
    return this.replaceTextInObject(translations, suggestion.key, suggestion.currentTranslation, suggestion.suggestedTranslation);
  }

  /**
   * 在对象中替换文本
   */
  private replaceTextInObject(obj: any, keyPath: string, oldText: string, newText: string): any {
    if (typeof obj === 'string') {
      return obj.replace(oldText, newText);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.replaceTextInObject(item, keyPath, oldText, newText));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replaceTextInObject(value, keyPath, oldText, newText);
      }
      return result;
    }
    
    return obj;
  }

  /**
   * 辅助方法
   */
  
  private extractTextValues(obj: any, prefix: string = ''): string[] {
    const values: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string') {
        values.push(value);
      } else if (typeof value === 'object' && value !== null) {
        values.push(...this.extractTextValues(value, fullKey));
      }
    }
    
    return values;
  }

  private findKeyForText(obj: any, text: string, prefix: string = ''): string {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string' && value === text) {
        return fullKey;
      }
      
      if (typeof value === 'object' && value !== null) {
        const found = this.findKeyForText(value, text, fullKey);
        if (found) return found;
      }
    }
    return '';
  }

  private countKeys(obj: any, prefix: string = ''): number {
    let count = 0;
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string') {
        count++;
      } else if (typeof value === 'object' && value !== null) {
        count += this.countKeys(value, fullKey);
      }
    }
    
    return count;
  }

  private findTermVariants(text: string, term: string): boolean {
    const variants = [
      term,
      term.charAt(0).toUpperCase() + term.slice(1),
      term.toLowerCase(),
      term.toUpperCase()
    ];
    
    return variants.some(variant => text.includes(variant));
  }

  private suggestTermReplacement(text: string, englishTerm: string, tajikTerm: string): string {
    let result = text;
    
    // 替换各种变体
    const variants = [
      englishTerm,
      englishTerm.charAt(0).toUpperCase() + englishTerm.slice(1),
      englishTerm.toLowerCase(),
      englishTerm.toUpperCase()
    ];
    
    variants.forEach(variant => {
      const regex = new RegExp(variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      result = result.replace(regex, tajikTerm);
    });
    
    return result;
  }

  private calculateTerminologyConfidence(text: string, englishTerm: string, tajikTerm: string): number {
    const textLower = text.toLowerCase();
    const termLower = englishTerm.toLowerCase();
    
    if (textLower.includes(tajikTerm.toLowerCase())) {
      return 100; // 已经使用正确术语
    }
    
    if (textLower.includes(termLower)) {
      return 90; // 包含英文术语，需要替换
    }
    
    return 50; // 不确定，建议检查
  }

  private async getTranslationFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.localesPath);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      console.error('Error reading translation files:', error);
      return [];
    }
  }

  private calculateImprovements(suggestions: TranslationSuggestion[]) {
    return {
      grammar: suggestions.filter(s => s.category === 'grammar').length,
      terminology: suggestions.filter(s => s.category === 'terminology').length,
      naturalness: suggestions.filter(s => s.category === 'naturalness').length,
      cultural: suggestions.filter(s => s.category === 'cultural').length,
      technical: suggestions.filter(s => s.category === 'technical').length
    };
  }

  /**
   * 生成优化报告
   */
  generateOptimizationReport(results: OptimizationResult[]): string {
    let report = `# 塔吉克语翻译优化报告\n\n`;
    report += `## 总体统计\n\n`;
    
    const totalKeys = results.reduce((sum, r) => sum + r.totalKeys, 0);
    const totalOptimized = results.reduce((sum, r) => sum + r.optimizedKeys, 0);
    const totalSuggestions = results.reduce((sum, r) => sum + r.suggestions.length, 0);
    
    report += `- 总翻译键数: ${totalKeys}\n`;
    report += `- 已优化键数: ${totalOptimized}\n`;
    report += `- 总建议数: ${totalSuggestions}\n`;
    report += `- 优化率: ${((totalOptimized / totalKeys) * 100).toFixed(1)}%\n\n`;
    
    report += `## 详细优化结果\n\n`;
    
    results.forEach(result => {
      report += `### ${result.file}\n`;
      report += `- 翻译键数: ${result.totalKeys}\n`;
      report += `- 优化键数: ${result.optimizedKeys}\n`;
      report += `- 建议数: ${result.suggestions.length}\n\n`;
      
      if (result.suggestions.length > 0) {
        report += `#### 优化建议:\n`;
        result.suggestions.forEach(suggestion => {
          report += `- **${suggestion.category.toUpperCase()}** (置信度: ${suggestion.confidence}%)\n`;
          report += `  - 键: ${suggestion.key}\n`;
          report += `  - 当前: "${suggestion.currentTranslation}"\n`;
          report += `  - 建议: "${suggestion.suggestedTranslation}"\n`;
          report += `  - 原因: ${suggestion.reason}\n\n`;
        });
      }
    });
    
    // 统计各类别改进
    const totalImprovements = results.reduce((sum, r) => ({
      grammar: sum.grammar + r.improvements.grammar,
      terminology: sum.terminology + r.improvements.terminology,
      naturalness: sum.naturalness + r.improvements.naturalness,
      cultural: sum.cultural + r.improvements.cultural,
      technical: sum.technical + r.improvements.technical
    }), { grammar: 0, terminology: 0, naturalness: 0, cultural: 0, technical: 0 });
    
    report += `## 改进统计\n\n`;
    report += `- 语法改进: ${totalImprovements.grammar}\n`;
    report += `- 术语优化: ${totalImprovements.terminology}\n`;
    report += `- 自然度提升: ${totalImprovements.naturalness}\n`;
    report += `- 文化适应: ${totalImprovements.cultural}\n`;
    report += `- 技术术语: ${totalImprovements.technical}\n`;
    
    return report;
  }
}

// 使用示例
async function main() {
  const optimizer = new TajikTranslationOptimizer(process.cwd(), {
    enableAutoOptimize: false,
    confidenceThreshold: 70,
    culturalAdaptationLevel: 'enhanced'
  });
  
  const results = await optimizer.optimizeTranslation();
  const report = optimizer.generateOptimizationReport(results);
  
  console.log(report);
  
  // 如果启用自动优化
  if (optimizer['config'].enableAutoOptimize) {
    await optimizer.applyOptimizations(results);
    console.log('\n✅ 已应用优化建议');
  }
}

if (require.main === module) {
  main().catch(console.error);
}