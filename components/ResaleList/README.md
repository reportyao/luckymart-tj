# ResaleList 组件文档

## 概述

ResaleList 是一个功能完整的转售商品列表组件，提供商品展示、搜索、筛选、排序、分页等完整功能。

## 功能特性

### 🎯 核心功能
- ✅ 转售商品列表展示
- ✅ 商品价格、原价、利润、利润百分比显示
- ✅ 商品状态管理（活跃/已售/过期/取消）
- ✅ 实时搜索功能
- ✅ 状态筛选
- ✅ 多种排序方式
- ✅ 分页支持
- ✅ 响应式设计

### 📊 数据展示
- **价格信息**: 售价、原价、利润、利润百分比
- **商品信息**: 名称、图片、分类
- **卖家信息**: 卖家名称
- **状态信息**: 商品状态、发布时间
- **统计数据**: 总数、在售数量、总价值、总利润、平均折扣

### 🔍 搜索与筛选
- **搜索**: 支持商品名称、卖家名称搜索
- **状态筛选**: 全部、在售、已售、已过期、已取消
- **排序**: 最新发布、价格从低到高、价格从高到低、利润最高、折扣最大

## 组件类型

### ResaleListing 接口
```typescript
interface ResaleListing {
  id: string;                    // 转售ID
  order_id: string;             // 订单ID
  seller_user_id: string;       // 卖家用户ID
  product_id?: string;          // 商品ID
  listing_price: number;        // 售价
  original_price: number;       // 原价
  status: 'active' | 'sold' | 'expired' | 'cancelled'; // 状态
  listed_at: string;            // 发布时间
  expires_at?: string;          // 过期时间
  profit: number;               // 利润
  profit_percentage: number;    // 利润百分比
  products: {
    id: string;
    name_zh: string;            // 中文名称
    name_en: string;            // 英文名称
    name_tj?: string;           // 塔吉克语名称
    image_url: string;          // 图片URL
    market_price: number;       // 市场价格
    category: string;           // 分类
  };
  sellers: {
    username?: string;          // 用户名
    first_name?: string;        // 名字
    id: string;
  };
}
```

### ResaleListProps 接口
```typescript
interface ResaleListProps {
  onPurchase?: (listing: ResaleListing) => void;    // 购买回调
  onViewDetails?: (listing: ResaleListing) => void; // 查看详情回调
  showActions?: boolean;                             // 显示操作按钮
  className?: string;                                // 自定义样式类
  limit?: number;                                    // 每页显示数量
  enableSearch?: boolean;                            // 启用搜索
  enableFilter?: boolean;                            // 启用筛选
  showStats?: boolean;                               // 显示统计信息
}
```

## 使用方法

### 基本使用
```jsx
import ResaleList from '@/components/ResaleList';

function ResalePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">转售市场</h1>
      <ResaleList />
    </div>
  );
}
```

### 自定义操作
```jsx
function CustomResaleExample() {
  const handlePurchase = (listing) => {
    // 自定义购买逻辑
    if (confirm(`确认购买 ${listing.products.name_zh}?`)) {
      // 执行购买API调用
      console.log('购买商品:', listing);
    }
  };

  const handleViewDetails = (listing) => {
    // 自定义查看详情逻辑
    router.push(`/resale/${listing.id}`);
  };

  return (
    <ResaleList
      onPurchase={handlePurchase}
      onViewDetails={handleViewDetails}
      showActions={true}
      enableSearch={true}
      enableFilter={true}
      showStats={true}
      limit={12}
    />
  );
}
```

### 简化版本（仅展示列表）
```jsx
function SimpleListExample() {
  return (
    <ResaleList
      showActions={false}
      enableSearch={false}
      enableFilter={false}
      showStats={false}
      limit={8}
    />
  );
}
```

### 移动端优化
```jsx
function MobileResaleExample() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4">
        <h1 className="text-lg font-semibold">转售市场</h1>
      </div>
      <div className="p-4">
        <ResaleList
          showStats={false}  // 移动端隐藏统计节省空间
          limit={6}
          className="mobile-view"
        />
      </div>
    </div>
  );
}
```

### 管理后台使用
```jsx
function AdminResaleExample() {
  const handleViewDetails = (listing) => {
    // 管理员查看详情
    console.log('管理员查看:', listing);
    // 可以显示管理操作，如编辑、删除等
  };

  return (
    <ResaleList
      onViewDetails={handleViewDetails}
      showActions={true}
      enableSearch={true}
      enableFilter={true}
      showStats={true}
      limit={20}
      className="admin-mode"
    />
  );
}
```

## API 接口

### 获取转售列表
```http
GET /api/resale/list?page=1&limit=12&status=active
```

**查询参数:**
- `page`: 页码（默认: 1）
- `limit`: 每页数量（默认: 20）
- `status`: 状态筛选（可选: active, sold, expired, cancelled）

**响应格式:**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "1",
        "listing_price": 100.00,
        "original_price": 150.00,
        "status": "active",
        "profit": 50.00,
        "profit_percentage": 33.33,
        "listed_at": "2024-01-01T00:00:00Z",
        "products": {
          "name_zh": "示例商品",
          "image_url": "/images/product.jpg",
          "market_price": 150.00
        },
        "sellers": {
          "username": "seller123",
          "first_name": "张三"
        }
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 12,
    "totalPages": 5
  }
}
```

### 购买转售商品
```http
POST /api/resale/purchase/{listingId}
Authorization: Bearer {token}
```

**响应格式:**
```json
{
  "success": true,
  "data": {
    "order_id": "ORDER123",
    "message": "购买成功"
  }
}
```

## 样式定制

### CSS 类名
- `.resale-list`: 组件根容器
- `.resale-list .grid`: 网格布局
- `.resale-list .card`: 商品卡片
- `.resale-list .stats`: 统计卡片

### 自定义样式
```css
/* 自定义商品卡片样式 */
.resale-list .card {
  @apply shadow-lg hover:shadow-xl transition-shadow;
}

/* 自定义按钮样式 */
.resale-list .btn-purchase {
  @apply bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700;
}

/* 移动端样式 */
.mobile-view .resale-list {
  @apply px-2;
}

.mobile-view .resale-list .grid {
  @apply grid-cols-1;
}
```

## 事件处理

### onPurchase 回调
```typescript
interface PurchaseCallback {
  (listing: ResaleListing): void;
}

// 使用示例
const handlePurchase = (listing) => {
  // 1. 显示确认对话框
  if (!confirm(`确认购买 ${listing.products.name_zh}?`)) {
    return;
  }

  // 2. 调用购买API
  fetch(`/api/resale/purchase/${listing.id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // 3. 购买成功处理
      alert('购买成功！');
      // 4. 刷新列表或更新UI
    } else {
      // 5. 购买失败处理
      alert(data.error || '购买失败');
    }
  })
  .catch(error => {
    console.error('购买失败:', error);
    alert('购买失败，请重试');
  });
};
```

### onViewDetails 回调
```typescript
interface ViewDetailsCallback {
  (listing: ResaleListing): void;
}

// 使用示例
const handleViewDetails = (listing) => {
  // 方法1: 跳转到详情页
  router.push(`/resale/${listing.id}`);

  // 方法2: 显示模态框
  setSelectedListing(listing);
  setShowModal(true);

  // 方法3: 显示侧边栏
  setShowSidebar(true);
  setCurrentListing(listing);
};
```

## 状态管理

### 组件内部状态
- `listings`: 转售商品列表
- `loading`: 加载状态
- `error`: 错误信息
- `searchQuery`: 搜索关键词
- `statusFilter`: 状态筛选
- `sortBy`: 排序方式
- `currentPage`: 当前页码
- `purchasing`: 购买中的商品ID

### 状态说明
- **loading**: true 表示正在加载数据
- **error**: 包含错误信息，null 表示无错误
- **searchQuery**: 空字符串表示无搜索条件
- **statusFilter**: 'all' 表示显示所有状态
- **purchasing**: null 表示无商品正在购买中

## 性能优化

### 数据缓存
- 组件内部缓存列表数据
- 搜索使用防抖（300ms）
- 分页数据按需加载

### 图片优化
- 使用 Next.js Image 组件
- 自动错误处理和占位图
- 懒加载支持

### 响应式设计
- 移动端优化布局
- 自适应网格列数
- 触摸友好的交互

## 错误处理

### 网络错误
- 自动显示错误信息
- 提供重试按钮
- 优雅的错误降级

### 图片加载失败
- 自动使用占位图片
- 不影响其他功能

### API 错误
- 显示用户友好的错误信息
- 记录详细错误日志
- 避免显示技术错误细节

## 浏览器兼容性

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ 移动端浏览器

## 依赖项

### 核心依赖
- React 18+
- Next.js 13+
- TypeScript 4.5+
- Tailwind CSS 3+

### UI 组件
- @/components/ui/card
- @/components/ui/button
- @/components/ui/input
- @/components/ui/badge

### 图标
- 使用 SVG 图标（内联）
- 无需额外图标库依赖

## 最佳实践

### 1. 性能优化
- 合理设置 `limit` 参数避免一次加载过多数据
- 移动端建议设置 `limit={6}`
- 管理后台可以设置较大的 `limit={20}`

### 2. 用户体验
- 启用搜索和筛选功能提升用户体验
- 在移动端考虑隐藏统计数据节省空间
- 提供清晰的加载和错误状态

### 3. 数据安全
- 购买操作需要用户确认
- 敏感操作显示二次确认
- 记录用户操作日志

### 4. 错误处理
- 为网络错误提供重试机制
- 为图片加载失败提供占位图
- 为API错误提供用户友好的错误信息

## 常见问题

### Q: 如何自定义商品卡片的样式？
A: 使用 `className` 属性添加自定义CSS类，或通过CSS模块覆盖默认样式。

### Q: 如何禁用购买功能？
A: 设置 `showActions={false}` 隐藏所有操作按钮，或不传递 `onPurchase` 回调。

### Q: 如何在列表中显示更多商品信息？
A: 可以修改组件添加更多字段，或创建自定义的 `renderListingCard` 函数。

### Q: 支持服务端渲染吗？
A: 支持，这是一个客户端组件，使用了 useState 和 useEffect，需要在客户端渲染。

## 更新日志

### v1.0.0 (2024-01-01)
- ✨ 初始版本发布
- ✨ 完整的转售列表功能
- ✨ 搜索和筛选功能
- ✨ 响应式设计支持

---

如有问题或建议，请提交 Issue 或 Pull Request。