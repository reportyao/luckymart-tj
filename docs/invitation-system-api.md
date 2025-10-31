# 邀请裂变系统 API 文档

## 概述

邀请裂变系统为 LuckyMart TJ 平台提供了完整的邀请奖励机制，包括邀请码生成、邀请关系绑定、奖励发放和消费返利等功能。

## 功能特性

- ✅ **邀请码生成**: 每个用户自动获得唯一邀请码
- ✅ **邀请关系绑定**: 使用邀请码建立邀请关系
- ✅ **首充奖励**: 被邀请人首次充值后，邀请人获得5%奖励
- ✅ **消费返利**: 被邀请人消费时，邀请人获得2%返利
- ✅ **奖励管理**: 支持奖励查询、状态跟踪和批量领取
- ✅ **防作弊机制**: 防止自推荐和虚假邀请
- ✅ **数据统计**: 提供详细的邀请统计数据
- ✅ **多语言支持**: 支持中文、俄语和塔吉克语

## API 端点

### 1. 生成个人邀请码

#### 请求

```http
POST /api/invitation/generate-code
Authorization: Bearer <access_token>
```

#### 响应

```json
{
  "success": true,
  "data": {
    "referralCode": "LM123456",
    "shareLinks": {
      "telegram": "https://t.me/luckymart_tj_bot?start=LM123456",
      "general": "https://luckymart-tj.com/invite/LM123456"
    },
    "shareTexts": {
      "zh": "🎉 加入 LuckyMart TJ，和 张三 一起享受购物乐趣！注册即享新用户福利，点击链接立即开始：https://luckymart-tj.com",
      "ru": "🎉 Присоединяйтесь к LuckyMart TJ и наслаждайтесь покупками вместе с 张三! Новые пользователи получают бонусы при регистрации. Нажмите ссылку, чтобы начать: https://luckymart-tj.com",
      "tg": "🎉 Ба LuckyMart TJ гирӣед ва бо 张三 якҷоя шӯҳрати харидани молҳоро ҳис кунед! Истифодабарандагони нав ҳангоми сабтшавӣ имтиёзҳо мегиранд. Барои оғоз кардан ба пайвандаш пахш кунед: https://luckymart-tj.com"
    },
    "qrCodeUrl": null
  },
  "message": "邀请码生成成功"
}
```

#### 错误响应

```json
{
  "success": false,
  "error": "邀请码生成失败，请稍后重试"
}
```

---

### 2. 获取我的邀请码和统计

#### 请求

```http
GET /api/invitation/my-code
Authorization: Bearer <access_token>
```

#### 响应

```json
{
  "success": true,
  "data": {
    "referralCode": "LM123456",
    "shareLinks": {
      "telegram": "https://t.me/luckymart_tj_bot?start=LM123456",
      "general": "https://luckymart-tj.com/invite/LM123456"
    },
    "shareTexts": {
      "zh": "🎉 加入 LuckyMart TJ，和 张三 一起享受购物乐趣！",
      "ru": "🎉 Присоединяйтесь к LuckyMart TJ и наслаждайтесь покупками вместе с 张三!",
      "tg": "🎉 Ба LuckyMart TJ гирӣед ва бо 张三 якҷоя шӯҳрати харидани молҳоро ҳис кунед!"
    },
    "stats": {
      "userId": "user-uuid",
      "referralCode": "LM123456",
      "firstName": "张三",
      "username": "zhangsan",
      "totalInvites": 5,
      "successfulInvites": 3,
      "totalRewards": 8,
      "claimedRewards": 6,
      "unclaimedRewards": 2,
      "totalCommission": 156.50,
      "claimedCommission": 125.30,
      "unclaimedCommission": 31.20,
      "lastInviteDate": "2025-10-30T10:30:00Z",
      "lastRewardDate": "2025-10-31T14:20:00Z"
    }
  },
  "message": "获取邀请信息成功"
}
```

---

### 3. 绑定邀请关系

#### 请求

```http
POST /api/invitation/bind
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "referralCode": "LM789012"
}
```

#### 参数说明

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| referralCode | string | 是 | 要绑定的邀请码，格式：LM + 6位字母数字组合 |

#### 成功响应

```json
{
  "success": true,
  "data": {
    "success": true,
    "referrerUserId": "referrer-uuid",
    "referrerName": "李四",
    "message": "邀请关系绑定成功"
  },
  "message": "邀请关系绑定成功"
}
```

#### 错误响应

```json
{
  "success": false,
  "error": "您已经绑定了邀请关系，不能重复绑定"
}
```

---

### 4. 查询邀请奖励记录

#### 请求

```http
GET /api/invitation/rewards?page=1&limit=20&rewardType=first_recharge&status=available
Authorization: Bearer <access_token>
```

#### 查询参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | integer | 否 | 页码，从1开始，默认1 |
| limit | integer | 否 | 每页数量，最大100，默认20 |
| rewardType | string | 否 | 奖励类型：'first_recharge', 'commission' |
| status | string | 否 | 奖励状态：'available', 'claimed', 'expired' |
| startDate | string | 否 | 开始日期，ISO 8601格式 |
| endDate | string | 否 | 结束日期，ISO 8601格式 |

#### 响应

```json
{
  "success": true,
  "data": {
    "rewards": [
      {
        "id": "reward-uuid",
        "referrerUserId": "user-uuid",
        "referredUserId": "referred-uuid",
        "referralRelationshipId": "relationship-uuid",
        "rewardType": "first_recharge",
        "rewardAmount": 25.00,
        "currency": "TJS",
        "relatedOrderId": "order-uuid",
        "description": "首充奖励",
        "isClaimed": false,
        "claimedAt": null,
        "expiresAt": "2025-11-30T16:22:36Z",
        "status": "available",
        "createdAt": "2025-10-31T16:22:36Z",
        "updatedAt": "2025-10-31T16:22:36Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    },
    "summary": {
      "totalAvailable": 3,
      "totalClaimed": 2,
      "totalAmount": 75.50
    }
  },
  "message": "获取奖励记录成功"
}
```

---

### 5. 查询消费返利记录

#### 请求

```http
GET /api/invitation/commission?page=1&limit=20&startDate=2025-10-01T00:00:00Z&endDate=2025-10-31T23:59:59Z
Authorization: Bearer <access_token>
```

#### 查询参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | integer | 否 | 页码，从1开始，默认1 |
| limit | integer | 否 | 每页数量，最大100，默认20 |
| startDate | string | 否 | 开始日期，ISO 8601格式 |
| endDate | string | 否 | 结束日期，ISO 8601格式 |

#### 响应

```json
{
  "success": true,
  "data": {
    "commissions": [
      {
        "id": "reward-uuid",
        "referrerUserId": "user-uuid",
        "referredUserId": "referred-uuid",
        "referralRelationshipId": "relationship-uuid",
        "rewardType": "commission",
        "rewardAmount": 2.00,
        "currency": "TJS",
        "relatedOrderId": "order-uuid",
        "description": "消费返利",
        "isClaimed": true,
        "claimedAt": "2025-10-31T15:30:00Z",
        "expiresAt": "2025-11-30T16:22:36Z",
        "status": "claimed",
        "createdAt": "2025-10-31T14:20:00Z",
        "updatedAt": "2025-10-31T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "totalPages": 1
    },
    "summary": {
      "totalCommissions": 8,
      "claimedCommissions": 6,
      "unclaimedCommissions": 2
    }
  },
  "message": "获取返利记录成功"
}
```

---

### 6. 领取邀请奖励

#### 请求

```http
POST /api/invitation/claim-reward
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "rewardIds": ["reward-uuid-1", "reward-uuid-2", "reward-uuid-3"]
}
```

#### 参数说明

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| rewardIds | string[] | 是 | 要领取的奖励ID列表，最多50个 |

#### 成功响应

```json
{
  "success": true,
  "data": {
    "success": true,
    "claimedRewards": ["reward-uuid-1", "reward-uuid-2"],
    "failedRewards": [
      {
        "rewardId": "reward-uuid-3",
        "reason": "奖励不存在或已过期或已领取"
      }
    ],
    "totalClaimedAmount": 30.00
  },
  "message": "部分奖励领取成功，成功 2 个，失败 1 个"
}
```

#### 完全成功响应

```json
{
  "success": true,
  "data": {
    "success": true,
    "claimedRewards": ["reward-uuid-1", "reward-uuid-2", "reward-uuid-3"],
    "failedRewards": [],
    "totalClaimedAmount": 45.00
  },
  "message": "奖励领取成功"
}
```

#### 完全失败响应

```json
{
  "success": false,
  "error": "没有可以领取的奖励",
  "data": {
    "success": false,
    "claimedRewards": [],
    "failedRewards": [
      {
        "rewardId": "reward-uuid-1",
        "reason": "奖励不存在或已过期或已领取"
      }
    ],
    "totalClaimedAmount": 0
  }
}
```

## 业务逻辑

### 邀请奖励机制

1. **首充奖励**: 被邀请人首次充值后，邀请人获得充值金额的5%作为奖励
2. **消费返利**: 被邀请人消费时，邀请人获得消费金额的2%作为返利
3. **奖励有效期**: 所有奖励从生成之日起30天内有效
4. **领取方式**: 奖励需要手动领取，支持批量领取（最多50个）

### 防作弊机制

1. **唯一邀请关系**: 每个用户只能被邀请一次
2. **自推荐防护**: 用户不能使用自己的邀请码
3. **邀请码格式验证**: 邀请码必须符合 "LM" + 6位字母数字的格式
4. **过期奖励处理**: 过期未领取的奖励自动标记为过期状态

### 数据统计

- **总邀请人数**: 使用当前用户邀请码绑定的总人数
- **成功邀请人数**: 完成首次充值的被邀请人数
- **总奖励次数**: 累计获得的奖励次数
- **已领取奖励**: 已成功领取的奖励金额
- **未领取奖励**: 当前可领取的奖励金额
- **最后邀请时间**: 最近一次邀请绑定的时间
- **最后奖励时间**: 最近一次获得奖励的时间

## 错误码

| 错误码 | 状态码 | 描述 |
|--------|--------|------|
| UNAUTHORIZED | 401 | 未授权访问 |
| INVALID_INPUT | 400 | 输入参数无效 |
| NOT_FOUND | 404 | 资源不存在 |
| REFERRAL_CODE_GENERATION_FAILED | 400 | 邀请码生成失败 |
| SELF_REFERRAL_DETECTED | 400 | 检测到自推荐行为 |
| REFERRAL_CHECK_FAILED | 400 | 邀请关系检查失败 |

## 性能优化

1. **数据库索引**: 在常用查询字段上创建了索引
2. **分页查询**: 支持分页查询，避免一次性加载大量数据
3. **缓存机制**: 统计数据支持缓存，减少数据库压力
4. **批量操作**: 奖励领取支持批量操作，提高效率

## 监控和日志

1. **操作日志**: 记录所有邀请相关操作的详细日志
2. **错误监控**: 自动记录和监控异常情况
3. **性能追踪**: 记录关键操作的执行时间
4. **安全审计**: 记录可疑的邀请行为

## 注意事项

1. **认证要求**: 所有API都需要有效的JWT访问令牌
2. **频率限制**: 建议在前端实现合理的请求频率限制
3. **数据一致性**: 使用数据库事务确保数据一致性
4. **错误处理**: 前端应妥善处理各种错误情况
5. **用户体验**: 建议添加加载状态和友好的错误提示

---

*文档版本: v1.0*  
*更新时间: 2025-10-31*  
*API版本: v1*