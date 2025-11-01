import { UserInfoService } from './services/user-info-service';
import { Telegraf } from 'telegraf';
#!/usr/bin/env node

/**
 * 用户信息获取服务测试脚本
 * 测试所有用户信息相关功能
 */


// 模拟测试用户ID（替换为实际的Telegram用户ID进行测试）
const TEST_USER_ID = '123456789'; // 示例ID;
const TEST_USER_IDS = ['123456789', '987654321', '555666777']; // 批量测试ID;

class UserInfoServiceTester {
  private bot: Telegraf;
  private userInfoService: UserInfoService;

  constructor() {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN环境变量未设置');
    }

    this.bot = new Telegraf(BOT_TOKEN);
    this.userInfoService = UserInfoService.getInstance(this.bot);
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 开始用户信息获取服务测试...\n');

    try {
      await this.testGetUserInfo();
      await this.testGetUserChat();
      await this.testValidateUser();
      await this.testGetUserStatus();
      await this.testBatchGetUserInfo();
      await this.testServiceStats();
      await this.testCacheManagement();
      
      console.log('\n✅ 所有测试完成！');
  }
    } catch (error) {
      console.error('\n❌ 测试失败:', error);
      throw error;
    }
  }

  /**
   * 测试获取用户信息功能
   */
  private async testGetUserInfo(): Promise<void> {
    console.log('📊 测试获取用户信息功能...');
    
    try {
      const userInfo = await this.userInfoService.getUserInfo(TEST_USER_ID);
      
      if (userInfo) {
        console.log('✅ 获取用户信息成功:');
  }
        console.log(`   - Telegram ID: ${userInfo.telegramId}`);
        console.log(`   - 用户名: ${userInfo.username || '未设置'}`);
        console.log(`   - 姓名: ${userInfo.firstName}`);
        console.log(`   - 余额: ${userInfo.balance} 夺宝币`);
        console.log(`   - VIP等级: ${userInfo.vipLevel}`);
        console.log(`   - 语言: ${userInfo.language}`);
      } else {
        console.log('⚠️  用户信息未找到（这可能是正常的，如果用户尚未注册）');
      }
    } catch (error) {
      console.log('❌ 获取用户信息失败:', (error as Error).message);
    }
    
    console.log('');
  }

  /**
   * 测试获取用户聊天状态功能
   */
  private async testGetUserChat(): Promise<void> {
    console.log('💬 测试获取用户聊天状态功能...');
    
    try {
      const chatInfo = await this.userInfoService.getUserChat(TEST_USER_ID);
      
      if (chatInfo) {
        console.log('✅ 获取聊天状态成功:');
        console.log(`   - 聊天类型: ${chatInfo.status}`);
        console.log(`   - 可以发送消息: ${chatInfo.canSendMessages}`);
        console.log(`   - 可以发送媒体: ${chatInfo.canSendMedia}`);
        console.log(`   - 消息数量: ${chatInfo.messageCount}`);
        console.log(`   - 最后活跃时间: ${chatInfo.lastActivity || '未知'}`);
      } else {
        console.log('⚠️  聊天状态未找到');
      }
    } catch (error) {
      console.log('❌ 获取聊天状态失败:', (error as Error).message);
    }
    
    console.log('');
  }

  /**
   * 测试验证用户功能
   */
  private async testValidateUser(): Promise<void> {
    console.log('🔍 测试验证用户功能...');
    
    try {
      const validation = await this.userInfoService.validateUser(TEST_USER_ID);
      
      console.log('✅ 用户验证结果:');
      console.log(`   - 是否有效: ${validation.isValid}`);
      console.log(`   - 是否存在: ${validation.exists}`);
      console.log(`   - 是否新用户: ${validation.isNewUser || false}`);
      console.log(`   - 是否VIP用户: ${validation.isVipUser || false}`);
      console.log(`   - 是否非活跃: ${validation.isInactive || false}`);
      
      if (validation.errors.length > 0) {
        console.log('   - 错误:');
        validation.errors.forEach(error => console.log(`     • ${error}`));
      }
      
      if (validation.warnings && validation.warnings.length > 0) {
        console.log('   - 警告:');
        validation.warnings.forEach(warning => console.log(`     • ${warning}`));
      }
    } catch (error) {
      console.log('❌ 用户验证失败:', (error as Error).message);
    }
    
    console.log('');
  }

  /**
   * 测试获取用户状态功能
   */
  private async testGetUserStatus(): Promise<void> {
    console.log('📈 测试获取用户状态功能...');
    
    try {
      const userStatus = await this.userInfoService.getUserStatus(TEST_USER_ID);
      
      console.log('✅ 用户状态信息:');
      console.log(`   - 状态: ${userStatus.status}`);
      console.log(`   - 是否活跃: ${userStatus.isActive}`);
      console.log(`   - 活跃程度: ${userStatus.activityLevel}`);
      console.log(`   - 参与度评分: ${userStatus.engagementScore}/100`);
      console.log(`   - 注册天数: ${userStatus.daysSinceRegistration}天`);
      console.log(`   - 最后活跃: ${userStatus.daysSinceLastActivity}天前`);
      console.log(`   - 当前余额: ${userStatus.balance} 夺宝币`);
      console.log(`   - 总消费: ${userStatus.totalSpent} TJS`);
      console.log(`   - VIP等级: ${userStatus.vipLevel}`);
    } catch (error) {
      console.log('❌ 获取用户状态失败:', (error as Error).message);
    }
    
    console.log('');
  }

  /**
   * 测试批量获取用户信息功能
   */
  private async testBatchGetUserInfo(): Promise<void> {
    console.log('📦 测试批量获取用户信息功能...');
    
    try {
      const batchResult = await this.userInfoService.batchGetUserInfo(TEST_USER_IDS);
      
      console.log('✅ 批量获取结果:');
      console.log(`   - 请求总数: ${batchResult.totalRequested}`);
      console.log(`   - 成功获取: ${batchResult.success.length}`);
      console.log(`   - 失败数量: ${batchResult.failed.length}`);
      console.log(`   - 缓存命中: ${batchResult.cacheHits}`);
      
      if (batchResult.success.length > 0) {
        console.log('   - 成功用户列表:');
        batchResult.success.forEach(user => {
          console.log(`     • ${user.telegramId} (${user.firstName})`);
  }
        });
      }
      
      if (batchResult.failed.length > 0) {
        console.log('   - 失败用户列表:');
        batchResult.failed.forEach(failed => {
          console.log(`     • ${failed.telegramId}: ${failed.error}`);
        });
      }
    } catch (error) {
      console.log('❌ 批量获取用户信息失败:', (error as Error).message);
    }
    
    console.log('');
  }

  /**
   * 测试服务统计信息
   */
  private async testServiceStats(): Promise<void> {
    console.log('📊 测试服务统计信息...');
    
    try {
      const stats = this.userInfoService.getServiceStats();
      
      console.log('✅ 服务统计信息:');
      console.log(`   - 服务版本: ${stats.version}`);
      console.log(`   - 运行时间: ${Math.floor(stats.uptime / 3600)}小时`);
      console.log(`   - 统计时间: ${stats.timestamp.toISOString()}`);
      console.log('   - 缓存统计:');
      console.log(`     • 缓存项目数: ${stats.cache.size || 'N/A'}`);
      console.log(`     • 内存使用: ${stats.cache.memory || 'N/A'}`);
    } catch (error) {
      console.log('❌ 获取服务统计失败:', (error as Error).message);
    }
    
    console.log('');
  }

  /**
   * 测试缓存管理功能
   */
  private async testCacheManagement(): Promise<void> {
    console.log('🗄️  测试缓存管理功能...');
    
    try {
      console.log('✅ 清除用户缓存...');
      this.userInfoService.clearUserCache(TEST_USER_ID);
      console.log('   缓存清除成功');
      
      console.log('✅ 清理过期缓存...');
      this.userInfoService.cleanupExpiredCache();
      console.log('   过期缓存清理成功');
      
    } catch (error) {
      console.log('❌ 缓存管理测试失败:', (error as Error).message);
    }
    
    console.log('');
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 用户信息获取服务测试工具');
  console.log('=====================================\n');
  
  // 检查环境变量
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ 请设置TELEGRAM_BOT_TOKEN环境变量');
    console.error('示例: export TELEGRAM_BOT_TOKEN="your_bot_token_here"');
    process.exit(1);
  }
  
  try {
    const tester = new UserInfoServiceTester();
    await tester.runAllTests();
    
  } catch (error) {
    console.error('💥 测试执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 致命错误:', error);
    process.exit(1);
  });
}

export ;