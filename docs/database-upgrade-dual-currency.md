# 双货币数据库升级说明

## 概述

本次升级为 LuckyMart TJ 系统添加了双货币支持，引入了新的"幸运币"(Lucky Coins)货币类型，实现了更加灵活的支付系统。

## 升级详情

### 1. 新的数据库字段

在 `users` 表中添加了以下字段：

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `lucky_coins` | DECIMAL(10,2) | 0 | 幸运币余额 |
| `lucky_coins_version` | INTEGER | 1 | 幸运币版本控制 |

### 2. 货币体系设计

#### 双货币结构：
- **Som 货币** (原 balance 字段)：基础货币，用于大多数交易
- **Lucky Coins** (新增)：幸运币，1 幸运币 = 1 Som 成本

#### 应用场景：
- 抽奖系统：支持使用幸运币参与抽奖
- 特殊优惠：幸运币专享活动
- 积分奖励：通过Lucky Coins实现更灵活的奖励机制
- 兑换系统：Som 与 Lucky Coins 之间的转换

### 3. 数据库优化

#### 新增索引：
```sql
-- 幸运币余额索引
CREATE INDEX "users_lucky_coins_idx" ON "users" ("lucky_coins");

-- 幸运币版本索引
CREATE INDEX "users_lucky_coins_version_idx" ON "users" ("lucky_coins_version");

-- 复合索引（优化同时查询余额和版本）
CREATE INDEX "users_lucky_coins_composite_idx" ON "users" ("lucky_coins", "lucky_coins_version");
```

#### 性能优化：
- 独立的幸运币余额索引提升查询效率
- 版本控制字段支持乐观锁并发控制
- 复合索引优化复合查询场景

### 4. 向后兼容性

✅ **完全向后兼容**：
- 现有用户的 `balance` 字段保持不变
- 所有现有功能正常工作
- 新字段采用合理的默认值（0），不影响现有数据
- 原有 API 和业务逻辑无需修改

### 5. 版本控制机制

`lucky_coins_version` 字段采用与现有 `balanceVersion` 相同的乐观锁机制：

```javascript
// 示例：更新幸运币的安全方式
async function updateLuckyCoins(userId: string, amount: number) {
  const user = await prisma.users.findUnique({ 
    where: { id: userId },
    select: { luckyCoins: true, luckyCoinsVersion: true }
  });
  
  // 在实际业务中，这应该是一个原子操作
  const updatedUser = await prisma.users.update({
    where: { 
      id: userId,
      luckyCoinsVersion: user!.luckyCoinsVersion  // 乐观锁检查
    },
    data: {
      luckyCoins: user!.luckyCoins + amount,
      luckyCoinsVersion: user!.luckyCoinsVersion + 1
    }
  });
  
  return updatedUser;
}
```

## 迁移执行

### 1. 自动迁移
```bash
npx prisma migrate deploy
```

### 2. 生成客户端
```bash
npx prisma generate
```

### 3. 验证迁移
```sql
-- 检查新字段是否存在
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('lucky_coins', 'lucky_coins_version');

-- 检查索引是否创建成功
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users' 
AND indexname LIKE '%lucky_coins%';
```

## 业务代码集成建议

### 1. 幸运币操作函数
```typescript
// 充值幸运币
async function rechargeLuckyCoins(userId: string, amount: number) {
  return await prisma.$transaction(async (tx) => {
    // 扣除 Som 余额
    await tx.users.update({
      where: { id: userId },
      data: {
        balance: { decrement: amount },
        balanceVersion: { increment: 1 }
      }
    });
    
    // 增加幸运币
    return await tx.users.update({
      where: { id: userId },
      data: {
        luckyCoins: { increment: amount },
        luckyCoinsVersion: { increment: 1 }
      }
    });
  });
}
```

### 2. 抽奖系统支持
```typescript
// 使用幸运币参与抽奖
async function participateWithLuckyCoins(userId: string, roundId: string, shares: number) {
  const cost = shares; // 1 份额 = 1 幸运币
  
  return await prisma.$transaction(async (tx) => {
    // 扣除幸运币
    await tx.users.update({
      where: { id: userId },
      data: {
        luckyCoins: { decrement: cost },
        luckyCoinsVersion: { increment: 1 }
      }
    });
    
    // 创建参与记录
    return await tx.participations.create({
      data: {
        userId,
        roundId,
        sharesCount: shares,
        type: 'lucky_coins',
        cost: cost
      }
    });
  });
}
```

## 注意事项

1. **事务一致性**：涉及多货币的操作必须在同一事务中完成
2. **版本控制**：所有幸运币变更都要同时更新版本号
3. **汇率固定**：1 幸运币 = 1 Som，汇率不可变更
4. **余额检查**：确保操作前检查足够的余额
5. **错误处理**：妥善处理并发冲突和余额不足的情况

## 后续开发建议

1. **Lucky Coins 专享活动**：开发仅限幸运币的特别优惠
2. **积分转换机制**：添加 Som 到 Lucky Coins 的转换功能
3. **Lucky Coins 商城**：创建专门使用 Lucky Coins 的商品类别
4. **激励机制**：通过任务获得 Lucky Coins 奖励
5. **数据分析**：跟踪 Lucky Coins 的使用情况和用户偏好

---

**升级版本**：v2.0.0  
**升级时间**：2025-10-31  
**兼容性**：✅ 完全向后兼容  
**影响范围**：数据库结构、业务逻辑（可选）