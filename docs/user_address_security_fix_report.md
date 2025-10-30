# 用户地址权限和安全验证修复报告

## 概述

本次安全修复针对用户地址操作权限问题、提现验证缺陷以及系统安全性进行全面加固，涵盖了权限验证、输入验证、频率限制、SQL注入防护和XSS攻击防护等多个安全层面。

## 🔒 修复内容

### 1. 用户地址API权限修复

#### 问题描述
- 原有的用户地址API存在权限验证缺陷
- 缺少操作频率限制和输入验证
- 没有防护暴力攻击措施

#### 修复方案
**文件位置**: `/app/api/user/addresses-fixed/route.ts` 和 `/[id]/route.ts`

**主要改进**:
- ✅ **严格权限验证**: 强化了用户地址归属检查
- ✅ **输入验证清洗**: 使用zod进行结构化验证
- ✅ **频率限制**: 每小时最多创建10个地址，更新20次，删除10次
- ✅ **XSS防护**: DOMPurify清洗所有用户输入
- ✅ **SQL注入防护**: 多重检查和参数验证
- ✅ **数据脱敏**: 手机号自动脱敏显示
- ✅ **审计日志**: 记录所有地址操作活动
- ✅ **安全事件监控**: 检测可疑攻击行为

#### 核心安全功能

1. **多层次权限验证**
```typescript
// 检查地址归属
const { data: existingAddress, error: checkError } = await supabaseAdmin
  .from('user_addresses')
  .select('*')
  .eq('id', addressId)
  .eq('userId', user.userId)
  .single();

// 双重验证防止TOCTOU攻击
.eq('id', addressId)
.eq('userId', user.userId)
```

2. **全面输入验证**
```typescript
const safeRecipientName = validateAndSanitizeName(recipientName);
const safeRecipientPhone = validateAndSanitizePhone(recipientPhone);
const safeDetailAddress = validateAndSanitizeAddress(detailAddress);

// XSS检测
if (inputValues.some(data => detectXSSAttempt(data))) {
  // 记录安全事件并拒绝请求
}
```

### 2. 提现金额限制后端严格验证

#### 问题描述
- 原提现验证过于简单
- 缺少业务逻辑限制
- 没有风险评估机制

#### 修复方案
**文件位置**: `/app/api/withdraw/create-fixed/route.ts`

**主要改进**:
- ✅ **严格金额验证**: 最低50 TJS，最高10000 TJS
- ✅ **每日月度限制**: 日限制5万TJS，月限制50万TJS
- ✅ **SMS验证码验证**: 提现前必须验证手机验证码
- ✅ **风险评估系统**: 自动评分0-100分
- ✅ **原子性操作**: 确保余额操作的ACID特性
- ✅ **IP和设备验证**: 多维度风险识别
- ✅ **人工审核机制**: 高风险提现需人工审核

#### 业务限制配置
```typescript
const WITHDRAW_CONFIG = {
  MIN_AMOUNT: 50,        // 最低提现金额
  MAX_AMOUNT: 10000,     // 最高提现金额
  DAILY_LIMIT: 50000,    // 每日提现总限制
  MONTHLY_LIMIT: 500000, // 每月提现总限制
  MIN_INTERVAL: 30 * 60 * 1000, // 最短提现间隔（30分钟）
};
```

### 3. 操作频率限制

#### 实现了三层频率限制机制

1. **全局API层限制**
- 认证接口：15分钟内最多10次
- 提现接口：1小时内最多5次
- 地址接口：1小时内最多50次
- 通用接口：1小时内最多1000次

2. **用户操作层限制**
- 用户地址创建：每小时10次
- 用户地址修改：每小时20次
- 用户地址删除：每小时10次
- 提现申请：每天5次

3. **IP层限制**
- 基于IP地址的访问频率控制
- 防止IP轮换绕过限制

#### 频率限制实现
```typescript
const rateLimitChecker = new RateLimitChecker();

const rateLimitResult = rateLimitChecker.check(
  rateLimitKey,
  ADDRESS_RATE_LIMITS.CREATE.limit,
  ADDRESS_RATE_LIMITS.CREATE.windowMs
);

if (!rateLimitResult.allowed) {
  return NextResponse.json({
    success: false,
    error: '操作过于频繁，请稍后再试'
  }, { status: 429 });
}
```

### 4. 加强用户输入验证和清洗

#### 创建了全面的输入验证系统

**文件位置**: `/lib/security-validation.ts`

#### 验证功能
- ✅ **结构化验证**: 使用zod进行类型安全的验证
- ✅ **XSS防护**: DOMPurify清洗HTML内容
- ✅ **SQL注入检测**: 多模式匹配检测
- ✅ **数据脱敏**: 自动脱敏敏感信息
- ✅ **格式验证**: 手机号、姓名、地址等专项验证

#### 验证模式示例
```typescript
// 手机号验证
const phoneSchema = z.string()
  .min(1, '手机号不能为空')
  .regex(/^\+?[1-9]\d{1,14}$/, '手机号格式不正确');

// 姓名验证（防止注入攻击）
const nameSchema = z.string()
  .min(1, '姓名不能为空')
  .max(50, '姓名过长')
  .regex(/^[\u4e00-\u9fa5a-zA-Z\s\-\.]+$/, '姓名包含非法字符');

// 金额验证
const amountSchema = z.number()
  .positive('金额必须为正数')
  .max(1000000, '金额超出限制')
  .refine(val => {
    return /^(\d+)(\.\d{1,2})?$/.test(val.toString());
  }, '金额格式不正确');
```

### 5. SQL注入和XSS攻击防护

#### SQL注入防护
1. **参数化查询**: 所有数据库操作使用参数化查询
2. **输入检查**: 多模式SQL注入检测
3. **查询构建**: 安全的查询条件构建器
4. **ID验证**: 严格的ID参数验证

```typescript
// SQL注入检测
const sqlPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE)\b)/i,
  /(\b(UNION|JOIN|AND|OR)\b)/i,
  /(\-\-|\#|\/\*|\*\/)/,
  /(;|@@|xp_|sp_)/i,
];

// 安全查询构建
export function buildSafeQueryCondition(conditions: Record<string, any>) {
  const safeConditions: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(conditions)) {
    // 检查键名安全性
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      throw new Error(`不安全的字段名: ${key}`);
    }
    
    // 检查值是否存在SQL注入风险
    if (typeof value === 'string') {
      if (checkSQLInjectionRisk(value)) {
        throw new Error(`检测到SQL注入攻击尝试: ${key}`);
      }
    }
    
    safeConditions[key] = value;
  }
  
  return safeConditions;
}
```

#### XSS防护
1. **DOMPurify清洗**: 移除所有危险HTML标签和属性
2. **输出编码**: 特殊字符转义处理
3. **内容安全策略**: CSP头部保护
4. **多层检测**: 输入输出双重XSS检测

```typescript
// XSS检测模式
const xssPatterns = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /expression\s*\(/gi,
];

// 安全响应头
export function setSecurityResponseHeaders(headers: Headers): Headers {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Content-Security-Policy', 
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';");
  
  return headers;
}
```

## 📊 数据库增强

### 安全相关表结构

创建了5个新的安全表：
1. **security_logs** - 安全事件日志
2. **user_activities** - 用户活动记录  
3. **sms_verifications** - SMS验证码
4. **rate_limit_logs** - 频率限制记录
5. 增强现有表的**安全字段**

### 原子性操作函数

创建了`atomic_balance_deduction`函数确保提现操作的原子性：

```sql
CREATE OR REPLACE FUNCTION atomic_balance_deduction(
  p_user_id VARCHAR(100),
  p_deduction_amount DECIMAL,
  p_operation_type VARCHAR(50),
  p_related_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- 确保余额操作的ACID特性
$$;
```

### 自动清理机制

创建了`cleanup_expired_data`函数定期清理过期数据：
- 过期SMS验证码
- 过期频率限制记录
- 过期安全日志
- 软删除的用户地址

## 🛡️ 全局安全中间件

**文件位置**: `/lib/security-middleware.ts`

### 中间件功能
- ✅ **基础安全检查**: URL长度、可疑模式、请求头验证
- ✅ **认证状态检查**: 动态认证要求
- ✅ **频率限制**: 全局API访问频率控制
- ✅ **风险评估**: 高风险端点额外检查
- ✅ **IP风险评估**: IP地址信誉检查
- ✅ **用户行为分析**: 异常行为检测
- ✅ **时间风险评估**: 非正常时段风险加权

### 使用方式
```typescript
// 在API路由中使用
import { withSecurity } from '@/lib/security-middleware';

export const GET = withSecurity(async (request: NextRequest) => {
  // 业务逻辑
});
```

## 📈 监控和审计

### 安全日志系统
- **实时监控**: 所有安全事件实时记录
- **风险评分**: 自动计算操作风险分数
- **人工审核**: 高风险操作标记需要人工审核
- **数据脱敏**: 敏感信息自动脱敏

### 审计视图
创建了`user_security_status`视图提供用户安全状态概览：
- 用户基本信息
- 地址数量统计
- 提现历史分析
- 安全事件统计
- 风险状态评估

## 🚀 部署指南

### 1. 数据库迁移
```bash
# 运行安全相关迁移
psql -d your_database -f supabase/migrations/1763100200_security_permissions_fix.sql
```

### 2. 依赖安装
确保项目中安装了必要的安全相关包：
```json
{
  "dependencies": {
    "zod": "^3.x.x",
    "isomorphic-dompurify": "^2.x.x"
  }
}
```

### 3. API路由替换
将原有的API路由替换为安全增强版本：

**地址API**:
```bash
# 备份原有文件
mv app/api/user/addresses/route.ts app/api/user/addresses/route.ts.backup
mv app/api/user/addresses/[id]/route.ts app/api/user/addresses/[id]/route.ts.backup

# 替换为安全版本
mv app/api/user/addresses-fixed/route.ts app/api/user/addresses/route.ts
mv app/api/user/addresses-fixed/[id]/route.ts app/api/user/addresses/[id]/route.ts
```

**提现API**:
```bash
# 备份原有文件
mv app/api/withdraw/create/route.ts app/api/withdraw/create/route.ts.backup

# 替换为安全版本
mv app/api/withdraw/create-fixed/route.ts app/api/withdraw/create/route.ts
```

### 4. 中间件配置
在需要保护的API路由中导入安全中间件：

```typescript
// app/api/withdraw/create/route.ts
import { withSecurity } from '@/lib/security-middleware';

export const POST = withSecurity(async (request: NextRequest) => {
  // 业务逻辑
});
```

### 5. 定时任务配置
设置定时清理任务（可选）：
```bash
# 添加到crontab，每天凌晨2点执行清理
0 2 * * * psql -d your_database -c "SELECT cleanup_expired_data();"
```

## 📋 安全检查清单

### ✅ 已完成的安全加固
- [x] 用户地址操作权限严格验证
- [x] 提现金额后端验证增强
- [x] 三层频率限制机制实现
- [x] 全面输入验证和清洗
- [x] SQL注入攻击防护
- [x] XSS攻击防护
- [x] 数据脱敏处理
- [x] 安全日志记录
- [x] 原子性操作保证
- [x] 风险评估系统
- [x] 人工审核机制
- [x] 全局安全中间件
- [x] 审计跟踪系统
- [x] 性能监控优化

### 🔍 建议的后续监控
1. **定期检查安全日志** - 监控可疑活动
2. **分析风险评分分布** - 调整风险阈值
3. **监控频率限制命中率** - 优化限制策略
4. **审查人工审核队列** - 改进自动化规则
5. **性能监控** - 确保安全检查不影响响应时间

## ⚠️ 重要注意事项

### 安全配置
1. **环境变量**: 确保JWT_SECRET等敏感变量安全配置
2. **数据库权限**: 为安全函数设置合适的权限
3. **日志保留**: 合理配置安全日志的保留期限
4. **监控告警**: 设置关键安全事件的告警通知

### 性能考虑
1. **索引优化**: 所有新增表都已创建适当索引
2. **查询优化**: 使用参数化查询避免SQL注入
3. **缓存策略**: 考虑对频繁查询的安全数据缓存
4. **异步处理**: 安全日志记录使用异步方式

### 合规性
1. **数据隐私**: 所有敏感数据都经过脱敏处理
2. **日志合规**: 安全日志遵循数据保护要求
3. **用户同意**: 确保用户了解数据收集和使用目的
4. **数据删除**: 提供用户数据删除机制

## 📞 支持和维护

### 常见问题
1. **Q: 频率限制过于严格怎么办？**
   A: 可以调整GLOBAL_RATE_LIMITS中的数值，根据实际业务需要优化

2. **Q: 风险评分误报率高？**
   A: 可以调整assessWithdrawRisk函数中的评分权重，或增加白名单机制

3. **Q: 安全日志占用存储空间过大？**
   A: 可以调整cleanup_expired_data函数的执行频率和保留期限

### 监控指标
- 安全事件频率
- 频率限制命中率
- 用户操作成功率
- API响应时间
- 风险评分分布

---

## 📋 总结

本次安全修复全面提升了系统的安全防护能力：

1. **权限控制**: 实现了细粒度的权限验证机制
2. **输入安全**: 建立了完整的输入验证和清洗体系
3. **攻击防护**: 有效防护SQL注入、XSS等常见攻击
4. **监控审计**: 建立了完善的安全监控和审计机制
5. **业务保护**: 增强了业务逻辑的安全性验证

修复后的系统能够有效防范暴力攻击、权限绕过、数据注入等安全威胁，为用户提供更安全可靠的服务体验。