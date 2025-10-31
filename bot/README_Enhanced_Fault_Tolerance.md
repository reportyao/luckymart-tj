# Telegram Bot 增强容错系统

## 快速开始

### 安装依赖
```bash
npm install
```

### 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
TELEGRAM_BOT_TOKEN=your_bot_token_here
MINI_APP_URL=https://your-app-url.com
NODE_ENV=production
```

### 启动增强版Bot
```bash
# 使用新的增强启动器（推荐）
npm run start:enhanced

# 或使用传统的守护进程模式
npm run start:daemon

# 或直接启动Bot
npm start
```

## 主要功能

### 🛡️ 多层容错保护
- **Bot守护进程** - 独立监控Bot进程，异常自动重启
- **进程监控** - 实时监控内存、CPU使用率
- **健康检查** - 定期检查系统各组件状态
- **自动恢复** - 智能错误检测和恢复策略

### 📊 全面监控告警
- **性能监控** - CPU、内存、网络、响应时间监控
- **错误追踪** - 智能错误分类和分析
- **实时告警** - 多渠道告警通知（Webhook、邮件、Telegram）
- **趋势分析** - 性能趋势预测和问题预防

### ⚙️ 灵活配置管理
- **热更新** - 无需重启的配置变更
- **版本控制** - 配置变更历史和回滚
- **自动验证** - 配置变更自动验证
- **备份恢复** - 自动配置备份和一键恢复

## 目录结构

```
bot/
├── enhanced-telegram-bot-launcher.ts    # 完整启动器
├── start.ts                             # 传统启动脚本
├── index.ts                             # Bot核心实现
├── enhanced-launcher.ts                 # 增强启动器
├── utils/
│   ├── bot-daemon.ts                    # Bot守护进程
│   ├── alert-manager.ts                 # 监控告警系统
│   ├── enhanced-error-tracker.ts        # 错误追踪器
│   ├── config-manager.ts                # 配置管理系统
│   ├── performance-monitor.ts           # 性能监控器
│   ├── fault-tolerance-manager.ts       # 容错管理器
│   ├── process-monitor.ts               # 进程监控器
│   ├── health-monitor.ts                # 健康监控器
│   ├── reconnect-manager.ts             # 重连管理器
│   ├── message-queue.ts                 # 消息队列
│   └── logger.ts                        # 日志系统
├── services/                            # 业务服务
│   ├── user-info-service.ts             # 用户信息服务
│   └── reward-notifier.ts               # 奖励通知服务
├── config/                              # 配置文件
│   ├── config.json                      # 应用配置
│   └── schema.json                      # 配置架构
└── logs/                                # 日志目录
    ├── bot.log                          # 应用日志
    ├── error.log                        # 错误日志
    ├── performance.log                  # 性能日志
    └── alerts.log                       # 告警日志
```

## 配置说明

### 环境变量
```bash
# 必需配置
TELEGRAM_BOT_TOKEN=your_bot_token

# 可选配置
MINI_APP_URL=https://your-app.com
NODE_ENV=development|production

# 监控配置
MONITORING_ENABLED=true
ALERT_WEBHOOK_URL=https://hooks.slack.com/...
PERFORMANCE_MONITORING=true

# 容错配置
MAX_RESTARTS=10
RESTART_DELAY=5000
HEALTH_CHECK_INTERVAL=30000
```

### 配置文件
```json
{
  "daemon": {
    "maxRestarts": 10,
    "restartDelay": 5000,
    "healthCheckInterval": 30000
  },
  "monitoring": {
    "enabled": true,
    "alertWebhook": "https://hooks.slack.com/...",
    "metricsEndpoint": "/health/metrics"
  },
  "performance": {
    "enabled": true,
    "collectionInterval": 10000,
    "alertThresholds": {
      "cpu": 80,
      "memory": 85,
      "responseTime": 1000
    }
  }
}
```

## 使用示例

### 1. 启动增强版Bot
```typescript
import { EnhancedTelegramBotLauncher } from './enhanced-telegram-bot-launcher';

const launcher = new EnhancedTelegramBotLauncher({
  daemon: {
    maxRestarts: 15,
    restartDelay: 3000
  },
  monitoring: {
    alertWebhook: 'https://your-webhook-url'
  }
});

await launcher.start();
```

### 2. 配置管理
```typescript
import { configManager } from './utils/config-manager';

// 获取配置
const maxRestarts = configManager.get('daemon.maxRestarts', 10);

// 更新配置
await configManager.set('monitoring.enabled', true, {
  user: 'admin',
  reason: 'Enable monitoring'
});

// 批量更新配置
await configManager.update({
  'performance.collectionInterval': 5000,
  'alerting.thresholds.cpu': 70
}, {
  user: 'admin',
  reason: 'Update performance thresholds'
});
```

### 3. 错误追踪
```typescript
import { enhancedErrorTracker } from './utils/enhanced-error-tracker';

// 记录错误
const errorId = enhancedErrorTracker.recordError(
  'database_connection',
  new Error('Database connection failed'),
  {
    severity: 'high',
    component: 'database',
    context: { url: 'postgres://...' },
    metadata: { retryCount: 3 }
  }
);

// 获取错误统计
const stats = enhancedErrorTracker.getErrorStats();

// 生成错误报告
const errors = enhancedErrorTracker.getErrors({
  severity: 'high',
  timeRange: {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000),
    end: new Date()
  }
});
```

### 4. 性能监控
```typescript
import { performanceMonitor } from './utils/performance-monitor';

// 启动性能监控
performanceMonitor.startMonitoring(5000); // 5秒间隔

// 获取当前指标
const metrics = performanceMonitor.getCurrentMetrics();

// 生成性能报告
const report = performanceMonitor.generateReport(3600000); // 1小时报告

// 添加自定义告警规则
performanceMonitor.addAlertRule({
  id: 'response_time_high',
  metric: 'application.responseTime',
  threshold: 2000,
  duration: 30000,
  severity: 'critical',
  message: 'Response time is too high'
});
```

### 5. 告警管理
```typescript
import { alertManager } from './utils/alert-manager';

// 添加告警规则
alertManager.addRule({
  id: 'memory_usage_high',
  name: 'High Memory Usage',
  description: 'Memory usage exceeds 90%',
  condition: {
    type: 'metric',
    metric: 'system.memory.percentage',
    operator: '>',
    threshold: 90
  },
  actions: [
    {
      type: 'webhook',
      config: {
        webhookUrl: 'https://your-webhook-url',
        message: 'Memory usage is critically high!'
      }
    },
    {
      type: 'restart',
      config: {}
    }
  ],
  enabled: true,
  severity: 'critical',
  cooldown: 300000 // 5分钟冷却
});

// 获取活跃告警
const activeAlerts = alertManager.getActiveAlerts();

// 解决告警
alertManager.resolveAlert(alertId);
```

## 监控和运维

### 查看系统状态
```typescript
// 获取完整系统状态
const status = launcher.getSystemStatus();

console.log('System Status:', {
  uptime: status.uptime,
  memory: status.components.performance?.system?.memory,
  errors: status.components.errorTracker?.totalErrors,
  alerts: status.components.alertManager?.activeAlerts
});
```

### 日志查看
```bash
# 查看实时日志
tail -f logs/bot.log

# 查看错误日志
tail -f logs/error.log

# 查看性能日志
tail -f logs/performance.log

# 查看告警日志
tail -f logs/alerts.log
```

### 健康检查端点
```bash
# 获取系统健康状态
curl http://localhost:3000/health

# 获取详细性能指标
curl http://localhost:3000/health/metrics

# 获取错误统计
curl http://localhost:3000/health/errors
```

## 故障排查

### 常见问题

#### 1. Bot频繁重启
```typescript
// 检查重启历史
const status = botDaemon.getStatus();
console.log('Restart History:', status.restartCount);

// 检查错误日志
const errors = enhancedErrorTracker.getErrors({
  severity: 'high',
  timeRange: {
    start: new Date(Date.now() - 60 * 60 * 1000), // 最近1小时
    end: new Date()
  }
});
```

#### 2. 内存使用过高
```typescript
// 获取内存指标
const metrics = performanceMonitor.getCurrentMetrics();
console.log('Memory Usage:', metrics.system.memory);

// 强制垃圾回收（仅开发环境）
if (process.env.NODE_ENV === 'development') {
  if (global.gc) {
    global.gc();
  }
}
```

#### 3. 配置更新失败
```typescript
// 检查配置状态
const configStatus = configManager.getStatus();
console.log('Config Status:', configStatus);

// 查看配置变更历史
const history = configManager.getChangeHistory(10);
console.log('Config Changes:', history);
```

### 调试模式
```bash
# 启用详细日志
NODE_ENV=development npm run start:enhanced

# 启用调试模式
DEBUG=telegram-bot:* npm run start:enhanced
```

## 性能优化

### 建议配置
```bash
# 生产环境推荐配置
NODE_ENV=production
MAX_RESTARTS=20
RESTART_DELAY=2000
HEALTH_CHECK_INTERVAL=15000
PERFORMANCE_COLLECTION_INTERVAL=5000
```

### 资源监控
```bash
# 查看系统资源使用
top -p $(pgrep -f "enhanced-telegram-bot")

# 查看内存使用详情
ps aux | grep node

# 查看网络连接
netstat -an | grep :3000
```

## 贡献指南

### 开发环境设置
```bash
# 克隆项目
git clone <repository-url>
cd luckymart-tj/bot

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

### 代码规范
- 使用TypeScript进行开发
- 遵循ESLint代码规范
- 添加必要的类型定义
- 编写单元测试
- 更新相关文档

### 提交代码
```bash
# 提交变更
git add .
git commit -m "feat: add new feature"

# 推送到远程
git push origin feature-branch
```

## 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。

## 技术支持

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [项目Issues页面]
- 邮箱: support@luckymart.tj
- Telegram: @luckymart_support

---

**注意**: 本系统已针对生产环境进行优化，确保高可用性和稳定性。建议在生产环境部署前进行充分的测试。