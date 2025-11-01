# UserProfile 组件使用说明

## 概述

UserProfile组件是一个完整的用户资料展示和编辑组件，支持多语言显示，包含用户基本信息、财务信息、活动统计等功能。

## 功能特性

- ✅ 用户头像、用户名、用户ID显示
- ✅ 余额、平台余额、总消费显示
- ✅ VIP等级和会员状态显示
- ✅ 支持用户资料编辑功能
- ✅ 多语言支持（中文、英文、俄语、塔吉克语）
- ✅ 响应式设计，适配移动端和桌面端
- ✅ 分标签页展示不同类型信息
- ✅ 快速操作和账户状态面板

## 安装依赖

确保项目已安装以下UI组件：
```bash
# UI组件
- ./components/ui/card.tsx
- ./components/ui/button.tsx
- ./components/ui/input.tsx
- ./components/ui/label.tsx
- ./components/ui/badge.tsx
- ./components/ui/tabs.tsx

# 类型定义
- ./types/index.ts

# 多语言支持
- ./src/i18n/useLanguageCompat.tsx
```

## 基本用法

### 1. 只展示模式（默认）

```tsx
import { UserProfile } from '@/components/UserProfile';

// 基础用法
<UserProfile />
```

### 2. 传入用户数据

```tsx
import { UserProfile } from '@/components/UserProfile';
import type { User } from '@/types';

const user: User = {
  id: 'user-1',
  telegramId: '123456789',
  username: 'demo_user',
  firstName: '张三',
  lastName: '李四',
  avatarUrl: 'https://example.com/avatar.jpg',
  language: 'zh',
  coinBalance: 1250.50,
  platformBalance: 320.00,
  vipLevel: 2,
  totalSpent: 5800.00,
  freeDailyCount: 3,
  lastFreeResetDate: new Date(),
  referralCode: 'REF2024',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date()
};

<UserProfile user={user} />
```

### 3. 支持编辑功能

```tsx
import { UserProfile } from '@/components/UserProfile';
import type { User } from '@/types';

const handleUpdate = async (updatedUser: Partial<User>) => {
  try {
    // 调用API更新用户信息
    const response = await fetch('/api/user/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    });
    
    if (!response.ok) {
      throw new Error('更新失败');
    }
    
    // 更新成功后的处理
    console.log('用户信息更新成功');
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error; // 重新抛出错误让组件处理
  }
};

<UserProfile 
  user={user}
  onUpdate={handleUpdate}
  editable={true}
/>
```

### 4. 只读模式

```tsx
<UserProfile 
  user={user}
  editable={false}
  className="readonly-mode"
/>
```

## 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `user` | `User \| undefined` | `undefined` | 用户数据对象 |
| `onUpdate` | `(updatedUser: Partial<User>) => Promise<void>` | `undefined` | 用户信息更新回调函数 |
| `editable` | `boolean` | `true` | 是否允许编辑 |
| `className` | `string` | `''` | 自定义CSS类名 |

## 界面结构

### 主界面布局
- **页面标题区**: 显示标题和编辑按钮
- **主体内容**: 分三列布局
  - 左列: 用户信息卡片（占2/3宽度）
  - 右列: 侧边信息卡片（占1/3宽度）

### 用户信息卡片
- **标签页切换**:
  - 基本信息: 用户姓名、用户名、Telegram ID、邀请码、注册时间
  - 财务信息: 余额、平台余额、总消费、VIP等级
  - 活动统计: 免费次数、语言偏好、更新时间等

### 侧边卡片
- **VIP状态**: 显示当前VIP等级和特权说明
- **快速操作**: 充值、邀请好友、交易记录、账户设置
- **账户状态**: 账户状态、认证状态、风险等级

## 编辑功能

### 支持编辑的字段
- `firstName` - 名字
- `lastName` - 姓氏  
- `username` - 用户名
- `avatarUrl` - 头像链接

### 编辑流程
1. 点击"编辑资料"按钮进入编辑模式
2. 修改相关字段
3. 点击"保存"或"取消"
4. 保存时调用`onUpdate`回调函数
5. 更新成功后退出编辑模式

### 表单验证
组件会在保存前进行基本的数据验证，确保字段不为空。

## 多语言支持

组件支持四种语言：
- 中文 (zh)
- 英文 (en)
- 俄语 (ru)
- 塔吉克语 (tg)

### 需要添加的翻译键值

```json
{
  "profile": {
    "title": "用户资料",
    "subtitle": "管理和查看您的个人信息",
    "edit": "编辑资料",
    "cancel": "取消",
    "save": "保存",
    "saving": "保存中...",
    "tab": {
      "basic": "基本信息",
      "financial": "财务信息",
      "activity": "活动统计"
    },
    "firstName": "名字",
    "lastName": "姓氏",
    "username": "用户名",
    "avatarUrl": "头像链接",
    "telegramId": "Telegram ID",
    "referralCode": "邀请码",
    "memberSince": "注册时间",
    "notSet": "未设置",
    "none": "无",
    "coinBalance": "余额",
    "platformBalance": "平台余额",
    "totalSpent": "总消费",
    "vipLevel": "VIP等级",
    "coinUnit": "币",
    "freeDailyCount": "今日免费次数",
    "language": "语言偏好",
    "lastUpdate": "最后更新",
    "freeResetDate": "免费次数重置",
    "vipStatus": "VIP状态",
    "vip": {
      "none": "普通用户",
      "level": "VIP {level}",
      "notVip": "您是普通用户",
      "benefits1": "享受基础特权",
      "benefits2": "享受高级特权",
      "benefits3": "享受至尊特权"
    },
    "quickActions": "快速操作",
    "actions": {
      "recharge": "充值",
      "invite": "邀请好友",
      "history": "交易记录",
      "settings": "账户设置"
    },
    "accountStatus": "账户状态",
    "status": "状态",
    "status.active": "正常",
    "verified": "认证",
    "verified.yes": "已认证",
    "riskLevel": "风险等级",
    "riskLevel.low": "低风险"
  }
}
```

## 样式定制

组件使用Tailwind CSS，可以轻松定制样式：

### 自定义类名
```tsx
<UserProfile 
  className="custom-user-profile" 
/>
```

### CSS样式示例
```css
.custom-user-profile .card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.custom-user-profile .vip-badge {
  background: linear-gradient(45deg, #ffd700, #ffed4e);
}
```

## 最佳实践

### 1. 数据加载
- 在父组件中处理数据加载状态
- 为组件传入完整的用户数据
- 处理数据为空的情况

### 2. 错误处理
- 在`onUpdate`回调中处理API错误
- 组件会自动显示错误提示
- 考虑添加重试机制

### 3. 性能优化
- 避免不必要的组件重新渲染
- 合理使用`useCallback`和`useMemo`
- 大量用户数据时考虑虚拟化

### 4. 移动端适配
- 组件自动响应式布局
- 在移动端时侧边栏会移到下方
- 保持良好的触摸体验

## 示例页面

```tsx
// pages/profile.tsx
import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/components/UserProfile';
import type { User } from '@/types';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载用户数据
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user/profile');
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('加载用户数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleUpdate = async (updatedUser: Partial<User>) => {
    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      
      if (response.ok) {
        // 更新本地状态
        setUser(prev => prev ? { ...prev, ...updatedUser } : null);
      } else {
        throw new Error('更新失败');
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <UserProfile 
        user={user || undefined}
        onUpdate={handleUpdate}
        editable={true}
      />
    </div>
  );
}
```

## 常见问题

### Q: 如何禁用编辑功能？
A: 设置`editable={false}`属性。

### Q: 如何自定义VIP等级颜色？
A: 修改`getVipLevelColor`函数中的样式类。

### Q: 如何添加新的编辑字段？
A: 在`UserProfileFormData`接口中添加新字段，并在编辑表单中处理。

### Q: 如何添加自定义操作按钮？
A: 在快速操作卡片中添加新的Button组件。

## 更新日志

- **v1.0.0** (2024-11-01): 初始版本发布
  - 支持用户资料展示和编辑
  - 多语言支持
  - 响应式设计
  - VIP状态展示
  - 财务信息展示

---

如有问题或建议，请联系开发团队。