# AdminDashboard 管理员仪表盘组件

## 概述

`AdminDashboard` 是一个功能完整的管理员仪表盘组件，提供了全面的数据可视化、实时监控和快捷操作功能。组件设计遵循现代管理后台的最佳实践，支持响应式布局和实时数据更新。

## 主要功能

### 📊 数据概览
- **核心指标展示**: 总用户数、总订单数、总营收、进行中期次
- **实时统计**: 用户增长、订单转化率、收入趋势
- **状态监控**: 风险评分、待审核提现、用户留存率

### 📈 数据可视化
- **折线图**: 用户增长趋势、订单趋势、风险事件趋势
- **面积图**: 收入趋势分析
- **饼图**: 订单状态分布、用户来源分布、风险分类分布
- **柱状图**: 热销产品排行

### ⚡ 实时功能
- **自动刷新**: 可配置的自动数据更新（默认30秒）
- **手动刷新**: 点击刷新按钮立即更新数据
- **状态指示**: 显示最后更新时间
- **加载状态**: 数据加载和刷新状态提示

### 🎯 快捷操作
- 商品管理
- 开奖管理
- 订单管理
- 提现审核
- 用户管理
- 风控面板

## 安装依赖

确保项目已安装以下依赖：

```bash
npm install recharts react-router-dom
# 或
yarn add recharts react-router-dom
```

## 基本使用

### 简单使用

```tsx
import AdminDashboard from '@/components/admin/AdminDashboard';

function MyAdminPage() {
  return (
    <div className="min-h-screen">
      <AdminDashboard />
    </div>
  );
}
```

### 高级配置

```tsx
import AdminDashboard from '@/components/admin/AdminDashboard';

function MyAdminPage() {
  const handleRefresh = () => {
    console.log('Dashboard 数据已刷新');
    // 自定义刷新逻辑
  };

  return (
    <AdminDashboard
      className="min-h-screen"
      showRealTimeUpdates={true}
      refreshInterval={60} // 60秒刷新一次
      onRefresh={handleRefresh}
    />
  );
}
```

## Props 参数

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `className` | `string` | `''` | 自定义样式类名 |
| `showRealTimeUpdates` | `boolean` | `true` | 是否启用实时数据更新 |
| `refreshInterval` | `number` | `30` | 自动刷新间隔（秒） |
| `onRefresh` | `() => void` | `undefined` | 刷新回调函数 |

## 接口类型

### DashboardStats
```tsx
interface DashboardStats {
  totalUsers: number;          // 总用户数
  totalOrders: number;         // 总订单数
  totalRevenue: number;        // 总营收
  activeRounds: number;        // 进行中期次
  pendingWithdrawals: number;  // 待审核提现
  monthlyGrowth: number;       // 月增长率
  conversionRate: number;      // 转化率
  avgOrderValue: number;       // 平均订单金额
}
```

### UserStats
```tsx
interface UserStats {
  newUsers: number;                    // 新用户数
  activeUsers: number;                 // 活跃用户数
  totalUsers: number;                  // 总用户数
  userRetention: number;               // 用户留存率
  userGrowthTrend: LineChartData[];    // 用户增长趋势数据
  userSourceData: ChartData[];         // 用户来源数据
}
```

### OrderStats
```tsx
interface OrderStats {
  totalOrders: number;                 // 总订单数
  completedOrders: number;             // 已完成订单
  pendingOrders: number;               // 待处理订单
  cancelledOrders: number;             // 已取消订单
  orderTrend: LineChartData[];         // 订单趋势数据
  orderStatusDistribution: ChartData[];// 订单状态分布
  topProducts: BarChartData[];         // 热门产品数据
}
```

### FinancialStats
```tsx
interface FinancialStats {
  totalRevenue: number;                    // 总收入
  monthlyRevenue: number;                  // 月收入
  revenueGrowth: number;                   // 收入增长率
  revenueTrend: LineChartData[];           // 收入趋势数据
  paymentMethodDistribution: ChartData[];  // 支付方式分布
  commissionData: ChartData[];             // 佣金数据
}
```

### RiskData
```tsx
interface RiskData {
  riskScore: number;                      // 风险评分
  totalAlerts: number;                    // 总警报数
  suspiciousActivities: number;           // 可疑活动数
  blockedUsers: number;                   // 被阻止用户数
  riskTrend: LineChartData[];             // 风险趋势数据
  riskCategoryDistribution: ChartData[];  // 风险分类分布
}
```

## 数据格式

### LineChartData
```tsx
interface LineChartData {
  x: string | number;  // X轴数据
  y: number;          // Y轴数据
}
```

### ChartData
```tsx
interface ChartData {
  label: string;      // 数据标签
  value: number;      // 数据值
  color?: string;     // 可选颜色
}
```

### BarChartData
```tsx
interface BarChartData {
  label: string;      // 柱状图标签
  value: number;      // 柱状图值
  color?: string;     // 可选颜色
}
```

## 响应式设计

组件采用响应式设计，在不同屏幕尺寸下提供最佳显示效果：

- **移动端** (< 768px): 单列布局
- **平板端** (768px - 1024px): 双列布局
- **桌面端** (> 1024px): 多列布局

## 样式定制

### 自定义主题
组件使用 Tailwind CSS 构建，可以通过以下方式定制样式：

```tsx
// 自定义类名
<AdminDashboard className="my-custom-dashboard" />

// 自定义主题色（通过CSS变量）
:root {
  --dashboard-primary: #your-color;
}
```

### 图表颜色定制
```tsx
// 在组件外部定义自定义颜色
const customColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

// 使用时传入自定义颜色
<AdminDashboard />
```

## 性能优化

- **懒加载**: 图表组件按需加载
- **防抖刷新**: 避免频繁的API调用
- **缓存机制**: 避免重复计算
- **虚拟滚动**: 大数据量下性能优化

## 错误处理

组件内置完善的错误处理机制：

- **网络错误**: 显示重试按钮
- **数据格式错误**: 优雅降级显示
- **加载超时**: 超时处理
- **权限验证**: 集成权限控制

## 可访问性

- **键盘导航**: 支持键盘操作
- **屏幕阅读器**: 语义化标签
- **颜色对比度**: 符合WCAG标准
- **焦点管理**: 合理的焦点控制

## 浏览器兼容性

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 示例页面

查看 `/admin/dashboard-demo` 页面获取完整使用示例。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持核心数据展示
- 集成多种图表类型
- 实现实时数据更新
- 添加快捷操作功能

## 技术栈

- **React**: 18+
- **TypeScript**: 4.5+
- **Recharts**: 2.8+
- **Tailwind CSS**: 3.0+
- **Next.js**: 13+（推荐）

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：

- 邮箱: support@example.com
- 项目Issue: [GitHub Issues](https://github.com/your-repo/issues)

---

感谢使用 AdminDashboard 组件！如有任何问题，欢迎反馈。