/**
 * 多语言通知服务
 * 基于翻译文件动态生成多语言Telegram消息
 */

import { Telegraf, Context, Markup } from 'telegraf';
import { prisma } from '../../lib/prisma';
import { logger } from '../utils/logger';
import { Language, NotificationType } from '../utils/notification-templates';
import { apiConfig } from '../../lib/config/api-config';

interface BotTranslation {
  bot: {
    [key: string]: any;
  };
}

interface NotificationServiceOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export class NotificationService {
  private bot: Telegraf;
  private options: Required<NotificationServiceOptions>;
  private translations: Map<Language, BotTranslation> = new Map();
  private messageQueue: Array<{
    chatId: number;
    message: string;
    keyboard?: any;
    parseMode?: 'HTML' | 'Markdown';
    retryCount: number;
  }> = [];
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(bot: Telegraf, options: NotificationServiceOptions = {}) {
    this.bot = bot;
    this.options = {
      maxRetries: options.maxRetries || 3,
      initialDelay: options.initialDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      backoffMultiplier: options.backoffMultiplier || 2
    };

    this.loadTranslations();
    this.startMessageProcessor();
  }

  /**
   * 加载翻译文件
   */
  private async loadTranslations() {
    const languages = Object.values(Language);
    
    for (const lang of languages) {
      try {
        // 动态加载翻译文件
        const translationModule = await import(`../../src/locales/${lang}/bot.json`);
        this.translations.set(lang, translationModule.default);
        logger.info(`加载 ${lang} 翻译文件成功`);
      } catch (error) {
        logger.warn(`加载 ${lang} 翻译文件失败: ${(error as Error).message}`);
        // 使用默认语言作为回退
        if (lang !== Language.TJ) {
          try {
            const defaultModule = await import(`../../src/locales/${Language.TJ}/bot.json`);
            this.translations.set(lang, defaultModule.default);
          } catch (fallbackError) {
            logger.error(`加载默认翻译文件失败: ${(fallbackError as Error).message}`);
          }
        }
      }
    }
  }

  /**
   * 获取翻译文本
   */
  private getTranslation(language: Language, key: string): string {
    const translation = this.translations.get(language);
    if (!translation) {
      logger.warn(`翻译文件未找到: ${language}`);
      return key; // 返回键作为fallback
    }

    const keys = key.split('.');
    let value: any = translation;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        logger.warn(`翻译键未找到: ${key} (语言: ${language})`);
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  /**
   * 替换模板变量
   */
  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
    
    return result;
  }

  /**
   * 发送欢迎消息
   */
  async sendWelcomeMessage(userId: number, telegramId: string, chatId: number, userData: any) {
    try {
      const user = await prisma.users.findUnique({
        where: { telegramId }
      });

      if (!user) {
        logger.warn(`用户未找到: ${telegramId}`);
        return false;
      }

      const language = this.getUserLanguage(user.language);
      const variables = {
        firstName: userData.first_name || userData.username || '用户',
        balance: user.balance
      };

      const title = this.getTranslation(language, 'bot.welcome.title');
      const message = this.getTranslation(language, 'bot.welcome.message');
      const processedMessage = this.replaceVariables(message, variables);

      const buttonTexts = {
        enter_market: this.getTranslation(language, 'bot.welcome.buttons.enter_market'),
        tutorial: this.getTranslation(language, 'bot.welcome.buttons.tutorial'),
        language_settings: this.getTranslation(language, 'bot.welcome.buttons.language_settings')
      };

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.webApp(buttonTexts.enter_market, apiConfig.telegram.miniAppURL)],
        [Markup.button.callback(buttonTexts.tutorial, 'help_tutorial')],
        [Markup.button.callback(buttonTexts.language_settings, 'language_settings')]
      ]);

      await this.queueMessage(chatId, `${title}\n\n${processedMessage}`, keyboard);
      return true;
    } catch (error) {
      logger.error('发送欢迎消息失败', { userId, telegramId, error: (error as Error).message }, error as Error);
      return false;
    }
  }

  /**
   * 发送注册奖励通知
   */
  async sendRegistrationReward(userId: number, telegramId: string, rewardAmount: number = 50) {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        logger.warn(`用户未找到: ${userId}`);
        return false;
      }

      const language = this.getUserLanguage(user.language);
      const chatId = parseInt(user.telegramId);

      const variables = {
        rewardAmount,
        balance: user.balance
      };

      const title = this.getTranslation(language, 'bot.registration_reward.title');
      const message = this.getTranslation(language, 'bot.registration_reward.message');
      const processedMessage = this.replaceVariables(message, variables);

      const buttonTexts = {
        start_lottery: this.getTranslation(language, 'bot.registration_reward.buttons.start_lottery'),
        browse_products: this.getTranslation(language, 'bot.registration_reward.buttons.browse_products')
      };

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.webApp(buttonTexts.start_lottery, apiConfig.telegram.miniAppURL)],
        [Markup.button.webApp(buttonTexts.browse_products, apiConfig.telegram.miniAppURL)]
      ]);

      await this.queueMessage(chatId, `${title}\n\n${processedMessage}`, keyboard);
      return true;
    } catch (error) {
      logger.error('发送注册奖励通知失败', { userId, telegramId, error: (error as Error).message }, error as Error);
      return false;
    }
  }

  /**
   * 发送余额查询结果
   */
  async sendBalanceQuery(telegramId: string, chatId: number) {
    try {
      const user = await prisma.users.findUnique({
        where: { telegramId }
      });

      if (!user) {
        const errorMessage = this.getTranslation(Language.TJ, 'bot.errors.user_not_found');
        await this.queueMessage(chatId, errorMessage);
        return false;
      }

      const language = this.getUserLanguage(user.language);
      const variables = {
        balance: user.balance,
        platformBalance: user.platformBalance,
        vipLevel: user.vipLevel,
        freeCount: user.freeDailyCount
      };

      const title = this.getTranslation(language, 'bot.balance.title');
      const message = this.getTranslation(language, 'bot.balance.message');
      const processedMessage = this.replaceVariables(message, variables);

      const buttonTexts = {
        recharge: this.getTranslation(language, 'bot.balance.buttons.recharge'),
        orders: this.getTranslation(language, 'bot.balance.buttons.orders')
      };

      const appUrl = apiConfig.telegram.miniAppURL;
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.webApp(buttonTexts.recharge, `${appUrl}/recharge`)],
        [Markup.button.webApp(buttonTexts.orders, `${appUrl}/orders`)]
      ]);

      await this.queueMessage(chatId, `${title}\n\n${processedMessage}`, keyboard);
      return true;
    } catch (error) {
      logger.error('发送余额查询失败', { telegramId, error: (error as Error).message }, error as Error);
      return false;
    }
  }

  /**
   * 发送订单查询结果
   */
  async sendOrderQuery(telegramId: string, chatId: number) {
    try {
      const user = await prisma.users.findUnique({
        where: { telegramId }
      });

      if (!user) {
        const errorMessage = this.getTranslation(Language.TJ, 'bot.errors.user_not_found');
        await this.queueMessage(chatId, errorMessage);
        return false;
      }

      const language = this.getUserLanguage(user.language);
      const orders = await prisma.orders.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      const title = this.getTranslation(language, 'bot.orders.title');
      let message: string;

      if (orders.length === 0) {
        message = this.getTranslation(language, 'bot.orders.empty');
      } else {
        let orderList = '';
        orders.forEach((order, index) => {
          orderList += `${index + 1}. ${order.orderNumber} - ${order.totalAmount} TJS\n`;
        });
        
        const template = this.getTranslation(language, 'bot.orders.message');
        message = this.replaceVariables(template, {
          firstName: user.firstName || user.username || '用户',
          orderList
        });
      }

      const buttonText = this.getTranslation(language, 'bot.orders.buttons.all_orders');
      const appUrl = apiConfig.telegram.miniAppURL;
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.webApp(buttonText, `${appUrl}/orders`)]
      ]);

      await this.queueMessage(chatId, `${title}\n\n${message}`, keyboard);
      return true;
    } catch (error) {
      logger.error('发送订单查询失败', { telegramId, error: (error as Error).message }, error as Error);
      return false;
    }
  }

  /**
   * 发送帮助信息
   */
  async sendHelpMessage(telegramId: string, chatId: number) {
    try {
      const user = await prisma.users.findUnique({
        where: { telegramId }
      });

      const language = user ? this.getUserLanguage(user.language) : Language.TJ;

      const title = this.getTranslation(language, 'bot.help.title');
      const message = this.getTranslation(language, 'bot.help.message');

      const buttonTexts = {
        tutorial: this.getTranslation(language, 'bot.help.buttons.tutorial'),
        contact_support: this.getTranslation(language, 'bot.help.buttons.contact_support')
      };

      const appUrl = apiConfig.telegram.miniAppURL;
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.webApp(buttonTexts.tutorial, `${appUrl}/tutorial`)],
        [Markup.button.url(buttonTexts.contact_support, 'https://t.me/luckymart_support')]
      ]);

      await this.queueMessage(chatId, `${title}\n\n${message}`, keyboard);
      return true;
    } catch (error) {
      logger.error('发送帮助消息失败', { telegramId, error: (error as Error).message }, error as Error);
      return false;
    }
  }

  /**
   * 发送语言选择菜单
   */
  async sendLanguageSelection(telegramId: string, chatId: number) {
    try {
      const title = this.getTranslation(Language.TJ, 'bot.language_selection.title');
      const message = this.getTranslation(Language.TJ, 'bot.language_selection.message');

      const buttonTexts = {
        chinese: this.getTranslation(Language.TJ, 'bot.language_selection.buttons.chinese'),
        english: this.getTranslation(Language.TJ, 'bot.language_selection.buttons.english'),
        russian: this.getTranslation(Language.TJ, 'bot.language_selection.buttons.russian'),
        tajik: this.getTranslation(Language.TJ, 'bot.language_selection.buttons.tajik')
      };

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(buttonTexts.chinese, 'lang_zh-CN')],
        [Markup.button.callback(buttonTexts.english, 'lang_en-US')],
        [Markup.button.callback(buttonTexts.russian, 'lang_ru-RU')],
        [Markup.button.callback(buttonTexts.tajik, 'lang_tg-TJ')]
      ]);

      await this.queueMessage(chatId, `${title}\n\n${message}`, keyboard);
      return true;
    } catch (error) {
      logger.error('发送语言选择失败', { telegramId, error: (error as Error).message }, error as Error);
      return false;
    }
  }

  /**
   * 发送语言变更确认
   */
  async sendLanguageChanged(telegramId: string, chatId: number, newLanguage: string) {
    try {
      const user = await prisma.users.findUnique({
        where: { telegramId }
      });

      if (!user) {
        return false;
      }

      const language = this.getUserLanguage(newLanguage as Language);
      
      const title = this.getTranslation(language, 'bot.language_changed.title');
      const message = this.getTranslation(language, 'bot.language_changed.message');
      const processedMessage = this.replaceVariables(message, {
        language: this.getLanguageDisplayName(newLanguage as Language)
      });

      await this.queueMessage(chatId, `${title}\n\n${processedMessage}`);
      return true;
    } catch (error) {
      logger.error('发送语言变更确认失败', { telegramId, error: (error as Error).message }, error as Error);
      return false;
    }
  }

  /**
   * 发送自定义通知
   */
  async sendCustomNotification(
    telegramId: string,
    type: string,
    variables: Record<string, any> = {},
    actionUrl?: string
  ) {
    try {
      const user = await prisma.users.findUnique({
        where: { telegramId }
      });

      if (!user) {
        logger.warn(`用户未找到: ${telegramId}`);
        return false;
      }

      const language = this.getUserLanguage(user.language);
      const chatId = parseInt(user.telegramId);

      const title = this.getTranslation(language, `bot.${type}.title`);
      const messageTemplate = this.getTranslation(language, `bot.${type}.message`);
      const processedMessage = this.replaceVariables(messageTemplate, variables);

      let keyboard: any = undefined;
      const buttons = this.getTranslation(language, `bot.${type}.buttons`);
      
      if (buttons && typeof buttons === 'object') {
        const buttonArray = Object.entries(buttons).map(([key, text]) => {
          if (actionUrl) {
            return [Markup.button.webApp(text as string, actionUrl)];
          } else {
            return [Markup.button.callback(text as string, key)];
          }
        });
        keyboard = Markup.inlineKeyboard(buttonArray.flat());
      }

      await this.queueMessage(chatId, `${title}\n\n${processedMessage}`, keyboard);
      return true;
    } catch (error) {
      logger.error('发送自定义通知失败', { telegramId, type, error: (error as Error).message }, error as Error);
      return false;
    }
  }

  /**
   * 获取用户语言设置
   */
  private getUserLanguage(userLanguage?: string): Language {
    const supportedLanguages = Object.values(Language);
    return supportedLanguages.includes(userLanguage as Language) 
      ? userLanguage as Language 
      : Language.TJ; // 默认塔吉克语
  }

  /**
   * 获取语言显示名称
   */
  private getLanguageDisplayName(language: Language): string {
    const names = {
      [Language.ZH]: '中文',
      [Language.EN]: 'English',
      [Language.RU]: 'Русский',
      [Language.TJ]: 'Тоҷикӣ'
    };
    return names[language] || language;
  }

  /**
   * 将消息加入队列
   */
  private async queueMessage(
    chatId: number, 
    message: string, 
    keyboard?: any, 
    parseMode?: 'HTML' | 'Markdown'
  ) {
    this.messageQueue.push({
      chatId,
      message,
      keyboard,
      parseMode,
      retryCount: 0
    });

    logger.debug('消息已加入队列', { chatId, queueLength: this.messageQueue.length });
  }

  /**
   * 启动消息处理器
   */
  private startMessageProcessor() {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(async () => {
      if (this.isProcessing || this.messageQueue.length === 0) {
        return;
      }

      this.isProcessing = true;
      const message = this.messageQueue.shift();

      if (message) {
        try {
          await this.bot.telegram.sendMessage(message.chatId, message.message, {
            reply_markup: message.keyboard,
            parse_mode: message.parseMode
          });
          logger.debug('消息发送成功', { chatId: message.chatId });
        } catch (error) {
          logger.error('消息发送失败', { 
            chatId: message.chatId, 
            error: (error as Error).message 
          }, error as Error);

          // 重试逻辑
          if (message.retryCount < this.options.maxRetries) {
            message.retryCount++;
            const delay = Math.min(
              this.options.initialDelay * Math.pow(this.options.backoffMultiplier, message.retryCount),
              this.options.maxDelay
            );
            
            setTimeout(() => {
              this.messageQueue.push(message);
            }, delay);
            
            logger.info('消息将在稍后重试', { 
              chatId: message.chatId, 
              retryCount: message.retryCount, 
              delay 
            });
          }
        }
      }

      this.isProcessing = false;
    }, 1000); // 每秒处理一条消息
  }

  /**
   * 获取服务统计
   */
  public getServiceStats() {
    return {
      queueLength: this.messageQueue.length,
      isProcessing: this.isProcessing,
      translationsLoaded: this.translations.size,
      languages: Array.from(this.translations.keys())
    };
  }

  /**
   * 停止服务
   */
  public stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    logger.info('通知服务已停止');
  }
}

export default NotificationService;