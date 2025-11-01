import { 
/**
 * 订单参数验证器测试
 * 测试订单参数验证中间件的各项功能
 */

  OrderValidator, 
  validateOrderCreation, 
  validateOrderUpdate, 
  validateOrderQuery,
  ORDER_TYPES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  FULFILLMENT_STATUSES,
  DEFAULT_CONSTRAINTS,
  DEFAULT_REGEX_VALIDATORS
} from '@/lib/order-validator';

describe('OrderValidator', () => {
  let validator: OrderValidator;

  beforeEach(() => {
    validator = new OrderValidator();
  });

  describe('基础验证功能', () => {
    test('应该验证有效的创建订单数据', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        productId: '123e4567-e89b-12d3-a456-426614174001',
        type: ORDER_TYPES.DIRECT_BUY,
        quantity: 2,
        totalAmount: 99.99,
        paymentMethod: 'balance',
        isResale: false
      };

      const result = validator.validateOrderCreation(validData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedData).toBeDefined();
    });

    test('应该拒绝缺少必填字段的创建订单数据', () => {
      const invalidData = {
        // 缺少 userId 和 type
        quantity: 2,
        totalAmount: 99.99
      };

      const result = validator.validateOrderCreation(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].details?.field).toBe('userId');
      expect(result.errors[1].details?.field).toBe('type');
    });

    test('应该验证UUID格式', () => {
      const invalidData = {
        userId: 'invalid-uuid',
        type: ORDER_TYPES.DIRECT_BUY
      };

      const result = validator.validateOrderCreation(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.details?.field === 'userId')).toBe(true);
    });

    test('应该验证订单类型', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'invalid_type'
      };

      const result = validator.validateOrderCreation(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.details?.field === 'type')).toBe(true);
    });
  });

  describe('金额验证', () => {
    test('应该验证有效的金额范围', () => {
      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: ORDER_TYPES.DIRECT_BUY,
        totalAmount: 50.50
      };

      const result = validator.validateOrderCreation(data);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('应该拒绝金额超出范围', () => {
      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: ORDER_TYPES.DIRECT_BUY,
        totalAmount: 1000000 // 超出最大值
      };

      const result = validator.validateOrderCreation(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.details?.field === 'totalAmount')).toBe(true);
    });

    test('应该拒绝负数金额', () => {
      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: ORDER_TYPES.DIRECT_BUY,
        totalAmount: -10
      };

      const result = validator.validateOrderCreation(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.details?.field === 'totalAmount')).toBe(true);
    });

    test('应该验证小数位数', () => {
      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: ORDER_TYPES.DIRECT_BUY,
        totalAmount: 50.123 // 超过2位小数
      };

      const result = validator.validateOrderCreation(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('小数位数'))).toBe(true);
    });
  });

  describe('数量验证', () => {
    test('应该验证有效的数量范围', () => {
      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: ORDER_TYPES.DIRECT_BUY,
        quantity: 5
      };

      const result = validator.validateOrderCreation(data);
      
      expect(result.isValid).toBe(true);
    });

    test('应该拒绝超出范围的数量', () => {
      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: ORDER_TYPES.DIRECT_BUY,
        quantity: 2000 // 超出最大值
      };

      const result = validator.validateOrderCreation(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.details?.field === 'quantity')).toBe(true);
    });

    test('应该拒绝非整数数量', () => {
      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: ORDER_TYPES.DIRECT_BUY,
        quantity: 2.5 // 非整数
      };

      const result = validator.validateOrderCreation(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.details?.field === 'quantity')).toBe(true);
    });
  });

  describe('正则表达式验证', () => {
    test('应该验证订单号格式', () => {
      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: ORDER_TYPES.DIRECT_BUY,
        orderNumber: 'ORDER123!' // 包含非法字符
      };

      const result = validator.validateOrderCreation(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.details?.field === 'orderNumber')).toBe(true);
    });

    test('应该验证跟踪号格式', () => {
      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: ORDER_TYPES.DIRECT_BUY,
        trackingNumber: 'TRACK@123' // 包含非法字符
      };

      const result = validator.validateOrderCreation(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.details?.field === 'trackingNumber')).toBe(true);
    });
  });

  describe('业务逻辑验证', () => {
    test('应该验证转售订单的特殊要求', () => {
      const invalidResaleData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: ORDER_TYPES.RESALE,
        isResale: false, // 转售订单必须为true
        resalePrice: 100
      };

      const result = validator.validateOrderCreation(invalidResaleData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.details?.field === 'isResale')).toBe(true);
    });

    test('应该验证购买类型订单需要productId', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: ORDER_TYPES.DIRECT_BUY,
        // 缺少 productId
        quantity: 1,
        totalAmount: 50
      };

      const result = validator.validateOrderCreation(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.details?.field === 'productId')).toBe(true);
    });
  });

  describe('数据清理和标准化', () => {
    test('应该清理字符串字段', () => {
      const data = {
        userId: '  123e4567-e89b-12d3-a456-426614174000  ',
        type: ORDER_TYPES.DIRECT_BUY,
        notes: '  这是备注  ',
        paymentMethod: '  balance  '
      };

      const result = validator.validateOrderCreation(data);
      
      if (result.isValid && result.sanitizedData) {
        expect(result.sanitizedData.notes).toBe('这是备注');
        expect(result.sanitizedData.paymentMethod).toBe('balance');
      }
    });

    test('应该标准化枚举值', () => {
      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'DIRECT_BUY', // 大写，应该转换为小写
        status: 'PENDING' // 大写，应该转换为小写
      };

      const result = validator.validateOrderCreation(data);
      
      if (result.isValid && result.sanitizedData) {
        expect(result.sanitizedData.type).toBe('direct_buy');
      }
    });
  });

  describe('更新订单验证', () => {
    test('应该验证更新订单的必填ID', () => {
      const invalidData = {
        // 缺少 id 和 orderId
        status: 'confirmed'
      };

      const result = validator.validateOrderUpdate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.details?.field === 'id')).toBe(true);
    });

    test('应该验证更新订单的状态值', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'invalid_status'
      };

      const result = validator.validateOrderUpdate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.details?.field === 'status')).toBe(true);
    });
  });

  describe('查询订单验证', () => {
    test('应该验证查询参数的范围', () => {
      const invalidData = {
        page: 0, // 必须是正整数
        limit: 2000 // 超出最大值
      };

      const result = validator.validateOrderQuery(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.details?.field === 'page')).toBe(true);
      expect(result.errors.some(e => e.details?.field === 'limit')).toBe(true);
    });

    test('应该验证日期格式', () => {
      const invalidData = {
        startDate: 'invalid_date'
      };

      const result = validator.validateOrderQuery(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.details?.field === 'startDate')).toBe(true);
    });
  });

  describe('自定义约束', () => {
    test('应该支持自定义金额约束', () => {
      const customValidator = new OrderValidator({
        constraints: {
          ...DEFAULT_CONSTRAINTS,
          minAmount: 10,
          maxAmount: 1000
        }
      });

      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: ORDER_TYPES.DIRECT_BUY,
        totalAmount: 5 // 小于自定义最小值
      };

      const result = customValidator.validateOrderCreation(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e :> 
        e.message.includes('10') && e.message.includes('1000')
      )).toBe(true);
    });
  });

  describe('错误消息本地化', () => {
    test('应该返回中文错误消息', () => {
      const invalidData = {
        userId: 'invalid-uuid',
        type: 'invalid_type'
      };

      const result = validator.validateOrderCreation(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.(errors?.0 ?? null).message).toContain('userId');
      expect(result.(errors?.0 ?? null).message).toContain('UUID');
      expect(result.(errors?.0 ?? null).message).toContain('必填字段');
    });
  });

  describe('边界情况', () => {
    test('应该处理空数据', () => {
      const result = validator.validateOrderCreation({});
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('应该处理null和undefined值', () => {
      const data = {
        userId: null,
        type: undefined
      };

      const result = validator.validateOrderCreation(data);
      
      expect(result.isValid).toBe(false);
    });

    test('应该处理极值', () => {
      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: ORDER_TYPES.DIRECT_BUY,
        totalAmount: Number.MAX_SAFE_INTEGER
      };

      const result = validator.validateOrderCreation(data);
      
      expect(result.isValid).toBe(false);
    });
  });
});

describe('快捷验证函数', () => {
  test('validateOrderCreation 函数应该正常工作', () => {
    const data = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      type: ORDER_TYPES.DIRECT_BUY
    };

    const result = validateOrderCreation(data);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validateOrderUpdate 函数应该正常工作', () => {
    const data = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'confirmed'
    };

    const result = validateOrderUpdate(data);
    
    expect(result.isValid).toBe(true);
  });

  test('validateOrderQuery 函数应该正常工作', () => {
    const data = {
      page: 1,
      limit: 20
    };

    const result = validateOrderQuery(data);
    
    expect(result.isValid).toBe(true);
  });
});

describe('枚举常量', () => {
  test('应该包含所有有效的订单类型', () => {
    expect(Object.values(ORDER_TYPES)).toEqual([
      'lottery_win',
      'direct_buy', 
      'recharge',
      'resale',
      'resale_purchase'
    ]);
  });

  test('应该包含所有有效的订单状态', () => {
    expect(Object.values(ORDER_STATUSES)).toEqual([
      'pending',
      'confirmed',
      'cancelled'
    ]);
  });

  test('应该包含所有有效的支付状态', () => {
    expect(Object.values(PAYMENT_STATUSES)).toEqual([
      'pending',
      'paid',
      'failed',
      'cancelled'
    ]);
  });

  test('应该包含所有有效的履约状态', () => {
    expect(Object.values(FULFILLMENT_STATUSES)).toEqual([
      'pending',
      'processing',
      'shipped',
      'delivered',
      'completed',
      'resold'
    ]);
  });
});

describe('正则表达式验证器', () => {
  test('订单号正则应该匹配有效格式', () => {
    const regex = DEFAULT_REGEX_VALIDATORS.orderNumber;
    
    expect(regex.test('ORDER123')).toBe(true);
    expect(regex.test('ORDER_123')).toBe(true);
    expect(regex.test('ORDER123_ABC')).toBe(true);
    expect(regex.test('ORD')).toBe(false); // 太短
    expect(regex.test('ORDER-123')).toBe(false); // 包含连字符
  });

  test('金额正则应该匹配有效格式', () => {
    const regex = DEFAULT_REGEX_VALIDATORS.amount;
    
    expect(regex.test('100')).toBe(true);
    expect(regex.test('100.5')).toBe(true);
    expect(regex.test('100.55')).toBe(true);
    expect(regex.test('100.555')).toBe(false); // 超过2位小数
    expect(regex.test('100.5.5')).toBe(false); // 多个小数点
  });
});

// 性能测试
describe('性能测试', () => {
  test('大量数据验证性能', () => {
    const startTime = Date.now();
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const data = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: ORDER_TYPES.DIRECT_BUY,
        quantity: 2,
        totalAmount: 99.99
      };

      validateOrderCreation(data);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 应该在合理时间内完成（这里是500ms作为基准）
    expect(duration).toBeLessThan(500);
  });
});