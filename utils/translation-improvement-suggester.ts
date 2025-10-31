/**
 * 翻译改进建议系统
 * 基于用户反馈生成智能翻译改进建议
 */

import { FeedbackData } from '../components/TranslationFeedbackCollector';
import { feedbackDataManager } from './feedback-data-manager';

export interface ImprovementSuggestion {
  id: string;
  type: 'terminology' | 'style' | 'grammar' | 'context' | 'cultural' | 'formatting';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  originalText: string;
  suggestedTranslation: string;
  reason: string;
  impact: {
    userSatisfaction: number; // 0-100
    accuracy: number; // 0-100
    frequency: number; // 出现频率 0-100
  };
  relatedFeedbacks: string[]; // 相关反馈ID列表
  implementation: {
    estimatedEffort: 'low' | 'medium' | 'high';
    timeRequired: number; // 小时
    resources: string[];
    dependencies: string[];
  };
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  metadata: {
    sourceLanguage: string;
    targetLanguage: string;
    context: string;
    confidence: number; // 0-1
  };
}

export interface SuggestionAnalysis {
  totalSuggestions: number;
  highPriorityCount: number;
  averageImpact: number;
  completionRate: number;
  trendingTypes: { [key: string]: number };
  implementationProgress: { [key: string]: number };
  roiEstimate: number; // 投资回报率估算
}

export interface QualityMetrics {
  overallScore: number;
  accuracyScore: number;
  styleScore: number;
  contextScore: number;
  culturalScore: number;
  frequencyScore: number;
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
}

class TranslationImprovementSuggester {
  private suggestions: ImprovementSuggestion[] = [];
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private readonly MIN_FEEDBACK_COUNT = 3;

  constructor() {
    this.loadExistingSuggestions();
  }

  /**
   * 加载现有建议
   */
  private loadExistingSuggestions(): void {
    try {
      const saved = localStorage.getItem('improvement_suggestions');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.suggestions = parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }));
      }
    } catch (error) {
      console.error('加载改进建议失败:', error);
      this.suggestions = [];
    }
  }

  /**
   * 保存建议到存储
   */
  private saveSuggestions(): void {
    try {
      localStorage.setItem('improvement_suggestions', JSON.stringify(this.suggestions));
    } catch (error) {
      console.error('保存改进建议失败:', error);
    }
  }

  /**
   * 基于反馈数据生成改进建议
   */
  async generateSuggestionsFromFeedback(feedbacks: FeedbackData[]): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];

    // 按问题类型分组分析
    const groupedFeedbacks = this.groupFeedbacksByIssue(feedbacks);
    
    for (const [issueType, feedbackGroup] of Object.entries(groupedFeedbacks)) {
      const suggestion = await this.analyzeIssueType(issueType as any, feedbackGroup);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    // 按优先级排序
    suggestions.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // 保存新生成的建议
    this.suggestions.push(...suggestions);
    this.saveSuggestions();

    return suggestions;
  }

  /**
   * 按问题类型分组反馈
   */
  private groupFeedbacksByIssue(feedbacks: FeedbackData[]): { [key: string]: FeedbackData[] } {
    const groups: { [key: string]: FeedbackData[] } = {};

    feedbacks.forEach(feedback => {
      feedback.issues.forEach(issue => {
        if (!groups[issue.type]) {
          groups[issue.type] = [];
        }
        groups[issue.type].push(feedback);
      });
    });

    return groups;
  }

  /**
   * 分析特定问题类型并生成建议
   */
  private async analyzeIssueType(
    issueType: 'incorrect' | 'missing' | 'inappropriate' | 'format' | 'context',
    feedbacks: FeedbackData[]
  ): Promise<ImprovementSuggestion | null> {
    
    if (feedbacks.length < this.MIN_FEEDBACK_COUNT) {
      return null; // 需要足够的反馈数据
    }

    const suggestion: ImprovementSuggestion = {
      id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.mapIssueTypeToSuggestionType(issueType),
      priority: this.determinePriority(feedbacks),
      title: this.generateTitle(issueType, feedbacks),
      description: this.generateDescription(issueType, feedbacks),
      originalText: this.extractCommonPattern(feedbacks, 'originalText'),
      suggestedTranslation: this.generateSuggestedTranslation(feedbacks),
      reason: this.generateReason(issueType, feedbacks),
      impact: this.calculateImpact(feedbacks),
      relatedFeedbacks: feedbacks.map(f => f.id),
      implementation: this.estimateImplementation(issueType),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: this.extractTags(feedbacks),
      metadata: {
        sourceLanguage: feedbacks[0].sourceLanguage,
        targetLanguage: feedbacks[0].targetLanguage,
        context: feedbacks[0].translationContext,
        confidence: this.calculateConfidence(feedbacks)
      }
    };

    return suggestion;
  }

  /**
   * 将问题类型映射为建议类型
   */
  private mapIssueTypeToSuggestionType(issueType: string): ImprovementSuggestion['type'] {
    const mapping: { [key: string]: ImprovementSuggestion['type'] } = {
      'incorrect': 'accuracy',
      'missing': 'context',
      'inappropriate': 'style',
      'format': 'formatting',
      'context': 'cultural'
    };
    return mapping[issueType] || 'style';
  }

  /**
   * 确定优先级
   */
  private determinePriority(feedbacks: FeedbackData[]): ImprovementSuggestion['priority'] {
    const highSeverityCount = feedbacks.filter(f => 
      f.issues.some(issue => 
        issue.severity === 'critical' || issue.severity === 'major'
      )
    ).length;
    
    const highUrgencyCount = feedbacks.filter(f => f.urgency === 'high').length;
    const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;

    if (highSeverityCount > 0 || highUrgencyCount > 0 || averageRating < 2) {
      return 'urgent';
    } else if (highSeverityCount > 0 || averageRating < 3) {
      return 'high';
    } else if (averageRating < 4) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * 生成建议标题
   */
  private generateTitle(issueType: string, feedbacks: FeedbackData[]): string {
    const typeMap: { [key: string]: string } = {
      'incorrect': '翻译准确性改进',
      'missing': '内容完整性优化',
      'inappropriate': '用词表达优化',
      'format': '格式规范化',
      'context': '语境适配改进'
    };
    
    const count = feedbacks.length;
    return `${typeMap[issueType] || '翻译改进'} (${count}条反馈)`;
  }

  /**
   * 生成建议描述
   */
  private generateDescription(issueType: string, feedbacks: FeedbackData[]): string {
    const commonIssues = this.extractCommonIssues(feedbacks);
    const frequency = feedbacks.length;
    
    return `基于${frequency}条用户反馈，发现以下问题：${commonIssues.join('、')}。建议进行相应的翻译改进以提升用户体验。`;
  }

  /**
   * 提取常见模式
   */
  private extractCommonPattern(feedbacks: FeedbackData[], field: keyof FeedbackData): string {
    // 简化处理，返回第一个值作为示例
    return feedbacks[0][field] as string;
  }

  /**
   * 生成建议翻译
   */
  private generateSuggestedTranslation(feedbacks: FeedbackData[]): string {
    // 基于用户建议和改进意见生成改进的翻译
    const suggestions = feedbacks
      .filter(f => f.improvementSuggestion)
      .map(f => f.improvementSuggestion);
    
    if (suggestions.length > 0) {
      return suggestions[0]; // 使用第一个建议作为参考
    }
    
    return '建议的改进翻译内容';
  }

  /**
   * 生成原因说明
   */
  private generateReason(issueType: string, feedbacks: FeedbackData[]): string {
    const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
    
    return `用户平均评分为${avgRating.toFixed(1)}分，表明此问题影响了用户体验。${feedbacks.length}位用户反馈了类似问题，需要优先处理。`;
  }

  /**
   * 计算影响指标
   */
  private calculateImpact(feedbacks: FeedbackData[]): ImprovementSuggestion['impact'] {
    const frequency = (feedbacks.length / 100) * 100; // 简化为百分比
    const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
    const userSatisfaction = (avgRating / 5) * 100;
    const accuracy = Math.max(0, 100 - (feedbacks.filter(f => f.rating <= 2).length / feedbacks.length * 100));
    
    return {
      userSatisfaction,
      accuracy,
      frequency: Math.min(frequency, 100)
    };
  }

  /**
   * 估算实施成本
   */
  private estimateImplementation(issueType: string): ImprovementSuggestion['implementation'] {
    const effortMap: { [key: string]: 'low' | 'medium' | 'high' } = {
      'format': 'low',
      'missing': 'medium',
      'inappropriate': 'medium',
      'incorrect': 'high',
      'context': 'high'
    };
    
    const effort = effortMap[issueType] || 'medium';
    const timeMap = { low: 1, medium: 4, high: 12 };
    
    return {
      estimatedEffort: effort,
      timeRequired: timeMap[effort],
      resources: ['翻译团队', '质量控制'],
      dependencies: ['术语库更新', '风格指南修订']
    };
  }

  /**
   * 提取标签
   */
  private extractTags(feedbacks: FeedbackData[]): string[] {
    const allTags = feedbacks.flatMap(f => f.tags);
    return [...new Set(allTags)];
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(feedbacks: FeedbackData[]): number {
    const baseConfidence = Math.min(feedbacks.length / 10, 1); // 最多10条反馈达到100%置信度
    const agreementScore = feedbacks.filter(f => f.rating <= 2).length / feedbacks.length; // 低评分一致性
    return Math.min(baseConfidence + agreementScore * 0.3, 1);
  }

  /**
   * 提取常见问题
   */
  private extractCommonIssues(feedbacks: FeedbackData[]): string[] {
    const issues: { [key: string]: number } = {};
    
    feedbacks.forEach(feedback => {
      feedback.issues.forEach(issue => {
        issues[issue.description] = (issues[issue.description] || 0) + 1;
      });
    });
    
    return Object.entries(issues)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([issue]) => issue);
  }

  /**
   * 获取所有改进建议
   */
  getAllSuggestions(filter?: {
    type?: ImprovementSuggestion['type'];
    priority?: ImprovementSuggestion['priority'];
    status?: ImprovementSuggestion['status'];
    language?: string;
  }): ImprovementSuggestion[] {
    let filtered = [...this.suggestions];
    
    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(s => s.type === filter.type);
      }
      if (filter.priority) {
        filtered = filtered.filter(s => s.priority === filter.priority);
      }
      if (filter.status) {
        filtered = filtered.filter(s => s.status === filter.status);
      }
      if (filter.language) {
        filtered = filtered.filter(s => 
          s.metadata.sourceLanguage === filter.language || 
          s.metadata.targetLanguage === filter.language
        );
      }
    }
    
    return filtered.sort((a, b) => {
      // 按优先级和时间排序
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * 获取建议统计信息
   */
  getSuggestionAnalysis(): SuggestionAnalysis {
    const totalSuggestions = this.suggestions.length;
    const highPriorityCount = this.suggestions.filter(s => 
      s.priority === 'high' || s.priority === 'urgent'
    ).length;
    
    const completedSuggestions = this.suggestions.filter(s => s.status === 'completed');
    const averageImpact = completedSuggestions.length > 0 ? 
      completedSuggestions.reduce((sum, s) => 
        sum + (s.impact.userSatisfaction + s.impact.accuracy) / 2, 0
      ) / completedSuggestions.length : 0;
    
    const completionRate = totalSuggestions > 0 ? 
      completedSuggestions.length / totalSuggestions : 0;
    
    // 统计建议类型趋势
    const trendingTypes = this.suggestions.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    // 统计实施进度
    const implementationProgress = this.suggestions.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    // 估算ROI
    const estimatedROI = this.calculateEstimatedROI();
    
    return {
      totalSuggestions,
      highPriorityCount,
      averageImpact,
      completionRate,
      trendingTypes,
      implementationProgress,
      roiEstimate: estimatedROI
    };
  }

  /**
   * 计算估算ROI
   */
  private calculateEstimatedROI(): number {
    const completedSuggestions = this.suggestions.filter(s => s.status === 'completed');
    const totalTime = completedSuggestions.reduce((sum, s) => sum + s.implementation.timeRequired, 0);
    
    // 简化的ROI计算：假设每完成一个建议可以提升5%的用户满意度
    const satisfactionGain = completedSuggestions.length * 5;
    const timeCost = totalTime; // 假设每小时成本为单位1
    
    return timeCost > 0 ? satisfactionGain / timeCost : 0;
  }

  /**
   * 获取质量指标
   */
  getQualityMetrics(): QualityMetrics {
    const recentSuggestions = this.suggestions.filter(s => 
      s.createdAt.getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 // 最近30天
    );
    
    if (recentSuggestions.length === 0) {
      return {
        overallScore: 0,
        accuracyScore: 0,
        styleScore: 0,
        contextScore: 0,
        culturalScore: 0,
        frequencyScore: 0,
        trend: 'stable',
        recommendations: ['暂无足够数据进行分析']
      };
    }
    
    const averageAccuracy = recentSuggestions.reduce((sum, s) => sum + s.impact.accuracy, 0) / recentSuggestions.length;
    const averageStyle = recentSuggestions.filter(s => s.type === 'style').length > 0 ? 
      recentSuggestions.filter(s => s.type === 'style').reduce((sum, s) => sum + s.impact.userSatisfaction, 0) / 
      recentSuggestions.filter(s => s.type === 'style').length : 0;
    const averageContext = recentSuggestions.filter(s => s.type === 'context').length > 0 ? 
      recentSuggestions.filter(s => s.type === 'context').reduce((sum, s) => sum + s.impact.userSatisfaction, 0) / 
      recentSuggestions.filter(s => s.type === 'context').length : 0;
    const averageCultural = recentSuggestions.filter(s => s.type === 'cultural').length > 0 ? 
      recentSuggestions.filter(s => s.type === 'cultural').reduce((sum, s) => sum + s.impact.userSatisfaction, 0) / 
      recentSuggestions.filter(s => s.type === 'cultural').length : 0;
    
    const overallScore = (averageAccuracy + averageStyle + averageContext + averageCultural) / 4;
    const frequencyScore = Math.min(recentSuggestions.length * 10, 100);
    
    // 判断趋势（简化处理）
    const trend: 'improving' | 'declining' | 'stable' = 'stable';
    
    const recommendations: string[] = [];
    if (averageAccuracy < 70) {
      recommendations.push('重点关注翻译准确性改进');
    }
    if (averageStyle < 70) {
      recommendations.push('优化表达风格和用词');
    }
    if (averageContext < 70) {
      recommendations.push('加强语境适配');
    }
    if (recentSuggestions.length > 10) {
      recommendations.push('考虑系统性改进以减少问题数量');
    }
    
    return {
      overallScore: Math.round(overallScore),
      accuracyScore: Math.round(averageAccuracy),
      styleScore: Math.round(averageStyle),
      contextScore: Math.round(averageContext),
      culturalScore: Math.round(averageCultural),
      frequencyScore: Math.round(frequencyScore),
      trend,
      recommendations
    };
  }

  /**
   * 更新建议状态
   */
  updateSuggestionStatus(
    suggestionId: string, 
    status: ImprovementSuggestion['status']
  ): void {
    const suggestion = this.suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      suggestion.status = status;
      suggestion.updatedAt = new Date();
      this.saveSuggestions();
    }
  }

  /**
   * 删除建议
   */
  deleteSuggestion(suggestionId: string): void {
    this.suggestions = this.suggestions.filter(s => s.id !== suggestionId);
    this.saveSuggestions();
  }

  /**
   * 导出建议报告
   */
  exportSuggestionsReport(): string {
    const analysis = this.getSuggestionAnalysis();
    const qualityMetrics = this.getQualityMetrics();
    
    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      analysis,
      qualityMetrics,
      suggestions: this.suggestions
    }, null, 2);
  }

  /**
   * 自动生成批量建议
   */
  async autoGenerateSuggestions(): Promise<ImprovementSuggestion[]> {
    const allFeedbacks = feedbackDataManager.getAllFeedback();
    
    // 只考虑未解决的反馈
    const unresolvedFeedbacks = allFeedbacks.filter(f => !f.isResolved);
    
    if (unresolvedFeedbacks.length < this.MIN_FEEDBACK_COUNT) {
      return [];
    }
    
    return await this.generateSuggestionsFromFeedback(unresolvedFeedbacks);
  }

  /**
   * 预测改进效果
   */
  predictImprovementImpact(suggestionIds: string[]): {
    estimatedSatisfactionGain: number;
    estimatedAccuracyGain: number;
    timeToImplementation: number;
    roi: number;
  } {
    const suggestions = this.suggestions.filter(s => suggestionIds.includes(s.id));
    
    const estimatedSatisfactionGain = suggestions.reduce((sum, s) => 
      sum + s.impact.userSatisfaction * 0.1, 0); // 假设实现10%的潜在提升
    const estimatedAccuracyGain = suggestions.reduce((sum, s) => 
      sum + s.impact.accuracy * 0.1, 0);
    const timeToImplementation = suggestions.reduce((sum, s) => 
      sum + s.implementation.timeRequired, 0);
    const roi = estimatedSatisfactionGain / (timeToImplementation * 10); // 简化ROI计算
    
    return {
      estimatedSatisfactionGain: Math.round(estimatedSatisfactionGain),
      estimatedAccuracyGain: Math.round(estimatedAccuracyGain),
      timeToImplementation,
      roi: Math.round(roi * 100) / 100
    };
  }
}

// 创建单例实例
export const translationImprovementSuggester = new TranslationImprovementSuggester();

export default translationImprovementSuggester;