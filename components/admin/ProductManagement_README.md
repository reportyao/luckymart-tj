# ProductManagement 组件

ProductManagement是一个功能完整的产品管理组件，专为管理后台设计，提供全面的产品管理功能。

## 功能特性

### 🔍 产品列表展示
- 分页显示产品列表
- 支持多选操作
- 实时数据更新
- 响应式表格设计

### 📊 数据统计
- 总产品数统计
- 上架/下架状态统计
- 待审核产品统计
- 库存价值统计
- 低库存预警

### 🔍 搜索与筛选
- 全文搜索（支持多语言）
- 状态筛选（全部/上架/下架/待审核/售罄）
- 分类筛选
- 价格范围筛选
- 多维度排序

### ✏️ 产品管理
- **添加产品**: 支持多语言产品信息
- **编辑产品**: 完整的产品信息编辑
- **删除产品**: 安全删除确认
- **状态管理**: 一键上架/下架
- **批量操作**: 批量上架/下架/删除

### 📦 库存管理
- 实时库存显示
- 低库存预警
- 库存数量调整
- 售罄状态管理

### 💰 价格管理
- 市场价格设置
- 每份价格计算
- 总份数管理
- 价格范围分析

### 🏷️ 营销功能
- 营销角标设置
- 多语言角标文字
- 自定义颜色和位置
- 动画效果配置

## 组件接口

### ProductManagementProps

```typescript
interface ProductManagementProps {
  className?: string;                    // 自定义样式类
  showAdvancedFeatures?: boolean;        // 显示高级功能
  defaultPageSize?: number;              // 默认页面大小
  onProductChange?: () => void;          // 产品变化回调
}
```

### ProductStats

```typescript
interface ProductStats {
  totalProducts: number;      // 总产品数
  activeProducts: number;     // 上架产品数
  inactiveProducts: number;   // 下架产品数
  pendingProducts: number;    // 待审核产品数
  soldoutProducts: number;    // 售罄产品数
  lowStockProducts: number;   // 低库存产品数
  totalValue: number;         // 总库存价值
  avgPrice: number;           // 平均价格
}
```

### ProductFilters

```typescript
interface ProductFilters {
  status: string;           // 状态筛选
  category: string;         // 分类筛选
  searchQuery: string;      // 搜索关键词
  priceRange: string;       // 价格范围
  sortBy: string;          // 排序字段
  sortOrder: 'asc' | 'desc'; // 排序方向
```

## 使用方法

### 基础使用

```tsx
import { ProductManagement } from '@/components/admin';

function AdminProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProductManagement 
        defaultPageSize={20}
        showAdvancedFeatures={true}
        onProductChange={() => {
          console.log('产品数据已更新');
        }}
      />
    </div>
  );
}
```

### 带权限控制的使用

```tsx
import { ProductManagement } from '@/components/admin';
import { PagePermission } from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin-permission-manager';

function ProtectedProductManagementPage() {
  return (
    <PagePermission 
      permissions={AdminPermissions.products.read()}
      showFallback={true}
    >
      <ProductManagement />
    </PagePermission>
  );
}
```

### 自定义样式

```tsx
<ProductManagement 
  className="custom-product-management"
  showAdvancedFeatures={false}
  defaultPageSize={15}
/>
```

## 数据交互

### API端点

组件需要以下API端点支持：

```javascript
// 获取产品列表
GET /api/admin/products
// Query: ?page=1&limit=10&status=active&category=electronics&search=iphone

// 更新产品状态
PATCH /api/admin/products/{id}/status
// Body: { status: 'active' | 'inactive' | 'pending' | 'soldout' }

// 删除产品
DELETE /api/admin/products/{id}

// 批量操作
POST /api/admin/products/batch
// Body: { productIds: string[], action: 'activate' | 'deactivate' | 'delete' }

// 创建产品
POST /api/admin/products
// Body: Product数据

// 更新产品
PUT /api/admin/products/{id}
// Body: Product数据
```

### 模拟数据

组件内置了完整的模拟数据，包括：
- 3个示例产品（iPhone、MacBook、Nike运动鞋）
- 完整的产品统计数据
- 实时筛选和搜索功能
- 分页和排序功能

## 界面特色

### 🎨 现代化设计
- 遵循Material Design设计规范
- 响应式布局，适配各种屏幕
- 深色/浅色主题支持
- 流畅的动画效果

### 📱 移动端友好
- 触摸优化的交互设计
- 滑动操作支持
- 移动端分页优化
- 响应式表格

### ⚡ 高性能
- 虚拟滚动支持（大数据量）
- 懒加载图片
- 防抖搜索
- 分页加载优化

### 🔒 安全特性
- 权限验证集成
- 操作确认弹窗
- 数据验证
- XSS防护

## 多语言支持

组件完全支持多语言，包括：
- 中文（简体/繁体）
- 英文
- 俄文
- 塔吉克文

### 状态文本国际化

```typescript
const statusOptions = [
  { value: 'active', label: '上架中', zh: '上架中', en: 'Active', ru: 'Активный' },
  { value: 'pending', label: '待审核', zh: '待审核', en: 'Pending', ru: 'Ожидает' },
  { value: 'inactive', label: '已下架', zh: '已下架', en: 'Inactive', ru: 'Неактивный' },
  { value: 'soldout', label: '已售罄', zh: '已售罄', en: 'Sold Out', ru: 'Распродано' }
];
```

## 样式定制

### CSS类名

组件使用以下CSS类名前缀：
- `product-management-*`
- `pm-*`

### 自定义主题

```css
.product-management {
  --pm-primary-color: #3B82F6;
  --pm-success-color: #10B981;
  --pm-warning-color: #F59E0B;
  --pm-error-color: #EF4444;
  --pm-background: #F9FAFB;
  --pm-card-background: #FFFFFF;
  --pm-border-color: #E5E7EB;
}
```

## 错误处理

组件包含完整的错误处理机制：

### 加载错误
- 网络连接失败
- API响应错误
- 数据格式错误

### 操作错误
- 权限不足
- 数据验证失败
- 并发操作冲突

### 用户反馈
- 错误提示弹窗
- 操作确认对话框
- 加载状态指示
- 成功操作通知

## 性能优化

### 数据加载优化
- 分页加载
- 虚拟滚动
- 缓存机制
- 防抖搜索

### UI优化
- 组件懒加载
- 动画优化
- 内存管理
- 重渲染优化

## 浏览器兼容性

支持以下浏览器：
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 开发注意事项

### 1. 数据验证
- 所有用户输入都需要验证
- 价格字段使用数字类型
- 必填字段标识

### 2. 权限控制
- 集成PagePermission组件
- 按钮级权限控制
- API调用权限验证

### 3. 错误边界
- 组件级错误边界
- 网络错误处理
- 用户友好的错误提示

### 4. 测试覆盖
- 单元测试
- 集成测试
- E2E测试
- 性能测试

## 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 完整的产品管理功能
- 多语言支持
- 响应式设计
- 权限集成

## 贡献指南

欢迎提交Issue和Pull Request来改进这个组件。

### 代码规范
- 使用TypeScript严格模式
- 遵循ESLint规则
- 使用Prettier格式化
- 编写有意义的注释

### 提交流程
1. Fork项目
2. 创建功能分支
3. 编写测试用例
4. 提交代码
5. 创建Pull Request

## 许可证

本项目使用MIT许可证。