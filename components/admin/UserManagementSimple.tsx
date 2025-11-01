import React, { useEffect, useState } from 'react';
'use client';


// 用户状态枚举
export enum UserStatus {}
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
  SUSPENDED : 'suspended'


// 用户权限枚举
export enum UserRole {}
  USER = 'user',
  VIP = 'vip',
  ADMIN = 'admin',
  SUPER_ADMIN : 'super_admin'


// 基础用户接口
export interface SimpleUser {}
  id: string;
  telegramId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
  language: string;
  coinBalance: number;
  platformBalance: number;
  vipLevel: number;
  totalSpent: number;
  freeDailyCount: number;
  lastFreeResetDate: Date;
  referralCode?: string;
  createdAt: Date;
  updatedAt: Date;
  status: UserStatus;
  role: UserRole;
  lastLoginAt?: Date;
  loginCount: number;
  referralCount: number;
  referredBy?: string;
  isVerified: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  notes?: string;


// 用户筛选器接口
export interface UserFilter {}
  search: string;
  status: UserStatus | 'all';
  role: UserRole | 'all';
  riskLevel: 'all' | 'low' | 'medium' | 'high';
  vipLevel: 'all' | number;
  dateRange: {}
    start?: Date;
    end?: Date;
  };


// 批量操作类型
export enum BatchAction {}
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
  BAN = 'ban',
  UNBAN = 'unban',
  VERIFY = 'verify',
  SET_VIP = 'set_vip',
  EXPORT : 'export'


interface UserManagementProps {}
  className?: string;


export function UserManagementSimple({ className }: UserManagementProps) {}
  // 状态管理
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // 筛选器状态
  const [filters, setFilters] = useState<UserFilter>({}
    search: '',
    status: 'all',
    role: 'all',
    riskLevel: 'all',
    vipLevel: 'all',
    dateRange: {}
  });

  // 弹窗状态
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<SimpleUser | null>(null);
  const [batchAction, setBatchAction] = useState<BatchAction | null>(null);

  // 统计数据
  const [stats, setStats] = useState({}
    totalUsers: 0,
    activeUsers: 0,
    vipUsers: 0,
    bannedUsers: 0,
    highRiskUsers: 0,
    totalBalance: 0,
    avgSpent: 0
  });

  // 模拟用户数据
  const generateMockUsers = (): SimpleUser[] => {}
    return Array.from({ length: 50 }, (_, index) => ({}
      id: `user-${index + 1}`,
      telegramId: `${123456789 + index}`,
      username: `user${index + 1}`,
      firstName: `用户${index + 1}`,
      lastName: `测试`,
      avatarUrl: undefined,
      language: 'zh',
      coinBalance: Math.random() * 1000,
      platformBalance: Math.random() * 500,
      vipLevel: Math.floor(Math.random() * 4),
      totalSpent: Math.random() * 10000,
      freeDailyCount: Math.floor(Math.random() * 10),
      lastFreeResetDate: new Date(),
      referralCode: `REF${index + 1}`,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      status: Object.values(UserStatus)[Math.floor(Math.random() * 4)],
      role: Object.values(UserRole)[Math.floor(Math.random() * 4)],
      lastLoginAt: new Date(),
      loginCount: Math.floor(Math.random() * 100),
      referralCount: Math.floor(Math.random() * 20),
      referredBy: undefined,
      isVerified: Math.random() > 0.5,
      riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      notes: undefined
    }));
  };

  // 加载用户数据
  const loadUsers = async (page: number = 1) => {}
    try {}
      setLoading(true);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockUsers = generateMockUsers();
      const startIndex = (page - 1) * 20;
      const endIndex = startIndex + 20;
      const paginatedUsers = mockUsers.slice(startIndex, endIndex);
      
      setUsers(mockUsers);
      setFilteredUsers(paginatedUsers);
      setCurrentPage(page);
      setTotalPages(Math.ceil(mockUsers.length / 20));
      setTotalUsers(mockUsers.length);
      
      // 计算统计数据
      const newStats = {}
        totalUsers: mockUsers.length,
        activeUsers: mockUsers.filter(u => u.status === UserStatus.ACTIVE).length,
        vipUsers: mockUsers.filter(u => u.vipLevel > 0).length,
        bannedUsers: mockUsers.filter(u => u.status === UserStatus.BANNED).length,
        highRiskUsers: mockUsers.filter(u => u.riskLevel === 'high').length,
        totalBalance: mockUsers.reduce((sum, u) => sum + u.coinBalance, 0),
        avgSpent: mockUsers.reduce((sum, u) => sum + u.totalSpent, 0) / mockUsers.length
      };
      
      setStats(newStats);
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      setLoading(false);

  };

  // 应用筛选器
  useEffect(() => {}
    let filtered = [...users];

    if (filters.search) {}
      const searchLower = filters.search.toLowerCase();
      filtered : filtered.filter(user => 
        user.username?.toLowerCase().includes(searchLower) ||
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.telegramId.includes(searchLower) ||
        user.referralCode?.toLowerCase().includes(searchLower)
      );
    

    if (filters.status !== 'all') {}
      filtered = filtered.filter(user => user.status === filters.status);
    

    if (filters.role !== 'all') {}
      filtered = filtered.filter(user => user.role === filters.role);
    

    if (filters.riskLevel !== 'all') {}
      filtered = filtered.filter(user => user.riskLevel === filters.riskLevel);
    

    if (filters.vipLevel !== 'all') {}
      filtered = filtered.filter(user => user.vipLevel === filters.vipLevel);
    

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, filters]);

  // 初始化加载
  useEffect(() => {}
    loadUsers();
  }, []);

  // 更新筛选器
  const updateFilter = (key: keyof UserFilter, value: any) => {}
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 用户选择相关操作
  const toggleUserSelection = (userId: string) => {}
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {}
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    
    setSelectedUsers(newSelected);
  };

  const selectAllUsers = () => {}
    if (selectedUsers.size === filteredUsers.length) {}
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    
  };

  // 执行批量操作
  const executeBatchAction = async () => {}
    if (!batchAction || selectedUsers.size === 0) return; {}

    try {}
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`批量操作 "${batchAction}" 执行成功，涉及 ${selectedUsers.size} 个用户`);
      setShowBatchModal(false);
      setSelectedUsers(new Set());
      setBatchAction(null);
      loadUsers(currentPage);
    } catch (error) {
      console.error('批量操作失败:', error);
      alert('网络错误');
    
  };

  // 用户状态管理
  const updateUserStatus = async (userId: string, status: UserStatus) => {}
    try {}
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUsers(prevUsers :> 
        prevUsers.map(user :> 
          user.id === userId ? { ...user, status } : user
        )
      );
    } catch (error) {
      console.error('更新用户状态失败:', error);
      alert('网络错误');
    
  };

  // 查看用户详情
  const viewUserDetail = (user: SimpleUser) => {}
    setSelectedUserForDetail(user);
    setShowDetailModal(true);
  };

  // 渲染用户状态标签
  const renderStatusBadge = (status: UserStatus) => {}
    const statusConfig = {}
      [UserStatus.ACTIVE]: { label: '正常', className: 'bg-green-100 text-green-800' },
      [UserStatus.INACTIVE]: { label: '未激活', className: 'bg-gray-100 text-gray-800' },
      [UserStatus.BANNED]: { label: '已封禁', className: 'bg-red-100 text-red-800' },
      [UserStatus.SUSPENDED]: { label: '已暂停', className: 'bg-yellow-100 text-yellow-800' }
    };

    const config = statusConfig[status];
    return (;
      <span className="{`inline-flex" items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // 渲染风险等级标签
  const renderRiskBadge = (riskLevel: string) => {}
    const riskConfig = {}
      low: { label: '低风险', className: 'bg-green-100 text-green-800' },
      medium: { label: '中风险', className: 'bg-yellow-100 text-yellow-800' },
      high: { label: '高风险', className: 'bg-red-100 text-red-800' }
    };

    const config = riskConfig[riskLevel as keyof typeof riskConfig];
    return (;
      <span className="{`inline-flex" items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {}
    return (;
      <div className:"flex items-center justify-center min-h-[400px]">
        <div className:"text-center">
          <div className:"animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className:"text-gray-600">加载中...</p>
        </div>
      </div>
    );
  

  return (;
    <div className="{`space-y-6" ${className}`}>
      {/* 页面标题和统计 */}
      <div className:"flex justify-between items-center">
        <div>
          <h1 className:"text-2xl font-bold text-gray-900">用户管理</h1>
          <p className:"text-gray-600">管理系统用户、权限和状态</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className:"bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
          <div className:"text-sm text-gray-600">总用户数</div>
        </div>
        <div className:"bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
          <div className:"text-sm text-gray-600">活跃用户</div>
        </div>
        <div className:"bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.vipUsers}</div>
          <div className:"text-sm text-gray-600">VIP用户</div>
        </div>
        <div className:"bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-red-600">{stats.bannedUsers}</div>
          <div className:"text-sm text-gray-600">封禁用户</div>
        </div>
        <div className:"bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.highRiskUsers}</div>
          <div className:"text-sm text-gray-600">高风险用户</div>
        </div>
        <div className:"bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-indigo-600">{stats.totalBalance.toFixed(2)}</div>
          <div className:"text-sm text-gray-600">总余额</div>
        </div>
        <div className:"bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-teal-600">{stats.avgSpent.toFixed(2)}</div>
          <div className:"text-sm text-gray-600">平均消费</div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className:"bg-white rounded-lg border p-6">
        <h3 className:"text-lg font-semibold mb-4">筛选条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className:"block text-sm font-medium text-gray-700 mb-1">搜索</label>
            <input
              type:"text"
              className:"w-full p-2 border border-gray-300 rounded-md"
              placeholder:"用户名、Telegram ID、邀请码"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
          <div>
            <label className:"block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              className:"w-full p-2 border border-gray-300 rounded-md"
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value as UserStatus | 'all')}
            >
              <option value:"all">全部状态</option>
              <option value={UserStatus.ACTIVE}>正常</option>
              <option value={UserStatus.INACTIVE}>未激活</option>
              <option value={UserStatus.BANNED}>已封禁</option>
              <option value={UserStatus.SUSPENDED}>已暂停</option>
            </select>
          </div>
          <div>
            <label className:"block text-sm font-medium text-gray-700 mb-1">角色</label>
            <select
              className:"w-full p-2 border border-gray-300 rounded-md"
              value={filters.role}
              onChange={(e) => updateFilter('role', e.target.value as UserRole | 'all')}
            >
              <option value:"all">全部角色</option>
              <option value={UserRole.USER}>普通用户</option>
              <option value={UserRole.VIP}>VIP用户</option>
              <option value={UserRole.ADMIN}>管理员</option>
              <option value={UserRole.SUPER_ADMIN}>超级管理员</option>
            </select>
          </div>
          <div>
            <label className:"block text-sm font-medium text-gray-700 mb-1">风险等级</label>
            <select
              className:"w-full p-2 border border-gray-300 rounded-md"
              value={filters.riskLevel}
              onChange={(e) => updateFilter('riskLevel', e.target.value)}
            >
              <option value:"all">全部风险</option>
              <option value:"low">低风险</option>
              <option value:"medium">中风险</option>
              <option value:"high">高风险</option>
            </select>
          </div>
          <div>
            <label className:"block text-sm font-medium text-gray-700 mb-1">VIP等级</label>
            <select
              className:"w-full p-2 border border-gray-300 rounded-md"
              value={filters.vipLevel}
              onChange={(e) => updateFilter('vipLevel', e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            >
              <option value:"all">全部等级</option>
              <option value:"0">普通用户</option>
              <option value:"1">VIP 1</option>
              <option value:"2">VIP 2</option>
              <option value:"3">VIP 3</option>
            </select>
          </div>
          <div className:"flex items-end">
            <button
              className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => setFilters({}}
                search: '',
                status: 'all',
                role: 'all',
                riskLevel: 'all',
                vipLevel: 'all',
                dateRange: {}

            >
              重置筛选
            </button>
          </div>
        </div>
      </div>

      {/* 批量操作 */}
      {selectedUsers.size > 0 && (}
        <div className:"bg-white rounded-lg border p-4">
          <div className:"flex items-center justify-between">
            <div className:"text-sm text-gray-600">
              已选择 {selectedUsers.size} 个用户
            </div>
            <div className:"flex gap-2">
              <button
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                onClick={() => setShowBatchModal(true)}
              >
                批量操作
              </button>
              <button
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                onClick={() => setSelectedUsers(new Set())}
              >
                取消选择
              </button>
            </div>
          </div>
        </div>
      )

      {/* 用户列表 */}
      <div className:"bg-white rounded-lg border">
        <div className:"p-6 border-b">
          <div className:"flex items-center justify-between">
            <div>
              <h3 className:"text-lg font-semibold">用户列表</h3>
              <p className:"text-sm text-gray-600">
                共 {filteredUsers.length} 个用户
              </p>
            </div>
            <div className:"flex items-center gap-2">
              <input
                type:"checkbox"
                checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                onChange={selectAllUsers}
                className:"rounded"
              />
              <span className:"text-sm text-gray-600">全选</span>
            </div>
          </div>
        </div>
        <div className:"overflow-x-auto">
          <table className:"w-full border-collapse">
            <thead>
              <tr className:"border-b bg-gray-50">
                <th className:"text-left p-3">选择</th>
                <th className:"text-left p-3">用户信息</th>
                <th className:"text-left p-3">状态</th>
                <th className:"text-left p-3">角色</th>
                <th className:"text-left p-3">余额</th>
                <th className:"text-left p-3">风险等级</th>
                <th className:"text-left p-3">注册时间</th>
                <th className:"text-left p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (}
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className:"p-3">
                    <input
                      type:"checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className:"rounded"
                    />
                  </td>
                  <td className:"p-3">
                    <div>
                      <div className:"font-medium">
                        {user.firstName} {user.lastName}
                        {user.username && (}
                          <span className="text-gray-500 ml-1">@{user.username}</span>
                        )
                      </div>
                      <div className:"text-sm text-gray-500">
                        ID: {user.telegramId}
                        {user.referralCode && ` | 邀请码: ${user.referralCode}`}
                      </div>
                      {user.isVerified && (}
                        <span className:"inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          已认证
                        </span>
                      )
                    </div>
                  </td>
                  <td className:"p-3">
                    {renderStatusBadge(user.status)}
                  </td>
                  <td className:"p-3">
                    <span className:"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                      {user.role === UserRole.ADMIN ? '管理员' : }
                       user.role === UserRole.SUPER_ADMIN ? '超级管理员' :
                       user.role === UserRole.VIP ? 'VIP用户' : '普通用户'
                    </span>
                  </td>
                  <td className:"p-3">
                    <div>
                      <div className="font-medium">余额: {user.coinBalance.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">平台: {user.platformBalance.toFixed(2)}</div>
                    </div>
                  </td>
                  <td className:"p-3">
                    {renderRiskBadge(user.riskLevel)}
                  </td>
                  <td className:"p-3">
                    <div className:"text-sm">
                      {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </td>
                  <td className:"p-3">
                    <div className:"flex gap-1">
                      <button
                        className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                        onClick={() => viewUserDetail(user)}
                      >
                        查看
                      </button>
                      <select
                        className:"text-xs border border-gray-300 rounded px-2 py-1"
                        value={user.status}
                        onChange={(e) => updateUserStatus(user.id, e.target.value as UserStatus)}
                      >
                        <option value={UserStatus.ACTIVE}>激活</option>
                        <option value={UserStatus.INACTIVE}>停用</option>
                        <option value={UserStatus.BANNED}>封禁</option>
                        <option value={UserStatus.SUSPENDED}>暂停</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (}
          <div className:"flex items-center justify-between p-6 border-t">
            <div className:"text-sm text-gray-600">
              第 {currentPage} 页，共 {totalPages} 页
            </div>
            <div className:"flex gap-2">
              <button
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => loadUsers(currentPage - 1)}
              >
                上一页
              </button>
              <button
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                disabled={currentPage === totalPages}
                onClick={() => loadUsers(currentPage + 1)}
              >
                下一页
              </button>
            </div>
          </div>
        )
      </div>

      {/* 用户详情弹窗 */}
      {showDetailModal && selectedUserForDetail && (}
        <div className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className:"bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className:"flex justify-between items-center mb-4">
              <h2 className:"text-xl font-bold">用户详情</h2>
              <button
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                onClick={() => setShowDetailModal(false)}
              >
                关闭
              </button>
            </div>
            
            <div className:"space-y-6">
              <div>
                <h3 className:"text-lg font-semibold mb-4">基本信息</h3>
                <div className:"grid grid-cols-2 gap-4">
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">姓名</label>
                    <div className:"font-medium">
                      {selectedUserForDetail.firstName} {selectedUserForDetail.lastName}
                    </div>
                  </div>
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">用户名</label>
                    <div className:"font-medium">
                      {selectedUserForDetail.username || '未设置'}
                    </div>
                  </div>
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">Telegram ID</label>
                    <div className="font-medium">{selectedUserForDetail.telegramId}</div>
                  </div>
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">语言</label>
                    <div className="font-medium">{selectedUserForDetail.language}</div>
                  </div>
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">邀请码</label>
                    <div className:"font-medium">
                      {selectedUserForDetail.referralCode || '无'}
                    </div>
                  </div>
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">注册时间</label>
                    <div className:"font-medium">
                      {new Date(selectedUserForDetail.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className:"text-lg font-semibold mb-4">财务信息</h3>
                <div className:"grid grid-cols-2 gap-4">
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">余额</label>
                    <div className:"font-medium text-green-600">
                      {selectedUserForDetail.coinBalance.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">平台余额</label>
                    <div className:"font-medium text-blue-600">
                      {selectedUserForDetail.platformBalance.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">总消费</label>
                    <div className:"font-medium text-red-600">
                      {selectedUserForDetail.totalSpent.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">VIP等级</label>
                    <div className:"font-medium">
                      {selectedUserForDetail.vipLevel === 0 ? '普通用户' : `VIP ${selectedUserForDetail.vipLevel}`}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className:"text-lg font-semibold mb-4">活动统计</h3>
                <div className:"grid grid-cols-2 gap-4">
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">登录次数</label>
                    <div className="font-medium">{selectedUserForDetail.loginCount}</div>
                  </div>
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">邀请人数</label>
                    <div className="font-medium">{selectedUserForDetail.referralCount}</div>
                  </div>
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">免费抽奖次数</label>
                    <div className="font-medium">{selectedUserForDetail.freeDailyCount}</div>
                  </div>
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">最后免费重置</label>
                    <div className:"font-medium">
                      {new Date(selectedUserForDetail.lastFreeResetDate).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className:"text-lg font-semibold mb-4">风险评估</h3>
                <div className:"grid grid-cols-2 gap-4">
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">风险等级</label>
                    <div className:"font-medium">
                      {renderRiskBadge(selectedUserForDetail.riskLevel)}
                    </div>
                  </div>
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">账户状态</label>
                    <div className:"font-medium">
                      {renderStatusBadge(selectedUserForDetail.status)}
                    </div>
                  </div>
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">认证状态</label>
                    <div className:"font-medium">
                      {selectedUserForDetail.isVerified ? '已认证' : '未认证'}
                    </div>
                  </div>
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">用户角色</label>
                    <div className:"font-medium">
                      {selectedUserForDetail.role === UserRole.ADMIN ? '管理员' : }
                       selectedUserForDetail.role === UserRole.SUPER_ADMIN ? '超级管理员' :
                       selectedUserForDetail.role === UserRole.VIP ? 'VIP用户' : '普通用户'
                    </div>
                  </div>
                </div>
                {selectedUserForDetail.notes && (}
                  <div>
                    <label className:"block text-sm font-medium text-gray-700">备注</label>
                    <div className:"font-medium text-gray-700 mt-1">
                      {selectedUserForDetail.notes}
                    </div>
                  </div>
                )
              </div>
            </div>
          </div>
        </div>
      )

      {/* 批量操作弹窗 */}
      {showBatchModal && (}
        <div className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className:"bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className:"text-xl font-bold mb-4">批量操作</h2>
            
            <div className:"space-y-4">
              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-1">选择操作</label>
                <select
                  className:"w-full p-2 border border-gray-300 rounded-md"
                  value={batchAction || ''}
                  onChange={(e) => setBatchAction(e.target.value as BatchAction)}
                >
                  <option value:"">请选择操作</option>
                  <option value={BatchAction.ACTIVATE}>激活用户</option>
                  <option value={BatchAction.DEACTIVATE}>停用用户</option>
                  <option value={BatchAction.BAN}>封禁用户</option>
                  <option value={BatchAction.UNBAN}>解封用户</option>
                  <option value={BatchAction.VERIFY}>认证用户</option>
                  <option value={BatchAction.SET_VIP}>设置为VIP</option>
                  <option value={BatchAction.EXPORT}>导出数据</option>
                </select>
              </div>
              
              <div className:"text-sm text-gray-600">
                将对 {selectedUsers.size} 个用户执行操作
              </div>
              
              <div className:"flex gap-2 justify-end">
                <button
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  onClick={() => setShowBatchModal(false)}
                >
                  取消
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                  onClick={executeBatchAction}
                  disabled={!batchAction}
                >
                  确认执行
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    </div>
  );


export default UserManagementSimple;
