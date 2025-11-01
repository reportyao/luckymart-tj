'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { useConfirmDialog } from '@/components/CustomDialog';
import ErrorState from '@/components/ErrorState';
import InfiniteScroll from '@/components/mobile/InfiniteScroll';
import { apiClient, handleApiError } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Order } from '@/types';

interface OrderWithProduct extends Order {
  product?: {
    id: string;
    name: string;
    image: string;
  } | null;
}

interface OrderHistoryProps {
  userId?: string;
  className?: string;
  showHeader?: boolean;
  pageSize?: number;
  enableFilter?: boolean;
  enableActions?: boolean;
}

type OrderType = 'all' | 'lottery_win' | 'recharge' | 'resale';
type OrderStatus = 'all' | 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const ORDER_TYPES = [
  { key: 'all', label: '全部', icon: '📋' },
  { key: 'lottery_win', label: '夺宝中奖', icon: '🎁' },
  { key: 'recharge', label: '充值', icon: '💰' },
  { key: 'resale', label: '转售', icon: '🔄' }
];

const ORDER_STATUSES = [
  { key: 'all', label: '全部状态', color: 'gray' },
  { key: 'pending', label: '待支付', color: 'yellow' },
  { key: 'paid', label: '已支付', color: 'green' },
  { key: 'processing', label: '处理中', color: 'blue' },
  { key: 'shipped', label: '已发货', color: 'purple' },
  { key: 'delivered', label: '已送达', color: 'green' },
  { key: 'completed', label: '已完成', color: 'gray' },
  { key: 'cancelled', label: '已取消', color: 'red' }
];

export default function OrderHistory({
  userId,
  className = '',
  showHeader = true,
  pageSize = 20,
  enableFilter = true,
  enableActions = true
}: OrderHistoryProps) {
  const { t } = useLanguage();
  const { showConfirm, ConfirmDialog: ConfirmDialogComponent } = useConfirmDialog();
  
  // 筛选状态
  const [activeType, setActiveType] = useState<OrderType>('all');
  const [activeStatus, setActiveStatus] = useState<OrderStatus>('all');

  // API调用函数
  const fetchOrders = useCallback(async (page: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const params: Record<string, string> = { 
      page: page.toString(),
      limit: pageSize.toString()
    };
    
    if (activeType !== 'all') {
      params.type = activeType;
    }
    
    if (activeStatus !== 'all') {
      params.status = activeStatus;
    }

    const response = await apiClient.get<{ 
      orders: OrderWithProduct[]; 
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    }>(
      '/orders/list',
      params,
      {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      }
    );
    
    if (!response.success) {
      throw new Error(response.error || '加载订单失败');
    }
    
    return {
      data: response.data?.orders || [],
      hasMore: response.data?.pagination ? 
        response.data.pagination.page < response.data.pagination.totalPages : 
        (response.data?.orders?.length || 0) >= pageSize
    };
  }, [activeType, activeStatus, pageSize]);

  // 使用API Hook
  const { 
    data: orders = [], 
    loading, 
    error, 
    refetch,
    hasMore,
    loadMore
  } = useApi<{ data: OrderWithProduct[]; hasMore: boolean }>(
    fetchOrders,
    [activeType, activeStatus, pageSize],
    {
      onError: (errorMessage) => {
        const formattedError = handleApiError(new Error(errorMessage));
        console.error('加载订单失败:', formattedError);
      }
    }
  );

  // 处理重试
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // 关闭错误状态
  const handleDismissError = useCallback(() => {
    // 这里可以添加更多错误处理逻辑
  }, []);

  // 处理订单支付
  const handlePayOrder = useCallback(async (orderId: string) => {
    const confirmed = await showConfirm({
      title: '确认支付',
      message: '确定要支付这个订单吗？',
      confirmText: '确认支付',
      cancelText: '取消',
      type: 'warning'
    });

    if (confirmed) {
      try {
        const token = localStorage.getItem('token');
        const response = await apiClient.post<{ success: boolean }>(
          `/orders/${orderId}/pay`,
          {},
          {
            headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
          }
        );

        if (response.success) {
          refetch();
        } else {
          throw new Error('支付失败');
        }
      } catch (error) {
        const errorMessage = handleApiError(error);
        console.error('支付失败:', errorMessage);
      }
    }
  }, [showConfirm, refetch]);

  // 状态映射函数
  const getStatusInfo = useCallback((status: string) => {
    const statusMap: Record<string, { text: string; color: string; bgColor: string }> = {
      pending: { text: '待支付', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
      paid: { text: '已支付', color: 'text-green-700', bgColor: 'bg-green-100' },
      processing: { text: '处理中', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      shipped: { text: '已发货', color: 'text-purple-700', bgColor: 'bg-purple-100' },
      delivered: { text: '已送达', color: 'text-green-700', bgColor: 'bg-green-100' },
      completed: { text: '已完成', color: 'text-gray-700', bgColor: 'bg-gray-100' },
      cancelled: { text: '已取消', color: 'text-red-700', bgColor: 'bg-red-100' }
    };
    return statusMap[status] || { text: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
  }, []);

  const getTypeText = useCallback((type: string) => {
    const typeMap: Record<string, string> = {
      lottery_win: '夺宝中奖',
      recharge: '充值',
      resale: '转售',
      direct_buy: '直接购买'
    };
    return typeMap[type] || type;
  }, []);

  // 筛选器组件
  const FilterTabs = () => (
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* 订单类型筛选 */}
        <div className="flex space-x-1 overflow-x-auto py-2">
          {ORDER_TYPES.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveType(tab.key as OrderType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${
                activeType === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* 订单状态筛选 */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {ORDER_STATUSES.map(status => (
            <button
              key={status.key}
              onClick={() => setActiveStatus(status.key as OrderStatus)}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-medium transition ${
                activeStatus === status.key
                  ? `bg-${status.color}-600 text-white`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // 订单项组件
  const OrderItem = ({ order }: { order: OrderWithProduct }) => {
    const paymentStatus = getStatusInfo(order.paymentStatus);
    const fulfillmentStatus = getStatusInfo(order.fulfillmentStatus);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition"
      >
        {/* 订单头部信息 */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">
              订单号：{order.orderNumber}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(order.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatus.color} ${paymentStatus.bgColor}`}>
              支付：{paymentStatus.text}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${fulfillmentStatus.color} ${fulfillmentStatus.bgColor}`}>
              履约：{fulfillmentStatus.text}
            </span>
          </div>
        </div>

        {/* 商品信息 */}
        {order.product ? (
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {order.product.image ? (
                <img 
                  src={order.product.image} 
                  alt={order.product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  无图
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium mb-1">{order.product.name}</div>
              <div className="text-sm text-gray-600">
                类型：{getTypeText(order.type)}
              </div>
              <div className="text-sm text-gray-600">
                数量：{order.quantity}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-600">
                {order.totalAmount > 0 ? `${order.totalAmount} TJS` : '免费'}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="font-medium mb-1">
                {order.type === 'recharge' ? '账户充值' : getTypeText(order.type)}
              </div>
              <div className="text-sm text-gray-600">
                数量：{order.quantity} | 金额：{order.totalAmount} TJS
              </div>
            </div>
            <div className="text-lg font-bold text-purple-600">
              {order.totalAmount > 0 ? `${order.totalAmount} TJS` : '免费'}
            </div>
          </div>
        )}

        {/* 追踪信息 */}
        {order.trackingNumber && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600">快递单号：{order.trackingNumber}</div>
          </div>
        )}

        {/* 操作按钮 */}
        {enableActions && (
          <div className="mt-3 pt-3 border-t flex justify-end gap-2">
            {order.paymentStatus === 'pending' && (
              <button 
                onClick={() => handlePayOrder(order.id)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
              >
                去支付
              </button>
            )}
            <Link 
              href={`/orders/${order.id}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              查看详情
            </Link>
          </div>
        )}
      </motion.div>
    );
  };

  // 空状态组件
  const EmptyState = () => (
    <div className="text-center py-20">
      <div className="text-gray-400 mb-4">
        <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-gray-500 text-lg mb-4">暂无订单</p>
      <Link href="/" className="text-purple-600 hover:underline">
        去夺宝
      </Link>
    </div>
  );

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen ${className}`}>
      {/* Header */}
      {showHeader && (
        <header className="bg-white shadow-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center">
              <Link href="/profile" className="mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold">订单历史</h1>
            </div>
          </div>
        </header>
      )}

      {/* 筛选器 */}
      {enableFilter && <FilterTabs />}

      {/* 订单列表 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error ? (
          <ErrorState
            error={error}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
            className="mb-8"
          />
        ) : (
          <InfiniteScroll
            data={orders}
            renderItem={(order) => <OrderItem key={order.id} order={order} />}
            loadMore={(page) => fetchOrders(page)}
            hasMore={hasMore}
            pageSize={pageSize}
            className="space-y-4"
            loadingComponent={
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">加载中...</span>
                </div>
              </div>
            }
            endComponent={
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>没有更多订单了</p>
              </div>
            }
            errorComponent={
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">加载失败</p>
                <button
                  onClick={() => loadMore()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  重试
                </button>
              </div>
            }
            emptyComponent={<EmptyState />}
          />
        )}
      </div>

      {/* 确认对话框 */}
      {ConfirmDialogComponent}
    </div>
  );
}

// 简化版组件 - 用于内嵌展示
export function SimpleOrderHistory({ 
  orders, 
  className = '',
  onPayOrder 
}: { 
  orders: OrderWithProduct[]; 
  className?: string;
  onPayOrder?: (orderId: string) => void;
}) {
  const getStatusInfo = useCallback((status: string) => {
    const statusMap: Record<string, { text: string; color: string; bgColor: string }> = {
      pending: { text: '待支付', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
      paid: { text: '已支付', color: 'text-green-700', bgColor: 'bg-green-100' },
      processing: { text: '处理中', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      shipped: { text: '已发货', color: 'text-purple-700', bgColor: 'bg-purple-100' },
      delivered: { text: '已送达', color: 'text-green-700', bgColor: 'bg-green-100' },
      completed: { text: '已完成', color: 'text-gray-700', bgColor: 'bg-gray-100' },
      cancelled: { text: '已取消', color: 'text-red-700', bgColor: 'bg-red-100' }
    };
    return statusMap[status] || { text: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
  }, []);

  const getTypeText = useCallback((type: string) => {
    const typeMap: Record<string, string> = {
      lottery_win: '夺宝中奖',
      recharge: '充值',
      resale: '转售',
      direct_buy: '直接购买'
    };
    return typeMap[type] || type;
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      <AnimatePresence>
        {orders.map((order) => {
          const paymentStatus = getStatusInfo(order.paymentStatus);
          const fulfillmentStatus = getStatusInfo(order.fulfillmentStatus);
          
          return (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg p-4 shadow-sm border"
            >
              {/* 订单头部 */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-medium">#{order.orderNumber}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className={`px-2 py-1 rounded text-xs ${paymentStatus.color} ${paymentStatus.bgColor}`}>
                    {paymentStatus.text}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${fulfillmentStatus.color} ${fulfillmentStatus.bgColor}`}>
                    {fulfillmentStatus.text}
                  </span>
                </div>
              </div>

              {/* 商品信息 */}
              {order.product && (
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {order.product.image ? (
                      <img 
                        src={order.product.image} 
                        alt={order.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        无图
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{order.product.name}</div>
                    <div className="text-xs text-gray-500">
                      {getTypeText(order.type)} x {order.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-purple-600">
                      {order.totalAmount > 0 ? `${order.totalAmount} TJS` : '免费'}
                    </div>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              {onPayOrder && order.paymentStatus === 'pending' && (
                <div className="flex justify-end">
                  <button 
                    onClick={() => onPayOrder(order.id)}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                  >
                    立即支付
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}