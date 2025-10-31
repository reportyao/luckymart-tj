# LuckyMartTJ i18n 多语言系统使用指南

## 概览

项目已升级为企业级的 i18next 多语言解决方案，支持 4 种语言：

- **中文 (zh-CN)** 🇨🇳
- **英文 (en-US)** 🇬🇧
- **俄文 (ru-RU)** 🇷🇺
- **塔吉克语 (tg-TJ)** 🇹🇯 （默认语言）

## 架构说明

### 目录结构

```
src/
├─ i18n/
│   ├─ config.ts              # i18next配置
│   ├─ I18nProvider.tsx       # i18n Provider组件
│   └─ useLanguageCompat.ts   # 向后兼容hooks
└─ locales/                   # 翻译文件
    ├─ zh-CN/
    │   ├─ common.json        # 通用翻译
    │   ├─ auth.json          # 认证相关
    │   ├─ lottery.json       # 抽奖相关
    │   ├─ wallet.json        # 钱包相关
    │   ├─ referral.json      # 邀请相关
    │   ├─ task.json          # 任务相关
    │   ├─ error.json         # 错误消息
    │   └─ admin.json         # 管理后台
    ├─ en-US/
    ├─ ru-RU/
    └─ tg-TJ/
```

### 命名空间

翻译文件按功能模块划分为命名空间：

- `common` - 通用文本（导航、按钮等）
- `auth` - 认证相关
- `lottery` - 抽奖相关
- `wallet` - 钱包相关
- `referral` - 邀请系统
- `task` - 任务中心
- `error` - 错误消息
- `admin` - 管理后台

## 使用方法

### 1. 应用初始化

在应用的根组件中引入 I18nProvider：

```tsx
// app/layout.tsx 或 _app.tsx
import { I18nProvider } from '@/src/i18n/I18nProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

### 2. 在组件中使用翻译

#### 方法 A: 使用 react-i18next hooks（推荐）

```tsx
'use client';

import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      {/* 从默认命名空间(common)获取翻译 */}
      <h1>{t('home.title')}</h1>
      
      {/* 从指定命名空间获取翻译 */}
      <p>{t('auth:login')}</p>
      <p>{t('referral:title')}</p>
      
      {/* 带插值的翻译 */}
      <p>{t('referral:list.page_info', { start: 1, end: 10, total: 100 })}</p>
    </div>
  );
}
```

#### 方法 B: 使用向后兼容的 useLanguage（现有代码）

```tsx
'use client';

import { useLanguage } from '@/src/i18n/useLanguageCompat';

export function LegacyComponent() {
  const { t, language } = useLanguage();
  
  return (
    <div>
      {/* 旧的翻译key格式仍然可用 */}
      <h1>{t('home.title')}</h1>
      <p>当前语言: {language}</p>
    </div>
  );
}
```

### 3. 语言切换

使用升级后的 LanguageSwitcher 组件：

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher';

export function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  );
}
```

### 4. 添加新翻译

#### 步骤 1: 在对应的 JSON 文件中添加翻译

```json
// src/locales/zh-CN/common.json
{
  "new_feature": {
    "title": "新功能",
    "description": "这是一个新功能的描述"
  }
}
```

#### 步骤 2: 在其他语言文件中添加相应翻译

```json
// src/locales/en-US/common.json
{
  "new_feature": {
    "title": "New Feature",
    "description": "This is a description of the new feature"
  }
}
```

#### 步骤 3: 在组件中使用

```tsx
const { t } = useTranslation();
<h2>{t('new_feature.title')}</h2>
<p>{t('new_feature.description')}</p>
```

### 5. 高级用法

#### 复数处理

```json
{
  "item_count": "{{count}} 个项目",
  "item_count_plural": "{{count}} 个项目"
}
```

```tsx
<p>{t('item_count', { count: 5 })}</p>
```

#### 数字和日期格式化

```tsx
import { useTranslation } from 'react-i18next';

function PriceDisplay({ amount }: { amount: number }) {
  const { i18n } = useTranslation();
  
  const formatted = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'TJS',
  }).format(amount);
  
  return <span>{formatted}</span>;
}
```

#### 访问当前语言

```tsx
const { i18n } = useTranslation();
const currentLang = i18n.language; // 'zh-CN', 'en-US', etc.
```

#### 程序化切换语言

```tsx
const { i18n } = useTranslation();

const switchToEnglish = async () => {
  await i18n.changeLanguage('en-US');
};
```

## 迁移指南

### 从旧的 LanguageContext 迁移

#### 旧代码：
```tsx
import { useLanguage } from '@/contexts/LanguageContext';

const { t, language, setLanguage } = useLanguage();
```

#### 新代码（推荐）：
```tsx
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();
const language = i18n.language;
const setLanguage = (lang: string) => i18n.changeLanguage(lang);
```

#### 或使用兼容hooks（过渡期）：
```tsx
import { useLanguage } from '@/src/i18n/useLanguageCompat';

const { t, language, setLanguage } = useLanguage();
// 旧代码无需修改
```

## 性能优化

1. **命名空间按需加载**：只加载当前使用的命名空间
2. **语言检测缓存**：使用 localStorage 缓存用户语言偏好
3. **避免不必要的重渲染**：使用 `Trans` 组件处理包含 JSX 的翻译

## 调试

开启调试模式查看翻译加载情况：

```ts
// src/i18n/config.ts
debug: true, // 在开发环境中启用
```

## 常见问题

### Q: 翻译缺失时显示什么？
A: 会按回退链显示：塔吉克语 → 英文 → 俄文。如果都没有，显示翻译key本身。

### Q: 如何检查翻译完整性？
A: 可以编写脚本比较不同语言文件的key，确保所有语言都有相应翻译。

### Q: 支持动态添加新语言吗？
A: 可以，只需在 `SUPPORTED_LANGUAGES` 中添加新语言配置，并创建对应的翻译文件。

### Q: 旧代码需要立即迁移吗？
A: 不需要。提供了向后兼容的hooks，现有代码可以继续使用。建议逐步迁移到新的i18next API。

## 最佳实践

1. **翻译key命名**：使用有意义的嵌套结构，如 `feature.action.label`
2. **避免硬编码文本**：所有用户可见的文本都应该使用翻译
3. **保持翻译简洁**：避免在翻译中包含HTML标签
4. **使用插值**：对于动态内容使用插值，而不是字符串拼接
5. **定期同步**：确保所有语言文件保持同步

## 支持的浏览器

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- 移动浏览器 iOS Safari 14+, Chrome Mobile 90+

## 参考资源

- [i18next 官方文档](https://www.i18next.com/)
- [react-i18next 文档](https://react.i18next.com/)
- [项目需求文档](/workspace/user_input_files/LuckyMartTJ 多语言国际化系统需求文档 v1.0.md)
