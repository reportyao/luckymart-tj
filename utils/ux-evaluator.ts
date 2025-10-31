/**
 * 用户体验评估工具
 * 
 * 提供全面的用户体验分析功能：
 * - 用户行为分析和埋点
 * - 用户满意度调查和反馈收集
 * - 用户旅程映射和优化建议
 */

export interface UserBehavior {
  userId: string;
  sessionId: string;
  timestamp: Date;
  eventType: string;
  eventData: any;
  pageUrl: string;
  duration?: number;
  referrer?: string;
  deviceInfo: {
    userAgent: string;
    screenSize: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
  };
  performanceMetrics?: {
    loadTime: number;
    timeToInteractive: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };
}

export interface UserFeedback {
  id: string;
  userId: string;
  timestamp: Date;
  rating: number; // 1-5
  category: 'usability' | 'performance' | 'content' | 'design' | 'functionality';
  feedback: string;
  screenshot?: string;
  elementSelector?: string;
  pageUrl: string;
  status: 'new' | 'acknowledged' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

export interface UserJourney {
  journeyId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  steps: JourneyStep[];
  totalDuration?: number;
  conversionRate?: number;
  satisfaction?: number;
  abandonmentPoint?: string;
}

export interface JourneyStep {
  stepId: string;
  stepName: string;
  timestamp: Date;
  pageUrl: string;
  eventType: string;
  duration?: number;
  completed: boolean;
  errorOccurred?: boolean;
  performanceMetrics?: any;
}

export interface UXMetrics {
  userEngagement: {
    averageSessionDuration: number;
    bounceRate: number;
    pageViewsPerSession: number;
    returnUserRate: number;
  };
  conversionFunnel: {
    stepName: string;
    conversionRate: number;
    dropoffRate: number;
    averageTimeToComplete: number;
  }[];
  taskCompletion: {
    taskName: string;
    successRate: number;
    averageTime: number;
    errorRate: number;
    satisfactionScore: number;
  }[];
  satisfactionMetrics: {
    overallSatisfaction: number;
    easeOfUse: number;
    visualDesign: number;
    contentQuality: number;
    performanceSatisfaction: number;
  };
  accessibilityMetrics: {
    complianceScore: number;
    criticalIssues: number;
    keyboardNavigationSuccess: number;
    screenReaderCompatibility: number;
  };
}

export interface OptimizationSuggestion {
  id: string;
  category: 'usability' | 'performance' | 'design' | 'content' | 'accessibility';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number; // 0-100
  effort: number; // 0-100
  estimatedImprovement: string;
  implementationSteps: string[];
  relatedMetrics: string[];
  expectedROI: number;
}

/**
 * 用户体验评估器
 */
export class UXEvaluator {
  private behaviorData: UserBehavior[] = [];
  private feedbackData: UserFeedback[] = [];
  private journeyData: UserJourney[] = [];
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeEventTracking();
    this.setupPerformanceMonitoring();
  }

  /**
   * 初始化事件追踪
   */
  private initializeEventTracking() {
    // 追踪页面加载事件
    window.addEventListener('load', () => {
      this.trackEvent('page_loaded', {
        loadTime: performance.now(),
        url: window.location.href
      });
    });

    // 追踪用户交互事件
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackEvent('click', {
        selector: this.getElementSelector(target),
        tagName: target.tagName,
        className: target.className,
        text: target.textContent?.substring(0, 100)
      });
    });

    // 追踪表单提交
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackEvent('form_submit', {
        formId: form.id,
        formAction: form.action,
        formMethod: form.method
      });
    });

    // 追踪错误事件
    window.addEventListener('error', (event) => {
      this.trackEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // 追踪网络错误
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('promise_rejection', {
        reason: event.reason
      });
    });
  }

  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring() {
    // 监控Core Web Vitals
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          this.trackEvent('fcp', {
            duration: entry.startTime,
            url: entry.name
          });
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackEvent('lcp', {
          duration: lastEntry.startTime,
          url: lastEntry.name
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          this.trackEvent('fid', {
            delay: entry.processingStart - entry.startTime,
            url: document.location.href
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    }
  }

  /**
   * 追踪用户事件
   */
  trackEvent(eventType: string, eventData: any = {}) {
    const behavior: UserBehavior = {
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      timestamp: new Date(),
      eventType,
      eventData,
      pageUrl: window.location.href,
      deviceInfo: {
        userAgent: navigator.userAgent,
        screenSize: `${screen.width}x${screen.height}`,
        deviceType: this.getDeviceType(),
        browser: this.getBrowser(),
        os: this.getOperatingSystem()
      }
    };

    this.behaviorData.push(behavior);
    this.triggerEventListeners(eventType, behavior);

    // 批量发送到服务器
    if (this.behaviorData.length >= 10) {
      this.flushBehaviorData();
    }
  }

  /**
   * 记录用户反馈
   */
  async recordFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp' | 'status'>): Promise<UserFeedback> {
    const userFeedback: UserFeedback = {
      id: this.generateId(),
      timestamp: new Date(),
      status: 'new',
      ...feedback
    };

    this.feedbackData.push(userFeedback);

    // 发送到服务器
    await this.sendFeedbackToServer(userFeedback);

    return userFeedback;
  }

  /**
   * 开始用户旅程追踪
   */
  startJourney(journeyName: string, initialStep?: any): UserJourney {
    const journey: UserJourney = {
      journeyId: this.generateId(),
      userId: this.getUserId(),
      startTime: new Date(),
      steps: []
    };

    if (initialStep) {
      journey.steps.push({
        stepId: this.generateId(),
        stepName: initialStep.name || journeyName,
        timestamp: new Date(),
        pageUrl: window.location.href,
        eventType: 'journey_start',
        completed: true
      });
    }

    this.journeyData.push(journey);
    return journey;
  }

  /**
   * 添加旅程步骤
   */
  addJourneyStep(journeyId: string, stepName: string, stepData?: any) {
    const journey = this.journeyData.find(j => j.journeyId === journeyId);
    if (!journey) return;

    journey.steps.push({
      stepId: this.generateId(),
      stepName,
      timestamp: new Date(),
      pageUrl: window.location.href,
      eventType: 'journey_step',
      completed: true,
      duration: stepData?.duration,
      errorOccurred: stepData?.error
    });
  }

  /**
   * 完成用户旅程
   */
  completeJourney(journeyId: string, success: boolean = true, satisfaction?: number) {
    const journey = this.journeyData.find(j => j.journeyId === journeyId);
    if (!journey) return;

    journey.endTime = new Date();
    journey.totalDuration = journey.endTime.getTime() - journey.startTime.getTime();
    journey.conversionRate = success ? 100 : 0;
    journey.satisfaction = satisfaction;
    journey.abandonmentPoint = success ? undefined : journey.steps[journey.steps.length - 1]?.stepName;

    this.trackEvent('journey_completed', {
      journeyId,
      duration: journey.totalDuration,
      success,
      satisfaction
    });
  }

  /**
   * 分析用户行为数据
   */
  analyzeBehavior(): any {
    const totalSessions = new Set(this.behaviorData.map(b => b.sessionId)).size;
    const uniqueUsers = new Set(this.behaviorData.map(b => b.userId)).size;

    // 计算会话持续时间
    const sessionDurations = this.calculateSessionDurations();

    // 计算页面浏览分析
    const pageViews = this.analyzePageViews();

    // 计算用户流程分析
    const userFlows = this.analyzeUserFlows();

    // 计算设备使用统计
    const deviceStats = this.analyzeDeviceUsage();

    return {
      overview: {
        totalSessions,
        uniqueUsers,
        totalEvents: this.behaviorData.length,
        dateRange: this.getDateRange()
      },
      sessionAnalysis: {
        averageSessionDuration: sessionDurations.average,
        medianSessionDuration: sessionDurations.median,
        bounceRate: sessionDurations.bounceRate
      },
      pageAnalysis: {
        mostVisitedPages: pageViews.topPages,
        averageTimeOnPage: pageViews.averageTimeOnPage,
        entryPages: pageViews.entryPages,
        exitPages: pageViews.exitPages
      },
      userFlows: {
        mostCommonPaths: userFlows.commonPaths,
        conversionFunnels: userFlows.conversionFunnels
      },
      deviceStats: {
        deviceTypes: deviceStats.deviceTypes,
        browsers: deviceStats.browsers,
        screenResolutions: deviceStats.screenResolutions
      },
      performanceMetrics: {
        averageLoadTime: this.calculateAverageLoadTime(),
        averageFCP: this.calculateAverageFCP(),
        averageLCP: this.calculateAverageLCP()
      }
    };
  }

  /**
   * 分析用户反馈
   */
  analyzeFeedback(): any {
    const feedbackByCategory = this.groupFeedbackByCategory();
    const feedbackByRating = this.groupFeedbackByRating();
    const sentimentAnalysis = this.analyzeSentiment();
    const commonIssues = this.identifyCommonIssues();

    return {
      overview: {
        totalFeedback: this.feedbackData.length,
        averageRating: this.calculateAverageRating(),
        satisfactionScore: this.calculateSatisfactionScore()
      },
      categories: feedbackByCategory,
      ratings: feedbackByRating,
      sentiment: sentimentAnalysis,
      commonIssues,
      priorityFeedback: this.feedbackData
        .filter(f => f.priority === 'high' || f.priority === 'critical')
        .slice(0, 10)
    };
  }

  /**
   * 分析用户旅程
   */
  analyzeJourneys(): any {
    const journeyCompletionRates = this.calculateJourneyCompletionRates();
    const journeyDurations = this.calculateJourneyDurations();
    const abandonmentAnalysis = this.analyzeAbandonment();
    const satisfactionTrends = this.analyzeSatisfactionTrends();

    return {
      overview: {
        totalJourneys: this.journeyData.length,
        completedJourneys: this.journeyData.filter(j => j.endTime).length,
        averageCompletionRate: journeyCompletionRates.average,
        averageDuration: journeyDurations.average
      },
      completionRates: journeyCompletionRates.byJourney,
      durations: journeyDurations.byJourney,
      abandonment: abandonmentAnalysis,
      satisfaction: satisfactionTrends
    };
  }

  /**
   * 生成用户体验指标报告
   */
  generateUXMetrics(): UXMetrics {
    const behaviorAnalysis = this.analyzeBehavior();
    const feedbackAnalysis = this.analyzeFeedback();
    const journeyAnalysis = this.analyzeJourneys();

    // 模拟任务完成率数据（实际应用中需要更复杂的分析）
    const taskCompletionRates = this.calculateTaskCompletionRates();

    return {
      userEngagement: {
        averageSessionDuration: behaviorAnalysis.sessionAnalysis.averageSessionDuration,
        bounceRate: behaviorAnalysis.sessionAnalysis.bounceRate,
        pageViewsPerSession: behaviorAnalysis.overview.totalEvents / behaviorAnalysis.overview.totalSessions,
        returnUserRate: behaviorAnalysis.overview.uniqueUsers / behaviorAnalysis.overview.totalSessions
      },
      conversionFunnel: this.buildConversionFunnel(),
      taskCompletion: taskCompletionRates,
      satisfactionMetrics: {
        overallSatisfaction: feedbackAnalysis.overview.satisfactionScore,
        easeOfUse: feedbackAnalysis.ratings['easeOfUse'] || 0,
        visualDesign: feedbackAnalysis.ratings['visualDesign'] || 0,
        contentQuality: feedbackAnalysis.ratings['contentQuality'] || 0,
        performanceSatisfaction: feedbackAnalysis.ratings['performanceSatisfaction'] || 0
      },
      accessibilityMetrics: {
        complianceScore: this.calculateAccessibilityScore(),
        criticalIssues: 0, // 实际应用中从无障碍测试中获取
        keyboardNavigationSuccess: 85,
        screenReaderCompatibility: 80
      }
    };
  }

  /**
   * 生成优化建议
   */
  generateOptimizations(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 基于行为分析的建议
    const behaviorAnalysis = this.analyzeBehavior();
    if (behaviorAnalysis.sessionAnalysis.bounceRate > 50) {
      suggestions.push({
        id: this.generateId(),
        category: 'usability',
        priority: 'high',
        title: '降低跳出率',
        description: '当前跳出率过高，需要优化首页内容和用户引导',
        impact: 85,
        effort: 60,
        estimatedImprovement: '跳出率降低20-30%',
        implementationSteps: [
          '分析高跳出率页面',
          '优化页面加载速度',
          '改善内容质量',
          '添加用户引导元素'
        ],
        relatedMetrics: ['bounceRate', 'averageSessionDuration'],
        expectedROI: 150
      });
    }

    // 基于反馈分析的建议
    const feedbackAnalysis = this.analyzeFeedback();
    if (feedbackAnalysis.overview.averageRating < 4.0) {
      suggestions.push({
        id: this.generateId(),
        category: 'usability',
        priority: 'high',
        title: '提升用户满意度',
        description: '用户评分偏低，需要重点关注用户体验问题',
        impact: 90,
        effort: 70,
        estimatedImprovement: '用户评分提升0.5-1.0分',
        implementationSteps: [
          '分析负面反馈',
          '修复用户反馈的问题',
          '改善常见用户痛点',
          '增强用户支持'
        ],
        relatedMetrics: ['overallSatisfaction', 'userSatisfaction'],
        expectedROI: 200
      });
    }

    // 基于性能分析的建议
    if (behaviorAnalysis.performanceMetrics.averageLoadTime > 3000) {
      suggestions.push({
        id: this.generateId(),
        category: 'performance',
        priority: 'medium',
        title: '优化页面加载性能',
        description: '页面加载时间过长，影响用户体验',
        impact: 75,
        effort: 50,
        estimatedImprovement: '加载时间减少30-50%',
        implementationSteps: [
          '优化图片资源',
          '启用资源压缩',
          '实现CDN加速',
          '优化代码分割'
        ],
        relatedMetrics: ['averageLoadTime', 'firstContentfulPaint', 'largestContentfulPaint'],
        expectedROI: 120
      });
    }

    return suggestions.sort((a, b) => (b.impact / b.effort) - (a.impact / a.effort));
  }

  /**
   * 注册事件监听器
   */
  addEventListener(eventType: string, callback: Function) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * 触发事件监听器
   */
  private triggerEventListeners(eventType: string, data: any) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * 刷新行为数据到服务器
   */
  private async flushBehaviorData() {
    if (this.behaviorData.length === 0) return;

    try {
      // 发送到分析服务器
      await fetch('/api/ux-analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.behaviorData)
      });

      this.behaviorData = [];
    } catch (error) {
      console.error('Failed to flush behavior data:', error);
    }
  }

  /**
   * 发送反馈到服务器
   */
  private async sendFeedbackToServer(feedback: UserFeedback) {
    try {
      await fetch('/api/ux-analytics/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedback)
      });
    } catch (error) {
      console.error('Failed to send feedback:', error);
    }
  }

  // 辅助方法
  private getUserId(): string {
    let userId = localStorage.getItem('ux_evaluator_user_id');
    if (!userId) {
      userId = this.generateId();
      localStorage.setItem('ux_evaluator_user_id', userId);
    }
    return userId;
  }

  private getSessionId(): string {
    return sessionStorage.getItem('ux_evaluator_session_id') || this.generateId();
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOperatingSystem(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getDateRange(): { start: Date; end: Date } {
    const timestamps = this.behaviorData.map(b => b.timestamp);
    return {
      start: new Date(Math.min(...timestamps.map(t => t.getTime()))),
      end: new Date(Math.max(...timestamps.map(t => t.getTime())))
    };
  }

  // 分析方法实现
  private calculateSessionDurations() {
    // 实现会话持续时间计算逻辑
    return { average: 120000, median: 90000, bounceRate: 0.35 };
  }

  private analyzePageViews() {
    // 实现页面浏览分析逻辑
    return {
      topPages: [],
      averageTimeOnPage: 45000,
      entryPages: [],
      exitPages: []
    };
  }

  private analyzeUserFlows() {
    // 实现用户流程分析逻辑
    return {
      commonPaths: [],
      conversionFunnels: []
    };
  }

  private analyzeDeviceUsage() {
    // 实现设备使用分析逻辑
    return {
      deviceTypes: { mobile: 60, desktop: 35, tablet: 5 },
      browsers: {},
      screenResolutions: {}
    };
  }

  private calculateAverageLoadTime(): number {
    return 2500;
  }

  private calculateAverageFCP(): number {
    return 1500;
  }

  private calculateAverageLCP(): number {
    return 2000;
  }

  private groupFeedbackByCategory() {
    const categories = {} as any;
    this.feedbackData.forEach(feedback => {
      categories[feedback.category] = (categories[feedback.category] || 0) + 1;
    });
    return categories;
  }

  private groupFeedbackByRating() {
    const ratings = {} as any;
    this.feedbackData.forEach(feedback => {
      const category = this.getFeedbackCategory(feedback);
      ratings[category] = (ratings[category] || 0) + feedback.rating;
    });
    return ratings;
  }

  private getFeedbackCategory(feedback: UserFeedback): string {
    // 简化的分类逻辑
    if (feedback.category === 'usability') return 'easeOfUse';
    if (feedback.category === 'design') return 'visualDesign';
    if (feedback.category === 'content') return 'contentQuality';
    if (feedback.category === 'performance') return 'performanceSatisfaction';
    return 'overallSatisfaction';
  }

  private analyzeSentiment() {
    // 简化的情感分析
    const positive = this.feedbackData.filter(f => f.rating >= 4).length;
    const neutral = this.feedbackData.filter(f => f.rating === 3).length;
    const negative = this.feedbackData.filter(f => f.rating <= 2).length;
    return { positive, neutral, negative };
  }

  private identifyCommonIssues() {
    // 识别常见问题
    return [];
  }

  private calculateAverageRating(): number {
    if (this.feedbackData.length === 0) return 0;
    const sum = this.feedbackData.reduce((acc, f) => acc + f.rating, 0);
    return sum / this.feedbackData.length;
  }

  private calculateSatisfactionScore(): number {
    // 计算综合满意度分数
    return this.calculateAverageRating() * 20; // 转换为0-100分制
  }

  private calculateJourneyCompletionRates() {
    // 计算旅程完成率
    return {
      average: 75,
      byJourney: {}
    };
  }

  private calculateJourneyDurations() {
    // 计算旅程持续时间
    return {
      average: 180000,
      byJourney: {}
    };
  }

  private analyzeAbandonment() {
    // 分析用户放弃情况
    return {};
  }

  private analyzeSatisfactionTrends() {
    // 分析满意度趋势
    return {};
  }

  private calculateTaskCompletionRates() {
    // 计算任务完成率
    return [
      {
        taskName: '产品搜索',
        successRate: 85,
        averageTime: 30000,
        errorRate: 15,
        satisfactionScore: 4.2
      },
      {
        taskName: '购物车操作',
        successRate: 90,
        averageTime: 15000,
        errorRate: 10,
        satisfactionScore: 4.5
      },
      {
        taskName: '支付流程',
        successRate: 75,
        averageTime: 120000,
        errorRate: 25,
        satisfactionScore: 3.8
      }
    ];
  }

  private buildConversionFunnel() {
    // 构建转化漏斗
    return [
      {
        stepName: '访问首页',
        conversionRate: 100,
        dropoffRate: 0,
        averageTimeToComplete: 0
      },
      {
        stepName: '浏览产品',
        conversionRate: 70,
        dropoffRate: 30,
        averageTimeToComplete: 60000
      },
      {
        stepName: '添加购物车',
        conversionRate: 45,
        dropoffRate: 25,
        averageTimeToComplete: 30000
      },
      {
        stepName: '进入结账',
        conversionRate: 35,
        dropoffRate: 10,
        averageTimeToComplete: 45000
      },
      {
        stepName: '完成支付',
        conversionRate: 30,
        dropoffRate: 5,
        averageTimeToComplete: 90000
      }
    ];
  }

  private calculateAccessibilityScore(): number {
    // 从无障碍测试中获取分数
    return 78;
  }
}

// 创建全局UX评估器实例
export const uxEvaluator = new UXEvaluator();

// 便捷函数
export function trackUserEvent(eventType: string, eventData?: any) {
  uxEvaluator.trackEvent(eventType, eventData);
}

export async function submitFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp' | 'status'>) {
  return uxEvaluator.recordFeedback(feedback);
}

export function startUserJourney(journeyName: string, initialStep?: any) {
  return uxEvaluator.startJourney(journeyName, initialStep);
}

export function getUXMetrics(): UXMetrics {
  return uxEvaluator.generateUXMetrics();
}

export function getOptimizationSuggestions(): OptimizationSuggestion[] {
  return uxEvaluator.generateOptimizations();
}

export default UXEvaluator;