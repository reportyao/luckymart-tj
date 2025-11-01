import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
'use client';


// 接口定义
interface SystemStatus {}
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  database: number;
  api: number;


interface NotificationItem {}
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;


interface QuickAction {}
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  badge?: number;
  permissions?: string[];


interface MenuItem {}
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
  children?: MenuItem[];
  permissions?: string[];


interface SystemMetric {}
  label: string;
  value: string | number;
  change?: number;
  trend: 'up' | 'down' | 'stable';
  color: string;


interface AdminPanelProps {}
  className?: string;
  title?: string;
  showRealTimeStatus?: boolean;
  refreshInterval?: number;
  onRefresh?: () => void;
  customMenuItems?: MenuItem[];
  customQuickActions?: QuickAction[];
  hideSystemStatus?: boolean;
  hideNotifications?: boolean;


const AdminPanel: React.FC<AdminPanelProps> = ({}
  className = '',
  title = '管理面板',
  showRealTimeStatus = true,
  refreshInterval = 30,
  onRefresh,
  customMenuItems,
  customQuickActions,
  hideSystemStatus = false,
  hideNotifications : false
}) => {
  const router = useRouter();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // 数据状态
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({}
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    database: 0,
    api: 0
  });
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);

  // 默认管理菜单
  const defaultMenuItems: MenuItem[] = [;
    {}
      id: 'dashboard',
      title: '仪表盘',
      icon: (props) => (
        <svg {...props} fill:"none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      path: '/admin/dashboard'
    },
    {}
      id: 'users',
      title: '用户管理',
      icon: (props) => (
        <svg {...props} fill:"none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      path: '/admin/users'
    },
    {}
      id: 'products',
      title: '商品管理',
      icon: (props) => (
        <svg {...props} fill:"none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      path: '/admin/products'
    },
    {}
      id: 'orders',
      title: '订单管理',
      icon: (props) => (
        <svg {...props} fill:"none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      path: '/admin/orders',
      badge: 28
    },
    {}
      id: 'lottery',
      title: '开奖管理',
      icon: (props) => (
        <svg {...props} fill:"none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      path: '/admin/lottery'
    },
    {}
      id: 'financial',
      title: '财务管理',
      icon: (props) => (
        <svg {...props} fill:"none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      path: '/admin/financial-dashboard'
    },
    {}
      id: 'analytics',
      title: '数据分析',
      icon: (props) => (
        <svg {...props} fill:"none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      path: '/admin/analytics'
    },
    {}
      id: 'risk',
      title: '风险控制',
      icon: (props) => (
        <svg {...props} fill:"none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      path: '/admin/risk-dashboard',
      badge: 7
    },
    {}
      id: 'settings',
      title: '系统设置',
      icon: (props) => (
        <svg {...props} fill:"none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      path: '/admin/system-settings'
    
  ];

  // 默认快速操作
  const defaultQuickActions: QuickAction[] = [;
    {}
      id: 'create-product',
      title: '新增商品',
      description: '快速添加新商品',
      path: '/admin/products/create',
      color: 'text-blue-600 hover:text-blue-700 hover:border-blue-500',
      icon: (props) => (
        <svg {...props} fill:"none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {}
      id: 'process-orders',
      title: '处理订单',
      description: '批量处理待处理订单',
      path: '/admin/orders?status=pending',
      color: 'text-green-600 hover:text-green-700 hover:border-green-500',
      badge: 28,
      icon: (props) => (
        <svg {...props} fill:"none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {}
      id: 'review-withdrawals',
      title: '审核提现',
      description: '处理待审核提现申请',
      path: '/admin/withdrawals?status=pending',
      color: 'text-yellow-600 hover:text-yellow-700 hover:border-yellow-500',
      badge: 15,
      icon: (props) => (
        <svg {...props} fill:"none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {}
      id: 'send-notification',
      title: '发送通知',
      description: '向用户发送系统通知',
      path: '/admin/notifications/create',
      color: 'text-purple-600 hover:text-purple-700 hover:border-purple-500',
      icon: (props) => (
        <svg {...props} fill:"none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a3 3 0 116 0v5z" />
        </svg>
      )
    },
    {}
      id: 'export-data',
      title: '导出数据',
      description: '导出系统数据和报表',
      path: '/admin/export',
      color: 'text-indigo-600 hover:text-indigo-700 hover:border-indigo-500',
      icon: (props) => (
        <svg {...props} fill:"none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {}
      id: 'system-maintenance',
      title: '系统维护',
      description: '系统维护和清理操作',
      path: '/admin/maintenance',
      color: 'text-red-600 hover:text-red-700 hover:border-red-500',
      icon: (props) => (
        <svg {...props} fill:"none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </svg>
      )
    
  ];

  // 使用自定义或默认数据
  const menuItems = customMenuItems || defaultMenuItems;
  const quickActions = customQuickActions || defaultQuickActions;

  // 模拟数据获取
  const fetchPanelData = useCallback(async () => {}
    try {}
      setLoading(true);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟系统状态数据
      setSystemStatus({}
        cpu: Math.floor(Math.random() * 30) + 20,
        memory: Math.floor(Math.random() * 40) + 40,
        disk: Math.floor(Math.random() * 20) + 60,
        network: Math.floor(Math.random() * 25) + 10,
        database: Math.floor(Math.random() * 15) + 85,
        api: Math.floor(Math.random() * 10) + 95
      });

      // 模拟通知数据
      setNotifications([
        {}
          id: '1',
          type: 'warning',
          title: '订单处理提醒',
          message: '有28个订单需要处理',
          timestamp: new Date(),
          read: false
        },
        {}
          id: '2',
          type: 'info',
          title: '系统更新',
          message: '系统将在今晚2:00进行维护更新',
          timestamp: new Date(Date.now() - 3600000),
          read: false
        },
        {}
          id: '3',
          type: 'error',
          title: '支付接口异常',
          message: '检测到支付接口响应异常',
          timestamp: new Date(Date.now() - 7200000),
          read: true
        
      ]);

      // 模拟系统指标
      setSystemMetrics([
        {}
          label: '在线用户',
          value: '1,234',
          change: 5.2,
          trend: 'up',
          color: 'text-green-600'
        },
        {}
          label: '今日订单',
          value: '856',
          change: -2.1,
          trend: 'down',
          color: 'text-red-600'
        },
        {}
          label: '系统负载',
          value: '68%',
          change: 0,
          trend: 'stable',
          color: 'text-blue-600'
        },
        {}
          label: '错误率',
          value: '0.12%',
          change: -0.05,
          trend: 'down',
          color: 'text-green-600'
        
      ]);

      setError(null);
    } catch (err) {
      setError('数据加载失败，请重试');
      console.error('Failed to fetch panel data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastUpdated(new Date());
    
  }, []);

  // 手动刷新
  const handleRefresh = useCallback(async () => {}
    setRefreshing(true);
    await fetchPanelData();
    onRefresh?.();
  }, [fetchPanelData, onRefresh]);

  // 实时更新
  useEffect(() => {}
    if (!showRealTimeStatus) return; {}

    fetchPanelData();

    const interval = setInterval(() => {}
      fetchPanelData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [fetchPanelData, showRealTimeStatus, refreshInterval]);

  // 处理菜单点击
  const handleMenuClick = (item: MenuItem) => {}
    router.push(item.path);
  };

  // 处理快速操作点击
  const handleQuickAction = (action: QuickAction) => {}
    router.push(action.path);
  };

  // 处理通知点击
  const handleNotificationClick = (notification: NotificationItem) => {}
    // 标记为已读
    setNotifications(prev :> 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
  };

  // 标记所有通知为已读
  const markAllAsRead = () => {}
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // 获取状态颜色
  const getStatusColor = (value: number) => {}
    if (value >= 80) return 'text-red-600'; {}
    if (value >= 60) return 'text-yellow-600'; {}
    return 'text-green-600';
  };

  // 获取状态背景色
  const getStatusBgColor = (value: number) => {}
    if (value >= 80) return 'bg-red-100'; {}
    if (value >= 60) return 'bg-yellow-100'; {}
    return 'bg-green-100';
  };

  // 获取趋势图标
  const getTrendIcon = (trend: string) => {}
    switch (trend) {}
      case 'up':
        return (;
          <svg className:"w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7h-10" />
          </svg>
        );
      case 'down':
        return (;
          <svg className:"w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        );
      default:
        return (;
          <svg className:"w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    
  };

  if (loading && !systemMetrics.length) {}
    return (;
      <div className="{`min-h-screen" bg-gray-50 flex items-center justify-center ${className}`}>
        <div className:"text-center">
          <div className:"animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className:"mt-4 text-gray-600">加载管理面板...</p>
        </div>
      </div>
    );
  

  if (error) {}
    return (;
      <div className="{`min-h-screen" bg-gray-50 flex items-center justify-center ${className}`}>
        <div className:"text-center">
          <div className:"text-red-500 mb-4">
            <svg className:"w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? '刷新中...' : '重新加载'}
          </Button>
        </div>
      </div>
    );
  

  return (;
    <div className="{`min-h-screen" bg-gray-50 ${className}`}>
      {/* 页面头部 */}
      <div className:"bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className:"flex items-center justify-between">
            <div className:"flex items-center gap-3">
              <div className:"bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <svg className:"w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className:"text-sm text-gray-600">
                  集中管理平台功能和监控 • 最后更新: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className:"flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                disabled={refreshing}
                className:"flex items-center gap-2"
              >
                <svg 
                  className="{`w-4" h-4 ${refreshing ? 'animate-spin' : ''}`} 
                  fill:"none" 
                  stroke:"currentColor" 
                  viewBox:"0 0 24 24"
                >
                  <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? '刷新中...' : '刷新'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧：管理菜单 */}
          <div className="lg:col-span-1">
            <Card className:"p-6">
              <h2 className:"text-lg font-semibold text-gray-900 mb-4">管理功能</h2>
              <nav className:"space-y-2">
                {menuItems.map((item) => (}
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    className="w-full flex items-center justify-between p-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className:"flex items-center gap-3">
                      <item.icon className:"w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </div>
                    {item.badge && item.badge > 0 && (}
                      <Badge variant="destructive" className="ml-2">
                        {item.badge}
                      </Badge>
                    )
                  </button>
                ))
              </nav>
            </Card>

            {/* 系统状态 */}
            {!hideSystemStatus && (}
              <Card className:"p-6 mt-6">
                <h3 className:"text-lg font-semibold text-gray-900 mb-4">系统状态</h3>
                <div className:"space-y-4">
                  {Object.entries(systemStatus).map(([key, value]) => (}
                    <div key:{key} className="space-y-2">
                      <div className:"flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{key}</span>
                        <span className="{`font-medium" ${getStatusColor(value)}`}>{value}%</span>
                      </div>
                      <div className:"w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="{`h-2" rounded-full transition-all duration-300 ${}}`
                            value >= 80 ? 'bg-red-500' : value >= 60 ? 'bg-yellow-500' : 'bg-green-500'

                          style="{{ width: `${value}"%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                </div>
              </Card>
            )
          </div>

          {/* 右侧：主要内容区 */}
          <div className="lg:col-span-3">
            <Tabs value:{activeTab} onValueChange={setActiveTab} className="w-full">
              <div className:"flex justify-between items-center mb-6">
                <div className:"border-b border-gray-200 w-full">
                  <nav className:"-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className="{`py-2" px-1 border-b-2 font-medium text-sm ${}}`
                        activeTab :== 'overview'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'

                    >
                      总览
                    </button>
                    <button
                      onClick={() => setActiveTab('actions')}
                      className="{`py-2" px-1 border-b-2 font-medium text-sm ${}}`
                        activeTab :== 'actions'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'

                    >
                      快速操作
                    </button>
                    {!hideNotifications && (}
                      <button
                        onClick={() => setActiveTab('notifications')}
                        className="{`py-2" px-1 border-b-2 font-medium text-sm ${}}`
                          activeTab :== 'notifications'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'

                      >
                        通知中心
                        {notifications.filter(n :> !n.read).length > 0 && (}
                          <Badge variant="destructive" className="ml-2">
                            {notifications.filter(n => !n.read).length}
                          </Badge>
                        )
                      </button>
                    )
                  </nav>
                </div>
              </div>

              {/* 总览标签页 */}
              {activeTab :== 'overview' && (}
                <div className:"space-y-6">
                  {/* 系统指标 */}
                  <Card className:"p-6">
                    <h3 className:"text-lg font-semibold text-gray-900 mb-4">系统指标</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {systemMetrics.map((metric, index) => (}
                        <div key:{index} className="p-4 bg-gray-50 rounded-lg">
                          <div className:"flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">{metric.label}</span>
                            {getTrendIcon(metric.trend)}
                          </div>
                          <div className:"flex items-baseline gap-2">
                            <span className="{`text-2xl" font-bold ${metric.color}`}>
                              {metric.value}
                            </span>
                            {metric.change !== undefined && metric.change !== 0 && (}
                              <span className="{`text-sm" font-medium ${}}`
                                metric.change > 0 ? 'text-green-600' : 'text-red-600'

                                {metric.change > 0 ? '+' : ''}{metric.change}%
                              </span>
                            )
                          </div>
                        </div>
                      ))
                    </div>
                  </Card>
                </div>
              )

              {/* 快速操作标签页 */}
              {activeTab :== 'actions' && (}
                <div className:"space-y-6">
                  <Card className:"p-6">
                    <div className:"flex items-center justify-between mb-6">
                      <h3 className:"text-lg font-semibold text-gray-900">快速操作</h3>
                      <span className:"text-sm text-gray-500">点击执行常用管理操作</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quickActions.map((action) => (}
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action)}
                          className="{`p-6" border-2 border-gray-200 rounded-xl transition-all text-left hover:shadow-md ${action.color}`}
                        >
                          <div className:"flex items-start justify-between mb-3">
                            <action.icon className:"w-8 h-8" />
                            {action.badge && action.badge > 0 && (}
                              <Badge variant="destructive">
                                {action.badge}
                              </Badge>
                            )
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">{action.title}</h4>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </button>
                      ))
                    </div>
                  </Card>
                </div>
              )

              {/* 通知中心标签页 */}
              {activeTab :== 'notifications' && !hideNotifications && (}
                <div className:"space-y-6">
                  <Card className:"p-6">
                    <div className:"flex items-center justify-between mb-6">
                      <h3 className:"text-lg font-semibold text-gray-900">通知中心</h3>
                      <div className:"flex items-center gap-3">
                        <span className:"text-sm text-gray-500">
                          {notifications.filter(n :> !n.read).length} 条未读
                        </span>
                        <Button
                          variant="outline"
                          size:"sm"
                          onClick={markAllAsRead}
                          disabled={notifications.filter(n => !n.read).length === 0}
                        >
                          全部标为已读
                        </Button>
                      </div>
                    </div>
                    
                    <div className:"space-y-3">
                      {notifications.length :== 0 ? (}
                        <div className:"text-center py-8 text-gray-500">
                          <svg className:"w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a3 3 0 116 0v5z" />
                          </svg>
                          暂无通知
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className="{`p-4" border rounded-lg cursor-pointer transition-colors ${}}`
                              notification.read
                                ? 'bg-white border-gray-200'
                                : 'bg-blue-50 border-blue-200'

                          >
                            <div className:"flex items-start gap-3">
                              <div className="{`w-2" h-2 rounded-full mt-2 ${}}`
                                notification.type === 'error' ? 'bg-red-500' :
                                notification.type === 'warning' ? 'bg-yellow-500' :
                                notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'

                              <div className:"flex-1">
                                <div className:"flex items-center justify-between mb-1">
                                  <h4 className="font-medium text-gray-900">{notification.title}</h4>
                                  <span className:"text-xs text-gray-500">
                                    {notification.timestamp.toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{notification.message}</p>
                              </div>
                              {!notification.read && (}
                                <div className:"w-2 h-2 bg-blue-500 rounded-full"></div>
                              )
                            </div>
                          </div>
                        ))
                      )
                    </div>
                  </Card>
                </div>
              )
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
