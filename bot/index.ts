import { Telegraf, Markup } from 'telegraf';
import { prisma } from '../lib/prisma';
import { logger, performanceLogger, errorTracker } from './utils/logger';
import { faultToleranceManager } from './utils/fault-tolerance-manager';
import { MessageQueue } from './utils/message-queue';
import { UserInfoService } from './services/user-info-service';
import { RewardNotifier } from './services/reward-notifier';
import { NotificationService } from './services/notification-service';
import { Language, NotificationType } from './utils/notification-templates';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'http://localhost:3000';

if (!BOT_TOKEN) {
  logger.error('错误：TELEGRAM_BOT_TOKEN未配置');
  process.exit(1);
}

// 全局消息队列实例
let messageQueue: MessageQueue;

// 全局用户信息服务实例
let userInfoService: UserInfoService;

// 全局奖励通知服务实例
let rewardNotifier: RewardNotifier;

// 全局多语言通知服务实例
let notificationService: NotificationService;

const bot = new Telegraf(BOT_TOKEN);

// 初始化消息队列和奖励通知服务
function initializeMessageQueue() {
  messageQueue = faultToleranceManager.getMessageQueue();
  
  // 设置消息队列事件监听
  messageQueue.on('message:success', (data) => {
    logger.debug('Message processed successfully', {
      messageId: data.messageId,
      duration: data.duration
    });
  });

  messageQueue.on('message:error', (data) => {
    logger.warn('Message processing error', {
      messageId: data.messageId,
      error: data.error.message,
      duration: data.duration
    });
  });
}

// 初始化用户信息服务
function initializeUserInfoService() {
  userInfoService = UserInfoService.getInstance(bot);
  
  logger.info('用户信息服务初始化成功', {
    serviceVersion: '1.0.0',
    cacheTTL: userInfoService.getServiceStats().cache.ttl || 'default'
  });
}

// 初始化奖励通知服务
function initializeRewardNotifier() {
  rewardNotifier = new RewardNotifier(bot, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  });
  
  logger.info('奖励通知服务已初始化');
}

// 初始化多语言通知服务
function initializeNotificationService() {
  notificationService = new NotificationService(bot, {
    maxRetries: 3,
    initialDelay: 500,
    maxDelay: 10000,
    backoffMultiplier: 2
  });
  
  logger.info('多语言通知服务已初始化');
}

// /start命令 - 用户冷启动 + 用户注册
bot.command('start', performanceLogger('start_command'), async (ctx) => {
  const telegramUser = ctx.from;
  const telegramId = telegramUser.id.toString();
  
  try {
    logger.info('Processing start command', { 
      telegramId, 
      username: telegramUser.username 
    });

    // 使用消息队列处理用户注册
    await messageQueue.addMessage('telegram', {
      type: 'user_registration',
      telegramId,
      userData: telegramUser
    }, { priority: 'high' });

    // 使用upsert确保用户不存在时创建，存在时更新
    const user = await prisma.users.upsert({
      where: { telegramId },
      update: {
        username: telegramUser.username || null,
        firstName: telegramUser.first_name || 'Unknown',
        lastName: telegramUser.last_name || null,
        avatarUrl: telegramUser.photo_url || null,
      },
      create: {
        telegramId,
        username: telegramUser.username || null,
        firstName: telegramUser.first_name || 'Unknown',
        lastName: telegramUser.last_name || null,
        avatarUrl: telegramUser.photo_url || null,
        language: telegramUser.language_code || 'zh',
        balance: 50, // 新用户奖励
        platformBalance: 0,
        vipLevel: 0,
        totalSpent: 0,
        freeDailyCount: 0,
        lastFreeResetDate: new Date(),
      }
    });
    
    // 使用多语言通知服务发送欢迎消息
    if (notificationService) {
      await notificationService.sendWelcomeMessage(user.id, telegramId, ctx.chat.id, telegramUser);
    } else {
      // 回退到原始消息发送逻辑
      const welcomeMessage = `
🎉 欢迎来到LuckyMart TJ幸运集市！

这里有超多心仪商品等你来夺宝：
- 1夺宝币 = 1份，超低门槛  
- 新用户注册即送50夺宝币 🎁
- 每日免费参与3次
- 公平透明的开奖算法

您的账户已创建，余额：${user.balance} 夺宝币

点击下方按钮进入幸运集市，开始您的幸运之旅吧！
`;

      await messageQueue.addMessage('telegram', {
        type: 'send_message',
        chatId: ctx.chat.id,
        text: welcomeMessage,
        keyboard: Markup.inlineKeyboard([
          [Markup.button.webApp('进入幸运集市', MINI_APP_URL)],
          [Markup.button.callback('新手教程', 'help_tutorial')],
          [Markup.button.callback('语言设置', 'language_settings')]
        ])
      }, { priority: 'high' });
    }

    // 记录业务事件
    logger.business('user_registered', telegramId, {
      userId: user.id,
      username: user.username,
      initialBalance: user.balance
    });

    // 发送注册奖励通知
    if (rewardNotifier) {
      try {
        const userLanguage = (user.language as Language) || Language.RU;
        await rewardNotifier.sendRegistrationReward(
          user.id, 
          telegramUser.first_name || telegramUser.username || 'Пользователь',
          { language: userLanguage }
        );
        
        logger.info('注册奖励通知已发送', {
          userId: user.id,
          telegramId
        });
      } catch (notificationError) {
        logger.warn('发送注册奖励通知失败', {
          userId: user.id,
          telegramId,
          error: (notificationError as Error).message
        });
      }
    }
    
  } catch (error) {
    logger.error('Start command error', { 
      telegramId, 
      error: (error as Error).message 
    }, error as Error);
    
    errorTracker.recordError('start_command_error', error as Error);
    
    try {
      await ctx.reply('注册失败，请稍后重试或联系客服');
    } catch (replyError) {
      logger.error('Failed to send error reply', { 
        error: (replyError as Error).message 
      }, replyError as Error);
    }
  }
});

// /balance命令 - 查询余额
bot.command('balance', performanceLogger('balance_command'), async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    
    logger.debug('Processing balance command', { telegramId });
    
    const user = await prisma.users.findUnique({
      where: { telegramId }
    });

    if (!user) {
      // 使用多语言通知服务发送错误消息
      if (notificationService) {
        await notificationService.sendCustomNotification(telegramId, 'errors.user_not_found');
      } else {
        await messageQueue.addMessage('telegram', {
          type: 'send_message',
          chatId: ctx.chat.id,
          text: '您还未注册，请点击 /start 开始使用'
        });
      }
      return;
    }

    // 使用多语言通知服务发送余额查询结果
    if (notificationService) {
      await notificationService.sendBalanceQuery(telegramId, ctx.chat.id);
    } else {
      // 回退到原始消息发送逻辑
      const message = `
您的账户余额：

夺宝币：${user.balance.toString()} 币
平台余额：${user.platformBalance.toString()} TJS
VIP等级：${user.vipLevel}
今日免费次数：${user.freeDailyCount}/3

点击下方按钮充值或查看更多
`;

      await messageQueue.addMessage('telegram', {
        type: 'send_message',
        chatId: ctx.chat.id,
        text: message,
        keyboard: Markup.inlineKeyboard([
          [Markup.button.webApp('前往充值', `${MINI_APP_URL}/recharge`)],
          [Markup.button.webApp('查看订单', `${MINI_APP_URL}/orders`)]
        ])
      });
    }

    logger.business('balance_checked', telegramId, {
      balance: user.balance,
      platformBalance: user.platformBalance
    });
    
  } catch (error) {
    logger.error('Balance command error', { 
      telegramId: ctx.from.id.toString(),
      error: (error as Error).message 
    }, error as Error);
    
    errorTracker.recordError('balance_command_error', error as Error);
    
    try {
      await messageQueue.addMessage('telegram', {
        type: 'send_message',
        chatId: ctx.chat.id,
        text: '查询失败，请稍后重试'
      });
    } catch (replyError) {
      logger.error('Failed to send balance error reply', { 
        error: (replyError as Error).message 
      }, replyError as Error);
    }
  }
});

// /orders命令 - 查询订单
bot.command('orders', performanceLogger('orders_command'), async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    
    logger.debug('Processing orders command', { telegramId });
    
    const user = await prisma.users.findUnique({
      where: { telegramId }
    });

    if (!user) {
      // 使用多语言通知服务发送错误消息
      if (notificationService) {
        await notificationService.sendCustomNotification(telegramId, 'errors.user_not_found');
      } else {
        await messageQueue.addMessage('telegram', {
          type: 'send_message',
          chatId: ctx.chat.id,
          text: '您还未注册，请点击 /start 开始使用'
        });
      }
      return;
    }

    // 查询最近的订单
    const orders = await prisma.orders.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // 使用多语言通知服务发送订单查询结果
    if (notificationService) {
      await notificationService.sendOrderQuery(telegramId, ctx.chat.id);
    } else {
      // 回退到原始消息发送逻辑
      if (orders.length === 0) {
        await messageQueue.addMessage('telegram', {
          type: 'send_message',
          chatId: ctx.chat.id,
          text: '您还没有订单',
          keyboard: Markup.inlineKeyboard([
            [Markup.button.webApp('去夺宝', MINI_APP_URL)]
          ])
        });
        return;
      }

      let message = '您的最近订单：\n\n';
      orders.forEach((order, index) => {
        message += `${index + 1}. 订单号：${order.orderNumber}\n`;
        message += `   状态：${getOrderStatusText(order.paymentStatus)}\n`;
        message += `   金额：${order.totalAmount} TJS\n\n`;
      });

      await messageQueue.addMessage('telegram', {
        type: 'send_message',
        chatId: ctx.chat.id,
        text: message,
        keyboard: Markup.inlineKeyboard([
          [Markup.button.webApp('查看全部订单', `${MINI_APP_URL}/orders`)]
        ])
      });
    }

    logger.business('orders_viewed', telegramId, {
      orderCount: orders.length,
      totalAmount: orders.reduce((sum, order) => sum + order.totalAmount, 0)
    });
    
  } catch (error) {
    logger.error('Orders command error', { 
      telegramId: ctx.from.id.toString(),
      error: (error as Error).message 
    }, error as Error);
    
    errorTracker.recordError('orders_command_error', error as Error);
    
    try {
      await messageQueue.addMessage('telegram', {
        type: 'send_message',
        chatId: ctx.chat.id,
        text: '查询失败，请稍后重试'
      });
    } catch (replyError) {
      logger.error('Failed to send orders error reply', { 
        error: (replyError as Error).message 
      }, replyError as Error);
    }
  }
});

// /help命令 - 帮助信息
bot.command('help', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  
  // 使用多语言通知服务发送帮助信息
  if (notificationService) {
    await notificationService.sendHelpMessage(telegramId, ctx.chat.id);
  } else {
    // 回退到原始消息发送逻辑
    const helpMessage = `
命令列表：
/start - 开始使用
/balance - 查询余额
/orders - 查询订单
/language - 切换语言
/profile - 个人资料
/support - 联系客服
/help - 查看帮助

需要帮助？点击下方按钮：
`;

    await ctx.reply(helpMessage,
      Markup.inlineKeyboard([
        [Markup.button.webApp('新手教程', `${MINI_APP_URL}/tutorial`)],
        [Markup.button.callback('联系客服', 'contact_support')]
      ])
    );
  }
});

// /language命令 - 切换语言
bot.command('language', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  
  // 使用多语言通知服务发送语言选择菜单
  if (notificationService) {
    await notificationService.sendLanguageSelection(telegramId, ctx.chat.id);
  } else {
    // 回退到原始消息发送逻辑
    await ctx.reply('请选择语言 / Choose Language / Выберите язык:',
      Markup.inlineKeyboard([
        [Markup.button.callback('中文', 'lang_zh')],
        [Markup.button.callback('English', 'lang_en')],
        [Markup.button.callback('Русский', 'lang_ru')]
      ])
    );
  }
});

// /profile命令 - 个人资料
bot.command('profile', async (ctx) => {
  await ctx.reply('查看和管理您的个人资料',
    Markup.inlineKeyboard([
      [Markup.button.webApp('个人中心', `${MINI_APP_URL}/profile`)]
    ])
  );
});

// /support命令 - 客服支持
bot.command('support', async (ctx) => {
  const supportMessage = `
客服支持：

工作时间：周一至周日 9:00-22:00
联系方式：@luckymart_support
邮箱：support@luckymart.tj

常见问题请点击下方按钮查看
`;

  await ctx.reply(supportMessage,
    Markup.inlineKeyboard([
      [Markup.button.webApp('常见问题', `${MINI_APP_URL}/faq`)],
      [Markup.button.url('联系客服', 'https://t.me/luckymart_support')]
    ])
  );
});

// /userinfo命令 - 获取详细用户信息
bot.command('userinfo', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  
  try {
    if (!userInfoService) {
      await ctx.reply('用户信息服务未初始化，请稍后重试');
      return;
    }

    const userInfo = await userInfoService.getUserInfo(telegramId);
    
    if (!userInfo) {
      await ctx.reply('未找到用户信息，请先使用 /start 注册');
      return;
    }

    const message = `
👤 您的详细用户信息

📋 基本信息：
• Telegram ID: ${userInfo.telegramId}
• 用户名: ${userInfo.username || '未设置'}
• 姓名: ${userInfo.firstName} ${userInfo.lastName || ''}
• 语言: ${userInfo.language}
• 头像: ${userInfo.avatarUrl ? '有' : '无'}

💰 账户信息：
• 夺宝币余额: ${userInfo.balance} 币
• 平台余额: ${userInfo.platformBalance} TJS
• 总消费: ${userInfo.totalSpent} TJS
• VIP等级: ${userInfo.vipLevel}

📅 时间信息：
• 注册时间: ${userInfo.createdAt.toLocaleDateString()}
• 最后更新: ${userInfo.updatedAt.toLocaleDateString()}
• 免费次数: ${userInfo.freeDailyCount}/3

🔧 Telegram状态：
• 用户类型: ${userInfo.isPremium ? 'Premium' : '普通用户'}
• 管理员: ${userInfo.isAdministrator ? '是' : '否'}
• 机器人: ${userInfo.isBot ? '是' : '否'}
• 状态: ${userInfo.telegramStatus || '未知'}
`;

    await ctx.reply(message);

  } catch (error) {
    logger.error('Get userinfo error', { 
      telegramId, 
      error: (error as Error).message 
    }, error as Error);
    
    await ctx.reply('获取用户信息失败，请稍后重试');
  }
});

// /status命令 - 获取用户活动状态
bot.command('status', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  
  try {
    if (!userInfoService) {
      await ctx.reply('用户信息服务未初始化，请稍后重试');
      return;
    }

    const userStatus = await userInfoService.getUserStatus(telegramId);
    
    const statusEmojis = {
      'active': '🟢',
      'new': '🆕',
      'inactive': '🟡',
      'suspended': '🔴',
      'not_found': '❌'
    };

    const statusEmoji = statusEmojis[userStatus.status as keyof typeof statusEmojis] || '⚪';
    const activityEmojis = {
      'high': '🔥',
      'medium': '📊',
      'low': '📉',
      'none': '💤'
    };

    const activityEmoji = activityEmojis[userStatus.activityLevel as keyof typeof activityEmojis] || '❓';

    const message = `
📊 用户活动状态报告

${statusEmoji} 用户状态: ${userStatus.status}
${activityEmoji} 活跃程度: ${userStatus.activityLevel}
⭐ 参与度评分: ${userStatus.engagementScore}/100

👤 账户信息:
• 注册天数: ${userStatus.daysSinceRegistration}天
• 最后活跃: ${userStatus.daysSinceLastActivity}天前
• 余额: ${userStatus.balance} 夺宝币
• 总消费: ${userStatus.totalSpent} TJS
• VIP等级: ${userStatus.vipLevel}

${userStatus.isActive ? '✅ 账户正常活跃' : '⚠️  账户可能需要关注'}
`;

    await ctx.reply(message);

  } catch (error) {
    logger.error('Get user status error', { 
      telegramId, 
      error: (error as Error).message 
    }, error as Error);
    
    await ctx.reply('获取用户状态失败，请稍后重试');
  }
});

// /validate命令 - 验证用户有效性
bot.command('validate', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  
  try {
    if (!userInfoService) {
      await ctx.reply('用户信息服务未初始化，请稍后重试');
      return;
    }

    const validation = await userInfoService.validateUser(telegramId);
    
    const validationEmoji = validation.isValid ? '✅' : '❌';
    
    let message = `
${validationEmoji} 用户验证结果

🔍 基础验证:
• 用户存在: ${validation.exists ? '是' : '否'}
• 账户有效: ${validation.isValid ? '是' : '否'}

`;

    if (validation.isNewUser) {
      message += '🆕 这是一个新用户（注册时间不足24小时）\n';
    }

    if (validation.isVipUser) {
      message += '👑 这是一个VIP用户\n';
    }

    if (validation.isInactive) {
      message += '😴 用户长时间未活跃\n';
    }

    if (validation.errors.length > 0) {
      message += '\n❌ 发现问题:\n';
      validation.errors.forEach(error => {
        message += `• ${error}\n`;
      });
    }

    if (validation.warnings && validation.warnings.length > 0) {
      message += '\n⚠️  注意事项:\n';
      validation.warnings.forEach(warning => {
        message += `• ${warning}\n`;
      });
    }

    await ctx.reply(message);

  } catch (error) {
    logger.error('Validate user error', { 
      telegramId, 
      error: (error as Error).message 
    }, error as Error);
    
    await ctx.reply('用户验证失败，请稍后重试');
  }
});

// /notifications命令 - 通知设置
bot.command('notifications', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  
  try {
    const user = await prisma.users.findUnique({
      where: { telegramId }
    });

    if (!user) {
      // 使用多语言通知服务发送错误消息
      if (notificationService) {
        await notificationService.sendCustomNotification(telegramId, 'errors.user_not_found');
      } else {
        await messageQueue?.addMessage('telegram', {
          type: 'send_message',
          chatId: ctx.chat.id,
          text: '您还未注册，请点击 /start 开始使用'
        });
      }
      return;
    }

    if (rewardNotifier) {
      await rewardNotifier.showNotificationSettings(user.id, ctx);
    } else if (notificationService) {
      // 使用多语言通知服务发送通知设置
      await notificationService.sendCustomNotification(telegramId, 'notification_settings');
    } else {
      await ctx.reply('通知服务暂不可用，请稍后重试');
    }
  } catch (error) {
    logger.error('打开通知设置失败', { 
      telegramId, 
      error: (error as Error).message 
    }, error as Error);
    
    await ctx.reply('打开通知设置失败，请稍后重试');
  }
});

// 语言切换回调
bot.action(/lang_(.+)/, async (ctx) => {
  const lang = ctx.match[1];
  const telegramId = ctx.from.id.toString();
  const chatId = ctx.chat.id;

  try {
    await prisma.users.update({
      where: { telegramId },
      data: { language: lang }
    });

    await ctx.answerCbQuery();
    
    // 使用多语言通知服务发送语言变更确认
    if (notificationService) {
      await notificationService.sendLanguageChanged(telegramId, chatId, lang);
    } else {
      // 回退到原始消息发送逻辑
      const messages: Record<string, string> = {
        'zh-CN': '语言已切换为中文',
        'en-US': 'Language switched to English',
        'ru-RU': 'Язык переключен на русский',
        'tg-TJ': 'Забон ба Тоҷикӣ иваз карда шуд'
      };

      await ctx.reply(messages[lang] || messages['zh-CN']);
    }
  } catch (error) {
    logger.error('语言切换失败', { 
      telegramId, 
      error: (error as Error).message 
    }, error as Error);
    await ctx.answerCbQuery('切换失败，请稍后重试');
  }
});

// 辅助函数
function getOrderStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    failed: '支付失败',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
}

// 新手教程回调
bot.action('help_tutorial', async (ctx) => {
  const tutorialMessage = `
📚 新手教程

🎯 如何参与夺宝：
1. 选择您喜欢的商品
2. 购买夺宝份额（1份额 = 1夺宝币）
3. 等待开奖时间
4. 等待幸运号码公布
5. 中奖者获得商品

💰 获得夺宝币：
- 新用户注册：50夺宝币
- 每日免费参与：3次
- 充值购买更多份额

🎁 参与规则：
- 开奖公平透明，使用区块链技术
- 每期固定开奖时间
- 中奖后自动发货到家

有任何问题请随时联系客服！
`;

  await ctx.answerCbQuery();
  await ctx.reply(tutorialMessage,
    Markup.inlineKeyboard([
      [Markup.button.webApp('开始夺宝', MINI_APP_URL)],
      [Markup.button.callback('联系客服', 'contact_support')]
    ])
  );
});

// 语言设置回调
bot.action('language_settings', async (ctx) => {
  const languageMessage = `
🌐 请选择您的语言 / Please select your language / Выберите язык:

支持的语言：
- 中文 (简体)
- English
- Русский
`;

  await ctx.answerCbQuery();
  await ctx.reply(languageMessage,
    Markup.inlineKeyboard([
      [Markup.button.callback('中文', 'lang_zh')],
      [Markup.button.callback('English', 'lang_en')],
      [Markup.button.callback('Русский', 'lang_ru')]
    ])
  );
});

// 联系客服回调
bot.action('contact_support', async (ctx) => {
  const supportMessage = `
💬 联系我们

客服工作时间：周一至周日 9:00-22:00

联系方式：
- Telegram客服：@luckymart_support
- 客服邮箱：support@luckymart.tj

常见问题：
- 支付问题：24小时内回复
- 开奖争议：立即处理
- 账户问题：实时解答

我们承诺为您提供最优质的服务！
`;

  await ctx.answerCbQuery();
  await ctx.reply(supportMessage,
    Markup.inlineKeyboard([
      [Markup.button.webApp('常见问题', `${MINI_APP_URL}/faq`)],
      [Markup.button.url('联系客服', 'https://t.me/luckymart_support')],
      [Markup.button.callback('返回帮助', 'help_tutorial')]
    ])
  );
});

// 消息模板系统
class MessageTemplates {
  // 订单状态变更通知
  static orderStatusChange(orderNumber: string, status: string, amount: number) {
    const statusMessages = {
      pending: `⏳ 订单${orderNumber}已创建，等待支付\n金额：${amount} TJS\n请在15分钟内完成支付`,
      paid: `✅ 订单${orderNumber}支付成功！\n金额：${amount} TJS\n正在为您安排发货`,
      shipped: `📦 订单${orderNumber}已发货\n运单号：LS${Date.now()}\n预计2-3个工作日送达`,
      delivered: `🎉 订单${orderNumber}已送达\n感谢您的购买，欢迎再次光临！`
    };
    
    return statusMessages[status as keyof typeof statusMessages] || `订单${orderNumber}状态更新：${status}`;
  }

  // 支付成功提醒
  static paymentSuccess(orderNumber: string, amount: number, productName: string) {
    return `💳 支付成功！

📋 订单号：${orderNumber}
💰 支付金额：${amount} TJS
🎁 商品：${productName}

✅ 支付已确认，正在安排发货
📱 关注订单状态变化`;
  }

// 转售状态推送
static resaleStatusUpdate(resaleId: string, status: string, progress?: number) {
    const statusMessages = {
      created: `转售申请已创建\n转售ID：${resaleId}\n正在寻找买家...`,
      matching: `正在为您寻找买家\n转售ID：${resaleId}\n预计匹配时间：5-10分钟`,
      matched: `找到买家！\n转售ID：${resaleId}\n正在处理交易...`,
      sold: `转售成功！\n转售ID：${resaleId}\n资金已到账（扣除5%手续费）`,
      cancelled: `转售已取消\n转售ID：${resaleId}`
    };
    
    const message = statusMessages[status as keyof typeof statusMessages];
    if (progress && status === 'matching') {
      return `${message}\n匹配进度：${progress}%`;
    }
    
    return message;
  }

  // 系统通知消息
  static systemNotification(title: string, content: string, type: 'info' | 'warning' | 'success' = 'info') {
    const emojis = {
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅'
    };
    
    return `${emojis[type]} ${title}\n\n${content}`;
  }

  // 开奖结果通知
  static lotteryResult(roundId: string, productName: string, winnerId: string, isWinner: boolean) {
    if (isWinner) {
      return `恭喜您中奖！\n\n商品：${productName}\n期号：${roundId}\n恭喜您获得本期奖品！\n\n我们将联系您安排发货\n请保持联系方式畅通`;
    } else {
      return `开奖结果\n\n商品：${productName}\n期号：${roundId}\n\n很遗憾，本次未中奖\n继续参与，下期中奖的就是您！\n\n立即参与更多商品夺宝`;
    }
  }

  // VIP等级提升通知
  static vipLevelUp(oldLevel: number, newLevel: number, benefits: string[]) {
    const levelNames = ['普通用户', '青铜VIP', '白银VIP', '黄金VIP', '铂金VIP', '钻石VIP'];
    const newLevelName = levelNames[newLevel] || `VIP${newLevel}`;
    
    return `VIP等级提升！\n\n从 ${levelNames[oldLevel] || `VIP${oldLevel}`} 升级到 ${newLevelName}\n\n新增特权：\n${benefits.map(benefit => `• ${benefit}`).join('\n')}\n\n感谢您的支持！`;
  }
}

// 增强的发送通知函数（供其他模块调用）
export async function sendNotification(telegramId: string, message: string, options?: any) {
  try {
    const numericId = parseInt(telegramId);
    await bot.telegram.sendMessage(numericId, message, options);
    return true;
  } catch (error) {
    logger.error('发送通知失败', { 
      telegramId, 
      error: (error as Error).message 
    }, error as Error);
    return false;
  }
}

// 发送富文本通知
export async function sendRichNotification(
  telegramId: string, 
  title: string, 
  content: string, 
  actionButton?: { text: string; url: string },
  type: 'info' | 'warning' | 'success' = 'info'
) {
  const message = MessageTemplates.systemNotification(title, content, type);
  
  const keyboard = actionButton ? 
    Markup.inlineKeyboard([
      [Markup.button.webApp(actionButton.text, actionButton.url)]
    ]) : undefined;

  return await sendNotification(telegramId, message, keyboard);
}

// 发送订单状态变更通知
export async function sendOrderStatusNotification(
  telegramId: string,
  orderNumber: string,
  status: string,
  amount: number,
  actionUrl?: string
) {
  const message = MessageTemplates.orderStatusChange(orderNumber, status, amount);
  
  const keyboard = actionUrl ? 
    Markup.inlineKeyboard([
      [Markup.button.webApp('查看订单', actionUrl)]
    ]) : undefined;

  return await sendNotification(telegramId, message, keyboard);
}

// 发送支付成功通知
export async function sendPaymentSuccessNotification(
  telegramId: string,
  orderNumber: string,
  amount: number,
  productName: string
) {
  const message = MessageTemplates.paymentSuccess(orderNumber, amount, productName);
  
  return await sendNotification(telegramId, message,
    Markup.inlineKeyboard([
      [Markup.button.webApp('查看订单', `${MINI_APP_URL}/orders`)],
      [Markup.button.webApp('继续购物', `${MINI_APP_URL}`)]
    ])
  );
}

// 发送转售状态通知
export async function sendResaleStatusNotification(
  telegramId: string,
  resaleId: string,
  status: string,
  progress?: number
) {
  const message = MessageTemplates.resaleStatusUpdate(resaleId, status, progress);
  
  return await sendNotification(telegramId, message,
    Markup.inlineKeyboard([
      [Markup.button.webApp('查看转售', `${MINI_APP_URL}/resale/my-listings`)]
    ])
  );
}

// 发送开奖结果通知
export async function sendLotteryResultNotification(
  telegramId: string,
  roundId: string,
  productName: string,
  winnerId: string,
  isWinner: boolean
) {
  const message = MessageTemplates.lotteryResult(roundId, productName, winnerId, isWinner);
  
  return await sendNotification(telegramId, message,
    Markup.inlineKeyboard([
      [Markup.button.webApp(isWinner ? '查看奖品' : '继续参与', `${MINI_APP_URL}`)]
    ])
  );
}

// 发送VIP升级通知
export async function sendVipUpgradeNotification(
  telegramId: string,
  oldLevel: number,
  newLevel: number,
  benefits: string[]
) {
  const message = MessageTemplates.vipLevelUp(oldLevel, newLevel, benefits);
  
  return await sendNotification(telegramId, message,
    Markup.inlineKeyboard([
      [Markup.button.webApp('查看权益', `${MINI_APP_URL}/vip`)],
      [Markup.button.webApp('继续购物', `${MINI_APP_URL}`)]
    ])
  );
}

// 定时任务：每日免费次数重置
async function resetDailyFreeCount() {
  try {
    // 使用塔吉克斯坦时区
    const tajikistanNow = new Date(new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Dushanbe'
    }));
    const todayStart = new Date(tajikistanNow);
    todayStart.setHours(0, 0, 0, 0);

    // 查找需要重置的用户（使用塔吉克斯坦时区）
    const users = await prisma.users.findMany({
      where: {
        OR: [
          { lastFreeResetDate: null },
          {
            lastFreeResetDate: {
              lt: todayStart
            }
          }
        ]
      }
    });

    // 批量重置免费次数为3
    for (const user of users) {
      await prisma.users.update({
        where: { id: user.id },
        data: {
          freeDailyCount: 3,  // 统一重置为3次
          lastFreeResetDate: todayStart
        }
      });
    }

    logger.info(`重置了 ${users.length} 个用户的每日免费次数为3次`, {
      resetTime: tajikistanNow.toISOString(),
      timezone: 'Asia/Dushanbe'
    });
  } catch (error) {
    logger.error('重置每日免费次数失败', error);
  }
}

// 定时任务：检查待开奖的彩票
async function checkPendingLotteries() {
  try {
    const pendingRounds = await prisma.lotteryRounds.findMany({
      where: {
        status: 'active',
        endTime: {
          lte: new Date()
        }
      },
      include: {
        lotteryProduct: true
      }
    });

    for (const round of pendingRounds) {
      // 这里应该触发开奖逻辑
      // 由于开奖算法比较复杂，暂时记录日志
      logger.info(`准备开奖：${round.id} - ${round.lotteryProduct?.name}`);
    }
  } catch (error) {
    logger.error('检查待开奖彩票失败', error);
  }
}

// 发送中奖通知 - 增强版
export async function sendEnhancedWinNotification(
  telegramId: string,
  participationId: string,
  roundId: string,
  productName: string,
  winningNumber: number,
  prizeAmount: number,
  prizeType: string = 'standard',
  userLanguage: string = 'tg-TJ'
) {
  try {
    // 防止重复通知
    const existingNotification = await prisma.notifications.findFirst({
      where: {
        type: 'lottery_win',
        content: {
          contains: participationId
        }
      }
    });

    if (existingNotification) {
      logger.info('中奖通知已存在，跳过发送:', { participationId, telegramId });
      return false;
    }

    // 获取用户信息
    const user = await prisma.users.findFirst({
      where: { telegramId }
    });

    if (!user) {
      logger.warn('用户不存在:', telegramId);
      return false;
    }

    // 生成中奖通知内容
    const notificationContent = generateEnhancedWinNotification({
      productName,
      roundId,
      winningNumber,
      prizeAmount,
      prizeType,
      userLanguage
    });

    // 构建键盘按钮
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.webApp(
          getButtonText(userLanguage, 'claimPrize'), 
          `${MINI_APP_URL}/lottery/claim?participationId=${participationId}`
        )
      ],
      [
        Markup.button.webApp(
          getButtonText(userLanguage, 'viewRecords'), 
          `${MINI_APP_URL}/lottery/records`
        ),
        Markup.button.webApp(
          getButtonText(userLanguage, 'continueLottery'), 
          `${MINI_APP_URL}`
        )
      ]
    ]);

    // 发送通知
    const success = await sendNotification(telegramId, notificationContent, keyboard);

    if (success) {
      // 记录通知发送历史
      await prisma.notifications.create({
        data: {
          userId: user.id,
          type: 'lottery_win',
          content: JSON.stringify({
            participationId,
            roundId,
            productName,
            winningNumber,
            prizeAmount,
            prizeType,
            sentAt: new Date().toISOString()
          }),
          status: 'sent',
          sentAt: new Date(),
          createdAt: new Date()
        }
      });

      logger.info('中奖通知发送成功:', { 
        telegramId, 
        participationId, 
        prizeAmount 
      });
    }

    return success;
  } catch (error) {
    logger.error('发送中奖通知失败:', { 
      telegramId, 
      participationId, 
      error: (error as Error).message 
    }, error as Error);
    return false;
  }
}

// 发送批量中奖通知
export async function sendBatchWinNotifications(
  notifications: Array<{
    telegramId: string;
    participationId: string;
    roundId: string;
    productName: string;
    winningNumber: number;
    prizeAmount: number;
    prizeType: string;
    userLanguage: string;
  }>
) {
  logger.info('开始发送批量中奖通知:', { count: notifications.length });
  
  const results = await Promise.allSettled(
    notifications.map(notification => 
      sendEnhancedWinNotification(
        notification.telegramId,
        notification.participationId,
        notification.roundId,
        notification.productName,
        notification.winningNumber,
        notification.prizeAmount,
        notification.prizeType,
        notification.userLanguage
      )
    )
  );

  const successCount = results.filter(result => 
    result.status === 'fulfilled' && result.value
  ).length;

  logger.info('批量中奖通知发送完成:', {
    total: notifications.length,
    success: successCount,
    failed: notifications.length - successCount
  });

  return {
    total: notifications.length,
    success: successCount,
    failed: notifications.length - successCount
  };
}

// 生成增强版中奖通知内容
function generateEnhancedWinNotification(params: {
  productName: string;
  roundId: string;
  winningNumber: number;
  prizeAmount: number;
  prizeType: string;
  userLanguage: string;
}): string {
  const { productName, roundId, winningNumber, prizeAmount, prizeType, userLanguage } = params;
  
  const templates = {
    'zh-CN': {
      title: '🎉🎉🎉 恭喜中奖！🎉🎉🎉',
      message: `🏆 <b>特大喜讯！您中奖了！</b>

📦 <b>商品名称：</b>${productName}
🎯 <b>期号：</b>${roundId}
🔢 <b>中奖号码：</b><code>${winningNumber}</code>
💰 <b>奖金金额：</b><b>${prizeAmount} TJS</b>
🏅 <b>奖金类型：</b>${getPrizeTypeText(prizeType, 'zh-CN')}

🎊 <b>恭喜恭喜！幸运降临在您身上！</b>
📞 我们将尽快联系您安排领奖事宜
💝 感谢您的参与，继续支持我们吧～`,
      emoji: '🎉'
    },
    'en-US': {
      title: '🎉🎉🎉 Congratulations! You Won! 🎉🎉🎉',
      message: `🏆 <b>Great News! You are the Winner!</b>

📦 <b>Product:</b> ${productName}
🎯 <b>Round:</b> ${roundId}
🔢 <b>Winning Number:</b> <code>${winningNumber}</code>
💰 <b>Prize Amount:</b> <b>${prizeAmount} TJS</b>
🏅 <b>Prize Type:</b> ${getPrizeTypeText(prizeType, 'en-US')}

🎊 <b>Congratulations! Luck is on your side!</b>
📞 We will contact you soon to arrange prize collection
💝 Thank you for your participation, continue supporting us~`,
      emoji: '🎉'
    },
    'ru-RU': {
      title: '🎉🎉🎉 Поздравляем! Вы выиграли! 🎉🎉🎉',
      message: `🏆 <b>Отличные новости! Вы победитель!</b>

📦 <b>Товар:</b> ${productName}
🎯 <b>Раунд:</b> ${roundId}
🔢 <b>Выигрышный номер:</b> <code>${winningNumber}</code>
💰 <b>Сумма приза:</b> <b>${prizeAmount} TJS</b>
🏅 <b>Тип приза:</b> ${getPrizeTypeText(prizeType, 'ru-RU')}

🎊 <b>Поздравляем! Удача на вашей стороне!</b>
📞 Мы свяжемся с вами в ближайшее время для организации получения приза
💝 Спасибо за участие, продолжайте поддерживать нас~`,
      emoji: '🎉'
    },
    'tg-TJ': {
      title: '🎉🎉🎉 Таҳният! Шумо ғолиб шудед! 🎉🎉🎉',
      message: `🏆 <b>Хабари хуб! Шумо ғолиб ҳастед!</b>

📦 <b>Маҳсулот:</b> ${productName}
🎯 <b>Давра:</b> ${roundId}
🔢 <b>Рақами ғолиб:</b> <code>${winningNumber}</code>
💰 <b>Маблағи ҷойиза:</b> <b>${prizeAmount} TJS</b>
🏅 <b>Навъи ҷойиза:</b> ${getPrizeTypeText(prizeType, 'tg-TJ')}

🎊 <b>Таҳният! Бахт дар тарафи шумост!</b>
📞 Мо бо шумо зуд тамос мегирем барои ташкили гирифтани ҷойиза
💝 Барои иштироки шумо ташаккур, идомаи дастгирии мо кунед~`,
      emoji: '🎉'
    }
  };

  const template = templates[userLanguage as keyof typeof templates] || templates['zh-CN'];
  return `${template.title}\n\n${template.message}`;
}

// 获取按钮文本
function getButtonText(language: string, buttonType: string): string {
  const buttonTexts = {
    'zh-CN': {
      claimPrize: '🎁 立即领奖',
      viewRecords: '📋 查看记录',
      continueLottery: '🎲 继续抽奖'
    },
    'en-US': {
      claimPrize: '🎁 Claim Prize',
      viewRecords: '📋 View Records',
      continueLottery: '🎲 Continue Lottery'
    },
    'ru-RU': {
      claimPrize: '🎁 Получить приз',
      viewRecords: '📋 Посмотреть записи',
      continueLottery: '🎲 Продолжить лотерею'
    },
    'tg-TJ': {
      claimPrize: '🎁 Ҷойиза гирифтан',
      viewRecords: '📋 Дидани сабтҳо',
      continueLottery: '🎲 Идомаи розиғш'
    }
  };

  const texts = buttonTexts[language as keyof typeof buttonTexts] || buttonTexts['zh-CN'];
  return texts[buttonType as keyof typeof texts] || 'Button';
}

// 获取奖金类型文本
function getPrizeTypeText(prizeType: string, language: string): string {
  const typeTexts = {
    'zh-CN': {
      jackpot: '💎 超级大奖',
      major: '🏆 大奖',
      medium: '🥉 中奖',
      standard: '🎊 奖品'
    },
    'en-US': {
      jackpot: '💎 Super Jackpot',
      major: '🏆 Major Prize',
      medium: '🥉 Prize',
      standard: '🎊 Prize'
    },
    'ru-RU': {
      jackpot: '💎 Суперджекпот',
      major: '🏆 Главный приз',
      medium: '🥉 Приз',
      standard: '🎊 Приз'
    },
    'tg-TJ': {
      jackpot: '💎 Джекпоти бузург',
      major: '🏆 Ҷойизаи калон',
      medium: '🥉 Ҷойиза',
      standard: '🎊 Ҷойиза'
    }
  };

  const texts = typeTexts[language as keyof typeof typeTexts] || typeTexts['zh-CN'];
  return texts[prizeType as keyof typeof texts] || texts.standard;
}

// Bot启动函数
async function startBot() {
  try {
    logger.info('正在启动 LuckyMart TJ Telegram Bot...');
    
    // 初始化各个服务
    initializeMessageQueue();
    initializeUserInfoService();
    initializeRewardNotifier();
    initializeNotificationService();
    
    // 启动Bot
    bot.launch();
    
    logger.info('✅ LuckyMart TJ Telegram Bot 启动成功！', {
      botUsername: bot.botInfo?.username,
      botId: bot.botInfo?.id,
      timestamp: new Date().toISOString()
    });
    
    // 优雅关闭处理
    process.once('SIGINT', () => stopBot('SIGINT'));
    process.once('SIGTERM', () => stopBot('SIGTERM'));
    
    return bot;
  } catch (error) {
    logger.error('Bot 启动失败', { error: (error as Error).message }, error as Error);
    throw error;
  }
}

// Bot停止函数
function stopBot(signal: string) {
  logger.info(`收到 ${signal} 信号，正在停止 Bot...`);
  
  try {
    bot.stop(signal);
    
    // 停止各个服务
    if (notificationService) {
      notificationService.stop();
    }
    
    logger.info('Bot 已安全停止');
    process.exit(0);
  } catch (error) {
    logger.error('Bot 停止时发生错误', { error: (error as Error).message }, error as Error);
    process.exit(1);
  }
}

// 如果直接运行此文件，启动Bot
if (require.main === module) {
  startBot();
  
  // 启动定时任务
  // 每小时检查一次待开奖彩票
  setInterval(checkPendingLotteries, 60 * 60 * 1000);
  
  // 每天凌晨重置免费次数
  setInterval(resetDailyFreeCount, 24 * 60 * 60 * 1000);
}

export default bot;
