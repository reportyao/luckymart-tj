# 速率限制系统部署指南

## 系统概述

LuckyMartTJ速率限制系统已完成部署，为支付、充值、提现等关键接口提供全面的保护。

## 完成状态 ✅

### 核心功能
- ✅ **4种限流策略**：滑动窗口、固定窗口、令牌桶、漏桶
- ✅ **复合标识符**：基于IP、用户ID、设备指纹的多维度识别
- ✅ **Redis驱动**：分布式架构，支持高并发场景
- ✅ **动态配置**：运行时可调整限流规则
- ✅ **实时监控**：持续收集指标，智能告警
- ✅ **管理API**：完整的配置和管理功能

### 受保护的API
- `/api/payment/recharge` - 充值接口（5次/5分钟）
- `/api/withdraw/create` - 提现接口（3次/小时）
- `/api/lottery/participate` - 抽奖参与（10次/分钟）
- `/api/resale/create` - 转售创建（5次/5分钟）

## 快速部署

### 1. 数据库迁移
```bash
# 应用数据库迁移
supabase db push
# 或手动执行
psql -f supabase/migrations/1761847000_create_rate_limit_system_tables.sql
```

### 2. 环境配置
确保 `.env.local` 文件包含：
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
REDIS_KEY_PREFIX=rl_
JWT_SECRET=your_jwt_secret
```

### 3. 系统启动
系统会在应用启动时自动初始化：
```javascript
import { initializeRateLimitSystem } from '@/lib/rate-limit-system';

// 在应用入口调用
await initializeRateLimitSystem();
```

### 4. 验证部署
```bash
# 运行验证脚本
node scripts/verify-rate-limit.js

# 测试管理API
curl -H "Authorization: Bearer <admin_token>" \
     http://localhost:3000/api/admin/rate-limit?action=overview
```

## 管理接口

### 系统概览
- **GET** `/api/admin/rate-limit?action=overview`
- 返回系统状态、组件健康、监控指标

### 配置管理
- **GET** `/api/admin/rate-limit?action=config`
- **POST** `/api/admin/rate-limit` 
  - 更新配置：`{ "action": "update_config", "endpointPattern": "/api/*", "config": {...} }`
  - 切换状态：`{ "action": "toggle_config", "endpointPattern": "/api/*", "isActive": true }`

### 监控告警
- **GET** `/api/admin/rate-limit?action=alerts`
- **GET** `/api/admin/rate-limit?action=monitoring`
- **POST** `/api/admin/rate-limit`
  - 确认告警：`{ "action": "acknowledge_alert", "alertId": "xxx", "acknowledgedBy": "admin" }`

## 限流配置

### 预设配置
```typescript
import { RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

// 支付接口 - 极严格
RATE_LIMIT_PRESETS.PAYMENT_CRITICAL
// 3次/分钟，token_bucket策略

// 充值接口 - 严格  
RATE_LIMIT_PRESETS.RECHARGE
// 5次/5分钟，sliding_window策略

// 提现接口 - 极严格
RATE_LIMIT_PRESETS.WITHDRAW_CRITICAL
// 3次/小时，token_bucket策略

// 抽奖接口 - 适度
RATE_LIMIT_PRESETS.LOTTERY_PARTICIPATE
// 10次/分钟，leaky_bucket策略
```

### 自定义配置
```typescript
import { withRateLimit } from '@/lib/rate-limit-middleware';

const customConfig = {
  windowMs: 2 * 60 * 1000,    // 2分钟
  maxRequests: 8,             // 最多8次
  strategy: 'sliding_window',
  keyPrefix: 'custom:',
  skipFailedRequests: true
};

export const POST = withRateLimit(handler, {
  config: customConfig
});
```

## 监控指标

### 实时数据
- 总请求数、阻塞数、阻塞率
- 响应时间分布
- 活跃告警数量
- 系统运行时间

### 告警规则
- **高阻塞率**：>50%时触发
- **频繁限率**：>100次/分钟时触发
- **响应过慢**：>1000ms时触发

## 故障排查

### 常见问题
1. **Redis连接失败**
   - 检查Redis服务状态
   - 验证连接配置
   - 查看错误日志

2. **限流未生效**
   - 检查配置是否正确加载
   - 验证Redis数据
   - 查看中间件是否正确应用

3. **性能问题**
   - 监控Redis内存使用
   - 检查清理任务执行
   - 分析热点数据

### 日志查看
```bash
# 应用日志
tail -f logs/application.log | grep "rate-limit"

# Redis日志
tail -f /var/log/redis/redis-server.log
```

## 安全最佳实践

### 配置建议
1. **生产环境**：使用Redis集群
2. **监控告警**：集成第三方告警系统
3. **定期清理**：配置自动清理过期数据
4. **访问控制**：限制管理API访问权限

### 监控建议
1. **实时监控**：设置关键指标阈值
2. **容量规划**：根据用户增长调整配置
3. **性能基准**：定期评估限流效果
4. **安全审计**：定期检查配置变更

## 支持与维护

### 技术支持
- 📧 技术文档：`docs/rate-limit-examples.ts`
- 🔧 配置指南：数据库表 `rate_limit_configs`
- 📊 监控面板：`GET /api/admin/rate-limit?action=overview`

### 维护计划
- **日常**：监控告警和系统状态
- **周度**：分析限流效果和性能指标
- **月度**：审查和优化限流策略
- **季度**：全面安全评估

## 总结

速率限制系统已成功部署，为LuckyMartTJ提供全方位的API保护。通过多层防护机制，有效防范恶意攻击和接口滥用，确保系统安全稳定运行。