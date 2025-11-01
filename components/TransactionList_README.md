# TransactionList 组件使用说明

## 概述

TransactionList 是一个功能完整的交易历史列表组件，支持交易记录的显示、筛选、排序和导出等功能。

## 主要功能

### ✅ 已实现的功能

1. **交易记录展示**
   - 交易ID、类型、金额、时间、状态等完整信息
   - 响应式表格设计，支持移动端适配
   - 直观的图标和状态标识

2. **统计概览**
   - 当前余额显示
   - 总收入/总支出统计
   - 今日/本月交易数量
   - 卡片式统计布局

3. **筛选功能**
   - 交易类型筛选（充值、提现、消费、收益）
   - 交易状态筛选（待处理、已完成、失败、已取消）
   - 关键词搜索（交易ID、描述、关联ID）

4. **排序功能**
   - 按日期排序（升序/降序）
   - 按金额排序（升序/降序）
   - 交互式排序按钮

5. **用户体验**
   - 加载骨架屏
   - 空状态展示
   - 分页支持
   - 导出功能（可选）

## 组件参数

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `className` | string | `''` | 自定义CSS类名 |
| `pageSize` | number | `10` | 每页显示数量 |
| `showExport` | boolean | `true` | 是否显示导出功能 |
| `showStats` | boolean | `true` | 是否显示统计概览 |
| `defaultTypeFilter` | string | `'all'` | 默认筛选的交易类型 |
| `fetchData` | function | `undefined` | 自定义数据获取函数 |
| `onExport` | function | `undefined` | 导出回调函数 |
| `onPageChange` | function | `undefined` | 分页回调函数 |
| `onFilter` | function | `undefined` | 筛选回调函数 |
| `onError` | function | `undefined` | 错误回调函数 |

## 交易类型

- **recharge** - 充值
- **withdraw** - 提现
- **consume** - 消费
- **reward** - 收益

## 交易状态

- **pending** - 处理中
- **completed** - 已完成
- **failed** - 失败
- **cancelled** - 已取消

## 使用示例

### 基础使用

```tsx
import TransactionList from '@/components/TransactionList';

function TransactionPage() {
  return (
    <div className="container mx-auto p-4">
      <TransactionList />
    </div>
  );
}
```

### 自定义参数

```tsx
import TransactionList from '@/components/TransactionList';

function TransactionPage() {
  return (
    <div className="container mx-auto p-4">
      <TransactionList 
        pageSize={20}
        showExport={false}
        showStats={true}
        defaultTypeFilter="recharge"
        className="custom-transaction-list"
      />
    </div>
  );
}
```

### 带回调函数的使用

```tsx
import TransactionList from '@/components/TransactionList';

function TransactionPage() {
  const handleExport = (data: any[]) => {
    console.log('导出数据:', data);
    // 实现具体的导出逻辑
  };

  const handlePageChange = (page: number) => {
    console.log('切换到第', page, '页');
    // 实现分页逻辑
  };

  const handleFilter = (filters: any) => {
    console.log('筛选条件:', filters);
    // 实现筛选逻辑
  };

  return (
    <div className="container mx-auto p-4">
      <TransactionList 
        onExport={handleExport}
        onPageChange={handlePageChange}
        onFilter={handleFilter}
        onError={(error) => {
          console.error('交易数据加载失败:', error);
        }}
      />
    </div>
  );
}
```

### 自定义数据获取

```tsx
import TransactionList from '@/components/TransactionList';

function TransactionPage() {
  const customFetchData = async (params: any) => {
    const response = await fetch(`/api/transactions?${new URLSearchParams(params)}`);
    if (!response.ok) throw new Error('获取数据失败');
    return response.json();
  };

  return (
    <div className="container mx-auto p-4">
      <TransactionList fetchData={customFetchData} />
    </div>
  );
}
```

## 数据格式要求

### 交易记录数据格式

```typescript
interface TransactionRecord {
  id: string;                    // 记录ID
  transactionId: string;         // 交易ID
  type: 'recharge' | 'withdraw' | 'consume' | 'reward';  // 交易类型
  amount: number;                // 交易金额（正数为收入，负数为支出）
  balanceAfter: number;          // 交易后余额
  status: 'pending' | 'completed' | 'failed' | 'cancelled';  // 交易状态
  description: string;           // 交易描述
  category: string;              // 交易分类
  createDate: string;            // 创建时间
  completeDate?: string;         // 完成时间（可选）
  referenceId?: string;          // 关联ID（可选）
}
```

### 统计数据格式

```typescript
interface TransactionStats {
  totalInflow: number;           // 总收入
  totalOutflow: number;          // 总支出
  totalBalance: number;          // 当前余额
  todayTransactions: number;     // 今日交易数
  monthTransactions: number;     // 本月交易数
}
```

## 样式定制

组件使用了项目的自定义CSS类名，可以通过以下方式定制样式：

```css
/* 自定义组件样式 */
.custom-transaction-list .transaction-card {
  /* 自定义卡片样式 */
}

.custom-transaction-list .transaction-row:hover {
  /* 自定义行悬停样式 */
}
```

## 国际化支持

组件支持多语言，使用以下翻译键：

```javascript
// 建议在 i18n 配置中添加以下翻译
{
  "transactions": {
    "current_balance": "当前余额",
    "total_inflow": "总收入", 
    "total_outflow": "总支出",
    "today_transactions": "今日交易",
    "month_transactions": "本月交易",
    "recharge": "充值",
    "withdraw": "提现",
    "consume": "消费", 
    "reward": "收益",
    "completed": "已完成",
    "pending": "处理中",
    "failed": "失败",
    "cancelled": "已取消",
    "search_transactions": "搜索交易ID、描述或关联ID...",
    "all_types": "所有类型",
    "all_status": "所有状态",
    "export": "导出",
    "page_info": "显示 {{start}} - {{end}} 条，共 {{total}} 条",
    "no_transactions": "暂无交易记录"
  }
}
```

## 注意事项

1. **性能优化**: 大量数据时建议配合虚拟滚动或分页加载
2. **错误处理**: 建议实现适当的错误边界和重试机制
3. **数据验证**: 确保传入数据格式正确，避免运行时错误
4. **响应式设计**: 组件已适配移动端，必要时可进一步优化
5. **缓存策略**: 建议实现数据缓存以提升用户体验

## 依赖项

- React 18+
- Lucide React (图标)
- 自定义UI组件库 (Card, Button, Input, Badge)
- i18next (国际化)
- Recharts (图表，组件中未使用但可扩展)

## 更新日志

### v1.0.0 (2025-11-01)
- 初始版本发布
- 支持完整的交易记录展示
- 支持筛选、排序、分页
- 支持统计概览
- 支持导出功能
- 完全响应式设计
- 国际化支持