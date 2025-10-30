# LuckyMart 认证系统安全升级

## 🔒 安全修复概述

本次修复解决了 `luckymart-tj/lib/auth.ts` 中的JWT和认证安全问题，引入了业界最佳实践和安全标准。

## 🛡️ 主要安全改进

### 1. Telegram WebApp 数据验证增强
- **添加 auth_date 时效性验证**：5分钟认证窗口
- **哈希验证增强**：完整的数据完整性检查
- **用户信息完整性验证**：确保必要字段存在

```typescript
// 使用示例
const user = validateTelegramWebAppData(initData);
// 自动验证auth_date时效性和数据完整性
```

### 2. Token 存储方式改进
- **从 localStorage 改为 HttpOnly Cookie**
- **Secure 标志**：仅通过HTTPS传输
- **SameSite=strict**：防止CSRF攻击

```typescript
// Cookie 设置示例
response.cookies.set('access_token', token, {
  httpOnly: true,        // 无法通过JavaScript访问
  secure: true,          // 仅HTTPS
  sameSite: 'strict',    // CSRF保护
  maxAge: 15 * 60,       // 15分钟
  path: '/'
});
```

### 3. 双 Token 机制
- **访问 Token**：15分钟有效期
- **刷新 Token**：7天有效期
- **自动刷新**：过期前5分钟预警

```typescript
// 生成 Token 对
const tokenPair = generateTokenPair(userId, telegramId);
// 返回 { accessToken, refreshToken, expiresIn }
```

### 4. 管理员权限系统
- **基于权限的访问控制**：细粒度权限管理
- **角色验证**：admin 和 super_admin
- **权限中间件**：可配置权限要求

```typescript
// 权限装饰器示例
@requirePermissions(['user:read', 'user:delete'])
async function deleteUser(request: NextRequest) {
  // 逻辑处理
}
```

### 5. 安全最佳实践

#### 密码安全
```typescript
// 密码强度验证
const result = validatePasswordStrength(password);
if (!result.isValid) {
  // 显示改进建议
  console.log(result.feedback);
}
```

#### 速率限制
```typescript
// API 速率限制
const rateLimit = checkRateLimit(userId, 5, 15 * 60 * 1000);
if (!rateLimit.allowed) {
  return new Response('Too Many Requests', { status: 429 });
}
```

#### 安全响应头
```typescript
// 自动设置安全头
setSecurityHeaders(response);
// 添加 CSP, X-Frame-Options, X-XSS-Protection 等
```

## 🔧 环境变量配置

在 `.env` 文件中添加以下环境变量：

```bash
# JWT 密钥（必需）
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=your_refresh_secret_key_minimum_32_characters
JWT_ADMIN_SECRET=your_admin_secret_key_minimum_32_characters

# Telegram Bot Token（必需）
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# 环境配置
NODE_ENV=production  # 生产环境
```

## 📝 使用指南

### 1. 基础认证

```typescript
import { withAuth } from '@/lib/auth';

// 使用认证中间件
export const GET = withAuth(async (request: NextRequest, user) => {
  return NextResponse.json({ user });
});
```

### 2. 管理员认证

```typescript
import { withAdminAuth } from '@/lib/auth';

// 要求特定权限
export const POST = withAdminAuth(['user:delete'])(async (request, admin) => {
  // 管理员操作
});
```

### 3. Token 刷新

```typescript
// 前端示例
async function refreshToken() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include' // 包含Cookie
  });
  
  const data = await response.json();
  return data;
}
```

### 4. 用户登出

```typescript
// 前端示例
async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  
  // 清除本地状态
  localStorage.clear();
}
```

## 🏗️ 文件结构

```
luckymart-tj/
├── lib/
│   └── auth.ts                 # 核心认证逻辑
├── app/api/auth/
│   ├── telegram/route.ts       # Telegram认证
│   ├── refresh/route.ts        # Token刷新
│   └── logout/route.ts         # 用户登出
└── test_auth.ts               # 认证系统测试
```

## 🔍 API 端点

### POST /api/auth/telegram
Telegram WebApp认证
- **请求体**： `{ initData: string }`
- **响应**： `{ token, user, isNewUser }`

### POST /api/auth/refresh
刷新访问Token
- **请求**：自动从Cookie获取refresh_token
- **响应**： `{ accessToken, expiresIn, refreshToken }`

### POST /api/auth/logout
用户登出
- **请求**：清除认证Cookie
- **响应**： `{ message: '登出成功' }`

## ⚡ 性能优化

1. **Token 缓存**：在内存中缓存已验证的Token
2. **速率限制**：防止暴力攻击
3. **分层的权限检查**：避免重复验证

## 🔒 安全清单

- ✅ JWT Token使用HttpOnly Cookie
- ✅ 所有Cookie启用Secure和SameSite
- ✅ Telegram认证数据有时效性验证
- ✅ 实施速率限制
- ✅ 密码强度验证
- ✅ CSRF保护
- ✅ 安全响应头
- ✅ 管理员权限分离
- ✅ 审计日志记录

## 🚨 注意事项

1. **生产环境必须启用HTTPS**
2. **定期轮换JWT密钥**
3. **监控异常登录尝试**
4. **实施适当的会话管理策略**
5. **数据库查询使用参数化语句**

## 🧪 测试

运行认证系统测试：
```bash
npx tsx test_auth.ts
```

## 📚 参考资料

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [RFC 7519 - JWT标准](https://tools.ietf.org/html/rfc7519)
- [Telegram Login Widget](https://core.telegram.org/widgets/login)

## 🤝 贡献

如果发现安全问题或需要改进，请创建Issue或提交Pull Request。

---

**安全版本**: v2.0  
**最后更新**: 2025-10-31  
**维护者**: LuckyMart Security Team