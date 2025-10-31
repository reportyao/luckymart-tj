# 延迟奖励处理系统

## 概述

延迟奖励处理系统是为LuckyMart TJ项目开发的智能奖励发放系统，支持延迟奖励的创建、自动处理、重试机制和监控告警功能。

## 系统特性

### ✅ 核心功能
- **延迟奖励发放**: 支持定时发放奖励，处理复杂的业务场景
- **首次消费延迟**: 自动为首次购买设置24小时延迟机制
- **批量处理**: 高效的批量处理引擎，支持大批量奖励发放
- **重试机制**: 智能重试机制，最多3次重试，失败后发送告警
- **Telegram通知**: 实时通知奖励发放成功或失败状态
- **完整日志**: 详细的操作日志和监控指标记录

### 📊 监控与告警
- **实时监控**: 处理成功率、失败率、处理时长等关键指标
- **告警系统**: 自动检测异常情况并发送Telegram告警
- **性能统计**: 平均处理时间、并发处理能力等性能指标
- **健康检查**: 系统健康状态监控和报告

### 🔧 技术特性
- **事务安全**: 使用数据库事务确保奖励发放的原子性
- **并发控制**: 支持并发处理，避免重复发放
- **配置驱动**: 灵活的配置系统，支持参数调整
- **模块化设计**: 清晰的代码结构，易于维护和扩展

## 系统架构

```
延迟奖励处理系统
├── lib/anti-fraud/delayed-reward-processor.ts    # 核心处理器
├── supabase/functions/delayed-reward-processor/  # 定时任务函数
├── supabase/functions/trigger-delayed-reward/    # 手动触发函数
├── supabase/cron_jobs/                           # 定时任务配置
└── test/delayed-reward-processor.test.ts         # 测试脚本
```

## 数据库表结构

### reward_transactions 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| user_id | UUID | 用户ID |
| reward_type | VARCHAR(50) | 奖励类型 |
| amount | DECIMAL(10,1) | 奖励金额 |
| source_user_id | UUID | 源用户ID（推荐人） |
| source_order_id | BIGINT | 源订单ID |
| referral_level | INT | 推荐层级 |
| status | VARCHAR(20) | 状态 |
| scheduled_at | TIMESTAMP | 计划发放时间 |
| retry_count | INT | 重试次数 |
| last_error | TEXT | 最后错误信息 |
| config_snapshot | JSONB | 配置快照 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 状态枚举

- `pending`: 待处理
- `processing`: 处理中
- `completed`: 已完成
- `failed`: 已失败
- `retrying`: 重试中

### 奖励类型

- `referral_register`: 注册推荐奖励
- `referral_first_play`: 首次参与抽奖奖励
- `referral_first_purchase`: 首次购买奖励
- `rebate_level1`: 1级推荐返利
- `rebate_level2`: 2级推荐返利
- `rebate_level3`: 3级推荐返利

## 部署指南

### 1. 环境配置

确保以下环境变量已配置：

```bash
# Supabase配置
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Telegram通知配置（可选）
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 2. 数据库迁移

确保 `reward_transactions` 表已创建：

```sql
-- 已包含在现有迁移文件中
CREATE TABLE reward_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    reward_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 1) NOT NULL,
    source_user_id UUID,
    source_order_id BIGINT,
    referral_level INT,
    status VARCHAR(20) DEFAULT 'completed',
    scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_reward_status ON reward_transactions(status, scheduled_at);
CREATE INDEX idx_reward_user_time ON reward_transactions(user_id, created_at);
```

### 3. 部署Edge Functions

```bash
# 部署定时任务函数
supabase functions deploy delayed-reward-processor

# 部署手动触发函数
supabase functions deploy trigger-delayed-reward
```

### 4. 配置定时任务

系统已自动创建定时任务，每小时执行一次：

```sql
-- 定时任务SQL（自动生成）
SELECT cron.schedule(
    'delayed-reward-processor_invoke',
    '0 * * * *',
    'CALL delayed_reward_processor_629953b8()'
);
```

## 使用指南

### 1. 创建延迟奖励

#### 创建普通延迟奖励

```typescript
import { createDelayedReward } from '../lib/anti-fraud/delayed-reward-processor';

const rewardId = await createDelayedReward({
    userId: 'user-uuid',
    rewardType: RewardType.REFERRAL_REGISTER,
    amount: 10.0,
    sourceUserId: 'source-user-uuid',
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000), // 1小时后
});
```

#### 创建首次购买延迟奖励（自动延迟24小时）

```typescript
import { createFirstPurchaseDelayedReward } from '../lib/anti-fraud/delayed-reward-processor';

const rewardId = await createFirstPurchaseDelayedReward({
    userId: 'user-uuid',
    sourceUserId: 'source-user-uuid',
    amount: 20.0,
    sourceOrderId: 'order-uuid',
    referralLevel: 1,
    configSnapshot: { /* 可选配置快照 */ }
});
```

### 2. 手动触发处理

#### 直接调用Edge Function

```bash
curl -X POST \
  https://ijcbozvagquzwgjvxtsu.supabase.co/functions/v1/trigger-delayed-reward \
  -H "Content-Type: application/json"
```

#### 使用程序接口

```typescript
import { processPendingRewards } from '../lib/anti-fraud/delayed-reward-processor';

const result = await processPendingRewards();
console.log(`处理完成: ${result.success}/${result.total}`);
```

### 3. 监控和统计

```typescript
import { delayedRewardProcessor } from '../lib/anti-fraud/delayed-reward-processor';

// 获取处理统计
const stats = await delayedRewardProcessor.getProcessingStats();
console.log('待处理奖励:', stats.totalPending);
console.log('成功率:', stats.totalCompleted / (stats.totalCompleted + stats.totalFailed));

// 查询待处理奖励
const pending = await delayedRewardProcessor.getPendingRewards();
console.log('需要立即处理的奖励数量:', pending.length);
```

### 4. 清理过期记录

```typescript
// 清理30天前的已完成和失败记录
const deletedCount = await delayedRewardProcessor.cleanupExpiredRewards(30);
console.log(`清理了 ${deletedCount} 条过期记录`);
```

## 配置参数

在 `delayed-reward-processor.ts` 中可配置以下参数：

```typescript
const CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,        // 最大重试次数
  BATCH_SIZE: 100,              // 批量处理大小
  FIRST_PURCHASE_DELAY_HOURS: 24, // 首次购买延迟小时数
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
};
```

## 监控指标

系统提供以下监控指标：

- `delayed_rewards_created_total`: 创建的延迟奖励总数
- `delayed_rewards_processed_total`: 处理的延迟奖励总数
- `delayed_rewards_processed_success`: 成功处理的奖励数
- `delayed_rewards_processed_failed`: 失败处理的奖励数
- `delayed_reward_creation_duration`: 奖励创建耗时
- `delayed_reward_batch_processing_duration`: 批量处理耗时
- `delayed_rewards_cleaned_up_total`: 清理的过期记录数

## 测试

### 运行测试脚本

```bash
# 运行完整测试
./test_delayed_reward_system.sh test

# 仅测试特定功能
./test_delayed_reward_system.sh functions
./test_delayed_reward_system.sh processor
```

### TypeScript单元测试

```bash
cd /workspace/luckymart-tj
npm test delayed-reward-processor.test.ts
```

## 告警和通知

### Telegram通知内容

#### 成功处理通知
```
🎯 延迟奖励处理定时任务报告

📊 处理统计：
• 总处理数量: 15
• 成功数量: 14
• 失败数量: 1
• 成功率: 93%

⏰ 处理时间: 2024-01-01 12:00:00

✅ 所有奖励处理正常
```

#### 错误通知
```
🚨 延迟奖励处理定时任务错误

❌ 错误信息: User not found: user-uuid
⏰ 发生时间: 2024-01-01 12:00:00

请立即检查系统状态！
```

## 故障排除

### 常见问题

1. **奖励处理失败**
   - 检查用户是否存在
   - 查看数据库连接状态
   - 检查余额更新权限

2. **定时任务未执行**
   - 检查cron job是否正常
   - 验证Edge Function部署状态
   - 查看函数日志

3. **Telegram通知失败**
   - 验证Bot Token和Chat ID
   - 检查网络连接
   - 确认Bot权限设置

### 日志查看

```bash
# 查看Edge Function日志
supabase functions logs delayed-reward-processor

# 查看cron job执行日志
supabase cron jobs list
```

## 性能优化

- **批量处理大小**: 根据系统负载调整 `BATCH_SIZE`
- **并发控制**: 使用数据库行级锁避免并发冲突
- **索引优化**: 确保关键字段有合适的索引
- **定期清理**: 设置适当的清理策略避免数据膨胀

## 安全考虑

- **权限控制**: 只允许有权限的服务调用处理函数
- **数据验证**: 严格验证用户输入和奖励参数
- **审计日志**: 记录所有奖励发放操作
- **错误处理**: 妥善处理异常情况，避免系统中断

## 维护指南

### 日常维护

1. **监控成功率**: 保持在95%以上
2. **检查失败原因**: 分析失败奖励的根本原因
3. **定期清理**: 每月清理过期记录
4. **性能监控**: 关注处理时间和并发性能

### 升级步骤

1. 备份现有数据
2. 更新代码和配置
3. 运行测试验证
4. 逐步部署到生产环境
5. 监控运行状态

## 支持和联系

如有问题或需要支持，请联系开发团队或提交Issue。

---

**版本**: 1.0.0  
**更新时间**: 2024-01-01  
**维护者**: LuckyMart TJ开发团队