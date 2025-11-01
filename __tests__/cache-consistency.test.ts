import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CacheConsistencyManager } from '@/lib/cache-consistency';
import { userService } from '@/lib/user-service';
import { prisma } from '@/lib/prisma';
import { redisClient } from '@/lib/redis-cache';
import { cacheManager } from '@/lib/cache-manager';
import { cacheKeyBuilder } from '@/lib/redis-cache';

// Mock 依赖
jest.mock('@/lib/prisma');
jest.mock('@/lib/redis-cache');
jest.mock('@/lib/cache-manager');
jest.mock('@/lib/logger');

describe('缓存一致性测试', () => {
  const mockUserId = 'test-user-id-123';
  const mockAddressId = 'test-address-id-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // 清理测试数据
    try {
      await redisClient.deletePattern('test:*');
    } catch (error) {
      console.log('清理缓存失败:', error);
    }
  });

  describe('CacheConsistencyManager', () => {
    test('应该能够进行事务性缓存更新', async () => {
      // 准备模拟数据
      const mockDbData = { id: mockUserId, name: '测试用户', balance: 100 };
      const mockCacheKey = cacheKeyBuilder.user.profile(mockUserId);
      
      // Mock Prisma事务
      (prisma.$transaction as jest.Mock).mockResolvedValue(mockDbData);
      (redisClient.delete as jest.Mock).mockResolvedValue(true);
      (redisClient.set as jest.Mock).mockResolvedValue(true);

      // 执行事务性更新
      const result = await CacheConsistencyManager.transactionalUpdate(;
        async () => mockDbData,
        [mockCacheKey],
        mockDbData
      );

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDbData);
      expect(result.cacheUpdated).toBe(true);
      expect(result.dbUpdated).toBe(true);

      // 验证调用
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(redisClient.set).toHaveBeenCalledWith(mockCacheKey, mockDbData, 300);
    });

    test('应该能够处理缓存失效+重载', async () => {
      // 准备模拟数据
      const mockData = { id: mockUserId, addresses: [] };
      const mockCacheKey = `user:addresses:${mockUserId}`;
      
      // Mock Redis操作
      (redisClient.delete as jest.Mock).mockResolvedValue(true);
      
      // Mock数据加载器
      const dataLoader = jest.fn().mockResolvedValue(mockData);

      // 执行缓存失效重载
      const result = await CacheConsistencyManager.invalidateAndReload(;
        mockCacheKey,
        dataLoader
      );

      // 验证结果
      expect(result).toEqual(mockData);
      expect(redisClient.delete).toHaveBeenCalledWith(mockCacheKey);
      expect(dataLoader).toHaveBeenCalled();
      expect(redisClient.set).toHaveBeenCalledWith(mockCacheKey, mockData, 300);
    });

    test('应该能够进行写入穿透操作', async () => {
      // 准备模拟数据
      const mockDbResult = { id: mockUserId, updated: true };
      const mockCacheKey = cacheKeyBuilder.user.profile(mockUserId);
      const mockData = { name: '更新后的用户' };
      
      // Mock操作
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback();
  }
      });
      (redisClient.set as jest.Mock).mockResolvedValue(true);

      // 执行写入穿透
      const result = await CacheConsistencyManager.writeThrough(;
        async () => mockDbResult,
        [mockCacheKey],
        mockData
      );

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.cacheUpdated).toBe(true);
      expect(result.dbUpdated).toBe(true);
    });

    test('应该能够检查缓存一致性', async () => {
      // 准备测试数据
      const cacheData = { id: mockUserId, balance: 100 };
      const dbData = { id: mockUserId, balance: 100 };
      const mockCacheKey = cacheKeyBuilder.user.balance(mockUserId);
      const mockDbQuery = jest.fn().mockResolvedValue(dbData);
      
      // Mock Redis获取
      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify({
        data: cacheData,
        expires: Date.now() + 3600000
      }));

      // 检查一致性
      const result = await CacheConsistencyManager.checkConsistency(;
        mockCacheKey,
        mockDbQuery
      );

      // 验证结果
      expect(result.consistent).toBe(true);
      expect(result.cacheData).toEqual(cacheData);
      expect(result.dbData).toEqual(dbData);
    });

    test('应该能够检测到缓存不一致', async () => {
      // 准备不一致的数据
      const cacheData = { id: mockUserId, balance: 100 };
      const dbData = { id: mockUserId, balance: 200 }; // 不一致的余额;
      const mockCacheKey = cacheKeyBuilder.user.balance(mockUserId);
      const mockDbQuery = jest.fn().mockResolvedValue(dbData);
      
      // Mock Redis获取
      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify({
        data: cacheData,
        expires: Date.now() + 3600000
      }));

      // 检查一致性
      const result = await CacheConsistencyManager.checkConsistency(;
        mockCacheKey,
        mockDbQuery
      );

      // 验证结果
      expect(result.consistent).toBe(false);
      expect(result.differences).toBeDefined();
      expect(result.differences?.balance).toEqual({
        cache: 100,
        database: 200
      });
    });

    test('应该能够修复缓存不一致', async () => {
      // 准备数据
      const correctData = { id: mockUserId, balance: 200 };
      const mockCacheKey = cacheKeyBuilder.user.balance(mockUserId);
      
      // Mock Redis操作
      (redisClient.set as jest.Mock).mockResolvedValue(true);

      // 修复缓存
      await CacheConsistencyManager.fixInconsistency(mockCacheKey, correctData);

      // 验证调用
      expect(redisClient.set).toHaveBeenCalledWith(
        mockCacheKey, 
        correctData, 
        expect.any(Number)
      );
    });
  });

  describe('UserService', () => {
    test('应该能够获取带缓存的用户档案', async () => {
      // 准备测试数据
      const mockUser = {
        id: mockUserId,
        name: '测试用户',
        balance: 100,
        freeDailyCount: 3
      };
      
      // Mock缓存未命中
      (cacheManager.users.get as jest.Mock).mockResolvedValue(null);
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (cacheManager.users.set as jest.Mock).mockResolvedValue(true);

      // 获取用户档案
      const result = await userService.getUserProfile(mockUserId);

      // 验证结果
      expect(result).toEqual(mockUser);
      expect(cacheManager.users.get).toHaveBeenCalledWith(
        cacheKeyBuilder.user.profile(mockUserId)
      );
      expect(prisma.users.findUnique).toHaveBeenCalled();
      expect(cacheManager.users.set).toHaveBeenCalled();
    });

    test('应该能够使用缓存命中返回用户档案', async () => {
      // 准备缓存命中数据
      const cachedUser = {
        id: mockUserId,
        name: '缓存用户',
        balance: 100
      };
      
      // Mock缓存命中
      (cacheManager.users.get as jest.Mock).mockResolvedValue(cachedUser);

      // 获取用户档案
      const result = await userService.getUserProfile(mockUserId);

      // 验证结果
      expect(result).toEqual(cachedUser);
      expect(cacheManager.users.get).toHaveBeenCalledWith(
        cacheKeyBuilder.user.profile(mockUserId)
      );
      // 缓存命中时不应该查询数据库
      expect(prisma.users.findUnique).not.toHaveBeenCalled();
    });

    test('应该能够事务性更新用户档案', async () => {
      // 准备测试数据
      const updates = { language: 'zh' };
      const mockResult = {
        success: true,
        data: { id: mockUserId, ...updates },
        cacheUpdated: true,
        dbUpdated: true
      };

      // Mock CacheConsistencyManager
      const mockTransactionalUpdate = jest.fn().mockResolvedValue(mockResult);
      (CacheConsistencyManager as any).transactionalUpdate = mockTransactionalUpdate;

      // Mock Prisma更新
      (prisma.users.update as jest.Mock).mockResolvedValue({
        id: mockUserId,
        ...updates
      });

      // 更新用户档案
      const result = await userService.updateUserProfile(mockUserId, updates);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.cacheUpdated).toBe(true);
      expect(mockTransactionalUpdate).toHaveBeenCalled();
    });

    test('应该能够添加用户地址并维护缓存一致性', async () => {
      // 准备测试数据
      const addressData = {
        recipientName: '测试收件人',
        recipientPhone: '1234567890',
        province: '测试省',
        city: '测试市',
        detailAddress: '测试详细地址',
        isDefault: true
      };

      const mockAddresses = [;
        { id: mockAddressId, ...addressData },
        { id: 'existing-address', recipientName: '已有地址' }
      ];

      // Mock CacheConsistencyManager
      const mockInvalidateAndReload = jest.fn().mockResolvedValue(mockAddresses);
      (CacheConsistencyManager as any).invalidateAndReload = mockInvalidateAndReload;

      // Mock Prisma操作
      (prisma.userAddresses.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.userAddresses.create as jest.Mock).mockResolvedValue((mockAddresses?.0 ?? null));
      (prisma.userAddresses.findMany as jest.Mock).mockResolvedValue(mockAddresses);

      // 添加地址
      const result = await userService.addUserAddress(mockUserId, addressData);

      // 验证结果
      expect(result).toEqual(mockAddresses);
      expect(mockInvalidateAndReload).toHaveBeenCalled();
    });

    test('应该能够检查用户缓存一致性', async () => {
      // 准备测试数据
      const mockProfile = { id: mockUserId, name: '测试用户' };
      const mockBalance = { id: mockUserId, balance: 100, balanceVersion: 1 };
      const mockAddresses = [{ id: mockAddressId, address: '测试地址' }];

      // Mock各种检查操作
      (CacheConsistencyManager as any).checkConsistency : jest.fn()
        .mockResolvedValueOnce({ consistent: true })
        .mockResolvedValueOnce({ consistent: true })
        .mockResolvedValueOnce({ consistent: true });

      // Mock用户服务方法
      (userService.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);
      (userService.getUserAddresses as jest.Mock).mockResolvedValue(mockAddresses);

      // 检查一致性
      const result = await userService.checkUserConsistency(mockUserId);

      // 验证结果
      expect(result.profile).toEqual(mockProfile);
      expect(result.balance).toEqual({
        amount: mockBalance.balance,
        version: mockBalance.balanceVersion
      });
      expect(result.addresses).toEqual(mockAddresses);
      expect(result.inconsistencies).toEqual([]);
    });
  });

  describe('缓存失效策略', () => {
    test('应该能够基于数据库变更自动失效缓存', async () => {
      // 测试用户表更新时的缓存失效
      await CacheConsistencyManager.onDatabaseChange('users', mockUserId, 'update');

      // 验证调用了缓存失效
      expect(redisClient.delete).toHaveBeenCalledWith(
        cacheKeyBuilder.user.profile(mockUserId)
      );
      expect(redisClient.delete).toHaveBeenCalledWith(
        cacheKeyBuilder.user.balance(mockUserId)
      );
    });

    test('应该能够批量失效匹配模式的缓存', async () => {
      // 准备测试模式
      const pattern = 'products:list:*';
      const mockKeys = ['products:list:1', 'products:list:2'];
      
      // Mock Redis模式匹配
      (redisClient.keys as jest.Mock).mockResolvedValue(mockKeys);
      (redisClient.delete as jest.Mock).mockResolvedValue(mockKeys.length);
      (cacheManager.users.deletePattern as jest.Mock).mockReturnValue(0);

      // 执行模式匹配失效
      const count = await CacheConsistencyManager.invalidateByPattern(pattern);

      // 验证结果
      expect(count).toBe(mockKeys.length);
      expect(redisClient.keys).toHaveBeenCalledWith(pattern);
    });
  });

  describe('错误处理', () => {
    test('应该在数据库操作失败时回滚缓存更新', async () => {
      // 模拟数据库操作失败
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('数据库错误'));

      // 尝试事务性更新
      const result = await CacheConsistencyManager.transactionalUpdate(;
        async () => { throw new Error('数据库错误'); },
        ['test:key'],
        { data: 'test' }
      );

      // 验证失败结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('数据库错误');
      expect(result.cacheUpdated).toBe(false);
      expect(result.dbUpdated).toBe(false);
    });

    test('应该在缓存操作失败时继续使用数据库数据', async () => {
      // 模拟缓存操作失败
      (redisClient.get as jest.Mock).mockRejectedValue(new Error('缓存错误'));
      
      // Mock数据库操作正常
      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        name: '数据库用户'
      });

      // 获取用户档案
      const result = await userService.getUserProfile(mockUserId);

      // 验证仍然返回数据库数据
      expect(result).toBeDefined();
      expect(result.name).toBe('数据库用户');
    });
  });

  describe('性能测试', () => {
    test('应该能够批量更新缓存', async () => {
      // 准备批量数据
      const keys = ['key1', 'key2', 'key3'];
      const data = { value: 'test' };
      const ttl = 300;

      // Mock批量操作
      (redisClient.setMany as jest.Mock).mockResolvedValue(true);
      (cacheManager.users.setMany as jest.Mock).mockReturnValue(Promise.resolve());

      // 执行批量更新
      await CacheConsistencyManager.updateCache(keys, data, ttl);

      // 验证调用
      expect(redisClient.setMany).toHaveBeenCalledWith(
        keys.map(key => ({
          key,
          data,
          ttlSeconds: ttl
        }))
      );
    });

    test('应该能够批量删除缓存', async () => {
      // 准备测试数据
      const keys = ['key1', 'key2', 'key3'];

      // Mock批量删除
      (redisClient.delete as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      // 执行批量删除
      await CacheConsistencyManager.invalidateCache(keys);

      // 验证调用
      expect(redisClient.delete).toHaveBeenCalledTimes(keys.length);
    });
  });
});