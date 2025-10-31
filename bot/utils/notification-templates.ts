/**
 * Telegram Bot 通知模板系统
 * 支持多语言动态消息模板生成
 * 
 * 支持的语言:
 * - zh-CN: 中文 (简体)
 * - en-US: English 
 * - ru-RU: Русский
 * - tg-TJ: Тоҷикӣ (塔吉克语)
 */

import { Markup } from 'telegraf';
import { apiConfig } from '../../lib/config/api-config';

export enum Language {
  ZH = 'zh-CN',
  EN = 'en-US', 
  RU = 'ru-RU',
  TJ = 'tg-TJ'
}

export enum NotificationType {
  // 用户注册和欢迎
  WELCOME_MESSAGE = 'welcome_message',
  REGISTRATION_REWARD = 'registration_reward',
  
  // 账户相关
  BALANCE_QUERY = 'balance_query',
  ACCOUNT_INFO = 'account_info',
  
  // 订单相关
  ORDER_QUERY = 'order_query',
  ORDER_STATUS_CHANGE = 'order_status_change',
  PAYMENT_SUCCESS = 'payment_success',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  
  // 抽奖相关
  LOTTERY_RESULT_WIN = 'lottery_result_win',
  LOTTERY_RESULT_LOSE = 'lottery_result_lose',
  LOTTERY_ROUND_START = 'lottery_round_start',
  
  // VIP相关
  VIP_LEVEL_UP = 'vip_level_up',
  VIP_BENEFITS = 'vip_benefits',
  
  // 转售相关
  RESALE_STATUS_UPDATE = 'resale_status_update',
  RESALE_MATCHED = 'resale_matched',
  RESALE_SOLD = 'resale_sold',
  
  // 系统通知
  SYSTEM_NOTIFICATION = 'system_notification',
  MAINTENANCE_NOTICE = 'maintenance_notice',
  NEW_FEATURES = 'new_features',
  
  // 邀请奖励
  REFERRAL_REWARD = 'referral_reward',
  INVITATION_SUCCESS = 'invitation_success',
  
  // 帮助和支持
  HELP_MESSAGE = 'help_message',
  TUTORIAL = 'tutorial',
  SUPPORT_MESSAGE = 'support_message',
  FAQ = 'faq',
  
  // 语言设置
  LANGUAGE_SELECTION = 'language_selection',
  LANGUAGE_CHANGED = 'language_changed',
  
  // 通知设置
  NOTIFICATION_SETTINGS = 'notification_settings',
  NOTIFICATION_PREFERENCES = 'notification_preferences'
}

export interface NotificationTemplate {
  type: NotificationType;
  title: Record<Language, string>;
  message: Record<Language, string>;
  buttons?: Record<Language, Array<{ text: string; action: string; url?: string }>>;
  parseMode?: 'HTML' | 'Markdown';
}

export interface UserContext {
  telegramId: string;
  userId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  language: Language;
  balance: number;
  platformBalance: number;
  vipLevel: number;
  orderCount?: number;
  lastActivity?: Date;
}

export interface NotificationData {
  user: UserContext;
  type: NotificationType;
  variables: Record<string, any>;
  actionUrl?: string;
}

/**
 * 多语言通知模板配置
 */
export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  [NotificationType.WELCOME_MESSAGE]: {
    type: NotificationType.WELCOME_MESSAGE,
    title: {
      [Language.ZH]: '🎉 欢迎来到 LuckyMart TJ 幸运集市！',
      [Language.EN]: '🎉 Welcome to LuckyMart TJ Lucky Market!',
      [Language.RU]: '🎉 Добро пожаловать в LuckyMart TJ!',
      [Language.TJ]: '🎉 Ба LuckyMart TJ Хуш омадед!'
    },
    message: {
      [Language.ZH]: `🌟 亲爱的 {firstName}，欢迎来到幸运集市！

这里有超多心仪商品等你来夺宝：
• 1夺宝币 = 1份，超低门槛  
• 新用户注册即送50夺宝币 🎁
• 每日免费参与3次
• 公平透明的开奖算法

您的账户已创建，当前余额：{balance} 夺宝币

点击下方按钮进入幸运集市，开始您的幸运之旅吧！`,
      [Language.EN]: `🌟 Dear {firstName}, welcome to Lucky Market!

Here you can participate in lotteries for your favorite products:
• 1 Lottery Coin = 1 share, ultra-low threshold
• New users get 50 Lottery Coins as welcome gift 🎁
• 3 free daily participations
• Fair and transparent lottery algorithm

Your account has been created. Current balance: {balance} Lottery Coins

Click the button below to enter the Lucky Market and start your lucky journey!`,
      [Language.RU]: `🌟 Дорогой {firstName}, добро пожаловать на Счастливый Рынок!

Здесь вы можете участвовать в розыгрышах ваших любимых товаров:
• 1 Монеты участия = 1 доля, сверхнизкий порог
• Новые пользователи получают 50 Монет участия в качестве приветственного подарка 🎁
• 3 бесплатных участия в день
• Справедливый и прозрачный алгоритм розыгрыша

Ваш аккаунт создан. Текущий баланс: {balance} Монет участия

Нажмите кнопку ниже, чтобы войти на Счастливый Рынок и начать свое счастливое путешествие!`,
      [Language.TJ]: `🌟 Азизи {firstName}, ба Бозори бахтшинос хуш омадед!

Дар инҷо шумо метавонед дар розиғшиҳои маҳсулотҳои дӯстдоштаи худ ширкат кунед:
• 1 Нишонаи розиғш = 1 ҳисса, пасттарин маҳдудият
• Истифодабарандагони нав 50 Нишонаи розиғш ҳамчун инъом мегиранд 🎁
• 3 иштироки ройгон ҳаррӯза
• Алгоритми одил ва шаффофи розиғш

Ҳиссаи шумо сохта шудааст. Ҳоло баланс: {height} Нишонаи розиғш

Тугмаи поёнро пахш кунед то ба Бозори бахтшинос дохил шавед ва сафараи бахтнокатонро оғоз кунед!`
    },
    buttons: {
      [Language.ZH]: [
        { text: '🎲 进入幸运集市', action: 'enter_market' },
        { text: '📚 新手教程', action: 'tutorial' },
        { text: '🌐 语言设置', action: 'language_settings' }
      ],
      [Language.EN]: [
        { text: '🎲 Enter Lucky Market', action: 'enter_market' },
        { text: '📚 Tutorial', action: 'tutorial' },
        { text: '🌐 Language Settings', action: 'language_settings' }
      ],
      [Language.RU]: [
        { text: '🎲 Войти на Рынок', action: 'enter_market' },
        { text: '📚 Руководство', action: 'tutorial' },
        { text: '🌐 Языковые настройки', action: 'language_settings' }
      ],
      [Language.TJ]: [
        { text: '🎲 Дохил шудан ба Бозор', action: 'enter_market' },
        { text: '📚 Дастури кор', action: 'tutorial' },
        { text: '🌐 Танзимоти забон', action: 'language_settings' }
      ]
    }
  },

  [NotificationType.REGISTRATION_REWARD]: {
    type: NotificationType.REGISTRATION_REWARD,
    title: {
      [Language.ZH]: '🎁 注册奖励已到账',
      [Language.EN]: '🎁 Registration Reward Received',
      [Language.RU]: '🎁 Награда за регистрацию получена',
      [Language.TJ]: '🎁 Мукофоти сабтшудӣ гирифта шуд'
    },
    message: {
      [Language.ZH]: `🎉 恭喜您！注册奖励已到账

奖励金额：{rewardAmount} 夺宝币
当前余额：{balance} 夺宝币

感谢您选择 LuckyMart TJ！开始您的幸运之旅吧～`,
      [Language.EN]: `🎉 Congratulations! Registration reward has been credited

Reward amount: {rewardAmount} Lottery Coins
Current balance: {balance} Lottery Coins

Thank you for choosing LuckyMart TJ! Start your lucky journey now ~`,
      [Language.RU]: `🎉 Поздравляем! Награда за регистрацию начислена

Сумма награды: {rewardAmount} Монет участия
Текущий баланс: {balance} Монет участия

Спасибо, что выбрали LuckyMart TJ! Начните свое счастливое путешествие ~`,
      [Language.TJ]: `🎉 Таҳният! Мукофоти сабтшудӣ ҳисоб шудааст

Миқдори мукофот: {rewardAmount} Нишонаи розиғш
Ҳоло баланс: {balance} Нишонаи розиғш

Ташаккур барои интихоб кардани LuckyMart TJ! Сафараи бахтнокатонро оғоз кунед ~`
    },
    buttons: {
      [Language.ZH]: [
        { text: '🎲 开始夺宝', action: 'start_lottery' },
        { text: '🛒 浏览商品', action: 'browse_products' }
      ],
      [Language.EN]: [
        { text: '🎲 Start Lottery', action: 'start_lottery' },
        { text: '🛒 Browse Products', action: 'browse_products' }
      ],
      [Language.RU]: [
        { text: '🎲 Начать розыгрыш', action: 'start_lottery' },
        { text: '🛒 Просмотр товаров', action: 'browse_products' }
      ],
      [Language.TJ]: [
        { text: '🎲 Оғози розиғш', action: 'start_lottery' },
        { text: '🛒 Дидани маҳсулот', action: 'browse_products' }
      ]
    }
  },

  [NotificationType.BALANCE_QUERY]: {
    type: NotificationType.BALANCE_QUERY,
    title: {
      [Language.ZH]: '💰 账户余额',
      [Language.EN]: '💰 Account Balance',
      [Language.RU]: '💰 Баланс аккаунта',
      [Language.TJ]: '💰 Баланси ҳисса'
    },
    message: {
      [Language.ZH]: `💳 您的账户余额：

夺宝币：{balance} 币
平台余额：{platformBalance} TJS
VIP等级：{vipLevel}
今日免费次数：{freeCount}/3

点击下方按钮充值或查看更多`,
      [Language.EN]: `💳 Your account balance:

Lottery Coins: {balance} coins
Platform Balance: {platformBalance} TJS
VIP Level: {vipLevel}
Today's Free Uses: {freeCount}/3

Click the buttons below to recharge or view more`,
      [Language.RU]: `💳 Ваш баланс аккаунта:

Монеты участия: {balance} монет
Баланс платформы: {platformBalance} TJS
Уровень VIP: {vipLevel}
Бесплатные участия сегодня: {freeCount}/3

Нажмите кнопки ниже для пополнения или просмотра дополнительной информации`,
      [Language.TJ]: `💳 Баланси ҳиссаи шумо:

Нишонаҳои розиғш: {balance} нишона
Баланси платформа: {platformBalance} TJS
Сатҳи VIP: {vipLevel}
Истифодаҳои ройгон имрӯз: {freeCount}/3

Тугмаҳои поёнро пахш кунед барои пулгузорӣ ё дидани маълумоти иловагӣ`
    },
    buttons: {
      [Language.ZH]: [
        { text: '💳 前往充值', action: 'recharge', url: '{appUrl}/recharge' },
        { text: '📋 查看订单', action: 'orders', url: '{appUrl}/orders' }
      ],
      [Language.EN]: [
        { text: '💳 Go to Recharge', action: 'recharge', url: '{appUrl}/recharge' },
        { text: '📋 View Orders', action: 'orders', url: '{appUrl}/orders' }
      ],
      [Language.RU]: [
        { text: '💳 Пополнить баланс', action: 'recharge', url: '{appUrl}/recharge' },
        { text: '📋 Посмотреть заказы', action: 'orders', url: '{appUrl}/orders' }
      ],
      [Language.TJ]: [
        { text: '💳 Рафтан ба пулгузорӣ', action: 'recharge', url: '{appUrl}/recharge' },
        { text: '📋 Дидани фармоишҳо', action: 'orders', url: '{appUrl}/orders' }
      ]
    }
  },

  [NotificationType.ORDER_QUERY]: {
    type: NotificationType.ORDER_QUERY,
    title: {
      [Language.ZH]: '📋 订单查询',
      [Language.EN]: '📋 Order Inquiry',
      [Language.RU]: '📋 Запрос заказа',
      [Language.TJ]: '📋 Саволи фармоиш'
    },
    message: {
      [Language.ZH]: `📋 {firstName}，您的订单信息：

{hasOrders ? \`您最近有 \${orderCount} 个订单：

\${orderList}\` : '您还没有任何订单'}

点击下方按钮查看更多详情`,
      [Language.EN]: `📋 {firstName}, your order information:

{hasOrders ? \`You have \${orderCount} recent orders:

\${orderList}\` : 'You don\'t have any orders yet'}

Click the buttons below to view more details`,
      [Language.RU]: `📋 {firstName}, информация о ваших заказах:

{hasOrders ? \`У вас есть \${orderCount} недавних заказов:

\${orderList}\` : 'У вас пока нет заказов'}

Нажмите кнопки ниже, чтобы просмотреть более подробную информацию`,
      [Language.TJ]: `📋 {firstName}, маълумоти фармоишҳои шумо:

{hasOrders ? \`Шумо \${orderCount} фармоиши охирин доред:

\${orderList}\` : 'Шумо ҳоло ягон фармоиш надоред'}

Тугмаҳои поёнро пахш кунед барои дидани тафсилоти бештар`
    },
    buttons: {
      [Language.ZH]: [
        { text: '📋 查看全部订单', action: 'all_orders', url: '{appUrl}/orders' }
      ],
      [Language.EN]: [
        { text: '📋 View All Orders', action: 'all_orders', url: '{appUrl}/orders' }
      ],
      [Language.RU]: [
        { text: '📋 Посмотреть все заказы', action: 'all_orders', url: '{appUrl}/orders' }
      ],
      [Language.TJ]: [
        { text: '📋 Дидани ҳамаи фармоишҳо', action: 'all_orders', url: '{appUrl}/orders' }
      ]
    }
  },

  [NotificationType.ORDER_STATUS_CHANGE]: {
    type: NotificationType.ORDER_STATUS_CHANGE,
    title: {
      [Language.ZH]: '📦 订单状态更新',
      [Language.EN]: '📦 Order Status Update',
      [Language.RU]: '📦 Обновление статуса заказа',
      [Language.TJ]: '📦 Навсозии ҳолати фармоиш'
    },
    message: {
      [Language.ZH]: `📦 订单 {orderNumber} 状态已更新

状态：{status}
金额：{amount} TJS
{hasTracking ? \`运单号：\${trackingNumber}\` : ''}

{status === 'paid' ? '正在为您安排发货，请耐心等待～' : 
 status === 'shipped' ? '预计 2-3 个工作日送达' :
 status === 'delivered' ? '感谢您的购买，欢迎再次光临！' :
 '请及时查看订单详情'}`,
      [Language.EN]: `📦 Order {orderNumber} status has been updated

Status: {status}
Amount: {amount} TJS
{hasTracking ? \`Tracking Number: \${trackingNumber}\` : ''}

{status === 'paid' ? 'We are arranging shipment for you, please be patient ~' : 
 status === 'shipped' ? 'Expected delivery in 2-3 business days' :
 status === 'delivered' ? 'Thank you for your purchase, welcome back!' :
 'Please check order details in time'}`,
      [Language.RU]: `📦 Статус заказа {orderNumber} обновлен

Статус: {status}
Сумма: {amount} TJS
{hasTracking ? \`Номер отслеживания: \${trackingNumber}\` : ''}

{status === 'paid' ? 'Мы организуем для вас доставку, пожалуйста, наберитесь терпения ~' : 
 status === 'shipped' ? 'Ожидаемая доставка в течение 2-3 рабочих дней' :
 status === 'delivered' ? 'Спасибо за покупку, добро пожаловать снова!' :
 'Пожалуйста, проверьте детали заказа вовремя'}`,
      [Language.TJ]: `📦 Ҳолати фармоиши {orderNumber} навсозӣ шудааст

Ҳолат: {status}
Маблағ: {amount} TJS
{hasTracking ? \`Рақами пайгирӣ: \${trackingNumber}\` : ''}

{status === 'paid' ? 'Мо барои шумо интиқол месозем, лутфан сабр кунед ~' : 
 status === 'shipped' ? 'Расонидани интизорӣ дар муддати 2-3 рӯзи корӣ' :
 status === 'delivered' ? 'Ташаккур барои харидарики шумо, боз хуш омадед!' :
 'Лутфан тафсилоти фармоишро ба вақт санҷед'}`
    },
    buttons: {
      [Language.ZH]: [
        { text: '📋 查看订单', action: 'view_order', url: '{appUrl}/orders/{orderId}' }
      ],
      [Language.EN]: [
        { text: '📋 View Order', action: 'view_order', url: '{appUrl}/orders/{orderId}' }
      ],
      [Language.RU]: [
        { text: '📋 Посмотреть заказ', action: 'view_order', url: '{appUrl}/orders/{orderId}' }
      ],
      [Language.TJ]: [
        { text: '📋 Дидани фармоиш', action: 'view_order', url: '{appUrl}/orders/{orderId}' }
      ]
    }
  },

  [NotificationType.PAYMENT_SUCCESS]: {
    type: NotificationType.PAYMENT_SUCCESS,
    title: {
      [Language.ZH]: '💳 支付成功',
      [Language.EN]: '💳 Payment Successful',
      [Language.RU]: '💳 Оплата успешна',
      [Language.TJ]: '💳 Пардохт муваффақиятӣ'
    },
    message: {
      [Language.ZH]: `💳 支付成功！

📋 订单号：{orderNumber}
💰 支付金额：{amount} TJS
🎁 商品：{productName}

✅ 支付已确认，正在安排发货
📱 请关注订单状态变化`,
      [Language.EN]: `💳 Payment Successful!

📋 Order Number: {orderNumber}
💰 Payment Amount: {amount} TJS
🎁 Product: {productName}

✅ Payment confirmed, arranging shipment
📱 Please pay attention to order status changes`,
      [Language.RU]: `💳 Оплата успешна!

📋 Номер заказа: {orderNumber}
💰 Сумма оплаты: {amount} TJS
🎁 Товар: {productName}

✅ Оплата подтверждена, организуем доставку
📱 Пожалуйста, следите за изменениями статуса заказа`,
      [Language.TJ]: `💳 Пардохт муваффақиятӣ!

📋 Рақами фармоиш: {orderNumber}
💰 Маблағи пардохт: {amount} TJS
🎁 Маҳсулот: {productName}

✅ Пардохт тасдиқ шудааст, интиқол месозем
📱 Лутфан ба тағйироти ҳолати фармоиш диққати ҷиддӣ диҳед`
    },
    buttons: {
      [Language.ZH]: [
        { text: '📋 查看订单', action: 'view_order', url: '{appUrl}/orders' },
        { text: '🛒 继续购物', action: 'continue_shopping', url: '{appUrl}' }
      ],
      [Language.EN]: [
        { text: '📋 View Order', action: 'view_order', url: '{appUrl}/orders' },
        { text: '🛒 Continue Shopping', action: 'continue_shopping', url: '{appUrl}' }
      ],
      [Language.RU]: [
        { text: '📋 Посмотреть заказ', action: 'view_order', url: '{appUrl}/orders' },
        { text: '🛒 Продолжить покупки', action: 'continue_shopping', url: '{appUrl}' }
      ],
      [Language.TJ]: [
        { text: '📋 Дидани фармоиш', action: 'view_order', url: '{appUrl}/orders' },
        { text: '🛒 Идомаи харидариқӣ', action: 'continue_shopping', url: '{appUrl}' }
      ]
    }
  },

  [NotificationType.LOTTERY_RESULT_WIN]: {
    type: NotificationType.LOTTERY_RESULT_WIN,
    title: {
      [Language.ZH]: '🎉 恭喜中奖！',
      [Language.EN]: '🎉 Congratulations on Winning!',
      [Language.RU]: '🎉 Поздравляем с выигрышем!',
      [Language.TJ]: '🎉 Таҳният барои ғолибӣ!'
    },
    message: {
      [Language.ZH]: `🎉 恭喜您中奖！

商品：{productName}
期号：{roundId}
奖品价值：{prizeValue} TJS

🏆 恭喜您获得本期奖品！
我们将联系您安排发货，请保持联系方式畅通

感谢您的参与，继续支持我们吧～`,
      [Language.EN]: `🎉 Congratulations on winning!

Product: {productName}
Round: {roundId}
Prize Value: {prizeValue} TJS

🏆 Congratulations on winning this round's prize!
We will contact you to arrange delivery, please keep your contact information available

Thank you for your participation, continue supporting us ~`,
      [Language.RU]: `🎉 Поздравляем с выигрышем!

Товар: {productName}
Раунд: {roundId}
Стоимость приза: {prizeValue} TJS

🏆 Поздравляем с получением приза этого раунда!
Мы свяжемся с вами для организации доставки, пожалуйста, поддерживайте доступность вашей контактной информации

Спасибо за участие, продолжайте поддерживать нас ~`,
      [Language.TJ]: `🎉 Таҳният барои ғолибӣ!

Маҳсулот: {productName}
Гирдиш: {roundId}
Қимати мукофот: {prizeValue} TJS

🏆 Таҳният барои гирифтани мукофоти ин гирдиш!
Мо бо шумо тамос мегирем то интиқолро созем, лутфан маълумоти тамосии худро дастрас нигоҳ доред

Ташаккур барои иштирок, идомаи дастгирии мо ~`
    },
    buttons: {
      [Language.ZH]: [
        { text: '🏆 查看奖品', action: 'view_prize', url: '{appUrl}/prize' },
        { text: '🎲 继续参与', action: 'continue_lottery', url: '{appUrl}' }
      ],
      [Language.EN]: [
        { text: '🏆 View Prize', action: 'view_prize', url: '{appUrl}/prize' },
        { text: '🎲 Continue Participating', action: 'continue_lottery', url: '{appUrl}' }
      ],
      [Language.RU]: [
        { text: '🏆 Посмотреть приз', action: 'view_prize', url: '{appUrl}/prize' },
        { text: '🎲 Продолжить участие', action: 'continue_lottery', url: '{appUrl}' }
      ],
      [Language.TJ]: [
        { text: '🏆 Дидани мукофот', action: 'view_prize', url: '{appUrl}/prize' },
        { text: '🎲 Идомаи иштирок', action: 'continue_lottery', url: '{appUrl}' }
      ]
    }
  },

  [NotificationType.LOTTERY_RESULT_LOSE]: {
    type: NotificationType.LOTTERY_RESULT_LOSE,
    title: {
      [Language.ZH]: '📊 开奖结果',
      [Language.EN]: '📊 Lottery Results',
      [Language.RU]: '📊 Результаты розыгрыша',
      [Language.TJ]: '📊 Натиҷаҳои розиғш'
    },
    message: {
      [Language.ZH]: `📊 开奖结果公布

商品：{productName}
期号：{roundId}
参与人数：{participants} 人

很遗憾，本次您未中奖
但不要灰心，继续参与，下期中奖的就是您！

立即参与更多商品夺宝，幸运就在前方～`,
      [Language.EN]: `📊 Lottery Results Announced

Product: {productName}
Round: {roundId}
Participants: {participants} people

Unfortunately, you didn't win this time
But don't lose heart, keep participating, the next winner could be you!

Participate in more product lotteries immediately, luck is just ahead ~`,
      [Language.RU]: `📊 Объявлены результаты розыгрыша

Товар: {productName}
Раунд: {roundId}
Участников: {participants} человек

К сожалению, вы не выиграли на этот раз
Но не унывайте, продолжайте участвовать, следующий победитель можете быть вы!

Участвуйте в розыгрышах большего количества товаров прямо сейчас, удача совсем рядом ~`,
      [Language.TJ]: `📊 Натиҷаҳои розиғш эълон шуд

Маҳсулот: {productName}
Гирдиш: {roundId}
Иштироккунандагон: {нафар}

Мутаассифона, ин дафъа шумо ғолиб нашудед
Аммо дил насустурӣ кунед, идомаи иштирок кунед, ғолиби навбатӣ метавонад шумо бошед!

Дар розиғшҳои маҳсулотҳои бештар фавран иштирок кунед, бахт дар пеш аст ~`
    },
    buttons: {
      [Language.ZH]: [
        { text: '🎲 继续参与', action: 'continue_lottery', url: '{appUrl}' }
      ],
      [Language.EN]: [
        { text: '🎲 Continue Participating', action: 'continue_lottery', url: '{appUrl}' }
      ],
      [Language.RU]: [
        { text: '🎲 Продолжить участие', action: 'continue_lottery', url: '{appUrl}' }
      ],
      [Language.TJ]: [
        { text: '🎲 Идомаи иштирок', action: 'continue_lottery', url: '{appUrl}' }
      ]
    }
  },

  [NotificationType.VIP_LEVEL_UP]: {
    type: NotificationType.VIP_LEVEL_UP,
    title: {
      [Language.ZH]: '👑 VIP 等级提升！',
      [Language.EN]: '👑 VIP Level Up!',
      [Language.RU]: '👑 Повышение уровня VIP!',
      [Language.TJ]: '👑 Болоравии сатҳи VIP!'
    },
    message: {
      [Language.ZH]: `👑 VIP 等级提升！

从 {oldLevel} 升级到 {newLevel}

🎉 恭喜您获得新的VIP特权：
{benefits}

感谢您的支持与信任，我们会为您提供更好的服务！`,
      [Language.EN]: `👑 VIP Level Up!

Upgraded from {oldLevel} to {newLevel}

🎉 Congratulations on your new VIP privileges:
{benefits}

Thank you for your support and trust, we will provide you with better service!`,
      [Language.RU]: `👑 Повышение уровня VIP!

Повышен с уровня {oldLevel} до {newLevel}

🎉 Поздравляем с новыми привилегиями VIP:
{benefits}

Спасибо за вашу поддержку и доверие, мы обеспечим вас лучшим обслуживанием!`,
      [Language.TJ]: `👑 Болоравии сатҳи VIP!

Аз {oldLevel} то {newLevel} боло рафтааст

🎉 Таҳният барои имтиёзҳои нави VIP шумо:
{benefits}

Ташаккур барои дастгирӣ ва эътимоди шумо, мо ба шумо хидмати беҳтар пешниҳод мекунем!`
    },
    buttons: {
      [Language.ZH]: [
        { text: '👑 查看权益', action: 'view_vip', url: '{appUrl}/vip' },
        { text: '🛒 继续购物', action: 'continue_shopping', url: '{appUrl}' }
      ],
      [Language.EN]: [
        { text: '👑 View Benefits', action: 'view_vip', url: '{appUrl}/vip' },
        { text: '🛒 Continue Shopping', action: 'continue_shopping', url: '{appUrl}' }
      ],
      [Language.RU]: [
        { text: '👑 Посмотреть привилегии', action: 'view_vip', url: '{appUrl}/vip' },
        { text: '🛒 Продолжить покупки', action: 'continue_shopping', url: '{appUrl}' }
      ],
      [Language.TJ]: [
        { text: '👑 Дидани имтиёзҳо', action: 'view_vip', url: '{appUrl}/vip' },
        { text: '🛒 Идомаи харидариқӣ', action: 'continue_shopping', url: '{appUrl}' }
      ]
    }
  },

  [NotificationType.SYSTEM_NOTIFICATION]: {
    type: NotificationType.SYSTEM_NOTIFICATION,
    title: {
      [Language.ZH]: 'ℹ️ 系统通知',
      [Language.EN]: 'ℹ️ System Notification',
      [Language.RU]: 'ℹ️ Системное уведомление',
      [Language.TJ]: 'ℹ️ Огоҳиномаи система'
    },
    message: {
      [Language.ZH]: `ℹ️ {title}

{content}`,
      [Language.EN]: `ℹ️ {title}

{content}`,
      [Language.RU]: `ℹ️ {title}

{content}`,
      [Language.TJ]: `ℹ️ {title}

{content}`
    },
    buttons: {
      [Language.ZH]: [
        { text: '👀 查看详情', action: 'view_details', url: '{appUrl}/notifications' }
      ],
      [Language.EN]: [
        { text: '👀 View Details', action: 'view_details', url: '{appUrl}/notifications' }
      ],
      [Language.RU]: [
        { text: '👀 Посмотреть детали', action: 'view_details', url: '{appUrl}/notifications' }
      ],
      [Language.TJ]: [
        { text: '👀 Дидани тафсилот', action: 'view_details', url: '{appUrl}/notifications' }
      ]
    }
  },

  [NotificationType.HELP_MESSAGE]: {
    type: NotificationType.HELP_MESSAGE,
    title: {
      [Language.ZH]: '❓ 帮助中心',
      [Language.EN]: '❓ Help Center',
      [Language.RU]: '❓ Центр помощи',
      [Language.TJ]: '❓ Маркази ёриҳо'
    },
    message: {
      [Language.ZH]: `📚 命令列表：

/start - 开始使用
/balance - 查询余额  
/orders - 查询订单
/language - 切换语言
/profile - 个人资料
/support - 联系客服
/help - 查看帮助

需要帮助？点击下方按钮：`,
      [Language.EN]: `📚 Command List:

/start - Start using
/balance - Check balance
/orders - View orders
/language - Switch language
/profile - Personal profile
/support - Contact support
/help - View help

Need help? Click the buttons below:`,
      [Language.RU]: `📚 Список команд:

/start - Начать использование
/balance - Проверить баланс
/orders - Посмотреть заказы
/language - Переключить язык
/profile - Личный профиль
/support - Обратиться в поддержку
/help - Просмотреть справку

Нужна помощь? Нажмите кнопки ниже:`,
      [Language.TJ]: `📚 Рӯйхати фармонҳо:

/start - Оғози истифода
/balance - Санҷиши баланс
/orders - Дидани фармоишҳо
/language - Ивази забон
/profile - Профили шахсӣ
/support - Тамос бо дастгирӣ
/help - Дидани ёриҳо

Ёрии лозим? Тугмаҳои поёнро пахш кунед:`
    },
    buttons: {
      [Language.ZH]: [
        { text: '📚 新手教程', action: 'tutorial', url: '{appUrl}/tutorial' },
        { text: '💬 联系客服', action: 'contact_support', url: 'https://t.me/luckymart_support' }
      ],
      [Language.EN]: [
        { text: '📚 Tutorial', action: 'tutorial', url: '{appUrl}/tutorial' },
        { text: '💬 Contact Support', action: 'contact_support', url: 'https://t.me/luckymart_support' }
      ],
      [Language.RU]: [
        { text: '📚 Руководство', action: 'tutorial', url: '{appUrl}/tutorial' },
        { text: '💬 Обратиться в поддержку', action: 'contact_support', url: 'https://t.me/luckymart_support' }
      ],
      [Language.TJ]: [
        { text: '📚 Дастури кор', action: 'tutorial', url: '{appUrl}/tutorial' },
        { text: '💬 Тамос бо дастгирӣ', action: 'contact_support', url: 'https://t.me/luckymart_support' }
      ]
    }
  },

  [NotificationType.LANGUAGE_SELECTION]: {
    type: NotificationType.LANGUAGE_SELECTION,
    title: {
      [Language.ZH]: '🌐 语言设置',
      [Language.EN]: '🌐 Language Settings',
      [Language.RU]: '🌐 Языковые настройки',
      [Language.TJ]: '🌐 Танзимоти забон'
    },
    message: {
      [Language.ZH]: '请选择您偏好的语言：',
      [Language.EN]: 'Please select your preferred language:',
      [Language.RU]: 'Пожалуйста, выберите предпочитаемый язык:',
      [Language.TJ]: 'Лутфан забони маънидоштатонро интихоб кунед:'
    },
    buttons: {
      [Language.ZH]: [
        { text: '🇨🇳 中文', action: 'set_language_zh-CN' },
        { text: '🇺🇸 English', action: 'set_language_en-US' },
        { text: '🇷🇺 Русский', action: 'set_language_ru-RU' },
        { text: '🇹🇯 Тоҷикӣ', action: 'set_language_tg-TJ' }
      ],
      [Language.EN]: [
        { text: '🇨🇳 中文', action: 'set_language_zh-CN' },
        { text: '🇺🇸 English', action: 'set_language_en-US' },
        { text: '🇷🇺 Русский', action: 'set_language_ru-RU' },
        { text: '🇹🇯 Тоҷикӣ', action: 'set_language_tg-TJ' }
      ],
      [Language.RU]: [
        { text: '🇨🇳 中文', action: 'set_language_zh-CN' },
        { text: '🇺🇸 English', action: 'set_language_en-US' },
        { text: '🇷🇺 Русский', action: 'set_language_ru-RU' },
        { text: '🇹🇯 Тоҷикӣ', action: 'set_language_tg-TJ' }
      ],
      [Language.TJ]: [
        { text: '🇨🇳 中文', action: 'set_language_zh-CN' },
        { text: '🇺🇸 English', action: 'set_language_en-US' },
        { text: '🇷🇺 Русский', action: 'set_language_ru-RU' },
        { text: '🇹🇯 Тоҷикӣ', action: 'set_language_tg-TJ' }
      ]
    }
  }
};

/**
 * 通知模板管理器
 */
export class NotificationTemplateManager {
  /**
   * 根据用户语言和通知类型生成通知内容
   */
  public static generateNotification(data: NotificationData): {
    title: string;
    message: string;
    keyboard?: any;
    parseMode?: 'HTML' | 'Markdown';
  } {
    const { user, type, variables } = data;
    const template = NOTIFICATION_TEMPLATES[type];
    
    if (!template) {
      throw new Error(`通知模板未找到: ${type}`);
    }

    const language = user.language || Language.TJ; // 默认塔吉克语
    const title = this.replaceVariables(template.title[language], variables);
    const message = this.replaceVariables(template.message[language], variables);
    
    let keyboard: any = null;
    if (template.buttons && template.buttons[language]) {
      const buttons = template.buttons[language].map(btn => {
        if (btn.url) {
          const url = this.replaceVariables(btn.url, { ...variables, appUrl: apiConfig.telegram.miniAppURL });
          return [Markup.button.url(btn.text, url)];
        } else {
          return [Markup.button.callback(btn.text, btn.action)];
        }
      });
      keyboard = Markup.inlineKeyboard(buttons.flat());
    }

    return {
      title,
      message,
      keyboard,
      parseMode: template.parseMode
    };
  }

  /**
   * 替换模板变量
   */
  private static replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, String(value));
    }
    
    return result;
  }

  /**
   * 获取所有支持的通知类型
   */
  public static getSupportedTypes(): NotificationType[] {
    return Object.values(NotificationType);
  }

  /**
   * 获取支持的语言
   */
  public static getSupportedLanguages(): Language[] {
    return Object.values(Language);
  }

  /**
   * 验证通知数据
   */
  public static validateNotificationData(data: NotificationData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.user || !data.user.telegramId) {
      errors.push('用户信息不完整');
    }

    if (!data.type || !NOTIFICATION_TEMPLATES[data.type]) {
      errors.push(`不支持的通知类型: ${data.type}`);
    }

    if (!data.user.language || !Object.values(Language).includes(data.user.language)) {
      errors.push(`不支持的语言: ${data.user.language}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * 语言工具函数
 */
export class LanguageUtils {
  /**
   * 获取用户的首选语言，默认为塔吉克语
   */
  public static getUserLanguage(userLanguage?: string): Language {
    const supportedLanguages = Object.values(Language);
    return supportedLanguages.includes(userLanguage as Language) 
      ? userLanguage as Language 
      : Language.TJ; // 默认塔吉克语
  }

  /**
   * 获取语言显示名称
   */
  public static getLanguageName(language: Language): string {
    const names = {
      [Language.ZH]: '中文',
      [Language.EN]: 'English',
      [Language.RU]: 'Русский',
      [Language.TJ]: 'Тоҷикӣ'
    };
    return names[language] || language;
  }

  /**
   * 获取语言国旗emoji
   */
  public static getLanguageFlag(language: Language): string {
    const flags = {
      [Language.ZH]: '🇨🇳',
      [Language.EN]: '🇺🇸',
      [Language.RU]: '🇷🇺',
      [Language.TJ]: '🇹🇯'
    };
    return flags[language] || '🌐';
  }

  /**
   * 检查语言是否支持
   */
  public static isLanguageSupported(language: string): boolean {
    return Object.values(Language).includes(language as Language);
  }
}

/**
 * 导出主要类和枚举
 */
export {
  NOTIFICATION_TEMPLATES,
  NotificationTemplateManager,
  LanguageUtils
};