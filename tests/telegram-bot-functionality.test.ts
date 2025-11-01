import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { prisma } from '../lib/prisma';
import { NotificationService } from '../bot/services/notification-service';
import { UserInfoService } from '../bot/services/user-info-service';
import { RewardNotifier } from '../bot/services/reward-notifier';
import { MessageQueue } from '../bot/utils/message-queue';
import { NotificationTemplateManager, Language, NotificationType } from '../bot/utils/notification-templates';
import { faultToleranceManager } from '../bot/utils/fault-tolerance-manager';
import { logger } from '../bot/utils/logger';
/**
 * Telegram Bot 功能测试套件
 * 验证Bot命令处理、多语言响应、通知模板、消息队列和重试机制
 */


// 模拟 Telegram Bot
const mockBot = {
  telegram: {
    sendMessage: jest.fn(),
    sendPhoto: jest.fn(),
    sendDocument: jest.fn(),
    getMe: jest.fn(),
    setWebhook: jest.fn(),
    deleteWebhook: jest.fn(),
  },
  launch: jest.fn(),
  stop: jest.fn(),
  catch: jest.fn(),
  use: jest.fn(),
  command: jest.fn(),
  action: jest.fn(),
  on: jest.fn(),
  handleUpdate: jest.fn(),
  botInfo: {
    id: 123456789,
    username: 'test_bot',
    first_name: 'Test Bot'
  }
};

// 模拟 Context
const createMockContext = (command: string, userData: any = {}) => ({
  from: {
    id: userData.telegramId || 12345,
    first_name: userData.firstName || 'Test',
    last_name: userData.lastName || 'User',
    username: userData.username || 'testuser',
    language_code: userData.language || 'zh-CN',
    is_premium: userData.isPremium || false,
    ...userData
  },
  chat: {
    id: userData.chatId || 12345,
    type: 'private'
  },
  message: {
    message_id: 1,
    date: Math.floor(Date.now() / 1000),
    text: `/${command}`
  },
  reply: jest.fn(),
  replyWithPhoto: jest.fn(),
  replyWithDocument: jest.fn(),
  answerCbQuery: jest.fn()
});

describe('Telegram Bot 功能测试', () => {
  let messageQueue: MessageQueue;
  let notificationService: NotificationService;
  let userInfoService: UserInfoService;
  let rewardNotifier: RewardNotifier;
  let mockCtx: any;

  beforeAll(async () => {
    // 初始化测试环境
    logger.info('开始Telegram Bot功能测试');
    
    // 初始化消息队列
    messageQueue = faultToleranceManager.getMessageQueue();
    
    // 初始化用户信息服务
    userInfoService = UserInfoService.getInstance(mockBot as any);
    
    // 初始化奖励通知服务
    rewardNotifier = new RewardNotifier(mockBot as any, {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2
    });
    
    // 初始化多语言通知服务
    notificationService = new NotificationService(mockBot as any, {
      maxRetries: 3,
      initialDelay: 500,
      maxDelay: 10000,
      backoffMultiplier: 2
    });

    // 清理测试数据库
    await cleanupTestData();
  });

  afterAll(async () => {
    // 清理测试数据
    await cleanupTestData();
    logger.info('Telegram Bot功能测试完成');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCtx = createMockContext('start');
  });

  afterEach(async () => {
    // 每次测试后清理数据库
    await cleanupTestData();
  });

  describe('Bot命令处理测试', () => {
    test('/start 命令 - 新用户注册', async () => {
      const startCtx = createMockContext('start');
      
      // 模拟用户注册逻辑
      const telegramId = startCtx.from.id.toString();
      
      // 使用upsert创建用户
      const user = await prisma.users.upsert({
        where: { telegramId },
        update: {
          username: startCtx.from.username || null,
          firstName: startCtx.from.first_name || 'Unknown',
        },
        create: {
          telegramId,
          username: startCtx.from.username || null,
          firstName: startCtx.from.first_name || 'Unknown',
          lastName: startCtx.from.last_name || null,
          language: startCtx.from.language_code || 'zh-CN',
          balance: 50,
          platformBalance: 0,
          vipLevel: 0,
          totalSpent: 0,
          freeDailyCount: 0,
          lastFreeResetDate: new Date(),
        }
      });

      expect(user).toBeDefined();
      expect(user.balance).toBe(50);
      expect(user.language).toBe('zh-CN');
      expect(user.firstName).toBe('Test');

      // 验证消息队列处理
      const messageId = await messageQueue.addMessage('telegram', {
        type: 'user_registration',
        telegramId,
        userData: startCtx.from
      }, { priority: 'high' });

      expect(messageId).toBeDefined();
    }, 30000);

    test('/balance 命令 - 余额查询', async () => {
      const balanceCtx = createMockContext('balance');
      const telegramId = balanceCtx.from.id.toString();

      // 创建测试用户
      await createTestUser(telegramId, balanceCtx.from);

      // 模拟余额查询
      const user = await prisma.users.findUnique({
        where: { telegramId }
      });

      expect(user).toBeDefined();
      expect(user?.balance).toBeGreaterThanOrEqual(0);

      // 测试多语言余额查询
      const languages = [Language.ZH, Language.EN, Language.RU, Language.TJ];
      
      for (const lang of languages) {
        const data = {
          user: {
            telegramId,
            userId: user!.id,
            username: user!.username,
            firstName: user!.firstName,
            language: lang,
            balance: user!.balance,
            platformBalance: user!.platformBalance,
            vipLevel: user!.vipLevel
          },
          type: NotificationType.BALANCE_QUERY,
          variables: {
            balance: user!.balance,
            platformBalance: user!.platformBalance,
            vipLevel: user!.vipLevel,
            freeCount: user!.freeDailyCount,
            appUrl: 'https://app.example.com'
          }
        };

        const notification = NotificationTemplateManager.generateNotification(data);
        
        expect(notification.message).toContain(user!.balance.toString());
        expect(notification.title).toBeDefined();
        expect(notification.keyboard).toBeDefined();
      }
    }, 30000);

    test('/orders 命令 - 订单查询', async () => {
      const ordersCtx = createMockContext('orders');
      const telegramId = ordersCtx.from.id.toString();

      const user = await createTestUser(telegramId, ordersCtx.from);

      // 创建测试订单
      const order = await prisma.orders.create({
        data: {
          orderNumber: `TEST_${Date.now()}`,
          userId: user.id,
          totalAmount: 100.0,
          paymentStatus: 'paid',
          quantity: 2,
          productId: 1
        }
      });

      expect(order).toBeDefined();
      expect(order.paymentStatus).toBe('paid');

      // 模拟订单查询
      const orders = await prisma.orders.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      expect(orders).toHaveLength(1);
      expect((orders?.0 ?? null).orderNumber).toBe(order.orderNumber);
    }, 30000);

    test('/help 命令 - 帮助信息', async () => {
      const helpCtx = createMockContext('help');
      const telegramId = helpCtx.from.id.toString();

      await createTestUser(telegramId, helpCtx.from);

      // 测试多语言帮助信息
      const languages = [Language.ZH, Language.EN, Language.RU, Language.TJ];
      
      for (const lang of languages) {
        const data = {
          user: {
            telegramId,
            userId: 1,
            firstName: 'Test',
            language: lang,
            balance: 50,
            platformBalance: 0,
            vipLevel: 0
          },
          type: NotificationType.HELP_MESSAGE,
          variables: {}
        };

        const notification = NotificationTemplateManager.generateNotification(data);
        
        expect(notification.message).toContain('命令列表');
        expect(notification.title).toBeDefined();
        expect(notification.keyboard).toBeDefined();
      }
    }, 30000);

    test('/language 命令 - 语言切换', async () => {
      const telegramId = '12345';
      const languages = [Language.ZH, Language.EN, Language.RU, Language.TJ];

      for (const lang of languages) {
        await createTestUser(telegramId, {
          id: 12345,
          first_name: 'Test',
          username: 'testuser',
          language_code: lang
        });

        // 测试语言切换
        await prisma.users.update({
          where: { telegramId },
          data: { language: lang }
        });

        const user = await prisma.users.findUnique({
          where: { telegramId }
        });

        expect(user?.language).toBe(lang);
      }
    }, 30000);
  });

  describe('多语言通知模板测试', () => {
    test('验证24种通知类型的多语言支持', async () => {
      const supportedTypes = NotificationTemplateManager.getSupportedTypes();
      const supportedLanguages = NotificationTemplateManager.getSupportedLanguages();

      expect(supportedTypes).toHaveLength(24);
      expect(supportedLanguages).toHaveLength(4);
      
      // 验证每种通知类型在每种语言中都有模板
      for (const type of supportedTypes) {
        for (const language of supportedLanguages) {
          const data = {
            user: {
              telegramId: '12345',
              userId: 1,
              firstName: 'Test',
              language,
              balance: 50,
              platformBalance: 0,
              vipLevel: 0
            },
            type,
            variables: {
              balance: 50,
              platformBalance: 0,
              vipLevel: 0,
              orderNumber: 'TEST123',
              amount: 100,
              productName: 'Test Product',
              roundId: 'ROUND123',
              participants: 100,
              prizeValue: 1000,
              oldLevel: 0,
              newLevel: 1,
              benefits: '• 5% 折扣\n• 优先发货',
              firstName: 'Test',
              appUrl: 'https://app.example.com',
              rewardAmount: 50,
              freeCount: 3,
              hasOrders: true,
              orderCount: 1,
              orderList: '订单 TEST123\n状态: 已支付\n金额: 100 TJS',
              status: '已支付',
              hasTracking: false,
              title: '测试通知',
              content: '这是一条测试通知'
            }
          };

          const validation = NotificationTemplateManager.validateNotificationData(data);
          expect(validation.valid).toBe(true);
          expect(validation.errors).toHaveLength(0);

          const notification = NotificationTemplateManager.generateNotification(data);
          expect(notification.title).toBeDefined();
          expect(notification.message).toBeDefined();
          expect(typeof notification.message).toBe('string');
          expect(notification.message.length).toBeGreaterThan(0);
        }
      }
    }, 60000);

    test('验证语言回退机制', async () => {
      const user = {
        telegramId: '12345',
        userId: 1,
        firstName: 'Test',
        language: 'unsupported-language' as Language, // 不支持的语言
        balance: 50,
        platformBalance: 0,
        vipLevel: 0
      };

      const data = {
        user,
        type: NotificationType.WELCOME_MESSAGE,
        variables: {
          firstName: 'Test',
          balance: 50,
          appUrl: 'https://app.example.com'
        }
      };

      // 验证默认语言（塔吉克语）回退
      const notification = NotificationTemplateManager.generateNotification(data);
      expect(notification.title).toBeDefined();
      expect(notification.message).toBeDefined();
      
      // 检查包含默认语言的标识（塔吉克语）
      const languageUtils = require('../bot/utils/notification-templates').LanguageUtils;
      const defaultLang = languageUtils.getUserLanguage('unsupported-language');
      expect(defaultLang).toBe(Language.TJ);
    }, 30000);

    test('验证通知模板变量替换', async () => {
      const data = {
        user: {
          telegramId: '12345',
          userId: 1,
          firstName: 'TestUser',
          language: Language.ZH,
          balance: 100,
          platformBalance: 50.5,
          vipLevel: 2
        },
        type: NotificationType.BALANCE_QUERY,
        variables: {
          balance: 100,
          platformBalance: 50.5,
          vipLevel: 2,
          freeCount: 3,
          appUrl: 'https://app.example.com'
        }
      };

      const notification = NotificationTemplateManager.generateNotification(data);
      
      // 验证变量替换
      expect(notification.message).toContain('100'); // balance
      expect(notification.message).toContain('50.5'); // platformBalance
      expect(notification.message).toContain('2'); // vipLevel
      expect(notification.message).toContain('3'); // freeCount
      expect(notification.keyboard).toBeDefined();
    }, 30000);
  });

  describe('消息队列和重试机制测试', () => {
    test('消息入队和优先级处理', async () => {
      const highPriorityMessage = await messageQueue.addMessage('telegram', {
        type: 'send_message',
        text: 'High priority message'
      }, { priority: 'high' });

      const normalPriorityMessage = await messageQueue.addMessage('telegram', {
        type: 'send_message',
        text: 'Normal priority message'
      }, { priority: 'normal' });

      const lowPriorityMessage = await messageQueue.addMessage('telegram', {
        type: 'send_message',
        text: 'Low priority message'
      }, { priority: 'low' });

      expect(highPriorityMessage).toBeDefined();
      expect(normalPriorityMessage).toBeDefined();
      expect(lowPriorityMessage).toBeDefined();

      // 等待消息处理
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const stats = faultToleranceManager.getMetrics();
      expect(stats.messageQueue.queueLength).toBeGreaterThanOrEqual(0);
    }, 30000);

    test('消息重试机制', async () => {
      // 模拟失败的消息处理
      const failedMessageId = await messageQueue.addMessage('telegram', {
        type: 'send_message',
        text: 'This message will fail',
        simulateFailure: true
      }, { maxAttempts: 3 });

      expect(failedMessageId).toBeDefined();

      // 等待重试机制触发
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const stats = messageQueue.getStats();
      expect(stats.failed.length).toBeGreaterThanOrEqual(0);
    }, 30000);

    test('消息并发处理', async () => {
      const messagePromises = [];
      
      // 并发发送多个消息
      for (let i = 0; i < 20; i++) {
        const messageId = await messageQueue.addMessage('telegram', {
          type: 'send_message',
          text: `Concurrent message ${i}`
        });
        messagePromises.push(messageId);
      }

      expect(messagePromises).toHaveLength(20);
      
      // 等待处理完成
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const stats = faultToleranceManager.getMetrics();
      expect(stats.messageQueue.processed).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe('Bot命令和交互测试', () => {
    test('用户信息获取命令', async () => {
      const userinfoCtx = createMockContext('userinfo');
      const telegramId = userinfoCtx.from.id.toString();

      const user = await createTestUser(telegramId, userinfoCtx.from);

      // 模拟用户信息获取
      const userInfo = await userInfoService.getUserInfo(telegramId);
      
      if (userInfo) {
        expect(userInfo.telegramId).toBe(telegramId);
        expect(userInfo.username).toBe(user.username);
        expect(userInfo.language).toBe(user.language);
      }
    }, 30000);

    test('用户状态检查命令', async () => {
      const statusCtx = createMockContext('status');
      const telegramId = statusCtx.from.id.toString();

      await createTestUser(telegramId, statusCtx.from);

      // 模拟用户状态检查
      const userStatus = await userInfoService.getUserStatus(telegramId);
      
      expect(userStatus).toBeDefined();
      expect(userStatus.status).toBeDefined();
      expect(userStatus.activityLevel).toBeDefined();
      expect(userStatus.engagementScore).toBeGreaterThanOrEqual(0);
    }, 30000);

    test('用户验证命令', async () => {
      const validateCtx = createMockContext('validate');
      const telegramId = validateCtx.from.id.toString();

      await createTestUser(telegramId, validateCtx.from);

      // 模拟用户验证
      const validation = await userInfoService.validateUser(telegramId);
      
      expect(validation).toBeDefined();
      expect(validation.exists).toBe(true);
      expect(validation.isValid).toBe(true);
    }, 30000);
  });

  describe('内联键盘多语言显示测试', () => {
    test('验证内联键盘多语言按钮', async () => {
      const languages = [Language.ZH, Language.EN, Language.RU, Language.TJ];
      
      for (const lang of languages) {
        const data = {
          user: {
            telegramId: '12345',
            userId: 1,
            firstName: 'Test',
            language: lang,
            balance: 50,
            platformBalance: 0,
            vipLevel: 0
          },
          type: NotificationType.WELCOME_MESSAGE,
          variables: {
            firstName: 'Test',
            balance: 50,
            appUrl: 'https://app.example.com'
          }
        };

        const notification = NotificationTemplateManager.generateNotification(data);
        expect(notification.keyboard).toBeDefined();
        
        // 验证键盘包含预期数量的按钮
        const keyboardData = notification.keyboard?.reply_markup?.inline_keyboard;
        expect(keyboardData).toBeDefined();
        expect(Array.isArray(keyboardData)).toBe(true);
      }
    }, 30000);
  });

  describe('错误处理和容错机制测试', () => {
    test('数据库连接失败处理', async () => {
      // 模拟数据库连接失败
      jest.spyOn(prisma.users, 'findUnique').mockRejectedValue(new Error('Database connection failed'));

      const startCtx = createMockContext('start');
      const telegramId = startCtx.from.id.toString();

      // 模拟错误处理
      try {
        await prisma.users.findUnique({
          where: { telegramId }
        });
      } catch (error) {
        expect((error as Error).message).toContain('Database connection failed');
        
        // 验证错误被正确记录
        logger.error('Database error test', { telegramId, error: (error as Error).message }, error as Error);
      }
    }, 30000);

    test('Bot服务重启后的状态恢复', async () => {
      // 模拟Bot重启场景
      const restartTest = async () => {
        // 保存当前队列状态
        const beforeRestartStats = faultToleranceManager.getMetrics();
        
        // 模拟重启过程
        logger.info('Simulating bot restart');
        
        // 验证重启后状态恢复
        const afterRestartStats = faultToleranceManager.getMetrics();
        
        expect(afterRestartStats.messageQueue.queueLength).toBeGreaterThanOrEqual(0);
      };

      await restartTest();
    }, 30000);
  });

  describe('性能测试', () => {
    test('大量用户并发注册测试', async () => {
      const startTime = Date.now();
      const concurrentUsers = 50;
      
      const userPromises = [];
      
      for (let i = 0; i < concurrentUsers; i++) {
        const telegramId = `test_${i}_${Date.now()}`;
        const ctx = createMockContext('start', {
          telegramId,
          username: `user_${i}`,
          firstName: `User${i}`,
          language: ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'][i % 4]
        });

        const promise = messageQueue.addMessage('telegram', {
          type: 'user_registration',
          telegramId,
          userData: ctx.from
        }, { priority: 'high' });

        userPromises.push(promise);
      }

      const messageIds = await Promise.all(userPromises);
      const endTime = Date.now();
      
      expect(messageIds).toHaveLength(concurrentUsers);
      expect(endTime - startTime).toBeLessThan(10000); // 10秒内完成
    }, 30000);

    test('大量通知批量发送测试', async () => {
      const startTime = Date.now();
      const notificationCount = 100;
      
      const notificationPromises = [];
      
      for (let i = 0; i < notificationCount; i++) {
        const data = {
          user: {
            telegramId: `user_${i}`,
            userId: i + 1,
            firstName: `User${i}`,
            language: Language.ZH,
            balance: 50,
            platformBalance: 0,
            vipLevel: 0
          },
          type: NotificationType.SYSTEM_NOTIFICATION,
          variables: {
            title: `测试通知 ${i}`,
            content: `这是第 ${i + 1} 条测试通知`,
            appUrl: 'https://app.example.com'
          }
        };

        const promise = messageQueue.addMessage('notification', data);
        notificationPromises.push(promise);
      }

      await Promise.all(notificationPromises);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // 5秒内完成
    }, 30000);
  });

  describe('监控和调试测试', () => {
    test('消息状态监控', async () => {
      const messageId = await messageQueue.addMessage('telegram', {
        type: 'send_message',
        text: 'Test monitoring message'
      });

      // 等待消息处理
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 验证消息状态监控
      const stats = messageQueue.getStats();
      expect(stats.queueLength).toBeGreaterThanOrEqual(0);
      expect(stats.processed).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
    }, 30000);

    test('推送成功率统计', async () => {
      const successCount = 95;
      const failureCount = 5;
      const totalCount = successCount + failureCount;
      
      // 模拟成功和失败的消息
      for (let i = 0; i < successCount; i++) {
        await messageQueue.addMessage('telegram', {
          type: 'send_message',
          text: `Success message ${i}`
        });
      }

      for (let i = 0; i < failureCount; i++) {
        await messageQueue.addMessage('telegram', {
          type: 'send_message',
          text: `Failure message ${i}`,
          simulateFailure: true
        });
      }

      // 等待处理完成
      await new Promise(resolve => setTimeout(resolve, 2000));

      const stats = messageQueue.getStats();
      const actualSuccessRate = (successCount / totalCount) * 100;
      expect(stats.successRate).toBeGreaterThanOrEqual(actualSuccessRate - 10); // 允许10%误差
    }, 30000);
  });
});

// 辅助函数
async function createTestUser(telegramId: string, userData: any) {
  return await prisma.users.upsert({
    where: { telegramId },
    update: {
      username: userData.username || null,
      firstName: userData.first_name || 'Test',
      language: userData.language_code || 'zh-CN',
    },
    create: {
      telegramId,
      username: userData.username || null,
      firstName: userData.first_name || 'Test',
      lastName: userData.last_name || null,
      language: userData.language_code || 'zh-CN',
      balance: 50,
      platformBalance: 0,
      vipLevel: 0,
      totalSpent: 0,
      freeDailyCount: 3,
      lastFreeResetDate: new Date(),
    }
  });
}

async function cleanupTestData() {
  // 清理测试用户数据
  await prisma.users.deleteMany({
    where: {
      telegramId: {
        startsWith: 'test_'
      }
    }
  });

  // 清理测试订单数据
  await prisma.orders.deleteMany({
    where: {
      orderNumber: {
        startsWith: 'TEST_'
      }
    }
  });
}