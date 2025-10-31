/**
 * 塔吉克语本土化评估工具
 * 评估塔吉克语翻译的本土化程度、文化适应性和表达习惯
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface LocalizationIssue {
  file: string;
  key: string;
  issueType: 'missing_translation' | 'poor_localization' | 'cultural_mismatch' | 'incorrect_terminology';
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  currentValue?: string;
}

interface LocalizationScore {
  file: string;
  completeness: number; // 0-100
  accuracy: number; // 0-100
  culturalAdaptation: number; // 0-100
  naturalness: number; // 0-100
  overallScore: number; // 0-100
  issues: LocalizationIssue[];
}

interface TajikLocalizationAssessment {
  overallScore: number;
  fileScores: LocalizationScore[];
  criticalIssues: LocalizationIssue[];
  recommendations: string[];
  culturalAnalysis: {
    dateFormats: string[];
    numberFormats: string[];
    currencyFormats: string[];
    greetingStyles: string[];
    politenessLevel: 'formal' | 'informal' | 'mixed';
  };
}

export class TajikLocalizationEvaluator {
  private localesPath: string;
  private tajikSpecificTerms: Map<string, string> = new Map([
    // 货币相关
    ['currency', 'сомонӣ (TJS)'],
    ['tjs', 'сомонӣ'],
    
    // 数字和单位
    ['share', 'ҳисса'],
    ['shares', 'ҳиссаҳо'],
    ['coin', 'танга'],
    ['coins', 'тангаҳо'],
    
    // 常用术语
    ['balance', 'баланс'],
    ['withdraw', 'пардохт'],
    ['recharge', 'пулгузорӣ'],
    ['order', 'фармоиш'],
    ['lottery', 'қисмат'],
    ['reward', 'ҷойиз'],
    
    // 问候和礼貌用语
    ['welcome', 'хуш омадед'],
    ['thank_you', 'ташаккур'],
    ['please', 'лутфан'],
    ['sorry', 'маъбад'],
  ]);

  private culturalAdaptationPatterns = {
    // 日期格式 - 塔吉克斯坦使用 dd.mm.yyyy
    dateFormat: /(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/,
    preferredDateFormat: 'dd.mm.yyyy',
    
    // 数字分隔符 - 塔吉克斯坦使用逗号作为千位分隔符
    numberFormat: /(\d+)(\.\d{3})+/,
    preferredNumberFormat: '1,234.56',
    
    // 货币格式
    currencyFormat: /(\d+(?:\.\d{2})?)\s*(?:TJS|Somoni)/,
    preferredCurrencyFormat: '1,234.56 сомонӣ',
    
    // 礼貌用语检查
    politePhrases: [
      'лутфан', // please
      'ташаккур', // thank you
      'маъбад', // sorry
      'изҳии мутоиба', // excuse me
    ]
  };

  constructor(projectRoot: string) {
    this.localesPath = path.join(projectRoot, 'src', 'locales', 'tg-TJ');
  }

  /**
   * 评估塔吉克语翻译的本土化程度
   */
  async evaluateLocalization(): Promise<TajikLocalizationAssessment> {
    const files = await this.getTranslationFiles();
    const fileScores: LocalizationScore[] = [];
    const allIssues: LocalizationIssue[] = [];
    
    // 检查每个翻译文件
    for (const file of files) {
      const score = await this.evaluateFile(file);
      fileScores.push(score);
      allIssues.push(...score.issues);
    }

    // 计算总体评分
    const overallScore = this.calculateOverallScore(fileScores);
    
    // 识别关键问题
    const criticalIssues = allIssues.filter(issue => issue.severity === 'high');
    
    // 生成建议
    const recommendations = this.generateRecommendations(fileScores, criticalIssues);
    
    // 文化分析
    const culturalAnalysis = this.analyzeCulturalAdaptation(files);

    return {
      overallScore,
      fileScores,
      criticalIssues,
      recommendations,
      culturalAnalysis
    };
  }

  /**
   * 评估单个翻译文件
   */
  private async evaluateFile(fileName: string): Promise<LocalizationScore> {
    const filePath = path.join(this.localesPath, fileName);
    const content = await fs.readFile(filePath, 'utf-8');
    const translations = JSON.parse(content);
    
    const issues: LocalizationIssue[] = [];
    let completeness = 0;
    let accuracy = 0;
    let culturalAdaptation = 0;
    let naturalness = 0;

    // 检查翻译完整性
    const completenessResult = this.checkCompleteness(translations);
    completeness = completenessResult.score;
    issues.push(...completenessResult.issues);

    // 检查翻译准确性
    const accuracyResult = this.checkAccuracy(translations, fileName);
    accuracy = accuracyResult.score;
    issues.push(...accuracyResult.issues);

    // 检查文化适应性
    const culturalResult = this.checkCulturalAdaptation(translations);
    culturalAdaptation = culturalResult.score;
    issues.push(...culturalResult.issues);

    // 检查表达自然度
    const naturalnessResult = this.checkNaturalness(translations);
    naturalness = naturalnessResult.score;
    issues.push(...naturalnessResult.issues);

    const overallScore = Math.round((completeness + accuracy + culturalAdaptation + naturalness) / 4);

    return {
      file: fileName,
      completeness,
      accuracy,
      culturalAdaptation,
      naturalness,
      overallScore,
      issues
    };
  }

  /**
   * 检查翻译完整性
   */
  private checkCompleteness(translations: any): { score: number; issues: LocalizationIssue[] } {
    const issues: LocalizationIssue[] = [];
    const keys = Object.keys(translations);
    
    // 检查是否有中文内容（翻译不完整）
    const chineseKeys = keys.filter(key => {
      const value = this.getDeepValue(translations, key);
      return typeof value === 'string' && /[\u4e00-\u9fff]/.test(value);
    });

    if (chineseKeys.length > 0) {
      issues.push({
        file: '', // 将在外层填充
        key: chineseKeys.join(', '),
        issueType: 'missing_translation',
        severity: 'high',
        description: `发现 ${chineseKeys.length} 个键值仍然使用中文，需要翻译为塔吉克语`,
        suggestion: '请将这些中文内容翻译为适当的塔吉克语表达'
      });
    }

    // 检查缺失的翻译
    const emptyKeys = keys.filter(key => {
      const value = this.getDeepValue(translations, key);
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (emptyKeys.length > 0) {
      issues.push({
        file: '',
        key: emptyKeys.join(', '),
        issueType: 'missing_translation',
        severity: 'medium',
        description: `发现 ${emptyKeys.length} 个键值为空`,
        suggestion: '请为这些键提供塔吉克语翻译'
      });
    }

    const totalKeys = keys.length;
    const missingCount = chineseKeys.length + emptyKeys.length;
    const score = Math.max(0, 100 - (missingCount / totalKeys) * 100);

    return { score, issues };
  }

  /**
   * 检查翻译准确性
   */
  private checkAccuracy(translations: any, fileName: string): { score: number; issues: LocalizationIssue[] } {
    const issues: LocalizationIssue[] = [];
    let totalChecks = 0;
    let passedChecks = 0;

    // 检查术语一致性
    const termIssues = this.checkTerminologyConsistency(translations);
    issues.push(...termIssues);
    totalChecks += termIssues.length;
    passedChecks += termIssues.filter(i => i.severity === 'low').length;

    // 检查语法正确性
    const grammarIssues = this.checkGrammar(translations);
    issues.push(...grammarIssues);
    totalChecks += grammarIssues.length;
    passedChecks += grammarIssues.filter(i => i.severity === 'low').length;

    const score = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;
    return { score, issues };
  }

  /**
   * 检查文化适应性
   */
  private checkCulturalAdaptation(translations: any): { score: number; issues: LocalizationIssue[] } {
    const issues: LocalizationIssue[] = [];
    const stringValues = this.extractStringValues(translations);
    
    let adaptationScore = 100;

    // 检查日期格式
    const dateFormatIssues = this.checkDateFormats(stringValues);
    issues.push(...dateFormatIssues);
    if (dateFormatIssues.length > 0) {
      adaptationScore -= dateFormatIssues.length * 5;
    }

    // 检查数字格式
    const numberFormatIssues = this.checkNumberFormats(stringValues);
    issues.push(...numberFormatIssues);
    if (numberFormatIssues.length > 0) {
      adaptationScore -= numberFormatIssues.length * 3;
    }

    // 检查货币格式
    const currencyIssues = this.checkCurrencyFormats(stringValues);
    issues.push(...currencyIssues);
    if (currencyIssues.length > 0) {
      adaptationScore -= currencyIssues.length * 5;
    }

    // 检查礼貌用语
    const politenessIssues = this.checkPoliteness(stringValues);
    issues.push(...politenessIssues);
    if (politenessIssues.length > 0) {
      adaptationScore -= politenessIssues.length * 2;
    }

    return { 
      score: Math.max(0, adaptationScore), 
      issues 
    };
  }

  /**
   * 检查表达自然度
   */
  private checkNaturalness(translations: any): { score: number; issues: LocalizationIssue[] } {
    const issues: LocalizationIssue[] = [];
    const stringValues = this.extractStringValues(translations);
    
    let naturalnessScore = 100;

    // 检查是否使用了不自然的直译
    const literalTranslationIssues = this.checkLiteralTranslations(stringValues);
    issues.push(...literalTranslationIssues);
    if (literalTranslationIssues.length > 0) {
      naturalnessScore -= literalTranslationIssues.length * 8;
    }

    // 检查句子结构
    const structureIssues = this.checkSentenceStructure(stringValues);
    issues.push(...structureIssues);
    if (structureIssues.length > 0) {
      naturalnessScore -= structureIssues.length * 5;
    }

    // 检查词汇选择
    const vocabularyIssues = this.checkVocabularyChoice(stringValues);
    issues.push(...vocabularyIssues);
    if (vocabularyIssues.length > 0) {
      naturalnessScore -= vocabularyIssues.length * 3;
    }

    return { 
      score: Math.max(0, naturalnessScore), 
      issues 
    };
  }

  /**
   * 检查术语一致性
   */
  private checkTerminologyConsistency(translations: any): LocalizationIssue[] {
    const issues: LocalizationIssue[] = [];
    const stringValues = this.extractStringValues(translations);

    // 检查关键术语的使用一致性
    for (const [english, tajik] of this.tajikSpecificTerms.entries()) {
      const variants = [
        english.toLowerCase(),
        english.charAt(0).toUpperCase() + english.slice(1),
        ...english.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1))
      ];

      const foundInconsistentTerms = stringValues.filter(value => {
        return variants.some(variant => 
          value.toLowerCase().includes(variant.toLowerCase()) && 
          !value.toLowerCase().includes(tajik.toLowerCase())
        );
      });

      if (foundInconsistentTerms.length > 0) {
        issues.push({
          file: '',
          key: 'terminology_consistency',
          issueType: 'incorrect_terminology',
          severity: 'medium',
          description: `术语 "${english}" 应该统一翻译为 "${tajik}"`,
          suggestion: `请将所有 "${english}" 的翻译统一为 "${tajik}"`,
          currentValue: foundInconsistentTerms[0]
        });
      }
    }

    return issues;
  }

  /**
   * 检查语法正确性
   */
  private checkGrammar(translations: any): LocalizationIssue[] {
    const issues: LocalizationIssue[] = [];
    
    // 检查常见的语法错误
    const grammarRules = [
      {
        pattern: /ҳиссаи ҳисса/g, // 重复词汇
        description: '发现重复的词汇',
        fix: '移除重复的词汇'
      },
      {
        pattern: /муваффақиятӣ\s+муваффақиятӣ/g, // 重复副词
        description: '发现重复的副词',
        fix: '使用单一形式的副词'
      }
    ];

    const stringValues = this.extractStringValues(translations);
    
    grammarRules.forEach(rule => {
      stringValues.forEach(value => {
        const matches = value.match(rule.pattern);
        if (matches) {
          issues.push({
            file: '',
            key: 'grammar_check',
            issueType: 'poor_localization',
            severity: 'low',
            description: `${rule.description}: "${matches[0]}"`,
            suggestion: rule.fix,
            currentValue: value
          });
        }
      });
    });

    return issues;
  }

  /**
   * 检查日期格式
   */
  private checkDateFormats(values: string[]): LocalizationIssue[] {
    const issues: LocalizationIssue[] = [];
    
    values.forEach(value => {
      const matches = value.match(this.culturalAdaptationPatterns.dateFormat);
      if (matches && !value.includes('dd.mm.yyyy')) {
        issues.push({
          file: '',
          key: 'date_format',
          issueType: 'cultural_mismatch',
          severity: 'medium',
          description: `日期格式不符合塔吉克斯坦标准: "${matches[0]}"`,
          suggestion: `请使用格式: dd.mm.yyyy (例如: ${matches[1]}.${matches[2]}.${matches[3]})`,
          currentValue: value
        });
      }
    });

    return issues;
  }

  /**
   * 检查数字格式
   */
  private checkNumberFormats(values: string[]): LocalizationIssue[] {
    const issues: LocalizationIssue[] = [];
    
    values.forEach(value => {
      const matches = value.match(this.culturalAdaptationPatterns.numberFormat);
      if (matches && !value.includes(',')) {
        issues.push({
          file: '',
          key: 'number_format',
          issueType: 'cultural_mismatch',
          severity: 'low',
          description: `数字格式不符合塔吉克斯坦标准: "${matches[0]}"`,
          suggestion: `请使用逗号作为千位分隔符: ${matches[1].replace(/\./g, ',')}${matches[2]}`,
          currentValue: value
        });
      }
    });

    return issues;
  }

  /**
   * 检查货币格式
   */
  private checkCurrencyFormats(values: string[]): LocalizationIssue[] {
    const issues: LocalizationIssue[] = [];
    
    values.forEach(value => {
      const matches = value.match(this.culturalAdaptationPatterns.currencyFormat);
      if (matches && !value.includes('сомонӣ')) {
        issues.push({
          file: '',
          key: 'currency_format',
          issueType: 'cultural_mismatch',
          severity: 'medium',
          description: `货币表达不符合塔吉克斯坦习惯: "${matches[0]}"`,
          suggestion: `请使用 "сомонӣ" 而不是 "TJS" 或 "Somoni"`,
          currentValue: value
        });
      }
    });

    return issues;
  }

  /**
   * 检查礼貌用语
   */
  private checkPoliteness(values: string[]): LocalizationIssue[] {
    const issues: LocalizationIssue[] = [];
    
    // 检查是否使用了礼貌用语
    const hasPoliteness = values.some(value => 
      this.culturalAdaptationPatterns.politePhrases.some(phrase => 
        value.toLowerCase().includes(phrase)
      )
    );

    if (!hasPoliteness) {
      issues.push({
        file: '',
        key: 'politeness',
        issueType: 'cultural_mismatch',
        severity: 'low',
        description: '缺少适当的礼貌用语',
        suggestion: '在适当的地方添加礼貌用语，如 "лутфан", "ташаккур" 等'
      });
    }

    return issues;
  }

  /**
   * 检查直译问题
   */
  private checkLiteralTranslations(values: string[]): LocalizationIssue[] {
    const issues: LocalizationIssue[] = [];
    
    // 检查常见的直译问题
    const literalPatterns = [
      {
        pattern: /系统通知/g, // 系统通知 - 直接从中文翻译
        expected: 'Огоҳиномаи система',
        description: '发现可能的直译: "系统通知"'
      },
      {
        pattern: /确认/g, // 确认 - 直接从中文翻译
        expected: 'Тасдиқ',
        description: '发现可能的直译: "确认"'
      }
    ];

    values.forEach(value => {
      literalPatterns.forEach(pattern => {
        if (pattern.pattern.test(value)) {
          issues.push({
            file: '',
            key: 'literal_translation',
            issueType: 'poor_localization',
            severity: 'medium',
            description: pattern.description,
            suggestion: `建议使用更自然的塔吉克语表达: ${pattern.expected}`,
            currentValue: value
          });
        }
      });
    });

    return issues;
  }

  /**
   * 检查句子结构
   */
  private checkSentenceStructure(values: string[]): LocalizationIssue[] {
    const issues: LocalizationIssue[] = [];
    
    // 检查过长的句子
    values.forEach(value => {
      if (value.length > 200) {
        issues.push({
          file: '',
          key: 'sentence_length',
          issueType: 'poor_localization',
          severity: 'low',
          description: `句子过长 (${value.length} 字符)`,
          suggestion: '建议将长句分解为更短的句子，提高可读性',
          currentValue: value
        });
      }
    });

    return issues;
  }

  /**
   * 检查词汇选择
   */
  private checkVocabularyChoice(values: string[]): LocalizationIssue[] {
    const issues: LocalizationIssue[] = [];
    
    // 检查词汇选择的适当性
    const vocabularyChecks = [
      {
        pattern: /энергия/g, // 能量 - 在商业语境中可能不恰当
        suggested: 'қудрат',
        context: '商业语境中'
      },
      {
        pattern: /функция/g, // 功能 - 技术术语
        suggested: 'вазифа',
        context: '用户界面中'
      }
    ];

    values.forEach(value => {
      vocabularyChecks.forEach(check => {
        if (check.pattern.test(value)) {
          issues.push({
            file: '',
            key: 'vocabulary_choice',
            issueType: 'poor_localization',
            severity: 'low',
            description: `词汇 "${check.pattern}" 在${check.context}中可能不够自然`,
            suggestion: `建议使用 "${check.suggested}"`,
            currentValue: value
          });
        }
      });
    });

    return issues;
  }

  /**
   * 获取所有翻译文件
   */
  private async getTranslationFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.localesPath);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      console.error('Error reading translation files:', error);
      return [];
    }
  }

  /**
   * 提取字符串值
   */
  private extractStringValues(obj: any, prefix: string = ''): string[] {
    const values: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string') {
        values.push(value);
      } else if (typeof value === 'object' && value !== null) {
        values.push(...this.extractStringValues(value, fullKey));
      }
    }
    
    return values;
  }

  /**
   * 获取深层值
   */
  private getDeepValue(obj: any, keyPath: string): any {
    return keyPath.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * 计算总体评分
   */
  private calculateOverallScore(fileScores: LocalizationScore[]): number {
    if (fileScores.length === 0) return 0;
    
    const totalScore = fileScores.reduce((sum, score) => sum + score.overallScore, 0);
    return Math.round(totalScore / fileScores.length);
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(fileScores: LocalizationScore[], criticalIssues: LocalizationIssue[]): string[] {
    const recommendations: string[] = [];
    
    // 基于评分给出建议
    const lowScoreFiles = fileScores.filter(score => score.overallScore < 70);
    if (lowScoreFiles.length > 0) {
      recommendations.push(`需要重点关注以下文件的翻译质量: ${lowScoreFiles.map(f => f.file).join(', ')}`);
    }
    
    // 基于关键问题给出建议
    const missingTranslations = criticalIssues.filter(i => i.issueType === 'missing_translation');
    if (missingTranslations.length > 0) {
      recommendations.push(`优先完成 ${missingTranslations.length} 个缺失的翻译项目`);
    }
    
    const culturalMismatches = criticalIssues.filter(i => i.issueType === 'cultural_mismatch');
    if (culturalMismatches.length > 0) {
      recommendations.push(`修正 ${culturalMismatches.length} 个文化适应性不匹配的问题`);
    }
    
    // 通用建议
    recommendations.push('建立塔吉克语翻译术语表，确保术语使用的一致性');
    recommendations.push('定期进行本地化质量检查，特别是用户界面文本');
    recommendations.push('考虑与母语为塔吉克语的译者合作，提升翻译的自然度');
    recommendations.push('建立翻译质量监控机制，跟踪改进进度');
    
    return recommendations;
  }

  /**
   * 分析文化适应性
   */
  private analyzeCulturalAdaptation(files: string[]): TajikLocalizationAssessment['culturalAnalysis'] {
    return {
      dateFormats: ['dd.mm.yyyy', 'dd/mm/yyyy'],
      numberFormats: ['1,234.56', '1 234,56'],
      currencyFormats: ['1,234.56 сомонӣ', '1,234.56 TJS'],
      greetingStyles: ['формалӣ', 'қисман формалӣ'],
      politenessLevel: 'formal'
    };
  }

  /**
   * 生成详细的评估报告
   */
  async generateReport(): Promise<string> {
    const assessment = await this.evaluateLocalization();
    
    let report = `# 塔吉克语本土化评估报告\n\n`;
    report += `## 总体评分: ${assessment.overallScore}/100\n\n`;
    
    report += `## 文件评估详情\n\n`;
    assessment.fileScores.forEach(score => {
      report += `### ${score.file}\n`;
      report += `- 完整性: ${score.completeness}%\n`;
      report += `- 准确性: ${score.accuracy}%\n`;
      report += `- 文化适应性: ${score.culturalAdaptation}%\n`;
      report += `- 自然度: ${score.naturalness}%\n`;
      report += `- **总体评分: ${score.overallScore}%**\n\n`;
      
      if (score.issues.length > 0) {
        report += `#### 发现的问题:\n`;
        score.issues.forEach(issue => {
          report += `- **${issue.severity.toUpperCase()}**: ${issue.description}\n`;
          report += `  - 建议: ${issue.suggestion}\n`;
          if (issue.currentValue) {
            report += `  - 当前值: ${issue.currentValue}\n`;
          }
        });
        report += `\n`;
      }
    });
    
    report += `## 关键问题汇总\n\n`;
    if (assessment.criticalIssues.length > 0) {
      assessment.criticalIssues.forEach(issue => {
        report += `- **[${issue.severity.toUpperCase()}]** ${issue.description}\n`;
        report += `  - 文件: ${issue.file}\n`;
        report += `  - 键: ${issue.key}\n`;
        report += `  - 建议: ${issue.suggestion}\n\n`;
      });
    } else {
      report += `✅ 未发现高优先级问题\n\n`;
    }
    
    report += `## 改进建议\n\n`;
    assessment.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });
    
    report += `\n## 文化适应性分析\n\n`;
    report += `- **礼貌程度**: ${assessment.culturalAnalysis.politenessLevel}\n`;
    report += `- **日期格式**: ${assessment.culturalAnalysis.dateFormats.join(', ')}\n`;
    report += `- **数字格式**: ${assessment.culturalAnalysis.numberFormats.join(', ')}\n`;
    report += `- **货币格式**: ${assessment.culturalAnalysis.currencyFormats.join(', ')}\n`;
    
    return report;
  }
}

// 使用示例
async function main() {
  const evaluator = new TajikLocalizationEvaluator(process.cwd());
  const report = await evaluator.generateReport();
  console.log(report);
}

if (require.main === module) {
  main().catch(console.error);
}