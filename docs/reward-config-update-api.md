# 奖励配置更新API文档

## 概述

`PUT /api/admin/reward-config/{config_key}` 是用于管理员更新奖励配置的API接口。该接口支持更新奖励金额和配置激活状态，并提供完整的验证、审计和缓存管理功能。

## 端点信息

- **URL**: `/api/admin/reward-config/{config_key}`
- **方法**: `PUT`
- **认证**: 需要管理员权限（Bearer Token）
- **权限**: `reward-config:write`

## 请求参数

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| config_key | string | 是 | 奖励配置的键名，如 `register_referrer_l1` |

### 请求体

| 字段 | 类型 | 必填 | 说明 | 验证规则 |
|------|------|------|------|----------|
| reward_amount | number/string | 是 | 奖励金额 | 非负数，支持小数点后1位，最大值1000000 |
| is_active | boolean | 是 | 是否启用配置 | 布尔值 |
| updated_by | string | 是 | 更新人用户名 | 1-100个字符 |

### 示例请求

```json
{
  "reward_amount": 10.5,
  "is_active": true,
  "updated_by": "admin_user"
}
```

## 响应格式

### 成功响应 (200 OK)

```json
{
  "success": true,
  "data": {
    "config_key": "register_referrer_l1",
    "config_name": "注册推荐者1级奖励",
    "config_description": "推荐者成功邀请用户注册后获得的奖励",
    "reward_amount": 10.5,
    "is_active": true,
    "updated_at": "2025-10-31T02:07:54.000Z",
    "updated_by": "admin_user"
  },
  "message": "配置更新成功"
}
```

### 错误响应

#### 400 Bad Request - 参数验证失败
```json
{
  "success": false,
  "error": "奖励金额不能为负数",
  "code": "VALIDATION_ERROR"
}
```

#### 404 Not Found - 配置键不存在
```json
{
  "success": false,
  "error": "配置键不存在: test_key",
  "code": "CONFIG_KEY_NOT_FOUND",
  "availableKeys": [
    "register_referrer_l1",
    "register_referee",
    "first_play_referrer_l1"
  ]
}
```

#### 403 Forbidden - 权限不足
```json
{
  "success": false,
  "error": "管理员权限验证失败",
  "code": "ADMIN_UNAUTHORIZED"
}
```

#### 500 Internal Server Error - 服务器错误
```json
{
  "success": false,
  "error": "服务器内部错误",
  "code": "INTERNAL_SERVER_ERROR"
}
```

## 功能特性

### 1. 参数验证
- ✅ 奖励金额必须为非负数
- ✅ 支持小数点后1位（如 10.5）
- ✅ 最大值限制（1,000,000）
- ✅ 必填字段检查
- ✅ 数据类型验证

### 2. 管理员认证
- ✅ JWT Token验证
- ✅ 权限检查（reward-config:write）
- ✅ 角色验证（super_admin拥有所有权限）

### 3. 配置验证
- ✅ 检查配置键是否存在
- ✅ 返回可用配置键列表（当配置键不存在时）
- ✅ 支持激活/禁用配置

### 4. 审计日志
- ✅ 记录到 `reward_config_history` 表
- ✅ 包含IP地址和用户代理
- ✅ 记录旧值和新值
- ✅ 记录更新人信息

### 5. 缓存管理
- ✅ 清除Redis缓存（特定配置和全量缓存）
- ✅ 清除内存缓存
- ✅ 自动缓存失效

### 6. 错误处理
- ✅ 完整的参数验证错误信息
- ✅ 数据库异常处理
- ✅ JSON解析异常处理
- ✅ 详细的日志记录

## 可用配置键

| config_key | 说明 | 当前默认奖励金额 |
|------------|------|------------------|
| `register_referrer_l1` | 注册推荐者1级奖励 | 5.0 |
| `register_referee` | 注册被推荐者奖励 | 2.0 |
| `first_play_referrer_l1` | 首次抽奖推荐者1级奖励 | 5.0 |
| `first_play_referee` | 首次抽奖被推荐者奖励 | 3.0 |
| `first_play_referrer_l2` | 首次抽奖推荐者2级奖励 | 5.0 |
| `first_play_referrer_l3` | 首次抽奖推荐者3级奖励 | 2.0 |
| `first_purchase_referrer_l1` | 首次充值推荐者1级奖励 | 10.0 |
| `rebate_rate_l1` | 返利比例1级(%) | 1.0 |
| `rebate_rate_l2` | 返利比例2级(%) | 0.5 |
| `rebate_rate_l3` | 返利比例3级(%) | 0.2 |
| `rebate_min_amount` | 返利最小值 | 0.1 |

## 使用示例

### cURL示例

```bash
# 更新注册推荐者奖励
curl -X PUT http://localhost:3000/api/admin/reward-config/register_referrer_l1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "reward_amount": 12.0,
    "is_active": true,
    "updated_by": "admin_user"
  }'

# 禁用返利比例
curl -X PUT http://localhost:3000/api/admin/reward-config/rebate_rate_l1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "reward_amount": 2.0,
    "is_active": false,
    "updated_by": "admin_user"
  }'
```

### JavaScript示例

```javascript
async function updateRewardConfig(configKey, rewardAmount, isActive, updatedBy) {
  const response = await fetch(`/api/admin/reward-config/${configKey}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
    },
    body: JSON.stringify({
      reward_amount: rewardAmount,
      is_active: isActive,
      updated_by: updatedBy
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('更新成功:', result.data);
  } else {
    console.error('更新失败:', result.error);
  }
}

// 使用示例
updateRewardConfig('register_referrer_l1', 15.0, true, 'admin_user');
```

## 验证规则详解

### 奖励金额验证
- **类型**: 数字或数字字符串
- **最小值**: 0
- **最大值**: 1,000,000
- **小数位数**: 最多1位（如 10.5 有效，10.123 无效）
- **特殊值**: 0.0 有效

### 更新人验证
- **类型**: 非空字符串
- **长度**: 1-100个字符
- **用途**: 审计记录和日志追踪

### 配置键验证
- **存在性**: 必须存在于数据库中
- **有效性**: 必须是有效的配置键

## 缓存策略

### 缓存键
- 单配置缓存: `reward:config:single:{config_key}`
- 全量配置缓存: `reward:config:all`

### 缓存失效
- 更新成功后自动清除相关缓存
- 支持内存缓存和Redis缓存
- 缓存失效不影响业务逻辑

## 安全考虑

1. **认证**: 所有请求需要有效的管理员JWT Token
2. **授权**: 需要 `reward-config:write` 权限
3. **输入验证**: 严格的参数类型和范围验证
4. **审计**: 完整的操作审计日志
5. **错误处理**: 不泄露敏感系统信息

## 性能优化

1. **缓存**: 减少数据库查询
2. **事务**: 确保数据一致性
3. **批量操作**: 缓存批量清除
4. **错误处理**: 快速失败机制

## 常见问题

### Q: 如何获取有效的管理员token？
A: 通过 `POST /api/admin/login` 接口，使用正确的管理员用户名和密码登录获取。

### Q: 配置键不存在时如何处理？
A: API会返回404错误，并提供可用配置键列表供参考。

### Q: 能否只更新奖励金额或只更新激活状态？
A: 是的，可以单独更新其中一个字段，另一个字段保持不变。

### Q: 更新失败时如何回滚？
A: API使用数据库事务，确保数据一致性。失败时会自动回滚。

### Q: 如何查看更新历史？
A: 可以通过 `GET /api/admin/reward-config/history` 或直接查询 `reward_config_history` 表。

## 错误代码对照

| 错误代码 | HTTP状态 | 说明 |
|----------|----------|------|
| `INVALID_CONFIG_KEY` | 400 | 配置键名无效或为空 |
| `MISSING_REQUIRED_FIELDS` | 400 | 缺少必填字段 |
| `VALIDATION_ERROR` | 400 | 参数验证失败 |
| `CONFIG_KEY_NOT_FOUND` | 404 | 配置键不存在 |
| `ADMIN_UNAUTHORIZED` | 403 | 管理员权限验证失败 |
| `INSUFFICIENT_PERMISSIONS` | 403 | 权限不足 |
| `UPDATE_FAILED` | 500 | 更新配置失败 |
| `INTERNAL_SERVER_ERROR` | 500 | 服务器内部错误 |

---

**注意**: 本API仅供管理员使用，需要相应的权限才能访问。所有操作都会被记录到审计日志中。
