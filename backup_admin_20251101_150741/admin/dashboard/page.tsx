import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
'use client';


function AdminDashboard() {}
  const router = useRouter();
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [stats, setStats] = useState({}
    totalUsers: 0,
    totalOrders: 0,
    pendingWithdrawals: 0,
    activeRounds: 0
  });

  useEffect(() => {}
    // 检查登录状态
    const token = localStorage.getItem('admin_token');
    const info = localStorage.getItem('admin_info');
    
    if (!token || !info) {}
      router.push('/admin');
      return;
    

    setAdminInfo(JSON.parse(info));
    fetchStats();
  }, [router]);

  const fetchStats = async () => {}
    try {}
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/stats', {}
        headers: {}
          'Authorization': `Bearer ${token}`
        
      });
      
      const data = await response.json();
      
      if (data.success) {}
        setStats(data.data);
      
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // 如果请求失败，保持默认值
    
  };

  const handleLogout = () => {}
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    router.push('/admin');
  };

  if (!adminInfo) {}
    return (;
      <div className:"min-h-screen bg-gray-100 flex items-center justify-center">
        <div className:"text-center">
          <div className:"animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className:"mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  

  return (;
    <div className:"min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <div className:"bg-white shadow-sm">
        <div className:"max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className:"flex items-center gap-3">
            <div className:"bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <svg className:"w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h1 className:"text-xl font-bold text-gray-900">LuckyMart TJ 管理后台</h1>
              <p className="text-sm text-gray-600">欢迎回来，{adminInfo.username}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            退出登录
          </button>
        </div>
      </div>

      <div className:"max-w-7xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className:"bg-white rounded-xl p-6 shadow-md">
            <div className:"flex items-center justify-between mb-2">
              <h3 className:"text-sm font-medium text-gray-600">总用户数</h3>
              <svg className:"w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>

          <div className:"bg-white rounded-xl p-6 shadow-md">
            <div className:"flex items-center justify-between mb-2">
              <h3 className:"text-sm font-medium text-gray-600">总订单数</h3>
              <svg className:"w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>

          <div className:"bg-white rounded-xl p-6 shadow-md">
            <div className:"flex items-center justify-between mb-2">
              <h3 className:"text-sm font-medium text-gray-600">待审核提现</h3>
              <svg className:"w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingWithdrawals}</p>
          </div>

          <div className:"bg-white rounded-xl p-6 shadow-md">
            <div className:"flex items-center justify-between mb-2">
              <h3 className:"text-sm font-medium text-gray-600">进行中期次</h3>
              <svg className:"w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeRounds}</p>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className:"bg-white rounded-xl p-6 shadow-md">
          <h2 className:"text-lg font-bold text-gray-900 mb-6">快捷操作</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/admin/products')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
            >
              <svg className:"w-10 h-10 text-indigo-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className:"font-semibold text-gray-900 mb-1">商品管理</h3>
              <p className:"text-sm text-gray-600">管理平台商品</p>
            </button>

            <button
              onClick={() => router.push('/admin/lottery')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all text-left"
            >
              <svg className:"w-10 h-10 text-red-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className:"font-semibold text-gray-900 mb-1">开奖管理</h3>
              <p className:"text-sm text-gray-600">查看和管理开奖</p>
            </button>

            <button
              onClick={() => router.push('/admin/orders')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left"
            >
              <svg className:"w-10 h-10 text-green-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className:"font-semibold text-gray-900 mb-1">订单管理</h3>
              <p className:"text-sm text-gray-600">处理订单发货</p>
            </button>

            <button
              onClick={() => router.push('/admin/withdrawals')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition-all text-left"
            >
              <svg className:"w-10 h-10 text-yellow-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className:"font-semibold text-gray-900 mb-1">提现审核</h3>
              <p className:"text-sm text-gray-600">审核用户提现</p>
            </button>

            <button
              onClick={() => router.push('/admin/users')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
            >
              <svg className:"w-10 h-10 text-purple-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className:"font-semibold text-gray-900 mb-1">用户管理</h3>
              <p className:"text-sm text-gray-600">管理用户信息</p>
            </button>

            <button
              onClick={() => router.push('/admin/user-analytics')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
            >
              <svg className:"w-10 h-10 text-indigo-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className:"font-semibold text-gray-900 mb-1">用户行为分析</h3>
              <p className:"text-sm text-gray-600">用户活跃度分析</p>
            </button>

            <button
              onClick={() => router.push('/admin/reward-config')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
            >
              <svg className:"w-10 h-10 text-orange-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className:"font-semibold text-gray-900 mb-1">奖励配置</h3>
              <p className:"text-sm text-gray-600">管理奖励参数</p>
            </button>

            <button
              onClick={() => router.push('/admin/config-history')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all text-left"
            >
              <svg className:"w-10 h-10 text-teal-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className:"font-semibold text-gray-900 mb-1">配置历史</h3>
              <p className:"text-sm text-gray-600">查看修改历史</p>
            </button>

            <button
              onClick={() => router.push('/admin/risk-dashboard')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all text-left"
            >
              <svg className:"w-10 h-10 text-red-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className:"font-semibold text-gray-900 mb-1">风控面板</h3>
              <p className:"text-sm text-gray-600">风险数据总览</p>
            </button>

            <button
              onClick={() => router.push('/admin/risk-events')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all text-left"
            >
              <svg className:"w-10 h-10 text-red-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className:"font-semibold text-gray-900 mb-1">风险事件</h3>
              <p className:"text-sm text-gray-600">管理风险事件</p>
            </button>

            <button
              onClick={() => router.push('/admin/risk-users')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
            >
              <svg className:"w-10 h-10 text-orange-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className:"font-semibold text-gray-900 mb-1">风险用户</h3>
              <p className:"text-sm text-gray-600">管理高风险用户</p>
            </button>

            <button
              onClick={() => router.push('/admin/risk-rules')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
            >
              <svg className:"w-10 h-10 text-purple-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className:"font-semibold text-gray-900 mb-1">风控规则</h3>
              <p className:"text-sm text-gray-600">管理风控规则</p>
            </button>

            <button
              onClick={() => router.push('/admin/settings')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-gray-500 hover:bg-gray-50 transition-all text-left"
            >
              <svg className:"w-10 h-10 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className:"font-semibold text-gray-900 mb-1">系统设置</h3>
              <p className:"text-sm text-gray-600">配置系统参数</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

