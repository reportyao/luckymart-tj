# OrderHistory 订单历史组件

OrderHistory 是一个功能完整的订单历史列表组件，支持分页加载、状态筛选、支付操作等功能。

## 功能特性

- ✅ 完整的订单历史列表展示
- ✅ 支持分页加载和无限滚动
- ✅ 多维度筛选（订单类型、状态）
- ✅ 订单支付操作
- ✅ 响应式设计，支持移动端
- ✅ 错误处理和加载状态
- ✅ 动画效果和交互优化
- ✅ 支持多种展示模式

## 组件结构

### 主组件 (OrderHistory)
完整功能的订单历史组件，包含头部、筛选器、列表等所有功能。

### 简化组件 (SimpleOrderHistory)
轻量级版本，适用于内嵌展示或特定场景。

## 基本用法

### 1. 完整功能使用

```tsx
import OrderHistory from '@/components/OrderHistory';

function OrdersPage() {
  return (
    <OrderHistory 
      showHeader={true}
      enableFilter={true}
      enableActions={true}
      pageSize={20}
    />
  );
}
```

### 2. 简化版使用

```tsx
import { SimpleOrderHistory } from '@/components/OrderHistory';
import type { OrderWithProduct } from '@/types/order-history';

const orders: OrderWithProduct[] = [
  // 订单数据
];

function UserProfileOrders() {
  const handlePayOrder = (orderId: string) => {
    console.log('支付订单:', orderId);
  };

  return (
    <SimpleOrderHistory 
      orders={orders}
      onPayOrder={handlePayOrder}
      showActions={true}
    />
  );
}
```

## Props 配置

### OrderHistory Props

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| userId | string | - | 指定用户ID |
| className | string | '' | 自定义样式类名 |
| showHeader | boolean | true | 是否显示头部导航 |
| pageSize | number | 20 | 每页加载数量 |
| enableFilter | boolean | true | 是否启用筛选功能 |
| enableActions | boolean | true | 是否启用操作按钮 |
| filterParams | OrderFilterParams | - | 初始筛选参数 |
| onOrderPay | (orderId: string) => void | - | 订单支付回调 |
| onOrderView | (orderId: string) => void | - | 订单查看回调 |

### SimpleOrderHistory Props

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| orders | OrderWithProduct[] | - | 订单数据列表 |
| className | string | '' | 自定义样式类名 |
| onPayOrder | (orderId: string) => void | - | 订单支付回调 |
| onOrderClick | (orderId: string) => void | - | 订单点击回调 |
| showActions | boolean | true | 是否显示操作按钮 |

## 订单状态

### 支付状态 (paymentStatus)
- `pending` - 待支付
- `paid` - 已支付
- `failed` - 支付失败
- `cancelled` - 已取消

### 履约状态 (fulfillmentStatus)
- `pending_address` - 待确认地址
- `pending_shipment` - 待发货
- `shipped` - 已发货
- `delivered` - 已送达
- `cancelled` - 已取消

### 订单类型 (type)
- `lottery_win` - 夺宝中奖
- `recharge` - 充值
- `resale` - 转售
- `direct_buy` - 直接购买

## API 接口

组件使用以下API端点：

- `GET /api/orders/list` - 获取订单列表
- `POST /api/orders/{id}/pay` - 支付订单

## 依赖组件

- `useApi` - API调用Hook
- `InfiniteScroll` - 无限滚动组件
- `ErrorState` - 错误状态组件
- `CustomDialog` - 确认对话框组件

## 使用示例

### 在页面中使用

```tsx
// pages/orders/index.tsx
import OrderHistory from '@/components/OrderHistory';

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <OrderHistory 
        showHeader={true}
        enableFilter={true}
        enableActions={true}
      />
    </div>
  );
}
```

### 在用户资料中使用

```tsx
// pages/profile/index.tsx
import { SimpleOrderHistory } from '@/components/OrderHistory';

export default function UserProfile() {
  const [orders, setOrders] = useState([]);

  return (
    <div className="space-y-6">
      {/* 用户信息 */}
      <div className="bg-white p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">我的订单</h2>
        <SimpleOrderHistory 
          orders={orders}
          onPayOrder={handlePayOrder}
          showActions={true}
        />
      </div>
    </div>
  );
}
```

### 在管理后台使用

```tsx
// pages/admin/users/[id]/orders.tsx
import OrderHistory from '@/components/OrderHistory';

export default function AdminUserOrders({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">用户订单管理</h1>
      <OrderHistory 
        userId={params.id}
        showHeader={false}
        enableFilter={true}
        enableActions={false}
        pageSize={30}
      />
    </div>
  );
}
```

## 高级用法

### 自定义筛选参数

```tsx
const filterParams: OrderFilterParams = {
  type: 'lottery_win',
  status: 'pending',
  page: 1,
  limit: 15,
  startDate: '2024-01-01',
  endDate: '2024-12-31'
};

<OrderHistory 
  filterParams={filterParams}
  onOrderPay={handlePayment}
  onOrderView={handleView}
/>
```

### 自定义样式

```tsx
<OrderHistory 
  className="bg-white rounded-lg shadow-sm"
  showHeader={false}
  pageSize={10}
/>
```

## 注意事项

1. **认证**: 组件会自动获取localStorage中的token进行API调用
2. **错误处理**: 内置错误状态显示和重试功能
3. **性能**: 使用无限滚动和分页加载优化性能
4. **响应式**: 移动端和桌面端都有良好体验
5. **国际化**: 支持多语言显示

## 样式定制

组件使用Tailwind CSS，可以通过以下方式定制样式：

```css
/* 全局样式覆盖 */
.order-history-container {
  @apply bg-gray-50;
}

.order-history-item {
  @apply bg-white rounded-lg shadow-sm hover:shadow-md;
}

/* 状态颜色定制 */
.status-pending {
  @apply text-yellow-700 bg-yellow-100;
}

.status-paid {
  @apply text-green-700 bg-green-100;
}
```

## 性能优化

- 使用React.memo优化渲染性能
- 实现虚拟滚动支持大量数据
- 智能预加载机制
- 防抖处理用户操作
- 内存泄漏防护

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 更新日志

### v1.0.0 (2024-01-01)
- ✨ 初始版本发布
- ✅ 基础订单列表功能
- ✅ 分页加载和筛选
- ✅ 响应式设计