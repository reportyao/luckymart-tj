// OrderHistory组件相关类型定义

import type { Order } from '@/types';

// 扩展的订单类型，包含商品信息
export interface OrderWithProduct extends Order {
  product?: {
    id: string;
    name: string;
    image: string;
  } | null;
}

// 订单类型枚举
export type OrderType = 'all' | 'lottery_win' | 'recharge' | 'resale';

// 订单状态枚举
export type OrderStatus = 'all' | 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';

// 订单类型配置
export interface OrderTypeConfig {
  key: OrderType;
  label: string;
  icon: string;
}

// 订单状态配置
export interface OrderStatusConfig {
  key: OrderStatus;
  label: string;
  color: string;
}

// 订单筛选参数
export interface OrderFilterParams {
  type?: OrderType;
  status?: OrderStatus;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// 订单API响应
export interface OrderListResponse {
  orders: OrderWithProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 订单历史组件Props
export interface OrderHistoryProps {
  userId?: string;
  className?: string;
  showHeader?: boolean;
  pageSize?: number;
  enableFilter?: boolean;
  enableActions?: boolean;
  filterParams?: OrderFilterParams;
  onOrderPay?: (orderId: string) => void;
  onOrderView?: (orderId: string) => void;
}

// 简化版订单历史组件Props
export interface SimpleOrderHistoryProps {
  orders: OrderWithProduct[];
  className?: string;
  onPayOrder?: (orderId: string) => void;
  onOrderClick?: (orderId: string) => void;
  showActions?: boolean;
}

// 订单状态信息
export interface OrderStatusInfo {
  text: string;
  color: string;
  bgColor: string;
}

// 订单操作类型
export interface OrderAction {
  key: string;
  label: string;
  type?: 'primary' | 'secondary' | 'danger';
  onClick: (orderId: string) => void;
  show?: (order: OrderWithProduct) => boolean;
}

// 分页信息
export interface OrderPaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 订单统计信息
export interface OrderStatistics {
  totalOrders: number;
  totalAmount: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

// 订单列表加载状态
export interface OrderListState {
  orders: OrderWithProduct[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
}

// 订单历史过滤器状态
export interface OrderFilterState {
  activeType: OrderType;
  activeStatus: OrderStatus;
  searchQuery: string;
  dateRange: {
    start: string;
    end: string;
  } | null;
}