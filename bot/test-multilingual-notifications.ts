import { NotificationService } from './services/notification-service';
import { Language } from './utils/notification-templates';
/**
 * 多语言通知系统测试脚本
 */


// 模拟Bot实例
const mockBot = {
  telegram: {
    sendMessage: async (chatId: number, text: string, options?: any) => {
      console.log(`\n📱 发送消息到 ${chatId}:`);
      console.log('=' .repeat(50));
      console.log(text);
      if (options?.reply_markup) {
        console.log('\n🎛️  内联键盘:');
        console.log(JSON.stringify(options.reply_markup, null, 2));
      }
      console.log('=' .repeat(50));
      return { message_id: Date.now() };
    }
  }
} as any;

async function testNotificationService() {
  console.log('\n🚀 开始测试多语言通知系统...\n');
  
  try {
    // 初始化通知服务
    const notificationService = new NotificationService(mockBot, {
      maxRetries: 2,
      initialDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2
    });
    
    console.log('✅ 通知服务初始化成功');
  }
    console.log('📊 服务统计:', notificationService.getServiceStats());
    
    // 测试数据
    const testChatId = 123456789;
    const testTelegramId = '123456789';
    
    console.log('\n🧪 测试 1: 发送帮助消息');
    await notificationService.sendHelpMessage(testTelegramId, testChatId);
    
    console.log('\n🧪 测试 2: 发送语言选择菜单');
    await notificationService.sendLanguageSelection(testTelegramId, testChatId);
    
    console.log('\n🧪 测试 3: 发送语言变更确认');
    await notificationService.sendLanguageChanged(testTelegramId, testChatId, Language.EN);
    
    console.log('\n🧪 测试 4: 发送自定义通知');
    await notificationService.sendCustomNotification(
      testTelegramId,
      'system_notification',
      {
        title: '系统维护通知',
        content: '系统将于今晚23:00-01:00进行维护升级，期间可能影响服务使用。'
      }
    );
    
    console.log('\n🧪 测试 5: 发送余额查询（模拟用户）');
    // 模拟用户查询（这里会失败，因为用户不存在，但可以测试逻辑）
    try {
      await notificationService.sendBalanceQuery(testTelegramId, testChatId);
    } catch (error) {
      console.log('⚠️  预期的错误（用户不存在）:', (error as Error).message);
  }
    }
    
    // 等待消息处理完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n✅ 测试完成！');
    console.log('📊 最终服务统计:', notificationService.getServiceStats());
    
    // 停止服务
    notificationService.stop();
    console.log('🛑 通知服务已停止');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
}

async function testLanguageSupport() {
  console.log('\n🌍 测试多语言支持...\n');
  
  const languages = Object.values(Language);
  
  for (const lang of languages) {
    console.log(`📝 测试语言: ${lang}`);
    
    try {
      // 动态加载翻译文件
      const translationModule = await import(`../src/locales/${lang}/bot.json`);
      const botTranslations = translationModule.default.bot;
      
      console.log(`  ✅ 成功加载 ${lang} 翻译文件`);
      console.log(`  📋 可用的通知类型:`, Object.keys(botTranslations));
      
      // 测试几个关键翻译
      const welcomeTitle = botTranslations.welcome?.title;
      const balanceTitle = botTranslations.balance?.title;
      const helpTitle = botTranslations.help?.title;
      
      console.log(`  🎯 欢迎消息标题: ${welcomeTitle || 'N/A'}`);
      console.log(`  💰 余额查询标题: ${balanceTitle || 'N/A'}`);
      console.log(`  ❓ 帮助中心标题: ${helpTitle || 'N/A'}`);
      
    } catch (error) {
      console.log(`  ❌ 加载 ${lang} 翻译文件失败:`, (error as Error).message);
    }
    
    console.log('');
  }
}

async function main() {
  console.log('🎯 Telegram Bot 多语言通知系统测试');
  console.log('=' .repeat(60));
  
  try {
    // 测试语言支持
    await testLanguageSupport();
    
    // 测试通知服务
    await testNotificationService();
    
    console.log('\n🎉 所有测试通过！多语言通知系统运行正常。');
    
  } catch (error) {
    console.error('\n💥 测试失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  main().catch(console.error);
}

export ;