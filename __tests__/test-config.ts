/**
 * 测试环境配置
 * 确保所有测试运行环境的统一性和一致性
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// 加载环境变量
dotenv.config({ path: '.env.local' });

export interface TestConfig {
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  telegram: {
    botToken: string;
  };
  redis: {
    url: string;
  };
  performance: {
    timeout: number;
    concurrentUsers: number;
  };
  cache: {
    defaultTTL: number;
    testDataSize: number;
  };
}

export const testConfig: TestConfig = {
  database: {
    url: process.env.DATABASE_URL || 
         process.env.TEST_DATABASE_URL || 
         'postgresql://test:test@localhost:5432/luckymart_test'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only',
    expiresIn: '15m'
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || 'test-bot-token-for-testing'
  },
  redis: {
    url: process.env.REDIS_URL || 
         process.env.TEST_REDIS_URL || 
         'redis://localhost:6379'
  },
  performance: {
    timeout: 30000,
    concurrentUsers: 50
  },
  cache: {
    defaultTTL: 3600,
    testDataSize: 1000
  }
};

// 验证配置
export function validateTestConfig(): void {
  const required = [
    'database.url',
    'jwt.secret',
    'telegram.botToken'
  ];

  for (const key of required) {
    const value = key.split('.').reduce((obj, k) => obj[k], testConfig as any);
    if (!value) {
      throw new Error(`缺少必需的配置: ${key}`);
    }
  }
}

// 数据库连接池配置
export const prismaConfig = {
  datasources: {
    db: {
      url: testConfig.database.url
    }
  },
  // 优化测试环境配置
  log: ['error', 'warn'],
  // 禁用连接池以避免测试间的干扰
  adapter: null
};

// 测试数据生成器
export class TestDataGenerator {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // 生成测试用户
  generateUser(overrides: Partial<any> = {}) {
    const userId = `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      id: userId,
      telegramId: `test_telegram_${Date.now()}`,
      firstName: 'Test User',
      lastName: 'Test',
      username: `testuser_${Date.now()}`,
      language: 'zh',
      balance: 1000,
      platformBalance: 500,
      freeDailyCount: 3,
      lastFreeResetDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  // 生成测试商品
  generateProduct(overrides: Partial<any> = {}) {
    const productId = `test-product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      id: productId,
      nameZh: `测试商品${Date.now()}`,
      nameEn: `Test Product ${Date.now()}`,
      nameRu: `Тестовый товар ${Date.now()}`,
      descriptionZh: '这是一个测试商品',
      descriptionEn: 'This is a test product',
      descriptionRu: 'Это тестовый товар',
      price: 99.99,
      images: ['test-image.jpg'],
      status: 'active',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  // 生成测试夺宝轮次
  generateLotteryRound(overrides: Partial<any> = {}) {
    const roundId = `test-round-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      id: roundId,
      productId: 'test-product',
      roundNumber: 1,
      totalShares: 100,
      soldShares: 0,
      status: 'active',
      drawTime: null,
      winningNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  // 生成测试参与记录
  generateParticipation(overrides: Partial<any> = {}) {
    const participationId = `test-participation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      id: participationId,
      userId: 'test-user',
      roundId: 'test-round',
      numbers: [1, 2, 3, 4, 5],
      sharesCount: 5,
      amount: 5,
      createdAt: new Date(),
      ...overrides
    };
  }

  // 生成测试订单
  generateOrder(overrides: Partial<any> = {}) {
    const orderId = `test-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      id: orderId,
      orderNumber: `TEST_${Date.now()}`,
      userId: 'test-user',
      type: 'lottery',
      totalAmount: 99.99,
      status: 'pending',
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  // 生成测试交易记录
  generateTransaction(overrides: Partial<any> = {}) {
    const transactionId = `test-transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      id: transactionId,
      userId: 'test-user',
      type: 'lottery',
      amount: 10,
      description: '测试交易',
      balanceAfter: 990,
      createdAt: new Date(),
      ...overrides
    };
  }
}

// 性能测试工具
export class PerformanceTester {
  // 测量函数执行时间
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = process.hrtime.bigint();
    const result = await fn();
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // 转换为毫秒
    
    return { result, duration };
  }

  // 并发执行测试
  static async testConcurrency<T>(
    operation: () => Promise<T>,
    concurrentCount: number
  ): Promise<{ results: T[]; totalTime: number; averageTime: number }> {
    const startTime = process.hrtime.bigint();
    
    const promises = Array(concurrentCount).fill(0).map(() => operation());
    const results = await Promise.all(promises);
    
    const endTime = process.hrtime.bigint();
    const totalTime = Number(endTime - startTime) / 1000000;
    const averageTime = totalTime / concurrentCount;
    
    return { results, totalTime, averageTime };
  }

  // 内存使用监控
  static getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100
    };
  }

  // 压力测试
  static async stressTest(
    operation: () => Promise<any>,
    durationMs: number,
    intervalMs: number = 100
  ): Promise<{ totalOperations: number; successCount: number; errorCount: number; avgResponseTime: number }> {
    const startTime = Date.now();
    let totalOperations = 0;
    let successCount = 0;
    let errorCount = 0;
    const responseTimes: number[] = [];

    const interval = setInterval(async () => {
      if (Date.now() - startTime >= durationMs) {
        clearInterval(interval);
        return;
      }

      try {
        const execStart = process.hrtime.bigint();
        await operation();
        const execEnd = process.hrtime.bigint();
        
        responseTimes.push(Number(execEnd - execStart) / 1000000);
        successCount++;
      } catch (error) {
        errorCount++;
      }
      
      totalOperations++;
    }, intervalMs);

    // 等待测试完成
    await new Promise(resolve => setTimeout(resolve, durationMs + 1000));

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    return { totalOperations, successCount, errorCount, avgResponseTime };
  }
}

// 测试环境清理工具
export class TestCleanup {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // 清理所有测试数据
  async cleanupAll() {
    const tableNames = [
      'transactions',
      'participations', 
      'orders',
      'lotteryRounds',
      'products',
      'users',
      'admins',
      'adminPermissions',
      'systemSettings'
    ];

    for (const tableName of tableNames) {
      await this.prisma[tableName as any].deleteMany({
        where: {
          id: {
            startsWith: 'test-'
          }
        }
      });
    }
  }

  // 清理特定表
  async cleanupTable(tableName: string, pattern: string = 'test-%') {
    await this.prisma[tableName as any].deleteMany({
      where: {
        id: {
          startsWith: 'test-'
        }
      }
    });
  }

  // 重置序列
  async resetSequences() {
    // 重置自增序列（如果需要）
    const sequences = [
      'users_id_seq',
      'products_id_seq',
      'orders_id_seq',
      'transactions_id_seq'
    ];

    for (const seq of sequences) {
      try {
        await this.prisma.$executeRawUnsafe(`ALTER SEQUENCE ${seq} RESTART WITH 1`);
      } catch (error) {
        // 忽略错误，因为不是所有数据库都支持
      }
    }
  }
}

// 模拟数据工具
export class MockDataGenerator {
  // 生成大量测试用户
  static generateBulkUsers(count: number) {
    return Array(count).fill(0).map((_, i) => ({
      id: `test-user-${i}`,
      telegramId: `test_telegram_${i}`,
      firstName: `User ${i}`,
      balance: Math.floor(Math.random() * 10000),
      language: ['zh', 'en', 'ru'][i % 3]
    }));
  }

  // 生成随机交易数据
  static generateRandomTransactions(count: number, userId: string) {
    const types = ['lottery', 'recharge', 'withdraw', 'win', 'refund'];
    const descriptions = {
      lottery: '参与夺宝',
      recharge: '用户充值', 
      withdraw: '用户提现',
      win: '中奖奖励',
      refund: '退款'
    };

    return Array(count).fill(0).map((_, i) => ({
      userId,
      type: types[Math.floor(Math.random() * types.length)],
      amount: (Math.random() - 0.5) * 1000, // 正负金额
      description: descriptions[types[Math.floor(Math.random() * types.length)] as keyof typeof descriptions],
      balanceAfter: Math.floor(Math.random() * 10000)
    }));
  }
}

// 导出所有测试工具
export default {
  testConfig,
  validateTestConfig,
  prismaConfig,
  TestDataGenerator,
  PerformanceTester,
  TestCleanup,
  MockDataGenerator
};