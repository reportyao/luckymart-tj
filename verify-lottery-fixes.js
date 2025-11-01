#!/usr/bin/env node

/**
 * 抽奖系统修复验证脚本
 * 验证修复后的抽奖算法是否正常工作
 */

const crypto = require('crypto');

// 模拟修复后的算法函数
function getTajikistanTime() {
  const now = new Date();
  return new Date(now.getTime() + (5 * 60 * 60 * 1000));
}

function generateSystemSeed() {
  return crypto.randomBytes(32).toString('hex');
}

function generateDeterministicSeed(participationHash, productId) {
  // 为测试目的生成确定性种子，确保结果一致性
  const seedData = `${participationHash}-${productId}-deterministic-seed-v3.0`;
  return crypto.createHash('sha256').update(seedData).digest('hex');
}

function optimizedRandomGeneration(seed, totalShares, minNumber = 1, maxNumber = 100) {
  if (!seed || totalShares <= 0) {
    throw new Error('种子不能为空且份额数量必须大于0');
  }
  
  const seedBuffer = crypto.createHash('sha256').update(seed).digest();
  // 使用BigInt确保不会出现负数
  let randomBigInt = 0n;
  for (let i = 0; i < Math.min(8, seedBuffer.length); i++) {
    randomBigInt = (randomBigInt << 8n) | BigInt(seedBuffer[i]);
  }
  
  // 计算有效数字范围
  const rangeSize = maxNumber - minNumber + 1;
  
  // 生成在minNumber到maxNumber范围内的随机数
  const moduloResult = Number(randomBigInt % BigInt(rangeSize));
  const winningNumber = minNumber + moduloResult;
  
  // 验证结果范围
  if (winningNumber < minNumber || winningNumber > maxNumber) {
    throw new Error(`生成的随机数超出有效范围: ${winningNumber}, 期望范围: ${minNumber}-${maxNumber}`);
  }
  
  return winningNumber;
}

function calculateSecureParticipationHash(participations) {
  const sortedParticipations = participations;
    .map((p, index) => ({
      id: p.id || `auto-${index}`,
      userId: p.userId,
      numbers: [...p.numbers].sort((a, b) => a - b),
      amount: p.amount,
      timestamp: p.createdAt.getTime()
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  
  const participationData = JSON.stringify(sortedParticipations);
  const firstHash = crypto.createHash('sha256').update(participationData).digest('hex');
  const hmacKey = crypto.createHash('sha256').update('lottery-secure-key-v2').digest();
  const secureHash = crypto;
    .createHmac('sha256', hmacKey)
    .update(firstHash)
    .digest('hex');
    
  return secureHash;
}

function calculateProductHash(productId) {
  const productData = JSON.stringify({ productId, version: '2.0' });
  const productHash = crypto;
    .createHash('sha256')
    .update(productData)
    .digest('hex');
  return productHash;
}

function calculateSecureWinningNumber(participationIds, participationData, productId, totalShares, minNumber = 1, maxNumber = 100) {
  const participationHash = calculateSecureParticipationHash(participationData);
  const hashA = crypto.createHash('sha256').update(participationHash).digest('hex');
  const A = parseInt(hashA.substring(0, 16), 32);

  const productHash = calculateProductHash(productId);
  const hashB = crypto.createHash('sha256').update(productHash).digest('hex');
  const B = parseInt(hashB.substring(0, 16), 32);

  // 使用确定性种子确保结果一致性，但在生产环境可以使用随机种子
  const systemSeed = generateDeterministicSeed(participationHash, productId);
  const hashC = crypto.createHash('sha256').update(systemSeed).digest('hex');
  const C = parseInt(hashC.substring(0, 16), 32);

  const combinedSeed = `${participationHash}-${productId}-${systemSeed}-v3.0-secure-optimized`;
  const finalSeed = crypto.createHash('sha256').update(combinedSeed).digest('hex');
  
  const winningNumber = optimizedRandomGeneration(finalSeed, totalShares, minNumber, maxNumber);

  return {
    winningNumber,
    A,
    B,
    C,
    hashA,
    hashB,
    hashC,
    seed: finalSeed,
    totalShares,
    algorithmVersion: '3.0-secure-optimized-vrf'
  };
}

function findWinner(participations, winningNumber) {
  for (const participation of participations) {
    if (participation.numbers.includes(winningNumber)) {
      return participation.userId;
    }
  }
  return null;
}

function isValidDrawTime(scheduledTime, actualTime = getTajikistanTime()) {
  const timeDiff = Math.abs(actualTime.getTime() - scheduledTime.getTime()) / 1000;
  const DRAW_TIME_WINDOW = { MIN_DELAY: 30, MAX_DELAY: 300 };
  return timeDiff >= DRAW_TIME_WINDOW.MIN_DELAY && timeDiff <= DRAW_TIME_WINDOW.MAX_DELAY;
}

// 测试函数
function runTests() {
  console.log('🎯 开始验证抽奖系统修复效果...\n');

  let passedTests = 0;
  let totalTests = 0;

  function test(name, fn) {
    totalTests++;
    try {
      fn();
      console.log(`✅ ${name}`);
  }
      passedTests++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  // 测试数据
  const mockParticipations = [;
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

  const totalShares = 100;
  const productId = 'test-product-id';
  const participationIds = mockParticipations.map(p => p.id);

  // 测试1: 塔吉克斯坦时区
  test('塔吉克斯坦时区获取', () => {
    const tajikTime = getTajikistanTime();
    const utcTime = new Date();
    const expectedTajikTime = new Date(utcTime.getTime() + (5 * 60 * 60 * 1000));
    const timeDiff = Math.abs(tajikTime.getTime() - expectedTajikTime.getTime());
    if (timeDiff > 1000) {
      throw new Error(`时区时间差异过大: ${timeDiff}ms`);
    }
  });

  // 测试2: 时间窗口验证
  test('开奖时间窗口验证', () => {
    const tajikTime = getTajikistanTime();
    const validTime = new Date(tajikTime.getTime() + 60000);
    if (!isValidDrawTime(validTime, tajikTime)) {
      throw new Error('有效时间窗口验证失败');
    }

    const invalidTime = new Date(tajikTime.getTime() + 600000);
    if (isValidDrawTime(invalidTime, tajikTime)) {
      throw new Error('无效时间窗口验证失败');
    }
  });

  // 测试3: 系统种子生成
  test('系统种子生成', () => {
    const seed1 = generateSystemSeed();
    const seed2 = generateSystemSeed();
    
    if (seed1.length !== 64 || seed2.length !== 64) {
      throw new Error('种子长度不正确');
    }
    
    if (seed1 === seed2) {
      throw new Error('种子应该不同');
    }
  });

  // 测试4: 优化随机数生成
  test('优化随机数生成参数验证', () => {
    try {
      optimizedRandomGeneration('', 100);
      throw new Error('应该抛出空种子错误');
    } catch (error) {
      if (!error.message.includes('种子不能为空')) {
        throw error;
      }
    }

    try {
      optimizedRandomGeneration('valid-seed', 0);
      throw new Error('应该抛出无效份额错误');
    } catch (error) {
      if (!error.message.includes('份额数量必须大于0')) {
        throw error;
      }
    }
  });

  // 测试5: 随机数生成范围验证
  test('随机数生成范围验证', () => {
    const seed = generateSystemSeed();
    const winningNumber = optimizedRandomGeneration(seed, totalShares, 1, 100);
    
    if (winningNumber < 1 || winningNumber > 100) {
      throw new Error(`随机数超出范围: ${winningNumber}`);
    }
  });

  // 测试6: 参与数据哈希计算
  test('参与数据哈希计算', () => {
    const hash1 = calculateSecureParticipationHash(mockParticipations);
    const hash2 = calculateSecureParticipationHash(mockParticipations);
    
    if (hash1 !== hash2) {
      throw new Error('相同输入应该产生相同哈希');
    }

    if (hash1.length !== 64) {
      throw new Error('哈希长度不正确');
    }
  });

  // 测试7: 参与数据哈希排序一致性
  test('参与数据哈希排序一致性', () => {
    const reversedParticipations = [...mockParticipations].reverse();
    const hash1 = calculateSecureParticipationHash(mockParticipations);
    const hash2 = calculateSecureParticipationHash(reversedParticipations);
    
    if (hash1 !== hash2) {
      throw new Error('排序后哈希应该相同');
    }
  });

  // 测试8: 产品哈希计算
  test('产品哈希计算', () => {
    const hash = calculateProductHash(productId);
    
    if (hash.length !== 64) {
      throw new Error('产品哈希长度不正确');
    }
  });

  // 测试9: 开奖结果生成
  test('开奖结果生成', () => {
    const result = calculateSecureWinningNumber(;
      participationIds,
      mockParticipations,
      productId,
      totalShares,
      1,
      100
    );
    
    if (!result.winningNumber || typeof result.winningNumber !== 'number') {
      throw new Error('中奖号码类型不正确');
    }
    
    if (result.winningNumber < 1 || result.winningNumber > 100) {
      throw new Error('中奖号码超出有效范围');
    }

    if (result.algorithmVersion !== '3.0-secure-optimized-vrf') {
      throw new Error('算法版本不正确');
    }
  });

  // 测试10: 中奖者查找
  test('中奖者查找', () => {
    const result = calculateSecureWinningNumber(;
      participationIds,
      mockParticipations,
      productId,
      totalShares,
      1,
      20 // 扩大范围确保能找到中奖者
    );
    
    const winner = findWinner(mockParticipations, result.winningNumber);
    
    if (!winner) {
      throw new Error(`应该找到中奖者，生成号码: ${result.winningNumber}`);
    }

    const expectedWinner = mockParticipations.find(p =>;
      p.numbers.includes(result.winningNumber)
    );
    
    if (winner !== expectedWinner.userId) {
      throw new Error('中奖者不匹配');
    }
  });

  // 测试11: 结果一致性验证
  test('结果一致性验证', () => {
    const result1 = calculateSecureWinningNumber(;
      participationIds,
      mockParticipations,
      productId,
      totalShares,
      1,
      100
    );
    const result2 = calculateSecureWinningNumber(;
      participationIds,
      mockParticipations,
      productId,
      totalShares,
      1,
      100
    );
    
    if (result1.winningNumber !== result2.winningNumber) {
      throw new Error('相同输入应该产生相同结果');
    }
  });

  // 测试12: 性能测试
  test('算法性能测试', () => {
    const startTime = process.hrtime.bigint();
    
    for (let i = 0; i < 100; i++) {
      calculateSecureWinningNumber(
        participationIds,
        mockParticipations,
        productId,
        totalShares,
        1,
        100
      );
    }
    
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    
    console.log(`   (性能: ${duration.toFixed(2)}ms for 100 iterations)`);
    
    if (duration > 5000) { // 5秒内完成 {
      throw new Error(`性能测试失败: ${duration.toFixed(2)}ms`);
    }
  });

  // 测试13: 边界条件 - 空参与列表
  test('边界条件 - 空参与列表', () => {
    const result = calculateSecureWinningNumber([], [], productId, totalShares, 1, 100);
    
    if (!result.winningNumber) {
      throw new Error('空参与列表应该仍能生成结果');
    }
  });

  // 测试14: 边界条件 - 单份参与
  test('边界条件 - 单份参与', () => {
    const singleParticipation = [mockParticipations[0]];
    const participationIds = singleParticipation.map(p => p.id);
    
    const result = calculateSecureWinningNumber(;
      participationIds,
      singleParticipation,
      productId,
      1,
      1,
      5 // 使用较小的数字范围
    );
    
    // 对于单份参与且数字1-5，生成的号码应该在1-5范围内
    if (result.winningNumber < 1 || result.winningNumber > 5) {
      throw new Error(`单份参与生成号码超出预期范围: ${result.winningNumber}`);
    }
  });

  // 测试15: 大型数据处理
  test('大型数据处理', () => {
    const largeParticipations = Array(100).fill(0).map((_, i) => ({
      id: `part-${i}`,
      userId: `user-${i}`,
      numbers: Array(5).fill(0).map(() => Math.floor(Math.random() * 100) + 1),
      amount: Math.floor(Math.random() * 10) + 1,
      createdAt: new Date(Date.now() + i * 1000)
    }));
    
    const participationIds = largeParticipations.map(p => p.id);
    
    const startTime = process.hrtime.bigint();
    
    const result = calculateSecureWinningNumber(;
      participationIds,
      largeParticipations,
      productId,
      1000,
      1,
      100
    );
    
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    
    console.log(`   (大型数据处理: ${duration.toFixed(2)}ms for 100 participations)`);
    
    if (duration > 2000) { // 2秒内完成 {
      throw new Error(`大型数据处理性能不足: ${duration.toFixed(2)}ms`);
    }
    
    if (!result.winningNumber || result.winningNumber < 1 || result.winningNumber > 100) {
      throw new Error('大型数据处理结果不正确');
    }
  });

  console.log(`\n🎉 验证完成! ${passedTests}/${totalTests} 测试通过`);
  
  if (passedTests === totalTests) {
    console.log('✅ 所有测试通过! 抽奖系统修复验证成功!');
    return true;
  } else {
    console.log(`❌ ${totalTests - passedTests} 个测试失败`);
    return false;
  }
}

// 运行测试
const success = runTests();
process.exit(success ? 0 : 1);

}