'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// 类型定义
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

// 状态筛选选项
const STATUS_OPTIONS = [
  { value: 'all', label: '全部', color: 'bg-gray-100 text-gray-800' },
  { value: 'pending', label: '待支付', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'paid', label: '已支付', color: 'bg-blue-100 text-blue-800' },
  { value: 'processing', label: '处理中', color: 'bg-purple-100 text-purple-800' },
  { value: 'shipped', label: '已发货', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'delivered', label: '已送达', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: '已取消', color: 'bg-red-100 text-red-800' },
  { value: 'refunded', label: '已退款', color: 'bg-gray-100 text-gray-800' },
];

// 排序选项
const SORT_OPTIONS = [
  { value: 'newest', label: '最新创建' },
  { value: 'oldest', label: '最旧创建' },
  { value: 'amount_high', label: '金额从高到低' },
  { value: 'amount_low', label: '金额从低到高' },
  { value: 'status', label: '状态排序' },
];

const OrderList: React.FC<OrderListProps> = ({
  userId,
  onViewDetails,
  onCancelOrder,
  onRefundOrder,
  showActions = true,
  className = '',
  limit,
  enableSearch = true,
  enableFilter = true,
  showStats = true,
}) => {
  // 状态管理
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 分页设置
  const itemsPerPage = limit || 10;

  // 获取订单列表数据
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (userId) {
        params.append('user_id', userId);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/orders?${params}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.data.orders);
        setTotalPages(data.data.totalPages || 1);
      } else {
        setError(data.error || '获取订单数据失败');
      }
    } catch (err) {
      console.error('获取订单列表失败:', err);
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和筛选条件变化时重新获取数据
  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, userId]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        setCurrentPage(1);
        fetchOrders();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 过滤和排序逻辑
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders;

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order) =>
        order.order_number.toLowerCase().includes(query) ||
        order.items.some(item =>
          item.products.name_zh.toLowerCase().includes(query) ||
          item.products.name_en.toLowerCase().includes(query) ||
          item.products.name_tj?.toLowerCase().includes(query)
        ) ||
        order.user?.username?.toLowerCase().includes(query) ||
        order.user?.first_name?.toLowerCase().includes(query) ||
        order.user?.phone?.includes(query)
      );
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // 排序
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'amount_high':
        filtered.sort((a, b) => b.total_amount - a.total_amount);
        break;
      case 'amount_low':
        filtered.sort((a, b) => a.total_amount - b.total_amount);
        break;
      case 'status':
        filtered.sort((a, b) => a.status.localeCompare(b.status));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return filtered;
  }, [orders, searchQuery, statusFilter, sortBy]);

  // 计算统计数据
  const stats = useMemo(() => {
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
  }, [orders]);

  // 查看订单详情
  const handleViewDetails = (order: Order) => {
    if (onViewDetails) {
      onViewDetails(order);
    } else {
      console.log('查看订单详情:', order);
    }
  };

  // 取消订单
  const handleCancelOrder = async (order: Order) => {
    if (onCancelOrder) {
      onCancelOrder(order);
      return;
    }

    if (!confirm(`确认取消订单 ${order.order_number}？`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('订单已取消');
        fetchOrders();
      } else {
        alert(data.error || '取消订单失败');
      }
    } catch (error) {
      console.error('取消订单失败:', error);
      alert('取消订单失败，请重试');
    }
  };

  // 申请退款
  const handleRefundOrder = async (order: Order) => {
    if (onRefundOrder) {
      onRefundOrder(order);
      return;
    }

    if (!confirm(`确认申请退款订单 ${order.order_number}？`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${order.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('退款申请已提交');
        fetchOrders();
      } else {
        alert(data.error || '申请退款失败');
      }
    } catch (error) {
      console.error('申请退款失败:', error);
      alert('申请退款失败，请重试');
    }
  };

  // 获取状态样式
  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    if (!option) return null;

    return (
      <Badge className={option.color}>
        {option.label}
      </Badge>
    );
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 渲染统计卡片
  const renderStats = () => {
    if (!showStats) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">总订单</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">待处理</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">已完成</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalValue.toFixed(2)} TJS
            </div>
            <div className="text-sm text-gray-600">总金额</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.avgOrderValue.toFixed(2)} TJS
            </div>
            <div className="text-sm text-gray-600">平均订单</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // 渲染搜索和筛选
  const renderFilters = () => {
    return (
      <div className="mb-6 space-y-4">
        {enableSearch && (
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索订单号、商品名称、用户名、电话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {enableFilter && (
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(option.value)}
                className="mb-2"
              >
                {option.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 渲染订单卡片
  const renderOrderCard = (order: Order) => {
    const userName = order.user?.first_name || order.user?.username || '匿名用户';
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              订单 #{order.order_number}
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(order.status)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* 商品信息 */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={order.items[0]?.products.image_url || '/images/placeholder.png'}
                  alt={order.items[0]?.products.name_zh || '商品图片'}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholder.png';
                  }}
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm line-clamp-1">
                  {order.items[0]?.products.name_zh || '商品信息'}
                </p>
                <p className="text-xs text-gray-500">
                  {itemCount} 件商品 • {userName}
                </p>
              </div>
            </div>

            {/* 商品列表预览 */}
            {order.items.length > 1 && (
              <p className="text-xs text-gray-500">
                还有 {order.items.length - 1} 件其他商品...
              </p>
            )}
          </div>

          {/* 价格信息 */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-red-600">
                {order.total_amount.toFixed(2)} TJS
              </span>
            </div>
          </div>

          {/* 时间信息 */}
          <div className="mb-4 text-xs text-gray-500 space-y-1">
            <div>创建时间: {formatDate(order.created_at)}</div>
            {order.updated_at !== order.created_at && (
              <div>更新时间: {formatDate(order.updated_at)}</div>
            )}
          </div>

          {/* 操作按钮 */}
          {showActions && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewDetails(order)}
                className="flex-1"
              >
                查看详情
              </Button>
              
              {order.status === 'pending' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCancelOrder(order)}
                  className="flex-1"
                >
                  取消订单
                </Button>
              )}

              {['paid', 'processing', 'shipped'].includes(order.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRefundOrder(order)}
                  className="flex-1"
                >
                  申请退款
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // 渲染分页
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          上一页
        </Button>

        {startPage > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="text-gray-400">...</span>}
          </>
        )}

        {pages.slice(startPage - 1, endPage).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          下一页
        </Button>
      </div>
    );
  };

  // 加载状态
  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchOrders}>重试</Button>
      </div>
    );
  }

  return (
    <div className={`order-list ${className}`}>
      {/* 统计信息 */}
      {renderStats()}

      {/* 搜索和筛选 */}
      {renderFilters()}

      {/* 订单列表 */}
      {filteredAndSortedOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p className="text-gray-500 text-lg mb-2">
            {searchQuery || statusFilter !== 'all' ? '没有找到符合条件的订单' : '暂无订单数据'}
          </p>
          <p className="text-gray-400 text-sm">
            {searchQuery || statusFilter !== 'all' ? '请尝试调整搜索条件或筛选条件' : '您的订单会在这里显示'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedOrders.map(renderOrderCard)}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default OrderList;