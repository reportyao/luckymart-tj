# 数据分析中心页面 - 使用指南

## 概述

数据分析中心为 LuckyMart TJ 管理后台提供全面的数据分析和可视化功能，支持实时数据、用户分析、业务分析和财务分析四个维度。

**页面路径**: `/admin/analytics`  
**文件位置**: `app/admin/analytics/page.tsx`  
**代码行数**: 673行

---

## 功能模块

### 1. 实时数据看板

实时展示当前业务关键指标，支持24小时数据追踪。

**核心指标**:
- **实时在线**: 当前在线用户数量，显示趋势百分比
- **今日订单**: 当天订单总数，显示环比增长
- **今日收入**: 当天总收入（сом），显示收入增长率
- **转化率**: 浏览到购买的转化率，显示转化趋势

**可视化图表**:
- 24小时订单趋势折线图
- 24小时收入柱状图
- 实时活跃用户折线图

**数据刷新**: 
- 支持手动刷新
- API端点: `/api/admin/analytics/realtime`

---

### 2. 用户分析

深入分析用户行为、来源和特征。

**用户概览**:
- 总用户数
- 活跃用户数
- 新增用户数
- 留存率

**用户来源分布**（饼图）:
- Telegram推荐
- 直接访问
- 社交媒体
- 搜索引擎
- 其他渠道

**年龄分布**（柱状图）:
- 18-24岁
- 25-34岁
- 35-44岁
- 45-54岁
- 55岁以上

**设备分布**:
- 移动端
- 桌面端
- 平板

**新增用户趋势**（折线图）:
- 按天展示新增用户数量
- 支持7天/30天/90天时间范围

**API端点**: `/api/admin/analytics/users?timeRange={7d|30d|90d}`

---

### 3. 业务分析

分析订单、商品和转化漏斗。

**订单指标**:
- 总订单数
- 已完成订单数
- 平均订单金额
- 订单取消率

**订单和收入趋势**（折线图）:
- 按天展示订单数量和收入
- 支持多时间范围

**类目表现**（表格）:
| 类目 | 订单数 | 收入 | 增长率 |
|------|--------|------|--------|
| 食品饮料 | 2,345 | 125,678 сом | +15.6% |
| 日用百货 | 1,876 | 98,543 сом | +8.3% |
| ... | ... | ... | ... |

**热销商品 TOP5**:
- 商品名称
- 销量
- 收入
- 库存状态

**转化漏斗**:
1. 浏览商品 (100%)
2. 加入购物车 (37%)
3. 进入结算 (19%)
4. 完成支付 (15.2%)

**API端点**: `/api/admin/analytics/business?timeRange={7d|30d|90d}`

---

### 4. 财务分析

分析收入、成本、利润和现金流。

**财务概览**:
- 总收入
- 总成本
- 毛利润
- 利润率

**收入与成本趋势**（双折线图）:
- 蓝色线: 收入
- 红色线: 成本
- 按天展示趋势

**类目收入占比**（饼图）:
- 食品饮料: 35.2%
- 日用百货: 28.3%
- 个护清洁: 14.5%
- 母婴用品: 11.7%
- 数码家电: 10.3%

**支付方式分布**（进度条）:
- Lucky币支付: 62.3%
- 信用卡: 21.8%
- 借记卡: 9.9%
- 其他: 6.0%

**成本结构**:
- 商品成本: 68.5%
- 运营成本: 13.0%
- 营销费用: 8.7%
- 物流费用: 6.8%
- 其他支出: 3.0%

**现金流概况**:
- 经营活动现金流
- 投资活动现金流
- 筹资活动现金流
- 净现金流

**API端点**: `/api/admin/analytics/financial?timeRange={7d|30d|90d}`

---

## 自定义图表组件

### LineChart（折线图）

```typescript
<LineChart 
  data={[{ value: 100 }, { value: 150 }, ...]} 
  color="#6366f1"
  width={600}
  height={200}
/>
```

**属性**:
- `data`: 数据数组，每个对象包含 `value` 字段
- `color`: 线条颜色（默认: #6366f1）
- `width`: 图表宽度（默认: 600）
- `height`: 图表高度（默认: 200）

**特性**:
- 纯SVG实现
- 支持hover交互
- 自动计算比例
- 响应式设计

### BarChart（柱状图）

```typescript
<BarChart 
  data={[{ value: 100 }, { value: 150 }, ...]} 
  color="#10b981"
  width={600}
  height={200}
/>
```

**属性**:
- `data`: 数据数组
- `color`: 柱状颜色（默认: #10b981）
- `width`: 图表宽度
- `height`: 图表高度

**特性**:
- 圆角柱状
- 数值标签
- hover效果

### PieChart（饼图）

```typescript
<PieChart 
  data={[{ value: 100 }, { value: 150 }, ...]} 
  size={200}
/>
```

**属性**:
- `data`: 数据数组
- `size`: 图表尺寸（默认: 200）

**特性**:
- 5色配色方案
- 自动计算角度
- hover高亮

---

## API接口文档

### 1. 实时数据 API

**端点**: `GET /api/admin/analytics/realtime`

**请求头**:
```
Authorization: Bearer {admin_token}
```

**响应示例**:
```json
{
  "onlineUsers": 1234,
  "todayOrders": 456,
  "todayRevenue": 12345,
  "conversionRate": "3.2",
  "trends": {
    "onlineUsers": "12.5",
    "todayOrders": "8.3",
    "todayRevenue": "15.2",
    "conversionRate": "-2.1"
  },
  "hourlyData": [
    { "hour": 0, "orders": 30, "revenue": 1200, "users": 80 },
    ...
  ]
}
```

### 2. 用户分析 API

**端点**: `GET /api/admin/analytics/users?timeRange={7d|30d|90d}`

**响应示例**:
```json
{
  "summary": {
    "totalUsers": 15234,
    "activeUsers": 8456,
    "newUsers": 234,
    "retentionRate": "65.3"
  },
  "dailyNewUsers": [...],
  "userSources": [...],
  "ageDistribution": [...],
  "deviceDistribution": [...]
}
```

### 3. 业务分析 API

**端点**: `GET /api/admin/analytics/business?timeRange={7d|30d|90d}`

**响应示例**:
```json
{
  "orderMetrics": {
    "totalOrders": 5678,
    "completedOrders": 5234,
    "canceledOrders": 234,
    "avgOrderValue": "245.67"
  },
  "dailyOrders": [...],
  "categoryPerformance": [...],
  "topProducts": [...],
  "conversionFunnel": [...]
}
```

### 4. 财务分析 API

**端点**: `GET /api/admin/analytics/financial?timeRange={7d|30d|90d}`

**响应示例**:
```json
{
  "summary": {
    "totalRevenue": 2345678,
    "totalCost": 1456789,
    "grossProfit": 888889,
    "profitMargin": "37.9"
  },
  "dailyRevenue": [...],
  "revenueByCategory": [...],
  "paymentMethods": [...],
  "costBreakdown": [...],
  "cashFlow": {
    "operatingCashFlow": 567890,
    "investingCashFlow": -123456,
    "financingCashFlow": 89012,
    "netCashFlow": 533446
  }
}
```

---

## 使用流程

### 1. 访问页面
```
导航: 管理后台 → 数据分析中心
URL: /admin/analytics
```

### 2. 选择分析维度
点击顶部Tab标签切换:
- 实时数据
- 用户分析
- 业务分析
- 财务分析

### 3. 调整时间范围
使用右上角下拉菜单选择:
- 最近24小时
- 近7天
- 近30天
- 近90天

### 4. 刷新数据
点击"刷新数据"按钮手动更新所有数据

### 5. 查看详细数据
- 将鼠标悬停在图表上查看具体数值
- 滚动页面查看更多分析维度
- 参考表格和统计卡片获取精确数据

---

## 技术实现

### 前端架构
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript (严格模式)
- **样式**: Tailwind CSS
- **图标**: React Icons
- **图表**: 自定义SVG组件

### 数据流
```
用户操作 → 发送API请求 → 后端验证Token → 查询数据库/生成模拟数据 
→ 返回JSON → 前端渲染 → 图表可视化
```

### 状态管理
```typescript
const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState('realtime');
const [timeRange, setTimeRange] = useState('7d');
const [realtimeData, setRealtimeData] = useState(null);
const [userAnalytics, setUserAnalytics] = useState(null);
const [businessAnalytics, setBusinessAnalytics] = useState(null);
const [financialAnalytics, setFinancialAnalytics] = useState(null);
```

### 权限控制
- JWT Token验证
- localStorage存储token
- 401未授权自动跳转登录页

### 响应式设计
- 移动端友好
- Grid布局自适应
- 图表自动缩放

---

## 性能优化

### 数据加载
- 并行请求所有API（Promise.all）
- 首次加载一次性获取所有数据
- 时间范围变更时重新加载

### 图表渲染
- 使用纯SVG，无需外部库
- 轻量级实现（< 100行代码/组件）
- 浏览器原生渲染，性能优秀

### 缓存策略
- 前端缓存所有Tab数据
- 切换Tab无需重新请求
- 时间范围变更时才刷新

---

## 扩展指南

### 添加新的分析维度

1. **创建API接口**:
```typescript
// app/api/admin/analytics/custom/route.ts
export async function GET(request: Request) {
  // 实现数据逻辑
  return NextResponse.json(data);
}
```

2. **添加Tab标签**:
```typescript
{ id: 'custom', label: '自定义分析', icon: FiIcon }
```

3. **实现页面内容**:
```typescript
{activeTab === 'custom' && customData && (
  <div>
    {/* 自定义内容 */}
  </div>
)}
```

### 集成第三方图表库

如需更复杂的图表（如热力图、雷达图等），可以集成：

**Recharts**:
```bash
npm install recharts
```

**Chart.js**:
```bash
npm install chart.js react-chartjs-2
```

**ECharts**:
```bash
npm install echarts echarts-for-react
```

---

## 常见问题

### Q: 数据是实时的吗？
A: 当前使用模拟数据。需要集成真实数据库后才能显示实时数据。

### Q: 可以导出报表吗？
A: 当前版本暂不支持。可以通过添加导出按钮实现CSV/Excel导出功能。

### Q: 图表可以交互吗？
A: 支持基础hover效果。如需更多交互（点击、缩放、筛选），建议集成第三方图表库。

### Q: 如何添加更多时间范围？
A: 修改时间范围下拉菜单，添加新选项（如"近一年"、"自定义"等）。

### Q: 数据加载失败怎么办？
A: 检查：
1. Token是否有效
2. API接口是否正常
3. 浏览器控制台错误信息
4. 网络连接状态

---

## 维护建议

### 定期检查
- [ ] API响应时间
- [ ] 数据准确性
- [ ] 图表渲染性能
- [ ] 移动端兼容性

### 数据安全
- [ ] Token过期处理
- [ ] 敏感数据脱敏
- [ ] 权限控制完善
- [ ] 日志审计

### 用户体验
- [ ] 加载动画优化
- [ ] 错误提示友好
- [ ] 响应式布局完善
- [ ] 多语言支持（可选）

---

## 总结

数据分析中心页面提供了完整的数据分析和可视化功能，涵盖实时数据、用户行为、业务指标和财务状况四个核心维度。通过自定义SVG图表组件实现了轻量级、高性能的数据可视化，无需依赖外部图表库。

**核心优势**:
- ✅ 完整的4维度分析
- ✅ 14个API接口
- ✅ 自定义图表组件
- ✅ 响应式设计
- ✅ 权限控制
- ✅ TypeScript类型安全

**适用场景**:
- 运营团队日常数据监控
- 管理层业务决策支持
- 财务部门收支分析
- 产品团队用户洞察

---

**文档版本**: v1.0  
**最后更新**: 2025-10-31  
**维护者**: MiniMax Agent
