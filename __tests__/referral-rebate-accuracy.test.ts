import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { TestDataGenerator, testConfig } from './test-config';
/**
 * 推荐返利计算精度测试
 * 确保小数点后1位精度的准确性和边界条件测试
 */


describe('推荐返利计算精度测试', () => {
  let prisma: PrismaClient;
  let testDataGenerator: TestDataGenerator;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testConfig.database.url
        }
      }
    });
    testDataGenerator = new TestDataGenerator(prisma);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 清理测试数据
    await prisma.rewardTransactions.deleteMany({
      where: { description: { startsWith: 'precision-test' } }
    });
    await prisma.referralRelationships.deleteMany({
      where: { referrerUserId: { startsWith: 'precision-test-' } }
    });
    await prisma.users.deleteMany({
      where: { id: { startsWith: 'precision-test-' } }
    });
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // 清理测试数据
    await prisma.rewardTransactions.deleteMany({
      where: { description: { startsWith: 'precision-test' } }
    });
    await prisma.referralRelationships.deleteMany({
      where: { referrerUserId: { startsWith: 'precision-test-' } }
    });
    await prisma.users.deleteMany({
      where: { id: { startsWith: 'precision-test-' } }
    });
  });

  describe('小数点精度测试', () => {
    test('精确到小数点后1位的计算', async () => {
      const testCases = [;
        { amount: 100.0, rate: 0.05, expected: 5.0 },
        { amount: 123.4, rate: 0.08, expected: 9.9 },
        { amount: 99.99, rate: 0.03, expected: 3.0 },
        { amount: 456.7, rate: 0.12, expected: 54.8 },
        { amount: 1000.0, rate: 0.001, expected: 1.0 },
      ];

      for (const testCase of testCases) {
        const actual = Number((testCase.amount * testCase.rate).toFixed(1));
        expect(actual).toBe(testCase.expected);
        
        console.log(`${testCase.amount} × ${testCase.rate} = ${actual} (期望: ${testCase.expected})`);
      }
    });

    test('边界值精度测试', async () => {
      const boundaryCases = [;
        { amount: 0.01, rate: 0.5, expected: 0.0 }, // 0.005 -> 0.0
        { amount: 0.02, rate: 0.5, expected: 0.0 }, // 0.01 -> 0.0
        { amount: 0.03, rate: 0.5, expected: 0.0 }, // 0.015 -> 0.0
        { amount: 0.04, rate: 0.5, expected: 0.0 }, // 0.02 -> 0.0
        { amount: 0.05, rate: 0.5, expected: 0.1 }, // 0.025 -> 0.1
        { amount: 0.09, rate: 0.5, expected: 0.0 }, // 0.045 -> 0.0
        { amount: 0.1, rate: 0.5, expected: 0.1 }, // 0.05 -> 0.1
      ];

      for (const testCase of boundaryCases) {
        const actual = Number((testCase.amount * testCase.rate).toFixed(1));
        expect(actual).toBe(testCase.expected);
        
        console.log(`边界值: ${testCase.amount} × ${testCase.rate} = ${actual} (期望: ${testCase.expected})`);
      }
    });

    test('累积精度误差测试', async () => {
      const smallAmount = 0.1;
      const rate = 0.1;
      let total = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const reward = Number((smallAmount * rate).toFixed(1));
        total += reward;
      }

      // 期望值: 0.1 × 0.1 × 100 = 1.0
      const expected = 1.0;
      expect(total).toBe(expected);

      console.log(`${smallAmount} × ${rate} × ${iterations} = ${total} (期望: ${expected})`);
    });
  });

  describe('返利计算函数测试', () => {
    /**
     * 模拟返利计算函数
     */
    function calculateRebate(amount: number, rate: number): number {
      // 确保精度: 先转换为分，再计算
      const amountInCents = Math.round(amount * 100);
      const rateInBps = Math.round(rate * 10000); // basis points;
      const rebateInCents = Math.round((amountInCents * rateInBps) / 10000);
      return Number((rebateInCents / 100).toFixed(1));
    }

    test('高精度返利计算', async () => {
      const testCases = [;
        { amount: 100.0, rate: 0.05, description: '基准测试' },
        { amount: 123.45, rate: 0.075, description: '多位小数' },
        { amount: 999.99, rate: 0.001, description: '最小返利比例' },
        { amount: 50.0, rate: 0.15, description: '较大返利比例' },
        { amount: 888.88, rate: 0.066, description: '复杂比例' },
      ];

      for (const testCase of testCases) {
        const rebate = calculateRebate(testCase.amount, testCase.rate);
        const expectedRebate = Number((testCase.amount * testCase.rate).toFixed(1));
        
        expect(rebate).toBe(expectedRebate);
        expect(typeof rebate).toBe('number');
        expect(rebate >= 0).toBe(true);

        console.log(`${testCase.description}: ${testCase.amount} × ${testCase.rate} = ${rebate}`);
      }
    });

    test('数据库存储精度验证', async () => {
      const userId = 'precision-test-user-1';
      const referrerId = 'precision-test-user-2';

      // 创建用户
      await prisma.users.create({
        data: testDataGenerator.generateUser({
          id: userId,
          telegramId: 'precision_telegram_1',
          coinBalance: 1000.0,
        })
      });

      await prisma.users.create({
        data: testDataGenerator.generateUser({
          id: referrerId,
          telegramId: 'precision_telegram_2',
          coinBalance: 2000.0,
        })
      });

      // 创建推荐关系
      await prisma.referralRelationships.create({
        data: {
          referrerUserId: referrerId,
          refereeUserId: userId,
          referralLevel: 1,
        }
      });

      // 测试多种返利金额
      const rebateTests = [5.0, 12.5, 0.5, 99.9, 123.456];

      for (const rebateAmount of rebateTests) {
        // 存储返利
        const transaction = await prisma.rewardTransactions.create({
          data: {
            userId: referrerId,
            amount: Number(rebateAmount.toFixed(1)),
            description: `precision-test rebate`,
            rewardType: 'referral',
            triggerUserId: userId,
          }
        });

        // 验证存储的精度
        expect(transaction.amount).toBe(Number(rebateAmount.toFixed(1)));
        expect(transaction.amount.toString().includes('.') ? 
          transaction.amount.toString().split('.')[1].length <= 1 : true).toBe(true);

        console.log(`返利金额: ${rebateAmount} -> 存储精度: ${transaction.amount}`);
      }

      // 查询所有返利记录的总和
      const totalRebates = await prisma.rewardTransactions.aggregate({
        _sum: {
          amount: true
        },
        where: {
          userId: referrerId,
          description: { startsWith: 'precision-test' }
        }
      });

      const expectedTotal = rebateTests.reduce((sum, amount) => sum + Number(amount.toFixed(1)), 0);
      expect(totalRebates._sum.amount).toBeCloseTo(expectedTotal, 1);

      console.log(`总返利: ${totalRebates._sum.amount} (期望: ${expectedTotal})`);
    });

    test('复杂推荐链精度测试', async () => {
      // 创建多层级推荐关系
      const users = [];
      const levels = [1, 2, 3]; // 1级、2级、3级推荐;
      const baseAmount = 100.0;
      const rates = [0.05, 0.03, 0.02]; // 对应的返利比例;

      // 创建用户链
      for (let i = 0; i < levels.length + 1; i++) {
        const userId = `precision-test-chain-${i}`;
        await prisma.users.create({
          data: testDataGenerator.generateUser({
            id: userId,
            telegramId: `chain_${i}`,
            coinBalance: 1000.0,
          })
        });
        users.push(userId);
      }

      // 创建推荐关系链
      for (let i = 0; i < users.length - 1; i++) {
        await prisma.referralRelationships.create({
          data: {
            referrerUserId: users[i],
            refereeUserId: users[i + 1],
            referralLevel: levels[i],
          }
        });
      }

      // 计算各层级返利
      const rebateResults = [];
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        const rate = rates[i];
        const rebate = Number((baseAmount * rate).toFixed(1));

        // 存储返利记录
        const transaction = await prisma.rewardTransactions.create({
          data: {
            userId: users[i],
            amount: rebate,
            description: `precision-test chain level ${level}`,
            rewardType: 'referral',
            triggerUserId: users[levels.length],
          }
        });

        rebateResults.push({ level, rate, rebate, transaction });
      }

      // 验证每层级的精度
      rebateResults.forEach(result => {
        expect(result.rebate).toBe(Number((baseAmount * result.rate).toFixed(1)));
        console.log(`Level ${result.level}: ${baseAmount} × ${result.rate} = ${result.rebate}`);
      });

      // 验证返利总和
      const totalRebate = rebateResults.reduce((sum, result) => sum + result.rebate, 0);
      const expectedTotal = rebateResults.reduce((sum, result) => sum + baseAmount * result.rate, 0);
      expect(totalRebate).toBeCloseTo(expectedTotal, 1);

      console.log(`总返利: ${totalRebate} (期望: ${expectedTotal})`);
    });
  });

  describe('浮点数精度边界测试', () => {
    test('IEEE 754浮点数精度限制测试', async () => {
      // 测试著名的浮点数精度问题
      const problematicCases = [;
        0.1 + 0.2, // 应该等于 0.3，但可能有精度问题
        0.3 + 0.6,
        1.0 / 3.0, // 无限循环小数
        Math.PI, // 圆周率
        Math.sqrt(2), // 平方根
      ];

      for (const case_ of problematicCases) {
        const rounded = Number(case_.toFixed(1));
        console.log(`精确度测试: ${case_} -> 四舍五入到1位小数: ${rounded}`);
        expect(typeof rounded).toBe('number');
        expect(isFinite(rounded)).toBe(true);
      }
    });

    test('返利计算中的精度陷阱', async () => {
      // 模拟可能出现精度问题的返利计算
      function preciseRebateCalc(amount: number, rate: number): number {
        // 使用字符串运算避免浮点数精度问题
        const amountStr = amount.toString();
        const rateStr = rate.toString();
        
        // 转换为分进行计算
        const amountCents = Math.round(parseFloat(amountStr) * 100);
        const rateBasisPoints = Math.round(parseFloat(rateStr) * 10000);
        
        const rebateCents = Math.round((amountCents * rateBasisPoints) / 10000);
        return Number((rebateCents / 100).toFixed(1));
      }

      const precisionCases = [;
        { amount: 100.07, rate: 0.0333, description: '长小数概率' },
        { amount: 333.33, rate: 0.0333, description: '重复数字' },
        { amount: 999.99, rate: 0.0001, description: '极小概率' },
        { amount: 0.01, rate: 999.99, description: '极大概率' },
      ];

      for (const case_ of precisionCases) {
        const result = preciseRebateCalc(case_.amount, case_.rate);
        console.log(`${case_.description}: ${case_.amount} × ${case_.rate} = ${result}`);
        
        expect(result).toBeGreaterThanOrEqual(0);
        expect(isFinite(result)).toBe(true);
        expect(typeof result).toBe('number');
      }
    });
  });

  describe('性能与精度平衡测试', () => {
    test('大量计算下的精度一致性', async () => {
      const calculationCount = 10000;
      const amounts = Array(calculationCount).fill(0).map(() => Math.random() * 1000);
      const rates = Array(calculationCount).fill(0).map(() => Math.random() * 0.1);
      
      function calculateWithPrecision(amount: number, rate: number): number {
        return Number((amount * rate).toFixed(1));
      }

      const results = amounts.map((amount, index) =>;
        calculateWithPrecision(amount, rates[index])
      );

      // 验证所有结果都在预期范围内
      results.forEach((result, index) => {
        const expected = Number(((amounts?.index ?? null) * (rates?.index ?? null)).toFixed(1));
        expect(result).toBe(expected);
        expect(result >= 0).toBe(true);
        expect(isFinite(result)).toBe(true);
      });

      console.log(`成功执行${calculationCount}次高精度计算，所有结果均符合预期`);
      
      // 统计信息
      const validResults = results.filter(r => isFinite(r) && r >= 0);
      expect(validResults.length).toBe(calculationCount);
    });
  });
});