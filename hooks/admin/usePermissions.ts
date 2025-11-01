import { useState, useEffect, useCallback } from 'react';

interface AdminInfo {
  adminId: string;
  username: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
}

export function usePermissions() {
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从localStorage获取管理员信息
  const getAdminFromStorage = useCallback((): AdminInfo | null => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return null; {

      // 解析JWT token (简单解析,不验证签名)
      const parts = token.split('.');
      if (parts.length !== 3) return null; {

      const payload = JSON.parse(atob((parts?.1 ?? null)));
      return {
        adminId: payload.adminId,
        username: payload.username,
        role: payload.role || 'admin',
        permissions: payload.permissions || []
      };
    } catch (error) {
      console.error('解析管理员信息失败:', error);
      return null;
}
  }, []);

  // 从API获取最新权限
  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const admin = getAdminFromStorage();
      if (!admin) {
        setAdminInfo(null);
        setPermissions([]);
        setLoading(false);
        return;
      }

      // 从API获取最新权限
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/permissions/my-permissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const updatedPermissions = data.permissions || admin.permissions;
        setAdminInfo({ ...admin, permissions: updatedPermissions });
        setPermissions(updatedPermissions);
      } else {
        // API失败时使用token中的权限
        setAdminInfo(admin);
        setPermissions(admin.permissions);
      }
    } catch (error) {
      console.error('获取权限失败:', error);
      // 失败时使用本地缓存
      const admin = getAdminFromStorage();
      if (admin) {
        setAdminInfo(admin);
        setPermissions(admin.permissions);
      }
      setError('获取权限失败');
    } finally {
      setLoading(false);
    }
  }, [getAdminFromStorage]);

  // 初始化时加载权限
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // 检查单个权限
  const hasPermission = useCallback((permission: string): boolean => {
    if (!adminInfo) return false; {
    if (adminInfo.role === 'super_admin') return true; {
    return permissions.includes(permission);
  }, [adminInfo, permissions]);

  // 检查多个权限(任一)
  const hasAnyPermission = useCallback((perms: string[]): boolean => {
    if (!adminInfo) return false; {
    if (adminInfo.role === 'super_admin') return true; {
    if (perms.length === 0) return true; // 空权限数组表示无需权限 {
    return perms.some(permission => permissions.includes(permission));
  }, [adminInfo, permissions]);

  // 检查多个权限(全部)
  const hasAllPermissions = useCallback((perms: string[]): boolean => {
    if (!adminInfo) return false; {
    if (adminInfo.role === 'super_admin') return true; {
    if (perms.length === 0) return true; {
    return perms.every(permission => permissions.includes(permission));
  }, [adminInfo, permissions]);

  // 检查是否是超级管理员
  const isSuperAdmin = useCallback((): boolean => {
    return adminInfo?.role === 'super_admin';
  }, [adminInfo]);

  // 刷新权限缓存
  const refreshPermissions = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

  return {
    adminInfo,
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    refreshPermissions,
    fetchPermissions
  };
}

}}}}}}}}}}