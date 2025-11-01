# OrderList 组件

OrderList 组件是一个功能完整的订单列表组件，支持订单展示、搜索、筛选、分页等功能。

## 功能特性

- 📋 **订单展示**: 显示订单ID、商品名称、价格、状态、时间等完整信息
- 🔍 **搜索功能**: 支持订单号、商品名称、用户名、电话号码搜索
- 🏷️ **状态筛选**: 支持按订单状态筛选（待支付、已支付、处理中、已发货、已送达、已取消、已退款）
- 📄 **分页功能**: 完整的分页控件，支持页面跳转
- 📊 **统计信息**: 显示总订单数、待处理数、已完成数、总金额、平均订单金额
- 🎨 **响应式设计**: 适配桌面端和移动端
- ⚡ **性能优化**: 搜索防抖、虚拟滚动优化
- 🎯 **类型安全**: 完整的 TypeScript 类型定义

## 组件结构

```
components/OrderList/
├── OrderList.tsx      # 主组件文件
├── index.ts           # 导出文件
└── README.md          # 说明文档
```

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `userId` | `string` | - | 可选的用户ID，用于显示特定用户的订单 |
| `onViewDetails` | `(order: Order) => void` | - | 查看订单详情的回调函数 |
| `onCancelOrder` | `(order: Order) => void` | - | 取消订单的回调函数 |
| `onRefundOrder` | `(order: Order) => void` | - | 申请退款的回调函数 |
| `showActions` | `boolean` | `true` | 是否显示操作按钮 |
| `className` | `string` | `''` | 自定义CSS类名 |
| `limit` | `number` | - | 限制显示数量 |
| `enableSearch` | `boolean` | `true` | 是否启用搜索功能 |
| `enableFilter` | `boolean` | `true` | 是否启用状态筛选 |
| `showStats` | `boolean` | `true` | 是否显示统计信息 |

### 类型定义

#### Order
```typescript
interface Order {
  id: string;
  order_number: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  user?: {
    username?: string;
    first_name?: string;
    phone?: string;
  };
}
```

#### OrderItem
```typescript
interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    id: string;
    name_zh: string;
    name_en: string;
    name_tj?: string;
    image_url: string;
    category: string;
  };
}
```

#### OrderListProps
```typescript
interface OrderListProps {
  userId?: string;
  onViewDetails?: (order: Order) => void;
  onCancelOrder?: (order: Order) => void;
  onRefundOrder?: (order: Order) => void;
  showActions?: boolean;
  className?: string;
  limit?: number;
  enableSearch?: boolean;
  enableFilter?: boolean;
  showStats?: boolean;
}
```

## 使用示例

### 基本用法

```tsx
import { OrderList } from '@/components/OrderList';

function MyOrdersPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">我的订单</h1>
      <OrderList />
    </div>
  );
}
```

### 管理员查看所有订单

```tsx
import { OrderList } from '@/components/OrderList';

function AdminOrdersPage() {
  const handleViewDetails = (order: Order) => {
    // 跳转到订单详情页面
    router.push(`/admin/orders/${order.id}`);
  };

  const handleCancelOrder = async (order: Order) => {
    // 调用取消订单API
    const response = await fetch(`/api/orders/${order.id}/cancel`, {
      method: 'POST',
    });
    // 处理响应...
  };

  const handleRefundOrder = async (order: Order) => {
    // 调用退款API
    const response = await fetch(`/api/orders/${order.id}/refund`, {
      method: 'POST',
    });
    // 处理响应...
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">订单管理</h1>
      <OrderList
        showActions={true}
        onViewDetails={handleViewDetails}
        onCancelOrder={handleCancelOrder}
        onRefundOrder={handleRefundOrder}
        showStats={true}
      />
    </div>
  );
}
```

### 用户订单页面（只显示当前用户订单）

```tsx
import { OrderList } from '@/components/OrderList';

function UserOrdersPage() {
  const { user } = useAuth(); // 假设的认证hook
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">我的订单</h1>
      <OrderList
        userId={user?.id}
        showActions={true}
        limit={20}
      />
    </div>
  );
}
```

### 简化版本（只展示订单列表）

```tsx
import { OrderList } from '@/components/OrderList';

function SimpleOrderList() {
  return (
    <OrderList
      showActions={false}
      enableSearch={false}
      enableFilter={false}
      showStats={false}
    />
  );
}
```

## 状态说明

| 状态 | 描述 | 允许操作 |
|------|------|----------|
| `pending` | 待支付 | 查看详情、取消订单 |
| `paid` | 已支付 | 查看详情、申请退款 |
| `processing` | 处理中 | 查看详情、申请退款 |
| `shipped` | 已发货 | 查看详情、申请退款 |
| `delivered` | 已送达 | 查看详情 |
| `cancelled` | 已取消 | 查看详情 |
| `refunded` | 已退款 | 查看详情 |

## 工具函数

组件还提供了一系列工具函数：

```tsx
import { OrderListUtils } from '@/components/OrderList';

// 格式化价格
const price = OrderListUtils.formatPrice(123.45); // "123.45 TJS"

// 格式化日期
const date = OrderListUtils.formatDate('2023-12-01T10:00:00Z'); // "12月1日 10:00"

// 获取状态徽章样式
const statusStyle = OrderListUtils.getStatusBadge('pending'); 
// { color: 'bg-yellow-100 text-yellow-800', label: '待支付' }

// 检查订单是否可以取消
const canCancel = OrderListUtils.canCancel(order);

// 检查订单是否可以申请退款
const canRefund = OrderListUtils.canRefund(order);

// 计算统计信息
const stats = OrderListUtils.calculateStats(orders);
```

## 配置常量

组件提供了默认配置：

```tsx
import { ORDER_LIST_CONFIG } from '@/components/OrderList';

console.log(ORDER_LIST_CONFIG.DEFAULT_PAGE_SIZE); // 10
console.log(ORDER_LIST_CONFIG.STATUS_OPTIONS); // 状态选项数组
```

## 自定义样式

组件使用 Tailwind CSS 类名，可以通过 `className` 属性添加自定义样式：

```tsx
<OrderList 
  className="custom-order-list" 
  showActions={true}
/>
```

```css
.custom-order-list {
  /* 自定义样式 */
}

.custom-order-list .order-card {
  /* 针对订单卡片的样式 */
}
```

## 注意事项

1. 组件假设后端 API 端点存在：`/api/orders`
2. 如果没有提供自定义回调函数，组件会使用默认的 API 调用
3. 搜索功能有 300ms 的防抖延迟
4. 分页默认每页显示 10 条记录
5. 组件支持响应式设计，在移动端会自动调整布局

## 依赖项

- React 18+
- Next.js 13+
- TypeScript
- Tailwind CSS
- shadcn/ui 组件库

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本订单列表展示
- 支持搜索、筛选、分页功能
- 支持订单状态管理
- 提供完整的类型定义