// OrderHistory组件统一导出文件
export { default as OrderHistory } from './OrderHistory';
export { SimpleOrderHistory } from './OrderHistory';

// 导出相关类型
export type {
  OrderWithProduct,
  OrderType,
  OrderStatus,
  OrderTypeConfig,
  OrderStatusConfig,
  OrderFilterParams,
  OrderListResponse,
  OrderHistoryProps,
  SimpleOrderHistoryProps,
  OrderStatusInfo,
  OrderAction,
  OrderPaginationInfo,
  OrderStatistics,
  OrderListState,
  OrderFilterState
} from '@/types/order-history';