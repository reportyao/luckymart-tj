# LuckyMart TJ 防欺诈系统 - 快速集成指南

## 🚀 快速开始

### 1. 环境准备

确保你的项目已经安装了必要的依赖：

```bash
npm install @prisma/client prisma
```

### 2. 应用数据库迁移

```bash
# 应用新的数据库迁移
supabase db push
# 或者
npx prisma migrate deploy
```

### 3. 环境变量配置

在 `.env` 文件中添加：

```bash
# FingerprintJS Pro API密钥（可选，但推荐）
FINGERPRINTJS_API_KEY=your_api_key_here

# 开发模式调试开关
ANTI_FRAUD_DEBUG=false

# 节点环境
NODE_ENV=production
```

## 📝 基础集成

### 步骤1: 系统初始化

在应用启动时初始化防欺诈系统：

```typescript
// 在你的主应用文件中（如 pages/_app.tsx 或 app/layout.tsx）
import { FraudSystemInitializer } from '@/lib/anti-fraud/integration-examples';

// 应用启动时调用
if (typeof window === 'undefined') {
  // 服务端初始化
  FraudSystemInitializer.initialize()
    .then(() => console.log('防欺诈系统初始化完成'))
    .catch(console.error);
}
```

### 步骤2: API集成

在API路由中集成防欺诈检查：

```typescript
// pages/api/register.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { FraudChecker } from '@/lib/anti-fraud';
import { ClientFingerprintCollector } from '@/lib/anti-fraud/integration-examples';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, telegramId } = req.body;

    // 采集设备指纹（如果在前端已采集）
    const deviceData = req.body.deviceFingerprint;
    if (deviceData) {
      // 记录设备指纹
      await FraudChecker.performComprehensiveCheck(userId, {
        checkDeviceLimit: true,
        checkIPAnomaly: true,
        returnRiskScore: true
      });
    }

    // 检查防欺诈
    const checkResult = await FraudChecker.performComprehensiveCheck(userId, {
      checkDeviceLimit: true,
      checkIPAnomaly: true,
      checkZombieAccount: false, // 新用户暂不检查僵尸账户
      returnRiskScore: true
    });

    if (!checkResult.isAllowed) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FRAUD_CHECK_FAILED',
          message: checkResult.reason,
          riskScore: checkResult.riskScore
        }
      });
    }

    // 继续注册逻辑...
    
    res.json({
      success: true,
      message: '注册成功',
      data: { userId, riskScore: checkResult.riskScore }
    });

  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      error: { message: '服务器内部错误' }
    });
  }
}
```

### 步骤3: 前端设备指纹（可选）

如果你想使用FingerprintJS Pro，在前端添加：

```typescript
// 在页面组件中
import { ClientFingerprintCollector } from '@/lib/anti-fraud/integration-examples';
import { useEffect } from 'react';

export default function RegistrationPage() {
  useEffect(() => {
    // 页面加载时采集设备指纹
    const collectFingerprint = async () => {
      try {
        await ClientFingerprintCollector.initialize();
        
        // 发送指纹到服务器
        const userId = getCurrentUserId(); // 获取当前用户ID
        await ClientFingerprintCollector.sendToServer(userId);
      } catch (error) {
        console.error('设备指纹采集失败:', error);
      }
    };

    collectFingerprint();
  }, []);

  // ... 其他组件代码
}
```

## 🛡️ 高级用法

### 支付防欺诈检查

```typescript
// pages/api/payment.ts
import { PaymentAnomalyDetector, IPAnomalyDetector } from '@/lib/anti-fraud';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, amount, transactionType = 'general' } = req.body;

    // 检查支付异常
    const paymentAnalysis = await PaymentAnomalyDetector.analyzePaymentAnomaly(
      userId,
      amount,
      transactionType
    );

    // 检查IP异常
    const ipAnalysis = await IPAnomalyDetector.analyzeIP(req.ip, userId);

    // 综合判断
    if (paymentAnalysis.isAnomalous && paymentAnalysis.riskScore >= 70) {
      return res.status(403).json({
        error: '支付金额异常，已被拦截',
        details: paymentAnalysis
      });
    }

    if (ipAnalysis.isSuspicious && ipAnalysis.riskScore >= 80) {
      return res.status(403).json({
        error: 'IP地址风险过高，支付被拦截',
        details: ipAnalysis
      });
    }

    // 继续支付逻辑...
    
    res.json({ success: true, message: '支付成功' });

  } catch (error) {
    console.error('支付处理失败:', error);
    res.status(500).json({ error: '支付处理失败' });
  }
}
```

### 推荐关系检查

```typescript
// pages/api/referral/bind.ts
import { FraudChecker } from '@/lib/anti-fraud';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { referrerId, referredId } = req.body;

    // 检查推荐关系
    const referralCheck = await FraudChecker.checkReferral(referrerId, referredId);
    
    if (!referralCheck.isValid) {
      return res.status(400).json({
        error: referralCheck.reason,
        riskScore: referralCheck.riskScore
      });
    }

    // 继续绑定逻辑...
    
    res.json({ success: true, message: '推荐关系绑定成功' });

  } catch (error) {
    console.error('推荐绑定失败:', error);
    res.status(500).json({ error: '推荐绑定失败' });
  }
}
```

## 🔧 监控和运维

### 查看监控任务状态

```typescript
import { EnhancedFraudMonitoringScheduler } from '@/lib/anti-fraud';

// 获取所有任务状态
const allTasks = EnhancedFraudMonitoringScheduler.getAllTaskStatus();
console.log('监控任务状态:', allTasks);

// 启用/禁用特定任务
EnhancedFraudMonitoringScheduler.enableTask('zombie_detection');
EnhancedFraudMonitoringScheduler.disableTask('threat_intelligence_update');
```

### 获取系统统计

```typescript
import { AdminFraudManagement } from '@/lib/anti-fraud/integration-examples';

// 获取用户风险报告
const riskReport = await AdminFraudManagement.getUserRiskReport(userId);
console.log('风险报告:', riskReport);

// 获取系统监控统计
const systemStats = await AdminFraudManagement.getSystemMonitoringStats();
console.log('系统统计:', systemStats);
```

## 📊 数据库查询

### 查看高风险用户

```sql
-- 查看最近30天内的高风险用户
SELECT * FROM high_risk_users;

-- 查看僵尸账户候选
SELECT * FROM zombie_account_candidates;

-- 查看IP威胁统计
SELECT * FROM ip_threat_stats;
```

### 手动风险操作

```typescript
// 标记高风险用户
await AdminFraudManagement.markHighRiskUser(
  'user-uuid-here', 
  '管理员手动标记为高风险'
);

// 清理过期黑名单
const cleanedCount = await AdminFraudManagement.cleanupExpiredBlacklist();
console.log(`已清理${cleanedCount}条过期记录`);
```

## 🚨 错误处理

### 常见错误和解决方案

1. **FingerprintJS SDK加载失败**
   ```typescript
   // 自动回退到基础设备指纹
   try {
     await ClientFingerprintCollector.initialize();
   } catch (error) {
     console.warn('使用基础设备指纹:', error);
     // 系统会自动使用基础方案
   }
   ```

2. **数据库连接问题**
   ```typescript
   // 检查数据库连接状态
   try {
     await prisma.$queryRaw`SELECT 1`;
   } catch (error) {
     console.error('数据库连接失败:', error);
     // 可以临时禁用某些检查功能
   }
   ```

3. **性能问题**
   ```typescript
   // 如果检测太慢，可以调整检查选项
   const result = await FraudChecker.performComprehensiveCheck(userId, {
     checkZombieAccount: false, // 禁用计算量大的检查
     checkIPAnomaly: false,
     checkPaymentAnomaly: false
   });
   ```

## 📚 更多资源

- **完整API文档**: 查看 `/lib/anti-fraud/` 目录下的各模块文件
- **集成示例**: 查看 `integration-examples.ts` 文件
- **部署指南**: 查看 `ANTI_FRAUD_ENHANCEMENT_COMPLETION_REPORT.md`
- **数据库架构**: 查看迁移文件 `/supabase/migrations/1761846850_enhanced_anti_fraud_system_v2.sql`

## 💡 最佳实践

1. **渐进式集成**: 先从基础检查开始，逐步启用高级功能
2. **性能监控**: 定期检查检测耗时和系统资源使用
3. **数据保护**: 确保敏感数据加密存储和传输
4. **日志管理**: 保留足够的日志用于审计和问题排查
5. **规则调优**: 根据实际业务情况调整检测阈值

---

需要帮助？请查看完整的完成报告文档或联系开发团队。