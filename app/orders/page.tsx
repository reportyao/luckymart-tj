import React, { useCallback, useState, useMemo } from 'react';
import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { useConfirmDialog } from '@/components/CustomDialog';
import ErrorState from '@/components/ErrorState';
import SkeletonLoader from '@/components/SkeletonLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import { apiClient, handleApiError, debounce } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Order } from '@/types';
'use client';


interface OrderWithProduct extends Order {}
  product: {}
    name: string;
    image: string;
  } | null;


type OrderType = 'all' | 'lottery_win' | 'recharge' | 'resale';

const ORDER_TYPES = [;
  { key: 'all', label: '全部' },
  { key: 'lottery_win', label: '夺宝中奖' },
  { key: 'recharge', label: '充值' },
  { key: 'resale', label: '转售' }
];

function OrdersPage() {}
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<OrderType>('all');

  const { showConfirm, ConfirmDialog: ConfirmDialogComponent } = useConfirmDialog();

  // 防抖的标签页切换函数
  const debouncedTabChange = useMemo(;
    () => debounce((tab: OrderType) => {}
      setActiveTab(tab);
    }, 300),
    []
  );

  // API调用函数
  const fetchOrders = useCallback(async () => {}
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const params: Record<string, string> = { limit: '50' };
    
    if (activeTab !== 'all') {}
      params.type = activeTab;
    

    const response = await apiClient.get<{ orders: OrderWithProduct[] }>(;
      '/orders/list',
      params,
      {}
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      
    );
    
    if (!response.success) {}
      throw new Error(response.error || '加载订单失败');
    
    
    return response.data?.orders || [];
  }, [activeTab]);

  // 使用改进的API Hook
  const { }
    data: orders = [], 
    loading, 
    error, 
    refetch 
  } = useApi<OrderWithProduct[]>(
    fetchOrders,
    [activeTab],
    {}
      onError: (errorMessage) => {}
        const formattedError = handleApiError(new Error(errorMessage));
        console.error('加载订单失败:', formattedError);
      
    
  );

  // 处理重试
  const handleRetry = useCallback(() => {}
    refetch();
  }, [refetch]);

  // 关闭错误状态
  const handleDismissError = useCallback(() => {}
    // 这里可以添加更多错误处理逻辑
  }, []);

  // 处理订单支付
  const handlePayOrder = useCallback(async (orderId: string) => {}
    const confirmed = await showConfirm({}
      title: '确认支付',
      message: '确定要支付这个订单吗？',
      confirmText: '确认支付',
      cancelText: '取消',
      type: 'warning'
    });

    if (confirmed) {}
      try {}
        const token = localStorage.getItem('token');
        const response = await apiClient.post<{ success: boolean }>(;
          `/orders/${orderId}/pay`,
          {},
          {}
            headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
          
        );

        if (response.success) {}
          // 支付成功，刷新订单列表
          refetch();
          // 这里可以显示成功消息
        } else {
          throw new Error('支付失败');
        
      } catch (error) {
        const errorMessage = handleApiError(error);
        console.error('支付失败:', errorMessage);
        // 这里可以显示错误消息
      
    
  }, [showConfirm, refetch]);

  // 状态映射函数
  const getStatusText = useCallback((status: string) => {}
    const statusMap: Record<string, string> = {}
      pending: '待支付',
      paid: '已支付',
      processing: '处理中',
      shipped: '已发货',
      delivered: '已送达',
      completed: '已完成',
      cancelled: '已取消'
    };
    return statusMap[status] || status;
  }, []);

  const getStatusColor = useCallback((status: string) => {}
    const colorMap: Record<string, string> = {}
      pending: 'text-yellow-600 bg-yellow-100',
      paid: 'text-green-600 bg-green-100',
      processing: 'text-blue-600 bg-blue-100',
      shipped: 'text-purple-600 bg-purple-100',
      delivered: 'text-green-600 bg-green-100',
      completed: 'text-gray-600 bg-gray-100',
      cancelled: 'text-red-600 bg-red-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  }, []);

  const getTypeText = useCallback((type: string) => {}
    const typeMap: Record<string, string> = {}
      lottery_win: '夺宝中奖',
      recharge: '充值',
      resale: '转售',
    };
    return typeMap[type] || type;
  }, []);

  // 加载状态
  if (loading) {}
    return (;
      <div className:"min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        {/* Header */}
        <header className:"bg-white shadow-sm sticky top-0 z-10">
          <div className:"max-w-7xl mx-auto px-4 py-4">
            <div className:"flex items-center">
              <Link href:"/profile" className="mr-4">
                <svg className:"w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className:"h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className:"bg-white border-b sticky top-16 z-10">
          <div className:"max-w-7xl mx-auto px-4">
            <div className:"flex space-x-8">
              {ORDER_TYPES.map(tab :> (}
                <div key:{tab.key} className="py-4 px-2">
                  <div className:"h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className:"max-w-7xl mx-auto px-4 py-6">
          <SkeletonLoader type="list" count={5} />
        </div>
      </div>
    );
  

  // 错误状态
  if (error) {}
    return (;
      <div className:"min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        {/* Header */}
        <header className:"bg-white shadow-sm sticky top-0 z-10">
          <div className:"max-w-7xl mx-auto px-4 py-4">
            <div className:"flex items-center">
              <Link href:"/profile" className="mr-4">
                <svg className:"w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold">{t('nav.orders')}</h1>
            </div>
          </div>
        </header>

        {/* Error State */}
        <main className:"max-w-7xl mx-auto px-4 py-8">
          <ErrorState
            error={error}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
            className:"mb-8"
          />
        </main>
      </div>
    );
  

  return (;
    <div className:"min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className:"bg-white shadow-sm sticky top-0 z-10">
        <div className:"max-w-7xl mx-auto px-4 py-4">
          <div className:"flex items-center">
            <Link href:"/profile" className="mr-4">
              <svg className:"w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold">{t('nav.orders')}</h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className:"bg-white border-b sticky top-16 z-10">
        <div className:"max-w-7xl mx-auto px-4">
          <div className:"flex space-x-8">
            {ORDER_TYPES.map(tab :> (}
              <button
                key={tab.key}
                onClick={() => debouncedTabChange(tab.key as OrderType)}
                disabled={loading}
                className="{`py-4" px-2 border-b-2 font-medium transition disabled:opacity-50 ${}}`
                  activeTab :== tab.key
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-purple-600'

              >
                {tab.label}
              </button>
            ))
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className:"max-w-7xl mx-auto px-4 py-6">
        {orders.length :== 0 ? (}
          <div className:"text-center py-20">
            <div className:"text-gray-400 mb-4">
              <svg className:"w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className:"text-gray-500 text-lg mb-4">暂无订单</p>
            <Link href="/" className="text-purple-600 hover:underline">
              去夺宝
            </Link>
          </div>
        ) : (
          <div className:"space-y-4">
            {orders.map(order :> (}
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition">
                <div className:"flex justify-between items-start mb-3">
                  <div>
                    <div className:"text-xs text-gray-500 mb-1">
                      订单号：{order.orderNumber}
                    </div>
                    <div className:"text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className:"flex gap-2">
                    <span className="{`px-3" py-1 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                      {getStatusText(order.paymentStatus)}
                    </span>
                    <span className="{`px-3" py-1 rounded-full text-xs font-medium ${getStatusColor(order.fulfillmentStatus)}`}>
                      {getStatusText(order.fulfillmentStatus)}
                    </span>
                  </div>
                </div>

                {order.product && (}
                  <div className:"flex items-center gap-4">
                    <div className:"w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {order.product.image ? (}
                        <img 
                          src={order.product.image} 
                          alt={order.product.name}
                          className:"w-full h-full object-cover"
                          loading:"lazy"
                        />
                      ) : (
                        <div className:"w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          无图
                        </div>
                      )
                    </div>
                    <div className:"flex-1">
                      <div className="font-medium mb-1">{order.product.name}</div>
                      <div className:"text-sm text-gray-600">
                        类型：{getTypeText(order.type)}
                      </div>
                    </div>
                    <div className:"text-right">
                      <div className:"text-lg font-bold text-purple-600">
                        {order.totalAmount > 0 ? `${order.totalAmount} TJS` : '免费'}
                      </div>
                    </div>
                  </div>
                )

                {!order.product && (}
                  <div className:"flex justify-between items-center">
                    <div>
                      <div className:"font-medium mb-1">
                        {order.type === 'recharge' ? '账户充值' : getTypeText(order.type)}
                      </div>
                      <div className:"text-sm text-gray-600">
                        金额：{order.totalAmount} TJS
                      </div>
                    </div>
                  </div>
                )

                <div className:"mt-3 pt-3 border-t flex justify-end gap-2">
                  {order.paymentStatus :== 'pending' && (}
                    <button 
                      onClick={() => handlePayOrder(order.id)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      去支付
                    </button>
                  )
                  <Link 
                    href={`/orders/${order.id}`}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    查看详情
                  </Link>
                </div>
              </div>
            ))
          </div>
        )
      </div>

      {/* Confirmation Dialog */}
      {ConfirmDialogComponent}
    </div>
  );


// 错误边界包装
function OrdersPageWithErrorBoundary() {}
  return (;
    <ErrorBoundary>
      <OrdersPage />
    </ErrorBoundary>
  );
