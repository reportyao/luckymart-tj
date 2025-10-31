# LuckyMart TJ 权限控制系统 - 快速参考

## 核心文件清单

```
权限系统核心文件 (6个):
├── lib/admin-permission-manager.ts          (权限管理核心)
├── hooks/admin/usePermissions.ts            (权限钩子)
├── components/admin/PermissionGuard.tsx     (组件守卫)
├── components/admin/PagePermission.tsx      (页面守卫)
├── components/admin/DynamicMenu.tsx         (动态菜单)
└── app/api/admin/permissions/my-permissions/route.ts

文档和脚本:
├── docs/PERMISSION_SYSTEM_GUIDE.md          (使用指南 791行)
├── docs/PERMISSION_IMPLEMENTATION_SUMMARY.md (实施总结 470行)
├── docs/PERMISSION_PROJECT_REPORT.md        (完成报告 540行)
└── db/init_permissions.sql                   (初始化脚本 314行)
```

---

## 3行代码实现权限控制

### 页面权限

```typescript
import { PagePermission } from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin-permission-manager';

export default () => (
  <PagePermission permissions={AdminPermissions.products.read()}>
    <YourPage />
  </PagePermission>
);
```

### API权限

```typescript
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';

export async function GET(req) {
  return AdminPermissionManager.createPermissionMiddleware({
    customPermissions: AdminPermissions.products.read()
  })(async (req, admin) => {
    return NextResponse.json({ success: true });
  })(req);
}
```

### 组件权限

```typescript
import { PermissionGuard } from '@/components/admin/PermissionGuard';

<PermissionGuard permissions={['products:write']}>
  <button>创建商品</button>
</PermissionGuard>
```

---

## 权限定义速查表

| 资源 | 读取 | 写入 | 删除 | 全部 |
|-----|------|------|------|------|
| users | users:read | users:write | users:delete | .all() |
| products | products:read | products:write | products:delete | .all() |
| orders | orders:read | orders:write | orders:delete | .all() |
| lottery | lottery:read | lottery:write | lottery:delete | .all() |
| withdrawals | withdrawals:read | withdrawals:write | withdrawals:delete | .all() |
| stats | stats:read | - | - | - |
| settings | settings:read | settings:write | - | .all() |
| system | - | - | - | system:manage |

---

## 常用代码片段

### usePermissions钩子

```typescript
const { 
  adminInfo,           // 管理员信息
  permissions,         // 权限列表
  hasPermission,       // 检查单个权限
  hasAnyPermission,    // 检查任一权限
  hasAllPermissions,   // 检查所有权限
  isSuperAdmin,        // 是否超管
  loading              // 加载状态
} = usePermissions();
```

### 条件渲染

```typescript
{hasPermission('products:write') && <CreateButton />}
{hasAnyPermission(['products:write', 'products:delete']) && <EditButton />}
{isSuperAdmin() && <AdminPanel />}
```

---

## 权限初始化 (3步)

### 步骤1: 获取管理员ID
```sql
SELECT id, username FROM admins WHERE username = '你的用户名';
```

### 步骤2: 替换脚本中的ID
打开`db/init_permissions.sql`,全局替换`YOUR_ADMIN_ID`为实际ID

### 步骤3: 执行SQL
在Supabase SQL Editor中执行整个脚本

---

## 待完成页面列表

快速复制使用:

```typescript
// users
<PagePermission permissions={AdminPermissions.users.read()}>

// products  
<PagePermission permissions={AdminPermissions.products.read()}>

// orders
<PagePermission permissions={AdminPermissions.orders.read()}>

// withdrawals
<PagePermission permissions={AdminPermissions.withdrawals.read()}>

// lottery
<PagePermission permissions={AdminPermissions.lottery.read()}>

// settings
<PagePermission permissions={AdminPermissions.settings.read()}>

// telegram-bot
<PagePermission permissions={AdminPermissions.settings.write()}>

// show-off
<PagePermission permissions={AdminPermissions.settings.read()}>

// invitations
<PagePermission permissions={AdminPermissions.users.read()}>

// stats相关 (analytics, growth, financial, user-analytics, product-analytics, cost-monitoring)
<PagePermission permissions={AdminPermissions.stats.read()}>

// risk相关 (risk-dashboard, risk-rules, risk-users, risk-events)
<PagePermission permissions={AdminPermissions.system.manage()}>
```

---

## 待完成API列表

快速复制使用:

```typescript
// 基础模板
export async function GET(request: NextRequest) {
  const withPermission = AdminPermissionManager.createPermissionMiddleware({
    customPermissions: AdminPermissions.资源.操作()
  });
  return withPermission(async (request, admin) => {
    // 业务逻辑
  })(request);
}

// 常用权限:
products.read()      // 商品查看
products.write()     // 商品创建/更新
products.delete()    // 商品删除
orders.read()        // 订单查看
orders.write()       // 订单处理
users.read()         // 用户查看
withdrawals.write()  // 提现审核
stats.read()         // 数据查看
settings.write()     // 设置管理
system.manage()      // 系统管理
```

---

## 故障排查速查

| 问题 | 检查项 | 解决方案 |
|-----|--------|----------|
| 有权限但显示无权限 | Token是否过期 | 重新登录 |
| 超管权限失效 | role字段值 | 确认为'super_admin' |
| API返回403 | 中间件是否应用 | 检查代码 |
| 菜单不显示 | permissions配置 | 检查menuConfig |
| 权限变更不生效 | 缓存问题 | 调用refreshPermissions() |

---

## 文档导航

- 详细使用: `docs/PERMISSION_SYSTEM_GUIDE.md`
- 实施总结: `docs/PERMISSION_IMPLEMENTATION_SUMMARY.md`
- 完成报告: `docs/PERMISSION_PROJECT_REPORT.md`
- 初始化: `db/init_permissions.sql`

---

## 统计数据

- 核心组件: 5个 (645行新增代码)
- 已实施页面: 4个
- 已实施API: 7个
- 文档总计: 1,801行
- 菜单配置: 21个菜单项
- 权限类型: 8大类

---

**版本**: v1.0  
**更新**: 2025-10-31 20:50  
**状态**: 核心完成
