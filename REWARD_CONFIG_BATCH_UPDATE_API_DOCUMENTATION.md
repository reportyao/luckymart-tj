# 奖励配置批量更新API测试文档

## API信息

- **端点**: `POST /api/admin/reward-config/batch-update`
- **认证**: 需要管理员权限 (`Authorization: Bearer <token>`)
- **Content-Type**: `application/json`

## 功能概述

该API允许管理员批量更新奖励配置，支持：
- 批量更新多个配置项
- 事务保证数据一致性
- 详细的更新结果反馈
- 缓存自动清理
- 完整的错误处理

## 请求格式

### 请求体结构

```json
{
  "updates": [
    {
      "config_key": "string",
      "reward_amount": number
    }
  ],
  "updated_by": "string"
}
```

### 参数说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| updates | Array | 是 | 更新的配置项数组 |
| updates[].config_key | string | 是 | 配置键名，长度1-50字符 |
| updates[].reward_amount | number | 是 | 奖励金额，非负数，最多1位小数 |
| updated_by | string | 是 | 更新人管理员用户名 |

### 约束限制

- 单次最多支持50项更新
- 奖励金额范围：0 - 1,000,000
- 小数位数：最多1位
- 不允许重复的config_key

## 响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0,
      "success_rate": 100,
      "processing_time_ms": 150
    },
    "updates": [
      {
        "config_key": "key1",
        "success": true,
        "old_value": 10.0,
        "new_value": 15.0
      },
      {
        "config_key": "key2", 
        "success": true,
        "old_value": 20.0,
        "new_value": 25.0
      }
    ],
    "batch_info": {
      "updated_by": "admin_user",
      "updated_at": "2025-10-31T02:07:54.000Z",
      "client_ip": "127.0.0.1",
      "user_agent": "Mozilla/5.0..."
    }
  },
  "message": "批量更新完成：成功2项，失败0项"
}
```

### 错误响应

```json
{
  "success": false,
  "error": "参数验证失败的详细信息",
  "code": "VALIDATION_ERROR"
}
```

## 测试用例

### 1. 成功批量更新

```bash
curl -X POST http://localhost:3000/api/admin/reward-config/batch-update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "updates": [
      {"config_key": "referral_level_1", "reward_amount": 10.5},
      {"config_key": "referral_level_2", "reward_amount": 20.0}
    ],
    "updated_by": "admin"
  }'
```

### 2. 部分失败（配置不存在）

```bash
curl -X POST http://localhost:3000/api/admin/reward-config/batch-update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "updates": [
      {"config_key": "existing_key", "reward_amount": 15.0},
      {"config_key": "nonexistent_key", "reward_amount": 25.0}
    ],
    "updated_by": "admin"
  }'
```

### 3. 参数验证错误

```bash
curl -X POST http://localhost:3000/api/admin/reward-config/batch-update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "updates": [
      {"config_key": "test_key", "reward_amount": -10}
    ],
    "updated_by": "admin"
  }'
```

### 4. 超出批量限制

```bash
# 创建51个更新项的请求
curl -X POST http://localhost:3000/api/admin/reward-config/batch-update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "updates": [...51个更新项...],
    "updated_by": "admin"
  }'
```

## 测试场景

### 单元测试运行

```bash
cd luckymart-tj
npm test -- reward-config-batch-update.test.ts
```

### 集成测试

```bash
# 使用提供的测试脚本
./test_reward_config_batch_update.sh

# 或手动测试
bash test_reward_config_batch_update.sh
```

## 预期行为

### 成功场景
- ✅ 返回200状态码
- ✅ summary显示正确的统计信息
- ✅ 每项更新都有详细结果
- ✅ 自动清理Redis和内存缓存
- ✅ 记录操作历史到reward_config_history表

### 验证场景
- ❌ 缺少必填字段 → 400错误
- ❌ 奖励金额为负数 → 400错误
- ❌ 超出小数位数限制 → 400错误
- ❌ 超出批量大小限制 → 400错误
- ❌ config_key不存在 → 部分失败处理

### 认证场景
- ❌ 无效token → 403错误
- ❌ 权限不足 → 403错误

## 错误代码

| 错误代码 | 说明 | HTTP状态码 |
|----------|------|------------|
| MISSING_REQUIRED_FIELDS | 缺少必填字段 | 400 |
| VALIDATION_ERROR | 参数验证失败 | 400 |
| ADMIN_UNAUTHORIZED | 管理员权限验证失败 | 403 |
| INSUFFICIENT_PERMISSIONS | 权限不足 | 403 |
| INTERNAL_SERVER_ERROR | 服务器内部错误 | 500 |

## 性能指标

- 单次批量更新建议不超过50项
- 处理时间通常在100-500ms之间
- 支持并发请求
- 自动事务回滚

## 监控建议

- 监控批量更新频率和成功率
- 跟踪处理时间指标
- 关注错误率和失败原因
- 监控缓存清理状态

## 注意事项

1. **管理员权限**: 需要reward-config资源的write权限
2. **事务安全**: 使用数据库事务保证原子性
3. **缓存一致性**: 更新后自动清理相关缓存
4. **历史记录**: 所有变更都会记录到历史表
5. **审计日志**: 记录操作人、IP地址、用户代理等信息