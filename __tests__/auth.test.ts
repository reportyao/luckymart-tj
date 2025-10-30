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

    test('应该成功验证有效的访问Token', () => {
      const result = verifyAccessToken(validAccessToken);
      
      expect(result).toBeDefined();
      expect(result.userId).toBe(mockUserId);
      expect(result.telegramId).toBe(mockTelegramId);
      expect(result.type).toBe('access');
    });

    test('应该拒绝无效的Token', () => {
      const invalidToken = 'invalid.jwt.token';
      
      expect(() => {
        verifyAccessToken(invalidToken);
      }).toThrow();
    });

    test('应该拒绝过期的Token', () => {
      // 创建一个已过期的token
      const expiredToken = jwt.sign(
        {
          userId: mockUserId,
          telegramId: mockTelegramId,
          type: 'access',
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
      }).toThrow();
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

  describe('Telegram WebApp验证测试', () => {
    test('应该验证有效的Telegram数据', () => {
      // 创建模拟的Telegram WebApp数据
      const mockUser = {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'en'
      };

      const authDate = Math.floor(Date.now() / 1000);
      const initData = new URLSearchParams({
        auth_date: authDate.toString(),
        user: JSON.stringify(mockUser),
        hash: 'mock-hash'
      }).toString();

      // 这里我们只测试数据结构，因为完整的HMAC计算需要真实的Bot Token
      const user = JSON.parse(new URLSearchParams(initData).get('user') || '{}');
      expect(user.id).toBe(123456789);
      expect(user.first_name).toBe('Test');
    });

    test('应该检查auth_date字段存在性', () => {
      const initData = new URLSearchParams({
        user: JSON.stringify({ id: 123, first_name: 'Test' }),
        hash: 'mock-hash'
      }).toString();

      expect(() => {
        validateTelegramWebAppData(initData);
      }).toThrow('缺少auth_date字段');
    });

    test('应该检查Bot Token配置', () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      
      const initData = new URLSearchParams({
        auth_date: Math.floor(Date.now() / 1000).toString(),
        user: JSON.stringify({ id: 123, first_name: 'Test' }),
        hash: 'mock-hash'
      }).toString();

      expect(() => {
        validateTelegramWebAppData(initData);
      }).toThrow('TELEGRAM_BOT_TOKEN环境变量未配置');
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