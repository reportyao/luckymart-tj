// OrderList 组件索引文件
export { default as OrderList } from './OrderList';
export type { Order, OrderItem, OrderListProps } from './OrderList';

// 常量导出
export { STATUS_OPTIONS, SORT_OPTIONS } from './OrderList';

// 默认配置导出
export const ORDER_LIST_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  MOBILE_PAGE_SIZE: 6,
  ADMIN_PAGE_SIZE: 20,
  SEARCH_DEBOUNCE_MS: 300,
  STATUS_OPTIONS: [
    { value: 'all', label: '全部', color: 'bg-gray-100 text-gray-800' },
    { value: 'pending', label: '待支付', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'paid', label: '已支付', color: 'bg-blue-100 text-blue-800' },
    { value: 'processing', label: '处理中', color: 'bg-purple-100 text-purple-800' },
    { value: 'shipped', label: '已发货', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'delivered', label: '已送达', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: '已取消', color: 'bg-red-100 text-red-800' },
    { value: 'refunded', label: '已退款', color: 'bg-gray-100 text-gray-800' },
  ],
  SORT_OPTIONS: [
    { value: 'newest', label: '最新创建' },
    { value: 'oldest', label: '最旧创建' },
    { value: 'amount_high', label: '金额从高到低' },
    { value: 'amount_low', label: '金额从低到高' },
    { value: 'status', label: '状态排序' },
  ],
} as const;

// 工具函数导出
export const OrderListUtils = {
  // 格式化价格
  formatPrice: (price: number): string => {
    return `${price.toFixed(2)} TJS`;
  },

  // 格式化日期
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // 获取状态样式
  getStatusBadge: (status: string) => {
    const statusMap = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: '待支付' },
      paid: { color: 'bg-blue-100 text-blue-800', label: '已支付' },
      processing: { color: 'bg-purple-100 text-purple-800', label: '处理中' },
      shipped: { color: 'bg-indigo-100 text-indigo-800', label: '已发货' },
      delivered: { color: 'bg-green-100 text-green-800', label: '已送达' },
      cancelled: { color: 'bg-red-100 text-red-800', label: '已取消' },
      refunded: { color: 'bg-gray-100 text-gray-800', label: '已退款' },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  },

  // 搜索过滤
  filterBySearch: (orders: Order[], query: string): Order[] => {
    if (!query.trim()) return orders;
    
    const searchTerm = query.toLowerCase();
    return orders.filter(order =>
      order.order_number.toLowerCase().includes(searchTerm) ||
      order.items.some(item =>
        item.products.name_zh.toLowerCase().includes(searchTerm) ||
        item.products.name_en.toLowerCase().includes(searchTerm) ||
        item.products.name_tj?.toLowerCase().includes(searchTerm)
      ) ||
      order.user?.username?.toLowerCase().includes(searchTerm) ||
      order.user?.first_name?.toLowerCase().includes(searchTerm) ||
      order.user?.phone?.includes(searchTerm)
    );
  },

  // 状态筛选
  filterByStatus: (orders: Order[], status: string): Order[] => {
    if (status === 'all') return orders;
    return orders.filter(order => order.status === status);
  },

  // 排序
  sortOrders: (orders: Order[], sortBy: string): Order[] => {
    const sorted = [...orders];
    
    switch (sortBy) {
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'amount_high':
        return sorted.sort((a, b) => b.total_amount - a.total_amount);
      case 'amount_low':
        return sorted.sort((a, b) => a.total_amount - b.total_amount);
      case 'status':
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  // 计算统计数据
  calculateStats: (orders: Order[]) => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const completed = orders.filter(o => ['delivered', 'refunded'].includes(o.status)).length;
    const totalValue = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const avgOrderValue = total > 0 ? totalValue / total : 0;

    return {
      total,
      pending,
      completed,
      totalValue,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    };
  },

  // 获取状态允许的操作
  getAllowedActions: (status: string): string[] => {
    const statusActions: Record<string, string[]> = {
      pending: ['viewDetails', 'cancelOrder'],
      paid: ['viewDetails', 'refundOrder'],
      processing: ['viewDetails', 'refundOrder'],
      shipped: ['viewDetails', 'refundOrder'],
      delivered: ['viewDetails'],
      cancelled: ['viewDetails'],
      refunded: ['viewDetails'],
    };
    return statusActions[status] || ['viewDetails'];
  },

  // 检查订单是否可以取消
  canCancel: (order: Order): boolean => {
    return ['pending'].includes(order.status);
  },

  // 检查订单是否可以申请退款
  canRefund: (order: Order): boolean => {
    return ['paid', 'processing', 'shipped'].includes(order.status);
  },

  // 检查订单是否已完成
  isCompleted: (order: Order): boolean => {
    return ['delivered', 'refunded'].includes(order.status);
  },

  // 获取订单总商品数量
  getTotalItems: (order: Order): number => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  // 获取订单商品总价值
  getTotalValue: (order: Order): number => {
    return order.items.reduce((sum, item) => sum + item.total_price, 0);
  },
} as const;

// Hooks 导出（如果需要的话）
export const useOrderList = () => {
  return {
    utils: OrderListUtils,
    config: ORDER_LIST_CONFIG,
  };
};