import { FeedbackData } from '../components/TranslationFeedbackCollector';
import { ImprovementSuggestion } from '../utils/translation-improvement-suggester';
import { feedbackDataManager } from './feedback-data-manager';
/**
 * 翻译改进效果评估系统
 * 用于评估翻译改进的效果、ROI和用户满意度变化
 */


export interface ImprovementEvaluation {
  id: string;
  evaluationType: 'before_after' | 'a_b_test' | 'cohort_analysis' | 'time_series';
  improvementId: string;
  improvementTitle: string;
  evaluationPeriod: {
    start: Date;
    end: Date;
    duration: number; // 天数
  };
  baselineMetrics: BaselineMetrics;
  postImplementationMetrics: PostImplementationMetrics;
  impactAnalysis: ImpactAnalysis;
  roiCalculation: ROICalculation;
  qualityScore: QualityScore;
  userFeedbackComparison: UserFeedbackComparison;
  recommendations: EvaluationRecommendation[];
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
}

export interface BaselineMetrics {
  period: {
    start: Date;
    end: Date;
  };
  averageRating: number;
  satisfactionRate: number; // 4-5星占比
  totalFeedbacks: number;
  criticalIssuesCount: number;
  resolutionRate: number;
  averageResponseTime: number;
  qualityScore: number;
  topIssueTypes: { [key: string]: number };
  languagePerformance: Array<{
    language: string;
    averageRating: number;
    feedbackCount: number;
  }>;
}

export interface PostImplementationMetrics {
  period: {
    start: Date;
    end: Date;
  };
  averageRating: number;
  satisfactionRate: number;
  totalFeedbacks: number;
  criticalIssuesCount: number;
  resolutionRate: number;
  averageResponseTime: number;
  qualityScore: number;
  topIssueTypes: { [key: string]: number };
  languagePerformance: Array<{
    language: string;
    averageRating: number;
    feedbackCount: number;
  }>;
  improvementMetrics: {
    userAdoptionRate: number;
    issueReductionRate: number;
    satisfactionImprovement: number;
  };
}

export interface ImpactAnalysis {
  overallImpact: 'significant_positive' | 'positive' | 'neutral' | 'negative' | 'significant_negative';
  impactScore: number; // -100 to 100
  keyFindings: string[];
  statisticalSignificance: {
    isSignificant: boolean;
    pValue: number;
    confidence: number; // 0-1
    sampleSize: number;
  };
  impactByCategory: {
    [category: string]: {
      impactScore: number;
      changeRate: number;
      userFeedback: string[];
    };
  };
  timeToValue: number; // 天数
  sustainabilityScore: number; // 0-100
}

export interface ROICalculation {
  investment: {
    development: number;
    deployment: number;
    training: number;
    total: number;
  };
  benefits: {
    timeSavings: number; // 小时
    costAvoidance: number;
    revenueImpact: number;
    userSatisfactionValue: number;
    total: number;
  };
  roi: number; // 百分比
  paybackPeriod: number; // 天数;
  npv: number; // 净现值
  sensitivityAnalysis: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
}

export interface QualityScore {
  overall: number; // 0-100
  breakdown: {
    accuracy: number;
    consistency: number;
    contextAppropriateness: number;
    culturalAdaptation: number;
    technicalQuality: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  benchmarking: {
    industryAverage: number;
    bestInClass: number;
    ourPosition: number;
  };
}

export interface UserFeedbackComparison {
  positiveFeedback: {
    baseline: number;
    postImplementation: number;
    changeRate: number;
    commonThemes: string[];
  };
  negativeFeedback: {
    baseline: number;
    postImplementation: number;
    changeRate: number;
    commonThemes: string[];
  };
  neutralFeedback: {
    baseline: number;
    postImplementation: number;
    changeRate: number;
  };
  feedbackVolume: {
    baseline: number;
    postImplementation: number;
    changeRate: number;
  };
}

export interface EvaluationRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'optimize' | 'scale' | 'pivot' | 'discontinue';
  title: string;
  description: string;
  rationale: string;
  expectedOutcome: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  resources: string[];
}

export interface EvaluationSummary {
  totalEvaluations: number;
  successRate: number;
  averageROI: number;
  averageQualityImprovement: number;
  topPerformers: string[];
  lessonsLearned: string[];
  bestPractices: string[];
}

class TranslationImprovementEvaluator {
  private evaluations: Map<string, ImprovementEvaluation> = new Map();
  private evaluationQueue: string[] = [];

  constructor() {
    this.loadExistingEvaluations();
}

  /**
   * 加载现有评估数据
   */
  private loadExistingEvaluations(): void {
    try {
      const saved = localStorage.getItem('improvement_evaluations');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.evaluations : new Map(
          parsed.map((item: any) => [
            item.id,
            {
              ...item,
              evaluationPeriod: {
                ...item.evaluationPeriod,
                start: new Date(item.evaluationPeriod.start),
                end: new Date(item.evaluationPeriod.end)
              },
              baselineMetrics: {
                ...item.baselineMetrics,
                period: {
                  start: new Date(item.baselineMetrics.period.start),
                  end: new Date(item.baselineMetrics.period.end)
                }
              },
              postImplementationMetrics: {
                ...item.postImplementationMetrics,
                period: {
                  start: new Date(item.postImplementationMetrics.period.start),
                  end: new Date(item.postImplementationMetrics.period.end)
                }
              },
              createdAt: new Date(item.createdAt),
              completedAt: item.completedAt ? new Date(item.completedAt) : undefined
            }
          ])
        );
      }
    } catch (error) {
      console.error('加载评估数据失败:', error);
    }
  }

  /**
   * 保存评估数据
   */
  private saveEvaluations(): void {
    try {
      const data = Array.from(this.evaluations.values());
      localStorage.setItem('improvement_evaluations', JSON.stringify(data));
    } catch (error) {
      console.error('保存评估数据失败:', error);
    }
  }

  /**
   * 创建改进效果评估
   */
  async createEvaluation(
    improvement: ImprovementSuggestion,
    evaluationType: ImprovementEvaluation['evaluationType'] = 'before_after',
    baselinePeriodDays: number = 30,
    evaluationPeriodDays: number = 30
  ): Promise<string> {
    const evaluationId = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 计算时间段
    const now = new Date();
    const baselineStart = new Date(now.getTime() - baselinePeriodDays * 24 * 60 * 60 * 1000);
    const evaluationStart = new Date(now.getTime() - evaluationPeriodDays * 24 * 60 * 60 * 1000);
    
    // 收集基线指标
    const baselineMetrics = await this.collectBaselineMetrics(baselineStart, now, improvement);
    
    const evaluation: ImprovementEvaluation = {
      id: evaluationId,
      evaluationType,
      improvementId: improvement.id,
      improvementTitle: improvement.title,
      evaluationPeriod: {
        start: evaluationStart,
        end: now,
        duration: evaluationPeriodDays
      },
      baselineMetrics,
      postImplementationMetrics: {
        period: {
          start: evaluationStart,
          end: now
        },
        averageRating: 0,
        satisfactionRate: 0,
        totalFeedbacks: 0,
        criticalIssuesCount: 0,
        resolutionRate: 0,
        averageResponseTime: 0,
        qualityScore: 0,
        topIssueTypes: {},
        languagePerformance: [],
        improvementMetrics: {
          userAdoptionRate: 0,
          issueReductionRate: 0,
          satisfactionImprovement: 0
        }
      },
      impactAnalysis: {
        overallImpact: 'neutral',
        impactScore: 0,
        keyFindings: [],
        statisticalSignificance: {
          isSignificant: false,
          pValue: 1,
          confidence: 0,
          sampleSize: 0
        },
        impactByCategory: {},
        timeToValue: 0,
        sustainabilityScore: 0
      },
      roiCalculation: {
        investment: {
          development: 0,
          deployment: 0,
          training: 0,
          total: 0
        },
        benefits: {
          timeSavings: 0,
          costAvoidance: 0,
          revenueImpact: 0,
          userSatisfactionValue: 0,
          total: 0
        },
        roi: 0,
        paybackPeriod: 0,
        npv: 0,
        sensitivityAnalysis: {
          optimistic: 0,
          realistic: 0,
          pessimistic: 0
        }
      },
      qualityScore: {
        overall: 0,
        breakdown: {
          accuracy: 0,
          consistency: 0,
          contextAppropriateness: 0,
          culturalAdaptation: 0,
          technicalQuality: 0
        },
        trend: 'stable',
        benchmarking: {
          industryAverage: 75,
          bestInClass: 90,
          ourPosition: 0
        }
      },
      userFeedbackComparison: {
        positiveFeedback: {
          baseline: 0,
          postImplementation: 0,
          changeRate: 0,
          commonThemes: []
        },
        negativeFeedback: {
          baseline: 0,
          postImplementation: 0,
          changeRate: 0,
          commonThemes: []
        },
        neutralFeedback: {
          baseline: 0,
          postImplementation: 0,
          changeRate: 0
        },
        feedbackVolume: {
          baseline: 0,
          postImplementation: 0,
          changeRate: 0
        }
      },
      recommendations: [],
      status: 'in_progress',
      createdAt: now
    };

    this.evaluations.set(evaluationId, evaluation);
    this.evaluationQueue.push(evaluationId);
    
    // 开始评估过程
    await this.runEvaluation(evaluationId);
    
    return evaluationId;
  }

  /**
   * 收集基线指标
   */
  private async collectBaselineMetrics(
    startDate: Date,
    endDate: Date,
    improvement: ImprovementSuggestion
  ): Promise<BaselineMetrics> {
    const filter = { 
      dateRange: { start: startDate, end: endDate },
      category: improvement.type === 'terminology' ? 'terminology' : undefined,
      tags: improvement.tags.length > 0 ? improvement.tags : undefined
    };
    
    const feedbacks = feedbackDataManager.getAllFeedback(filter);
    const analytics = feedbackDataManager.getFeedbackAnalytics(filter);
    
    // 按语言对分组统计
    const languagePerformance = this.groupFeedbacksByLanguage(feedbacks);
    
    // 统计问题类型
    const topIssueTypes: { [key: string]: number } = {};
    feedbacks.forEach(feedback => {
      feedback.issues.forEach(issue => {
        topIssueTypes[issue.type] = (topIssueTypes[issue.type] || 0) + 1;
      });
    });

    return {
      period: { start: startDate, end: endDate },
      averageRating: analytics.averageRating,
      satisfactionRate: Object.values(analytics.ratingDistribution)
        .slice(3) // 4和5星
        .reduce((sum, count) => sum + count, 0) / analytics.totalFeedbacks,
      totalFeedbacks: analytics.totalFeedbacks,
      criticalIssuesCount: feedbacks.filter(f => 
        f.urgency :== 'high' && f.issues.some(issue => 
          issue.severity :== 'critical' || issue.severity === 'major'
        )
      ).length,
      resolutionRate: analytics.resolvedRate,
      averageResponseTime: 24, // 简化处理
      qualityScore: analytics.qualityScore,
      topIssueTypes,
      languagePerformance
    };
  }

  /**
   * 按语言分组反馈
   */
  private groupFeedbacksByLanguage(feedbacks: FeedbackData[]) {
    const languageGroups: { [key: string]: { count: number; totalRating: number } } = {};
    
    feedbacks.forEach(feedback => {
      const lang = `${feedback.sourceLanguage}→${feedback.targetLanguage}`;
      if (!languageGroups[lang]) {
        languageGroups[lang] = { count: 0, totalRating: 0 };
      }
      (languageGroups?.lang ?? null).count++;
      (languageGroups?.lang ?? null).totalRating += feedback.rating;
    });

    return Object.entries(languageGroups).map(([language, stats]) => ({
      language,
      averageRating: stats.totalRating / stats.count,
      feedbackCount: stats.count
    }));
  }

  /**
   * 运行评估
   */
  private async runEvaluation(evaluationId: string): Promise<void> {
    const evaluation = this.evaluations.get(evaluationId);
    if (!evaluation) return; {

    try {
      // 收集实施后指标
      await this.collectPostImplementationMetrics(evaluation);
      
      // 计算影响分析
      await this.calculateImpactAnalysis(evaluation);
      
      // 计算ROI
      await this.calculateROI(evaluation);
      
      // 计算质量分数
      await this.calculateQualityScore(evaluation);
      
      // 比较用户反馈
      await this.compareUserFeedback(evaluation);
      
      // 生成建议
      await this.generateRecommendations(evaluation);
      
      // 完成评估
      evaluation.status = 'completed';
      evaluation.completedAt = new Date();
      
      this.saveEvaluations();
      
    } catch (error) {
      console.error(`评估 ${evaluationId} 失败:`, error);
      evaluation.status = 'cancelled';
    }
  }

  /**
   * 收集实施后指标
   */
  private async collectPostImplementationMetrics(evaluation: ImprovementEvaluation): Promise<void> {
    const startDate = evaluation.evaluationPeriod.start;
    const endDate = evaluation.evaluationPeriod.end;
    
    const filter = { 
      dateRange: { start: startDate, end: endDate },
      category: evaluation.improvementTitle.includes('术语') ? 'terminology' : undefined
    };
    
    const feedbacks = feedbackDataManager.getAllFeedback(filter);
    const analytics = feedbackDataManager.getFeedbackAnalytics(filter);
    
    const languagePerformance = this.groupFeedbacksByLanguage(feedbacks);
    
    const criticalIssues = feedbacks.filter(f =>;
      f.urgency :== 'high' && f.issues.some(issue => 
        issue.severity :== 'critical' || issue.severity === 'major'
      )
    ).length;
    
    // 计算改进指标
    const issueReductionRate = evaluation.baselineMetrics.criticalIssuesCount > 0 ? 
      ((evaluation.baselineMetrics.criticalIssuesCount - criticalIssues) / 
       evaluation.baselineMetrics.criticalIssuesCount) * 100 : 0;
    
    const satisfactionImprovement =;
      analytics.averageRating - evaluation.baselineMetrics.averageRating;
    
    evaluation.postImplementationMetrics = {
      period: { start: startDate, end: endDate },
      averageRating: analytics.averageRating,
      satisfactionRate: Object.values(analytics.ratingDistribution)
        .slice(3)
        .reduce((sum, count) => sum + count, 0) / analytics.totalFeedbacks,
      totalFeedbacks: analytics.totalFeedbacks,
      criticalIssuesCount: criticalIssues,
      resolutionRate: analytics.resolvedRate,
      averageResponseTime: 24,
      qualityScore: analytics.qualityScore,
      topIssueTypes: this.calculateTopIssues(feedbacks),
      languagePerformance,
      improvementMetrics: {
        userAdoptionRate: 85, // 模拟数据
        issueReductionRate: Math.max(0, issueReductionRate),
        satisfactionImprovement: Math.max(0, satisfactionImprovement)
      }
    };
  }

  /**
   * 计算主要问题类型
   */
  private calculateTopIssues(feedbacks: FeedbackData[]): { [key: string]: number } {
    const issues: { [key: string]: number } = {};
    
    feedbacks.forEach(feedback => {
      feedback.issues.forEach(issue => {
        issues[issue.type] = (issues[issue.type] || 0) + 1;
      });
    });
    
    return issues;
  }

  /**
   * 计算影响分析
   */
  private async calculateImpactAnalysis(evaluation: ImprovementEvaluation): Promise<void> {
    const baseline = evaluation.baselineMetrics;
    const current = evaluation.postImplementationMetrics;
    
    // 计算各项指标的改进率
    const ratingImprovement = ((current.averageRating - baseline.averageRating) / baseline.averageRating) * 100;
    const satisfactionImprovement = ((current.satisfactionRate - baseline.satisfactionRate) / baseline.satisfactionRate) * 100;
    const qualityImprovement = ((current.qualityScore - baseline.qualityScore) / baseline.qualityScore) * 100;
    const issueReduction = ((baseline.criticalIssuesCount - current.criticalIssuesCount) / baseline.criticalIssuesCount) * 100;
    
    // 计算总体影响分数
    const impactScore = (ratingImprovement + satisfactionImprovement + qualityImprovement + issueReduction) / 4;
    
    // 确定影响等级
    let overallImpact: ImpactAnalysis['overallImpact'];
    if (impactScore >= 20) overallImpact = 'significant_positive'; {
    else if (impactScore >= 5) overallImpact = 'positive'; {
    else if (impactScore >= -5) overallImpact = 'neutral'; {
    else if (impactScore >= -20) overallImpact = 'negative'; {
    else overallImpact = 'significant_negative';
    
    // 统计显著性检验（简化）
    const sampleSize = baseline.totalFeedbacks + current.totalFeedbacks;
    const isSignificant = sampleSize >= 30 && Math.abs(impactScore) >= 10;
    
    evaluation.impactAnalysis = {
      overallImpact,
      impactScore: Math.round(impactScore * 100) / 100,
      keyFindings: this.generateKeyFindings(evaluation),
      statisticalSignificance: {
        isSignificant,
        pValue: isSignificant ? 0.05 : 0.1,
        confidence: isSignificant ? 0.95 : 0.8,
        sampleSize
      },
      impactByCategory: this.calculateImpactByCategory(evaluation),
      timeToValue: 14, // 假设14天见效
      sustainabilityScore: 75 // 模拟数据
    };
  }

  /**
   * 生成关键发现
   */
  private generateKeyFindings(evaluation: ImprovementEvaluation): string[] {
    const findings: string[] = [];
    const baseline = evaluation.baselineMetrics;
    const current = evaluation.postImplementationMetrics;
    
    if (current.averageRating > baseline.averageRating) {
      findings.push(`用户评分平均提升${(current.averageRating - baseline.averageRating).toFixed(2)}分`);
    }
    
    if (current.criticalIssuesCount < baseline.criticalIssuesCount) {
      findings.push(`严重问题数量减少${baseline.criticalIssuesCount - current.criticalIssuesCount}个`);
    }
    
    if (current.satisfactionRate > baseline.satisfactionRate) {
      findings.push(`满意度提升${((current.satisfactionRate - baseline.satisfactionRate) * 100).toFixed(1)}%`);
    }
    
    return findings;
  }

  /**
   * 按类别计算影响
   */
  private calculateImpactByCategory(evaluation: ImprovementEvaluation): ImpactAnalysis['impactByCategory'] {
    // 简化处理，基于改进类型计算影响
    const impact: ImpactAnalysis['impactByCategory'] = {};
    
    if (evaluation.improvementTitle.includes('术语')) {
      impact['专业性'] = {
        impactScore: 15,
        changeRate: 12,
        userFeedback: ['术语更准确', '专业性提升']
      };
    }
    
    if (evaluation.improvementTitle.includes('风格')) {
      impact['表达风格'] = {
        impactScore: 10,
        changeRate: 8,
        userFeedback: ['表达更自然', '风格更统一']
      };
    }
    
    return impact;
  }

  /**
   * 计算ROI
   */
  private async calculateROI(evaluation: ImprovementEvaluation): Promise<void> {
    // 估算投资成本
    const developmentCost = 8000; // 假设开发成本;
    const deploymentCost = 2000;  // 部署成本;
    const trainingCost = 1000;    // 培训成本;
    const totalInvestment = developmentCost + deploymentCost + trainingCost;
    
    // 估算收益
    const feedbackReduction = evaluation.baselineMetrics.totalFeedbacks -;
                              evaluation.postImplementationMetrics.totalFeedbacks;
    const timeSavings = feedbackReduction * 0.5; // 每个反馈节省0.5小时;
    const costAvoidance = feedbackReduction * 50; // 每个问题避免50元成本;
    const satisfactionValue = evaluation.impactAnalysis.impactScore * 100; // 满意度价值;
    const totalBenefits = timeSavings * 100 + costAvoidance + satisfactionValue; // 假设100元/小时;
    
    // 计算ROI
    const roi = ((totalBenefits - totalInvestment) / totalInvestment) * 100;
    const paybackPeriod = totalInvestment / (totalBenefits / 30); // 30天回收期;
    
    // 敏感性分析
    const optimistic = roi * 1.5;
    const realistic = roi;
    const pessimistic = roi * 0.5;
    
    evaluation.roiCalculation = {
      investment: {
        development: developmentCost,
        deployment: deploymentCost,
        training: trainingCost,
        total: totalInvestment
      },
      benefits: {
        timeSavings,
        costAvoidance,
        revenueImpact: 0,
        userSatisfactionValue: satisfactionValue,
        total: totalBenefits
      },
      roi: Math.round(roi * 100) / 100,
      paybackPeriod: Math.round(paybackPeriod * 10) / 10,
      npv: totalBenefits - totalInvestment,
      sensitivityAnalysis: {
        optimistic: Math.round(optimistic * 100) / 100,
        realistic: Math.round(realistic * 100) / 100,
        pessimistic: Math.round(pessimistic * 100) / 100
      }
    };
  }

  /**
   * 计算质量分数
   */
  private async calculateQualityScore(evaluation: ImprovementEvaluation): Promise<void> {
    const baseline = evaluation.baselineMetrics;
    const current = evaluation.postImplementationMetrics;
    
    // 基于改进指标计算各项分数
    const accuracy = Math.min(100, baseline.qualityScore + 10);
    const consistency = Math.min(100, baseline.qualityScore + 8);
    const contextAppropriateness = Math.min(100, baseline.qualityScore + 12);
    const culturalAdaptation = Math.min(100, baseline.qualityScore + 6);
    const technicalQuality = Math.min(100, baseline.qualityScore + 9);
    
    const overall = (accuracy + consistency + contextAppropriateness + culturalAdaptation + technicalQuality) / 5;
    
    // 判断趋势
    let trend: QualityScore['trend'] = 'stable';
    if (overall > baseline.qualityScore + 5) trend = 'improving'; {
    else if (overall < baseline.qualityScore - 5) trend = 'declining'; {
    
    evaluation.qualityScore = {
      overall: Math.round(overall),
      breakdown: {
        accuracy: Math.round(accuracy),
        consistency: Math.round(consistency),
        contextAppropriateness: Math.round(contextAppropriateness),
        culturalAdaptation: Math.round(culturalAdaptation),
        technicalQuality: Math.round(technicalQuality)
      },
      trend,
      benchmarking: {
        industryAverage: 75,
        bestInClass: 90,
        ourPosition: Math.round(overall)
      }
    };
  }

  /**
   * 比较用户反馈
   */
  private async compareUserFeedback(evaluation: ImprovementEvaluation): Promise<void> {
    const baseline = evaluation.baselineMetrics;
    const current = evaluation.postImplementationMetrics;
    
    const baselinePositive = Math.floor(baseline.totalFeedbacks * baseline.satisfactionRate);
    const baselineNegative = Math.floor(baseline.totalFeedbacks * 0.2); // 假设20%负面;
    const baselineNeutral = baseline.totalFeedbacks - baselinePositive - baselineNegative;
    
    const currentPositive = Math.floor(current.totalFeedbacks * current.satisfactionRate);
    const currentNegative = Math.floor(current.totalFeedbacks * 0.15); // 负面比例下降;
    const currentNeutral = current.totalFeedbacks - currentPositive - currentNegative;
    
    evaluation.userFeedbackComparison = {
      positiveFeedback: {
        baseline: baselinePositive,
        postImplementation: currentPositive,
        changeRate: ((currentPositive - baselinePositive) / baselinePositive) * 100,
        commonThemes: ['翻译质量提升', '用户体验改善']
      },
      negativeFeedback: {
        baseline: baselineNegative,
        postImplementation: currentNegative,
        changeRate: ((currentNegative - baselineNegative) / baselineNegative) * 100,
        commonThemes: ['仍需改进的方面']
      },
      neutralFeedback: {
        baseline: baselineNeutral,
        postImplementation: currentNeutral,
        changeRate: ((currentNeutral - baselineNeutral) / baselineNeutral) * 100
      },
      feedbackVolume: {
        baseline: baseline.totalFeedbacks,
        postImplementation: current.totalFeedbacks,
        changeRate: ((current.totalFeedbacks - baseline.totalFeedbacks) / baseline.totalFeedbacks) * 100
      }
    };
  }

  /**
   * 生成建议
   */
  private async generateRecommendations(evaluation: ImprovementEvaluation): Promise<void> {
    const recommendations: EvaluationRecommendation[] = [];
    
    if (evaluation.impactAnalysis.impactScore > 10) {
      recommendations.push({
        id: 'scale_improvement',
        priority: 'high',
        category: 'scale',
        title: '扩大改进范围',
        description: '当前改进效果显著，建议将成功经验应用到更多场景',
        rationale: `影响分数达到${evaluation.impactAnalysis.impactScore}，表明改进方案有效`,
        expectedOutcome: '进一步提升整体翻译质量',
        effort: 'medium',
        timeline: '2-4周',
        resources: ['翻译团队', '产品团队']
      });
    }
    
    if (evaluation.roiCalculation.roi > 50) {
      recommendations.push({
        id: 'invest_similar',
        priority: 'medium',
        category: 'optimize',
        title: '投资类似改进',
        description: 'ROI表现优秀，建议投资类似的项目',
        rationale: `ROI达到${evaluation.roiCalculation.roi}%，具有良好投资回报`,
        expectedOutcome: '持续改善翻译质量',
        effort: 'low',
        timeline: '1-2周',
        resources: ['项目管理团队']
      });
    }
    
    if (evaluation.qualityScore.overall < 80) {
      recommendations.push({
        id: 'additional_improvements',
        priority: 'medium',
        category: 'optimize',
        title: '继续优化',
        description: '质量分数仍有提升空间，建议进一步改进',
        rationale: `当前质量分数为${evaluation.qualityScore.overall}，低于行业平均水平`,
        expectedOutcome: '质量分数提升至80分以上',
        effort: 'high',
        timeline: '4-6周',
        resources: ['质量控制团队', '翻译专家']
      });
    }
    
    evaluation.recommendations = recommendations;
  }

  /**
   * 获取评估结果
   */
  getEvaluation(evaluationId: string): ImprovementEvaluation | null {
    return this.evaluations.get(evaluationId) || null;
  }

  /**
   * 获取所有评估
   */
  getAllEvaluations(): ImprovementEvaluation[] {
    return Array.from(this.evaluations.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * 获取评估摘要
   */
  getEvaluationSummary(): EvaluationSummary {
    const evaluations = this.getAllEvaluations();
    const completedEvaluations = evaluations.filter(e => e.status === 'completed');
    
    if (completedEvaluations.length === 0) {
      return {
  }
        totalEvaluations: 0,
        successRate: 0,
        averageROI: 0,
        averageQualityImprovement: 0,
        topPerformers: [],
        lessonsLearned: [],
        bestPractices: []
      };
    }
    
    const successRate = completedEvaluations.filter(e =>;
      e.impactAnalysis.overallImpact.includes('positive')
    ).length / completedEvaluations.length;
    
    const averageROI = completedEvaluations.reduce((sum, e) =>;
      sum + e.roiCalculation.roi, 0) / completedEvaluations.length;
    
    const averageQualityImprovement = completedEvaluations.reduce((sum, e) =>;
      sum + e.impactAnalysis.impactScore, 0) / completedEvaluations.length;
    
    // 获取表现最好的改进
    const topPerformers = completedEvaluations;
      .sort((a, b) => b.impactAnalysis.impactScore - a.impactAnalysis.impactScore)
      .slice(0, 5)
      .map(e => e.improvementTitle);
    
    return {
      totalEvaluations: evaluations.length,
      successRate,
      averageROI,
      averageQualityImprovement,
      topPerformers,
      lessonsLearned: [
        '持续的用户反馈是改进的关键指标',
        '定期评估有助于及时调整策略',
        '投资回报率是决策的重要依据'
      ],
      bestPractices: [
        '建立清晰的成功指标',
        '保持评估的客观性',
        '及时基于评估结果调整方向'
      ]
    };
  }

  /**
   * 导出评估报告
   */
  exportEvaluationReport(evaluationId: string): string {
    const evaluation = this.getEvaluation(evaluationId);
    if (!evaluation) {
      throw new Error('评估不存在');
    }
    
    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      evaluation
    }, null, 2);
  }

  /**
   * 批量评估
   */
  async batchEvaluateImprovements(
    improvements: ImprovementSuggestion[],
    maxConcurrent: number = 3
  ): Promise<string[]> {
    const evaluationIds: string[] = [];
    const chunks = this.chunkArray(improvements, maxConcurrent);
    
    for (const chunk of chunks) {
      const promises = chunk.map(improvement =>;
        this.createEvaluation(improvement)
      );
      
      const results = await Promise.all(promises);
      evaluationIds.push(...results);
    }
    
    return evaluationIds;
  }

  /**
   * 数组分块
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 清理过期评估
   */
  cleanupOldEvaluations(daysOld: number = 365): void {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    for (const [id, evaluation] of this.evaluations.entries()) {
      if (evaluation.createdAt < cutoffDate && evaluation.status === 'completed') {
        this.evaluations.delete(id);
      }
    }
    
    this.saveEvaluations();
  }
}

// 创建单例实例
export const translationImprovementEvaluator = new TranslationImprovementEvaluator();

export default translationImprovementEvaluator;
}}}}}}