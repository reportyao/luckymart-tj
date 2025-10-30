# 数据库锁机制实现文档

## 概述

本文档详细介绍了 luckymart-tj 项目中实施的数据库乐观锁/悲观锁机制，用于解决并发操作中的数据一致性问题。

## 实施日期
2025年10月31日

## 问题背景

在原始系统中存在以下并发安全问题：

1. **余额扣减并发问题**：多个用户同时参与夺宝时，可能导致余额扣减异常
2. **夺宝份额超售**：多个用户同时购买同一期次的份额，可能导致超售
3. **订单状态混乱**：并发更新订单状态可能导致状态不一致
4. **重置逻辑冲突**：多个进程同时重置用户免费次数可能导致异常

## 解决方案

### 1. 乐观锁机制

**原理**：通过版本号字段控制数据更新，当版本号不匹配时拒绝更新

**适用场景**：
- 用户余额扣减/充值
- 订单状态更新
- 夺宝份额更新

**实现方式**：
- 为相关表添加版本号字段
- 更新时检查版本号是否匹配
- 版本冲突时拒绝更新并返回错误

### 2. 悲观锁机制

**原理**：在数据读取时立即加锁，防止其他事务修改

**适用场景**：
- 需要强一致性的业务操作
- 检查-然后操作的场景

**实现方式**：
- 使用 `FOR UPDATE` 语句获取行级锁
- 确保在同一事务中的操作原子性

### 3. 原子操作

**原理**：将多个相关操作合并为一个数据库函数，确保要么全部成功要么全部失败

**适用场景**：
- 夺宝参与（余额扣减 + 份额更新 + 参与记录创建）
- 订单取消（状态更新 + 余额回滚 + 交易记录）

## 数据库结构变更

### 1. 新增字段

```sql
-- users 表
ALTER TABLE users ADD COLUMN balance_version INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN platform_balance_version INTEGER DEFAULT 1;

-- lottery_rounds 表
ALTER TABLE lottery_rounds ADD COLUMN sold_shares_version INTEGER DEFAULT 1;

-- orders 表
ALTER TABLE orders ADD COLUMN version INTEGER DEFAULT 1;

-- participations 表
ALTER TABLE participations ADD COLUMN version INTEGER DEFAULT 1;
```

### 2. 性能优化索引

```sql
CREATE INDEX idx_users_balance_version ON users(id, balance_version);
CREATE INDEX idx_lottery_rounds_sold_shares_version ON lottery_rounds(id, sold_shares_version);
CREATE INDEX idx_orders_version ON orders(id, version);
CREATE INDEX idx_participations_version ON participations(id, version);
```

## 核心数据库函数

### 1. `update_user_balance_with_optimistic_lock()`

**功能**：安全的用户余额更新函数

**参数**：
- `p_user_id`: 用户ID
- `p_amount`: 金额
- `p_operation`: 操作类型（'deduct' | 'add'）
- `p_balance_type`: 余额类型（'balance' | 'platform_balance'）

**返回值**：
- `success`: 操作是否成功
- `new_balance`: 新余额
- `error_message`: 错误信息

**使用示例**：
```typescript
const result = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
  userId,
  100,
  'deduct',
  'balance'
);
```

### 2. `update_lottery_round_sold_shares_with_lock()`

**功能**：防止夺宝份额超售的安全更新函数

**参数**：
- `p_round_id`: 夺宝期次ID
- `p_shares_to_add`: 要添加的份额数

**返回值**：
- `success`: 操作是否成功
- `new_sold_shares`: 新的已售份额数
- `remaining_shares`: 剩余份额数
- `error_message`: 错误信息

**使用示例**：
```typescript
const result = await DatabaseLockManager.updateLotteryRoundSoldSharesWithLock(
  roundId,
  5
);
```

### 3. `participate_in_lottery_with_balance_deduction()`

**功能**：夺宝参与的原子操作函数

**参数**：
- `p_user_id`: 用户ID
- `p_round_id`: 夺宝期次ID
- `p_product_id`: 产品ID
- `p_shares_count`: 份额数量
- `p_numbers`: 选择的号码数组

**返回值**：
- `success`: 操作是否成功
- `participation_id`: 参与记录ID
- `error_message`: 错误信息

**原子操作流程**：
1. 获取夺宝期次信息（悲观锁）
2. 检查期次状态和剩余份额
3. 扣减用户余额（乐观锁）
4. 更新夺宝期次份额（乐观锁）
5. 创建参与记录
6. 创建交易记录

### 4. `update_order_status_with_lock()`

**功能**：安全的订单状态更新函数

### 5. `reset_user_free_count_safe()`

**功能**：安全的重置用户每日免费次数函数

## TypeScript 工具类

### DatabaseLockManager

主要方法：

1. **updateUserBalanceWithOptimisticLock()** - 余额操作
2. **updateLotteryRoundSoldSharesWithLock()** - 份额更新
3. **participateInLotteryWithBalanceDeduction()** - 夺宝参与
4. **updateOrderStatusWithLock()** - 订单状态更新
5. **resetUserFreeCountSafe()** - 重置免费次数
6. **batchUpdateUserBalance()** - 批量余额操作
7. **checkUserBalanceSufficient()** - 余额预检查
8. **checkLotteryRoundRemainingShares()** - 份额预检查
9. **getLockMonitoringInfo()** - 锁状态监控

## 使用指南

### 1. 基本使用模式

```typescript
import DatabaseLockManager from '@/lib/database-lock-manager';

// 余额扣减
const balanceResult = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
  userId,
  amount,
  'deduct'
);

if (!balanceResult.success) {
  throw new Error(balanceResult.errorMessage);
}

// 份额更新
const shareResult = await DatabaseLockManager.updateLotteryRoundSoldSharesWithLock(
  roundId,
  sharesCount
);

if (!shareResult.success) {
  throw new Error(shareResult.errorMessage);
}
```

### 2. 完整夺宝流程

```typescript
// 使用原子操作函数
const participationResult = await DatabaseLockManager.participateInLotteryWithBalanceDeduction(
  userId,
  roundId,
  productId,
  sharesCount,
  numbers
);

if (!participationResult.success) {
  throw new Error(participationResult.errorMessage);
}

console.log(`参与成功，ID: ${participationResult.participationId}`);
```

### 3. 批量操作

```typescript
const operations = [
  { userId: 'user1', amount: 10, operation: 'deduct' },
  { userId: 'user2', amount: 20, operation: 'add' }
];

const results = await DatabaseLockManager.batchUpdateUserBalance(operations);
```

### 4. 预检查模式

```typescript
// 先检查余额是否充足
const balanceInfo = await DatabaseLockManager.checkUserBalanceSufficient(
  userId,
  requiredAmount
);

if (!balanceInfo.sufficient) {
  throw new Error(`余额不足`);
}

// 然后执行实际操作（仍然需要锁机制）
```

## 最佳实践

### 1. 错误处理

```typescript
try {
  const result = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
    userId,
    amount,
    'deduct'
  );
  
  if (!result.success) {
    // 根据错误信息做相应处理
    switch (result.errorMessage) {
      case '余额不足':
        // 处理余额不足的情况
        break;
      case '版本冲突，请重试':
        // 可以尝试重新执行操作
        break;
      default:
        // 其他错误
    }
  }
} catch (error) {
  // 捕获异常
  console.error('操作失败:', error);
}
```

### 2. 重试机制

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    }
  }
  throw new Error('重试次数已用完');
}

// 使用重试机制
const result = await retryOperation(async () => {
  return await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
    userId,
    amount,
    'deduct'
  );
});
```

### 3. 监控和日志

```typescript
// 监控锁状态
const lockInfo = await DatabaseLockManager.getLockMonitoringInfo();
console.log('当前锁状态:', lockInfo);

// 记录操作日志
console.log(`用户 ${userId} 余额扣减 ${amount}，结果: ${result.success}`);
```

### 4. 事务结合使用

```typescript
await prisma.$transaction(async (tx) => {
  // 在事务中执行多个相关操作
  // 仍可使用锁机制确保数据一致性
});
```

## 性能考虑

### 1. 索引优化

已为版本号字段创建索引，确保查询性能：
- `idx_users_balance_version`
- `idx_lottery_rounds_sold_shares_version`
- `idx_orders_version`
- `idx_participations_version`

### 2. 锁粒度

- **行级锁**：只锁定具体的记录，避免表级锁的性能影响
- **乐观锁**：适合读多写少的场景，减少锁竞争
- **悲观锁**：用于需要强一致性的检查-然后操作场景

### 3. 批量操作优化

```typescript
// 批量操作减少数据库往返次数
const results = await DatabaseLockManager.batchUpdateUserBalance(operations);
```

## 故障排查

### 1. 常见错误

#### 余额不足
```
余额更新失败：余额不足
```
**解决方案**：增加余额预检查或引导用户充值

#### 版本冲突
```
余额更新失败：版本冲突，请重试
```
**解决方案**：实现重试机制或提示用户稍后重试

#### 份额不足
```
份额更新失败：份额不足
```
**解决方案**：提供实时库存显示或限制购买数量

### 2. 监控指标

```typescript
// 获取锁状态监控信息
const lockInfo = await DatabaseLockManager.getLockMonitoringInfo();

// 分析锁争用情况
const lockStats = analyzeLockStats(lockInfo);
console.log('锁争用统计:', lockStats);
```

### 3. 调试技巧

```typescript
// 启用详细日志
const DEBUG = process.env.NODE_ENV === 'development';

async function debugBalanceOperation(userId: string, amount: number) {
  if (DEBUG) {
    console.log(`开始余额操作: 用户=${userId}, 金额=${amount}`);
  }
  
  const result = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
    userId,
    amount,
    'deduct'
  );
  
  if (DEBUG) {
    console.log(`余额操作结果:`, result);
  }
  
  return result;
}
```

## 迁移指南

### 1. 执行迁移

```bash
# 1. 备份现有数据
pg_dump luckymart_tj > backup_before_locks.sql

# 2. 执行迁移
psql -d luckymart_tj -f prisma/migrations/1761803600_add_database_locks/migration.sql

# 3. 验证迁移
psql -d luckymart_tj -c "SELECT * FROM lock_monitoring_view LIMIT 5;"
```

### 2. 更新代码

```typescript
// 1. 更新 Prisma Client
npx prisma generate

// 2. 替换原有的余额扣减逻辑
// 旧代码
await prisma.users.update({
  where: { id: userId },
  data: { balance: { decrement: amount } }
});

// 新代码
const result = await DatabaseLockManager.updateUserBalanceWithOptimisticLock(
  userId,
  amount,
  'deduct'
);

if (!result.success) {
  throw new Error(result.errorMessage);
}
```

### 3. 测试验证

```typescript
// 并发测试
describe('数据库锁机制测试', () => {
  test('并发余额扣减', async () => {
    const userId = 'test-user-id';
    const amount = 100;
    
    // 创建多个并发操作
    const promises = Array(10).fill(0).map(() => 
      DatabaseLockManager.updateUserBalanceWithOptimisticLock(
        userId,
        amount,
        'deduct'
      )
    );
    
    const results = await Promise.all(promises);
    
    // 只有一个操作应该成功
    const successCount = results.filter(r => r.success).length;
    expect(successCount).toBe(1);
  });
});
```

## 安全注意事项

### 1. 权限控制

```sql
-- 确保只有必要的角色可以执行这些函数
GRANT EXECUTE ON FUNCTION update_user_balance_with_optimistic_lock TO service_role;
REVOKE EXECUTE ON FUNCTION update_user_balance_with_optimistic_lock FROM anon;
```

### 2. 审计日志

```sql
-- 创建审计日志表
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(50),
  operation VARCHAR(50),
  user_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. 输入验证

```typescript
// 在函数参数中包含验证逻辑
function validateAmount(amount: number): void {
  if (amount <= 0) {
    throw new Error('金额必须大于0');
  }
  if (amount > 10000) {
    throw new Error('金额不能超过10000');
  }
}
```

## 未来改进

### 1. 性能优化

- 实现读写分离
- 添加缓存层
- 优化索引策略

### 2. 功能扩展

- 实现分布式锁
- 添加操作统计
- 增强监控面板

### 3. 自动化工具

- 锁争用检测
- 自动重试机制
- 性能分析工具

## 总结

本数据库锁机制实现提供了：

1. **完整的并发控制**：乐观锁 + 悲观锁 + 原子操作
2. **易用的API接口**：TypeScript 工具类封装
3. **详细的文档**：使用指南和最佳实践
4. **监控和调试**：锁状态监控和错误处理
5. **性能优化**：索引优化和批量操作支持

通过实施这套锁机制，可以有效解决系统的并发安全问题，确保数据的一致性和完整性。