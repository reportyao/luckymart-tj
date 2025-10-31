# 新手任务系统API文档

## 概述

新手任务系统是一个激励新用户完成关键操作的奖励机制，通过完成指定任务获得幸运币奖励，提高用户活跃度和参与度。

## 任务类型

系统提供三种新手任务：

### 1. 注册任务 (register)
- **描述**: 完成账号注册
- **奖励**: 0.5 幸运币 (LC)
- **完成条件**: 用户在注册后7天内
- **有效期**: 注册后7天内

### 2. 首次充值任务 (first_recharge)
- **描述**: 完成首次充值操作
- **奖励**: 1 幸运币 (LC)
- **完成条件**: 存在已完成的充值订单
- **有效期**: 注册后7天内

### 3. 首次抽奖任务 (first_lottery)
- **描述**: 参与首次抽奖活动
- **奖励**: 1 幸运币 (LC)
- **完成条件**: 参与至少一次抽奖
- **有效期**: 注册后7天内

## API端点

### 1. 获取任务列表和用户进度

**端点**: `GET /api/tasks/list`

**描述**: 获取当前用户的所有任务列表，包括任务状态、进度和奖励信息。

**认证**: 需要有效的访问令牌

**响应示例**:
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "tasks": [
      {
        "taskId": "task-uuid",
        "taskType": "register",
        "name": "注册奖励",
        "description": "完成账号注册即可获得0.5幸运币奖励",
        "reward": {
          "amount": 0.5,
          "type": "lucky_coins",
          "currency": "LC",
          "formatted": "0.5 LC"
        },
        "status": "completed",
        "completedAt": "2025-10-31T16:12:36.000Z",
        "rewardClaimed": false,
        "progressData": {
          "checked_at": "2025-10-31T16:12:36.000Z"
        },
        "canClaim": true,
        "isExpired": false
      }
    ],
    "stats": {
      "total": 3,
      "pending": 1,
      "completed": 1,
      "rewarded": 1,
      "completionRate": 33,
      "totalRewardClaimed": 0.5,
      "totalPossibleReward": 2.5
    },
    "lastUpdated": "2025-10-31T16:12:36.000Z",
    "version": "1.0"
  },
  "message": "任务列表获取成功"
}
```

**错误响应**:
- `401 Unauthorized`: 未提供有效认证令牌
- `404 Not Found`: 用户不存在
- `500 Internal Server Error`: 服务器内部错误

---

### 2. 领取任务奖励

**端点**: `POST /api/tasks/claim`

**描述**: 领取已完成任务的奖励幸运币。

**认证**: 需要有效的访问令牌

**请求体**:
```json
{
  "taskType": "register"
}
```

**参数说明**:
- `taskType` (必需): 任务类型，可选值：`register`、`first_recharge`、`first_lottery`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "claim": {
      "taskType": "register",
      "taskName": "注册奖励",
      "taskDescription": "完成账号注册即可获得0.5幸运币奖励",
      "reward": {
        "amount": 0.5,
        "type": "lucky_coins",
        "currency": "LC",
        "formatted": "0.5 LC"
      },
      "claimedAt": "2025-10-31T16:12:36.000Z"
    },
    "user": {
      "balance": 100.00,
      "luckyCoins": 10.5
    },
    "rateLimit": {
      "remaining": 2,
      "resetTime": 1729348356000
    }
  },
  "message": "奖励领取成功"
}
```

**错误响应**:
- `400 Bad Request`: 
  - 任务类型为空或无效
  - 任务尚未完成
- `401 Unauthorized`: 未提供有效认证令牌
- `404 Not Found`: 用户或任务不存在
- `409 Conflict`: 奖励已领取
- `429 Too Many Requests`: 领取过于频繁（每分钟最多3次）
- `500 Internal Server Error`: 服务器内部错误

---

### 3. 查询用户任务完成情况

**端点**: `GET /api/tasks/progress`

**描述**: 查询用户的详细任务进度信息，支持状态和任务类型过滤。

**认证**: 需要有效的访问令牌

**查询参数**:
- `status` (可选): 任务状态过滤，可选值：`pending`、`completed`、`rewarded`
- `taskType` (可选): 任务类型过滤，可选值：`register`、`first_recharge`、`first_lottery`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "tasks": [
      {
        "taskId": "task-uuid",
        "taskType": "register",
        "name": "注册奖励",
        "description": "完成账号注册即可获得0.5幸运币奖励",
        "reward": {
          "amount": 0.5,
          "type": "lucky_coins",
          "currency": "LC",
          "formatted": "0.5 LC"
        },
        "status": "completed",
        "completedAt": "2025-10-31T16:12:36.000Z",
        "rewardClaimed": false,
        "progressData": {
          "checked_at": "2025-10-31T16:12:36.000Z",
          "auto_updated": true
        },
        "canClaim": true,
        "progress": 90
      }
    ],
    "stats": {
      "total": 3,
      "pending": 1,
      "completed": 1,
      "rewarded": 1,
      "completionRate": 33,
      "totalRewardClaimed": 0.5,
      "totalPossibleReward": 2.5,
      "availableToClaim": 1
    },
    "timeInfo": {
      "userCreatedAt": "2025-10-31T16:12:36.000Z",
      "isNewUser": true,
      "daysSinceRegistration": 0,
      "taskDeadline": "2025-11-07T16:12:36.000Z"
    },
    "filters": {
      "status": null,
      "taskType": null
    },
    "lastUpdated": "2025-10-31T16:12:36.000Z",
    "version": "1.0"
  },
  "message": "任务进度查询成功"
}
```

**错误响应**:
- `400 Bad Request`: 状态或任务类型过滤参数无效
- `401 Unauthorized`: 未提供有效认证令牌
- `404 Not Found`: 用户不存在
- `500 Internal Server Error`: 服务器内部错误

---

### 4. 检查任务完成状态

**端点**: `POST /api/tasks/check-complete`

**描述**: 手动触发任务完成状态检查，支持单个任务或全部任务检查。

**认证**: 需要有效的访问令牌

**请求体**:
```json
{
  "taskType": "all"
}
```

**参数说明**:
- `taskType` (必需): 任务类型，可选值：`register`、`first_recharge`、`first_lottery`、`all`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "checkType": "all",
    "tasks": [
      {
        "taskId": "task-uuid",
        "taskType": "register",
        "name": "注册奖励",
        "description": "完成账号注册即可获得0.5幸运币奖励",
        "reward": {
          "amount": 0.5,
          "type": "lucky_coins",
          "currency": "LC",
          "formatted": "0.5 LC"
        },
        "status": "completed",
        "completedAt": "2025-10-31T16:12:36.000Z",
        "rewardClaimed": false,
        "progressData": {
          "checked_at": "2025-10-31T16:12:36.000Z",
          "manual_check": true
        },
        "canClaim": true,
        "wasUpdated": false
      }
    ],
    "checkResults": [
      {
        "taskType": "register",
        "shouldComplete": true,
        "wasUpdated": false,
        "reason": "用户注册时间在有效期内",
        "completed": true,
        "daysSinceRegistration": 0,
        "timeRemaining": 7
      }
    ],
    "stats": {
      "total": 3,
      "pending": 1,
      "completed": 1,
      "rewarded": 1,
      "updated": 0,
      "completionRate": 33,
      "totalRewardClaimed": 0.5,
      "totalPossibleReward": 2.5
    },
    "lastChecked": "2025-10-31T16:12:36.000Z",
    "version": "1.0"
  },
  "message": "任务完成状态检查完成"
}
```

**错误响应**:
- `400 Bad Request`: 任务类型为空或无效
- `401 Unauthorized`: 未提供有效认证令牌
- `404 Not Found`: 用户不存在
- `500 Internal Server Error`: 服务器内部错误

## 业务逻辑

### 任务自动检测

系统支持任务完成状态的自动检测和更新：

1. **注册任务**: 系统会自动检查用户在注册后7天内
2. **首次充值任务**: 当订单状态更新为已完成且为充值订单时自动检测
3. **首次抽奖任务**: 当有新的抽奖参与记录时自动检测

### 防止重复领取

系统通过以下机制防止重复领取奖励：

1. **数据库唯一约束**: 每个用户每个任务只能有一条奖励记录
2. **状态验证**: 领取前检查任务状态是否为已完成且未领取
3. **速率限制**: 每分钟最多3次领取尝试

### 多语言支持

任务名称和描述支持多语言显示：

- `zh-CN`: 简体中文
- `en-US`: 英语
- `ru-RU`: 俄语
- `tg-TJ`: 塔吉克语

系统会根据用户的语言偏好返回相应的语言内容。

## 错误码说明

| 错误码 | 描述 | HTTP状态码 |
|--------|------|------------|
| `TASK_TYPE_REQUIRED` | 任务类型参数缺失 | 400 |
| `INVALID_TASK_TYPE` | 任务类型无效 | 400 |
| `INVALID_STATUS_FILTER` | 状态过滤参数无效 | 400 |
| `INVALID_TASK_TYPE_FILTER` | 任务类型过滤参数无效 | 400 |
| `TASK_NOT_FOUND` | 任务不存在 | 404 |
| `TASK_NOT_COMPLETED` | 任务尚未完成 | 400 |
| `REWARD_ALREADY_CLAIMED` | 奖励已领取 | 409 |
| `RATE_LIMIT_EXCEEDED` | 领取过于频繁 | 429 |
| `UNAUTHORIZED` | 未授权访问 | 401 |
| `INTERNAL_ERROR` | 内部服务器错误 | 500 |

## 监控和日志

系统提供完整的监控和日志记录：

### 日志级别
- **INFO**: 正常操作日志
- **WARN**: 警告信息（如频率限制）
- **ERROR**: 错误信息

### 关键指标
- 任务完成率
- 奖励领取成功率
- API响应时间
- 错误率统计

### 性能监控
- 数据库查询时间
- API端点响应时间
- 任务自动检测执行时间

## 安全考虑

### 认证和授权
- 所有端点都需要有效的JWT访问令牌
- 令牌过期时间为15分钟
- 支持令牌刷新机制

### 数据验证
- 输入参数严格验证
- SQL注入防护
- XSS攻击防护

### 速率限制
- 奖励领取端点：每分钟最多3次
- 基于用户ID和任务类型组合限制

### 错误处理
- 统一错误响应格式
- 敏感信息不暴露给客户端
- 完整的错误日志记录

## 部署说明

### 数据库迁移
1. 运行迁移文件: `20251031_update_task_rewards_lucky_coins.sql`
2. 确保触发器正常工作
3. 验证任务进度视图

### 环境变量
确保以下环境变量已配置：
- `JWT_SECRET`: JWT签名密钥
- `DATABASE_URL`: 数据库连接字符串
- `TELEGRAM_BOT_TOKEN`: Telegram Bot Token

### 依赖服务
- PostgreSQL数据库
- Redis缓存（可选，用于性能优化）
- 日志服务

## 最佳实践

### 客户端使用
1. 定期调用任务列表接口获取最新状态
2. 在完成相关操作后调用检查接口更新状态
3. 及时领取可用的奖励
4. 处理网络错误和重试机制

### 错误处理
1. 根据HTTP状态码进行相应处理
2. 用户友好的错误提示
3. 网络异常时的重试机制
4. 离线状态的缓存策略

### 性能优化
1. 使用适当的缓存策略
2. 避免频繁的API调用
3. 批量操作优化
4. 数据库查询优化

## 更新日志

### v1.0 (2025-10-31)
- 初始版本发布
- 支持三种新手任务类型
- 提供完整的CRUD操作
- 支持多语言
- 集成自动检测机制
- 完整的监控和日志系统