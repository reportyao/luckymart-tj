# AdminPanel 组件

## 概述

AdminPanel 是一个通用的管理面板组件，为管理员提供了一个集中化的管理界面。它包含管理功能菜单、快速操作区域、系统状态监控和通知中心等功能。

## 功能特性

### 🎯 核心功能
- **管理功能菜单** - 左侧导航菜单，包含所有主要管理功能
- **快速操作区域** - 常用管理操作的快速访问入口
- **系统状态监控** - 实时显示系统各项指标状态
- **通知中心** - 系统通知和提醒的统一管理
- **实时数据更新** - 支持实时数据刷新和状态更新

### 🎨 界面特性
- **响应式设计** - 适配不同屏幕尺寸
- **标签页布局** - 总览、快速操作、通知中心三个标签页
- **状态指示** - 清晰的状态指示器和颜色编码
- **交互反馈** - 丰富的悬停效果和点击反馈

## 组件接口

### Props

```typescript
interface AdminPanelProps {
  className?: string;              // 自定义样式类
  title?: string;                  // 面板标题，默认为"管理面板"
  showRealTimeStatus?: boolean;    // 是否显示实时状态更新
  refreshInterval?: number;        // 刷新间隔（秒），默认为30
  onRefresh?: () => void;          // 刷新回调函数
  customMenuItems?: MenuItem[];    // 自定义菜单项
  customQuickActions?: QuickAction[]; // 自定义快速操作
  hideSystemStatus?: boolean;      // 是否隐藏系统状态区域
  hideNotifications?: boolean;     // 是否隐藏通知中心
}
```

### 数据接口

#### MenuItem
```typescript
interface MenuItem {
  id: string;                      // 唯一标识符
  title: string;                   // 菜单标题
  icon: React.ComponentType<{ className?: string }>; // 图标组件
  path: string;                    // 跳转路径
  badge?: number;                  // 徽章数字（用于显示待处理数量）
  children?: MenuItem[];           // 子菜单项
  permissions?: string[];          // 权限要求
}
```

#### QuickAction
```typescript
interface QuickAction {
  id: string;                      // 唯一标识符
  title: string;                   // 操作标题
  description: string;             // 操作描述
  icon: React.ComponentType<{ className?: string }>; // 图标组件
  path: string;                    // 跳转路径
  color: string;                   // 样式颜色类
  badge?: number;                  // 徽章数字
  permissions?: string[];          // 权限要求
}
```

#### SystemStatus
```typescript
interface SystemStatus {
  cpu: number;                     // CPU使用率 (0-100)
  memory: number;                  // 内存使用率 (0-100)
  disk: number;                    // 磁盘使用率 (0-100)
  network: number;                 // 网络状态 (0-100)
  database: number;                // 数据库状态 (0-100)
  api: number;                     // API状态 (0-100)
}
```

#### NotificationItem
```typescript
interface NotificationItem {
  id: string;                      // 唯一标识符
  type: 'info' | 'warning' | 'error' | 'success'; // 通知类型
  title: string;                   // 通知标题
  message: string;                 // 通知内容
  timestamp: Date;                 // 时间戳
  read: boolean;                   // 是否已读
}
```

#### SystemMetric
```typescript
interface SystemMetric {
  label: string;                   // 指标标签
  value: string | number;          // 指标值
  change?: number;                 // 变化百分比
  trend: 'up' | 'down' | 'stable'; // 趋势方向
  color: string;                   // 显示颜色
}
```

## 默认数据

### 管理菜单项
- 仪表盘 - `/admin/dashboard`
- 用户管理 - `/admin/users`
- 商品管理 - `/admin/products`
- 订单管理 - `/admin/orders` (显示待处理数量徽章)
- 开奖管理 - `/admin/lottery`
- 财务管理 - `/admin/financial-dashboard`
- 数据分析 - `/admin/analytics`
- 风险控制 - `/admin/risk-dashboard` (显示风险提醒徽章)
- 系统设置 - `/admin/system-settings`

### 快速操作
- 新增商品 - 创建新商品
- 处理订单 - 批量处理待处理订单 (显示待处理数量徽章)
- 审核提现 - 处理提现申请 (显示待审核数量徽章)
- 发送通知 - 向用户发送通知
- 导出数据 - 导出系统数据和报表
- 系统维护 - 系统维护和清理操作

### 系统指标
- 在线用户 - 显示当前在线用户数
- 今日订单 - 显示当日订单数量
- 系统负载 - 显示系统负载百分比
- 错误率 - 显示系统错误率

### 系统状态
- CPU使用率
- 内存使用率
- 磁盘使用率
- 网络状态
- 数据库状态
- API状态

## 使用方法

### 基本用法

```tsx
import { AdminPanel } from '@/components/admin';

export default function AdminPage() {
  return (
    <div>
      <AdminPanel />
    </div>
  );
}
```

### 自定义标题

```tsx
<AdminPanel title="运营管理面板" />
```

### 自定义菜单和操作

```tsx
import { AdminPanel } from '@/components/admin';

const customMenuItems = [
  {
    id: 'custom-feature',
    title: '自定义功能',
    icon: CustomIcon,
    path: '/admin/custom'
  }
];

const customQuickActions = [
  {
    id: 'custom-action',
    title: '自定义操作',
    description: '执行自定义操作',
    icon: CustomActionIcon,
    path: '/admin/custom-action',
    color: 'text-blue-600 hover:text-blue-700'
  }
];

export default function CustomAdminPage() {
  return (
    <AdminPanel 
      customMenuItems={customMenuItems}
      customQuickActions={customQuickActions}
      hideSystemStatus={true}
    />
  );
}
```

### 隐藏特定功能

```tsx
<AdminPanel 
  hideSystemStatus={true}
  hideNotifications={false}
  showRealTimeStatus={false}
/>
```

## 样式定制

### 颜色方案
- **成功状态**: 绿色 (`text-green-600`, `bg-green-100`)
- **警告状态**: 黄色 (`text-yellow-600`, `bg-yellow-100`)
- **错误状态**: 红色 (`text-red-600`, `bg-red-100`)
- **信息状态**: 蓝色 (`text-blue-600`, `bg-blue-100`)

### 响应式断点
- `sm`: 640px+
- `md`: 768px+
- `lg`: 1024px+
- `xl`: 1280px+

## 性能优化

### 实时更新
- 默认30秒刷新间隔
- 可通过 `showRealTimeStatus` 和 `refreshInterval` 配置
- 使用 `useCallback` 优化数据获取函数

### 组件渲染
- 使用 `React.memo` 避免不必要的重渲染
- 条件渲染减少DOM复杂度
- 虚拟化长列表（如有需要）

## 扩展功能

### 权限控制
```tsx
const menuWithPermission = [
  {
    ...menuItem,
    permissions: ['admin', 'user:read']
  }
];
```

### 主题定制
```tsx
// 通过 className 属性覆盖默认样式
<AdminPanel className="custom-admin-panel" />
```

### 事件处理
```tsx
const handleRefresh = () => {
  // 自定义刷新逻辑
  console.log('Panel refreshed');
};

<AdminPanel onRefresh={handleRefresh} />
```

## 注意事项

1. **数据源**: 当前使用模拟数据，需要接入实际API
2. **权限控制**: 菜单项和快速操作的权限控制需要结合实际权限系统
3. **错误处理**: 组件包含基本的错误处理和重试机制
4. **性能**: 大量数据时考虑添加虚拟滚动或分页
5. **国际化**: 如需多语言支持，需要配合i18n系统使用

## 相关组件

- `AdminDashboard` - 详细的数据仪表盘组件
- `ProductManagement` - 商品管理组件
- `UserManagement` - 用户管理组件
- `SystemSettings` - 系统设置组件
- `AnalyticsPanel` - 数据分析面板组件

## 更新日志

### v1.0.0 (2025-11-01)
- ✨ 初始版本发布
- 🎯 实现基础管理面板功能
- 🎨 添加响应式设计
- ⚡ 支持实时数据更新
- 🔔 实现通知中心功能