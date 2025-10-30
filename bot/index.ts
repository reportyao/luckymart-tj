import { Telegraf, Markup } from 'telegraf';
import { prisma } from '../lib/prisma';
import { logger, performanceLogger, errorTracker } from './utils/logger';
import { faultToleranceManager } from './utils/fault-tolerance-manager';
import { MessageQueue } from './utils/message-queue';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'http://localhost:3000';

if (!BOT_TOKEN) {
  logger.error('错误：TELEGRAM_BOT_TOKEN未配置');
  process.exit(1);
}

// 全局消息队列实例
let messageQueue: MessageQueue;

const bot = new Telegraf(BOT_TOKEN);

// 初始化消息队列
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

    // 使用消息队列发送欢迎消息
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

    // 记录业务事件
    logger.business('user_registered', telegramId, {
      userId: user.id,
      username: user.username,
      initialBalance: user.balance
    });
    
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
      await messageQueue.addMessage('telegram', {
        type: 'send_message',
        chatId: ctx.chat.id,
        text: '您还未注册，请点击 /start 开始使用'
      });
      return;
    }

    const message = `
您的账户余额：

夺宝币：${user.balance.toString()} 币
平台余额：${user.platformBalance.toString()} TJS
VIP等级：${user.vipLevel}
今日免费次数：${user.freeDailyCount}/3

点击下方按钮充值或查看更多
`;

    // 使用消息队列发送余额信息
    await messageQueue.addMessage('telegram', {
      type: 'send_message',
      chatId: ctx.chat.id,
      text: message,
      keyboard: Markup.inlineKeyboard([
        [Markup.button.webApp('前往充值', `${MINI_APP_URL}/recharge`)],
        [Markup.button.webApp('查看订单', `${MINI_APP_URL}/orders`)]
      ])
    });

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
      await messageQueue.addMessage('telegram', {
        type: 'send_message',
        chatId: ctx.chat.id,
        text: '您还未注册，请点击 /start 开始使用'
      });
      return;
    }

    // 查询最近的订单
    const orders = await prisma.orders.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

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

    // 使用消息队列发送订单信息
    await messageQueue.addMessage('telegram', {
      type: 'send_message',
      chatId: ctx.chat.id,
      text: message,
      keyboard: Markup.inlineKeyboard([
        [Markup.button.webApp('查看全部订单', `${MINI_APP_URL}/orders`)]
      ])
    });

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
});

// /language命令 - 切换语言
bot.command('language', async (ctx) => {
  await ctx.reply('请选择语言 / Choose Language / Выберите язык:',
    Markup.inlineKeyboard([
      [Markup.button.callback('中文', 'lang_zh')],
      [Markup.button.callback('English', 'lang_en')],
      [Markup.button.callback('Русский', 'lang_ru')]
    ])
  );
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

// 语言切换回调
bot.action(/lang_(.+)/, async (ctx) => {
  const lang = ctx.match[1];
  const telegramId = ctx.from.id.toString();

  try {
    await prisma.users.update({
      where: { telegramId },
      data: { language: lang }
    });

    const messages: Record<string, string> = {
      zh: '语言已切换为中文',
      en: 'Language switched to English',
      ru: 'Язык переключен на русский'
    };

    await ctx.answerCbQuery();
    await ctx.reply(messages[lang] || messages.zh);
  } catch (error) {
    console.error('Language switch error:', error);
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
📱 关注订单状态变化

// 错误处理
bot.catch((err, ctx) => {
  const updateType = ctx.updateType || 'unknown';
  const userId = ctx.from?.id.toString() || 'unknown';
  
  logger.error(`Bot error for ${updateType}`, {
    userId,
    updateType,
    error: err.message,
    stack: err.stack
  }, err);
  
  errorTracker.recordError(`bot_${updateType}_error`, err);
  
  // 尝试发送错误回复给用户
  if (ctx.chat && ctx.from) {
    messageQueue?.addMessage('telegram', {
      type: 'send_message',
      chatId: ctx.chat.id,
      text: '抱歉，处理您请求时出现了问题，请稍后重试或联系客服'
    }).catch(replyError => {
      logger.error('Failed to send error reply to user', { 
        userId, 
        error: (replyError as Error).message 
      }, replyError as Error);
    });
  }
});

// 启动Bot
export function startBot() {
  try {
    // 初始化消息队列
    initializeMessageQueue();
    
    // 启动Bot
    bot.launch();
    
    logger.info('Telegram Bot启动成功', {
      tokenConfigured: !!BOT_TOKEN,
      miniAppUrl: MINI_APP_URL,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });

    // 设置优雅关闭
    process.once('SIGINT', () => {
      logger.info('收到SIGINT信号，正在关闭Bot...');
      bot.stop('SIGINT');
    });
    
    process.once('SIGTERM', () => {
      logger.info('收到SIGTERM信号，正在关闭Bot...');
      bot.stop('SIGTERM');
    });

    // 记录Bot启动事件
    logger.business('bot_started', undefined, {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      nodeVersion: process.version
    });
    
  } catch (error) {
    logger.error('Bot启动失败', { error: (error as Error).message }, error as Error);
    throw error;
  }
}

// 获取Bot实例（供其他模块使用）
export function getBot() {
  return bot;
}

// 获取消息队列（供其他模块使用）
export function getMessageQueue(): MessageQueue | undefined {
  return messageQueue;
}

// 转售状态推送
  static resaleStatusUpdate(resaleId: string, status: string, progress?: number) {
    const statusMessages = {
      created: `📦 转售申请已创建\n转售ID：${resaleId}\n正在寻找买家...`,
      matching: `🔍 正在为您寻找买家\n转售ID：${resaleId}\n⏰ 预计匹配时间：5-10分钟`,
      matched: `🎯 找到买家！\n转售ID：${resaleId}\n正在处理交易...`,
      sold: `🎉 转售成功！\n转售ID：${resaleId}\n💰 资金已到账（扣除5%手续费）`,
      cancelled: `❌ 转售已取消\n转售ID：${resaleId}`
    };
    
    const message = statusMessages[status as keyof typeof statusMessages];
    if (progress && status === 'matching') {
      return `${message}\n📊 匹配进度：${progress}%`;
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
      return `🎉 恭喜您中奖！

🎁 商品：${productName}
🎫 期号：${roundId}
👑 恭喜您获得本期奖品！

💳 我们将联系您安排发货
📦 请保持联系方式畅通`;
    } else {
      return `🎲 开奖结果

🎁 商品：${productName}
🎫 期号：${roundId}

😔 很遗憾，本次未中奖
💪 继续参与，下期中奖的就是您！

🎯 立即参与更多商品夺宝`;
    }
  }

  // VIP等级提升通知
  static vipLevelUp(oldLevel: number, newLevel: number, benefits: string[]) {
    const levelNames = ['普通用户', '青铜VIP', '白银VIP', '黄金VIP', '铂金VIP', '钻石VIP'];
    const newLevelName = levelNames[newLevel] || `VIP${newLevel}`;
    
    return `🏆 VIP等级提升！

从 ${levelNames[oldLevel] || `VIP${oldLevel}`} 升级到 ${newLevelName}

🎁 新增特权：
${benefits.map(benefit => `• ${benefit}`).join('\n')}

感谢您的支持！`;
  }
}

// 增强的发送通知函数（供其他模块调用）
export async function sendNotification(telegramId: string, message: string, options?: any) {
  try {
    const numericId = parseInt(telegramId);
    await bot.telegram.sendMessage(numericId, message, options);
    return true;
  } catch (error) {
    console.error('Send notification error:', error);
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
    const users = await prisma.users.findMany({
      where: {
        lastFreeResetDate: {
          lt: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    for (const user of users) {
      await prisma.users.update({
        where: { id: user.id },
        data: {
          freeDailyCount: 0,
          lastFreeResetDate: new Date()
        }
      });
    }

    console.log(`重置了 ${users.length} 个用户的每日免费次数`);
  } catch (error) {
    console.error('重置每日免费次数失败:', error);
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
      console.log(`准备开奖：${round.id} - ${round.lotteryProduct?.name}`);
    }
  } catch (error) {
    console.error('检查待开奖彩票失败:', error);
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
