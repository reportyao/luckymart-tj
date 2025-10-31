# CoinBalance 组件

一个功能丰富的夺宝币余额显示组件，支持动画效果、多语言、多主题和响应式设计。

## 功能特性

### ✅ 核心功能
- **小数显示支持** - 支持显示小数余额（如 125.5币）
- **数字滚动动画** - 余额变化时的平滑动画效果
- **货币符号显示** - 支持"夺宝币"等多语言货币单位
- **多语言支持** - 中文、英文、俄语、塔吉克语
- **响应式设计** - 适配移动端和桌面端

### ✅ 动画效果
- **余额变化动画** - 增加/减少时的滚动数字效果
- **增加动画** - 缓出动画，更自然的增长效果
- **减少动画** - 缓入动画，更平滑的减少效果
- **触摸波纹** - 移动端优化，触摸反馈效果

### ✅ 主题与样式
- **5种颜色主题** - Default、Success、Warning、Danger、Gradient
- **4种尺寸规格** - sm、md、lg、xl
- **图标显示** - 可选的金币图标
- **发光效果** - 不同主题的阴影和发光效果

### ✅ 状态管理
- **加载状态** - 带旋转图标的加载动画
- **错误处理** - 错误状态显示和重试机制
- **余额变化回调** - 余额变化时触发回调函数

### ✅ 移动端优化
- **触摸优化** - 针对触屏设备的交互优化
- **响应式布局** - 自适应不同屏幕尺寸
- **性能优化** - 防抖动画和内存清理

## 使用方法

### 基本用法

```tsx
import CoinBalance from '@/app/components/CoinBalance';

function MyComponent() {
  const [balance, setBalance] = useState(125.5);

  return (
    <CoinBalance 
      balance={balance}
      size="md"
      theme="default"
      animated={true}
    />
  );
}
```

### 高级用法

```tsx
import CoinBalance from '@/app/components/CoinBalance';

function AdvancedExample() {
  const [balance, setBalance] = useState(125.5);

  const handleBalanceChange = (newBalance, changeType) => {
    console.log('余额变化:', newBalance, changeType);
    // 处理余额变化逻辑
  };

  return (
    <div>
      <CoinBalance
        balance={balance}
        loading={false}
        error={null}
        size="lg"
        theme="gradient"
        showIcon={true}
        animated={true}
        onBalanceChange={handleBalanceChange}
        locale="zh-CN"
        className="mb-4"
      />
      
      {/* 控制按钮 */}
      <button onClick={() => setBalance(balance + 10.5)}>
        增加余额
      </button>
      <button onClick={() => setBalance(balance - 5.0)}>
        减少余额
      </button>
    </div>
  );
}
```

## API 文档

### Props 参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `balance` | `number` | **必需** | 余额数值 |
| `loading` | `boolean` | `false` | 是否显示加载状态 |
| `error` | `string` | `undefined` | 错误信息 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 组件尺寸 |
| `theme` | `'default' \| 'success' \| 'warning' \| 'danger' \| 'gradient'` | `'default'` | 主题样式 |
| `showIcon` | `boolean` | `true` | 是否显示金币图标 |
| `animated` | `boolean` | `true` | 是否启用动画效果 |
| `onBalanceChange` | `(newBalance: number, changeType: 'increase' \| 'decrease') => void` | `undefined` | 余额变化回调 |
| `className` | `string` | `''` | 自定义样式类 |
| `locale` | `'zh-CN' \| 'en-US' \| 'ru-RU' \| 'tg-TJ'` | `'zh-CN'` | 数字格式化地区 |

### 尺寸规格

- **sm**: 小尺寸，适合紧凑布局
- **md**: 中等尺寸，默认大小
- **lg**: 大尺寸，适合突出显示
- **xl**: 超大尺寸，适合主页面展示

### 主题样式

- **default**: 默认白色主题
- **success**: 绿色成功主题
- **warning**: 黄色警告主题
- **danger**: 红色危险主题
- **gradient**: 紫蓝渐变主题

### 地区设置

- **zh-CN**: 中文数字格式，货币单位"夺宝币"
- **en-US**: 英文数字格式，货币单位"coins"
- **ru-RU**: 俄文数字格式，货币单位"монет"
- **tg-TJ**: 塔吉克语数字格式，货币单位"тансилҳо"

## 多语言支持

组件支持以下语言：
- **中文 (zh-CN)** - 默认语言
- **英文 (en-US)** - English
- **俄文 (ru-RU)** - Русский
- **塔吉克语 (tg-TJ)** - Тоҷикӣ

### 货币单位翻译

| 语言 | 货币单位 |
|------|----------|
| 中文 | 夺宝币 |
| 英文 | coins |
| 俄文 | монет |
| 塔吉克语 | тансилҳо |

## 动画效果

### 数字滚动动画
当余额发生变化时，组件会自动触发数字滚动动画：
- **增加动画**: 使用缓出函数，创造自然的增长效果
- **减少动画**: 使用缓入函数，创造平滑的减少效果
- **动画持续时间**: 增加800ms，减少600ms
- **动画步骤**: 增加20步，减少15步

### 变化指示器
- 余额变化时会显示变化方向和数值
- 显示持续时间：2秒
- 显示绿色上升箭头或红色下降箭头

## 响应式设计

组件采用响应式设计，在不同屏幕尺寸下表现良好：

### 移动端优化
- 触摸友好的按钮大小
- 适当的字体大小调整
- 优化的间距和布局

### 桌面端优化
- 更大的点击区域
- 更丰富的视觉效果
- 更好的可读性

## 错误处理

组件内置完善的错误处理机制：

### 加载状态
```tsx
<CoinBalance balance={balance} loading={isLoading} />
```

### 错误状态
```tsx
<CoinBalance balance={balance} error="余额加载失败" />
```

### 错误恢复
用户可以通过重新加载或重试操作来恢复错误状态。

## 性能优化

### 动画优化
- 使用 `requestAnimationFrame` 确保流畅动画
- 防抖处理避免频繁动画
- 内存清理防止内存泄漏

### 渲染优化
- 使用 React.memo 避免不必要的重渲染
- useCallback 缓存函数引用
- useRef 管理动画状态

## 浏览器兼容性

- **现代浏览器**: Chrome 60+, Firefox 55+, Safari 12+
- **移动浏览器**: iOS Safari 12+, Chrome Mobile 60+
- **特性支持**: CSS Grid, Flexbox, ES6+

## 演示页面

访问 `/coin-balance-demo` 路径查看组件演示：

- 不同尺寸展示
- 不同主题展示
- 状态展示（加载、错误、正常）
- 动画测试
- 移动端响应式测试
- 多语言数字格式测试

## 最佳实践

### 1. 尺寸选择
```tsx
// 主页面使用大尺寸
<CoinBalance balance={balance} size="xl" />

// 列表项使用小尺寸
<CoinBalance balance={balance} size="sm" />
```

### 2. 主题选择
```tsx
// 成功状态使用绿色主题
<CoinBalance balance={balance} theme="success" />

// 重要信息使用渐变主题
<CoinBalance balance={balance} theme="gradient" />
```

### 3. 动画控制
```tsx
// 在数据频繁变化时关闭动画
<CoinBalance balance={balance} animated={false} />

// 在用户交互时开启动画
<CoinBalance balance={balance} animated={true} />
```

## 更新日志

### v1.0.0
- ✅ 初始版本发布
- ✅ 支持小数显示
- ✅ 实现数字滚动动画
- ✅ 支持多语言（中文、英文、俄语、塔吉克语）
- ✅ 5种主题样式
- ✅ 4种尺寸规格
- ✅ 移动端优化
- ✅ 加载和错误状态处理
- ✅ 响应式设计

## 技术栈

- **React 18** - 组件框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Next.js 14** - 应用框架
- **ES6+** - 现代 JavaScript 特性

## 许可证

MIT License

## 贡献

欢迎提交 Issues 和 Pull Requests 来改进这个组件。

---

*这个组件是为了 LuckyMart TJ 夺宝平台而专门设计的，具有完整的国际化支持和优秀的用户体验。*