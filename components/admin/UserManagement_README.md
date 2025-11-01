# UserManagement 组件使用说明

## 概述

UserManagement组件是一个完整的用户管理系统，提供全面的用户管理功能，包括用户列表、搜索筛选、状态管理、权限设置和批量操作等。

## 功能特性

### ✅ 核心功能
- **用户列表显示** - 展示用户基本信息、状态、角色等
- **用户详情查看** - 详细信息弹窗包含四个标签页：基本信息、财务信息、活动统计、风险评估
- **用户状态管理** - 支持激活、停用、封禁、暂停等状态操作
- **权限设置** - 角色管理：普通用户、VIP用户、管理员、超级管理员
- **搜索功能** - 支持用户名、Telegram ID、邀请码实时搜索
- **筛选功能** - 按状态、角色、风险等级、VIP等级进行筛选
- **批量操作** - 支持批量激活、停用、封禁、认证、设置VIP、导出数据等操作

### 📊 统计数据
- 总用户数
- 活跃用户数
- VIP用户数
- 封禁用户数
- 高风险用户数
- 总余额
- 平均消费

### 🎨 界面特性
- 响应式设计，支持桌面端和移动端
- 现代化UI设计，使用Tailwind CSS
- 直观的交互体验
- 支持分页浏览

## 组件结构

```typescript
export interface AdminUser {
  id: string;
  telegramId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  language: string;
  coinBalance: number;
  platformBalance: number;
  vipLevel: number;
  totalSpent: number;
  freeDailyCount: number;
  lastFreeResetDate: Date;
  referralCode?: string;
  createdAt: Date;
  updatedAt: Date;
  status: UserStatus;
  role: UserRole;
  loginCount: number;
  referralCount: number;
  isVerified: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  notes?: string;
}
```

## 使用方法

### 基础导入
```typescript
import { UserManagement } from '@/components/admin/UserManagement';
```

### 在页面中使用
```typescript
'use client';

import { UserManagement } from '@/components/admin/UserManagement';

export default function UsersPage() {
  return (
    <div className="container mx-auto p-4">
      <UserManagement />
    </div>
  );
}
```

### 作为组件属性传递
```typescript
<UserManagement className="custom-class" />
```

## 枚举类型

### UserStatus - 用户状态
```typescript
export enum UserStatus {
  ACTIVE = 'active',      // 正常
  INACTIVE = 'inactive',  // 未激活
  BANNED = 'banned',      // 已封禁
  SUSPENDED = 'suspended' // 已暂停
}
```

### UserRole - 用户角色
```typescript
export enum UserRole {
  USER = 'user',          // 普通用户
  VIP = 'vip',            // VIP用户
  ADMIN = 'admin',        // 管理员
  SUPER_ADMIN = 'super_admin' // 超级管理员
}
```

### BatchAction - 批量操作
```typescript
export enum BatchAction {
  ACTIVATE = 'activate',  // 激活用户
  DEACTIVATE = 'deactivate', // 停用用户
  BAN = 'ban',            // 封禁用户
  UNBAN = 'unban',        // 解封用户
  VERIFY = 'verify',      // 认证用户
  SET_VIP = 'set_vip',    // 设置为VIP
  EXPORT = 'export'       // 导出数据
}
```

## 组件特点

### 🔍 搜索和筛选
- 实时搜索：支持用户名、用户名、lastName、Telegram ID、邀请码搜索
- 多维度筛选：状态、角色、风险等级、VIP等级筛选
- 筛选条件重置功能

### 🎛️ 批量操作
- 支持选择多个用户
- 批量状态管理（激活、停用、封禁）
- 批量权限设置（认证、设置VIP）
- 数据导出功能

### 📋 用户详情
分为四个标签页：
1. **基本信息**：姓名、用户名、Telegram ID、语言、邀请码、注册时间
2. **财务信息**：余额、平台余额、总消费、VIP等级
3. **活动统计**：登录次数、邀请人数、免费抽奖次数、最后免费重置时间
4. **风险评估**：风险等级、账户状态、认证状态、用户角色、备注

### 📱 响应式设计
- 桌面端：多列布局
- 平板端：适配中等屏幕
- 移动端：单列堆叠布局

## API 集成说明

当前组件使用模拟数据，在实际项目中需要替换为真实API调用：

### 需要实现的API端点
- `GET /api/admin/users` - 获取用户列表（支持分页和筛选）
- `GET /api/admin/users/:id` - 获取用户详情
- `PATCH /api/admin/users/:id/status` - 更新用户状态
- `POST /api/admin/users/batch` - 批量操作

### 模拟数据替换示例
```typescript
// 替换 loadUsers 函数中的模拟数据
const loadUsers = async (page: number = 1) => {
  try {
    const token = localStorage.getItem('admin_token');
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      ...(filters.search && { search: filters.search }),
      ...(filters.status !== 'all' && { status: filters.status }),
      // ... 其他筛选条件
    });

    const response = await fetch(`/api/admin/users?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      setUsers(data.data.users);
      setStats(data.data.stats);
      // ... 其他数据处理
    }
  } catch (error) {
    console.error('加载用户数据失败:', error);
  }
};
```

## 样式自定义

组件使用Tailwind CSS，可以轻松自定义样式：

### 自定义主题色彩
```css
/* 在globals.css中覆盖默认颜色 */
:root {
  --color-primary: your-color;
  --color-secondary: your-color;
}
```

### 自定义组件样式
```typescript
<UserManagement className="custom-user-management" />
```

## 注意事项

1. **权限控制**：组件本身不包含权限验证，建议结合PermissionGuard使用
2. **数据分页**：当前实现分页功能，需要后端支持分页API
3. **搜索性能**：大数量用户时建议实现防抖搜索
4. **批量操作**：批量操作前建议添加确认对话框
5. **错误处理**：需要根据实际需求完善错误处理逻辑

## 扩展建议

1. **权限细粒度控制**：可以基于字段级别的权限控制
2. **高级筛选**：添加日期范围、金额范围等高级筛选条件
3. **用户头像**：支持用户头像显示
4. **操作日志**：记录用户管理操作日志
5. **数据导出**：支持Excel、CSV等格式导出
6. **实时更新**：使用WebSocket实现实时数据更新

## 更新日志

- **v1.0.0** - 初始版本，包含所有基础功能
- 支持用户列表、搜索、筛选、批量操作
- 响应式设计和现代化UI
- 完整的TypeScript类型定义