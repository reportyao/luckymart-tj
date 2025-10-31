/**
 * 反馈数据管理工具
 * 用于存储、管理和分析用户翻译反馈数据
 */

import { FeedbackData } from '../components/TranslationFeedbackCollector';

export interface FeedbackAnalytics {
  totalFeedbacks: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  feedbackTypeDistribution: { [key: string]: number };
  urgencyDistribution: { [key: string]: number };
  categoryDistribution: { [key: string]: number };
  resolvedRate: number;
  averageResolutionTime: number; // 小时
  trendingIssues: FeedbackIssueTrend[];
  satisfactionTrend: SatisfactionDataPoint[];
  qualityScore: number; // 0-100
}

export interface FeedbackIssueTrend {
  issueType: string;
  count: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  severity: 'low' | 'medium' | 'high';
}

export interface SatisfactionDataPoint {
  date: string;
  averageRating: number;
  feedbackCount: number;
}

export interface FeedbackFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  rating?: number[];
  feedbackType?: string[];
  urgency?: string[];
  category?: string[];
  language?: string;
  isResolved?: boolean;
  tags?: string[];
}

export interface FeedbackStats {
  total: number;
  pending: number;
  resolved: number;
  inProgress: number;
  averageRating: number;
  topIssues: string[];
  mostProblematicLanguages: string[];
  resolutionTimeStats: {
    average: number;
    median: number;
    p90: number;
  };
}

class FeedbackDataManager {
  private storage: FeedbackData[] = [];
  private cache: Map<string, any> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  constructor() {
    this.initializeStorage();
    this.loadCachedData();
  }

  /**
   * 初始化存储系统
   */
  private async initializeStorage(): Promise<void> {
    try {
      // 尝试从localStorage加载现有数据
      const cachedData = localStorage.getItem('translation_feedback_data');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        this.storage = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      } else {
        // 如果没有缓存数据，生成一些示例数据用于演示
        this.generateSampleData();
      }
    } catch (error) {
      console.error('初始化反馈数据存储失败:', error);
      this.storage = [];
    }
  }

  /**
   * 生成示例数据
   */
  private generateSampleData(): void {
    const sampleFeedbacks: FeedbackData[] = [
      {
        id: 'feedback_001',
        userId: 'user_001',
        userName: '张三',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        translationContext: '产品描述',
        originalText: 'Premium quality leather handbag',
        translatedText: '优质皮质手提包',
        sourceLanguage: 'en-US',
        targetLanguage: 'zh-CN',
        rating: 4,
        feedbackType: 'quality',
        comment: '翻译质量很好，但是可以更简洁一些',
        issues: [
          {
            type: 'style',
            description: '表达可以更加地道',
            severity: 'moderate',
            location: '整体'
          }
        ],
        improvementSuggestion: '可以考虑使用更地道的表达方式',
        urgency: 'low',
        category: 'style',
        isResolved: false,
        tags: ['产品', '时尚']
      },
      {
        id: 'feedback_002',
        userId: 'user_002',
        userName: '李四',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        translationContext: '用户界面',
        originalText: 'Click here to proceed',
        translatedText: '点击这里继续',
        sourceLanguage: 'en-US',
        targetLanguage: 'zh-CN',
        rating: 5,
        feedbackType: 'accuracy',
        comment: '翻译准确，符合用户习惯',
        issues: [],
        urgency: 'low',
        category: 'meaning',
        isResolved: true,
        tags: ['UI', '按钮']
      },
      {
        id: 'feedback_003',
        userId: 'user_003',
        userName: '王五',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        translationContext: '技术文档',
        originalText: 'Database connection failed',
        translatedText: '数据库连接失败',
        sourceLanguage: 'en-US',
        targetLanguage: 'zh-CN',
        rating: 2,
        feedbackType: 'technical',
        comment: '技术术语翻译不够专业',
        issues: [
          {
            type: 'terminology',
            description: '数据库相关术语应该更专业',
            severity: 'major',
            location: '专业术语'
          }
        ],
        improvementSuggestion: '建议使用更专业的技术术语',
        urgency: 'high',
        category: 'terminology',
        isResolved: false,
        tags: ['技术', '数据库']
      }
    ];

    this.storage = sampleFeedbacks;
    this.saveToStorage();
  }

  /**
   * 保存数据到localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('translation_feedback_data', JSON.stringify(this.storage));
    } catch (error) {
      console.error('保存反馈数据失败:', error);
    }
  }

  /**
   * 加载缓存数据
   */
  private loadCachedData(): void {
    const cached = localStorage.getItem('feedback_analytics_cache');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.CACHE_DURATION) {
          this.cache.set('analytics', data);
        }
      } catch (error) {
        console.error('加载缓存数据失败:', error);
      }
    }
  }

  /**
   * 添加新的反馈数据
   */
  async addFeedback(feedback: FeedbackData): Promise<void> {
    try {
      // 验证反馈数据
      this.validateFeedback(feedback);
      
      // 添加到存储
      this.storage.push(feedback);
      
      // 保存到持久化存储
      this.saveToStorage();
      
      // 清除相关缓存
      this.cache.delete('analytics');
      
      // 触发事件通知
      this.notifyFeedbackAdded(feedback);
      
    } catch (error) {
      console.error('添加反馈数据失败:', error);
      throw error;
    }
  }

  /**
   * 验证反馈数据
   */
  private validateFeedback(feedback: FeedbackData): void {
    if (!feedback.id || !feedback.userId || !feedback.timestamp) {
      throw new Error('反馈数据缺少必要字段');
    }
    
    if (feedback.rating < 1 || feedback.rating > 5) {
      throw new Error('评分必须在1-5之间');
    }
    
    if (!['quality', 'accuracy', 'context', 'cultural', 'technical'].includes(feedback.feedbackType)) {
      throw new Error('无效的反馈类型');
    }
  }

  /**
   * 获取所有反馈数据
   */
  getAllFeedback(filter?: FeedbackFilter): FeedbackData[] {
    let filteredData = [...this.storage];
    
    if (filter) {
      filteredData = this.applyFilter(filteredData, filter);
    }
    
    return filteredData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 应用过滤条件
   */
  private applyFilter(data: FeedbackData[], filter: FeedbackFilter): FeedbackData[] {
    return data.filter(feedback => {
      // 日期范围过滤
      if (filter.dateRange) {
        const feedbackTime = feedback.timestamp.getTime();
        if (feedbackTime < filter.dateRange.start.getTime() || 
            feedbackTime > filter.dateRange.end.getTime()) {
          return false;
        }
      }
      
      // 评分过滤
      if (filter.rating && !filter.rating.includes(feedback.rating)) {
        return false;
      }
      
      // 反馈类型过滤
      if (filter.feedbackType && !filter.feedbackType.includes(feedback.feedbackType)) {
        return false;
      }
      
      // 紧急程度过滤
      if (filter.urgency && !filter.urgency.includes(feedback.urgency)) {
        return false;
      }
      
      // 分类过滤
      if (filter.category && !filter.category.includes(feedback.category)) {
        return false;
      }
      
      // 语言过滤
      if (filter.language && 
          feedback.sourceLanguage !== filter.language && 
          feedback.targetLanguage !== filter.language) {
        return false;
      }
      
      // 解决状态过滤
      if (filter.isResolved !== undefined && feedback.isResolved !== filter.isResolved) {
        return false;
      }
      
      // 标签过滤
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some(tag => feedback.tags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * 获取反馈统计信息
   */
  getFeedbackStats(filter?: FeedbackFilter): FeedbackStats {
    const data = this.getAllFeedback(filter);
    
    const total = data.length;
    const resolved = data.filter(f => f.isResolved).length;
    const pending = data.filter(f => !f.isResolved && f.issues.length === 0).length;
    const inProgress = data.filter(f => !f.isResolved && f.issues.length > 0).length;
    
    const averageRating = total > 0 ? 
      data.reduce((sum, f) => sum + f.rating, 0) / total : 0;
    
    // 统计问题类型
    const issueCounts: { [key: string]: number } = {};
    data.forEach(feedback => {
      feedback.issues.forEach(issue => {
        issueCounts[issue.type] = (issueCounts[issue.type] || 0) + 1;
      });
    });
    const topIssues = Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);
    
    // 统计语言对
    const languageCounts: { [key: string]: number } = {};
    data.forEach(feedback => {
      const langPair = `${feedback.sourceLanguage}->${feedback.targetLanguage}`;
      languageCounts[langPair] = (languageCounts[langPair] || 0) + 1;
    });
    const mostProblematicLanguages = Object.entries(languageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([lang]) => lang);
    
    // 计算解决时间统计
    const resolutionTimes: number[] = [];
    data.filter(f => f.isResolved).forEach(feedback => {
      // 这里简化处理，实际应该从解决时间记录中计算
      const resolutionTime = Math.random() * 48 + 1; // 1-48小时
      resolutionTimes.push(resolutionTime);
    });
    
    const sortedTimes = resolutionTimes.sort((a, b) => a - b);
    const average = resolutionTimes.length > 0 ? 
      resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length : 0;
    const median = sortedTimes.length > 0 ? 
      sortedTimes[Math.floor(sortedTimes.length / 2)] : 0;
    const p90 = sortedTimes.length > 0 ? 
      sortedTimes[Math.floor(sortedTimes.length * 0.9)] : 0;
    
    return {
      total,
      pending,
      resolved,
      inProgress,
      averageRating,
      topIssues,
      mostProblematicLanguages,
      resolutionTimeStats: {
        average,
        median,
        p90
      }
    };
  }

  /**
   * 获取反馈分析数据
   */
  getFeedbackAnalytics(filter?: FeedbackFilter): FeedbackAnalytics {
    // 检查缓存
    const cacheKey = `analytics_${JSON.stringify(filter)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const data = this.getAllFeedback(filter);
    const total = data.length;
    
    if (total === 0) {
      return {
        totalFeedbacks: 0,
        averageRating: 0,
        ratingDistribution: {},
        feedbackTypeDistribution: {},
        urgencyDistribution: {},
        categoryDistribution: {},
        resolvedRate: 0,
        averageResolutionTime: 0,
        trendingIssues: [],
        satisfactionTrend: [],
        qualityScore: 0
      };
    }
    
    // 计算各项指标
    const averageRating = data.reduce((sum, f) => sum + f.rating, 0) / total;
    
    const ratingDistribution = data.reduce((acc, f) => {
      acc[f.rating] = (acc[f.rating] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });
    
    const feedbackTypeDistribution = data.reduce((acc, f) => {
      acc[f.feedbackType] = (acc[f.feedbackType] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    const urgencyDistribution = data.reduce((acc, f) => {
      acc[f.urgency] = (acc[f.urgency] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    const categoryDistribution = data.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    const resolved = data.filter(f => f.isResolved).length;
    const resolvedRate = resolved / total;
    
    // 计算平均解决时间
    const resolvedFeedbacks = data.filter(f => f.isResolved);
    const averageResolutionTime = resolvedFeedbacks.length > 0 ? 24 : 0; // 简化处理
    
    // 生成趋势问题数据
    const issueTrends = this.generateIssueTrends(data);
    
    // 生成满意度趋势数据
    const satisfactionTrend = this.generateSatisfactionTrend(data);
    
    // 计算质量分数 (0-100)
    const qualityScore = this.calculateQualityScore(data);
    
    const analytics: FeedbackAnalytics = {
      totalFeedbacks: total,
      averageRating,
      ratingDistribution,
      feedbackTypeDistribution,
      urgencyDistribution,
      categoryDistribution,
      resolvedRate,
      averageResolutionTime,
      trendingIssues: issueTrends,
      satisfactionTrend,
      qualityScore
    };
    
    // 缓存结果
    this.cache.set(cacheKey, analytics);
    
    return analytics;
  }

  /**
   * 生成问题趋势数据
   */
  private generateIssueTrends(data: FeedbackData[]): FeedbackIssueTrend[] {
    const issueCounts: { [key: string]: number[] } = {};
    const currentDate = new Date();
    
    // 按周统计问题趋势
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(currentDate.getTime() - week * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      data.filter(f => f.timestamp >= weekStart && f.timestamp < weekEnd)
        .forEach(feedback => {
          feedback.issues.forEach(issue => {
            if (!issueCounts[issue.type]) {
              issueCounts[issue.type] = [0, 0, 0, 0];
            }
            issueCounts[issue.type][week]++;
          });
        });
    }
    
    return Object.entries(issueCounts).map(([issueType, counts]) => {
      const recent = counts[0];
      const previous = counts[1];
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      
      if (recent > previous * 1.2) {
        trend = 'increasing';
      } else if (recent < previous * 0.8) {
        trend = 'decreasing';
      }
      
      // 确定严重程度
      let severity: 'low' | 'medium' | 'high' = 'low';
      const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
      if (avgCount > 5) severity = 'high';
      else if (avgCount > 2) severity = 'medium';
      
      return {
        issueType,
        count: recent,
        trend,
        severity
      };
    }).sort((a, b) => b.count - a.count);
  }

  /**
   * 生成满意度趋势数据
   */
  private generateSatisfactionTrend(data: FeedbackData[]): SatisfactionDataPoint[] {
    const dailyData: { [key: string]: { total: number; count: number } } = {};
    
    data.forEach(feedback => {
      const dateKey = feedback.timestamp.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { total: 0, count: 0 };
      }
      dailyData[dateKey].total += feedback.rating;
      dailyData[dateKey].count += 1;
    });
    
    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { total, count }]) => ({
        date,
        averageRating: total / count,
        feedbackCount: count
      }))
      .slice(-30); // 最近30天
  }

  /**
   * 计算质量分数
   */
  private calculateQualityScore(data: FeedbackData[]): number {
    if (data.length === 0) return 0;
    
    // 基础分数：平均评分
    const baseScore = (data.reduce((sum, f) => sum + f.rating, 0) / data.length) * 20; // 转换为0-100
    
    // 扣分项：未解决问题
    const unresolvedIssues = data.filter(f => f.issues.length > 0 && !f.isResolved).length;
    const issuePenalty = Math.min(unresolvedIssues * 5, 30);
    
    // 扣分项：低评分比例
    const lowRatings = data.filter(f => f.rating <= 2).length;
    const lowRatingPenalty = (lowRatings / data.length) * 20;
    
    // 扣分项：高优先级问题
    const highPriorityIssues = data.filter(f => 
      f.urgency === 'high' && f.issues.some(issue => 
        issue.severity === 'critical' || issue.severity === 'major'
      )
    ).length;
    const highPriorityPenalty = Math.min(highPriorityIssues * 10, 25);
    
    const finalScore = Math.max(0, baseScore - issuePenalty - lowRatingPenalty - highPriorityPenalty);
    
    return Math.round(finalScore);
  }

  /**
   * 更新反馈状态
   */
  async updateFeedbackStatus(feedbackId: string, updates: Partial<FeedbackData>): Promise<void> {
    const index = this.storage.findIndex(f => f.id === feedbackId);
    if (index === -1) {
      throw new Error('反馈数据不存在');
    }
    
    this.storage[index] = { ...this.storage[index], ...updates };
    this.saveToStorage();
    this.cache.delete('analytics');
    
    // 触发更新事件
    this.notifyFeedbackUpdated(this.storage[index]);
  }

  /**
   * 删除反馈
   */
  async deleteFeedback(feedbackId: string): Promise<void> {
    const index = this.storage.findIndex(f => f.id === feedbackId);
    if (index === -1) {
      throw new Error('反馈数据不存在');
    }
    
    const deletedFeedback = this.storage.splice(index, 1)[0];
    this.saveToStorage();
    this.cache.delete('analytics');
    
    // 触发删除事件
    this.notifyFeedbackDeleted(deletedFeedback);
  }

  /**
   * 导出反馈数据
   */
  exportFeedbackData(format: 'json' | 'csv' = 'json', filter?: FeedbackFilter): string {
    const data = this.getAllFeedback(filter);
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // CSV格式导出
      const headers = ['ID', '用户', '时间', '评分', '类型', '分类', '状态', '评论'];
      const rows = data.map(feedback => [
        feedback.id,
        feedback.userName,
        feedback.timestamp.toISOString(),
        feedback.rating.toString(),
        feedback.feedbackType,
        feedback.category,
        feedback.isResolved ? '已解决' : '未解决',
        feedback.comment || ''
      ]);
      
      return [headers, ...rows].map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
    }
  }

  /**
   * 事件通知方法
   */
  private notifyFeedbackAdded(feedback: FeedbackData): void {
    window.dispatchEvent(new CustomEvent('feedback-added', { detail: feedback }));
  }

  private notifyFeedbackUpdated(feedback: FeedbackData): void {
    window.dispatchEvent(new CustomEvent('feedback-updated', { detail: feedback }));
  }

  private notifyFeedbackDeleted(feedback: FeedbackData): void {
    window.dispatchEvent(new CustomEvent('feedback-deleted', { detail: feedback }));
  }

  /**
   * 获取反馈趋势报告
   */
  getTrendReport(period: 'week' | 'month' | 'quarter' = 'month'): any {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
    }
    
    const filter: FeedbackFilter = {
      dateRange: { start: startDate, end: endDate }
    };
    
    return {
      period,
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
      analytics: this.getFeedbackAnalytics(filter),
      stats: this.getFeedbackStats(filter)
    };
  }

  /**
   * 清理过期缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// 创建单例实例
export const feedbackDataManager = new FeedbackDataManager();

export default feedbackDataManager;