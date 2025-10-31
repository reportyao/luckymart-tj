# LuckyMart TJ 管理后台开发快速指南

## 目录
1. [新增页面模板](#新增页面模板)
2. [API接口模板](#api接口模板)
3. [常用组件](#常用组件)
4. [开发规范](#开发规范)
5. [常见问题](#常见问题)

---

## 新增页面模板

### 基础页面结构

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiIcon1, FiIcon2 } from 'react-icons/fi';

export default function YourPageName() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // 验证登录
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }
    
    // 加载数据
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const res = await fetch('/api/admin/your-endpoint', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">页面标题</h1>
              <p className="mt-1 text-sm text-gray-600">页面描述</p>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              返回
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 您的内容 */}
      </div>
    </div>
  );
}
```

### 带标签页的页面结构

```typescript
type TabType = 'tab1' | 'tab2' | 'tab3';

export default function PageWithTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('tab1');

  useEffect(() => {
    fetchData();
  }, [activeTab]); // 标签切换时刷新

  const TabButton = ({ tab, label, icon: Icon }: { tab: TabType; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
        activeTab === tab
          ? 'text-indigo-600 border-b-2 border-indigo-600'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... 顶部导航 ... */}

      {/* 标签页导航 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <TabButton tab="tab1" label="标签1" icon={FiIcon1} />
            <TabButton tab="tab2" label="标签2" icon={FiIcon2} />
            <TabButton tab="tab3" label="标签3" icon={FiIcon3} />
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'tab1' && <Tab1Content />}
        {activeTab === 'tab2' && <Tab2Content />}
        {activeTab === 'tab3' && <Tab3Content />}
      </div>
    </div>
  );
}
```

---

## API接口模板

### GET接口模板

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Token验证辅助函数
function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  // TODO: 实际项目中应验证JWT
  return { isValid: true };
}

export async function GET(request: NextRequest) {
  try {
    // 验证权限
    const auth = verifyAdminToken(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const param1 = searchParams.get('param1');

    // 查询数据库
    const data = await prisma.yourTable.findMany({
      where: {
        // 查询条件
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('查询失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
```

### POST接口模板

```typescript
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAdminToken(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { field1, field2 } = body;

    // 验证必填字段
    if (!field1) {
      return NextResponse.json(
        { success: false, error: 'field1不能为空' },
        { status: 400 }
      );
    }

    // 创建记录
    const record = await prisma.yourTable.create({
      data: {
        field1,
        field2,
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: record
    });

  } catch (error) {
    console.error('创建失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
```

### 动态路由参数模板

```typescript
// app/api/admin/resource/[id]/route.ts

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = verifyAdminToken(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    const updated = await prisma.yourTable.update({
      where: { id },
      data: body
    });

    return NextResponse.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('更新失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = verifyAdminToken(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const { id } = params;

    await prisma.yourTable.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: '删除成功'
    });

  } catch (error) {
    console.error('删除失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
```

---

## 常用组件

### 1. 统计卡片组件

```typescript
interface StatCardProps {
  icon: any;
  title: string;
  value: string | number;
  change?: number;
  color: string;
}

const StatCard = ({ icon: Icon, title, value, change, color }: StatCardProps) => (
  <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {change !== undefined && (
        <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
      )}
    </div>
    <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

// 使用示例
<StatCard
  icon={FiUsers}
  title="总用户数"
  value="1,234"
  change={12.5}
  color="bg-blue-500"
/>
```

### 2. 数据表格组件

```typescript
interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
}

const DataTable = ({ columns, data }: DataTableProps) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((row, idx) => (
          <tr key={idx} className="hover:bg-gray-50">
            {columns.map((col) => (
              <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// 使用示例
const columns = [
  { key: 'name', label: '名称' },
  { key: 'status', label: '状态', render: (val) => (
    <span className={`px-2 py-1 rounded-full text-xs ${
      val === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
    }`}>
      {val}
    </span>
  )},
  { key: 'createdAt', label: '创建时间', render: (val) => new Date(val).toLocaleString() }
];

<DataTable columns={columns} data={data} />
```

### 3. 状态徽章组件

```typescript
type BadgeStatus = 'success' | 'error' | 'warning' | 'info';

interface StatusBadgeProps {
  status: BadgeStatus;
  text: string;
}

const StatusBadge = ({ status, text }: StatusBadgeProps) => {
  const colors = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {text}
    </span>
  );
};

// 使用示例
<StatusBadge status="success" text="启用" />
<StatusBadge status="error" text="失败" />
```

### 4. 进度条组件

```typescript
interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
}

const ProgressBar = ({ label, value, max, color = 'bg-indigo-600' }: ProgressBarProps) => {
  const percentage = (value / max) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-semibold text-gray-900">
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// 使用示例
<ProgressBar label="转化率" value={35} max={100} color="bg-green-600" />
```

---

## 开发规范

### 1. 命名规范

- **文件名**: kebab-case (如: `user-analytics.tsx`)
- **组件名**: PascalCase (如: `UserAnalytics`)
- **函数名**: camelCase (如: `fetchUserData`)
- **常量名**: UPPER_SNAKE_CASE (如: `API_BASE_URL`)

### 2. TypeScript类型

始终定义明确的类型：

```typescript
// 定义接口
interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

// 使用泛型
const [users, setUsers] = useState<User[]>([]);

// 函数参数类型
const updateUser = (id: string, data: Partial<User>): Promise<User> => {
  // ...
};
```

### 3. 错误处理

统一的错误处理模式：

```typescript
try {
  const res = await fetch('/api/...');
  const data = await res.json();
  
  if (!data.success) {
    alert('操作失败: ' + data.error);
    return;
  }
  
  // 处理成功
} catch (error) {
  console.error('请求失败:', error);
  alert('网络错误，请稍后重试');
}
```

### 4. 加载状态

始终处理加载状态：

```typescript
const [loading, setLoading] = useState(true);

const fetchData = async () => {
  try {
    setLoading(true);
    // 获取数据
  } finally {
    setLoading(false);
  }
};
```

### 5. 样式规范

使用Tailwind CSS响应式类：

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* sm: 640px, md: 768px, lg: 1024px, xl: 1280px */}
</div>
```

---

## 常见问题

### Q1: 如何添加新的管理页面？

1. 在 `app/admin/` 下创建新文件夹
2. 创建 `page.tsx` 文件
3. 复制基础页面模板
4. 修改页面内容
5. 创建对应的API路由

### Q2: 如何集成图表？

推荐使用Recharts:

```bash
npm install recharts
```

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '周一', value: 400 },
  { name: '周二', value: 300 },
  // ...
];

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="value" stroke="#8884d8" />
  </LineChart>
</ResponsiveContainer>
```

### Q3: 如何实现分页？

```typescript
const [page, setPage] = useState(1);
const [pageSize] = useState(20);

const fetchData = async () => {
  const res = await fetch(`/api/data?page=${page}&pageSize=${pageSize}`);
  // ...
};

// API端
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  const data = await prisma.yourTable.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize
  });

  const total = await prisma.yourTable.count();

  return NextResponse.json({
    success: true,
    data: data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}
```

### Q4: 如何导出Excel？

```bash
npm install xlsx
```

```typescript
import * as XLSX from 'xlsx';

const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// 使用
<button onClick={() => exportToExcel(data, '用户数据')}>
  导出Excel
</button>
```

### Q5: 如何实现实时数据更新？

使用轮询或WebSocket:

```typescript
// 轮询方式
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 30000); // 每30秒刷新

  return () => clearInterval(interval);
}, []);

// 或使用SWR库
import useSWR from 'swr';

const { data, error } = useSWR('/api/data', fetcher, {
  refreshInterval: 30000
});
```

---

## 调试技巧

### 1. 查看API响应

```typescript
const res = await fetch('/api/...');
const data = await res.json();
console.log('API响应:', data);
```

### 2. 检查Prisma查询

```typescript
const result = await prisma.users.findMany();
console.log('查询结果:', result);
```

### 3. 使用React DevTools

在浏览器中安装React DevTools扩展，可以查看组件状态和props。

### 4. 网络请求调试

打开浏览器开发者工具的Network标签，查看API请求和响应。

---

**最后更新**: 2025-10-31  
**版本**: v1.0
