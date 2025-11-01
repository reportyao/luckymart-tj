'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PagePermission from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin-permission-manager';

interface RiskUser {
  id: string;
  userName: string;
  email: string;
  totalScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  accountStatus: 'active' | 'frozen' | 'limited' | 'banned';
  registrationDate: string;
  lastLoginDate: string;
  riskHistory: Array<{
    date: string;
    event: string;
    score: number;
  }>;
  totalEvents: number;
  recentActivity: string;
}

// 风险详情弹窗
const UserRiskDetail = ({ 
  user, 
  onClose 
}: { 
  user: RiskUser | null;
  onClose: () => void;
}) => {
  if (!user) return null;

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'frozen': return 'text-blue-600 bg-blue-100';
      case 'limited': return 'text-yellow-600 bg-yellow-100';
      case 'banned': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">用户风险详情</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">用户信息</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">用户ID:</span>
                    <span className="font-mono text-gray-900">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">用户名:</span>
                    <span className="text-gray-900">{user.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">邮箱:</span>
                    <span className="text-gray-900">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">注册时间:</span>
                    <span className="text-gray-900">{new Date(user.registrationDate).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">最后登录:</span>
                    <span className="text-gray-900">{new Date(user.lastLoginDate).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">风险评估</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">风险等级:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(user.riskLevel)}`}>
                      {user.riskLevel === 'low' && '低风险'}
                      {user.riskLevel === 'medium' && '中风险'}
                      {user.riskLevel === 'high' && '高风险'}
                      {user.riskLevel === 'critical' && '严重风险'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">账户状态:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.accountStatus)}`}>
                      {user.accountStatus === 'active' && '正常'}
                      {user.accountStatus === 'frozen' && '已冻结'}
                      {user.accountStatus === 'limited' && '已限制'}
                      {user.accountStatus === 'banned' && '已封禁'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">风险评分:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ width: `${user.totalScore}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-900">{user.totalScore}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">风险事件总数:</span>
                    <span className="text-gray-900">{user.totalEvents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">最近活动:</span>
                    <span className="text-gray-900">{user.recentActivity}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 风险历史 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">风险行为历史</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {user.riskHistory.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <div className="font-medium text-gray-900">{item.event}</div>
                      <div className="text-sm text-gray-600">{new Date(item.date).toLocaleString('zh-CN')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                      <span className="font-medium text-gray-900">{item.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function RiskUsersPage() {
  const router = useRouter();
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<RiskUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<RiskUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<RiskUser | null>(null);
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    accountStatus: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('totalScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('admin_token');
    const info = localStorage.getItem('admin_info');
    
    if (!token || !info) {
      router.push('/admin');
      return;
    }

    setAdminInfo(JSON.parse(info));
    loadRiskUsers();
    setLoading(false);
  }, [router]);

  // 模拟数据
  const loadRiskUsers = () => {
    const mockUsers: RiskUser[] = [
      {
        id: 'U1001',
        userName: '张三',
        email: 'zhangsan@example.com',
        totalScore: 85,
        riskLevel: 'high',
        accountStatus: 'active',
        registrationDate: '2025-09-15T10:00:00Z',
        lastLoginDate: '2025-10-31T14:30:00Z',
        recentActivity: '异常登录行为',
        totalEvents: 12,
        riskHistory: [
          { date: '2025-10-31T15:30:00Z', event: '异常登录', score: 85 },
          { date: '2025-10-30T09:15:00Z', event: 'IP地理位置异常', score: 65 },
          { date: '2025-10-29T16:45:00Z', event: '设备指纹异常', score: 72 }
        ]
      },
      {
        id: 'U1002',
        userName: '李四',
        email: 'lisi@example.com',
        totalScore: 45,
        riskLevel: 'medium',
        accountStatus: 'active',
        registrationDate: '2025-08-20T08:30:00Z',
        lastLoginDate: '2025-10-31T12:00:00Z',
        recentActivity: '正常',
        totalEvents: 5,
        riskHistory: [
          { date: '2025-10-28T14:20:00Z', event: '大额交易', score: 45 },
          { date: '2025-10-25T11:10:00Z', event: '频繁操作', score: 38 }
        ]
      },
      {
        id: 'U1003',
        userName: '王五',
        email: 'wangwu@example.com',
        totalScore: 95,
        riskLevel: 'critical',
        accountStatus: 'frozen',
        registrationDate: '2025-07-10T14:20:00Z',
        lastLoginDate: '2025-10-31T08:45:00Z',
        recentActivity: '频繁异常操作',
        totalEvents: 25,
        riskHistory: [
          { date: '2025-10-31T13:45:00Z', event: '频繁操作', score: 95 },
          { date: '2025-10-30T22:30:00Z', event: '异常登录', score: 88 },
          { date: '2025-10-29T19:20:00Z', event: '设备指纹异常', score: 90 }
        ]
      },
      {
        id: 'U1004',
        userName: '赵六',
        email: 'zhaoliu@example.com',
        totalScore: 25,
        riskLevel: 'low',
        accountStatus: 'active',
        registrationDate: '2025-06-01T09:00:00Z',
        lastLoginDate: '2025-10-31T10:15:00Z',
        recentActivity: '正常',
        totalEvents: 2,
        riskHistory: [
          { date: '2025-10-20T15:30:00Z', event: 'IP地理位置异常', score: 25 }
        ]
      },
      {
        id: 'U1005',
        userName: '钱七',
        email: 'qianqi@example.com',
        totalScore: 72,
        riskLevel: 'high',
        accountStatus: 'limited',
        registrationDate: '2025-05-15T12:00:00Z',
        lastLoginDate: '2025-10-31T16:20:00Z',
        recentActivity: '交易限制中',
        totalEvents: 8,
        riskHistory: [
          { date: '2025-10-30T11:30:00Z', event: '设备指纹异常', score: 72 },
          { date: '2025-10-28T14:15:00Z', event: '大额交易', score: 65 }
        ]
      }
    ];
    setUsers(mockUsers);
  };

  // 筛选和排序
  useEffect(() => {
    let filtered = users.filter(user => {
      if (filters.riskLevel !== 'all' && user.riskLevel !== filters.riskLevel) return false;
      if (filters.accountStatus !== 'all' && user.accountStatus !== filters.accountStatus) return false;
      if (filters.search && !user.userName.toLowerCase().includes(filters.search.toLowerCase()) && 
          !user.email.toLowerCase().includes(filters.search.toLowerCase()) &&
          !user.id.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case 'registrationDate':
        case 'lastLoginDate':
          aValue = new Date(a[sortBy as keyof RiskUser] as string).getTime();
          bValue = new Date(b[sortBy as keyof RiskUser] as string).getTime();
          break;
        case 'totalScore':
        case 'totalEvents':
          aValue = a[sortBy as keyof RiskUser];
          bValue = b[sortBy as keyof RiskUser];
          break;
        default:
          aValue = a[sortBy as keyof RiskUser];
          bValue = b[sortBy as keyof RiskUser];
      }
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    setFilteredUsers(filtered);
  }, [users, filters, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleAccountAction = (userId: string, action: string) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        let newStatus: 'active' | 'frozen' | 'limited' | 'banned';
        switch (action) {
          case 'freeze': newStatus = 'frozen'; break;
          case 'unfreeze': newStatus = 'active'; break;
          case 'limit': newStatus = 'limited'; break;
          case 'ban': newStatus = 'banned'; break;
          default: return user;
        }
        return { ...user, accountStatus: newStatus };
      }
      return user;
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'frozen': return 'text-blue-600 bg-blue-100';
      case 'limited': return 'text-yellow-600 bg-yellow-100';
      case 'banned': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">风险用户管理</h1>
              <p className="text-sm text-gray-600">管理高风险用户和账户状态</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/risk-dashboard')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              返回风控面板
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">高风险用户</h3>
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-red-600">
              {users.filter(u => u.riskLevel === 'high' || u.riskLevel === 'critical').length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">已冻结账户</h3>
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {users.filter(u => u.accountStatus === 'frozen').length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">限制账户</h3>
              <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              {users.filter(u => u.accountStatus === 'limited').length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">平均风险评分</h3>
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {Math.round(users.reduce((sum, u) => sum + u.totalScore, 0) / users.length)}
            </p>
          </div>
        </div>

        {/* 筛选和搜索 */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">搜索</label>
              <input
                type="text"
                placeholder="搜索用户名、邮箱或ID"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">风险等级</label>
              <select
                value={filters.riskLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">全部</option>
                <option value="low">低风险</option>
                <option value="medium">中风险</option>
                <option value="high">高风险</option>
                <option value="critical">严重风险</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">账户状态</label>
              <select
                value={filters.accountStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, accountStatus: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">全部</option>
                <option value="active">正常</option>
                <option value="frozen">已冻结</option>
                <option value="limited">已限制</option>
                <option value="banned">已封禁</option>
              </select>
            </div>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户信息
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('riskLevel')}
                  >
                    风险等级 {sortBy === 'riskLevel' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    账户状态
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalScore')}
                  >
                    风险评分 {sortBy === 'totalScore' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalEvents')}
                  >
                    风险事件 {sortBy === 'totalEvents' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastLoginDate')}
                  >
                    最近登录 {sortBy === 'lastLoginDate' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400 font-mono">{user.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(user.riskLevel)}`}>
                        {user.riskLevel === 'low' && '低风险'}
                        {user.riskLevel === 'medium' && '中风险'}
                        {user.riskLevel === 'high' && '高风险'}
                        {user.riskLevel === 'critical' && '严重风险'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.accountStatus)}`}>
                        {user.accountStatus === 'active' && '正常'}
                        {user.accountStatus === 'frozen' && '已冻结'}
                        {user.accountStatus === 'limited' && '已限制'}
                        {user.accountStatus === 'banned' && '已封禁'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${user.totalScore}%` }}
                          />
                        </div>
                        <span className="font-medium text-gray-900">{user.totalScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.totalEvents}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.lastLoginDate).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        详情
                      </button>
                      {user.accountStatus === 'active' && (
                        <>
                          <button
                            onClick={() => handleAccountAction(user.id, 'freeze')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            冻结
                          </button>
                          <button
                            onClick={() => handleAccountAction(user.id, 'limit')}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            限制
                          </button>
                        </>
                      )}
                      {user.accountStatus === 'frozen' && (
                        <button
                          onClick={() => handleAccountAction(user.id, 'unfreeze')}
                          className="text-green-600 hover:text-green-900"
                        >
                          解冻
                        </button>
                      )}
                      {user.accountStatus === 'limited' && (
                        <button
                          onClick={() => handleAccountAction(user.id, 'unfreeze')}
                          className="text-green-600 hover:text-green-900"
                        >
                          解除限制
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无数据</h3>
              <p className="mt-1 text-sm text-gray-500">没有找到匹配的用户</p>
            </div>
          )}
        </div>
      </div>

      {/* 用户风险详情弹窗 */}
      <UserRiskDetail
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}

function WrappedRiskUsersPage() {
  return (
    <PagePermission permissions={AdminPermissions.system.manage()}>
      <RiskUsersPage />
    </PagePermission>
  );
}
export default WrappedRiskUsersPage;
