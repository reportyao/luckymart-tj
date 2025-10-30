# LuckyMart-TJ API 安全审查报告

## 概述

本报告对 LuckyMart-TJ 项目的所有 API 端点进行了安全审查，检查了 32 个 API 端点的安全性。审查发现多个严重和一般级别的安全问题，需要立即修复以确保系统安全。

## 审查范围

- **审查文件数量**: 32 个 API 端点
- **审查项目**:
  1. 错误处理和HTTP状态码
  2. 参数验证完善性
  3. 数据库查询安全性
  4. SQL注入风险
  5. 敏感信息泄露风险

## 严重安全风险 (Critical)

### 1. 管理员初始化端点无权限控制
**文件**: `/api/admin/init/route.ts`

**问题描述**:
- 端点没有任何权限控制，任何人都可以调用
- 创建硬编码密码的管理员账号 (admin/admin123456)
- 返回默认密码信息

**风险等级**: 🔴 严重

**修复建议**:
```typescript
// 添加IP白名单或管理员验证
export async function POST(request: Request) {
  // 检查请求来源IP
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  // 只允许特定IP或localhost访问
  const allowedIPs = process.env.ALLOWED_INIT_IPS?.split(',') || ['127.0.0.1'];
  if (!allowedIPs.includes(clientIP)) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }
  
  // 检查是否已存在管理员
  // ...
}
```

### 2. 管理员API权限验证不完善
**文件**: 多个管理员端点 (如 `/api/admin/products/[id]/route.ts`)

**问题描述**:
- 大多数管理员API只检查token存在
- 没有验证JWT有效性
- 没有验证管理员权限

**风险等级**: 🔴 严重

**修复建议**:
```typescript
// 创建统一的权限中间件
import { verifyAdminToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = verifyAdminToken(request);
  if (!user) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  // ...
}
```

## 一般安全风险 (High)

### 3. 错误信息泄露
**影响端点**: 几乎所有API端点

**问题描述**:
- 错误响应中暴露 `error.message`，可能泄露敏感信息
- 包含数据库错误、内部实现细节

**示例问题代码**:
```typescript
// 危险的错误处理
return NextResponse.json(
  { error: '获取用户信息失败', message: error.message },
  { status: 500 }
);
```

**修复建议**:
```typescript
// 安全的错误处理
catch (error: any) {
  console.error('Get profile error:', error);
  return NextResponse.json(
    { error: '获取用户信息失败' },
    { status: 500 }
  );
}
```

### 4. 支付信息暴露
**文件**: `/api/payment/recharge/route.ts`

**问题描述**:
- 响应中包含环境变量中的支付账户信息
- 可能泄露敏感的支付账户详情

**修复建议**:
```typescript
// 不要在响应中暴露完整的支付信息
const paymentInstructions = {
  method: paymentMethod,
  reference: orderNumber,
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  // 移除敏感的账户信息
};
```

### 5. 系统设置存储风险
**文件**: `/api/admin/settings/route.ts`

**问题描述**:
- 使用内存存储敏感设置信息
- 服务器重启会导致数据丢失
- 银行账户信息直接存储在内存中

**修复建议**:
- 使用数据库存储系统设置
- 对敏感信息进行加密存储

## 中等风险 (Medium)

### 6. 参数验证不严格
**问题描述**:
- 部分端点缺少对ID参数格式的验证
- 数字类型参数缺少范围检查

**修复建议**:
```typescript
// 添加参数验证
const id = params.id;
if (!id || typeof id !== 'string' || id.length < 10) {
  return NextResponse.json({ error: '无效的ID格式' }, { status: 400 });
}
```

### 7. 事务处理不一致
**问题描述**:
- 有些地方使用Prisma `$transaction`
- 有些使用Supabase但没有事务保护
- 可能导致数据不一致

**修复建议**:
- 统一使用事务处理关键操作
- 对于涉及多个表修改的操作，必须使用事务

### 8. 身份验证实现不一致
**问题描述**:
- 有些使用 `jwt.verify()`
- 有些使用 `getUserFromRequest()`
- 验证逻辑不统一

**修复建议**:
- 创建统一的身份验证中间件
- 统一JWT验证和解析逻辑

## 低风险 (Low)

### 9. 缺少速率限制
**问题描述**:
- 没有对API调用进行速率限制
- 可能遭受暴力攻击

**修复建议**:
- 实施API速率限制
- 对敏感操作添加额外保护

### 10. 缺少输入清洗
**问题描述**:
- 用户输入没有被充分清洗
- 可能导致XSS或其他注入攻击

**修复建议**:
- 对用户输入进行HTML编码
- 使用白名单验证输入值

## 安全最佳实践建议

### 1. 实施统一错误处理
```typescript
// 创建统一的API响应格式
export function createErrorResponse(message: string, status: number = 500) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}
```

### 2. 添加请求验证中间件
```typescript
// 使用Zod或类似库验证请求数据
import { z } from 'zod';

const RechargeSchema = z.object({
  packageId: z.string().uuid(),
  paymentMethod: z.enum(['alif_mobi', 'dc_bank', 'mock'])
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = RechargeSchema.parse(body);
  // ...
}
```

### 3. 实施权限控制
```typescript
// 创建权限装饰器或中间件
export function requireAdmin(handler: Handler) {
  return async (req: NextRequest, params: any) => {
    const user = await verifyAdminToken(req);
    if (!user) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }
    return handler(req, params);
  };
}
```

### 4. 添加日志和监控
```typescript
// 添加安全事件日志
import { logSecurityEvent } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // 处理请求
  } catch (error) {
    await logSecurityEvent({
      type: 'api_error',
      endpoint: '/payment/recharge',
      error: error.message,
      timestamp: new Date()
    });
    // 返回安全错误信息
  }
}
```

## 修复优先级

### 🔥 立即修复 (1-2天)
1. 管理员初始化端点权限控制
2. 管理员API权限验证
3. 错误信息泄露问题

### ⚡ 优先修复 (1周内)
4. 支付信息暴露
5. 系统设置存储安全
6. 统一事务处理

### 📋 计划修复 (1个月内)
7. 参数验证完善
8. 身份验证统一
9. 实施速率限制
10. 添加监控日志

## 总结

LuckyMart-TJ项目的API存在多个安全问题，主要集中在权限控制、错误处理和数据保护方面。建议按照优先级逐步修复这些问题，确保系统的安全性和稳定性。

## 审查者信息
- **审查日期**: 2025-10-30
- **审查范围**: 32个API端点
- **发现问题**: 10个主要安全问题
- **风险等级**: 3个严重，4个中等，3个低风险
