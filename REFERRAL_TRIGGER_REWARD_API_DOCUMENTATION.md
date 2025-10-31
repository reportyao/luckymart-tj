# 推荐奖励触发API文档

## 概述

`POST /api/referral/trigger-reward` API 用于触发推荐奖励系统，当用户完成特定事件（首次抽奖、首次购买）时自动发放奖励给用户及其推荐链上的推荐人。

## 功能特性

- ✅ 支持多种事件类型触发奖励
- ✅ 多层级推荐奖励发放（最多3级）
- ✅ 防重复触发机制
- ✅ 完整的奖励配置管理
- ✅ 自动用户状态更新
- ✅ Telegram通知发送
- ✅ 完整的错误处理和验证
- ✅ 详细的日志记录和监控

## 请求格式

### 请求头
```
Content-Type: application/json
X-Request-ID: [可选] 请求唯一标识符
X-Trace-ID: [可选] 链路追踪ID
```

### 请求体
```json
{
  "user_id": "string", // 必需：用户ID
  "event_type": "string", // 必需：事件类型
  "event_data": {
    // 可选：事件相关数据
    "order_id": "string",
    "lottery_round_id": "string", 
    "amount": "number"
  }
}
```

### 参数说明

| 参数 | 类型 | 必需 | 描述 | 示例 |
|------|------|------|------|------|
| user_id | string | ✅ | 触发事件的用户ID | "user-uuid-123" |
| event_type | string | ✅ | 事件类型，支持：`first_lottery`、`first_purchase` | "first_lottery" |
| event_data | object | ❌ | 事件相关数据，用于记录和通知 | {"amount": 100} |

### 支持的事件类型

| 事件类型 | 描述 | 触发条件 |
|----------|------|----------|
| `first_lottery` | 首次抽奖奖励 | 用户第一次参与抽奖 |
| `first_purchase` | 首次购买奖励 | 用户第一次进行充值/购买 |

## 响应格式

### 成功响应 (200)
```json
{
  "success": true,
  "data": {
    "trigger_info": {
      "user_id": "user-uuid-123",
      "event_type": "first_lottery",
      "user_rewards_count": 1,
      "referrer_rewards_count": 2,
      "total_rewards_count": 3
    },
    "rewards": {
      "user_rewards": [
        {
          "type": "referral_first_lottery",
          "amount": 3.0,
          "transaction_id": 12345
        }
      ],
      "referrer_rewards": [
        {
          "level": 1,
          "type": "referral_first_lottery_referrer", 
          "amount": 5.0,
          "transaction_id": 12346
        },
        {
          "level": 2,
          "type": "referral_first_lottery_referrer",
          "amount": 3.0, 
          "transaction_id": 12347
        }
      ]
    },
    "message": "推荐奖励触发成功，奖励已发放"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "request_id": "req-123456"
}
```

### 错误响应

#### 400 Bad Request - 参数验证失败
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "缺少必需参数：user_id"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "request_id": "req-123456"
}
```

#### 404 Not Found - 用户不存在
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND", 
    "message": "用户不存在"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "request_id": "req-123456"
}
```

#### 409 Conflict - 重复触发
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "用户已触发过首次抽奖奖励"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "request_id": "req-123456"
}
```

## 奖励配置说明

### 默认奖励配置

API会根据`event_type`从`reward_config`表加载相应的奖励配置：

#### 首次抽奖奖励 (first_lottery)
- `first_play_referee`: 被推荐人奖励，默认3.0币
- `first_play_referrer_l1`: 1级推荐人奖励，默认5.0币  
- `first_play_referrer_l2`: 2级推荐人奖励，默认3.0币
- `first_play_referrer_l3`: 3级推荐人奖励，默认2.0币

#### 首次购买奖励 (first_purchase)  
- `first_purchase_referrer_l1`: 1级推荐人奖励，默认10.0币
- `first_purchase_referrer_l2`: 2级推荐人奖励，默认5.0币
- `first_purchase_referrer_l3`: 3级推荐人奖励，默认2.0币

### 动态配置管理
- 奖励金额可以通过管理后台动态调整
- 支持启用/禁用特定配置项
- 配置变更会立即生效，无需重启服务

## 业务流程

### 1. 参数验证
- 验证必需参数：`user_id`、`event_type`
- 验证`event_type`是否为支持的值
- 验证`event_data`格式（可选）

### 2. 用户状态检查  
- 查询用户是否存在
- 检查对应事件是否已触发（防重复）
- 验证用户推荐关系

### 3. 状态更新
- 在数据库事务中更新用户状态
- `first_lottery` → 设置`has_first_lottery = true`
- `first_purchase` → 设置`has_first_purchase = true`

### 4. 奖励发放
- 加载最新奖励配置
- 为被推荐人发放个人奖励
- 为推荐链上的推荐人发放层级奖励（最多3级）
- 创建奖励交易记录
- 更新用户余额

### 5. 通知发送
- 向被推荐人发送奖励通知
- 向各级推荐人发送推荐奖励通知
- 集成Telegram Bot API

### 6. 响应返回
- 返回详细的奖励发放信息
- 包含交易记录ID用于追踪
- 记录性能指标和监控数据

## 数据库操作

### 涉及的主要表
- `users`: 用户信息和状态字段
- `referral_relationships`: 多层级推荐关系
- `reward_config`: 奖励配置管理  
- `reward_transactions`: 奖励交易记录

### 事务保证
- 所有数据库操作在单个事务中执行
- 确保数据一致性
- 失败时自动回滚

## 监控和日志

### 性能监控
- API响应时间记录
- 成功率统计
- 错误率监控
- 奖励发放数量统计

### 日志记录
- 请求参数记录（敏感信息脱敏）
- 业务操作日志
- 错误详情记录
- 用户行为追踪

### 指标标签
- `event_type`: 事件类型
- `user_rewards`: 用户奖励数量
- `referrer_rewards`: 推荐人奖励数量
- `total_rewards`: 总奖励数量

## 安全考虑

### 参数验证
- 严格的输入参数验证
- SQL注入防护
- XSS攻击防护

### 权限控制
- 需要有效的用户ID
- 推荐关系验证
- 设备指纹检查（可选扩展）

### 数据保护
- 敏感信息脱敏记录
- 交易记录完整审计
- 错误信息不泄露内部细节

## 使用示例

### JavaScript/TypeScript
```javascript
const response = await fetch('/api/referral/trigger-reward', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Request-ID': 'unique-request-id'
  },
  body: JSON.stringify({
    user_id: 'user-uuid-123',
    event_type: 'first_lottery',
    event_data: {
      lottery_round_id: 'round-456',
      amount: 100
    }
  })
});

const result = await response.json();
if (result.success) {
  console.log('奖励发放成功:', result.data);
} else {
  console.error('奖励发放失败:', result.error);
}
```

### cURL
```bash
curl -X POST http://localhost:3000/api/referral/trigger-reward \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: req-123456" \
  -d '{
    "user_id": "user-uuid-123", 
    "event_type": "first_lottery",
    "event_data": {
      "lottery_round_id": "round-456",
      "amount": 100
    }
  }'
```

## 错误处理

### 常见错误码
- `INVALID_INPUT` (400): 请求参数无效
- `NOT_FOUND` (404): 用户不存在
- `CONFLICT` (409): 事件已触发，不可重复
- `INTERNAL_ERROR` (500): 服务器内部错误

### 重试策略
- 4xx错误：不建议重试，修正请求参数
- 5xx错误：可指数退避重试，建议最多3次
- 网络错误：自动重试机制

## 扩展说明

### 可扩展功能
1. **事件类型扩展**：可添加更多事件类型如`first_share`、`first_review`
2. **奖励类型扩展**：支持实物奖励、优惠券等
3. **通知渠道扩展**：支持邮件、短信、WebPush等
4. **防作弊增强**：设备指纹、行为分析、风险评估

### 集成建议
1. **抽奖系统集成**：在抽奖成功后自动触发
2. **订单系统集成**：在订单完成后自动触发  
3. **用户行为分析**：结合用户画像优化奖励策略
4. **A/B测试**：支持不同奖励策略的效果对比

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 支持首次抽奖和首次购买奖励
- 多层级推荐奖励发放
- 完整的测试覆盖
- 性能监控和日志记录