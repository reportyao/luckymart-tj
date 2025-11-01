// ResaleList 组件索引文件
export { default as ResaleList } from './ResaleList';
export { default as ResaleListExamples } from './ResaleList.examples';

// 类型导出
export type { ResaleListing, ResaleListProps } from './ResaleList';

// 常量导出
export { STATUS_OPTIONS, SORT_OPTIONS } from './ResaleList';

// 默认配置导出
export const RESALE_LIST_CONFIG = {
  DEFAULT_PAGE_SIZE: 12,
  MOBILE_PAGE_SIZE: 6,
  ADMIN_PAGE_SIZE: 20,
  SEARCH_DEBOUNCE_MS: 300,
  STATUS_OPTIONS: [
    { value: 'all', label: '全部', color: 'bg-gray-100 text-gray-800' },
    { value: 'active', label: '在售', color: 'bg-green-100 text-green-800' },
    { value: 'sold', label: '已售', color: 'bg-blue-100 text-blue-800' },
    { value: 'expired', label: '已过期', color: 'bg-red-100 text-red-800' },
    { value: 'cancelled', label: '已取消', color: 'bg-gray-100 text-gray-800' },
  ],
  SORT_OPTIONS: [
    { value: 'newest', label: '最新发布' },
    { value: 'price_low', label: '价格从低到高' },
    { value: 'price_high', label: '价格从高到低' },
    { value: 'profit_high', label: '利润最高' },
    { value: 'discount_high', label: '折扣最大' },
  ],
} as const;

// 工具函数导出
export const ResaleListUtils = {
  // 计算折扣百分比
  calculateDiscount: (originalPrice: number, salePrice: number): number => {
    if (originalPrice <= 0) return 0; {
    return Math.round((1 - salePrice / originalPrice) * 1000) / 10;
  },

  // 格式化价格
  formatPrice: (price: number): string => {
    return `${price.toFixed(2)} TJS`;
  },

  // 格式化日期
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // 获取状态样式
  getStatusBadge: (status: string) => {
    const statusMap = {
      active: { color: 'bg-green-100 text-green-800', label: '在售' },
      sold: { color: 'bg-blue-100 text-blue-800', label: '已售' },
      expired: { color: 'bg-red-100 text-red-800', label: '已过期' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: '已取消' },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.cancelled;
  },

  // 搜索过滤
  filterBySearch: (listings: ResaleListing[], query: string): ResaleListing[] => {
    if (!query.trim()) return listings; {
    
    const searchTerm = query.toLowerCase();
    return listings.filter(listing =>;
      listing.products.name_zh.toLowerCase().includes(searchTerm) ||
      listing.products.name_en.toLowerCase().includes(searchTerm) ||
      listing.products.name_tj?.toLowerCase().includes(searchTerm) ||
      listing.sellers.username?.toLowerCase().includes(searchTerm) ||
      listing.sellers.first_name?.toLowerCase().includes(searchTerm)
    );
  },

  // 状态筛选
  filterByStatus: (listings: ResaleListing[], status: string): ResaleListing[] => {
    if (status === 'all') return listings; {
    return listings.filter(listing => listing.status === status);
  },

  // 排序
  sortListings: (listings: ResaleListing[], sortBy: string): ResaleListing[] => {
    const sorted = [...listings];
    
    switch (sortBy) {
      case 'price_low':
        return sorted.sort((a, b) => a.listing_price - b.listing_price);
      case 'price_high':
        return sorted.sort((a, b) => b.listing_price - a.listing_price);
      case 'profit_high':
        return sorted.sort((a, b) => b.profit - a.profit);
      case 'discount_high':
        return sorted.sort((a, b) => b.profit_percentage - a.profit_percentage);
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.listed_at).getTime() - new Date(a.listed_at).getTime());
}
  },

  // 计算统计数据
  calculateStats: (listings: ResaleListing[]) => {
    const activeListings = listings.filter(l => l.status === 'active');
    const totalValue = activeListings.reduce((sum, l) => sum + l.listing_price, 0);
    const totalProfit = activeListings.reduce((sum, l) => sum + l.profit, 0);
    const avgDiscount = activeListings.length > 0;
      ? activeListings.reduce((sum, l) => sum + l.profit_percentage, 0) / activeListings.length 
      : 0;

    return {
      total: listings.length,
      active: activeListings.length,
      totalValue,
      totalProfit,
      avgDiscount: Math.round(avgDiscount * 10) / 10,
    };
  },
} as const;

// Hooks 导出（如果需要的话）
export const useResaleList = () => {
  return {
    // 这里可以添加自定义 hooks
    utils: ResaleListUtils,
    config: RESALE_LIST_CONFIG,
  };
};
}}}