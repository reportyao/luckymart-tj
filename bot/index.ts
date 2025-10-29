import { Telegraf, Markup } from 'telegraf';
import { prisma } from '../lib/prisma';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'http://localhost:3000';

if (!BOT_TOKEN) {
  console.error('错误：TELEGRAM_BOT_TOKEN未配置');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// /start命令 - 用户冷启动 + 用户注册
bot.command('start', async (ctx) => {
  const telegramUser = ctx.from;
  const telegramId = telegramUser.id.toString();
  
  try {
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

    await ctx.reply(welcomeMessage, 
      Markup.inlineKeyboard([
        [Markup.button.webApp('进入幸运集市', MINI_APP_URL)],
        [Markup.button.callback('新手教程', 'help_tutorial')],
        [Markup.button.callback('语言设置', 'language_settings')]
      ])
    );
    
  } catch (error) {
    console.error('Start command error:', error);
    await ctx.reply('注册失败，请稍后重试或联系客服');
  }
});

// /balance命令 - 查询余额
bot.command('balance', async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    
    const user = await prisma.users.findUnique({
      where: { telegramId }
    });

    if (!user) {
      await ctx.reply('您还未注册，请点击 /start 开始使用');
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

    await ctx.reply(message,
      Markup.inlineKeyboard([
        [Markup.button.webApp('前往充值', `${MINI_APP_URL}/recharge`)],
        [Markup.button.webApp('查看订单', `${MINI_APP_URL}/orders`)]
      ])
    );
  } catch (error) {
    console.error('Balance command error:', error);
    await ctx.reply('查询失败，请稍后重试');
  }
});

// /orders命令 - 查询订单
bot.command('orders', async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    
    const user = await prisma.users.findUnique({
      where: { telegramId }
    });

    if (!user) {
      await ctx.reply('您还未注册，请点击 /start 开始使用');
      return;
    }

    // 查询最近的订单
    const orders = await prisma.orders.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (orders.length === 0) {
      await ctx.reply('您还没有订单',
        Markup.inlineKeyboard([
          [Markup.button.webApp('去夺宝', MINI_APP_URL)]
        ])
      );
      return;
    }

    let message = '您的最近订单：\n\n';
    orders.forEach((order, index) => {
      message += `${index + 1}. 订单号：${order.orderNumber}\n`;
      message += `   状态：${getOrderStatusText(order.paymentStatus)}\n`;
      message += `   金额：${order.totalAmount} TJS\n\n`;
    });

    await ctx.reply(message,
      Markup.inlineKeyboard([
        [Markup.button.webApp('查看全部订单', `${MINI_APP_URL}/orders`)]
      ])
    );
  } catch (error) {
    console.error('Orders command error:', error);
    await ctx.reply('查询失败，请稍后重试');
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

// 发送通知函数（供其他模块调用）
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

// 错误处理
bot.catch((err, ctx) => {
  console.error(`Bot error for ${ctx.updateType}:`, err);
});

// 启动Bot
export function startBot() {
  bot.launch();
  console.log('Telegram Bot已启动');

  // 优雅关闭
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

// 如果直接运行此文件，启动Bot
if (require.main === module) {
  startBot();
}

export default bot;
