# 用户信息获取服务 (User Info Service)

## 📖 概述

用户信息获取服务是LuckyMart TJ Bot的核心组件之一，提供全面的用户信息管理、验证和状态监控功能。该服务集成了Telegram Bot API、数据库查询和缓存机制，确保高效、准确地获取和管理用户信息。

## 🚀 功能特性

### 核心功能

1. **获取用户Telegram信息** (`getUserInfo`)
   - 获取用户基本资料（用户名、姓名、头像等）
   - 获取账户信息（余额、VIP等级、消费记录等）
   - 获取Telegram API高级信息（Premium状态、管理员权限等）

2. **获取用户聊天状态** (`getUserChat`)
   - 检查用户与Bot的聊天状态
   - 验证消息发送权限
   - 获取消息历史统计

3. **验证用户有效性** (`validateUser`)
   - 检查用户是否存在于数据库中
   - 验证用户账户状态
   - 识别新用户、VIP用户、非活跃用户

4. **获取用户活动状态** (`getUserStatus`)
   - 计算用户活跃程度和参与度评分
   - 分析用户行为模式
   - 识别活跃、沉默、流失等不同状态

5. **批量获取用户信息** (`batchGetUserInfo`)
   - 高效批量查询多个用户信息
   - 智能缓存机制提升性能
   - 详细的成功/失败统计

### 高级特性

- **智能缓存系统**: 多级缓存策略，减少API调用
- **错误处理机制**: 完整的错误捕获和恢复机制
- **性能监控**: 实时性能统计和日志记录
- **优雅降级**: API失败时的备用方案
- **数据验证**: 全面的输入验证和类型检查

## 🛠️ 安装和配置

### 环境要求

- Node.js 16+
- PostgreSQL数据库
- Telegram Bot Token
- 适当的数据库权限

### 配置步骤

1. **设置环境变量**:
```bash
export TELEGRAM_BOT_TOKEN="your_bot_token_here"
export DATABASE_URL="your_database_url"
export TEST_TELEGRAM_USER_ID="123456789"  # 可选，用于测试
```

2. **确保数据库表存在**:
服务依赖于`users`表，请确保数据库已正确设置。

## 📝 使用方法

### 基本使用

```typescript
import { UserInfoService } from './services/user-info-service';
import { Telegraf } from 'telegraf';

// 创建Bot实例
const bot = new Telegraf(BOT_TOKEN);

// 获取用户信息服务实例
const userInfoService = UserInfoService.getInstance(bot);

// 获取单个用户信息
const userInfo = await userInfoService.getUserInfo('123456789');
console.log(userInfo?.username); // 输出用户名
```

### API参考

#### getUserInfo(telegramId: string)
获取用户的详细信息。

**参数:**
- `telegramId` (string): 用户的Telegram ID

**返回值:**
```typescript
interface UserInfo {
  id: string;
  telegramId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
  language: string;
  balance: number;
  platformBalance: number;
  vipLevel: number;
  totalSpent: number;
  freeDailyCount: number;
  lastFreeResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
  // Telegram API 额外信息
  isPremium?: boolean;
  isAdministrator?: boolean;
  isBot?: boolean;
  telegramStatus?: string;
}
```

#### getUserChat(telegramId: string)
获取用户聊天状态信息。

**返回值:**
```typescript
interface UserChatInfo {
  telegramId: string;
  chatId?: number;
  status: string;
  canSendMessages: boolean;
  canSendMedia: boolean;
  canSendPolls: boolean;
  lastActivity?: Date;
  messageCount: number;
  firstMessageDate?: number;
  lastMessageDate?: number;
}
```

#### validateUser(telegramId: string)
验证用户是否存在且有效。

**返回值:**
```typescript
interface UserValidationResult {
  isValid: boolean;
  exists: boolean;
  telegramId: string;
  errors: string[];
  warnings?: string[];
  isNewUser?: boolean;
  isVipUser?: boolean;
  isInactive?: boolean;
}
```

#### getUserStatus(telegramId: string)
获取用户活动状态。

**返回值:**
```typescript
interface UserActivityStatus {
  telegramId: string;
  status: 'active' | 'inactive' | 'new' | 'suspended' | 'not_found';
  isActive: boolean;
  lastActivity?: Date;
  activityLevel: 'high' | 'medium' | 'low' | 'none';
  engagementScore: number; // 0-100分
  balance: number;
  totalSpent: number;
  vipLevel: number;
  daysSinceRegistration: number;
  daysSinceLastActivity: number;
}
```

#### batchGetUserInfo(telegramIds: string[])
批量获取多个用户信息。

**参数:**
- `telegramIds` (string[]): 用户Telegram ID数组

**返回值:**
```typescript
interface BatchUserInfoResult {
  success: UserInfo[];
  failed: Array<{ telegramId: string; error: string }>;
  totalRequested: number;
  cacheHits: number;
}
```

## 🤖 Bot集成

### 新增Bot命令

用户信息服务已集成到Bot中，提供以下新命令：

1. **`/userinfo`** - 查看详细用户信息
2. **`/status`** - 查看用户活动状态
3. **`/validate`** - 验证用户有效性

### 启动方式

1. **使用增强启动器**:
```bash
npm run bot:start-enhanced
```

2. **使用专门的启动脚本**:
```bash
npx ts-node bot/launch-user-info-service.ts
```

3. **运行基础功能测试**:
```bash
npx ts-node bot/test-basic-user-info.ts
```

## 🧪 测试

### 运行测试

1. **基础功能测试**:
```bash
npx ts-node bot/test-basic-user-info.ts
```

2. **完整功能测试**:
```bash
npx ts-node bot/test-user-info-service.ts
```

3. **使用现有Bot命令测试**:
启动Bot后，发送以下命令测试：
- `/userinfo` - 查看您的详细信息
- `/status` - 查看活动状态
- `/validate` - 验证账户有效性

### 测试用户ID

如果需要测试特定用户功能，请设置环境变量：
```bash
export TEST_TELEGRAM_USER_ID="your_test_user_id"
```

## 🔧 配置选项

### 缓存配置

服务使用内存缓存系统，可通过以下参数配置：

- **用户信息缓存TTL**: 10分钟
- **聊天状态缓存TTL**: 1分钟
- **常规缓存TTL**: 5分钟

### 错误处理

服务包含多层错误处理：

1. **API级别错误**: Telegram API调用失败
2. **数据库错误**: 数据库连接或查询失败
3. **缓存错误**: 缓存操作失败
4. **业务逻辑错误**: 数据验证或处理错误

## 📊 性能监控

### 性能指标

服务提供以下性能指标：

- **缓存命中率**
- **API调用延迟**
- **数据库查询时间**
- **内存使用情况**
- **错误率统计**

### 监控方法

```typescript
// 获取服务统计
const stats = userInfoService.getServiceStats();
console.log(stats);

// 获取缓存状态
const cacheStats = userInfoService.getServiceStats().cache;
console.log(`缓存大小: ${cacheStats.size}`);
```

## 🔍 日志记录

服务集成了完整的日志系统：

- **业务日志**: 用户操作和系统事件
- **错误日志**: 异常情况详细记录
- **性能日志**: 操作耗时和资源使用
- **调试日志**: 详细的执行流程

## 🚨 故障排除

### 常见问题

1. **"用户信息服务未初始化"错误**
   - 确保Bot已正确启动
   - 检查环境变量配置
   - 验证数据库连接

2. **缓存相关错误**
   - 清理过期缓存: `userInfoService.cleanupExpiredCache()`
   - 重启Bot服务
   - 检查内存使用情况

3. **数据库连接问题**
   - 验证`DATABASE_URL`环境变量
   - 检查数据库服务状态
   - 确认数据库权限

### 调试模式

启用详细日志：
```bash
export LOG_LEVEL=debug
export DEBUG_USER_INFO_SERVICE=true
```

## 📈 扩展功能

### 自定义验证规则

可以扩展`validateUser`方法添加自定义验证逻辑：

```typescript
// 示例：添加自定义验证
const customValidation = await userInfoService.validateUser(telegramId);

// 添加业务逻辑验证
if (userInfo.balance < 0) {
  customValidation.errors.push('用户余额异常');
}
```

### 集成其他服务

用户信息服务可以与以下服务集成：

- **消息队列系统**: 异步处理用户操作
- **通知服务**: 发送用户状态变更通知
- **分析服务**: 用户行为分析和报告
- **风控服务**: 用户风险评估

## 📋 最佳实践

1. **缓存策略**: 合理设置缓存时间，平衡性能和实时性
2. **错误处理**: 始终包装API调用在try-catch中
3. **性能监控**: 定期检查服务性能指标
4. **日志管理**: 保持适当的日志级别，避免信息泄露
5. **数据库优化**: 使用索引优化查询性能

## 📞 技术支持

如需技术支持，请：

1. 查看日志文件中的错误信息
2. 运行基础功能测试诊断问题
3. 联系开发团队并提供详细的错误报告

---

**版本**: 1.0.0  
**最后更新**: 2025-10-31  
**维护者**: LuckyMart TJ开发团队