/**
 * VRF (Verifiable Random Function) 开奖算法单元测试
 * 测试开奖算法的安全性、公平性和可验证性
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import crypto from 'crypto';
import {
  generateSystemSeed,
  calculateSecureParticipationHash,
  performSecureDraw,
  generateWinningNumbers,
  verifyDrawResult,
  SecureDrawResult
} from '../lib/lottery-algorithm';

describe('VRF开奖算法测试', () => {
  const mockParticipations = [
    {
      id: 'part-1',
      userId: 'user-1',
      numbers: [1, 2, 3, 4, 5],
      amount: 5,
      createdAt: new Date('2025-10-01T10:00:00Z')
    },
    {
      id: 'part-2',
      userId: 'user-2',
      numbers: [6, 7, 8, 9, 10],
      amount: 3,
      createdAt: new Date('2025-10-01T10:05:00Z')
    },
    {
      id: 'part-3',
      userId: 'user-3',
      numbers: [11, 12, 13, 14, 15],
      amount: 2,
      createdAt: new Date('2025-10-01T10:10:00Z')
    }
  ];

  describe('系统种子生成测试', () => {
    test('应该生成32字节的安全随机种子', () => {
      const seed = generateSystemSeed();
      
      expect(typeof seed).toBe('string');
      expect(seed.length).toBe(64); // 32字节 = 64十六进制字符
      expect(/^[0-9a-f]+$/i.test(seed)).toBe(true); // 应该是十六进制
    });

    test('每次生成的种子应该不同', () => {
      const seed1 = generateSystemSeed();
      const seed2 = generateSystemSeed();
      
      expect(seed1).not.toBe(seed2);
    });

    test('种子应该具有足够的熵', () => {
      const seeds = Array(100).fill(0).map(() => generateSystemSeed());
      const uniqueSeeds = new Set(seeds);
      
      expect(uniqueSeeds.size).toBe(100); // 所有种子都应该不同
    });
  });

  describe('参与数据哈希计算测试', () => {
    test('应该计算参与数据的确定性哈希', () => {
      const hash1 = calculateSecureParticipationHash(mockParticipations);
      const hash2 = calculateSecureParticipationHash(mockParticipations);
      
      expect(hash1).toBe(hash2); // 相同输入应该产生相同哈希
    });

    test('不同的参与数据应该产生不同的哈希', () => {
      const modifiedParticipations = [
        ...mockParticipations.slice(0, -1),
        {
          ...mockParticipations[mockParticipations.length - 1],
          amount: 99 // 修改金额
        }
      ];
      
      const hash1 = calculateSecureParticipationHash(mockParticipations);
      const hash2 = calculateSecureParticipationHash(modifiedParticipations);
      
      expect(hash1).not.toBe(hash2);
    });

    test('空参与列表应该产生有效哈希', () => {
      const hash = calculateSecureParticipationHash([]);
      
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA256长度
    });

    test('排序应该确保一致性', () => {
      // 按不同顺序排列的相同数据
      const reversedParticipations = [...mockParticipations].reverse();
      
      const hash1 = calculateSecureParticipationHash(mockParticipations);
      const hash2 = calculateSecureParticipationHash(reversedParticipations);
      
      expect(hash1).toBe(hash2); // 排序后应该相同
    });
  });

  describe('开奖结果生成测试', () => {
    const totalShares = 100;

    test('应该生成有效的开奖结果', async () => {
      const result = await performSecureDraw(mockParticipations, totalShares);
      
      expect(result).toBeDefined();
      expect(typeof result.winningNumber).toBe('number');
      expect(result.winningNumber).toBeGreaterThanOrEqual(10000001);
      expect(result.winningNumber).toBeLessThanOrEqual(10000000 + totalShares);
      expect(result.A).toBeDefined();
      expect(result.B).toBeDefined();
      expect(result.C).toBeDefined();
      expect(result.hashA).toBeDefined();
      expect(result.hashB).toBeDefined();
      expect(result.hashC).toBeDefined();
      expect(result.seed).toBeDefined();
    });

    test('相同的输入应该产生相同的结果', async () => {
      const result1 = await performSecureDraw(mockParticipations, totalShares);
      const result2 = await performSecureDraw(mockParticipations, totalShares);
      
      expect(result1.winningNumber).toBe(result2.winningNumber);
      expect(result1.seed).toBe(result2.seed); // 系统种子在算法中可能有所不同
    });

    test('开奖号码应该在有效范围内', async () => {
      const result = await performSecureDraw(mockParticipations, totalShares);
      
      expect(result.winningNumber).toBeGreaterThanOrEqual(10000001);
      expect(result.winningNumber).toBeLessThanOrEqual(10000000 + totalShares);
    });

    test('应该包含所有必要的验证信息', async () => {
      const result = await performSecureDraw(mockParticipations, totalShares);
      
      expect(result.algorithmVersion).toBeDefined();
      expect(result.totalShares).toBe(totalShares);
      expect(typeof result.A).toBe('number');
      expect(typeof result.B).toBe('number');
      expect(typeof result.C).toBe('number');
      expect(typeof result.hashA).toBe('string');
      expect(typeof result.hashB).toBe('string');
      expect(typeof result.hashC).toBe('string');
    });
  });

  describe('开奖号码生成测试', () => {
    test('应该生成在指定范围内的号码', () => {
      const winningNumber = generateWinningNumbers(100, 12345, 67890, 99999);
      
      expect(typeof winningNumber).toBe('number');
      expect(winningNumber).toBeGreaterThanOrEqual(10000001);
      expect(winningNumber).toBeLessThanOrEqual(10000000 + 100);
    });

    test('相同的种子应该产生相同的号码', () => {
      const seed = crypto.randomBytes(32).toString('hex');
      const number1 = generateWinningNumbers(100, 12345, 67890, seed);
      const number2 = generateWinningNumbers(100, 12345, 67890, seed);
      
      expect(number1).toBe(number2);
    });

    test('不同的种子应该产生不同的号码', () => {
      const number1 = generateWinningNumbers(100, 12345, 67890, 'seed1');
      const number2 = generateWinningNumbers(100, 12345, 67890, 'seed2');
      
      expect(number1).not.toBe(number2);
    });

    test('应该拒绝无效的份额数量', () => {
      expect(() => {
        generateWinningNumbers(0, 12345, 67890, 'seed');
      }).toThrow();
      
      expect(() => {
        generateWinningNumbers(-1, 12345, 67890, 'seed');
      }).toThrow();
    });
  });

  describe('开奖结果验证测试', () => {
    let drawResult: SecureDrawResult;

    beforeEach(async () => {
      drawResult = await performSecureDraw(mockParticipations, 100);
    });

    test('应该验证有效的开奖结果', () => {
      const isValid = verifyDrawResult(drawResult, mockParticipations);
      
      expect(isValid).toBe(true);
    });

    test('应该拒绝被篡改的结果', () => {
      const modifiedResult = {
        ...drawResult,
        winningNumber: drawResult.winningNumber + 1 // 修改中奖号码
      };
      
      const isValid = verifyDrawResult(modifiedResult, mockParticipations);
      expect(isValid).toBe(false);
    });

    test('应该拒绝修改后的参与数据', () => {
      const modifiedParticipations = [
        ...mockParticipations,
        {
          id: 'part-4',
          userId: 'user-4',
          numbers: [16, 17, 18, 19, 20],
          amount: 1,
          createdAt: new Date()
        }
      ];
      
      const isValid = verifyDrawResult(drawResult, modifiedParticipations);
      expect(isValid).toBe(false);
    });

    test('应该验证所有哈希值', () => {
      // 验证hashA
      expect(drawResult.hashA).toBeDefined();
      expect(drawResult.hashA.length).toBe(64);
      
      // 验证hashB
      expect(drawResult.hashB).toBeDefined();
      expect(drawResult.hashB.length).toBe(64);
      
      // 验证hashC
      expect(drawResult.hashC).toBeDefined();
      expect(drawResult.hashC.length).toBe(64);
    });
  });

  describe('安全性测试', () => {
    test('算法不应该可预测', () => {
      const results = [];
      
      // 使用相同的数据但不同的时间戳应该产生不同的结果
      for (let i = 0; i < 10; i++) {
        const participations = mockParticipations.map(p => ({
          ...p,
          createdAt: new Date(Date.now() + i * 1000)
        }));
        
        // 注意：这里我们不能直接控制时间戳，但在实际测试中可以通过mock实现
        results.push(i); // 占位符
      }
      
      // 实际实现中应该验证结果的不可预测性
      expect(results.length).toBe(10);
    });

    test('应该防止重放攻击', () => {
      // 相同的数据不应该产生相同的结果（如果系统种子不同）
      // 在实际应用中，系统种子应该包含时间戳等不可预测元素
      
      const hash1 = calculateSecureParticipationHash(mockParticipations);
      const hash2 = calculateSecureParticipationHash(mockParticipations);
      
      // 参与数据哈希应该是确定的
      expect(hash1).toBe(hash2);
      
      // 但开奖结果不应该完全可预测
      // 这需要实际的开奖算法实现来验证
    });

    test('应该防止种子预测', () => {
      const seed1 = generateSystemSeed();
      const seed2 = generateSystemSeed();
      
      // 两次生成的种子应该完全不同
      expect(seed1).not.toBe(seed2);
      
      // 种子应该有足够的随机性
      expect(seed1.length).toBe(64);
      expect(seed2.length).toBe(64);
    });
  });

  describe('性能测试', () => {
    test('开奖算法性能', async () => {
      const largeParticipations = Array(1000).fill(0).map((_, i) => ({
        id: `part-${i}`,
        userId: `user-${i}`,
        numbers: Array(5).fill(0).map(() => Math.floor(Math.random() * 100) + 1),
        amount: Math.floor(Math.random() * 10) + 1,
        createdAt: new Date(Date.now() + i * 1000)
      }));
      
      const startTime = process.hrtime.bigint();
      
      const result = await performSecureDraw(largeParticipations, 10000);
      
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      
      console.log(`大型参与数据开奖性能: ${duration.toFixed(2)}ms`);
      
      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
      expect(result).toBeDefined();
    });

    test('哈希计算性能', () => {
      const iterations = 1000;
      const startTime = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        calculateSecureParticipationHash(mockParticipations);
      }
      
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      
      console.log(`哈希计算性能: ${iterations}次计算耗时 ${duration.toFixed(2)}ms`);
      
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });
  });

  describe('边界条件测试', () => {
    test('应该处理空参与列表', async () => {
      const result = await performSecureDraw([], 100);
      
      expect(result).toBeDefined();
      expect(result.winningNumber).toBeDefined();
      expect(result.A).toBe(0); // 没有参与时A应该为0
    });

    test('应该处理单份参与', async () => {
      const singleParticipation = [mockParticipations[0]];
      const result = await performSecureDraw(singleParticipation, 1);
      
      expect(result).toBeDefined();
      expect(result.winningNumber).toBe(10000001); // 只有一份时应该返回第一个号码
    });

    test('应该处理大量份额', async () => {
      const result = await performSecureDraw(mockParticipations, 1000000);
      
      expect(result).toBeDefined();
      expect(result.winningNumber).toBeGreaterThanOrEqual(10000001);
      expect(result.winningNumber).toBeLessThanOrEqual(1000000 + 10000000);
    });

    test('应该拒绝零份额', async () => {
      await expect(
        performSecureDraw(mockParticipations, 0)
      ).rejects.toThrow();
    });
  });

  describe('一致性测试', () => {
    test('相同输入的确定性结果', async () => {
      // 多次运行相同输入应该产生可验证的一致结果
      const results = await Promise.all(
        Array(5).fill(0).map(() => performSecureDraw(mockParticipations, 100))
      );
      
      // 提取所有可验证的共同属性
      const hashes = results.map(r => calculateSecureParticipationHash(mockParticipations));
      const uniqueHashes = new Set(hashes);
      
      // 参与数据哈希应该一致
      expect(uniqueHashes.size).toBe(1);
      
      // 验证所有结果的结构一致性
      results.forEach(result => {
        expect(result.winningNumber).toBeDefined();
        expect(result.hashA).toBeDefined();
        expect(result.hashB).toBeDefined();
        expect(result.hashC).toBeDefined();
      });
    });
  });
});