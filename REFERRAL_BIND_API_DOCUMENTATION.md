# 推荐绑定API文档

## 概述

`POST /api/referral/bind` API实现了完整的推荐关系绑定功能，包含防作弊检查、奖励发放、交易记录和Telegram通知等核心功能。

## API详情

### 请求信息

- **URL**: `/api/referral/bind`
- **方法**: `POST`
- **Content-Type**: `application/json`

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_telegram_id | string | ✅ | 被推荐用户的Telegram ID |
| referral_code | string | ✅ | 推荐人的推荐码 |
| device_fingerprint | string | ✅ | 设备指纹 |
| ip_address | string | ✅ | IP地址 |

### 请求示例

```javascript
// 正常请求
const response = await fetch('/api/referral/bind', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_telegram_id: '123456789',
    referral_code: 'USER1234_AB12CD',
    device_fingerprint: 'device_fp_abc123',
    ip_address: '192.168.1.100'
  })
});

const result = await response.json();
```

### 成功响应

#### 状态码: 200 OK

```json
{
  "success": true,
  "data": {
    "success": true,
    "bind_info": {
      "referee_user_id": "uuid-referee",
      "referrer_user_id": "uuid-referrer",
      "relationships_count": 1,
      "referral_levels": [
        {
          "level": 1,
          "amount": 5.0
        }
      ]
    },
    "rewards": {
      "referee_rewards": [
        {
          "type": "referral_register",
          "amount": 2.0,
          "transaction_id": 12345
        }
      ],
      "referrer_rewards": [
        {
          "level": 1,
          "type": "referral_register",
          "amount": 5.0,
          "transaction_id": 12346
        }
      ]
    },
    "message": "推荐关系绑定成功，奖励已发放"
  },
  "timestamp": "2025-10-31T01:53:35.000Z"
}
```

### 错误响应

#### 状态码: 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "缺少必需参数：device_fingerprint"
  },
  "timestamp": "2025-10-31T01:53:35.000Z"
}
```

#### 状态码: 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "用户不存在，请先完成注册"
  },
  "timestamp": "2025-10-31T01:53:35.000Z"
}
```

#### 状态码: 409 Conflict
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "该用户已有推荐人"
  },
  "timestamp": "2025-10-31T01:53:35.000Z"
}
```

## 核心功能

### 1. 防作弊检查系统

#### 设备指纹验证
- 检查设备是否在黑名单中
- 验证设备是否被其他用户使用
- 监控同一IP的设备数量
- 记录可疑设备行为

#### 自我推荐拦截
- 防止用户自己推荐自己
- 基于Telegram ID进行验证

#### 循环推荐拦截
- 检测循环推荐关系
- 最多检查10级推荐链
- 防止恶意循环操作

### 2. 推荐关系创建

- 支持最多3级推荐关系
- 自动创建推荐关系记录
- 防止重复创建
- 优化数据库查询

### 3. 奖励系统

#### 奖励配置
- 动态加载奖励配置
- 支持配置缓存和刷新
- 配置历史记录追踪

#### 奖励发放
- **被推荐人奖励**: 注册奖励 2.0币
- **推荐人奖励**: 
  - 1级推荐: 5.0币
  - 2级推荐: 3.0币  
  - 3级推荐: 1.0币

#### 奖励发放流程
1. 加载最新奖励配置
2. 创建奖励交易记录
3. 更新用户余额
4. 记录配置快照
5. 包含交易ID和详情

### 4. 数据库记录

#### 交易记录 (reward_transactions)
```sql
CREATE TABLE reward_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    reward_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 1) NOT NULL,
    source_user_id UUID,
    referral_level INT,
    config_snapshot JSONB,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 推荐关系 (referral_relationships)
```sql
CREATE TABLE referral_relationships (
    id BIGSERIAL PRIMARY KEY,
    referee_user_id UUID NOT NULL,
    referrer_user_id UUID NOT NULL,
    referral_level INT NOT NULL CHECK (referral_level IN (1, 2, 3)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 设备指纹 (device_fingerprints)
```sql
CREATE TABLE device_fingerprints (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    user_id UUID NOT NULL,
    fingerprint_data JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Telegram通知

- 自动发送推荐成功通知
- 包含奖励详情和级别信息
- 支持Markdown格式
- 错误容错机制

#### 通知消息格式
```
🎉 您成功推荐了[用户名]！

📊 获得奖励：[总金额]币
📈 奖励详情：[级别奖励详情]
💰 余额已更新
```

### 6. 监控和日志

#### 请求追踪
- Request ID和Trace ID
- 性能监控
- 错误日志记录
- 操作审计日志

#### 监控指标
- `referral_bind_success_total`: 推荐绑定成功总数
- `referral_bind_error_total`: 推荐绑定错误总数
- API响应时间监控

## 错误处理

### 验证错误
- 缺少必需参数
- 参数格式错误
- 参数值超出范围

### 业务逻辑错误
- 用户不存在
- 推荐码无效
- 用户已有推荐人
- 自我推荐尝试
- 循环推荐检测
- 设备异常

### 系统错误
- 数据库连接失败
- 配置加载失败
- 奖励发放失败

## 性能优化

### 缓存策略
- 奖励配置缓存
- 数据库查询优化
- 减少重复计算

### 并发控制
- 数据库事务保证一致性
- 防止重复操作
- 锁定机制

### 监控和告警
- 实时性能监控
- 错误率监控
- 自动告警

## 测试覆盖

### 单元测试
- 参数验证测试
- 防作弊检查测试
- 奖励计算测试
- 错误处理测试

### 集成测试
- 完整流程测试
- 数据库操作测试
- 第三方服务测试

### 压力测试
- 并发请求测试
- 大流量场景测试
- 性能基准测试

## 部署要求

### 环境依赖
- Node.js 16+
- PostgreSQL 12+
- Redis (可选，用于缓存)

### 环境变量
```bash
# 必需
DATABASE_URL=postgresql://...

# 可选
TELEGRAM_BOT_TOKEN=...
REDIS_URL=...
```

### 数据库表
确保以下表已创建：
- `users`
- `referral_relationships`
- `reward_transactions`
- `reward_config`
- `device_fingerprints`
- `device_blacklist`
- `fraud_detection_logs`

### 数据库索引
确保关键索引已创建：
- `idx_users_referral_code`
- `idx_referral_referrer`
- `idx_device_fingerprints_device_id`
- `idx_reward_user_time`

## 使用示例

### 1. 基本使用
```javascript
async function bindReferral(telegramId, referralCode, deviceFingerprint, ipAddress) {
  try {
    const response = await fetch('/api/referral/bind', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_telegram_id: telegramId,
        referral_code: referralCode,
        device_fingerprint: deviceFingerprint,
        ip_address: ipAddress
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('绑定成功:', result.data.message);
      console.log('获得奖励:', result.data.rewards);
    } else {
      console.error('绑定失败:', result.error.message);
    }
  } catch (error) {
    console.error('网络错误:', error);
  }
}
```

### 2. 带重试的调用
```javascript
async function bindReferralWithRetry(telegramId, referralCode, deviceFingerprint, ipAddress, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/referral/bind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Retry-Attempt': attempt.toString()
        },
        body: JSON.stringify({
          user_telegram_id: telegramId,
          referral_code: referralCode,
          device_fingerprint: deviceFingerprint,
          ip_address: ipAddress
        })
      });

      if (response.ok) {
        return await response.json();
      }
      
      if (response.status >= 500 && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      return await response.json();
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

## 最佳实践

### 1. 错误处理
- 总是检查响应状态
- 处理网络错误
- 实现重试机制
- 记录详细日志

### 2. 性能优化
- 实现本地缓存
- 避免重复请求
- 合理使用设备指纹
- 监控API性能

### 3. 安全考虑
- 验证输入参数
- 防止恶意推荐
- 保护敏感信息
- 实施访问控制

### 4. 监控和维护
- 监控推荐成功率
- 跟踪奖励发放
- 定期清理过期数据
- 更新防作弊规则

## 故障排除

### 常见问题

1. **参数验证失败**
   - 检查所有必需参数
   - 验证参数格式
   - 确保数据类型正确

2. **推荐关系创建失败**
   - 确认用户存在
   - 检查推荐码有效性
   - 验证用户状态

3. **奖励发放失败**
   - 检查奖励配置
   - 验证用户余额更新
   - 查看交易记录

4. **Telegram通知失败**
   - 确认Bot Token配置
   - 检查用户Telegram ID
   - 验证网络连接

### 日志分析
```bash
# 查看推荐绑定相关日志
grep "referral_bind" /var/log/application.log

# 查看错误日志
grep "ERROR" /var/log/application.log | grep referral

# 查看性能日志
grep "responseTime" /var/log/monitoring.log
```

## 版本历史

### v1.0.0 (2025-10-31)
- 初始版本发布
- 实现基本推荐绑定功能
- 添加防作弊检查
- 集成奖励系统
- 支持Telegram通知

### 计划功能
- [ ] 推荐码生成优化
- [ ] 多语言支持
- [ ] 批量操作支持
- [ ] 推荐统计功能
- [ ] 高级防作弊规则

## 支持

如需技术支持或功能建议，请联系开发团队或提交Issue到项目仓库。