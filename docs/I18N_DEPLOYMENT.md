# LuckyMartTJ 多语言系统集成部署指南

## 快速开始

### 1. 应用集成

#### 修改应用根组件

在 `app/layout.tsx` 中集成 I18nProvider：

```tsx
import { I18nProvider } from '@/src/i18n/I18nProvider';
import '@/src/i18n/config'; // 确保i18n配置被加载

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

#### 更新现有LanguageContext使用

**选项1：渐进式迁移（推荐）**

保留现有的 `contexts/LanguageContext.tsx`，但内部使用新的i18next：

```tsx
// contexts/LanguageContext.tsx
'use client';

export { useLanguage, LanguageProvider } from '@/src/i18n/useLanguageCompat';
```

这样现有代码无需修改即可工作。

**选项2：完全迁移**

逐步将组件迁移到使用 `useTranslation` hook：

```tsx
// 旧代码
import { useLanguage } from '@/contexts/LanguageContext';
const { t } = useLanguage();

// 新代码
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
```

### 2. 测试集成

创建测试页面验证翻译：

```tsx
// app/test-i18n/page.tsx
'use client';

import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function TestI18nPage() {
  const { t, i18n } = useTranslation();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">多语言测试页面</h1>
      
      <div className="mb-4">
        <LanguageSwitcher />
      </div>

      <div className="space-y-4">
        <div>
          <strong>当前语言:</strong> {i18n.language}
        </div>
        
        <div>
          <strong>Common命名空间:</strong>
          <p>{t('home.title')}</p>
          <p>{t('nav.home')}</p>
        </div>
        
        <div>
          <strong>Referral命名空间:</strong>
          <p>{t('referral:title')}</p>
          <p>{t('referral:invite_code')}</p>
        </div>
        
        <div>
          <strong>Admin命名空间:</strong>
          <p>{t('admin:welcome')}</p>
          <p>{t('admin:reward_config.title')}</p>
        </div>
      </div>
    </div>
  );
}
```

### 3. 构建验证

```bash
# 开发模式测试
cd /workspace/luckymart-tj
pnpm dev

# 访问测试页面
# http://localhost:3000/test-i18n

# 生产构建测试
pnpm build

# 检查构建输出
pnpm start
```

## 部署检查清单

### ✅ 代码检查

- [ ] 所有翻译文件完整 (8个命名空间 × 4种语言 = 32个文件)
- [ ] tsconfig.json 已配置 `resolveJsonModule: true`
- [ ] I18nProvider 已集成到应用根组件
- [ ] LanguageSwitcher 组件已更新

### ✅ 功能测试

- [ ] 语言切换正常工作
- [ ] 所有4种语言都能正确显示
- [ ] 翻译key不会显示（如 'common:home.title'）
- [ ] localStorage 正确保存语言偏好
- [ ] 页面刷新后语言保持不变

### ✅ 性能测试

- [ ] 首次加载时间正常（< 3秒）
- [ ] 语言切换流畅（< 500ms）
- [ ] 无内存泄漏
- [ ] 移动端性能良好

### ✅ 兼容性测试

- [ ] 现有组件使用旧的useLanguage hooks正常工作
- [ ] 新组件使用useTranslation正常工作
- [ ] 服务端渲染(SSR)正常

## 常见问题排查

### 问题1: 翻译不显示，显示key本身

**原因**: JSON文件导入失败或路径错误

**解决方案**:
```bash
# 检查文件是否存在
ls -la src/locales/zh-CN/
ls -la src/locales/en-US/
ls -la src/locales/ru-RU/
ls -la src/locales/tg-TJ/

# 确保tsconfig.json配置正确
grep "resolveJsonModule" tsconfig.json
```

### 问题2: 语言切换后页面不更新

**原因**: 组件未订阅i18n变化

**解决方案**:
```tsx
// 确保使用useTranslation hook
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation(); // 会自动订阅语言变化
  return <div>{t('key')}</div>;
}
```

### 问题3: 构建时JSON导入错误

**原因**: Next.js未正确处理JSON导入

**解决方案**:
```js
// next.config.js
module.exports = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
    });
    return config;
  },
};
```

### 问题4: 塔吉克语字符显示为乱码

**原因**: 字体不支持西里尔字符

**解决方案**:
```css
/* 添加支持西里尔字符的字体 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap');

body {
  font-family: 'Noto Sans', sans-serif;
}
```

## 回滚计划

如果新系统出现问题，可以快速回滚到旧系统：

```bash
# 1. 注释掉I18nProvider
# 2. 恢复旧的LanguageContext
# 3. 重新构建

git stash  # 暂存新代码
git checkout HEAD -- contexts/LanguageContext.tsx
pnpm build
```

## 性能优化建议

### 1. 代码分割

```tsx
// 按需加载命名空间
const { t } = useTranslation(['common', 'referral']); // 只加载需要的命名空间
```

### 2. 缓存翻译

```ts
// src/i18n/config.ts
cache: {
  enabled: true,
  expirationTime: 7 * 24 * 60 * 60 * 1000, // 7天
}
```

### 3. 服务端预渲染

```tsx
// app/[lang]/layout.tsx
export async function generateStaticParams() {
  return ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'].map((lang) => ({
    lang,
  }));
}
```

## 监控与分析

### 添加翻译缺失监控

```ts
// src/i18n/config.ts
i18n.on('missingKey', (lngs, namespace, key, res) => {
  console.error('Missing translation:', { lngs, namespace, key });
  
  // 发送到监控服务
  if (typeof window !== 'undefined') {
    fetch('/api/log-missing-translation', {
      method: 'POST',
      body: JSON.stringify({ lngs, namespace, key }),
    });
  }
});
```

### 语言使用统计

```ts
// 记录用户语言选择
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'language_change', {
      language: lng,
    });
  }
});
```

## 维护指南

### 添加新翻译

1. 在 `src/locales/zh-CN/[namespace].json` 添加中文翻译
2. 运行翻译同步脚本（如果有）
3. 在其他语言文件中添加对应翻译
4. 测试所有语言是否正常显示

### 更新现有翻译

1. 修改对应的JSON文件
2. 重新构建应用
3. 测试受影响的页面

### 删除废弃翻译

1. 搜索整个代码库确认翻译未被使用
2. 从所有语言文件中删除
3. 运行测试确保无破坏性改动

## 下一步计划

- [ ] 创建翻译管理平台
- [ ] 实现翻译自动同步
- [ ] 添加翻译质量检查
- [ ] 支持RTL语言（如阿拉伯语）
- [ ] 实现翻译懒加载优化

## 联系支持

如有问题，请查看：
- 项目文档: `/workspace/luckymart-tj/docs/I18N_GUIDE.md`
- 需求文档: `/workspace/user_input_files/LuckyMartTJ 多语言国际化系统需求文档 v1.0.md`
