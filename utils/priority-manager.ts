// priority-manager.ts - 增强的请求优先级管理器
import { NetworkQuality } from './network-retry';

export enum RequestPriority {
  LOW = 0,        // 低优先级：后台同步、非关键数据
  NORMAL = 1,     // 正常优先级：常规业务操作
  CRITICAL = 2    // 关键优先级：核心交易、用户认证
}

// 业务场景优先级映射
export const PRIORITY_MAPPINGS = {
  // 关键优先级场景
  CRITICAL: {
    userAuthentication: true,        // 用户登录验证
    paymentProcessing: true,         // 支付处理
    orderCreation: true,             // 订单创建
    inventoryCheck: true,            // 库存检查
    securityVerification: true,      // 安全验证
    criticalNotifications: true,     // 重要通知
    cartCheckout: true,              // 购物车结账
    userProfileCritical: true        // 用户关键资料
  },

  // 正常优先级场景
  NORMAL: {
    productSearch: true,             // 产品搜索
    cartOperations: true,            // 购物车操作
    userProfile: true,               // 用户资料
    orderHistory: true,              // 订单历史
    productReviews: true,            // 产品评价
    analyticsReporting: true,        // 数据分析
    productDetails: true,            // 产品详情
    categoryBrowsing: true           // 分类浏览
  },

  // 低优先级场景
  LOW: {
    dataSync: true,                  // 数据同步
    analytics: true,                 // 统计数据
    prefetching: true,               // 预加载
    imageOptimization: true,         // 图片优化
    cacheUpdates: true,              // 缓存更新
    logging: true,                   // 日志记录
    recommendations: true,           // 推荐数据
    socialFeatures: true             // 社交功能
  }
};

// 动态优先级调整器
export class DynamicPriorityManager {
  private userActivityScore = 0;
  private networkQuality: NetworkQuality = NetworkQuality.EXCELLENT;
  private systemLoad = 0;
  private timeOfDayFactor = 1;
  private userSegment = 'regular'; // regular, premium, vip

  constructor() {
    this.setupContextMonitoring();
  }

  // 设置上下文监控
  private setupContextMonitoring() {
    // 监控用户活动时间
    let lastActivity = Date.now();
    
    ['click', 'scroll', 'keypress'].forEach(event => {
      window.addEventListener(event, () => {
        lastActivity = Date.now();
        this.updateUserActivityScore();
      }, { passive: true });
    });

    // 定期更新活跃度分数
    setInterval(() => {
      this.updateUserActivityScore(lastActivity);
    }, 5000);
  }

  // 更新用户活跃度分数
  private updateUserActivityScore(lastActivity?: number) {
    const now = Date.now();
    const timeSinceActivity = lastActivity ? now - lastActivity : 0;
    
    // 基于最后活动时间计算活跃度
    if (timeSinceActivity < 5000) {
      this.userActivityScore = Math.min(100, this.userActivityScore + 10);
    } else if (timeSinceActivity > 30000) {
      this.userActivityScore = Math.max(0, this.userActivityScore - 5);
    }

    // 时间因子（工作时间活跃度更高）
    const hour = new Date().getHours();
    this.timeOfDayFactor = (hour >= 9 && hour <= 18) ? 1.2 : 1.0;

    // 用户群体因子
    this.userSegment = this.determineUserSegment();
  }

  // 确定用户群体
  private determineUserSegment(): 'regular' | 'premium' | 'vip' {
    // 这里可以根据用户行为数据、订阅状态等确定用户群体
    // 简化实现，返回常规用户
    return 'regular';
  }

  // 根据业务场景自动确定优先级
  autoDeterminePriority(businessContext: {
    operation: string;
    userId?: string;
    userSegment?: string;
    urgency?: 'low' | 'medium' | 'high';
    businessValue?: 'low' | 'medium' | 'high';
  }): RequestPriority {
    const { operation, userSegment, urgency, businessValue } = businessContext;

    // 检查关键业务映射
    if (PRIORITY_MAPPINGS.CRITICAL[operation as keyof typeof PRIORITY_MAPPINGS.CRITICAL]) {
      return RequestPriority.CRITICAL;
    }

    // 检查用户群体提升
    if (userSegment === 'vip' || businessValue === 'high') {
      if (urgency === 'high') {
        return RequestPriority.CRITICAL;
      }
      return RequestPriority.NORMAL;
    }

    // 检查紧急程度
    if (urgency === 'high') {
      return RequestPriority.CRITICAL;
    }

    // 检查正常业务映射
    if (PRIORITY_MAPPINGS.NORMAL[operation as keyof typeof PRIORITY_MAPPINGS.NORMAL]) {
      return RequestPriority.NORMAL;
    }

    // 默认低优先级
    return RequestPriority.LOW;
  }

  // 根据上下文动态调整优先级
  adjustPriority(
    basePriority: RequestPriority,
    context: {
      userActivity?: 'high' | 'medium' | 'low';
      networkQuality?: NetworkQuality;
      systemLoad?: number;
      criticalUserAction?: boolean;
      businessContext?: any;
    }
  ): RequestPriority {
    let adjustedPriority = basePriority;

    // 系统负载调整
    if (context.systemLoad && context.systemLoad > 0.8) {
      if (basePriority === RequestPriority.CRITICAL) {
        // 关键请求保持最高优先级
        adjustedPriority = RequestPriority.CRITICAL;
      } else if (basePriority === RequestPriority.NORMAL) {
        // 正常请求在系统压力大时优先级不变，但可能延迟
        adjustedPriority = basePriority;
      } else {
        // 低优先级进一步降低
        adjustedPriority = RequestPriority.LOW;
      }
    }

    // 用户活跃度调整
    if (context.userActivity === 'high' && this.userActivityScore > 80) {
      if (basePriority === RequestPriority.LOW) {
        adjustedPriority = RequestPriority.NORMAL; // 活跃用户提升低优先级请求
      }
    }

    // 网络质量调整
    if (context.networkQuality === NetworkQuality.POOR) {
      // 网络差时，非关键请求采用降级策略
      if (basePriority !== RequestPriority.CRITICAL) {
        adjustedPriority = basePriority; // 保持原优先级但使用离线策略
      }
    }

    // 关键用户操作提升
    if (context.criticalUserAction) {
      adjustedPriority = RequestPriority.CRITICAL;
    }

    // 用户群体调整
    if (this.userSegment === 'vip') {
      if (adjustedPriority === RequestPriority.LOW) {
        adjustedPriority = RequestPriority.NORMAL;
      }
    }

    return adjustedPriority;
  }

  // 获取当前上下文
  getCurrentContext() {
    return {
      userActivityScore: this.userActivityScore,
      networkQuality: this.networkQuality,
      systemLoad: this.systemLoad,
      timeOfDayFactor: this.timeOfDayFactor,
      userSegment: this.userSegment
    };
  }

  // 更新系统负载
  updateSystemLoad(load: number) {
    this.systemLoad = Math.max(0, Math.min(1, load));
  }

  // 更新网络质量
  updateNetworkQuality(quality: NetworkQuality) {
    this.networkQuality = quality;
  }
}

// 优先级配置管理器
export class PriorityConfigManager {
  private static configs = {
    [RequestPriority.CRITICAL]: {
      maxConcurrent: 10,
      timeout: 5000,        // 5秒超时
      maxRetries: 3,
      retryDelay: 200,      // 快速重试
      enableQueue: false,   // 关键请求不排队
      backoffStrategy: 'exponential' as const,
      enableDegradation: false, // 不降级
      weight: 50,           // 调度权重50%
      preemptive: true      // 支持抢占
    },

    [RequestPriority.NORMAL]: {
      maxConcurrent: 5,
      timeout: 15000,       // 15秒超时
      maxRetries: 2,
      retryDelay: 1000,
      enableQueue: true,
      backoffStrategy: 'linear' as const,
      enableDegradation: true,
      weight: 35,           // 调度权重35%
      preemptive: false
    },

    [RequestPriority.LOW]: {
      maxConcurrent: 2,
      timeout: 60000,       // 60秒超时
      maxRetries: 5,
      retryDelay: 5000,
      enableQueue: true,
      backoffStrategy: 'fixed' as const,
      enableDegradation: true,
      weight: 15,           // 调度权重15%
      preemptive: false,
      batchProcessing: true
    }
  };

  // 获取优先级配置
  static getConfig(priority: RequestPriority) {
    return this.configs[priority];
  }

  // 动态调整配置
  static updateConfig(priority: RequestPriority, updates: Partial<typeof this.configs[RequestPriority.CRITICAL]>) {
    this.configs[priority] = { ...this.configs[priority], ...updates };
  }

  // 获取所有配置
  static getAllConfigs() {
    return { ...this.configs };
  }

  // 重置为默认配置
  static resetToDefaults() {
    // 重置逻辑（重新初始化配置）
    Object.keys(this.configs).forEach(key => {
      delete this.configs[key as RequestPriority];
    });
  }
}

// 优先级分析器
export class PriorityAnalyzer {
  // 分析请求特征并建议优先级
  static analyzeRequest(
    requestInfo: {
      url: string;
      method: string;
      size?: number;
      userAgent?: string;
      referrer?: string;
    }
  ): {
    suggestedPriority: RequestPriority;
    confidence: number;
    reasoning: string[];
  } {
    const reasoning: string[] = [];

    // 基于URL模式分析
    const criticalPatterns = [
      '/api/auth/', '/api/payment/', '/api/order/', '/api/checkout'
    ];
    
    const normalPatterns = [
      '/api/products/', '/api/user/', '/api/cart/', '/api/search'
    ];

    const lowPatterns = [
      '/api/analytics/', '/api/logs/', '/api/recommendations/', '/api/sync'
    ];

    // 检查关键模式
    if (criticalPatterns.some(pattern => requestInfo.url.includes(pattern))) {
      reasoning.push('URL匹配关键业务模式');
      return {
        suggestedPriority: RequestPriority.CRITICAL,
        confidence: 0.9,
        reasoning
      };
    }

    // 检查正常模式
    if (normalPatterns.some(pattern => requestInfo.url.includes(pattern))) {
      reasoning.push('URL匹配常规业务模式');
      return {
        suggestedPriority: RequestPriority.NORMAL,
        confidence: 0.8,
        reasoning
      };
    }

    // 检查低优先级模式
    if (lowPatterns.some(pattern => requestInfo.url.includes(pattern))) {
      reasoning.push('URL匹配后台处理模式');
      return {
        suggestedPriority: RequestPriority.LOW,
        confidence: 0.85,
        reasoning
      };
    }

    // 基于请求大小分析
    if (requestInfo.size && requestInfo.size > 1024 * 1024) {
      reasoning.push('大文件请求，建议低优先级');
      return {
        suggestedPriority: RequestPriority.LOW,
        confidence: 0.7,
        reasoning
      };
    }

    // 默认正常优先级
    reasoning.push('未匹配特定模式，使用默认优先级');
    return {
      suggestedPriority: RequestPriority.NORMAL,
      confidence: 0.5,
      reasoning
    };
  }

  // 批量分析请求
  static batchAnalyze(requests: Array<{
    url: string;
    method: string;
    size?: number;
    userAgent?: string;
    referrer?: string;
  }>): Array<{
    index: number;
    suggestedPriority: RequestPriority;
    confidence: number;
    reasoning: string[];
  }> {
    return requests.map((request, index) => ({
      index,
      ...this.analyzeRequest(request)
    }));
  }
}

// 单例导出
export const priorityManager = new DynamicPriorityManager();
export const configManager = PriorityConfigManager;
export const analyzer = PriorityAnalyzer;

export default DynamicPriorityManager;
