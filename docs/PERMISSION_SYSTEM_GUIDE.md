# LuckyMart TJ 权限控制系统 - 完整实施文档

## 概述

本文档说明 LuckyMart TJ 管理后台权限控制系统的完整实现，包括组件、API、使用方法和最佳实践。

**实施时间**: 2025-10-31
**项目路径**: `/workspace/luckymart-tj/`

---

## 系统架构

### 1. 核心组件

| 组件/文件 | 路径 | 功能 |
|----------|------|------|
| AdminPermissionManager | lib/admin-permission-manager.ts | 权限管理核心类 |
| usePermissions | hooks/admin/usePermissions.ts | 权限钩子 |
| PermissionGuard | components/admin/PermissionGuard.tsx | 组件级权限守卫 |
| PagePermission | components/admin/PagePermission.tsx | 页面级权限控制 |
| DynamicMenu | components/admin/DynamicMenu.tsx | 基于权限的动态菜单 |

### 2. 权限定义

```typescript
export const AdminPermissions = {
  // 用户管理
  users: {
    read: () => ['users:read'],
    write: () => ['users:write'],
    delete: () => ['users:delete'],
    all: () => ['users:read', 'users:write', 'users:delete']
  },
  
  // 商品管理
  products: {
    read: () => ['products:read'],
    write: () => ['products:write'],
    delete: () => ['products:delete'],
    all: () => ['products:read', 'products:write', 'products:delete']
  },
  
  // 订单管理
  orders: {
    read: () => ['orders:read'],
    write: () => ['orders:write'],
    delete: () => ['orders:delete'],
    all: () => ['orders:read', 'orders:write', 'orders:delete']
  },
  
  // 抽奖管理
  lottery: {
    read: () => ['lottery:read'],
    write: () => ['lottery:write'],
    delete: () => ['lottery:delete'],
    all: () => ['lottery:read', 'lottery:write', 'lottery:delete']
  },
  
  // 提现管理
  withdrawals: {
    read: () => ['withdrawals:read'],
    write: () => ['withdrawals:write'],
    delete: () => ['withdrawals:delete'],
    all: () => ['withdrawals:read', 'withdrawals:write', 'withdrawals:delete']
  },
  
  // 统计权限
  stats: {
    read: () => ['stats:read']
  },
  
  // 设置权限
  settings: {
    read: () => ['settings:read'],
    write: () => ['settings:write'],
    all: () => ['settings:read', 'settings:write']
  },
  
  // 系统权限(仅超级管理员)
  system: {
    manage: () => ['system:manage']
  }
};
```

---

## 使用指南

### 1. 页面级权限控制

#### 方法一: 使用PagePermission组件

```typescript
'use client';

import { PagePermission } from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin-permission-manager';

function MyAdminPage() {
  // 页面内容
  return (
    <div>
      <h1>我的管理页面</h1>
      {/* 页面内容 */}
    </div>
  );
}

// 导出带权限控制的页面
export default function ProtectedMyAdminPage() {
  return (
    <PagePermission 
      permissions={AdminPermissions.products.read()}
      showFallback={true}  // 显示无权限提示而不是跳转
      redirectTo="/admin/dashboard"  // 无权限时跳转路径(如果showFallback=false)
    >
      <MyAdminPage />
    </PagePermission>
  );
}
```

#### 已实施的页面

| 页面 | 路径 | 权限要求 | 状态 |
|-----|------|----------|------|
| 数据分析中心 | /admin/analytics | stats:read | 已完成 |
| 用户增长中心 | /admin/growth-center | stats:read | 已完成 |
| 商业变现管理 | /admin/commerce | products:all | 已完成 |
| 组织架构管理 | /admin/organization | system:manage | 已完成 |

#### 待实施的页面

以下页面需要添加权限控制:

```typescript
// app/admin/users/page.tsx
export default function ProtectedUsersPage() {
  return (
    <PagePermission permissions={AdminPermissions.users.read()}>
      <UsersPage />
    </PagePermission>
  );
}

// app/admin/products/page.tsx
export default function ProtectedProductsPage() {
  return (
    <PagePermission permissions={AdminPermissions.products.read()}>
      <ProductsPage />
    </PagePermission>
  );
}

// app/admin/orders/page.tsx
export default function ProtectedOrdersPage() {
  return (
    <PagePermission permissions={AdminPermissions.orders.read()}>
      <OrdersPage />
    </PagePermission>
  );
}

// app/admin/withdrawals/page.tsx
export default function ProtectedWithdrawalsPage() {
  return (
    <PagePermission permissions={AdminPermissions.withdrawals.read()}>
      <WithdrawalsPage />
    </PagePermission>
  );
}

// app/admin/lottery/page.tsx
export default function ProtectedLotteryPage() {
  return (
    <PagePermission permissions={AdminPermissions.lottery.read()}>
      <LotteryPage />
    </PagePermission>
  );
}

// app/admin/settings/page.tsx
export default function ProtectedSettingsPage() {
  return (
    <PagePermission permissions={AdminPermissions.settings.read()}>
      <SettingsPage />
    </PagePermission>
  );
}

// app/admin/telegram-bot/page.tsx
export default function ProtectedTelegramBotPage() {
  return (
    <PagePermission permissions={AdminPermissions.settings.write()}>
      <TelegramBotPage />
    </PagePermission>
  );
}

// app/admin/show-off/page.tsx
export default function ProtectedShowOffPage() {
  return (
    <PagePermission permissions={AdminPermissions.settings.read()}>
      <ShowOffPage />
    </PagePermission>
  );
}

// 风控系列页面
export default function ProtectedRiskDashboardPage() {
  return (
    <PagePermission permissions={AdminPermissions.system.manage()}>
      <RiskDashboardPage />
    </PagePermission>
  );
}
```

---

### 2. 组件级权限控制

使用`PermissionGuard`组件保护页面内的特定组件:

```typescript
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { AdminPermissions } from '@/lib/admin-permission-manager';

function MyPage() {
  return (
    <div>
      <h1>我的页面</h1>
      
      {/* 只有拥有写权限的用户才能看到这个按钮 */}
      <PermissionGuard permissions={AdminPermissions.products.write()}>
        <button>创建商品</button>
      </PermissionGuard>
      
      {/* 只有拥有删除权限的用户才能看到这个按钮 */}
      <PermissionGuard permissions={AdminPermissions.products.delete()}>
        <button>删除商品</button>
      </PermissionGuard>
      
      {/* 需要所有权限 */}
      <PermissionGuard 
        permissions={AdminPermissions.products.all()}
        requireAll={true}
      >
        <div>高级功能</div>
      </PermissionGuard>
    </div>
  );
}
```

---

### 3. API权限控制

#### 标准方法 (推荐)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';

export async function GET(request: NextRequest) {
  const withPermission = AdminPermissionManager.createPermissionMiddleware({
    customPermissions: AdminPermissions.products.read()
  });

  return withPermission(async (request, admin) => {
    // admin 参数包含已验证的管理员信息
    // 业务逻辑
    const products = await getProducts();
    
    return NextResponse.json({
      success: true,
      data: products
    });
  })(request);
}

export async function POST(request: NextRequest) {
  const withPermission = AdminPermissionManager.createPermissionMiddleware({
    customPermissions: AdminPermissions.products.write()
  });

  return withPermission(async (request, admin) => {
    const body = await request.json();
    const product = await createProduct(body);
    
    return NextResponse.json({
      success: true,
      data: product
    });
  })(request);
}

export async function DELETE(request: NextRequest) {
  const withPermission = AdminPermissionManager.createPermissionMiddleware({
    customPermissions: AdminPermissions.products.delete()
  });

  return withPermission(async (request, admin) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    await deleteProduct(id);
    
    return NextResponse.json({
      success: true
    });
  })(request);
}
```

#### 超级管理员专属API

```typescript
export async function POST(request: NextRequest) {
  const withPermission = AdminPermissionManager.createPermissionMiddleware({
    requireSuperAdmin: true
  });

  return withPermission(async (request, admin) => {
    // 只有超级管理员才能执行
    return NextResponse.json({ success: true });
  })(request);
}
```

#### 已实施的API

| API端点 | 权限要求 | 状态 |
|---------|----------|------|
| /api/admin/analytics/realtime | stats:read | 已完成 |
| /api/admin/analytics/users | stats:read | 已完成 |
| /api/admin/analytics/business | stats:read | 已完成 |
| /api/admin/analytics/financial | stats:read | 已完成 |
| /api/admin/growth/metrics | stats:read | 已完成 |
| /api/admin/growth/segments | stats:read | 已完成 |
| /api/admin/permissions/my-permissions | 基础管理员 | 已完成 |

#### 待实施的API

需要为以下API目录添加权限控制:

```
app/api/admin/
├── organization/*        - system:manage
├── telegram/*            - settings:write
├── products/*            - products:read/write/delete
├── orders/*              - orders:read/write/delete
├── users/*               - users:read/write/delete
├── withdrawals/*         - withdrawals:read/write/delete
├── lottery/*             - lottery:read/write/delete
├── settings/*            - settings:read/write
└── risk-*/*              - system:manage
```

---

### 4. 使用usePermissions钩子

在客户端组件中检查权限:

```typescript
'use client';

import { usePermissions } from '@/hooks/admin/usePermissions';
import { AdminPermissions } from '@/lib/admin-permission-manager';

function MyComponent() {
  const { 
    adminInfo,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    loading
  } = usePermissions();

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <h2>欢迎, {adminInfo?.username}</h2>
      <p>角色: {adminInfo?.role}</p>
      
      {/* 检查单个权限 */}
      {hasPermission('products:write') && (
        <button>创建商品</button>
      )}
      
      {/* 检查多个权限(任一) */}
      {hasAnyPermission(['products:write', 'products:delete']) && (
        <button>编辑商品</button>
      )}
      
      {/* 检查多个权限(全部) */}
      {hasAllPermissions(AdminPermissions.products.all()) && (
        <button>完全管理</button>
      )}
      
      {/* 检查是否是超级管理员 */}
      {isSuperAdmin() && (
        <div>超级管理员专属功能</div>
      )}
    </div>
  );
}
```

---

### 5. 动态菜单系统

`DynamicMenu`组件会根据用户权限自动显示/隐藏菜单项:

```typescript
'use client';

import { DynamicMenu } from '@/components/admin/DynamicMenu';

function AdminLayout({ children }) {
  return (
    <div className="flex">
      <aside className="w-64 bg-white shadow">
        <DynamicMenu 
          className="p-4"
          onItemClick={() => console.log('菜单项被点击')}
        />
      </aside>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
```

菜单配置在`components/admin/DynamicMenu.tsx`中:

```typescript
const menuConfig: MenuItem[] = [
  {
    id: 'dashboard',
    title: '仪表板',
    icon: FiHome,
    path: '/admin/dashboard',
    permissions: []  // 所有人可见
  },
  {
    id: 'users',
    title: '用户管理',
    icon: FiUsers,
    path: '/admin/users',
    permissions: ['users:read']
  },
  // ... 更多菜单项
];
```

---

## 权限管理操作

### 1. 获取管理员权限

```typescript
const permissions = await AdminPermissionManager.getAdminPermissions(adminId);
// 返回: ['users:read', 'products:write', ...]
```

### 2. 授予权限

```typescript
const result = await AdminPermissionManager.grantPermission(
  adminId,
  'products',  // resource
  'write',     // action
  'super-admin-id',  // grantedBy
  '商品管理权限'  // permissionName (可选)
);

if (result.success) {
  console.log('权限已授予');
} else {
  console.error(result.error);
}
```

### 3. 撤销权限

```typescript
const result = await AdminPermissionManager.revokePermission(
  adminId,
  'products',  // resource
  'write'      // action
);
```

### 4. 刷新权限缓存

```typescript
const newPermissions = await AdminPermissionManager.refreshAdminPermissions(adminId);
```

---

## 权限验证流程

### 前端验证流程

```
用户访问页面
    ↓
PagePermission组件
    ↓
usePermissions钩子获取权限
    ↓
检查localStorage中的JWT token
    ↓
解析token获取权限列表
    ↓
调用API刷新最新权限 (可选)
    ↓
验证是否有所需权限
    ↓
有权限 → 显示页面
无权限 → 显示提示或跳转
```

### 后端验证流程

```
API请求
    ↓
AdminPermissionManager.createPermissionMiddleware
    ↓
验证JWT token
    ↓
从数据库加载管理员信息
    ↓
检查管理员是否激活
    ↓
检查是否是超级管理员
    ↓
验证特定权限
    ↓
权限通过 → 执行业务逻辑
权限不足 → 返回403错误
```

---

## 数据库表结构

### admin_permissions表

存储管理员的具体权限:

```sql
CREATE TABLE admin_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admins(id),
  resource VARCHAR(50) NOT NULL,       -- 资源类型: users, products, orders等
  action VARCHAR(50) NOT NULL,         -- 操作: read, write, delete等
  permission_name VARCHAR(100),        -- 权限名称
  granted_by VARCHAR(255),             -- 授权人
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(admin_id, resource, action)
);
```

### org_roles表

定义角色:

```sql
CREATE TABLE org_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  department_id UUID REFERENCES org_departments(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### role_permissions表

角色和权限的关联:

```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES org_roles(id),
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, resource, action)
);
```

---

## 最佳实践

### 1. 权限粒度

- **粗粒度**: 使用`*.all()`给予完整权限
- **细粒度**: 分别控制read/write/delete

```typescript
// 粗粒度 - 快速授权
<PagePermission permissions={AdminPermissions.products.all()}>

// 细粒度 - 精确控制
<PermissionGuard permissions={AdminPermissions.products.read()}>
  <ViewProduct />
</PermissionGuard>
<PermissionGuard permissions={AdminPermissions.products.write()}>
  <EditProduct />
</PermissionGuard>
<PermissionGuard permissions={AdminPermissions.products.delete()}>
  <DeleteButton />
</PermissionGuard>
```

### 2. 超级管理员

超级管理员自动拥有所有权限,无需单独配置:

```typescript
if (admin.role === 'super_admin') {
  // 自动通过所有权限检查
  return true;
}
```

### 3. 缓存策略

- 前端: 从JWT token中读取权限,定期刷新
- 后端: 每次请求都验证最新权限
- 权限变更后立即刷新缓存

### 4. 错误处理

```typescript
export async function POST(request: NextRequest) {
  const withPermission = AdminPermissionManager.createPermissionMiddleware({
    customPermissions: AdminPermissions.products.write()
  });

  return withPermission(async (request, admin) => {
    try {
      // 业务逻辑
      return NextResponse.json({ success: true });
    } catch (error) {
      // 业务错误处理
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  })(request);
}
```

### 5. 安全建议

- 所有API都必须进行权限验证
- 不要仅依赖前端权限控制
- 敏感操作记录审计日志
- 定期审查权限配置
- 权限变更后通知管理员

---

## 测试清单

### 前端测试

- [ ] 无权限用户无法看到受限菜单
- [ ] 无权限用户无法访问受限页面
- [ ] 无权限用户无法看到受限按钮
- [ ] 超级管理员可以访问所有页面
- [ ] 权限变更后立即生效

### 后端测试

- [ ] 无权限API调用返回403
- [ ] 有权限API调用正常执行
- [ ] 超级管理员可以调用所有API
- [ ] Token失效返回401
- [ ] 管理员被禁用后无法访问

### 集成测试

- [ ] 授予权限后立即生效
- [ ] 撤销权限后立即失效
- [ ] 角色权限正确继承
- [ ] 权限审计日志正确记录

---

## 故障排查

### 问题1: 用户有权限但仍然无法访问

**检查步骤**:
1. 确认JWT token未过期
2. 检查权限格式是否正确 (`resource:action`)
3. 清除浏览器localStorage重新登录
4. 检查API是否正确应用权限中间件

### 问题2: 权限变更不生效

**解决方案**:
1. 调用`refreshPermissions()`刷新前端缓存
2. 重新登录获取新token
3. 检查数据库权限是否正确更新

### 问题3: 超级管理员权限失效

**检查步骤**:
1. 确认`role`字段为`'super_admin'`
2. 检查token中的role信息
3. 确认管理员账户未被禁用

---

## 下一步工作

### 待完成的工作

1. **为所有页面添加权限控制**
   - 参考"待实施的页面"部分
   - 复制已完成页面的实现模式

2. **为所有API添加权限中间件**
   - 参考"待实施的API"部分
   - 批量更新所有API路由

3. **完善组织架构管理页面**
   - 添加权限分配界面
   - 实现角色和权限的批量操作
   - 添加权限变更历史记录

4. **权限初始化脚本**
   - 创建默认权限初始化SQL
   - 为现有管理员分配权限
   - 创建默认角色模板

5. **权限管理UI**
   - 可视化权限配置界面
   - 权限模板管理
   - 批量权限分配

---

## 总结

权限控制系统的核心组件已全部完成:

- 权限管理器类
- 权限钩子
- 权限守卫组件
- 页面权限组件
- 动态菜单组件
- 权限API

已为关键页面和API实施权限控制,其余页面和API可按照本文档的模式快速实施。

**关键文件**:
- `lib/admin-permission-manager.ts` - 核心权限管理
- `hooks/admin/usePermissions.ts` - 前端权限钩子
- `components/admin/PagePermission.tsx` - 页面权限控制
- `components/admin/PermissionGuard.tsx` - 组件权限控制
- `components/admin/DynamicMenu.tsx` - 动态菜单

---

**文档版本**: v1.0  
**最后更新**: 2025-10-31 20:50  
**作者**: MiniMax Agent
