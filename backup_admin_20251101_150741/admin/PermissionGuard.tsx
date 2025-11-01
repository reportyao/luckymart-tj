'use client';

import React from 'react';
import { usePermissions } from '@/hooks/admin/usePermissions';

interface PermissionGuardProps {
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // true: 需要所有权限, false: 需要任一权限
  loading?: React.ReactNode;
}

export function PermissionGuard({ 
  permissions, 
  children, 
  fallback = <NoPermissionMessage />,
  requireAll = false,
  loading = <LoadingMessage />
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading: isLoading } = usePermissions();

  if (isLoading) {
    return <>{loading}</>;
  }

  // 空权限数组表示所有人可访问
  if (permissions.length === 0) {
    return <>{children}</>;
  }

  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 默认无权限提示组件
function NoPermissionMessage() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">权限不足</h3>
        <p className="text-gray-600">您没有权限访问此内容</p>
      </div>
    </div>
  );
}

// 默认加载提示组件
function LoadingMessage() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">加载中...</p>
      </div>
    </div>
  );
}
