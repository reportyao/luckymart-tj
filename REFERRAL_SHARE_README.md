# 邀请分享功能 (Referral Share Functionality)

## 概述

这是一个完整的邀请分享功能实现，支持多种社交平台分享、二维码生成、海报创建和分享统计。功能包括Telegram分享、复制链接、Instagram分享、二维码分享、海报复制、分享文案自定义、分享统计和效果追踪等。

## 功能特性

### 🚀 核心分享功能
- 📋 **复制链接到剪贴板** - 支持现代Clipboard API和回退方案
- 📱 **Telegram分享** - 支持Telegram WebApp和网页分享
- 💬 **WhatsApp分享** - 直接跳转到WhatsApp
- 📷 **Instagram分享** - 支持原生分享API和网页跳转
- 📤 **原生分享API** - 使用系统分享功能

### 🎨 视觉功能
- 📱 **二维码生成和下载** - 自动生成高质量邀请二维码
- 🎨 **Instagram风格海报** - 创建品牌化邀请海报
- 🖼️ **模态框展示** - 美观的弹窗展示二维码和海报

### 📊 统计和分析
- 📈 **实时分享统计** - 跟踪分享成功/失败率
- 📱 **平台统计** - 按分享平台分类统计
- ⏰ **时间趋势** - 分享活动时间分布
- 🌐 **多设备支持** - 移动端和桌面端统计

### 🌍 多语言支持
- 🇨🇳 中文 (zh)
- 🇺🇸 English (en)  
- 🇷🇺 Русский (ru)
- 🇹🇯 Тоҷикӣ (tg)

### 🛡️ 高级特性
- 🔄 **离线支持** - 网络断开时保存分享记录
- 📱 **响应式设计** - 完美适配各种屏幕尺寸
- ⚡ **加载状态** - 所有操作都有加载指示
- 🔍 **错误处理** - 完善的错误处理和用户提示
- 🎭 **多种主题** - default/compact/minimal主题样式

## 文件结构

```
app/
├── referral/
│   ├── components/
│   │   ├── ShareButtons.tsx           # 基础分享组件
│   │   ├── ShareButtonsEnhanced.tsx   # 增强分享组件
│   │   ├── InviteCodeCard.tsx         # 邀请码卡片（现有）
│   │   └── ReferralStats.tsx          # 邀请统计（现有）
│   └── test/
│       └── page.tsx                   # 功能测试页面
├── api/
│   └── share/
│       ├── track/route.ts             # 分享事件追踪API
│       └── analytics/route.ts         # 分享分析API

lib/
├── qr-code/
│   └── qr-generator.ts                # QR码生成器（现有）
├── instagram-poster/
│   └── index.ts                       # 海报生成器（现有）
└── share-utils.ts                     # 分享工具函数

hooks/
└── useShareAnalytics.ts               # 分享分析Hook

types/
└── share.ts                           # TypeScript类型定义

contexts/
└── LanguageContext.tsx                # 多语言上下文（更新支持塔吉克语）
```

## 使用方法

### 1. 基础使用

```tsx
import ShareButtons from '@/app/referral/components/ShareButtons';

function ReferralPage() {
  return (
    <ShareButtons
      referralCode="USER123"
      userName="张三"
      customMessage="加入我一起赢大奖！"
      onShareSuccess={(method, data) => {
        console.log('分享成功:', method, data);
      }}
      onShareError={(method, error) => {
        console.error('分享失败:', method, error);
      }}
      showQRCode={true}
      showPoster={true}
    />
  );
}
```

### 2. 增强版本（推荐）

```tsx
import ShareButtonsEnhanced from '@/app/referral/components/ShareButtonsEnhanced';

function ReferralPageEnhanced() {
  return (
    <ShareButtonsEnhanced
      referralCode="USER123"
      userId="user-123"
      userName="张三"
      customMessage="加入我一起赢大奖！"
      onShareSuccess={(method, data) => {
        console.log('分享成功:', method, data);
      }}
      showAnalytics={true}
      showQRCode={true}
      theme="default"
    />
  );
}
```

### 3. API使用

#### 追踪分享事件
```typescript
POST /api/share/track
{
  "id": "event_123",
  "userId": "user_123", 
  "referralCode": "USER123",
  "method": "telegram",
  "timestamp": "2025-10-31T02:57:03Z",
  "success": true,
  "data": { "link": "https://example.com?ref=USER123" }
}
```

#### 获取分享统计
```typescript
GET /api/share/analytics?userId=user_123&referralCode=USER123&timeRange=7d

Response:
{
  "success": true,
  "data": {
    "totalShares": 45,
    "successfulShares": 42,
    "failedShares": 3,
    "methodBreakdown": {
      "copy": 15,
      "telegram": 12,
      "whatsapp": 8,
      "instagram": 10
    },
    "conversionRate": "0.15"
  }
}
```

## 组件属性

### ShareButtons Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `referralCode` | `string` | - | **必需** 邀请码 |
| `inviteLink` | `string` | - | 邀请链接（可选，将自动生成） |
| `userName` | `string` | '用户' | 用户名 |
| `userAvatar` | `string` | - | 用户头像 |
| `customMessage` | `string` | - | 自定义分享消息 |
| `onShareSuccess` | `(method, data) => void` | - | 分享成功回调 |
| `onShareError` | `(method, error) => void` | - | 分享失败回调 |
| `showQRCode` | `boolean` | `true` | 是否显示二维码功能 |
| `showPoster` | `boolean` | `true` | 是否显示海报功能 |

### ShareButtonsEnhanced Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `referralCode` | `string` | - | **必需** 邀请码 |
| `userId` | `string` | - | **必需** 用户ID |
| `showAnalytics` | `boolean` | `true` | 是否显示分析统计 |
| `theme` | `'default'\|'compact'\|'minimal'` | `'default'` | 主题样式 |
| 其他属性同ShareButtons | | | |

## 支持的分享平台

### 1. 复制链接 (Copy Link)
- **方法**: `copy`
- **图标**: 📋
- **功能**: 复制邀请链接到剪贴板
- **兼容性**: 现代浏览器 + 回退方案

### 2. Telegram分享
- **方法**: `telegram` 
- **图标**: 📱
- **功能**: 打开Telegram分享页面
- **URL**: `https://t.me/share/url`

### 3. WhatsApp分享
- **方法**: `whatsapp`
- **图标**: 💬  
- **功能**: 跳转到WhatsApp分享
- **URL**: `https://wa.me/`

### 4. Instagram分享
- **方法**: `instagram`
- **图标**: 📷
- **功能**: 原生分享API或跳转到Instagram网页

### 5. 原生分享 (Native Share)
- **方法**: `native_share`
- **图标**: 📤
- **功能**: 使用系统原生分享菜单

## 统计和追踪

### 分享事件追踪
系统自动追踪以下信息：
- 分享时间戳
- 分享方法
- 成功/失败状态
- 相关数据（链接、错误信息等）
- 设备信息（类型、浏览器、操作系统）

### 统计分析指标
- 总分享次数
- 成功分享次数
- 失败分享次数
- 成功率
- 按平台分布
- 时间趋势分析

## 主题样式

### Default (默认)
完整的网格布局，包含所有功能：
```tsx
theme="default"
```

### Compact (紧凑)
适合空间有限的页面：
```tsx
theme="compact"
```

### Minimal (简约)
极简设计，只显示核心功能：
```tsx
theme="minimal"
```

## 错误处理

### 网络错误
- 自动检测网络状态
- 离线时显示提示信息
- 保存离线分享记录

### 权限错误
- 剪贴板权限被拒绝
- 分享权限被拒绝
- 友好的错误提示

### 平台限制
- 不支持的分享API
- 浏览器兼容性问题
- 自动降级处理

## 浏览器兼容性

### 完全支持
- Chrome 66+
- Firefox 63+
- Safari 12+
- Edge 79+

### 部分支持
- Internet Explorer 11 (基础功能)
- 旧版移动浏览器

### 功能降级
- 不支持原生分享 → 使用复制链接
- 不支持剪贴板API → 使用传统复制
- 不支持现代特性 → 使用基础实现

## 最佳实践

### 1. 性能优化
- 使用React.memo包装组件
- 合理使用useCallback和useMemo
- 按需加载功能模块

### 2. 用户体验
- 提供清晰的成功/失败反馈
- 显示加载状态
- 支持键盘导航
- 移动端优化

### 3. 数据追踪
- 记录所有分享事件
- 定期同步离线数据
- 监控分享转化率

### 4. 可访问性
- 支持屏幕阅读器
- 提供ARIA标签
- 键盘可访问

## 开发指南

### 添加新的分享平台

1. 在`shareButtons`数组中添加新平台配置
2. 实现对应的分享函数
3. 更新类型定义
4. 添加多语言翻译
5. 更新文档

### 自定义主题

1. 修改`getThemeStyles`函数
2. 添加新的CSS类
3. 更新主题选项类型

### 扩展统计功能

1. 在`useShareAnalytics`中添加新的统计逻辑
2. 更新API路由支持新的指标
3. 修改前端显示组件

## 测试

### 功能测试
访问 `/app/referral/test/page.tsx` 测试所有功能

### 单元测试
```bash
npm run test -- --testPathPattern="share"
```

### 集成测试
测试API端点和前端组件的集成

## 部署说明

### 环境变量
无需特殊环境变量

### 依赖包
确保已安装必要的依赖：
- `@types/react`
- `zod` (用于API验证)
- Tailwind CSS样式类

### 构建步骤
1. TypeScript编译
2. 代码分割优化  
3. CSS提取和优化
4. 静态资源处理

## 故障排除

### 常见问题

#### Q: 剪贴板功能不工作
A: 检查是否为HTTPS环境，现代剪贴板API需要安全上下文

#### Q: 原生分享不显示
A: 检查浏览器是否支持Web Share API Level 2

#### Q: 二维码生成失败
A: 检查邀请码格式和网络连接

#### Q: 统计数据显示不正确
A: 检查API响应和网络连接，清除本地存储重新测试

### 调试模式
开启详细日志：
```typescript
localStorage.setItem('share_debug', 'true');
```

## 更新日志

### v1.0.0 (2025-10-31)
- ✨ 初始版本发布
- 📋 实现基础分享功能
- 📊 添加统计和分析
- 🌍 支持四种语言
- 🎨 三种主题样式
- 📱 响应式设计

---

## 贡献指南

欢迎提交Issue和Pull Request来改进这个功能。请确保：

1. 遵循现有的代码风格
2. 添加适当的测试
3. 更新相关文档
4. 确保向后兼容性

## 许可证

MIT License - 详见LICENSE文件