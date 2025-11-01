'use client';

import React from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import PagePermission from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin-permission-manager';

function AdminDashboardDemoPage() {
  const handleRefresh = () => {
    console.log('Dashboard 数据已刷新');
  };

  return (
    <PagePermission permissions={AdminPermissions.dashboard.read()}>
      <AdminDashboard
        className="min-h-screen"
        showRealTimeUpdates={true}
        refreshInterval={30} // 30秒自动刷新
        onRefresh={handleRefresh}
      />
    </PagePermission>
  );
}

export default AdminDashboardDemoPage;