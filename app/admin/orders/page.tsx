'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Order } from '@/types';
import { PagePermission } from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin/permissions';

interface AdminOrder extends Order {
  users: {
    username?: string;
    firstName?: string;
    telegramId: string;
  };
  products: {
    nameZh: string;
    nameEn: string;
    imageUrl: string;
  };
}

function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending_shipment');
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    fetchOrders();
  }, [router, statusFilter]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/orders?status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders);
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShipment = async (orderId: number) => {
    const trackingNumber = prompt('请输入物流单号:');
    if (!trackingNumber) {return;}

    setProcessing(orderId);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          trackingNumber
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('发货成功！');
        fetchOrders();
      } else {
        alert(data.error || '发货失败');
      }
    } catch (error) {
      console.error('发货失败:', error);
      alert('发货失败，请重试');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending_address: '待填写地址',
      pending_shipment: '待发货',
      shipped: '已发货',
      delivered: '已送达',
      cancelled: '已取消'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending_address: 'bg-yellow-100 text-yellow-800',
      pending_shipment: 'bg-blue-100 text-blue-800',
      shipped: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">订单管理</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 状态筛选 */}
        <div className="bg-white rounded-xl p-4 shadow-md mb-6">
          <div className="flex flex-wrap gap-2">
            {['pending_address', 'pending_shipment', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getStatusText(status)}
              </button>
            ))}
          </div>
        </div>

        {/* 订单列表 */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-md">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">暂无{getStatusText(statusFilter)}的订单</p>
            </div>
          ) : (
            orders.map((order) => {
              const userName = order.users.firstName || order.users.username || '未知用户';
              
              return (
                <div key={order.id} className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex gap-4">
                    {/* 商品图片 */}
                    <div className="relative w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      <Image
                        src={order.products.imageUrl || '/images/placeholder.png'}
                        alt={order.products.nameZh}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* 订单信息 */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {order.products.nameZh}
                          </h3>
                          <p className="text-sm text-gray-600">订单号: {order.orderNumber}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-600">用户: </span>
                          <span className="font-medium">{userName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">下单时间: </span>
                          <span className="font-medium">{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                        
                        {order.recipientName && (
                          <>
                            <div>
                              <span className="text-gray-600">收件人: </span>
                              <span className="font-medium">{order.recipientName}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">联系电话: </span>
                              <span className="font-medium">{order.recipientPhone}</span>
                            </div>
                          </>
                        )}

                        {order.shippingAddress && (
                          <div className="col-span-2">
                            <span className="text-gray-600">收货地址: </span>
                            <span className="font-medium">{order.shippingAddress}</span>
                          </div>
                        )}

                        {order.trackingNumber && (
                          <div className="col-span-2">
                            <span className="text-gray-600">物流单号: </span>
                            <span className="font-medium text-blue-600">{order.trackingNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      {order.status === 'pending_shipment' && order.shippingAddress && (
                        <button
                          onClick={() => handleShipment(order.id)}
                          disabled={processing === order.id}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50"
                        >
                          {processing === order.id ? '处理中...' : '📦 发货'}
                        </button>
                      )}

                      {order.status === 'pending_address' && (
                        <div className="text-sm text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg">
                          ⚠️ 等待用户填写收货地址
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}


// 导出带权限控制的页面
function ProtectedOrdersPage() {
  return (
    <PagePermission 
      permissions={AdminPermissions.orders.read()}
      showFallback={true}
    >
      <AdminOrdersPage />
    </PagePermission>
  );
}

export default ProtectedOrdersPage;
