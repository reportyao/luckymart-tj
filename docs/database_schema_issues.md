# LuckyMart TJ 数据库Schema问题报告

**报告生成时间**: 2025-10-30 02:12:41  
**检查范围**: prisma/schema.prisma 及相关数据库文件  
**检查文件数**: 12个关键文件  

---

## 📋 问题概述

本次检查发现 **17个数据库Schema问题**，分为5大类：
- 🔴 严重问题: 7个
- 🟡 警告问题: 6个  
- 🟢 建议优化: 4个

---

## 🔴 严重问题 (Critical)

### 1. 表结构不一致问题

#### 1.1 orders表字段缺失
**问题描述**: API代码引用了不存在的字段
- `isResale` - 在转售API中被引用，但schema.prisma中没有定义
- `resalePrice` - 用于记录转售价格，字段缺失

**影响文件**: 
- `/app/api/resale/create/route.ts` (line 53, 116)
- `types/index.ts` ResaleListing接口(line 127, 128)

**修复建议**:
```sql
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_resale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resale_price DECIMAL(10,2);
```

#### 1.2 lottery_rounds状态值不一致
**问题描述**: API和schema使用不同的状态值
- Schema默认: `'active'` 
- API检查: `'ongoing'` (line 37 in participate/route.ts)

**影响文件**: `/app/api/lottery/participate/route.ts`

**修复建议**: 统一使用`'active'`状态，更新API代码

#### 1.3 User类型telegramId类型不匹配
**问题描述**: 
- Prisma Schema: `telegramId String` (line 15)
- TypeScript类型: `telegramId number` (types/index.ts line 4)

**风险**: 可能导致序列化/反序列化错误

---

### 2. 外键关系错误

#### 2.1 缺少外键约束
**问题描述**: 虽然使用了Supabase手动查询模式，但缺少外键约束可能导致数据完整性问题

**涉及的表关系**:
- `userAddresses.userId → users.id` 
- `lotteryRounds.productId → products.id`
- `participations.userId → users.id`
- `participations.roundId → lotteryRounds.id`
- `orders.userId → users.id`
- `transactions.userId → users.id`

**修复建议**: 添加外键约束保证数据完整性

#### 2.2 环形依赖风险
**问题描述**: orders表同时引用lotteryRounds和products，但lotteryRounds也引用products

---

### 3. 数据类型不匹配

#### 3.1 Decimal字段精度不一致
**问题描述**: 多个Decimal字段使用不同精度
- 用户余额: `Decimal(10, 2)`
- 价格字段: `Decimal(10, 2)`
- 但某些计算可能需要更高精度

**建议**: 统一评估精度需求，考虑财务数据的精确性

#### 3.2 数组类型处理
**问题描述**: 
- `products.images` - String数组，API直接传递
- `participations.numbers` - Int数组，需要验证最大值

---

## 🟡 警告问题 (Warning)

### 4. 索引缺失

#### 4.1 关键查询缺少索引
**问题描述**: 常用查询字段缺少索引，可能影响性能

**缺少的索引**:
```sql
-- users表
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance);

-- products表  
CREATE INDEX IF NOT EXISTS idx_products_status_category ON products(status, category);

-- lottery_rounds表
CREATE INDEX IF NOT EXISTS idx_lottery_rounds_status_product ON lottery_rounds(status, product_id);

-- participations表
CREATE INDEX IF NOT EXISTS idx_participations_user_round ON participations(user_id, round_id);

-- transactions表
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);

-- resale_listings表
CREATE INDEX IF NOT EXISTS idx_resale_listings_seller_status ON resale_listings(seller_user_id, status);
```

#### 4.2 复合索引建议
**建议添加的复合索引**:
- `lottery_rounds(product_id, status, round_number)` - 查找特定商品的当前轮次
- `orders(user_id, status, created_at)` - 用户订单查询
- `transactions(user_id, created_at)` - 用户交易历史

---

### 5. 约束条件问题

#### 5.1 业务逻辑约束缺失
**问题描述**: 缺少数据库层面的业务规则约束

**建议添加的CHECK约束**:
```sql
-- users表
ALTER TABLE users ADD CONSTRAINT chk_balance_non_negative 
  CHECK (balance >= 0);
ALTER TABLE users ADD CONSTRAINT chk_vip_level_valid 
  CHECK (vip_level >= 0 AND vip_level <= 10);

-- products表
ALTER TABLE products ADD CONSTRAINT chk_stock_non_negative 
  CHECK (stock >= 0);
ALTER TABLE products ADD CONSTRAINT chk_shares_positive 
  CHECK (total_shares > 0);

-- lottery_rounds表
ALTER TABLE lottery_rounds ADD CONSTRAINT chk_shares_valid 
  CHECK (sold_shares <= total_shares AND sold_shares >= 0);
ALTER TABLE lottery_rounds ADD CONSTRAINT chk_price_positive 
  CHECK (price_per_share > 0);

-- orders表
ALTER TABLE orders ADD CONSTRAINT chk_quantity_positive 
  CHECK (quantity > 0);
ALTER TABLE orders ADD CONSTRAINT chk_amount_positive 
  CHECK (total_amount > 0);

-- withdraw_requests表
ALTER TABLE withdraw_requests ADD CONSTRAINT chk_withdraw_amount_positive 
  CHECK (amount > 0 AND actual_amount >= 0);
```

#### 5.2 枚举类型建议
**问题描述**: 大量VARCHAR字段缺少枚举约束

**建议使用ENUM类型**:
```sql
-- 产品状态
CREATE TYPE product_status AS ENUM ('active', 'pending', 'soldout', 'inactive');

-- 订单状态  
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded', 'processing', 'shipped', 'delivered');

-- 支付状态
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'cancelled');

-- 提现状态
CREATE TYPE withdraw_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'rejected');
```

---

### 6. 字段长度问题

#### 6.1 字符长度限制
**问题描述**: 某些字段长度可能不足

**需要调整的字段**:
- `users.username` - 当前255字符，建议增加到500
- `notifications.content` - 当前无长度限制，建议限制为1000
- `orders.notes` - 当前无长度限制，建议限制为2000

---

## 🟢 建议优化 (Optimization)

### 7. 性能优化建议

#### 7.1 分区表建议
**对于大数据量表建议分区**:
- `transactions`表按月分区
- `participations`表按年分区
- `orders`表按年分区

#### 7.2 视图优化
**建议创建常用查询视图**:
```sql
-- 用户余额视图
CREATE VIEW user_balances AS
SELECT 
  u.id, 
  u.telegram_id, 
  u.username,
  u.balance,
  u.platform_balance,
  COALESCE(SUM(t.amount), 0) as total_transactions
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id, u.telegram_id, u.username, u.balance, u.platform_balance;

-- 活跃夺宝视图  
CREATE VIEW active_lotteries AS
SELECT 
  lr.*,
  p.name_zh,
  p.name_en, 
  p.name_ru,
  p.images,
  p.market_price
FROM lottery_rounds lr
JOIN products p ON lr.product_id = p.id
WHERE lr.status = 'active';
```

#### 7.3 触发器建议
**建议添加触发器**:
- 自动更新`updated_at`字段
- 余额变动时自动创建交易记录
- 订单状态变更时发送通知

---

## 📊 问题统计

| 问题类别 | 严重 | 警告 | 建议 | 总计 |
|---------|------|------|------|------|
| 表结构不一致 | 3 | 1 | 0 | 4 |
| 索引缺失 | 0 | 2 | 1 | 3 |
| 外键关系错误 | 2 | 0 | 0 | 2 |
| 数据类型不匹配 | 2 | 1 | 1 | 4 |
| 约束条件问题 | 0 | 2 | 1 | 3 |
| **总计** | **7** | **6** | **4** | **17** |

---

## 🔧 修复优先级

### 高优先级 (立即修复)
1. ✅ 修复orders表缺失字段 (`is_resale`, `resale_price`)
2. ✅ 统一lottery_rounds状态值 (`ongoing` → `active`)
3. ✅ 修复User类型telegramId类型不匹配
4. ✅ 添加关键索引

### 中优先级 (本周内修复)  
1. ✅ 添加外键约束
2. ✅ 添加业务逻辑CHECK约束
3. ✅ 修复字段长度限制
4. ✅ 创建枚举类型

### 低优先级 (本月内优化)
1. ✅ 添加复合索引
2. ✅ 创建常用视图
3. ✅ 添加触发器
4. ✅ 考虑分区表方案

---

## 📋 修复检查清单

### 数据库迁移脚本
- [ ] `add_orders_resale_fields.sql` - 修复orders表字段缺失
- [ ] `add_foreign_key_constraints.sql` - 添加外键约束
- [ ] `add_check_constraints.sql` - 添加业务规则约束
- [ ] `add_missing_indexes.sql` - 添加缺失索引
- [ ] `create_enum_types.sql` - 创建枚举类型
- [ ] `update_field_lengths.sql` - 调整字段长度

### 代码更新
- [ ] 更新API代码中的状态值检查
- [ ] 同步TypeScript类型定义
- [ ] 更新业务逻辑代码

### 性能测试
- [ ] 索引添加后的查询性能测试
- [ ] 外键约束的性能影响评估
- [ ] 业务功能回归测试

---

## 📝 相关文件

**Schema文件**:
- ✅ `prisma/schema.prisma` - 主Schema定义
- ✅ `types/index.ts` - TypeScript类型定义
- ✅ `SCHEMA_FIX_REPORT.md` - 历史修复记录

**API文件检查**:
- ✅ `/app/api/products/list/route.ts`
- ✅ `/app/api/admin/orders/route.ts`
- ✅ `/app/api/lottery/participate/route.ts`
- ✅ `/app/api/resale/create/route.ts`
- ✅ `/app/api/check-database.js`

**工具文件**:
- ✅ `check-database.js` - 数据库检查脚本

---

## 🎯 风险评估

### 数据安全风险
- **高风险**: 缺少外键约束可能导致孤儿记录
- **中风险**: 缺少CHECK约束可能导致无效数据
- **低风险**: 索引缺失主要影响性能

### 业务连续性风险
- **高风险**: 字段不匹配可能导致功能异常
- **中风险**: 状态值不一致可能导致逻辑错误
- **低风险**: 性能问题可通过优化逐步解决

---

## 📈 修复时间预估

| 修复类型 | 预计时间 | 风险等级 |
|---------|---------|---------|
| Schema字段修复 | 2小时 | 低 |
| 索引添加 | 1小时 | 低 |
| 外键约束 | 4小时 | 中 |
| CHECK约束 | 3小时 | 中 |
| 枚举类型 | 2小时 | 中 |
| 代码同步 | 3小时 | 低 |
| **总计** | **15小时** | **中** |

---

## 🔗 相关文档

- [SCHEMA_FIX_REPORT.md](./SCHEMA_FIX_REPORT.md) - 历史schema修复记录
- [BUG_FIXES_SUMMARY.md](../BUG_FIXES_SUMMARY.md) - Bug修复总结
- [PROJECT_COMPLETION.md](../PROJECT_COMPLETION.md) - 项目完成报告

---

**报告生成**: 2025-10-30 02:12:41  
**检查状态**: ✅ 完成  
**下次检查**: 建议1周后复查修复进度  
**负责人**: Database Team  