/**
 * 翻译质量评估标准和量化体系
 * Translation Quality Assessment Standards and Metrics
 */

// 评估维度定义
export enum QualityDimension {
  ACCURACY = 'accuracy',        // 准确性
  FLUENCY = 'fluency',          // 流畅性
  CONSISTENCY = 'consistency',  // 一致性
  CULTURAL_ADAPTATION = 'cultural_adaptation', // 文化适应性
  COMPLETENESS = 'completeness', // 完整性
  TECHNICAL_QUALITY = 'technical_quality' // 技术质量
}

// 严重程度级别
export enum SeverityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// 问题类型定义
export enum IssueType {
  MISSING_TRANSLATION = 'missing_translation',
  INACCURATE_TRANSLATION = 'inaccurate_translation',
  STYLISTIC_ISSUE = 'stylistic_issue',
  TERMINOLOGY_INCONSISTENCY = 'terminology_inconsistency',
  PLACEHOLDER_MISMATCH = 'placeholder_mismatch',
  CULTURAL_INAPPROPRIATE = 'cultural_inappropriate',
  LENGTH_ISSUE = 'length_issue',
  GRAMMAR_ISSUE = 'grammar_issue',
  PUNCTUATION_ISSUE = 'punctuation_issue'
}

// 质量指标接口
export interface QualityMetrics {
  dimension: QualityDimension;
  score: number; // 0-100
  maxScore: number;
  weight: number; // 权重
  issues: QualityIssue[];
  lastAssessed: Date;
}

// 质量问题接口
export interface QualityIssue {
  id: string;
  type: IssueType;
  severity: SeverityLevel;
  description: string;
  location: string;
  suggestedFix?: string;
  timestamp: Date;
}

// 翻译质量评估结果
export interface TranslationQualityAssessment {
  translationKey: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  namespace: string;
  overallScore: number;
  dimensionScores: QualityMetrics[];
  issues: QualityIssue[];
  recommendations: string[];
  assessmentDate: Date;
}

// 评分权重配置
export const QUALITY_WEIGHTS: Record<QualityDimension, number> = {
  [QualityDimension.ACCURACY]: 0.30,           // 准确性占30%
  [QualityDimension.FLUENCY]: 0.25,            // 流畅性占25%
  [QualityDimension.CONSISTENCY]: 0.20,        // 一致性占20%
  [QualityDimension.CULTURAL_ADAPTATION]: 0.15, // 文化适应性占15%
  [QualityDimension.COMPLETENESS]: 0.07,       // 完整性占7%
  [QualityDimension.TECHNICAL_QUALITY]: 0.03   // 技术质量占3%
};

// 质量阈值定义
export const QUALITY_THRESHOLDS = {
  EXCELLENT: { min: 90, label: '优秀', color: '#10B981' },
  GOOD: { min: 80, label: '良好', color: '#059669' },
  ACCEPTABLE: { min: 70, label: '可接受', color: '#D97706' },
  POOR: { min: 60, label: '较差', color: '#DC2626' },
  UNACCEPTABLE: { min: 0, label: '不可接受', color: '#991B1B' }
};

// 语言特定配置
export interface LanguageConfig {
  code: string;
  name: string;
  rtl: boolean; // 是否为从右到左语言
  placeholderPattern: RegExp;
  pluralRules: (count: number) => string;
  culturalConsiderations: string[];
  maxLengthMultiplier: number; // 相对源文本的最大长度倍数
}

// 语言配置
export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  'zh-CN': {
    code: 'zh-CN',
    name: '简体中文',
    rtl: false,
    placeholderPattern: /\{\{(\w+)\}\}/g,
    pluralRules: (count: number) => count === 1 ? 'one' : 'other',
    culturalConsiderations: ['使用简体中文', '避免过于正式的表述', '考虑中文表达习惯'],
    maxLengthMultiplier: 0.7
  },
  'en-US': {
    code: 'en-US',
    name: '美式英语',
    rtl: false,
    placeholderPattern: /\{\{(\w+)\}\}|%s/g,
    pluralRules: (count: number) => count === 1 ? 'one' : 'other',
    culturalConsiderations: ['使用美式英语', '避免英式英语拼写', '考虑美国文化背景'],
    maxLengthMultiplier: 1.0
  },
  'ru-RU': {
    code: 'ru-RU',
    name: '俄语',
    rtl: false,
    placeholderPattern: /\{\{(\w+)\}\}/g,
    pluralRules: (count: number) => {
      const lastDigit = count % 10;
      const lastTwoDigits = count % 100;
      if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'many';
      if (lastDigit === 1) return 'one';
      if (lastDigit >= 2 && lastDigit <= 4) return 'few';
      return 'many';
    },
    culturalConsiderations: ['使用正式的俄语', '注意性别变化', '考虑俄罗斯文化'],
    maxLengthMultiplier: 1.3
  },
  'tg-TJ': {
    code: 'tg-TJ',
    name: '塔吉克语',
    rtl: false,
    placeholderPattern: /\{\{(\w+)\}\}/g,
    pluralRules: (count: number) => count === 1 ? 'one' : 'other',
    culturalConsiderations: ['使用标准塔吉克语', '避免波斯语和乌兹别克语混合', '考虑塔吉克文化'],
    maxLengthMultiplier: 1.1
  }
};

// 术语一致性检查规则
export interface TerminologyRule {
  term: string;
  allowedTranslations: Record<string, string>;
  forbiddenTranslations: Record<string, string[]>;
  priority: SeverityLevel;
}

// 术语库
export const TERMINOLOGY_RULES: TerminologyRule[] = [
  {
    term: 'wallet',
    allowedTranslations: {
      'zh-CN': '钱包',
      'ru-RU': 'кошелек',
      'tg-TJ': 'хамён'
    },
    forbiddenTranslations: {
      'zh-CN': ['皮夹', '钱袋'],
      'ru-RU': ['бумажник'],
      'tg-TJ': ['чӯбча']
    },
    priority: SeverityLevel.HIGH
  },
  {
    term: 'lottery',
    allowedTranslations: {
      'zh-CN': '抽奖',
      'ru-RU': 'лотерея',
      'tg-TJ': 'лоторея'
    },
    forbiddenTranslations: {
      'zh-CN': ['彩票', '抽奖活动'],
      'ru-RU': ['розыгрыш'],
      'tg-TJ': ['бозии мусабиқавӣ']
    },
    priority: SeverityLevel.HIGH
  }
];

// 评估工具类
export class QualityAssessor {
  /**
   * 评估翻译质量
   */
  static assessTranslation(
    sourceText: string,
    translatedText: string,
    sourceLanguage: string,
    targetLanguage: string,
    namespace: string,
    translationKey: string
  ): TranslationQualityAssessment {
    const dimensionScores: QualityMetrics[] = [
      this.assessAccuracy(sourceText, translatedText, sourceLanguage, targetLanguage),
      this.assessFluency(translatedText, targetLanguage),
      this.assessConsistency(translatedText, targetLanguage, namespace),
      this.assessCulturalAdaptation(translatedText, targetLanguage),
      this.assessCompleteness(translatedText, sourceText),
      this.assessTechnicalQuality(translatedText, targetLanguage)
    ];

    const overallScore = this.calculateOverallScore(dimensionScores);
    const issues = this.collectAllIssues(dimensionScores);
    const recommendations = this.generateRecommendations(issues);

    return {
      translationKey,
      sourceText,
      translatedText,
      sourceLanguage,
      targetLanguage,
      namespace,
      overallScore,
      dimensionScores,
      issues,
      recommendations,
      assessmentDate: new Date()
    };
  }

  /**
   * 准确性评估
   */
  private static assessAccuracy(
    sourceText: string,
    translatedText: string,
    sourceLanguage: string,
    targetLanguage: string
  ): QualityMetrics {
    const issues: QualityIssue[] = [];
    let score = 100;

    // 检查翻译缺失
    if (!translatedText || translatedText.trim() === '') {
      issues.push({
        id: this.generateId(),
        type: IssueType.MISSING_TRANSLATION,
        severity: SeverityLevel.CRITICAL,
        description: '翻译文本缺失',
        location: 'translatedText',
        timestamp: new Date()
      });
      score = 0;
    }

    // 检查长度比例（简化算法）
    const sourceLength = sourceText.length;
    const targetLength = translatedText.length;
    const ratio = targetLength / sourceLength;

    const config = LANGUAGE_CONFIGS[targetLanguage];
    if (config && (ratio < 0.3 || ratio > 3.0)) {
      issues.push({
        id: this.generateId(),
        type: IssueType.ACCURACY,
        severity: SeverityLevel.MEDIUM,
        description: `翻译长度异常：源文本${sourceLength}字符，翻译文本${targetLength}字符`,
        location: 'translatedText',
        timestamp: new Date()
      });
      score -= 20;
    }

    // 检查关键词是否翻译
    const keywords = this.extractKeywords(sourceText);
    const missingKeywords = keywords.filter(keyword => 
      !translatedText.toLowerCase().includes(keyword.toLowerCase())
    );

    if (missingKeywords.length > 0) {
      issues.push({
        id: this.generateId(),
        type: IssueType.INACCURATE_TRANSLATION,
        severity: SeverityLevel.HIGH,
        description: `缺失关键词翻译：${missingKeywords.join(', ')}`,
        location: 'translatedText',
        timestamp: new Date()
      });
      score -= Math.min(30, missingKeywords.length * 10);
    }

    return {
      dimension: QualityDimension.ACCURACY,
      score: Math.max(0, score),
      maxScore: 100,
      weight: QUALITY_WEIGHTS[QualityDimension.ACCURACY],
      issues,
      lastAssessed: new Date()
    };
  }

  /**
   * 流畅性评估
   */
  private static assessFluency(
    translatedText: string,
    targetLanguage: string
  ): QualityMetrics {
    const issues: QualityIssue[] = [];
    let score = 100;

    // 检查语法错误（简化检查）
    const grammarIssues = this.checkGrammar(translatedText, targetLanguage);
    issues.push(...grammarIssues);
    score -= grammarIssues.length * 15;

    // 检查标点符号
    const punctuationIssues = this.checkPunctuation(translatedText, targetLanguage);
    issues.push(...punctuationIssues);
    score -= punctuationIssues.length * 10;

    // 检查重复词汇
    const wordCount = translatedText.split(/\s+/);
    const uniqueWords = new Set(wordCount);
    const repetitionRatio = 1 - (uniqueWords.size / wordCount.length);

    if (repetitionRatio > 0.3) {
      issues.push({
        id: this.generateId(),
        type: IssueType.STYLISTIC_ISSUE,
        severity: SeverityLevel.MEDIUM,
        description: '词汇重复过多',
        location: 'translatedText',
        timestamp: new Date()
      });
      score -= 15;
    }

    return {
      dimension: QualityDimension.FLUENCY,
      score: Math.max(0, score),
      maxScore: 100,
      weight: QUALITY_WEIGHTS[QualityDimension.FLUENCY],
      issues,
      lastAssessed: new Date()
    };
  }

  /**
   * 一致性评估
   */
  private static assessConsistency(
    translatedText: string,
    targetLanguage: string,
    namespace: string
  ): QualityMetrics {
    const issues: QualityIssue[] = [];
    let score = 100;

    // 检查术语一致性
    const terminologyIssues = this.checkTerminologyConsistency(
      translatedText,
      targetLanguage,
      namespace
    );
    issues.push(...terminologyIssues);
    score -= terminologyIssues.length * 20;

    // 检查翻译风格一致性（简化检查）
    const styleConsistencyIssues = this.checkStyleConsistency(translatedText, targetLanguage);
    issues.push(...styleConsistencyIssues);
    score -= styleConsistencyIssues.length * 10;

    return {
      dimension: QualityDimension.CONSISTENCY,
      score: Math.max(0, score),
      maxScore: 100,
      weight: QUALITY_WEIGHTS[QualityDimension.CONSISTENCY],
      issues,
      lastAssessed: new Date()
    };
  }

  /**
   * 文化适应性评估
   */
  private static assessCulturalAdaptation(
    translatedText: string,
    targetLanguage: string
  ): QualityMetrics {
    const issues: QualityIssue[] = [];
    let score = 100;

    const config = LANGUAGE_CONFIGS[targetLanguage];
    if (config) {
      // 检查文化适应性
      const culturalIssues = this.checkCulturalAppropriateness(translatedText, config);
      issues.push(...culturalIssues);
      score -= culturalIssues.length * 25;

      // 检查数字和日期格式
      const formatIssues = this.checkFormatting(translatedText, targetLanguage);
      issues.push(...formatIssues);
      score -= formatIssues.length * 10;
    }

    return {
      dimension: QualityDimension.CULTURAL_ADAPTATION,
      score: Math.max(0, score),
      maxScore: 100,
      weight: QUALITY_WEIGHTS[QualityDimension.CULTURAL_ADAPTATION],
      issues,
      lastAssessed: new Date()
    };
  }

  /**
   * 完整性评估
   */
  private static assessCompleteness(
    translatedText: string,
    sourceText: string
  ): QualityMetrics {
    const issues: QualityIssue[] = [];
    let score = 100;

    // 检查占位符匹配
    const sourcePlaceholders = this.extractPlaceholders(sourceText);
    const targetPlaceholders = this.extractPlaceholders(translatedText);

    if (sourcePlaceholders.length !== targetPlaceholders.length) {
      issues.push({
        id: this.generateId(),
        type: IssueType.PLACEHOLDER_MISMATCH,
        severity: SeverityLevel.HIGH,
        description: `占位符不匹配：源文本${sourcePlaceholders.length}个，翻译文本${targetPlaceholders.length}个`,
        location: 'placeholderMismatch',
        timestamp: new Date()
      });
      score -= 40;
    }

    // 检查HTML标签匹配
    const sourceTags = this.extractHtmlTags(sourceText);
    const targetTags = this.extractHtmlTags(translatedText);

    if (sourceTags.length !== targetTags.length) {
      issues.push({
        id: this.generateId(),
        type: IssueType.TECHNICAL_QUALITY,
        severity: SeverityLevel.MEDIUM,
        description: 'HTML标签不匹配',
        location: 'htmlTags',
        timestamp: new Date()
      });
      score -= 20;
    }

    return {
      dimension: QualityDimension.COMPLETENESS,
      score: Math.max(0, score),
      maxScore: 100,
      weight: QUALITY_WEIGHTS[QualityDimension.COMPLETENESS],
      issues,
      lastAssessed: new Date()
    };
  }

  /**
   * 技术质量评估
   */
  private static assessTechnicalQuality(
    translatedText: string,
    targetLanguage: string
  ): QualityMetrics {
    const issues: QualityIssue[] = [];
    let score = 100;

    // 检查编码问题
    if (this.hasEncodingIssues(translatedText)) {
      issues.push({
        id: this.generateId(),
        type: IssueType.TECHNICAL_QUALITY,
        severity: SeverityLevel.HIGH,
        description: '发现编码问题',
        location: 'encoding',
        timestamp: new Date()
      });
      score -= 30;
    }

    // 检查特殊字符
    const config = LANGUAGE_CONFIGS[targetLanguage];
    if (config) {
      const invalidChars = this.findInvalidCharacters(translatedText, config);
      if (invalidChars.length > 0) {
        issues.push({
          id: this.generateId(),
          type: IssueType.TECHNICAL_QUALITY,
          severity: SeverityLevel.MEDIUM,
          description: `发现无效字符：${invalidChars.join(', ')}`,
          location: 'characterValidation',
          timestamp: new Date()
        });
        score -= 20;
      }
    }

    return {
      dimension: QualityDimension.TECHNICAL_QUALITY,
      score: Math.max(0, score),
      maxScore: 100,
      weight: QUALITY_WEIGHTS[QualityDimension.TECHNICAL_QUALITY],
      issues,
      lastAssessed: new Date()
    };
  }

  // 辅助方法
  private static generateId(): string {
    return `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static extractKeywords(text: string): string[] {
    // 简化的关键词提取
    return text
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5); // 取前5个较长的词作为关键词
  }

  private static checkGrammar(text: string, language: string): QualityIssue[] {
    const issues: QualityIssue[] = [];
    // 简化的语法检查逻辑
    
    // 检查多余的空格
    if (/\s{2,}/.test(text)) {
      issues.push({
        id: this.generateId(),
        type: IssueType.GRAMMAR_ISSUE,
        severity: SeverityLevel.LOW,
        description: '存在多余空格',
        location: 'whitespace',
        timestamp: new Date()
      });
    }

    return issues;
  }

  private static checkPunctuation(text: string, language: string): QualityIssue[] {
    const issues: QualityIssue[] = [];
    // 检查标点符号配对
    const parentheses = (text.match(/\(/g) || []).length;
    const closingParens = (text.match(/\)/g) || []).length;
    
    if (parentheses !== closingParens) {
      issues.push({
        id: this.generateId(),
        type: IssueType.PUNCTUATION_ISSUE,
        severity: SeverityLevel.MEDIUM,
        description: '括号不匹配',
        location: 'punctuation',
        timestamp: new Date()
      });
    }

    return issues;
  }

  private static checkTerminologyConsistency(
    text: string,
    language: string,
    namespace: string
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    
    TERMINOLOGY_RULES.forEach(rule => {
      const translatedTerm = rule.allowedTranslations[language];
      if (translatedTerm) {
        const forbiddenTranslations = rule.forbiddenTranslations[language] || [];
        forbiddenTranslations.forEach(forbiddenTerm => {
          if (text.toLowerCase().includes(forbiddenTerm.toLowerCase())) {
            issues.push({
              id: this.generateId(),
              type: IssueType.TERMINOLOGY_INCONSISTENCY,
              severity: rule.priority,
              description: `使用了禁止的术语：${forbiddenTerm}，建议使用：${translatedTerm}`,
              location: 'terminology',
              suggestedFix: translatedTerm,
              timestamp: new Date()
            });
          }
        });
      }
    });

    return issues;
  }

  private static checkStyleConsistency(text: string, language: string): QualityIssue[] {
    const issues: QualityIssue[] = [];
    // 简化的风格一致性检查
    return issues;
  }

  private static checkCulturalAppropriateness(text: string, config: LanguageConfig): QualityIssue[] {
    const issues: QualityIssue[] = [];
    
    // 检查文化考虑事项
    config.culturalConsiderations.forEach(consideration => {
      // 简化的检查逻辑
      if (consideration.includes('避免') && consideration.includes('表述')) {
        // 检查过于正式的表达
        if (/[！!]/.test(text) && text.length > 10) {
          issues.push({
            id: this.generateId(),
            type: IssueType.CULTURAL_INAPPROPRIATE,
            severity: SeverityLevel.MEDIUM,
            description: '可能存在过于正式的表述',
            location: 'tone',
            timestamp: new Date()
          });
        }
      }
    });

    return issues;
  }

  private static checkFormatting(text: string, language: string): QualityIssue[] {
    const issues: QualityIssue[] = [];
    // 检查数字格式
    if (/\d{4}-\d{2}-\d{2}/.test(text)) {
      // 检查日期格式是否符合语言习惯
      // 这里可以添加更具体的检查逻辑
    }
    return issues;
  }

  private static extractPlaceholders(text: string): string[] {
    const config = LANGUAGE_CONFIGS['en-US']; // 默认使用英文配置
    return text.match(config.placeholderPattern) || [];
  }

  private static extractHtmlTags(text: string): string[] {
    return text.match(/<\/?[\w\s="/.':;#-\/\?]+>/gi) || [];
  }

  private static hasEncodingIssues(text: string): boolean {
    // 检查常见编码问题
    return /�/.test(text) || /□/.test(text);
  }

  private static findInvalidCharacters(text: string, config: LanguageConfig): string[] {
    // 简化的无效字符检查
    const invalidChars: string[] = [];
    // 这里可以添加语言特定的无效字符检查逻辑
    return invalidChars;
  }

  private static collectAllIssues(dimensionScores: QualityMetrics[]): QualityIssue[] {
    return dimensionScores.flatMap(dimension => dimension.issues);
  }

  private static calculateOverallScore(dimensionScores: QualityMetrics[]): number {
    const totalWeightedScore = dimensionScores.reduce(
      (sum, dimension) => sum + (dimension.score * dimension.weight),
      0
    );
    return Math.round(totalWeightedScore);
  }

  private static generateRecommendations(issues: QualityIssue[]): string[] {
    const recommendations: string[] = [];
    
    // 根据问题类型生成建议
    const issueCount = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<IssueType, number>);

    if (issueCount[IssueType.MISSING_TRANSLATION] > 0) {
      recommendations.push('提供缺失的翻译内容');
    }
    
    if (issueCount[IssueType.TERMINOLOGY_INCONSISTENCY] > 0) {
      recommendations.push('统一术语翻译，保持一致性');
    }
    
    if (issueCount[IssueType.PLACEHOLDER_MISMATCH] > 0) {
      recommendations.push('修正占位符不匹配问题');
    }
    
    if (issueCount[IssueType.GRAMMAR_ISSUE] > 0) {
      recommendations.push('检查并修正语法错误');
    }

    return recommendations;
  }
}

// 导出质量等级检查函数
export function getQualityLevel(score: number): typeof QUALITY_THRESHOLDS[keyof typeof QUALITY_THRESHOLDS] {
  for (const [level, threshold] of Object.entries(QUALITY_THRESHOLDS)) {
    if (score >= threshold.min) {
      return threshold;
    }
  }
  return QUALITY_THRESHOLDS.UNACCEPTABLE;
}

// 导出评分辅助函数
export function calculateQualityScore(dimensionScores: QualityMetrics[]): number {
  return QualityAssessor.calculateOverallScore ? 
    QualityAssessor.calculateOverallScore(dimensionScores) : 0;
}