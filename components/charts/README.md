# 通用图表组件 (Chart)

一个功能强大、类型安全的 React 图表组件，支持多种图表类型和丰富的自定义选项。

## 特性

- **多图表类型支持**: 柱状图、折线图、饼图、面积图、雷达图、组合图、漏斗图
- **TypeScript 支持**: 完整的类型定义和智能提示
- **响应式设计**: 自动适应容器大小
- **高度可定制**: 支持颜色、主题、动画等自定义
- **现代设计**: 支持明暗主题切换
- **性能优化**: 基于 Recharts 库，支持动画和交互

## 安装依赖

确保项目中安装了 `recharts` 依赖：

```bash
npm install recharts
# 或
yarn add recharts
```

## 基础用法

```tsx
import React from 'react';
import Chart, { ChartType } from '@/components/charts';

const Example = () => {
  const data = [
    { label: '一月', value: 4000 },
    { label: '二月', value: 3000 },
    { label: '三月', value: 5000 },
  ];

  return (
    <Chart
      type={ChartType.BAR}
      title="月度销售数据"
      data={data}
      height={300}
      showValues={true}
    />
  );
};
```

## 图表类型

### 柱状图 (Bar Chart)

```tsx
import { BarChartData, ChartType } from '@/components/charts';

const barData: BarChartData[] = [
  { label: '产品A', value: 1200, color: '#3B82F6' },
  { label: '产品B', value: 800, color: '#EF4444' },
];

<Chart
  type={ChartType.BAR}
  title="产品销售对比"
  data={barData}
  height={300}
  orientation="vertical" // 或 "horizontal"
  stacked={false}
  showValues={true}
  colors={['#3B82F6', '#EF4444', '#10B981']}
/>
```

### 折线图 (Line Chart)

```tsx
import { LineChartData, ChartType } from '@/components/charts';

const lineData: LineChartData[] = [
  { x: '第1周', y: 120 },
  { x: '第2周', y: 135 },
  { x: '第3周', y: 110 },
];

<Chart
  type={ChartType.LINE}
  title="用户增长趋势"
  data={lineData}
  height={300}
  smooth={true}
  showDots={true}
  strokeWidth={2}
  color="#3B82F6"
/>
```

### 饼图 (Pie Chart)

```tsx
import { PieChartData, ChartType } from '@/components/charts';

const pieData: PieChartData[] = [
  { name: '桌面端', value: 400, color: '#3B82F6' },
  { name: '移动端', value: 300, color: '#EF4444' },
  { name: '平板端', value: 200, color: '#10B981' },
];

<Chart
  type={ChartType.PIE}
  title="设备使用分布"
  data={pieData}
  height={300}
  innerRadius={40}
  outerRadius={100}
  showPercentages={true}
  showLabels={true}
/>
```

### 面积图 (Area Chart)

```tsx
import { AreaChartData, ChartType } from '@/components/charts';

const areaData: AreaChartData[] = [
  { x: '1月', y: 400 },
  { x: '2月', y: 300 },
  { x: '3月', y: 500 },
];

<Chart
  type={ChartType.AREA}
  title="收入趋势"
  data={areaData}
  height={300}
  gradient={true}
  fillOpacity={0.6}
  strokeColor="#3B82F6"
/>
```

### 雷达图 (Radar Chart)

```tsx
import { RadarChartData, ChartType } from '@/components/charts';

const radarData: RadarChartData[] = [
  { subject: '技术', value: 85, fullMark: 100 },
  { subject: '产品', value: 78, fullMark: 100 },
  { subject: '团队', value: 92, fullMark: 100 },
];

<Chart
  type={ChartType.RADAR}
  title="能力评估"
  data={radarData}
  height={300}
  maxValue={100}
  fillOpacity={0.3}
  strokeColor="#3B82F6"
/>
```

### 组合图 (Composed Chart)

```tsx
const composedData = [
  { name: '产品A', 销量: 4000, 增长: 2400, 满意度: 9800 },
  { name: '产品B', 销量: 3000, 增长: 1398, 满意度: 8900 },
];

<Chart
  type={ChartType.COMPOSED}
  title="产品综合分析"
  data={composedData}
  height={400}
  bars={[
    { dataKey: '销量', color: '#3B82F6', stackId: 'total' },
    { dataKey: '增长', color: '#10B981', stackId: 'total' }
  ]}
  lines={[
    { dataKey: '满意度', color: '#EF4444', strokeWidth: 3 }
  ]}
/>
```

## 配置选项

### 通用配置

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `type` | `ChartType` | - | 图表类型 |
| `title` | `string` | - | 图表标题 |
| `height` | `number` | `300` | 图表高度 |
| `width` | `number` | - | 图表宽度 |
| `colors` | `string[]` | `['#3B82F6', ...]` | 颜色数组 |
| `showLegend` | `boolean` | `true` | 是否显示图例 |
| `showGrid` | `boolean` | `true` | 是否显示网格 |
| `showTooltip` | `boolean` | `true` | 是否显示提示框 |
| `responsive` | `boolean` | `true` | 是否响应式 |
| `className` | `string` | `''` | 自定义样式类 |
| `animated` | `boolean` | `true` | 是否启用动画 |
| `theme` | `'light' \| 'dark'` | `'light'` | 主题 |

### 柱状图特定配置

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | 方向 |
| `stacked` | `boolean` | `false` | 是否堆叠 |
| `showValues` | `boolean` | `false` | 是否显示数值 |
| `maxValue` | `number` | - | 最大值 |

### 折线图特定配置

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `smooth` | `boolean` | `true` | 是否平滑 |
| `showDots` | `boolean` | `true` | 是否显示点 |
| `strokeWidth` | `number` | `2` | 线条宽度 |
| `dotSize` | `number` | `4` | 点的大小 |
| `color` | `string` | `colors[0]` | 线条颜色 |

### 饼图特定配置

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `innerRadius` | `number` | `0` | 内半径 |
| `outerRadius` | `number` | `100` | 外半径 |
| `showLabels` | `boolean` | `true` | 是否显示标签 |
| `showPercentages` | `boolean` | `false` | 是否显示百分比 |
| `padAngle` | `number` | `0` | 扇形间距 |
| `cornerRadius` | `number` | `0` | 圆角半径 |

## 主题定制

组件支持明暗主题切换：

```tsx
// 亮色主题
<Chart
  type={ChartType.BAR}
  data={data}
  theme="light"
  className="bg-white"
/>

// 暗色主题
<Chart
  type={ChartType.BAR}
  data={data}
  theme="dark"
  className="bg-gray-800"
/>
```

## 数据类型

### 基础数据类型

```typescript
export interface BaseChartData {
  label?: string;
  name?: string;
  value: number;
  color?: string;
  [key: string]: any;
}

export interface LineChartData {
  x: string | number;
  y: number;
  [key: string]: any;
}

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
  [key: string]: any;
}

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
  [key: string]: any;
}
```

## 响应式设计

组件默认启用响应式设计，会自动适应容器大小：

```tsx
<div style={{ width: '50%', height: '400px' }}>
  <Chart
    type={ChartType.BAR}
    data={data}
    responsive={true} // 默认值
  />
</div>
```

## 性能优化

- 使用 `ResponsiveContainer` 确保图表在不同屏幕尺寸下正确显示
- 支持禁用动画以提升性能：`animated={false}`
- 数据懒加载和虚拟化支持（对于大数据集）

## 实际应用示例

查看 `Chart.examples.tsx` 文件获取完整的使用示例，包括：

- 销售仪表板
- 数据分析图表
- 用户画像可视化
- 自定义主题样式

## 注意事项

1. 确保导入 `recharts` 库
2. 使用 TypeScript 获得最佳开发体验
3. 对于大数据集，考虑数据采样或虚拟化
4. 在移动设备上测试响应式效果
5. 根据需要调整图表高度以确保可读性

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个组件！