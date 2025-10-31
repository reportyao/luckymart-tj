# 移动端语言切换组件优化

## 概述

本项目包含了优化的移动端语言切换组件，提供更好的移动端用户体验，包括底部弹窗、手势操作和触摸友好的界面。

## 新增文件

### 1. `MobileLanguageBottomSheet.tsx`
底部弹窗组件，提供以下特性：
- **手势支持**: 支持向下滑动关闭
- **动画效果**: 平滑的进入和退出动画
- **触摸优化**: 44px最小触摸区域
- **响应式设计**: 适配不同屏幕尺寸
- **可复用性**: 可用于其他底部弹窗场景

### 2. `LanguageSwitcherMobile.tsx`
移动端优化的语言切换器，包含：
- **卡片式设计**: 清晰的语言选择界面
- **状态反馈**: 加载状态和选中状态的可视化指示
- **语言支持**: 支持4种语言（中文、英文、俄文、塔吉克语）
- **服务器同步**: 保持与原组件相同的功能

## 支持的语言

| 代码 | 名称 | 本地名称 | 标志 |
|------|------|----------|------|
| zh-CN | 中文 | 中文 | 🇨🇳 |
| en-US | English | English | 🇬🇧 |
| ru-RU | Russian | Русский | 🇷🇺 |
| tg-TJ | Tajik | Тоҷикӣ | 🇹🇯 |

## 使用方法

### 在页面中使用移动端语言切换器

```tsx
import LanguageSwitcherMobile from '@/components/LanguageSwitcherMobile';

// 在移动端页面中使用
export default function MobileSettingsPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-6">设置</h1>
      <LanguageSwitcherMobile />
    </div>
  );
}
```

### 使用底部弹窗组件

```tsx
import MobileLanguageBottomSheet from '@/components/MobileLanguageBottomSheet';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        打开语言选择
      </button>
      
      <MobileLanguageBottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentLanguage="zh-CN"
        onLanguageChange={async (lang) => {
          // 处理语言切换
          console.log('切换到:', lang);
        }}
      />
    </>
  );
}
```

## 特性说明

### 1. 手势操作
- **向下拖拽**: 超过屏幕高度25%时自动关闭
- **点击背景**: 点击背景区域关闭弹窗
- **自然手势**: 符合移动端用户操作习惯

### 2. 触摸优化
- **最小触摸区域**: 所有可点击元素至少44px
- **视觉反馈**: 点击时的缩放动画效果
- **禁用状态**: 加载时禁用所有交互

### 3. 动画效果
- **平滑过渡**: 所有状态变化都有动画过渡
- **弹性动画**: 符合iOS/Android设计规范
- **性能优化**: 使用CSS transform而非position

### 4. 无障碍功能
- **ARIA标签**: 完整的无障碍标签支持
- **键盘导航**: 支持键盘操作
- **屏幕阅读器**: 良好的语义化结构

## 与原组件对比

| 特性 | 原组件 | 移动端优化组件 |
|------|--------|----------------|
| 界面类型 | 下拉菜单 | 底部弹窗 |
| 触摸区域 | 小 | 至少44px |
| 手势支持 | 无 | 向下滑动关闭 |
| 动画效果 | 基础 | 丰富动画 |
| 移动端适配 | 基础 | 完全优化 |
| 功能保持 | - | 完全兼容 |

## 技术细节

### 依赖项
- React 18+
- TypeScript
- Tailwind CSS
- react-i18next

### CSS类
组件使用Tailwind CSS类名，确保样式的一致性和可维护性。

### 性能优化
- 使用CSS transform进行动画
- 避免不必要的重新渲染
- 优化触摸事件处理

## 向后兼容性

- 原`LanguageSwitcher.tsx`保持不变
- 新组件使用不同的文件名
- 现有代码无需修改即可继续工作

## 浏览器支持

- iOS Safari 12+
- Android Chrome 70+
- 微信内置浏览器
- 其他现代移动浏览器

## 更新日志

### v1.0.0
- 初始版本发布
- 支持4种语言
- 实现底部弹窗设计
- 添加手势操作支持
- 优化移动端体验