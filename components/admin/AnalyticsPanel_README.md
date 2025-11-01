# AnalyticsPanel 组件使用说明

## 概述
AnalyticsPanel 是一个功能完整的数据分析面板组件，为管理员提供了全面的数据统计和分析功能。

## 功能特性

### 📊 数据可视化
- **多种图表类型**: 支持折线图、面积图、柱状图、饼图、漏斗图
- **实时数据展示**: 关键指标卡片显示总收入、活跃用户、订单数量、转化率
- **趋势分析**: 按时间维度展示各项指标的变化趋势

### 📈 分析功能
- **趋势分析**: 月度收入、用户、订单增长趋势
- **用户行为分析**: 页面浏览、产品搜索、购买转化等行为统计
- **转化分析**: 用户转化漏斗，查看每个环节的转化率

### 📅 时间管理
- **时间范围选择**: 支持1天、7天、30天、90天、1年等时间范围
- **实时刷新**: 可手动刷新数据，支持自动更新

### 💾 数据导出
- **多格式导出**: 支持CSV、Excel、PDF格式导出
- **自定义导出**: 可选择导出的数据类型和时间范围
- **导出历史**: 查看历史导出记录，支持重复下载

## 使用方法

### 基本导入
```tsx
import { AnalyticsPanel } from '@/components/admin';

function AdminPage() {
  return (
    <div>
      <AnalyticsPanel />
    </div>
  );
}
```

### 依赖要求
确保项目中已安装以下依赖：
```bash
npm install recharts
# UI 组件依赖
npm install @/components/ui/card
npm install @/components/ui/button
npm install @/components/ui/input
npm install @/components/ui/tabs
npm install @/components/ui/badge
npm install @/components/ui/progress
```

## 组件结构

### 主要标签页
1. **总览 (Overview)**: 显示关键指标和整体数据概览
2. **趋势分析 (Trends)**: 详细的时间趋势分析
3. **用户行为 (Behavior)**: 用户行为数据统计和分析
4. **转化分析 (Conversion)**: 转化漏斗和转化率分析
5. **数据导出 (Export)**: 数据导出功能和配置

### 关键指标卡片
- 总收入：显示收入总额和增长率
- 活跃用户：显示用户数量和增长率
- 订单数量：显示订单数量和增长率
- 转化率：显示转化率和变化趋势

## 数据结构

### 模拟数据类型
组件使用以下类型的数据结构：

```typescript
interface TrendData {
  period: string;          // 时间周期（如：1月、2月）
  revenue: number;         // 收入
  users: number;           // 用户数
  orders: number;          // 订单数
  growth: number;          // 增长率
}

interface UserBehaviorData {
  action: string;          // 用户行为
  count: number;           // 行为次数
  percentage: number;      // 占比
}

interface ConversionData {
  stage: string;           // 转化阶段
  value: number;           // 数量
  rate: number;            // 转化率
}
```

## 自定义配置

### 颜色主题
可以通过修改 `chartColors` 对象来自定义图表颜色：
```typescript
const chartColors = {
  primary: '#3B82F6',      // 主色调
  secondary: '#10B981',    // 次色调
  accent: '#F59E0B',       // 强调色
  danger: '#EF4444',       // 危险色
  purple: '#8B5CF6',       // 紫色
  cyan: '#06B6D4'          // 青色
};
```

### 时间范围选项
可以通过 `dateRangeOptions` 数组自定义时间范围选项。

## API 集成

### 数据获取
在生产环境中，需要替换 `fetchAnalyticsData` 函数中的模拟数据逻辑：

```typescript
const fetchAnalyticsData = async () => {
  try {
    const response = await fetch(`/api/admin/analytics?dateRange=${selectedDateRange}`);
    const result = await response.json();
    setData(result.data);
    setTrendData(result.trends);
    setUserBehaviorData(result.behavior);
    setConversionData(result.conversion);
  } catch (error) {
    console.error('获取分析数据失败:', error);
  }
};
```

### 数据导出
导出功能需要集成后端 API：

```typescript
const exportData = async () => {
  try {
    const response = await fetch('/api/admin/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportOptions)
    });
    
    const blob = await response.blob();
    downloadFile(blob, 'analytics-export.csv', 'text/csv');
  } catch (error) {
    console.error('导出数据失败:', error);
  }
};
```

## 性能优化

### 数据缓存
- 使用 `useMemo` 缓存计算结果
- 实现数据分页加载
- 添加加载状态和错误处理

### 响应式设计
- 适配桌面端和移动端
- 使用响应式网格布局
- 支持触摸操作

## 浏览器兼容性
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 16+

## 注意事项
1. 组件使用 Recharts 库，确保正确安装
2. 需要对应的 UI 组件库支持
3. 在生产环境中需要集成真实的 API
4. 大量数据时建议添加虚拟滚动
5. 考虑添加数据缓存机制

## 更新日志
- **v1.0.0**: 初始版本，基础分析功能
- 未来版本计划：实时数据流、自定义图表、更多导出格式

## 贡献指南
如需贡献代码，请遵循以下步骤：
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 许可证
此组件遵循项目的开源许可证。