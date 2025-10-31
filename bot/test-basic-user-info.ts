#!/usr/bin/env node

/**
 * 简单的用户信息服务测试脚本
 * 验证服务基本功能是否正常工作
 */

import { UserInfoService } from './services/user-info-service';
import { Telegraf } from 'telegraf';

console.log('🧪 用户信息服务功能测试');
console.log('==========================================\n');

async function runBasicTests() {
  try {
    // 检查环境变量
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      console.log('❌ 请先设置TELEGRAM_BOT_TOKEN环境变量');
      console.log('示例: export TELEGRAM_BOT_TOKEN="your_bot_token_here"');
      return;
    }

    console.log('✅ Bot Token已配置');

    // 创建Bot实例
    const bot = new Telegraf(BOT_TOKEN);
    console.log('✅ Telegraf实例创建成功');

    // 获取用户信息服务实例
    const userInfoService = UserInfoService.getInstance(bot);
    console.log('✅ 用户信息服务实例获取成功');

    // 测试服务统计功能
    console.log('\n📊 测试服务统计功能...');
    try {
      const stats = userInfoService.getServiceStats();
      console.log('✅ 服务统计获取成功:');
      console.log(`   - 版本: ${stats.version}`);
      console.log(`   - 运行时间: ${Math.floor(stats.uptime)}秒`);
      console.log(`   - 统计时间: ${stats.timestamp.toISOString()}`);
    } catch (error) {
      console.log('❌ 服务统计获取失败:', (error as Error).message);
    }

    // 测试缓存管理功能
    console.log('\n🗄️  测试缓存管理功能...');
    try {
      userInfoService.cleanupExpiredCache();
      console.log('✅ 缓存清理功能正常');
    } catch (error) {
      console.log('❌ 缓存清理失败:', (error as Error).message);
    }

    // 如果有测试用户ID，尝试获取用户信息
    const testUserId = process.env.TEST_TELEGRAM_USER_ID;
    if (testUserId) {
      console.log(`\n👤 测试用户信息获取 (ID: ${testUserId})...`);
      
      try {
        // 测试获取用户信息
        const userInfo = await userInfoService.getUserInfo(testUserId);
        if (userInfo) {
          console.log('✅ 用户信息获取成功:');
          console.log(`   - Telegram ID: ${userInfo.telegramId}`);
          console.log(`   - 用户名: ${userInfo.username || '未设置'}`);
          console.log(`   - 姓名: ${userInfo.firstName}`);
          console.log(`   - 余额: ${userInfo.balance} 夺宝币`);
          console.log(`   - VIP等级: ${userInfo.vipLevel}`);
          console.log(`   - 语言: ${userInfo.language}`);
          console.log(`   - Telegram状态: ${userInfo.telegramStatus || '未知'}`);
        } else {
          console.log('⚠️  用户未找到（这可能是正常的，如果用户尚未注册）');
        }

        // 测试验证用户功能
        console.log('\n🔍 测试用户验证功能...');
        const validation = await userInfoService.validateUser(testUserId);
        console.log('✅ 用户验证结果:');
        console.log(`   - 是否有效: ${validation.isValid}`);
        console.log(`   - 是否存在: ${validation.exists}`);
        console.log(`   - 错误数量: ${validation.errors.length}`);
        console.log(`   - 警告数量: ${validation.warnings?.length || 0}`);

        // 测试获取聊天状态功能
        console.log('\n💬 测试聊天状态获取功能...');
        const chatInfo = await userInfoService.getUserChat(testUserId);
        console.log('✅ 聊天状态获取成功:');
        console.log(`   - 聊天类型: ${chatInfo.status}`);
        console.log(`   - 可以发送消息: ${chatInfo.canSendMessages}`);
        console.log(`   - 可以发送媒体: ${chatInfo.canSendMedia}`);

        // 测试获取用户状态功能
        console.log('\n📈 测试用户状态获取功能...');
        const userStatus = await userInfoService.getUserStatus(testUserId);
        console.log('✅ 用户状态获取成功:');
        console.log(`   - 用户状态: ${userStatus.status}`);
        console.log(`   - 是否活跃: ${userStatus.isActive}`);
        console.log(`   - 活跃程度: ${userStatus.activityLevel}`);
        console.log(`   - 参与度评分: ${userStatus.engagementScore}/100`);
        console.log(`   - 注册天数: ${userStatus.daysSinceRegistration}天`);
        console.log(`   - 最后活跃: ${userStatus.daysSinceLastActivity}天前`);

      } catch (userError) {
        console.log('⚠️  用户相关测试跳过:', (userError as Error).message);
      }
    } else {
      console.log('\n💡 如需测试用户功能，请设置TEST_TELEGRAM_USER_ID环境变量');
      console.log('示例: export TEST_TELEGRAM_USER_ID="123456789"');
    }

    console.log('\n✅ 基础功能测试完成！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
runBasicTests().catch((error) => {
  console.error('💥 测试执行失败:', error);
  process.exit(1);
});