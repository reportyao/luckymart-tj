# Telegram Bot 容错机制实现指南

## 📋 概述

本项目为 Telegram Bot 实现了完整的容错机制，确保 Bot 在各种异常情况下能够稳定运行，自动恢复，并提供详细的监控和告警功能。

## 🏗️ 架构组成

### 核心组件

1. **日志系统** (`utils/logger.ts`)
   - 多级别日志记录 (ERROR, WARN, INFO, DEBUG)
   - 文件轮转和自动清理
   - 性能监控和业务事件追踪
   - 错误统计和分析

2. **健康监控系统** (`utils/health-monitor.ts`)
   - 实时健康状态检查
   - 组件状态监控 (数据库、Telegram、内存、消息队列等)
   - 自动告警和恢复机制
   - HTTP API 端点支持

3. **消息队列系统** (`utils/message-queue.ts`)
   - 可靠的消息处理
   - 优先级队列管理
   - 自动重试和错误恢复
   - 批量消息处理

4. **进程监控器** (`utils/process-monitor.ts`)
   - 进程状态实时监控
   - 内存和CPU使用跟踪
   - 自动重启机制
   - 优雅关闭处理

5. **重连管理器** (`utils/reconnect-manager.ts`)
   - 网络连接监控
   - 指数退避重连策略
   - 连接池管理
   - 连接质量评估

6. **容错管理器** (`utils/fault-tolerance-manager.ts`)
   - 统一容错策略管理
   - 恢复策略协调
   - 系统事件处理
   - 性能统计

## 🚀 核心功能

### 1. 错误重连逻辑和健康检查

```typescript
// 健康检查端点
GET /api/health

// 系统状态端点
GET /api/status

// 系统指标端点
GET /api/metrics
```

**功能特点:**
- 实时监控所有组件健康状态
- 自动检测异常并触发恢复流程
- 支持配置阈值和告警规则
- 提供详细的状态报告

### 2. 单进程运行容错机制

**进程保护特性:**
- 内存泄漏检测和自动重启
- CPU使用率监控和限制
- 进程超时检测和强制重启
- 优雅关闭和资源清理

**重启策略:**
- 按运行时间定期重启 (默认7天)
- 资源使用超限时重启
- 连续错误检测和重启
- 手动重启支持

### 3. 消息队列和重试机制

```typescript
// 添加消息到队列
await messageQueue.addMessage('telegram', {
  type: 'send_message',
  chatId: chatId,
  text: 'Hello World'
}, {
  priority: 'high',
  maxAttempts: 3,
  delay: 1000
});
```

**队列特性:**
- 优先级处理 (high, normal, low)
- 指数退避重试策略
- 消息持久化和恢复
- 批量处理和并发控制

### 4. 进程监控和自动重启

**监控指标:**
- 内存使用量 (堆内存、RSS、外部内存)
- CPU使用率 (用户态、系统态)
- 事件循环延迟
- 句柄和请求数量

**重启触发条件:**
- 内存使用超过阈值 (512MB+)
- CPU使用持续超过80%
- 健康检查连续失败
- 未捕获异常

### 5. 日志记录和错误报告

```typescript
// 业务事件日志
logger.business('user_registered', userId, {
  username: user.username,
  initialBalance: user.balance
});

// 性能监控
logger.performance('database_query', duration, {
  operation: 'user_lookup',
  table: 'users'
});

// 安全事件
logger.security('suspicious_activity', {
  userId: userId,
  action: 'rapid_requests'
});
```

**日志功能:**
- 结构化日志记录
- 自动文件轮转 (按天，保留14天)
- 错误趋势分析和统计
- 性能指标追踪

## 📊 监控端点

### 健康检查端点

```bash
curl http://localhost:3001/api/health
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600,
    "checks": {
      "database": {
        "status": "healthy",
        "message": "Database connection healthy",
        "duration": 45
      },
      "telegram": {
        "status": "healthy",
        "message": "Telegram configuration valid",
        "duration": 12
      }
    }
  }
}
```

### 系统状态端点

```bash
curl http://localhost:3001/api/status
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "system": {
      "overall": "healthy",
      "uptime": 7200,
      "components": {
        "database": {
          "status": "healthy",
          "lastCheck": "2024-01-15T10:30:00.000Z"
        }
      }
    }
  }
}
```

### 系统指标端点

```bash
curl http://localhost:3001/api/metrics
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "system": {
      "uptime": 3600,
      "memory": {
        "heapUsed": 50.2,
        "heapTotal": 120.5,
        "percentage": 41.7
      }
    },
    "faultTolerance": {
      "messageQueue": {
        "queueLength": 15,
        "processing": 3,
        "successRate": 98.5
      }
    }
  }
}
```

## 🔧 配置管理

### 环境配置

系统支持三种环境配置：

1. **开发环境** (`development`)
   - 详细的调试日志
   - 较短的重试间隔
   - 较低的资源阈值

2. **生产环境** (`production`)
   - 优化的性能配置
   - 完善的监控和告警
   - 自动恢复机制

3. **测试环境** (`test`)
   - 最小化资源使用
   - 禁用自动恢复
   - 简化日志记录

### 配置示例

```typescript
// 生产环境配置示例
const productionConfig = {
  healthCheck: {
    enabled: true,
    interval: 60000, // 1分钟检查一次
    timeout: 10000,
    criticalThreshold: 2
  },
  processMonitor: {
    enabled: true,
    memoryThreshold: 512, // 512MB
    cpuThreshold: 75,
    maxUptime: 168, // 7天
    enableAutoRestart: true
  },
  messageQueue: {
    enabled: true,
    maxConcurrent: 20,
    maxRetries: 5,
    initialDelay: 2000
  }
};
```

## 🛠️ 部署指南

### 自动部署

使用提供的部署脚本：

```bash
# 1. 赋予执行权限
chmod +x deploy-fault-tolerance.sh

# 2. 运行部署脚本
./deploy-fault-tolerance.sh
```

### 手动部署

```bash
# 1. 进入bot目录
cd luckymart-tj/bot

# 2. 安装依赖
npm install winston winston-daily-rotate-file

# 3. 设置环境变量
export TELEGRAM_BOT_TOKEN="your_bot_token"
export NODE_ENV="production"
export MINI_APP_URL="https://your-app.com"

# 4. 启动Bot
node start.ts
```

### PM2 部署

```bash
# 1. 安装PM2
npm install -g pm2

# 2. 启动Bot
pm2 start ecosystem.config.js

# 3. 监控日志
pm2 logs telegram-bot

# 4. 重新加载配置
pm2 reload telegram-bot
```

## 📝 使用说明

### Bot 命令增强

原有的 Bot 命令已集成容错机制：

- `/start` - 用户注册，包含错误重试和日志记录
- `/balance` - 查询余额，使用消息队列异步处理
- `/orders` - 查询订单，支持失败重试

### 错误处理

```typescript
// 自动错误追踪
try {
  await someOperation();
} catch (error) {
  // 错误会被自动记录和追踪
  errorTracker.recordError('operation_failed', error);
  
  // 触发恢复机制
  await faultToleranceManager.triggerRecovery(
    'operation_failed', 
    'Database operation failed'
  );
}
```

### 性能监控

```typescript
// 性能指标自动收集
@performanceLogger('database_query')
async function queryDatabase() {
  // 自动记录执行时间
}

// 业务事件追踪
logger.business('order_created', userId, {
  orderId: order.id,
  amount: order.total
});
```

## 🔍 故障排查

### 常见问题

1. **Bot无法启动**
   - 检查环境变量 `TELEGRAM_BOT_TOKEN`
   - 确认端口3001可用
   - 查看启动日志

2. **内存使用过高**
   - 系统会自动重启
   - 查看内存使用指标
   - 检查是否有内存泄漏

3. **消息处理失败**
   - 查看消息队列状态
   - 检查失败消息日志
   - 手动重试机制

### 日志查看

```bash
# 查看实时日志
tail -f bot/logs/telegram-bot-*.log

# 查看错误日志
tail -f bot/logs/telegram-bot-error-*.log

# PM2日志
pm2 logs telegram-bot
```

### 健康检查

```bash
# 检查系统健康状态
curl http://localhost:3001/api/health

# 查看系统指标
curl http://localhost:3001/api/metrics

# 查看连接状态
curl http://localhost:3001/api/connections
```

## 🚦 告警和通知

### 告警触发条件

- 内存使用超过阈值 (85%)
- CPU使用持续超过80%
- 数据库连接失败
- 连续错误超过限制

### 告警方式

1. **日志记录** - 所有告警都会记录到日志文件
2. **监控端点** - 通过HTTP API访问告警状态
3. **Webhook通知** - 配置`MONITORING_WEBHOOK`接收实时通知

## 🔐 安全考虑

### 访问控制

- 监控端点需要认证 (配置 `RESTART_TOKEN`)
- 环境变量安全管理
- 日志文件权限控制

### 数据保护

- 敏感信息日志脱敏
- 用户数据加密存储
- API访问频率限制

## 📈 性能优化

### 资源使用

- 内存使用自动监控和限制
- CPU使用率实时跟踪
- 磁盘空间自动清理

### 响应时间

- 消息队列异步处理
- 数据库连接池优化
- 缓存机制集成

## 🔄 更新和维护

### 热更新支持

- 配置文件热重载
- 动态阈值调整
- 在线重启机制

### 定期维护

- 日志文件自动清理
- 数据库连接池优化
- 缓存定期清理

## 🤝 贡献指南

### 代码规范

- 使用TypeScript进行类型安全
- 遵循现有的错误处理模式
- 添加适当的日志记录
- 编写单元测试

### 测试

```bash
# 运行测试
npm test

# 运行集成测试
npm run test:integration

# 性能测试
npm run test:performance
```

## 📞 技术支持

如有问题或建议，请：

1. 查看本文档的故障排查部分
2. 检查系统日志和监控指标
3. 通过GitHub Issues提交问题
4. 联系开发团队获取支持

---

**版本**: 1.0.0  
**更新时间**: 2024-01-15  
**维护者**: LuckyMart TJ 开发团队