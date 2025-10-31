/**
 * JWT认证系统单元测试
 * 测试认证、授权、token管理等功能
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyAccessToken,
  hashPassword,
  verifyPassword,
  validateTelegramWebAppData,
  generateSecureRandom,
  generateHash
} from '../lib/auth';

describe('JWT认证系统测试', () => {
  const mockUserId = 'test-user-12345';
  const mockTelegramId = 'test-telegram-67890';
  const mockJWT_SECRET = 'mock-jwt-secret-for-testing';
  const mockBOT_TOKEN = 'mock-bot-token-for-testing';

  beforeEach(() => {
    // 设置测试环境变量
    process.env.JWT_SECRET = mockJWT_SECRET;
    process.env.TELEGRAM_BOT_TOKEN = mockBOT_TOKEN;
  });

  afterEach(() => {
    // 清理环境变量
    delete process.env.JWT_SECRET;
    delete process.env.TELEGRAM_BOT_TOKEN;
  });

  describe('Token生成测试', () => {
    test('应该成功生成访问Token', () => {
      const token = generateAccessToken(mockUserId, mockTelegramId);
      
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(50); // JWT token通常比较长
      
      // 验证token结构
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(mockUserId);
      expect(decoded.telegramId).toBe(mockTelegramId);
      expect(decoded.type).toBe('access');
    });

    test('应该成功生成刷新Token', () => {
      const token = generateRefreshToken(mockUserId, mockTelegramId);
      
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(50);
      
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(mockUserId);
      expect(decoded.telegramId).toBe(mockTelegramId);
      expect(decoded.type).toBe('refresh');
    });

    test('应该验证JWT_SECRET环境变量', () => {
      delete process.env.JWT_SECRET;
      
      expect(() => {
        generateAccessToken(mockUserId, mockTelegramId);
      }).toThrow('JWT_SECRET环境变量未配置');
    });

    test('生成的token应该包含过期时间', () => {
      const token = generateAccessToken(mockUserId, mockTelegramId);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('Token验证测试', () => {
    let validAccessToken: string;

    beforeEach(() => {
      validAccessToken = generateAccessToken(mockUserId, mockTelegramId);
    });

    test('应该成功验证有效的访问Token（包含安全字段）', () => {
      const result = verifyAccessToken(validAccessToken);
      
      expect(result).toBeDefined();
      expect(result.userId).toBe(mockUserId);
      expect(result.telegramId).toBe(mockTelegramId);
      expect(result.tokenType).toBe('access');
      expect(result.jti).toBeDefined();
      expect(typeof result.jti).toBe('string');
      expect(result.jti.length).toBeGreaterThanOrEqual(8);
    });

    test('应该拒绝无效的Token格式', () => {
      const invalidToken = 'invalid.jwt.token';
      
      expect(() => {
        verifyAccessToken(invalidToken);
      }).toThrow();
    });

    test('应该拒绝空或非字符串Token', () => {
      expect(() => {
        verifyAccessToken('');
      }).toThrow('无效的token格式');

      expect(() => {
        verifyAccessToken(null as any);
      }).toThrow('无效的token格式');

      expect(() => {
        verifyAccessToken(123 as any);
      }).toThrow('无效的token格式');
    });

    test('应该拒绝缺少必需字段的Token', () => {
      const malformedToken = jwt.sign(
        {
          userId: mockUserId,
          // 缺少 telegramId 和 jti
          type: 'access'
        },
        mockJWT_SECRET,
        { expiresIn: '15m' }
      );
      
      expect(() => {
        verifyAccessToken(malformedToken);
      }).toThrow('token字段缺失或不完整');
    });

    test('应该拒绝无效的JWT ID', () => {
      const malformedToken = jwt.sign(
        {
          userId: mockUserId,
          telegramId: mockTelegramId,
          type: 'access',
          jti: 'short' // 太短的JTI
        },
        mockJWT_SECRET,
        { expiresIn: '15m' }
      );
      
      expect(() => {
        verifyAccessToken(malformedToken);
      }).toThrow('无效的token唯一标识符');
    });

    test('应该拒绝过期的Token', () => {
      // 创建一个已过期的token
      const expiredToken = jwt.sign(
        {
          userId: mockUserId,
          telegramId: mockTelegramId,
          tokenType: 'access',
          jti: generateSecureRandom(16),
          exp: Math.floor(Date.now() / 1000) - 3600 // 1小时前过期
        },
        mockJWT_SECRET
      );
      
      expect(() => {
        verifyAccessToken(expiredToken);
      }).toThrow();
    });

    test('应该验证Token类型', () => {
      const refreshToken = generateRefreshToken(mockUserId, mockTelegramId);
      
      // 刷新token不应该被access token验证器接受
      expect(() => {
        verifyAccessToken(refreshToken);
      }).toThrow('无效的token类型');
    });
  });

  describe('通用Token验证测试', () => {
    let validToken: string;

    beforeEach(() => {
      validToken = generateAccessToken(mockUserId, mockTelegramId);
    });

    test('应该成功验证有效的Token', () => {
      const result = verifyToken(validToken);
      
      expect(result).toBeDefined();
      expect(result.userId).toBe(mockUserId);
      expect(result.telegramId).toBe(mockTelegramId);
      expect(result).toHaveProperty('jti');
    });

    test('应该返回null对于无效Token', () => {
      const invalidToken = 'completely-invalid-token';
      
      const result = verifyToken(invalidToken);
      expect(result).toBeNull();
    });

    test('应该返回null对于格式错误的Token', () => {
      const malformedToken = 'not-a-jwt-token-format';
      
      const result = verifyToken(malformedToken);
      expect(result).toBeNull();
    });

    test('应该验证JWT唯一标识符（jti）', () => {
      const result = verifyToken(validToken);
      expect(result).toBeDefined();
      expect(result.jti).toBeDefined();
      expect(typeof result.jti).toBe('string');
      expect(result.jti.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('密码处理测试', () => {
    const testPassword = 'TestPassword123!';

    test('应该成功生成密码哈希', async () => {
      const hash = await hashPassword(testPassword);
      
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(50);
      expect(hash).not.toBe(testPassword); // 哈希不应该等于原始密码
    });

    test('应该成功验证正确密码', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword(testPassword, hash);
      
      expect(isValid).toBe(true);
    });

    test('应该拒绝错误密码', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword('WrongPassword123!', hash);
      
      expect(isValid).toBe(false);
    });

    test('应该确保哈希的一致性', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);
      
      // bcrypt每次生成的盐值不同，所以哈希也不同
      expect(hash1).not.toBe(hash2);
      
      // 但验证都应该成功
      expect(await verifyPassword(testPassword, hash1)).toBe(true);
      expect(await verifyPassword(testPassword, hash2)).toBe(true);
    });
  });

  describe('Telegram WebApp验证测试（加强安全版）', () => {
    let testBotToken: string;
    let mockUser: any;
    let currentTime: number;

    beforeEach(() => {
      testBotToken = 'test_bot_token_12345';
      currentTime = Math.floor(Date.now() / 1000);
      mockUser = {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'en'
      };
    });

    test('应该验证有效的Telegram数据（包含完整HMAC计算）', () => {
      // 生成有效的Telegram WebApp数据
      const authDate = currentTime - 60; // 1分钟前
      const initDataParams = new URLSearchParams({
        auth_date: authDate.toString(),
        user: JSON.stringify(mockUser)
      });

      // 计算正确的HMAC
      const dataCheckString = Array.from(initDataParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(testBotToken)
        .digest();

      const correctHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      initDataParams.set('hash', correctHash);
      const initData = initDataParams.toString();

      const user = validateTelegramWebAppData(initData);
      
      expect(user.id).toBe(123456789);
      expect(user.first_name).toBe('Test');
      expect(user.last_name).toBe('User');
      expect(user.auth_date).toBe(authDate);
    });

    test('应该拒绝过期的认证数据（超过5分钟）', () => {
      const authDate = currentTime - 301; // 超过5分钟
      const initDataParams = new URLSearchParams({
        auth_date: authDate.toString(),
        user: JSON.stringify(mockUser)
      });

      const dataCheckString = Array.from(initDataParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(testBotToken)
        .digest();

      const correctHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      initDataParams.set('hash', correctHash);
      const initData = initDataParams.toString();

      expect(() => {
        validateTelegramWebAppData(initData);
      }).toThrow(/认证数据已过期/);
    });

    test('应该拒绝时间超前的数据（超过60秒）', () => {
      const authDate = currentTime + 61; // 时间超前61秒
      const initDataParams = new URLSearchParams({
        auth_date: authDate.toString(),
        user: JSON.stringify(mockUser)
      });

      const dataCheckString = Array.from(initDataParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(testBotToken)
        .digest();

      const correctHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      initDataParams.set('hash', correctHash);
      const initData = initDataParams.toString();

      expect(() => {
        validateTelegramWebAppData(initData);
      }).toThrow(/认证数据时间超前/);
    });

    test('应该拒绝无效的hash', () => {
      const authDate = currentTime - 60;
      const initData = new URLSearchParams({
        auth_date: authDate.toString(),
        user: JSON.stringify(mockUser),
        hash: 'invalid-hash'
      }).toString();

      expect(() => {
        validateTelegramWebAppData(initData);
      }).toThrow(/哈希验证失败/);
    });

    test('应该拒绝缺少必需字段的数据', () => {
      // 缺少auth_date
      expect(() => {
        validateTelegramWebAppData('user=test&hash=test');
      }).toThrow('缺少auth_date字段');

      // 缺少hash
      expect(() => {
        const initData = new URLSearchParams({
          auth_date: currentTime.toString(),
          user: JSON.stringify(mockUser)
        }).toString();
        validateTelegramWebAppData(initData);
      }).toThrow('缺少hash字段');

      // 缺少用户信息
      expect(() => {
        const initData = new URLSearchParams({
          auth_date: currentTime.toString(),
          hash: 'test'
        }).toString();
        validateTelegramWebAppData(initData);
      }).toThrow('缺少用户信息');
    });

    test('应该拒绝无效的用户数据格式', () => {
      const authDate = currentTime - 60;
      const initData = new URLSearchParams({
        auth_date: authDate.toString(),
        user: 'invalid-json',
        hash: 'test'
      }).toString();

      expect(() => {
        validateTelegramWebAppData(initData);
      }).toThrow('用户信息格式无效');
    });

    test('应该验证用户信息完整性', () => {
      const authDate = currentTime - 60;
      
      // 缺少用户ID
      expect(() => {
        const initData = new URLSearchParams({
          auth_date: authDate.toString(),
          user: JSON.stringify({ first_name: 'Test' }),
          hash: 'test'
        }).toString();
        validateTelegramWebAppData(initData);
      }).toThrow('缺少或无效的用户ID');

      // 缺少用户名
      expect(() => {
        const initData = new URLSearchParams({
          auth_date: authDate.toString(),
          user: JSON.stringify({ id: 123 }),
          hash: 'test'
        }).toString();
        validateTelegramWebAppData(initData);
      }).toThrow('缺少或无效的用户名');
    });

    test('应该处理过长的用户名（防止字符串攻击）', () => {
      const authDate = currentTime - 60;
      const longUser = {
        id: 123456789,
        first_name: 'a'.repeat(101), // 超过100字符限制
        username: 'testuser'
      };

      expect(() => {
        const initData = new URLSearchParams({
          auth_date: authDate.toString(),
          user: JSON.stringify(longUser),
          hash: 'test'
        }).toString();
        validateTelegramWebAppData(initData);
      }).toThrow('用户名长度超出限制');
    });

    test('应该检查Bot Token配置', () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      
      const initData = new URLSearchParams({
        auth_date: currentTime.toString(),
        user: JSON.stringify(mockUser),
        hash: 'test'
      }).toString();

      expect(() => {
        validateTelegramWebAppData(initData);
      }).toThrow('TELEGRAM_BOT_TOKEN环境变量未配置');
    });

    test('应该清理返回的用户信息（防止数据泄露）', () => {
      const authDate = currentTime - 60;
      const userWithExtraFields = {
        ...mockUser,
        extra_field: 'should_be_removed',
        private_data: 'sensitive_info'
      };

      const initDataParams = new URLSearchParams({
        auth_date: authDate.toString(),
        user: JSON.stringify(userWithExtraFields)
      });

      const dataCheckString = Array.from(initDataParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(testBotToken)
        .digest();

      const correctHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      initDataParams.set('hash', correctHash);
      const initData = initDataParams.toString();

      const user = validateTelegramWebAppData(initData);
      
      // 应该只包含安全的字段
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('first_name');
      expect(user).not.toHaveProperty('extra_field');
      expect(user).not.toHaveProperty('private_data');
      expect(user.auth_date).toBe(authDate);
    });

    test('应该验证用户ID的有效范围', () => {
      const authDate = currentTime - 60;
      const invalidUser = {
        id: -1, // 负数ID
        first_name: 'Test'
      };

      expect(() => {
        const initData = new URLSearchParams({
          auth_date: authDate.toString(),
          user: JSON.stringify(invalidUser),
          hash: 'test'
        }).toString();
        validateTelegramWebAppData(initData);
      }).toThrow('无效的用户ID范围');
    });
  });

  describe('安全工具函数测试', () => {
    test('应该生成安全的随机字符串', () => {
      const random1 = generateSecureRandom(32);
      const random2 = generateSecureRandom(32);
      
      expect(typeof random1).toBe('string');
      expect(random1.length).toBe(64); // 32字节 = 64十六进制字符
      expect(random1).not.toBe(random2); // 每次都应该不同
    });

    test('应该生成SHA256哈希', () => {
      const data = 'test-data-string';
      const hash1 = generateHash(data);
      const hash2 = generateHash(data);
      
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBe(64); // SHA256 = 64十六进制字符
      expect(hash1).toBe(hash2); // 相同输入应该产生相同输出
    });

    test('哈希应该不可逆', () => {
      const originalData = 'original-secret-data';
      const hash = generateHash(originalData);
      
      // 尝试从哈希恢复原始数据应该不可能
      expect(hash).not.toBe(originalData);
      expect(hash).not.toContain(originalData);
    });
  });

  describe('Token权限测试', () => {
    test('不同用户应该生成不同的Token', () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';
      
      const token1 = generateAccessToken(userId1, 'telegram-1');
      const token2 = generateAccessToken(userId2, 'telegram-2');
      
      expect(token1).not.toBe(token2);
      
      const decoded1 = jwt.decode(token1) as any;
      const decoded2 = jwt.decode(token2) as any;
      
      expect(decoded1.userId).not.toBe(decoded2.userId);
    });

    test('相同的用户ID应该生成不同的Token', () => {
      const token1 = generateAccessToken(mockUserId, mockTelegramId);
      const token2 = generateAccessToken(mockUserId, mockTelegramId);
      
      expect(token1).not.toBe(token2); // JWT使用随机盐值
      
      // 但解码后应该包含相同的信息
      const decoded1 = jwt.decode(token1) as any;
      const decoded2 = jwt.decode(token2) as any;
      
      expect(decoded1.userId).toBe(decoded2.userId);
      expect(decoded1.telegramId).toBe(decoded2.telegramId);
    });
  });

  describe('错误处理测试', () => {
    test('应该处理JWT解码错误', () => {
      const malformedToken = 'malformed.jwt.token';
      
      expect(() => {
        verifyAccessToken(malformedToken);
      }).toThrow();
    });

    test('应该处理签名验证失败', () => {
      const fakeToken = jwt.sign(
        { userId: mockUserId, type: 'access' },
        'wrong-secret'
      );
      
      expect(() => {
        verifyAccessToken(fakeToken);
      }).toThrow();
    });
  });

  describe('性能测试', () => {
    test('Token生成性能', () => {
      const iterations = 1000;
      const startTime = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        generateAccessToken(`${mockUserId}-${i}`, `${mockTelegramId}-${i}`);
      }
      
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // 转换为毫秒
      
      console.log(`Token生成性能: ${iterations}次操作耗时 ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(5000); // 应该在5秒内完成1000次生成
    });

    test('密码哈希性能', async () => {
      const iterations = 100;
      const testPassword = 'performance-test-password';
      const startTime = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        await hashPassword(testPassword);
      }
      
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      
      console.log(`密码哈希性能: ${iterations}次操作耗时 ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(10000); // 应该在10秒内完成
    });
  });
});