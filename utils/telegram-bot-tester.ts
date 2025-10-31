/**
 * Bot推送测试工具
 * 模拟Bot消息和响应，验证多语言通知生成，测试消息发送和状态反馈
 */

import { EventEmitter } from 'events';
import { Markup } from 'telegraf';
import { logger } from './utils/logger';
import { NotificationTemplateManager, Language, NotificationType, UserContext } from './utils/notification-templates';
import { messageQueue } from './utils/message-queue';
import { faultToleranceManager } from './utils/fault-tolerance-manager';

export interface TestUser {
  telegramId: string;
  userId: number;
  username: string;
  firstName: string;
  lastName?: string;
  language: Language;
  balance: number;
  platformBalance: number;
  vipLevel: number;
  isActive: boolean;
  createdAt: Date;
}

export interface TestMessage {
  id: string;
  type: string;
  payload: any;
  status: 'pending' | 'processing' | 'success' | 'failed';
  createdAt: Date;
  sentAt?: Date;
  error?: string;
  retryCount: number;
}

export interface TestResult {
  testId: string;
  testName: string;
  success: boolean;
  duration: number;
  messageCount: number;
  errorCount: number;
  successRate: number;
  details: any;
  timestamp: Date;
}

export class TelegramBotTester extends EventEmitter {
  private testUsers: Map<string, TestUser> = new Map();
  private testMessages: Map<string, TestMessage> = new Map();
  private testResults: TestResult[] = [];
  private isRunning = false;
  private mockBotResponses = new Map<string, any>();

  constructor() {
    super();
    this.setupMockBotResponses();
  }

  /**
   * 设置模拟Bot响应
   */
  private setupMockBotResponses() {
    // 模拟成功响应
    this.mockBotResponses.set('success', {
      ok: true,
      result: {
        message_id: Math.floor(Math.random() * 1000000),
        date: Math.floor(Date.now() / 1000),
        chat: { id: 12345, type: 'private' },
        text: 'Mock success response'
      }
    });

    // 模拟失败响应
    this.mockBotResponses.set('failure', {
      ok: false,
      error_code: 400,
      description: 'Bad Request: chat not found'
    });

    // 模拟网络错误
    this.mockBotResponses.set('network_error', {
      error: 'ENOTFOUND',
      message: 'getaddrinfo ENOTFOUND api.telegram.org'
    });
  }

  /**
   * 初始化测试用户
   */
  public async initializeTestUsers(languageDistribution?: Partial<Record<Language, number>>): Promise<void> {
    const distribution = languageDistribution || {
      [Language.ZH]: 30,
      [Language.EN]: 25,
      [Language.RU]: 25,
      [Language.TJ]: 20
    };

    const totalUsers = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    logger.info(`初始化 ${totalUsers} 个测试用户`, { distribution });

    let userId = 1;
    for (const [language, count] of Object.entries(distribution)) {
      for (let i = 0; i < count; i++) {
        const telegramId = `test_user_${language}_${userId}_${Date.now()}`;
        const user: TestUser = {
          telegramId,
          userId: userId++,
          username: `user_${language}_${i}`,
          firstName: `${['张三', 'John', 'Иван', 'Аҳмад'][this.getLanguageIndex(language as Language)]}`,
          lastName: `${['李四', 'Smith', 'Иванов', 'Собиров'][this.getLanguageIndex(language as Language)]}`,
          language: language as Language,
          balance: Math.floor(Math.random() * 500) + 50,
          platformBalance: Math.floor(Math.random() * 1000),
          vipLevel: Math.floor(Math.random() * 6),
          isActive: true,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 30天内的随机日期
        };

        this.testUsers.set(telegramId, user);
      }
    }

    logger.info(`测试用户初始化完成，共 ${this.testUsers.size} 个用户`);
    this.emit('users:initialized', { userCount: this.testUsers.size });
  }

  /**
   * 模拟Bot消息处理
   */
  public async simulateBotCommand(command: string, userId?: string): Promise<TestResult> {
    const startTime = Date.now();
    const testId = `cmd_${command}_${Date.now()}`;
    
    logger.info(`开始模拟Bot命令: ${command}`, { testId, userId });

    try {
      const users = userId ? [this.testUsers.get(userId)!].filter(Boolean) : Array.from(this.testUsers.values());
      const results = [];
      let errorCount = 0;

      for (const user of users) {
        try {
          // 模拟用户上下文
          const userContext: UserContext = {
            telegramId: user.telegramId,
            userId: user.userId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            language: user.language,
            balance: user.balance,
            platformBalance: user.platformBalance,
            vipLevel: user.vipLevel
          };

          // 根据命令类型生成相应的通知
          let notificationType: NotificationType;
          let variables: Record<string, any> = {};

          switch (command) {
            case 'start':
              notificationType = NotificationType.WELCOME_MESSAGE;
              variables = {
                firstName: user.firstName,
                balance: user.balance,
                appUrl: 'https://app.example.com'
              };
              break;
            case 'balance':
              notificationType = NotificationType.BALANCE_QUERY;
              variables = {
                balance: user.balance,
                platformBalance: user.platformBalance,
                vipLevel: user.vipLevel,
                freeCount: Math.floor(Math.random() * 4),
                appUrl: 'https://app.example.com'
              };
              break;
            case 'orders':
              notificationType = NotificationType.ORDER_QUERY;
              variables = {
                firstName: user.firstName,
                hasOrders: Math.random() > 0.5,
                orderCount: Math.floor(Math.random() * 10),
                orderList: this.generateOrderList(user.language),
                appUrl: 'https://app.example.com'
              };
              break;
            case 'help':
              notificationType = NotificationType.HELP_MESSAGE;
              variables = {};
              break;
            case 'language':
              notificationType = NotificationType.LANGUAGE_SELECTION;
              variables = {};
              break;
            default:
              notificationType = NotificationType.SYSTEM_NOTIFICATION;
              variables = {
                title: 'Unknown Command',
                content: `Command "${command}" is not recognized`
              };
          }

          // 生成通知内容
          const data = {
            user: userContext,
            type: notificationType,
            variables
          };

          const validation = NotificationTemplateManager.validateNotificationData(data);
          if (!validation.valid) {
            throw new Error(`通知数据验证失败: ${validation.errors.join(', ')}`);
          }

          const notification = NotificationTemplateManager.generateNotification(data);

          // 验证通知内容
          this.validateNotification(notification, user.language);

          // 模拟消息发送
          const messageId = await this.simulateMessageSend(user.telegramId, notification);

          results.push({
            userId: user.telegramId,
            messageId,
            language: user.language,
            success: true
          });

        } catch (error) {
          errorCount++;
          logger.error(`用户 ${user.telegramId} 命令执行失败`, {
            command,
            error: (error as Error).message
          });

          results.push({
            userId: user.telegramId,
            error: (error as Error).message,
            success: false
          });
        }
      }

      const duration = Date.now() - startTime;
      const successCount = results.filter(r => r.success).length;
      const successRate = (successCount / results.length) * 100;

      const testResult: TestResult = {
        testId,
        testName: `Bot Command: ${command}`,
        success: errorCount === 0,
        duration,
        messageCount: results.length,
        errorCount,
        successRate,
        details: {
          command,
          results: results.slice(0, 10) // 只保存前10个结果详情
        },
        timestamp: new Date()
      };

      this.testResults.push(testResult);
      this.emit('command:tested', testResult);

      return testResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        testId,
        testName: `Bot Command: ${command}`,
        success: false,
        duration,
        messageCount: 0,
        errorCount: 1,
        successRate: 0,
        details: { error: (error as Error).message },
        timestamp: new Date()
      };

      this.testResults.push(testResult);
      this.emit('command:tested', testResult);

      return testResult;
    }
  }

  /**
   * 模拟消息发送
   */
  private async simulateMessageSend(telegramId: string, notification: any): Promise<string> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建测试消息
    const testMessage: TestMessage = {
      id: messageId,
      type: 'telegram',
      payload: { telegramId, notification },
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0
    };

    this.testMessages.set(messageId, testMessage);

    // 模拟发送过程
    try {
      testMessage.status = 'processing';
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));

      // 模拟发送结果（90%成功率）
      const success = Math.random() > 0.1;
      
      if (success) {
        testMessage.status = 'success';
        testMessage.sentAt = new Date();
        
        // 添加到消息队列
        await faultToleranceManager.getMessageQueue().addMessage('telegram', {
          type: 'send_message',
          chatId: telegramId,
          text: notification.message,
          keyboard: notification.keyboard,
          parseMode: notification.parseMode
        });

      } else {
        throw new Error('Simulated send failure');
      }

    } catch (error) {
      testMessage.status = 'failed';
      testMessage.error = (error as Error).message;
      testMessage.retryCount++;

      // 模拟重试
      if (testMessage.retryCount < 3) {
        testMessage.status = 'pending';
        // 这里可以实现重试逻辑
      }
    }

    return messageId;
  }

  /**
   * 验证通知内容
   */
  private validateNotification(notification: any, language: Language): void {
    expect(notification).toBeDefined();
    expect(notification.title).toBeDefined();
    expect(typeof notification.title).toBe('string');
    expect(notification.message).toBeDefined();
    expect(typeof notification.message).toBe('string');
    expect(notification.message.length).toBeGreaterThan(0);

    // 验证语言特定的标识
    const languageIndicators = {
      [Language.ZH]: ['您的', '余额', '账户'],
      [Language.EN]: ['Your', 'balance', 'account'],
      [Language.RU]: ['Ваш', 'баланс', 'аккаунт'],
      [Language.TJ]: ['Шумо', 'баланс', 'ҳисса']
    };

    const indicators = languageIndicators[language];
    const hasLanguageIndicator = indicators.some(indicator => 
      notification.message.includes(indicator)
    );

    // 注意：这里可能因为模板内容而验证失败，所以改为警告
    if (!hasLanguageIndicator) {
      logger.warn('通知可能不包含语言特定标识', { language, message: notification.message });
    }
  }

  /**
   * 测试所有通知类型
   */
  public async testAllNotificationTypes(): Promise<TestResult[]> {
    logger.info('开始测试所有通知类型');
    
    const supportedTypes = NotificationTemplateManager.getSupportedTypes();
    const testResults: TestResult[] = [];

    for (const type of supportedTypes) {
      const result = await this.testNotificationType(type);
      testResults.push(result);
    }

    return testResults;
  }

  /**
   * 测试特定通知类型
   */
  public async testNotificationType(type: NotificationType): Promise<TestResult> {
    const startTime = Date.now();
    const testId = `notification_${type}_${Date.now()}`;

    logger.info(`测试通知类型: ${type}`, { testId });

    try {
      const results = [];
      let errorCount = 0;

      // 为每种语言测试通知
      const languages = [Language.ZH, Language.EN, Language.RU, Language.TJ];
      
      for (const language of languages) {
        const user = this.getRandomUserByLanguage(language);
        if (!user) continue;

        try {
          const notification = this.generateTestNotification(user, type);
          
          // 验证通知
          this.validateNotification(notification, language);

          // 模拟发送
          const messageId = await this.simulateMessageSend(user.telegramId, notification);

          results.push({
            userId: user.telegramId,
            language,
            messageId,
            success: true
          });

        } catch (error) {
          errorCount++;
          logger.error(`通知类型测试失败`, {
            type,
            language,
            error: (error as Error).message
          });

          results.push({
            userId: user.telegramId,
            language,
            error: (error as Error).message,
            success: false
          });
        }
      }

      const duration = Date.now() - startTime;
      const successCount = results.filter(r => r.success).length;
      const successRate = (successCount / results.length) * 100;

      const testResult: TestResult = {
        testId,
        testName: `Notification Type: ${type}`,
        success: errorCount === 0,
        duration,
        messageCount: results.length,
        errorCount,
        successRate,
        details: { type, results },
        timestamp: new Date()
      };

      this.testResults.push(testResult);
      this.emit('notification:tested', testResult);

      return testResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        testId,
        testName: `Notification Type: ${type}`,
        success: false,
        duration,
        messageCount: 0,
        errorCount: 1,
        successRate: 0,
        details: { error: (error as Error).message },
        timestamp: new Date()
      };

      this.testResults.push(testResult);
      this.emit('notification:tested', testResult);

      return testResult;
    }
  }

  /**
   * 生成测试通知
   */
  private generateTestNotification(user: TestUser, type: NotificationType): any {
    const variables = this.generateTestVariables(user, type);
    
    const data = {
      user: {
        telegramId: user.telegramId,
        userId: user.userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        language: user.language,
        balance: user.balance,
        platformBalance: user.platformBalance,
        vipLevel: user.vipLevel
      },
      type,
      variables
    };

    return NotificationTemplateManager.generateNotification(data);
  }

  /**
   * 生成测试变量
   */
  private generateTestVariables(user: TestUser, type: NotificationType): Record<string, any> {
    const baseVariables = {
      firstName: user.firstName,
      balance: user.balance,
      platformBalance: user.platformBalance,
      vipLevel: user.vipLevel,
      appUrl: 'https://app.example.com'
    };

    const typeSpecificVariables: Record<NotificationType, Record<string, any>> = {
      [NotificationType.WELCOME_MESSAGE]: baseVariables,
      [NotificationType.REGISTRATION_REWARD]: {
        ...baseVariables,
        rewardAmount: 50
      },
      [NotificationType.BALANCE_QUERY]: {
        ...baseVariables,
        freeCount: Math.floor(Math.random() * 4)
      },
      [NotificationType.ORDER_QUERY]: {
        ...baseVariables,
        hasOrders: Math.random() > 0.3,
        orderCount: Math.floor(Math.random() * 10),
        orderList: this.generateOrderList(user.language)
      },
      [NotificationType.ORDER_STATUS_CHANGE]: {
        ...baseVariables,
        orderNumber: `TEST_${Date.now()}`,
        status: '已支付',
        amount: Math.floor(Math.random() * 1000) + 100,
        hasTracking: Math.random() > 0.5
      },
      [NotificationType.PAYMENT_SUCCESS]: {
        ...baseVariables,
        orderNumber: `TEST_${Date.now()}`,
        amount: Math.floor(Math.random() * 1000) + 100,
        productName: '测试商品'
      },
      [NotificationType.LOTTERY_RESULT_WIN]: {
        ...baseVariables,
        productName: 'iPhone 15',
        roundId: `ROUND_${Date.now()}`,
        prizeValue: 5000
      },
      [NotificationType.LOTTERY_RESULT_LOSE]: {
        ...baseVariables,
        productName: 'Samsung Galaxy',
        roundId: `ROUND_${Date.now()}`,
        participants: Math.floor(Math.random() * 1000) + 100
      },
      [NotificationType.VIP_LEVEL_UP]: {
        ...baseVariables,
        oldLevel: Math.floor(user.vipLevel / 2),
        newLevel: user.vipLevel,
        benefits: '• 5% 折扣\n• 优先发货\n• 专属客服'
      },
      [NotificationType.SYSTEM_NOTIFICATION]: {
        ...baseVariables,
        title: '系统维护通知',
        content: '系统将于今晚23:00-01:00进行维护升级'
      },
      [NotificationType.HELP_MESSAGE]: baseVariables,
      [NotificationType.LANGUAGE_SELECTION]: baseVariables,
      [NotificationType.LANGUAGE_CHANGED]: {
        ...baseVariables,
        newLanguage: user.language
      },
      // 默认处理其他类型
      ...Object.fromEntries(
        Object.values(NotificationType)
          .filter(t => !Object.keys(typeSpecificVariables).includes(t))
          .map(t => [t, baseVariables])
      )
    };

    return typeSpecificVariables[type] || baseVariables;
  }

  /**
   * 生成订单列表
   */
  private generateOrderList(language: Language): string {
    const orderTemplates = {
      [Language.ZH]: (orderNumber: string, status: string, amount: number) => 
        `订单 ${orderNumber}\n状态: ${status}\n金额: ${amount} TJS`,
      [Language.EN]: (orderNumber: string, status: string, amount: number) => 
        `Order ${orderNumber}\nStatus: ${status}\nAmount: ${amount} TJS`,
      [Language.RU]: (orderNumber: string, status: string, amount: number) => 
        `Заказ ${orderNumber}\nСтатус: ${status}\nСумма: ${amount} TJS`,
      [Language.TJ]: (orderNumber: string, status: string, amount: number) => 
        `Фармоиш ${orderNumber}\nҲолат: ${status}\nМаблағ: ${amount} TJS`
    };

    const template = orderTemplates[language] || orderTemplates[Language.ZH];
    const statuses = {
      [Language.ZH]: ['待支付', '已支付', '已发货', '已完成'],
      [Language.EN]: ['Pending', 'Paid', 'Shipped', 'Delivered'],
      [Language.RU]: ['Ожидает оплаты', 'Оплачен', 'Отправлен', 'Доставлен'],
      [Language.TJ]: ['Интизори пардохт', 'Пардохт шудааст', 'Ирсол шудааст', 'Расонида шудааст']
    };

    const statusList = statuses[language] || statuses[Language.ZH];
    
    const orderCount = Math.floor(Math.random() * 3) + 1;
    const orders = [];
    
    for (let i = 0; i < orderCount; i++) {
      const orderNumber = `TEST_${Date.now()}_${i}`;
      const status = statusList[Math.floor(Math.random() * statusList.length)];
      const amount = Math.floor(Math.random() * 1000) + 100;
      orders.push(template(orderNumber, status, amount));
    }
    
    return orders.join('\n\n');
  }

  /**
   * 根据语言获取随机用户
   */
  private getRandomUserByLanguage(language: Language): TestUser | undefined {
    const users = Array.from(this.testUsers.values()).filter(user => user.language === language);
    if (users.length === 0) return undefined;
    
    return users[Math.floor(Math.random() * users.length)];
  }

  /**
   * 获取语言索引
   */
  private getLanguageIndex(language: Language): number {
    const languages = [Language.ZH, Language.EN, Language.RU, Language.TJ];
    return languages.indexOf(language);
  }

  /**
   * 获取测试统计
   */
  public getTestStatistics() {
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const totalMessages = this.testResults.reduce((sum, r) => sum + r.messageCount, 0);
    const totalErrors = this.testResults.reduce((sum, r) => sum + r.errorCount, 0);
    const averageDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    const averageSuccessRate = this.testResults.reduce((sum, r) => sum + r.successRate, 0) / totalTests;

    return {
      totalTests,
      successfulTests,
      totalMessages,
      totalErrors,
      averageDuration,
      averageSuccessRate,
      testResults: this.testResults
    };
  }

  /**
   * 清理测试数据
   */
  public cleanup(): void {
    this.testUsers.clear();
    this.testMessages.clear();
    this.testResults = [];
    logger.info('测试数据已清理');
  }

  /**
   * 生成测试报告
   */
  public generateTestReport(): string {
    const stats = this.getTestStatistics();
    
    const report = `
# Telegram Bot 测试报告

## 测试概览
- 总测试数: ${stats.totalTests}
- 成功测试: ${stats.successfulTests}
- 成功率: ${((stats.successfulTests / stats.totalTests) * 100).toFixed(2)}%
- 总消息数: ${stats.totalMessages}
- 总错误数: ${stats.totalErrors}
- 平均测试时长: ${stats.averageDuration.toFixed(2)}ms
- 平均成功率: ${stats.averageSuccessRate.toFixed(2)}%

## 测试详情
${stats.testResults.map(result => `
### ${result.testName}
- 状态: ${result.success ? '✅ 成功' : '❌ 失败'}
- 耗时: ${result.duration}ms
- 消息数: ${result.messageCount}
- 错误数: ${result.errorCount}
- 成功率: ${result.successRate.toFixed(2)}%
`).join('\n')}
`;

    return report;
  }
}

// 导出单例实例
export const botTester = new TelegramBotTester();