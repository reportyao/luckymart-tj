# 管理员权限验证强化指南

## 概述

本指南描述了如何强化所有 `/api/admin/*` 接口的管理员权限验证，使用 `getAdminFromRequest()` 替代 `getUserFromRequest()`，并实施基于权限的访问控制。

## 🔧 主要改进

### 1. 新的权限管理系统
- ✅ 创建了 `admin-permission-manager.ts` 高级权限管理工具
- ✅ 创建了 `admin-auth-middleware.ts` 权限验证中间件
- ✅ 创建了 `admin_permissions` 数据库表和权限管理机制
- ✅ 修复了所有管理员API的权限验证问题

### 2. 权限验证方法

#### 传统方法（已废弃）：
```typescript
// ❌ 旧方法 - 使用用户Token验证管理员
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
}
```

#### 新方法（推荐）：
```typescript
// ✅ 新方法 - 使用管理员权限验证
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // 验证管理员权限
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({
      success: false,
      error: '管理员权限验证失败'
    }, { status: 403 });
  }

  // 检查特定权限
  const hasPermission = admin.permissions.includes('users:read') || admin.role === 'super_admin';
  if (!hasPermission) {
    return NextResponse.json({
      success: false,
      error: '权限不足：无法查看用户列表'
    }, { status: 403 });
  }
}
```

### 3. 权限中间件使用示例

#### 使用高级权限管理工具：
```typescript
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';

export async function GET(request: NextRequest) {
  const withUserPermission = AdminPermissionManager.createPermissionMiddleware({
    customPermissions: AdminPermissions.users.read()
  });
  
  return withUserPermission(async (request, admin) => {
    // 业务逻辑
    const users = await prisma.users.findMany();
    return NextResponse.json({ success: true, data: users });
  })(request);
}
```

#### 使用装饰器中间件：
```typescript
import { requireAdminPermission } from '@/lib/admin-auth-middleware';

export async function GET(request: NextRequest) {
  const withAdminCheck = requireAdminPermission('users', 'read');
  
  return withAdminCheck(async (request, admin) => {
    // 业务逻辑
    const users = await prisma.users.findMany();
    return NextResponse.json({ success: true, data: users });
  })(request);
}
```

## 📊 权限管理结构

### 角色层级：
- **super_admin**: 超级管理员，拥有所有权限
- **admin**: 普通管理员，根据分配权限访问

### 权限分类：
```
users:read        # 查看用户列表
users:write       # 管理用户
users:delete      # 删除用户

products:read     # 查看商品
products:write    # 创建/编辑商品
products:delete   # 删除商品

orders:read       # 查看订单
orders:write      # 处理订单
orders:delete     # 删除订单

lottery:read      # 查看抽奖
lottery:write     # 管理抽奖
lottery:delete    # 删除抽奖

withdrawals:read  # 查看提现
withdrawals:write # 审核提现
withdrawals:delete # 删除提现申请

stats:read        # 查看统计数据

settings:read     # 查看设置
settings:write    # 修改设置

system:manage     # 系统管理（仅超级管理员）
```

## 🔧 修复的API列表

### 1. 管理员登录 API
- **路径**: `/api/admin/login`
- **修复**: 使用 `JWT_ADMIN_SECRET` 生成管理员专用Token
- **改进**: 支持权限系统，登录时返回管理员权限信息

### 2. 用户管理 API
- **路径**: `/api/admin/users`
- **修复**: 使用 `getAdminFromRequest()` 替代 `getUserFromRequest()`
- **权限**: 需要 `users:read` 权限

### 3. 商品管理 API
- **路径**: `/api/admin/products`
- **修复**: 完整的权限验证和数据库访问
- **权限**: 
  - GET: `products:read`
  - POST: `products:write`
  - PUT: `products:write`
  - DELETE: `products:delete`

### 4. 订单管理 API
- **路径**: `/api/admin/orders`
- **修复**: 使用Prisma替代Supabase，统一数据库访问
- **权限**: 
  - GET: `orders:read`
  - POST: `orders:write`

### 5. 抽奖管理 API
- **路径**: `/api/admin/lottery/rounds`
- **修复**: 权限验证和查询优化
- **权限**: 需要 `lottery:read` 权限

### 6. 提现管理 API
- **路径**: `/api/admin/withdrawals`
- **修复**: 使用事务处理审核操作
- **权限**: 
  - GET: `withdrawals:read`
  - POST: `withdrawals:write`

### 7. 统计 API
- **路径**: `/api/admin/stats`
- **修复**: 权限验证和性能优化
- **权限**: 需要 `stats:read` 权限

### 8. 设置 API
- **路径**: `/api/admin/settings`
- **修复**: 完善的权限检查
- **权限**: 
  - GET: `settings:read`
  - POST: `settings:write`

## 🗄️ 数据库架构

### 管理员权限表
```sql
CREATE TABLE admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,     -- users, products, orders等
    action VARCHAR(50) NOT NULL,        -- read, write, delete等
    granted_by UUID REFERENCES admins(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(admin_id, resource, action)
);
```

### 默认权限分配
- **超级管理员**: 自动获得所有权限
- **普通管理员**: 根据角色分配基础权限

## 🚀 部署指南

### 1. 数据库迁移
```bash
# 应用权限管理迁移
psql -d your_database -f supabase/migrations/999999_create_admin_permissions_migration.sql
```

### 2. 环境变量
确保设置以下环境变量：
```env
JWT_ADMIN_SECRET=your_admin_jwt_secret_here
```

### 3. 验证部署
- 测试管理员登录是否返回权限信息
- 验证各API的权限检查是否生效
- 确认权限不足时返回正确的错误响应

## 🛡️ 安全最佳实践

### 1. Token管理
- 使用独立的 `JWT_ADMIN_SECRET` 生成管理员Token
- Token有效期设置为8小时
- 实施Token刷新机制

### 2. 权限验证
- 所有管理员API必须验证权限
- 使用最小权限原则
- 定期审核和更新权限分配

### 3. 错误处理
- 提供清晰的权限错误信息
- 记录权限验证失败日志
- 防止权限枚举攻击

### 4. 监控和审计
- 记录管理员操作日志
- 监控权限使用情况
- 定期生成权限报告

## 📝 测试用例

### 管理员登录测试
```typescript
// 测试权限返回
const response = await fetch('/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'password' })
});

const data = await response.json();
console.log(data.admin.permissions); // 应包含权限数组
```

### 权限验证测试
```typescript
// 测试权限不足
const response = await fetch('/api/admin/users', {
  headers: { 'Authorization': 'Bearer <user_token>' }
});

// 应返回403 Forbidden
```

### API响应格式
```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}

// 权限错误响应
{
  "success": false,
  "error": "权限不足：无法查看用户列表",
  "code": "INSUFFICIENT_PERMISSIONS",
  "required": ["users:read"],
  "missing": ["users:read"]
}

// 认证错误响应
{
  "success": false,
  "error": "管理员权限验证失败",
  "code": "ADMIN_UNAUTHORIZED"
}
```

## 🔄 后续维护

### 1. 定期审计
- 检查管理员权限分配的合理性
- 清理无效的权限记录
- 更新权限策略

### 2. 性能优化
- 实施权限缓存机制
- 优化权限验证查询
- 监控API响应时间

### 3. 功能扩展
- 添加权限委托机制
- 支持临时权限
- 实施权限审批流程

---

通过以上改进，系统现在具备了完整的管理员权限验证机制，确保只有具有适当权限的管理员才能访问相应的API端点。