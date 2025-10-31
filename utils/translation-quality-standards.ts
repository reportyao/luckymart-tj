/**
 * 翻译质量评估标准
 * 定义翻译质量的评估标准和指标
 */

export interface QualityStandard {
  name: string;
  description: string;
  weight: number; // 在总体评分中的权重 (0-1)
  criteria: QualityCriterion[];
}

export interface QualityCriterion {
  name: string;
  description: string;
  weight: number; // 在该标准中的权重 (0-1)
  checks: QualityCheck[];
}

export interface QualityCheck {
  name: string;
  description: string;
  weight: number; // 在该标准中的权重 (0-1)
  severity: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  manualRequired: boolean;
  rules: QualityRule[];
}

export interface QualityRule {
  name: string;
  description: string;
  pattern?: string;
  threshold?: number;
  customCheck?: (text: string, context: any) => boolean;
}

export interface TranslationScoringResult {
  standard: string;
  criteria: CriterionScore[];
  overall: number;
  pass: boolean;
  details: string;
}

export interface CriterionScore {
  name: string;
  score: number;
  maxScore: number;
  passed: boolean;
  issues: QualityIssue[];
}

export interface QualityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location?: string;
  suggestion?: string;
}

export class TranslationQualityStandards {
  private standards: QualityStandard[] = [];

  constructor() {
    this.initializeStandards();
  }

  private initializeStandards() {
    // 标准1: 翻译准确性
    this.standards.push({
      name: 'accuracy',
      description: '翻译准确性 - 确保翻译内容准确反映原文含义',
      weight: 0.25,
      criteria: [
        {
          name: 'meaning_accuracy',
          description: '含义准确性',
          weight: 0.4,
          checks: [
            {
              name: 'literal_accuracy',
              description: '字面意思准确性',
              weight: 0.3,
              severity: 'high',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'missing_translation',
                  description: '检查是否有未翻译的文本'
                },
                {
                  name: 'incomplete_translation',
                  description: '检查翻译是否完整'
                }
              ]
            },
            {
              name: 'context_accuracy',
              description: '语境准确性',
              weight: 0.4,
              severity: 'high',
              automated: false,
              manualRequired: true,
              rules: []
            },
            {
              name: 'technical_accuracy',
              description: '技术术语准确性',
              weight: 0.3,
              severity: 'medium',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'technical_terms',
                  description: '检查技术术语翻译'
                },
                {
                  name: 'proper_nouns',
                  description: '检查专有名词处理'
                }
              ]
            }
          ]
        },
        {
          name: 'semantic_accuracy',
          description: '语义准确性',
          weight: 0.3,
          checks: [
            {
              name: 'word_choice',
              description: '词汇选择准确性',
              weight: 0.5,
              severity: 'medium',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'glossary_compliance',
                  description: '符合术语表标准'
                },
                {
                  name: 'domain_specific',
                  description: '领域特定词汇准确性'
                }
              ]
            },
            {
              name: 'idiom_accuracy',
              description: '习语准确性',
              weight: 0.5,
              severity: 'high',
              automated: false,
              manualRequired: true,
              rules: []
            }
          ]
        },
        {
          name: 'factual_accuracy',
          description: '事实准确性',
          weight: 0.3,
          checks: [
            {
              name: 'data_accuracy',
              description: '数据准确性',
              weight: 1.0,
              severity: 'critical',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'date_format',
                  description: '日期格式准确性'
                },
                {
                  name: 'currency_format',
                  description: '货币格式准确性'
                },
                {
                  name: 'number_format',
                  description: '数字格式准确性'
                }
              ]
            }
          ]
        }
      ]
    });

    // 标准2: 翻译一致性
    this.standards.push({
      name: 'consistency',
      description: '翻译一致性 - 确保相同概念在全文中翻译一致',
      weight: 0.20,
      criteria: [
        {
          name: 'terminology_consistency',
          description: '术语一致性',
          weight: 0.4,
          checks: [
            {
              name: 'glossary_consistency',
              description: '术语表一致性',
              weight: 1.0,
              severity: 'high',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'core_terms',
                  description: '核心术语一致性',
                  customCheck: (text, context) => {
                    return this.checkCoreTermsConsistency(text, context);
                  }
                },
                {
                  name: 'repeated_terms',
                  description: '重复术语一致性'
                }
              ]
            }
          ]
        },
        {
          name: 'style_consistency',
          description: '风格一致性',
          weight: 0.3,
          checks: [
            {
              name: 'tone_consistency',
              description: '语调一致性',
              weight: 1.0,
              severity: 'medium',
              automated: false,
              manualRequired: true,
              rules: []
            }
          ]
        },
        {
          name: 'structural_consistency',
          description: '结构一致性',
          weight: 0.3,
          checks: [
            {
              name: 'format_consistency',
              description: '格式一致性',
              weight: 1.0,
              severity: 'medium',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'punctuation_style',
                  description: '标点符号风格一致性'
                },
                {
                  name: 'capitalization',
                  description: '大小写一致性'
                }
              ]
            }
          ]
        }
      ]
    });

    // 标准3: 语言流畅性
    this.standards.push({
      name: 'fluency',
      description: '语言流畅性 - 确保翻译自然流畅',
      weight: 0.20,
      criteria: [
        {
          name: 'grammatical_correctness',
          description: '语法正确性',
          weight: 0.4,
          checks: [
            {
              name: 'syntax_check',
              description: '句法检查',
              weight: 0.5,
              severity: 'high',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'word_order',
                  description: '词序正确性'
                },
                {
                  name: 'grammar_rules',
                  description: '语法规则符合性'
                }
              ]
            },
            {
              name: 'morphology_check',
              description: '词形检查',
              weight: 0.5,
              severity: 'high',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'inflection',
                  description: '变词形正确性'
                },
                {
                  name: 'agreement',
                  description: '一致性正确性'
                }
              ]
            }
          ]
        },
        {
          name: 'naturalness',
          description: '自然性',
          weight: 0.4,
          checks: [
            {
              name: 'natural_expression',
              description: '自然表达',
              weight: 1.0,
              severity: 'medium',
              automated: false,
              manualRequired: true,
              rules: []
            }
          ]
        },
        {
          name: 'readability',
          description: '可读性',
          weight: 0.2,
          checks: [
            {
              name: 'length_appropriateness',
              description: '长度适宜性',
              weight: 1.0,
              severity: 'medium',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'mobile_friendly',
                  description: '移动端友好性',
                  threshold: 50 // 最大字符数
                },
                {
                  name: 'reading_ease',
                  description: '阅读容易度'
                }
              ]
            }
          ]
        }
      ]
    });

    // 标准4: 文化适应性
    this.standards.push({
      name: 'cultural_adaptation',
      description: '文化适应性 - 确保翻译符合目标文化习惯',
      weight: 0.15,
      criteria: [
        {
          name: 'cultural_sensitivity',
          description: '文化敏感性',
          weight: 0.4,
          checks: [
            {
              name: 'cultural_appropriateness',
              description: '文化适当性',
              weight: 1.0,
              severity: 'high',
              automated: false,
              manualRequired: true,
              rules: []
            }
          ]
        },
        {
          name: 'localization',
          description: '本土化',
          weight: 0.4,
          checks: [
            {
              name: 'date_time_format',
              description: '日期时间格式',
              weight: 0.3,
              severity: 'medium',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'date_format',
                  description: '日期格式本土化'
                },
                {
                  name: 'time_format',
                  description: '时间格式本土化'
                }
              ]
            },
            {
              name: 'currency_format',
              description: '货币格式',
              weight: 0.3,
              severity: 'medium',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'currency_symbol',
                  description: '货币符号本土化'
                },
                {
                  name: 'currency_position',
                  description: '货币位置本土化'
                }
              ]
            },
            {
              name: 'number_format',
              description: '数字格式',
              weight: 0.4,
              severity: 'medium',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'decimal_separator',
                  description: '小数分隔符'
                },
                {
                  name: 'thousand_separator',
                  description: '千位分隔符'
                }
              ]
            }
          ]
        },
        {
          name: 'idiomatic_expression',
          description: '惯用表达',
          weight: 0.2,
          checks: [
            {
              name: 'natural_phrases',
              description: '自然短语',
              weight: 1.0,
              severity: 'medium',
              automated: false,
              manualRequired: true,
              rules: []
            }
          ]
        }
      ]
    });

    // 标准5: 技术规范
    this.standards.push({
      name: 'technical_standards',
      description: '技术规范 - 确保翻译符合技术要求',
      weight: 0.20,
      criteria: [
        {
          name: 'format_compliance',
          description: '格式合规性',
          weight: 0.3,
          checks: [
            {
              name: 'json_format',
              description: 'JSON格式',
              weight: 1.0,
              severity: 'critical',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'valid_json',
                  description: '有效的JSON格式'
                },
                {
                  name: 'proper_escaping',
                  description: '正确的转义字符'
                }
              ]
            }
          ]
        },
        {
          name: 'placeholder_handling',
          description: '占位符处理',
          weight: 0.3,
          checks: [
            {
              name: 'placeholder_integrity',
              description: '占位符完整性',
              weight: 1.0,
              severity: 'critical',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'complete_placeholders',
                  description: '完整的占位符'
                },
                {
                  name: 'correct_placeholder_format',
                  description: '正确的占位符格式'
                }
              ]
            }
          ]
        },
        {
          name: 'character_encoding',
          description: '字符编码',
          weight: 0.2,
          checks: [
            {
              name: 'encoding_compliance',
              description: '编码合规性',
              weight: 1.0,
              severity: 'high',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'utf8_encoding',
                  description: 'UTF-8编码'
                },
                {
                  name: 'special_characters',
                  description: '特殊字符处理'
                }
              ]
            }
          ]
        },
        {
          name: 'platform_compatibility',
          description: '平台兼容性',
          weight: 0.2,
          checks: [
            {
              name: 'mobile_optimization',
              description: '移动端优化',
              weight: 1.0,
              severity: 'medium',
              automated: true,
              manualRequired: false,
              rules: [
                {
                  name: 'text_length',
                  description: '文本长度适合移动端',
                  threshold: 50
                },
                {
                  name: 'special_characters_mobile',
                  description: '移动端特殊字符支持'
                }
              ]
            }
          ]
        }
      ]
    });
  }

  /**
   * 评估翻译质量
   */
  evaluateTranslation(
    sourceText: string,
    translatedText: string,
    language: string,
    namespace: string,
    context: any = {}
  ): TranslationScoringResult {
    const results: CriterionScore[] = [];
    let totalScore = 0;
    let maxTotalScore = 0;

    for (const standard of this.standards) {
      const criterionScores = this.evaluateStandard(standard, sourceText, translatedText, language, namespace, context);
      results.push(...criterionScores);
    }

    // 计算总体分数
    for (const result of results) {
      totalScore += result.score;
      maxTotalScore += result.maxScore;
    }

    const overall = Math.round((totalScore / maxTotalScore) * 100);
    const pass = overall >= 70; // 70分为及格线

    return {
      standard: 'comprehensive',
      criteria: results,
      overall,
      pass,
      details: `总体评分: ${overall}/100, ${pass ? '通过' : '未通过'}`
    };
  }

  private evaluateStandard(
    standard: QualityStandard,
    sourceText: string,
    translatedText: string,
    language: string,
    namespace: string,
    context: any
  ): CriterionScore[] {
    const results: CriterionScore[] = [];

    for (const criterion of standard.criteria) {
      const score = this.evaluateCriterion(criterion, sourceText, translatedText, language, namespace, context);
      results.push(score);
    }

    return results;
  }

  private evaluateCriterion(
    criterion: QualityCriterion,
    sourceText: string,
    translatedText: string,
    language: string,
    namespace: string,
    context: any
  ): CriterionScore {
    const issues: QualityIssue[] = [];
    let totalScore = 0;
    let maxScore = 0;

    for (const check of criterion.checks) {
      const checkResult = this.evaluateCheck(check, sourceText, translatedText, language, namespace, context);
      totalScore += checkResult.score;
      maxScore += checkResult.maxScore;
      issues.push(...checkResult.issues);
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 100;
    const score = Math.round(percentage);
    const passed = score >= 70;

    return {
      name: criterion.name,
      score,
      maxScore: 100,
      passed,
      issues
    };
  }

  private evaluateCheck(
    check: QualityCheck,
    sourceText: string,
    translatedText: string,
    language: string,
    namespace: string,
    context: any
  ): { score: number; maxScore: number; issues: QualityIssue[] } {
    const issues: QualityIssue[] = [];
    let totalScore = 0;
    let maxScore = check.weight * 100;

    for (const rule of check.rules) {
      const ruleResult = this.evaluateRule(rule, sourceText, translatedText, language, namespace, context);
      if (ruleResult.failed) {
        const issue: QualityIssue = {
          type: rule.name,
          severity: check.severity,
          message: rule.description,
          suggestion: ruleResult.suggestion
        };
        issues.push(issue);
      } else {
        totalScore += ruleResult.score;
      }
    }

    // 如果是自定义检查
    if (check.customCheck && check.manualRequired) {
      // 手动检查，需要专家评估
      totalScore += 80; // 假设手动检查得分80分
    }

    const score = Math.min(totalScore, maxScore);
    return { score, maxScore, issues };
  }

  private evaluateRule(
    rule: QualityRule,
    sourceText: string,
    translatedText: string,
    language: string,
    namespace: string,
    context: any
  ): { failed: boolean; score: number; suggestion?: string } {
    // 执行规则检查
    if (rule.customCheck) {
      const result = rule.customCheck(translatedText, context);
      return {
        failed: !result,
        score: result ? 20 : 0,
        suggestion: result ? undefined : '需要检查此规则'
      };
    }

    if (rule.pattern) {
      const regex = new RegExp(rule.pattern, 'i');
      const match = regex.test(translatedText);
      return {
        failed: !match,
        score: match ? 20 : 0,
        suggestion: match ? undefined : `应符合模式: ${rule.pattern}`
      };
    }

    // 默认检查
    return {
      failed: false,
      score: 20
    };
  }

  /**
   * 检查核心术语一致性
   */
  private checkCoreTermsConsistency(text: string, context: any): boolean {
    // 核心术语列表
    const coreTerms = [
      'coins', 'shares', 'balance', 'currency', 'amount',
      'recharge', 'withdraw', 'time', 'date', 'today',
      'yesterday', 'tomorrow', 'tap', 'swipe', 'long_press',
      'double_tap', 'confirm'
    ];

    const language = context.language;
    const expectedTranslations = this.getExpectedTranslations(coreTerms, language);
    
    // 检查文本中是否包含预期的翻译
    for (const [term, expectedTranslation] of Object.entries(expectedTranslations)) {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        // 如果包含原术语，检查是否有对应的翻译
        const hasTranslation = Object.values(expectedTranslations).some(translation => 
          text.includes(translation)
        );
        if (!hasTranslation) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 获取预期翻译
   */
  private getExpectedTranslations(terms: string[], language: string): Record<string, string> {
    const translations: Record<string, Record<string, string>> = {
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

    return translations[language] || {};
  }

  /**
   * 获取质量标准
   */
  getStandards(): QualityStandard[] {
    return this.standards;
  }

  /**
   * 获取特定标准的详细评估
   */
  getStandardDetails(standardName: string): QualityStandard | undefined {
    return this.standards.find(standard => standard.name === standardName);
  }
}

export default TranslationQualityStandards;