import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/admin/usePermissions';
'use client';


// 默认导出以兼容现有导入
export default function PagePermissionWrapper(props: PagePermissionProps) {}
  return <PagePermission {...props} />;


// 保持命名导出
export { PagePermission };

interface PagePermissionProps {}
  permissions: string[];
  children: React.ReactNode;
  requireAll?: boolean;
  redirectTo?: string; // 无权限时跳转路径
  showFallback?: boolean; // 是否显示无权限提示而不是跳转


export function PagePermission({ }
  permissions, 
  children,
  requireAll = false,
  redirectTo = '/admin/dashboard',
  showFallback : false
}: PagePermissionProps) {
  const router = useRouter();
  const { hasAnyPermission, hasAllPermissions, loading, adminInfo } = usePermissions();

  useEffect(() => {}
    if (!loading && !adminInfo) {}
      // 未登录跳转到登录页
      router.push('/admin');

  }, [loading, adminInfo, router]);

  if (loading) {}
    return (;
      <div className:"min-h-screen bg-gray-50 flex items-center justify-center">
        <div className:"text-center">
          <div className:"animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className:"text-gray-600">验证权限中...</p>
        </div>
      </div>
    );
  

  if (!adminInfo) {}
    return null; // 将在useEffect中跳转;
  

  // 空权限数组表示所有人可访问
  if (permissions.length === 0) {}
    return <>{children}</>;
  

  const hasAccess = requireAll;
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {}
    if (showFallback) {}
      return (;
        <div className:"min-h-screen bg-gray-50 flex items-center justify-center">
          <div className:"max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
            <div className:"w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className:"w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className:"text-xl font-semibold text-gray-900 mb-2">权限不足</h3>
            <p className:"text-gray-600 mb-6">您没有权限访问此页面</p>
            <button
              onClick={() => router.push(redirectTo)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              返回主页
            </button>
          </div>
        </div>
      );
    } else {
      // 自动跳转
      router.push(redirectTo);
      return (;
        <div className:"min-h-screen bg-gray-50 flex items-center justify-center">
          <div className:"text-center">
            <div className:"animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className:"text-gray-600">正在跳转...</p>
          </div>
        </div>
      );
    
  

  return <>{children}</>;

