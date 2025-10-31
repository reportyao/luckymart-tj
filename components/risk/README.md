# 风控面板组件使用指南

## 组件概览

风控面板组件库提供了完整的风控管理功能，包括图表展示、表格管理、表单操作等组件。

## 安装和使用

### 导入组件

```typescript
import { 
  SimpleBarChart,
  SimplePieChart, 
  RiskEventTable,
  RiskUserCard,
  RiskRuleForm,
  type RiskEvent,
  type RiskUser,
  type RiskRule
} from '@/components/risk';
```

### 图表组件使用

#### 1. 柱状图组件

```typescript
import { SimpleBarChart } from '@/components/risk';

const MyDashboard = () => {
  const data = [15, 12, 18, 25, 20, 22, 28];
  
  return (
    <SimpleBarChart 
      data={data}
      title="近7天风险事件趋势"
      color="#6366F1"
      height={200}
    />
  );
};
```

#### 2. 饼图组件

```typescript
import { SimplePieChart } from '@/components/risk';

const RiskDistribution = () => {
  const data = [
    { label: '低风险', value: 45, color: '#10B981' },
    { label: '中风险', value: 30, color: '#F59E0B' },
    { label: '高风险', value: 20, color: '#EF4444' },
    { label: '严重风险', value: 5, color: '#7C2D12' }
  ];
  
  return (
    <SimplePieChart 
      data={data}
      title="风险等级分布"
      size={160}
    />
  );
};
```

#### 3. 进度条组件

```typescript
import { ProgressBar } from '@/components/risk';

const RiskScore = () => {
  return (
    <ProgressBar 
      value={85}
      max={100}
      color="#EF4444"
      showLabel={true}
      size="md"
    />
  );
};
```

#### 4. 统计卡片组件

```typescript
import { StatCard } from '@/components/risk';

const StatCards = () => {
  return (
    <>
      <StatCard
        title="今日风险事件"
        value={23}
        change="+12%"
        changeType="positive"
        icon={<svg className="w-6 h-6" fill="currentColor">...</svg>}
        color="#EF4444"
      />
    </>
  );
};
```

### 表格组件使用

#### 1. 风险事件表格

```typescript
import { RiskEventTable } from '@/components/risk';

const RiskEvents = () => {
  const [events, setEvents] = useState<RiskEvent[]>([]);
  
  const handleEventSelect = (event: RiskEvent) => {
    console.log('Selected event:', event);
  };
  
  const handleEventAction = (eventId: string, action: 'approve' | 'reject' | 'review') => {
    console.log(`Action ${action} on event ${eventId}`);
  };
  
  return (
    <RiskEventTable 
      events={events}
      onEventSelect={handleEventSelect}
      onEventAction={handleEventAction}
      loading={false}
    />
  );
};
```

#### 2. 风险用户卡片

```typescript
import { RiskUserCard } from '@/components/risk';

const RiskUsers = () => {
  const user: RiskUser = {
    id: 'U1001',
    userName: '张三',
    email: 'zhangsan@example.com',
    totalScore: 85,
    riskLevel: 'high',
    accountStatus: 'active',
    // ... other properties
  };
  
  const handleUserSelect = (user: RiskUser) => {
    console.log('Selected user:', user);
  };
  
  const handleAccountAction = (userId: string, action: 'freeze' | 'unfreeze' | 'limit' | 'ban') => {
    console.log(`Action ${action} on user ${userId}`);
  };
  
  return (
    <RiskUserCard 
      user={user}
      onUserSelect={handleUserSelect}
      onAccountAction={handleAccountAction}
    />
  );
};
```

### 表单组件使用

#### 1. 风控规则表单

```typescript
import { RiskRuleForm } from '@/components/risk';

const RuleManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<RiskRule | undefined>();
  
  const handleSaveRule = (rule: RiskRule) => {
    console.log('Saving rule:', rule);
    setShowForm(false);
    setEditingRule(undefined);
  };
  
  const handleCancel = () => {
    setShowForm(false);
    setEditingRule(undefined);
  };
  
  return (
    <>
      <button onClick={() => setShowForm(true)}>
        创建规则
      </button>
      
      {showForm && (
        <RiskRuleForm 
          rule={editingRule}
          onSave={handleSaveRule}
          onCancel={handleCancel}
          isEditing={!!editingRule}
        />
      )}
    </>
  );
};
```

## 页面示例

### 风控总览页面

```typescript
'use client';

import { useState } from 'react';
import { 
  StatCard, 
  SimpleBarChart, 
  SimplePieChart 
} from '@/components/risk';

export default function RiskDashboard() {
  const [dashboardData] = useState({
    todayRiskEvents: 23,
    riskEventsTrend: [15, 12, 18, 25, 20, 22, 28],
    riskLevelDistribution: [
      { label: '低风险', value: 45, color: '#10B981' },
      { label: '中风险', value: 30, color: '#F59E0B' },
      { label: '高风险', value: 20, color: '#EF4444' },
      { label: '严重风险', value: 5, color: '#7C2D12' }
    ],
    autoProcessingSuccess: 89.5,
    rulesExecuted: 156,
    activeRules: 18
  });

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="今日风险事件"
          value={dashboardData.todayRiskEvents}
          change="+12%"
          changeType="positive"
          icon={<svg className="w-6 h-6" fill="currentColor">...</svg>}
          color="#EF4444"
        />
        {/* 更多统计卡片... */}
      </div>
      
      {/* 图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart 
          data={dashboardData.riskEventsTrend}
          title="近7天风险事件趋势"
        />
        <SimplePieChart 
          data={dashboardData.riskLevelDistribution}
          title="风险等级分布"
        />
      </div>
    </div>
  );
}
```

## 最佳实践

### 1. 组件组合使用

```typescript
// 好的做法：组合多个组件构建完整页面
const RiskManagementPage = () => {
  return (
    <div>
      <StatCard /* 顶部统计 */ />
      <div className="grid">
        <SimpleBarChart /* 趋势图 */ />
        <SimplePieChart /* 分布图 */ />
      </div>
      <RiskEventTable /* 事件列表 */ />
    </div>
  );
};
```

### 2. 错误处理

```typescript
// 添加加载状态和错误处理
const RiskEventsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  if (loading) {
    return <RiskEventTable events={[]} loading={true} />;
  }
  
  if (error) {
    return <div className="text-red-600">错误: {error}</div>;
  }
  
  return <RiskEventTable events={events} />;
};
```

### 3. 自定义样式

```typescript
// 通过 className 自定义样式
<RiskUserCard 
  user={user}
  className="border-l-4 border-red-500 bg-red-50"
/>
```

## 注意事项

1. **数据格式**：确保传入的数据格式符合接口定义
2. **响应式设计**：组件已支持响应式，但根据需要调整容器尺寸
3. **性能优化**：大数据量时考虑虚拟滚动或分页
4. **可访问性**：组件支持键盘导航和屏幕阅读器

## 扩展开发

### 添加新组件

1. 在对应文件夹创建新组件文件
2. 在 `index.ts` 中导出
3. 更新类型定义

### 自定义主题

组件使用 Tailwind CSS，可以通过修改配置或传递自定义 className 来定制样式。

### 国际化支持

组件中的文本可以提取到国际化文件中，支持多语言切换。