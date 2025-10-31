# 推荐列表和图表组件使用示例

## 快速开始

### 1. 基础用法

```tsx
// pages/referral-management.tsx
import React from 'react';
import ReferralList from '@/app/referral/components/ReferralList';
import ReferralCharts from '@/app/referral/components/ReferralCharts';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function ReferralManagement() {
  return (
    <LanguageProvider>
      <div className="referral-management">
        <ReferralList />
        <ReferralCharts />
      </div>
    </LanguageProvider>
  );
}
```

### 2. 标签页模式（推荐）

```tsx
// app/referral/management.tsx
import React, { useState } from 'react';
import ReferralList from './components/ReferralList';
import ReferralCharts from './components/ReferralCharts';
import { List, BarChart } from 'lucide-react';

export default function Management() {
  const [activeTab, setActiveTab] = useState<'list' | 'charts'>('list');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 标签页导航 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-6 py-3 flex items-center ${
                activeTab === 'list' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
              }`}
            >
              <List className="w-5 h-5 mr-2" />
              推荐列表
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-6 py-3 flex items-center ${
                activeTab === 'charts' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
              }`}
            >
              <BarChart className="w-5 h-5 mr-2" />
              数据图表
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="transition-all duration-300">
          {activeTab === 'list' && <ReferralList />}
          {activeTab === 'charts' && <ReferralCharts />}
        </div>
      </div>
    </div>
  );
}
```

### 3. 自定义样式集成

```tsx
// 自定义样式示例
import React from 'react';
import ReferralList from './components/ReferralList';

export default function CustomReferralPage() {
  return (
    <div className="custom-container">
      {/* 页面头部 */}
      <header className="page-header">
        <h1 className="page-title">我的推荐管理</h1>
        <p className="page-subtitle">管理和分析您的推荐数据</p>
      </header>

      {/* 推荐列表组件 */}
      <section className="referral-section">
        <ReferralList />
      </section>

      {/* 页面底部 */}
      <footer className="page-footer">
        <p>&copy; 2025 LuckyMart TJ. 保留所有权利。</p>
      </footer>
    </div>
  );
}
```

## API 集成示例

### 后端API实现

#### 1. 推荐列表API
```typescript
// pages/api/referral/list.ts
import type { NextApiRequest, NextApiResponse } from 'next';

interface ReferralRecord {
  id: string;
  username: string;
  referralLevel: 1 | 2 | 3;
  joinedAt: string;
  totalConsumption: number;
  contributionRewards: number;
  isActive: boolean;
  lastActiveAt?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允许' });
  }

  try {
    const {
      page = '1',
      limit = '10',
      referralLevel,
      isActive,
      search
    } = req.query;

    // 构建查询参数
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (referralLevel) queryParams.append('referralLevel', referralLevel.toString());
    if (isActive !== undefined) queryParams.append('isActive', isActive.toString());
    if (search) queryParams.append('search', search.toString());

    // 调用数据库或外部API
    const response = await fetch(`/api/referral/list?${queryParams}`);
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error('API错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}
```

#### 2. 图表数据API
```typescript
// pages/api/referral/charts.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允许' });
  }

  try {
    const { timeRange = '30d' } = req.query;

    // 获取图表数据
    const chartData = await getReferralChartsData(timeRange.toString());

    res.status(200).json(chartData);
  } catch (error) {
    console.error('图表API错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

async function getReferralChartsData(timeRange: string) {
  // 这里实现获取图表数据的逻辑
  // 示例数据结构
  return {
    referralStats: [
      {
        date: '2025-01-01',
        level1Count: 15,
        level2Count: 8,
        level3Count: 3,
        totalCount: 26
      },
      // 更多数据...
    ],
    levelDistribution: [
      { name: '一级推荐', value: 45, color: '#10B981' },
      { name: '二级推荐', value: 28, color: '#F59E0B' },
      { name: '三级推荐', value: 12, color: '#8B5CF6' }
    ],
    rewardTrend: [
      {
        date: '2025-01-01',
        totalRewards: 125.50,
        level1Rewards: 85.00,
        level2Rewards: 30.50,
        level3Rewards: 10.00,
        cumulativeRewards: 125.50
      },
      // 更多数据...
    ]
  };
}
```

## 样式自定义

### 1. 主题颜色配置
```css
/* globals.css */
.referral-list {
  --primary-color: #3B82F6;
  --secondary-color: #10B981;
  --accent-color: #F59E0B;
  --danger-color: #EF4444;
  --background-color: #F8FAFC;
  --text-color: #1F2937;
}

.referral-charts {
  --chart-primary: #3B82F6;
  --chart-secondary: #10B981;
  --chart-accent: #F59E0B;
  --chart-purple: #8B5CF6;
}
```

### 2. 组件样式覆盖
```css
/* 自定义表格样式 */
.referral-table {
  @apply bg-white rounded-lg shadow-md;
}

.referral-table th {
  @apply bg-gray-50 text-gray-700 font-semibold p-4;
}

.referral-table td {
  @apply p-4 border-b border-gray-200;
}

/* 自定义图表容器 */
.referral-chart-container {
  @apply bg-white rounded-xl p-6 shadow-lg;
  min-height: 400px;
}

.referral-chart-title {
  @apply text-xl font-bold text-gray-900 mb-4;
}
```

## 性能优化

### 1. 懒加载实现
```tsx
// 使用React.lazy进行懒加载
import { lazy, Suspense } from 'react';

const ReferralList = lazy(() => import('./components/ReferralList'));
const ReferralCharts = lazy(() => import('./components/ReferralCharts'));

export default function OptimizedReferralPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <ReferralList />
      <ReferralCharts />
    </Suspense>
  );
}
```

### 2. 数据缓存
```tsx
// 使用React Query进行数据缓存
import { useQuery } from '@tanstack/react-query';

function useReferralList(filters: any) {
  return useQuery({
    queryKey: ['referralList', filters],
    queryFn: () => fetchReferralList(filters),
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });
}
```

## 错误边界处理

```tsx
// ErrorBoundary组件
import React from 'react';

class ReferralErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('推荐组件错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>出现了一些问题</h2>
          <p>请刷新页面重试</p>
          <button onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 单元测试示例

```tsx
// ReferralList.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReferralList from './ReferralList';

describe('ReferralList', () => {
  test('渲染推荐列表', async () => {
    render(<ReferralList />);
    
    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('用户名')).toBeInTheDocument();
    });
  });

  test('搜索功能', async () => {
    render(<ReferralList />);
    
    const searchInput = screen.getByPlaceholderText('搜索用户名...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    await waitFor(() => {
      // 验证搜索请求被触发
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('search=test'));
    });
  });

  test('分页功能', async () => {
    render(<ReferralList />);
    
    const nextButton = screen.getByText('下一页');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      // 验证分页请求被触发
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    });
  });
});
```

## 部署配置

### Next.js配置
```javascript
// next.config.js
module.exports = {
  // 图片优化配置
  images: {
    domains: ['example.com'],
  },
  
  // 实验性功能
  experimental: {
    optimizeCss: true,
  },
  
  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};
```

### 环境变量
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
REFERRAL_API_TIMEOUT=10000
EXPORT_MAX_RECORDS=1000
```

---

通过以上示例，您可以快速集成和使用推荐列表和图表组件。这些组件提供了丰富的功能和良好的用户体验，同时保持高度的灵活性和可定制性。