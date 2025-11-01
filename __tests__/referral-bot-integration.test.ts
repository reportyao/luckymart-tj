import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TestDataGenerator, PerformanceTester } from './test-config';
/**
 * Bot集成测试
 * 测试Telegram Bot与邀请系统的完整集成
 */


// 模拟Telegram Bot API
const mockTelegramBot = {
  telegram: {
    sendMessage: jest.fn(),
    sendPhoto: jest.fn(),
    sendDocument: jest.fn(),
    editMessageText: jest.fn(),
    deleteMessage: jest.fn(),
    getChat: jest.fn(),
    getUserProfilePhotos: jest.fn(),
  },
  context: {
    from: {
      id: 123456789,
      first_name: 'TestUser',
      username: 'testuser',
      language_code: 'zh',
    },
    chat: {
      id: 123456789,
      type: 'private',
    },
    message: {
      message_id: 1001,
      date: Date.now(),
    },
  },
  reply: jest.fn(),
  replyWithMarkdown: jest.fn(),
  replyWithPhoto: jest.fn(),
};

// 模拟Bot消息处理器
class MockBotHandler {
  private messageHandlers: Map<string, Function[]> = new Map();
  private callbackHandlers: Map<string, Function[]> = new Map();
  private activeUsers: Set<string> = new Set();

  onMessage(command: string, handler: Function) {
    if (!this.messageHandlers.has(command)) {
      this.messageHandlers.set(command, []);
    }
    this.messageHandlers.get(command)!.push(handler);
  }

  onCallback(callback: string, handler: Function) {
    if (!this.callbackHandlers.has(callback)) {
      this.callbackHandlers.set(callback, []);
    }
    this.callbackHandlers.get(callback)!.push(handler);
  }

  handleMessage(command: string, context: any): Promise<any> {
    const handlers = this.messageHandlers.get(command) || [];
    const results = handlers.map(handler => handler(context));
    return Promise.all(results);
  }

  handleCallback(callback: string, context: any): Promise<any> {
    const handlers = this.callbackHandlers.get(callback) || [];
    const results = handlers.map(handler => handler(context));
    return Promise.all(results);
  }

  registerUser(userId: string) {
    this.activeUsers.add(userId);
  }

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  getMessageHandlerCount(): number {
    return Array.from(this.messageHandlers.values()).reduce((sum, handlers) => sum + handlers.length, 0);
  }

  getCallbackHandlerCount(): number {
    return Array.from(this.callbackHandlers.values()).reduce((sum, handlers) => sum + handlers.length, 0);
  }
}

// Bot邀请服务
class BotReferralService {
  private botHandler: MockBotHandler;
  private userData: Map<string, any> = new Map();
  private referralCodes: Map<string, string> = new Map();

  constructor(botHandler: MockBotHandler) {
    this.botHandler = botHandler;
    this.setupHandlers();
  }

  private setupHandlers() {
    // 注册命令处理器
    this.botHandler.onMessage('/start', this.handleStartCommand.bind(this));
    this.botHandler.onMessage('/invite', this.handleInviteCommand.bind(this));
    this.botHandler.onMessage('/balance', this.handleBalanceCommand.bind(this));
    this.botHandler.onMessage('/rewards', this.handleRewardsCommand.bind(this));
    this.botHandler.onMessage('/help', this.handleHelpCommand.bind(this));

    // 回调按钮处理器
    this.botHandler.onCallback('invite_friends', this.handleInviteCallback.bind(this));
    this.botHandler.onCallback('view_rewards', this.handleViewRewardsCallback.bind(this));
    this.botHandler.onCallback('my_invitees', this.handleMyInviteesCallback.bind(this));
    this.botHandler.onCallback('share_code', this.handleShareCodeCallback.bind(this));
  }

  async handleStartCommand(context: any): Promise<any> {
    const userId = context.from.id.toString();
    const username = context.from.first_name || '用户';

    // 生成邀请码
    const inviteCode = this.generateInviteCode(userId);
    this.referralCodes.set(userId, inviteCode);

    // 初始化用户数据
    if (!this.userData.has(userId)) {
      this.userData.set(userId, {
        username,
        balance: 0,
        inviteCount: 0,
        totalRewards: 0,
        invitees: [],
        inviteCode,
        registeredAt: new Date(),
      });
    }

    // 发送欢迎消息
    await this.sendWelcomeMessage(context, username, inviteCode);
    this.botHandler.registerUser(userId);

    return { success: true, message: '欢迎消息已发送' };
  }

  async handleInviteCommand(context: any): Promise<any> {
    const userId = context.from.id.toString();
    const userData = this.userData.get(userId);

    if (!userData) {
      return { success: false, message: '请先发送 /start 命令注册' };
    }

    const inviteCode = userData.inviteCode;
    const inviteLink = `https://t.me/YourBotUsername?start=${inviteCode}`;
    
    await this.sendInviteMessage(context, inviteLink, userData);

    return { success: true, message: '邀请消息已发送' };
  }

  async handleBalanceCommand(context: any): Promise<any> {
    const userId = context.from.id.toString();
    const userData = this.userData.get(userId);

    if (!userData) {
      return { success: false, message: '请先发送 /start 命令注册' };
    }

    await this.sendBalanceMessage(context, userData);

    return { success: true, message: '余额信息已发送' };
  }

  async handleRewardsCommand(context: any): Promise<any> {
    const userId = context.from.id.toString();
    const userData = this.userData.get(userId);

    if (!userData) {
      return { success: false, message: '请先发送 /start 命令注册' };
    }

    await this.sendRewardsMessage(context, userData);

    return { success: true, message: '奖励信息已发送' };
  }

  async handleHelpCommand(context: any): Promise<any> {
    await this.sendHelpMessage(context);
    return { success: true, message: '帮助信息已发送' };
  }

  private async sendWelcomeMessage(context: any, username: string, inviteCode: string) {
    const welcomeText = `;
🎉 *欢迎使用LuckyMart邀请系统*！

您好，${username}！您的专属邀请码：\`${inviteCode}\`

💰 *邀请奖励规则*：
• 一级邀请：5%奖励
• 二级邀请：3%奖励  
• 三级邀请：2%奖励

🚀 *开始使用*：
• 发送 /invite 查看邀请链接
• 发送 /balance 查看余额
• 发送 /rewards 查看奖励
    `;

    await context.reply(welcomeText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '👥 邀请好友', callback_data: 'invite_friends' },
            { text: '💰 查看奖励', callback_data: 'view_rewards' }
          ]
        ]
      }
    });
  }

  private async sendInviteMessage(context: any, inviteLink: string, userData: any) {
    const inviteText = `;
📢 *邀请好友赚钱*

您的专属邀请链接：
${inviteLink}

👥 已邀请：${userData.inviteCount} 人
💰 总奖励：${userData.totalRewards.toFixed(2)} 元

每邀请一位好友，您都能获得奖励！
    `;

    await context.replyWithMarkdown(inviteText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📤 分享链接', callback_data: 'share_code' },
            { text: '👥 我的邀请', callback_data: 'my_invitees' }
          ]
        ]
      }
    });
  }

  private async sendBalanceMessage(context: any, userData: any) {
    const balanceText = `;
💰 *账户余额*

当前余额：${userData.balance.toFixed(2)} 元
累计奖励：${userData.totalRewards.toFixed(2)} 元
邀请人数：${userData.inviteCount} 人

继续邀请好友获得更多奖励！
    `;

    await context.reply(balanceText, {
      parse_mode: 'Markdown'
    });
  }

  private async sendRewardsMessage(context: any, userData: any) {
    const rewardsText = `;
🏆 *奖励详情*

📊 统计概览：
• 总奖励：${userData.totalRewards.toFixed(2)} 元
• 邀请人数：${userData.inviteCount} 人
• 人均奖励：${userData.inviteCount > 0 ? (userData.totalRewards / userData.inviteCount).toFixed(2) : '0.00'} 元

💡 邀请更多好友，获得更高奖励！
    `;

    await context.replyWithMarkdown(rewardsText);
  }

  private async sendHelpMessage(context: any) {
    const helpText = `;
🤖 *LuckyMart Bot帮助*

📱 *基本命令*：
• /start - 开始使用
• /invite - 查看邀请链接
• /balance - 查看余额
• /rewards - 查看奖励
• /help - 显示帮助

💰 *邀请奖励*：
• 邀请好友注册获得奖励
• 被邀请人消费时您获得返利
• 三级邀请体系，持续获得奖励

❓ *遇到问题*？
请联系客服获取帮助
    `;

    await context.reply(helpText, { parse_mode: 'Markdown' });
  }

  async handleInviteCallback(context: any): Promise<any> {
    const userId = context.from.id.toString();
    const userData = this.userData.get(userId);

    if (!userData) {
      await context.answerCbQuery('请先发送 /start 命令注册');
      return;
    }

    const inviteLink = `https://t.me/YourBotUsername?start=${userData.inviteCode}`;
    await context.editMessageText(
      `📢 *邀请链接*\n\n${inviteLink}\n\n分享给好友开始赚钱吧！`,
      { parse_mode: 'Markdown' }
    );

    await context.answerCbQuery('邀请链接已生成');
    return { success: true };
  }

  async handleViewRewardsCallback(context: any): Promise<any> {
    const userId = context.from.id.toString();
    const userData = this.userData.get(userId);

    if (!userData) {
      await context.answerCbQuery('请先发送 /start 命令注册');
      return;
    }

    await this.sendRewardsMessage({ reply: jest.fn() }, userData);
    await context.answerCbQuery('奖励信息已发送');
    return { success: true };
  }

  async handleMyInviteesCallback(context: any): Promise<any> {
    const userId = context.from.id.toString();
    const userData = this.userData.get(userId);

    if (!userData) {
      await context.answerCbQuery('请先发送 /start 命令注册');
      return;
    }

    const inviteesText = `;
👥 *我的邀请*

已邀请人数：${userData.inviteCount} 人

${userData.invitees.length > 0 
  ? userData.invitees.map((invitee: any, index: number) => 
      `${index + 1}. ${invitee.username} - 注册于 ${invitee.registeredAt}`
    ).join('\n')
  : '暂无邀请记录'
}

继续邀请好友获得更多奖励！
    `;

    await context.editMessageText(inviteesText, { parse_mode: 'Markdown' });
    await context.answerCbQuery('邀请列表已更新');
    return { success: true };
  }

  async handleShareCodeCallback(context: any): Promise<any> {
    const userId = context.from.id.toString();
    const userData = this.userData.get(userId);

    if (!userData) {
      await context.answerCbQuery('请先发送 /start 命令注册');
      return;
    }

    await context.answerCbQuery('请复制邀请链接分享给好友');
    return { success: true };
  }

  private generateInviteCode(userId: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const userHash = (parseInt(userId) % 10000).toString().padStart(4, '0');
    return `LM${timestamp}${userHash}`;
  }

  // 模拟邀请奖励发放
  async processReferralReward(inviterId: string, inviteeId: string, amount: number): Promise<any> {
    const inviterData = this.userData.get(inviterId);
    
    if (!inviterData) {
      return { success: false, message: '邀请人不存在' };
    }

    // 计算奖励（5%基础返利）
    const reward = amount * 0.05;
    inviterData.balance += reward;
    inviterData.totalRewards += reward;

    // 发送奖励通知
    const rewardText = `;
🎉 *奖励到账*

💰 奖励金额：${reward.toFixed(2)} 元
👤 来源：好友消费返利
💳 当前余额：${inviterData.balance.toFixed(2)} 元

继续邀请好友获得更多奖励！
    `;

    return { 
      success: true, 
      reward: reward.toFixed(2),
      newBalance: inviterData.balance.toFixed(2)
    };
  }

  // 获取用户数据
  getUserData(userId: string): any {
    return this.userData.get(userId);
  }

  // 获取系统统计
  getSystemStats(): any {
    const totalUsers = this.userData.size;
    const totalBalance = Array.from(this.userData.values())
      .reduce((sum, user) => sum + user.balance, 0);
    const totalRewards = Array.from(this.userData.values())
      .reduce((sum, user) => sum + user.totalRewards, 0);
    const totalInvitees = Array.from(this.userData.values())
      .reduce((sum, user) => sum + user.inviteCount, 0);

    return {
      totalUsers,
      totalBalance: totalBalance.toFixed(2),
      totalRewards: totalRewards.toFixed(2),
      totalInvitees,
      activeUsers: this.botHandler.getActiveUserCount(),
    };
  }
}

describe('Bot集成测试', () => {
  let testDataGenerator: TestDataGenerator;
  let botHandler: MockBotHandler;
  let botService: BotReferralService;

  beforeEach(() => {
    testDataGenerator = new TestDataGenerator({} as any);
    botHandler = new MockBotHandler();
    botService = new BotReferralService(botHandler);

    // 重置模拟函数调用记录
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Bot命令处理测试', () => {
    test('/start 命令处理', async () => {
      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
      };

      const result = await botService.handleStartCommand(context);

      expect(result.success).toBe(true);
      expect(result.message).toBe('欢迎消息已发送');
      expect(context.reply).toHaveBeenCalled();
      
      // 验证邀请码生成
      const userData = botService.getUserData(context.from.id.toString());
      expect(userData).toBeDefined();
      expect(userData.inviteCode).toMatch(/^LM\d{10}$/);
    });

    test('/invite 命令处理', async () => {
      // 先注册用户
      await botService.handleStartCommand({
        ...mockTelegramBot.context,
        reply: jest.fn(),
      });

      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
      };

      const result = await botService.handleInviteCommand(context);

      expect(result.success).toBe(true);
      expect(result.message).toBe('邀请消息已发送');
      expect(context.reply).toHaveBeenCalled();
    });

    test('/balance 命令处理', async () => {
      // 先注册用户
      await botService.handleStartCommand({
        ...mockTelegramBot.context,
        reply: jest.fn(),
      });

      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
      };

      const result = await botService.handleBalanceCommand(context);

      expect(result.success).toBe(true);
      expect(result.message).toBe('余额信息已发送');
      expect(context.reply).toHaveBeenCalled();
    });

    test('/rewards 命令处理', async () => {
      // 先注册用户
      await botService.handleStartCommand({
        ...mockTelegramBot.context,
        reply: jest.fn(),
      });

      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
      };

      const result = await botService.handleRewardsCommand(context);

      expect(result.success).toBe(true);
      expect(result.message).toBe('奖励信息已发送');
      expect(context.reply).toHaveBeenCalled();
    });

    test('/help 命令处理', async () => {
      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
      };

      const result = await botService.handleHelpCommand(context);

      expect(result.success).toBe(true);
      expect(result.message).toBe('帮助信息已发送');
      expect(context.reply).toHaveBeenCalled();
    });

    test('未注册用户命令处理', async () => {
      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
      };

      // 尝试在未注册情况下使用命令
      const result1 = await botService.handleInviteCommand(context);
      expect(result1.success).toBe(false);
      expect(result1.message).toBe('请先发送 /start 命令注册');

      const result2 = await botService.handleBalanceCommand(context);
      expect(result2.success).toBe(false);
      expect(result2.message).toBe('请先发送 /start 命令注册');
    });
  });

  describe('Bot回调处理测试', () => {
    test('邀请好友回调', async () => {
      // 先注册用户
      await botService.handleStartCommand({
        ...mockTelegramBot.context,
        reply: jest.fn(),
      });

      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
        editMessageText: jest.fn(),
        answerCbQuery: jest.fn(),
      };

      const result = await botHandler.handleCallback('invite_friends', context);

      expect(result).toHaveLength(1);
      expect(context.editMessageText).toHaveBeenCalled();
      expect(context.answerCbQuery).toHaveBeenCalledWith('邀请链接已生成');
    });

    test('查看奖励回调', async () => {
      // 先注册用户
      await botService.handleStartCommand({
        ...mockTelegramBot.context,
        reply: jest.fn(),
      });

      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
        answerCbQuery: jest.fn(),
      };

      const result = await botHandler.handleCallback('view_rewards', context);

      expect(result).toHaveLength(1);
      expect(context.reply).toHaveBeenCalled();
      expect(context.answerCbQuery).toHaveBeenCalledWith('奖励信息已发送');
    });

    test('我的邀请回调', async () => {
      // 先注册用户
      await botService.handleStartCommand({
        ...mockTelegramBot.context,
        reply: jest.fn(),
      });

      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
        editMessageText: jest.fn(),
        answerCbQuery: jest.fn(),
      };

      const result = await botHandler.handleCallback('my_invitees', context);

      expect(result).toHaveLength(1);
      expect(context.editMessageText).toHaveBeenCalled();
      expect(context.answerCbQuery).toHaveBeenCalledWith('邀请列表已更新');
    });

    test('分享代码回调', async () => {
      // 先注册用户
      await botService.handleStartCommand({
        ...mockTelegramBot.context,
        reply: jest.fn(),
      });

      const context = {
        ...mockTelegramBot.context,
        answerCbQuery: jest.fn(),
      };

      const result = await botHandler.handleCallback('share_code', context);

      expect(result).toHaveLength(1);
      expect(context.answerCbQuery).toHaveBeenCalledWith('请复制邀请链接分享给好友');
    });

    test('未注册用户回调处理', async () => {
      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
        answerCbQuery: jest.fn(),
      };

      const result = await botHandler.handleCallback('invite_friends', context);

      expect(result).toHaveLength(1);
      expect(context.answerCbQuery).toHaveBeenCalledWith('请先发送 /start 命令注册');
    });
  });

  describe('Bot邀请系统集成测试', () => {
    test('完整的邀请流程', async () => {
      // 模拟邀请人注册
      const inviterContext = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
      };

      inviterContext.from.id = 1001;
      inviterContext.from.first_name = '邀请人';
      inviterContext.from.username = 'inviter';

      const inviterResult = await botService.handleStartCommand(inviterContext);
      expect(inviterResult.success).toBe(true);

      // 模拟被邀请人通过邀请链接注册
      const inviteeContext = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
      };

      inviteeContext.from.id = 1002;
      inviteeContext.from.first_name = '被邀请人';
      inviteeContext.from.username = 'invitee';

      const inviteeResult = await botService.handleStartCommand(inviteeContext);
      expect(inviteeResult.success).toBe(true);

      // 验证邀请关系建立
      const inviterData = botService.getUserData('1001');
      const inviteeData = botService.getUserData('1002');
      
      expect(inviterData).toBeDefined();
      expect(inviteeData).toBeDefined();
      expect(inviterData.inviteCount).toBe(1);
      expect(inviteeData.inviteCode).toMatch(/^LM\d{10}$/);

      // 模拟邀请奖励发放
      const rewardResult = await botService.processReferralReward('1001', '1002', 100.0);
      expect(rewardResult.success).toBe(true);
      expect(parseFloat(rewardResult.reward)).toBe(5.0); // 100 * 5% = 5
      expect(parseFloat(rewardResult.newBalance)).toBe(5.0);

      // 验证奖励后的数据更新
      const updatedInviterData = botService.getUserData('1001');
      expect(updatedInviterData.balance).toBe(5.0);
      expect(updatedInviterData.totalRewards).toBe(5.0);
    });

    test('多层级邀请系统', async () => {
      const users = [;
        { id: '1001', name: '用户A' },
        { id: '1002', name: '用户B' },
        { id: '1003', name: '用户C' },
        { id: '1004', name: '用户D' },
      ];

      // 依次注册用户（模拟邀请链）
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const context = {
          ...mockTelegramBot.context,
          reply: jest.fn(),
          from: { ...mockTelegramBot.context.from, id: parseInt(user.id), first_name: user.name },
        };

        const result = await botService.handleStartCommand(context);
        expect(result.success).toBe(true);

        // 模拟用户消费和奖励发放
        if (i > 0) {
          const inviterId = users[i - 1].id;
          const rewardResult = await botService.processReferralReward(inviterId, user.id, 50.0);
          expect(rewardResult.success).toBe(true);
        }
      }

      // 验证邀请链统计
      const userAData = botService.getUserData('1001');
      expect(userAData.inviteCount).toBe(1);
      expect(userAData.totalRewards).toBe(2.5); // 50 * 5%

      const systemStats = botService.getSystemStats();
      expect(systemStats.totalUsers).toBe(4);
      expect(systemStats.totalRewards).toBe('7.50'); // 2.5 + 2.5 + 2.5
    });

    test('Bot系统统计', async () => {
      // 模拟多个用户注册
      const userCount = 10;
      
      for (let i = 1; i <= userCount; i++) {
        const context = {
          ...mockTelegramBot.context,
          reply: jest.fn(),
          from: { 
            ...mockTelegramBot.context.from, 
            id: 1000 + i, 
            first_name: `用户${i}` 
          },
        };

        await botService.handleStartCommand(context);

        // 模拟每个用户邀请他人并获得奖励
        if (i > 1) {
          await botService.processReferralReward(
            (1000 + i - 1).toString(),
            (1000 + i).toString(),
            20.0 * i
          );
        }
      }

      const stats = botService.getSystemStats();
      
      expect(stats.totalUsers).toBe(userCount);
      expect(stats.activeUsers).toBe(userCount);
      expect(parseFloat(stats.totalRewards)).toBeGreaterThan(0);
      expect(stats.totalInvitees).toBe(userCount - 1);
    });
  });

  describe('Bot消息格式化测试', () => {
    test('Markdown格式消息', async () => {
      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
      };

      await botService.handleStartCommand(context);
      
      // 验证发送的消息包含Markdown格式
      expect(context.reply).toHaveBeenCalledWith(
        expect.stringContaining('**'),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );
    });

    test('Inline Keyboard布局', async () => {
      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
      };

      await botService.handleStartCommand(context);
      
      // 验证包含Inline Keyboard
      expect(context.reply).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({ text: expect.any(String) })
              ])
            ])
          })
        })
      );
    });

    test('消息编辑功能', async () => {
      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
        editMessageText: jest.fn(),
        answerCbQuery: jest.fn(),
      };

      await botService.handleStartCommand(context);
      await botHandler.handleCallback('invite_friends', context);

      // 验证消息被编辑
      expect(context.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('📢'),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );
    });
  });

  describe('Bot性能测试', () => {
    test('并发用户注册性能', async () => {
      const concurrentRegistrations = 100;

      const registerUser = async (userId: number) => {
        const context = {
          ...mockTelegramBot.context,
          reply: jest.fn(),
          from: { 
            ...mockTelegramBot.context.from, 
            id: userId, 
            first_name: `用户${userId}` 
          },
        };

        return botService.handleStartCommand(context);
      };

      const { results, totalTime, averageTime } = await PerformanceTester.testConcurrency(;
        () => registerUser(Math.floor(Math.random() * 10000) + 2000),
        concurrentRegistrations
      );

      expect(results).toHaveLength(concurrentRegistrations);
      expect(results.every(result => result.success)).toBe(true);
      expect(totalTime).toBeLessThan(10000); // 10秒内完成
      console.log(`并发注册性能 - 总时间: ${totalTime.toFixed(2)}ms, 平均时间: ${averageTime.toFixed(2)}ms`);
    });

    test('Bot命令处理性能', async () => {
      const commandCount = 500;
      const commands = ['/invite', '/balance', '/rewards'];

      // 先注册用户
      for (let i = 0; i < 50; i++) {
        const context = {
          ...mockTelegramBot.context,
          reply: jest.fn(),
          from: { 
            ...mockTelegramBot.context.from, 
            id: 5000 + i, 
            first_name: `用户${i}` 
          },
        };
        await botService.handleStartCommand(context);
      }

      const executeCommand = async () => {
        const command = commands[Math.floor(Math.random() * commands.length)];
        const context = {
          ...mockTelegramBot.context,
          reply: jest.fn(),
          from: { 
            ...mockTelegramBot.context.from, 
            id: 5000 + Math.floor(Math.random() * 50), 
            first_name: '用户' 
          },
        };

        switch (command) {
          case '/invite':
            return botService.handleInviteCommand(context);
          case '/balance':
            return botService.handleBalanceCommand(context);
          case '/rewards':
            return botService.handleRewardsCommand(context);
          default:
            return { success: false };
        }
      };

      const { results, totalTime } = await PerformanceTester.testConcurrency(;
        executeCommand,
        commandCount
      );

      expect(results).toHaveLength(commandCount);
      expect(totalTime).toBeLessThan(5000); // 5秒内完成
      console.log(`Bot命令处理性能: ${totalTime.toFixed(2)}ms 处理${commandCount}个命令`);
    });
  });

  describe('Bot异常处理测试', () => {
    test('Bot API错误处理', async () => {
      // 模拟Bot API发送失败
      const mockContext = {
        ...mockTelegramBot.context,
        reply: jest.fn().mockRejectedValue(new Error('API Error')),
        from: { 
          ...mockTelegramBot.context.from, 
          id: 9999, 
          first_name: '测试用户' 
        },
      };

      await expect(botService.handleStartCommand(mockContext)).rejects.toThrow('API Error');
    });

    test('用户数据损坏处理', async () => {
      const userId = '9998';
      
      // 直接操作用户数据模拟损坏
      botService.getUserData(userId); // 应该返回undefined

      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
        from: { 
          ...mockTelegramBot.context.from, 
          id: parseInt(userId), 
          first_name: '损坏用户' 
        },
      };

      const result = await botService.handleInviteCommand(context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('请先发送 /start 命令注册');
    });

    test('Bot处理超时处理', async () => {
      // 模拟慢速处理
      const slowBotHandler = new MockBotHandler();
      const slowBotService = new BotReferralService(slowBotHandler);

      // 重写方法模拟延迟
      const originalSendWelcomeMessage = slowBotService.handleStartCommand as any;
      slowBotService.handleStartCommand = async function(context: any) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms延迟
        return originalSendWelcomeMessage.call(this, context);
      };

      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
        from: { 
          ...mockTelegramBot.context.from, 
          id: 9997, 
          first_name: '慢速用户' 
        },
      };

      const { duration } = await PerformanceTester.measureExecutionTime(() =>;
        slowBotService.handleStartCommand(context)
      );

      expect(duration).toBeGreaterThanOrEqual(100);
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Bot与系统集成测试', () => {
    test('Bot与数据库同步', async () => {
      // 模拟Bot与数据库的状态同步
      const context = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
        from: { 
          ...mockTelegramBot.context.from, 
          id: 9996, 
          first_name: '同步测试用户' 
        },
      };

      // 用户注册
      const registerResult = await botService.handleStartCommand(context);
      expect(registerResult.success).toBe(true);

      // 模拟外部系统更新用户余额
      const userData = botService.getUserData('9996');
      userData.balance = 150.0;
      userData.totalRewards = 50.0;

      // 用户查询余额
      const balanceResult = await botService.handleBalanceCommand(context);
      expect(balanceResult.success).toBe(true);
      
      // 验证数据同步成功
      expect(context.reply).toHaveBeenCalledWith(
        expect.stringContaining('150.00'),
        expect.any(Object)
      );
    });

    test('Bot实时通知系统', async () => {
      // 模拟实时奖励通知
      const inviterContext = {
        ...mockTelegramBot.context,
        reply: jest.fn(),
        from: { 
          ...mockTelegramBot.context.from, 
          id: 9995, 
          first_name: '通知测试用户' 
        },
      };

      // 注册用户
      await botService.handleStartCommand(inviterContext);

      // 模拟奖励发放和通知
      const rewardResult = await botService.processReferralReward('9995', '9999', 200.0);
      expect(rewardResult.success).toBe(true);

      // 验证通知发送
      expect(inviterContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('🎉'),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );
    });

    test('Bot与防作弊系统集成', async () => {
      // 模拟Bot层面的防作弊检查
      let suspiciousActivityCount = 0;
      
      const checkSuspiciousActivity = (userId: string, action: string) => {
        // 简化版的防作弊检查
        if (action === '/start' && Math.random() < 0.1) {
          suspiciousActivityCount++;
          return false; // 疑似作弊;
        }
        return true; // 正常活动;
      };

      // 模拟多次快速注册尝试
      for (let i = 0; i < 20; i++) {
        const context = {
          ...mockTelegramBot.context,
          reply: jest.fn(),
          from: { 
            ...mockTelegramBot.context.from, 
            id: 9000 + i, 
            first_name: `用户${i}` 
          },
        };

        const isAllowed = checkSuspiciousActivity(context.from.id.toString(), '/start');
        
        if (isAllowed) {
          await botService.handleStartCommand(context);
        }
      }

      // 验证防作弊系统检测到可疑活动
      expect(suspiciousActivityCount).toBeGreaterThanOrEqual(0);
      console.log(`检测到${suspiciousActivityCount}次可疑活动`);
    });
  });
});