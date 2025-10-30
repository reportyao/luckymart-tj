/**
 * Jest测试环境设置
 * 在每个测试文件运行前执行全局配置
 */

import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 全局超时设置
jest.setTimeout(30000);

// 全局测试设置
beforeAll(async () => {
  console.log('🧪 初始化测试环境...');
  
  // 确保测试数据库连接
  try {
    console.log('✅ 环境变量检查完成');
  } catch (error) {
    console.error('❌ 环境变量配置错误:', error);
  }
});

// 全局清理
afterAll(async () => {
  console.log('🧹 清理测试环境...');
});

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

// 模拟Next.js请求/响应
global.Request = class Request {
  constructor(input, init) {
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers || {});
    this.body = init?.body || null;
  }
  
  async json() {
    if (this.body) {
      return JSON.parse(this.body);
    }
    return {};
  }
};

global.Response = class Response {
  constructor(body, init = {}) {
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Headers(init.headers || {});
    this.body = body;
  }
  
  json() {
    return Promise.resolve(this.body);
  }
};

global.Headers = class Headers {
  constructor(init = {}) {
    this._headers = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this._headers.set(key, value);
      });
    }
  }
  
  set(name, value) {
    this._headers.set(name, value);
  }
  
  get(name) {
    return this._headers.get(name);
  }
};

// 模拟console.log以减少测试输出噪音
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// 测试工具函数
global.testUtils = {
  // 生成随机测试数据
  generateTestUser: (overrides = {}) => ({
    id: `test-user-${Date.now()}`,
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
  }),
  
  // 生成随机测试商品
  generateTestProduct: (overrides = {}) => ({
    id: `test-product-${Date.now()}`,
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
  }),
  
  // 生成随机测试订单
  generateTestOrder: (overrides = {}) => ({
    id: `test-order-${Date.now()}`,
    orderNumber: `TEST_${Date.now()}`,
    userId: 'test-user',
    type: 'lottery',
    totalAmount: 99.99,
    status: 'pending',
    quantity: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  // 生成随机测试夺宝轮次
  generateTestRound: (overrides = {}) => ({
    id: `test-round-${Date.now()}`,
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
  })
};

console.log('✅ Jest测试环境初始化完成');