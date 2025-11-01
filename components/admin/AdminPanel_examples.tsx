// AdminPanel 使用示例
import React from 'react';
import { AdminPanel } from '@/components/admin';

// 示例1: 基础使用
export function BasicAdminPanel() {
  return (
    <div>
      <AdminPanel />
    </div>
  );
}

// 示例2: 自定义标题和配置
export function CustomAdminPanel() {
  return (
    <AdminPanel
      title="运营管理控制台"
      showRealTimeStatus={true}
      refreshInterval={60}
      hideSystemStatus={false}
      hideNotifications={false}
    />
  );
}

// 示例3: 自定义菜单项
export function CustomMenuAdminPanel() {
  const customMenuItems = [
    {
      id: 'custom-dashboard',
      title: '自定义仪表盘',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
      path: '/admin/custom-dashboard',
      badge: 3
    },
    {
      id: 'content-management',
      title: '内容管理',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      path: '/admin/content'
    }
  ];

  return (
    <AdminPanel
      customMenuItems={customMenuItems}
      title="内容管理控制台"
    />
  );
}

// 示例4: 自定义快速操作
export function CustomActionsAdminPanel() {
  const customQuickActions = [
    {
      id: 'bulk-operations',
      title: '批量操作',
      description: '执行批量数据处理',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      path: '/admin/bulk-operations',
      color: 'text-blue-600 hover:text-blue-700 hover:border-blue-500',
      badge: 12
    },
    {
      id: 'data-analysis',
      title: '数据分析',
      description: '深度数据分析报告',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      path: '/admin/analytics/advanced',
      color: 'text-green-600 hover:text-green-700 hover:border-green-500'
    }
  ];

  return (
    <AdminPanel
      customQuickActions={customQuickActions}
      title="数据分析控制台"
      hideSystemStatus={true}
    />
  );
}

// 示例5: 完全定制的管理面板
export function FullyCustomizedAdminPanel() {
  const customMenuItems = [
    {
      id: 'ecommerce',
      title: '电商管理',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      path: '/admin/ecommerce',
      children: [
        {
          id: 'products',
          title: '商品管理',
          icon: (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" />,
          path: '/admin/ecommerce/products'
        },
        {
          id: 'orders',
          title: '订单管理',
          icon: (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" />,
          path: '/admin/ecommerce/orders',
          badge: 45
        }
      ]
    },
    {
      id: 'marketing',
      title: '营销中心',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      path: '/admin/marketing'
    }
  ];

  const customQuickActions = [
    {
      id: 'promotion',
      title: '促销活动',
      description: '创建和管理促销活动',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      path: '/admin/marketing/promotions',
      color: 'text-purple-600 hover:text-purple-700 hover:border-purple-500'
    },
    {
      id: 'customer-service',
      title: '客服中心',
      description: '处理用户咨询和投诉',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      path: '/admin/customer-service',
      color: 'text-orange-600 hover:text-orange-700 hover:border-orange-500',
      badge: 8
    }
  ];

  return (
    <AdminPanel
      title="电商运营管理平台"
      customMenuItems={customMenuItems}
      customQuickActions={customQuickActions}
      showRealTimeStatus={true}
      refreshInterval={30}
      hideSystemStatus={false}
      hideNotifications={false}
    />
  );
}

// 示例6: 简化版本（只显示必要功能）
export function SimplifiedAdminPanel() {
  return (
    <AdminPanel
      title="简化管理面板"
      hideSystemStatus={true}
      hideNotifications={true}
      showRealTimeStatus={false}
    />
  );
}

// 在页面中使用
export default function AdminPanelExample() {
  return (
    <div className="admin-panel-examples">
      <h1>AdminPanel 组件使用示例</h1>
      
      <section>
        <h2>1. 基础使用</h2>
        <BasicAdminPanel />
      </section>

      <section>
        <h2>2. 自定义配置</h2>
        <CustomAdminPanel />
      </section>

      <section>
        <h2>3. 自定义菜单</h2>
        <CustomMenuAdminPanel />
      </section>

      <section>
        <h2>4. 自定义快速操作</h2>
        <CustomActionsAdminPanel />
      </section>

      <section>
        <h2>5. 完全定制</h2>
        <FullyCustomizedAdminPanel />
      </section>

      <section>
        <h2>6. 简化版本</h2>
        <SimplifiedAdminPanel />
      </section>
    </div>
  );
}