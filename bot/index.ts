import { Telegraf, Markup } from 'telegraf';
import { prisma } from '../lib/prisma';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'http://localhost:3000';

if (!BOT_TOKEN) {
  console.error('错误：TELEGRAM_BOT_TOKEN未配置');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// /start命令 - 用户冷启动
bot.command('start', async (ctx) => {
  const user = ctx.from;
  
  const welcomeMessage = `
欢迎来到LuckyMart TJ幸运集市！

这里有超多心仪商品等你来夺宝：
- 1夺宝币 = 1份，超低门槛
- 新用户注册即送50夺宝币
- 每日免费参与3次
- 公平透明的开奖算法

点击下方按钮进入幸运集市，开始您的幸运之旅吧！
`;

  await ctx.reply(welcomeMessage, 
    Markup.inlineKeyboard([
      [Markup.button.webApp('进入幸运集市', MINI_APP_URL)],
      [Markup.button.callback('新手教程', 'help_tutorial')],
      [Markup.button.callback('语言设置', 'language_settings')]
    ])
  );
});

// /balance命令 - 查询余额
bot.command('balance', async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    
    const user = await prisma.users.findUnique({
      where: { telegramId: BigInt(telegramId) }
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
    const telegramId = ctx.from.id;
    
    const user = await prisma.users.findUnique({
      where: { telegramId: BigInt(telegramId) }
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
  const telegramId = ctx.from.id;

  try {
    await prisma.users.update({
      where: { telegramId: BigInt(telegramId) },
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
    await ctx.answerCbQuery('切换失败');
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

// 发送通知函数（供其他模块调用）
export async function sendNotification(telegramId: number, message: string, options?: any) {
  try {
    await bot.telegram.sendMessage(telegramId, message, options);
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
