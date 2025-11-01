import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TestDataGenerator, PerformanceTester } from './test-config';
/**
 * 小数精度返利计算测试
 * 测试精确的浮点数计算和精度处理
 */


// 模拟高精度计算库
jest.mock('decimal.js', () => ({
  Decimal: jest.fn().mockImplementation(function(value: any) {
    this.value = typeof value === 'string' ? parseFloat(value) : value;
    
    this.plus = function(other: any) {
      return new (this.constructor as any)(this.value + (typeof other === 'string' ? parseFloat(other) : other));
    };
    
    this.minus = function(other: any) {
      return new (this.constructor as any)(this.value - (typeof other === 'string' ? parseFloat(other) : other));
    };
    
    this.times = function(other: any) {
      return new (this.constructor as any)(this.value * (typeof other === 'string' ? parseFloat(other) : other));
    };
    
    this.div = function(other: any) {
      return new (this.constructor as any)(this.value / (typeof other === 'string' ? parseFloat(other) : other));
    };
    
    this.toNumber = function() {
      return this.value;
    };
    
    this.toFixed = function(precision?: number) {
      return this.value.toFixed(precision);
    };
  }),
}));

// 高精度计算工具类
class PreciseCalculator {
  // 使用字符串操作避免浮点数精度问题
  static add(num1: string | number, num2: string | number): string {
    const str1 = num1.toString();
    const str2 = num2.toString();
    
    const [int1, dec1 = ''] = str1.split('.');
    const [int2, dec2 = ''] = str2.split('.');
    
    const maxDecLength = Math.max(dec1.length, dec2.length);
    const paddedDec1 = dec1.padEnd(maxDecLength, '0');
    const paddedDec2 = dec2.padEnd(maxDecLength, '0');
    
    const fullNum1 = parseInt(int1 + paddedDec1, 10);
    const fullNum2 = parseInt(int2 + paddedDec2, 10);
    const result = fullNum1 + fullNum2;
    
    const resultStr = result.toString();
    const resultInt = resultStr.slice(0, -maxDecLength) || '0';
    const resultDec = resultStr.slice(-maxDecLength).padStart(maxDecLength, '0');
    
    return resultDec === '0'.repeat(maxDecLength) ? resultInt : `${resultInt}.${resultDec}`;
  }
  
  static subtract(num1: string | number, num2: string | number): string {
    const str1 = num1.toString();
    const str2 = num2.toString();
    
    const [int1, dec1 = ''] = str1.split('.');
    const [int2, dec2 = ''] = str2.split('.');
    
    const maxDecLength = Math.max(dec1.length, dec2.length);
    const paddedDec1 = dec1.padEnd(maxDecLength, '0');
    const paddedDec2 = dec2.padEnd(maxDecLength, '0');
    
    const fullNum1 = parseInt(int1 + paddedDec1, 10);
    const fullNum2 = parseInt(int2 + paddedDec2, 10);
    const result = fullNum1 - fullNum2;
    
    const resultStr = result.toString();
    const resultInt = resultStr.slice(0, -maxDecLength) || '0';
    const resultDec = resultStr.slice(-maxDecLength).padStart(maxDecLength, '0');
    
    return resultDec === '0'.repeat(maxDecLength) ? resultInt : `${resultInt}.${resultDec}`;
  }
  
  static multiply(num1: string | number, num2: string | number): string {
    const str1 = num1.toString();
    const str2 = num2.toString();
    
    const [int1, dec1 = ''] = str1.split('.');
    const [int2, dec2 = ''] = str2.split('.');
    
    const fullNum1 = parseInt(int1 + dec1, 10);
    const fullNum2 = parseInt(int2 + dec2, 10);
    const result = fullNum1 * fullNum2;
    const totalDecLength = dec1.length + dec2.length;
    
    const resultStr = result.toString();
    const resultInt = resultStr.slice(0, -totalDecLength) || '0';
    const resultDec = resultStr.slice(-totalDecLength).padStart(totalDecLength, '0');
    
    return resultDec === '0'.repeat(totalDecLength) ? resultInt : `${resultInt}.${resultDec}`;
  }
  
  static divide(num1: string | number, num2: string | number): string {
    const str1 = num1.toString();
    const str2 = num2.toString();
    
    if (str2 === '0') {
      throw new Error('Division by zero');
    }
    
    const [int1, dec1 = ''] = str1.split('.');
    const [int2, dec2 = ''] = str2.split('.');
    
    // 放大分子和分母以处理小数
    const scale = 18; // 最多18位小数精度;
    const scaledNum1 = parseInt(int1 + dec1 + '0'.repeat(scale - dec1.length), 10) * Math.pow(10, scale);
    const scaledNum2 = parseInt(int2 + dec2 + '0'.repeat(scale - dec2.length), 10);
    
    const result = Math.floor(scaledNum1 / scaledNum2);
    const resultStr = result.toString();
    const totalDecLength = scale + scale; // 被除数扩大了scale位，除数扩大了scale位;
    
    const resultInt = resultStr.slice(0, -totalDecLength) || '0';
    const resultDec = resultStr.slice(-totalDecLength).padStart(totalDecLength, '0');
    
    // 移除尾随零
    const trimmedDec = resultDec.replace(/0+$/, '');
    
    return trimmedDec ? `${resultInt}.${trimmedDec}` : resultInt;
  }
  
  static round(num: string | number, precision: number): string {
    const str = num.toString();
    const [int, dec = ''] = str.split('.');
    
    if (dec.length <= precision) {
      return str;
    }
    
    const rounded = Math.round(parseFloat(str) * Math.pow(10, precision)) / Math.pow(10, precision);
    return rounded.toFixed(precision);
  }
  
  static compare(num1: string | number, num2: string | number): number {
    const str1 = num1.toString();
    const str2 = num2.toString();
    
    const [int1, dec1 = ''] = str1.split('.');
    const [int2, dec2 = ''] = str2.split('.');
    
    if (int1 !== int2) {
      return parseInt(int1, 10) - parseInt(int2, 10);
    }
    
    const maxLength = Math.max(dec1.length, dec2.length);
    const padded1 = parseInt(dec1.padEnd(maxLength, '0'), 10);
    const padded2 = parseInt(dec2.padEnd(maxLength, '0'), 10);
    
    return padded1 - padded2;
  }
}

// 返利计算服务
class RebateCalculator {
  private static readonly DECIMAL_PRECISION = 8;
  private static readonly MIN_REBATE_THRESHOLD = 0.0001; // 最小返利阈值
  
  static calculateRebate(
    amount: string | number,
    rate: string | number,
    level: number = 1,
    tierMultiplier: number = 1
  ): { rebate: string; effectiveRate: string; roundedRebate: string } {
    // 步骤1: 计算原始返利
    const rawRebate = PreciseCalculator.multiply(amount, rate);
    
    // 步骤2: 应用层级倍数
    const multipliedRebate = PreciseCalculator.multiply(rawRebate, tierMultiplier.toString());
    
    // 步骤3: 计算有效返利率
    const effectiveRate = PreciseCalculator.divide(multipliedRebate, amount);
    
    // 步骤4: 检查最小返利阈值
    const rebateAfterThreshold = PreciseCalculator.compare(multipliedRebate, this.MIN_REBATE_THRESHOLD.toString()) >= 0;
      ? multipliedRebate 
      : '0';
    
    // 步骤5: 四舍五入到指定精度
    const roundedRebate = this.roundToPrecision(rebateAfterThreshold);
    
    return {
      rebate: rebateAfterThreshold,
      effectiveRate,
      roundedRebate,
    };
  }
  
  static roundToPrecision(amount: string | number, precision: number = this.DECIMAL_PRECISION): string {
    return PreciseCalculator.round(amount, precision);
  }
  
  static calculateTotalRebate(rebates: Array<{ amount: string; rate: string; level: number }>): {
    totalRebate: string;
    averageRate: string;
    rebateByLevel: Record<number, string>;
  } {
    const rebateByLevel: Record<number, string> = {};
    let totalRebate = '0';
    
    // 按层级分组计算
    rebates.forEach(({ amount, rate, level }) => {
      const { roundedRebate } = this.calculateRebate(amount, rate, level);
      
      if (!rebateByLevel[level]) {
        rebateByLevel[level] = '0';
      }
      
      (rebateByLevel?.level ?? null) = PreciseCalculator.add((rebateByLevel?.level ?? null), roundedRebate);
      totalRebate = PreciseCalculator.add(totalRebate, roundedRebate);
    });
    
    // 计算平均返利率
    const totalAmount = rebates.reduce((sum, r) => PreciseCalculator.add(sum, r.amount), '0');
    const averageRate = PreciseCalculator.divide(totalRebate, totalAmount);
    
    return {
      totalRebate,
      averageRate,
      rebateByLevel,
    };
  }
  
  static validateRebateCalculation(
    originalAmount: string | number,
    rebateAmount: string | number,
    expectedRate: string | number
  ): { isValid: boolean; actualRate: string; deviation: string } {
    const actualRate = PreciseCalculator.divide(rebateAmount, originalAmount);
    const deviation = PreciseCalculator.subtract(actualRate, expectedRate.toString());
    
    const isValid = Math.abs(parseFloat(deviation)) < 0.000001; // 允许1e-6的误差;
    
    return {
      isValid,
      actualRate,
      deviation,
    };
  }
}

describe('小数精度返利计算测试', () => {
  let testDataGenerator: TestDataGenerator;
  let rebateCalculator: typeof RebateCalculator;

  beforeEach(() => {
    testDataGenerator = new TestDataGenerator({} as any);
    rebateCalculator = RebateCalculator;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('基础精度计算测试', () => {
    test('加法精度测试', () => {
      const testCases = [;
        { a: '0.1', b: '0.2', expected: '0.3' },
        { a: '1.23456789', b: '9.87654321', expected: '11.11111110' },
        { a: '1000000.00000001', b: '0.00000001', expected: '1000000.00000002' },
        { a: '999999.99999999', b: '0.00000001', expected: '1000000.00000000' },
      ];

      testCases.forEach(({ a, b, expected }) => {
        const result = PreciseCalculator.add(a, b);
        expect(result).toBe(expected);
      });
    });

    test('减法精度测试', () => {
      const testCases = [;
        { a: '1.0', b: '0.1', expected: '0.9' },
        { a: '10.00000000', b: '0.00000001', expected: '9.99999999' },
        { a: '100.555', b: '0.555', expected: '100.000' },
      ];

      testCases.forEach(({ a, b, expected }) => {
        const result = PreciseCalculator.subtract(a, b);
        expect(result).toBe(expected);
      });
    });

    test('乘法精度测试', () => {
      const testCases = [;
        { a: '0.1', b: '0.2', expected: '0.02' },
        { a: '123.456', b: '78.9', expected: '9737.0784' },
        { a: '0.33333333', b: '3', expected: '0.99999999' },
        { a: '999999.99999999', b: '0.00000001', expected: '9.99999999' },
      ];

      testCases.forEach(({ a, b, expected }) => {
        const result = PreciseCalculator.multiply(a, b);
        expect(result).toBe(expected);
      });
    });

    test('除法精度测试', () => {
      const testCases = [;
        { a: '1', b: '3', expected: '0.333333333333333333' }, // 18位精度
        { a: '10', b: '3', expected: '3.333333333333333333' },
        { a: '1', b: '7', expected: '0.142857142857142857' },
      ];

      testCases.forEach(({ a, b, expected }) => {
        const result = PreciseCalculator.divide(a, b);
        expect(result).toBe(expected);
      });
    });

    test('四舍五入精度测试', () => {
      const testCases = [;
        { num: '3.14159265', precision: 2, expected: '3.14' },
        { num: '3.14159265', precision: 4, expected: '3.1416' },
        { num: '0.000000009', precision: 8, expected: '0.00000001' },
        { num: '999.999999999', precision: 2, expected: '1000.00' },
      ];

      testCases.forEach(({ num, precision, expected }) => {
        const result = PreciseCalculator.round(num, precision);
        expect(result).toBe(expected);
      });
    });

    test('比较运算精度测试', () => {
      const testCases = [;
        { a: '1.00000000', b: '1.00000000', expected: 0 },
        { a: '1.00000001', b: '1.00000000', expected: 1 },
        { a: '0.99999999', b: '1.00000000', expected: -1 },
        { a: '3.14159265', b: '3.14159264', expected: 1 },
      ];

      testCases.forEach(({ a, b, expected }) => {
        const result = PreciseCalculator.compare(a, b);
        expect(result).toBe(expected);
      });
    });
  });

  describe('返利计算精确性测试', () => {
    test('基础返利计算', () => {
      const testCases = [;
        {
          amount: '100.00',
          rate: '0.05', // 5%
          level: 1,
          expectedRebate: '5.00000000',
          expectedEffectiveRate: '0.05000000',
        },
        {
          amount: '123.45',
          rate: '0.025', // 2.5%
          level: 2,
          expectedRebate: '3.08625000',
          expectedEffectiveRate: '0.02500000',
        },
        {
          amount: '0.01',
          rate: '0.10', // 10%
          level: 1,
          expectedRebate: '0.00100000',
          expectedEffectiveRate: '0.10000000',
        },
      ];

      testCases.forEach(({ amount, rate, level, expectedRebate, expectedEffectiveRate }) => {
        const result = rebateCalculator.calculateRebate(amount, rate, level);
        
        expect(result.roundedRebate).toBe(expectedRebate);
        expect(result.effectiveRate).toBe(expectedEffectiveRate);
      });
    });

    test('层级返利计算', () => {
      const tierMultipliers = {
        1: 1.0,   // 100%
        2: 0.8,   // 80%
        3: 0.6,   // 60%
        4: 0.4,   // 40%
        5: 0.2,   // 20%
      };

      const baseAmount = '1000.00';
      const baseRate = '0.05';

      Object.entries(tierMultipliers).forEach(([level, multiplier]) => {
        const result = rebateCalculator.calculateRebate(baseAmount, baseRate, parseInt(level), multiplier);
        const expectedRebate = PreciseCalculator.multiply(;
          PreciseCalculator.multiply(baseAmount, baseRate),
          multiplier.toString()
        );
        
        expect(result.roundedRebate).toBe(PreciseCalculator.round(expectedRebate, 8));
      });
    });

    test('最小返利阈值处理', () => {
      const testCases = [;
        {
          amount: '0.001',
          rate: '0.05',
          expectedRebate: '0', // 低于最小阈值
        },
        {
          amount: '0.01',
          rate: '0.01',
          expectedRebate: '0.00010000',
        },
        {
          amount: '100.00',
          rate: '0.000001', // 极低返利率
          expectedRebate: '0.00010000', // 正好等于最小阈值
        },
      ];

      testCases.forEach(({ amount, rate, expectedRebate }) => {
        const result = rebateCalculator.calculateRebate(amount, rate);
        expect(result.roundedRebate).toBe(expectedRebate);
      });
    });

    test('极值返利计算', () => {
      const testCases = [;
        {
          description: '极大金额返利',
          amount: '999999999999.99',
          rate: '0.99999999',
          expectedRebate: '999999999000.00000000',
        },
        {
          description: '极小金额返利',
          amount: '0.00000001',
          rate: '0.00000001',
          expectedRebate: '0.00000000', // 小于最小阈值
        },
        {
          description: '高精度返利',
          amount: '123456789.987654321',
          rate: '0.123456789',
          expectedRebate: '15241578750.00000000',
        },
      ];

      testCases.forEach(({ description, amount, rate, expectedRebate }) => {
        const result = rebateCalculator.calculateRebate(amount, rate);
        expect(result.roundedRebate).toBe(expectedRebate);
      });
    });
  });

  describe('复合返利计算测试', () => {
    test('多层级返利汇总', () => {
      const rebates = [;
        { amount: '1000.00', rate: '0.10', level: 1 },
        { amount: '1000.00', rate: '0.08', level: 2 },
        { amount: '1000.00', rate: '0.06', level: 3 },
        { amount: '1000.00', rate: '0.04', level: 4 },
        { amount: '1000.00', rate: '0.02', level: 5 },
      ];

      const result = rebateCalculator.calculateTotalRebate(rebates);
      
      // 验证每层返利
      expect(result.(rebateByLevel?.1 ?? null)).toBe('100.00000000');
      expect(result.(rebateByLevel?.2 ?? null)).toBe('80.00000000');
      expect(result.(rebateByLevel?.3 ?? null)).toBe('60.00000000');
      expect(result.(rebateByLevel?.4 ?? null)).toBe('40.00000000');
      expect(result.(rebateByLevel?.5 ?? null)).toBe('20.00000000');
      
      // 验证总返利
      expect(result.totalRebate).toBe('300.00000000');
      
      // 验证平均返利率
      const expectedAverageRate = PreciseCalculator.divide('300.00000000', '5000.00');
      expect(result.averageRate).toBe(expectedAverageRate);
    });

    test('批量用户返利计算', () => {
      const userRebates = Array.from({ length: 100 }, (_, i) => ({
        amount: (Math.random() * 10000 + 1).toFixed(2),
        rate: '0.05',
        level: (i % 5) + 1,
      }));

      const result = rebateCalculator.calculateTotalRebate(userRebates);
      
      // 验证返利数据完整性
      expect(Object.keys(result.rebateByLevel).length).toBeLessThanOrEqual(5);
      expect(result.totalRebate).toBeTruthy();
      expect(result.averageRate).toBeTruthy();
      
      // 验证返利计算合理性
      const totalAmount = userRebates.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const totalRebateValue = parseFloat(result.totalRebate);
      const averageRate = parseFloat(result.averageRate);
      
      expect(totalRebateValue).toBeGreaterThan(0);
      expect(averageRate).toBeGreaterThan(0);
      expect(averageRate).toBeLessThan(0.1); // 5%基础返利率
    });
  });

  describe('返利计算验证测试', () => {
    test('返利结果验证', () => {
      const testCases = [;
        {
          originalAmount: '100.00',
          rebateAmount: '5.00',
          expectedRate: '0.05',
          shouldBeValid: true,
        },
        {
          originalAmount: '123.45',
          rebateAmount: '6.1725',
          expectedRate: '0.05',
          shouldBeValid: true,
        },
        {
          originalAmount: '100.00',
          rebateAmount: '4.99',
          expectedRate: '0.05',
          shouldBeValid: false,
        },
      ];

      testCases.forEach(({ originalAmount, rebateAmount, expectedRate, shouldBeValid }) => {
        const validation = rebateCalculator.validateRebateCalculation(originalAmount, rebateAmount, expectedRate);
        
        if (shouldBeValid) {
          expect(validation.isValid).toBe(true);
        } else {
          expect(validation.isValid).toBe(false);
        }
      });
    });

    test('浮点数精度问题修复', () => {
      // JavaScript浮点数精度问题示例
      const jsFloatResult = 0.1 + 0.2; // 0.30000000000000004;
      const preciseResult = PreciseCalculator.add('0.1', '0.2'); // 0.3;
      
      expect(jsFloatResult).not.toBe(0.3);
      expect(preciseResult).toBe('0.3');
      
      // 测试乘法精度问题
      const jsFloatMultiply = 0.1 * 0.2; // 0.020000000000000004;
      const preciseMultiply = PreciseCalculator.multiply('0.1', '0.2'); // 0.02;
      
      expect(jsFloatMultiply).not.toBe(0.02);
      expect(preciseMultiply).toBe('0.02');
    });

    test('累积精度误差测试', () => {
      const iterations = 1000;
      let jsAccumulator = 0;
      let preciseAccumulator = '0';
      
      for (let i = 0; i < iterations; i++) {
        // JavaScript浮点数累积
        jsAccumulator += 0.1;
        
        // 高精度累积
        preciseAccumulator = PreciseCalculator.add(preciseAccumulator, '0.1');
      }
      
      // JavaScript累积会有精度误差
      expect(jsAccumulator).not.toBe(100);
      
      // 高精度累积应该准确
      expect(preciseAccumulator).toBe('100.0');
    });
  });

  describe('返利计算性能测试', () => {
    test('大量返利计算性能', async () => {
      const calculationCount = 10000;
      const rebates = Array.from({ length: calculationCount }, (_, i) => ({
        amount: (Math.random() * 10000 + 1).toFixed(2),
        rate: '0.05',
        level: (i % 5) + 1,
      }));

      const performBatchCalculation = async () => {
        let totalRebate = '0';
        let calculations = 0;
        
        for (const rebate of rebates) {
          const result = rebateCalculator.calculateRebate(rebate.amount, rebate.rate, rebate.level);
          totalRebate = PreciseCalculator.add(totalRebate, result.roundedRebate);
          calculations++;
        }
        
        return { totalRebate, calculations };
      };

      const { result, duration } = await PerformanceTester.measureExecutionTime(performBatchCalculation);

      expect(result.calculations).toBe(calculationCount);
      expect(duration).toBeLessThan(5000); // 5秒内完成
      console.log(`大量返利计算性能: ${duration.toFixed(2)}ms 处理${calculationCount}次计算`);
    });

    test('并发返利计算性能', async () => {
      const concurrentUsers = 1000;
      
      const calculateUserRebate = async (userId: string) => {
        const amount = (Math.random() * 10000 + 1).toFixed(2);
        const rate = '0.05';
        const level = (parseInt(userId.split('-')[1]) % 5) + 1;
        
        const result = rebateCalculator.calculateRebate(amount, rate, level);
        return {
          userId,
          rebate: parseFloat(result.roundedRebate),
          originalAmount: parseFloat(amount),
          effectiveRate: parseFloat(result.effectiveRate),
        };
      };

      const { results, totalTime, averageTime } = await PerformanceTester.testConcurrency(;
        () => calculateUserRebate(`user-${Math.floor(Math.random() * concurrentUsers)}`),
        concurrentUsers
      );

      expect(results).toHaveLength(concurrentUsers);
      expect(totalTime).toBeLessThan(3000); // 3秒内完成
      expect(averageTime).toBeLessThan(10); // 平均每个计算少于10ms
      console.log(`并发返利计算统计 - 总时间: ${totalTime.toFixed(2)}ms, 平均时间: ${averageTime.toFixed(2)}ms`);
    });
  });

  describe('返利计算边界测试', () => {
    test('边界值精度测试', () => {
      const boundaryCases = [;
        {
          description: '最小正数',
          amount: '0.00000001',
          rate: '1.0',
          expectedRebate: '0.00000000', // 小于最小阈值
        },
        {
          description: '最大安全整数',
          amount: '9007199254740991.00', // Number.MAX_SAFE_INTEGER
          rate: '0.00000001',
          expectedRebate: '90.07199254',
        },
        {
          description: '接近零的除数',
          amount: '100.00',
          rate: '0.00000001',
          expectedRebate: '0.00000100',
        },
      ];

      boundaryCases.forEach(({ description, amount, rate, expectedRebate }) => {
        const result = rebateCalculator.calculateRebate(amount, rate);
        expect(result.roundedRebate).toBe(expectedRebate);
      });
    });

    test('极端精度测试', () => {
      const extremePrecision = [;
        {
          amount: '1.000000000000000001',
          rate: '1.000000000000000001',
          precision: 18,
        },
        {
          amount: '0.000000000000000001',
          rate: '1000000000000000000.0',
          precision: 18,
        },
      ];

      extremePrecision.forEach(({ amount, rate, precision }) => {
        const result = rebateCalculator.calculateRebate(amount, rate);
        
        // 验证精度控制
        const decimalPlaces = (result.roundedRebate.split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(precision);
        
        // 验证结果格式
        expect(result.roundedRebate).toMatch(/^\d+(\.\d+)?$/);
      });
    });

    test('数值溢出处理', () => {
      const overflowCases = [;
        {
          description: '超大金额',
          amount: Number.MAX_VALUE.toString(),
          rate: '0.00000001',
          shouldHandle: true,
        },
        {
          description: '极小概率',
          amount: '1.0',
          rate: Number.MIN_VALUE.toString(),
          shouldHandle: true,
        },
      ];

      overflowCases.forEach(({ description, amount, rate, shouldHandle }) => {
        if (shouldHandle) {
          expect(() => {
            rebateCalculator.calculateRebate(amount, rate);
          }).not.toThrow();
        }
      });
    });
  });

  describe('返利系统集成测试', () => {
    test('完整的返利计算工作流', async () => {
      // 模拟完整的返利计算流程
      
      // 1. 用户消费记录
      const consumptionRecords = [;
        { userId: 'user-1', amount: '1500.00', timestamp: new Date() },
        { userId: 'user-2', amount: '750.50', timestamp: new Date() },
        { userId: 'user-3', amount: '3200.75', timestamp: new Date() },
      ];

      // 2. 邀请层级配置
      const referralConfig = {
        1: { rate: '0.10', multiplier: '1.0' },
        2: { rate: '0.08', multiplier: '0.8' },
        3: { rate: '0.06', multiplier: '0.6' },
        4: { rate: '0.04', multiplier: '0.4' },
        5: { rate: '0.02', multiplier: '0.2' },
      };

      // 3. 计算各层级返利
      let totalRebate = '0';
      const rebateBreakdown: Record<string, string> = {};

      for (let level = 1; level <= 5; level++) {
        const levelConfig = referralConfig[level as keyof typeof referralConfig];
        const levelRebates = consumptionRecords.map(record => ({
          amount: record.amount,
          rate: levelConfig.rate,
          level,
        }));

        const levelResult = rebateCalculator.calculateTotalRebate(levelRebates);
        rebateBreakdown[`level-${level}`] = levelResult.totalRebate;
        totalRebate = PreciseCalculator.add(totalRebate, levelResult.totalRebate);
      }

      // 4. 验证计算结果
      expect(Object.keys(rebateBreakdown).length).toBe(5);
      expect(parseFloat(totalRebate)).toBeGreaterThan(0);

      // 验证各层级计算
      const expectedRebates = {
        'level-1': '545.02500000', // 10% of total consumption
        'level-2': '436.02000000', // 8% of total consumption
        'level-3': '327.01500000', // 6% of total consumption
        'level-4': '218.01000000', // 4% of total consumption
        'level-5': '109.00500000', // 2% of total consumption
      };

      Object.entries(expectedRebates).forEach(([level, expected]) => {
        expect((rebateBreakdown?.level ?? null)).toBe(expected);
      });

      // 验证总返利
      const expectedTotal = PreciseCalculator.add(;
        PreciseCalculator.add(
          PreciseCalculator.add(
            PreciseCalculator.add(expectedRebates['level-1'], expectedRebates['level-2']),
            expectedRebates['level-3']
          ),
          expectedRebates['level-4']
        ),
        expectedRebates['level-5']
      );
      
      expect(totalRebate).toBe(expectedTotal);
    });

    test('返利计算错误处理', async () => {
      const errorCases = [;
        {
          description: '无效金额',
          amount: 'invalid',
          rate: '0.05',
          shouldThrow: true,
        },
        {
          description: '负数金额',
          amount: '-100.00',
          rate: '0.05',
          shouldThrow: false, // 应该返回0返利
        },
        {
          description: '零返利率',
          amount: '100.00',
          rate: '0',
          shouldThrow: false, // 应该返回0返利
        },
        {
          description: '负数返利率',
          amount: '100.00',
          rate: '-0.05',
          shouldThrow: false, // 应该返回0返利
        },
      ];

      errorCases.forEach(({ description, amount, rate, shouldThrow }) => {
        if (shouldThrow) {
          expect(() => {
            rebateCalculator.calculateRebate(amount, rate);
          }).toThrow();
        } else {
          expect(() => {
            const result = rebateCalculator.calculateRebate(amount, rate);
            expect(parseFloat(result.roundedRebate)).toBeGreaterThanOrEqual(0);
          }).not.toThrow();
        }
      });
    });
  });
});