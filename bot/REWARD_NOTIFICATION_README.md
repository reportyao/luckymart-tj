# Telegram Bot 奖励通知系统

这是一个完整的Telegram Bot奖励通知系统，支持俄语和塔吉克语，提供Rich Message格式的通知消息，包含完整的错误处理和重试机制。

## 🌟 功能特性

### 奖励通知类型
- **注册奖励通知** - 新用户注册时发送欢迎奖励
- **首次抽奖奖励通知** - 用户首次参与抽奖后获得奖励
- **首次充值奖励通知** - 用户首次充值时获得额外奖励
- **消费返利奖励通知** - 用户购买商品后获得返利

### 多语言支持
- 🇷🇺 俄语 (Russian)
- 🇹🇯 塔吉克语 (Tajik)

### 高级功能
- ✅ Rich Message格式（HTML格式化 + 内联按钮）
- ✅ 用户通知偏好管理
- ✅ 批量通知处理
- ✅ 错误重试机制
- ✅ 完整的日志记录
- ✅ 性能监控

## 📁 文件结构

```
bot/
├── index.ts                          # 主Bot文件（已集成奖励通知）
├── services/
│   └── reward-notifier.ts            # 奖励通知服务
├── utils/
│   ├── notification-templates.ts     # 通知模板管理
│   └── logger.ts                     # 日志系统（已存在）
├── test-reward-notification.ts       # 测试脚本
└── run-reward-notification-demo.ts   # 演示脚本
```

## 🚀 快速开始

### 1. 安装依赖

确保已安装所需依赖：
```bash
npm install telegraf winston winston-daily-rotate-file
```

### 2. 环境变量配置

创建 `.env` 文件：
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
MINI_APP_URL=https://your-mini-app-url.com
ADMIN_TELEGRAM_IDS=123456789,987654321
```

### 3. 启动Bot

```bash
# 启动主Bot
npm run bot

# 或直接运行
node dist/bot/index.js
```

### 4. 测试功能

```bash
# 运行完整测试
npx ts-node bot/test-reward-notification.ts

# 运行演示
npx ts-node bot/run-reward-notification-demo.ts
```

## 📖 使用指南

### 基本用法

```typescript
import { getRewardNotifier } from './bot/index';
import { NotificationType, Language } from './bot/utils/notification-templates';

// 获取奖励通知服务
const rewardNotifier = getRewardNotifier();

// 发送注册奖励通知
await rewardNotifier.sendRegistrationReward(
  userId,
  '用户名',
  { language: Language.RU }
);

// 发送自定义奖励通知
await rewardNotifier.sendNotification(
  userId,
  NotificationType.FIRST_LOTTERY_REWARD,
  {
    userId,
    userName: '用户名',
    rewardAmount: 50,
    currency: 'TJS',
    context: {
      lotteryId: 'lottery_123'
    }
  },
  { language: Language.TJ }
);
```

### 批量通知

```typescript
import { NotificationBatch } from './services/reward-notifier';

const notifications = [
  {
    userId: 123456,
    type: NotificationType.REGISTRATION_REWARD,
    data: {
      userId: 123456,
      userName: '用户1',
      rewardAmount: 100,
      currency: 'TJS'
    },
    priority: 'high'
  },
  {
    userId: 789012,
    type: NotificationType.FIRST_LOTTERY_REWARD,
    data: {
      userId: 789012,
      userName: '用户2',
      rewardAmount: 50,
      currency: 'TJS'
    },
    priority: 'normal'
  }
];

const batch = await rewardNotifier.sendBatchNotifications(notifications, {
  maxConcurrency: 5,
  delayBetweenBatches: 100
});

console.log(`批量通知完成: ${batch.status}`);
```

### 用户偏好管理

```typescript
// 获取用户偏好
const preferences = await rewardNotifier.getUserPreferences(userId);

// 更新偏好
await rewardNotifier.updateUserPreferences(userId, {
  notificationsEnabled: false,
  language: Language.TJ
});

// 切换特定通知类型
await rewardNotifier.toggleNotificationType(
  userId, 
  NotificationType.REGISTRATION_REWARD
);
```

## 🔧 Bot命令

用户可使用的命令：
- `/start` - 开始使用（自动发送注册奖励）
- `/notifications` - 管理通知偏好
- `/help` - 查看帮助

管理员命令：
- `/test_rewards` - 测试所有奖励通知类型（需管理员权限）

## 📝 通知模板

### 模板结构

```typescript
{
  type: NotificationType.REGISTRATION_REWARD,
  [Language.RU]: {
    title: '🎉 Добро пожаловать в LuckyMart!',
    message: 'Здравствуйте, {userName}!\n\n💰 Награда: {rewardAmount} {currency}',
    buttons: {
      startGame: '🎲 Начать игру',
      viewProducts: '🛒 Товары'
    }
  },
  [Language.TJ]: {
    title: '🎉 БаLuckyMart-ро хуш омадед!',
    message: 'Салом, {userName}!\n\n💰 Мукофот: {rewardAmount} {currency}',
    buttons: {
      startGame: '🎲 Оғози бозӣ',
      viewProducts: '🛒 Маҳсулотҳо'
    }
  }
}
```

### 自定义模板

```typescript
import { NotificationTemplateManager, NotificationTemplate, NotificationType, Language } from './utils/notification-templates';

const customTemplate: NotificationTemplate = {
  type: NotificationType.REGISTRATION_REWARD,
  [Language.RU]: {
    title: '🎊 自定义标题',
    message: '自定义消息内容 {userName} {rewardAmount} {currency}',
    buttons: {
      customAction: '自定义按钮'
    }
  },
  [Language.TJ]: {
    title: '🎊 Сарлавҳаи фармоишӣ',
    message: 'Мӯҳтавои паёмдории фармоишӣ {userName} {rewardAmount} {currency}',
    buttons: {
      customAction: 'Тугмаи фармоишӣ'
    }
  }
};

NotificationTemplateManager.addTemplate(customTemplate);
```

## 🔄 错误处理

系统提供多层错误处理：

1. **发送失败重试** - 最多3次重试，指数退避
2. **批量通知容错** - 单个失败不影响其他通知
3. **用户偏好验证** - 自动验证通知设置
4. **完整的日志记录** - 记录所有操作和错误

## 📊 监控和统计

```typescript
// 获取系统统计
const stats = rewardNotifier.getNotificationStats();
console.log({
  queueSize: stats.queueSize,        // 待处理队列大小
  batchCount: stats.batchCount,      // 活跃批次数量
  retryStats: stats.retryStats       // 重试统计
});

// 清理过期批次
rewardNotifier.cleanupCompletedBatches();
```

## 🛠️ 配置选项

### 通知服务配置

```typescript
const rewardNotifier = new RewardNotifier(bot, {
  maxRetries: 3,           // 最大重试次数
  initialDelay: 1000,      // 初始延迟(ms)
  maxDelay: 30000,         // 最大延迟(ms)
  backoffMultiplier: 2     // 退避倍数
});
```

### 批量通知配置

```typescript
const batch = await rewardNotifier.sendBatchNotifications(notifications, {
  batchId: 'custom_batch_123',      // 自定义批次ID
  maxConcurrency: 5,                // 最大并发数
  delayBetweenBatches: 100          // 批次间延迟(ms)
});
```

## 🧪 测试

### 运行测试套件

```bash
# 设置测试环境变量
export TEST_TELEGRAM_BOT_TOKEN=your_test_bot_token
export TEST_USER_ID=123456789

# 运行测试
npx ts-node bot/test-reward-notification.ts
```

### 测试覆盖范围

- ✅ 4种奖励通知类型发送
- ✅ 多语言模板渲染
- ✅ 批量通知处理
- ✅ 用户偏好管理
- ✅ Rich Message格式验证
- ✅ 错误处理机制
- ✅ 重试机制测试

### 运行演示

```bash
npx ts-node bot/run-reward-notification-demo.ts
```

演示包含：
- 各种奖励通知的实时演示
- 多语言支持展示
- Rich Message格式预览
- 批量处理演示
- 系统统计信息

## 🔧 集成指南

### 1. 在现有Bot中集成

```typescript
// bot/index.ts
import { RewardNotifier } from './services/reward-notifier';

let rewardNotifier: RewardNotifier;

// 在startBot函数中初始化
export function startBot() {
  // ... 现有代码
  
  // 初始化奖励通知服务
  rewardNotifier = new RewardNotifier(bot);
}
```

### 2. 在业务逻辑中调用

```typescript
// 在用户注册时
export async function registerUser(userData) {
  const user = await createUser(userData);
  
  // 发送注册奖励
  if (rewardNotifier) {
    await rewardNotifier.sendRegistrationReward(
      user.telegramId,
      user.firstName || user.username,
      { language: user.language }
    );
  }
  
  return user;
}

// 在抽奖首次参与时
export async function firstLotteryParticipation(userId) {
  // ... 抽奖逻辑
  
  // 发送首次抽奖奖励
  if (rewardNotifier) {
    await rewardNotifier.sendFirstLotteryReward(
      userId,
      user.firstName,
      { language: user.language }
    );
  }
}
```

## 📈 性能优化

1. **批量处理** - 建议批量发送通知以提高性能
2. **并发控制** - 限制同时发送的通知数量
3. **队列管理** - 使用优先级队列处理通知
4. **缓存偏好** - 缓存用户通知偏好设置
5. **模板缓存** - 缓存渲染后的消息模板

## 🔐 安全考虑

1. **用户验证** - 验证用户权限和通知设置
2. **频率限制** - 防止滥发通知
3. **错误处理** - 避免泄露敏感信息
4. **日志安全** - 记录必要信息但不记录敏感数据

## 🐛 故障排除

### 常见问题

1. **Bot Token未配置**
   ```
   错误：TELEGRAM_BOT_TOKEN未配置
   解决：检查环境变量配置
   ```

2. **用户偏好设置失败**
   ```
   检查用户是否已注册
   验证通知服务是否初始化
   ```

3. **批量通知失败**
   ```
   检查批次配置
   验证通知数据格式
   ```

### 调试模式

```typescript
// 启用详细日志
process.env.LOG_LEVEL = 'debug';

// 查看通知统计
const stats = rewardNotifier.getNotificationStats();
console.log('通知统计:', stats);
```

## 📚 API参考

### RewardNotifier类

#### 方法
- `sendNotification()` - 发送单个通知
- `sendBatchNotifications()` - 发送批量通知
- `getUserPreferences()` - 获取用户偏好
- `updateUserPreferences()` - 更新用户偏好
- `toggleNotificationType()` - 切换通知类型
- `getNotificationStats()` - 获取统计信息
- `cleanupCompletedBatches()` - 清理过期批次

#### 快捷方法
- `sendRegistrationReward()`
- `sendFirstLotteryReward()`
- `sendFirstRechargeReward()`
- `sendCashbackReward()`

### NotificationTemplateManager类

#### 静态方法
- `getTemplate()` - 获取模板
- `formatMessage()` - 格式化消息
- `generateButtons()` - 生成按钮
- `addTemplate()` - 添加模板
- `validateTemplate()` - 验证模板

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

MIT License

---

**注意**: 这是一个生产就绪的通知系统，包含完整的错误处理、日志记录和监控功能。请根据实际需求调整配置参数。