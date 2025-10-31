# 新手激励系统数据库设计文档

## 概述

本文档描述了LuckyMart TJ新手激励系统的数据库设计方案。该系统旨在通过任务激励、签到奖励和首充奖励等方式，提升新用户的留存率和活跃度。

## 设计原则

1. **遵循现有规范**：遵循项目中现有的数据库设计规范和命名约定
2. **多语言支持**：采用JSONB格式支持多语言内容存储
3. **性能优化**：合理设计索引，确保查询性能
4. **数据完整性**：添加必要的约束和验证
5. **安全性**：实现RLS（行级安全）策略
6. **可扩展性**：预留扩展字段，支持未来功能扩展

## 数据库表结构

### 1. NewbieTasks（新手任务定义表）

用于存储系统中的新手任务定义信息。

#### 字段说明

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 任务唯一标识符 |
| task_name | JSONB | NOT NULL | 任务名称（多语言）<br>`{"zh": "任务名称", "en": "Task Name", "ru": "Название задачи"}` |
| description | JSONB | NULL | 任务描述（多语言） |
| task_name_zh | VARCHAR(255) | NULL | 任务名称-中文（兼容旧版） |
| task_name_en | VARCHAR(255) | NULL | 任务名称-英文（兼容旧版） |
| task_name_ru | VARCHAR(255) | NULL | 任务名称-俄文（兼容旧版） |
| description_zh | TEXT | NULL | 任务描述-中文（兼容旧版） |
| description_en | TEXT | NULL | 任务描述-英文（兼容旧版） |
| description_ru | TEXT | NULL | 任务描述-俄文（兼容旧版） |
| task_type | VARCHAR(50) | NOT NULL | 任务类型：<br>`registration` - 注册任务<br>`first_recharge` - 首充任务<br>`lottery_participation` - 抽奖参与<br>`product_purchase` - 商品购买<br>`profile_completion` - 资料完善<br>`referral` - 邀请好友<br>`consecutive_checkin` - 连续签到 |
| reward_type | VARCHAR(30) | NOT NULL | 奖励类型：<br>`coins` - 幸运币<br>`balance` - 余额<br>`vip_days` - VIP天数 |
| reward_amount | DECIMAL(10,2) | NOT NULL | 奖励数量 |
| priority | INTEGER | DEFAULT 0 | 任务显示优先级，数值越大优先级越高 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| max_rewards_per_day | INTEGER | NULL | 每日最大奖励次数，NULL表示无限制 |
| max_rewards_total | INTEGER | NULL | 总最大奖励次数，NULL表示无限制 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

#### 索引设计

- `idx_newbie_tasks_task_type` - 任务类型索引
- `idx_newbie_tasks_is_active` - 启用状态索引
- `idx_newbie_tasks_priority` - 优先级索引

#### 业务规则

- 同一时间内，同一类型的任务可以有多个
- 优先级用于控制前端任务列表的显示顺序
- 支持每日和总体的奖励次数限制

### 2. UserTaskProgress（用户任务进度表）

用于记录用户对各个新手任务的完成进度。

#### 字段说明

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 进度记录唯一标识符 |
| user_id | UUID | NOT NULL | 用户ID（关联users表） |
| task_id | UUID | NOT NULL | 任务ID（关联newbie_tasks表） |
| status | VARCHAR(20) | DEFAULT 'pending' | 任务状态：<br>`pending` - 待完成<br>`in_progress` - 进行中<br>`completed` - 已完成<br>`claimed` - 已领取奖励 |
| current_progress | INTEGER | DEFAULT 0 | 当前完成进度 |
| target_progress | INTEGER | DEFAULT 1 | 目标完成进度 |
| completion_rate | DECIMAL(5,2) | DEFAULT 0 | 完成百分比（0-100） |
| claimable_amount | DECIMAL(10,2) | DEFAULT 0 | 可领取金额 |
| claimed_amount | DECIMAL(10,2) | DEFAULT 0 | 已领取金额 |
| started_at | TIMESTAMP | NULL | 开始时间 |
| completed_at | TIMESTAMP | NULL | 完成时间 |
| claimed_at | TIMESTAMP | NULL | 奖励领取时间 |
| expires_at | TIMESTAMP | NULL | 过期时间 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

#### 索引设计

- `idx_user_task_progress_user_id` - 用户ID索引
- `idx_user_task_progress_task_id` - 任务ID索引
- `idx_user_task_progress_user_task` - 复合索引：用户ID+任务ID
- `idx_user_task_progress_status` - 状态索引
- `idx_user_task_progress_completed_at` - 完成时间索引

#### 唯一约束

- `UNIQUE(user_id, task_id)` - 每个用户对每个任务只能有一条进度记录

#### 业务规则

- 用户完成度计算：`completion_rate = (current_progress / target_progress) * 100`
- 只有状态为'completed'的任务才能领取奖励
- 支持任务过期机制

### 3. CheckInRecords（签到记录表）

用于记录用户的每日签到情况。

#### 字段说明

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 签到记录唯一标识符 |
| user_id | UUID | NOT NULL | 用户ID（关联users表） |
| check_in_date | DATE | NOT NULL | 签到日期 |
| consecutive_days | INTEGER | DEFAULT 1 | 连续签到天数 |
| cycle_day | INTEGER | DEFAULT 1 | 当前7天周期中的第几天（1-7） |
| is_double_reward | BOOLEAN | DEFAULT false | 是否为双倍奖励日 |
| reward_amount | DECIMAL(10,2) | DEFAULT 0 | 奖励金额 |
| reward_type | VARCHAR(30) | DEFAULT 'coins' | 奖励类型：<br>`coins` - 幸运币<br>`balance` - 余额<br>`vip_days` - VIP天数 |
| status | VARCHAR(20) | DEFAULT 'claimed' | 签到状态：<br>`claimed` - 已领取<br>`missed` - 错失<br>`expired` - 已过期 |
| claimed_at | TIMESTAMP | DEFAULT NOW() | 奖励领取时间 |
| notes | TEXT | NULL | 备注信息 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

#### 索引设计

- `idx_check_in_records_user_id` - 用户ID索引
- `idx_check_in_records_user_date` - 复合索引：用户ID+签到日期
- `idx_check_in_records_status` - 状态索引
- `idx_check_in_records_consecutive_days` - 连续天数索引

#### 唯一约束

- `UNIQUE(user_id, check_in_date)` - 每个用户每天只能签到一次

#### 业务规则

- 采用7天循环奖励机制，cycle_day表示当前周期位置
- 断签重置：连续签到中断时，重新从第1天开始
- 双倍奖励日：特定日期可获得双倍奖励

### 4. FirstRechargeRewards（首充奖励记录表）

用于记录用户的首充奖励情况。

#### 字段说明

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 奖励记录唯一标识符 |
| user_id | UUID | NOT NULL | 用户ID（关联users表） |
| recharge_amount | DECIMAL(10,2) | NOT NULL | 充值金额 |
| recharge_order_id | UUID | NULL | 充值订单ID（关联orders表） |
| bonus_percentage | DECIMAL(5,2) | DEFAULT 0 | 奖励百分比（0-100） |
| bonus_amount | DECIMAL(10,2) | DEFAULT 0 | 奖励金额 |
| bonus_type | VARCHAR(30) | DEFAULT 'coins' | 奖励类型：<br>`coins` - 幸运币<br>`balance` - 余额 |
| total_reward_amount | DECIMAL(10,2) | DEFAULT 0 | 总奖励金额（包含本金） |
| status | VARCHAR(20) | DEFAULT 'pending' | 奖励状态：<br>`pending` - 待处理<br>`claimed` - 已领取<br>`expired` - 已过期<br>`cancelled` - 已取消 |
| claimed_at | TIMESTAMP | NULL | 奖励领取时间 |
| expires_at | TIMESTAMP | NULL | 奖励过期时间 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

#### 索引设计

- `idx_first_recharge_rewards_user_id` - 用户ID索引
- `idx_first_recharge_rewards_status` - 状态索引
- `idx_first_recharge_rewards_recharge_amount` - 充值金额索引
- `idx_first_recharge_rewards_expires_at` - 过期时间索引

#### 唯一约束

- `UNIQUE(user_id)` - 每个用户只能享受一次首充奖励

#### 业务规则

- 奖励计算：`bonus_amount = recharge_amount * bonus_percentage / 100`
- 总奖励金额：`total_reward_amount = recharge_amount + bonus_amount`
- 支持设置奖励过期时间

## 核心功能函数

### 1. get_user_current_streak(user_uuid UUID)

获取用户当前连续签到天数。

```sql
SELECT get_user_current_streak('user-uuid-here');
```

### 2. calculate_checkin_reward(streak_days INTEGER, is_double_day BOOLEAN)

计算签到奖励金额。

```sql
SELECT calculate_checkin_reward(5, false); -- 返回第5天的基础奖励
```

### 3. check_newbie_tasks_completion(user_uuid UUID, required_task_types TEXT[])

检查用户是否完成指定新手任务集合。

```sql
SELECT check_newbie_tasks_completion(
    'user-uuid-here', 
    ARRAY['registration', 'first_recharge', 'lottery_participation']
);
```

## 数据视图

### user_newbie_incentive_summary

用户新手激励系统汇总视图，提供用户的完整激励统计信息。

#### 包含数据

- 用户基本信息
- 任务进度统计（总数、完成数、已领取数、待处理数）
- 签到统计（总签到次数、最大连续天数、总奖励等）
- 首充奖励状态
- 今日签到状态

#### 使用示例

```sql
SELECT * FROM user_newbie_incentive_summary WHERE user_id = 'user-uuid-here';
```

## 数据完整性约束

### CheckInRecords表约束

- `chk_checkin_consecutive_days`：连续天数必须大于0
- `chk_checkin_cycle_day`：周期天数必须在1-7之间
- `chk_checkin_reward_amount`：奖励金额必须大于等于0

### UserTaskProgress表约束

- `chk_progress_current`：当前进度必须大于等于0
- `chk_progress_target`：目标进度必须大于0
- `chk_completion_rate`：完成率必须在0-100之间
- `chk_claimable_amount`：可领取金额必须大于等于0
- `chk_claimed_amount`：已领取金额必须大于等于0

### FirstRechargeRewards表约束

- `chk_bonus_percentage`：奖励百分比必须在0-100之间
- `chk_bonus_amount`：奖励金额必须大于等于0
- `chk_total_reward_amount`：总奖励金额必须大于等于0

## 安全策略（RLS）

### 1. NewbieTasks表

- **SELECT**：所有用户可读取
- **INSERT/UPDATE**：认证用户可操作

### 2. UserTaskProgress表

- **SELECT**：用户只能查看自己的数据
- **INSERT/UPDATE**：用户只能操作自己的数据

### 3. CheckInRecords表

- **SELECT**：用户只能查看自己的签到记录
- **INSERT/UPDATE**：用户只能操作自己的签到记录

### 4. FirstRechargeRewards表

- **SELECT**：用户只能查看自己的首充奖励
- **INSERT/UPDATE**：用户只能操作自己的首充奖励

## 性能优化建议

### 1. 索引优化

- 为高频查询字段创建索引
- 使用复合索引优化多条件查询
- 定期分析索引使用情况

### 2. 查询优化

- 使用视图简化复杂查询
- 合理使用分区表（对于大量历史数据）
- 避免N+1查询问题

### 3. 缓存策略

- 任务定义数据可进行缓存
- 用户签到状态可以短期缓存
- 排行榜数据使用Redis缓存

## 维护和监控

### 1. 定期清理

- 清理过期的任务进度记录
- 清理已过期的签到记录
- 归档历史数据

### 2. 数据监控

- 监控任务完成率
- 监控签到活跃度
- 监控首充转化率

### 3. 备份策略

- 定期全量备份
- 重要表的实时增量备份
- 定期验证备份完整性

## 版本兼容性

### 1. 向后兼容

- 保留原有字段的兼容层
- 平滑迁移策略
- 数据双写机制

### 2. 升级路径

- 版本升级前充分测试
- 制定回滚方案
- 分阶段部署

## 初始数据

系统提供了7个基础新手任务：

1. **完成注册** - 注册并验证手机号，奖励10幸运币
2. **首次充值** - 完成首次充值，奖励50幸运币
3. **参与抽奖** - 参与一次抽奖活动，奖励20幸运币
4. **购买商品** - 完成首次商品购买，奖励30幸运币
5. **完善个人资料** - 完善资料和地址，奖励15幸运币
6. **邀请好友** - 成功邀请一位好友，奖励25幸运币
7. **连续签到7天** - 连续7天签到，奖励100幸运币

## 最佳实践

### 1. 数据操作

- 使用事务确保数据一致性
- 批量操作时注意性能影响
- 及时更新统计信息

### 2. 错误处理

- 完善的异常捕获机制
- 详细的错误日志记录
- 用户友好的错误提示

### 3. 扩展性考虑

- 预留扩展字段
- 灵活的配置机制
- 模块化的功能设计

---

## 附录

### A. 迁移文件

- **文件名**：`20251101_newbie_incentive_system/migration.sql`
- **执行时间**：2025-11-01
- **涉及表**：4个新表
- **索引数量**：12个
- **函数数量**：4个
- **视图数量**：1个

### B. 相关文件

- **Prisma Schema**：`prisma/schema.prisma`
- **API接口**：待开发
- **前端组件**：待开发
- **测试用例**：待开发

### C. 联系信息

- **开发团队**：LuckyMart TJ 开发团队
- **文档版本**：1.0
- **最后更新**：2025-11-01
