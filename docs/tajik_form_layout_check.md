# 塔吉克语表单布局检查报告

## 检查概述

本报告针对luckymart-tj项目中所有输入框、文本区域和表单元素的文本对齐和布局进行了全面检查，重点关注塔吉克语（tg-TJ）环境下的显示效果。

## 1. 输入框和文本区域CSS类分析

### 基础UI组件

#### Input组件 (`/components/ui/input.tsx`)
```tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

**特点：**
- 使用Tailwind CSS类
- 高度：`h-10` (40px)
- 默认文本大小：`text-sm`
- 内边距：`px-3 py-2`
- 缺少显式的`text-align`设置

#### Textarea组件 (`/components/ui/textarea.tsx`)
```tsx
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

**特点：**
- 最小高度：`min-h-[80px]`
- 同样缺少显式的`text-align`设置

## 2. Text-align属性设置检查

### 全局CSS文件分析

#### `styles/mobile-text.css`
发现了以下text-align设置：
- **按钮文本**：`text-align: center` (第111行)
  ```css
  .mobile-button-text {
    text-align: center;
  }
  ```
- **状态标签**：`text-align: center` (第237行)
  ```css
  .mobile-status-badge {
    text-align: center;
  }
  ```

#### `styles/telegram-mini-app.css`
- **键盘触发按钮**：`text-align: left` (第228行)
  ```css
  .keyboard-trigger-button {
    text-align: left;
  }
  ```

#### 关键发现
❌ **问题**：输入框和文本区域没有显式的`text-align`属性设置，可能导致塔吉克语文本显示不一致。

## 3. 表单验证消息显示分析

### 验证示例：风险规则表单 (`components/risk/RiskRuleForm.tsx`)

```tsx
const validateForm = () => {
  const newErrors: Record<string, string> = {};
  
  if (!formData.name?.trim()) {
    newErrors.name = '规则名称不能为空';
  }
  
  if (!formData.description?.trim()) {
    newErrors.description = '规则描述不能为空';
  }
  
  // ... 更多验证
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**错误消息显示**：
```tsx
{errors.name && (
  <p className="mt-1 luckymart-text-sm text-red-600">{errors.name}</p>
)}
```

**分析**：
- ✅ 验证逻辑完整
- ✅ 错误消息显示在输入框下方
- ❌ 缺少塔吉克语错误消息
- ❌ 错误消息没有特殊的方向设置

## 4. 占位符文本对齐检查

### 多语言占位符文本

#### 塔吉克语 (tg-TJ)
```json
{
  "search_placeholder": "Ҷустуҷӯи калиди ё ном...",
  "config_key_placeholder": "масалан: register_referrer",
  "config_name_placeholder": "масалан: Мукофоти сабти номи даъваткунанда",
  "config_description_placeholder": "Тавсифи интихобии конфигуратсия..."
}
```

#### 其他语言对比
- **中文**：`"搜索配置键名或名称..."`
- **英文**：`"Search config key or name..."`
- **俄文**：`"Поиск по ключу или имени..."`

**分析**：
- ✅ 占位符文本支持4种语言
- ❌ 占位符没有特殊的CSS对齐设置
- ✅ 塔吉克语占位符使用拉丁字母，符合ltr方向

## 5. 塔吉克语输入文本显示方向

### i18n配置 (`src/i18n/config.ts`)

```tsx
export const SUPPORTED_LANGUAGES = {
  'zh-CN': { 
    name: '中文', 
    nativeName: '中文', 
    flag: '🇨🇳',
    dir: 'ltr'
  },
  'en-US': { 
    name: 'English', 
    nativeName: 'English', 
    flag: '🇬🇧',
    dir: 'ltr'
  },
  'ru-RU': { 
    name: 'Russian', 
    nativeName: 'Русский', 
    flag: '🇷🇺',
    dir: 'ltr'
  },
  'tg-TJ': { 
    name: 'Tajik', 
    nativeName: 'Тоҷикӣ', 
    flag: '🇹🇯',
    dir: 'ltr'
  }
} as const;
```

**关键发现**：
- ✅ 塔吉克语设置为 `dir: 'ltr'` (从左到右)
- ✅ 默认语言设置为塔吉克语 (`fallbackLng: 'tg-TJ'`)
- ✅ 使用拉丁字母的塔吉克语正确使用ltr方向

### 测试结果
❌ **发现问题**：塔吉克语输入框没有自动添加 `dir="auto"` 属性来根据内容自动调整方向。

## 6. 移动端表单样式优化

### 语言特定优化 (`styles/mobile-text.css`)

#### 塔吉克语专门样式
```css
.mobile-text--tg {
  /* 塔吉克语：文本较长，需要更紧凑 */
  font-size: 11px;
  line-height: 1.2;
  word-break: break-word;
  hyphens: auto;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
}
```

#### 塔吉克语按钮样式
```css
.mobile-button-text--tg {
  font-size: 10px;
  padding: 14px 8px;
  min-height: 46px;
  word-break: break-all;
  hyphens: auto;
}
```

#### 塔吉克语输入框占位符
```css
.mobile-input-placeholder--tg {
  font-size: 11px;
}
```

**分析**：
- ✅ 有专门的塔吉克语文本优化
- ✅ 字体大小针对塔吉克语进行了调整
- ❌ 输入框没有应用这些样式类

## 7. 实际使用示例检查

### 地址管理页面 (`app/addresses/page.tsx`)

```tsx
<input
  type="text"
  value={formData.recipientName}
  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
  required
/>
```

**问题**：
- ❌ 没有应用塔吉克语优化样式
- ❌ 缺少方向属性设置

### 提现页面 (`app/withdraw/page.tsx`)

```tsx
<input
  type="number"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  placeholder="最低 50 TJS"
  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
  required
/>
```

**问题**：
- ❌ 数字输入框在塔吉克语环境下可能显示不当
- ❌ 占位符文本使用中文

## 8. 问题总结和建议

### 🔴 严重问题

1. **缺少文本对齐设置**
   - 输入框和文本区域没有显式的`text-align`属性
   - 建议：添加`text-align: start`或`text-align: left`

2. **缺少方向自动调整**
   - 没有使用`dir="auto"`属性
   - 建议：为所有输入框添加方向自动检测

3. **验证消息缺少塔吉克语支持**
   - 表单验证错误消息硬编码为中文
   - 建议：使用i18n翻译系统

### 🟡 中等问题

4. **移动端样式未应用**
   - 有专门的塔吉克语移动端样式，但未被使用
   - 建议：将移动端样式类应用到相应输入框

5. **占位符文本不一致**
   - 部分占位符仍使用中文
   - 建议：统一使用多语言占位符

### 🟢 建议的修复方案

#### 1. 基础Input/Textarea组件增强

```tsx
// components/ui/input.tsx 增强版
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, dir = "auto", ...props }, ref) => {
    return (
      <input
        type={type}
        dir={dir}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

#### 2. 塔吉克语方向处理组件

```tsx
// components/ui/TajikInput.tsx
const TajikInput = ({ language, ...props }) => {
  const dir = language === 'tg-TJ' ? 'auto' : 'ltr';
  const textAlign = language === 'tg-TJ' ? 'left' : 'left';
  
  return (
    <Input
      dir={dir}
      className={cn(
        props.className,
        language === 'tg-TJ' && 'mobile-input-placeholder--tg'
      )}
      {...props}
    />
  );
};
```

#### 3. 移动端样式应用

```css
/* styles/mobile-text.css 新增 */
.mobile-input--tg {
  font-size: 11px;
  text-align: left;
  direction: ltr;
}

.mobile-textarea--tg {
  font-size: 11px;
  text-align: left;
  direction: ltr;
}
```

#### 4. 验证消息国际化

```tsx
// 在所有表单中使用
const { t } = useTranslation(['common', 'error']);

const validateForm = () => {
  const newErrors: Record<string, string> = {};
  
  if (!formData.name?.trim()) {
    newErrors.name = t('error:validation.required', { field: t('common:fields.name') });
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## 9. 推荐的优先级修复列表

### 高优先级 (立即修复)
1. ✅ 为所有Input和Textarea组件添加`text-align: left`
2. ✅ 添加`dir="auto"`属性支持
3. ✅ 统一所有占位符文本为多语言版本

### 中优先级 (本周内修复)
4. ✅ 创建塔吉克语专用的输入框组件
5. ✅ 应用移动端样式类到所有输入框
6. ✅ 将所有表单验证消息国际化

### 低优先级 (后续版本)
7. ✅ 添加输入框焦点状态的语言特定样式
8. ✅ 优化塔吉克语输入体验
9. ✅ 添加RTL语言支持准备

## 10. 检查方法

本次检查使用以下工具和方法：
- ✅ 文件内容搜索：`grep` 命令
- ✅ 文件读取分析：`Read` 工具
- ✅ 组件使用情况追踪
- ✅ CSS样式检查
- ✅ 多语言文件分析
- ✅ 实际页面示例验证

---

**检查完成时间**: 2025-10-31 23:56:36  
**检查人员**: Claude Code  
**下次复查建议**: 修复完成后进行完整的功能测试
