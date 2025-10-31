# LuckyMart TJ 防作弊系统部署指南

## 系统概述

防作弊系统已完全开发完成，包含设备指纹识别、风险评估、推荐关系检查等完整功能。本指南将指导您如何将防作弊系统集成到现有的LuckyMart TJ项目中。

## 文件清单

### 核心模块文件

```
lib/anti-fraud/
├── device-fingerprint.ts          # 设备指纹识别模块 (465行)
├── fraud-checker.ts               # 防作弊检查模块 (633行)
├── device-fingerprint.test.ts     # 设备指纹测试 (227行)
├── fraud-checker.test.ts          # 防作弊检查测试 (305行)
├── api-integration-examples.ts    # API集成示例 (363行)
├── usage-examples.ts              # 使用示例 (361行)
├── index.ts                       # 模块导出 (17行)
└── README.md                      # 完整文档 (534行)
```

### API集成文件

```
app/api/
├── referral/bind-enhanced/        # 增强版推荐绑定API
│   └── route.ts                   # (579行)
├── risk-assessment/              # 风险评估API
│   └── route.ts                   # (393行)
└── admin/fraud-management/       # 防作弊管理API
    └── route.ts                   # (515行)
```

### 更新文件

```
lib/
└── errors.ts                      # 已更新，添加防作弊错误类型
```

### 报告文档

```
ANTI_FRAUD_SYSTEM_COMPLETION_REPORT.md  # 完成报告 (378行)
```

## 快速集成步骤

### 1. 数据库准备

确保数据库中已创建防作弊系统相关表：

```sql
-- 已创建的数据表：
-- device_fingerprints     - 设备指纹表
-- device_blacklist        - 设备黑名单表
-- fraud_detection_logs    - 欺诈检测日志表

-- 如果还没有创建，请运行：
-- supabase/migrations/1761846485_create_anti_fraud_system.sql
```

### 2. 导入防作弊模块

在任何需要使用防作弊功能的文件中导入：

```typescript
import { 
  FraudChecker, 
  DeviceFingerprintManager, 
  FraudCheckMiddleware 
} from '@/lib/anti-fraud';
```

### 3. 基础集成示例

#### 3.1 用户注册防作弊检查

```typescript
// 在用户注册API中添加防作弊检查
import { FraudChecker, DeviceFingerprintManager } from '@/lib/anti-fraud';

export async function registerUser(userData: any) {
  try {
    const { userId, deviceFingerprint, ipAddress } = userData;
    
    // 1. 执行防作弊检查
    const checkResult = await FraudChecker.performComprehensiveCheck(userId, {
      checkDeviceLimit: true,
      checkSuspiciousActivity: true
    });
    
    if (!checkResult.isAllowed) {
      throw new Error(`注册被拦截: ${checkResult.reason}`);
    }
    
    // 2. 记录设备指纹
    if (deviceFingerprint) {
      await DeviceFingerprintManager.recordDevice(
        userId, 
        deviceFingerprint, 
        ipAddress
      );
    }
    
    // 3. 继续注册流程...
    
  } catch (error) {
    console.error('注册防作弊检查失败:', error);
    throw error;
  }
}
```

#### 3.2 推荐关系绑定防作弊检查

```typescript
// 在推荐绑定API中添加防作弊检查
import { FraudChecker } from '@/lib/anti-fraud';

export async function bindReferral(referralData: any) {
  try {
    const { referrerId, referredId } = referralData;
    
    // 使用防作弊系统检查推荐关系
    const referralCheck = await FraudChecker.checkReferral(referrerId, referredId);
    
    if (!referralCheck.isValid) {
      throw new Error(referralCheck.reason);
    }
    
    // 继续推荐绑定流程...
    
  } catch (error) {
    console.error('推荐关系检查失败:', error);
    throw error;
  }
}
```

#### 3.3 使用中间件

```typescript
// 使用防作弊检查中间件
import { FraudCheckMiddleware } from '@/lib/anti-fraud';

// 防作弊检查中间件
const fraudCheck = FraudCheckMiddleware.createCheckMiddleware();

// 推荐关系检查中间件
const referralCheck = FraudCheckMiddleware.createReferralCheckMiddleware();

// 在API路由中使用
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await fraudCheck(req, res, async () => {
    // API逻辑
  });
}
```

### 4. 完整API集成示例

#### 4.1 增强版推荐绑定API

我们已经创建了完整的增强版推荐绑定API：

```
app/api/referral/bind-enhanced/route.ts
```

该API包含：
- 完整的设备指纹记录
- 多层次防作弊检查
- 风险评分和监控
- 详细的日志记录

使用方法：

```typescript
// 客户端调用
const response = await fetch('/api/referral/bind-enhanced', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_telegram_id: 'user123',
    referral_code: 'REF123',
    device_fingerprint: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      // ... 其他设备信息
    },
    ip_address: '192.168.1.1'
  })
});
```

#### 4.2 风险评估API

```
app/api/risk-assessment/route.ts
```

支持功能：
- 单用户风险评估
- 批量用户风险评估
- 设备风险分析

使用方法：

```typescript
// 获取用户风险评估
const response = await fetch('/api/risk-assessment?userId=user123');

// 批量风险评估
const response = await fetch('/api/risk-assessment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userIds: ['user1', 'user2', 'user3']
  })
});
```

#### 4.3 防作弊管理API

```
app/api/admin/fraud-management/route.ts
```

支持功能：
- 系统统计信息查看
- 设备黑名单管理
- 风险操作执行
- 近期警报查看

使用方法：

```typescript
// 获取系统统计
const response = await fetch('/api/admin/fraud-management?action=stats');

// 添加设备到黑名单
const response = await fetch('/api/admin/fraud-management', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'add',
    deviceId: 'device123',
    reason: 'Suspicious activity',
    expiresAt: '2025-11-01T00:00:00Z'
  })
});

// 执行风险操作
const response = await fetch('/api/admin/fraud-management', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user123',
    action: 'monitor',
    reason: '管理员手动标记'
  })
});
```

## 配置选项

### 风险阈值配置

```typescript
// lib/anti-fraud/fraud-checker.ts
export class FraudChecker {
  private static readonly HIGH_RISK_THRESHOLD = 70;      // 高风险阈值
  private static readonly MEDIUM_RISK_THRESHOLD = 40;    // 中风险阈值
  private static readonly MAX_REFERRAL_DEPTH = 3;        // 最大推荐深度
}
```

### 设备限制配置

```typescript
// lib/anti-fraud/device-fingerprint.ts
export class DeviceFingerprintManager {
  private static readonly MAX_DEVICES_PER_USER = 5;      // 每用户最大设备数
  private static readonly MAX_USERS_PER_DEVICE = 3;      // 每设备最大用户数
}
```

### 环境变量配置

在 `.env.local` 文件中添加：

```bash
# 防作弊系统配置
ANTI_FRAUD_ENABLED=true
ANTI_FRAUD_DEBUG=false
FRAUD_CHECK_TIMEOUT=5000
MAX_BATCH_USERS=100

# 监控配置
MONITORING_ENABLED=true
ALERT_WEBHOOK_URL=https://your-webhook-url.com/alerts
```

## 测试部署

### 1. 运行测试

```bash
# 运行所有防作弊相关测试
npm test lib/anti-fraud/device-fingerprint.test.ts
npm test lib/anti-fraud/fraud-checker.test.ts

# 运行覆盖率测试
npm run test:coverage
```

### 2. 手动测试API

```bash
# 测试设备指纹记录
curl -X POST http://localhost:3000/api/admin/fraud-management \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add",
    "deviceId": "test-device-123",
    "reason": "Testing device fingerprint"
  }'

# 测试风险评估
curl -X GET "http://localhost:3000/api/risk-assessment?userId=test-user-123"
```

### 3. 监控和日志

确保系统能正确记录和监控：

```bash
# 查看设备指纹记录
SELECT * FROM device_fingerprints ORDER BY created_at DESC LIMIT 10;

# 查看欺诈检测日志
SELECT * FROM fraud_detection_logs ORDER BY created_at DESC LIMIT 10;

# 查看设备黑名单
SELECT * FROM device_blacklist;
```

## 生产环境部署

### 1. 安全检查

- [ ] 设备指纹数据不包含个人隐私信息
- [ ] 黑名单管理操作需要管理员权限验证
- [ ] API访问控制已正确配置
- [ ] 敏感操作已记录审计日志

### 2. 性能优化

- [ ] 数据库索引已创建
- [ ] 缓存策略已实施
- [ ] 批量操作已优化
- [ ] 监控指标已配置

### 3. 监控配置

确保以下监控已配置：

```typescript
// 监控指标
monitor.recordGauge('user_risk_score', riskScore);
monitor.increment('fraud_detection_total', 1);
monitor.recordResponseTime('/api/risk-assessment', responseTime, 200);
```

### 4. 告警配置

配置高风险事件告警：

```typescript
// 当风险评分超过阈值时发送告警
if (riskScore >= 80) {
  await sendAlert({
    type: 'HIGH_RISK_USER',
    userId,
    riskScore,
    timestamp: new Date()
  });
}
```

## 常见问题解决

### 1. 数据库连接问题

```typescript
// 检查数据库连接
import { prisma } from '@/lib/prisma';

try {
  await prisma.$connect();
  console.log('数据库连接成功');
} catch (error) {
  console.error('数据库连接失败:', error);
}
```

### 2. 设备指纹生成失败

```typescript
// 检查设备指纹数据格式
const validateFingerprint = (data: any) => {
  if (!data.userAgent && !data.platform) {
    throw new Error('设备指纹必须包含至少一个标识信息');
  }
};
```

### 3. 防作弊检查超时

```typescript
// 设置检查超时
const checkWithTimeout = async (userId: string, timeout: number = 5000) => {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('检查超时')), timeout)
  );
  
  return Promise.race([
    FraudChecker.performComprehensiveCheck(userId),
    timeoutPromise
  ]);
};
```

## 支持和维护

### 1. 日志分析

定期分析防作弊系统日志：

```sql
-- 分析高风险用户
SELECT 
  user_id,
  COUNT(*) as detection_count,
  AVG(risk_score) as avg_risk_score,
  MAX(risk_score) as max_risk_score,
  MAX(created_at) as last_detection
FROM fraud_detection_logs 
WHERE risk_score >= 70
GROUP BY user_id
ORDER BY avg_risk_score DESC;

-- 分析设备共享情况
SELECT 
  device_id,
  COUNT(DISTINCT user_id) as user_count,
  COUNT(*) as total_records
FROM device_fingerprints 
GROUP BY device_id
HAVING COUNT(DISTINCT user_id) > 1
ORDER BY user_count DESC;
```

### 2. 定期维护

- 每周清理过期黑名单记录
- 每月分析风险趋势
- 季度优化风险评分算法
- 年度回顾系统性能

### 3. 功能扩展

防作弊系统采用模块化设计，易于扩展：

```typescript
// 添加新的风险因子
export class CustomFraudChecker extends FraudChecker {
  static async checkCustomRisk(userId: string): Promise<RiskFactor> {
    // 自定义风险检查逻辑
    return {
      type: 'custom_factor',
      score: 30,
      description: '自定义风险因子',
      weight: 0.2
    };
  }
}
```

## 总结

防作弊系统已经完全开发完成并准备部署。系统包含：

✅ **完整功能**: 设备指纹、风险评估、推荐检查、黑名单管理
✅ **API集成**: 增强版API、中间件、示例代码
✅ **测试覆盖**: 单元测试、集成测试、错误处理测试
✅ **文档齐全**: 使用指南、部署指南、API文档
✅ **生产就绪**: 性能优化、监控告警、安全检查

按照本指南的步骤，您可以快速将防作弊系统集成到现有项目中，开始保护平台免受欺诈行为的影响。