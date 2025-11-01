import { logger } from '../bot/utils/logger';
/**
 * Jest 测试环境设置
 * 为 Telegram Bot 功能测试配置测试环境
 */


// 设置测试环境
process.env.NODE_ENV = 'test';
process.env.TELEGRAM_BOT_TOKEN = 'test_bot_token_123456789';
process.env.MINI_APP_URL = 'https://test-app.example.com';

// 模拟全局定时器相关函数
global.setImmediate = setImmediate;
global.clearImmediate = clearImmediate;

// 模拟性能监控
global.performance = {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  getEntriesByType: () => [],
  getEntriesByName: () => [],
  clearMarks: () => {},
  clearMeasures: () => {}
};

// 模拟prisma客户端
const mockPrisma = {
  users: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn()
  },
  orders: {
    findMany: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn()
  },
  lotteryRounds: {
    findMany: jest.fn()
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn()
};

// 模拟telegraf模块
jest.mock('telegraf', () => ({
  Telegraf: jest.fn().mockImplementation(() => ({
    telegram: {
      sendMessage: jest.fn().mockResolvedValue({ message_id: 123456 }),
      sendPhoto: jest.fn().mockResolvedValue({ message_id: 123456 }),
      sendDocument: jest.fn().mockResolvedValue({ message_id: 123456 }),
      getMe: jest.fn().mockResolvedValue({
        id: 123456789,
        username: 'test_bot',
        first_name: 'Test Bot'
      }),
      setWebhook: jest.fn().mockResolvedValue(true),
      deleteWebhook: jest.fn().mockResolvedValue(true)
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
  })),
  Markup: {
    inlineKeyboard: jest.fn().mockReturnValue({
      reply_markup: { inline_keyboard: [] }
    }),
    button: {
      webApp: jest.fn().mockReturnValue({ text: 'Test Button', url: 'https://test.com' }),
      callback: jest.fn().mockReturnValue({ text: 'Test Button', callback_data: 'test_action' }),
      url: jest.fn().mockReturnValue({ text: 'Test Link', url: 'https://test.com' })
    }
  }
}));

// 模拟bot服务
jest.mock('../bot/services/user-info-service', () => ({
  UserInfoService: {
    getInstance: jest.fn(() => ({
      getUserInfo: jest.fn().mockResolvedValue({
        telegramId: '12345',
        username: 'testuser',
        firstName: 'Test',
        language: 'zh-CN',
        balance: 100,
        platformBalance: 50,
        vipLevel: 1,
        isActive: true,
        createdAt: new Date()
      }),
      getUserStatus: jest.fn().mockResolvedValue({
        status: 'active',
        activityLevel: 'medium',
        engagementScore: 75,
        daysSinceRegistration: 30,
        daysSinceLastActivity: 1,
        balance: 100,
        totalSpent: 500,
        vipLevel: 1,
        isActive: true
      }),
      validateUser: jest.fn().mockResolvedValue({
        exists: true,
        isValid: true,
        isNewUser: false,
        isVipUser: false,
        isInactive: false,
        errors: [],
        warnings: []
      }),
      getServiceStats: jest.fn().mockReturnValue({
        cache: { hits: 100, misses: 10, ttl: 3600 },
        totalUsers: 1000,
        activeUsers: 750
      })
    }))
  }
}));

jest.mock('../bot/services/reward-notifier', () => ({
  RewardNotifier: jest.fn().mockImplementation(() => ({
    sendRegistrationReward: jest.fn().mockResolvedValue(true),
    showNotificationSettings: jest.fn().mockResolvedValue(true),
    stop: jest.fn()
  }))
}));

jest.mock('../bot/services/notification-service', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    sendWelcomeMessage: jest.fn().mockResolvedValue(true),
    sendBalanceQuery: jest.fn().mockResolvedValue(true),
    sendOrderQuery: jest.fn().mockResolvedValue(true),
    sendHelpMessage: jest.fn().mockResolvedValue(true),
    sendLanguageSelection: jest.fn().mockResolvedValue(true),
    sendCustomNotification: jest.fn().mockResolvedValue(true),
    sendLanguageChanged: jest.fn().mockResolvedValue(true),
    stop: jest.fn()
  }))
}));

// 模拟工具类
jest.mock('../bot/utils/message-queue', () => ({
  MessageQueue: jest.fn().mockImplementation(() => ({
    addMessage: jest.fn().mockResolvedValue('test_message_id'),
    getStats: jest.fn().mockReturnValue({
      queueLength: 10,
      processing: [],
      failed: [],
      processed: 100,
      averageProcessingTime: 150,
      successRate: 95
    }),
    on: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  }))
}));

jest.mock('../bot/utils/fault-tolerance-manager', () => ({
  faultToleranceManager: {
    getMessageQueue: jest.fn(() => ({
      addMessage: jest.fn().mockResolvedValue('test_message_id'),
      getStats: jest.fn().mockReturnValue({
        queueLength: 10,
        processed: 100,
        failed: 5
      }),
      getMetrics: jest.fn().mockReturnValue({
        messageQueue: {
          queueLength: 10,
          processed: 100,
          failed: 5
        },
        systemEvents: {
          total: 50
        },
        recoveryStats: {
          successfulRecoveries: 5,
          failedRecoveries: 1
        }
      })
    })),
    start: jest.fn(),
    stop: jest.fn(),
    getMetrics: jest.fn().mockReturnValue({
      messageQueue: {
        queueLength: 10,
        processed: 100,
        failed: 5
      },
      systemEvents: {
        total: 50
      },
      recoveryStats: {
        successfulRecoveries: 5,
        failedRecoveries: 1
      }
    })
  }
}));

jest.mock('../bot/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    business: jest.fn()
  },
  performanceLogger: jest.fn(() => (fn) => async (...args) => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      logger.info('Performance measurement', { function: fn.name, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Performance measurement failed', { function: fn.name, duration, error: error.message });
      throw error;
    }
  }),
  errorTracker: {
    recordError: jest.fn(),
    getErrorStats: jest.fn().mockReturnValue({
      totalErrors: 5,
      errorTypes: {
        'network_error': 2,
        'validation_error': 2,
        'timeout_error': 1
      }
    })
  }
}));

// 模拟health-monitor
jest.mock('../bot/utils/health-monitor', () => ({
  healthMonitor: {
    on: jest.fn(),
    check: jest.fn().mockReturnValue({
      status: 'healthy',
      checks: {
        database: { status: 'healthy', responseTime: 50 },
        memory: { status: 'healthy', usage: 45 },
        cpu: { status: 'healthy', usage: 30 }
      },
      alerts: []
    })
  },
  HealthStatus: jest.fn()
}));

// 模拟process-monitor
jest.mock('../bot/utils/process-monitor', () => ({
  processMonitor: {
    manualRestart: jest.fn().mockResolvedValue(true),
    getMetrics: jest.fn().mockReturnValue({
      uptime: 3600,
      memoryUsage: process.memoryUsage(),
      cpuUsage: 25,
      restartCount: 0
    })
  }
}));

// 设置测试数据库
jest.mock('../lib/prisma', () => mockPrisma);

// 全局测试辅助函数
global.createMockUser = (overrides = {}) => ({
  telegramId: '12345',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  language: 'zh-CN',
  balance: 100,
  platformBalance: 50,
  vipLevel: 1,
  totalSpent: 0,
  freeDailyCount: 3,
  lastFreeResetDate: new Date(),
  ...overrides
});

global.createMockTelegramUser = (overrides = {}) => ({
  id: 12345,
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
  language_code: 'zh-CN',
  is_premium: false,
  ...overrides
});

global.createMockMessage = (overrides = {}) => ({
  message_id: 1,
  date: Math.floor(Date.now() / 1000),
  chat: { id: 12345, type: 'private' },
  text: '/start',
  ...overrides
});

// 测试清理函数
beforeEach(() => {
  // 清理所有mock调用历史
  jest.clearAllMocks();
  
  // 重置模拟数据库调用
  mockPrisma.users.upsert.mockResolvedValue(global.createMockUser());
  mockPrisma.users.findUnique.mockResolvedValue(global.createMockUser());
  mockPrisma.users.findMany.mockResolvedValue([]);
  mockPrisma.users.create.mockResolvedValue(global.createMockUser());
  mockPrisma.users.update.mockResolvedValue(global.createMockUser());
  mockPrisma.users.deleteMany.mockResolvedValue({ count: 0 });
  
  mockPrisma.orders.findMany.mockResolvedValue([]);
  mockPrisma.orders.create.mockResolvedValue({
    id: 1,
    orderNumber: 'TEST_ORDER_123',
    userId: 1,
    totalAmount: 100,
    paymentStatus: 'paid',
    quantity: 2,
    createdAt: new Date()
  });
  
  mockPrisma.orders.deleteMany.mockResolvedValue({ count: 0 });
});

afterEach(() => {
  // 清理定时器和interval
  jest.clearAllTimers();
});

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// 测试环境配置验证
console.log('🧪 Telegram Bot Test Environment Initialized');
console.log('📋 Test Configuration:');
console.log('  - Node Environment:', process.env.NODE_ENV);
console.log('  - Bot Token:', process.env.TELEGRAM_BOT_TOKEN ? 'Configured' : 'Missing');
console.log('  - Mini App URL:', process.env.MINI_APP_URL);
console.log('  - Database: Mocked');
console.log('  - Telegram API: Mocked');

// 导出模拟对象供测试使用
export { mockPrisma };
export default mockPrisma;