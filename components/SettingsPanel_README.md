# SettingsPanel 组件使用指南

## 概述

`SettingsPanel` 是一个功能完整的设置管理组件，支持多种设置类别和交互模式。该组件遵循项目的设计规范，提供统一的用户体验。

## 功能特性

### 核心功能
- ✅ **多语言切换**: 完整支持项目的多语言系统
- ✅ **通知设置**: 夺宝、订单、营销、邮件、短信通知控制
- ✅ **隐私设置**: 个人资料可见性、在线状态、私信权限等
- ✅ **账户设置**: 用户信息管理、双因素认证、自动登出配置
- ✅ **数据持久化**: 本地存储设置，支持API集成
- ✅ **表单验证**: 输入验证和错误处理
- ✅ **响应式设计**: 适配移动端和桌面端

### 交互模式
- 📱 **独立页面模式**: 作为完整页面使用
- 🪟 **模态窗口模式**: 以弹窗形式显示
- 💾 **自动保存**: 设置更改时自动检测并提示
- 🔄 **重置功能**: 一键恢复默认设置

## 安装与导入

```tsx
import SettingsPanel from '@/components/SettingsPanel';
```

## 基本用法

### 1. 独立页面模式

```tsx
import SettingsPanel from '@/components/SettingsPanel';

function SettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <SettingsPanel />
    </div>
  );
}
```

### 2. 模态窗口模式

```tsx
import { useState } from 'react';
import SettingsPanel from '@/components/SettingsPanel';

function MyComponent() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <Button onClick={() => setShowSettings(true)}>
        打开设置
      </Button>
      
      {showSettings && (
        <SettingsPanel 
          isModal={true}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
```

## API 属性

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `className` | `string` | `''` | 自定义CSS类名 |
| `isModal` | `boolean` | `false` | 是否以模态窗口形式显示 |
| `onClose` | `() => void` | `undefined` | 关闭回调函数（模态模式必需） |

## 数据结构

### 设置数据类型

```typescript
interface SettingsData {
  language: string;
  notifications: {
    lottery: boolean;
    orders: boolean;
    promotional: boolean;
    email: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    dataSharing: boolean;
  };
  account: {
    username: string;
    email: string;
    phone: string;
    twoFactorEnabled: boolean;
    autoLogout: number; // minutes
  };
}
```

### 默认设置

```typescript
const defaultSettings: SettingsData = {
  language: 'zh-CN',
  notifications: {
    lottery: true,
    orders: true,
    promotional: false,
    email: true,
    sms: false
  },
  privacy: {
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowDirectMessages: true,
    dataSharing: false
  },
  account: {
    username: '',
    email: '',
    phone: '',
    twoFactorEnabled: false,
    autoLogout: 30
  }
};
```

## 数据存储

### 当前实现
- 使用 `localStorage` 进行本地存储
- 键名: `app-settings`
- 自动序列化和反序列化JSON数据

### API集成指南

如需集成后端API，请修改以下方法：

```tsx
// 加载设置
const loadSettings = async () => {
  try {
    const response = await fetch('/api/user/settings');
    const data = await response.json();
    setSettings({ ...defaultSettings, ...data });
    setOriginalSettings({ ...defaultSettings, ...data });
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
};

// 保存设置
const saveSettings = async () => {
  try {
    const response = await fetch('/api/user/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    
    if (response.ok) {
      setOriginalSettings(settings);
      toast.success('设置保存成功');
      onClose?.();
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    toast.error('设置保存失败');
  }
};
```

## 国际化支持

组件完全支持项目的多语言系统，包含以下语言的完整翻译：

- 🇨🇳 中文 (zh-CN)
- 🇺🇸 English (en-US)
- 🇷🇺 Русский (ru-RU)
- 🇹🇯 Тоҷикӣ (tg-TJ)

### 自定义翻译

如需添加新翻译，请在语言文件中添加相应键值对：

```json
{
  "settings": {
    "new_feature": "新功能",
    "new_feature_desc": "新功能描述"
  }
}
```

## 样式定制

### CSS类名
- 主要容器: 可通过 `className` 属性自定义
- 内部元素: 使用Tailwind CSS类名
- 响应式: 自动适配移动端和桌面端

### 主题颜色
- 主色调: `purple-600`
- 成功状态: `green-600`
- 错误状态: `red-600`
- 警告状态: `yellow-600`

## 最佳实践

### 1. 错误处理
```tsx
const handleSaveError = (error: Error) => {
  toast.error('保存失败: ' + error.message);
  // 或显示重试选项
};
```

### 2. 加载状态
```tsx
// 显示保存中的状态
{isLoading && (
  <div className="flex items-center">
    <Spinner className="w-4 h-4 mr-2" />
    保存中...
  </div>
)}
```

### 3. 确认对话框
```tsx
const handleClose = () => {
  if (hasChanges) {
    const confirmed = confirm('您有未保存的更改，确定要退出吗？');
    if (confirmed) {
      onClose?.();
    }
  } else {
    onClose?.();
  }
};
```

## 依赖项

### 必需依赖
- `react` >= 18.0.0
- `react-dom` >= 18.0.0
- `react-i18next` >= 16.0.0
- `react-hot-toast` >= 2.0.0

### UI组件依赖
- `@/components/ui/card`
- `@/components/ui/button`
- `@/components/ui/input`
- `@/components/ui/label`
- `@/components/ui/tabs`

## 示例页面

查看 `SettingsPanelExample.tsx` 文件获取完整的使用示例，包括：

- 独立页面模式演示
- 模态窗口模式演示
- 功能特性说明
- API属性文档
- 数据存储说明

## 故障排除

### 常见问题

1. **翻译不显示**
   - 检查语言文件是否包含相应键值对
   - 确认 `useTranslation` hook正确配置

2. **设置不保存**
   - 检查localStorage是否可用
   - 验证JSON序列化/反序列化

3. **样式问题**
   - 确认Tailwind CSS正确配置
   - 检查UI组件库是否正确导入

4. **模态窗口不显示**
   - 确认 `isModal={true}`
   - 检查 `onClose` 函数是否正确传递

## 贡献指南

如需扩展功能，请遵循以下规范：

1. 保持代码风格一致性
2. 添加相应的类型定义
3. 更新国际化文件
4. 添加单元测试
5. 更新文档

## 版本历史

- **v1.0.0** (2025-11-01)
  - 初始版本发布
  - 基础设置功能
  - 多语言支持
  - 模态窗口模式