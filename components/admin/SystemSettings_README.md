# SystemSettings 组件文档

## 概述

SystemSettings 是一个功能完整的管理后台系统设置组件，提供系统配置、安全设置、API设置、数据库设置、邮件设置和系统日志查看等功能。

## 功能特性

### 🛠️ 系统配置
- 网站基础信息设置（名称、描述、URL）
- 语言和时区配置
- 系统行为参数（最大用户数、会话超时）
- 维护模式和调试模式开关

### 🔒 安全设置
- 密码策略配置（最小长度、特殊字符、数字、大写字母要求）
- 登录安全（最大尝试次数、账户锁定时长）
- 双因素认证开关
- IP白名单管理
- 加密算法选择

### 🔌 API设置
- API限流和超时配置
- JWT认证参数
- CORS跨域设置
- API文档和缓存开关
- Webhook URL配置

### 🗄️ 数据库设置
- 数据库连接参数
- 超时和连接池配置
- 自动备份设置
- 日志记录开关

### 📧 邮件设置
- SMTP服务器配置
- 加密方式选择
- 邮件模板设置
- 通知开关配置

### 📋 系统日志
- 实时日志查看
- 日志级别筛选
- 日志导出功能
- 日志详情查看

## 安装依赖

确保项目已安装以下依赖：

```bash
npm install @radix-ui/react-tabs class-variance-authority clsx tailwind-merge
```

## 使用方法

### 基础使用

```tsx
import React from 'react';
import SystemSettings from '@/components/admin/SystemSettings';

const MyComponent: React.FC = () => {
  const handleSettingsChange = (settings) => {
    console.log('设置已更新:', settings);
  };

  return (
    <SystemSettings
      showLogs={true}
      onSettingsChange={handleSettingsChange}
    />
  );
};
```

### 模态框使用

```tsx
import React, { useState } from 'react';
import SystemSettings from '@/components/admin/SystemSettings';

const SettingsModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        打开设置
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-7xl max-h-[90vh] overflow-hidden">
            <SystemSettings
              showLogs={false}
              onSettingsChange={(settings) => {
                console.log(settings);
                setIsOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
```

### 嵌入式使用

```tsx
import React from 'react';
import SystemSettings from '@/components/admin/SystemSettings';

const AdminLayout: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <SystemSettings
          showLogs={true}
          onSettingsChange={(settings) => {
            // 处理设置更新
          }}
        />
      </div>
      <div className="lg:col-span-1">
        {/* 侧边栏内容 */}
      </div>
    </div>
  );
};
```

## API

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `className` | `string` | `''` | 自定义CSS类名 |
| `showLogs` | `boolean` | `true` | 是否显示系统日志标签页 |
| `onSettingsChange` | `(settings: SystemSettingsData) => void` | - | 设置变更回调函数 |

### SystemSettingsData 类型

```typescript
interface SystemSettingsData {
  system: SystemConfig;
  security: SecuritySettings;
  api: ApiSettings;
  database: DatabaseSettings;
  email: EmailSettings;
}

interface SystemConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  language: string;
  timezone: string;
  maintenanceMode: boolean;
  debugMode: boolean;
  maxUsers: number;
  sessionTimeout: number;
}

interface SecuritySettings {
  passwordMinLength: number;
  requireSpecialChars: boolean;
  requireNumbers: boolean;
  requireUppercase: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
  twoFactorAuth: boolean;
  ipWhitelist: string[];
  securityHeadersEnabled: boolean;
  encryptionAlgorithm: string;
}

interface ApiSettings {
  apiRateLimit: number;
  apiTimeout: number;
  corsOrigins: string[];
  jwtSecret: string;
  jwtExpiration: number;
  enableApiLogging: boolean;
  enableApiCache: boolean;
  apiVersion: string;
  webhookUrl: string;
  apiDocumentation: boolean;
}

interface DatabaseSettings {
  host: string;
  port: number;
  database: string;
  username: string;
  connectionTimeout: number;
  queryTimeout: number;
  maxConnections: number;
  enableLogging: boolean;
  backupEnabled: boolean;
  backupFrequency: string;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpEncryption: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
  enableNotifications: boolean;
  enableHtmlEmails: boolean;
}
```

## 数据持久化

### 保存设置

组件提供了 `saveSettings` 方法，您可以通过以下方式集成：

```tsx
const saveSettingsToServer = async (settings: SystemSettingsData) => {
  try {
    const response = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (response.ok) {
      console.log('设置保存成功');
    } else {
      console.error('设置保存失败');
    }
  } catch (error) {
    console.error('保存设置时出错:', error);
  }
};

// 使用
<SystemSettings
  onSettingsChange={saveSettingsToServer}
/>
```

### 加载设置

组件会在初始化时自动加载设置。您可以通过以下方式提供初始数据：

```tsx
// 在您的父组件中
const [initialSettings, setInitialSettings] = React.useState<SystemSettingsData | null>(null);

React.useEffect(() => {
  // 从服务器加载设置
  fetch('/api/admin/settings')
    .then(res => res.json())
    .then(setInitialSettings);
}, []);
```

## 自定义样式

组件使用 Tailwind CSS 类名，您可以通过以下方式自定义：

```tsx
<SystemSettings
  className="custom-system-settings"
  // 其他props
/>
```

```css
.custom-system-settings {
  /* 自定义样式 */
}

.custom-system-settings .custom-tab {
  /* 自定义标签页样式 */
}
```

## 最佳实践

### 1. 错误处理

```tsx
const handleSettingsChange = async (settings: SystemSettingsData) => {
  try {
    await saveSettingsToServer(settings);
    // 显示成功消息
  } catch (error) {
    // 显示错误消息
    console.error('保存设置失败:', error);
  }
};
```

### 2. 实时保存

```tsx
const [debouncedSettings, setDebouncedSettings] = React.useState(settings);

React.useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (JSON.stringify(debouncedSettings) !== JSON.stringify(settings)) {
      handleSettingsChange(debouncedSettings);
    }
  }, 1000);

  return () => clearTimeout(timeoutId);
}, [debouncedSettings, settings]);
```

### 3. 表单验证

```tsx
const validateSettings = (settings: SystemSettingsData): string[] => {
  const errors: string[] = [];

  if (!settings.system.siteName.trim()) {
    errors.push('网站名称不能为空');
  }

  if (settings.security.passwordMinLength < 6) {
    errors.push('密码最小长度不能小于6');
  }

  // 更多验证...

  return errors;
};
```

## 故障排除

### 常见问题

1. **组件导入错误**
   - 确保路径正确：`@/components/admin/SystemSettings`
   - 检查 TypeScript 配置

2. **样式显示异常**
   - 确保 Tailwind CSS 已正确配置
   - 检查 CSS 类名冲突

3. **数据保存失败**
   - 检查网络连接
   - 验证 API 端点是否正确
   - 检查权限设置

### 调试技巧

```tsx
// 启用调试模式
<SystemSettings
  debugMode={true}
  onSettingsChange={(settings) => {
    console.log('设置变更:', settings);
    // 调试代码...
  }}
/>
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证。详情请查看 LICENSE 文件。

## 更新日志

### v1.0.0 (2025-11-01)
- 初始版本发布
- 支持系统配置、安全设置、API设置
- 支持数据库设置、邮件设置
- 支持系统日志查看和导出

## 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 Issue
- 发送邮件至开发团队
- 查看项目 Wiki

---

**注意**: 本组件依赖于项目中的 UI 组件库，确保所有依赖项都已正确安装和配置。