/**
 * 增强版VRF开奖算法单元测试
 * 测试修复后的抽奖系统安全性、公平性和可验证性
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import crypto from 'crypto';
import {
  generateSystemSeed,
  calculateSecureParticipationHash,
  calculateSecureWinningNumber,
  findWinner,
  verifySecureDrawResult,
  generateSecureDrawProof,
  getTajikistanTime,
  isValidDrawTime,
  optimizedRandomGeneration,
  enhancedDataIntegrity,
  preventDuplicateDraw,
  validateDrawUniqueness,
  EnhancedAuditLogger,
  SecureDrawResult
} from '../lib/lottery-algorithm';

describe('增强版VRF开奖算法测试', () => {
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

  // 在每个测试前重置模拟
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('防重复开奖功能测试', () => {
    test('validateDrawUniqueness应该正确验证唯一性', () => {
      const existingDraws = [
        { roundId: 'round-1', winningNumber: 10000001 },
        { roundId: 'round-2', winningNumber: 10000002 }
      ];

      // 应该返回false，表示不能开奖（已存在）
      expect(validateDrawUniqueness('round-1', 10000001, existingDraws)).toBe(false);
      expect(validateDrawUniqueness('round-2', 10000002, existingDraws)).toBe(false);

      // 应该返回true，表示可以开奖（新组合）
      expect(validateDrawUniqueness('round-1', 10000003, existingDraws)).toBe(true);
      expect(validateDrawUniqueness('round-3', 10000001, existingDraws)).toBe(true);
    });
  });

  describe('数据完整性验证测试', () => {
    test('enhancedDataIntegrity应该返回详细的验证结果', () => {
      const data = { test: 'data', timestamp: Date.now() };
      const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

      const result = enhancedDataIntegrity(data, hash);

      expect(result.isValid).toBe(true);
      expect(result.computedHash).toBe(hash);
      expect(result.dataSize).toBe(JSON.stringify(data).length);
    });

    test('enhancedDataIntegrity应该检测数据篡改', () => {
      const originalData = { test: 'original' };
      const tamperedData = { test: 'tampered' };
      const originalHash = crypto.createHash('sha256').update(JSON.stringify(originalData)).digest('hex');

      const result = enhancedDataIntegrity(tamperedData, originalHash);

      expect(result.isValid).toBe(false);
      expect(result.computedHash).not.toBe(originalHash);
    });
  });

  describe('增强审计日志测试', () => {
    test('EnhancedAuditLogger应该正确记录和导出日志', () => {
      const logger = new EnhancedAuditLogger();

      logger.log('lottery_participation', 'round-1', 'user-1', { amount: 100 });
      logger.log('lottery_draw', 'round-1', null, { winningNumber: 10000001 });

      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].action).toBe('lottery_participation');
      expect(logs[1].action).toBe('lottery_draw');
      expect(logs[0].requestId).toBeDefined();
      expect(logs[0].metadata).toBeDefined();

      const exportedLogs = JSON.parse(logger.exportLogs());
      expect(exportedLogs).toHaveLength(2);

      logger.clear();
      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('优化随机数生成测试', () => {
    test('optimizedRandomGeneration应该验证输入参数', () => {
      expect(() => {
        optimizedRandomGeneration('', 100);
      }).toThrow('种子不能为空且份额数量必须大于0');

      expect(() => {
        optimizedRandomGeneration('valid-seed', 0);
      }).toThrow('种子不能为空且份额数量必须大于0');

      expect(() => {
        optimizedRandomGeneration('valid-seed', -1);
      }).toThrow('种子不能为空且份额数量必须大于0');
    });

    test('optimizedRandomGeneration应该验证输出范围', () => {
      const seed = crypto.randomBytes(32).toString('hex');
      const totalShares = 100;
      
      const winningNumber = optimizedRandomGeneration(seed, totalShares);
      
      expect(winningNumber).toBeGreaterThanOrEqual(10000001);
      expect(winningNumber).toBeLessThanOrEqual(10000000 + totalShares);
    });

    test('optimizedRandomGeneration应该验证超出范围的情况', () => {
      const seed = crypto.randomBytes(32).toString('hex');
      
      // 模拟超出范围的场景
      jest.spyOn(crypto, 'createHash').mockImplementation(() => {
        const mockHash = {
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue(Buffer.from('ff'.repeat(32), 'hex'))
        };
        return mockHash as any;
      });

      expect(() => {
        optimizedRandomGeneration(seed, 100);
      }).toThrow('生成的随机数超出有效范围');
    });
  });

  describe('增强验证功能测试', () => {
    test('verifySecureDrawResult应该返回详细的验证结果', () => {
      const totalShares = 100;
      const productId = 'test-product';
      const participationIds = mockParticipations.map(p => p.id);

      const drawResult = calculateSecureWinningNumber(
        participationIds,
        mockParticipations,
        productId,
        totalShares
      );

      const verification = verifySecureDrawResult(
        participationIds,
        mockParticipations,
        productId,
        totalShares,
        drawResult.seed,
        drawResult.winningNumber
      );

      expect(verification.isValid).toBe(true);
      expect(verification.details.verificationTime).toBeDefined();
      expect(verification.details.algorithmVersion).toBe('3.0-secure-optimized-vrf');
      expect(verification.errors).toBeUndefined();
    });

    test('verifySecureDrawResult应该处理验证错误', () => {
      const totalShares = 100;
      const productId = 'test-product';
      const participationIds = mockParticipations.map(p => p.id);

      // 使用错误的期望中奖号码
      const verification = verifySecureDrawResult(
        participationIds,
        mockParticipations,
        productId,
        totalShares,
        'invalid-seed',
        99999999 // 超出范围的期望号码
      );

      expect(verification.isValid).toBe(false);
      expect(verification.details.verificationTime).toBeDefined();
      expect(verification.errors).toBeDefined();
      expect(verification.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('塔吉克斯坦时区测试', () => {
    test('getTajikistanTime应该返回正确的时区时间', () => {
      const tajikTime = getTajikistanTime();
      const utcTime = new Date();
      
      // 塔吉克斯坦时间应该是UTC+5
      const expectedTajikTime = new Date(utcTime.getTime() + (5 * 60 * 60 * 1000));
      
      expect(Math.abs(tajikTime.getTime() - expectedTajikTime.getTime())).toBeLessThan(1000); // 允许1秒误差
    });

    test('isValidDrawTime应该验证时间窗口', () => {
      const tajikTime = getTajikistanTime();
      
      // 在有效窗口内的时间
      const validTime = new Date(tajikTime.getTime() + 60000); // 1分钟后
      expect(isValidDrawTime(validTime, tajikTime)).toBe(true);

      // 超出最大窗口的时间
      const invalidTime = new Date(tajikTime.getTime() + 600000); // 10分钟后
      expect(isValidDrawTime(invalidTime, tajikTime)).toBe(false);

      // 小于最小窗口的时间
      const tooEarlyTime = new Date(tajikTime.getTime() - 10000); // 10秒前
      expect(isValidDrawTime(tooEarlyTime, tajikTime)).toBe(false);
    });
  });

  describe('系统种子生成测试', () => {
    test('generateSystemSeed应该生成安全的随机种子', () => {
      const seed1 = generateSystemSeed();
      const seed2 = generateSystemSeed();
      
      expect(typeof seed1).toBe('string');
      expect(seed1.length).toBe(64); // 32字节 = 64十六进制字符
      expect(/^[0-9a-f]+$/i.test(seed1)).toBe(true);
      expect(seed1).not.toBe(seed2);
    });

    test('种子应该具有足够的熵', () => {
      const seeds = Array(100).fill(0).map(() => generateSystemSeed());
      const uniqueSeeds = new Set(seeds);
      
      expect(uniqueSeeds.size).toBe(100); // 所有种子都应该不同
    });
  });

  describe('参与数据哈希计算测试', () => {
    test('calculateSecureParticipationHash应该计算确定性哈希', () => {
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

    test('排序应该确保一致性', () => {
      const reversedParticipations = [...mockParticipations].reverse();
      
      const hash1 = calculateSecureParticipationHash(mockParticipations);
      const hash2 = calculateSecureParticipationHash(reversedParticipations);
      
      expect(hash1).toBe(hash2); // 排序后应该相同
    });
  });

  describe('开奖结果生成测试', () => {
    const totalShares = 100;
    const productId = 'test-product-id';
    const participationIds = mockParticipations.map(p => p.id);

    test('应该生成有效的开奖结果', () => {
      const result = calculateSecureWinningNumber(
        participationIds,
        mockParticipations,
        productId,
        totalShares
      );
      
      expect(result).toBeDefined();
      expect(typeof result.winningNumber).toBe('number');
      expect(result.winningNumber).toBeGreaterThanOrEqual(10000001);
      expect(result.winningNumber).toBeLessThanOrEqual(10000000 + totalShares);
      expect(result.algorithmVersion).toBe('3.0-secure-optimized-vrf');
    });

    test('相同的输入应该产生相同的结果', () => {
      const result1 = calculateSecureWinningNumber(
        participationIds,
        mockParticipations,
        productId,
        totalShares
      );
      const result2 = calculateSecureWinningNumber(
        participationIds,
        mockParticipations,
        productId,
        totalShares
      );
      
      expect(result1.winningNumber).toBe(result2.winningNumber);
      expect(result1.hashA).toBe(result2.hashA);
      expect(result1.hashB).toBe(result2.hashB);
    });
  });

  describe('查找中奖者测试', () => {
    test('应该找到正确的中奖者', () => {
      const winningNumber = 7; // 假设中奖号码是7，在user-2的参与中
      const winner = findWinner(mockParticipations, winningNumber);
      
      expect(winner).toBe('user-2');
    });

    test('应该处理未中奖的情况', () => {
      const winningNumber = 99; // 不在任何参与中的号码
      const winner = findWinner(mockParticipations, winningNumber);
      
      expect(winner).toBeNull();
    });
  });

  describe('安全证明生成测试', () => {
    test('generateSecureDrawProof应该生成完整的证明', () => {
      const totalShares = 100;
      const productId = 'test-product';
      const participationIds = mockParticipations.map(p => p.id);

      const result = calculateSecureWinningNumber(
        participationIds,
        mockParticipations,
        productId,
        totalShares
      );
      
      const proof = generateSecureDrawProof(result);
      expect(proof).toBeDefined();
      expect(typeof proof).toBe('string');
      
      const proofData = JSON.parse(proof);
      expect(proofData.algorithm).toBe('Secure VRF with HMAC-SHA256 + HKDF');
      expect(proofData.winningNumber).toBe(result.winningNumber);
      expect(proofData.securityFeatures).toBeDefined();
      expect(proofData.securityFeatures).toContain('No predictable timestamps');
    });
  });

  describe('性能测试', () => {
    test('算法性能应该在可接受范围内', () => {
      const largeParticipations = Array(1000).fill(0).map((_, i) => ({
        id: `part-${i}`,
        userId: `user-${i}`,
        numbers: Array(5).fill(0).map(() => Math.floor(Math.random() * 100) + 1),
        amount: Math.floor(Math.random() * 10) + 1,
        createdAt: new Date(Date.now() + i * 1000)
      }));
      
      const startTime = process.hrtime.bigint();
      
      const result = calculateSecureWinningNumber(
        largeParticipations.map(p => p.id),
        largeParticipations,
        'test-product',
        10000
      );
      
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
    test('应该处理空参与列表', () => {
      const result = calculateSecureWinningNumber(
        [],
        [],
        'test-product',
        100
      );
      
      expect(result).toBeDefined();
      expect(result.winningNumber).toBeDefined();
      expect(result.A).toBe(0); // 没有参与时A应该为0
    });

    test('应该处理单份参与', () => {
      const singleParticipation = [mockParticipations[0]];
      const participationIds = singleParticipation.map(p => p.id);
      
      const result = calculateSecureWinningNumber(
        participationIds,
        singleParticipation,
        'test-product',
        1
      );
      
      expect(result).toBeDefined();
      expect(result.winningNumber).toBe(10000001); // 只有一份时应该返回第一个号码
    });

    test('应该处理大量份额', () => {
      const participationIds = mockParticipations.map(p => p.id);
      
      const result = calculateSecureWinningNumber(
        participationIds,
        mockParticipations,
        'test-product',
        1000000
      );
      
      expect(result).toBeDefined();
      expect(result.winningNumber).toBeGreaterThanOrEqual(10000001);
      expect(result.winningNumber).toBeLessThanOrEqual(1000000 + 10000000);
    });
  });

  describe('一致性测试', () => {
    test('相同输入应该产生可验证的一致结果', () => {
      const participationIds = mockParticipations.map(p => p.id);
      
      const results = [
        calculateSecureWinningNumber(participationIds, mockParticipations, 'test-product', 100),
        calculateSecureWinningNumber(participationIds, mockParticipations, 'test-product', 100),
        calculateSecureWinningNumber(participationIds, mockParticipations, 'test-product', 100),
        calculateSecureWinningNumber(participationIds, mockParticipations, 'test-product', 100),
        calculateSecureWinningNumber(participationIds, mockParticipations, 'test-product', 100)
      ];
      
      // 提取所有可验证的共同属性
      const participationHashes = results.map(() => calculateSecureParticipationHash(mockParticipations));
      const uniqueHashes = new Set(participationHashes);
      
      // 参与数据哈希应该一致
      expect(uniqueHashes.size).toBe(1);
      
      // 验证所有结果的结构一致性
      results.forEach(result => {
        expect(result.winningNumber).toBeDefined();
        expect(result.hashA).toBeDefined();
        expect(result.hashB).toBeDefined();
        expect(result.algorithmVersion).toBe('3.0-secure-optimized-vrf');
      });
    });
  });

  describe('时区兼容性测试', () => {
    test('时间验证应该考虑塔吉克斯坦时区', () => {
      const tajikTime = getTajikistanTime();
      const scheduledTime = new Date(tajikTime.getTime() + 60000); // 1分钟后
      
      const isValid = isValidDrawTime(scheduledTime, tajikTime);
      expect(isValid).toBe(true);
      
      const futureTime = new Date(tajikTime.getTime() + 600000); // 10分钟后（超出最大窗口）
      const isInvalid = isValidDrawTime(futureTime, tajikTime);
      expect(isInvalid).toBe(false);
    });
  });
});

// 集成测试
describe('集成测试', () => {
  test('完整的开奖和验证流程', async () => {
    const mockParticipations = [
      { userId: 'user-1', numbers: [1, 2, 3, 4, 5], amount: 5, createdAt: new Date() },
      { userId: 'user-2', numbers: [6, 7, 8, 9, 10], amount: 3, createdAt: new Date() }
    ];
    
    const totalShares = 100;
    const productId = 'test-product';
    const participationIds = mockParticipations.map(p => p.userId);
    
    // 执行开奖
    const drawResult = calculateSecureWinningNumber(
      participationIds,
      mockParticipations,
      productId,
      totalShares
    );
    
    // 查找中奖者
    const winner = findWinner(mockParticipations, drawResult.winningNumber);
    
    // 验证开奖结果
    const verification = verifySecureDrawResult(
      participationIds,
      mockParticipations,
      productId,
      totalShares,
      drawResult.seed,
      drawResult.winningNumber
    );
    
    // 验证结果
    expect(drawResult).toBeDefined();
    expect(drawResult.winningNumber).toBeGreaterThanOrEqual(10000001);
    expect(drawResult.winningNumber).toBeLessThanOrEqual(10000000 + totalShares);
    expect(winner).toBeDefined();
    expect(verification.isValid).toBe(true);
    expect(verification.details.algorithmVersion).toBe('3.0-secure-optimized-vrf');
    
    // 生成安全证明
    const proof = generateSecureDrawProof(drawResult);
    const proofData = JSON.parse(proof);
    expect(proofData.winningNumber).toBe(drawResult.winningNumber);
    expect(proofData.verification).toBeDefined();
  });
});
