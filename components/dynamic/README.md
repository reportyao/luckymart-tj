# LuckyMart-TJ 动态导入优化组件

这个目录包含了LuckyMart-TJ项目的动态导入优化组件和工具，用于提升应用性能和用户体验。

## 📁 文件结构

```
/components/dynamic/
├── README.md                    # 本文档
├── OptimizedDynamicLoader.tsx   # 智能动态加载器组件
└── DynamicImportExamples.tsx    # 使用示例和演示
```

## 🚀 核心组件

### OptimizedDynamicLoader

智能动态加载器组件，支持多种加载策略和网络感知功能。

#### 主要特性

- **多策略支持**: eager、lazy、prefetch、conditional
- **网络感知**: 根据网络质量调整加载策略
- **智能重试**: 加载失败时自动重试
- **性能监控**: 实时跟踪加载时间
- **错误处理**: 优雅的错误处理和降级

#### 基本用法

```typescript
import OptimizedDynamicLoader from '@/components/dynamic/OptimizedDynamicLoader';

// 基本使用
<OptimizedDynamicLoader
  componentName="MyComponent"
  config={{
    importFn: () => import('@/components/MyComponent'),
    strategy: 'lazy',
    loadingComponent: () => <div>加载中...</div>
  }}
  props={{ someProp: 'value' }}
/>
```

#### 高级配置

```typescript
<OptimizedDynamicLoader
  componentName="ChartComponent"
  config={{
    importFn: () => import('@/components/charts/Chart'),
    strategy: 'conditional',
    preloadConditions: {
      networkQuality: ['good', 'fair'],
      deviceMemory: 2,
      viewport: 'desktop'
    },
    timeout: 15000,
    retryAttempts: 3,
    loadingComponent: ({ componentName }) => (
      <div className="animate-pulse bg-gray-200 h-64 rounded-lg">
        组件 {componentName} 加载中...
      </div>
    ),
    fallbackComponent: ({ error, retry }) => (
      <div className="error-container">
        <p>加载失败: {error.message}</p>
        <button onClick={retry}>重试</button>
      </div>
    )
  }}
/>
```

### 预设配置 (ComponentConfigs)

项目中提供了常用的组件配置：

```typescript
import { ComponentConfigs } from '@/components/dynamic/OptimizedDynamicLoader';

// 图表组件 - 条件加载
<OptimizedDynamicLoader
  componentName="ChartComponent"
  config={ComponentConfigs.ChartComponent}
/>

// 管理面板 - 懒加载
<OptimizedDynamicLoader
  componentName="AdminPanel"
  config={ComponentConfigs.AdminPanel}
/>

// 动画组件 - 预加载
<OptimizedDynamicLoader
  componentName="AnimationSystem"
  config={ComponentConfigs.AnimationSystem}
/>
```

## 📖 使用示例

### 示例组件 (DynamicImportExamples)

提供了完整的使用示例，包含6种不同场景：

1. **图表组件**: 条件加载和懒加载的图表组件
2. **管理面板**: 使用高阶组件优化管理界面
3. **管理页面**: 不同加载策略的页面组件
4. **动画组件**: 根据设备条件动态加载动画库
5. **智能预加载**: 组件预加载控制系统
6. **网络感知**: 根据网络状况调整加载策略

#### 运行示例

```typescript
import DynamicImportExamples from '@/components/dynamic/DynamicImportExamples';

// 在页面中直接使用
export default function ExamplesPage() {
  return <DynamicImportExamples />;
}
```

## 🔧 工具函数

### 高阶组件 (withDynamicLoading)

包装现有组件以支持动态加载：

```typescript
import { withDynamicLoading } from '@/components/dynamic/OptimizedDynamicLoader';

const OriginalComponent = React.lazy(() => import('@/components/MyComponent'));
const OptimizedComponent = withDynamicLoading(
  () => import('@/components/MyComponent'),
  'lazy'
)(OriginalComponent);

<OptimizedComponent />
```

### Hook (useComponentLoader)

组件预加载管理：

```typescript
import { useComponentLoader } from '@/components/dynamic/OptimizedDynamicLoader';

function MyComponent() {
  const { preloadComponent, isComponentLoaded } = useComponentLoader();
  
  const handlePreload = async () => {
    await preloadComponent('ChartComponent', () => import('@/components/charts/Chart'));
  };
  
  return (
    <div>
      <button onClick={handlePreload}>预加载图表组件</button>
      {isComponentLoaded('ChartComponent') && <p>图表组件已预加载</p>}
    </div>
  );
}
```

## 📊 加载策略详解

### 1. eager (立即加载)
- **适用场景**: 关键组件，需要立即显示
- **特点**: 页面加载时立即开始加载
- **示例**: 财务仪表板、核心业务组件

### 2. lazy (懒加载)
- **适用场景**: 非关键组件，可延迟加载
- **特点**: 组件可见时才开始加载
- **示例**: 管理面板、后台功能组件

### 3. prefetch (预加载)
- **适用场景**: 用户可能访问的组件
- **特点**: 网络空闲时预加载
- **示例**: 动画系统、辅助工具组件

### 4. conditional (条件加载)
- **适用场景**: 根据设备或网络条件加载
- **特点**: 智能判断是否需要加载
- **示例**: 图表组件、复杂交互组件

## 🌐 网络感知功能

组件会根据网络状况自动调整加载策略：

- **good (4G/WiFi)**: 优先使用eager或prefetch策略
- **fair (3G)**: 使用lazy或conditional策略
- **poor (2G)**: 延迟加载或提供简化版本

## 📈 性能监控

### 自动监控
- 组件加载时间记录
- 错误率统计
- 性能分数计算

### 手动监控
```typescript
<OptimizedDynamicLoader
  componentName="MyComponent"
  config={config}
  onLoad={(loadTime) => {
    console.log(`组件加载时间: ${loadTime}ms`);
    // 发送性能数据到监控系统
  }}
  onError={(error) => {
    console.error('组件加载失败:', error);
    // 发送错误报告
  }}
/>
```

## 🎨 自定义样式

### 加载状态样式

```css
/* 自定义加载动画 */
.loading-component {
  @apply animate-pulse bg-gray-200 rounded-lg flex items-center justify-center;
  min-height: 200px;
}

.loading-component::after {
  content: '组件加载中...';
  @apply text-gray-500 text-sm;
}
```

### 错误状态样式

```css
/* 自定义错误样式 */
.error-component {
  @apply bg-red-50 border border-red-200 rounded-lg p-4 text-center;
}

.error-component button {
  @apply mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors;
}
```

## 🔍 调试指南

### 开发模式调试

```typescript
// 启用调试模式
localStorage.setItem('dynamic-loader-debug', 'true');

// 查看加载日志
// 组件加载时会在控制台输出详细信息
```

### 性能分析

```typescript
// 使用React DevTools Profiler分析组件渲染性能
// 检查加载时间和内存使用情况
```

## 🛠️ 故障排除

### 常见问题

1. **组件加载失败**
   - 检查import路径是否正确
   - 确认组件导出方式
   - 查看网络连接状态

2. **加载时间过长**
   - 检查组件依赖
   - 考虑使用更激进的优化策略
   - 分析网络状况

3. **内存使用过高**
   - 检查是否有内存泄漏
   - 确认组件正确卸载
   - 优化组件内部逻辑

### 调试命令

```bash
# 查看Bundle分析
npm run build -- --analyze

# 运行性能监控
node scripts/performance-monitor.js

# 检查TypeScript类型
npm run type-check
```

## 📝 最佳实践

### 1. 组件设计
- 保持组件职责单一
- 避免过大的组件
- 使用代码分割

### 2. 加载策略
- 核心功能使用eager
- 后台功能使用lazy
- 辅助功能使用prefetch
- 重型组件使用conditional

### 3. 性能优化
- 监控加载时间
- 优化图片和资源
- 使用缓存策略

### 4. 用户体验
- 提供清晰的加载状态
- 处理加载失败情况
- 考虑网络条件

## 🔄 更新日志

### v1.0.0 (2025-11-01)
- ✨ 初始版本发布
- 🚀 支持4种加载策略
- 🌐 网络感知加载
- 📊 性能监控集成
- 🛡️ 错误处理和重试机制

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交变更
4. 创建Pull Request

## 📄 许可证

MIT License

---

更多详细信息请参考 [优化报告](../../docs/component_dynamic_imports.md)