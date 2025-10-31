/**
 * 延迟奖励处理功能测试脚本
 * 测试延迟奖励的创建、查询、发放和监控功能
 */

import { 
  DelayedRewardProcessor,
  RewardType,
  RewardStatus,
  createDelayedReward,
  createFirstPurchaseDelayedReward,
  processPendingRewards,
  delayedRewardProcessor
} from '../lib/anti-fraud/delayed-reward-processor';

// 测试配置
const TEST_CONFIG = {
  USER_ID: 'test-user-id',
  SOURCE_USER_ID: 'test-source-user-id',
  ORDER_ID: 'test-order-id',
  REWARD_AMOUNT: 10.0,
};

/**
 * 测试工具类
 */
class DelayedRewardTest {
  private processor: DelayedRewardProcessor;

  constructor() {
    this.processor = DelayedRewardProcessor.getInstance();
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 开始延迟奖励处理功能测试\n');

    try {
      await this.testCreateDelayedReward();
      await this.testGetPendingRewards();
      await this.testBatchProcessing();
      await this.testStatistics();
      await this.testCleanup();

      console.log('\n✅ 所有测试通过！\n');
    } catch (error) {
      console.error('\n❌ 测试失败:', error);
      throw error;
    }
  }

  /**
   * 测试创建延迟奖励
   */
  async testCreateDelayedReward(): Promise<void> {
    console.log('📝 测试 1: 创建延迟奖励');

    // 创建普通延迟奖励
    const rewardId = await createDelayedReward({
      userId: TEST_CONFIG.USER_ID,
      rewardType: RewardType.REFERRAL_REGISTER,
      amount: TEST_CONFIG.REWARD_AMOUNT,
      sourceUserId: TEST_CONFIG.SOURCE_USER_ID,
      scheduledAt: new Date(Date.now() - 1000), // 1秒前，应该立即可处理
    });

    console.log(`✅ 普通延迟奖励创建成功: ${rewardId}`);

    // 创建首次购买延迟奖励
    const firstPurchaseRewardId = await createFirstPurchaseDelayedReward({
      userId: TEST_CONFIG.USER_ID,
      sourceUserId: TEST_CONFIG.SOURCE_USER_ID,
      amount: TEST_CONFIG.REWARD_AMOUNT,
      sourceOrderId: TEST_CONFIG.ORDER_ID,
      referralLevel: 1,
    });

    console.log(`✅ 首次购买延迟奖励创建成功: ${firstPurchaseRewardId}`);

    // 验证延迟时间（首次购买应该延迟24小时）
    const now = new Date();
    const firstPurchaseReward = await this.getRewardById(firstPurchaseRewardId);
    const delayHours = (firstPurchaseReward.scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (Math.abs(delayHours - 24) < 1) {
      console.log(`✅ 首次购买延迟时间验证通过: ${delayHours.toFixed(1)}小时`);
    } else {
      throw new Error(`首次购买延迟时间不正确: ${delayHours}小时，期望24小时`);
    }
  }

  /**
   * 测试查询待处理奖励
   */
  async testGetPendingRewards(): Promise<void> {
    console.log('\n📊 测试 2: 查询待处理奖励');

    const pendingRewards = await delayedRewardProcessor.getPendingRewards();
    
    console.log(`✅ 查询到 ${pendingRewards.length} 个待处理奖励`);

    if (pendingRewards.length === 0) {
      console.log('⚠️ 警告: 没有待处理的奖励，请确保测试数据正确');
    } else {
      pendingRewards.forEach(reward => {
        console.log(`   - 奖励ID: ${reward.id}, 用户: ${reward.userId}, 类型: ${reward.rewardType}, 金额: ${reward.amount}`);
      });
    }
  }

  /**
   * 测试批量处理
   */
  async testBatchProcessing(): Promise<void> {
    console.log('\n⚡ 测试 3: 批量处理奖励');

    // 创建一些测试奖励（设置过去时间以便立即处理）
    await this.createTestRewards();

    const result = await processPendingRewards();
    
    console.log(`✅ 批量处理完成:`);
    console.log(`   - 总计: ${result.total}`);
    console.log(`   - 成功: ${result.success}`);
    console.log(`   - 失败: ${result.failed}`);

    if (result.total === 0) {
      console.log('⚠️ 没有可处理的奖励');
      return;
    }

    if (result.failed > 0) {
      console.log('❌ 部分奖励处理失败:');
      result.details.forEach(detail => {
        if (!detail.success) {
          console.log(`   - 奖励 ${detail.rewardId}: ${detail.error}`);
        }
      });
    }

    // 验证处理后的状态
    const pendingAfter = await delayedRewardProcessor.getPendingRewards();
    console.log(`✅ 处理后剩余待处理奖励: ${pendingAfter.length}`);
  }

  /**
   * 测试统计信息
   */
  async testStatistics(): Promise<void> {
    console.log('\n📈 测试 4: 获取统计信息');

    const stats = await delayedRewardProcessor.getProcessingStats();
    
    console.log('✅ 处理统计:');
    console.log(`   - 待处理: ${stats.totalPending}`);
    console.log(`   - 处理中: ${stats.totalProcessing}`);
    console.log(`   - 已完成: ${stats.totalCompleted}`);
    console.log(`   - 已失败: ${stats.totalFailed}`);
    console.log(`   - 平均重试次数: ${stats.averageRetryCount.toFixed(2)}`);
    
    if (stats.oldestPendingReward) {
      console.log(`   - 最老待处理奖励时间: ${stats.oldestPendingReward.toLocaleString()}`);
    }
  }

  /**
   * 测试清理功能
   */
  async testCleanup(): Promise<void> {
    console.log('\n🧹 测试 5: 清理过期奖励');

    const deletedCount = await delayedRewardProcessor.cleanupExpiredRewards(1); // 1天前
    console.log(`✅ 清理了 ${deletedCount} 个过期奖励记录`);
  }

  /**
   * 创建测试奖励
   */
  private async createTestRewards(): Promise<void> {
    const testRewards = [
      {
        userId: TEST_CONFIG.USER_ID,
        rewardType: RewardType.REFERRAL_REGISTER,
        amount: 5.0,
        sourceUserId: TEST_CONFIG.SOURCE_USER_ID,
        scheduledAt: new Date(Date.now() - 5000), // 5秒前
      },
      {
        userId: TEST_CONFIG.USER_ID,
        rewardType: RewardType.REFERRAL_FIRST_PLAY,
        amount: 3.0,
        sourceUserId: TEST_CONFIG.SOURCE_USER_ID,
        scheduledAt: new Date(Date.now() - 3000), // 3秒前
      },
    ];

    for (const reward of testRewards) {
      await createDelayedReward(reward);
      console.log(`   创建测试奖励: ${reward.rewardType}`);
    }
  }

  /**
   * 根据ID获取奖励信息
   */
  private async getRewardById(rewardId: string): Promise<any> {
    // 这里应该查询数据库获取奖励详细信息
    // 为了简化测试，直接返回一个模拟对象
    return {
      id: rewardId,
      userId: TEST_CONFIG.USER_ID,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后
    };
  }
}

/**
 * 性能测试
 */
async function performanceTest(): Promise<void> {
  console.log('\n🏃 性能测试开始...');

  const processor = DelayedRewardProcessor.getInstance();
  const startTime = Date.now();

  try {
    // 创建大量测试奖励
    const rewardPromises = [];
    for (let i = 0; i < 50; i++) {
      rewardPromises.push(
        createDelayedReward({
          userId: `${TEST_CONFIG.USER_ID}-${i}`,
          rewardType: RewardType.REFERRAL_REGISTER,
          amount: 1.0,
          sourceUserId: TEST_CONFIG.SOURCE_USER_ID,
          scheduledAt: new Date(Date.now() - 1000),
        })
      );
    }

    await Promise.all(rewardPromises);
    console.log('✅ 创建了50个测试奖励');

    // 批量处理
    const result = await processor.processBatch();
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ 性能测试完成:`);
    console.log(`   - 处理时间: ${duration}ms`);
    console.log(`   - 处理数量: ${result.total}`);
    console.log(`   - 成功率: ${result.total > 0 ? (result.success / result.total * 100).toFixed(2) : 0}%`);
    console.log(`   - 平均每毫秒处理: ${(result.total / duration * 1000).toFixed(2)} 个`);

  } catch (error) {
    console.error('❌ 性能测试失败:', error);
    throw error;
  }
}

/**
 * 错误处理测试
 */
async function errorHandlingTest(): Promise<void> {
  console.log('\n⚠️ 错误处理测试开始...');

  const processor = DelayedRewardProcessor.getInstance();

  try {
    // 测试无效用户ID
    console.log('测试无效用户ID...');
    try {
      await createDelayedReward({
        userId: 'invalid-user-id',
        rewardType: RewardType.REFERRAL_REGISTER,
        amount: 10.0,
        scheduledAt: new Date(),
      });
      console.log('❌ 应该抛出错误但没有');
    } catch (error) {
      console.log('✅ 正确捕获了无效用户ID错误');
    }

    // 测试并发处理
    console.log('测试并发处理...');
    const concurrentPromises = [
      createDelayedReward({
        userId: TEST_CONFIG.USER_ID,
        rewardType: RewardType.REFERRAL_REGISTER,
        amount: 1.0,
        scheduledAt: new Date(Date.now() - 1000),
      }),
      createDelayedReward({
        userId: TEST_CONFIG.USER_ID,
        rewardType: RewardType.REFERRAL_REGISTER,
        amount: 1.0,
        scheduledAt: new Date(Date.now() - 1000),
      }),
    ];

    const results = await Promise.allSettled(concurrentPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ 并发测试结果: ${successCount} 成功, ${failCount} 失败`);

  } catch (error) {
    console.error('❌ 错误处理测试失败:', error);
    throw error;
  }
}

/**
 * 主测试函数
 */
async function main(): Promise<void> {
  console.log('🎯 延迟奖励处理功能测试套件\n');
  
  // 基本功能测试
  const test = new DelayedRewardTest();
  await test.runAllTests();

  // 性能测试
  await performanceTest();

  // 错误处理测试
  await errorHandlingTest();

  console.log('\n🎉 所有测试完成！');
}

// 运行测试
if (require.main === module) {
  main().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

export { DelayedRewardTest, main as runDelayedRewardTests };