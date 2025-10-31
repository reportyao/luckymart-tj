# 抽奖系统双货币集成字段映射指南

## 概述
本次更新将抽奖系统的支付方式从 `balance` 统一迁移到 `luckyCoins`，确保与双货币架构的兼容性。

## 主要修改

### 1. 字段名修复

| 原字段 | 新字段 | 表名/位置 | 说明 |
|--------|--------|-----------|------|
| `maxShares` | `totalShares` | `lotteryRounds` | 总份额字段名修正 |
| `endTime` | `drawTime` | `lotteryRounds` | 开奖时间字段 |
| `lotteryParticipations` | `participations` | 表名 | 使用正确的表名 |

### 2. 支付字段迁移

| 操作 | 原字段 | 新字段 | 说明 |
|------|--------|--------|------|
| 用户查询 | `users.balance` | `users.luckyCoins` | 余额验证 |
| 余额扣除 | `users.balance` | `users.luckyCoins` | 支付扣款 |
| 版本控制 | `balanceVersion` | `luckyCoinsVersion` | 并发控制 |
| 交易记录 | `balanceType: 'lottery_coin'` | `balanceType: 'lucky_coins'` | 交易类型 |

### 3. 参与记录结构

| 字段 | 原结构 | 新结构 | 说明 |
|------|--------|--------|------|
| 表名 | `lotteryParticipations` | `participations` | 正确表名 |
| 参与份额 | `shares: number` | `sharesCount: number` | 字段名标准化 |
| 成本 | `costPerShare, totalCost` | `cost: decimal` | 统一成本字段 |
| 状态 | `status: string` | 移除 | 使用默认值 |
| 号码 | 新增 | `numbers: int[]` | 抽奖号码数组 |

## API 请求响应

### 请求格式
```json
{
  "roundId": "uuid",
  "quantity": 1
}
```

### 成功响应
```json
{
  "success": true,
  "data": {
    "participationId": "uuid",
    "roundId": "uuid", 
    "quantity": 1,
    "totalCost": 1.00,
    "remainingShares": 99
  },
  "message": "抽奖参与成功！"
}
```

### 错误响应
```json
{
  "error": "幸运币余额不足"
}
```

## 数据库事务

### 事务步骤
1. **验证期次** - 检查 `lotteryRounds` 表中的 `totalShares`、`soldShares`
2. **验证余额** - 检查 `users.luckyCoins` 余额
3. **创建参与** - 向 `participations` 表插入记录
4. **扣减余额** - 更新 `users.luckyCoins` 和 `luckyCoinsVersion`
5. **更新销售** - 更新 `lotteryRounds.soldShares`
6. **记录交易** - 向 `transactions` 表插入记录
7. **发送通知** - 向 `notifications` 表插入记录

### 并发控制
- 使用 `luckyCoinsVersion` 字段防止并发扣款
- 使用数据库事务确保原子性
- 实时更新 `soldShares` 防止超售

## 支付逻辑

### 费用计算
```typescript
const totalCost = round.pricePerShare * quantity;
// 1份 = 1幸运币 = 1 Som
```

### 余额检查
```typescript
if (Number(user.luckyCoins) < Number(totalCost)) {
  throw new Error('幸运币余额不足');
}
```

## 错误处理

| 错误类型 | HTTP状态码 | 错误消息 | 说明 |
|----------|------------|----------|------|
| 幸运币余额不足 | 400 | "幸运币余额不足" | 用户余额不足 |
| 期次不存在 | 404 | "抽奖期次不存在" | roundId无效 |
| 份额不足 | 400 | "剩余份额不足，仅剩X份" | 可用份额不足 |
| 未授权 | 401 | "未授权访问" | 用户未登录 |
| 频率限制 | 429 | "参与抽奖过于频繁，请稍后再试" | 超出速率限制 |

## 兼容性说明

### 向后兼容
- 现有的参与记录保留在 `participations` 表中
- 历史交易记录继续有效
- 用户数据和商品数据无需迁移

### 数据一致性
- 所有新参与记录使用 `luckyCoins` 支付
- 保留 `balance` 字段用于其他功能
- 事务记录使用 `balanceType: 'lucky_coins'`

## 部署检查清单

- [x] 更新API字段映射
- [x] 修复表名引用
- [x] 更新支付逻辑
- [x] 测试并发安全
- [x ] 更新前端调用代码
- [ ] 验证数据库迁移
- [ ] 运行集成测试

## 测试用例

### 正常流程测试
```bash
# 参与抽奖
curl -X POST /api/lottery/participate \
  -H "Authorization: Bearer <token>" \
  -d '{"roundId": "uuid", "quantity": 1}'
```

### 错误场景测试
- 余额不足
- 期次不存在
- 份额不足
- 并发冲突

## 监控指标

- 支付成功率
- 幸运币消耗统计
- 并发冲突率
- 响应时间分布

---

**更新时间**: 2025-10-31  
**版本**: v2.0  
**兼容性**: 与现有数据结构完全兼容
