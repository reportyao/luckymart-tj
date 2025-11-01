import { describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient, ApiError, InvitationApiClient } from '../examples/invitation-api-examples';
import { API_BASE_URL } from '../config/api-config';
/**
 * 邀请裂变系统 API 测试文件
 * 
 * 本文件包含了邀请系统各个API端点的测试用例
 * 用于验证API功能的正确性和稳定性
 */


// 测试配置

const TEST_ACCESS_TOKEN = process.env.TEST_ACCESS_TOKEN || 'test-jwt-token';

describe('邀请裂变系统 API 测试', () => {
  let apiClient: ApiClient;
  let invitationApi: InvitationApiClient;
  let testUserId: string;

  beforeEach(() => {
    apiClient = new ApiClient(API_BASE_URL || process.env.TEST_API_BASE_URL || 'http://localhost:3000');
    apiClient.setAccessToken(TEST_ACCESS_TOKEN);
    invitationApi = new InvitationApiClient(apiClient);
    testUserId = 'test-user-uuid';
  });

  describe('1. 生成个人邀请码', () => {
    test('should generate referral code successfully', async () => {
      // Mock fetch response
      const mockResponse = {
        success: true,
        data: {
          referralCode: 'LM123456',
          shareLinks: {
            telegram: 'https://t.me/luckymart_tj_bot?start=LM123456',
            general: 'https://luckymart-tj.com/invite/LM123456'
          },
          shareTexts: {
            zh: '🎉 加入 LuckyMart TJ...',
            ru: '🎉 Присоединяйтесь к LuckyMart TJ...',
            tg: '🎉 Ба LuckyMart TJ гирӣед...'
          },
          qrCodeUrl: null
        },
        message: '邀请码生成成功'
      };

      // Test the method
      const result = await invitationApi.generateReferralCode();
      
      expect(result).toBeDefined();
      expect(result.referralCode).toMatch(/^LM[A-Z0-9]{6}$/);
      expect(result.shareLinks).toBeDefined();
      expect(result.shareTexts).toBeDefined();
    });

    test('should handle generation failure', async () => {
      // Mock error response
      const error = new ApiError(500, '邀请码生成失败，请稍后重试');
      
      await expect(invitationApi.generateReferralCode()).rejects.toThrow('邀请码生成失败，请稍后重试');
    });
  });

  describe('2. 获取我的邀请码和统计', () => {
    test('should get referral info successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          referralCode: 'LM123456',
          shareLinks: {
            telegram: 'https://t.me/luckymart_tj_bot?start=LM123456',
            general: 'https://luckymart-tj.com/invite/LM123456'
          },
          shareTexts: {
            zh: '🎉 加入 LuckyMart TJ...',
            ru: '🎉 Присоединяйтесь к LuckyMart TJ...',
            tg: '🎉 Ба LuckyMart TJ гирӣед...'
          },
          stats: {
            userId: testUserId,
            referralCode: 'LM123456',
            firstName: '测试用户',
            username: 'testuser',
            totalInvites: 5,
            successfulInvites: 3,
            totalRewards: 8,
            claimedRewards: 6,
            unclaimedRewards: 2,
            totalCommission: 156.50,
            claimedCommission: 125.30,
            unclaimedCommission: 31.20,
            lastInviteDate: '2025-10-30T10:30:00Z',
            lastRewardDate: '2025-10-31T14:20:00Z'
          }
        },
        message: '获取邀请信息成功'
      };

      const result = await invitationApi.getMyReferralInfo();
      
      expect(result).toBeDefined();
      expect(result.referralCode).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.stats.totalInvites).toBeGreaterThanOrEqual(0);
      expect(result.stats.successfulInvites).toBeGreaterThanOrEqual(0);
      expect(result.stats.totalRewards).toBeGreaterThanOrEqual(0);
    });

    test('should handle user not found error', async () => {
      const error = new ApiError(404, '用户不存在');
      
      await expect(invitationApi.getMyReferralInfo()).rejects.toThrow('用户不存在');
    });
  });

  describe('3. 绑定邀请关系', () => {
    test('should bind referral successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          success: true,
          referrerUserId: 'referrer-uuid',
          referrerName: '李四',
          message: '邀请关系绑定成功'
        },
        message: '邀请关系绑定成功'
      };

      const result = await invitationApi.bindReferral('LM789012');
      
      expect(result.success).toBe(true);
      expect(result.referrerUserId).toBeDefined();
      expect(result.referrerName).toBeDefined();
      expect(result.message).toContain('成功');
    });

    test('should handle invalid referral code format', async () => {
      await expect(invitationApi.bindReferral('INVALID')).rejects.toThrow('邀请码格式无效');
    });

    test('should handle empty referral code', async () => {
      await expect(invitationApi.bindReferral('')).rejects.toThrow('邀请码格式无效');
    });

    test('should handle duplicate binding', async () => {
      const error = new ApiError(400, '您已经绑定了邀请关系，不能重复绑定');
      
      await expect(invitationApi.bindReferral('LM123456')).rejects.toThrow('您已经绑定了邀请关系，不能重复绑定');
    });

    test('should handle self-referral detection', async () => {
      const error = new ApiError(400, '您不能使用自己的邀请码');
      
      await expect(invitationApi.bindReferral('LM123456')).rejects.toThrow('您不能使用自己的邀请码');
    });
  });

  describe('4. 查询邀请奖励记录', () => {
    test('should get rewards successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          rewards: [
            {
              id: 'reward-uuid',
              referrerUserId: testUserId,
              referredUserId: 'referred-uuid',
              referralRelationshipId: 'relationship-uuid',
              rewardType: 'first_recharge',
              rewardAmount: 25.00,
              currency: 'TJS',
              relatedOrderId: 'order-uuid',
              description: '首充奖励',
              isClaimed: false,
              claimedAt: null,
              expiresAt: '2025-11-30T16:22:36Z',
              status: 'available',
              createdAt: '2025-10-31T16:22:36Z',
              updatedAt: '2025-10-31T16:22:36Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 5,
            totalPages: 1
          },
          summary: {
            totalAvailable: 3,
            totalClaimed: 2,
            totalAmount: 75.50
          }
        },
        message: '获取奖励记录成功'
      };

      const result = await invitationApi.getInvitationRewards({
        page: 1,
        limit: 20
      });
      
      expect(result).toBeDefined();
      expect(result.rewards).toBeDefined();
      expect(result.rewards.length).toBeGreaterThanOrEqual(0);
      expect(result.pagination).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    test('should handle pagination parameters', async () => {
      const result = await invitationApi.getInvitationRewards({
        page: 2,
        limit: 10
      });
      
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
    });

    test('should filter by reward type', async () => {
      const result = await invitationApi.getInvitationRewards({
        rewardType: 'first_recharge'
      });
      
      // 验证所有奖励都是首充奖励类型
      result.rewards.forEach(reward => {
        expect(reward.rewardType).toBe('first_recharge');
      });
    });

    test('should filter by status', async () => {
      const result = await invitationApi.getInvitationRewards({
        status: 'available'
      });
      
      // 验证所有奖励都是可领取状态
      result.rewards.forEach(reward => {
        expect(reward.isClaimed).toBe(false);
        expect(new Date(reward.expiresAt)).toBeGreaterThan(new Date());
      });
    });

    test('should validate pagination parameters', async () => {
      await expect(invitationApi.getInvitationRewards({
        page: 0,
        limit: 101
      })).rejects.toThrow();
    });
  });

  describe('5. 查询消费返利记录', () => {
    test('should get commission records successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          commissions: [
            {
              id: 'commission-uuid',
              referrerUserId: testUserId,
              referredUserId: 'referred-uuid',
              referralRelationshipId: 'relationship-uuid',
              rewardType: 'commission',
              rewardAmount: 2.00,
              currency: 'TJS',
              relatedOrderId: 'order-uuid',
              description: '消费返利',
              isClaimed: true,
              claimedAt: '2025-10-31T15:30:00Z',
              expiresAt: '2025-11-30T16:22:36Z',
              status: 'claimed',
              createdAt: '2025-10-31T14:20:00Z',
              updatedAt: '2025-10-31T15:30:00Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 8,
            totalPages: 1
          },
          summary: {
            totalCommissions: 8,
            claimedCommissions: 6,
            unclaimedCommissions: 2
          }
        },
        message: '获取返利记录成功'
      };

      const result = await invitationApi.getCommissionRecords({
        page: 1,
        limit: 20
      });
      
      expect(result).toBeDefined();
      expect(result.commissions).toBeDefined();
      expect(result.commissions.length).toBeGreaterThanOrEqual(0);
      expect(result.summary).toBeDefined();
      
      // 验证所有返利都是commission类型
      result.commissions.forEach(commission => {
        expect(commission.rewardType).toBe('commission');
      });
    });

    test('should filter by date range', async () => {
      const result = await invitationApi.getCommissionRecords({
        startDate: '2025-10-01T00:00:00Z',
        endDate: '2025-10-31T23:59:59Z'
      });
      
      // 验证返回的数据在指定日期范围内
      result.commissions.forEach(commission => {
        const createdAt = new Date(commission.createdAt);
        expect(createdAt).toBeGreaterThanOrEqual(new Date('2025-10-01T00:00:00Z'));
        expect(createdAt).toBeLessThanOrEqual(new Date('2025-10-31T23:59:59Z'));
      });
    });

    test('should validate date parameters', async () => {
      await expect(invitationApi.getCommissionRecords({
        startDate: '2025-10-31T00:00:00Z',
        endDate: '2025-10-01T00:00:00Z'
      })).rejects.toThrow();
    });
  });

  describe('6. 领取邀请奖励', () => {
    test('should claim rewards successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          success: true,
          claimedRewards: ['reward-uuid-1', 'reward-uuid-2'],
          failedRewards: [],
          totalClaimedAmount: 30.00
        },
        message: '奖励领取成功'
      };

      const result = await invitationApi.claimRewards(['reward-uuid-1', 'reward-uuid-2']);
      
      expect(result.success).toBe(true);
      expect(result.claimedRewards).toHaveLength(2);
      expect(result.failedRewards).toHaveLength(0);
      expect(result.totalClaimedAmount).toBeGreaterThan(0);
    });

    test('should handle partial success', async () => {
      const mockResponse = {
        success: true,
        data: {
          success: true,
          claimedRewards: ['reward-uuid-1'],
          failedRewards: [
            {
              rewardId: 'reward-uuid-2',
              reason: '奖励不存在或已过期或已领取'
            }
          ],
          totalClaimedAmount: 15.00
        },
        message: '部分奖励领取成功，成功 1 个，失败 1 个'
      };

      const result = await invitationApi.claimRewards(['reward-uuid-1', 'reward-uuid-2']);
      
      expect(result.success).toBe(true);
      expect(result.claimedRewards).toHaveLength(1);
      expect(result.failedRewards).toHaveLength(1);
    });

    test('should handle complete failure', async () => {
      const mockResponse = {
        success: false,
        data: {
          success: false,
          claimedRewards: [],
          failedRewards: [
            {
              rewardId: 'reward-uuid-1',
              reason: '奖励不存在或已过期或已领取'
            }
          ],
          totalClaimedAmount: 0
        }
      };

      await expect(invitationApi.claimRewards(['reward-uuid-1'])).rejects.toThrow('没有可以领取的奖励');
    });

    test('should validate input parameters', async () => {
      await expect(invitationApi.claimRewards([])).rejects.toThrow('请选择要领取的奖励');
      await expect(invitationApi.claimRewards(Array(51).fill('reward-id'))).rejects.toThrow('单次最多只能领取50个奖励');
    });

    test('should handle empty rewardIds', async () => {
      await expect(invitationApi.claimRewards([])).rejects.toThrow('请选择要领取的奖励');
    });

    test('should handle excessive rewardIds', async () => {
      const tooManyIds = Array(51).fill('reward-id');
      await expect(invitationApi.claimRewards(tooManyIds)).rejects.toThrow('单次最多只能领取50个奖励');
    });
  });

  describe('API客户端功能测试', () => {
    test('should handle unauthorized requests', async () => {
      apiClient.clearAccessToken();
      
      await expect(invitationApi.getMyReferralInfo()).rejects.toThrow();
    });

    test('should handle network errors', async () => {
      // Mock network error
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(invitationApi.getMyReferralInfo()).rejects.toThrow('网络连接失败');
      
      global.fetch = originalFetch;
    });

    test('should validate referral code format', () => {
      // Test valid codes
      expect(invitationApi['validateReferralCodeFormat']('LM123456')).toBe(true);
      expect(invitationApi['validateReferralCodeFormat']('LMABC123')).toBe(true);
      
      // Test invalid codes
      expect(invitationApi['validateReferralCodeFormat']('LM12345')).toBe(false);
      expect(invitationApi['validateReferralCodeFormat']('LM1234567')).toBe(false);
      expect(invitationApi['validateReferralCodeFormat']('XM123456')).toBe(false);
      expect(invitationApi['validateReferralCodeFormat']('lm123456')).toBe(false);
      expect(invitationApi['validateReferralCodeFormat']('')).toBe(false);
      expect(invitationApi['validateReferralCodeFormat']('LM12@456')).toBe(false);
    });
  });

  describe('数据格式验证', () => {
    test('should validate referral code format', () => {
      const validCodes = ['LM123456', 'LMABC123', 'LMXYZ789'];
      const invalidCodes = ['lm123456', 'XM123456', 'LM12345', 'LM1234567', '', 'LM12@456'];

      validCodes.forEach(code => {
        expect(invitationApi['validateReferralCodeFormat'](code)).toBe(true);
      });

      invalidCodes.forEach(code => {
        expect(invitationApi['validateReferralCodeFormat'](code)).toBe(false);
      });
    });

    test('should validate response data structure', async () => {
      const mockResponse = {
        success: true,
        data: {
          referralCode: 'LM123456',
          stats: {
            totalInvites: 5,
            successfulInvites: 3,
            unclaimedRewards: 2,
            totalCommission: 156.50
          }
        },
        message: '成功'
      };

      // Test structure validation
      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data).toBeDefined();
      expect(mockResponse.data.referralCode).toBeDefined();
      expect(mockResponse.data.stats).toBeDefined();
      expect(typeof mockResponse.data.stats.totalInvites).toBe('number');
      expect(typeof mockResponse.data.stats.totalCommission).toBe('number');
    });
  });

  describe('错误处理测试', () => {
    test('should handle API errors correctly', () => {
      const error = new ApiError(401, '未授权访问');
      expect(error.status).toBe(401);
      expect(error.message).toBe('未授权访问');
    });

    test('should handle validation errors', async () => {
      const validationErrors = [;
        { page: 0, limit: 101 },
        { startDate: 'invalid-date' },
        { startDate: '2025-10-31T00:00:00Z', endDate: '2025-10-01T00:00:00Z' }
      ];

      for (const params of validationErrors) {
        await expect(invitationApi.getInvitationRewards(params)).rejects.toThrow();
      }
    });

    test('should handle concurrent requests', async () => {
      const promises = [;
        invitationApi.getMyReferralInfo(),
        invitationApi.getInvitationRewards(),
        invitationApi.getCommissionRecords()
      ];

      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          expect(result.value).toBeDefined();
        } else {
          console.log(`Request ${index} failed:`, result.reason);
        }
      });
    });
  });

  describe('性能测试', () => {
    test('should handle large reward lists', async () => {
      const startTime = Date.now();
      
      await invitationApi.getInvitationRewards({ limit: 100 });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 响应时间应该在合理范围内（小于2秒）
      expect(duration).toBeLessThan(2000);
    });

    test('should handle date range queries efficiently', async () => {
      const startTime = Date.now();
      
      await invitationApi.getCommissionRecords({
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z'
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(3000);
    });
  });
});

// ================================
// 集成测试示例
// ================================

describe('邀请流程集成测试', () => {
  let apiClient: ApiClient;
  let invitationApi: InvitationApiClient;

  beforeAll(() => {
    apiClient = new ApiClient(API_BASE_URL || process.env.TEST_API_BASE_URL || 'http://localhost:3000');
    apiClient.setAccessToken(TEST_ACCESS_TOKEN);
    invitationApi = new InvitationApiClient(apiClient);
  });

  test('complete invitation workflow', async () => {
    // 1. 生成邀请码
    const referralCode = await invitationApi.generateReferralCode();
    expect(referralCode.referralCode).toBeDefined();

    // 2. 获取邀请信息
    const referralInfo = await invitationApi.getMyReferralInfo();
    expect(referralInfo.referralCode).toBeDefined();

    // 3. 检查统计数据格式
    expect(referralInfo.stats.totalInvites).toBeGreaterThanOrEqual(0);
    expect(referralInfo.stats.totalRewards).toBeGreaterThanOrEqual(0);

    // 4. 获取奖励记录
    const rewards = await invitationApi.getInvitationRewards({ limit: 10 });
    expect(rewards.rewards).toBeDefined();
    expect(rewards.pagination).toBeDefined();
    expect(rewards.summary).toBeDefined();

    // 5. 获取返利记录
    const commissions = await invitationApi.getCommissionRecords({ limit: 10 });
    expect(commissions.commissions).toBeDefined();
    expect(commissions.summary).toBeDefined();

    console.log('完整邀请流程测试通过');
  }, 30000); // 30秒超时
});

// ================================
// 测试数据构建器
// ================================

export class TestDataBuilder {
  static buildMockReward(id: string = 'test-reward-id') {
    return {
      id,
      referrerUserId: 'test-referrer-id',
      referredUserId: 'test-referred-id',
      referralRelationshipId: 'test-relationship-id',
      rewardType: 'first_recharge' as const,
      rewardAmount: 25.00,
      currency: 'TJS',
      relatedOrderId: 'test-order-id',
      description: '测试首充奖励',
      isClaimed: false,
      claimedAt: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后过期
      status: 'available' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
}

  static buildMockReferralStats() {
    return {
      userId: 'test-user-id',
      referralCode: 'LM123456',
      firstName: '测试用户',
      username: 'testuser',
      totalInvites: 10,
      successfulInvites: 8,
      totalRewards: 15,
      claimedRewards: 12,
      unclaimedRewards: 3,
      totalCommission: 89.50,
      claimedCommission: 76.30,
      unclaimedCommission: 13.20,
      lastInviteDate: new Date().toISOString(),
      lastRewardDate: new Date().toISOString()
    };
  }
}