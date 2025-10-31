# 推荐统计API文档

## 概述
获取用户的推荐统计数据和推荐列表信息，支持分页和多种过滤条件。

## API信息
- **URL**: `GET /api/referral/stats`
- **认证方式**: JWT Bearer Token
- **内容类型**: `application/json`

## 认证
### 请求头
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### 获取认证Token
调用 `/api/auth/telegram` 接口获取JWT token。

## 请求参数

### 查询参数
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | integer | 否 | 1 | 页码，从1开始 |
| limit | integer | 否 | 10 | 每页条数，1-100之间 |
| level | string | 否 | - | 推荐级别过滤：1、2、3 |
| active_only | boolean | 否 | false | 是否只显示活跃用户 |

### 请求示例
```bash
# 基础请求
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/referral/stats"

# 分页查询
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/referral/stats?page=1&limit=10"

# 级别过滤
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/referral/stats?level=1"

# 活跃用户过滤
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/referral/stats?active_only=true"

# 组合过滤
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/referral/stats?level=2&active_only=true&page=1&limit=20"
```

## 响应格式

### 成功响应 (200 OK)
```json
{
  "success": true,
  "data": {
    "user_info": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "telegram_id": "123456789",
      "first_name": "张三",
      "referral_code": "USER1234_AB12CD"
    },
    "referral_stats": {
      "referral_code": "USER1234_AB12CD",
      "total_referrals": 25,
      "level_breakdown": {
        "level1": 15,
        "level2": 7,
        "level3": 3
      },
      "rewards": {
        "total_rewards": 1250.5,
        "weekly_rewards": 85.2,
        "monthly_rewards": 320.8
      },
      "weekly_activity": 3
    },
    "referral_list": {
      "users": [
        {
          "user_id": "550e8400-e29b-41d4-a716-446655440001",
          "telegram_id": "987654321",
          "first_name": "李四",
          "username": "lisi_user",
          "referral_level": 1,
          "joined_at": "2025-10-15T10:30:00Z",
          "total_spent": 299.99,
          "contribution_rewards": 15.5,
          "is_active": true,
          "last_activity": "2025-10-30T15:22:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 25,
        "total_pages": 3,
        "has_next": true,
        "has_prev": false
      },
      "summary": {
        "total_users": 25,
        "active_users": 18,
        "active_rate": 72
      }
    },
    "filters": {
      "level_filter": null,
      "active_only": false
    }
  }
}
```

### 字段说明

#### user_info
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | string | 用户UUID |
| telegram_id | string | Telegram用户ID |
| first_name | string | 用户名 |
| referral_code | string | 用户推荐码 |

#### referral_stats
| 字段 | 类型 | 说明 |
|------|------|------|
| referral_code | string | 用户的推荐码 |
| total_referrals | integer | 总推荐用户数 |
| level_breakdown | object | 推荐级别分布 |
| level_breakdown.level1 | integer | 1级推荐数 |
| level_breakdown.level2 | integer | 2级推荐数 |
| level_breakdown.level3 | integer | 3级推荐数 |
| rewards | object | 奖励统计 |
| rewards.total_rewards | number | 总奖励金额 |
| rewards.weekly_rewards | number | 本周奖励金额 |
| rewards.monthly_rewards | number | 本月奖励金额 |
| weekly_activity | integer | 本周新增推荐数 |

#### referral_list.users
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | string | 被推荐用户UUID |
| telegram_id | string | 被推荐用户Telegram ID |
| first_name | string | 被推荐用户姓名 |
| username | string | 被推荐用户用户名（可选） |
| referral_level | integer | 推荐级别（1/2/3） |
| joined_at | string | 加入时间（ISO 8601格式） |
| total_spent | number | 总消费金额 |
| contribution_rewards | number | 贡献的奖励金额 |
| is_active | boolean | 是否活跃（最近7天有活动） |
| last_activity | string | 最后活动时间（ISO 8601格式） |

#### referral_list.pagination
| 字段 | 类型 | 说明 |
|------|------|------|
| page | integer | 当前页码 |
| limit | integer | 每页条数 |
| total | integer | 总记录数 |
| total_pages | integer | 总页数 |
| has_next | boolean | 是否有下一页 |
| has_prev | boolean | 是否有上一页 |

#### referral_list.summary
| 字段 | 类型 | 说明 |
|------|------|------|
| total_users | integer | 总用户数 |
| active_users | integer | 活跃用户数 |
| active_rate | integer | 活跃率（百分比） |

## 错误响应

### 401 Unauthorized (未授权)
```json
{
  "success": false,
  "error": "未提供认证token",
  "code": "UNAUTHORIZED"
}
```

### 400 Bad Request (参数错误)
```json
{
  "success": false,
  "error": "页码必须是大于0的整数",
  "code": "INVALID_INPUT"
}
```

### 404 Not Found (用户不存在)
```json
{
  "success": false,
  "error": "用户不存在",
  "code": "NOT_FOUND"
}
```

### 500 Internal Server Error (服务器错误)
```json
{
  "success": false,
  "error": "获取推荐统计失败",
  "code": "INTERNAL_ERROR"
}
```

## 活跃度定义
用户活跃状态基于最近7天内的活动检测，包括：
- 参与抽奖活动
- 创建订单
- 账户充值/交易

如果用户在最近7天内有任何上述活动，则被认为是活跃用户。

## 性能说明
- **推荐统计数据**: 使用预计算的数据库函数，响应时间 < 100ms
- **推荐列表**: 支持分页，默认每页10条记录
- **活跃度检查**: 智能缓存，重复查询响应更快
- **并发支持**: 支持多用户并发访问

## 使用建议

### 1. 分页查询
对于推荐用户较多的场景，建议使用分页：
```javascript
// 加载第一页
const page1 = await fetch('/api/referral/stats?page=1&limit=20');

// 加载下一页
const page2 = await fetch('/api/referral/stats?page=2&limit=20');
```

### 2. 级别过滤
按推荐级别查看特定层级的用户：
```javascript
// 只查看1级推荐用户
const level1Users = await fetch('/api/referral/stats?level=1');

// 只查看2级推荐用户
const level2Users = await fetch('/api/referral/stats?level=2');
```

### 3. 活跃用户监控
监控活跃推荐用户：
```javascript
// 只显示活跃用户
const activeUsers = await fetch('/api/referral/stats?active_only=true');

// 查看活跃率
const stats = await fetch('/api/referral/stats');
const activeRate = stats.data.referral_list.summary.active_rate;
```

## 常见问题

### Q: 如何获取推荐码？
A: 每个用户都有唯一的推荐码，在 `user_info.referral_code` 字段中返回。

### Q: 推荐级别如何定义？
A: 1级推荐：直接推荐的用户；2级推荐：用户推荐的用户的推荐；3级推荐：2级用户的推荐。

### Q: 奖励金额是如何计算的？
A: 基于 `reward_transactions` 表中的奖励记录统计，包括注册奖励、推荐奖励等。

### Q: 如何判断用户是否活跃？
A: 基于最近7天内的活动（抽奖、订单、交易），有任一活动即认为活跃。

### Q: API有频率限制吗？
A: 没有严格的频率限制，但建议合理使用，避免过于频繁的请求。

## 更新日志

### v1.0.0 (2025-10-31)
- 初始版本发布
- 支持基础推荐统计查询
- 支持分页和过滤功能
- 完整的错误处理和验证

## 支持
如有问题或需要技术支持，请联系开发团队。