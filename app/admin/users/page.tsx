'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PagePermission } from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin-permission-manager';
import Link from 'next/link';
import type { User } from '@/types';

interface AdminUser extends User {
  stats: {
    participations: number;
    orders: number;
    transactions: number;
  };
}

interface UserDetail {
  id: string;
  telegramId: string;
  username: string;
  firstName: string;
  lastName: string;
  language: string;
  balance: number;
  platformBalance: number;
  vipLevel: number;
  totalSpent: number;
  createdAt: string;
  participations: any[];
  transactions: any[];
}

function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    totalPlatformBalance: 0,
    totalSpent: 0
  });
  
  // 用户详情弹窗
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // 充值弹窗
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeUserId, setRechargeUserId] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeNote, setRechargeNote] = useState('');
  const [recharging, setRecharging] = useState(false);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }
    loadUsers();
  }, [router, page, search]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/users?page=${page}&limit=20&search=${search}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users || []);
        setTotalPages(data.data.pagination.totalPages);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // 重置到第一页
  };

  const handleViewDetail = async (userId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedUser(data.data.user);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Load user detail error:', error);
      alert('加载用户详情失败');
    }
  };

  const handleOpenRecharge = (userId: string) => {
    setRechargeUserId(userId);
    setRechargeAmount('');
    setRechargeNote('');
    setShowRechargeModal(true);
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      alert('请输入有效的充值金额');
      return;
    }

    setRecharging(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/users/${rechargeUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(rechargeAmount),
          note: rechargeNote
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('充值成功');
        setShowRechargeModal(false);
        loadUsers();
      } else {
        alert(data.error || '充值失败');
      }
    } catch (error) {
      console.error('Recharge error:', error);
      alert('网络错误');
    } finally {
      setRecharging(false);
    }
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
            <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">用户管理</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-sm font-medium text-gray-600 mb-2">总用户数</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-sm font-medium text-gray-600 mb-2">总夺宝币</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalBalance.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-sm font-medium text-gray-600 mb-2">总平台余额</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalPlatformBalance.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-sm font-medium text-gray-600 mb-2">总消费金额</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalSpent.toFixed(2)}</p>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="搜索用户名、Telegram ID..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={() => loadUsers()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              搜索
            </button>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telegram ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">夺宝币</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">平台余额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VIP等级</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">参与次数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">注册时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">@{user.username || '未设置'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.telegramId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">{user.balance.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.platformBalance.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        VIP {user.vipLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.stats.participations} 次</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewDetail(user.id)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium mr-3"
                      >
                        详情
                      </button>
                      <button
                        onClick={() => handleOpenRecharge(user.id)}
                        className="text-green-600 hover:text-green-900 font-medium"
                      >
                        充值
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              第 {page} 页，共 {totalPages} 页
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 用户详情弹窗 */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold">用户详情</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* 基本信息 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">基本信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">用户名：</span>
                    <span className="text-sm font-medium">{selectedUser.firstName} {selectedUser.lastName}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Telegram ID：</span>
                    <span className="text-sm font-medium">{selectedUser.telegramId}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">夺宝币：</span>
                    <span className="text-sm font-medium text-green-600">{selectedUser.balance.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">平台余额：</span>
                    <span className="text-sm font-medium">{selectedUser.platformBalance.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">VIP等级：</span>
                    <span className="text-sm font-medium">VIP {selectedUser.vipLevel}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">语言：</span>
                    <span className="text-sm font-medium">{selectedUser.language}</span>
                  </div>
                </div>
              </div>

              {/* 最近参与 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">最近参与（最新10条）</h3>
                <div className="space-y-2">
                  {selectedUser.participations.slice(0, 10).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium">{p.productName}</div>
                        <div className="text-xs text-gray-500">
                          第{p.roundNumber}期 | {p.sharesCount}份 | {p.numbers.slice(0, 3).join(', ')}...
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{p.cost.toFixed(2)} 币</div>
                        <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 最近交易 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">最近交易（最新20条）</h3>
                <div className="space-y-2">
                  {selectedUser.transactions.slice(0, 20).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium">{t.description}</div>
                        <div className="text-xs text-gray-500">{t.type}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          t.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {t.amount > 0 ? '+' : ''}{t.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 充值弹窗 */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">手动充值</h2>
              <button
                onClick={() => setShowRechargeModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  充值金额（夺宝币）<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="例如：100.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                <textarea
                  rows={3}
                  value={rechargeNote}
                  onChange={(e) => setRechargeNote(e.target.value)}
                  placeholder="充值原因或备注信息"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRecharge}
                  disabled={recharging}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {recharging ? '充值中...' : '确认充值'}
                </button>
                <button
                  onClick={() => setShowRechargeModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// 导出带权限控制的页面
function ProtectedAdminUsersPage() {
  return (
    <PagePermission 
      permissions={AdminPermissions.users.read()}
      showFallback={true}
    >
      <AdminUsersPage />
    </PagePermission>
  );
}

export default ProtectedAdminUsersPage;
