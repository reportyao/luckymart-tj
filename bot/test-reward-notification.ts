import { Telegraf, Markup } from 'telegraf';
import { RewardNotifier } from '../utils/../services/reward-notifier';
import { NotificationType, Language } from '../utils/../utils/notification-templates';
import { logger } from '../utils/logger';
/**
 * 奖励通知系统测试脚本
 * 测试Telegram Bot奖励通知功能
 */


// 模拟Bot配置
const TEST_BOT_TOKEN = process.env.TEST_TELEGRAM_BOT_TOKEN || 'your_bot_token_here';
const TEST_USER_ID = parseInt(process.env.TEST_USER_ID || '123456789'); // 替换为实际的测试用户ID;

interface TestResult {
  testName: string;
  success: boolean;
  error?: string;
  duration?: number;
}

class RewardNotificationTester {
  private bot: Telegraf;
  private rewardNotifier: RewardNotifier;
  private testResults: TestResult[] = [];

  constructor() {
    this.bot = new Telegraf(TEST_BOT_TOKEN);
    this.rewardNotifier = new RewardNotifier(this.bot);
    this.setupBotHandlers();
  }

  /**
   * 设置Bot处理器
   */
  private setupBotHandlers(): void {
    // 简单ping/pong处理器用于测试连接
    this.bot.command('ping', (ctx) => {
      ctx.reply('pong 🏓');
    });

    // 处理回调按钮
    this.bot.action(/^notification_(.+)$/, (ctx) => {
      ctx.answerCbQuery(`收到动作: ${ctx.(match?.1 ?? null)}`);
    });

    // 错误处理
    this.bot.catch((err, ctx) => {
      logger.error('Bot测试错误', { 
        updateType: ctx.updateType,
        error: err.message 
      }, err);
    });
  }

  /**
   * 启动测试Bot
   */
  public async startTestBot(): Promise<void> {
    try {
      logger.info('启动测试Bot...');
      this.bot.launch();
      logger.info('测试Bot启动成功');
      
      // 优雅关闭
      process.once('SIGINT', () => {
        logger.info('测试Bot正在关闭...');
        this.bot.stop('SIGINT');
        process.exit(0);
      });
      
      process.once('SIGTERM', () => {
        logger.info('测试Bot正在关闭...');
        this.bot.stop('SIGTERM');
        process.exit(0);
      });
    } catch (error) {
      logger.error('启动测试Bot失败', {}, error as Error);
      throw error;
    }
  }

  /**
   * 运行所有测试
   */
  public async runAllTests(): Promise<void> {
    logger.info('开始奖励通知系统测试...');
    const startTime = Date.now();

    try {
      // 测试1: 发送注册奖励通知
      await this.testRegistrationReward();

      // 测试2: 发送首次抽奖奖励通知
      await this.testFirstLotteryReward();

      // 测试3: 发送首次充值奖励通知
      await this.testFirstRechargeReward();

      // 测试4: 发送消费返利奖励通知
      await this.testCashbackReward();

      // 测试5: 测试批量通知
      await this.testBatchNotifications();

      // 测试6: 测试用户偏好设置
      await this.testNotificationPreferences();

      // 测试7: 测试Rich Message格式
      await this.testRichMessageFormat();

      // 测试8: 测试错误处理
      await this.testErrorHandling();

      const duration = Date.now() - startTime;
      this.printTestResults(duration);
      
    } catch (error) {
      logger.error('测试过程中发生错误', {}, error as Error);
    }
  }

  /**
   * 测试注册奖励通知
   */
  private async testRegistrationReward(): Promise<void> {
    const testName = '发送注册奖励通知';
    const startTime = Date.now();
    
    try {
      logger.info('测试: ' + testName);
      
      const result = await this.rewardNotifier.sendRegistrationReward(;
        TEST_USER_ID,
        'TestUser',
        { language: Language.RU }
      );

      if (result.success) {
        this.testResults.push({
          testName,
          success: true,
          duration: Date.now() - startTime
        });
        logger.info('✅ ' + testName + ' - 成功');
      } else {
        throw new Error(result.error);
  }
      }
    } catch (error) {
      this.testResults.push({
        testName,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
      logger.error('❌ ' + testName + ' - 失败: ' + error.message);
    }
  }

  /**
   * 测试首次抽奖奖励通知
   */
  private async testFirstLotteryReward(): Promise<void> {
    const testName = '发送首次抽奖奖励通知';
    const startTime = Date.now();
    
    try {
      logger.info('测试: ' + testName);
      
      const result = await this.rewardNotifier.sendFirstLotteryReward(;
        TEST_USER_ID,
        'TestUser',
        { language: Language.RU }
      );

      if (result.success) {
        this.testResults.push({
          testName,
          success: true,
          duration: Date.now() - startTime
        });
        logger.info('✅ ' + testName + ' - 成功');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.testResults.push({
        testName,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
      logger.error('❌ ' + testName + ' - 失败: ' + error.message);
    }
  }

  /**
   * 测试首次充值奖励通知
   */
  private async testFirstRechargeReward(): Promise<void> {
    const testName = '发送首次充值奖励通知';
    const startTime = Date.now();
    
    try {
      logger.info('测试: ' + testName);
      
      const result = await this.rewardNotifier.sendFirstRechargeReward(;
        TEST_USER_ID,
        'TestUser',
        100, // 充值100
        20,  // 奖励20
        { language: Language.RU }
      );

      if (result.success) {
        this.testResults.push({
          testName,
          success: true,
          duration: Date.now() - startTime
        });
        logger.info('✅ ' + testName + ' - 成功');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.testResults.push({
        testName,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
      logger.error('❌ ' + testName + ' - 失败: ' + error.message);
    }
  }

  /**
   * 测试消费返利奖励通知
   */
  private async testCashbackReward(): Promise<void> {
    const testName = '发送消费返利奖励通知';
    const startTime = Date.now();
    
    try {
      logger.info('测试: ' + testName);
      
      const result = await this.rewardNotifier.sendCashbackReward(;
        TEST_USER_ID,
        'TestUser',
        200, // 购买200
        15,  // 返利15
        { language: Language.RU }
      );

      if (result.success) {
        this.testResults.push({
          testName,
          success: true,
          duration: Date.now() - startTime
        });
        logger.info('✅ ' + testName + ' - 成功');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.testResults.push({
        testName,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
      logger.error('❌ ' + testName + ' - 失败: ' + error.message);
    }
  }

  /**
   * 测试批量通知
   */
  private async testBatchNotifications(): Promise<void> {
    const testName = '批量发送奖励通知';
    const startTime = Date.now();
    
    try {
      logger.info('测试: ' + testName);
      
      const notifications = [;
        {
          userId: TEST_USER_ID,
          type: NotificationType.REGISTRATION_REWARD,
          data: {
            userId: TEST_USER_ID,
            userName: 'TestUser1',
            rewardAmount: 100,
            currency: 'TJS'
          },
          priority: 'high' as const
        },
        {
          userId: TEST_USER_ID,
          type: NotificationType.FIRST_LOTTERY_REWARD,
          data: {
            userId: TEST_USER_ID,
            userName: 'TestUser2',
            rewardAmount: 50,
            currency: 'TJS'
          },
          priority: 'normal' as const
        },
        {
          userId: TEST_USER_ID,
          type: NotificationType.FIRST_RECHARGE_REWARD,
          data: {
            userId: TEST_USER_ID,
            userName: 'TestUser3',
            rewardAmount: 200,
            currency: 'TJS',
            context: {
              rechargeAmount: 200,
              bonusAmount: 20
            }
          },
          priority: 'low' as const
        }
      ];

      const batch = await this.rewardNotifier.sendBatchNotifications(notifications, {
        maxConcurrency: 2,
        delayBetweenBatches: 500
      });

      if (batch.status === 'completed') {
        const successCount = batch.results.filter(r => r.success).length;
        const totalCount = batch.results.length;
        
        this.testResults.push({
          testName,
          success: successCount === totalCount,
          duration: Date.now() - startTime
        });
        
        logger.info(`✅ ${testName} - 成功 (${successCount}/${totalCount})`);
      } else {
        throw new Error(`批量通知状态: ${batch.status}`);
      }
    } catch (error) {
      this.testResults.push({
        testName,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
      logger.error('❌ ' + testName + ' - 失败: ' + error.message);
    }
  }

  /**
   * 测试用户偏好设置
   */
  private async testNotificationPreferences(): Promise<void> {
    const testName = '用户通知偏好设置';
    const startTime = Date.now();
    
    try {
      logger.info('测试: ' + testName);
      
      // 获取默认偏好
      const preferences = await this.rewardNotifier.getUserPreferences(TEST_USER_ID);
      
      if (!preferences || !preferences.userId) {
        throw new Error('获取用户偏好失败');
      }

      // 更新偏好
      await this.rewardNotifier.updateUserPreferences(TEST_USER_ID, {
        notificationsEnabled: false
      });

      // 验证更新
      const updatedPreferences = await this.rewardNotifier.getUserPreferences(TEST_USER_ID);
      
      if (updatedPreferences.notificationsEnabled === false) {
        this.testResults.push({
          testName,
          success: true,
          duration: Date.now() - startTime
        });
        logger.info('✅ ' + testName + ' - 成功');
      } else {
        throw new Error('偏好更新失败');
      }
    } catch (error) {
      this.testResults.push({
        testName,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
      logger.error('❌ ' + testName + ' - 失败: ' + error.message);
    }
  }

  /**
   * 测试Rich Message格式
   */
  private async testRichMessageFormat(): Promise<void> {
    const testName = 'Rich Message格式验证';
    const startTime = Date.now();
    
    try {
      logger.info('测试: ' + testName);
      
      const richMessage = this.rewardNotifier['generateRichMessage'](;
        NotificationType.REGISTRATION_REWARD,
        Language.RU,
        {
          userId: TEST_USER_ID,
          userName: 'TestUser',
          rewardAmount: 100,
          currency: 'TJS'
        }
      );

      // 验证Rich Message结构
      if (!richMessage.text || !richMessage.parse_mode || !richMessage.reply_markup) {
        throw new Error('Rich Message结构不完整');
      }

      if (richMessage.parse_mode !== 'HTML') {
        throw new Error('Parse mode不正确');
      }

      if (!Array.isArray(richMessage.reply_markup.inline_keyboard)) {
        throw new Error('按钮格式不正确');
      }

      this.testResults.push({
        testName,
        success: true,
        duration: Date.now() - startTime
      });
      
      logger.info('✅ ' + testName + ' - 成功');
      logger.info('Rich Message预览: ' + richMessage.text.substring(0, 100) + '...');
      
    } catch (error) {
      this.testResults.push({
        testName,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
      logger.error('❌ ' + testName + ' - 失败: ' + error.message);
    }
  }

  /**
   * 测试错误处理
   */
  private async testErrorHandling(): Promise<void> {
    const testName = '错误处理机制';
    const startTime = Date.now();
    
    try {
      logger.info('测试: ' + testName);
      
      // 测试无效用户ID
      const result = await this.rewardNotifier.sendRegistrationReward(;
        -1, // 无效用户ID
        'InvalidUser',
        { language: Language.RU }
      );

      // 应该返回失败结果，而不是抛出异常
      if (!result.success && result.error) {
        this.testResults.push({
          testName,
          success: true,
          duration: Date.now() - startTime
        });
        logger.info('✅ ' + testName + ' - 成功');
      } else {
        throw new Error('错误处理测试失败');
      }
    } catch (error) {
      this.testResults.push({
        testName,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
      logger.error('❌ ' + testName + ' - 失败: ' + error.message);
    }
  }

  /**
   * 打印测试结果
   */
  private printTestResults(totalDuration: number): void {
    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    const total = this.testResults.length;

    console.log('\n' + '='.repeat(50));
    console.log('🎯 奖励通知系统测试报告');
    console.log('='.repeat(50));
    console.log(`总测试数: ${total}`);
    console.log(`通过: ${passed} ✅`);
    console.log(`失败: ${failed} ❌`);
    console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`总耗时: ${(totalDuration / 1000).toFixed(2)}s`);
    
    if (failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults.filter(r => !r.success).forEach(result => {
        console.log(`  - ${result.testName}: ${result.error}`);
      });
    }
    
    console.log('\n📊 详细结果:');
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`  ${status} ${result.testName}${duration}`);
    });
    
    console.log('='.repeat(50) + '\n');
  }
}

// 主函数
async function main() {
  console.log('🚀 启动奖励通知系统测试...\n');
  
  // 检查环境变量
  if (!TEST_BOT_TOKEN || TEST_BOT_TOKEN === 'your_bot_token_here') {
    console.error('❌ 请设置TEST_TELEGRAM_BOT_TOKEN环境变量');
    process.exit(1);
  }

  if (!TEST_USER_ID) {
    console.error('❌ 请设置TEST_USER_ID环境变量');
    process.exit(1);
  }

  const tester = new RewardNotificationTester();
  
  try {
    // 如果需要测试机器人连接，取消注释下面这行
    // await tester.startTestBot();
    
    // 运行测试
    await tester.runAllTests();
    
    console.log('✨ 测试完成！');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 测试过程中发生致命错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行主函数
if (require.main === module) {
  main();
}

export ;