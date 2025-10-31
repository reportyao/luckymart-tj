# LuckyMart TJ Telegram Mini App 集成指南

## 🚀 功能概述

为LuckyMart TJ平台开发的完整Telegram Mini App集成方案，提供原生般的用户体验。

## ✨ 主要特性

### 🎨 深色模式支持
- 浅色/深色/跟随系统三种主题模式
- 自动适配Telegram主题色彩
- 用户偏好持久化存储

### 📱 键盘适配优化
- 智能避免键盘遮挡内容
- 自定义虚拟键盘支持
- 多种输入类型适配

### 🔄 横竖屏支持
- 响应式设计适配所有屏幕
- 方向检测自动布局切换
- 移动端和桌面端优化

### 🤖 Telegram集成
- Web Apps SDK完整对接
- 用户信息自动获取
- 触觉反馈支持
- 分享和保存功能

## 📚 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问功能演示
访问 `/telegram-demo` 查看完整功能演示

## 🛠️ 核心组件使用

### TelegramProvider
全局Telegram状态管理：
```tsx
import { TelegramProvider } from '@/contexts/TelegramContext';

function App() {
  return (
    <TelegramProvider>
      <YourApp />
    </TelegramProvider>
  );
}
```

### useTelegram Hook
获取Telegram功能：
```tsx
import { useTelegram } from '@/contexts/TelegramContext';

function MyComponent() {
  const { 
    user, 
    theme, 
    hapticFeedback, 
    shareContent,
    showNotification 
  } = useTelegram();
  
  return (
    <div>
      <h1>欢迎，{user?.first_name}</h1>
      <button onClick={() => hapticFeedback('medium')}>
        触觉反馈
      </button>
    </div>
  );
}
```

### 响应式布局
```tsx
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';

function Page() {
  return (
    <ResponsiveLayout showDebugInfo={true}>
      <YourContent />
    </ResponsiveLayout>
  );
}
```

### 键盘适配
```tsx
import { TelegramKeyboard, KeyboardInput } from '@/components/keyboard/TelegramKeyboard';

function InputForm() {
  return (
    <TelegramKeyboard>
      <KeyboardInput
        type="text"
        placeholder="请输入..."
        onChange={(value) => console.log(value)}
      />
    </TelegramKeyboard>
  );
}
```

### 屏幕方向适配
```tsx
import { AutoOrientation } from '@/components/orientation/OrientationDetector';

function ResponsiveContent() {
  return (
    <AutoOrientation
      portraitLayout={<div>竖屏内容</div>}
      landscapeLayout={<div>横屏内容</div>}
    />
  );
}
```

### Telegram特色功能
```tsx
import { 
  TelegramShare, 
  TelegramSave, 
  TelegramThemeButton,
  TelegramNotification 
} from '@/components/telegram/TelegramFeatures';

function Features() {
  return (
    <div>
      <TelegramShare url="https://luckymart.tj">
        <TelegramThemeButton>分享到Telegram</TelegramThemeButton>
      </TelegramShare>
      
      <TelegramSave data={{ your: 'data' }}>
        <TelegramThemeButton>保存到Telegram</TelegramThemeButton>
      </TelegramSave>
      
      <TelegramThemeButton 
        variant="primary"
        onClick={() => console.log('点击')}
      >
        主题按钮
      </TelegramThemeButton>
      
      <TelegramNotification
        type="success"
        message="操作成功"
      />
    </div>
  );
}
```

## 🎯 最佳实践

### 主题使用
```tsx
const { theme } = useTelegram();

const styles = {
  background: theme.colors.background,
  color: theme.colors.foreground,
  primary: theme.colors.primary,
};
```

### 触觉反馈
```tsx
const { hapticFeedback } = useTelegram();

// 轻触反馈
hapticFeedback('light');

// 中等反馈
hapticFeedback('medium');

// 强反馈
hapticFeedback('heavy');
```

### 用户交互
```tsx
const { hapticFeedback, showNotification } = useTelegram();

const handleClick = () => {
  hapticFeedback('medium');
  showNotification('success', '操作成功！');
};
```

### 分享功能
```tsx
const { shareContent } = useTelegram();

const handleShare = async () => {
  await shareContent({
    url: 'https://luckymart.tj',
    text: '来看看这个很棒的平台！',
    title: 'LuckyMart TJ'
  });
};
```

## 📱 移动端优化

### 键盘适配
- 输入框自动适应键盘高度
- 防止内容被遮挡
- 智能滚动调整

### 屏幕方向
- 自动检测屏幕方向
- 动态布局调整
- 优化移动端体验

### 性能优化
- 懒加载组件
- 事件监听优化
- 内存管理

## 🎨 样式定制

### CSS变量
使用主题颜色：
```css
:root {
  --background: var(--tg-bg-color);
  --foreground: var(--tg-text-color);
  --primary: var(--tg-button-color);
  --secondary: var(--tg-secondary-bg-color);
}
```

### 响应式断点
```css
/* 小屏手机 */
@media (max-width: 767px) { }

/* 大屏手机 */
@media (min-width: 768px) and (max-width: 1023px) { }

/* 平板 */
@media (min-width: 1024px) and (max-width: 1439px) { }

/* 桌面 */
@media (min-width: 1440px) { }
```

## 🔧 开发指南

### 添加新组件
1. 在对应目录创建组件文件
2. 使用相关类型定义
3. 遵循现有代码风格
4. 添加必要的测试

### 扩展主题
1. 更新 `telegram.ts` 类型定义
2. 在 `TelegramContext` 中添加逻辑
3. 更新样式文件
4. 测试各种主题模式

### 添加Telegram功能
1. 查看 Telegram Web Apps API 文档
2. 扩展 `TelegramContext` 类型
3. 实现相关功能方法
4. 添加相应的组件

## 🧪 测试

### 功能测试
- 主题切换功能
- 键盘适配效果
- 屏幕方向响应
- Telegram API调用

### 兼容性测试
- iOS Safari
- Android Chrome
- 微信内置浏览器
- Telegram WebView

### 性能测试
- 页面加载速度
- 动画流畅度
- 内存使用情况
- 响应时间

## 📦 文件结构

```
/workspace/luckymart-tj/
├── types/
│   └── telegram.ts                    # 类型定义
├── contexts/
│   └── TelegramContext.tsx            # 全局状态管理
├── components/
│   ├── providers/
│   │   └── ThemeProvider.tsx          # 主题提供者
│   ├── layout/
│   │   └── ResponsiveLayout.tsx       # 响应式布局
│   ├── keyboard/
│   │   └── TelegramKeyboard.tsx       # 键盘适配
│   ├── orientation/
│   │   └── OrientationDetector.tsx    # 方向检测
│   ├── mobile/
│   │   └── MobileKeyboard.tsx         # 移动端键盘
│   └── telegram/
│       └── TelegramFeatures.tsx       # Telegram功能
├── styles/
│   └── telegram-mini-app.css          # 样式文件
├── app/
│   ├── layout.tsx                     # 主布局
│   ├── page.tsx                       # 首页
│   └── telegram-demo/                 # 演示页面
│       └── page.tsx
└── Telegram_Mini_App_Integration_Completion_Report.md
```

## 🚀 部署

### 环境配置
确保以下环境变量已设置：
- 无需特殊配置，组件会自适应环境

### 生产构建
```bash
npm run build
npm start
```

### Telegram部署
1. 创建 Telegram Bot
2. 配置 Web App URL
3. 测试所有功能
4. 提交审核

## 📞 支持

如有问题或建议，请：
1. 查看演示页面的功能
2. 检查控制台错误信息
3. 参考官方文档
4. 联系开发团队

## 📄 许可证

本项目使用 MIT 许可证。

---

**LuckyMart TJ Telegram Mini App** - 为用户提供原生般的体验！