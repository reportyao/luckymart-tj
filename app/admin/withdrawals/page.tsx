'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WithdrawRequest } from '@/types';

interface AdminWithdrawRequest extends WithdrawRequest {
  users: {
    username?: string;
    firstName?: string;
    telegramId: string;
  };
}

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    fetchWithdrawals();
  }, [router, statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/withdrawals?status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setWithdrawals(data.data.withdrawals);
      }
    } catch (error) {
      console.error('获取提现列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawId: number) => {
    if (!confirm('确认通过该提现申请？')) return;

    setProcessing(withdrawId);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          withdrawId,
          action: 'approve'
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('提现申请已通过');
        fetchWithdrawals();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('审核失败:', error);
      alert('操作失败，请重试');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (withdrawId: number) => {
    const reason = prompt('请输入拒绝原因:');
    if (!reason) return;

    setProcessing(withdrawId);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          withdrawId,
          action: 'reject',
          adminNote: reason
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('提现申请已拒绝');
        fetchWithdrawals();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('审核失败:', error);
      alert('操作失败，请重试');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: '待审核',
      processing: '处理中',
      completed: '已完成',
      rejected: '已拒绝'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentMethodText = (method: string) => {
    return method === 'alif_mobi' ? 'Alif Mobi' : 'DC Bank';
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
            <h1 className="text-xl font-bold text-gray-900">提现审核</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 状态筛选 */}
        <div className="bg-white rounded-xl p-4 shadow-md mb-6">
          <div className="flex gap-2">
            {['pending', 'processing', 'completed', 'rejected'].map((status) => (
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

        {/* 提现列表 */}
        <div className="space-y-4">
          {withdrawals.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-md">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">暂无{getStatusText(statusFilter)}的提现申请</p>
            </div>
          ) : (
            withdrawals.map((withdraw) => {
              const userName = withdraw.users.firstName || withdraw.users.username || '未知用户';
              
              return (
                <div key={withdraw.id} className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {withdraw.amount.toFixed(2)} TJS
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(withdraw.status)}`}>
                          {getStatusText(withdraw.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">用户: </span>
                          <span className="font-medium">{userName} (@{withdraw.users.telegramId})</span>
                        </div>
                        <div>
                          <span className="text-gray-600">支付方式: </span>
                          <span className="font-medium">{getPaymentMethodText(withdraw.paymentMethod)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">收款账号: </span>
                          <span className="font-medium">{withdraw.paymentAccount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">手续费: </span>
                          <span className="font-medium">{withdraw.fee.toFixed(2)} TJS</span>
                        </div>
                        <div>
                          <span className="text-gray-600">实际到账: </span>
                          <span className="font-medium text-green-600">{withdraw.actualAmount.toFixed(2)} TJS</span>
                        </div>
                        <div>
                          <span className="text-gray-600">申请时间: </span>
                          <span className="font-medium">{new Date(withdraw.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  {withdraw.status === 'pending' && (
                    <div className="flex gap-3 pt-4 border-t">
                      <button
                        onClick={() => handleApprove(withdraw.id)}
                        disabled={processing === withdraw.id}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg disabled:opacity-50"
                      >
                        {processing === withdraw.id ? '处理中...' : '✓ 通过'}
                      </button>
                      <button
                        onClick={() => handleReject(withdraw.id)}
                        disabled={processing === withdraw.id}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg disabled:opacity-50"
                      >
                        {processing === withdraw.id ? '处理中...' : '✗ 拒绝'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
