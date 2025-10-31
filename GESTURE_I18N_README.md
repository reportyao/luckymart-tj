# 手势操作多语言支持系统

LuckyMart TJ 的手势操作多语言支持系统为移动端用户提供了直观的多语言手势交互体验。

## 功能特性

### 🌍 多语言支持
- **中文** (zh-CN): 完整的手势提示和操作引导
- **英文** (en-US): 国际化的手势操作体验  
- **俄文** (ru-RU): 符合俄语用户习惯的手势提示
- **塔吉克语** (tg-TJ): 本地化的手势操作指导

### 👆 手势类型
- **点击 (Tap)**: 轻触、双击、长按操作
- **滑动 (Swipe)**: 上下左右四方向滑动
- **长按 (Press)**: 持续按压操作
- **复合手势**: 支持多种手势组合

### 🎯 交互反馈
- **触觉反馈**: 轻量、中等、重度震动反馈
- **声音反馈**: 成功、错误、操作音调
- **视觉反馈**: 涟漪效果、缩放、发光、颜色变化

## 核心组件

### 1. useGestureI18n Hook

```typescript
const {
  // 翻译相关
  getGestureText,
  getSwipeText,
  getActionText,
  
  // 手势控制
  updateGestureState,
  triggerFeedback,
  validateGesture,
  
  // 状态管理
  gestureState,
  lastGesture,
  isGestureEnabled,
} = useGestureI18n(customConfig, customListeners);
```

**配置参数:**
```typescript
interface GestureConfig {
  minSwipeDistance: number;      // 最小滑动距离
  maxTapDistance: number;        // 最大点击距离  
  longPressDuration: number;     // 长按持续时间
  doubleTapDelay: number;        // 双击延迟
  enableHaptic: boolean;         // 启用触觉反馈
  enableSound: boolean;          // 启用声音反馈
  enableVisual: boolean;         // 启用视觉反馈
}
```

### 2. MultilingualGestureTooltip 组件

多语言手势提示组件，提供智能的手势引导。

```tsx
<MultilingualGestureTooltip
  gestureType="swipe"
  direction="left"
  position="top"
  duration={3000}
  autoShow={true}
  onSuccess={() => console.log('手势成功')}
  onFailed={() => console.log('手势失败')}
>
  <div>触发元素</div>
</MultilingualGestureTooltip>
```

**属性说明:**
- `gestureType`: 手势类型 ('swipe' | 'tap' | 'press')
- `direction`: 滑动方向 ('left' | 'right' | 'up' | 'down')
- `position`: 提示位置 ('top' | 'bottom' | 'left' | 'right' | 'center')
- `duration`: 显示时长 (毫秒)
- `autoShow`: 是否自动显示
- `customText`: 自定义提示文本

### 3. SwipeActions 组件

滑动手势操作组件，支持左右滑动操作。

```tsx
<SwipeActions
  leftActions={[
    {
      id: 'favorite',
      text: '收藏',
      background: 'bg-yellow-500',
      onClick: () => handleFavorite(),
    }
  ]}
  rightActions={[
    {
      id: 'delete', 
      text: '删除',
      background: 'bg-red-500',
      onClick: () => handleDelete(),
    }
  ]}
  threshold={100}
  maxSwipeDistance={150}
  onSwipeStart={(direction) => console.log('开始滑动:', direction)}
  onSwipeEnd={(direction, actionId) => console.log('滑动结束:', direction, actionId)}
>
  <div>主内容区域</div>
</SwipeActions>
```

**操作按钮配置:**
```typescript
interface SwipeAction {
  id: string;              // 操作ID
  text: string;            // 显示文本
  icon?: ReactNode;        // 图标
  background: string;      // 背景色
  color?: string;          // 文字颜色
  onClick: () => void;     // 点击回调
  gestureText?: string;    // 手势提示文本
}
```

### 4. TouchFeedback 组件

触摸反馈组件，提供多种视觉反馈效果。

```tsx
<TouchFeedback
  type="ripple"              // 反馈类型
  hapticIntensity="light"    // 触觉强度
  soundFeedback={true}       // 声音反馈
  visualFeedback={true}      // 视觉反馈
  showFeedbackText={true}    // 显示反馈文本
  feedbackTexts={{
    touch: '轻触操作',
    success: '操作成功'
  }}
  onSuccess={() => console.log('触摸成功')}
  onFailed={() => console.log('触摸失败')}
>
  <button>可触摸元素</button>
</TouchFeedback>
```

**反馈类型:**
- `ripple`: 涟漪效果
- `scale`: 缩放效果  
- `glow`: 发光效果
- `color`: 颜色变化
- `custom`: 自定义效果

## 手势翻译键

系统定义了完整的手势翻译键映射:

### 基本手势
```json
{
  "gesture": {
    "tap": {
      "short": "轻触",
      "long": "长按", 
      "double": "双击"
    }
  }
}
```

### 滑动手势
```json
{
  "gesture": {
    "swipe": {
      "left": {
        "start": "向左滑动",
        "end": "滑动完成",
        "success": "左滑成功"
      }
    }
  }
}
```

### 操作状态
```json
{
  "gesture": {
    "states": {
      "ready": "准备就绪",
      "active": "手势进行中", 
      "success": "操作成功",
      "failed": "操作失败"
    }
  }
}
```

## 使用示例

### 1. 产品卡片滑动操作

```tsx
import { SwipeActions, MultilingualGestureTooltip } from '@/components';

function ProductCard({ product }) {
  return (
    <SwipeActions
      leftActions={[
        {
          id: 'favorite',
          text: t('gesture.actions.favorite'),
          background: 'bg-yellow-500',
          onClick: () => toggleFavorite(product.id),
        }
      ]}
      rightActions={[
        {
          id: 'share',
          text: t('gesture.actions.share'), 
          background: 'bg-blue-500',
          onClick: () => shareProduct(product),
        }
      ]}
    >
      <div className="product-card">
        <h3>{product.name}</h3>
        <p>{product.price}</p>
      </div>
    </SwipeActions>
  );
}
```

### 2. 手势引导组件

```tsx
function GestureGuide() {
  return (
    <div>
      <MultilingualGestureTooltip
        gestureType="swipe"
        direction="left"
        position="right"
        autoShow={true}
      >
        <button>向左滑动删除</button>
      </MultilingualGestureTooltip>
      
      <TouchFeedback
        type="ripple"
        hapticIntensity="light"
        showFeedbackText={true}
      >
        <button>点击操作</button>
      </TouchFeedback>
    </div>
  );
}
```

### 3. 自定义手势监听

```tsx
function CustomGestureComponent() {
  const { 
    updateGestureState, 
    triggerFeedback,
    getSwipeText 
  } = useGestureI18n({
    minSwipeDistance: 80,
    enableHaptic: true,
    enableVisual: true,
  }, {
    onSwipeLeft: (event) => {
      console.log('左滑操作:', event);
      triggerFeedback('success', 'medium');
    },
    onTap: (event) => {
      console.log('点击操作:', event);
      triggerFeedback('tap', 'light');
    }
  });

  return (
    <div className="custom-gesture-area">
      {/* 手势处理区域 */}
    </div>
  );
}
```

## 性能优化

### 1. 手势防抖
- 设置合理的最小滑动距离
- 防止误触的点击距离限制
- 长按时间阈值控制

### 2. 反馈优化
- 触觉反馈分级控制
- 视觉反馈动画优化
- 声音反馈音量控制

### 3. 内存管理
- 及时清理定时器
- 组件卸载时重置状态
- 事件监听器移除

## 无障碍支持

### 1. 键盘导航
- 支持键盘操作
- Tab 键焦点管理
- Enter/Space 键触发

### 2. 屏幕阅读器
- ARIA 标签支持
- 手势状态播报
- 操作结果提示

### 3. 高对比度
- 手势提示高对比度
- 操作按钮清晰可见
- 状态指示器明显

## 错误处理

### 1. 手势失败
```typescript
const handleGestureFailed = (errorType: string) => {
  const errorMessage = getErrorText(errorType);
  showToast(errorMessage);
  triggerFeedback('error', 'light');
};
```

### 2. 不支持的手势
- 检测设备支持情况
- 提供替代操作方案
- 显示友好错误提示

### 3. 性能问题
- 手势操作超时处理
- 大量滑动性能优化
- 内存泄漏防护

## 浏览器兼容性

- ✅ Chrome/Edge 88+
- ✅ Safari 14+
- ✅ Firefox 85+
- ✅ iOS Safari 14+
- ✅ Android Chrome 88+

## 开发者指南

### 1. 添加新的手势类型

```typescript
// 1. 在 gesture-translations.ts 中添加新的手势键
export const GESTURE_KEYS = {
  pinch: {
    start: 'gesture.pinch.start',
    end: 'gesture.pinch.end',
    success: 'gesture.pinch.success',
  }
};

// 2. 在翻译文件中添加对应的文案
// 3. 实现手势逻辑处理
```

### 2. 自定义反馈效果

```typescript
const CustomFeedbackComponent = () => {
  const { triggerFeedback } = useGestureI18n();
  
  return (
    <TouchFeedback
      customFeedback={(state) => (
        <div className={`custom-feedback ${state}`}>
          {/* 自定义反馈UI */}
        </div>
      )}
    >
      {children}
    </TouchFeedback>
  );
};
```

### 3. 手势性能监控

```typescript
const GestureAnalytics = () => {
  const { metrics } = useGestureI18n();
  
  useEffect(() => {
    // 发送手势分析数据
    analytics.track('gesture_used', {
      type: metrics.gestureState,
      language: metrics.currentLanguage,
      successRate: metrics.successRate,
    });
  }, [metrics]);
};
```

## 测试指南

### 1. 单元测试
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SwipeActions } from '@/components';

test('滑动手势功能', () => {
  render(<SwipeActions>{children}</SwipeActions>);
  
  // 模拟滑动操作
  fireEvent.touchStart(screen.getByTestId('swipe-area'), {
    touches: [{ clientX: 100, clientY: 100 }]
  });
  
  // 验证操作结果
  expect(screen.getByText('操作成功')).toBeInTheDocument();
});
```

### 2. 集成测试
```typescript
test('多语言手势提示', () => {
  const { rerender } = render(
    <MultilingualGestureTooltip gestureType="swipe" />
  );
  
  // 切换语言
  rerender(<I18nProvider><MultilingualGestureTooltip gestureType="swipe" /></I18nProvider>);
  
  // 验证翻译文本更新
  expect(screen.getByText('Swipe Left')).toBeInTheDocument();
});
```

## 故障排除

### 常见问题

**Q: 手势不响应？**
A: 检查手势配置参数，确保最小滑动距离设置合理

**Q: 触觉反馈不工作？**
A: 确认设备支持震动功能，检查浏览器权限设置

**Q: 翻译文本不显示？**
A: 验证翻译文件是否正确加载，检查i18n配置

**Q: 手势与其他交互冲突？**
A: 调整手势触发时机，使用stopPropagation()阻止事件冒泡

### 调试技巧

```typescript
// 启用手势调试模式
const { 
  gestureState, 
  lastGesture,
  metrics 
} = useGestureI18n({
  debug: true  // 启用调试信息
});

// 监控手势状态变化
useEffect(() => {
  console.log('手势状态:', gestureState, lastGesture);
}, [gestureState, lastGesture]);
```

## 更新日志

### v1.0.0 (2025-10-31)
- ✨ 初始版本发布
- 🌐 支持4种语言的手势提示
- 📱 完整的触摸反馈系统
- 🎯 滑动手势操作组件
- ♿ 无障碍支持

---

更多详细信息请参考源代码注释和组件文档。